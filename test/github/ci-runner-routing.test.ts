export {}

const fs = require('node:fs')
const path = require('node:path')
const yaml = require('js-yaml')
const workflow = yaml.load(fs.readFileSync(path.join(__dirname, '../../.github/workflows/ci.yml'), 'utf8'))
const requiredChecks = require('../../scripts/branch-protection.json').required_status_checks.contexts

describe('public repository CI runner policy', () => {
  function jobsNamed(name: string) {
    const files = ['ci.yml', 'dependency-review.yml']
    return files.flatMap((file) => {
      const doc = yaml.load(fs.readFileSync(path.join(__dirname, '../../.github/workflows', file), 'utf8'))
      return Object.values(doc.jobs)
    }).filter((job: any) => job.name === name) as any[]
  }

  test.each(requiredChecks)('%s runs directly on hosted infrastructure', (name: string) => {
    const jobs = jobsNamed(name)
    expect(jobs).toHaveLength(1)
    expect(jobs[0]['runs-on']).toBe('ubuntu-latest')
    expect(jobs[0].needs).toBeUndefined()
    expect(jobs[0].if).toBeUndefined()
  })

  test('all CI jobs stay hosted without PR-controlled runner selection', () => {
    const names = Object.values(workflow.jobs).map((job: any) => job.name)
    expect([...requiredChecks].sort()).toEqual([...names, 'Dependency Review'].sort())
    expect(requiredChecks).not.toContain('Security Audit')
    for (const job of Object.values(workflow.jobs) as any[]) {
      expect(job['runs-on']).toBe('ubuntu-latest')
    }
    expect(JSON.stringify(workflow)).not.toMatch(/OPTIPLEX_CI_ENABLED|optiplex-ci|runner-routing/)
  })

  test('all existing PR activities run the hosted checks', () => {
    expect(workflow.on.pull_request.branches).toEqual(['main'])
    expect(workflow.on.pull_request.types).toEqual(['opened', 'reopened', 'synchronize', 'ready_for_review'])
  })

  test('main pushes also remain hosted until external trust controls exist', () => {
    expect(workflow.on.push.branches).toEqual(['main'])
    for (const job of Object.values(workflow.jobs) as any[]) {
      expect(job['runs-on']).toBe('ubuntu-latest')
    }
  })

  test.each(['dependency-review.yml', 'dependabot-auto-merge.yml', 'dependency-audit-fix.yml'])('%s retains hosted execution for every job', (file: string) => {
    const hosted = yaml.load(fs.readFileSync(path.join(__dirname, '../../.github/workflows', file), 'utf8'))
    for (const job of Object.values(hosted.jobs) as any[]) {
      expect(job['runs-on']).toBe('ubuntu-latest')
    }
  })
})


describe('CI setup budget and browser-cache policy', () => {
  const limits: Record<string, number> = {
    'jest-tests': 10, 'playwright-tests': 15, typecheck: 10, build: 15,
  }

  test.each(Object.entries(limits))('%s has a bounded job and setup steps', (name, limit) => {
    const job = workflow.jobs[name]
    expect(Number.isInteger(job['timeout-minutes'])).toBe(true)
    expect(job['timeout-minutes']).toBeGreaterThan(0)
    expect(job['timeout-minutes']).toBeLessThanOrEqual(limit)
    for (const step of job.steps) {
      const action = step.uses || ''
      const command = step.run || ''
      let cap: number | undefined
      if (command.includes('pnpm install ') || command.includes('playwright install')) cap = 5
      else if (/^(pnpm\/action-setup|actions\/setup-node)@/.test(action)) cap = 3
      else if (action.startsWith('actions/cache@')) cap = 2
      if (cap !== undefined) {
        expect(Number.isInteger(step['timeout-minutes'])).toBe(true)
        expect(step['timeout-minutes']).toBeGreaterThan(0)
        expect(step['timeout-minutes']).toBeLessThanOrEqual(cap)
        expect(step['continue-on-error']).not.toBe(true)
      }
      if (command.includes('pnpm install ')) {
        expect(command).toBe('pnpm install --frozen-lockfile --prefer-offline')
      }
    }
  })

  test('playwright runs in the official image that matches the locked browser build', () => {
    const lock = yaml.load(fs.readFileSync(path.join(__dirname, '../../pnpm-lock.yaml'), 'utf8'))
    const version = lock.importers['.'].devDependencies['@playwright/test'].version
    expect(version).toMatch(/^\d+\.\d+\.\d+$/)
    const job = workflow.jobs['playwright-tests']
    // Firefox and WebKit system libraries on ubuntu 26.04 are the GStreamer
    // and ffmpeg stack. The runner apt mirror stalls while fetching them, so
    // the job uses the image that already contains that stack and the browsers.
    expect(job.container.image).toBe(`mcr.microsoft.com/playwright:v${version}-noble`)
    expect(job.container.options).toBe('--user 1001 --shm-size=2g')
    const commands = job.steps.map((step: any) => step.run || '').join('\n')
    expect(commands).not.toContain('playwright install')
    expect(job.steps.some((step: any) => step.with?.path === '~/.cache/ms-playwright')).toBe(false)
    const projects = fs.readFileSync(path.join(__dirname, '../../playwright.config.ts'), 'utf8')
    for (const name of ['chromium', 'firefox', 'webkit', 'Mobile Chrome', 'Mobile Safari']) {
      expect(projects).toContain(`name: '${name}'`)
    }
  })
})

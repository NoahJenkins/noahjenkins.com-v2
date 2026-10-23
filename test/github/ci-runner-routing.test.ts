export {}

const fs = require('node:fs')
const path = require('node:path')
const yaml = require('js-yaml')
const workflow = yaml.load(fs.readFileSync(path.join(__dirname, '../../.github/workflows/ci.yml'), 'utf8'))
const requiredChecks = require('../../scripts/branch-protection.json').required_status_checks.contexts

describe('public repository CI runner policy', () => {
  test.each(requiredChecks)('%s runs directly on hosted infrastructure', (name: string) => {
    const jobs = Object.values(workflow.jobs).filter((job: any) => job.name === name) as any[]
    expect(jobs).toHaveLength(1)
    expect(jobs[0]['runs-on']).toBe('ubuntu-latest')
    expect(jobs[0].needs).toBeUndefined()
    expect(jobs[0].if).toBeUndefined()
  })

  test('all CI jobs stay hosted without PR-controlled runner selection', () => {
    expect(Object.values(workflow.jobs).map((job: any) => job.name).sort()).toEqual([...requiredChecks].sort())
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

  test.each(['dependency-review.yml', 'dependabot-auto-merge.yml'])('%s retains hosted execution for every job', (file: string) => {
    const hosted = yaml.load(fs.readFileSync(path.join(__dirname, '../../.github/workflows', file), 'utf8'))
    for (const job of Object.values(hosted.jobs) as any[]) {
      expect(job['runs-on']).toBe('ubuntu-latest')
    }
  })
})


describe('CI setup budget and browser-cache policy', () => {
  const limits: Record<string, number> = {
    'security-audit': 10, 'jest-tests': 10, 'playwright-tests': 15, typecheck: 10, build: 15,
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

  test('browser cache uses exact OS, architecture, and lockfile identity', () => {
    const steps = workflow.jobs['playwright-tests'].steps
    const cache = steps.find((step: any) => step.id === 'playwright-cache')
    expect(cache.with.path).toBe('~/.cache/ms-playwright')
    expect(cache.with.key).toBe("${{ runner.os }}-${{ runner.arch }}-playwright-${{ hashFiles('pnpm-lock.yaml') }}")
    expect(cache.with['restore-keys']).toBeUndefined()
    const system = steps.find((step: any) => step.run === 'pnpm exec playwright install-deps')
    expect(system.if).toBeUndefined()
    const browsers = steps.find((step: any) => step.run === 'pnpm exec playwright install')
    expect(browsers.if).toBe("steps.playwright-cache.outputs.cache-hit != 'true'")
  })
})

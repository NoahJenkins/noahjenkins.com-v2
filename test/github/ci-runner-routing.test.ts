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

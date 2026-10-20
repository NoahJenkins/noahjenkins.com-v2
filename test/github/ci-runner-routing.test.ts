export {}

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const yaml = require('js-yaml')
const workflow = yaml.load(fs.readFileSync(path.join(__dirname, '../../.github/workflows/ci.yml'), 'utf8'))
const routingJob = workflow.jobs['runner-routing']
const routingStep = routingJob.steps.find((step: { id?: string }) => step.id === 'select')
const requiredChecks = require('../../scripts/branch-protection.json').required_status_checks.contexts
const repository = 'NoahJenkins/noahjenkins.com-v2'

function selectRunner(flag: string | undefined, event: string, head = repository, actor = 'contributor') {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-routing-'))
  const output = path.join(directory, 'output')
  try {
    const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', routingStep.run], {
      encoding: 'utf8',
      env: {
        PATH: process.env.PATH,
        GITHUB_OUTPUT: output,
        OPTIPLEX_CI_ENABLED: flag ?? '',
        EVENT_NAME: event,
        HEAD_REPOSITORY: head,
        CURRENT_REPOSITORY: repository,
        GITHUB_ACTOR: actor,
      },
    })
    expect(result.error).toBeUndefined()
    expect(result.stderr).toBe('')
    expect(result.status).toBe(0)
    return Object.fromEntries(fs.readFileSync(output, 'utf8').trim().split('\n').map((line: string) => line.split('=')))
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
}

// Resolve the actual job's output reference, rather than comparing copied YAML.
function jobRunner(job: { 'runs-on': string; needs: string | string[] }, outputs: Record<string, string>) {
  const reference = /^\$\{\{\s*needs\.([\w-]+)\.outputs\.([\w-]+)\s*\|\|\s*'([^']+)'\s*\}\}$/.exec(job['runs-on'])
  expect(reference).not.toBeNull()
  const [, dependency, key, fallback] = reference!
  expect([job.needs].flat()).toContain(dependency)
  expect(workflow.jobs[dependency]).toBe(routingJob)
  expect(routingJob.outputs[key]).toMatch(/^\$\{\{\s*steps\.select\.outputs\.runner\s*\}\}$/)
  expect(fallback).toBe('ubuntu-latest')
  return outputs[key] || fallback
}

describe('CI runner routing from the executable workflow policy', () => {
  test('routing itself stays hosted and never checks out PR code', () => {
    expect(routingJob['runs-on']).toBe('ubuntu-latest')
    expect(routingJob.steps).toHaveLength(1)
    expect(routingStep.uses).toBeUndefined()
    expect(routingStep.shell).toBe('bash')
    expect(routingStep.env).toEqual({
      OPTIPLEX_CI_ENABLED: '${{ vars.OPTIPLEX_CI_ENABLED }}',
      EVENT_NAME: '${{ github.event_name }}',
      HEAD_REPOSITORY: '${{ github.event.pull_request.head.repo.full_name }}',
      CURRENT_REPOSITORY: '${{ github.repository }}',
    })
  })

  test.each([
    ['true', 'push', '', 'contributor', 'optiplex-ci-ubuntu24'],
    ['true', 'pull_request', repository, 'contributor', 'optiplex-ci-ubuntu24'],
    ['true', 'pull_request', repository, 'dependabot[bot]', 'optiplex-ci-ubuntu24'],
    ['false', 'pull_request', repository, 'contributor', 'ubuntu-latest'],
    [undefined, 'pull_request', repository, 'contributor', 'ubuntu-latest'],
    ['true', 'pull_request', 'contributor/fork', 'contributor', 'ubuntu-latest'],
    ['true', 'pull_request', 'contributor/fork', 'dependabot[bot]', 'ubuntu-latest'],
    ['true', 'pull_request', '', 'contributor', 'ubuntu-latest'],
    ['true', 'workflow_dispatch', repository, 'contributor', 'ubuntu-latest'],
    ['true', 'pull_request_target', repository, 'contributor', 'ubuntu-latest'],
  ])('flag=%s event=%s head=%s actor=%s routes every required check to %s', (flag, event, head, actor, expected) => {
    const outputs = selectRunner(flag, event!, head, actor)
    const jobs = Object.values(workflow.jobs).filter((job: any) => job.name !== routingJob.name) as any[]
    expect(jobs.map(job => job.name).sort()).toEqual([...requiredChecks].sort())
    for (const job of jobs) {
      expect(job.if).toBe('${{ always() }}')
      expect(jobRunner(job, outputs)).toBe(expected)
    }
  })

  test.each(['success', 'failure', 'cancelled', 'skipped', ''])('routing result %j cannot skip a protected check', result => {
    for (const job of Object.values(workflow.jobs).filter((job: any) => requiredChecks.includes(job.name)) as any[]) {
      expect(job.if).toBe('${{ always() }}')
      expect(jobRunner(job, {})).toBe('ubuntu-latest')
      const guard = job.steps[0]
      expect(guard.name).toBe('Require successful runner routing')
      expect(guard.uses).toBeUndefined()
      expect(guard.if).toBe('${{ always() }}')
      expect(guard['continue-on-error']).toBeUndefined()
      expect(guard.env).toEqual({ ROUTING_RESULT: '${{ needs.runner-routing.result }}' })
      const execution = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', guard.run], {
        encoding: 'utf8', env: { PATH: process.env.PATH, ROUTING_RESULT: result },
      })
      expect(execution.error).toBeUndefined()
      expect(execution.status).toBe(result === 'success' ? 0 : 1)
    }
  })

  test.each(['', 'TRUE', 'True', 'tRuE', '1', 'yes', ' true', 'true ', 'true\n', 'false'])('nonliteral opt-in %j keeps pushes hosted', flag => {
    expect(selectRunner(flag, 'push').runner).toBe('ubuntu-latest')
  })

  test('all existing PR activities still run all required checks', () => {
    expect(workflow.on.pull_request.branches).toContain('main')
    expect(workflow.on.pull_request.types).toEqual(['opened', 'reopened', 'synchronize', 'ready_for_review'])
  })

  test.each(['dependency-review.yml', 'dependabot-auto-merge.yml'])('%s retains hosted execution for every job', file => {
    const hosted = yaml.load(fs.readFileSync(path.join(__dirname, '../../.github/workflows', file), 'utf8'))
    for (const job of Object.values(hosted.jobs) as any[]) {
      expect(job['runs-on']).toBe('ubuntu-latest')
    }
  })
})

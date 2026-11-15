export {}

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const yaml = require('js-yaml')

const workflowPath = path.join(__dirname, '../../.github/workflows/dependabot-auto-merge.yml')
const dependabotPath = path.join(__dirname, '../../.github/dependabot.yml')

function load(file: string) {
  return yaml.load(fs.readFileSync(file, 'utf8'))
}

function writeFakeGh(directory: string) {
  const log = path.join(directory, 'gh.log')
  const bin = path.join(directory, 'bin')
  fs.mkdirSync(bin)
  fs.writeFileSync(path.join(bin, 'gh'), `#!/bin/bash
printf '%s\\n' "$*" >> "$GH_LOG"
if [ "$1" = "pr" ] && [ "$2" = "merge" ]; then
  if [ "\${GH_MERGE_FAIL:-}" = "1" ]; then exit 1; fi
  exit 0
fi
if [ "$1" = "pr" ] && [ "$2" = "view" ]; then
  printf '%s\\n' "\${GH_MERGE_METHOD:-}"
  exit 0
fi
if [ "$1" = "pr" ] && [ "$2" = "edit" ]; then
  if [ "\${GH_LABEL_FAIL:-}" = "1" ]; then exit 1; fi
  exit 0
fi
if [ "$1" = "api" ]; then
  printf '%s\\n' "\${GH_EXISTING_ISSUE:-}"
  exit 0
fi
if [ "$1" = "issue" ]; then
  exit 0
fi
echo "unexpected gh: $*" >&2
exit 1
`, { mode: 0o755 })
  return { bin, log }
}

describe('Dependabot auto-merge workflow', () => {
  const workflow = load(workflowPath)
  const step = workflow.jobs.automerge.steps.find((item: any) => item.name === 'Enable auto-merge for patch, minor, Actions, and security updates')

  test('enables squash auto-merge only for Dependabot, without checking out or approving', () => {
    expect(workflow.on).toEqual({
      pull_request: {
        branches: ['main'],
        types: ['opened', 'reopened', 'synchronize', 'ready_for_review'],
      },
    })
    expect(workflow.permissions).toEqual({ contents: 'write', 'pull-requests': 'write' })
    expect(workflow.concurrency.group).toBe('dependabot-auto-merge-${{ github.event.pull_request.number }}')
    expect(workflow.concurrency['cancel-in-progress']).toBe(true)
    const job = workflow.jobs.automerge
    expect(job.name).toBe('Dependabot auto-merge')
    expect(job.if).toContain("github.event.pull_request.user.login == 'dependabot[bot]'")
    expect(job.if).toContain('github.event.pull_request.draft == false')
    expect(job['runs-on']).toBe('ubuntu-latest')
    expect(job['timeout-minutes']).toBe(5)
    expect(JSON.stringify(workflow)).not.toMatch(/actions\/checkout@|gh pr review|pull_request_target/)
    // Action versions are deliberately not asserted: Dependabot bumps them.
    const metadata = job.steps.find((item: any) => item.id === 'meta')
    expect(metadata.uses).toMatch(/^dependabot\/fetch-metadata@[0-9a-f]{40}$/)
    expect(metadata.with?.['alert-lookup']).toBeUndefined()
  })

  test('keeps the security-group names used by dependabot.yml', () => {
    const config = load(dependabotPath)
    const groups = config.updates.flatMap((update: any) => Object.entries(update.groups || {}))
      .filter(([, group]: any) => group['applies-to'] === 'security-updates')
      .map(([name]: [string, unknown]) => name)
    expect(groups).toEqual(['npm-security', 'github-actions-security'])
    for (const name of groups) expect(step.run).toContain(name)
  })

  function runDecision(env: Record<string, string>) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dependabot-automerge-'))
    const { bin, log } = writeFakeGh(directory)
    const result = spawnSync('bash', ['-euo', 'pipefail', '-c', step.run], {
      encoding: 'utf8',
      env: {
        PATH: `${bin}:${process.env.PATH}`,
        GH_LOG: log,
        PR_URL: 'https://github.com/example/repo/pull/1',
        ...env,
      },
    })
    const calls = fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : ''
    fs.rmSync(directory, { recursive: true, force: true })
    return { result, calls }
  }

  test.each([
    ['version-update:semver-patch', 'npm_and_yarn', 'npm-routine'],
    ['version-update:semver-minor', 'npm_and_yarn', 'npm-routine'],
    ['version-update:semver-major', 'github_actions', 'github-actions-routine'],
    ['version-update:semver-major', 'github-actions', ''],
    ['version-update:semver-major', 'npm_and_yarn', 'npm-security'],
    ['version-update:semver-major', 'npm_and_yarn', 'github-actions-security'],
  ])('enables auto-merge for %s %s %s', (updateType, ecosystem, group) => {
    const { result, calls } = runDecision({ UPDATE_TYPE: updateType, ECOSYSTEM: ecosystem, DEPENDENCY_GROUP: group })
    expect(result.status).toBe(0)
    expect(calls).toContain('pr merge --auto --squash')
    expect(calls).not.toContain('needs-review')
  })

  test('enables auto-merge for an open GHSA even when the bump is major', () => {
    const { result, calls } = runDecision({
      UPDATE_TYPE: 'version-update:semver-major',
      ECOSYSTEM: 'npm_and_yarn',
      GHSA_ID: 'GHSA-xxxx-yyyy-zzzz',
      ALERT_STATE: 'OPEN',
    })
    expect(result.status).toBe(0)
    expect(calls).toContain('pr merge --auto --squash')
  })

  test('leaves a dismissed advisory major for review', () => {
    const { result, calls } = runDecision({
      UPDATE_TYPE: 'version-update:semver-major',
      ECOSYSTEM: 'npm_and_yarn',
      GHSA_ID: 'GHSA-xxxx-yyyy-zzzz',
      ALERT_STATE: 'DISMISSED',
    })
    expect(result.status).toBe(0)
    expect(calls).toContain('pr edit')
    expect(calls).toContain('needs-review')
    expect(calls).not.toContain('pr merge')
  })

  test('leaves an npm major for review and still succeeds if the label cannot be added', () => {
    const { result, calls } = runDecision({
      UPDATE_TYPE: 'version-update:semver-major',
      ECOSYSTEM: 'npm_and_yarn',
      GH_LABEL_FAIL: '1',
    })
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('::warning::Could not add needs-review label')
    expect(calls).not.toContain('pr merge')
  })

  test('accepts an already enabled squash auto-merge', () => {
    const { result } = runDecision({
      UPDATE_TYPE: 'version-update:semver-patch',
      ECOSYSTEM: 'npm_and_yarn',
      GH_MERGE_FAIL: '1',
      GH_MERGE_METHOD: 'SQUASH',
    })
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Squash auto-merge is already enabled.')
  })

  test('fails when auto-merge cannot be enabled', () => {
    const { result } = runDecision({
      UPDATE_TYPE: 'version-update:semver-minor',
      ECOSYSTEM: 'npm_and_yarn',
      GH_MERGE_FAIL: '1',
      GH_MERGE_METHOD: '',
    })
    expect(result.status).toBe(1)
    expect(result.stdout).toContain('::error::Unable to enable squash auto-merge.')
  })
})

const { readFileSync } = require('node:fs')
const { join } = require('node:path')

const {
  REQUIRED_CHECKS,
  evaluateDependabotPolicy,
  isStaleHead,
  shouldBlockExistingApproval,
} = require('../../.github/scripts/dependabot-auto-merge-policy.cjs')

const successfulChecks = REQUIRED_CHECKS.map((name: string) => ({
  name,
  conclusion: 'success',
}))

const npmInput = {
  triggeringActor: 'dependabot[bot]',
  author: 'dependabot[bot]',
  baseRef: 'main',
  draft: false,
  state: 'open',
  headRef: 'dependabot/npm_and_yarn/npm-routine-1234567890',
  headSha: 'abc123',
  workflowHeadSha: 'abc123',
  workflowConclusion: 'success',
  mergeableState: 'clean',
  checks: successfulChecks,
  changedFiles: ['package.json', 'pnpm-lock.yaml'],
}

describe('Dependabot native auto-merge policy', () => {
  test('cancels an in-progress evaluator when a Dependabot PR changes', () => {
    const workflow = readFileSync(
      join(process.cwd(), '.github/workflows/dependabot-auto-merge.yml'),
      'utf8',
    )

    expect(workflow).toContain('pull_request_target:')
    expect(workflow).not.toMatch(/\n  pull_request:\n/)
    expect(workflow).toContain('cancel-in-progress: true')
    expect(workflow).toContain('github.event.workflow_run.head_branch')
    expect(workflow).toContain('github.event.pull_request.head.ref')
    expect(workflow).toContain("github.event_name == 'workflow_run'")
  })

  test('identifies a workflow run that no longer owns the current PR head', () => {
    expect(
      isStaleHead({
        currentHeadSha: 'new-head',
        validatedHeadSha: 'old-head',
      }),
    ).toBe(true)
    expect(
      isStaleHead({
        currentHeadSha: 'same-head',
        validatedHeadSha: 'same-head',
      }),
    ).toBe(false)
  })

  test('ignores a stale CI run instead of blocking the current PR head', () => {
    expect(
      evaluateDependabotPolicy({
        ...npmInput,
        workflowHeadSha: 'old-head',
      }),
    ).toEqual(
      expect.objectContaining({
        status: 'ignored',
        shouldEnableAutoMerge: false,
        shouldClose: false,
        reason: expect.stringContaining('stale'),
      }),
    )
  })

  test('allows native auto-merge to queue when an approved PR is behind main', () => {
    expect(
      shouldBlockExistingApproval({
        approvalCount: 1,
        mergeableState: 'behind',
      }),
    ).toBe(false)
  })

  test('blocks native auto-merge when an approval makes the PR immediately mergeable', () => {
    expect(
      shouldBlockExistingApproval({
        approvalCount: 1,
        mergeableState: 'clean',
      }),
    ).toBe(true)
  })

  test.each(['unstable', 'has_hooks'])(
    'treats approved GitHub mergeable state %s as immediately mergeable',
    (mergeableState) => {
      expect(
        shouldBlockExistingApproval({
          approvalCount: 1,
          mergeableState,
        }),
      ).toBe(true)
    },
  )

  test('enables native auto-merge before approval can release the final branch gate', () => {
    const workflow = readFileSync(
      join(process.cwd(), '.github/workflows/dependabot-auto-merge.yml'),
      'utf8',
    )

    expect(workflow.indexOf('enablePullRequestAutoMerge')).toBeGreaterThan(-1)
    expect(workflow.indexOf('createReview')).toBeGreaterThan(
      workflow.indexOf('enablePullRequestAutoMerge'),
    )
  })

  test('checks for an existing approval before enabling native auto-merge', () => {
    const workflow = readFileSync(
      join(process.cwd(), '.github/workflows/dependabot-auto-merge.yml'),
      'utf8',
    )

    expect(
      workflow.indexOf('const currentApprovals = await getCurrentApprovals()'),
    ).toBeGreaterThan(-1)
    expect(
      workflow.indexOf('const currentApprovals = await getCurrentApprovals()'),
    ).toBeLessThan(
      workflow.indexOf('enablePullRequestAutoMerge'),
    )
  })

  test('enables native squash auto-merge for a grouped routine npm update', () => {
    expect(evaluateDependabotPolicy(npmInput)).toEqual(
      expect.objectContaining({
        status: 'ready',
        ecosystem: 'npm',
        mergeMethod: 'SQUASH',
        shouldEnableAutoMerge: true,
        shouldClose: false,
      }),
    )
  })

  test('enables native squash auto-merge for an immediate grouped security update', () => {
    expect(
      evaluateDependabotPolicy({
        ...npmInput,
        headRef: 'dependabot/npm_and_yarn/npm-security-1234567890',
      }),
    ).toEqual(
      expect.objectContaining({
        status: 'ready',
        ecosystem: 'npm',
        shouldEnableAutoMerge: true,
        shouldClose: false,
      }),
    )
  })

  test('enables native squash auto-merge for a green standalone npm major', () => {
    expect(
      evaluateDependabotPolicy({
        ...npmInput,
        headRef: 'dependabot/npm_and_yarn/framer-motion-13.1.1',
      }),
    ).toEqual(
      expect.objectContaining({
        status: 'ready',
        ecosystem: 'npm',
        shouldEnableAutoMerge: true,
        shouldClose: false,
      }),
    )
  })

  test('keeps a failed npm major open as an automation-blocked exception', () => {
    const failedChecks = successfulChecks.map((check: { name: string }) =>
      check.name === 'Security Audit'
        ? { ...check, conclusion: 'failure' }
        : check,
    )

    expect(
      evaluateDependabotPolicy({
        ...npmInput,
        headRef: 'dependabot/npm_and_yarn/framer-motion-13.1.1',
        workflowConclusion: 'failure',
        checks: failedChecks,
      }),
    ).toEqual(
      expect.objectContaining({
        status: 'blocked',
        shouldEnableAutoMerge: false,
        shouldClose: false,
        reason: expect.stringContaining('Security Audit=failure'),
      }),
    )
  })

  test('blocks a Dependabot PR that changes a file outside its ecosystem scope', () => {
    expect(
      evaluateDependabotPolicy({
        ...npmInput,
        changedFiles: ['package.json', 'app/page.tsx'],
      }),
    ).toEqual(
      expect.objectContaining({
        status: 'blocked',
        shouldEnableAutoMerge: false,
        shouldClose: false,
        reason: expect.stringContaining('app/page.tsx'),
      }),
    )
  })

  test('keeps a conflicting update open as an automation-blocked exception', () => {
    expect(
      evaluateDependabotPolicy({
        ...npmInput,
        mergeableState: 'dirty',
      }),
    ).toEqual(
      expect.objectContaining({
        status: 'blocked',
        shouldEnableAutoMerge: false,
        shouldClose: false,
        reason: expect.stringContaining('merge conflict'),
      }),
    )
  })

  test('enables native squash auto-merge for a grouped GitHub Actions patch or minor update', () => {
    expect(
      evaluateDependabotPolicy({
        ...npmInput,
        headRef:
          'dependabot/github_actions/github-actions-routine-1234567890',
        changedFiles: ['.github/workflows/ci.yml'],
      }),
    ).toEqual(
      expect.objectContaining({
        status: 'ready',
        ecosystem: 'github-actions',
        shouldEnableAutoMerge: true,
        shouldClose: false,
      }),
    )
  })

  test('blocks a standalone GitHub Actions major without closing it', () => {
    expect(
      evaluateDependabotPolicy({
        ...npmInput,
        headRef: 'dependabot/github_actions/actions-checkout-7.0.1',
        changedFiles: ['.github/workflows/ci.yml'],
      }),
    ).toEqual(
      expect.objectContaining({
        status: 'blocked',
        shouldEnableAutoMerge: false,
        shouldClose: false,
        reason: expect.stringContaining('grouped patch/minor or security'),
      }),
    )
  })

  test('does not treat a dependency branch that contains a group name as grouped', () => {
    expect(
      evaluateDependabotPolicy({
        ...npmInput,
        headRef:
          'dependabot/github_actions/github-actions-routine-evil/action-9.0.0',
        changedFiles: ['.github/workflows/ci.yml'],
      }),
    ).toEqual(
      expect.objectContaining({
        status: 'blocked',
        shouldEnableAutoMerge: false,
        shouldClose: false,
      }),
    )
  })

  test('ignores a PR whose author is not Dependabot', () => {
    expect(
      evaluateDependabotPolicy({
        ...npmInput,
        author: 'NoahJenkins',
      }),
    ).toEqual(
      expect.objectContaining({
        status: 'ignored',
        shouldEnableAutoMerge: false,
        shouldClose: false,
        reason: expect.stringContaining('author'),
      }),
    )
  })
})

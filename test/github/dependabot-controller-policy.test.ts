export {}
const { evaluateScope, evaluateCandidate } = require('../../.github/scripts/dependabot-controller-policy.cjs')

const sha = 'a'.repeat(40)
const base = 'b'.repeat(40)
const pr = { id: 42, number: 281, state: 'open', draft: false, user: { id: 49699333, type: 'Bot' }, base: { ref: 'main', sha: base, repo: { id: 1 } }, head: { ref: 'dependabot/github_actions/actions/setup-node-7.1.0', sha, repo: { id: 1 } }, mergeable: true, mergeable_state: 'clean' }
const names = ['Security Audit', 'Jest Tests', 'Playwright Tests', 'TypeScript Check', 'Build Check']
const good = () => ({ pr, repositoryId: 1, mainSha: base, containsMain: true, scope: { allowed: true }, ci: { head_sha: sha, workflow_id: 8, head_branch: pr.head.ref, head_repository: { id: 1 }, event: 'pull_request', status: 'completed', conclusion: 'success', pull_requests: [{ number: 281, base: { sha: base } }] }, ciWorkflowId: 8, jobs: names.map((name, i) => ({ name, conclusion: 'success', status: 'completed', check_run_url: `https://api.github.com/repos/o/r/check-runs/${i+1}` })), checks: names.map((name, i) => ({ id: i+1, name, head_sha: sha, app: { id: 15368 }, status: 'completed', conclusion: 'success' })), statuses: [{ context: 'Vercel', state: 'success', creator: { id: 35613825 }, target_url: 'https://vercel.com/noahs-projects-e38437a2/noahjenkins-com/abc' }], vercelAppId: 8329, vercelChecks: [{ app: { id: 8329 }, head_sha: sha }], independentReview: { task: {head:sha,base}, passed:true, report:{verdict:'approve'} } })

describe('reviewed Dependabot policy', () => {
  test('allows an Actions major refreshed by a human', () => {
    expect(evaluateCandidate({ ...good(), triggeringActor: 'NoahJenkins' })).toEqual({ kind: 'ready', reason: 'Current-head validation and independent review passed.' })
  })
  test.each([{ user: { id: 2, type: 'User' } }, { head: { ...pr.head, repo: { id: 2 } } }, { base: { ...pr.base, ref: 'other' } }])('rejects foreign identity or repository', (change) => {
    expect(evaluateCandidate({ ...good(), pr: { ...pr, ...change } }).kind).toBe('blocked')
  })
  test('waits for refresh when main advanced', () => {
    expect(evaluateCandidate({ ...good(), containsMain: false }).kind).toBe('refresh')
  })
  test('requires authentic exact-head and base evidence', () => {
    expect(evaluateCandidate({ ...good(), independentReview: null }).kind).toBe('review')
    expect(evaluateCandidate({ ...good(), independentReview: { ...good().independentReview, task:{head:base,base} } }).kind).toBe('review')
    expect(evaluateCandidate({ ...good(), independentReview: { ...good().independentReview, passed:false, report:{verdict:'request_changes'} } }).kind).toBe('repair')
    expect(evaluateCandidate({ ...good(), independentReview: { ...good().independentReview, passed:false, report:{verdict:'blocked'} } }).kind).toBe('blocked')
  })
  test.each(['queued', 'waiting', 'action_required'])('does not spend repair budget on %s CI', (status) => {
    expect(evaluateCandidate({ ...good(), ci: { ...good().ci, status } }).kind).toBe('waiting')
  })
  test('dispatches repair for an actual failed audit', () => {
    const input = good(); input.ci.conclusion = 'failure'; input.jobs[0].conclusion = 'failure'; input.checks[0].conclusion = 'failure'
    expect(evaluateCandidate(input).kind).toBe('repair')
  })
  test('rejects forged job names from a different workflow', () => {
    expect(evaluateCandidate({ ...good(), ci: { ...good().ci, workflow_id: 9 } }).kind).toBe('waiting')
  })
  test('rejects a check not belonging to the CI job', () => {
    const input = good(); input.checks[0].id = 999
    expect(evaluateCandidate(input).kind).toBe('waiting')
  })
  test('rejects old-base CI', () => {
    expect(evaluateCandidate({ ...good(), ci: { ...good().ci, pull_requests: [{ number: 281, base: { sha: 'old' } }] } }).kind).toBe('waiting')
  })
  test('waits for the actual Vercel deployment status', () => {
    expect(evaluateCandidate({ ...good(), statuses: [] }).kind).toBe('waiting')
  })
  test('does not accept a forged Vercel status', () => {
    const input = good(); input.statuses[0].creator.id = 2
    expect(evaluateCandidate(input).kind).toBe('waiting')
  })
  test('requires the configured project in the Vercel link', () => {
    const input = good(); input.statuses[0].target_url = 'https://vercel.com/other/project/abc'
    expect(evaluateCandidate(input).kind).toBe('waiting')
  })
  test('does not treat an unclassified preview failure as a code repair', () => {
    const input = good(); input.statuses[0].state = 'failure'
    expect(evaluateCandidate(input).kind).toBe('blocked')
  })
})

describe('repair scope', () => {
  const change = (filename: string, before: string, after: string, status = 'modified') => ({ filename, before, after, status })
  test('permits dependency changes but freezes install and verification scripts', () => {
    const before = JSON.stringify({ scripts: { test: 'jest' }, dependencies: { next: '^16.3.8' } })
    expect(evaluateScope([change('package.json', before, JSON.stringify({ scripts: { test: 'jest' }, dependencies: { next: '^16.4.0' } }))]).allowed).toBe(true)
    expect(evaluateScope([change('package.json', before, JSON.stringify({ scripts: { test: 'echo passed' }, dependencies: { next: '^16.4.0' } }))]).allowed).toBe(false)
  })
  test('rejects URL/file dependencies', () => {
    expect(evaluateScope([change('package.json', '{}', '{"dependencies":{"x":"file:./evil"}}')]).allowed).toBe(false)
  })
  test('permits overrides without changing pnpm install policy', () => {
    expect(evaluateScope([change('pnpm-workspace.yaml', 'packages: []\n\noverrides:\n  sharp: "0.35.5"\n', 'packages: []\n\noverrides:\n  sharp: "0.35.6"\n')]).allowed).toBe(true)
    expect(evaluateScope([change('pnpm-workspace.yaml', 'packages: []\n', 'packages: []\nonlyBuiltDependencies: [evil]\n')]).allowed).toBe(false)
  })
  test('permits only pinned upstream Action version changes', () => {
    const before = `steps:\n  - uses: actions/setup-node@${'c'.repeat(40)} # v4\n    with:\n      node-version: '24'\n  - run: pnpm test\n`
    expect(evaluateScope([change('.github/workflows/ci.yml', before, before.replace('c'.repeat(40), 'd'.repeat(40)).replace('# v4', '# v7'))]).allowed).toBe(true)
    expect(evaluateScope([change('.github/workflows/ci.yml', before, before.replace('pnpm test', 'echo success'))]).allowed).toBe(false)
    expect(evaluateScope([change('.github/workflows/ci.yml', before, before.replace('actions/setup-node', 'attacker/setup-node'))]).allowed).toBe(false)
  })
  test('does not let whitespace normalization hide a new YAML line', () => {
    const before = `  - uses: actions/setup-node@${'c'.repeat(40)} # v4\n`
    expect(evaluateScope([change('.github/workflows/ci.yml', before, `${before}    # v7\n    run: echo success\n`)]).allowed).toBe(false)
  })
  test('allows only Action pins in the privileged controller workflow', () => {
    const before = `steps:\n  - uses: actions/setup-node@${'c'.repeat(40)} # v4\n    with:\n      node-version: '24'\n`
    expect(evaluateScope([change('.github/workflows/dependabot-auto-merge.yml', before, before.replace('c'.repeat(40), 'd'.repeat(40)).replace('# v4', '# v7'))]).allowed).toBe(true)
    expect(evaluateScope([change('.github/workflows/dependabot-auto-merge.yml', before, before.replace("'24'", "'25'"))]).allowed).toBe(false)
    expect(evaluateScope([change('.github/workflows/dependabot-auto-merge.yml', before, before.replace('with:', 'env:'))]).allowed).toBe(false)
  })
  test('never normalizes uses text inside a multiline command', () => {
    const before = `steps:\n  - run: |\n      uses: actions/setup-node@${'c'.repeat(40)} # v4\n`
    expect(evaluateScope([change('.github/workflows/ci.yml', before, before.replace('c'.repeat(40), 'd'.repeat(40)))]).allowed).toBe(false)
  })
  test('allows source repair and new tests but protects existing tests', () => {
    expect(evaluateScope([change('lib/foo.ts', 'export const x = 1', 'export const x = 2')]).allowed).toBe(true)
    expect(evaluateScope([change('test/foo.test.ts', '', 'test("new", () => {})', 'added')]).allowed).toBe(true)
    expect(evaluateScope([change('test/foo.test.ts', 'test("old", () => {})', '', 'removed')]).allowed).toBe(false)
  })
  test.each(['.github/workflows/dependabot-auto-merge.yml', '.github/scripts/dependabot-controller.cjs', '.github/copilot-instructions.md', 'jest.config.js', 'tsconfig.json', 'lib/AGENTS.md', '.github/scripts/dependabot-opencode-worker.cjs', '.github/scripts/dependabot-opencode-proxy.cjs', '.github/scripts/dependabot-opencode-publish.cjs', '.github/scripts/dependabot-opencode-validate.cjs', '.github/opencode/repair.md', '.github/opencode/review.md', '.github/opencode/validator.Dockerfile', 'app/nested/CLAUDE.md', 'test/existing.test.ts'])('blocks protected file %s', (filename) => {
    expect(evaluateScope([change(filename, 'old', 'new')]).allowed).toBe(false)
  })
})

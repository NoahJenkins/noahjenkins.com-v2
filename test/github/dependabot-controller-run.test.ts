export {}
const { mkdtempSync, readFileSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')

function execute(client: any, output: string) {
  let run: any
  jest.isolateModules(() => {
    jest.doMock('../../.github/scripts/dependabot-controller-api.cjs', () => ({ createClient: () => client }))
    run = require('../../.github/scripts/dependabot-controller-run.cjs').run
  })
  jest.dontMock('../../.github/scripts/dependabot-controller-api.cjs')
  return run({ GITHUB_REPOSITORY: 'o/r', DEPENDABOT_READ_TOKEN: 'read-token', DEPENDABOT_APP_TOKEN: 'app-token', DEPENDABOT_CONTROLLER_APP_ID: '99', DEPENDABOT_CONTROLLER_APP_SLUG: 'test-app', DEPENDABOT_AUTOMATION_ENABLED: 'true', DEPENDABOT_AGENT_ENABLED: 'true', DEPENDABOT_STATE_ISSUE_NUMBER: '9', GITHUB_WORKFLOW_SHA: 'b'.repeat(40), GITHUB_REF: 'refs/heads/main', GITHUB_RUN_ID: '10', GITHUB_OUTPUT: output }, 'controller')
}

function boundary() {
  const sha = 'a'.repeat(40); const base = 'b'.repeat(40); const gates: any[] = []; const saved: any[] = []
  const pr = { number: 2, node_id: 'PR_2', user: { id: 49699333, type: 'Bot' }, state: 'open', draft: false, base: { ref: 'main', sha: base, repo: { id: 1 } }, head: { sha, ref: 'dependabot/npm_and_yarn/x', repo: { id: 1 } }, mergeable: true, mergeable_state: 'clean', auto_merge: null }
  const names = ['Security Audit', 'Jest Tests', 'Playwright Tests', 'TypeScript Check', 'Build Check']
  const client = {
    request: async (method: string, path: string) => path.startsWith('/apps/') ? { id: 99 } : { type: 'Bot', id: 100 },
    getRepo: async () => ({ id: 1 }), getMain: async () => base,
    listPrs: async () => [{ number: 1 }, { number: 2 }],
    hasDependabotHead: async () => false,
    getPr: async (number: number) => { if (number === 1) throw new Error('Provider unavailable for PR1'); return pr },
    getLedger: async () => ({ ledger: { version: 1, reservations: [] }, commentId: 3 }),
    saveLedger: async (ledger: any) => { saved.push(ledger) },
    setGate: async (current: any, kind: string) => { gates.push({ pr: current.number, kind }) },
    getProtection: async () => ({ required_status_checks: { strict: true, checks: [{ context: 'Dependabot Merge Gate', app_id: 99 }, ...names.map(context => ({ context }))] }, required_pull_request_reviews: { required_approving_review_count: 1, dismiss_stale_reviews: true } }),
    snapshot: async () => ({ pr, repositoryId: 1, mainSha: base, scope: { allowed: true }, containsMain: true, ciWorkflowId: 8, ci: { head_sha: sha, workflow_id: 8, event: 'pull_request', head_branch: pr.head.ref, head_repository: { id: 1 }, status: 'completed', conclusion: 'failure', pull_requests: [{ number: 2, base: { sha: base } }] }, jobs: names.map((name, i) => ({ name, status: 'completed', conclusion: i === 0 ? 'failure' : 'success', check_run_url: `https://api.github.com/repos/o/r/check-runs/${i+1}` })), checks: names.map((name, i) => ({ id: i+1, name, status: 'completed', head_sha: sha, app: { id: 15368 }, conclusion: i === 0 ? 'failure' : 'success' })) }),
  }
  return { client, pr, gates, saved }
}

describe('batch failure isolation', () => {
  let directory: string; let output: string
  beforeEach(() => { directory = mkdtempSync(join(tmpdir(), 'dependabot-controller-test-')); output = join(directory, 'output') })
  afterEach(() => { rmSync(directory, { recursive: true, force: true }) })
  test('publishes human gates even when the state issue cannot be read', async () => {
    const f = boundary(); f.pr.user = { id: 123, type: 'User' }
    f.client.listPrs = async () => [{ number: 2 }]
    f.client.getLedger = async () => { throw new Error('Untrusted ledger author') }
    await expect(execute(f.client, output)).resolves.toBeUndefined()
    expect(f.gates).toEqual([{ pr: 2, kind: 'pending' }, { pr: 2, kind: 'success' }])
  })
  test('does not require cross-App metadata access for a private controller App', async () => {
    const f = boundary(); f.pr.user = { id: 123, type: 'User' }
    f.client.listPrs = async () => [{ number: 2 }]
    f.client.request = async (_method: string, path: string) => {
      if (path.startsWith('/apps/')) throw new Error('Private App metadata unavailable to other Apps')
      return { type: 'Bot', id: 100 } as any
    }
    await expect(execute(f.client, output)).resolves.toBeUndefined()
    expect(f.gates.at(-1).kind).toBe('success')
  })
  test('retains dispatch output for valid reservations after another PR fails', async () => {
    const f = boundary()
    await expect(execute(f.client, output)).rejects.toThrow('evaluations failed')
    const receipt = readFileSync(output, 'utf8')
    expect(receipt).toContain('has_tasks=true')
    const tasks = JSON.parse(receipt.split('\n').find((line: string) => line.startsWith('tasks=')).slice(6))
    expect(tasks).toHaveLength(1); expect(f.saved[0].reservations).toEqual(tasks)
  })
})
test('original run and UTC bounds are checked immediately before launch',()=>{
 const {assertLaunch}=require('../../.github/scripts/dependabot-controller-run.cjs')
 const task={base:'b'.repeat(40),createdAt:'2026-10-13T23:58:00.000Z'}
 const config={now:'2026-10-13T23:59:00.000Z',workflowSha:task.base,ref:'refs/heads/main',runAttempt:1}
 expect(()=>assertLaunch(task,config)).not.toThrow()
 expect(()=>assertLaunch(task,{...config,runAttempt:2})).toThrow()
 expect(()=>assertLaunch(task,{...config,now:'2026-10-14T00:00:00.000Z'})).toThrow()
 expect(()=>assertLaunch(task,{...config,now:'2026-10-14T00:14:00.000Z'})).toThrow()
})

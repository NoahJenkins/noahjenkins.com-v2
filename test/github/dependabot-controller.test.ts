export {}
const { reconcileOne, dispatchOne, protectionAllowsMerge } = require('../../.github/scripts/dependabot-controller.cjs')
const { reserve } = require('../../.github/scripts/dependabot-controller-ledger.cjs')
const sha = 'a'.repeat(40); const base = 'b'.repeat(40)
function fixture() {
  const pr = { number: 1, node_id: 'PR_1', state: 'open', draft: false, user: { id: 49699333, type: 'Bot' }, base: { ref: 'main', sha: base, repo: { id: 1 } }, head: { ref: 'dependabot/npm_and_yarn/x', sha, repo: { id: 1 } }, auto_merge: null }
  const events: string[] = []; let gate = 'pending'; let queued = false; let providerComments = 0
  const tasks: any[] = []
  const state = { ledger: { version: 1, reservations: [] }, commentId: 3 }
  const client = {
    hasDependabotHead: async (_sha: string) => false,
    getPr: async () => JSON.parse(JSON.stringify(pr)), getMain: async () => base,
    snapshot: async () => ({ pr }),
    setGate: async (_pr: any, status: string) => { gate = status; events.push(`gate:${status}`) },
    disableMerge: async () => { queued = false; events.push('disable') },
    queueMerge: async (current: any) => { if (current.head.sha !== pr.head.sha) throw new Error('expectedHeadOid mismatch'); queued = true; events.push('queue') },
    approve: async () => { events.push('approve') },
    getProtection: async () => ({ required_status_checks: { strict: true, checks: [{ context: 'Dependabot Merge Gate', app_id: 99 }, ...['Security Audit', 'Jest Tests', 'Playwright Tests', 'TypeScript Check', 'Build Check'].map(context => ({ context }))] }, required_pull_request_reviews: { required_approving_review_count: 1, dismiss_stale_reviews: true } }),
    saveLedger: async (next: any) => { state.ledger = JSON.parse(JSON.stringify(next)); events.push('reserve') },
    getLedger: async () => state,
    getGate: async () => ({ status: 'in_progress', app: { id: 99 }, head_sha: pr.head.sha }),
    getDispatchUser: async () => ({ id: 7, type: 'User' }),
    hasClaim: async () => events.includes('claim'),
    claim: async () => { events.push('claim') },
    requestReview: async () => { events.push('review'); },
    requestRepair: async () => { providerComments++; events.push('repair') },
  }
  const config = { repositoryId: 1, appId: 99, dispatchUserId: 7, automationEnabled: true, agentEnabled: true, now: '2026-10-13T12:00:00.000Z', runAttempt: 1 }
  const evaluate = () => ({ kind: 'ready', reason: 'validated' })
  return { pr, client, config, events, state, tasks, evaluate, result: () => ({ gate, queued, providerComments }) }
}
describe('trusted controller', () => {
  test('queues native merge with a pending gate, then approves and releases the gate', async () => {
    const f = fixture(); await reconcileOne(f.client, f.config, 1, f.state, f.tasks, f.evaluate)
    expect(f.events).toEqual(['gate:pending', 'queue', 'approve', 'gate:success'])
    expect(f.result()).toMatchObject({ gate: 'success', queued: true })
  })
  test('a changed head cannot release the validated gate', async () => {
    const f = fixture(); f.client.queueMerge = async () => { f.events.push('queue'); f.pr.head.sha = 'c'.repeat(40) }
    await expect(reconcileOne(f.client, f.config, 1, f.state, f.tasks, f.evaluate)).rejects.toThrow('changed')
    expect(f.result().gate).toBe('pending'); expect(f.events).not.toContain('approve')
  })
  test('disabled automation cancels a previously queued merge', async () => {
    const f = fixture(); f.config.automationEnabled = false; f.pr.auto_merge = {} as any
    await reconcileOne(f.client, f.config, 1, f.state, f.tasks, f.evaluate)
    expect(f.events).toEqual(['gate:pending', 'disable', 'gate:blocked'])
  })
  test('human PRs get the required gate without agent dispatch or approval', async () => {
    const f = fixture(); f.pr.user = { id: 123, type: 'User' }
    await reconcileOne(f.client, f.config, 1, f.state, f.tasks, f.evaluate)
    expect(f.events).toEqual(['gate:pending', 'gate:success'])
  })
  test('a human PR sharing a Dependabot head cannot overwrite its blocked gate', async () => {
    const f = fixture(); f.config.automationEnabled = false
    await reconcileOne(f.client, f.config, 1, f.state, f.tasks, f.evaluate)
    f.pr.user = { id: 123, type: 'User' }; f.client.hasDependabotHead = async () => true
    const count = f.events.length
    await reconcileOne(f.client, f.config, 1, f.state, f.tasks, f.evaluate)
    expect(f.result().gate).toBe('blocked'); expect(f.events).toHaveLength(count)
  })
  test('never queues either of two Dependabot PRs sharing a commit gate', async () => {
    const f = fixture(); f.client.hasDependabotHead = async () => true
    await reconcileOne(f.client, f.config, 1, f.state, f.tasks, f.evaluate)
    expect(f.result()).toMatchObject({ gate: 'blocked', queued: false })
    expect(f.events).not.toContain('approve')
  })
  test('a bot ledger error leaves its gate blocked while unrelated human PRs proceed', async () => {
    const f = fixture(); const state = { ledger: null, commentId: null }
    f.client.getLedger = async () => { throw new Error('Untrusted ledger author') }
    await reconcileOne(f.client, f.config, 1, state, f.tasks, () => ({ kind: 'repair', reason: 'audit failed' }))
    expect(f.result().gate).toBe('blocked')
    f.pr.user = { id: 123, type: 'User' }
    await reconcileOne(f.client, f.config, 1, state, f.tasks, f.evaluate)
    expect(f.result().gate).toBe('success')
  })
  test('reserves before handing any task to the PAT job', async () => {
    const f = fixture(); await reconcileOne(f.client, f.config, 1, f.state, f.tasks, () => ({ kind: 'repair', reason: 'audit failed' }))
    expect(f.events).toEqual(['gate:pending', 'reserve', 'gate:waiting'])
    expect(f.tasks).toHaveLength(1); expect(f.state.ledger.reservations).toEqual(f.tasks)
  })
  test('cancels an existing queue only once when agent dispatch is disabled', async () => {
    const f = fixture(); f.config.agentEnabled = false; f.pr.auto_merge = {} as any
    await reconcileOne(f.client, f.config, 1, f.state, f.tasks, () => ({ kind: 'repair', reason: 'audit failed' }))
    expect(f.events).toEqual(['gate:pending', 'disable', 'gate:blocked'])
  })
  test('waits thirty minutes for a reserved agent task before requiring operator action', async () => {
    const f = fixture(); const evaluate = () => ({ kind: 'repair', reason: 'audit failed' })
    await reconcileOne(f.client, f.config, 1, f.state, f.tasks, evaluate)
    f.events.length = 0
    await reconcileOne(f.client, f.config, 1, f.state, f.tasks, evaluate)
    expect(f.result().gate).toBe('waiting'); expect(f.tasks).toHaveLength(1)
    f.config.now = '2026-10-13T12:31:00.000Z'
    await reconcileOne(f.client, f.config, 1, f.state, f.tasks, evaluate)
    expect(f.result().gate).toBe('blocked'); expect(f.tasks).toHaveLength(1)
  })
  test('requires branch gate to be bound to the dedicated App', async () => {
    const f = fixture(); const protection = await f.client.getProtection()
    expect(protectionAllowsMerge(protection, 99)).toBe(true)
    protection.required_status_checks.checks[0].app_id = 15368
    expect(protectionAllowsMerge(protection, 99)).toBe(false)
  })
  test('rechecks validation after queueing before gate success', async () => {
    const f = fixture(); let evaluations = 0
    const evaluate = () => (++evaluations === 1 ? { kind: 'ready', reason: 'pass' } : { kind: 'waiting', reason: 'review dismissed' })
    await expect(reconcileOne(f.client, f.config, 1, f.state, f.tasks, evaluate)).rejects.toThrow('validation')
    expect(f.result().gate).toBe('pending')
  })
})
describe('isolated Copilot dispatcher', () => {
  async function prepared() {
    const f = fixture(); const reserved = reserve(f.state.ledger, { pr: 1, prId: 'PR_1', head: sha, base, kind: 'repair' }, f.config.now)
    f.state.ledger = reserved.ledger
    return { ...f, task: reserved.reservation }
  }
  test('claims a durable reservation before dispatch and prevents duplicate dispatch', async () => {
    const f = await prepared(); await dispatchOne(f.client, f.config, f.task)
    await dispatchOne(f.client, f.config, f.task)
    expect(f.result().providerComments).toBe(1); expect(f.events).toEqual(['claim', 'repair'])
  })
  test('does not dispatch an artifact without a persisted reservation', async () => {
    const f = await prepared(); f.state.ledger.reservations = []
    await expect(dispatchOne(f.client, f.config, f.task)).rejects.toThrow('reservation')
    expect(f.result().providerComments).toBe(0)
  })
  test('does not dispatch against a refreshed head', async () => {
    const f = await prepared(); f.pr.head.sha = 'c'.repeat(40)
    await expect(dispatchOne(f.client, f.config, f.task)).rejects.toThrow('changed')
    expect(f.result().providerComments).toBe(0)
  })
  test('does not replay dispatch when GitHub reruns a job', async () => {
    const f = await prepared(); f.config.runAttempt = 2
    await dispatchOne(f.client, f.config, f.task)
    expect(f.result().providerComments).toBe(0)
  })
  test('does not carry yesterday\'s reservation into today\'s dispatch budget', async () => {
    const f = await prepared(); f.task.createdAt = '2026-10-13T23:59:00.000Z'; f.config.now = '2026-10-14T00:01:00.000Z'
    await expect(dispatchOne(f.client, f.config, f.task)).rejects.toThrow('UTC day')
    expect(f.result().providerComments).toBe(0)
  })
  test('rejects a wrong user credential', async () => {
    const f = await prepared(); f.client.getDispatchUser = async () => ({ id: 88, type: 'User' })
    await expect(dispatchOne(f.client, f.config, f.task)).rejects.toThrow('credential')
  })
  test('uncertain provider failure consumes the claimed reservation', async () => {
    const f = await prepared(); f.client.requestRepair = async () => { throw new Error('network uncertainty') }
    await expect(dispatchOne(f.client, f.config, f.task)).rejects.toThrow('network')
    await dispatchOne(f.client, f.config, f.task)
    expect(f.events).toEqual(['claim']); expect(f.state.ledger.reservations).toHaveLength(1)
  })
})

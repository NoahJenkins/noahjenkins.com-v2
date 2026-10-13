'use strict'
const { REQUIRED_CHECKS, GATE, DEPENDABOT_ID, eligiblePr, evaluateCandidate } = require('./dependabot-controller-policy.cjs')
const { reserve, validateTask } = require('./dependabot-controller-ledger.cjs')

function protectionAllowsMerge(protection, appId) {
  const checks = protection.required_status_checks?.checks || []
  return protection.required_status_checks?.strict === true && checks.some((check) => check.context === GATE && check.app_id === appId) && REQUIRED_CHECKS.every((name) => checks.some((check) => check.context === name)) && protection.required_pull_request_reviews?.required_approving_review_count >= 1 && protection.required_pull_request_reviews.dismiss_stale_reviews === true
}

async function assertFresh(client, pr, mainSha) {
  const current = await client.getPr(pr.number)
  if (current.head.sha !== pr.head.sha || current.base.sha !== mainSha || current.base.ref !== 'main' || current.state !== 'open' || current.draft || current.node_id !== pr.node_id || await client.getMain() !== mainSha) throw new Error('PR head or base changed; leave the merge gate pending')
  return current
}

async function reconcileOne(client, config, number, state, tasks, evaluate = evaluateCandidate) {
  const pr = await client.getPr(number)
  if (pr.state !== 'open') return
  await client.setGate(pr, 'pending', 'Evaluating current head.')
  if (pr.user?.id !== DEPENDABOT_ID) {
    await client.setGate(pr, 'success', 'Human PR: this check only enforces Dependabot automation policy.')
    return
  }
  let cancelled = false
  const cancelQueue = async () => {
    if (pr.auto_merge && !cancelled) { await client.disableMerge(pr); cancelled = true }
  }
  const stop = async (kind, reason) => {
    await cancelQueue()
    await client.setGate(pr, kind, reason)
    return { kind, reason }
  }
  if (!config.automationEnabled) return stop('blocked', 'Dependabot automation is disabled pending setup.')
  if (!eligiblePr(pr, config.repositoryId)) return stop('blocked', 'Dependabot identity, branch or repository is outside policy.')
  const main = await client.getMain()
  const decision = evaluate(await client.snapshot(pr, main))
  if (decision.kind === 'ready') {
    if (!protectionAllowsMerge(await client.getProtection(), config.appId)) return stop('blocked', 'Require current-base CI, stale-review dismissal and an App-bound Dependabot Merge Gate in main protection.')
    await assertFresh(client, pr, main)
    await client.queueMerge(pr) // Native auto-merge, with expectedHeadOid, while Gate is pending.
    await assertFresh(client, pr, main)
    await client.approve(pr) // This is based on the separate authenticated review, never on agent prose.
    await assertFresh(client, pr, main)
    if (evaluate(await client.snapshot(pr, main)).kind !== 'ready') throw new Error('Current-head validation changed; leave the gate pending')
    if (!protectionAllowsMerge(await client.getProtection(), config.appId)) throw new Error('Branch protection changed; leave the gate pending')
    await assertFresh(client, pr, main)
    await client.setGate(pr, 'success', decision.reason)
    return decision
  }
  await cancelQueue()
  if (decision.kind === 'refresh') {
    await assertFresh(client, pr, main)
    await client.updateBranch(pr)
    await client.setGate(pr, 'waiting', 'Requested a branch refresh. New-head checks and review are required.')
    return decision
  }
  if (['repair', 'review'].includes(decision.kind)) {
    if (!config.agentEnabled) return stop('blocked', `${decision.reason} Agent dispatch is disabled pending credentials and Copilot settings.`)
    // Fail closed before spending credits if the required gate can be forged or omitted.
    if (!protectionAllowsMerge(await client.getProtection(), config.appId)) return stop('blocked', 'Configure the App-bound required gate before agent dispatch.')
    await assertFresh(client, pr, main)
    const next = reserve(state.ledger, { pr: number, prId: pr.node_id, head: pr.head.sha, base: main, kind: decision.kind }, config.now)
    if (!next.reservation) {
      const previous = state.ledger.reservations.find((item) => item.pr === number && item.kind === decision.kind && item.head === pr.head.sha)
      const waiting = previous && Date.parse(config.now) - Date.parse(previous.createdAt) < 30 * 60 * 1000
      return stop(waiting ? 'waiting' : 'blocked', waiting ? 'Await the reserved agent task. No duplicate dispatch.' : next.reason)
    }
    await client.saveLedger(next.ledger, state)
    state.ledger = next.ledger
    tasks.push(next.reservation)
    await client.setGate(pr, 'waiting', `Reserved ${decision.kind} for this head. Await Copilot, then fresh checks and review.`)
    return decision
  }
  return stop(decision.kind === 'blocked' ? 'blocked' : 'waiting', decision.reason)
}

async function dispatchOne(client, config, task) {
  if (!config.automationEnabled || !config.agentEnabled || config.runAttempt !== 1) return
  validateTask(task)
  const ledger = (await client.getLedger()).ledger
  const persisted = ledger.reservations.find((item) => item.nonce === task.nonce)
  if (!persisted || JSON.stringify(persisted) !== JSON.stringify(task)) throw new Error('Dispatch does not match a durable reservation')
  const age = Date.parse(config.now) - Date.parse(task.createdAt)
  if (age < 0 || age > 15 * 60 * 1000) throw new Error('Dispatch reservation expired')
  const user = await client.getDispatchUser()
  if (user.type !== 'User' || user.id !== config.dispatchUserId) throw new Error('Copilot credential does not match the configured user')
  const pr = await client.getPr(task.pr)
  if (!eligiblePr(pr, config.repositoryId) || pr.node_id !== task.prId || pr.head.sha !== task.head || pr.base.sha !== task.base || await client.getMain() !== task.base) throw new Error('PR head or base changed before dispatch')
  const gate = await client.getGate(pr)
  if (!gate || gate.app?.id !== config.appId || gate.head_sha !== task.head || gate.status !== 'in_progress') throw new Error('The dedicated App gate is not pending for this head')
  if (await client.hasClaim(task, user.id)) return
  // Persist the claim BEFORE a potentially ambiguous provider write. Never retry writes.
  await client.claim(task)
  await assertFresh(client, pr, task.base)
  if (task.kind === 'repair') await client.requestRepair(task)
  else await client.requestReview(task, pr)
}

module.exports = { reconcileOne, dispatchOne, protectionAllowsMerge, assertFresh }

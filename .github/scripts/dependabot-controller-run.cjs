'use strict'

const fs = require('node:fs')
const { createClient } = require('./dependabot-controller-api.cjs')
const { reconcileOne, dispatchOne } = require('./dependabot-controller.cjs')
const { evaluateCandidate } = require('./dependabot-controller-policy.cjs')

function configFromEnv(env) {
  const number = (key, fallback = 0) => {
    const value = env[key] === undefined || env[key] === '' ? fallback : Number(env[key])
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid ${key}`)
    return value
  }
  const config = {
    repo: env.GITHUB_REPOSITORY, appId: number('DEPENDABOT_CONTROLLER_APP_ID'), appSlug: env.DEPENDABOT_CONTROLLER_APP_SLUG,
    stateIssue: number('DEPENDABOT_STATE_ISSUE_NUMBER'),
    vercelAppId: number('DEPENDABOT_VERCEL_APP_ID', 8329),
    automationEnabled: env.DEPENDABOT_AUTOMATION_ENABLED === 'true', agentEnabled: env.DEPENDABOT_AGENT_ENABLED === 'true',
    runAttempt: number('GITHUB_RUN_ATTEMPT', 1), get now() { return new Date().toISOString() },
  }
  if (config.automationEnabled && (config.appId <= 0 || [15368, 8329].includes(config.appId))) throw new Error('A dedicated controller App is required')
  if (config.automationEnabled && config.agentEnabled && !config.stateIssue) throw new Error('Configure the state issue before enabling agents')
  return config
}

async function run(env = process.env, mode = process.argv[2]) {
  const config = configFromEnv(env)
  if (!['controller', 'dispatch', 'inspect'].includes(mode)) throw new Error('Use controller, dispatch or inspect')
  if (!env.DEPENDABOT_READ_TOKEN) throw new Error('Read credential is missing')
  const client = createClient(config, env.DEPENDABOT_READ_TOKEN, mode === 'controller' ? env.DEPENDABOT_APP_TOKEN : env.COPILOT_AUTOMATION_TOKEN)
  const repo = await client.getRepo(); config.repositoryId = repo.id
  if (mode !== 'inspect') {
    if (!/^[a-z0-9-]+$/.test(config.appSlug || '')) throw new Error('Controller App slug is missing')
    // Slug comes from the JWT-authenticated token action, not PR input. Gate
    // responses verify app.id; another App's token cannot read private metadata.
    const bot = await client.request('GET', `/users/${config.appSlug}%5Bbot%5D`)
    if (bot.type !== 'Bot' || !bot.id) throw new Error('Controller bot identity is missing')
    config.appBotId = bot.id
  }
  if (mode === 'inspect') {
    for (const pr of await client.listPrs()) {
      const full = await client.getPr(pr.number)
      console.log(JSON.stringify({ pr: full.number, head: full.head.sha, decision: evaluateCandidate(await client.snapshot(full, await client.getMain())) }))
    }
    return
  }
  if (mode === 'dispatch') {
    if (!env.COPILOT_AUTOMATION_TOKEN) throw new Error('Copilot user credential is missing; reservation remains consumed')
    const tasks = JSON.parse(env.DEPENDABOT_TASKS || '[]')
    if (!Array.isArray(tasks) || tasks.length > 10) throw new Error('Invalid dispatch batch')
    let failed = false
    for (const task of tasks) {
      try { await dispatchOne(client, config, task) }
      catch (error) { failed = true; console.error(`PR #${task.pr}: ${error.message}`) }
    }
    if (failed) throw new Error('One or more dispatches failed; reservations are retained')
    return
  }
  if (!env.DEPENDABOT_APP_TOKEN) throw new Error('Controller App credential is missing')
  // Load the ledger only when a bot actually needs a credit reservation.
  const state = { ledger: null, commentId: null }
  const tasks = []; let failed = false
  for (const pr of await client.listPrs()) {
    try {
      const decision = await reconcileOne(client, config, pr.number, state, tasks)
      console.log(JSON.stringify({ pr: pr.number, decision: decision || { kind: 'human' } }))
    } catch (error) { failed = true; console.error(`PR #${pr.number}: ${error.message}`) }
  }
  if (env.GITHUB_OUTPUT) fs.appendFileSync(env.GITHUB_OUTPUT, `tasks=${JSON.stringify(tasks)}\nhas_tasks=${tasks.length > 0}\n`)
  if (failed) throw new Error('One or more PR evaluations failed; their gates remain pending')
}

module.exports = { run, configFromEnv }
if (require.main === module) run().catch((error) => { console.error(error.message); process.exitCode = 1 })

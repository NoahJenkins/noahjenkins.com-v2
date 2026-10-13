'use strict'

const REQUIRED_CHECKS = ['Security Audit', 'Jest Tests', 'Playwright Tests', 'TypeScript Check', 'Build Check']
const GATE = 'Dependabot Merge Gate'
const DEPENDABOT_ID = 49699333
const VERCEL_BOT_ID = 35613825
const VERCEL_PREFIX = 'https://vercel.com/noahs-projects-e38437a2/noahjenkins-com/'
const range = /^(?:[~^]|>=?)?\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/
const nodeVersion = /^(?:2[4-9]|[3-9]\d)(?:\.\d+\.\d+|\.x)?$/

function actionPins(text) {
  const pins = []; let stepsIndent = null; let scalarIndent = null
  const lines = text.split('\n')
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]; const indent = line.match(/^[ ]*/)[0].length
    if (scalarIndent !== null && (!line.trim() || indent > scalarIndent)) continue
    scalarIndent = null
    if (/^[ ]*(?:- )?[^#]+:[ \t]*[|>][+-]?[0-9]?[ \t]*(?:#.*)?$/.test(line)) scalarIndent = indent
    if (/^[ ]*steps:[ \t]*$/.test(line)) { stepsIndent = indent; continue }
    if (stepsIndent !== null && line.trim() && indent <= stepsIndent) stepsIndent = null
    const isStep = stepsIndent !== null && ((indent === stepsIndent + 2 && line.trimStart().startsWith('- uses:')) || (indent === stepsIndent + 4 && line.trimStart().startsWith('uses:')))
    if (!isStep) continue
    const match = line.match(/^([ ]*-?[ \t]*uses:[ \t]*)([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_./-]+)@([0-9a-f]{40})[ \t]+#[ \t]*(v\d+(?:\.\d+){0,2})[ \t]*\r?$/)
    if (match) pins.push({ index, prefix: match[1], action: match[2], sha: match[3], tag: match[4] })
  }
  return pins
}

function normalizeWorkflow(text, allowNode = true) {
  const lines = text.split('\n')
  for (const pin of actionPins(text)) lines[pin.index] = `${pin.prefix}${pin.action}@PIN`
  const normalized = lines.join('\n')
  return allowNode ? normalized.replace(/^([ \t]*node-version:[ \t]*)['"]?(2[4-9]|[3-9]\d)(?:\.\d+\.\d+)?['"]?[ \t]*$/gm, '$1NODE') : normalized
}

function packageScope(before, after) {
  const a = JSON.parse(before); const b = JSON.parse(after)
  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    if (b[key] && (typeof b[key] !== 'object' || Array.isArray(b[key]) || Object.entries(b[key]).some(([name, version]) => !/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(name) || typeof version !== 'string' || !range.test(version)))) return false
    delete a[key]; delete b[key]
  }
  if (JSON.stringify(a.engines) !== JSON.stringify(b.engines)) {
    if (!b.engines || !nodeVersion.test(b.engines.node)) return false
    const old = { ...a.engines }; const next = { ...b.engines }; delete old.node; delete next.node
    if (JSON.stringify(old) !== JSON.stringify(next)) return false
    delete a.engines; delete b.engines
  }
  return JSON.stringify(a) === JSON.stringify(b)
}

function workspacePrefix(text) {
  const parts = text.split(/^overrides:[ \t]*\r?$/m)
  if (parts.length > 2) throw new Error('Multiple overrides maps')
  if (parts[1] !== undefined) {
    for (const line of parts[1].split(/\r?\n/).filter((line) => line.trim())) {
      const match = line.match(/^  ["']?((?:@[a-z0-9._-]+\/)?[a-z0-9._-]+)["']?:[ \t]*["']([^"']+)["'][ \t]*$/)
      if (!match || !range.test(match[2])) throw new Error('Unsupported workspace policy change')
    }
  }
  return parts[0].trimEnd()
}

function evaluateScope(files) {
  if (!Array.isArray(files) || files.length === 0) return { allowed: false, reason: 'No changed files.' }
  for (const file of files) {
    const { filename, before, after, status } = file
    let allowed = false
    if (status !== 'removed' && status !== 'renamed') {
      try {
        if (filename === 'package.json' && status === 'modified') allowed = packageScope(before, after)
        else if (filename === 'pnpm-workspace.yaml' && status === 'modified') allowed = workspacePrefix(before) === workspacePrefix(after)
        else if (filename === 'pnpm-lock.yaml' && status === 'modified') allowed = true
        else if (['.nvmrc', '.node-version'].includes(filename) && status === 'modified') allowed = nodeVersion.test(after.trim())
        else if (['.github/workflows/ci.yml', '.github/workflows/dependency-review.yml'].includes(filename) && status === 'modified') allowed = normalizeWorkflow(before) === normalizeWorkflow(after)
        else if (filename === '.github/workflows/dependabot-auto-merge.yml' && status === 'modified') allowed = normalizeWorkflow(before, false) === normalizeWorkflow(after, false)
        else if (/^(app|components|lib)\/[a-zA-Z0-9_./()\[\]-]+\.(tsx?|jsx?|css)$/.test(filename) && !filename.split('/').includes('..')) allowed = true
        else if (/^test\/[a-zA-Z0-9_./-]+\.(test|spec)\.tsx?$/.test(filename) && !filename.split('/').includes('..') && status === 'added') allowed = true
      } catch { allowed = false }
    }
    if (!allowed) return { allowed: false, reason: `Protected or unsupported change: ${filename}` }
  }
  return { allowed: true }
}

function eligiblePr(pr, repositoryId) {
  return pr.user?.id === DEPENDABOT_ID && pr.user.type === 'Bot' && pr.base?.ref === 'main' && pr.head?.repo?.id === repositoryId && pr.base.repo?.id === repositoryId && /^dependabot\/(npm_and_yarn|github_actions)\//.test(pr.head.ref) && pr.state === 'open' && !pr.draft
}

function evaluateCandidate(input) {
  const result = (kind, reason) => ({ kind, reason })
  const { pr, repositoryId, mainSha, ci, jobs = [], checks = [] } = input
  if (!eligiblePr(pr, repositoryId)) return result('blocked', 'Only open, same-repository Dependabot PRs targeting main are eligible.')
  if (!input.scope.allowed) return result('blocked', input.scope.reason)
  if (pr.base.sha !== mainSha) return result('waiting', 'Main changed during evaluation.')
  if (pr.mergeable_state === 'dirty') return result('repair', 'The current head has a merge conflict.')
  if (!input.containsMain) return result('refresh', 'Refresh the branch against current main.')
  if (pr.mergeable !== true) return result('waiting', 'GitHub has not resolved mergeability.')
  if (!ci || ci.head_sha !== pr.head.sha || ci.workflow_id !== input.ciWorkflowId || ci.event !== 'pull_request' || ci.head_repository?.id !== repositoryId || ci.head_branch !== pr.head.ref || !ci.pull_requests?.some((item) => item.number === pr.number && item.base.sha === mainSha) || ci.status !== 'completed') return result('waiting', 'Current-head, current-base CI is missing or waiting for approval.')
  const validated = REQUIRED_CHECKS.map((name) => {
    const job = jobs.find((item) => item.name === name)
    const id = Number(job?.check_run_url?.match(/\/check-runs\/(\d+)$/)?.[1])
    const check = checks.find((item) => item.id === id && item.name === name && item.head_sha === pr.head.sha && item.app?.id === 15368)
    return job && check && job.status === 'completed' && check.status === 'completed' && job.conclusion === check.conclusion ? job.conclusion : null
  })
  if (validated.some((value) => value === null)) return result('waiting', 'Required CI job provenance or completion is missing.')
  if (validated.some((value) => value === 'failure') && ci.conclusion === 'failure') return result('repair', 'Current-head CI has a failed required check.')
  if (ci.conclusion !== 'success' || validated.some((value) => value !== 'success')) return result('waiting', 'Cancelled, skipped or timed-out CI needs operator action.')
  const vercel = input.statuses?.find((item) => item.context === 'Vercel')
  if (!vercel || vercel.creator?.id !== VERCEL_BOT_ID || !vercel.target_url?.startsWith(VERCEL_PREFIX) || !input.vercelChecks?.some((item) => item.head_sha === pr.head.sha && item.app?.id === input.vercelAppId) || input.vercelAppId !== 8329) return result('waiting', 'Trusted Vercel deployment status is missing.')
  if (['failure', 'error'].includes(vercel.state)) return result('blocked', 'Vercel failed without a classified CI code failure; inspect platform logs before repair.')
  if (vercel.state !== 'success') return result('waiting', 'Vercel preview is still pending.')
  const current = input.independentReview
  if (!current || current.task.head !== pr.head.sha || current.task.base !== mainSha) return result('review', 'Independent current-head review is required.')
  if (current.report.verdict === 'request_changes') return result('repair', 'Independent review requested changes to this head.')
  if (!current.passed) return result('blocked', 'Independent review is blocked or incomplete.')
  return result('ready', 'Current-head validation and independent review passed.')
}

module.exports = { REQUIRED_CHECKS, GATE, DEPENDABOT_ID, evaluateScope, evaluateCandidate, eligiblePr, actionPins }

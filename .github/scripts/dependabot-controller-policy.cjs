'use strict'
const { expandWorkflowFlow } = require('./dependabot-workflow-shape.cjs')

const REQUIRED_CHECKS = ['Security Audit', 'Jest Tests', 'Playwright Tests', 'TypeScript Check', 'Build Check']
const GATE = 'Dependabot Merge Gate'
const DEPENDABOT_ID = 49699333
const VERCEL_BOT_ID = 35613825
const VERCEL_PREFIX = 'https://vercel.com/noahs-projects-e38437a2/noahjenkins-com/'
const range = /^(?:[~^]|>=?)?\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/
const nodeVersion = /^(?:2[4-9]|[3-9]\d)(?:\.\d+\.\d+|\.x)?$/

const { workflowActionReferences, workflowNodeReferences } = require('./dependabot-opencode-contract.cjs')
function actionPins(text) {
  return workflowActionReferences(text).filter(pin=>pin.sha && pin.tag)
}

function normalizeWorkflow(text, allowNode = true) {
  text=expandWorkflowFlow(text)
  const lines = text.split('\n')
  for (const pin of actionPins(text)) lines[pin.index] = `${pin.prefix}${pin.action}@PIN${pin.suffix}`
  if(allowNode)for(const input of workflowNodeReferences(text))if(nodeVersion.test(input.version))lines[input.index]=`${input.prefix}NODE${input.suffix}`
  return lines.join('\n')
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
  const retained = []; const keys = new Set(); let inside = false; let seen = false
  for (const line of text.split(/\r?\n/)) {
    if (/^overrides:[ \t]*(?:#.*)?$/.test(line)) {
      if (seen) throw new Error('Multiple overrides maps')
      inside = true; seen = true; continue
    }
    if (inside && (!line.trim() || /^[ \t]*#/.test(line))) continue
    // Keep every other top-level section in the policy comparison.
    if (inside && /^\S/.test(line)) inside = false
    if (!inside) { retained.push(line); continue }
    const match = line.match(/^  (?:'([^']+)'|"([^"\\]+)"|([^\s:'"]+)):[ \t]*(?:'([^']+)'|"([^"\\]+)"|([^\s#]+))(?:[ \t]+#.*|[ \t]*)$/)
    const key = match && (match[1] || match[2] || match[3])
    const version = match && (match[4] || match[5] || match[6])
    // Accept pnpm package/version selectors and parent>child selectors, but no
    // YAML aliases, tags, nested objects, URLs, or local dependency targets.
    if (!match || !/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+[a-zA-Z0-9@._/<>~=^|* -]*$/.test(key) || !range.test(version) || keys.has(key)) throw new Error('Unsupported workspace policy change')
    keys.add(key)
  }
  return retained.join('\n').trimEnd()
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

function ciMatchesPr(input) {
  const { ci, pr, repositoryId, mainSha, commitPullRequests } = input
  if (!Array.isArray(ci?.pull_requests)) return false
  if (ci.pull_requests.length) return ci.pull_requests.some(item => item.number === pr.number && item.base?.sha === mainSha)
  // GitHub may omit run associations. Resolve only through the authenticated
  // exact-head commit endpoint, never through branch names or event payloads.
  // The caller also requires current main ancestry in this immutable tested head.
  if (!input.containsMain || !Number.isSafeInteger(pr.id) || pr.id < 1 || !pr.node_id || !Array.isArray(commitPullRequests)) return false
  return commitPullRequests.filter(item => item.id === pr.id && item.node_id === pr.node_id && item.number === pr.number && item.state === 'open' && item.head?.sha === pr.head.sha && item.head.ref === pr.head.ref && item.head.repo?.id === repositoryId && item.base?.ref === 'main' && item.base.sha === mainSha && item.base.repo?.id === repositoryId).length === 1
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
  if (!ci || ci.head_sha !== pr.head.sha || ci.workflow_id !== input.ciWorkflowId || ci.event !== 'pull_request' || ci.head_repository?.id !== repositoryId || ci.head_branch !== pr.head.ref || !ciMatchesPr(input) || ci.status !== 'completed') return result('waiting', 'Current-head, current-base CI is missing or waiting for approval.')
  if (['cancelled', 'timed_out'].includes(ci.conclusion)) return result('retry', 'Authenticated interrupted CI is eligible for a bounded retry.')
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

'use strict'
const { GATE, REVIEWER_ID, DEPENDABOT_ID, evaluateScope, actionPins } = require('./dependabot-controller-policy.cjs')
const { readLedger, encodeLedger } = require('./dependabot-controller-ledger.cjs')

function createClient(config, readToken, writeToken, fetcher = fetch) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(config.repo)) throw new Error('Invalid repository')
  const root = `/repos/${config.repo}`
  async function request(method, path, body, useWrite = method !== 'GET') {
    if (!path.startsWith('/') || path.startsWith('//') || /[\r\n]/.test(path)) throw new Error('Invalid API path')
    const response = await fetcher(`https://api.github.com${path}`, {
      method, headers: { Authorization: `Bearer ${useWrite ? writeToken : readToken}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10', 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(20000), redirect: 'error',
    })
    if (!response.ok) throw new Error(`GitHub HTTP ${response.status}: ${method} ${path.split('?')[0]}`)
    if (response.status === 204) return null
    const data = await response.json()
    if (data.errors) throw new Error('GitHub GraphQL request rejected; no automatic retry')
    return data
  }
  async function list(path, key) {
    const result = []
    for (let page = 1; page <= 20; page++) {
      const data = await request('GET', `${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`)
      const items = key ? data[key] : data
      if (!Array.isArray(items)) throw new Error('Unexpected paginated GitHub response')
      result.push(...items)
      if (items.length < 100) return result
    }
    throw new Error('GitHub pagination capacity reached; fail closed')
  }
  const checksFor = (sha) => list(`${root}/commits/${sha}/check-runs?filter=latest`, 'check_runs')
  async function content(path, sha) {
    const encoded = path.split('/').map(encodeURIComponent).join('/')
    const data = await request('GET', `${root}/contents/${encoded}?ref=${sha}`)
    if (Array.isArray(data) || data.type !== 'file' || data.size > 2000000) throw new Error('Unsupported file type or size')
    const blob = data.content ? data : await request('GET', `${root}/git/blobs/${data.sha}`)
    if (blob.encoding !== 'base64') throw new Error('Unsupported file encoding')
    return Buffer.from(blob.content, 'base64').toString('utf8')
  }
  const claimMarker = (task) => `<!-- dependabot-dispatch-claim:${task.nonce} -->`
  const client = {
    request, list,
    getRepo: () => request('GET', root),
    getPr: (number) => request('GET', `${root}/pulls/${number}`),
    getMain: async () => (await request('GET', `${root}/git/ref/heads/main`)).object.sha,
    listPrs: () => list(`${root}/pulls?state=open&base=main`),
    hasDependabotHead: async (sha, excludeNumber) => (await client.listPrs()).some((pr) => pr.user?.id === DEPENDABOT_ID && pr.head.sha === sha && pr.number !== excludeNumber),
    getProtection: () => request('GET', `${root}/branches/main/protection`),
    getGate: async (pr) => (await checksFor(pr.head.sha)).filter((check) => check.name === GATE && check.app?.id === config.appId).sort((a, b) => b.id - a.id)[0],
    async setGate(pr, kind, reason) {
      const existing = await client.getGate(pr)
      const completed = ['success', 'blocked'].includes(kind)
      const body = { name: GATE, ...(existing ? {} : { head_sha: pr.head.sha }), status: completed ? 'completed' : 'in_progress', ...(completed ? { conclusion: kind === 'success' ? 'success' : 'action_required' } : {}), output: { title: `Dependabot: ${kind}`, summary: reason.slice(0, 2000) } }
      const result = await request(existing ? 'PATCH' : 'POST', existing ? `${root}/check-runs/${existing.id}` : `${root}/check-runs`, body)
      if (result.app?.id !== config.appId || result.head_sha !== pr.head.sha) throw new Error('Unexpected merge-gate publisher or head')
    },
    async snapshot(pr, main) {
      const files = await list(`${root}/pulls/${pr.number}/files`)
      if (files.length !== pr.changed_files || files.length > 100) throw new Error('Incomplete or excessive PR file list')
      const changes = []
      for (const file of files) {
        const needText = ['package.json', 'pnpm-workspace.yaml', '.nvmrc', '.node-version', '.github/workflows/ci.yml', '.github/workflows/dependency-review.yml', '.github/workflows/dependabot-auto-merge.yml'].includes(file.filename)
        changes.push({ ...file, before: needText && file.status === 'modified' ? await content(file.filename, main) : '', after: needText && !['removed', 'renamed'].includes(file.status) ? await content(file.filename, pr.head.sha) : '' })
      }
      const scope = evaluateScope(changes)
      if (scope.allowed) await client.verifyActionPins(changes.filter((file) => file.filename.startsWith('.github/workflows/')))
      const workflow = await request('GET', `${root}/actions/workflows/ci.yml`)
      const runs = await list(`${root}/actions/workflows/${workflow.id}/runs?head_sha=${pr.head.sha}&event=pull_request`, 'workflow_runs')
      const ci = runs.filter((run) => run.head_sha === pr.head.sha && run.head_branch === pr.head.ref).sort((a, b) => b.id - a.id)[0]
      const jobs = ci ? await list(`${root}/actions/runs/${ci.id}/jobs?filter=latest`, 'jobs') : []
      const checks = await checksFor(pr.head.sha)
      const statuses = await list(`${root}/commits/${pr.head.sha}/statuses`)
      const reviews = await list(`${root}/pulls/${pr.number}/reviews`)
      const compare = await request('GET', `${root}/compare/${main}...${pr.head.sha}`)
      return { pr, mainSha: main, repositoryId: config.repositoryId, scope, containsMain: ['ahead', 'identical'].includes(compare.status), ciWorkflowId: workflow.id, ci, jobs, checks, statuses, reviews, reviewerId: config.reviewerId, vercelAppId: config.vercelAppId, vercelChecks: checks }
    },
    async verifyActionPins(changes) {
      for (const change of changes) {
        const old = actionPins(change.before)
        for (const pin of actionPins(change.after)) {
          if (old.some((item) => item.index === pin.index && item.action === pin.action && item.sha === pin.sha && item.tag === pin.tag)) continue
          const upstream = pin.action.split('/').slice(0, 2).join('/')
          let object = (await request('GET', `/repos/${upstream}/git/ref/tags/${pin.tag}`)).object
          for (let depth = 0; object.type === 'tag' && depth < 5; depth++) object = (await request('GET', `/repos/${upstream}/git/tags/${object.sha}`)).object
          if (object.type !== 'commit' || object.sha !== pin.sha) throw new Error('Action pin does not match the official upstream version tag')
        }
      }
    },
    async queueMerge(pr) {
      if (pr.auto_merge?.merge_method === 'squash') return
      if (pr.auto_merge) await client.disableMerge(pr)
      await request('POST', '/graphql', { query: 'mutation($id: ID!, $head: GitObjectID!) { enablePullRequestAutoMerge(input: {pullRequestId: $id, expectedHeadOid: $head, mergeMethod: SQUASH}) { pullRequest { id } } }', variables: { id: pr.node_id, head: pr.head.sha } })
    },
    disableMerge: (pr) => request('POST', '/graphql', { query: 'mutation($id: ID!) { disablePullRequestAutoMerge(input: {pullRequestId: $id}) { pullRequest { id } } }', variables: { id: pr.node_id } }),
    async approve(pr) {
      const reviews = await list(`${root}/pulls/${pr.number}/reviews`)
      const own = reviews.filter((review) => review.user?.id === config.appBotId && review.commit_id === pr.head.sha).sort((a, b) => b.id - a.id)[0]
      if (own?.state === 'APPROVED') return
      await request('POST', `${root}/pulls/${pr.number}/reviews`, { commit_id: pr.head.sha, event: 'APPROVE', body: 'Independent current-head Copilot approval, trusted CI, Vercel and protected scope verified. Native merge remains controlled by the dedicated App gate.' })
    },
    updateBranch: (pr) => request('PUT', `${root}/pulls/${pr.number}/update-branch`, { expected_head_sha: pr.head.sha }),
    getLedger: async () => readLedger(await list(`${root}/issues/${config.stateIssue}/comments`), config.appBotId),
    async saveLedger(ledger, state) {
      if (state.commentId) {
        const existing = readLedger([await request('GET', `${root}/issues/comments/${state.commentId}`)], config.appBotId)
        if (JSON.stringify(existing.ledger) !== JSON.stringify(state.ledger)) throw new Error('Ledger changed concurrently; fail closed')
      }
      const saved = await request(state.commentId ? 'PATCH' : 'POST', state.commentId ? `${root}/issues/comments/${state.commentId}` : `${root}/issues/${config.stateIssue}/comments`, { body: encodeLedger(ledger) })
      const verified = readLedger([saved], config.appBotId)
      if (JSON.stringify(verified.ledger) !== JSON.stringify(ledger)) throw new Error('Ledger persistence mismatch')
      state.commentId = saved.id
    },
    getDispatchUser: () => request('GET', '/user', undefined, true),
    hasClaim: async (task, userId) => (await list(`${root}/issues/${config.stateIssue}/comments`)).some((comment) => comment.user?.id === userId && comment.body?.startsWith(claimMarker(task))),
    claim: (task) => request('POST', `${root}/issues/${config.stateIssue}/comments`, { body: `${claimMarker(task)}\nReserved ${task.kind} for PR #${task.pr}, head ${task.head}. Provider writes are not retried.` }),
    requestRepair: (task) => request('POST', `${root}/issues/${task.pr}/comments`, { body: `@copilot Investigate and fix the current Dependabot PR failure at commit ${task.head}, against main ${task.base}. Read the failed CI checks and review findings. Preserve validation commands, existing tests, security audit settings, workflow permissions, controller files and review instructions. Change only registry dependencies/overrides, application source, new tests, runtime version files, or upstream SHA-pinned Actions versions. Do not approve or merge. If credentials, workflow approval, platform infrastructure or protected scope prevents a safe fix, report the blocker and stop. Run the repository checks and push the minimal repair to this existing PR branch. This dispatch consumes one of the two total repair attempts for this PR.\n\n${claimMarker(task)}` }),
    async requestReview(task, pr) {
      if (pr.requested_reviewers?.some((user) => user.id === REVIEWER_ID)) return
      const previous = await list(`${root}/pulls/${task.pr}/reviews`)
      const rerequest = previous.some((review) => review.user?.id === REVIEWER_ID)
      await request('POST', `${root}/pulls/${task.pr}/requested_reviewers${rerequest ? '/rerequest' : ''}`, { reviewers: ['copilot-pull-request-reviewer[bot]'] })
    },
  }
  return client
}

module.exports = { createClient }

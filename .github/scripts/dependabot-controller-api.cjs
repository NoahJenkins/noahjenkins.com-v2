'use strict'
const { GATE, DEPENDABOT_ID, evaluateScope, actionPins } = require('./dependabot-controller-policy.cjs')
const { readLedger, encodeLedger } = require('./dependabot-controller-ledger.cjs')

const { adoptMainBaseline, validateReviewEvidence, validateFiles, text, digest, REVIEW, same } = require('./dependabot-opencode-contract.cjs')
const { parseArtifactZip, verifyRun, verifyJobs, MAX_ZIP } = require('./dependabot-opencode-publish.cjs')
const { createHash } = require('node:crypto')
const CLAIM = '<!-- dependabot-opencode-claim:v1 -->'

function createClient(config, readToken, writeToken, fetcher = fetch) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(config.repo)) throw new Error('Invalid repository')
  const root = `/repos/${config.repo}`
  async function request(method, path, body, useWrite = method !== 'GET', emptyCreated = false) {
    if (!path.startsWith('/') || path.startsWith('//') || /[\r\n]/.test(path)) throw new Error('Invalid API path')
    const response = await fetcher(`https://api.github.com${path}`, {
      method, headers: { Authorization: `Bearer ${useWrite ? writeToken : readToken}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10', 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(20000), redirect: 'error',
    })
    if (!response.ok) throw new Error(`GitHub HTTP ${response.status}: ${method} ${path.split('?')[0]}`)
    if (response.status === 204 || (emptyCreated && response.status === 201)) return null
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
    if (Array.isArray(data) || data.type !== 'file' || data.size > 2 * 1024 * 1024) throw new Error('Unsupported file type or size')
    const blob = data.content ? data : await request('GET', `${root}/git/blobs/${data.sha}`)
    if (blob.encoding !== 'base64') throw new Error('Unsupported file encoding')
    const bytes=Buffer.from(blob.content,'base64');const result=bytes.toString('utf8');text(result,2*1024*1024);if(Buffer.from(result).compare(bytes)!==0)throw Error('Invalid UTF-8 GitHub blob');return result
  }
  async function download(apiPath,max=MAX_ZIP) {
    let response=await fetcher(`https://api.github.com${apiPath}`,{headers:{Authorization:`Bearer ${readToken}`},redirect:'manual',signal:AbortSignal.timeout(20000)})
    if(response.status===302){const location=new URL(response.headers.get('location'));if(location.protocol!=='https:' || location.username || location.password || !(/\.blob\.core\.windows\.net$/.test(location.hostname)||/\.actions\.githubusercontent\.com$/.test(location.hostname)))throw Error('Untrusted download host');response=await fetcher(location.toString(),{redirect:'error',signal:AbortSignal.timeout(20000)})}
    if(!response.ok)throw Error(`GitHub download HTTP ${response.status}`)
    if(Number(response.headers.get('content-length'))>max)throw Error('Download byte limit')
    const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.length;if(size>max)throw Error('Download byte limit');chunks.push(Buffer.from(chunk))}return Buffer.concat(chunks)
  }
  const client = {
    request, list, getFileContent: content,
    getRepo: () => request('GET', root),
    getPr: (number) => request('GET', `${root}/pulls/${number}`),
    getMain: async () => (await request('GET', `${root}/git/ref/heads/main`)).object.sha,
    listPrs: () => list(`${root}/pulls?state=open&base=main`),
    hasDependabotHead: async (sha, excludeNumber) => (await client.listPrs()).some((pr) => pr.user?.id === DEPENDABOT_ID && pr.head.sha === sha && pr.number !== excludeNumber),
    getProtection: () => request('GET', `${root}/branches/main/protection`),
    async getProduction(main) {
      const blocked = (reason) => ({ ready: false, reason: `${reason} Automatic merges are paused. Inspect Vercel production; rollback is manual. See docs/dependabot-controller-setup.md.` })
      // Vercel reports production_environment=false for this repository. The exact
      // Production environment and authenticated publisher identify production.
      const deployments = await request('GET', `${root}/deployments?environment=Production&per_page=1`)
      if (!Array.isArray(deployments) || deployments.length !== 1) return blocked('Current production deployment evidence is missing.')
      const deployment = deployments[0]
      const trusted = (item) => item?.creator?.id === 35613825 && item.creator.type === 'Bot' && item.environment === 'Production'
      if (!trusted(deployment) || !Number.isSafeInteger(deployment.id) || deployment.id < 1 || deployment.sha !== main) return blocked('Latest production deployment is untrusted or does not match current main.')
      const statuses = await request('GET', `${root}/deployments/${deployment.id}/statuses?per_page=1`)
      if (!Array.isArray(statuses) || statuses.length !== 1 || !trusted(statuses[0])) return blocked('Latest production status is missing or untrusted.')
      if (statuses[0].state !== 'success') return blocked('Latest production deployment is not successful.')
      return { ready: true, reason: 'Latest trusted production deployment succeeded for current main.' }
    },
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
      const compare = await request('GET', `${root}/compare/${main}...${pr.head.sha}`)
      const containsMain = ['ahead', 'identical'].includes(compare.status)
      const scopeBase = compare.merge_base_commit?.sha
      if (!['ahead', 'identical', 'behind', 'diverged'].includes(compare.status) || !/^[0-9a-f]{40}$/.test(scopeBase || '') || (containsMain && scopeBase !== main)) throw new Error('Invalid PR merge base evidence')
      // PR file lists describe the delta from this common ancestor. Current main
      // may contain unrelated policy edits until a bounded branch refresh lands.
      const changes = []
      for (const file of files) {
        const needText = ['package.json', 'pnpm-workspace.yaml', '.nvmrc', '.node-version', '.github/workflows/ci.yml', '.github/workflows/dependency-review.yml', '.github/workflows/dependabot-auto-merge.yml'].includes(file.filename)
        changes.push({ ...file, before: needText && file.status === 'modified' ? await content(file.filename, scopeBase) : '', after: needText && !['removed', 'renamed'].includes(file.status) ? await content(file.filename, pr.head.sha) : '' })
      }
      // A published conflict repair can already contain authenticated main-side
      // policy edits while ancestry still needs the bounded branch refresh.
      if(scopeBase!==main)for(let i=0;i<changes.length;i++) {
        const change=changes[i]
        if(change.status==='modified' && change.before && !evaluateScope([change]).allowed)changes[i]=adoptMainBaseline(change,await content(change.filename,main),evaluateScope)
      }
      const scope = evaluateScope(changes)
      if (scope.allowed) await client.verifyActionPins(changes.filter((file) => file.filename.startsWith('.github/workflows/')))
      const workflow = await request('GET', `${root}/actions/workflows/ci.yml`)
      const runs = await list(`${root}/actions/workflows/${workflow.id}/runs?head_sha=${pr.head.sha}&event=pull_request`, 'workflow_runs')
      const ci = runs.filter((run) => run.head_sha === pr.head.sha && run.head_branch === pr.head.ref).sort((a, b) => b.id - a.id)[0]
      const commitPullRequests = Array.isArray(ci?.pull_requests) && ci.pull_requests.length === 0 ? await list(`${root}/commits/${pr.head.sha}/pulls`) : []
      const jobs = ci ? await list(`${root}/actions/runs/${ci.id}/jobs?filter=latest`, 'jobs') : []
      const checks = await checksFor(pr.head.sha)
      const statuses = await list(`${root}/commits/${pr.head.sha}/statuses`)
      const independentReview = await client.getIndependentReview(pr,main,files.map(f=>f.filename),checks)
      return { pr, mainSha: main, repositoryId: config.repositoryId, scope, containsMain, ciWorkflowId: workflow.id, ci, commitPullRequests, jobs, checks, statuses, independentReview, vercelAppId: config.vercelAppId, vercelChecks: checks }
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
      await request('POST', `${root}/pulls/${pr.number}/reviews`, { commit_id: pr.head.sha, event: 'APPROVE', body: 'Authenticated current-head OpenCode review, trusted CI, Vercel and protected scope verified. Native merge remains controlled by the dedicated App gate.' })
    },
    retryCi: (id) => {
      if (!Number.isSafeInteger(id) || id <= 0) throw Error('Invalid retry workflow run')
      return request('POST', `${root}/actions/runs/${id}/rerun`, undefined, true, true)
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
    getRun: (id) => request('GET',`${root}/actions/runs/${id}`),
    getJobs: (id) => list(`${root}/actions/runs/${id}/attempts/1/jobs`,'jobs'),
    async getClaims() {
      if(!config.stateIssue)return []
      const claims=[]
      for(const comment of await list(`${root}/issues/${config.stateIssue}/comments`)){
        if(!comment.body?.startsWith(CLAIM))continue
        if(comment.user?.id!==config.appBotId || comment.user.type!=='Bot')throw Error('Untrusted task claim author')
        const data=JSON.parse(comment.body.slice(CLAIM.length).trim())
        if(!data.task || !data.origin || typeof data.publishAttempted!=='boolean' || typeof data.published!=='boolean')throw Error('Invalid task claim')
        claims.push({...data,id:comment.id})
      }
      if(new Set(claims.map(c=>c.task.nonce)).size!==claims.length)throw Error('Duplicate task claims')
      return claims
    },
    async claimTask(task,origin) {
      const data={task,origin,publishAttempted:false,published:false,digest:null,resultId:null}
      const saved=await request('POST',`${root}/issues/${config.stateIssue}/comments`,{body:`${CLAIM}\n${JSON.stringify(data)}`})
      if(saved.user?.id!==config.appBotId || saved.user.type!=='Bot' || saved.body!==`${CLAIM}\n${JSON.stringify(data)}`)throw Error('Task claim persistence failed')
    },
    async markClaim(claim,fields) {
      const current=(await client.getClaims()).find(c=>c.id===claim.id);same(current,claim)
      const {id,...data}={...claim,...fields}
      const body=`${CLAIM}\n${JSON.stringify(data)}`
      const saved=await request('PATCH',`${root}/issues/comments/${id}`,{body})
      if(saved.user?.id!==config.appBotId || saved.body!==body)throw Error('Claim receipt persistence failed')
      Object.assign(claim,fields)
    },
    async getArtifact(id,expected) {
      const meta=await request('GET',`${root}/actions/artifacts/${id}`)
      if(meta.id!==id || meta.expired || meta.name!==expected.name || meta.workflow_run?.id!==expected.runId || meta.workflow_run.head_sha!==expected.head || meta.workflow_run.head_branch!=='main' || meta.size_in_bytes>MAX_ZIP || !/^sha256:[0-9a-f]{64}$/.test(meta.digest))throw Error('Untrusted artifact metadata')
      const zip=await download(`${root}/actions/artifacts/${id}/zip`)
      if(`sha256:${createHash('sha256').update(zip).digest('hex')}`!==meta.digest)throw Error('Artifact transport digest mismatch')
      return parseArtifactZip(zip)
    },
    async findArtifact(runId,name) {
      const all=await list(`${root}/actions/runs/${runId}/artifacts`,'artifacts');const found=all.filter(a=>a.name===name && !a.expired)
      if(found.length!==1)throw Error('Missing or duplicate artifact')
      return found[0].id
    },
    getWorkerArtifact: async(task,runId)=>client.getArtifact(await client.findArtifact(runId,`worker-${task.nonce}`),{runId,name:`worker-${task.nonce}`,head:task.base}),
    async commitFiles(pr,files) {
      validateFiles(files)
      const input={branch:{repositoryNameWithOwner:config.repo,branchName:pr.head.ref},expectedHeadOid:pr.head.sha,message:{headline:'fix: repair Dependabot validation with OpenCode'},fileChanges:{additions:files.map(f=>({path:f.path,contents:Buffer.from(f.content).toString('base64')}))}}
      const result=await request('POST','/graphql',{query:'mutation($input: CreateCommitOnBranchInput!) { createCommitOnBranch(input: $input) { commit { oid } } }',variables:{input}})
      const id=result.data?.createCommitOnBranch?.commit?.oid;if(!/^[0-9a-f]{40}$/.test(id))throw Error('Atomic commit result is missing');return {id}
    },
    async publishReview(task,artifact,passed) {
      const result=await request('POST',`${root}/check-runs`,{name:REVIEW,head_sha:task.head,status:'completed',conclusion:passed?'success':'failure',external_id:task.nonce,output:{title:passed?'Independent review passed':'Independent review requires action',summary:`Task ${task.nonce}; base ${task.base}; findings remain in the complete JSON report.`,text:JSON.stringify(artifact)}})
      if(result.app?.id!==config.appId || result.head_sha!==task.head || result.external_id!==task.nonce)throw Error('Unexpected review publisher')
      return {id:result.id}
    },
    async getIndependentReview(pr,main,changedFiles,checks) {
      const latest=checks.filter(c=>c.name===REVIEW && c.app?.id===config.appId).sort((a,b)=>b.id-a.id)[0]
      if(!latest)return null
      try {
        const a=JSON.parse(latest.output.text)
        const claim=(await client.getClaims()).find(c=>c.task.nonce===a.task.nonce)
        if(!claim || !claim.published || claim.resultId!==latest.id || claim.task.pr!==pr.number || claim.task.prId!==pr.node_id || a.task.head!==pr.head.sha || a.task.base!==main)return null
        const run=await client.getRun(a.origin.runId)
        verifyRun(run,a.origin,{...config,eventName:run.event,runId:a.origin.runId,runAttempt:1,workflowSha:main,ref:'refs/heads/main'})
        verifyJobs(await client.getJobs(a.origin.runId),a.task,a.origin)
        return validateReviewEvidence(latest,{task:a.task,origin:a.origin,changedFiles,appId:config.appId,claim})
      } catch {return null}
    },
    async prepareSnapshot(task) {
      const pr=await client.getPr(task.pr)
      if(pr.node_id!==task.prId || pr.head.sha!==task.head || pr.base.sha!==task.base || await client.getMain()!==task.base)throw Error('Snapshot head/base changed')
      const files=await list(`${root}/pulls/${task.pr}/files`)
      if(files.length!==pr.changed_files || files.length>64 || !files.length)throw Error('Incomplete snapshot file set')
      const compare=await request('GET',`${root}/compare/${task.base}...${task.head}`)
      const scopeBase=compare.merge_base_commit?.sha
      if(!['ahead','identical','behind','diverged'].includes(compare.status) || !/^[0-9a-f]{40}$/.test(scopeBase || '') || (['ahead','identical'].includes(compare.status) && scopeBase!==task.base))throw Error('Invalid repair merge base evidence')
      // Keep current main available for conflict repair; authorize the PR delta
      // against its common ancestor, matching GitHub's pull-file list.
      const baseFiles={};const headFiles={};const changes=[]
      for(const f of files){if(['removed','renamed'].includes(f.status))throw Error('Unsupported changed file');baseFiles[f.filename]=f.status==='added'?'':await content(f.filename,task.base);headFiles[f.filename]=await content(f.filename,task.head);changes.push({...f,before:f.status==='added'?'':scopeBase===task.base?baseFiles[f.filename]:await content(f.filename,scopeBase),after:headFiles[f.filename]})}
      for(let i=0;i<changes.length;i++)changes[i]=adoptMainBaseline(changes[i],baseFiles[changes[i].filename],evaluateScope)
      const scope=evaluateScope(changes);if(!scope.allowed)throw Error(scope.reason)
      await client.verifyActionPins(changes.filter(f=>f.filename.startsWith('.github/workflows/')))
      const contextFiles={};const tree=await request('GET',`${root}/git/trees/${task.head}?recursive=1`)
      if(tree.truncated)throw Error('Incomplete source tree')
      const existingPaths=tree.tree.filter(f=>f.type==='blob').map(f=>f.path).sort()
      if(existingPaths.length>20000)throw Error('Source inventory capacity')
      const dependencies=['package.json','pnpm-lock.yaml','pnpm-workspace.yaml','.nvmrc','.node-version']
      const entries=tree.tree.filter(f=>f.type==='blob' && (dependencies.includes(f.path) || /^(app|components|lib)\/.+\.(tsx?|jsx?|css)$/.test(f.path)) && !Object.hasOwn(headFiles,f.path))
      if(entries.length>128 || entries.some(f=>f.mode!=='100644' || f.size>2*1024*1024))throw Error('Unsupported source context')
      for(const f of entries)contextFiles[f.path]=await content(f.path,task.head)
      const diagnostics=[]
      if(task.kind==='repair'){
        const state=await client.snapshot(pr,task.base)
        for(const job of state.jobs.filter(j=>j.conclusion==='failure')) {
          const bytes=await download(`${root}/actions/jobs/${job.id}/logs`,1024*1024)
          const log=bytes.toString('utf8');text(log,1024*1024)
          diagnostics.push({job:job.name,log})
        }
        if(state.independentReview)diagnostics.push({review:state.independentReview.report})
      }
      const result={task,changedFiles:files.map(f=>f.filename),baseFiles,headFiles,contextFiles,diagnostics,existingPaths}
      if(Buffer.byteLength(JSON.stringify(result))>8*1024*1024)throw Error('Snapshot byte limit')
      return result
    },
  }
  return client
}

module.exports = { createClient, CLAIM }

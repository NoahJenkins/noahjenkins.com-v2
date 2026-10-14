export {}
const { createClient } = require('../../.github/scripts/dependabot-controller-api.cjs')
const sha = 'a'.repeat(40)
describe('GitHub provider boundary', () => {
  test('uses expectedHeadOid on native auto-merge and never calls direct merge', async () => {
    const requests: any[] = []
    const fetcher = async (url: string, init: any) => { requests.push({ url, ...init }); return { ok: true, status: 200, json: async () => ({ data: { enablePullRequestAutoMerge: { pullRequest: { id: 'PR_1' } } } }) } }
    const client = createClient({ repo: 'o/r', appId: 99 }, 'read-token', 'app-token', fetcher)
    await client.queueMerge({ node_id: 'PR_1', head: { sha } })
    const body = JSON.parse(requests[0].body)
    expect(body.variables).toEqual({ id: 'PR_1', head: sha })
    expect(body.query).toContain('expectedHeadOid: $head')
    expect(requests[0].url).toBe('https://api.github.com/graphql')
    expect(requests[0].headers.Authorization).toBe('Bearer app-token')
  })
  test('passes commit_id on approval and redacts provider errors', async () => {
    const requests: any[] = []
    const fetcher = async (url: string, init: any) => { requests.push({ url, ...init }); return init.method === 'GET' ? { ok: true, status: 200, json: async () => [] } : { ok: false, status: 403, json: async () => ({ message: 'secret must not be printed' }) } }
    const client = createClient({ repo: 'o/r', appId: 99 }, 'read-token', 'app-token', fetcher)
    await expect(client.approve({ number: 1, head: { sha } })).rejects.toThrow('HTTP 403')
    expect(JSON.parse(requests[1].body)).toMatchObject({ commit_id: sha, event: 'APPROVE' })
  })
  test('rejects a check from a different publisher App', async () => {
    const fetcher = async (url: string) => ({ ok: true, status: 200, json: async () => url.includes('/check-runs?') ? { check_runs: [] } : { id: 1, app: { id: 15368 }, head_sha: sha } })
    const client = createClient({ repo: 'o/r', appId: 99 }, 'read-token', 'app-token', fetcher)
    await expect(client.setGate({ head: { sha } }, 'success', 'ready')).rejects.toThrow('publisher')
  })
  test('uses atomic commit file additions with expected head',async()=>{
    const requests:any[]=[]
    const fetcher=async(url:string,init:any)=>{requests.push({url,...init});return {ok:true,status:200,json:async()=>({data:{createCommitOnBranch:{commit:{oid:sha}}}})}}
    const client=createClient({repo:'o/r',appId:99},'read-token','app-token',fetcher)
    await client.commitFiles({head:{sha,ref:'dependabot/npm_and_yarn/x'}},[{path:'package.json',content:'{}'}])
    const input=JSON.parse(requests[0].body).variables.input
    expect(input.expectedHeadOid).toBe(sha)
    expect(input.fileChanges.additions).toEqual([{path:'package.json',contents:Buffer.from('{}').toString('base64')}])
    expect(input.fileChanges).not.toHaveProperty('deletions')
  })
  test('requires an official Action tag pointing to the proposed pin', async () => {
    const fetcher = async () => ({ ok: true, status: 200, json: async () => ({ object: { type: 'commit', sha: 'c'.repeat(40) } }) })
    const client = createClient({ repo: 'o/r', appId: 99 }, 'read-token', 'app-token', fetcher)
    const before = `steps:\n  - uses: actions/setup-node@${'c'.repeat(40)} # v4\n`
    await expect(client.verifyActionPins([{ before, after: before.replace('c'.repeat(40), 'd'.repeat(40)).replace('# v4', '# v7') }])).rejects.toThrow('official')
  })
  test('an existing native squash queue can recover after an interrupted evaluation', async () => {
    const requests: any[] = []
    const fetcher = async (url: string) => { requests.push(url); return { ok: true, status: 200, json: async () => ({}) } }
    const client = createClient({ repo: 'o/r', appId: 99 }, 'read-token', 'app-token', fetcher)
    await client.queueMerge({ node_id: 'PR_1', head: { sha }, auto_merge: { merge_method: 'squash' } })
    expect(requests).toHaveLength(0)
  })
  test('validates a full provider snapshot through the actual policy', async () => {
    const { evaluateCandidate } = require('../../.github/scripts/dependabot-controller-policy.cjs')
    const base = 'b'.repeat(40)
    const pr = { number: 1, changed_files: 1, head: { sha, ref: 'dependabot/npm_and_yarn/x', repo: { id: 1 } }, base: { ref: 'main', sha: base, repo: { id: 1 } }, user: { id: 49699333, type: 'Bot' }, draft: false, state: 'open', mergeable: true, mergeable_state: 'clean' }
    const names = ['Security Audit', 'Jest Tests', 'Playwright Tests', 'TypeScript Check', 'Build Check']
    const checks = names.map((name, i) => ({ id: i+1, name, head_sha: sha, app: { id: 15368 }, status: 'completed', conclusion: 'success' }))
    const responses: any = {
      '/pulls/1/files': [{ filename: 'package.json', status: 'modified' }],
      '/actions/workflows/ci.yml': { id: 8 },
      '/actions/workflows/8/runs': { workflow_runs: [{ id: 9, workflow_id: 8, event: 'pull_request', head_branch: pr.head.ref, head_repository: { id: 1 }, head_sha: sha, status: 'completed', conclusion: 'success', pull_requests: [{ number: 1, base: { sha: base } }] }] },
      '/actions/runs/9/jobs': { jobs: names.map((name, i) => ({ name, status: 'completed', conclusion: 'success', check_run_url: `https://api.github.com/repos/o/r/check-runs/${i+1}` })) },
      [`/commits/${sha}/check-runs`]: { check_runs: [...checks, { head_sha: sha, app: { id: 8329 } }] },
      [`/commits/${sha}/statuses`]: [{ context: 'Vercel', state: 'success', creator: { id: 35613825 }, target_url: 'https://vercel.com/noahs-projects-e38437a2/noahjenkins-com/abc' }],
      '/pulls/1/reviews': [{ id: 1, user: { id: 175728472, type: 'Bot' }, commit_id: sha, state: 'APPROVED' }],
      [`/compare/${base}...${sha}`]: { status: 'ahead' },
    }
    const fetcher = async (url: string) => {
      const parsed = new URL(url); const path = parsed.pathname.replace('/repos/o/r', '')
      const data = path === '/contents/package.json' ? { type: 'file', size: 10, encoding: 'base64', content: Buffer.from(JSON.stringify({ scripts: { test: 'jest' }, dependencies: { next: parsed.searchParams.get('ref') === sha ? '^16.4.0' : '^16.3.8' } })).toString('base64') } : responses[path]
      if (!data) throw new Error(`Unexpected provider route ${path}`)
      return { ok: true, status: 200, json: async () => data }
    }
    const client = createClient({ repo: 'o/r', appId: 99, repositoryId: 1, reviewerId: 175728472, vercelAppId: 8329 }, 'read-token', 'app-token', fetcher)
    // Legacy Copilot approval is not authenticated OpenCode evidence.
    expect(evaluateCandidate(await client.snapshot(pr, base)).kind).toBe('review')
    pr.changed_files = 2
    await expect(client.snapshot(pr, base)).rejects.toThrow('Incomplete')
  })
  test('dereferences an annotated official Action tag', async () => {
    const fetcher = async (url: string) => ({ ok: true, status: 200, json: async () => ({ object: url.includes('/git/tags/') ? { type: 'commit', sha: 'd'.repeat(40) } : { type: 'tag', sha: 'e'.repeat(40) } }) })
    const client = createClient({ repo: 'o/r', appId: 99 }, 'read-token', 'app-token', fetcher)
    const before = `steps:\n  - uses: actions/setup-node@${'c'.repeat(40)} # v4\n`
    await expect(client.verifyActionPins([{ before, after: before.replace('c'.repeat(40), 'd'.repeat(40)).replace('# v4', '# v7') }])).resolves.toBeUndefined()
  })
})
test('durable claims require the App bot and compare-before-update',async()=>{
 const {CLAIM}=require('../../.github/scripts/dependabot-controller-api.cjs')
 const {task,origin}=require('./opencode-fixtures')
 let saved:any=null;let writes=0
 const fetcher=async(_url:string,init:any)=>{
  if(init.method==='GET')return {ok:true,status:200,json:async()=>saved?[saved]:[]}
  writes++;saved={id:1,user:{id:100,type:'Bot'},body:JSON.parse(init.body).body}
  return {ok:true,status:200,json:async()=>saved}
 }
 const client=createClient({repo:'o/r',appBotId:100,stateIssue:9},'read-token','app-token',fetcher)
 await client.claimTask(task,origin)
 const claim=(await client.getClaims())[0]
 await client.markClaim(claim,{publishAttempted:true})
 expect(JSON.parse(saved.body.slice(CLAIM.length)).publishAttempted).toBe(true)
 expect(writes).toBe(2)
 saved.user.id=101
 await expect(client.getClaims()).rejects.toThrow('author')
})
test('snapshot records the complete head inventory and unchanged dependency context',async()=>{
 const {task}=require('./opencode-fixtures');const t={...task,kind:'repair'}
 const before=`steps:\n  - uses: actions/setup-node@${'c'.repeat(40)} # v4\n`;const after=before.replace('c'.repeat(40),'d'.repeat(40)).replace('# v4','# v7')
 const files:any={'.github/workflows/ci.yml':after,'package.json':'{}','pnpm-workspace.yaml':'packages: []','pnpm-lock.yaml':'lock','.nvmrc':'24','test/existing.test.ts':'protected'}
 const pr={node_id:t.prId,number:t.pr,changed_files:1,head:{sha:t.head},base:{sha:t.base}}
 const fetcher=async(url:string)=>{
  const p=new URL(url);let data:any
  if(p.pathname.endsWith(`/pulls/${t.pr}`))data=pr
  else if(p.pathname.endsWith('/git/ref/heads/main'))data={object:{sha:t.base}}
  else if(p.pathname.endsWith('/files'))data=[{filename:'.github/workflows/ci.yml',status:'modified'}]
  else if(p.pathname.includes('/git/trees/'))data={truncated:false,tree:Object.keys(files).map(path=>({path,type:'blob',mode:'100644',size:files[path].length}))}
  else {const filename=p.pathname.split('/contents/')[1];const value=filename==='.github/workflows/ci.yml'&&p.searchParams.get('ref')===t.base?before:files[filename];data={type:'file',size:value.length,encoding:'base64',content:Buffer.from(value).toString('base64')}}
  return {ok:true,status:200,json:async()=>data}
 }
 const client=createClient({repo:'o/r'},'read-token',undefined,fetcher);client.verifyActionPins=async()=>{};client.snapshot=async()=>({jobs:[],independentReview:null})
 const snapshot=await client.prepareSnapshot(t)
 expect(snapshot.existingPaths).toContain('test/existing.test.ts')
 expect(snapshot.contextFiles).toMatchObject({'package.json':'{}','pnpm-workspace.yaml':'packages: []','pnpm-lock.yaml':'lock','.nvmrc':'24'})
})

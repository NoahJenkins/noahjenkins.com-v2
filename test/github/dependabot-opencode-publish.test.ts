import {task,origin,artifact} from './opencode-fixtures'
const {sealArtifact,digest}=require('../../.github/scripts/dependabot-opencode-contract.cjs')
const {publishResult,parseArtifactZip}=require('../../.github/scripts/dependabot-opencode-publish.cjs')
function boundary(kind='review') {
 const raw=artifact(kind);const t=raw.task
 const snapshot={existingPaths:['package.json','pnpm-lock.yaml'],task:t,changedFiles:['package.json','pnpm-lock.yaml'],baseFiles:{'package.json':'{}','pnpm-lock.yaml':'old'},headFiles:{'package.json':'{}','pnpm-lock.yaml':'new'},contextFiles:{}}
 raw.agent.inputDigest=digest(snapshot);raw.agent.configDigest=digest(require('../../.github/scripts/dependabot-opencode-worker.cjs').agentConfig(kind,'http://broker:8080/v1','EPHEMERAL'));const a=sealArtifact(raw)
 const claim:any={id:7,task:t,origin:{...origin},publishAttempted:false,published:false,digest:null};delete claim.origin.jobId
 const pr={number:t.pr,node_id:t.prId,state:'open',draft:false,user:{id:49699333,type:'Bot'},head:{sha:t.head,ref:'dependabot/npm_and_yarn/x',repo:{id:1}},base:{sha:t.base,ref:'main',repo:{id:1}}}
 const client={getClaims:async()=>[claim],getPr:async()=>pr,getMain:async()=>t.base,getRun:async()=>({id:10,event:'schedule',run_attempt:1,head_sha:t.base,head_branch:'main',path:origin.workflowPath,repository:{id:1}}),getJobs:async()=>[{id:20,name:`OpenCode worker (${t.nonce})`,status:'completed',conclusion:'success'},{id:21,name:`OpenCode validation (${t.nonce})`,status:'completed',conclusion:'success'}],getArtifact:async()=>({artifact:a,checks:{inputDigest:a.digest,outputDigest:a.digest,success:true}}),prepareSnapshot:async()=>snapshot,getWorkerArtifact:async()=>a,markClaim:jest.fn(async(_claim:any,fields:any)=>Object.assign(claim,fields)),verifyActionPins:async()=>{},commitFiles:jest.fn(async()=>({id:'commit'})),publishReview:jest.fn(async()=>({id:42}))}
 return {client,claim,a,t,pr,config:{eventName:'schedule',appId:99,repositoryId:1,runId:10,runAttempt:1,workflowSha:t.base,ref:'refs/heads/main'}}
}
test('publishes authenticated review only after durable write intent',async()=>{
 const f=boundary();expect(await publishResult(f.client,f.config,f.t,1,origin)).toEqual({kind:'review',id:42})
 expect(f.claim).toMatchObject({publishAttempted:true,published:true,digest:f.a.digest})
})
test.each(['runId','runAttempt','workflowSha','ref','jobId'])('rejects wrong-run artifact %s without writes',async field=>{
 const f=boundary();const bad={...origin,[field]:field==='runAttempt'?2:'wrong'}
 await expect(publishResult(f.client,f.config,f.t,1,bad)).rejects.toThrow()
 expect(f.client.publishReview).not.toHaveBeenCalled();expect(f.client.commitFiles).not.toHaveBeenCalled()
})
test('rejects replayed artifact or unsuccessful validator',async()=>{
 const f=boundary();f.claim.publishAttempted=true
 await expect(publishResult(f.client,f.config,f.t,1,origin)).rejects.toThrow()
 f.claim.publishAttempted=false;f.client.getJobs=async()=>[]
 await expect(publishResult(f.client,f.config,f.t,1,origin)).rejects.toThrow()
 expect(f.client.publishReview).not.toHaveBeenCalled()
})
test('review rejects changed base',async()=>{
 const f=boundary();f.client.getMain=async()=>'e'.repeat(40)
 await expect(publishResult(f.client,f.config,f.t,1,origin)).rejects.toThrow('changed')
 expect(f.client.publishReview).not.toHaveBeenCalled()
})
test('atomic commit rejects changed head and retains write intent',async()=>{
 const f=boundary('repair');f.client.commitFiles.mockImplementation(async()=>{throw Error('expectedHeadOid mismatch')})
 await expect(publishResult(f.client,f.config,f.t,1,origin)).rejects.toThrow('expectedHeadOid')
 expect(f.claim.publishAttempted).toBe(true);expect(f.claim.published).toBe(false)
})
test('artifact reader never extracts untrusted ZIP paths',()=>{
 expect(()=>parseArtifactZip(Buffer.from('not a ZIP'))).toThrow()
})
function zipFixture(name:string,value:any) {
 const content=Buffer.from(JSON.stringify(value));const filename=Buffer.from(name)
 const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt32LE(content.length,18);local.writeUInt32LE(content.length,22);local.writeUInt16LE(filename.length,26)
 const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50);central.writeUInt32LE(content.length,20);central.writeUInt32LE(content.length,24);central.writeUInt16LE(filename.length,28)
 const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);end.writeUInt32LE(central.length+filename.length,12);end.writeUInt32LE(local.length+filename.length+content.length,16)
 return Buffer.concat([local,filename,content,central,filename,end])
}
test('reads only one bounded JSON ZIP member in memory',()=>{
 const a=sealArtifact(artifact());expect(parseArtifactZip(zipFixture('result.json',a))).toEqual(a)
 expect(()=>parseArtifactZip(zipFixture('../result.json',a))).toThrow()
 const z=zipFixture('result.json',a);z.writeUInt16LE(2,z.length-14)
 expect(()=>parseArtifactZip(z)).toThrow()
})
test('provider transport checks metadata and API SHA256 before JSON acceptance',async()=>{
 const {createClient}=require('../../.github/scripts/dependabot-controller-api.cjs');const {createHash}=require('node:crypto')
 const z=zipFixture('result.json',sealArtifact(artifact()));const hash=`sha256:${createHash('sha256').update(z).digest('hex')}`
 const meta={id:9,name:`worker-${task.nonce}`,expired:false,size_in_bytes:z.length,digest:hash,workflow_run:{id:10,head_sha:task.base,head_branch:'main'}}
 const fetcher=async(url:string)=>url.endsWith('/zip')?{ok:true,status:200,headers:{get:()=>null},body:(async function*(){yield z})()}:{ok:true,status:200,json:async()=>meta}
 const client=createClient({repo:'o/r'},'fixture',undefined,fetcher)
 expect(await client.getArtifact(9,{runId:10,name:meta.name,head:task.base})).toEqual(sealArtifact(artifact()))
 meta.digest=`sha256:${'0'.repeat(64)}`
 await expect(client.getArtifact(9,{runId:10,name:meta.name,head:task.base})).rejects.toThrow('digest')
 meta.digest=hash;meta.workflow_run.id=11
 await expect(client.getArtifact(9,{runId:10,name:meta.name,head:task.base})).rejects.toThrow('metadata')
})
test('publisher independently blocks overwriting a test omitted from content context',async()=>{
 const f=boundary('repair');const snapshot:any=await f.client.prepareSnapshot()
 snapshot.existingPaths=['package.json','pnpm-lock.yaml','test/existing.test.ts']
 const raw=artifact('repair');raw.agent.inputDigest=digest(snapshot);raw.agent.configDigest=f.a.agent.configDigest;raw.result={files:[{path:'test/existing.test.ts',content:'test("fake",()=>{})'}]} as any
 const a=sealArtifact(raw);f.client.getWorkerArtifact=async()=>a;f.client.getArtifact=async()=>({artifact:a,checks:{inputDigest:a.digest,outputDigest:a.digest,success:true}})
 await expect(publishResult(f.client,f.config,f.t,1,origin)).rejects.toThrow('Protected')
 expect(f.client.commitFiles).not.toHaveBeenCalled()
})
test('action-only repair publishes without an unchanged lockfile',async()=>{
 const f=boundary('repair')
 const before=`steps:\n  - uses: actions/setup-node@${'c'.repeat(40)} # v4\n`;const after=before.replace('c'.repeat(40),'d'.repeat(40)).replace('# v4','# v7')
 const snapshot={task:f.t,changedFiles:['.github/workflows/ci.yml'],baseFiles:{'.github/workflows/ci.yml':before},headFiles:{'.github/workflows/ci.yml':before},contextFiles:{'package.json':'{}','pnpm-lock.yaml':'unchanged'},existingPaths:['.github/workflows/ci.yml','package.json','pnpm-lock.yaml']}
 const raw:any=artifact('repair');raw.agent.inputDigest=digest(snapshot);raw.agent.configDigest=f.a.agent.configDigest;raw.result.files=[{path:'.github/workflows/ci.yml',content:after}]
 const a=sealArtifact(raw);(f.client as any).prepareSnapshot=async()=>snapshot;f.client.getWorkerArtifact=async()=>a;f.client.getArtifact=async()=>({artifact:a,checks:{inputDigest:a.digest,outputDigest:a.digest,success:true}})
 expect(await publishResult(f.client,f.config,f.t,1,origin)).toEqual({kind:'repair',id:'commit'})
 expect(f.client.commitFiles).toHaveBeenCalledWith(expect.anything(),raw.result.files)
})

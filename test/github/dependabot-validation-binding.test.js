const runTest=test;
const PREFIX='../../.github/scripts/';
const SOURCE='package.json', LOCK='pnpm-lock.yaml', GENERATE='--lockfile-only';
const SOURCE_BEFORE='{"dependencies":{"example":"1.0.0"}}', SOURCE_AFTER='{"dependencies":{"example":"1.1.0"}}';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createClient} = require(PREFIX+'dependabot-controller-api.cjs');
const {evaluateScope} = require(PREFIX+'dependabot-controller-policy.cjs');
const {validateRepair} = require(PREFIX+'dependabot-opencode-validate.cjs');
const {sealArtifact} = require(PREFIX+'dependabot-opencode-contract.cjs');
const base='b'.repeat(40), head='a'.repeat(40), ancestor='c'.repeat(40);
const task={pr:1,prId:'PR_1',head,base,kind:'repair',nonce:'12345678-1234-1234-1234-123456789abc',createdAt:'2026-10-20T12:00:00.000Z'};
const origin={repositoryId:1,workflowPath:'.github/workflows/dependabot-auto-merge.yml',workflowSha:base,ref:'refs/heads/main',runId:10,runAttempt:1,jobId:20};
const workflow=(sha,command='echo old')=>`jobs:\n  ci:\n    steps:\n      - uses: actions/checkout@${sha} # v4.1.0\n      - run: ${command}\n`;
runTest('workflow scope refuses replacing immutable action SHA with a mutable tag',()=>{
 const filename='.github/workflows/ci.yml', before=workflow(base);
 assert.equal(evaluateScope([{filename,status:'modified',before,after:workflow(head)}]).allowed,true);
 assert.equal(evaluateScope([{filename,status:'modified',before,after:before.replace(base,'v4.1.0')}]).allowed,false);
});
runTest('repair snapshot scopes against common ancestor and retains current main for conflict repair',async()=>{
 const filename='.github/workflows/ci.yml';
 let comparison={status:'diverged',merge_base_commit:{sha:ancestor}};
 let candidate=workflow(head);
 const reads=[];
 const client=createClient({repo:'o/r'},'read','write',async url=>{
  const u=new URL(url);let data;
  if(u.pathname.endsWith('/pulls/1'))data={number:1,node_id:task.prId,head:{sha:head},base:{sha:base},changed_files:1};
  else if(u.pathname.endsWith('/git/ref/heads/main'))data={object:{sha:base}};
  else if(u.pathname.endsWith('/files'))data=[{filename,status:'modified'}];
  else if(u.pathname.includes('/compare/'))data=comparison;
  else if(u.pathname.includes('/git/trees/'))data={truncated:false,tree:[{path:filename,type:'blob',mode:'100644',size:100}]};
  else if(u.pathname.includes('/contents/')){
   const ref=u.searchParams.get('ref');reads.push(ref);
   const content=ref===ancestor?workflow(base):ref===base?workflow(base,'echo main policy'):candidate;
   data={type:'file',size:content.length,encoding:'base64',content:Buffer.from(content).toString('base64')};
  }else throw Error('Unexpected API '+u.pathname);
  return {ok:true,status:200,json:async()=>data};
 });
 client.verifyActionPins=async()=>{};
 client.snapshot=async()=>({jobs:[],independentReview:null});
 const snapshot=await client.prepareSnapshot(task);
 assert.ok(reads.includes(ancestor));
 assert.equal(snapshot.baseFiles[filename],workflow(base,'echo main policy'));
 assert.equal(snapshot.headFiles[filename],workflow(head));
 assert.equal(snapshot.ancestorFiles[filename],workflow(base));
 candidate=workflow(head,'echo main policy');
 assert.equal((await client.prepareSnapshot(task)).headFiles[filename],candidate);
 candidate=workflow(head,'echo unsafe PR command');
 await assert.rejects(()=>client.prepareSnapshot(task),/Protected|unsupported/i);
 candidate=workflow(head);
 for(const invalid of [{status:'diverged'},{status:'unknown',merge_base_commit:{sha:ancestor}},{status:'ahead',merge_base_commit:{sha:ancestor}}]){
  comparison=invalid;await assert.rejects(()=>client.prepareSnapshot(task),/merge base/i);
 }
});
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'validation-binding-'));
 const before=SOURCE_BEFORE, after=SOURCE_AFTER;
 const snapshot={changedFiles:[SOURCE],existingPaths:[SOURCE,LOCK],headFiles:{[SOURCE]:before,[LOCK]:'old lock'}};
 fs.writeFileSync(path.join(root,SOURCE),before);fs.writeFileSync(path.join(root,LOCK),'old lock');
 const artifact=sealArtifact({version:1,task,origin,agent:{runtimeVersion:'1.19.0',provider:'opencode-go',model:'kimi-k2.7-code',sessionId:'ses_fixture',configDigest:'c'.repeat(64),inputDigest:'d'.repeat(64)},result:{files:[{path:SOURCE,content:after}]}});
 return {root,snapshot,artifact,after};
}
runTest('validator publishes the bytes checked after dependency generation',async()=>{
 const f=fixture();const commands=[];
 try{
  const result=await validateRepair(task,f.snapshot,f.artifact,{origin,root:f.root,image:'fixture',cleanup:()=>{},execute:args=>{
   commands.push(args.at(-1));if(commands.length===1)fs.writeFileSync(path.join(f.root,LOCK),'generated lock');
  }});
  assert.equal(commands.length,2);
  assert.ok(!commands[1].includes(GENERATE));
  assert.equal(result.artifact.result.files.find(file=>file.path===SOURCE).content,f.after);
  assert.equal(result.artifact.result.files.find(file=>file.path===LOCK).content,'generated lock');
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
runTest('validator rejects submitted source changes during generation or validation and lock changes during validation',async()=>{
 for(const [phase,target] of [[1,SOURCE],[2,SOURCE],[2,LOCK]]){
  const f=fixture();let calls=0;
  try{
   await assert.rejects(()=>validateRepair(task,f.snapshot,f.artifact,{origin,root:f.root,image:'fixture',cleanup:()=>{},execute:()=>{
    calls++;if(calls===1)fs.writeFileSync(path.join(f.root,LOCK),'generated lock');
    if(calls===phase)fs.writeFileSync(path.join(f.root,target),'untested bytes');
   }}),/changed during|mutated/i);
  }finally{fs.rmSync(f.root,{recursive:true,force:true});}
 }
});

function mainAdoptionFixture(){
 const f=fixture();
 const main=SOURCE==='package.json'?JSON.stringify({...JSON.parse(SOURCE_BEFORE),scripts:{test:'trusted-main-test'}}):SOURCE_BEFORE+'\n// trusted main assertion\n';
 const after=SOURCE==='package.json'?JSON.stringify({...JSON.parse(SOURCE_AFTER),scripts:{test:'trusted-main-test'}}):SOURCE_AFTER+'\n// trusted main assertion\n';
 f.snapshot.headFiles[SOURCE]=SOURCE_AFTER;
 f.snapshot.baseFiles={[SOURCE]:main};f.snapshot.task=task;
 f.artifact=sealArtifact({...f.artifact,result:{files:[{path:SOURCE,content:after}]}});
 return {...f,main,after};
}
runTest('validator accepts approved dependency changes while preserving authenticated main policy',async()=>{
 const f=mainAdoptionFixture();
 try{
  const result=await validateRepair(task,f.snapshot,f.artifact,{origin,root:f.root,image:'fixture',cleanup:()=>{},execute:()=>{}});
  assert.equal(result.artifact.result.files.find(file=>file.path===SOURCE).content,f.after);
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
runTest('main-side fallback rejects erasing the dependency target before running validation',async()=>{
 const f=mainAdoptionFixture();let calls=0;
 try{
  const artifact=sealArtifact({...f.artifact,result:{files:[{path:SOURCE,content:f.main}]}});
  await assert.rejects(()=>validateRepair(task,f.snapshot,artifact,{origin,root:f.root,image:'fixture',cleanup:()=>{},execute:()=>{calls++;}}),/Protected|unsupported/i);
  assert.equal(calls,0);
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
runTest('main-side fallback cannot authorize new protected edits or unrelated base content',async()=>{
 const f=mainAdoptionFixture();
 try{
  const bad=SOURCE==='package.json'?f.after.replace('trusted-main-test','evil-command'):f.after.replace('trusted main assertion','removed assertion');
  await assert.rejects(()=>validateRepair(task,f.snapshot,sealArtifact({...f.artifact,result:{files:[{path:SOURCE,content:bad}]}}),{origin,root:f.root,image:'fixture',cleanup:()=>{},execute:()=>{}}),/Protected|unsupported/i);
  for(const snapshot of [{...f.snapshot,baseFiles:{}},{...f.snapshot,changedFiles:[LOCK]}]){
   await assert.rejects(()=>validateRepair(task,snapshot,f.artifact,{origin,root:f.root,image:'fixture',cleanup:()=>{},execute:()=>{}}),/Protected|unsupported/i);
  }
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
runTest('publisher independently authorizes main-side adoption and rejects policy changes',async()=>{
 const f=mainAdoptionFixture();
 const {digest}=require(PREFIX+'dependabot-opencode-contract.cjs');
 const {agentConfig}=require(PREFIX+'dependabot-opencode-worker.cjs');
 const {publishResult}=require(PREFIX+'dependabot-opencode-publish.cjs');
 try{
  let artifact=sealArtifact({...f.artifact,agent:{...f.artifact.agent,inputDigest:digest(f.snapshot),configDigest:digest(agentConfig('repair','http://broker:8080/v1','EPHEMERAL'))}});
  const claim={id:1,task,origin:{...origin}};delete claim.origin.jobId;
  const pr={number:task.pr,node_id:task.prId,state:'open',draft:false,user:{id:49699333,type:'Bot'},head:{sha:head,ref:SOURCE==='package.json'?'dependabot/npm_and_yarn/x':'dependabot/go_modules/x',repo:{id:1}},base:{sha:base,ref:'main',repo:{id:1}}};
  const config={eventName:'schedule',repositoryId:1,workflowSha:base,ref:'refs/heads/main',runAttempt:1,runId:10};
  let writes=0;
  const client={getClaims:async()=>[claim],getPr:async()=>pr,getMain:async()=>base,
   getRun:async()=>({id:10,event:'schedule',repository:{id:1},run_attempt:1,head_branch:'main',head_sha:base,path:origin.workflowPath}),
   getJobs:async()=>[{id:20,name:`OpenCode worker (${task.nonce})`,status:'completed',conclusion:'success'},{id:21,name:`OpenCode validation (${task.nonce})`,status:'completed',conclusion:'success'}],
   prepareSnapshot:async()=>f.snapshot,getArtifact:async()=>({artifact,checks:{inputDigest:artifact.digest,outputDigest:artifact.digest,success:true}}),getWorkerArtifact:async()=>artifact,
   verifyActionPins:async()=>{},verifyRepairPins:async()=>{},markClaim:async()=>{},commitFiles:async(_pr,files)=>{writes++;assert.equal(files[0].content,f.after);return {id:'commit'};}};
  assert.deepEqual(await publishResult(client,config,task,1,origin),{kind:'repair',id:'commit'});
  assert.equal(writes,1);
  const bad=SOURCE==='package.json'?f.after.replace('trusted-main-test','evil-command'):f.after.replace('trusted main assertion','removed assertion');
  artifact=sealArtifact({...artifact,result:{files:[{path:SOURCE,content:bad}]}});
  await assert.rejects(()=>publishResult(client,config,task,1,origin),/Protected|unsupported/i);
  assert.equal(writes,1);
  artifact=sealArtifact({...artifact,result:{files:[{path:SOURCE,content:f.main}]}});
  await assert.rejects(()=>publishResult(client,config,task,1,origin),/Protected|unsupported/i);
  assert.equal(writes,1);
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});

runTest('main-side immutable workflow pin adoption remains pinned and passes upstream validation',async()=>{
 const {scopeChanges}=require(PREFIX+'dependabot-opencode-contract.cjs');
 const filename='.github/workflows/ci.yml';
 const main=workflow(base), old=main.replace(base,'v4.1.0');
 const snapshot={changedFiles:[filename],existingPaths:[filename],headFiles:{[filename]:old},baseFiles:{[filename]:main}};
 const changes=scopeChanges([{path:filename,content:main}],snapshot,evaluateScope);
 assert.equal(evaluateScope(changes).allowed,true);assert.equal(changes[0].before,main);
 let reads=0;const client=createClient({repo:'o/r'},'read','write',async()=>{reads++;throw Error('Trusted unchanged main pin needs no lookup');});
 await client.verifyActionPins(changes);assert.equal(reads,0);
 const bad=main.replace('echo old','echo evil');
 assert.equal(evaluateScope(scopeChanges([{path:filename,content:bad}],snapshot,evaluateScope)).allowed,false);
});

runTest('main fallback cannot restore an older mutable action tag over a current immutable pin',()=>{
 const {scopeChanges}=require(PREFIX+'dependabot-opencode-contract.cjs');
 const filename='.github/workflows/ci.yml';
 for(const current of [workflow(head),workflow(head).replace(' # v4.1.0','')]){
  const legacy=workflow(base).replace(base,'v4.1.0');
  const snapshot={changedFiles:[filename],existingPaths:[filename],headFiles:{[filename]:current},baseFiles:{[filename]:legacy}};
  assert.equal(evaluateScope(scopeChanges([{path:filename,content:legacy}],snapshot,evaluateScope)).allowed,false);
 }
});

runTest('64 submitted files remain valid when the generated lockfile is unchanged',async()=>{
 const f=fixture();
 const files=Array.from({length:64},(_,i)=>({path:`app/fixture${i}.ts`,content:"export const value=2;"}));
 const snapshot={task,changedFiles:files.map(f=>f.path),existingPaths:[LOCK,...files.map(f=>f.path)],headFiles:{[LOCK]:'old lock',...Object.fromEntries(files.map(f=>[f.path,"export const value=1;"]))}};
 const artifact=sealArtifact({...f.artifact,result:{files}});
 try{
  const result=await validateRepair(task,snapshot,artifact,{origin,root:f.root,image:'fixture',cleanup:()=>{},execute:()=>{}});
  assert.equal(result.artifact.result.files.length,64);
  // The publishable artifact still has the original 64-file maximum.
  await assert.rejects(()=>validateRepair(task,snapshot,artifact,{origin,root:f.root,image:'fixture',cleanup:()=>{},execute:()=>fs.writeFileSync(path.join(f.root,LOCK),'changed lock')}),/file count/i);
  await assert.rejects(()=>validateRepair(task,snapshot,sealArtifact({...artifact,result:{files:[...files,{path:'packages/extra/package.json',content:SOURCE_AFTER}]}}),{origin,root:f.root,image:'fixture',cleanup:()=>{},execute:()=>{}}),/file count/i);
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});

runTest('main adoption preserves every grouped dependency target and rejects partial rollback',()=>{
 const {scopeChanges}=require(PREFIX+'dependabot-opencode-contract.cjs');
 const filename='package.json';
 const current={dependencies:{example:'1.1.0',second:'2.1.0'},engines:{node:'24.1.0'}};
 const main={dependencies:{example:'1.0.0',second:'2.0.0'},engines:{node:'24.0.0'},scripts:{test:'trusted-main'}};
 const candidate={...main,...current};
 const snapshot={changedFiles:[filename],existingPaths:[filename],headFiles:{[filename]:JSON.stringify(current)},baseFiles:{[filename]:JSON.stringify(main)}};
 const allowed=value=>evaluateScope(scopeChanges([{path:filename,content:JSON.stringify(value)}],snapshot,evaluateScope)).allowed;
 assert.equal(allowed(candidate),true);
 assert.equal(allowed({...candidate,dependencies:{...candidate.dependencies,example:'1.0.0'}}),false);
 assert.equal(allowed({...candidate,dependencies:{second:'2.1.0'}}),false);
 assert.equal(allowed({...candidate,engines:main.engines}),false);
});
runTest('main adoption cannot replace an action update with the old main version',()=>{
 const {scopeChanges}=require(PREFIX+'dependabot-opencode-contract.cjs');
 const filename='.github/workflows/ci.yml';
 const current=workflow(head).replace('v4.1.0','v4.2.0');
 const main=workflow(base,'echo trusted main');
 const snapshot={changedFiles:[filename],existingPaths:[filename],headFiles:{[filename]:current},baseFiles:{[filename]:main}};
 const allowed=value=>evaluateScope(scopeChanges([{path:filename,content:value}],snapshot,evaluateScope)).allowed;
 assert.equal(allowed(main),false);
 assert.equal(allowed(current.replace('echo old','echo trusted main')),true);
});

runTest('main policy adoption keeps override targets and independent main additions',()=>{
 const {scopeChanges}=require(PREFIX+'dependabot-opencode-contract.cjs');
 const filename='pnpm-workspace.yaml';
 const current="packages:\n  - 'apps/*'\noverrides:\n  example: '1.1.0'\n  second: '2.1.0'\n";
 const main="packages:\n  - 'apps/*'\n  - 'packages/*'\noverrides:\n  example: '1.0.0'\n  second: '2.0.0'\n  extra: '3.0.0'\n";
 const snapshot={changedFiles:[filename],existingPaths:[filename],headFiles:{[filename]:current},baseFiles:{[filename]:main}};
 const allowed=value=>evaluateScope(scopeChanges([{path:filename,content:value}],snapshot,evaluateScope)).allowed;
 assert.equal(allowed(main),false);
 assert.equal(allowed(main.replace('1.0.0','1.1.0')),false);
 assert.equal(allowed(main.replace('1.0.0','1.1.0').replace('2.0.0','2.1.0')),true);
});
runTest('main adoption preserves same-tag SHA changes and workflow Node targets',()=>{
 const {scopeChanges}=require(PREFIX+'dependabot-opencode-contract.cjs');
 const filename='.github/workflows/ci.yml';
 const current=workflow(head)+'      - uses: actions/setup-node@'+head+' # v4.1.0\n        with:\n          node-version: 24.1.0\n';
 const main=current.replaceAll(head,base).replace('echo old','echo trusted main').replace('24.1.0','24.0.0');
 const candidate=current.replace('echo old','echo trusted main');
 const snapshot={changedFiles:[filename],existingPaths:[filename],headFiles:{[filename]:current},baseFiles:{[filename]:main}};
 const allowed=value=>evaluateScope(scopeChanges([{path:filename,content:value}],snapshot,evaluateScope)).allowed;
 assert.equal(allowed(main),false);
 assert.equal(allowed(candidate),true);
 assert.equal(allowed(candidate.replace('24.1.0','24.0.0')),false);
});

runTest('main baseline adoption cannot move immutable pins between repeated action steps',()=>{
 const {adoptMainBaseline}=require(PREFIX+'dependabot-opencode-contract.cjs');
 const filename='.github/workflows/ci.yml';
 const current=workflow(head)+'      - uses: actions/checkout@v4.1.0\n';
 const main=workflow(head).replace(head,'v4.1.0')+'      - uses: actions/checkout@'+head+' # v4.1.0\n';
 const change={filename,status:'modified',before:current,after:main};
 assert.equal(evaluateScope([adoptMainBaseline(change,main,evaluateScope)]).allowed,false);
});

runTest('main-side comments and job settings do not change immutable step identity',()=>{
 const {adoptMainBaseline}=require(PREFIX+'dependabot-opencode-contract.cjs');
 const filename='.github/workflows/ci.yml';
 const current=workflow(head);
 for(const line of ['    # trusted main comment\n','    timeout-minutes: 10\n']) {
  const main=workflow(base).replace('    steps:',line+'    steps:');
  const candidate=main.replace(base,head);
  assert.equal(evaluateScope([adoptMainBaseline({filename,status:'modified',before:current,after:candidate},main,evaluateScope)]).allowed,true);
 }
});
runTest('main-side fallback cannot erase quoted or uncommented immutable targets',()=>{
 const {scopeChanges}=require(PREFIX+'dependabot-opencode-contract.cjs');
 const filename='.github/workflows/ci.yml';
 for(const uses of [`actions/checkout@${head}`,`"actions/checkout@${head}"`,`'actions/checkout@${head}'`]) {
  const current='jobs:\n  ci:\n    steps:\n      - uses: '+uses+'\n      - run: echo old\n';
  const main=current.replaceAll(head,base).replace('echo old','echo trusted main');
  const snapshot={changedFiles:[filename],existingPaths:[filename],headFiles:{[filename]:current},baseFiles:{[filename]:main}};
  assert.equal(evaluateScope(scopeChanges([{path:filename,content:main}],snapshot,evaluateScope)).allowed,false);
 }
});

runTest('immutable step identity is job scoped and ignores run script text',()=>{
 const {adoptMainBaseline}=require(PREFIX+'dependabot-opencode-contract.cjs');
 const filename='.github/workflows/ci.yml';
 const build=workflow(head).replace('  ci:','  build:');
 const checks=workflow(head).replace('  ci:','  checks:').replace('jobs:\n','');
 const current=build+checks;
 const main='jobs:\n'+checks+'  build:\n    timeout-minutes: 10\n    steps:\n      - uses: actions/checkout@'+head+' # v4.1.0\n      - run: |\n          uses: actions/fake@'+base+'\n';
 assert.equal(evaluateScope([adoptMainBaseline({filename,status:'modified',before:current,after:main},main,evaluateScope)]).allowed,true);
});

runTest('main adoption accepts CRLF quoted and uncommented action references',()=>{
 const {scopeChanges}=require(PREFIX+'dependabot-opencode-contract.cjs');
 const filename='.github/workflows/ci.yml';
 const policy=changes=>({allowed:changes.every(c=>c.before.replace(/[a-f0-9]{40}/g,'PIN')===c.after.replace(/[a-f0-9]{40}/g,'PIN'))});
 for(const uses of [`actions/checkout@${head}`,`"actions/checkout@${head}"`,`'actions/checkout@${head}'`,`actions/checkout@${head} # v4.1.0`]) {
  const current='jobs:\n  ci:\n    steps:\n      - uses: '+uses+'\n      - run: echo old\n';
  const main=current.replace(head,base).replace('echo old','echo trusted main').replaceAll('\n','\r\n');
  const snapshot={changedFiles:[filename],existingPaths:[filename],headFiles:{[filename]:current},baseFiles:{[filename]:main}};
  assert.equal(policy(scopeChanges([{path:filename,content:main.replaceAll(base,head)}],snapshot,policy)).allowed,true);
  const reverted=main.replaceAll(head,base);
  assert.equal(policy(scopeChanges([{path:filename,content:reverted}],snapshot,policy)).allowed,false);
 }
});

runTest('main adoption recognizes anchored job declarations without treating nested keys as jobs',()=>{
 const {scopeChanges}=require(PREFIX+'dependabot-opencode-contract.cjs');
 const filename='.github/workflows/ci.yml';
 const current=workflow(head).replace('  ci:','  test: &base_job')+workflow(head).replace('jobs:\n','').replace('  ci:','  lint: &lint_job');
 const main=current.replaceAll('echo old','echo trusted main').replaceAll(head,base);
 const snapshot={changedFiles:[filename],existingPaths:[filename],headFiles:{[filename]:current},baseFiles:{[filename]:main}};
 assert.equal(evaluateScope(scopeChanges([{path:filename,content:main.replaceAll('uses: actions/checkout@'+base+' # v4.1.0','uses: actions/checkout@'+head+' # v4.1.0')}],snapshot,evaluateScope)).allowed,true);
 assert.equal(evaluateScope(scopeChanges([{path:filename,content:main}],snapshot,evaluateScope)).allowed,false);
});
runTest('environment and input keys named uses are not executable action references',()=>{
 const {scopeChanges}=require(PREFIX+'dependabot-opencode-contract.cjs');
 const filename='.github/workflows/ci.yml';
 for(const value of ['ordinary input',`actions/checkout@${base}`]) {
  const current='jobs:\n  ci:\n    env:\n      uses: '+value+'\n    steps:\n      - uses: actions/checkout@'+head+' # v4.1.0\n        with:\n          uses: '+value+'\n      - run: echo old\n';
  const main=current.replace('echo old','echo trusted main').replace(head,base);
  const snapshot={changedFiles:[filename],existingPaths:[filename],headFiles:{[filename]:current},baseFiles:{[filename]:main}};
  assert.equal(evaluateScope(scopeChanges([{path:filename,content:main.replaceAll('uses: actions/checkout@'+base+' # v4.1.0','uses: actions/checkout@'+head+' # v4.1.0')}],snapshot,evaluateScope)).allowed,true);
  assert.equal(evaluateScope(scopeChanges([{path:filename,content:main}],snapshot,evaluateScope)).allowed,false);
 }
});

runTest('bare sequence steps retain immutable dependency targets during main adoption',()=>{
 const {scopeChanges}=require(PREFIX+'dependabot-opencode-contract.cjs');
 const filename='.github/workflows/ci.yml';
 for(const marker of ['-', '- # executable step']) {
  const current=workflow(head).replace('- uses:',marker+'\n        uses:');
  const main=current.replace(head,base).replace('echo old','echo trusted main');
  const snapshot={changedFiles:[filename],existingPaths:[filename],headFiles:{[filename]:current},baseFiles:{[filename]:main}};
  // Isolate the target-retention guard from scope normalization.
  const policy=changes=>({allowed:changes[0].before===main});
  assert.equal(policy(scopeChanges([{path:filename,content:main}],snapshot,policy)).allowed,false);
 }
});
runTest('scope and upstream verification use executable references in every supported layout',async()=>{
 const filename='.github/workflows/ci.yml';
 const forms=[
  sha=>workflow(sha).replace('actions/checkout@'+sha,'"actions/checkout@'+sha+'"'),
  sha=>workflow(sha).replace('- uses:', '-\n        uses:'),
  sha=>`jobs:\n  reuse:\n    uses: org/repo/.github/workflows/build.yml@${sha} # v4.1.0\n`,
  sha=>workflow(sha).replaceAll('\n','\r\n'),
 ];
 for(const form of forms){
  const before=form(base),after=form(head),change={filename,status:'modified',before,after};
  assert.equal(evaluateScope([change]).allowed,true);
  const reads=[];
  const client=createClient({repo:'o/r'},'read','write',async url=>{
   reads.push(new URL(url).pathname);
   return {ok:true,status:200,json:async()=>({object:{type:'commit',sha:head}})};
  });
  await client.verifyActionPins([change]);
  assert.equal(reads.length,1);assert.match(reads[0],/\/git\/ref\/tags\/v4\.1\.0$/);
  assert.equal(evaluateScope([{...change,after:after.replace(head,'v4.1.0')}]).allowed,false);
 }
 const before=workflow(base)+'        with:\n          uses: ordinary input\n';
 assert.equal(evaluateScope([{filename,status:'modified',before,after:before.replace('ordinary input','changed input')}]).allowed,false);
});

runTest('flow executable mappings retain references and protected configuration',async()=>{
 const filename='.github/workflows/ci.yml';
 const forms=[sha=>`jobs:\n  ci:\n    steps:\n      - { uses: actions/checkout@${sha}, with: { uses: input, path: 'a,b' } } # v4.1.0\n`,
 sha=>`jobs:\n  reuse: { uses: org/repo/.github/workflows/build.yml@${sha}, with: { value: safe } } # v4.1.0\n`,
 sha=>`jobs:\n  ci:\n    steps: [\n      { uses: actions/checkout@${sha} }, # v4.1.0\n      { run: 'echo safe' }\n    ]\n`];
 for(const form of forms){
  const before=form(base),after=form(head),change={filename,status:'modified',before,after};
  assert.equal(evaluateScope([change]).allowed,true);
  assert.equal(evaluateScope([{...change,after:after.replace(head,'v4.1.0')}]).allowed,false);
  assert.equal(evaluateScope([{...change,after:after.replace('safe','changed').replace('input','changed')}]).allowed,false);
  const calls=[];const client=createClient({repo:'o/r'},'read','write',async url=>{calls.push(url);return {ok:true,status:200,json:async()=>({object:{type:'commit',sha:head}})};});
  await client.verifyActionPins([change]);assert.equal(calls.length,1);
 }
});
runTest('main-side action insertions align through the authenticated ancestor',()=>{
 const {scopeChanges}=require(PREFIX+'dependabot-opencode-contract.cjs');
 const filename='.github/workflows/ci.yml',old=workflow(base),current=workflow(head);
 const inserted='      - uses: actions/checkout@'+ancestor+' # v4.1.0\n';
 const main=old.replace('    steps:\n','    steps:\n'+inserted).replace('echo old','echo trusted main');
 const candidate=main.replace(base,head);
 const snapshot={changedFiles:[filename],existingPaths:[filename],headFiles:{[filename]:current},baseFiles:{[filename]:main},ancestorFiles:{[filename]:old}};
 const allowed=content=>evaluateScope(scopeChanges([{path:filename,content}],snapshot,evaluateScope)).allowed;
 assert.equal(allowed(candidate),true);
 assert.equal(allowed(main),false);
 assert.equal(allowed(main.replace(ancestor,head)),false);
 const atTarget={...snapshot,baseFiles:{[filename]:main.replace(ancestor,head)}};
 assert.equal(evaluateScope(scopeChanges([{path:filename,content:atTarget.baseFiles[filename]}],atTarget,evaluateScope)).allowed,false);
 assert.equal(evaluateScope(scopeChanges([{path:filename,content:atTarget.baseFiles[filename].replace(base,head)}],atTarget,evaluateScope)).allowed,true);
 const ambiguous={...snapshot,baseFiles:{[filename]:main.replace(ancestor,base)}};
 assert.equal(evaluateScope(scopeChanges([{path:filename,content:candidate.replace(ancestor,base)}],ambiguous,evaluateScope)).allowed,false);
});

runTest('flow parsing retains data scalars and fails closed on ambiguous syntax',()=>{
 const {expandWorkflowFlow}=require(PREFIX+'dependabot-workflow-shape.cjs');
 const {adoptMainBaseline}=require(PREFIX+'dependabot-opencode-contract.cjs');
 const filename='.github/workflows/ci.yml';
 const before=`jobs: { ci: { steps: [{ uses: actions/checkout@${base}, with: { text: 'a,b:#{}', quote: 'it''s safe' } }] } } # v4.1.0\n`;
 const expanded=expandWorkflowFlow(before);
 assert.ok(expanded.includes("text: 'a,b:#{}'"));assert.ok(expanded.includes("quote: 'it''s safe'"));
 const script='jobs:\n  ci:\n    steps:\n      - run: |\n          value: {not: yaml}\n';
 assert.equal(expandWorkflowFlow(script),script);
 for(const invalid of ['jobs:\n  ci:\n    steps:\n      - {uses: a/b@v1, uses: c/d@v2}\n','jobs:\n  ci:\n    steps:\n      - {uses: a/b@v1\n']){
  const change={filename,status:'modified',before:workflow(head),after:invalid};
  assert.equal(evaluateScope([change]).allowed,false);
  assert.deepEqual(adoptMainBaseline(change,invalid,evaluateScope),change);
 }
});

runTest('repair and generated output cannot exceed the PR-wide review capacity',async()=>{
 const {scopeChanges}=require(PREFIX+'dependabot-opencode-contract.cjs');
 const f=fixture();
 const original=[SOURCE,...Array.from({length:63},(_,i)=>`existing${i}.json`)];
 f.snapshot.changedFiles=original;
 const extra={path:'extra.json',content:'{}'};
 assert.throws(()=>scopeChanges([extra],f.snapshot,evaluateScope),/review capacity/i);
 let executions=0;
 try{
  await assert.rejects(()=>validateRepair(task,f.snapshot,f.artifact,{origin,root:f.root,image:'fixture',cleanup:()=>{},execute:()=>{executions++;fs.writeFileSync(path.join(f.root,LOCK),'generated change');}}),/review capacity/i);
  assert.equal(executions,1);
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});

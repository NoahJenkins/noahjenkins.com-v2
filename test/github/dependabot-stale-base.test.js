const runTest = test
const REVIEW_PREFIX = '../../.github/scripts/'
const assert = require('node:assert/strict')
const {reconcileOne} = require(REVIEW_PREFIX+'dependabot-controller.cjs')
function staleBaseFixture() {
 const oldBase='c'.repeat(40), main='b'.repeat(40), head='a'.repeat(40);
 const pr={number:1,node_id:'PR_one',state:'open',draft:false,mergeable:true,mergeable_state:'behind',user:{id:49699333,type:'Bot'},head:{sha:head,ref:'dependabot/github_actions/x',repo:{id:1}},base:{sha:oldBase,ref:'main',repo:{id:1}}};
 const events=[],state={ledger:{version:1,reservations:[]}},tasks=[];
 const config={repositoryId:1,automationEnabled:true,agentEnabled:true,workflowSha:main,eventName:'schedule',workSourceVerified:true,runAttempt:1,ref:'refs/heads/main',now:'2026-10-21T12:00:00.000Z'};
 const input={pr,repositoryId:1,mainSha:main,containsMain:false,scope:{allowed:true},classification:{eligible:true},productionHealthy:true,releaseHealth:{kind:'ready'}};
 const client={getPr:async()=>JSON.parse(JSON.stringify(pr)),getMain:async()=>main,hasDependabotHead:async()=>false,getProduction:async()=>({ready:true}),getReleaseHealth:async()=>({kind:'ready'}),snapshot:async()=>input,setGate:async(_pr,kind)=>events.push('gate:'+kind),saveLedger:async()=>events.push('reserve'),updateBranch:async()=>events.push('refresh')};
 return {pr,main,input,client,config,state,tasks,events};
}
runTest('stale PR base metadata permits only a bounded branch refresh',async()=>{
 const f=staleBaseFixture();const {evaluateCandidate}=require(REVIEW_PREFIX+'dependabot-controller-policy.cjs');
 assert.equal(evaluateCandidate(f.input).kind,'refresh');
 await reconcileOne(f.client,f.config,1,f.state,f.tasks);
 assert.deepEqual(f.events,['gate:pending','reserve','refresh','gate:waiting']);
 assert.equal(f.state.ledger.reservations.length,1);assert.equal(f.state.ledger.reservations[0].base,f.main);assert.equal(f.tasks.length,0);
});
runTest('stale metadata never authorizes merge or unknown/conflicting refresh',()=>{
 const {evaluateCandidate}=require(REVIEW_PREFIX+'dependabot-controller-policy.cjs');
 for(const mutate of [f=>f.input.containsMain=true,f=>f.pr.mergeable=null,f=>{f.pr.mergeable=false;f.pr.mergeable_state='dirty'},f=>f.input.scope.allowed=false]){
  const f=staleBaseFixture();mutate(f);assert.ok(['waiting','blocked'].includes(evaluateCandidate(f.input).kind));
 }
});
for(const changed of ['head','base','main'])runTest('stale-base refresh stops when '+changed+' changes after reservation',async()=>{
 const f=staleBaseFixture();
 f.client.saveLedger=async()=>{f.events.push('reserve');if(changed==='main')f.client.getMain=async()=>'d'.repeat(40);else f.pr[changed].sha='d'.repeat(40)};
 await assert.rejects(()=>reconcileOne(f.client,f.config,1,f.state,f.tasks),/changed/);
 assert.ok(!f.events.includes('refresh'));assert.equal(f.state.ledger.reservations.length,1);
});
runTest('stale-base refresh consumes reservation before an ambiguous write and does not retry',async()=>{
 const f=staleBaseFixture();f.client.updateBranch=async()=>{f.events.push('refresh');throw Error('ambiguous')};
 await assert.rejects(()=>reconcileOne(f.client,f.config,1,f.state,f.tasks),/ambiguous/);
 await reconcileOne(f.client,f.config,1,f.state,f.tasks);
 assert.equal(f.events.filter(e=>e==='refresh').length,1);assert.equal(f.state.ledger.reservations.length,1);
});

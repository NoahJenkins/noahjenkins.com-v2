'use strict'
// No real provider or real credentials. Exercise the HTTP boundary in Node.
async function main() {
  if (process.argv[2] === 'http') {
    require('node:http').createServer(async(req,res)=>{
      for await (const chunk of req) {}
      const content=JSON.stringify({verdict:'approve',findings:[],coveredFiles:['package.json','pnpm-lock.yaml'],assessment:{security:{status:'pass',rationale:'Fixture'},compatibility:{status:'pass',rationale:'Fixture'}}})
      res.writeHead(200,{'content-type':'text/event-stream'})
      res.write(`data: ${JSON.stringify({id:'chat-fixture',object:'chat.completion.chunk',created:1,model:'glm-5.3',choices:[{index:0,delta:{role:'assistant',content},finish_reason:null}]})}\n\n`)
      res.write(`data: ${JSON.stringify({id:'chat-fixture',object:'chat.completion.chunk',created:1,model:'glm-5.3',choices:[{index:0,delta:{},finish_reason:'stop'}],usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2}})}\n\n`)
      res.end('data: [DONE]\n\n')
    }).listen(8080,'0.0.0.0',()=>console.log('Fake provider ready'))
    return
  }
  if (process.argv[2] === 'proxy') {
    const {createGoProxy} = require('../../.github/scripts/dependabot-opencode-proxy.cjs')
    const maxCalls = Number(process.argv[3]); let calls=0
    const proxy = await createGoProxy({apiKey:'fixture-only',model:'glm-5.3',maxCalls,timeoutMs:10000,session:'ses_fixture',fetcher:async (url,options)=>{calls++; if(options.redirect!=='error') throw Error('redirect'); return new Response('{"ok":true}',{headers:{'content-type':'application/json'}})}})
    const statuses=[]
    try {
      for(let i=0;i<=maxCalls;i++) statuses.push((await fetch(`${proxy.url}/chat/completions`,{method:'POST',headers:{authorization:`Bearer ${proxy.token}`},body:JSON.stringify({model:'glm-5.3',messages:[]})})).status)
      const wrong = await fetch(`${proxy.url}/chat/completions`,{method:'POST',headers:{authorization:`Bearer ${proxy.token}`},body:JSON.stringify({model:'other',messages:[]})})
      const auth = await fetch(`${proxy.url}/chat/completions`,{method:'POST',body:'{}'})
      console.log(JSON.stringify({calls,statuses,wrong:wrong.status,auth:auth.status,count:proxy.count}))
    } finally { await proxy.close() }
    return
  }
  if (process.argv[2] === 'timeout') { setInterval(()=>{},1000); return }
  const n = process.argv[2] === 'steps' ? 17 : 1
  for(let i=0;i<n;i++) console.log(JSON.stringify({type:'step_start',sessionID:'ses_fixture'}))
  if(process.argv[2] === 'error') console.log(JSON.stringify({type:'error',error:'blocked'}))
  else console.log(JSON.stringify({type:'text',sessionID:'ses_fixture',part:{text:JSON.stringify({verdict:'approve',findings:[],coveredFiles:['package.json','pnpm-lock.yaml'],assessment:{security:{status:'pass',rationale:'Fixture'},compatibility:{status:'pass',rationale:'Fixture'}}})}}))
}
main().catch(()=>{console.error('Fixture failed');process.exitCode=1})

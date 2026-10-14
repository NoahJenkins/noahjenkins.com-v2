import { artifact, task, origin } from './opencode-fixtures'
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { execFileSync, spawn } from 'node:child_process'
const { prepareWorkspace, runAgent, agentConfig } = require('../../.github/scripts/dependabot-opencode-worker.cjs')
const { validateRepair, validationArgs } = require('../../.github/scripts/dependabot-opencode-validate.cjs')
const { sealArtifact } = require('../../.github/scripts/dependabot-opencode-contract.cjs')
const snapshot = () => ({existingPaths:['package.json','pnpm-lock.yaml','app/x.ts'],task,changedFiles:['package.json','pnpm-lock.yaml'],baseFiles:{'package.json':'{}','pnpm-lock.yaml':'old'},headFiles:{'package.json':'{}','pnpm-lock.yaml':'new'},contextFiles:{'app/x.ts':'data','lib/nested/AGENTS.md':'evil','.opencode/tool/evil.ts':'evil','.git/config':'secret'}})
const roots:string[]=[]
const root = () => {const r=mkdtempSync(join(tmpdir(),'opencode-test-'));roots.push(r);return r}
afterEach(()=>roots.splice(0).forEach(r=>rmSync(r,{recursive:true,force:true})))
const launcher = (mode:string) => () => spawn(process.execPath,[resolve('test/fixtures/opencode-fake-provider.cjs'),mode],{env:{PATH:process.env.PATH}})

test('ignores_candidate_agent_configuration', () => {
 const prepared=prepareWorkspace(snapshot(),root(),'review')
 expect(existsSync(join(prepared.dataRoot,'.git'))).toBe(false)
 expect(existsSync(join(prepared.dataRoot,'context/lib/nested/AGENTS.md'))).toBe(false)
 expect(existsSync(join(prepared.dataRoot,'context/.opencode'))).toBe(false)
 expect(readFileSync(join(prepared.dataRoot,'head/package.json'),'utf8')).toBe('{}')
 expect(()=>prepareWorkspace({...snapshot(),changedFiles:['missing']},root(),'review')).toThrow()
})
test('denies_secret_time_execution_tools', () => {
 const c=agentConfig('review','http://broker:8080/v1','temporary')
 expect(c.agent.review.permission).toMatchObject({'*':'deny',bash:'deny',task:'deny',edit:'deny',external_directory:{'*':'deny','/home/agent/data/opencode/tool-output/*':'deny'}})
 expect(c).toMatchObject({formatter:false,lsp:false,snapshot:false,share:'disabled',autoupdate:false,compaction:{auto:false}})
 expect(agentConfig('repair','http://broker:8080/v1','temporary').agent.repair.permission.edit).toBe('allow')
})
test('enforces_agent_step_and_time_bounds', async () => {
 const input={snapshot:snapshot(),origin,root:root()}
 await expect(runAgent(task,input,{launcher:launcher('steps')})).rejects.toThrow('step')
 await expect(runAgent(task,input,{launcher:launcher('timeout'),timeoutMs:30})).rejects.toThrow('timeout')
 await expect(runAgent(task,input,{launcher:launcher('error')})).rejects.toThrow()
 expect((await runAgent(task,input,{launcher:launcher('ok')})).agent).toMatchObject({provider:'opencode-go',model:'glm-5.3'})
})
test.each([24,16])('proxy_caps_hostile_generation_retries at %i', limit => {
 const result=JSON.parse(execFileSync(process.execPath,['test/fixtures/opencode-fake-provider.cjs','proxy',String(limit)],{encoding:'utf8'}))
 expect(result.calls).toBe(limit)
 expect(result.statuses.slice(0,limit)).toEqual(Array(limit).fill(200))
 expect(result.statuses[limit]).toBe(429)
 expect(result.wrong).toBe(400)
 expect(result.auth).toBe(401)
})
test('validator_has_no_provider_or_host_credentials', () => {
 const args=validationArgs('/tmp/data','image')
 expect(args.join(' ')).not.toMatch(/GO_API_KEY|GITHUB_TOKEN|APP_TOKEN|DOPPLER|docker.sock/)
 expect(args).toContain('--cap-drop=ALL')
 expect(args.join(' ')).toContain('--ignore-scripts')
 expect(args.join(' ')).toContain('--frozen-lockfile')
})
test('review validator executes no candidate commands',async()=>{
 const a=sealArtifact(artifact());const execute=jest.fn()
 const result=await validateRepair(task,snapshot(),a,{origin,execute})
 expect(result.artifact).toEqual(a)
 expect(execute).not.toHaveBeenCalled()
 expect(result.checks.inputDigest).toBe(a.digest)
})
test('repair validator rejects protected changes before executing',async()=>{
 const a:any=artifact('repair');a.result.files=[{path:'package.json',content:'{"scripts":{"test":"echo success"}}'}]
 const execute=jest.fn()
 await expect(validateRepair(a.task,{...snapshot(),task:a.task},sealArtifact(a),{origin,execute,root:root(),image:'fixture'})).rejects.toThrow('Protected')
 expect(execute).not.toHaveBeenCalled()
})
test('repair validator binds observed generated lock to output',async()=>{
 const r=root();const a:any=artifact('repair');a.result.files=[{path:'package.json',content:'{"dependencies":{"x":"1.2.3"}}'}]
 const {writeFileSync}=require('node:fs')
 const output=await validateRepair(a.task,{...snapshot(),task:a.task},sealArtifact(a),{origin,root:r,image:'fixture',execute:()=>writeFileSync(join(r,'pnpm-lock.yaml'),'generated')})
 expect(output.artifact.result.files).toContainEqual({path:'pnpm-lock.yaml',content:'generated'})
 expect(output.checks.inputDigest).toBe(sealArtifact(a).digest)
 expect(output.checks.outputDigest).toBe(output.artifact.digest)
})
test('validator rejects symlink ancestry before materializing edits',async()=>{
 const r=root();const outside=root();require('node:fs').symlinkSync(outside,join(r,'lib'))
 const a:any=artifact('repair');a.result.files=[{path:'lib/new.ts',content:'export const x=1'}]
 await expect(validateRepair(a.task,{...snapshot(),task:a.task},sealArtifact(a),{origin,root:r,image:'fixture',execute:()=>{throw Error('unsafe execution')}})).rejects.toThrow('Symlink')
 expect(existsSync(join(outside,'new.ts'))).toBe(false)
})
test('validator destroys its named container after timeout',async()=>{
 const r=root();const a:any=artifact('repair');const cleanup=jest.fn()
 await expect(validateRepair(a.task,{...snapshot(),task:a.task},sealArtifact(a),{origin,root:r,image:'fixture',execute:()=>{throw Error('timeout')},cleanup})).rejects.toThrow('timeout')
 expect(cleanup).toHaveBeenCalledWith(expect.stringMatching(/^dependabot-validation-/))
 expect(validationArgs(r,'fixture','known-name')).toContain('known-name')
})
test('complete head inventory prevents replacing an omitted existing test',async()=>{
 const r=root();const a:any=artifact('repair');a.result.files=[{path:'test/existing.test.ts',content:'test("fake",()=>{})'}]
 const execute=jest.fn()
 await expect(validateRepair(a.task,{...snapshot(),task:a.task,existingPaths:['package.json','pnpm-lock.yaml','test/existing.test.ts']},sealArtifact(a),{origin,root:r,image:'fixture',execute})).rejects.toThrow('Protected')
 expect(execute).not.toHaveBeenCalled()
})
test('validator rejects symlink ancestors created during candidate execution',async()=>{
 const r=root();const outside=root();const fs=require('node:fs');fs.writeFileSync(join(outside,'x.ts'),'host-only')
 const a:any=artifact('repair');a.result.files=[{path:'app/x.ts',content:'proposed'}]
 await expect(validateRepair(a.task,{...snapshot(),task:a.task,existingPaths:['package.json','pnpm-lock.yaml']},sealArtifact(a),{origin,root:r,image:'fixture',execute:()=>{fs.rmSync(join(r,'app'),{recursive:true});fs.symlinkSync(outside,join(r,'app'));fs.writeFileSync(join(r,'pnpm-lock.yaml'),'generated')}})).rejects.toThrow('Symlink')
})
test('action-only repair omits an unchanged generated lockfile',async()=>{
 const r=root();const fs=require('node:fs');fs.writeFileSync(join(r,'pnpm-lock.yaml'),'unchanged')
 const before=`steps:\n  - uses: actions/setup-node@${'c'.repeat(40)} # v4\n`
 const after=before.replace('c'.repeat(40),'d'.repeat(40)).replace('# v4','# v7')
 const a:any=artifact('repair');a.result.files=[{path:'.github/workflows/ci.yml',content:after}]
 const s={task:a.task,changedFiles:['.github/workflows/ci.yml'],baseFiles:{'.github/workflows/ci.yml':before},headFiles:{'.github/workflows/ci.yml':before},contextFiles:{'package.json':'{}','pnpm-lock.yaml':'unchanged'},existingPaths:['.github/workflows/ci.yml','package.json','pnpm-lock.yaml']}
 const result=await validateRepair(a.task,s,sealArtifact(a),{origin,root:r,image:'fixture',execute:()=>{}})
 expect(result.artifact.result.files).toEqual(a.result.files)
})
test('worker receives the immutable inventory and refuses incomplete inventory before launch',()=>{
 const r=root();const prepared=prepareWorkspace(snapshot(),r,'review')
 expect(JSON.parse(readFileSync(join(prepared.dataRoot,'input.json'),'utf8')).existingPaths).toEqual(snapshot().existingPaths)
 expect(()=>prepareWorkspace({...snapshot(),existingPaths:undefined},root(),'review')).toThrow('inventory')
})

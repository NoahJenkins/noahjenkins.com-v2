'use strict'
const fs=require('node:fs');const path=require('node:path');const {randomBytes}=require('node:crypto');const {execFileSync}=require('node:child_process')
const {validateArtifact,validateFiles,sealArtifact,digest}=require('./dependabot-opencode-contract.cjs')
const {evaluateScope}=require('./dependabot-controller-policy.cjs')
const COMMAND='pnpm install --lockfile-only --ignore-scripts && pnpm install --frozen-lockfile --ignore-scripts && pnpm audit --audit-level=high && pnpm exec tsc --noEmit && pnpm exec jest --coverage --runInBand && pnpm build'
function rejectLinks(root) {
 for(const name of fs.readdirSync(root)) {const p=path.join(root,name);const stat=fs.lstatSync(p);if(stat.isSymbolicLink())throw Error('Symlink validation input');if(stat.isDirectory() && !['node_modules','.next','.git'].includes(name))rejectLinks(p)}
}
function validationArgs(root,image,name) {return ['run',...(name?['--name',name]:[]),'--rm','--platform','linux/amd64','--cap-drop=ALL','--security-opt=no-new-privileges','--user','1000:1000','--memory=6g','--cpus=2','--pids-limit=256','--tmpfs','/tmp:rw,nosuid,nodev,size=512m','-e','HOME=/tmp/home','-e','CI=true','-e','NEXT_TELEMETRY_DISABLED=1','-v',`${root}:/workspace:rw`,'-w','/workspace',image,'sh','-eu','-c',COMMAND]}
async function validateRepair(task,snapshot,artifact,options) {
 validateArtifact(artifact,{task,origin:options.origin,changedFiles:snapshot.changedFiles})
 if(task.kind==='review')return {artifact,checks:{inputDigest:artifact.digest,outputDigest:artifact.digest,success:true}}
 const files=artifact.result.files
 const changes=files.map(f=>({filename:f.path,before:snapshot.headFiles[f.path]??snapshot.contextFiles?.[f.path]??'',after:f.content,status:(f.path in snapshot.headFiles || f.path in (snapshot.contextFiles || {}))?'modified':'added'}))
 const scope=evaluateScope(changes);if(!scope.allowed)throw Error(scope.reason)
 if(!options.root || !options.image)throw Error('Validation container input is missing')
 rejectLinks(options.root)
 for(const file of files) {const target=path.join(options.root,file.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,file.content)}
 const execute=options.execute || ((args)=>execFileSync('docker',args,{env:{PATH:process.env.PATH},timeout:1200000,stdio:['ignore','pipe','pipe']}))
 const name=`dependabot-validation-${randomBytes(8).toString('hex')}`
 const cleanup=options.cleanup || (container=>{try{execFileSync('docker',['rm','-f',container],{env:{PATH:process.env.PATH},stdio:'ignore'})}catch{}})
 try {await execute(validationArgs(options.root,options.image,name))}finally{cleanup(name)}
 // Read only allowed submitted paths and generated lock; never trust model claims.
 const paths=[...new Set([...files.map(f=>f.path),'pnpm-lock.yaml'])]
 const validated=paths.map(p=>{const target=path.join(options.root,p);const stat=fs.lstatSync(target);if(!stat.isFile() || stat.isSymbolicLink() || stat.mode&0o111)throw Error('Unsupported validation output');return {path:p,content:fs.readFileSync(target,'utf8')}})
 validateFiles(validated)
 const final=sealArtifact({...artifact,result:{files:validated}})
 return {artifact:final,checks:{inputDigest:artifact.digest,outputDigest:final.digest,success:true}}
}
module.exports={COMMAND,validationArgs,validateRepair,rejectLinks}

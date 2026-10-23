'use strict'
// Manual, synthetic runtime proof. This output cannot be submitted to the publisher.
const fs = require('node:fs'), path = require('node:path')
const { randomUUID } = require('node:crypto')
const { StringDecoder } = require('node:string_decoder')
const { execFileSync } = require('node:child_process')
const runtime = require('./copilot-runtime.cjs')
const { prepareWorkspace, agentConfig } = require('./dependabot-opencode-worker.cjs')
const { validateFiles, scopeChanges } = require('./dependabot-opencode-contract.cjs')

function fixture() {
  const task = { pr: 1, prId: 'SYNTHETIC_CANARY', head: 'a'.repeat(40), base: 'b'.repeat(40), kind: 'repair', nonce: randomUUID(), createdAt: new Date().toISOString() }
  const adapter = "const client = require('canary-lib'); module.exports = value => client.parse(value);\n"
  return { task, existingPaths: ['package.json', 'lib/adapter.cjs'], changedFiles: ['package.json'],
    baseFiles: { 'package.json': '{"dependencies":{"canary-lib":"1.0.0"}}', 'lib/adapter.cjs': adapter },
    headFiles: { 'package.json': '{"dependencies":{"canary-lib":"1.0.1"}}', 'lib/adapter.cjs': adapter },
    diagnostics: ['paid-canary-read-proof', 'Synthetic dependency fixture: canary-lib 1.0.1 exposes decode(value), returning ready: followed by value. parse no longer exists. Adapter currently fails TypeError: client.parse is not a function. Repair lib/adapter.cjs only; preserve the package update. A secret-free check calls the adapter with sample and expects ready:sample. No real PR or dependency install is involved.'] }
}

async function validateCandidate(files, root) {
  const directory = path.join(root, 'validation'), moduleDir = path.join(directory, 'node_modules', 'canary-lib')
  fs.mkdirSync(moduleDir, { recursive: true, mode: 0o755 })
  fs.writeFileSync(path.join(directory, 'adapter.cjs'), files[0].content, { mode: 0o644 })
  fs.writeFileSync(path.join(moduleDir, 'index.js'), "exports.decode = value => 'ready:' + value;\n", { mode: 0o644 })
  const name = 'copilot-canary-validation-' + randomUUID()
  const docker = args => execFileSync('docker', args, { env: { PATH: process.env.PATH }, stdio: ['ignore', 'pipe', 'pipe'], timeout: 15000 })
  try {
    docker(['run', '--rm', '--name', name, '--platform', 'linux/amd64', '--network', 'none', '--cap-drop=ALL', '--security-opt=no-new-privileges', '--read-only', '--user', '1000:1000', '--memory=128m', '--cpus=1', '--pids-limit=32',
      '--mount', `type=bind,source=${directory},target=/canary,readonly`, runtime.IMAGE, 'node', '-e', "require('node:assert/strict').equal(require('/canary/adapter.cjs')('sample'),'ready:sample')"])
  } catch { throw Error('Canary functional check failed') }
  finally { try { docker(['rm', '-f', name]) } catch {} }
}

async function runCanary({ root, binaryPath, apiKey, launch = runtime.launchIsolated, validate = validateCandidate }) {
  const snapshot = fixture(), prepared = prepareWorkspace(snapshot, root, 'repair'), config = agentConfig('repair')
  const report = { kind: 'synthetic-copilot-canary', version: 1, model: runtime.MODEL, runtimeVersion: runtime.VERSION, publishable: false, passed: false }
  let session, readProof = false
  try {
    session = await launch(snapshot.task, prepared, config, { binaryPath, apiKey })
    // Observe only proof of the curated read; never retain or print raw session events.
    const decoder = new StringDecoder('utf8'); let pending = ''
    session.child.stdout.on('data', chunk => {
      pending += decoder.write(chunk)
      const lines = pending.split('\n'); pending = lines.pop()
      if (pending.length > 1024 * 1024) pending = ''
      for (const line of lines) {
        try {
          const event = JSON.parse(line)
          if (event.type === 'tool.execution_complete' && event.data?.success === true && typeof event.data.result?.content === 'string' && event.data.result.content.includes('paid-canary-read-proof')) readProof = true
        } catch {}
      }
    })
    const { result } = await runtime.observe(session.child, 'repair', 120000)
    if (!readProof) throw Error('Canary did not complete the required curated read')
    if (!result || Object.keys(result).join() !== 'files') throw Error('Canary output scope is invalid')
    validateFiles(result.files)
    if (result.files.length !== 1 || result.files[0].path !== 'lib/adapter.cjs') throw Error('Canary output scope is invalid')
    scopeChanges(result.files, snapshot)
    await validate(result.files, root)
    if (!session.usagePath || !fs.existsSync(session.usagePath)) throw Error('Canary usage evidence is missing')
    runtime.summarizeUsage(JSON.parse(fs.readFileSync(session.usagePath, 'utf8')))
    report.passed = true; report.curatedReadVerified = true; report.functionalCheckPassed = true
    return report
  } finally {
    session?.cleanup()
    let usageFailure = false
    if (session?.usagePath && fs.existsSync(session.usagePath)) {
      try { fs.writeFileSync(path.join(root, 'usage.json'), JSON.stringify(runtime.summarizeUsage(JSON.parse(fs.readFileSync(session.usagePath, 'utf8'))))) } catch { report.passed = false; usageFailure = true }
    }
    fs.writeFileSync(path.join(root, 'canary.json'), JSON.stringify(report))
    if (usageFailure) throw Error('Canary usage evidence could not be retained')
  }
}

module.exports = { runCanary, validateCandidate, fixture }
if (require.main === module) {
  const root = process.env.CANARY_OUTPUT_DIR
  if (!root || !path.isAbsolute(root) || !process.env.COPILOT_GITHUB_TOKEN || !process.env.COPILOT_BINARY) {
    console.error('Canary requires an absolute output directory, the scoped Copilot credential and verified binary.'); process.exitCode = 1
  } else {
    fs.mkdirSync(root, { recursive: true })
    runCanary({ root, apiKey: process.env.COPILOT_GITHUB_TOKEN, binaryPath: process.env.COPILOT_BINARY })
      .then(() => console.log('Synthetic Copilot repair passed; no publication or automation activation.'))
      .catch(() => { console.error('Synthetic Copilot repair failed. Inspect sanitized usage; no automatic retry.'); process.exitCode = 1 })
  }
}

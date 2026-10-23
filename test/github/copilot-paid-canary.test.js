const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { EventEmitter } = require('node:events')
const { PassThrough } = require('node:stream')
const { setImmediate } = require('node:timers')

const repaired = "const client = require('canary-lib'); module.exports = value => client.decode(value);\n"
function launcher(root, result, options = {}) {
  let calls = 0, cleaned = false
  return {
    get calls() { return calls }, get cleaned() { return cleaned },
    launch: async () => {
      calls++
      const usagePath = path.join(root, 'raw-usage.json')
      if (!options.missingUsage) fs.writeFileSync(usagePath, JSON.stringify({ totalNanoAiu: 42, modelMetrics: { 'gpt-6-luna': { requests: { count: 2 }, usage: { inputTokens: 100, outputTokens: 20 } } } }))
      const child = new EventEmitter()
      child.stdout = new PassThrough(); child.stderr = new PassThrough(); child.kill = () => {}
      setImmediate(() => {
        const events = [
          { type: 'model.call_start', data: { model: 'gpt-6-luna' } },
          ...(options.noRead ? [] : [{ type: 'tool.execution_complete', data: { success: true, result: { content: 'paid-canary-read-proof' } } }]),
          { type: 'assistant.message', data: { content: JSON.stringify(result) } },
          { type: 'result', exitCode: 0, sessionId: '12345678-1234-1234-1234-123456789abc' },
        ]
        child.stdout.write(events.map(e => JSON.stringify(e)).join('\n') + '\n'); child.emit('close', 0)
      })
      return { child, usagePath, cleanup: () => { cleaned = true } }
    },
  }
}
function temporary(testBody) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'copilot-paid-canary-test-'))
  return Promise.resolve().then(() => testBody(root)).finally(() => fs.rmSync(root, { recursive: true, force: true }))
}

test('a successful canary launches once and retains only sanitized usage and a non-publishable result', () => temporary(async root => {
  const { runCanary } = require('../../.github/scripts/copilot-paid-canary.cjs')
  const fake = launcher(root, { files: [{ path: 'lib/adapter.cjs', content: repaired }] })
  let checked = 0
  const report = await runCanary({ root, launch: fake.launch, validate: async files => { checked++; assert.equal(files[0].content, repaired) } })
  assert.equal(fake.calls, 1); assert.equal(fake.cleaned, true); assert.equal(checked, 1)
  assert.equal(report.kind, 'synthetic-copilot-canary'); assert.equal(report.passed, true)
  assert.equal(report.publishable, false)
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'usage.json'), 'utf8')), { model: 'gpt-6-luna', requests: 2, inputTokens: 100, outputTokens: 20, nanoAiu: 42 })
  assert.equal(Object.hasOwn(report, 'files'), false)
}))

test('a model cannot pass without a completed curated read; failure is not retried', () => temporary(async root => {
  const { runCanary } = require('../../.github/scripts/copilot-paid-canary.cjs')
  const fake = launcher(root, { files: [{ path: 'lib/adapter.cjs', content: repaired }] }, { noRead: true })
  await assert.rejects(runCanary({ root, launch: fake.launch, validate: () => assert.fail('unread proposal must not execute') }), /curated read/i)
  assert.equal(fake.calls, 1); assert.equal(fake.cleaned, true)
  assert.equal(fs.existsSync(path.join(root, 'usage.json')), true)
}))

test('protected or extra file edits are rejected before candidate execution and preserve spend evidence', () => temporary(async root => {
  const { runCanary } = require('../../.github/scripts/copilot-paid-canary.cjs')
  const fake = launcher(root, { files: [{ path: '.github/workflows/ci.yml', content: 'unsafe' }] })
  await assert.rejects(runCanary({ root, launch: fake.launch, validate: () => assert.fail('out-of-scope proposal must not execute') }), /scope/i)
  assert.equal(fake.calls, 1); assert.equal(fake.cleaned, true)
  assert.equal(fs.existsSync(path.join(root, 'usage.json')), true)
}))

test('a failed functional check cannot produce a passing canary or launch a second model session', () => temporary(async root => {
  const { runCanary } = require('../../.github/scripts/copilot-paid-canary.cjs')
  const fake = launcher(root, { files: [{ path: 'lib/adapter.cjs', content: 'module.exports = () => false' }] })
  await assert.rejects(runCanary({ root, launch: fake.launch, validate: () => { throw Error('functional check failed') } }), /functional check/)
  assert.equal(fake.calls, 1); assert.equal(fake.cleaned, true)
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'canary.json'), 'utf8')).passed, false)
}))

test('missing usage cannot be reported as a successful or zero-cost trial', () => temporary(async root => {
  const { runCanary } = require('../../.github/scripts/copilot-paid-canary.cjs')
  const fake = launcher(root, { files: [{ path: 'lib/adapter.cjs', content: repaired }] }, { missingUsage: true })
  await assert.rejects(runCanary({ root, launch: fake.launch, validate: () => {} }), /usage evidence is missing/)
  assert.equal(fake.calls, 1); assert.equal(fake.cleaned, true)
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'canary.json'), 'utf8')).passed, false)
  assert.equal(fs.existsSync(path.join(root, 'usage.json')), false)
}))

test('functional proof requires completed outputs and rejects early exits and constant answers', () => {
  const { verifyCandidateOutput } = require('../../.github/scripts/copilot-paid-canary.cjs')
  const inputs = ['', 'sample', 'unpredictable-value', 'café']
  assert.throws(() => verifyCandidateOutput('', inputs))
  assert.throws(() => verifyCandidateOutput(JSON.stringify(inputs.map(() => 'ready:sample')), inputs))
  assert.throws(() => verifyCandidateOutput('extra\n' + JSON.stringify(inputs.map(v => 'ready:' + v)), inputs))
  assert.doesNotThrow(() => verifyCandidateOutput(JSON.stringify(inputs.map(v => 'ready:' + v)), inputs))
})

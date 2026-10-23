const assert = require('node:assert/strict')

test('startup forgery cannot read challenge data or complete the result protocol', () => {
  const { evaluateCandidate } = require('../../.github/scripts/copilot-canary-validator.cjs')
  let reads = 0
  const readInputs = () => { reads++; return ['random-challenge'] }
  assert.throws(() => evaluateCandidate("const inputs = JSON.parse(process.argv[1]); process.stdout.write(JSON.stringify(inputs.map(value => 'ready:' + value))); process.exit(0);", readInputs))
  assert.equal(reads, 0)
  assert.throws(() => evaluateCandidate('module.exports = {}', readInputs))
  assert.equal(reads, 0)
})

test('only the callable adapter receives individual inputs after initialization', () => {
  const { evaluateCandidate } = require('../../.github/scripts/copilot-canary-validator.cjs')
  const inputs = ['', 'sample', 'café ☃', 'different-value']
  const actual = evaluateCandidate("const client = require('canary-lib'); module.exports = value => client.decode(value)", () => inputs)
  assert.deepEqual(actual, inputs.map(value => 'ready:' + value))
})

test('adapter evaluation has no process, filesystem import, dynamic code or result serializer', () => {
  const { evaluateCandidate } = require('../../.github/scripts/copilot-canary-validator.cjs')
  for (const source of [
    'process.exit(0)',
    "require('node:fs')",
    "module.exports = () => require.constructor('return process')()",
    "module.exports = () => ({ toJSON() { return 'ready:sample' } })",
  ]) assert.throws(() => evaluateCandidate(source, () => ['sample']))
})

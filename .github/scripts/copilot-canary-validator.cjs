'use strict'
const vm = require('node:vm')

// Language restriction for this tiny fixture, not a security boundary. Production
// evaluation runs only inside the separate credential-free Docker container.
function evaluateCandidate(source, readInputs) {
  const context = vm.createContext(Object.create(null), {
    codeGeneration: { strings: false, wasm: false }, microtaskMode: 'afterEvaluate',
  })
  const evaluate = code => new vm.Script(code).runInContext(context, { timeout: 250 })
  // Create all candidate-visible objects inside its context: no host callbacks,
  // process, filesystem, challenge vector or output protocol is exposed.
  evaluate(`
    'use strict';
    const module = { exports: {} };
    const exports = module.exports;
    const require = name => {
      if (name !== 'canary-lib') throw Error('Unsupported fixture import');
      return Object.freeze({ decode: value => 'ready:' + value });
    };
  `)
  evaluate(source)
  if (evaluate('typeof module.exports') !== 'function') throw Error('Canary requires a callable adapter')
  // Acquire challenges only after module initialization. Deliver one primitive
  // input per call; serialization stays outside the candidate context.
  return readInputs().map(value => {
    if (typeof value !== 'string') throw Error('Invalid fixture input')
    const result = evaluate(`module.exports(${JSON.stringify(value)})`)
    if (typeof result !== 'string') throw Error('Canary requires a string result')
    return result
  })
}

module.exports = { evaluateCandidate }
if (require.main === module) {
  const fs = require('node:fs')
  try {
    const outputs = evaluateCandidate(fs.readFileSync('/canary/adapter.cjs', 'utf8'), () => JSON.parse(fs.readFileSync(0, 'utf8')))
    process.stdout.write(JSON.stringify(outputs))
  } catch { process.exitCode = 1 }
}

export {}
const fs = require('node:fs')
const { normalizeOverrides } = require('../../.github/scripts/normalize-workspace-overrides.cjs')
const { evaluateScope } = require('../../.github/scripts/dependabot-controller-policy.cjs')

// pnpm 10 output after `pnpm audit --fix` added two range overrides.
const pnpmOutput = `packages: []

overrides:
  '@babel/core': 7.29.6
  glob@>=9.0.0 <=14.0.1: '>=14.0.2'
  minimatch: '>=10.2.1'
  minimatch@<11.0.1: '>=11.0.1'
  ws: 8.21.0
`

describe('workspace override normalization', () => {
  const allowed = (before: string, after: string) => evaluateScope([{ filename: 'pnpm-workspace.yaml', status: 'modified', before, after }]).allowed

  test('quotes pnpm audit --fix output so the controller policy accepts it', () => {
    const normalized = normalizeOverrides(pnpmOutput)
    expect(normalized).toContain('  "glob@>=9.0.0 <=14.0.1": ">=14.0.2"')
    expect(normalized).toContain('  "@babel/core": "7.29.6"')
    expect(normalized).toContain('  ws: "8.21.0"')
    expect(allowed(pnpmOutput, pnpmOutput)).toBe(false)
    expect(allowed(normalized, normalized)).toBe(true)
  })

  test('leaves the committed workspace file unchanged', () => {
    const current = fs.readFileSync('pnpm-workspace.yaml', 'utf8')
    expect(normalizeOverrides(current)).toBe(current)
  })

  test.each([
    '  pkg: 1.0.0 # comment',
    '  pkg: &anchor 1.0.0',
    '  pkg:\n    nested: 1.0.0',
    '  "pk\\"g": 1.0.0',
  ])('rejects unsupported override syntax %p', (line: string) => {
    expect(() => normalizeOverrides(`packages: []\noverrides:\n${line}\n`)).toThrow('Unsupported override line')
  })
})

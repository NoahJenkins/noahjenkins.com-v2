export {}
const { reserve, readLedger, encodeLedger } = require('../../.github/scripts/dependabot-controller-ledger.cjs')
const task = (pr: number, head: string, kind = 'repair') => ({ pr, prId: `PR_${pr}`, head: head.repeat(40), base: 'b'.repeat(40), kind })
const now = '2026-10-13T12:00:00.000Z'
describe('durable dispatch limits', () => {
  test('consumes uncertain reservations before any provider write', () => {
    const first = reserve({ version: 1, reservations: [] }, task(1, 'a'), now)
    expect(first.reservation).toMatchObject({ pr: 1, kind: 'repair', head: 'a'.repeat(40), createdAt: now })
    expect(reserve(first.ledger, task(1, 'a'), now).reason).toContain('already')
  })
  test('head changes do not reset the two-attempt lifetime limit', () => {
    let ledger = { version: 1, reservations: [] }
    ledger = reserve(ledger, task(1, 'a'), now).ledger
    ledger = reserve(ledger, task(1, 'c'), '2026-10-14T12:00:00.000Z').ledger
    expect(reserve(ledger, task(1, 'd'), '2026-10-15T12:00:00.000Z').reason).toContain('lifetime')
  })
  test('limits repairs across PRs to two per UTC day', () => {
    let ledger = reserve({ version: 1, reservations: [] }, task(1, 'a'), now).ledger
    ledger = reserve(ledger, task(2, 'c'), now).ledger
    expect(reserve(ledger, task(3, 'd'), now).reason).toContain('daily')
    expect(reserve(ledger, task(3, 'd'), '2026-10-14T00:00:00.000Z').reservation).toBeDefined()
  })
  test('allows eight reviews independently of repair quota', () => {
    let ledger = reserve({ version: 1, reservations: [] }, task(100, 'a'), now).ledger
    for (let i = 1; i <= 8; i++) ledger = reserve(ledger, task(i, 'a', 'review'), now).ledger
    expect(reserve(ledger, task(9, 'a', 'review'), now).reason).toContain('daily')
  })
  test('never trusts a copied ledger from another author', () => {
    const body = encodeLedger({ version: 1, reservations: [] })
    expect(() => readLedger([{ id: 1, user: { id: 2 }, body }], 1)).toThrow('author')
  })
  test('fails closed on malformed or duplicate ledgers', () => {
    expect(() => readLedger([{ id: 1, user: { id: 1 }, body: '<!-- dependabot-controller-state:v1 -->\n{}' }], 1)).toThrow()
    const comment = { id: 1, user: { id: 1 }, body: encodeLedger({ version: 1, reservations: [] }) }
    expect(() => readLedger([comment, { ...comment, id: 2 }], 1)).toThrow('Multiple')
  })
  test('rejects forged tasks and invalid persisted counters', () => {
    expect(() => reserve({ version: 1, reservations: [] }, task(1, 'z'), now)).toThrow()
    expect(() => encodeLedger({ version: 1, reservations: [{ ...task(1, 'a'), nonce: 'bad', createdAt: now }] })).toThrow()
  })
})

describe('bounded routine recovery', () => {
  test.each(['refresh', 'retry'])('%s has a separate two-attempt lifetime budget', kind => {
    let ledger = reserve({ version: 1, reservations: [] }, task(1, 'a', kind), now).ledger
    ledger = reserve(ledger, task(1, 'c', kind), '2026-10-14T12:00:00.000Z').ledger
    expect(reserve(ledger, task(1, 'd', kind), '2026-10-15T12:00:00.000Z').reason).toContain('lifetime')
    expect(reserve(ledger, task(1, 'd', 'repair'), '2026-10-15T12:00:00.000Z').reservation).toBeDefined()
  })
})

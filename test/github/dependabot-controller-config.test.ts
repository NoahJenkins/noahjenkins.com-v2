export {}
const { configFromEnv } = require('../../.github/scripts/dependabot-controller-run.cjs')
describe('activation configuration', () => {
  test('keeps both enable flags off by default', () => {
    expect(configFromEnv({ GITHUB_REPOSITORY: 'o/r' })).toMatchObject({ automationEnabled: false, agentEnabled: false, vercelAppId: 8329 })
  })
  test('does not configure a Copilot or PAT identity', () => {
    expect(configFromEnv({})).not.toHaveProperty('reviewerId')
    expect(configFromEnv({})).not.toHaveProperty('dispatchUserId')
  })
  test('accepts only the exact true flag', () => {
    expect(configFromEnv({ DEPENDABOT_AUTOMATION_ENABLED: 'TRUE', DEPENDABOT_AGENT_ENABLED: 'yes' })).toMatchObject({ automationEnabled: false, agentEnabled: false })
  })
  test.each(['', '15368', '8329', '-1', 'NaN'])('rejects controller App ID %s before activation', (id) => {
    expect(() => configFromEnv({ DEPENDABOT_AUTOMATION_ENABLED: 'true', DEPENDABOT_CONTROLLER_APP_ID: id })).toThrow()
  })
  test('requires state issue before agent activation', () => {
    expect(() => configFromEnv({ DEPENDABOT_AUTOMATION_ENABLED: 'true', DEPENDABOT_AGENT_ENABLED: 'true', DEPENDABOT_CONTROLLER_APP_ID: '99' })).toThrow('state issue')
  })
})

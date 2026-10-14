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
test('workflow keeps candidate execution outside credential jobs',()=>{
 const yaml=require('js-yaml');const fs=require('node:fs')
 const workflow=yaml.load(fs.readFileSync('.github/workflows/dependabot-auto-merge.yml','utf8'))
 expect(workflow.jobs.worker.environment).toBe('dependabot-dispatch')
 expect(workflow.jobs.validate).not.toHaveProperty('environment')
 for(const [name,job] of Object.entries(workflow.jobs) as any) {
  for(const step of job.steps) {
   if(step.uses?.startsWith('actions/checkout@') && step.name!=='Checkout candidate data without persistent credentials')expect(step.with.ref).toBe('${{ github.workflow_sha }}')
   if(step.env?.OPENCODE_GO_API_KEY)expect(name).toBe('worker')
   if(step.with?.['private-key'])expect(['controller','claim','publish','reconcile']).toContain(name)
  }
 }
 expect(JSON.stringify(workflow)).not.toMatch(/COPILOT_AUTOMATION_TOKEN|DISPATCH_USER_ID|REVIEWER_ID/)
})

import { task, origin, report, artifact } from './opencode-fixtures'
const { validateArtifact, validateReview, validateReviewEvidence, sealArtifact } = require('../../.github/scripts/dependabot-opencode-contract.cjs')
const expected = () => ({ task, origin, changedFiles: report().coveredFiles })

describe('strict OpenCode evidence', () => {
  test('accepts a complete wrapper-bound report', () => {
    const a = sealArtifact(artifact())
    expect(validateArtifact(a, expected())).toEqual(a)
    expect(validateReview(report(), report().coveredFiles).passed).toBe(true)
  })
  test.each(['nonce', 'head', 'base'])('rejects forged task %s', (field) => {
    const a = artifact(); (a.task as any)[field] = 'e'.repeat(40)
    expect(() => validateArtifact(sealArtifact(a), expected())).toThrow()
  })
  test.each(['runId', 'runAttempt', 'workflowSha', 'ref', 'jobId'])('rejects forged origin %s', (field) => {
    const a = artifact(); (a.origin as any)[field] = field === 'runAttempt' ? 2 : 'forged'
    expect(() => validateArtifact(sealArtifact(a), expected())).toThrow()
  })
  test('rejects forged model and digest', () => {
    const a = artifact(); a.agent.model = 'other'
    expect(() => validateArtifact(sealArtifact(a), expected())).toThrow()
    expect(() => validateArtifact({ ...sealArtifact(artifact()), digest: '0'.repeat(64) }, expected())).toThrow()
  })
  test.each(['../x', '/tmp/x', 'a/../x', 'a\\x', 'x\u0000', 'x'.repeat(241), 'a//x', './x', 'x/.git/y'])('rejects invalid file path %s', (path) => {
    const a: any = artifact('repair'); a.result.files = [{ path, content: 'data' }]
    expect(() => validateArtifact(sealArtifact(a), { ...expected(), task: a.task })).toThrow()
  })
  test('rejects duplicate, oversized, non-UTF8, and extra file data', () => {
    for (const files of [[{ path: 'x', content: '' }, { path: 'x', content: '' }], [{ path: 'x', content: 'x'.repeat(2 * 1024 * 1024 + 1) }], [{ path: 'x', content: '\ud800' }], [{ path: 'x', content: '', mode: '755' }], Array.from({length:65}, (_,i) => ({path:`x${i}`,content:''})), Array.from({length:5}, (_,i) => ({path:`x${i}`,content:'x'.repeat(2*1024*1024)}))]) {
      const a: any = artifact('repair'); a.result.files = files
      expect(() => validateArtifact(sealArtifact(a), { ...expected(), task: a.task })).toThrow()
    }
  })
  test('rejects incomplete dependency review and schema extras', () => {
    expect(() => validateReview({ ...report(), coveredFiles: ['package.json'] }, report().coveredFiles)).toThrow()
    expect(() => validateReview({ ...report(), extra: true }, report().coveredFiles)).toThrow()
    expect(() => validateReview({ ...report(), coveredFiles: ['package.json','package.json'] }, report().coveredFiles)).toThrow()
  })
  test.each(['critical','high','medium','low','info'])('acceptance respects %s findings', (severity) => {
    const r = { ...report(), findings: [{ severity, file: 'package.json', message: 'Finding' }] }
    expect(validateReview(r, r.coveredFiles)).toEqual({ report: r, passed: ['low','info'].includes(severity) })
  })
  test('unknown assessments, foreign findings and blocked verdict cannot approve', () => {
    const r = report(); r.assessment.security.status = 'unknown'
    expect(validateReview(r, r.coveredFiles).passed).toBe(false)
    expect(() => validateReview({ ...r, findings: [{severity:'high',file:'other',message:'bad'}]},r.coveredFiles)).toThrow()
    expect(validateReview({ ...report(), verdict: 'blocked' },r.coveredFiles).passed).toBe(false)
  })
  test('requires App-owned current evidence and a durable claim', () => {
    const a = sealArtifact(artifact())
    const check = { name: 'Dependabot Independent Review', app: {id:99}, head_sha: task.head, status: 'completed', conclusion: 'success', output: {text:JSON.stringify(a)} }
    const context = { ...expected(), appId:99, claim:{task,origin,digest:a.digest,published:true} }
    expect(validateReviewEvidence(check,context)?.passed).toBe(true)
    expect(validateReviewEvidence({...check,app:{id:15368}},context)).toBeNull()
    expect(validateReviewEvidence(check,{...context,task:{...task,base:'e'.repeat(40)}})).toBeNull()
    expect(validateReviewEvidence(check,{...context,claim:null})).toBeNull()
  })
})

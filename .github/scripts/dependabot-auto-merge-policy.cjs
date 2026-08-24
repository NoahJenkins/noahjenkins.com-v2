'use strict'

const REQUIRED_CHECKS = [
  'Security Audit',
  'Jest Tests',
  'Playwright Tests',
  'TypeScript Check',
  'Build Check',
]

const DEPENDABOT = 'dependabot[bot]'
const GITHUB_ACTIONS_GROUP_BRANCH =
  /^dependabot\/github_actions\/github-actions-(routine|security)-[0-9a-f]{10}$/

function ignored(reason) {
  return {
    status: 'ignored',
    reason,
    shouldEnableAutoMerge: false,
    shouldClose: false,
  }
}

function blocked(reason, ecosystem) {
  return {
    status: 'blocked',
    reason,
    ecosystem,
    shouldEnableAutoMerge: false,
    shouldClose: false,
  }
}

function getEcosystem(headRef) {
  if (headRef.startsWith('dependabot/npm_and_yarn/')) {
    return 'npm'
  }

  if (headRef.startsWith('dependabot/github_actions/')) {
    return 'github-actions'
  }

  return null
}

function isAllowedFile(ecosystem, file) {
  if (ecosystem === 'npm') {
    return file === 'package.json' || file === 'pnpm-lock.yaml'
  }

  return /^\.github\/workflows\/.+\.ya?ml$/.test(file)
}

function isStaleHead({ currentHeadSha, validatedHeadSha }) {
  return !currentHeadSha || currentHeadSha !== validatedHeadSha
}

function shouldBlockExistingApproval({ approvalCount, mergeableState }) {
  return (
    approvalCount > 0 &&
    ['clean', 'has_hooks', 'unstable'].includes(mergeableState)
  )
}

function evaluateDependabotPolicy(input) {
  if (input.triggeringActor !== DEPENDABOT) {
    return ignored('The triggering workflow actor is not Dependabot.')
  }

  if (input.author !== DEPENDABOT) {
    return ignored('The pull request author is not Dependabot.')
  }

  if (input.baseRef !== 'main') {
    return blocked('Dependabot automation only targets the main branch.')
  }

  if (input.draft || input.state !== 'open') {
    return blocked('Dependabot automation requires an open, non-draft pull request.')
  }

  if (
    isStaleHead({
      currentHeadSha: input.headSha,
      validatedHeadSha: input.workflowHeadSha,
    })
  ) {
    return ignored('The workflow run is stale for the current pull request head.')
  }

  const ecosystem = getEcosystem(input.headRef || '')
  if (!ecosystem) {
    return blocked('The Dependabot ecosystem is not allowed.')
  }

  if (input.mergeableState === 'dirty') {
    return blocked(
      'Native auto-merge is blocked by a merge conflict.',
      ecosystem,
    )
  }

  if (
    ecosystem === 'github-actions' &&
    !GITHUB_ACTIONS_GROUP_BRANCH.test(input.headRef)
  ) {
    return blocked(
      'GitHub Actions auto-merge requires a grouped patch/minor or security update.',
      ecosystem,
    )
  }

  if (!Array.isArray(input.changedFiles) || input.changedFiles.length === 0) {
    return blocked('The pull request has no changed files.', ecosystem)
  }

  const disallowedFile = input.changedFiles.find(
    (file) => !isAllowedFile(ecosystem, file),
  )
  if (disallowedFile) {
    return blocked(
      `The pull request changes a file outside the ${ecosystem} scope: ${disallowedFile}`,
      ecosystem,
    )
  }

  const checkResults = new Map(
    (input.checks || []).map((check) => [check.name, check.conclusion]),
  )
  const unsuccessfulChecks = REQUIRED_CHECKS.filter(
    (name) => checkResults.get(name) !== 'success',
  ).map((name) => `${name}=${checkResults.get(name) || 'missing'}`)

  if (input.workflowConclusion !== 'success' || unsuccessfulChecks.length > 0) {
    return blocked(
      `Native auto-merge is blocked because required checks are not successful: ${unsuccessfulChecks.join(', ')}`,
      ecosystem,
    )
  }

  return {
    status: 'ready',
    reason: 'All policy gates and required checks passed.',
    ecosystem,
    mergeMethod: 'SQUASH',
    shouldEnableAutoMerge: true,
    shouldClose: false,
  }
}

module.exports = {
  REQUIRED_CHECKS,
  evaluateDependabotPolicy,
  isStaleHead,
  shouldBlockExistingApproval,
}

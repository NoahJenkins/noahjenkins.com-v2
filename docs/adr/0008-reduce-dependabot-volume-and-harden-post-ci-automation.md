# ADR 0008: Reduce Dependabot Volume and Harden Post-CI Automation

**Status:** accepted

**Date:** 2026-08-24

**Supersedes:** ADR 0003, ADR 0006

## Context

ADR 0003 introduced policy-gated Dependabot auto-merge from a `pull_request_target` workflow. ADR 0006 extended that workflow so it closed pull requests that were outside the auto-merge policy. The repository history for a comparable eight-week period contained 44 Dependabot pull requests: 12 merged, 29 closed, and 3 open. This volume shows that package-specific version-update groups, routine reviewer and assignee requests, and automatic closure create avoidable maintenance work.

The workflow also made write decisions from the `pull_request_target` event before it had authoritative evidence from all required CI jobs. A safer design must run trusted default-branch code only after CI completes, then re-fetch current GitHub state before any write. It must preserve blocked pull requests for human review instead of hiding major updates, conflicts, CI failures, or policy violations through automatic closure.

ADR 0007 remains in effect. Dependabot security updates, Dependency Review, and full-SHA action pinning are unchanged.

## Options considered

1. **Keep package-specific groups and the existing `pull_request_target` workflow**
   - Pros: no migration work
   - Cons: preserves high pull request volume, early write-capable evaluation, and automatic closure

2. **Reduce scheduled update volume but keep the existing merge workflow**
   - Pros: fewer scheduled pull requests
   - Cons: does not remove the event-trust and stale-state risks

3. **Use catch-all scheduled groups and a trusted post-CI policy evaluator**
   - Pros: reduces routine pull request volume; evaluates current PR, file, and CI state from trusted default-branch code; keeps exceptions visible
   - Cons: requires strict event correlation, state re-fetching, and policy maintenance

## Decision

Adopt **Option 3**.

### Dependabot update grouping

- Use one weekly catch-all group for npm patch and minor version updates.
- Use one weekly catch-all group for GitHub Actions patch and minor version updates.
- Keep separate groups with `applies-to: security-updates`. Security update creation remains event-driven and is not delayed until the weekly version-update schedule.
- Do not request a routine assignee or reviewer for Dependabot updates.
- Allow major updates to be opened outside the catch-all version-update groups so the automation can classify them explicitly.

The expected volume is about 14 Dependabot pull requests over a comparable eight-week window, down from 44. This is an estimate of about a 68% reduction, not a guaranteed limit.

### Trusted post-CI evaluation

Replace write-capable `pull_request_target` handling with a `workflow_run` evaluator that runs trusted code from the default branch after the **CI** workflow completes. Before it changes a pull request, the evaluator must re-fetch the pull request, changed files, and CI jobs from GitHub and require all of these conditions:

- the triggering actor and current pull request author are `dependabot[bot]`
- the pull request is open, is not a draft, and targets `main`
- the current pull request head SHA exactly matches the head SHA validated by the completed CI run
- the Dependabot branch identifies either the npm or GitHub Actions ecosystem
- npm changes are limited to dependency manifests and lockfiles
- GitHub Actions changes are limited to workflow YAML files under `.github/workflows/`
- the exact required CI jobs named `Security Audit`, `Jest Tests`, `Playwright Tests`, `TypeScript Check`, and `Build Check` all completed successfully for that head SHA
- the pull request has no merge conflict and satisfies the remaining automation policy

When an npm update passes all gates, including a safe npm major update, the evaluator can add its policy-gated approval and enable GitHub's native squash auto-merge. It must not merge the pull request directly.

Grouped GitHub Actions patch, minor, and security updates can use the same native auto-merge path when all gates pass. A standalone GitHub Actions major update must remain open and blocked for manual review.

If CI fails, a required job is missing, the pull request conflicts, state has changed, or policy does not allow automation, keep the pull request open. Add the `automation-blocked` label and publish a check summary that states why automation did not proceed. Do not automatically close out-of-policy pull requests or approve a pull request before all policy gates pass.

## Consequences

- Weekly catch-all groups reduce routine Dependabot pull request volume.
- Security update groups remain separate and event-driven, so volume reduction does not delay alert remediation.
- Write actions use trusted default-branch workflow code and current GitHub state after CI.
- Exact job-name and head-SHA checks prevent stale or partial CI results from enabling auto-merge.
- Native auto-merge keeps branch protection authoritative and avoids a direct merge path.
- Safe npm majors can move without unnecessary manual work, while GitHub Actions majors remain visible for manual review.
- Autonomous GitHub Actions patch/minor and security updates still trust the upstream action release selected by Dependabot. Full-SHA pins prevent a mutable ref, but they do not remove the risk of a compromised upstream release. This residual risk is accepted to preserve the required autonomous update path.
- Failed, conflicting, stale, or disallowed pull requests remain open with a durable blocked reason.
- The required job-name list, file scopes, branch conventions, and Dependabot metadata mapping require maintenance when CI or dependency policy changes.

## Related context

- [Dependabot Volume Reduction](../context/2026-08-24-dependabot-volume-reduction.md)
- [CI/CD Pipeline](../architecture/ci-cd-pipeline.md)

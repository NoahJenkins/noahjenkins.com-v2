# Dependabot Volume Reduction

*Generated: 2026-08-24*

## Summary

The repository will reduce routine Dependabot pull request volume with ecosystem-wide weekly groups and will move auto-merge decisions to trusted default-branch code after CI completes. The design removes routine reviewer and assignee requests, removes automatic closure, and keeps blocked updates visible with a clear automation result.

## Verified baseline

A review of a comparable eight-week repository history found 44 Dependabot pull requests:

- 12 merged
- 29 closed
- 3 open

This baseline is an observed count. It is separate from the estimate below.

## Volume estimate

One catch-all npm patch/minor group and one catch-all GitHub Actions patch/minor group are expected to reduce the comparable eight-week total from 44 to about 14 pull requests. That is an estimated reduction of about 68%.

The estimate is directional. Security advisories, major releases, dependency conflicts, grouping compatibility, and Dependabot limits can change the actual total.

## Approved design

### Update creation

- Group all eligible npm patch and minor version updates into one weekly pull request.
- Group all eligible GitHub Actions patch and minor version updates into one weekly pull request.
- Keep separate npm and GitHub Actions security-update groups with `applies-to: security-updates` so security updates remain event-driven.
- Remove routine Dependabot reviewer and assignee requests.
- Leave major updates outside the weekly patch/minor groups for explicit policy evaluation.

### Post-CI automation

The write-capable evaluator runs on `workflow_run` after the **CI** workflow completes. This uses the trusted workflow definition from the default branch instead of executing a write policy directly from `pull_request_target`.

The evaluator re-fetches the current pull request, changed files, and CI jobs. It then verifies:

- Dependabot is both the workflow actor and current pull request author
- the pull request is open, is not a draft, and targets `main`
- the current head SHA equals the SHA from the completed CI run
- the Dependabot branch identifies npm or GitHub Actions
- changed files stay inside the dependency-only or workflow-only scope for that ecosystem
- `Security Audit`, `Jest Tests`, `Playwright Tests`, `TypeScript Check`, and `Build Check` each have an exact successful result
- the pull request is conflict-free and otherwise eligible

An eligible npm pull request, including a safe npm major update, can receive policy-gated approval and use GitHub's native squash auto-merge. Eligible GitHub Actions patch/minor updates can use the same path. Standalone GitHub Actions major updates remain open and blocked for manual review. The evaluator never merges directly.

CI failures, missing jobs, conflicts, unsupported scope, and other current-head policy failures leave the pull request open. The automation applies the `automation-blocked` label and publishes a check summary with the reason. If the pull request head no longer matches the validated CI head, the stale evaluator exits without changing the newer head's labels, reviews, or native auto-merge state. It does not auto-close the pull request or approve it before all policy gates pass.

## Outcome

The approved design reduces routine queue volume without weakening required CI evidence or concealing exceptions. Branch protection and GitHub's native auto-merge remain responsible for the final merge.

## Related decision

- [ADR 0008: Reduce Dependabot Volume and Harden Post-CI Automation](../adr/0008-reduce-dependabot-volume-and-harden-post-ci-automation.md)

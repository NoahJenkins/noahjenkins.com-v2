# Dependabot Auto-Close Policy and Audit Unblock
*Generated: 2026-03-31*

## Summary

Investigated the two open Dependabot PRs that should not have remained open and found two separate causes:

- PR `#137` was eligible for auto-merge and already approved by the workflow, but it was blocked by the required `Security Audit` check failing on the repository's existing dependency graph.
- PR `#138` was a semver-major GitHub Actions update. The workflow correctly treated it as ineligible, but the policy implementation only skipped it instead of closing it.

Implemented two fixes:

1. Updated the Dependabot workflow to close unsupported or out-of-scope Dependabot PRs with an explanatory comment.
2. Removed unused `ts-jest`, which was the source of the high/critical audit failures blocking eligible Dependabot PRs.

## Findings

### PR `#137`: eligible automation blocked by repo-level audit failure

PR `#137` (`wavesurfer.js` patch bump) already had all intended automation applied:

- workflow run succeeded
- approval review was created
- auto-merge was enabled

It remained open because `Security Audit` failed. The failure reproduced locally with `pnpm audit --audit-level=high` and traced to an unused `ts-jest -> handlebars@4.7.8` dependency path that introduced newly published high/critical advisories.

**Fix:** removed `ts-jest` from `package.json` and refreshed `pnpm-lock.yaml`. After the change:

- `pnpm audit --audit-level=high` exits successfully
- `pnpm test` still passes

### PR `#138`: unsupported update skipped instead of closed

PR `#138` (`codecov/codecov-action` v4 -> v6) is a semver-major GitHub Actions update. That is outside the repository's auto-merge policy, so the workflow did not approve or enable auto-merge. However, the workflow only emitted a successful no-op result, which left the PR open indefinitely.

**Fix:** collapsed the policy evaluation into a single workflow step that now classifies Dependabot PRs as either:

- eligible and safe: auto-approve + enable auto-merge
- unsupported/out-of-scope: comment with reason + close the PR

### Non-blocking observation

PR `#138` also showed a Dependabot comment noting that the `github-actions` label does not exist in the repository. This was not a merge blocker and did not contribute to the PR staying open.

## Open Questions

- None at implementation time. The remaining quarterly policy review TODO stays open for future scope changes.

**Related ADRs:**
- [ADR 0003: Dependabot Auto-Merge Policy](../adr/0003-dependabot-auto-merge-policy.md)
- [ADR 0006: Auto-Close Out-of-Policy Dependabot PRs](../adr/0006-auto-close-out-of-policy-dependabot-prs.md)

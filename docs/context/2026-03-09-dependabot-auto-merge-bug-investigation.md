# Dependabot Auto-Merge Bug Investigation
*Generated: 2026-03-09*

## Summary

Investigated why 5 open Dependabot PRs (#119–#123) were not being automatically merged despite the `dependabot-auto-merge.yml` workflow showing `conclusion: success` on every run. Found and fixed three separate bugs.

## Findings

### Bug 1: Ecosystem name mismatch (`npm` vs `npm_and_yarn`)

The workflow's eligibility check compared `$PACKAGE_ECOSYSTEM` against `"npm"`, but `dependabot/fetch-metadata` outputs `"npm_and_yarn"` for Node.js packages. The condition was always false for all 4 npm PRs, causing them to be silently skipped with `eligible=false`.

**Fix:** Added `"npm_and_yarn"` to the ecosystem allowlist in `.github/workflows/dependabot-auto-merge.yml`.

### Bug 2: Insufficient permissions for GraphQL mutation

`enablePullRequestAutoMerge` requires `contents: write`. The workflow was configured with `contents: read`, causing the mutation to fail with `"Resource not accessible by integration"`. The error was logged as a `core.warning` (not a failure), so the workflow still reported `conclusion: success`.

**Fix:** Changed workflow permission from `contents: read` to `contents: write`.

### Bug 3: Auto-merge disabled on the repository

GitHub's auto-merge feature (`allow_auto_merge`) was `false` on the repository. Even with correct permissions, the GraphQL mutation fails with `"Pull request Auto merge is not allowed for this repository"`.

**Fix:** Enabled via `gh api --method PATCH repos/... --field allow_auto_merge=true`.

### Observed side effect: `dismiss_stale_reviews`

Branch protection has `dismiss_stale_reviews: true`. Each time Dependabot rebases a PR (e.g. when triggered with `@dependabot rebase`), any existing approval is dismissed. If the auto-merge workflow runs between rebases, its approval will be wiped on the next rebase, leaving the PR blocked on review again.

This is not a bug in the workflow — it is expected branch protection behavior. PRs that are rebased after being approved will need the workflow to re-run (via a `synchronize` event) to re-approve.

## Resolution

- PRs #119–#122 (npm patch/minor): All 3 bugs fixed; PRs manually approved and auto-merge enabled. #119 merged immediately. #120–#122 pending CI completion.
- PR #123 (actions/github-script 7→8): Correctly excluded — major version bump is intentionally unsupported by policy.

## Open Questions

- Should the workflow be hardened to treat `core.warning` on the auto-merge step as a job failure so silent breakage is more visible?
- Should `dismiss_stale_reviews` be relaxed for bot-authored PRs, or is re-approval on rebase an acceptable trade-off?

**Related ADR:** [ADR 0003: Dependabot Auto-Merge Policy](../adr/0003-dependabot-auto-merge-policy.md)

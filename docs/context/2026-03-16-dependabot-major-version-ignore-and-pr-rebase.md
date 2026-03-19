# Dependabot Major Version Ignore Rule and PR Rebase
*Generated: 2026-03-16*

## Summary

Investigated 3 open Dependabot PRs (#125, #126, #127) that had not auto-merged. Identified two distinct issues and resolved both.

## Findings

### PR 126: Major version bump blocked by policy (expected behavior)

PR #126 bumped `@vercel/analytics` from 1.6.1 → 2.0.1 and `@vercel/speed-insights` from 1.3.1 → 2.0.0 — both major version updates. The auto-merge workflow correctly skipped it (`eligible=false`), but `dependabot.yml` had no ignore rule for major `@vercel/*` updates, meaning Dependabot would continue opening PRs that can never auto-merge.

**Fix:** Added a major version ignore rule for `@vercel/*` to `dependabot.yml`, consistent with how `tailwindcss`, `typescript`, and other packages are already handled.

```yaml
- dependency-name: "@vercel/*"
  update-types: ["version-update:semver-major"]
```

### PRs 125 and 127: BEHIND main, blocking auto-merge

PRs #125 (`@types/node` minor bump) and #127 (`wavesurfer.js` patch bump) had auto-merge correctly enabled and were approved by the workflow. However, both showed `mergeStateStatus: BEHIND` — branch protection requires `strict: true` (up-to-date with base), so auto-merge could not complete until the branches were rebased.

**Fix:** Triggered `@dependabot rebase` on both PRs via `gh pr comment`. Dependabot will rebase each branch, CI will rerun, and auto-merge will complete automatically.

## Open Questions

- PR #126 (vercel major bump) remains open and requires manual review. The 2.x releases of `@vercel/analytics` and `@vercel/speed-insights` are breaking changes; review release notes before merging.
- Consider whether the vercel group ignore rule should also cover minor versions, or whether minor vercel updates should continue to auto-merge.

**Related ADR:** [ADR 0003: Dependabot Auto-Merge Policy](../adr/0003-dependabot-auto-merge-policy.md)

# ADR 0003: Dependabot Auto-Merge Policy

**Status:** accepted  
**Date:** 2026-03-02

## Context

Dependency updates are frequent and mostly low-risk for patch/minor releases, but manual approval of every Dependabot PR adds latency and maintenance overhead. We need a controlled automation path that preserves branch protection guarantees and minimizes unsafe merges.

## Options considered

1. **Manual-only Dependabot merges**
   - Pros: highest human scrutiny
   - Cons: high operational overhead, slower security patch adoption

2. **Unrestricted Dependabot auto-merge**
   - Pros: fastest update throughput
   - Cons: broad blast radius; insufficient policy guardrails

3. **Policy-gated Dependabot auto-merge with branch protection enforcement**
   - Pros: balances speed and control; keeps CI/review gates authoritative
   - Cons: requires ongoing policy maintenance

## Decision

Adopt **Option 3**.

Implement a dedicated workflow that auto-approves and enables auto-merge only when all of the following are true:
- PR is authored by `dependabot[bot]` and targets `main`
- PR is not draft
- ecosystem is `npm`, `npm_and_yarn`, or `github-actions`
- update type is `semver-patch` or `semver-minor`
- changed files are restricted to `package.json`, `pnpm-lock.yaml`, or workflow YAML files

Keep branch protection enabled with required checks and required approvals so merge completion still depends on successful CI and repository protection rules.

## Consequences

- Reduced time-to-merge for low-risk dependency updates.
- Preserved protection posture by requiring existing CI checks and branch rules.
- Introduced policy maintenance responsibility (ecosystem/update/file-scope lists and status-check names must stay current).
- Major updates and non-conforming changes remain manual by design.

## Amendment — 2026-03-09: Bug fixes to initial implementation

Three bugs were discovered and fixed after the workflow's first real-world use against Dependabot PRs:

1. **Ecosystem name mismatch** — `dependabot/fetch-metadata` outputs `npm_and_yarn`, not `npm`. The eligibility check was updated to include `npm_and_yarn`.
2. **Insufficient permissions** — `enablePullRequestAutoMerge` GraphQL mutation requires `contents: write`. The workflow only had `contents: read`, causing silent failure. Updated to `contents: write`.
3. **Repository auto-merge disabled** — GitHub's auto-merge feature was not enabled on the repository. Enabled via API (`allow_auto_merge: true`).

Additionally, `dismiss_stale_reviews: true` in branch protection means approvals added by the workflow are discarded whenever Dependabot rebases. This is expected behavior; future rebases on already-approved PRs may require a re-approval trigger.

## Amendment — 2026-03-16: Ignore major version updates for @vercel/* packages

PR #126 exposed a gap: `dependabot.yml` had no ignore rule for the `vercel` package group's major versions. The auto-merge workflow correctly excluded the PR (major updates are outside policy), but Dependabot continued opening PRs that could never auto-merge.

Added an ignore rule to `dependabot.yml`:

```yaml
- dependency-name: "@vercel/*"
  update-types: ["version-update:semver-major"]
```

This aligns `@vercel/*` with the existing treatment of `tailwindcss`, `typescript`, and other packages where major version changes require manual review.

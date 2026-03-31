# ADR 0006: Auto-Close Out-of-Policy Dependabot PRs

**Status:** accepted  
**Date:** 2026-03-31

## Context

ADR 0003 established policy-gated auto-merge for eligible Dependabot patch/minor updates while leaving non-eligible updates for manual handling. In practice, that left unsupported Dependabot PRs open indefinitely whenever they fell outside the auto-merge policy, creating review noise and repeated cleanup work.

At the same time, recent investigation showed that open Dependabot PRs can have two very different causes:

- an eligible PR can be blocked by unrelated CI failures and should remain open until CI is fixed
- an ineligible PR outside the repository policy should not remain open at all

The repository now prefers automatic cleanup for out-of-policy Dependabot PRs rather than keeping them open for manual triage.

## Options considered

1. **Keep unsupported Dependabot PRs open**
   - Pros: maintainers can review every out-of-policy update manually
   - Cons: recurring noise; PR backlog accumulates with updates the repository already decided not to auto-merge

2. **Ignore specific updates in `dependabot.yml` only**
   - Pros: no workflow change; explicit per-package control
   - Cons: requires ongoing per-package maintenance; misses future unsupported PR classes until they recur

3. **Auto-close any Dependabot PR that fails the auto-merge policy**
   - Pros: aligns runtime behavior with policy intent; prevents stale unsupported PRs from accumulating
   - Cons: major or otherwise unsupported updates require manual reopening if they should be reviewed exceptionally

## Decision

Adopt **Option 3**.

Update the Dependabot workflow so that bot-authored PRs targeting `main` are evaluated once against the repository policy:

- if the PR is eligible and file-safe, auto-approve it and enable auto-merge
- if the PR falls outside the policy or file scope, post an explanatory comment and close it automatically

This supersedes the previous effective behavior of leaving unsupported Dependabot PRs open.

## Consequences

- Eligible patch/minor Dependabot PRs continue through the existing fast path.
- Unsupported Dependabot PRs no longer linger in the open PR list.
- Policy drift no longer depends solely on `dependabot.yml` ignore rules.
- Exceptional unsupported updates can still be handled manually by reopening or recreating them when explicitly desired.

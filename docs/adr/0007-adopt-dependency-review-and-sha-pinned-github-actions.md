# ADR 0007: Adopt Dependency Review and SHA-Pinned GitHub Actions

**Status:** accepted  
**Date:** 2026-03-31

## Context

The repository already used scheduled Dependabot version updates, CI dependency auditing, and policy-gated Dependabot auto-merge. However, three gaps remained:

- GitHub's automated Dependabot security fixes were disabled at the repository level
- pull requests had no dedicated dependency-diff review gate
- workflows referenced floating GitHub Action tags rather than immutable SHAs

These gaps weakened the repository's supply-chain posture even though the main dependency automation path was functioning.

## Options considered

1. **Keep existing CI-only dependency protection**
   - Pros: no additional workflow or settings churn
   - Cons: no automated security-fix PRs; weaker PR-time dependency analysis; mutable action refs remain

2. **Enable security updates and Dependency Review only**
   - Pros: improves dependency posture without workflow pinning work
   - Cons: GitHub Actions supply-chain risk remains

3. **Enable security updates, add Dependency Review, and enforce SHA-pinned actions**
   - Pros: improves dependency remediation, PR-time dependency scanning, and workflow integrity together
   - Cons: requires workflow ref maintenance and repo settings coordination

## Decision

Adopt **Option 3**.

- Enable repository-level Dependabot security updates.
- Add a `Dependency Review` workflow on pull requests to `main`.
- Configure Dependency Review to fail on newly introduced `high` or `critical` vulnerabilities.
- Disable license checks in Dependency Review because the repository does not maintain a license policy.
- Pin workflow action references to full commit SHAs and enable repository-level SHA pinning enforcement.
- Keep `Dependency Review` informational for now by not adding it to required branch protection checks in this pass.

## Consequences

- GitHub can now open automated security-fix PRs separately from scheduled version-update PRs.
- Pull requests gain a dedicated dependency-diff security signal before merge.
- Workflow action resolution becomes immutable and less susceptible to upstream tag drift.
- Future action upgrades require explicit SHA updates, typically via Dependabot or deliberate maintainer updates.
- Promoting `Dependency Review` to a required check remains a follow-up decision after observing runtime behavior.

# 2026-03-31 GitHub Security Hardening Pass

## Summary

Implemented the next GitHub security hardening pass focused on dependency remediation, pull request dependency diff scanning, and immutable GitHub Actions references.

## Findings / Details

- Repository-level Dependabot security updates were disabled even though scheduled Dependabot version updates were already configured.
- The repository had no dedicated Dependency Review workflow, so PR-time dependency diff analysis was not enforced separately from the existing `pnpm audit` CI job.
- Existing GitHub Actions workflows referenced floating major tags rather than full commit SHAs, which left action resolution mutable over time.

## Changes Made

- Added `.github/workflows/dependency-review.yml` to run `actions/dependency-review-action` on pull requests targeting `main`.
- Configured Dependency Review to fail on newly introduced `high` or `critical` vulnerabilities and disabled license checks because the repository does not maintain a license policy.
- Pinned all GitHub Actions workflow `uses:` references to full commit SHAs while preserving version comments.
- Enabled repository-level Dependabot security updates so GitHub can open security remediation PRs automatically.
- Enabled repository-level GitHub Actions SHA pinning enforcement after updating workflow references.
- Left branch protection unchanged for this pass, so `Dependency Review` is informational rather than required.
- Added a `pnpm.overrides` remediation for `brace-expansion` so the open moderate Dependabot alert can be resolved immediately without waiting for a backfilled security PR.

## Validation

- Confirmed workflows now reference pinned SHAs only.
- Confirmed repository settings now report:
  - `dependabot_security_updates.status = enabled`
  - `sha_pinning_required = true`
- Confirmed branch protection required status checks remain unchanged from the prior CI baseline.
- Confirmed the lockfile resolves `brace-expansion` to a patched version after reinstall.

## Related

- [ADR 0007: Adopt Dependency Review and SHA-Pinned GitHub Actions](../adr/0007-adopt-dependency-review-and-sha-pinned-github-actions.md)
- [ADR 0006: Auto-Close Out-of-Policy Dependabot PRs](../adr/0006-auto-close-out-of-policy-dependabot-prs.md)

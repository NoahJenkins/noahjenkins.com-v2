# PNPM-only Enforcement and Security Remediation
*Generated: 2026-02-21*

## Summary
Implemented repository-wide pnpm enforcement and completed remediation for the transitive `minimatch` vulnerability path previously reported in audit results. The project now declares pnpm as the package manager, blocks non-pnpm installs at `preinstall`, updates test scripts to pnpm usage, and removes `package-lock.json` to prevent lockfile drift.

## Options/Findings
- Added `packageManager` metadata in `package.json` and a pnpm-only `preinstall` guard to enforce a single package manager path.
- Added pnpm override for `minimatch` and refreshed lockfile resolution to `minimatch@10.2.2`.
- Removed `package-lock.json` to eliminate dual-lockfile inconsistency risk.
- Verification outcomes:
  - `pnpm audit`: no known vulnerabilities reported.
  - `pnpm test`: passes.
  - `pnpm build`: fails due to pre-existing `app/layout.tsx` client hook issue (not introduced by this change).

## Open Questions
- Should CI fail on high/critical audit findings by default (`pnpm audit --audit-level=high`)?
- Should pnpm-only enforcement be mirrored with a short contributor note in `README.md` prerequisites?
- Should we track the `app/layout.tsx` build issue as a separate remediation item with owner/ETA?

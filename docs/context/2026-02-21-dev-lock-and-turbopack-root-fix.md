# Dev Lock Conflict and Turbopack Root Fix
*Generated: 2026-02-21*

## Summary
Resolved local `next dev` startup failures caused by lock contention in `.next/dev/lock` and removed the noisy Turbopack workspace-root warning caused by an external lockfile in the parent directory.

## Options/Findings
- Root cause for startup failure: another active `next dev` process was already holding the `.next/dev/lock` file.
- Immediate remediation: terminated stale/active dev process and removed stale lock file before restarting dev.
- Root-warning remediation: added explicit `turbopack.root` in `next.config.js` to pin project root to this repository.

## Verification
- Fresh `pnpm dev` startup now succeeds without lock acquisition errors.
- Fresh `pnpm dev` startup no longer shows the “inferred workspace root / multiple lockfiles” warning.
- App serves on `http://localhost:3000` successfully.

## Open Questions
- Should we add a convenience script (e.g., `dev:clean`) that safely clears stale dev locks before starting?

# Layout Build Fix and CI Audit Gate
*Generated: 2026-02-21*

## Summary
Resolved the remaining production build blocker in `app/layout.tsx` and added a CI security gate that fails on high/critical dependency vulnerabilities.

## Options/Findings
- Build blocker root cause: `app/layout.tsx` (server component) imported `usePathname` from `next/navigation`, which is client-only.
- Remediation: removed the client hook import and removed unused browser pathname logic from the root layout.
- CI security gate added in `.github/workflows/ci.yml` as new `security-audit` job.
- Audit gate command: `pnpm audit --audit-level=high`.

## Verification
- `pnpm build`: passes successfully after layout fix.
- `pnpm test`: passes (6 suites, 85 tests).
- Existing warning remains from a lockfile outside the repo (`/Users/noahjenkins/package-lock.json`) and does not block the build.

## Open Questions
- Should CI enforce `pnpm install --frozen-lockfile` strictly (remove fallback to `--no-frozen-lockfile`)?
- Should additional security jobs be added (e.g., secret scanning or CodeQL) to complement dependency audit?

# Dev Memory Stability Mitigation (Webpack Mode)
*Generated: 2026-02-21*

## Summary
Mitigated a severe local dev stability issue where VS Code memory usage rapidly climbed during `next dev` sessions by switching local development from Turbopack to Webpack mode.

## Options/Findings
- Symptom: VS Code memory consumption increased rapidly (user-observed multi-GB growth), with instability during dev sessions.
- Implemented mitigation: changed `dev` script in `package.json` from `next dev` to `next dev --webpack`.
- Kept `dev:clean` script available for manual stale lock/process cleanup before startup.
- Note: Next.js still warns about external parent-directory lockfile detection (`/Users/noahjenkins/package-lock.json`), but this warning is non-blocking.

## Verification
- `pnpm run dev` now starts in **webpack** mode successfully.
- Application compiles and serves locally.
- `pnpm build` compiles successfully.

## Open Questions
- Is additional memory monitoring needed over a longer dev session to confirm sustained stability?
- Should we add a dedicated `dev:turbo` script for optional, explicit Turbopack testing instead of default usage?

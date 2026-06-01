# pnpm Workspace Root Memory Investigation
*Generated: 2026-06-01*

## Summary
Investigated an apparent Node memory leak during `pnpm build`, removed unintended home-directory pnpm workspace inheritance, and aligned the repository toward its intended local toolchain. The remaining high-memory path was Turbopack production builds in this environment, so the default build script was switched to Webpack and Turbopack was left as an explicit opt-in script.

## Findings/Details
- Before the change, `pnpm root -w` from this repository resolved to `/Users/noahjenkins/node_modules`.
- Machine-local cause: `/Users/noahjenkins/pnpm-workspace.yaml` and `/Users/noahjenkins/package.json` define a home-directory pnpm workspace.
- The home-level workspace was moved to `/Users/noahjenkins/Tools/claude-code-pnpm`, and `pnpm root -w` now resolves to `/Users/noahjenkins/Code/noahjenkins.com/node_modules` in this repository.
- Installed `node@20` locally via Homebrew at `/opt/homebrew/opt/node@20/bin/node`, without changing the machine-wide linked Node version.
- Added `.nvmrc` and `.node-version` with `20` so the repository declares the same major Node version used in CI.
- Moved pnpm security overrides out of `package.json` and into the repo-local `pnpm-workspace.yaml`, which avoids pnpm 11 deprecation noise while keeping the override policy local to the repo.
- Direct `node node_modules/next/dist/bin/next build --experimental-debug-memory-usage` on Node 20 still showed high memory during the Turbopack TypeScript phase.
- Direct `node node_modules/typescript/bin/tsc --noEmit` also completed normally and stayed under roughly 0.5 GB RSS.
- After the workspace-root fix, `pnpm build` no longer inflated before `next build` started. The remaining high-memory behavior tracked the Turbopack build path itself.
- Direct `node node_modules/next/dist/bin/next build --webpack` on Node 20 completed successfully end to end.
- Repository build scripts were updated so `pnpm build` now uses `next build --webpack`, and `build:turbo` remains available for explicit retesting.

## Open Questions
- The machine-wide default `node` and `pnpm` commands still point to the newer Homebrew installs unless the shell PATH is adjusted. Decide whether to switch the machine default, or keep Node 20 and repo-pinned pnpm as explicit per-repo tooling.
- Re-test `build:turbo` after future Next.js upgrades to see whether Turbopack production-build memory behavior improves enough to make it the default again.

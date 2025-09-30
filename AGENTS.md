# AGENTS.md

This file provides guidance to agents when working with code in this repository.

Build & test (non-obvious)
- Use pnpm where README and Playwright expect it; primary scripts live in [`package.json`](package.json:3).
- Run a single Jest test: use the test script with a path, e.g. `pnpm test test/app/blog/format-date.test.ts` (or `npm run test -- test/app/blog/format-date.test.ts`).
- Run a single Playwright spec: `pnpm test:ui test/ui/terminal.spec.ts --project=chromium`. Locally install browsers first: `pnpm exec playwright install`.
- CI Playwright webServer uses `pnpm build && pnpm start`; note `test:all:clean` forcibly kills a running dev server (`pkill -f 'next dev'`) before running tests.

Jest & TypeScript quirks
- UI/E2E tests are intentionally ignored by Jest (see [`jest.config.js`](jest.config.js:12)); Jest is used for unit/integration only.
- Imports use path aliases (`@/*`) from [`tsconfig.json`](tsconfig.json:17); prefer `@/lib/...` or `@/app/...` imports so Jest's `moduleNameMapper` resolves them.
- `jest.config.js` has a transform exception for `wavesurfer.js` (`transformIgnorePatterns`) — adding untranspiled deps may require updating this.
- `tsconfig.json` explicitly excludes `test/**/*`, so `tsc --noEmit` (CI type-check) does NOT validate test files — tests are type-checked through Jest/ts-jest only.

Playwright specifics
- Terminal E2E tests are desktop-only; mobile projects skip them via `testIgnore` in [`playwright.config.ts`](playwright.config.ts:31).
- Playwright's local webServer starts `pnpm dev` by default (see `webServer.command`); do not run a separate dev server when running `pnpm test:ui` unless you intentionally reuse an existing server.

Project-specific utilities & gotchas
- Canonical blog content is in [`app/blog/posts/`](app/blog/posts/:1) and parsed by [`app/blog/utils.ts`](app/blog/utils.ts:1) — use those utilities for slug/metadata logic.
- Dynamic Open Graph images are generated at [`app/og/route.tsx`](app/og/route.tsx:1).
- CI expects a successful `pnpm build` that creates `.next`; changing build scripts can break Playwright CI which runs against a built site.

Keep entries here strictly non-obvious and repo-specific — if a rule is derivable from file names or standard framework behavior, omit it.
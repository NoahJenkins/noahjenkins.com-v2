# AGENTS.md

This file provides debug-mode, non-obvious rules for agents working in this repo.

- Playwright launches the app itself (webServer.command). Locally it runs `pnpm dev`; CI uses `pnpm build && pnpm start`. Do NOT run a separate dev server when executing `pnpm test:ui` unless you intentionally want to reuse an existing server.
- `pnpm test:all:clean` forcibly kills a running dev server using `pkill -f 'next dev'` before tests — useful when Playwright fails to bind to :3000.
- Jest tests suppress noisy output in setup (see `jest.setup.js`) and some tests mock `console.error`/`process.cwd()`; don't assume console traces appear during test runs.
- Jest ignores `test/ui/` (Playwright E2E). When a failing UI test looks like a unit failure, check the correct runner before debugging.
- Playwright terminal specs expect input to be auto-focused and are desktop-only (mobile projects skip terminal tests via `testIgnore`); reproduce locally with `pnpm test:ui --project=chromium`.
- Tests use mocked time and environment in places (date mocking, fake timers). If a flaky test depends on time, inspect for timers or mocked Date usage in the test file.
- If adding native or untranspiled ESM deps, update `jest.config.js` transform settings (wavesurfer.js is already whitelisted) — otherwise Jest will fail during transforms.
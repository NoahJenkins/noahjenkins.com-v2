# AGENTS.md

This file provides architect-mode, non-obvious constraints for agents.

- App Router files under [`app/`](app/:1) may be server components; avoid browser globals in files under app/ (layout, page, og route) — changing component types can break runtime and tests.
- Dynamic OG images are produced by [`app/og/route.tsx`](app/og/route.tsx:1); CI/Playwright expect that route and its signature to remain stable — changing it breaks previews and E2E tests.
- `app/about/page.tsx` renders a GitHub README via `lib/github-api.ts` with caching/fallback logic; removing the fallback will surface runtime failures on network errors.
- The GlobalTerminal modal is injected in the root layout (`app/layout.tsx`); many UI tests and pages assume its presence.
- Playwright CI runs against a production server (`pnpm build && pnpm start`); expect SSR/SSG/asset differences vs `pnpm dev` when diagnosing E2E failures.
- Tests mirror `app/` under `test/` and rely on exact paths/fixtures; moving app files requires corresponding test updates.
- Path alias `@/*` is relied on across runtime and tests; changing import styles requires updating `tsconfig.json` and `jest.config.js` moduleNameMapper.
- CI requires a `.next` production build artifact; altering build scripts or output names will break Playwright CI steps.

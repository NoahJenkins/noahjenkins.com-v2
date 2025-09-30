# AGENTS.md

This file provides code-mode, non-obvious rules for agents working in this repo.

- Prefer path-alias imports to match Jest mapping: use [`@/lib/...`](@/lib:1) or [`@/app/...`](@/app:1) so tests and runtime resolve correctly (see [`jest.config.js`](jest.config.js:13)).
- Do not add untranspiled ESM deps without updating Jest's transformIgnorePatterns — `wavesurfer.js` is already whitelisted (`jest.config.js`:19-21).
- Tests are excluded from TypeScript `tsc` checks (`tsconfig.json`:35). Rely on Jest/ts-jest for test type validation.
- Next.js App Router files under [`app/`](app/:1) may be server components — avoid using browser globals (window/localStorage) in those files.
- Canonical blog parsing lives in [`app/blog/utils.ts`](app/blog/utils.ts:1); use it for slug/metadata rather than rolling your own.
- Dynamic OG generation is implemented at [`app/og/route.tsx`](app/og/route.tsx:1); changing its route signature can break social previews and tests.
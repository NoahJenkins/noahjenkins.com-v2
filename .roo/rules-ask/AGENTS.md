# AGENTS.md

This file provides ask-mode, non-obvious documentation context for agents.

- Primary documentation is the repo README — it contains explicit test commands and CI expectations (not just standard Next.js docs).
- Canonical blog parsing logic lives in app/blog/utils.ts — ask there for slug/metadata behavior rather than assuming frontmatter shape.
- MDX posts live in app/blog/posts/ and are the source of truth for post routing and dates.
- Dynamic OG images are produced by app/og/route.tsx — changing its signature breaks previews and tests.
- Tests mirror app/ in the test/ directory; when asking about behavior, reference the corresponding test file for examples of expected outputs.
- Jest ignores test/ui/ (Playwright). For UI behavior questions prefer test/ui/* and playwright.config.ts for runtime assumptions (baseURL, webServer).
- Type-checking excludes test/**/* in tsconfig.json — ask if a change affects CI type-check expectations.
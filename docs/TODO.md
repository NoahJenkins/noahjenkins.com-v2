# Project Task Tracker

Last Updated: 2026-10-13

> Living document for major project tasks. Update status continuously during planning and implementation.

## Onboarding

- [x] Run repository analysis and detect tech stack
- [x] Establish docs structure (`docs/architecture/`, `docs/adr/`, `docs/context/`)
- [x] Create initial ADR (`docs/adr/0001-adopt-documentation-structure.md`)
- [x] Generate onboarding summary report

## Architecture & Documentation

- [x] Add/update architecture documentation
- [x] Add context/research notes and update `docs/context/index.md`
- [x] Record new architectural decisions as ADRs
- [x] Sync GitHub Copilot instructions, agents, and skills to detected agent targets (CLAUDE)
- [x] Consolidate component directories and standardizing to `@/components/` alias

## Security & Quality

- [x] Run dependency/security audit
- [x] Review secret handling and `.gitignore` coverage
- [x] Address critical/high findings
- [x] Enforce pnpm-only package manager usage in repository scripts/config
- [x] Resolve local dev startup lock conflict and Turbopack root warning
- [x] Add manual `dev:clean` script for safe lock/process cleanup before dev startup
- [x] Switch local dev script to Webpack mode for stability under VS Code
- [x] Add Dependabot auto-merge automation for eligible patch/minor updates
- [x] Auto-close out-of-policy Dependabot PRs and remove unused audit-blocking `ts-jest`
- [x] Align branch protection required status-check contexts to current CI job names
- [x] Enable administrator bypass on `main` branch protection to preserve VS Code direct push workflow
- [x] Remediate GitHub CodeQL stored XSS alerts in blog links, JSON-LD serialization, and RSS feed generation
- [x] Enable Dependabot security updates, add Dependency Review workflow, and enforce SHA-pinned GitHub Actions refs
- [x] Remediate open Dependabot alert for transitive `brace-expansion` via `pnpm.overrides`

- [x] Investigate three Vercel Dependabot preview failures and confirm the discontinued Node.js 20 cause — 2026-10-13 ([context](./context/2026-10-13-vercel-dependabot-preview-failures.md))

## Content Management

- [x] Organize blog posts chronologically (newest first) and update `format-blog-post` skill for date-prefix naming convention

## Blocked

- [x] Resolve pre-existing `app/layout.tsx` client hook build error (unrelated to pnpm/security remediation)

## Follow-ups

- [x] Align manifests, local pins, all five CI jobs, and the Vercel project to Node.js 24; validate frozen install, build, TypeScript, and Jest locally — 2026-10-13
- [x] Complete final local install/build/TypeScript/Jest and 44 non-Firefox browser checks after dependency remediation — 2026-10-13
- [x] Verify PR #285 Vercel preview is READY at its head SHA and authenticated home/RSS/robots responses return HTTP 200 — 2026-10-13
- [x] Verify all hosted CI checks, including full Linux Playwright, pass for PR #285 at `b899d33` (run `38464742626`); recheck the latest head after the documentation commit — 2026-10-13
- [ ] Review and approve PR #285, merge the validated change, and rebase affected Dependabot PRs
- [x] Remediate the six high-severity audit findings; `pnpm audit --audit-level=high` passes locally with no gate change — 2026-10-13
- [ ] Monitor the remaining moderate `sprintf-js` advisory for an upstream patch

- [x] # TODO: Add CI audit gate for high/critical vulnerabilities (`pnpm audit --audit-level=high`)
- [x] # TODO: Fix Dependabot auto-merge workflow (npm_and_yarn ecosystem mismatch, contents:write permission, repo allow_auto_merge flag) — 2026-03-09
- [x] # TODO: Re-review Dependabot auto-merge policy scope quarterly (ecosystems, semver scope, allowed file paths) — 2026-08-24
- [ ] # TODO: Revisit administrator bypass decision if team size or branch safety requirements increase
- [ ] # TODO: Observe `Dependency Review` results and decide whether to add it to required branch protection checks
- [ ] # TODO: Add regression tests for generated RSS/XML and blog URL composition paths beyond utility-level coverage
- [ ] # TODO: Re-evaluate `pnpm.overrides` regularly and remove overrides when upstream chains are fully patched
- [ ] # TODO: Monitor VS Code memory behavior with `pnpm run dev` (webpack mode) across longer sessions

## Definition of Done

- [x] Acceptance criteria are met
- [x] Relevant docs are updated (`README`, ADRs, context notes, or architecture docs as applicable)
- [x] Security/quality checks for the change are completed
- [x] Any follow-up work is captured as new TODO items

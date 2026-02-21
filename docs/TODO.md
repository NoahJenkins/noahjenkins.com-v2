# Project Task Tracker

Last Updated: 2026-02-21

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

## Security & Quality
- [x] Run dependency/security audit
- [x] Review secret handling and `.gitignore` coverage
- [x] Address critical/high findings
- [x] Enforce pnpm-only package manager usage in repository scripts/config
- [x] Resolve local dev startup lock conflict and Turbopack root warning
- [x] Add manual `dev:clean` script for safe lock/process cleanup before dev startup
- [x] Switch local dev script to Webpack mode for stability under VS Code

## Blocked
- [x] Resolve pre-existing `app/layout.tsx` client hook build error (unrelated to pnpm/security remediation)

## Follow-ups
- [x] # TODO: Add CI audit gate for high/critical vulnerabilities (`pnpm audit --audit-level=high`)
- [ ] # TODO: Re-evaluate `pnpm.overrides` regularly and remove overrides when upstream chains are fully patched
- [ ] # TODO: Monitor VS Code memory behavior with `pnpm run dev` (webpack mode) across longer sessions

## Definition of Done
- [x] Acceptance criteria are met
- [x] Relevant docs are updated (`README`, ADRs, context notes, or architecture docs as applicable)
- [x] Security/quality checks for the change are completed
- [x] Any follow-up work is captured as new TODO items

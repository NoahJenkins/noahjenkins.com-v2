# Project-Specific Guidelines for GitHub Copilot

## Project Overview
Auto-generated from repository analysis (brownfield mode).
- Primary language(s): TypeScript, JavaScript (Next.js App Router)
- Framework(s): Next.js 16, React 19, Tailwind CSS 4
- Architecture pattern: Monolithic Next.js web app with route-based pages, shared component library, and utility modules

## Coding Standards

### Language & Framework Versions
- Next.js: `^16.1.6`
- React / React DOM: `^19.2.4`
- TypeScript: `5.9.3`
- Tailwind CSS: `4.2.0`
- Jest: `^30.2.0`
- Playwright: `^1.58.2`

### Code Style
Observed patterns:
- Naming conventions:
  - Components: PascalCase exports in kebab-case filenames (`repo-card.tsx`, `audio-player.tsx`)
  - Utility modules: kebab-case filenames, camelCase symbols
- File organization:
  - App routes and route-local components under `app/`
  - Shared components under `components/`
  - Shared logic under `lib/`
  - Tests under `test/`
- Import/module structure:
  - `@/*` path alias is enabled and preferred for root imports
- Error handling patterns:
  - Prefer explicit fallbacks and safe rendering for external data paths
- Testing patterns observed:
  - Unit tests via Jest and Testing Library
  - End-to-end tests via Playwright in `test/ui/`

### Testing Conventions
- Test file naming: `*.test.ts` and `*.spec.ts`
- Test framework: Jest + Testing Library + Playwright
- Coverage expectations: Jest coverage is generated in `coverage/`
- Mocking approach: Jest mocks and setup in `jest.setup.js`

## Documentation Structure

This repository follows a structured documentation approach:

### docs/architecture/
High-level architecture overviews, system diagrams, and data flow documentation. Update when overall system design changes significantly.

### docs/adr/ (Architecture Decision Records)
Architecture Decision Records documenting significant architectural choices. Files are named `NNNN-short-title.md` (e.g., `0001-use-postgresql.md`). ADRs are immutable and append-only.

**Each ADR must include:**
- Status (proposed, accepted, deprecated, superseded)
- Context (problem, constraints, requirements)
- Options considered (alternatives with pros/cons)
- Decision (what was chosen and why)
- Consequences (trade-offs, implications)

Write an ADR when decisions affect structure, dependencies, non-functional requirements, interfaces, or construction techniques.

### docs/context/
Exploratory research, planning session notes, and working documentation. Files named `YYYY-MM-DD-topic-name.md` with Summary, Options/Findings, and Open Questions sections. Maintain an `index.md` linking related notes to resulting ADRs.

### docs/TODO.md
Living project task tracker. Add major tasks as they arise, keep checkbox status current (`- [ ]` / `- [x]`), and mark completed tasks immediately as work finishes.

## Information Sources Priority

### 1. Primary: Documentation Lookup Tools
- Use available documentation lookup tools for all technical documentation lookups when available
- Look up:
  - Library and framework documentation
  - API references
  - Language features and syntax
  - Best practices for current versions
- If no documentation tools are configured, proceed to first-party sources below

### 2. Secondary: First-Party Official Documentation
Use first-party official documentation sources:
- learn.microsoft.com for Microsoft technologies
- Official GitHub repositories and documentation sites
- Vendor-maintained documentation portals
- Language specification documents

### 3. Never Rely Solely on Training Data
- Do not use potentially outdated training data for:
  - Current library versions
  - Recent framework features
  - Breaking changes in newer versions
  - Deprecated APIs or patterns
- Always verify current best practices with official sources

## Security Guidelines

### Critical Requirements
- Never commit secrets, credentials, API keys, or tokens to the repository
- Always use environment variables for sensitive configuration
- Validate and sanitize all user input
- Implement proper authentication and authorization where applicable
- Keep dependencies up to date with security patches

### Code Review Focus
- Input validation and sanitization
- Authentication and authorization checks
- Secure data handling (encryption, hashing)
- Error handling that doesn't leak sensitive information
- Dependency vulnerabilities

## Build & Deployment
- Build command: `pnpm build`
- Test command: `pnpm test` and `pnpm test:ui`
- Development server: `pnpm dev`
- Production build/start: `pnpm build` then `pnpm start`
- CI pipeline: GitHub Actions in `.github/workflows/ci.yml`

## Documentation Update Policy (Automatic, No Prompt)

For any non-trivial code change, update documentation in the same turn without asking for confirmation.

### Required behavior
- Perform a docs impact check after every code edit.
- If impacted, automatically update relevant files under `docs/`, including:
  - `docs/TODO.md`
  - `docs/context/index.md`
  - A new dated context note in `docs/context/`
  - A new ADR in `docs/adr/` when architecture/behavior/dependency/runtime decisions changed
  - `docs/architecture/` when execution flow/system design changed
- Do NOT ask whether documentation should be updated when required changes are clear.
- If no docs changes are needed, explicitly state why.

### Autonomy rule
- Assume user consent for documentation updates directly related to implemented code changes.

### Completion gate
- A task is incomplete until required documentation updates are applied.

### Delegation requirement
- Use `@documentation-specialist` automatically after implementation for docs updates.

### ADR triggers
- Create or update ADRs after significant design or architecture sessions.
- Create or update ADRs when decisions affect structure, dependencies, interfaces, runtime, or behavior.
- Create or update ADRs when adopting new technologies or patterns.

### Context note triggers
- Create context notes after research or exploratory work.
- Create context notes during planning sessions.
- Create context notes when documenting why behind experiments.

### Architecture doc triggers
- Update architecture docs after refactors that change system structure.
- Update architecture docs when adding new major components or services.
- Update architecture docs when data flows or integrations change.

## General Documentation Principles
- Keep files focused on one topic
- Use Markdown format for all documentation
- Link between documents (ADRs reference context notes, context notes link to ADRs)
- Documentation is version-controlled alongside code
- Never commit secrets, credentials, or sensitive PII to documentation folders

## Sub-Agent Delegation

This repository has specialized Copilot agents in `.github/agents/`. Delegate tasks to the appropriate agent:

| Task type | Delegate to | How to invoke |
|-----------|------------|---------------|
| Technical research, library docs, version lookups, API references | `@research-agent` | Use for any question requiring up-to-date technical documentation or exploratory research |
| Code quality review, standards compliance, refactoring suggestions | `@code-reviewer` | Use when reviewing code changes, PRs, or assessing code quality |
| Security analysis, vulnerability scanning, secrets detection | `@security-specialist` | Use for security reviews, dependency audits, or assessing attack surface |
| ADRs, architecture docs, context notes, README updates | `@documentation-specialist` | Use when creating or updating any documentation in `docs/` |

### When to delegate
- Research: before implementing unfamiliar patterns or integrating new libraries → `@research-agent`
- Code review: when reviewing pull requests or standards adherence → `@code-reviewer`
- Security: when adding auth, handling user input, managing secrets, or updating dependencies → `@security-specialist`
- Documentation: when architectural decisions are made, after significant refactors, or when creating planning/research notes → `@documentation-specialist`

### Delegation guidelines
- Provide sub-agents with relevant context (file paths, code snippets, requirements)
- Let sub-agents complete analysis before acting on results
- Use multiple agents in sequence where tasks span concerns
- After any non-trivial implementation change, use `@documentation-specialist` automatically to apply required docs updates in the same turn

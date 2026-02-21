---
description: Automated repository onboarding for both greenfield and brownfield projects — scans existing repos or scaffolds new ones based on intended tech stack, creating custom instructions, documentation structure, IDE configuration, GitHub templates, security baseline, and development environment setup
---

# OnboardCopilot: Automated Repository Setup

Scan this repository and perform the following comprehensive onboarding tasks.

## Greenfield vs Brownfield Detection

Before starting, determine the repository mode:

1. **Check for existing source code**: Look for source files (`.js`, `.ts`, `.py`, `.go`, `.rs`, `.java`, `.rb`, etc.), dependency manifests (`package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`, `pom.xml`, `Gemfile`, etc.), and build configurations.

2. **Classify the repository**:
   - **Brownfield** (existing code): Proceed with codebase scanning and detection as described in each section.
   - **Greenfield** (blank/empty repo — no source code, no dependency manifests): Prompt the user for their intended tech stack before proceeding.

3. **Greenfield tech stack prompt**: If the repository is greenfield, ask the user:
   - **Primary language(s)**: e.g., TypeScript, Python, Go, Rust, Java
   - **Framework(s)**: e.g., Next.js, FastAPI, Spring Boot, Gin, Actix
   - **Package manager**: e.g., npm, pnpm, yarn, pip, poetry, cargo
   - **Testing framework**: e.g., Jest, Vitest, pytest, go test, JUnit
   - **Database** (if any): e.g., PostgreSQL, MongoDB, SQLite
   - **Deployment target** (if known): e.g., Vercel, AWS, Docker, Kubernetes

4. **Use the user's answers as the "detected" tech stack** for all subsequent sections. Where brownfield sections say "detected" or "analyze", greenfield mode uses the user's stated intentions instead. Scaffolding is generated based on the intended stack where applicable.

> Throughout this document, **"detected tech stack"** means either scanned from existing code (brownfield) or provided by the user (greenfield).

## General Guidance

### Edge Cases & Conditional Logic
Before executing each section, evaluate whether it applies to this repository:
- **New/empty repository with no git history**: Skip CODEOWNERS generation (Section 6). Do not create a CODEOWNERS file.
- **No `.env` file in repository**: Do not create `.env.example`.
- **Monorepo with multiple languages**: Apply language-specific patterns for ALL detected languages. Create separate sections in `.env.example` (only when applicable), `.gitignore`, and pre-commit hooks for each language.
- **Files already exist**: Always merge with existing content. Never overwrite without preserving current entries. Add new content in clearly commented sections.
- **Pre-commit not available**: If the project doesn't use Python and `pre-commit` would be an unusual dependency, use ecosystem-native alternatives that do not require creating `.husky/` (for example, `lefthook`).
- **CI/CD not present**: Skip Section 11 entirely. Note the absence in the summary report.

### Merging Strategy
When a file to be created or modified already exists:
1. Read the existing file content first
2. Preserve all existing entries and configurations
3. Add new content in clearly labeled sections with comments (e.g., `# Added by OnboardCopilot`)
4. Remove exact duplicates but keep the existing version if formatting differs
5. For `.vscode/settings.json`, merge keys — never overwrite existing user/team preferences

### Sub-Agent Delegation
After installing the custom agents in Section 9, delegate specialized work to them as sub-agents for the remainder of the onboarding process:

| Section | Delegate to | Reason |
|---------|------------|--------|
| 1. Codebase Analysis | `@research-agent` | Technical research, version lookups, framework identification |
| 11. CI/CD Pipeline Documentation | `@documentation-specialist` | Structured documentation creation |
| 12. Initial ADR | `@documentation-specialist` | ADR authoring follows agent's specialization |
| 13. Security Baseline Report | `@security-specialist` | Vulnerability scanning, secrets detection, dependency audit |
| 14. Summary Report | `@documentation-specialist` | Final report authoring |

Optional expanded delegates (installed only when detected stack/repo characteristics warrant them):
- Frontend-heavy repos → `@frontend-specialist`
- Backend/service-heavy repos → `@backend-specialist`
- Data-intensive repos (schema/migrations/query-heavy) → `@data-specialist`
- CI/CD/infrastructure-heavy repos → `@devops-specialist`

When delegating:
- Provide the sub-agent with all context gathered so far (detected languages, frameworks, file paths, etc.)
- Let the sub-agent execute its full workflow — do not duplicate its responsibilities
- Review the sub-agent's output before finalizing
- If a sub-agent is not yet installed (i.e., Section 9 hasn't run yet), perform the work directly and note that delegation will be available for future runs

## 1. Codebase Analysis

> **Sub-agent delegation**: Use `@research-agent` to conduct the codebase analysis. Provide it with the repository root path and ask it to identify all technologies, frameworks, versions, and patterns listed below. Incorporate its findings into the analysis output.

> **Greenfield mode**: If the repository is empty, skip scanning. Instead, record the user's tech stack answers from the Greenfield Detection step as the analysis output. Use these answers as the "detected" stack for all subsequent sections.

Analyze and document the following:
- Primary programming languages and their versions
- Frameworks and libraries in use (with versions)
- Testing tools, frameworks, and test patterns
- Build systems and package managers (npm, pip, maven, cargo, etc.)
- CI/CD configuration files and workflows
- Code style tools (linters, formatters)
- Dependency management approach
- Project structure and architecture patterns
- Containerization setup (Dockerfile, docker-compose.yml, .devcontainer/)
- Monorepo tooling (lerna, pnpm workspaces, nx, turborepo)
- License files and type

## 2. Documentation Structure

Create the following directories if they don't exist:

### docs/architecture/
- Purpose: High-level architecture overviews, system diagrams, data flow documentation
- Store information about how the system is structured and component interactions
- Update when overall system design changes significantly

### docs/adr/ (Architecture Decision Records)
- Purpose: Numbered decision records documenting significant architectural choices
- Naming convention: `NNNN-short-title.md` (e.g., `0001-use-postgresql.md`)
- ADRs are append-only and immutable—never delete or edit existing ADRs
- Each ADR must include:
  - **Status**: proposed, accepted, deprecated, superseded
  - **Context**: the problem, constraints, requirements
  - **Options considered**: alternatives with pros/cons
  - **Decision**: what was chosen and why
  - **Consequences**: trade-offs, implications, what this enables or costs
- Write an ADR when decisions affect structure, dependencies, non-functional requirements, interfaces, or construction techniques
- If a decision is later reversed, create a new ADR that supersedes the old one

### docs/context/
- Purpose: Exploratory research, planning session notes, working documentation
- Naming convention: `YYYY-MM-DD-topic-name.md`
- Each note should include:
  - **Summary**: key findings, 2-3 sentences
  - **Options/Findings**: detailed exploration
  - **Open Questions**: unresolved items
  - Optional: Transcript/Details section for verbose content
- Create `docs/context/index.md` that groups related notes and links to resulting ADRs
- These notes support ADRs but are more informal and exploratory

### docs/TODO.md
- Purpose: Living task tracker for all major project work
- Create `docs/TODO.md` if it does not exist; if it exists, merge and preserve existing tasks
- Add a `Last Updated` line at the top of the file (ISO date format: `YYYY-MM-DD`) and refresh it whenever tasks change
- Track major tasks using checkboxes (e.g., `- [ ]` for open, `- [x]` for completed)
- Organize tasks by section when helpful (e.g., Onboarding, Architecture, Security, Follow-ups)
- Include a `Blocked` section for tasks waiting on external dependencies (people, approvals, vendor access, infrastructure, etc.)
- Include a short `Definition of Done` checklist so task completion is consistent across contributors
- Actively maintain this file throughout execution:
  - Add new major tasks as they are identified
  - Mark tasks completed immediately when finished
  - Move tasks into/out of `Blocked` as dependency status changes
  - Update the `Last Updated` date whenever any task state changes
  - Add brief `# TODO:` notes for unclear ownership or follow-up actions
- If creating a new file, initialize it with this starter template:

```markdown
# Project Task Tracker

Last Updated: 2026-02-19

> Living document for major project tasks. Update status continuously during planning and implementation.

## Onboarding
- [ ] Run repository analysis and detect tech stack
- [ ] Establish docs structure (`docs/architecture/`, `docs/adr/`, `docs/context/`)
- [ ] Create initial ADR (`docs/adr/0001-adopt-documentation-structure.md`)
- [ ] Generate onboarding summary report

## Architecture & Documentation
- [ ] Add/update architecture documentation
- [ ] Add context/research notes and update `docs/context/index.md`
- [ ] Record new architectural decisions as ADRs

## Security & Quality
- [ ] Run dependency/security audit
- [ ] Review secret handling and `.gitignore` coverage
- [ ] Address critical/high findings

## Blocked
- [ ] # TODO: Add blocked tasks here with dependency notes (e.g., waiting on approvals, access, vendor responses)

## Follow-ups
- [ ] # TODO: Add team-specific onboarding tasks
- [ ] # TODO: Assign owners and due dates for open items

## Definition of Done
- [ ] Acceptance criteria are met
- [ ] Relevant docs are updated (`README`, ADRs, context notes, or architecture docs as applicable)
- [ ] Security/quality checks for the change are completed
- [ ] Any follow-up work is captured as new TODO items
```

## 3. Environment Configuration

### .env.example Template
Only if a `.env` file already exists in the repository, scan the codebase for environment variable usage and create or update `.env.example`. If no `.env` file exists, do not create `.env.example`. If `.env` exists but no environment variables are detected, create a minimal template with common placeholders and a note for the team to populate:

> **Greenfield mode**: Only generate a starter `.env.example` when a `.env` file already exists in the repository. Include common variables for the chosen framework (e.g., `DATABASE_URL` for database projects, `PORT` and `NODE_ENV` for Node.js, `SECRET_KEY` and `DEBUG` for Django, etc.).

- Search for environment variable patterns:
  - JavaScript/Node: `process.env.VARIABLE_NAME`
  - Python: `os.getenv()`, `os.environ[]`
  - Ruby: `ENV['']`
  - Go: `os.Getenv()`
  - Java: `System.getenv()`
  - Shell scripts: `$VARIABLE_NAME`

- If creating or updating `.env.example`, include:
  - All detected environment variables as empty or example values
  - Clear comments describing each variable's purpose
  - Required vs optional variables clearly marked
  - Example values showing expected format (e.g., `DATABASE_URL=postgresql://user:pass@localhost:5432/dbname`)
  - Security warning at the top: `# ⚠️ Never commit actual secrets to version control`
  
- Group related variables with section headers:
  ```
  # Database Configuration
  DATABASE_URL=
  DB_POOL_SIZE=10

  # API Keys
  OPENAI_API_KEY=
  STRIPE_API_KEY=

  # Feature Flags
  ENABLE_BETA_FEATURES=false
  ```

### .gitignore Enhancement
Analyze detected tech stack and update `.gitignore` with:

> **Greenfield mode**: Generate a complete `.gitignore` from scratch based on the user's intended tech stack. Apply all language-specific patterns listed below for the chosen language(s) and framework(s).

**Language-specific patterns:**
- Python: `__pycache__/`, `*.py[cod]`, `*.egg-info/`, `.pytest_cache/`, `venv/`, `.venv/`
- Node.js: `node_modules/`, `npm-debug.log*`, `yarn-error.log*`, `.npm/`, `dist/`, `build/`
- Java: `target/`, `*.class`, `*.jar`, `*.war`
- Go: `bin/`, `*.exe`, `vendor/`
- Rust: `target/`, `Cargo.lock` (for binaries)
- Ruby: `*.gem`, `.bundle/`, `vendor/bundle/`

**IDE/Editor files:**
- `.vscode/*` with exclusions for shared config:
  - `!.vscode/settings.json`
  - `!.vscode/extensions.json`
  - `!.vscode/launch.json` (if present)
- `.idea/`
- `*.swp`, `*.swo`, `*~`
- `.DS_Store`

**Environment and secrets:**
- `.env`
- `.env.local`
- `.env.*.local`
- `*.pem`
- `*.key`
- `secrets.yml`

**Build artifacts and logs:**
- `*.log`
- `logs/`
- Build output directories detected from build config

**OS files:**
- `.DS_Store`
- `Thumbs.db`
- `desktop.ini`

Preserve existing `.gitignore` entries, add comments for each section, and remove duplicates.

## 4. IDE Configuration

If `.vscode/` already exists, update the following files as needed. Do not create the `.vscode/` directory or new files inside it:

> **Greenfield mode**: Generate IDE configuration based on the user's intended tech stack. Select extensions, formatters, and linters for the chosen language(s) and framework(s).

### .vscode/extensions.json
Based on detected tech stack, recommend essential extensions:

**Core extensions:**
- GitHub Copilot (`github.copilot`)
- GitLens (`eamodio.gitlens`)

**Language-specific extensions:**
- Python: Python extension, Pylint, Black formatter
- JavaScript/TypeScript: ESLint, Prettier
- Java: Extension Pack for Java, Spring Boot tools
- Go: Go extension
- Rust: rust-analyzer
- Ruby: Ruby extension, Solargraph

**Framework-specific tools:**
- React: ES7+ React snippets
- Vue: Volar
- Angular: Angular Language Service
- Django: Django template support

**Testing frameworks:**
- Jest, Pytest, JUnit extensions as appropriate

Example format:
```json
{
  "recommendations": [
    "github.copilot",
    "eamodio.gitlens",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```

### .vscode/settings.json
Configure workspace settings for consistency:

**Formatter configuration:**
- `"editor.formatOnSave": true`
- Set default formatter based on language (Prettier, Black, rustfmt, etc.)

**Linter configuration:**
- Enable linters detected in the project
- Configure lint-on-save if appropriate

**Language-specific settings:**
- Python: Set Python path, enable type checking
- JavaScript/TypeScript: Configure module resolution
- Set appropriate tab size based on existing code patterns

**File associations:**
- Map uncommon file extensions to correct languages

**Editor preferences:**
- Line endings (LF vs CRLF based on existing files)
- Trim trailing whitespace
- Insert final newline

Example format:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true
}
```

## 5. GitHub Templates

### .github/ISSUE_TEMPLATE/bug_report.md
```markdown
---
name: Bug Report
about: Report a bug or unexpected behavior
title: '[BUG] '
labels: bug
---

## Description
A clear and concise description of the bug.

## Steps to Reproduce
1. 
2. 
3. 

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- OS: 
- Browser/Runtime version: 
- Project version/commit: 

## Additional Context
Add any other context, screenshots, or logs.
```

### .github/ISSUE_TEMPLATE/feature_request.md
```markdown
---
name: Feature Request
about: Suggest a new feature or enhancement
title: '[FEATURE] '
labels: enhancement
---

## Problem Statement
Describe the problem or need this feature would address.

## Proposed Solution
Describe your proposed solution or feature.

## Alternatives Considered
What alternatives have you considered?

## Use Case
Describe specific use cases for this feature.

## Acceptance Criteria
- [ ] 
- [ ] 
- [ ] 

## Additional Context
Add any other context, mockups, or examples.
```

### .github/PULL_REQUEST_TEMPLATE.md
```markdown
## Description
Brief description of the changes in this PR.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to break)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Dependency update

## Related Issues
Closes #
Related to #

## Changes Made
- 
- 
- 

## Testing Performed
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] All tests passing locally

Describe specific test scenarios:
- 
- 

## Documentation
- [ ] README updated (if applicable)
- [ ] API documentation updated (if applicable)
- [ ] Architecture docs updated (if applicable)
- [ ] ADR created (if architectural decision made)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] No new warnings generated
- [ ] Dependent changes merged and published
- [ ] No secrets or sensitive data committed

## Screenshots (if applicable)

## Additional Notes
```

## 6. CODEOWNERS File

Do not create or modify `.github/CODEOWNERS` as part of this onboarding flow.

## 7. Pre-commit Hooks Configuration

Create `.pre-commit-config.yaml` based on detected languages:

> **Greenfield mode**: Generate pre-commit hooks (or ecosystem-native equivalent) for the user's intended language(s). Include universal hooks plus language-specific hooks for the chosen stack.

**Universal hooks:**
- Trailing whitespace removal
- End-of-file fixer
- Check for merge conflicts
- Check for large files
- Prevent commit of secrets (using detect-secrets or similar)

**Language-specific hooks:**
- Python: black, isort, flake8, mypy
- JavaScript/TypeScript: prettier, eslint
- Go: gofmt, golint
- Rust: rustfmt, clippy
- Ruby: rubocop

When generating this file, look up the latest stable release tags for each repository. Do not hardcode versions — they become outdated quickly.

Example format:
```yaml
# IMPORTANT: Replace rev values with latest stable release tags before committing.
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: # latest from https://github.com/pre-commit/pre-commit-hooks/releases
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-merge-conflict
      - id: check-added-large-files
      
  - repo: https://github.com/Yelp/detect-secrets
    rev: # latest from https://github.com/Yelp/detect-secrets/releases
    hooks:
      - id: detect-secrets

  # Language-specific hooks based on detection
```

Keep hooks fast (< 2 seconds total) to avoid developer friction.

> **Alternative for non-Python projects**: If `pre-commit` is not a good fit, consider alternatives such as `lefthook`. Do not create `.husky/` as part of this onboarding flow.

## 8. Custom Instructions

Create or update `.github/copilot-instructions.md`:

> **Greenfield mode**: Populate the custom instructions with the user's intended tech stack. Fill in language, framework, and architecture fields based on their answers rather than leaving them blank. Add recommended patterns and conventions for the chosen stack.

```markdown
# Project-Specific Guidelines for GitHub Copilot

## Project Overview
[Auto-generated based on codebase analysis]
- Primary language(s): 
- Framework(s): 
- Architecture pattern: 

## Coding Standards

### Language & Framework Versions
[List detected versions of key dependencies]

### Code Style
[Document observed patterns:]
- Naming conventions (camelCase, snake_case, PascalCase)
- File organization patterns
- Import/module structure
- Error handling patterns
- Testing patterns observed

### Testing Conventions
- Test file naming: 
- Test framework: 
- Coverage expectations: 
- Mocking approach: 

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
- **Use available documentation lookup tools** (e.g., Context7 MCP server, library documentation fetchers) for all technical documentation lookups when available
- Look up:
  - Library and framework documentation
  - API references
  - Language features and syntax
  - Best practices for current versions
- If no documentation tools are configured, proceed to first-party sources below

### 2. Secondary: First-Party Official Documentation
Use first-party official documentation sources (especially if documentation tools above are unavailable):
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
- **Never commit secrets, credentials, API keys, or tokens** to the repository
- Always use environment variables for sensitive configuration
- Validate and sanitize all user input
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Keep dependencies up to date with security patches

### Code Review Focus
- Input validation and sanitization
- Authentication and authorization checks
- Secure data handling (encryption, hashing)
- Error handling that doesn't leak sensitive information
- Dependency vulnerabilities

## Build & Deployment
[Document detected build and deployment patterns]
- Build command: 
- Test command: 
- Development server: 
- Production build: 

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
- Do NOT ask "do you want me to update docs?" when required changes are clear.
- Only ask the user if the required documentation target is ambiguous.
- If no docs changes are needed, explicitly state why in the final response.

### Autonomy rule
- Assume user consent for documentation updates that are directly related to implemented code changes.

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
- Create context notes when documenting "why" behind experiments.

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

This repository has specialized Copilot agents in `.github/agents/`. **Delegate tasks to the appropriate agent** rather than handling everything directly:

| Task type | Delegate to | How to invoke |
|-----------|------------|---------------|
| Technical research, library docs, version lookups, API references | `@research-agent` | Use for any question requiring up-to-date technical documentation or exploratory research |
| Code quality review, standards compliance, refactoring suggestions | `@code-reviewer` | Use when reviewing code changes, PRs, or assessing code quality |
| Security analysis, vulnerability scanning, secrets detection | `@security-specialist` | Use for security reviews, dependency audits, or assessing attack surface |
| ADRs, architecture docs, context notes, README updates | `@documentation-specialist` | Use when creating or updating any documentation in `docs/` |

### When to delegate
- **Research**: Before implementing unfamiliar patterns, integrating new libraries, or answering questions about framework best practices → `@research-agent`
- **Code review**: When reviewing pull requests, assessing code quality, or checking standards adherence → `@code-reviewer`
- **Security**: When adding authentication, handling user input, managing secrets, updating dependencies, or assessing vulnerabilities → `@security-specialist`
- **Documentation**: When architectural decisions are made, after significant refactors, or when creating planning/research notes → `@documentation-specialist`

### Delegation guidelines
- Provide the sub-agent with relevant context (file paths, code snippets, requirements)
- Let the sub-agent complete its full analysis before acting on results
- Multiple agents can be used in sequence (e.g., `@research-agent` for research → `@documentation-specialist` to write the ADR)
- When a task spans multiple agent specializations, break it into sub-tasks and delegate each to the appropriate agent
- After any non-trivial implementation change, use `@documentation-specialist` automatically to apply required docs updates in the same turn
```

## 9. Custom Agents

Install specialized GitHub Copilot agents into `.github/agents/` using onboarding tags from this repository:
- `onboarding-core` → mandatory
- `onboarding-expanded` → optional, install only when the detected repository stack indicates relevance

### Known-Good Install Snippet (macOS/Linux)

Use this exact snippet for reliable installation of mandatory onboarding-core agents plus conditionally selected onboarding-expanded agents:

```bash
set -euo pipefail

mkdir -p .github/agents

core_agents=(
  code-reviewer.agent.md
  documentation-specialist.agent.md
  research-agent.agent.md
  security-specialist.agent.md
)

expanded_agents=()

# Populate these booleans from Section 1 detected stack (or greenfield user-provided stack)
# has_frontend=true|false
# has_backend=true|false
# has_data=true|false
# has_devops=true|false

if [[ "${has_frontend:-false}" == "true" ]]; then
  expanded_agents+=(frontend-specialist.agent.md)
fi
if [[ "${has_backend:-false}" == "true" ]]; then
  expanded_agents+=(backend-specialist.agent.md)
fi
if [[ "${has_data:-false}" == "true" ]]; then
  expanded_agents+=(data-specialist.agent.md)
fi
if [[ "${has_devops:-false}" == "true" ]]; then
  expanded_agents+=(devops-specialist.agent.md)
fi

selected_agents=("${core_agents[@]}" "${expanded_agents[@]}")

for f in "${selected_agents[@]}"; do
  url="https://raw.githubusercontent.com/NoahJenkins/Copilot-Stuff/main/agents/$f"
  tmp="$(mktemp)"

  curl --fail --location --silent --show-error \
    --retry 3 --retry-all-errors --retry-delay 1 \
    -o "$tmp" "$url"

  test -s "$tmp"
  head -n 1 "$tmp" | grep -q '^---'
  grep -q 'onboarding-tags' "$tmp"

  cp "$tmp" ".github/agents/$f"
  rm -f "$tmp"

  echo "INSTALLED:$f"
done

# Mandatory post-install verification
for f in "${core_agents[@]}"; do
  test -s ".github/agents/$f"
  head -n 1 ".github/agents/$f" | grep -q '^---'
  grep -q 'onboarding-tags' ".github/agents/$f"
done

# Optional verification (only for selected expanded agents)
for f in "${expanded_agents[@]}"; do
  test -s ".github/agents/$f"
  head -n 1 ".github/agents/$f" | grep -q '^---'
  grep -q 'onboarding-tags' ".github/agents/$f"
done

echo "VERIFIED:all-onboarding-core-agents"
```

### Tag-Driven Agent Selection (Mandatory Core + Optional Expanded)

Use `https://github.com/NoahJenkins/Copilot-Stuff/tree/main/agents` as the canonical source of agent metadata.
Do not treat the target repository's local `agents/` directory (or absence of one) as a source-of-truth signal for mandatory onboarding agent availability.

1. Inspect all files in `https://github.com/NoahJenkins/Copilot-Stuff/tree/main/agents` matching `*.agent.md`.
2. Parse each file for the metadata comment format `<!-- onboarding-tags: ... -->`.
3. Select all files tagged `onboarding-core` as mandatory and install each one into target repo `.github/agents/` with the same filename.
4. Select files tagged `onboarding-expanded` as optional candidates. Install only those that match detected stack/repo signals:
  - Frontend indicators (UI framework, component directories, client bundle tooling) → `frontend-specialist.agent.md`
  - Backend indicators (API/server frameworks, service entrypoints) → `backend-specialist.agent.md`
  - Data indicators (DB drivers, ORM usage, migrations/schema tooling) → `data-specialist.agent.md`
  - DevOps indicators (CI workflows, Docker/Kubernetes/Terraform, release automation) → `devops-specialist.agent.md`
5. In greenfield mode, derive optional selection from user-provided intended stack instead of filesystem scanning.
6. If no `onboarding-core` agents are found, stop and report a configuration error in the summary.
7. Invoke delegated tasks using the matching Copilot agent tag (for example, `documentation-specialist.agent.md` → `@documentation-specialist`).

### Failure Reporting (Canonical Source Only)

- Any missing-agent error must reference canonical GitHub discovery/download/validation outcomes from `main/agents`.
- Do not report missing agents based on local root checks such as "repository root has no `agents/*.agent.md` metadata sources".
- If mandatory agents cannot be resolved from canonical source, report that agent installation is blocked due to canonical source resolution failure and include which canonical files/tags failed.
- If optional `onboarding-expanded` agents cannot be resolved, continue onboarding and report a non-blocking warning for those optional agents.

### Download Source Requirements

- Use canonical raw GitHub URLs (no cache-busting query params):
  - `https://raw.githubusercontent.com/NoahJenkins/Copilot-Stuff/main/agents/<agent-file>.agent.md`
- Download each selected `onboarding-core` and conditionally selected `onboarding-expanded` agent from the canonical raw URL first.
- **Execution environment requirement (high priority):**
  - For macOS/Linux, use shell-based download/install flow (`curl` or equivalent) as the required implementation path.
  - PowerShell (`.ps1`) support is optional and Windows-only; do not make `.ps1` a prerequisite for Unix environments.
  - Prefer **one agent per command** (or a very short loop) over long multi-line scripts in a single terminal invocation; long scripts can partially execute in some agent runners.
  - Use strict curl flags for reliability: `--fail --location --silent --show-error --retry 3 --retry-all-errors --retry-delay 1`.
  - Validate each downloaded file before install: HTTP 200, non-empty content, starts with front matter `---`, and includes `onboarding-tags` metadata.
  - After each install, print deterministic status output (e.g., `INSTALLED:<filename>`).
  - Perform a mandatory post-install verification pass:
    - Confirm every selected `onboarding-core` filename exists in `.github/agents/`
    - Confirm each installed file is non-empty and still contains front matter + `onboarding-tags`
    - If any expected status line or file is missing, treat the step as failed and retry that file up to 3 times
  - Perform optional verification for selected `onboarding-expanded` agents using the same checks, but treat failures as non-blocking warnings.
  - Retry failed downloads up to 3 times; if still failing, stop and report an error for that mandatory agent.
- If download fails for any selected `onboarding-core` agent after retries, do not use local fallback sources; fail the onboarding agent-install step and report the blocking error in the summary report.
- If download fails for a selected `onboarding-expanded` agent after retries, continue and report the optional-agent warning in the summary report.
- Do not hardcode individual agent file contents in this prompt.
- Preserve front matter and body exactly as published in the source artifact.
- If target file already exists, merge by keeping existing customizations and appending any missing canonical sections under `# Added by OnboardCopilot`.

#### Reliability Failure Handling

- If the terminal output suggests partial execution (for example, only shell setup lines appear and no `INSTALLED:` lines), do not assume success.
- Re-run installation in smaller units (single-file commands) and re-verify each file.
- Record, in the summary report, whether installation succeeded on first attempt or required recovery retries.

### Delegation Mapping

After installing `onboarding-core` agents, ensure these task mappings remain available. If a mapped agent is missing, perform the task directly and note it in the summary report:

- Research tasks → `@research-agent`
- Code quality review tasks → `@code-reviewer`
- Security tasks → `@security-specialist`
- Documentation tasks → `@documentation-specialist`

When installed, use these optional `onboarding-expanded` mappings for stack-specific work:
- Frontend architecture/performance/accessibility tasks → `@frontend-specialist`
- Backend/API/reliability tasks → `@backend-specialist`
- Data modeling/migration/query tasks → `@data-specialist`
- CI/CD/deployment/runtime operations tasks → `@devops-specialist`

## 10. README Enhancement

If `README.md` exists, enhance it with missing sections. If it doesn't exist, create a comprehensive one:

### Required Sections

**Project Description:**
- Clear description of what the project does
- Key features and capabilities

**Quick Start:**
```markdown
## Quick Start

### Prerequisites
- [Language/Runtime] version X.X
- [Required tools]

### Installation
1. Clone the repository
2. Install dependencies: `[command]`
3. If `.env.example` exists, copy environment template: `cp .env.example .env`
4. Configure environment variables (see Configuration section)

### Running Locally
Development server: `[command]`
Application runs at: `http://localhost:[port]`

### Testing
Run tests: `[command]`
Run with coverage: `[command]`

### Building
Production build: `[command]`
```

**Configuration:**
- Link to `.env.example` (if present)
- Describe required vs optional environment variables
- External service dependencies

**Documentation:**
```markdown
## Documentation

- [Architecture Documentation](./docs/architecture/)
- [Architecture Decision Records](./docs/adr/)
- [Planning & Research Notes](./docs/context/)
- [Project Task Tracker](./docs/TODO.md)
```

**Contributing:**
- Link to PR template
- Link to issue templates
- Basic contribution guidelines

**License:**
- Include license information if present

## 11. CI/CD Pipeline Documentation

> **Skip condition**: If no CI/CD configuration exists (`.github/workflows/`, `.circleci/`, `.gitlab-ci.yml`, `Jenkinsfile`, etc.), skip this section and note the absence in the summary report.

> **Sub-agent delegation**: Use `@documentation-specialist` to create the CI/CD pipeline documentation. Provide it with the CI/CD configuration file paths detected in Section 1.

If CI/CD configuration exists, create `docs/architecture/ci-cd-pipeline.md` documenting:

- **Overview**: Brief description of the CI/CD approach
- **Pipeline Stages**: For each stage (build, test, security/quality, deploy), document:
  - Trigger conditions
  - Actions performed
  - Success criteria
  - Typical duration (if determinable)
- **Deployment Environments**: For each environment (staging, production), document triggers, URLs, deployment method, and rollback procedures
- **Required Secrets/Environment Variables**: List all secrets and environment variables referenced in CI/CD config (names only, never values)
- **Troubleshooting**: Common failure scenarios and solutions based on the pipeline configuration
- **Maintenance**: How to update CI dependencies and modify pipeline configuration

## 12. Initial ADR

> **Sub-agent delegation**: Use `@documentation-specialist` to create this ADR. It is pre-configured with ADR naming conventions, required sections, and immutability rules.

Create `docs/adr/0001-adopt-documentation-structure.md`:

```markdown
# ADR 0001: Adopt Structured Documentation Framework

## Status
Accepted

## Context
This repository lacked a systematic approach to documenting architectural decisions, system design, and technical research. This created several problems:

- New developers struggled to understand why certain technical choices were made
- Historical context for decisions was lost over time
- Architecture knowledge existed only in individual team members' heads
- Onboarding new team members required extensive verbal knowledge transfer
- Technical debt decisions were made without clear documentation of trade-offs

The team needed a lightweight but structured approach to:
1. Document significant architectural decisions with their context and rationale
2. Maintain high-level architecture documentation
3. Preserve research and exploratory work that informs decisions
4. Create a searchable knowledge base for the project

## Options Considered

### Option 1: Wiki-based documentation
**Pros:**
- Easy to edit
- Good search functionality
- Familiar to most developers

**Cons:**
- Often becomes outdated and unmaintained
- Separate from code repository
- No version control integration
- Difficult to enforce structure

### Option 2: Comprehensive formal documentation
**Pros:**
- Very detailed
- Professional appearance

**Cons:**
- High maintenance burden
- Slows down development
- Often ignored by developers
- Becomes outdated quickly

### Option 3: Structured documentation in repository (ADR + Architecture + Context)
**Pros:**
- Version-controlled alongside code
- Lightweight and focused
- ADRs provide historical decision context
- Easy to link code changes to decisions
- Low barrier to contribution

**Cons:**
- Requires discipline to maintain
- Less discoverable than a wiki
- Needs team buy-in

## Decision
Adopt a three-tier structured documentation framework within the repository:

1. **docs/adr/**: Architecture Decision Records for significant decisions
2. **docs/architecture/**: High-level system design and component documentation
3. **docs/context/**: Research notes and exploratory documentation

This framework will be enforced through:
- Custom GitHub Copilot agents that encourage documentation
- PR templates that prompt for ADRs when appropriate
- Onboarding materials that explain the structure

## Consequences

### Positive
- Architectural decisions will have clear, searchable historical context
- New team members can understand "why" behind technical choices
- Documentation lives with the code and evolves together
- Low overhead compared to comprehensive documentation systems
- GitHub Copilot agents can reference this documentation to provide better context

### Negative
- Requires team discipline to create ADRs for significant decisions
- Initial learning curve for ADR format
- Risk of documentation becoming outdated if not maintained
- Need to establish what qualifies as "significant enough" for an ADR

### Mitigation Strategies
- Create custom GitHub Copilot agents to prompt for documentation
- Include ADR creation in PR checklist for architectural changes
- Conduct periodic reviews of documentation during retrospectives
- Keep ADR format simple and template-based to reduce friction
```

## 13. Security Baseline Report

> **Sub-agent delegation**: Use `@security-specialist` to perform the security assessment. Provide it with the dependency manifest file paths and tech stack detected in Section 1. The security specialist will scan for vulnerabilities, secrets, and configuration issues.

> **Greenfield mode**: Since there are no dependencies or code to scan, generate a proactive security checklist instead. Include common security considerations for the user's chosen tech stack (e.g., CORS configuration for web APIs, SQL injection prevention for database projects, secret management setup). Title it "Security Setup Checklist" rather than "Security Baseline Report".

Create `docs/context/[YYYY-MM-DD]-security-baseline.md`:

Perform initial security assessment:

**Dependency Analysis:**
- Scan dependency manifest files
- List direct and transitive dependencies with versions
- Identify dependencies without pinned versions

**Known Vulnerabilities:**
- Run language-specific audit commands when available:
  - Node.js: `npm audit` or `yarn audit`
  - Python: `pip audit` or `safety check`
  - Ruby: `bundle audit`
  - Rust: `cargo audit`
  - Go: `govulncheck ./...`
- Check for `dependabot.yml` or `renovate.json` presence
- Flag dependencies without lockfiles (lockfiles ensure reproducible builds and auditability)
- Prioritize findings by severity (Critical, High, Medium, Low)
- Identify outdated dependencies with security patches available

**Secrets Detection:**
- Scan codebase for patterns matching API keys, tokens, credentials
- Verify `.gitignore` includes secret file patterns
- Check for hard-coded passwords or keys

**Security Configuration:**
- Review security-related configuration
- Check CI/CD for security scanning
- Verify HTTPS/TLS usage

Format the report as:
```markdown
# Security Baseline Report
*Generated: [Date]*

## Summary
[2-3 sentence overview of security posture]

## Critical Findings
[List critical/high-severity issues requiring immediate attention]

## Dependency Inventory
- Total dependencies: [count]
- Dependencies with known vulnerabilities: [count]
- Outdated dependencies (>1 year): [count]

## Detailed Findings

### Known Vulnerabilities
[List CVEs with severity and affected components]

### Configuration Issues
[List security configuration concerns]

### Secrets & Credentials
[Report any detected secrets - DO NOT include actual values]

## Recommendations
1. [Prioritized list of security improvements]
2. 
3. 

## Open Questions
[Unresolved security concerns for team discussion]
```

## 14. Summary Report

> **Sub-agent delegation**: Use `@documentation-specialist` to compile the final onboarding report. Provide it with the complete results from all previous sections — technologies detected, files created, security findings, and any skipped sections.

Create `docs/context/[YYYY-MM-DD]-onboarding-report.md`:

```markdown
# Repository Onboarding Report
*Generated: [Date]*

## Executive Summary
This repository has been automatically analyzed and configured with development best practices, documentation structure, GitHub Copilot custom instructions, and specialized agents.

## Onboarding Mode
- [ ] **Brownfield** (existing codebase scanned)
- [ ] **Greenfield** (scaffolded from intended tech stack)

## Technologies Detected
> In greenfield mode, this section reflects the user's stated intended stack rather than detected dependencies.

### Languages & Versions
- 

### Frameworks & Libraries
- 

### Testing Tools
- 

### Build & CI/CD
- 

## Files & Directories Created

### Documentation Structure
- [ ] `docs/architecture/` - System design documentation
- [ ] `docs/adr/` - Architecture Decision Records
- [ ] `docs/context/` - Research and planning notes
- [ ] `docs/TODO.md` - Living tracker for major project tasks
- [ ] `docs/adr/0001-adopt-documentation-structure.md` - Initial ADR
- [ ] `docs/context/index.md` - Context notes index

### Development Environment
- [ ] `.env.example` - Environment variable template (only if `.env` exists)
- [ ] `.gitignore` - Enhanced with tech-stack patterns
- [ ] `.pre-commit-config.yaml` - Pre-commit hooks

### GitHub Configuration
- [ ] `.github/copilot-instructions.md` - Custom Copilot instructions
- [ ] `.github/agents/` - Installed all `onboarding-core` tagged agents from canonical `agents/` artifacts
- [ ] `.github/ISSUE_TEMPLATE/bug_report.md` - Bug report template
- [ ] `.github/ISSUE_TEMPLATE/feature_request.md` - Feature request template
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` - PR template

### Documentation
- [ ] `README.md` - Enhanced with Quick Start and documentation links
- [ ] `docs/architecture/ci-cd-pipeline.md` - CI/CD documentation (if applicable)
- [ ] `docs/context/[date]-security-baseline.md` - Security assessment

## GitHub Copilot Configuration

- Custom instructions configured in `.github/copilot-instructions.md`
- Project-specific coding standards, documentation structure, and security guidelines included

### Custom Agents Available

This repository includes all agents tagged `onboarding-core` from canonical `agents/` artifacts, installed into `.github/agents/`.

Mandatory core task coverage:
1. **@research-agent** — Technical research using context7 and first-party sources
2. **@code-reviewer** — Code quality, standards adherence, and maintainability review
3. **@security-specialist** — Security vulnerability analysis and secure coding validation
4. **@documentation-specialist** — ADRs, architecture docs, and context note management

Review and customize the agent definitions and instructions to match your team's specific conventions.

## Recommended Next Steps

### Immediate Actions (Required)
1. **Configure Environment Variables**
   - Review `.env.example` (if present)
   - Create `.env` file with actual values
   - Ensure all required variables are set

2. **Review and Customize Templates**
   - Customize issue/PR templates for your workflow
   - Review pre-commit hooks and enable/disable as needed

3. **Install Pre-commit Hooks**
   ```bash
   pip install pre-commit
   pre-commit install
   ```

4. **Review Security Baseline**
   - Address critical vulnerabilities identified
   - Update outdated dependencies
   - Review security recommendations

### Short-term (First Week)
1. **IDE Setup**
   - Install recommended extensions from `.vscode/extensions.json`
   - Verify workspace settings work for your team

2. **Review Custom Copilot Instructions & Agents**
   - Validate auto-detected coding standards in `.github/copilot-instructions.md`
   - Review agent definitions in `.github/agents/`
   - Add project-specific guidelines
   - Update version information if needed

3. **Test Agent Functionality**
   - Try each custom agent (e.g., `@research-agent`, `@code-reviewer`)
   - Verify agents produce useful, accurate output
   - Customize agent system prompts as needed

4. **Documentation Review**
   - Read initial ADR: `docs/adr/0001-adopt-documentation-structure.md`
   - Familiarize team with documentation structure
   - Plan first architecture documentation session

### Ongoing Maintenance
1. **Keep Dependencies Updated**
   - Run language-specific audit tools regularly (monthly recommended)
   - Review security advisories

2. **Document Decisions**
   - Create ADRs for architectural decisions
   - Maintain context notes for research
   - Update architecture docs when system changes

3. **Refine Templates**
   - Update PR/issue templates based on team feedback
   - Extend Copilot instructions and agents as project needs evolve

## Security Considerations

⚠️ **Important Security Reminders:**
- Never commit `.env` files or actual secrets
- Review security baseline report: `docs/context/[date]-security-baseline.md`
- Address critical vulnerabilities before production deployment
- Enable pre-commit hooks to prevent accidental secret commits

## Questions or Issues?

- Review documentation in `docs/`
- Use custom Copilot agents for help (e.g., `@documentation-specialist` for doc questions, `@security-specialist` for security reviews)
- Reference `.github/copilot-instructions.md` for project conventions
- Create an issue using the templates in `.github/ISSUE_TEMPLATE/`

***

**Onboarding Complete!** Your repository is now configured with development best practices, GitHub Copilot custom instructions, and specialized agents.
```

---

## Execution Instructions

Execute all tasks in the order listed above. For each task:
1. **Check applicability**: Evaluate whether the section applies to this repository (see General Guidance above)
2. **Check for existing files**: Read existing files before creating or modifying — never overwrite without merging
3. **Preserve existing content**: When enhancing files, keep all existing entries and add new content in labeled sections
4. **Use consistent formatting and style**: Match the existing codebase conventions where possible
5. **Add clear comments**: Explain generated content with comments (e.g., `# Added by OnboardCopilot`)
6. **Create placeholder values**: Where team-specific information is needed, use `# TODO:` prefixed comments
7. **Run docs impact check after every code edit**: If impacted, update required `docs/` targets in the same turn without asking for confirmation; only ask if target location is ambiguous
8. **Use @documentation-specialist automatically after implementation**: Delegate documentation updates to `@documentation-specialist` with full context when available
9. **Completion gate**: Treat work as incomplete until all required documentation updates are applied
10. **Skip gracefully**: If a section cannot be completed (e.g., no git history for CODEOWNERS), note it in the summary report and move on
11. **Actively maintain docs/TODO.md**: Add newly discovered major tasks during execution and mark tasks completed as soon as they are finished
12. **Initialize TODO template when needed**: If `docs/TODO.md` is created during onboarding, seed it with the standard starter template from Section 2, then adapt it to the detected stack and project scope
13. **Report blocked work in final summary**: Include any remaining items from the `Blocked` section of `docs/TODO.md`, along with dependency notes and recommended next action

After completing all tasks, provide a summary of:
- What was created
- What was modified
- What requires manual review/configuration
- Any warnings or important notes

**Generate the complete onboarding summary report as the final step.**
```

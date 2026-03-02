# Dependabot Auto-Merge Automation
*Generated: 2026-03-02*

## Summary
Implemented automated approval and auto-merge enablement for eligible Dependabot pull requests, and aligned branch protection status-check names with current CI job names.

## Options/Findings
- Added `.github/workflows/dependabot-auto-merge.yml` using `pull_request_target` for bot-authored PR automation.
- Policy restricts automation to:
  - ecosystems: `npm`, `github-actions`
  - updates: `semver-patch`, `semver-minor`
  - changed files: `package.json`, `pnpm-lock.yaml`, `.github/workflows/*.yml|*.yaml`
- Workflow actions for eligible PRs:
  - create approval review
  - enable auto-merge with squash strategy
- Updated branch protection required status checks to match current CI job names.
- Updated setup script output so operational messaging matches enforced branch protection contexts.

## Verification
- Branch protection config includes current contexts:
  - `Security Audit`
  - `Jest Tests`
  - `Playwright Tests`
  - `TypeScript Check`
  - `Build Check`
- Setup script prints the same status-check names as branch protection config.
- Dependabot auto-merge workflow enforces actor, branch, draft, ecosystem, semver, and file-scope checks before approval/auto-merge steps run.

## Open Questions
- Should we limit auto-merge to dependency directories or package allowlists for additional supply-chain control?
- Should major version updates remain permanently excluded, or be selectively enabled with labels/manual review?

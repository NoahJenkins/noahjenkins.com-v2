# CI/CD Pipeline

## Overview
This repository uses two GitHub Actions workflows for validation:

- `.github/workflows/ci.yml` named **CI** for application validation
- `.github/workflows/dependency-review.yml` named **Dependency Review** for pull request dependency-diff scanning

- **Triggers**
  - `push` to `main`
  - `pull_request` targeting `main`
- **Execution model**
  - Four independent jobs run on `ubuntu-latest` in **CI**: `jest-tests`, `playwright-tests`, `typecheck`, `build`
  - Workflow-level concurrency cancels in-progress runs for the same ref:
    - `group: ${{ github.workflow }}-${{ github.ref }}`
    - `cancel-in-progress: true`
- **Security baseline**
  - Minimal permissions in the main `CI` workflow:
    - `contents: read`
    - `actions: read`
  - Workflow action references are pinned to full commit SHAs

## Deferred Dell CI migration

All five application jobs remain directly on `ubuntu-latest` for both PRs and
main pushes. No runner-selection job, self-hosted label, or activation variable
is used. The runner policy tests verify hosted execution and independent required
checks in the executable workflow.

PR #288 proposed opt-in disposable Dell runners. The proposal is deferred:
`pull_request` executes proposed workflow YAML, so a fork can replace a routing
condition or name a self-hosted runner directly. An in-workflow repository check
or a false activation flag is not a runner authorization boundary. At review on
October 20, 2026, the repository had zero registered self-hosted runners.

Before a future migration, enforce trusted workflow/ref access outside
PR-controlled YAML and demonstrate that a fork proposing a direct self-hosted
`runs-on` cannot obtain a runner. Review runner-group restrictions or another
infrastructure-enforced boundary before registration; workflow conditions alone
are insufficient. Keep PR checks hosted. Disposable workers, isolated networks,
no host credentials/mounts, bounded resources, disk disposal, and verified
artifacts remain additional prerequisites, not substitutes for authorization.
See [GitHub's secure-use guidance](https://docs.github.com/en/actions/reference/security/secure-use).

The original draft design and branch `ci/portfolio-dell-routing` remain retained
for a separately reviewed migration. This change registers no runner and alters
no infrastructure or runner access policy.

## Install Limits and Caches

- Security audit, Jest, and TypeScript jobs stop after 10 minutes. Build and Playwright jobs stop after 15 minutes. Dependency Review stops after 5 minutes.
- Each package, browser, or Linux-library install stops after 5 minutes; Node/pnpm setup after 3 minutes; explicit cache operations after 2 minutes. Setup failures fail the job. Do not retry timed-out setup automatically or raise its limit to obtain a green result.
- The pnpm content-addressed store is cached; `node_modules` is not cached. Frozen installs with `--prefer-offline` validate the lockfile, reuse downloaded packages, and run required lifecycle scripts.
- Playwright runs on `ubuntu-latest` inside `mcr.microsoft.com/playwright:v<locked version>-noble` as uid 1001, with a 2 GB `/dev/shm`. The image already contains the system libraries and browser builds for that `@playwright/test` version, so the job does not apt-install them and does not download browsers. The image tag is the version locked in `pnpm-lock.yaml`; a Playwright bump updates the tag in the same change. Chromium, Firefox, WebKit, Mobile Chrome, and Mobile Safari all still run.
- Existing concurrency cancellation, required check names, platform routing, and test coverage remain unchanged. Failure artifacts remain available.

## Pipeline Stages

### 1) Test Stage

#### Job: `jest-tests` (Jest Tests)
Purpose: unit/integration validation and coverage upload.

Steps:
1. Checkout (`actions/checkout@v4`)
2. Setup Node.js 24 (`actions/setup-node@v4`)
3. Setup pnpm (`pnpm/action-setup`)
4. Resolve pnpm store path into env var `STORE_PATH`
5. Restore/save pnpm cache (`actions/cache@v4`) keyed by `pnpm-lock.yaml`
6. Install dependencies (`pnpm install --frozen-lockfile --prefer-offline` from the cached pnpm store)
7. Run tests: `pnpm test`

#### Job: `playwright-tests` (Playwright Tests)
Purpose: end-to-end UI validation and artifact retention.

Steps:
1. Checkout
2. Setup Node.js 24
3. Setup pnpm
4. Set `STORE_PATH`
5. Setup pnpm cache
6. Install dependencies from the pnpm store with a frozen lockfile
7. Run tests: `pnpm test:ui` (system libraries and browsers come from the job container)
8. Always upload artifacts (`actions/upload-artifact@v4`):
   - `playwright-report/` as `playwright-report`
   - `test-results/` as `playwright-test-results`
   - retention: 30 days

### 2) Quality/Security Stage

#### Job: `typecheck` (TypeScript Check)
Purpose: static type validation.

Steps:
1. Checkout
2. Setup Node.js 24
3. Setup pnpm
4. Set `STORE_PATH`
5. Setup pnpm cache
6. Install dependencies from the pnpm store with a frozen lockfile
7. Run typecheck: `pnpm exec tsc --noEmit`

Security/quality controls present in workflow:
- Principle of least privilege via read-only GitHub token permissions
- Deterministic frozen-lockfile installs; failure stops validation without a fallback install
- Concurrency cancellation reduces stale validations

### 3) Build Stage

#### Job: `build` (Build Check)
Purpose: verify production build can be produced.

Steps:
1. Checkout
2. Setup Node.js 24
3. Setup pnpm
4. Set `STORE_PATH`
5. Setup pnpm cache
6. Install dependencies from the pnpm store with a frozen lockfile
7. Build app: `pnpm build`
8. Verify output directory `.next` exists; fail job if missing

### 4) Vercel Deployment Stage

The GitHub Actions workflow validates the application. Vercel's Git integration creates preview deployments for pull requests and production deployments for `main` outside that workflow. This includes Dependabot pull requests that only change GitHub Actions files.

Use Node.js `24.x` across `package.json` (`engines.node`), `.nvmrc`, `.node-version`, all five CI jobs, and the Vercel project setting. Vercel uses the `package.json` engine setting ahead of the project setting. Changing the dashboard setting alone does not override an unsupported version in the manifest. [Vercel Node.js version documentation](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)

Vercel stopped accepting new Node.js 20 builds and functions on October 1, 2026. Existing deployments can continue to serve traffic while new previews fail. [Vercel deprecation notice](https://vercel.com/changelog/node-js-20-is-being-deprecated)

The runtime decision is recorded in [ADR 0009](../adr/0009-adopt-nodejs-24.md). Dependabot grouping remains as defined in ADR 0008. Dependabot repair is described in [pr-repair](../pr-repair.md); ADRs 0010 and 0011 are superseded.

### 4a) Dependency Review Workflow

This repository includes a dedicated workflow (`.github/workflows/dependency-review.yml`) named **Dependency Review**.

- **Trigger**
  - `pull_request` targeting `main`
- **Permissions**
  - `contents: read`
- **Actions**
  - Runs `actions/dependency-review-action`
  - Fails when a pull request introduces new `high` or `critical` vulnerabilities
  - License checks are disabled because the repository does not maintain a license policy

This check is currently informational only and is not yet part of the protected-branch required status check list.

### 4b) Dependency Audit Fix Workflow

`.github/workflows/dependency-audit-fix.yml` (**Dependency audit fix**) opens a pull request when `pnpm audit --fix` can resolve an advisory that Dependabot security updates cannot. This occurs when a parent package pins a vulnerable range of a transitive dependency.

- **Trigger**
  - `schedule` (Monday 16:00 UTC) and `workflow_dispatch`, on `main` only
- **Actions**
  - Runs `pnpm audit --fix`, which adds a ranged override to `pnpm-workspace.yaml`
  - Updates `pnpm-lock.yaml` and fails if any other file changed
  - Opens or updates the `dependency-audit-fix` branch and pull request with the controller App token, then enables squash auto-merge
- **Authority**
  - Runs in the `dependabot-controller` environment on `ubuntu-latest`. The job `GITHUB_TOKEN` is read-only.
  - Has no `GITHUB_TOKEN` fallback. A pull request from that token starts no `pull_request` workflows, so Dependency Review could not pass.

### 5) Dependabot Update Creation

`.github/dependabot.yml` separates routine version updates from security updates for both supported ecosystems.

- **npm version updates**
  - Run weekly.
  - Put all eligible patch and minor updates in one catch-all routine group.
  - Leave major updates outside that group so they can be evaluated as standalone pull requests.
- **GitHub Actions version updates**
  - Run weekly.
  - Put all eligible patch and minor updates in one catch-all routine group.
  - Leave major updates outside that group.
- **Security updates**
  - Use separate npm and GitHub Actions groups with `applies-to: security-updates`.
  - Remain event-driven by Dependabot security alerts instead of waiting for the weekly version-update schedule.
- **Triage**
  - Do not assign a routine reviewer or assignee.
  - Use ecosystem and automation labels to identify the pull request type.

### 6) Dependabot auto-merge and pr-repair

`.github/workflows/dependabot-auto-merge.yml` reads Dependabot metadata (no checkout) and enables native squash auto-merge for patch, minor, GitHub Actions, and security updates. Other updates get the `needs-review` label. GitHub merges once the required checks pass.

`.github/workflows/pr-repair.yml` is a thin caller of the shared `NoahJenkins/.github/pr-repair` action. It runs for failed CI on `dependabot/**` branches and finished CI on its `pr-repair/**` replacements, plus one daily sweep, and does nothing unless `PR_REPAIR_ENABLED=true`. See [pr-repair](../pr-repair.md). The earlier controller, OpenCode, and Copilot worker scripts were removed; ADRs 0010 and 0011 are superseded.

## Repository Security Settings

- **Dependabot version updates** are configured in `.github/dependabot.yml` as weekly ecosystem-wide patch/minor groups
- **Dependabot security updates** are enabled at the repository level so GitHub can open automated remediation PRs
- **Secret scanning** and **push protection** are enabled at the repository level
- **GitHub Actions SHA pinning required** is enabled at the repository level

## Deployment Environments
Ordinary CI in `.github/workflows/ci.yml` has no credential environment. `pr-repair` and `Dependency audit fix` use `dependabot-controller` (App private key) and `dependabot-dispatch` (inference key).
Vercel preview and production deployments are handled by the Git integration outside this workflow.

## Required Secrets / Environment Names

### Secrets (names only)
- **None explicitly required by `ci.yml`**
- `dependabot-controller` environment only: `DEPENDABOT_CONTROLLER_PRIVATE_KEY` (also used by Dependency audit fix)
- `dependabot-dispatch` environment only: `AI_GATEWAY_API_KEY` (pr-repair inference)

### Environment variables (names only)
- `STORE_PATH` (set in each job for pnpm cache path)
- `GITHUB_ENV` (GitHub Actions runtime environment file used to persist `STORE_PATH`)
- `DEPENDABOT_CONTROLLER_APP_ID`, `PR_REPAIR_ENABLED` (must be exactly `true` to enable pr-repair)

## Troubleshooting

### Dependency installation failures
- Symptom: `pnpm install --frozen-lockfile` fails.
- Current behavior: workflow automatically falls back to `pnpm install --no-frozen-lockfile`.
- Action: regenerate and commit lockfile locally if drift is unintended.

### Cache misses or slow installs
- Symptom: repeated full dependency installs.
- Check:
  - `pnpm-lock.yaml` changes (cache key includes lockfile hash)
  - correctness of `STORE_PATH` export to `GITHUB_ENV`

### Playwright failures in CI
- Symptom: UI tests fail only in GitHub Actions.
- Action:
  - Inspect uploaded `playwright-report` and `playwright-test-results` artifacts
  - Reproduce locally with `pnpm test:ui`
  - Confirm the container image tag matches the `@playwright/test` version in `pnpm-lock.yaml`. A mismatch cannot find the browser executables. The job does not run `playwright install-deps`.

### Build verification failure (`.next` not found)
- Symptom: `Build Check` fails at output verification.
- Action:
  - Review `pnpm build` logs for prior failure
  - Confirm Next.js build output directory is expected to be `.next`

## Maintenance

- Keep action versions current (`checkout`, `setup-node`, `cache`, `upload-artifact`, `pnpm/action-setup`).
- Update pinned workflow SHAs when upstream action releases are adopted.
- Reassess `pnpm install --no-frozen-lockfile` fallback policy if stricter reproducibility is required.
- Periodically review:
  - Node version pin (`24`)
  - artifact retention duration (currently 30 days)
  - workflow permissions for least privilege
- Observe `Dependency Review` results before deciding whether to promote it to a required branch protection check.
- If CD is needed, add explicit deploy job(s) with:
  - environment protection rules
  - scoped secrets
  - branch/tag deployment strategy
- Consider extending security coverage beyond dependency audit with additional SAST coverage where GitHub default setup is insufficient.

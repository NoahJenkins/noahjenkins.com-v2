# CI/CD Pipeline

## Overview
This repository uses two GitHub Actions workflows for validation:

- `.github/workflows/ci.yml` named **CI** for application validation
- `.github/workflows/dependency-review.yml` named **Dependency Review** for pull request dependency-diff scanning

- **Triggers**
  - `push` to `main`
  - `pull_request` targeting `main`
- **Execution model**
  - Five independent jobs run on `ubuntu-latest` in **CI**: `security-audit`, `jest-tests`, `playwright-tests`, `typecheck`, `build`
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
- Browser binaries use an exact OS, architecture, and installed `@playwright/test` version cache key, with no broad restore keys. The version is read after the frozen install, so unrelated lockfile changes do not invalidate compatible browsers. A cache hit skips browser downloads. Linux system libraries are not cached and still install on both hits and misses under their own deadline.
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
8. Upload coverage to Codecov (`codecov/codecov-action@v4`) when `coverage/lcov.info` exists, always-attempted, non-blocking (`continue-on-error: true`)

#### Job: `playwright-tests` (Playwright Tests)
Purpose: end-to-end UI validation and artifact retention.

Steps:
1. Checkout
2. Setup Node.js 24
3. Setup pnpm
4. Set `STORE_PATH`
5. Setup pnpm cache
6. Install dependencies from the pnpm store with a frozen lockfile
7. Restore exact OS/architecture/installed-Playwright-version browser cache; always run `pnpm exec playwright install-deps`, then run `pnpm exec playwright install` only on a browser-cache miss
8. Run tests: `pnpm test:ui`
9. Always upload artifacts (`actions/upload-artifact@v4`):
   - `playwright-report/` as `playwright-report`
   - `test-results/` as `playwright-test-results`
   - retention: 30 days

### 2) Quality/Security Stage

#### Job: `security-audit` (Security Audit)
Purpose: fail CI when high/critical dependency vulnerabilities are present.

Steps:
1. Checkout
2. Setup Node.js 24
3. Setup pnpm
4. Set `STORE_PATH`
5. Setup pnpm cache
6. Install dependencies from the pnpm store with a frozen lockfile
7. Run audit gate: `pnpm audit --audit-level=high`

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

The runtime decision is recorded in [ADR 0009](../adr/0009-adopt-nodejs-24.md). Dependabot grouping remains as defined in ADR 0008. Controller acceptance and bounded repair are defined in ADR 0010.

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

### 5) Dependabot Update Creation

`.github/dependabot.yml` separates routine version updates from security updates for both supported ecosystems.

- **npm version updates**
  - Run weekly.
  - Put all eligible patch and minor updates in one catch-all routine group.
  - Leave major updates outside that group so they can be evaluated as standalone pull requests.
- **GitHub Actions version updates**
  - Run weekly.
  - Put all eligible patch and minor updates in one catch-all routine group.
  - Leave major updates outside that group; the controller requires authenticated independent review evidence before acceptance.
- **Security updates**
  - Use separate npm and GitHub Actions groups with `applies-to: security-updates`.
  - Remain event-driven by Dependabot security alerts instead of waiting for the weekly version-update schedule.
- **Triage**
  - Do not assign a routine reviewer or assignee.
  - Use ecosystem and automation labels to identify the pull request type.

### 6) Dependabot Controller and Copilot Workers

The current worker contract is defined in the [Copilot runtime guide](../copilot-dependency-repair.md). ADRs 0010 and 0011 record earlier dispatcher and provider designs. Controller acceptance, quotas, protected scope, App authority, and main-only environments remain. The [setup guide](../dependabot-controller-setup.md) separates implementation from activation.

The trusted workflow reconciles same-repository Dependabot PRs on PR/CI/status events and a ten-minute schedule. A passing human-triggered CI run is eligible. Exact-head/current-base CI provenance, all five required jobs, trusted Vercel deployment status, protected scope, and authentic independent review evidence are required. Human/shared-commit and duplicate bot-head safeguards remain.

Flow: controller → App claim → isolated Copilot worker matrix → fresh secret-free validator → trusted publisher → reconciliation. Trusted jobs checkout immutable workflow source matching the reserved base and run only from main; launch is original attempt 1. The controller App owns `Dependabot Merge Gate`, the ledger, task claims, repair commits, and `Dependabot Independent Review`. Branch protection must bind the gate to this App and require strict up-to-date CI, one approval, and stale-review dismissal.

The trusted Copilot CLI alone receives a Copilot Requests-only fine-grained token. Repair and independent review use the fixed cost-efficient model and bounded credit, call, time, and input limits in the runtime guide. The model can read only the curated snapshot through `curated-read_data`; it has no shell, repository write, or network tools. Fixed validation runs separately without secrets. The publisher executes no artifact, verifies immutable run/job/claim/digest evidence and scope, atomically commits repairs with expected head, or publishes App-owned review proof bound to head/base. The controller queues native auto-merge while its gate is pending and revalidates before formal App approval and gate success.

The central ledger limits the repository to two repairs/eight reviews per UTC day and two lifetime repairs per PR. Expired or uncertain reservations remain charged; reruns cannot dispatch. Invalid provenance, stale base/head, incomplete review, quota exhaustion, or missing credentials blocks acceptance. Missing external App/gate/provider/budget configuration keeps flags off.

## Repository Security Settings

- **Dependabot version updates** are configured in `.github/dependabot.yml` as weekly ecosystem-wide patch/minor groups
- **Dependabot security updates** are enabled at the repository level so GitHub can open automated remediation PRs
- **Secret scanning** and **push protection** are enabled at the repository level
- **GitHub Actions SHA pinning required** is enabled at the repository level

## Deployment Environments
Ordinary CI in `.github/workflows/ci.yml` has no credential environment. Controller, claim, publisher, and reconciliation jobs use `dependabot-controller`; isolated worker jobs use `dependabot-dispatch`. The validator uses no credential environment. GitHub must enforce their deployment restrictions before releasing credentials; the merge scope guard does not protect pre-merge workflow execution.
Vercel preview and production deployments are handled by the Git integration outside this workflow.

## Required Secrets / Environment Names

### Secrets (names only)
- **None explicitly required by `ci.yml`**
- `dependabot-controller` environment only: `DEPENDABOT_CONTROLLER_PRIVATE_KEY`
- `dependabot-dispatch` environment only: `COPILOT_GITHUB_TOKEN` (Copilot Requests account permission only)

### Environment variables (names only)
- `STORE_PATH` (set in each job for pnpm cache path)
- `GITHUB_ENV` (GitHub Actions runtime environment file used to persist `STORE_PATH`)
- Controller configuration: `DEPENDABOT_CONTROLLER_APP_ID`, `DEPENDABOT_STATE_ISSUE_NUMBER`, `DEPENDABOT_AUTOMATION_ENABLED`, `DEPENDABOT_AGENT_ENABLED`, `DEPENDABOT_VERCEL_APP_ID`
- Enable flags must be exactly `true`; unset or other values remain disabled

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
  - Confirm browser dependencies install step succeeded

### Build verification failure (`.next` not found)
- Symptom: `Build Check` fails at output verification.
- Action:
  - Review `pnpm build` logs for prior failure
  - Confirm Next.js build output directory is expected to be `.next`

### Coverage upload issues
- Symptom: Codecov upload step warns/fails.
- Current behavior: non-blocking (`continue-on-error: true`), CI still completes based on core checks.
- Action: verify `coverage/lcov.info` generation in Jest run.

## Maintenance

- Keep action versions current (`checkout`, `setup-node`, `cache`, `upload-artifact`, `codecov-action`, `pnpm/action-setup`).
- Update pinned workflow SHAs when upstream action releases are adopted.
- Reassess `pnpm install --no-frozen-lockfile` fallback policy if stricter reproducibility is required.
- Periodically review:
  - Node version pin (`24`)
  - artifact retention duration (currently 30 days)
  - workflow permissions for least privilege
- Observe `Dependency Review` results before deciding whether to promote it to a required branch protection check.
- Keep controller CI provenance, authentic independent-review evidence and Vercel identities, App-bound branch protection, ledger capacity, and daily/lifetime limits aligned with the implementation and setup guide.
- If CD is needed, add explicit deploy job(s) with:
  - environment protection rules
  - scoped secrets
  - branch/tag deployment strategy
- Consider extending security coverage beyond dependency audit with additional SAST coverage where GitHub default setup is insufficient.


### Production recovery interlock (2026-10-20)

The Dependabot controller reads the latest GitHub `Production` deployment and latest status from the trusted Vercel bot. Current main must have a successful deployment before bot work and again before releasing its App-owned merge gate. An unavailable, failed, pending, stale, or foreign result cancels merge intent and blocks the gate. Default-branch Vercel status/CI events and the existing ten-minute scan reevaluate the same source of truth. Human recovery remains available, and rollback is manual.

Missing variable setup is visible on one daily diagnostic, manual runs, and bot-open/reopen events. Credential checks stay inside their existing environments. Per-PR workflow summaries expose exhausted budgets and stale tasks without issue/comment creation. The setup guide lists the added Deployments read permission and activation contract; models, budgets, publication, review, and CI gates are unchanged.

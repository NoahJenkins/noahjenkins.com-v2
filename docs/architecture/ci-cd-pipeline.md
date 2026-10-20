# CI/CD Pipeline

## Overview
This repository uses two GitHub Actions workflows for validation:

- `.github/workflows/ci.yml` named **CI** for application validation
- `.github/workflows/dependency-review.yml` named **Dependency Review** for pull request dependency-diff scanning

- **Triggers**
  - `push` to `main`
  - `pull_request` targeting `main`
- **Execution model**
  - A hosted `runner-routing` job selects the runner for five application jobs in **CI**: `security-audit`, `jest-tests`, `playwright-tests`, `typecheck`, `build`
  - The five application jobs remain independent of each other and retain their existing check names; each now depends on the hosted routing job
  - Workflow-level concurrency cancels in-progress runs for the same ref:
    - `group: ${{ github.workflow }}-${{ github.ref }}`
    - `cancel-in-progress: true`
- **Security baseline**
  - Minimal permissions in the main `CI` workflow:
    - `contents: read`
    - `actions: read`
  - Workflow action references are pinned to full commit SHAs

## Conditional Dell CI routing

`OPTIPLEX_CI_ENABLED` is a repository variable and an explicit opt-in. Only the
literal, case-sensitive string `true` selects `optiplex-ci-ubuntu24` for a `push`
or a `pull_request` whose head repository equals `github.repository`. Missing,
empty, `false`, uppercase, whitespace-padded, and other values select the original
`ubuntu-latest` runner. Fork PRs stay hosted even when enabled, including forks
authored by Dependabot. Routing never uses the actor's name as a trust signal.
An unknown event or a PR without a matching head repository also stays hosted.

GitHub Actions [string comparisons ignore case](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions#operators).
Consequently, the literal opt-in cannot use only `vars.OPTIPLEX_CI_ENABLED == 'true'`.
The new **CI Runner Routing** job runs one Bash step on `ubuntu-latest`, compares
the variable and repository names without case folding, and exposes the runner as
a job output. It checks out no code and receives no secrets. This routing
compatibility adjustment adds `needs: runner-routing` to each existing CI job;
it does not skip fork checks or introduce dependencies between application jobs.
Each protected job uses `always()`, falls back to `ubuntu-latest` when the runner
output is missing, and first checks that routing succeeded before checkout. A
failed, cancelled, or skipped router therefore produces failed protected checks
instead of skipped checks that GitHub can accept for branch protection.
The existing PR activities, permissions, action pins, cancellation group, default
job timeouts, installs, audit gate, caches, browser configuration, and artifacts
are unchanged. No application manifest or lockfile changes are required.

| Job / check name | Before | After: literal `true`, same repository | After: disabled, missing, or fork PR |
| --- | --- | --- | --- |
| `runner-routing` / CI Runner Routing | New routing job | `ubuntu-latest` | `ubuntu-latest` |
| `security-audit` / Security Audit | `ubuntu-latest` | `optiplex-ci-ubuntu24` | `ubuntu-latest` |
| `jest-tests` / Jest Tests | `ubuntu-latest` | `optiplex-ci-ubuntu24` | `ubuntu-latest` |
| `playwright-tests` / Playwright Tests | `ubuntu-latest` | `optiplex-ci-ubuntu24` | `ubuntu-latest` |
| `typecheck` / TypeScript Check | `ubuntu-latest` | `optiplex-ci-ubuntu24` | `ubuntu-latest` |
| `build` / Build Check | `ubuntu-latest` | `optiplex-ci-ubuntu24` | `ubuntu-latest` |
| `dependency-review` / Dependency Review | `ubuntu-latest` | `ubuntu-latest` | `ubuntu-latest` |
| `controller` / Reconcile Dependabot PRs | `ubuntu-latest` | `ubuntu-latest` | `ubuntu-latest` |
| `claim`, `worker`, `validate`, `publish`, `reconcile` / OpenCode workflow jobs | `ubuntu-latest` | `ubuntu-latest` | `ubuntu-latest` |

The five protected check contexts remain Security Audit, Jest Tests, Playwright
Tests, TypeScript Check, and Build Check. Dependency Review remains hosted.
The Dependabot controller and OpenCode workflow jobs remain hosted with
their existing environments and trigger conditions. GitHub-managed Dependabot,
CodeQL default setup, and OpenCode execution are outside this migration. Vercel
preview and production deployment settings remain unchanged; this repository
has no Actions deployment, migration, release, signing, or attestation jobs.

### Disposable worker image requirements

The infrastructure controller on `optiplex-7040` supplies repository-scoped,
ephemeral Ubuntu 24.04 x64 workers with the exact custom label
`optiplex-ci-ubuntu24`. This repository does not target `optiplex-ci-ubuntu22`
or the existing `optiplex-tailscale-policy` / `tailscale-policy` runners.
The controller initially permits only **one job across the entire Dell CI pool**,
with at most **4 vCPUs and 16 GiB RAM** for its active VM. All five jobs still run;
they queue normally. Pool limits belong to infrastructure, not this workflow.

- Use a reviewed base image and a fresh disposable VM for every job. Each VM
  needs Git, Bash, CA certificates, curl, tar/gzip, unzip, and a current compatible
  GitHub Actions runner; retain support for the Node runtimes bundled with the
  pinned actions. Provide writable VM-local runner temp, tool cache, home,
  workspace, pnpm store, and browser cache directories.
- `actions/setup-node` installs Node **24**. `pnpm/action-setup` reads the pinned
  `packageManager` value **pnpm@10.17.1**. Preserve the existing frozen-lockfile
  install attempt and its existing non-frozen fallback; do not regenerate the
  lockfile or upgrade dependencies for runner provisioning.
- Keep `pnpm exec playwright install --with-deps` inside the disposable VM. The
  runner account needs VM-local sudo/apt access for browser libraries and fonts.
  Install the Chromium, Firefox, and WebKit binaries corresponding to the locked
  Playwright version, including their headless dependencies. The unchanged
  browser projects also cover Pixel 5 and iPhone 12 emulation. See
  [Playwright browser/dependency installation](https://playwright.dev/docs/browsers).
- Permit outbound HTTPS needed for GitHub Actions, Node/pnpm distributions,
  the npm registry and audit endpoint, Playwright browser downloads, Ubuntu
  package mirrors, Actions cache/artifact storage, and the existing optional
  Codecov upload. Builds also fetch public GitHub data through the application.
- Never mount the host Docker socket, SSH credentials, home directories,
  production data, or host workspace. Block access to the home network. Docker,
  if used by infrastructure for a job, runs within its VM; these jobs require no
  Docker service. No shared writable home or workspace is allowed. Only the
  existing GitHub Actions pnpm cache is restored by the workflow.
- The infrastructure controller must destroy **all writable disks** on success,
  failure, cancellation, and timeout. Workflow cleanup steps cannot guarantee
  this after interruption; retain controller records linking each Actions job
  and runner to VM creation and disk destruction.

### Validation and activation acceptance

`test/github/ci-runner-routing.test.ts` parses the actual workflow with Jest's
existing YAML parser, executes its Bash routing step, and resolves each required
job's output reference. It covers enabled, disabled, missing-variable, fork,
Dependabot fork, same-repository Dependabot, malformed PR metadata, unknown event,
uppercase and whitespace cases. It also checks PR coverage and that every
Dependency Review and controller workflow job stays hosted. These are policy tests,
not evidence that a Dell VM has executed CI.

Run the unchanged gates with Node 24 and pnpm 10.17.1 in a clean environment:

```bash
pnpm install --frozen-lockfile
pnpm audit --audit-level=high
CI=true pnpm exec tsc --noEmit
CI=true pnpm test
rm -rf .next
CI=true pnpm build
test -d .next
rm -rf .next
pnpm exec playwright install --with-deps
CI=true pnpm test:ui
actionlint .github/workflows/*.yml
```

Remove `.next` only in the disposable validation workspace. Do not reuse a local
server: Playwright already sets `reuseExistingServer: false`; `CI=true` makes its
web server run `pnpm build && pnpm start`, with one test worker, two retries, and
the existing 120-second startup timeout. A process already listening on port 3000
must cause validation to fail, not supply a false pass. Fresh VM disks also
prevent reused `.next` output; `.next` is not part of the workflow cache.

The prepared PR is not migration acceptance. After infrastructure acceptance,
the infrastructure owner may activate the variable serially and must record:

1. A complete successful **CI** run at the exact reviewed PR head, with all five
   application jobs on the expected Ubuntu 24.04 x64 Dell workers and the routing
   job hosted. Record head SHA, run URL, job IDs, runner names/labels, image
   identity, and resource limits; a passing local or hosted run is not Dell proof.
2. Normal fork routing with the variable enabled: all five original required
   checks run on hosted infrastructure, including a Dependabot-authored fork.
   Preserve GitHub's existing fork approval rules.
3. The original `playwright-report` and `playwright-test-results` artifacts with
   30-day retention, Jest coverage generation and the existing non-blocking
   Codecov behavior, plus cache restore/save results.
4. Controller evidence of distinct VMs and destroyed writable disks after
   success, failure, cancellation, and timeout. No shared writable disks or home
   network access. Queueing must respect the global one-job pool limit.

Do not enable the variable, alter settings or secrets, or dispatch deployments
as part of preparing this PR. If the Dell is unavailable, finish the PR with
local/hosted validation results and leave live acceptance pending.

### Rollback

The operator can set `OPTIPLEX_CI_ENABLED` to `false` or remove it to restore
`ubuntu-latest` routing for subsequent runs. Already queued or running jobs retain
their selected runner; cancel affected runs and let the infrastructure controller
destroy their writable disks, then rerun CI with the flag disabled. For a source
rollback, revert the migration commit through normal review. No check names,
branch protection, deployment settings, or secrets need to change.

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
6. Install dependencies (`pnpm install --frozen-lockfile`, fallback to `--no-frozen-lockfile`)
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
6. Install dependencies (same frozen-lockfile fallback behavior)
7. Install Playwright browsers/deps: `pnpm exec playwright install --with-deps`
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
6. Install dependencies (frozen-lockfile with fallback)
7. Run audit gate: `pnpm audit --audit-level=high`

#### Job: `typecheck` (TypeScript Check)
Purpose: static type validation.

Steps:
1. Checkout
2. Setup Node.js 24
3. Setup pnpm
4. Set `STORE_PATH`
5. Setup pnpm cache
6. Install dependencies (frozen-lockfile with fallback)
7. Run typecheck: `pnpm exec tsc --noEmit`

Security/quality controls present in workflow:
- Principle of least privilege via read-only GitHub token permissions
- Deterministic dependency install attempt with lockfile enforcement first
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
6. Install dependencies (frozen-lockfile with fallback)
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

### 6) Dependabot Controller and OpenCode Go Workers

[ADR 0011](../adr/0011-use-opencode-go-for-dependabot-workers.md) supersedes ADR 0010's Copilot dispatcher/reviewer. Controller acceptance, quotas, protected scope, App authority, and main-only environments remain. The [setup guide](../dependabot-controller-setup.md) separates implementation from activation.

The trusted workflow reconciles same-repository Dependabot PRs on PR/CI/status events and a ten-minute schedule. A passing human-triggered CI run is eligible. Exact-head/current-base CI provenance, all five required jobs, trusted Vercel deployment status, protected scope, and authentic independent review evidence are required. Human/shared-commit and duplicate bot-head safeguards remain.

Flow: controller → App claim → isolated Go worker matrix → fresh secret-free validator → trusted publisher → reconciliation. Trusted jobs checkout immutable workflow source matching the reserved base and run only from main; launch is original attempt 1. The controller App owns `Dependabot Merge Gate`, the ledger, task claims, repair commits, and `Dependabot Independent Review`. Branch protection must bind the gate to this App and require strict up-to-date CI, one approval, and stale-review dismissal.

The broker alone holds the real Go key; the containerized agent uses an ephemeral local proxy token. Pinned OpenCode 1.19.0 uses Kimi repair and GLM review sessions with denied execution/extensions and capped calls/time. Fixed validation runs separately without secrets. The publisher executes no artifact, verifies immutable run/job/claim/digest evidence and scope, atomically commits repairs with expected head, or publishes App-owned review proof bound to head/base. The controller queues native auto-merge while its gate is pending and revalidates before formal App approval and gate success.

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
- `dependabot-dispatch` environment only: `OPENCODE_GO_API_KEY`

### Environment variables (names only)
- `STORE_PATH` (set in each job for pnpm cache path)
- `GITHUB_ENV` (GitHub Actions runtime environment file used to persist `STORE_PATH`)
- Repository opt-in: `OPTIPLEX_CI_ENABLED` (literal `true` only; forks remain hosted)
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

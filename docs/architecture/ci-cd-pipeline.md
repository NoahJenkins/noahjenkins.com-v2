# CI/CD Pipeline

## Overview
This repository uses a single GitHub Actions workflow (`.github/workflows/ci.yml`) named **CI** to validate code quality and build integrity on changes to `main`.

- **Triggers**
  - `push` to `main`
  - `pull_request` targeting `main`
- **Execution model**
  - Five independent jobs run on `ubuntu-latest`: `security-audit`, `jest-tests`, `playwright-tests`, `typecheck`, `build`
  - Workflow-level concurrency cancels in-progress runs for the same ref:
    - `group: ${{ github.workflow }}-${{ github.ref }}`
    - `cancel-in-progress: true`
- **Security baseline**
  - Minimal workflow permissions:
    - `contents: read`
    - `actions: read`

## Pipeline Stages

### 1) Test Stage

#### Job: `jest-tests` (Jest Tests)
Purpose: unit/integration validation and coverage upload.

Steps:
1. Checkout (`actions/checkout@v4`)
2. Setup Node.js 20 (`actions/setup-node@v4`)
3. Setup pnpm (`pnpm/action-setup@v4`, `version: latest`)
4. Resolve pnpm store path into env var `STORE_PATH`
5. Restore/save pnpm cache (`actions/cache@v4`) keyed by `pnpm-lock.yaml`
6. Install dependencies (`pnpm install --frozen-lockfile`, fallback to `--no-frozen-lockfile`)
7. Run tests: `pnpm test`
8. Upload coverage to Codecov (`codecov/codecov-action@v4`) when `coverage/lcov.info` exists, always-attempted, non-blocking (`continue-on-error: true`)

#### Job: `playwright-tests` (Playwright Tests)
Purpose: end-to-end UI validation and artifact retention.

Steps:
1. Checkout
2. Setup Node.js 20
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
2. Setup Node.js 20
3. Setup pnpm
4. Set `STORE_PATH`
5. Setup pnpm cache
6. Install dependencies (frozen-lockfile with fallback)
7. Run audit gate: `pnpm audit --audit-level=high`

#### Job: `typecheck` (TypeScript Check)
Purpose: static type validation.

Steps:
1. Checkout
2. Setup Node.js 20
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
2. Setup Node.js 20
3. Setup pnpm
4. Set `STORE_PATH`
5. Setup pnpm cache
6. Install dependencies (frozen-lockfile with fallback)
7. Build app: `pnpm build`
8. Verify output directory `.next` exists; fail job if missing

### 4) Deploy Stage (Not Applicable)
There is **no deploy job** in the current workflow.  
The pipeline is currently CI-only (validation), not CD deployment.

## Deployment Environments
No GitHub Actions deployment environments are defined in `.github/workflows/ci.yml` (e.g., no `environment:` blocks such as staging/production).  
Deployments, if any, are handled outside this workflow.

## Required Secrets / Environment Names

### Secrets (names only)
- **None explicitly required by this workflow** (no `secrets.*` references present in `ci.yml`)

### Environment variables (names only)
- `STORE_PATH` (set in each job for pnpm cache path)
- `GITHUB_ENV` (GitHub Actions runtime environment file used to persist `STORE_PATH`)

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
- Reassess `pnpm install --no-frozen-lockfile` fallback policy if stricter reproducibility is required.
- Periodically review:
  - Node version pin (`20`)
  - artifact retention duration (currently 30 days)
  - workflow permissions for least privilege
- If CD is needed, add explicit deploy job(s) with:
  - environment protection rules
  - scoped secrets
  - branch/tag deployment strategy
- Consider extending security coverage beyond dependency audit with dedicated SAST/secret scanning jobs.

# OpenCode Go Dependabot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace inactive Copilot dispatch with bounded OpenCode Go repair and independently verified review, preserving the trusted merge controller.

**Architecture:** The App reserves and claims tasks before isolated workers run. A separate secret-free validator checks repairs; a trusted publisher commits bounded file data or publishes authenticated review evidence. The controller accepts exact-head/base evidence before native auto-merge and gate success.

**Tech Stack:** Node.js 24, CommonJS scripts, TypeScript/Jest tests, GitHub Actions, Docker, GraphQL, OpenCode 1.19.0, OpenCode Go.

**Spec:** [Accepted design](./2026-10-13-opencode-go-dependabot-design.md); [ADR 0011](../adr/0011-use-opencode-go-for-dependabot-workers.md).

## Global Constraints

- Retain App-owned `Dependabot Merge Gate`, native auto-merge, protected scope, exact-head/current-base CI, trusted Vercel status, and the central ledger.
- Allow two repairs and eight reviews per UTC day, two lifetime repairs per PR; never reset head deduplication or ambiguous reservations.
- Dispatch only persisted App-claimed tasks on original run attempt 1, within 15 minutes and their reservation UTC date.
- Pin OpenCode `1.19.0`, provider `opencode-go`, repair `kimi-k2.7-code`, review `glm-5.3`; no provider/model fallback or paid development probes.
- Verify Linux x64 baseline binary SHA-256 `6334d70db3990721ea454357e9cf2573c8685524ad7769af9d52cbffb7008438` before execution.
- Enforce repair 20 minutes/24 steps and generation calls, review 10 minutes/16 steps and generation calls, validation 20 minutes, publication 5 minutes. A trusted API broker hard-caps upstream calls including retries; native step instructions alone are insufficient.
- Artifact limits: 64 files, 2 MiB/file, 8 MiB total, 240-byte relative paths; UTF-8 JSON file data only, no archives, commands, symlinks, or executable modes.
- Use fresh homes and trusted configuration/prompts; omit candidate instructions/configuration/plugins/MCP/`.git`. Deny shell, LSP, formatters, plugins, MCP, subagents, web fetch, and external directories while the Go key exists.
- Keep Go key only in main-only `dependabot-dispatch`; App key only in main-only `dependabot-controller`. The broker holds the real Go key; the OpenCode child receives only a local proxy URL and ephemeral token. No real Go/GitHub/App/Doppler credential reaches the child.
- Validator is a separate fresh job/container without secrets, host services, credentials, or container socket; fixed lock generation uses `--ignore-scripts`. Pin Linux amd64 `node:24-bookworm-slim@sha256:51b1100cc2a83d370c6a60952e3f2989c8a43159d0e38586e090f3b3326efefd`.
- Review covers every changed base/head file, including manifests and lockfile. Only full coverage, passing assessments, and no critical/high/medium finding permit acceptance.
- Keep T3 stable. Activation, credential entry, merge, deployment, and cleanup remain separately verified boundaries.

## Review Focus

1. Candidate plugin/configuration or shell instructions cannot expose the Go key: Task 2's isolation tests.
2. Forged/replayed artifacts or wrong-run claims cannot reach GitHub writes: Tasks 1 and 3's provenance tests.
3. Head/base races cannot overwrite changes or accept stale review: Task 3's atomic publication tests.
4. Omitted dependency files or malformed review cannot pass: Task 1's coverage/schema tests.
5. Expiry, UTC rollover, reruns, and quota failures cannot dispatch twice: Task 3's reservation tests.

---

## Shared contracts

Use existing `Task` fields `{pr, prId, head, base, kind, nonce, createdAt}`. `Origin` is `{repositoryId, workflowPath, workflowSha, ref, runId, runAttempt, jobId}`; workflow path is `.github/workflows/dependabot-auto-merge.yml`, ref is `refs/heads/main`, and workflow SHA equals reserved base.

`Snapshot` is `{task, changedFiles, baseFiles, headFiles, contextFiles}`; each file map holds relative paths and UTF-8 contents. Preparation reads all changed files without truncation and blocks on incomplete coverage or the artifact byte/file limits. Repair inputs also contain bounded failed-check and review diagnostics, with credentials removed. `Artifact` is `{version:1, task, origin, agent, result, digest}`. `agent` records `{runtimeVersion, provider, model, sessionId, configDigest, inputDigest}`. Repair `result` is `{files:[{path, content}]}`; review `result` is `{report}`. Compute SHA-256 over canonical artifact JSON excluding `digest`. Trusted wrappers set metadata; model output supplies only file data/report.

`Report` matches the spec's `verdict`, `findings`, `coveredFiles`, and `assessment`. `VerifiedReview` is `{task, origin, digest, report, passed}`. A valid `request_changes` remains authentic evidence but cannot approve. Missing or unauthenticated evidence is `null`.

### Task 1: Artifact contract and independent-review policy

**Files:** Create `.github/scripts/dependabot-opencode-contract.cjs` and `test/github/dependabot-opencode-contract.test.ts`. Modify `.github/scripts/dependabot-controller-policy.cjs`, `.github/scripts/dependabot-controller-run.cjs`, `test/github/dependabot-controller-policy.test.ts`, and `test/github/dependabot-controller-config.test.ts`.

**Interfaces:** Export `validateArtifact(raw, expected): Artifact`, `validateReview(report, expectedFiles): {report, passed}`, and `validateReviewEvidence(check, context): VerifiedReview|null`. Schema violations throw; authentic but unacceptable review returns `passed:false`. `evaluateCandidate(input)` consumes `input.independentReview: VerifiedReview|null` instead of Copilot reviews/IDs.

- [x] Write `rejects_forged_origin_and_digest`, `rejects_invalid_file_data`, and `rejects_incomplete_dependency_review`. Assert wrong nonce/run/model/digest and traversal/duplicate/oversized paths throw; omitted `pnpm-lock.yaml` and extra schema fields throw. Assert low/info findings stay visible, medium findings cannot pass, and a wrong-App or stale-base check returns null.

  Exact contract assertions, using fixture `artifact`, `expected`, `report`, and `context`:

  ```js
  expect(() => validateArtifact({ ...artifact, digest: '0'.repeat(64) }, expected)).toThrow()
  expect(() => validateReview({ ...report, coveredFiles: ['package.json'] }, ['package.json', 'pnpm-lock.yaml'])).toThrow()
  expect(validateReviewEvidence(wrongAppCheck, context)).toBeNull()
  ```

- [x] Run `pnpm exec jest test/github/dependabot-opencode-contract.test.ts --runInBand`; require failure on absent exports before implementation.
- [x] Implement strict schemas, canonical digests, byte limits, unique complete coverage, and authentic check/claim context validation. Reject unknown verdicts/severities/assessments. Remove Copilot/PAT identity configuration; preserve exact CI/Vercel/scope behavior. Add scope tests that reject edits to every new worker, broker, validator, publisher, prompt, and Dockerfile, plus nested instruction files and existing tests. Map authentic requested changes to repair, missing review to review reservation, and blocked evidence to manual state.
- [x] Run contract, policy, and config test files with Jest; require all pass, including no acceptance based on model prose or check name alone.
- [x] Commit the contract/policy files and their tests as `feat: validate OpenCode task and review evidence`; include no unrelated files.

### Task 2: Pinned isolated worker and secret-free validator

**Files:** Create `.github/scripts/dependabot-opencode-worker.cjs`, `.github/scripts/dependabot-opencode-proxy.cjs`, `.github/scripts/dependabot-opencode-validate.cjs`, `.github/opencode/validator.Dockerfile`, `.github/opencode/repair.md`, `.github/opencode/review.md`, `test/github/dependabot-opencode-worker.test.ts`, and `test/fixtures/opencode-fake-provider.cjs`.

**Interfaces:** `createGoProxy({apiKey, model, maxCalls, timeoutMs, session, fetcher})` produces `{url, token, count, close}` for the trusted broker. `prepareWorkspace(snapshot, root, kind): {dataRoot, configPath, inputDigest}` creates curated input. `runAgent(task, input, options): Promise<Artifact>` uses injected launcher/clock in tests. `validateRepair(task, snapshot, artifact, options): Promise<{artifact, checks}>` consumes Task 1's validated file data and produces validated files plus fixed-check results.

- [x] Write `ignores_candidate_agent_configuration`, `denies_secret_time_execution_tools`, and `enforces_agent_step_and_time_bounds`. Fixture assertions require no candidate `.git`/AGENTS/plugins, fixed model, denied shell/MCP/subagents, 24/16 step/event bounds, and killed timed-out processes. Write `proxy_caps_hostile_generation_retries`; a hostile fake provider keeps requesting tools, but assert only 24/16 upstream calls and rejection before call 25/17, with the child receiving no real key. Assert the worker cannot reach an external endpoint or the broker credential files, even if candidate text asks it to do so. Write `validator_has_no_provider_or_host_credentials`; assert no Go/GitHub/App/Doppler variables or socket and fixed lifecycle-disabled lock commands.
- [x] Run `pnpm exec jest test/github/dependabot-opencode-worker.test.ts --runInBand`; require failures before worker implementation. The fixture must use no real provider and expose no credential values.
- [x] Implement fresh HOME/XDG workspaces, trusted prompts/configuration, checksum verification, read-only review, bounded repair edits, and wrapper-owned metadata. Set `OPENCODE_DISABLE_PROJECT_CONFIG=1`, `OPENCODE_PURE=1`, `OPENCODE_DISABLE_DEFAULT_PLUGINS=1`, `OPENCODE_DISABLE_EXTERNAL_SKILLS=1`, and `OPENCODE_DISABLE_CLAUDE_CODE=1`. Configure formatter/LSP/snapshot off, sharing disabled, autoupdate off, and automatic compaction off. Default every permission to deny; allow read/glob/grep/list and repair-only edit. Deny bash/task/webfetch/websearch/lsp/skill/external directories, including the tool-output auto-exception. Exclude AGENTS/CLAUDE/CONTEXT instructions at every depth, project configs, tool scripts, `.opencode`, and `.git`. Parse `--format json` event streams and require successful exit plus strict final-text schema; run the child in a container on an internal-only network shared with a trusted broker container. Only the broker has an upstream network and the real key. Mount curated data only in the child; never mount the Docker socket or broker files. Verify this boundary with a no-key local container smoke test.
- [x] Implement the trusted broker outside OpenCode. Allow only the configured Go chat endpoint/model; cap all upstream generation calls including retries at 24/16. Bound request bodies to 20 MiB and each upstream request to 120 seconds, reject redirects, forward stable native Go session headers and coding-agent User-Agent, and never log keys/raw bodies. Count wrapper events and enforce wall-clock termination; no model/provider fallback.
- [x] Implement `validator.Dockerfile` with the pinned Node image and pnpm `10.17.1` from `packageManager`. Enforce scope before commands, generate lockfile with `pnpm install --lockfile-only --ignore-scripts`, install frozen dependencies with scripts disabled, and run fixed audit/type/Jest/build checks. Container receives only curated data and normal registry/public build access, no host home or socket. Build the artifact from observed changes, not agent claims. Review tasks perform no lock generation or candidate execution: the fresh validator checks schema/coverage and passes through review evidence. Validation returns `{artifact, checks}` with digests binding the input worker artifact and final output; publisher verifies both successful jobs and their exact artifact chain.
- [x] Run worker tests and contract tests; require bounded fake-provider completion and isolation assertions. Commit only Task 2 files as `feat: isolate OpenCode workers and repair validation`.

### Task 3: Durable claims, atomic publisher, and workflow

**Files:** Create `.github/scripts/dependabot-opencode-publish.cjs` and `test/github/dependabot-opencode-publish.test.ts`. Modify existing `dependabot-controller-api.cjs`, `dependabot-controller.cjs`, `dependabot-controller-run.cjs`, ledger interfaces as needed, `.github/workflows/dependabot-auto-merge.yml`, and their existing `test/github/dependabot-controller*.test.ts` files.

**Interfaces:** Export `publishResult(client, config, task, artifact, origin): Promise<{kind, id}>`. API adds `claimTask`, `getClaims`, `getRun`, `getJobs`, `getArtifact`, read-only `getFileContent`, `commitFiles`, `publishReview`, and `getIndependentReview`. Replace `dispatchOne` with `claimOne`, returning worker tasks without provider calls. CLI modes are `controller`, `claim`, `prepare`, `worker`, `validate`, `publish`, and `inspect`.

- [x] Write `rejects_wrong_run_replayed_artifact`, `atomic_commit_rejects_changed_head`, `review_rejects_changed_base`, and `claims_obey_expiry_utc_and_quota`. Assert wrong job/attempt/ref/workflow SHA or reused claim causes zero writes; a head race fails `expectedHeadOid`; base movement prevents review success; expiry/UTC rollover/rerun/exhaustion launch zero workers and retain charged reservations.

  Exact race/replay assertions, using a mocked client and task-bound artifact fixture:

  ```js
  await expect(publishResult(client, config, task, artifact, wrongOrigin)).rejects.toThrow()
  expect(client.commitFiles).not.toHaveBeenCalled()
  ```

- [x] Run publisher and existing controller/API/run tests; require failures on new interfaces before implementation.
- [x] Implement App-authored claims before launch, successful exact worker/validator job verification, immutable artifact ID/digest checks, fresh snapshot reconstruction, and Task 1 validation. Publisher never executes output. Use GraphQL `createCommitOnBranch` with `expectedHeadOid` and base64 `fileChanges.additions`; no non-atomic ref update. Publish App-owned `Dependabot Independent Review` with task/base/run/digest binding. Reconciliation verifies latest authentic check against its durable claim.
- [x] Replace workflow with controller → claim → worker matrix → fresh validator job → trusted publisher → reconciliation. Keep global concurrency, `fail-fast:false`, original attempt 1, main ref/source SHA checks, trusted pinned checkouts, and five-minute publisher bound. App token exists only in controller/claim/publisher jobs; worker broker has only Go key and child has only ephemeral proxy access; validator has no secrets. GitHub ZIP is transport only: verify the API artifact digest, parse exactly one bounded `result.json` entry in memory, and never extract entries to the filesystem. Reject extra entries, paths, oversized/uncompressed data, and mismatched manifest origin/claim. Remove Copilot IDs, PAT comments, and provider calls.
- [x] Run all `test/github` Jest tests and `actionlint .github/workflows/dependabot-auto-merge.yml`; require success. Commit as `feat: publish claimed OpenCode results through trusted jobs`.

### Task 4: Documentation, independent review, hosted verification, and setup

**Files:** Update `docs/dependabot-controller-setup.md`, `docs/architecture/ci-cd-pipeline.md`, `docs/context/2026-10-13-opencode-go-dependabot-workers.md`, `docs/context/index.md`, `docs/TODO.md`, this plan, and ADR 0011. Append supersession context to ADR 0010 without rewriting its history.

- [x] Document Go configuration, main-only environment boundaries, secure key entry, Use balance off, budgets, artifact/check provenance, inactive defaults, and recovery. Remove obsolete Copilot activation requirements. Record that homelab configurations under ArkBuilderLabs contain no located Go key; local OpenCode credential metadata is not proof of key validity.
- [x] Run `pnpm test --coverage`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm audit --audit-level=high`, `actionlint .github/workflows/dependabot-auto-merge.yml`, and `git diff --check`. Require passing checks and no high/critical audit findings; report existing moderate findings. No paid model call is needed for this verification.
- [ ] Obtain independent whole-branch code/security review of all five Review Focus cases; fix findings and rerun affected checks. Commit documentation as `docs: document OpenCode worker setup and verification`.
- [ ] Create the reviewable PR and immediately register its full URL with `link_pull_request`; verify hosted required checks and matching Vercel preview. Keep the worktree for review. Separate user authorization governs merge, production verification, and eventual cleanup; verify each requested boundary before reporting completion.
- [ ] Before credential insertion/activation, verify App installation/gate ownership, exact-main/no-bypass environments, secure Go-key source, provider model access, Use balance off, budgets, enforceable isolation/bounds, authentic claims/artifacts/review, and an authorized observed live flow. Transfer only the Go key; never place a broad Doppler token on a runner or print secrets. Missing prerequisites leave flags off.

## Execution handoff

The user approved this plan and Native execution. Use `superpowers:executing-plans`: these four tasks share tight artifact, claim, and API interfaces. Plan review and execution choice are complete. Implement task-by-task and obtain independent whole-branch review. Preserve this worktree throughout review; no activation is inferred from implementation or green checks.

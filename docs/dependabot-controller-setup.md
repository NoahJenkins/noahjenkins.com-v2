# Dependabot Controller Setup

[ADR 0011](./adr/0011-use-opencode-go-for-dependabot-workers.md) replaces Copilot dispatch with OpenCode Go workers. The controller remains inactive. Implementation, credential setup, hosted validation, and live activation are separate completion steps. Missing App ID, state issue, or enable flags produce a setup warning and summary on manual runs, a daily 12:17 UTC diagnostic, and Dependabot opened/reopened events. The ten-minute recovery scan and high-volume status/CI events do not allocate a separate warning runner. Environment credential checks fail with the setup path and never print values. No setup diagnostic creates issues, comments, or paid requests.

## Configuration and credential boundaries

| Name | Storage | Purpose |
| --- | --- | --- |
| `DEPENDABOT_CONTROLLER_APP_ID` | Repository Actions variable | Dedicated GitHub App's numeric ID |
| `DEPENDABOT_STATE_ISSUE_NUMBER` | Repository Actions variable | Repository issue holding App-authored reservations and claims |
| `DEPENDABOT_VERCEL_APP_ID` | Repository Actions variable | Trusted Vercel App; supported default `8329` |
| `DEPENDABOT_AUTOMATION_ENABLED` | Repository Actions variable | Controller flag; only exact `true` enables it |
| `DEPENDABOT_AGENT_ENABLED` | Repository Actions variable | Worker flag; only exact `true` enables it |
| `DEPENDABOT_CONTROLLER_PRIVATE_KEY` | `dependabot-controller` environment secret only | Dedicated App private key |
| `OPENCODE_GO_API_KEY` | `dependabot-dispatch` environment secret only | Go key supplied only to the trusted broker |

`DEPENDABOT_CONTROLLER_APP_SLUG` is obtained from App-token action output and passed between trusted jobs; it is not an additional secret. Runtime read/installation tokens are job-local. Copilot PAT, dispatcher user ID, and reviewer ID are no longer used.

Both environments require selected deployment policies with exactly one Branch `main` rule, no Tag or PR-ref rules, and `can_admins_bypass: false`. Prior API read-back verified these policies and zero secrets for `dependabot-controller` (ID `24225904096`) and `dependabot-dispatch` (ID `24225905373`). Reverify before storing credentials. Leave `copilot`, `Preview`, and `Production` unchanged. Do not duplicate keys as repository, organization, Dependabot, or Agents secrets.

The merge scope guard cannot prevent pre-merge workflow secret access. Environment policy and `refs/heads/main` job conditions are enforced before secrets are released; trusted checkouts use immutable `github.workflow_sha`. Ordinary CI does not reference either credential environment. [GitHub environment rules](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)

## App and branch protection

Install a dedicated App for this repository with Actions write, Administration/Deployments read, Checks/Issues/Pull requests/Contents/Workflows write, and Metadata read. Store its key only in `dependabot-controller`. Create a state issue without secrets and configure its issue number.

With both enable flags off, publish `Dependabot Merge Gate` before making it required. Bind the required check to the App ID. Require all five CI checks with strict up-to-date branches, at least one approval, and stale-review dismissal. Read branch protection back. App installation, gate ownership, and live publication remain unverified; no configuration is inferred from source code.

Human PRs receive gate success unless their commit is shared with an open Dependabot PR. Multiple bot PRs sharing one commit require manual resolution. Check state belongs to commits, not individual PRs.

## Go access and billing

Pin OpenCode `1.19.0`, provider `opencode-go`, repair model `kimi-k2.7-code`, and review model `glm-5.3`. No provider/model fallback is configured. The Linux baseline runtime download must match SHA-256 `6334d70db3990721ea454357e9cf2573c8685524ad7769af9d52cbffb7008438`.

The Go key is unresolved. Fresh names-only checks found no Go key in homelab `prd`, `prd_admin`, or `prd_dns-pi` under ArkBuilderLabs. Local OpenCode credential metadata exists, but does not prove that a key is valid or authorized for this runner. Use secure local input to transfer only the verified Go key; do not send a broad Doppler token to Actions or print credentials.

Before activation, verify Go **Use balance** is off, model access is valid, and explicit provider/Actions budgets are configured. These settings are currently unknown. Request quotas are not currency limits. No paid request or credential change was performed for this documentation update.

## Worker flow and limits

The workflow is controller → claim → worker matrix → fresh validation job → publisher → reconciliation. Controller, claim, publisher, and reconciliation use `dependabot-controller`; only the worker job uses `dependabot-dispatch`. Both matrices use `fail-fast: false`. Global concurrency serializes controller runs; schedule is every ten minutes. Original run attempt 1, main ref, and workflow source equal to reserved base are required for work. PR-target events reevaluate gates without reserving paid work; the next verified default-branch event or scheduled scan can reserve a task. Run metadata is checked before reservation and again before launch.

App-authored ledger reservations allow two repairs/eight reviews per UTC day across the repository and two lifetime repairs per PR. New heads do not reset lifetime limits. Claim once before launch; expired, ambiguous, and failed operations remain charged. Launch only within 15 minutes on the reservation's UTC date, never from a rerun or duplicate head reservation. A stalled task requires operator action after 30 minutes; exhausted/stalled decisions appear in the existing merge gate and workflow summary, with no new issue or comment; a ledger over 60,000 bytes fails closed without automatic pruning.

The isolated broker holds the real Go key. The OpenCode container receives only a local broker URL and ephemeral token, with no real Go/GitHub/App/Doppler credentials. Its internal network reaches the broker only. The broker permits one fixed Go chat endpoint and model, rejects redirects, counts retries before upstream requests, and caps repair/review at 24/16 generation calls. Request and response streams are bounded at 20 MiB; per-request time is at most 120 seconds. No keys or raw bodies are logged.

Worker wall limits are 20 minutes for repair and ten for review; event steps are capped at 24/16 as a second boundary. Fresh HOME/XDG directories and trusted prompts/configuration disable project config, default plugins, external skills, Claude integration, model fetching, formatters, LSP, snapshots, sharing, auto-update, and automatic compaction. Read/glob/grep/list are allowed; edits are repair-only. Shell, subagents, MCP, web tools, skills, and external directories are denied. Candidate instructions/config/tool directories are omitted at every depth.

Validation runs in a separate fresh job. The candidate container receives curated candidate data, no credentials, host home, persistent Git authentication, or container socket. It uses the pinned Node 24 Linux amd64 image and pnpm `10.17.1`. Fixed commands generate the lockfile with scripts disabled, install frozen dependencies with scripts disabled, then run audit, TypeScript, Jest coverage, and build. Validation is bounded at 20 minutes; publisher at five. Full hosted CI still validates the resulting head, including Playwright.

## Artifact and review proof

Artifacts contain task/origin/session/config/input digests and bounded UTF-8 data: 64 files, 2 MiB each, 8 MiB total, 240-byte relative paths. No executable modes, symlinks, commands, or arbitrary archives are accepted. GitHub ZIP is transport only: API digest and origin are checked, exactly one bounded `result.json` entry is parsed in memory, and nothing is extracted to execute.

The complete immutable head tree inventory distinguishes new files from existing files even when contents are not in the agent context. Output readers reject symlinks in every ancestor after candidate execution. Unchanged generated lockfiles are omitted.

The publisher verifies the persisted App claim, original run/job success, validator digest chain, current head/base, complete expected coverage, and protected scope. It records publication intent before a possibly ambiguous write. Repair commits use GraphQL `createCommitOnBranch(expectedHeadOid)` with base64 file additions; an altered head blocks publication. Protected instructions/scripts/tests/commands and official upstream Action-tag checks remain enforced.

Review uses a fresh read-only session with complete base/head changed-file contents, including manifests and lockfile. Strict output contains verdict, findings, exact covered files, and security/compatibility assessments. Only `approve`, complete coverage, both assessments `pass`, and no critical/high/medium findings can pass; low/info findings remain visible. Missing, unknown, oversized, or malformed proof blocks acceptance.

The App publishes `Dependabot Independent Review` on the exact head, bound to base, task nonce, original run, and digests. The controller accepts only the latest authentic check matching a published durable claim. Model prose, requested review, same-named foreign checks, and stale evidence do not suffice. After independent evidence plus CI/Vercel/scope pass, it queues native auto-merge while the required gate is pending, then revalidates before App approval and gate success.

## Empty CI association recovery

GitHub can return an empty `workflow_run.pull_requests` array for a real Dependabot CI run. Only for an explicitly empty array, the controller reads the authenticated `commits/<exact-head>/pulls` endpoint. Exactly one association must match the open PR's numeric and node identity, head SHA/branch/repository, and current main SHA/branch/repository. Missing or contradictory nonempty run evidence still blocks.

This fallback retains the CI workflow ID, event, head SHA, branch, repository, latest-run and job/check publisher tests. The exact tested head must contain current main as an ancestor; a newer unrelated base forces a refresh. Commit timestamps do not replace graph ancestry. Required strict native branch protection and final head/base checks remain in force. Observe this fallback on an open bot PR before activation; historical merged/deleted-head association lists can be empty.

## Production deployment interlock

Before bot work and immediately before merge-gate success, read the latest GitHub deployment in the exact `Production` environment and its latest status. Both records must come from Vercel bot ID `35613825`, and the deployment must match current main. Only `success` permits progress. Missing, foreign, stale, pending, failed, or unreadable evidence blocks the gate and cancels native merge intent. A newer failed deployment cannot fall back to an older success. Existing default-branch Vercel `status` and CI-completion events recheck gates; the ten-minute scan recovers missed events. A raw deployment-status event is not used: Vercel records this repository deployment ref as a commit SHA, which does not satisfy the main-only credential environment policy. [GitHub event ref rules](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#deployment_status) document this boundary.

Live read-only evidence on 2026-10-20 confirmed that Vercel sets `production_environment: false` and omits App metadata even for this repository's `Production` records. Therefore, the exact environment and bot identity identify production. Preview checks keep their existing App ID verification. The App now needs Deployments read permission; reapprove the installation permission before activation. GitHub documents the [deployment](https://docs.github.com/en/rest/deployments/deployments) and [status](https://docs.github.com/en/rest/deployments/statuses) APIs.

Recovery requires a successful trusted deployment for current main. Rollback and production repair remain manual. A rollback to an older SHA keeps automated merges blocked until current main and the verified production deployment agree. This is a deployment-status interlock, not a runtime availability monitor. GitHub event delivery and schedules can be delayed; strict current-base protection remains required to serialize successive merges.

## Current verification evidence

Local verification passed 237 Jest tests, build, post-build TypeScript checks, and actionlint. The secret-free Docker validator also exited successfully with scripts-disabled install, high-threshold audit, TypeScript, 237 tests on the final code snapshot, and build. Its named container is removed after failed or timed-out execution; a reproduced cleanup regression was fixed and included in the later local count.

The pinned Linux OpenCode runtime passed fake-SSE isolation checks: no real provider key or paid call, no external agent network, and no broker files/socket in the agent. The fake response's cost field is not billing evidence. Audit retains one existing moderate `sprintf-js` finding, with no high/critical findings. The independent review found four issues; all four were reproduced and fixed with regression tests. Hosted CI passed all five required checks on PR #289 (`b5811c0`), including 237 Jest and 63 Playwright tests; CodeQL, Dependency Review, and matching trusted Vercel deployment status also passed. Direct preview page access requires Vercel authentication; these results do not establish activation.

## Activation sequence

1. Complete local and hosted verification and merge the trusted implementation through the authorized review path while flags remain off.
2. Reverify both main-only/no-bypass environment policies, App installation, state issue, and required gate binding.
3. Resolve the Go key securely and verify billing controls/model access before storing only the correct key in each environment.
4. Confirm runtime checksum, enforced isolation/call/time limits, exact-run claims/artifacts, independent review proof, and full CI/Vercel validation.
5. Enable the exact `true` flags only under authorized activation conditions. Observe one complete bounded live flow; separately confirm any merge and production deployment.

Missing prerequisites keep flags off. Green local tests or artifact metadata alone do not establish activation.

## Disable and recovery

Unset both enable flags. On reconciliation, native auto-merge intent is cancelled and Dependabot gates are blocked; verify those effects. Already launched workers are not automatically cancelled. Inspect reservations, claims, run/job state, artifact IDs/digests, and publication intent before acting.

Never reset lifetime limits or rerun an ambiguous publication automatically. Head/base movement, expired tasks, incomplete review, invalid provenance, unclassified Vercel failures, and infrastructure failures need operator investigation. Keep branch protection and the gate intact until in-flight state is understood.

## 2026-10-20 local recovery validation

The local recovery change passed 282 Jest tests with coverage, the Next.js build, post-build TypeScript, and actionlint on the changed controller workflow. Full actionlint reports five existing SC2086 warnings in `ci.yml` at lines 43, 82, 131, 192, and 232. Those unrelated lines were not changed. No hosted run, paid call, credential write, activation, commit, push, or deployment was performed. Existing provider/isolation validation above is historical evidence, not a fresh live worker run.

Activation remains blocked on the dedicated installed App and private key, state issue variable, App-bound strict branch protection, main-only environment policies, verified Go key/billing controls, and both exact `true` flags. The 2026-10-20 audit found the controller variables and environment secret names absent. Recheck live configuration before activation; do not weaken checks to bypass missing setup.

### Bounded branch refresh and CI retry

A verified current-main controller run can refresh a behind branch or rerun interrupted (`cancelled`/`timed_out`) trusted CI. It first saves a durable reservation, then rechecks the PR head and base. Refresh and retry each have a separate limit of two lifetime attempts per PR and two attempts per UTC day. New heads or days do not reset lifetime counts, and these actions do not consume the existing two-repair lifetime budget or eight-review daily budget. An ambiguous write remains consumed. Repeated events for the same head cannot repeat the mutation. Missing state or exhausted limits leave an action-required gate and cancel queued auto-merge. The controller token needs Actions write only for the bounded workflow retry API; worker/validator tokens remain read-only.

Only the authenticated publisher token requests Workflows write. The repair scope permits verified upstream Action reference changes; this permission lets the publisher commit those reviewed files. The worker, validator, controller and claim jobs receive no Workflows write grant.

### Recovery provenance

Automatic merge and recovery require controller code from the current `main`
commit. A queued run from an older workflow revision leaves the merge gate
pending and cancels existing automatic merge intent.

CI retry reservations record the authenticated workflow run ID and run attempt.
A later interrupted attempt on the same PR commit can use the second retry, but
a duplicate event cannot repeat a write. The run and attempt are checked again
before dispatch. Old reservations without these fields remain consumed and block
repeat recovery for that head. The two-attempt lifetime and daily limits still
apply. GitHub's accepted, bodyless HTTP 201 rerun response is treated as success.

Interrupted CI is classified after authenticating the run, PR commit, repository,
workflow, and tested base, before requiring job/check completion. This permits
bounded recovery when cancellation occurs before jobs start. Successful CI still
requires every expected job and matching check before merge.

Workspace override updates accept quoted or plain version values, package/version selectors, parent-to-child selectors, and comments. The scope check preserves all other workspace sections, including patch paths and build permissions. Unsupported YAML forms and duplicate override keys fail closed.

The scope check compares PR file changes against the authenticated common ancestor of current main and the PR head. This permits bounded refresh when main changed unrelated protected settings. After refresh, the common ancestor must equal current main before merge can proceed. Missing or contradictory comparison evidence blocks the controller.

Each reconciliation reserves at most ten model tasks, matching the claim limit. Excess work waits for another run without consuming a reservation, including when reconciliation crosses UTC midnight. Daily and per-PR limits remain unchanged.

Repair snapshots authorize the PR delta against its authenticated merge base and retain current-main content for conflict repair. Dependency generation runs before the validation checks in a separate secret-free container. The host records the submitted files and generated dependency files before checks, rejects later byte changes, and publishes only those recorded bytes. Both phases share the existing 20-minute execution limit.

For a conflicted file already present in the authenticated PR snapshot, validation and publication may use current-main content as the comparison baseline when the head comparison fails. The same repository file policy must pass against that baseline. This permits preserving main-side settings while retaining dependency updates; it does not authorize new protected edits, unrelated context files, or relaxed action-pin checks.
The controller applies this same comparison after publication so a repaired head can reach bounded branch refresh and fresh current-base CI. Main-side fallback cannot remove an existing immutable action pin.
Unchanged generated dependency files are validated separately from the submitted file set. They do not reduce its 64-file capacity; changed output still obeys the existing 64-file and total-byte limits.

When repair output adopts main-side policy, it must retain every dependency target from the authenticated PR head that differs from main. Validation and publication both enforce this rule, including grouped updates. Copying main must not erase an update, remove its dependency, or partially revert a group. A mutable action tag may adopt main's immutable SHA only for the same version; an existing SHA target must remain exact. Ambiguous or conflicting targets fail closed for operator review. This restriction applies to repair output, not the ancestor-relative comparison used during reconciliation.

Immutable workflow pins must remain at the same line and action when adopting main-side content; moving a pin to another step does not preserve the original step's protection. Reconciliation permits authenticated main-side comparison for modified files even when the merge-base file is empty.

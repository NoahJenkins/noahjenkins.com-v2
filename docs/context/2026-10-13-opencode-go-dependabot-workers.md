# OpenCode Go Dependabot Workers
*Generated: 2026-10-13*

## Summary

The user approved OpenCode Go workers in GitHub Actions, keeping T3 stable. The implementation replaces the Copilot PAT and reviewer identity path while retaining the dedicated App gate, native auto-merge, exact-head/base validation, scope controls, and bounded ledger. Worker/contract implementation is complete; publication and workflow wiring are present. Final whole-branch and hosted verification remain pending. No credentials were changed or paid model calls made for this documentation update.

## Findings/Details

### Implemented trust boundaries

- Controller reserves work, then the App persists a once-only task claim before launch. Tasks remain charged after expiry or ambiguous outcomes. Original run attempt 1, exact main ref, immutable workflow source matching reserved base, 15-minute launch age, and reservation UTC date are enforced.
- The worker job prepares complete bounded base/head data without provider credentials. OpenCode `1.19.0` is downloaded and checked against the pinned Linux baseline SHA. Repair uses `opencode-go/kimi-k2.7-code`; review uses `opencode-go/glm-5.3` in a fresh read-only session.
- A separate trusted broker holds the real Go key and permits only the fixed Go endpoint/model. The isolated agent sees an ephemeral local token, no real provider/GitHub/App/Doppler key, and no external network beyond its broker. Denied tools/configuration and wrapper event/time limits accompany hard 24/16 upstream generation-call caps, including retries.
- A fresh validator job runs candidate code only inside a credential-free container. Fixed commands generate a lockfile with scripts disabled, install frozen dependencies with scripts disabled, and run audit, TypeScript, Jest, and build. Full hosted CI remains responsible for the resulting head, including Playwright.
- Publisher verifies App claim, original successful worker/validator jobs, immutable artifact digest and schema, full expected input/review coverage, current head/base, and protected scope. Publication intent is persisted before an ambiguous write. Repairs use atomic GraphQL `createCommitOnBranch(expectedHeadOid)`; reviews use App-owned `Dependabot Independent Review` bound to head/base/task/run/digests.
- Controller requires the latest authentic published review claim plus all prior CI/Vercel/scope gates. It queues native auto-merge while `Dependabot Merge Gate` is pending, then revalidates before App approval and gate success. Model output alone is never acceptance evidence.

### Limits and configuration

Global ledger limits remain two repairs/eight reviews per UTC day and two lifetime repairs per PR. No same-head retry or lifetime reset is allowed. A task stalled for 30 minutes needs manual action; a ledger over 60,000 bytes fails closed. Repair/review wall limits are 20/10 minutes, validation 20 minutes, and publication five minutes.

Artifacts contain at most 64 UTF-8 files, 2 MiB/file, 8 MiB total, with 240-byte relative paths. ZIP is transport only: exactly one bounded `result.json` is parsed in memory; arbitrary extraction or execution is rejected. Review requires every changed file, including dependency manifests/lockfile, both assessments passing, and no critical/high/medium finding. Low/info findings remain visible.

Current repository variables are `DEPENDABOT_CONTROLLER_APP_ID`, `DEPENDABOT_STATE_ISSUE_NUMBER`, `DEPENDABOT_VERCEL_APP_ID`, `DEPENDABOT_AUTOMATION_ENABLED`, and `DEPENDABOT_AGENT_ENABLED`. Flags require exact `true`; missing values leave the system inactive. App slug comes from trusted App-token output. Copilot/PAT user/reviewer settings are superseded.

The App private key belongs only in `dependabot-controller`; `OPENCODE_GO_API_KEY` belongs only in `dependabot-dispatch`. Main-only/no-bypass environment policies were previously verified and must be checked again before insertion. Ordinary CI and candidate validation receive neither key. App installation and required gate ownership remain unconfigured/unverified.

### Verification evidence

Local verification passed 228 Jest tests after a timeout-cleanup regression was reproduced and fixed, the production build, post-build TypeScript checks, and actionlint. The high-threshold audit exited successfully with zero high/critical findings and one existing moderate `sprintf-js` advisory (`GHSA-hp3w-g68c-fv3c`), without a patched version or new dependencies.

The actual pinned Linux OpenCode 1.19.0 container passed a fake-SSE provider smoke test: external networking was denied, broker files/socket were absent from the agent, and no real provider key or paid request was used. The fixture's model cost field is an estimate supplied by the fake response, not billing evidence. The separate secret-free Docker validator exited successfully after scripts-disabled install, the high-threshold audit (the same one moderate finding), TypeScript, 227 Jest tests at that snapshot, and build. The validator uses a named container and removes it after failed or timed-out execution; the later cleanup regression is included in the 228-test local result. Whole-branch/hosted verification and live activation are not established by these local checks.

### Activation gaps

Fresh names-only checks found no Go key in homelab configurations `prd`, `prd_admin`, or `prd_dns-pi` under ArkBuilderLabs. Local OpenCode credential metadata is not proof of validity or permission to use it in Actions. Resolve the source through secure input; transfer only the Go key, without exposing values or sending a broad Doppler token to a runner.

Provider **Use balance** off, explicit provider/Actions budgets, valid model access, final workflow security review, hosted checks, and an authorized observed end-to-end flow remain prerequisites. Green tests and local implementation do not establish activation. No secret insertion, paid probe, merge, deployment, or flag enablement is claimed here.

## Open Questions

- Where is the authorized Go key, and how will it be entered securely?
- Are Use balance and provider/Actions budget controls configured and verified?
- Are App installation, state issue, and App-bound required gate ready?
- Do final independent review, hosted checks, and an authorized live flow validate publication and review evidence?

**Related documents:** [ADR 0011](../adr/0011-use-opencode-go-for-dependabot-workers.md), [accepted design](../plans/2026-10-13-opencode-go-dependabot-design.md), [implementation plan](../plans/2026-10-13-opencode-go-dependabot-implementation.md), [setup guide](../dependabot-controller-setup.md), [CI/CD architecture](../architecture/ci-cd-pipeline.md), and [prior automation investigation](./2026-10-13-dependabot-automation-gap-investigation.md).

# Dependabot controller implementation

Approved design: automatic repair and native merge after independent review.

**Goal:** Reevaluate Dependabot PRs after all authors' refreshes. Review Actions majors. Dispatch Copilot repair at most twice per PR. Require current-head CI, Vercel and independent approval before native merge.

**Architecture:** A trusted default-branch workflow uses a dedicated GitHub App for the required `Dependabot Merge Gate`. A separate job has the user Copilot token and no App credential. A central App-authored comment on a configured state issue holds reservations. All writes recheck the PR head and base. Checks and source files are inspected through the API; privileged jobs never run PR code.

**Constraints:** Two repair reservations and eight review reservations per UTC day; two repair reservations total per PR; no retry of the same failed SHA. Uncertain dispatch consumes its reservation. Freeze validation commands, controller files, review instructions and existing tests. Accept registry dependency ranges, source repairs and SHA-pinned upstream Actions updates. Missing CI, approval-required CI, credentials, quotas and platform failures wait for operator action. Activation requires configured App, protected App gate, Copilot settings and billing budget. No administrator bypass.

**Interfaces:** `policy.cjs` consumes API snapshots and returns wait/block/repair/review/ready. `ledger.cjs` reserves a bounded action. `controller.cjs` reconciles GitHub state, publishes the gate and queues merge. `dispatch.cjs` independently verifies the reservation and uses the user token only for the requested Copilot action.

## Task 1: policy and scope
Write failing behavior tests for refreshed actors, current-head identity, Actions majors, frozen commands, independent review, trusted CI and Vercel. Implement the pure policy and scope guards. Expected: targeted tests pass.

## Task 2: durable reservations
Write failing tests for daily and lifetime limits, head deduplication, ambiguous dispatch and malformed ledgers. Implement validated ledger and reservations. Expected: counters cannot reset on head changes.

## Task 3: controller and dispatcher
Write failing integration tests with an in-memory GitHub boundary for gate ordering, changed-head races, token separation and exact reservation validation. Implement the API adapter and orchestration, replace the old actor-gated workflow. Expected: native queue precedes final gate success; no direct merge; credentials never enter PR code.

## Task 4: documentation and verification
Document investigation, ADR and secure setup. Run Jest coverage, build, type checks, audit, workflow validation and independent whole-branch review. Publish a reviewable PR, register it with T3 Code and verify hosted checks. External activation remains blocked until required credentials and settings are present. Preserve unmerged work and unrelated primary checkout changes.

## Review focus
Stale or forged review/status/check records; source changes that weaken validation; workflow multiline syntax; queue/head/base races; comment authors and malformed ledger state; quota enforcement across PRs/days; token or artifact injection; unavailable provider APIs; human PR gate availability.

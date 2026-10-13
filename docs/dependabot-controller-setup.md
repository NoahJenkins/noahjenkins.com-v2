# Dependabot Controller Setup

The approved design is recorded in [ADR 0010](./adr/0010-adopt-dependabot-controller-and-bounded-repair.md). Implementation and activation are separate. Keep the enable flags unset until credentials, App-bound branch protection, review behavior, and billing controls are verified.

## Repository configuration

Configure values through repository Actions settings or a secure local CLI input. Do not put secret values in source, command output, comments, or documentation.

| Name | Storage | Purpose |
| --- | --- | --- |
| `DEPENDABOT_CONTROLLER_APP_ID` | Actions variable | Numeric ID of the dedicated controller GitHub App |
| `DEPENDABOT_DISPATCH_USER_ID` | Actions variable | Numeric ID of the user who owns the dispatcher PAT |
| `DEPENDABOT_STATE_ISSUE_NUMBER` | Actions variable | Number of the repository issue holding the central App-authored ledger |
| `DEPENDABOT_CONTROLLER_PRIVATE_KEY` | `dependabot-controller` environment secret only | Controller App private key used to create an installation token |
| `COPILOT_AUTOMATION_TOKEN` | `dependabot-dispatch` environment secret only | User PAT used only by the Copilot dispatcher |
| `DEPENDABOT_AUTOMATION_ENABLED` | Actions variable | Controller activation flag; only the exact value `true` enables it |
| `DEPENDABOT_AGENT_ENABLED` | Actions variable | Dispatcher activation flag; only the exact value `true` enables it |
| `DEPENDABOT_REVIEWER_ID` | Actions variable | Numeric user ID of the trusted reviewer; default `175728472` is the Copilot review identity |
| `DEPENDABOT_VERCEL_APP_ID` | Actions variable | Trusted Vercel App ID; default and supported value `8329` |

Missing or invalid configuration must fail closed. Obtain IDs from authenticated metadata rather than inferring them from account names. The reviewer process must provide independent acceptance evidence. The configured Copilot ID is not proof that a qualifying formal review will be emitted; verify that behavior before activation.

## Main-only credential environments

Create two dedicated GitHub Actions environments: `dependabot-controller` for the App private key, and `dependabot-dispatch` for the PAT. Before storing either credential, configure each environment with **Selected branches and tags**, exactly one **Branch** rule named `main`, no tag or PR-ref rules, and administrator bypass disabled. Read both policies back and verify the exact rule type and name. Repository variables remain public configuration.

Store the App key only in `dependabot-controller` and the PAT only in `dependabot-dispatch`. Do not duplicate either value as a repository, organization, Dependabot, or Agents secret. Leave the existing `copilot`, `Preview`, and `Production` environments unchanged. Ordinary CI must not reference either credential environment.

The trusted controller and dispatcher jobs declare their respective environment. GitHub evaluates its deployment policy before a job receives environment secrets. The retained `pull_request_target` path uses the trusted base `main` ref and default-branch checkout; a manual dispatch from another ref must be denied by the environment policy. [Deployment policies and environment secrets](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)

The scope guard protects merge acceptance. It cannot prevent an unreviewed PR workflow from attempting secret access before merge. GitHub documents that automatic workflows on Copilot pushes can access Actions secrets, so credential isolation must precede unattended activation. [Copilot workflow approval settings](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/configuring-agent-settings)

Environment creation, policy verification, and credential storage are separate completion steps. Current progress and the remaining activation blocker are recorded below.

## Current configuration status — 2026-10-13

- `dependabot-controller` was created with environment ID `24225904096`.
- `dependabot-dispatch` was created with environment ID `24225905373`.
- Both use selected deployment branches/tags (`custom_branch_policies: true`, `protected_branches: false`), with exactly one Branch rule for `main` and no Tag rules.
- Both have zero environment secrets. Repository variables and repository secrets are also empty. Existing `copilot`, `Preview`, and `Production` environments are unchanged.
- Both were saved through the owner's Safari settings UI on October 13. API read-back confirmed `can_admins_bypass: false`, selected branch policies, exactly one Branch `main` rule, no Tag rules, and zero secrets in each environment. The no-bypass security setup is complete.

**Credential storage must still wait until the environment enforcement workflow follow-up is merged and the remaining App, Copilot, and billing prerequisites are verified.** Credentials and enable flags remain absent; dispatch remains inactive. Environment configuration alone does not establish activation.

PR #286 is merged at `f440`; its production deployment is READY, and home/RSS requests returned HTTP 200 with six RSS items. The environment enforcement follow-up is separate and is not recorded as merged or deployed. Its worktree remains active pending review and cleanup after merge; the old PR #286 worktree and local/remote task branches were removed.

## Dedicated controller App

Create and install a dedicated GitHub App for this repository. Grant repository permissions: Actions and Administration read; Checks, Issues, Pull requests, and Contents write; and the mandatory Metadata read. Administration read is needed to verify branch protection; Contents write supports branch refresh and native queueing. Install it only for the required repository. Do not give its private key or installation token to Copilot or PR code. The dispatcher PAT must not replace this App identity.

Add `Dependabot Merge Gate` to `main`'s required status checks and bind it to the numeric controller App ID. Require all five CI checks with `strict: true` (the branch must be up to date), at least one approving review, and stale-review dismissal. Verify the binding by reading branch protection back; a required check with any-source ownership does not provide this boundary. The controller uses no administrator bypass.

While the gate is pending, the controller queues native auto-merge with the expected PR head. It reports success only after current-head checks and independent approval pass final validation. Do not activate the controller before this gate is required: otherwise native auto-merge may complete before the controller's final decision.

Create a repository state issue and set `DEPENDABOT_STATE_ISSUE_NUMBER` to its number. The controller owns a JSON ledger comment on this issue; do not populate it with credentials or treat user-authored ledger text as trusted state.

## Copilot dispatcher and review

Use a repository-authorized user PAT with Pull requests write and Issues write for dispatch, stored only as `COPILOT_AUTOMATION_TOKEN` in the `dependabot-dispatch` environment. Copilot's public-preview task API supports user tokens; installation tokens are not supported for Copilot tasks. The existing-PR path uses an `@copilot` request authored by a user with write access so the agent can repair that branch. [API access](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-via-the-api), [existing PR requests](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-on-github)

Set `DEPENDABOT_DISPATCH_USER_ID` to the PAT owner's numeric user ID; the dispatcher verifies that identity before a provider write. Configure the independent reviewer identity and test that a formal review is emitted as `APPROVED` for the exact current head. Requesting Copilot review does not itself satisfy this gate. The review identity is Copilot `175728472`, separate from coding-agent identity `198982749`; a comments-only result, stale approval, coding-agent approval, or untrusted reviewer identity leaves the PR blocked.

In repository **Settings → Copilot → Code review → Auto-approval**, enable **Allow Copilot to approve pull requests**. Test that the resulting review is a formal `APPROVED` record on the current commit. The separate setting that counts Copilot approvals toward merge requirements is optional for this controller: its App records approval only after qualifying independent review and validation. If using file-path restrictions for that setting, GitHub supports at most 15 globs, and every changed file must match an allowed glob. [Configure Copilot code review](https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/configure-code-review)

Inspect agent workflow approval settings before enabling unattended CI. Agent changes require approval by default; the repository setting can change that behavior. Also account for `GITHUB_TOKEN` recursion and workflow approval rules when verifying that every repaired head receives fresh CI. Do not assume a comment or push started a trusted validation run. [Agent settings](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/configuring-agent-settings), [token security](https://docs.github.com/en/actions/concepts/security/github_token)

Confirm an eligible Copilot paid plan and configure an explicit provider cost cap and Actions budget before enabling dispatch. The approved two/eight daily limits count requests; they are not currency limits. No monetary budget is inferred from those quotas. [Cloud agent costs and availability](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent)

## Validation and protected scope

A Vercel App check alone does not establish deployment readiness. The controller requires an actual successful `Vercel` commit status from creator ID `35613825`, the expected project URL prefix `https://vercel.com/noahs-projects-e38437a2/noahjenkins-com/`, and an exact-head check from App ID `8329`. The Preview Comments check can bind the App identity but cannot substitute for successful deployment status.

Checks belong to commits, not individual PRs. A human PR sharing the SHA of an open Dependabot PR must not write the gate for that commit. Otherwise, human PRs receive a successful controller gate. Multiple open Dependabot PRs sharing one SHA are blocked for manual duplicate resolution. The controller does not apply Dependabot repair or merge policy to human PRs. Dependabot identity is numeric bot ID `49699333` and must target this repository's `main`.

Allowed repairs cover registry dependencies/overrides, supported runtime pins, application source, and newly added tests. Existing tests, controller scripts, instructions, and validation commands remain protected. In the privileged controller workflow, only full-SHA Action version pins may change, with the same upstream repository/subpath and a verified official version tag matching the SHA. Its Node version, inputs, permissions, and commands are frozen. The CI and Dependency Review workflows allow supported Node version and verified Action pin updates; other workflow semantics remain frozen.

A classified required-CI failure, merge conflict, or independent review requesting changes may request bounded repair. Unclassified Vercel failures, timeouts, skipped/cancelled validation, and infrastructure problems need operator investigation; they do not consume a code-repair attempt.

## Reservations and limits

The controller uses its own App-authored JSON ledger comment on the configured state issue to reserve an operation before dispatch. A comment written by another actor must not count as trusted ledger state. Load the ledger only when a Dependabot PR needs a credit reservation; a ledger error must not block an unrelated human gate.

- At most two repair dispatches per UTC day across the repository.
- At most eight independent review requests per UTC day across the repository.
- At most two repairs in total per PR, even after a new head is pushed.
- Deduplicate both repair and review dispatch for the same PR and head; no same-SHA retry.
- Count reservations with uncertain dispatch results against the limits.
- Dispatch a reservation only within 15 minutes; expired reservations remain charged and are not retried.
- Dispatch only on the reservation's UTC date. Crossing midnight does not add yesterday's queued requests to today's quota; the old reservation remains charged.
- Do not dispatch from a rerun. Persist a PAT-authored claim on the central state issue before the provider write; an existing claim prevents duplicate dispatch.
- Require manual intervention when a repair produces no head change within 30 minutes.
- Fail closed if the ledger exceeds 60,000 bytes; do not prune it automatically.

Per-PR errors keep the controller run failed, but a non-cancelled dispatcher can still verify and send valid reservations already saved for other PRs. It uses `always() && !cancelled()` and rechecks each task; controller failure is not permission to bypass verification.

Do not delete or manually reset the ledger to retry an exhausted PR. Inspect the blocked reason and remaining quota instead. Uncertain dispatch results require reconciliation; they must not cause an immediate duplicate request.

## Activation verification

1. Merge the tested implementation into the default branch while both enable flags are unset.
2. Create both dedicated environments, apply their exact Branch `main` selection and no-bypass policies, and verify both policies before storing credentials. Keep the flags unset.
3. Install the dedicated App, store its key only in `dependabot-controller`, configure its non-secret ID, and run the controller with flags off. Verify it publishes `Dependabot Merge Gate`: success for human PRs and blocked for Dependabot PRs. Missing App setup cannot publish this check.
4. Only after the gate exists, make it required and bind it to the controller App ID. Require strict up-to-date CI, at least one approval, and stale-review dismissal; read protection back to verify the settings.
5. Configure the state issue, PAT only in `dependabot-dispatch`, dispatcher user ID, reviewer ID, and Vercel identity without exposing values. Confirm the independent provider emits qualifying formal reviews and repaired heads receive full trusted CI and Vercel validation.
6. Confirm formal-review auto-approval, agent workflow approval behavior, the explicit provider cost cap, and the Actions budget.
7. Set the controller and dispatcher flags to the exact value `true`. Observe a current Dependabot PR and verify one reservation, one durable dispatch claim, bounded dispatch, exact-head review, trusted CI, Vercel status, pending gate during native queueing, and final gate outcome.
8. Confirm the resulting merge and production deployment separately. Successful preview checks do not prove production deployment.

Until these steps pass, report the system as implemented but inactive or blocked, as applicable. No activation is assumed in this guide.

## Disable and recover

Unset both enable flags. On reconciliation, the controller cancels existing native auto-merge intent and blocks the gate for Dependabot PRs. Confirm those outcomes rather than assuming that a variable change completed them. Inspect existing reservations and pending Copilot work separately; dispatched agent work is not automatically cancelled. Preserve the required gate and its ledger until in-flight state is understood.

For a blocked PR, inspect the latest head, review state, CI provenance, Vercel App ownership, quota state, and configuration. Keep the audit gate and independent review intact. A local retry does not justify resetting lifetime limits or bypassing branch protection.

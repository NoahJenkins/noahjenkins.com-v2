# Dependabot Controller Setup

The approved design is recorded in [ADR 0010](./adr/0010-adopt-dependabot-controller-and-bounded-repair.md). Implementation and activation are separate. Keep the enable flags unset until credentials, App-bound branch protection, review behavior, and billing controls are verified.

## Repository configuration

Configure values through repository Actions settings or a secure local CLI input. Do not put secret values in source, command output, comments, or documentation.

| Name | Storage | Purpose |
| --- | --- | --- |
| `DEPENDABOT_CONTROLLER_APP_ID` | Actions variable | Numeric ID of the dedicated controller GitHub App |
| `DEPENDABOT_DISPATCH_USER_ID` | Actions variable | Numeric ID of the user who owns the dispatcher PAT |
| `DEPENDABOT_STATE_ISSUE_NUMBER` | Actions variable | Number of the repository issue holding the central App-authored ledger |
| `DEPENDABOT_CONTROLLER_PRIVATE_KEY` | Actions secret | Controller App private key used to create an installation token |
| `COPILOT_AUTOMATION_TOKEN` | Actions secret | User PAT used only by the Copilot dispatcher |
| `DEPENDABOT_AUTOMATION_ENABLED` | Actions variable | Controller activation flag; only the exact value `true` enables it |
| `DEPENDABOT_AGENT_ENABLED` | Actions variable | Dispatcher activation flag; only the exact value `true` enables it |
| `DEPENDABOT_REVIEWER_ID` | Actions variable | Numeric user ID of the trusted reviewer; default `175728472` is the Copilot review identity |
| `DEPENDABOT_VERCEL_APP_ID` | Actions variable | Trusted Vercel App ID; default and supported value `8329` |

Missing or invalid configuration must fail closed. Obtain IDs from authenticated metadata rather than inferring them from account names. The reviewer process must provide independent acceptance evidence. The configured Copilot ID is not proof that a qualifying formal review will be emitted; verify that behavior before activation.

## Dedicated controller App

Create and install a dedicated GitHub App for this repository. Grant repository permissions: Actions and Administration read; Checks, Issues, Pull requests, and Contents write; and the mandatory Metadata read. Administration read is needed to verify branch protection; Contents write supports branch refresh and native queueing. Install it only for the required repository. Do not give its private key or installation token to Copilot or PR code. The dispatcher PAT must not replace this App identity.

Add `Dependabot Merge Gate` to `main`'s required status checks and bind it to the numeric controller App ID. Require all five CI checks with `strict: true` (the branch must be up to date), at least one approving review, and stale-review dismissal. Verify the binding by reading branch protection back; a required check with any-source ownership does not provide this boundary. The controller uses no administrator bypass.

While the gate is pending, the controller queues native auto-merge with the expected PR head. It reports success only after current-head checks and independent approval pass final validation. Do not activate the controller before this gate is required: otherwise native auto-merge may complete before the controller's final decision.

Create a repository state issue and set `DEPENDABOT_STATE_ISSUE_NUMBER` to its number. The controller owns a JSON ledger comment on this issue; do not populate it with credentials or treat user-authored ledger text as trusted state.

## Copilot dispatcher and review

Use a repository-authorized user PAT with Pull requests write and Issues write for dispatch, stored only as `COPILOT_AUTOMATION_TOKEN`. Copilot's public-preview task API supports user tokens; installation tokens are not supported for Copilot tasks. The existing-PR path uses an `@copilot` request authored by a user with write access so the agent can repair that branch. [API access](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-via-the-api), [existing PR requests](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-on-github)

Set `DEPENDABOT_DISPATCH_USER_ID` to the PAT owner's numeric user ID; the dispatcher verifies that identity before a provider write. Configure the independent reviewer identity and test that a formal review is emitted as `APPROVED` for the exact current head. Requesting Copilot review does not itself satisfy this gate. The review identity is Copilot `175728472`, separate from coding-agent identity `198982749`; a comments-only result, stale approval, coding-agent approval, or untrusted reviewer identity leaves the PR blocked.

Inspect agent workflow approval settings before enabling unattended CI. Agent changes require approval by default; the repository setting can change that behavior. Also account for `GITHUB_TOKEN` recursion and workflow approval rules when verifying that every repaired head receives fresh CI. Do not assume a comment or push started a trusted validation run. [Agent settings](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/configuring-agent-settings), [token security](https://docs.github.com/en/actions/concepts/security/github_token)

Confirm an eligible Copilot paid plan, an approved AI credit budget, and an Actions minute budget. Dispatch limits bound requests; they are not a monetary spending cap. [Cloud agent costs and availability](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent)

## Validation and protected scope

A Vercel App check alone does not establish deployment readiness. The controller requires an actual successful `Vercel` commit status from creator ID `35613825`, the expected project URL prefix `https://vercel.com/noahs-projects-e38437a2/noahjenkins-com/`, and an exact-head check from App ID `8329`. The Preview Comments check can bind the App identity but cannot substitute for successful deployment status.

Human PRs receive a successful controller gate; the controller does not apply Dependabot repair or merge policy to them. Dependabot identity is numeric bot ID `49699333` and must target this repository's `main`.

Allowed repairs cover registry dependencies/overrides, supported runtime pins, application source, and newly added tests. Existing tests, controller scripts, instructions, and validation commands remain protected. In the privileged controller workflow, only full-SHA Action version pins may change, with the same upstream repository/subpath and a verified official version tag matching the SHA. Its Node version, inputs, permissions, and commands are frozen. The CI and Dependency Review workflows allow supported Node version and verified Action pin updates; other workflow semantics remain frozen.

A classified required-CI failure, merge conflict, or independent review requesting changes may request bounded repair. Unclassified Vercel failures, timeouts, skipped/cancelled validation, and infrastructure problems need operator investigation; they do not consume a code-repair attempt.

## Reservations and limits

The controller uses its own App-authored JSON ledger comment on the configured state issue to reserve an operation before dispatch. A comment written by another actor must not count as trusted ledger state.

- At most two repair dispatches per UTC day across the repository.
- At most eight independent review requests per UTC day across the repository.
- At most two repairs in total per PR, even after a new head is pushed.
- Deduplicate both repair and review dispatch for the same PR and head; no same-SHA retry.
- Count reservations with uncertain dispatch results against the limits.
- Dispatch a reservation only within 15 minutes; expired reservations remain charged and are not retried.
- Do not dispatch from a rerun. Persist a PAT-authored claim on the central state issue before the provider write; an existing claim prevents duplicate dispatch.
- Require manual intervention when a repair produces no head change within 30 minutes.
- Fail closed if the ledger exceeds 60,000 bytes; do not prune it automatically.

Do not delete or manually reset the ledger to retry an exhausted PR. Inspect the blocked reason and remaining quota instead. Uncertain dispatch results require reconciliation; they must not cause an immediate duplicate request.

## Activation verification

1. Merge the tested implementation into the default branch while both enable flags are unset.
2. Install the dedicated App, configure its private key and non-secret ID, and run the controller with flags off. Verify it publishes `Dependabot Merge Gate`: success for human PRs and blocked for Dependabot PRs. Missing App setup cannot publish this check.
3. Only after the gate exists, make it required and bind it to the controller App ID. Require strict up-to-date CI, at least one approval, and stale-review dismissal; read protection back to verify the settings.
4. Configure the state issue, PAT, dispatcher user ID, reviewer ID, and Vercel identity without exposing values. Confirm the independent provider emits qualifying formal reviews and repaired heads receive full trusted CI and Vercel validation.
5. Confirm the approved workflow approval behavior and provider billing controls.
6. Set the controller and dispatcher flags to the exact value `true`. Observe a current Dependabot PR and verify one reservation, one durable dispatch claim, bounded dispatch, exact-head review, trusted CI, Vercel status, pending gate during native queueing, and final gate outcome.
7. Confirm the resulting merge and production deployment separately. Successful preview checks do not prove production deployment.

Until these steps pass, report the system as implemented but inactive or blocked, as applicable. No activation is assumed in this guide.

## Disable and recover

Unset both enable flags. On reconciliation, the controller cancels existing native auto-merge intent and blocks the gate for Dependabot PRs. Confirm those outcomes rather than assuming that a variable change completed them. Inspect existing reservations and pending Copilot work separately; dispatched agent work is not automatically cancelled. Preserve the required gate and its ledger until in-flight state is understood.

For a blocked PR, inspect the latest head, review state, CI provenance, Vercel App ownership, quota state, and configuration. Keep the audit gate and independent review intact. A local retry does not justify resetting lifetime limits or bypassing branch protection.

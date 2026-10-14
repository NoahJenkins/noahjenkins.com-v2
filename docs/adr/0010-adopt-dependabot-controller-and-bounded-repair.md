# ADR 0010: Adopt a Dependabot Controller and Bounded Repair

**Status:** accepted; external activation pending

**Date:** 2026-10-13

**Supersedes:** ADR 0008's approval, merge, and repair semantics. Its update grouping remains in effect.

## Context

The post-CI evaluator in ADR 0008 ignores passing CI triggered by a human, excludes Vercel from its own gate, and has no repair path. It also blocks standalone GitHub Actions majors and npm source repairs. These limits match that policy but do not meet the user's goal of independently reviewed, automatically repaired and merged Dependabot updates.

The user approved implementation of a separate merge controller and bounded Copilot dispatch. The approved limits are two repairs and eight review requests per UTC day across the repository, with at most two repairs in total for each PR. Required credentials and external settings are not yet configured.

## Options considered

1. Relax the existing actor check only. This recovers human-triggered CI but leaves review, deployment, repair, and reconciliation gaps.
2. Give a repair agent approval and merge credentials. This combines repair and acceptance authority and does not provide independent proof.
3. Use a trusted deterministic controller, independent review, and a bounded dispatcher with separate credentials. This closes the gaps while keeping repair separate from acceptance.

## Decision

Adopt option 3.

- Run controller code from the trusted default branch. Identify same-repository Dependabot PRs by author and current head; do not require the CI actor to remain Dependabot.
- Reconcile CI, Vercel, review, PR, and conflict state through supported events and a scheduled scan. Missing configuration or evidence must block acceptance.
- Require exact current-head CI evidence with trusted workflow provenance, successful Vercel checks from the configured Vercel App, and an actual `APPROVED` review on that head from the configured independent reviewer. A requested review, comment, summary, or older-head approval is insufficient.
- Use a dedicated GitHub App for the required `Dependabot Merge Gate` check, central durable JSON ledger comment on `DEPENDABOT_STATE_ISSUE_NUMBER`, reservations, and merge decisions. Bind the required check to that App's numeric ID in branch protection, require strict up-to-date CI, at least one approval, and stale-review dismissal. Publish the gate with flags off before making it required. Human PRs receive gate success only when their commit is not shared with an open Dependabot PR; multiple bot PRs sharing a commit require manual resolution.
- Queue GitHub native auto-merge with an `expectedHeadOid` while the required gate is pending; only after final revalidation may the controller submit approval and report gate success. A head change invalidates earlier proof. Do not use administrator bypass or directly force a merge.
- Keep the user PAT in a separate dispatcher. It can request `@copilot` branch repair and independent formal review; it does not supply the controller's acceptance authority. Agent execution must not receive the App private key or controller installation token.
- Store operation reservations in the App-authored ledger before dispatch. Count all reservations, including uncertain dispatches. Dispatch only within 15 minutes, never from a rerun, and persist a PAT-authored central-issue claim before provider writes. Deduplicate both operation types by head and never retry the same SHA; allow at most two repairs per UTC day and eight review requests per UTC day across the repository, and allow at most two lifetime repairs per PR. A new head does not reset that lifetime limit. No head change within 30 minutes requires manual intervention. Block further work if the ledger exceeds 60,000 bytes; do not prune it automatically.
- Include standalone GitHub Actions majors and allowed application-source repairs only after independent review and all exact-head gates pass. Protect existing tests, scripts, instructions, and validation semantics. In the privileged controller workflow, permit only verified Action pin updates for the same upstream/subpath; freeze its Node version, inputs, permissions, and commands. Keep blocked PRs open with a clear reason.
- Unclassified Vercel failures, timeouts, and infrastructure problems require operator action rather than speculative code repair.
- Load ledger state only for a bot credit reservation so ledger errors do not block unrelated human gates. Keep per-PR controller errors visible while independently verifying dispatch of valid saved reservations from other PRs.
- Disabled flags cancel native auto-merge intent on reconciliation and block Dependabot gates.
- Preserve existing security audit thresholds, dependency grouping, and runtime settings. Formal-review auto-approval, agent workflow approval settings, an explicit provider cost cap, and an Actions budget require external setup. Request quotas are not monetary limits.

## Consequences

- A human or agent can refresh a Dependabot branch without making it permanently ineligible.
- Vercel completion and independent review become explicit acceptance evidence. App ID `8329`, status creator ID `35613825`, and the expected project URL must match; Preview Comments alone does not prove readiness. Reviewer ID `175728472` is separate from coding-agent ID `198982749`.
- The App-bound required gate must be configured before activation; a check name alone is not sufficient.
- Durable reservations and daily/lifetime limits bound dispatch and prevent a retry from creating duplicate requests.
- Copilot's paid-plan requirements, AI credits, Actions minutes, user-token access, and approval settings are external prerequisites.
- Formal review support must be validated. If the provider does not submit a qualifying `APPROVED` review, the controller remains blocked.
- Repository code and passing tests do not establish live activation. Missing credentials or settings keep the controller disabled or blocked.

## Related documents

- [Automation gap investigation](../context/2026-10-13-dependabot-automation-gap-investigation.md)
- [Controller setup guide](../dependabot-controller-setup.md)
- [CI/CD pipeline](../architecture/ci-cd-pipeline.md)
- [ADR 0008](./0008-reduce-dependabot-volume-and-harden-post-ci-automation.md)

## Credential environment boundary correction — 2026-10-13

After PR #286 was merged at `f440`, a security follow-up identified that automatic CI on Copilot pushes can run unreviewed workflow changes with Actions secret access. The scope guard checks acceptance before merge; it cannot enforce secret isolation before those workflows run. [GitHub's Copilot workflow settings](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/configuring-agent-settings)

Complete the approved separation of controller and dispatcher authority with dedicated environment secrets: the App key only in `dependabot-controller`, and the PAT only in `dependabot-dispatch`. Both environments require selected deployment branches/tags with exactly one Branch rule, `main`, no tag or PR-ref rules, and no administrator bypass. Verify those policies before storing credentials. Do not duplicate the credentials in repository, organization, Dependabot, or Agents secrets. Keep existing `copilot`, `Preview`, and `Production` environments unchanged.

Trusted jobs declare these environments; ordinary CI stays outside them. GitHub enforces the deployment policy before releasing environment secrets. Default-branch checkout and the trusted `pull_request_target` base remain required, and manual dispatch from another ref must be denied. [GitHub deployment and environment rules](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)

At discovery, credentials and activation variables were absent, so the merged controller was inactive and no credential exposure was observed. This is an implementation boundary correction before activation. The verified environment setup is recorded below; credential configuration and activation remain incomplete.

### Environment setup status — 2026-10-13

The owner saved both dedicated environments through Safari settings on October 13. API read-back confirmed selected-branch policies, exactly one Branch `main` rule each, no tags, `can_admins_bypass: false`, and zero secrets. The environment security setup is complete. Credentials and activation flags remain absent, and dispatch is inactive. Credential storage must wait until the workflow follow-up is merged and the remaining App, Copilot, and billing prerequisites are verified; completed environment policies alone do not establish activation.

## Provider supersession — 2026-10-13

[ADR 0011](./0011-use-opencode-go-for-dependabot-workers.md) replaces the Copilot PAT, reviewer identity, and formal Copilot review requirements above with OpenCode Go workers and App-authenticated independent review checks. This text remains the historical decision. App-bound gate authority, exact-head/base validation, protected scope, quotas, and main-only credential environments continue. The dispatch environment now holds only `OPENCODE_GO_API_KEY`; no Copilot activation settings or PAT are required by the current implementation.

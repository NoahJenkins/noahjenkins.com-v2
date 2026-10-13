# Dependabot Automation Gap Investigation
*Generated: 2026-10-13*

## Summary

The current automation implements the accepted August policy, but it does not provide autonomous repair or merge every Dependabot update. Today's human-triggered refresh produced passing checks, then the evaluator ignored the runs because their actor was not Dependabot. Standalone GitHub Actions major updates also remain blocked by design.

This investigation used live GitHub records and source at `origin/main` (`639fca6`). The primary checkout is stale at `7c2b3f7` and has unrelated changes. No workflow, policy, repair service, credential, or merge setting was changed for this investigation. The user subsequently approved the design and implementation. External configuration and live activation remain pending.

## Findings/Details

### Why passing PRs did not receive auto-merge

- PRs [#281](https://github.com/NoahJenkins/noahjenkins.com-v2/pull/281), [#282](https://github.com/NoahJenkins/noahjenkins.com-v2/pull/282), [#283](https://github.com/NoahJenkins/noahjenkins.com-v2/pull/283), and [#284](https://github.com/NoahJenkins/noahjenkins.com-v2/pull/284) had successful checks at inspection, but `autoMergeRequest` was null and review status was `REVIEW_REQUIRED`.
- The evaluator requires both a Dependabot PR author and a Dependabot CI actor. Human or agent refreshes fail the actor gate before policy checks can enable auto-merge. [Policy, lines 65–72](https://github.com/NoahJenkins/noahjenkins.com-v2/blob/639fca6/.github/scripts/dependabot-auto-merge-policy.cjs#L65-L72)
- The workflow supplies `workflowRun.actor` to that gate. Today's actor was `NoahJenkins`; [evaluator run 38468805638](https://github.com/NoahJenkins/noahjenkins.com-v2/actions/runs/38468805638) succeeded while logging that the triggering actor was not Dependabot. A green evaluator run therefore does not prove approval or auto-merge was enabled. [Workflow input](https://github.com/NoahJenkins/noahjenkins.com-v2/blob/639fca6/.github/workflows/dependabot-auto-merge.yml#L122-L124)
- PR #282's initial [evaluator run 38426075072](https://github.com/NoahJenkins/noahjenkins.com-v2/actions/runs/38426075072) reported a Security Audit failure. The later human refresh cleared CI but did not satisfy the actor gate.
- Standalone GitHub Actions majors such as #283 and #284 require manual review under the current policy. PR #284's initial [evaluator run 38430281596](https://github.com/NoahJenkins/noahjenkins.com-v2/actions/runs/38430281596) failed the grouped patch/minor/security rule. [Policy, lines 103–110](https://github.com/NoahJenkins/noahjenkins.com-v2/blob/639fca6/.github/scripts/dependabot-auto-merge-policy.cjs#L103-L110)
- npm repairs that change application source, tests, or other files outside `package.json` and `pnpm-lock.yaml` also fail the existing file-scope gate. [Allowed files](https://github.com/NoahJenkins/noahjenkins.com-v2/blob/639fca6/.github/scripts/dependabot-auto-merge-policy.cjs#L46-L49), [scope enforcement](https://github.com/NoahJenkins/noahjenkins.com-v2/blob/639fca6/.github/scripts/dependabot-auto-merge-policy.cjs#L117-L124)

### Missing recovery path

- The write-capable evaluator runs only after the `CI` workflow completes. `pull_request_target` signals cancel stale evaluation; they do not run the evaluator job. There are no Vercel completion, status, review, or repair-retry triggers. [Workflow triggers and job gate](https://github.com/NoahJenkins/noahjenkins.com-v2/blob/639fca6/.github/workflows/dependabot-auto-merge.yml#L3-L36)
- Its required-check list includes Security Audit, Jest, Playwright, TypeScript, and Build Check, but excludes Vercel. [Required checks](https://github.com/NoahJenkins/noahjenkins.com-v2/blob/639fca6/.github/scripts/dependabot-auto-merge-policy.cjs#L3-L9)
- The committed workflow set contains CI, Dependency Review, and Dependabot Auto-Merge. It has no repair dispatcher, automatic repair agent, or retry controller. [Workflow directory](https://github.com/NoahJenkins/noahjenkins.com-v2/tree/639fca6/.github/workflows)
- A dynamic Copilot coding workflow is available, but only one historical manual run was found: [run 19931487915](https://github.com/NoahJenkins/noahjenkins.com-v2/actions/runs/19931487915), “Addressing comment on PR 77,” on December 4, 2025. No October 13 repair was invoked.
- Repository `allow_auto_merge` and Actions `can_approve_pull_request_reviews` are both true. Those settings are not the cause. The repository Actions secret-name list is empty; no repository repair credentials are configured there. No secret values were read or recorded.
- The restricted draft-repair workflow discussed for Metriks belongs to another repository. It is not installed here.

A read-only policy replay confirmed five cases: a green Dependabot-triggered run is ready; a green human-triggered run is ignored; an Actions major is blocked; an audit failure is blocked; and an npm source-path change is blocked.

The observed behavior matches [ADR 0008: Reduce Dependabot Volume and Harden Post-CI Automation](https://github.com/NoahJenkins/noahjenkins.com-v2/blob/639fca6/docs/adr/0008-reduce-dependabot-volume-and-harden-post-ci-automation.md), accepted August 24. The user's new goal—autonomous repair and merge of all Dependabot updates—requires a broader policy and a repair path.

### Accepted design and implementation boundary

Adopt the deterministic merge controller in [ADR 0010](../adr/0010-adopt-dependabot-controller-and-bounded-repair.md), separate from the repair agent. Identify eligible same-repository PRs by their Dependabot author and current head, and require test evidence for that exact head. Allow trusted human or agent triggers without requiring the original CI actor to remain Dependabot.

Observe CI, Vercel results, and conflicts through events plus a scheduled reconciler. Deduplicate work by PR and failed head. Use a central App-authored ledger comment on the configured state issue. Reserve before dispatch and count uncertain dispatches. Allow two repairs and eight review requests per UTC day across the repository, with at most two lifetime repairs per PR. Deduplicate both operation types by head; do not retry the same SHA. Reservations expire for dispatch after 15 minutes but remain charged. A dispatcher rerun cannot send work, and a PAT-authored claim on the central issue must precede a provider write. A new head must not reset the lifetime limit. No head change within 30 minutes requires manual intervention. A ledger over 60,000 bytes blocks further work; do not prune it automatically.

Run repair code without approval or merge permissions. Require independent validation and review of the resulting head. The dedicated controller App owns the required `Dependabot Merge Gate`, bound to that App ID. Queue GitHub native auto-merge with `expectedHeadOid` while the gate is pending; final acceptance requires an actual current-head `APPROVED` review from the trusted reviewer, exact trusted CI provenance, and Vercel checks from the configured App. Only after revalidation may controller approval and gate success be published. Do not use administrator bypass or suppress audit failures.

The approved policy includes GitHub Actions major updates and allowed application-source repairs only after independent formal review and exact-head validation. Protect scripts, instructions, existing tests, and validation commands. The privileged controller workflow allows only verified Action version pin updates for the same upstream/subpath; its Node version, inputs, permissions, and commands remain frozen. Unclassified deployment/infrastructure failures require operator action. Existing update grouping remains unchanged.

Copilot coding is the recommended provider candidate because the feature is already available. Its public-preview API supports unattended dispatch with a user token; installation tokens are not supported for Copilot tasks. [Use cloud agent via the API](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-via-the-api)

An `@copilot` request on an existing PR, authored by a user with write access, can push repairs to that PR branch. [Use cloud agent on GitHub](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-on-github)

Unattended operation needs explicit approval-setting design: Copilot workflows require approval by default, and repository settings can change that behavior. `GITHUB_TOKEN` event recursion and approval rules also affect whether repaired heads receive fresh CI. [Configure agent settings](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/configuring-agent-settings), [GITHUB_TOKEN security](https://docs.github.com/en/actions/concepts/security/github_token)

Copilot cloud agent requires an eligible paid plan and consumes AI credits and Actions minutes. This repository does not yet have the secure token configuration or confirmed approval settings and budget. Confirm those prerequisites before implementation; the platform capability itself is documented. [About cloud agent](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent)

### Completed cleanup

The user requested cleanup after the investigation. The cleanup audit confirmed merged or obsolete task state, checked worktree cleanliness, and found no active process using the removed worktree directories.

- Removed two clean worktrees: `/private/tmp/noahjenkins-vercel-node24-20261013` and `/private/tmp/noahjenkins-refresh-282-20261013`.
- Pruned missing registrations for `noahjenkins-dependabot-remediation` and `noahjenkins-node-24`.
- Deleted five local task branches: `codex/node-24`, `codex/vercel-node24-20261013`, `codex/refresh-dependabot-282-20261013`, `codex/dependabot-security-remediation`, and `dependabot/npm_and_yarn/typescript-7.0.2`.
- Verified PR #285's merged head and merge tree before deleting its task branch. The refresh branch's current PR #282 head remains on the remote. PR #265's merged head and merge ancestry were verified before deleting the TypeScript branch.
- Preserved unique unpublished historical commit `d962df6` in the verified Git bundle `/Users/noahjenkins/Documents/Codex/branch-backups/noahjenkins.com-20261013/dependabot-security-remediation-d962df6.bundle`. Its prerequisite `5c39bf9` remains in the repository.
- Pruned eight stale `origin` tracking refs whose branches were already absent on the server; the dry run matched the cleanup. No remote server branch was deleted. The server already contained only `main` and the four open Dependabot heads, which remain unchanged.

The final local state contains only the primary worktree and local `main` branch. Remote `main` remains at `639fca6`. The primary `AGENTS.md` and `tsconfig.json` file hashes and index identifiers match their pre-cleanup values. Investigation notes and other dirty changes remain uncommitted. The stale primary checkout was not reset or overwritten.

### Approval and activation status

The user approved implementation with the limits above. [The setup guide](../dependabot-controller-setup.md) records the remaining external prerequisites: dedicated App installation, state issue, user PAT and dispatcher user ID, trusted identities, App-bound required gate with strict up-to-date CI/stale-review dismissal/one approval, agent workflow approval behavior, and billing controls. Enable flags default to disabled. No live activation is established by this note.

## Open Questions

- Does the configured independent provider emit a formal `APPROVED` review for the exact head, rather than comments only?
- What verified Vercel App ID and state issue number will be configured?
- Have secure credentials, required gate ownership, workflow approval settings, and billing controls been configured and tested?

**Related context:** [Vercel Dependabot Preview Failures](./2026-10-13-vercel-dependabot-preview-failures.md).

**Related ADRs:** [ADR 0008](https://github.com/NoahJenkins/noahjenkins.com-v2/blob/639fca6/docs/adr/0008-reduce-dependabot-volume-and-harden-post-ci-automation.md) defines the current automation policy. [ADR 0009: Adopt Node.js 24](https://github.com/NoahJenkins/noahjenkins.com-v2/blob/639fca6/docs/adr/0009-adopt-nodejs-24.md) records the deployment runtime repair.

**Accepted decision:** [ADR 0010: Adopt a Dependabot Controller and Bounded Repair](../adr/0010-adopt-dependabot-controller-and-bounded-repair.md) supersedes ADR 0008's automation semantics.

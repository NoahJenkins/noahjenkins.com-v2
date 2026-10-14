# ADR 0011: Use OpenCode Go for Dependabot Workers

**Status:** accepted; implementation and external activation pending

**Date:** 2026-10-13

**Supersedes:** ADR 0010's Copilot PAT dispatch and formal Copilot review requirements. Its controller, merge, scope, quota, and credential-isolation boundaries remain in effect.

## Context

The controller at `e95f9cc` is inactive. The user selected OpenCode Go workers in GitHub Actions today and wants T3 to remain on stable, with webhooks considered later. Repair must not receive approval/merge credentials, and independent review evidence must not be reduced to model prose.

The existing main-only environments have no provider credentials. Fresh names-only checks found no Go key in homelab Doppler configurations `prd`, `prd_admin`, or `prd_dns-pi`; secure acquisition and provider/billing verification remain prerequisites. The selected model catalog has been verified without a paid request.

## Options considered

1. Keep the Copilot dispatcher and formal Copilot approval path. This preserves the prior provider dependency and does not implement the user's selected worker approach.
2. Run a Go agent with GitHub credentials and let it repair, review, and push. This combines untrusted candidate processing with publication authority.
3. Use reserved tasks, App claims, isolated Go workers, secret-free validation, and trusted publication of repairs and independent review checks.

## Decision

Adopt option 3. The user approved the written design; implementation plan review precedes code.

Pin OpenCode `1.19.0`, provider `opencode-go`, repair model `kimi-k2.7-code`, and review model `glm-5.3`. Disable provider **Use balance** before activation and enforce fixed worker time/step bounds. Keep T3 stable.

Use reserve → App claim → isolated worker → trusted publisher → reconciliation. Only original run attempt 1 can launch persisted, unclaimed, unexpired tasks. Preserve two repairs/eight reviews per UTC day, two lifetime repairs per PR, head deduplication, 15-minute dispatch expiry, and consumed reservations for uncertain results.

While the Go key is present, workers use a fresh home and trusted configuration, treat candidate files as data, and cannot execute shell, LSP, formatters, plugins, MCP, subagents, web fetch, or external-directory tools. They receive no GitHub/App/Doppler credentials. A separate fresh validation job generates the lockfile with scripts disabled and runs fixed checks in a container with curated data only, without credentials, host services, or a container socket.

Repair outputs are bounded JSON file data, not executable archives. The trusted publisher verifies original run/job/claim/digest provenance and head/base freshness, enforces protected scope and official Action pins, and commits allowed files with `createCommitOnBranch(expectedHeadOid)` and base64 file additions, so a concurrent head change cannot be overwritten.

Independent review uses a fresh read-only session and complete base/head changed-file coverage. The wrapper records trusted metadata and digests; the publisher verifies that evidence and writes an App-authored `Dependabot Independent Review` check. The controller accepts only the latest authentic current-head/current-base check tied to a durable claim, then retains CI, Vercel, scope, App approval, native queueing, and required gate revalidation.

Store the Go key only in the existing main-only `dependabot-dispatch` environment and App credentials only in trusted controller/publisher jobs using `dependabot-controller`. No broad Doppler token is sent to the runner. Credential storage, provider probes, activation, merge, and deployment remain separate verified boundaries.

## Consequences

- Agent code can suggest repairs or reviews without publication or merge authority.
- Repair and review sessions remain independent and bound to exact task inputs.
- Missing coverage, invalid evidence, stale commits, missing credentials, or exhausted quotas block acceptance.
- Artifact/run provenance and deterministic publisher checks remain necessary even when model output looks correct.
- Paid access, provider balance settings, enforceable step bounds, validator isolation, and strict review evidence must be verified before activation.
- Written design review precedes implementation; no activation or external credential change is established by this ADR.

## Related documents

- [OpenCode Go Dependabot design](../plans/2026-10-13-opencode-go-dependabot-design.md)
- [ADR 0010](./0010-adopt-dependabot-controller-and-bounded-repair.md)
- [Controller setup guide](../dependabot-controller-setup.md)

## Implemented broker boundary

The trusted broker holds the real Go key and calls only the fixed Go chat endpoint/model. The isolated OpenCode child receives only an ephemeral proxy token on an internal network. Retries consume the 24/16 generation-call budget before upstream writes; wall/event bounds remain independent. Candidate execution and validation never receive the provider key. Publication trusts the App claim and original successful run/job/digest chain, not model metadata or prose. External provider credentials, billing controls, App gate configuration, and live activation remain unverified.

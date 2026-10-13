# OpenCode Go Dependabot Design

**Date:** 2026-10-13

**Status:** accepted by the user; implementation plan review precedes code

**Base:** `e95f9cc`; the existing controller remains inactive.

## Outcome and boundaries

Use OpenCode Go in GitHub Actions for bounded repair and independent review. Keep T3 on its stable release; future T3 webhooks are outside this change. Replace Copilot PAT dispatch, Copilot identity checks, and formal Copilot review with authenticated task claims, isolated workers, and trusted publication of machine-verifiable review evidence.

Retain the dedicated App's `Dependabot Merge Gate`, native auto-merge, exact-head/current-base CI, trusted Vercel status, protected scope, and central App-authored ledger. Limits remain two repairs and eight review tasks per UTC day across the repository, and two lifetime repairs per PR. Unknown failures, missing credentials, quota exhaustion, and incomplete evidence require manual action.

## Task flow

1. **Reserve:** trusted default-branch controller reserves one repair or review against the PR ID, head SHA, base SHA, task kind, and nonce. Reservations count toward quotas even if dispatch is ambiguous. No new head resets lifetime limits; no same-head reservation is retried.
2. **Claim:** the controller App durably claims the task once before launching a worker. Only original run attempt 1 can dispatch. A task older than 15 minutes, outside its reservation's UTC date, or already claimed cannot launch.
3. **Work:** a matrix contains only valid persisted reservations. Each task uses a fresh isolated OpenCode session. Repair and review use separate sessions, inputs, and prompts.
4. **Validate:** a separate fresh GitHub Actions job performs fixed dependency/lockfile generation with lifecycle scripts disabled and fixed repository checks in a container. It receives no Go/App/Doppler credentials. The container receives only curated input/output data, with no host credentials, home directory, Git credentials, or container socket.
5. **Publish:** a trusted main-only job validates task, artifact, workflow/run provenance, head/base freshness, and protected scope. It executes none of the artifact. Repair publication uses GraphQL `createCommitOnBranch` with `expectedHeadOid` and `fileChanges.additions` carrying base64 UTF-8 file content; independent review publication uses an App-authored check.
6. **Reconcile:** the controller accepts authentic current-head review evidence only after verifying the durable claim, current base, and all other gates. It keeps the merge gate pending while queueing native auto-merge, then revalidates before App approval and gate success.

## Worker isolation and provider bounds

Pin OpenCode `1.19.0` and use provider `opencode-go`. Default repair model is `kimi-k2.7-code`; default review model is `glm-5.3`. The catalog was verified without a paid probe. Provider capability and a successful paid request remain activation checks. Disable Go's **Use balance** setting before activation so exhausted plan allowance cannot fall through to paid balance.

Use a fresh home directory, trusted main-branch configuration and prompts, and a curated data directory. Candidate files are data: omit PR `AGENTS.md`, OpenCode configuration, plugins, MCP configuration, and `.git`. While the provider key is present, deny shell execution, LSP, formatters, plugins, MCP, subagents, web fetch, and external-directory access. Permit only bounded reading and repair edits within the curated data directory; review is read-only. Agent execution receives no GitHub token, App key, installation token, or Doppler token.

Hard bounds: repair agent 20 minutes/24 steps; review agent 10 minutes/16 steps; secret-free validation 20 minutes; publisher 5 minutes. Use a trusted local Go API broker to enforce at most 24 repair or 16 review upstream generation requests, including retries. Native step instructions alone are not a hard limit. The broker holds the real Go key; OpenCode receives only its URL and an ephemeral token. Verify denial before upstream request 25/17 with a hostile fake provider; the wrapper also bounds events and timeouts. It must not rely on the model to stop. A missing enforceable step limit blocks activation.

## Repair artifact and publication

Use a JSON data artifact containing task metadata and changed UTF-8 files. Do not accept archives, executable modes, symlinks, commands, or arbitrary filesystem extraction. Artifact limits: 64 files, 2 MiB per file, 8 MiB total content, and 240-byte relative paths. Reject traversal, absolute paths, duplicate paths, invalid UTF-8, unsupported operations, and schema extras. Bind the artifact digest to the wrapper's task, original run, and session record.

The publisher verifies all of the following before a GitHub write:

- The original workflow is `.github/workflows/dependabot-auto-merge.yml`, its source SHA equals the reserved base SHA, its ref is `refs/heads/main`, run attempt is 1, and the specific worker job succeeded. All trusted checkouts use that source SHA. A run from an older workflow waits for a new default-branch signal before reserving work.
- The exact task has an authentic durable App claim; head, base, nonce, kind, digest, and worker identity match.
- PR head and current main remain unchanged. Re-read immediately before publication and use `expectedHeadOid` for the branch commit.
- File changes pass existing scope rules. Instructions, controller scripts, validation commands, and existing tests remain protected. Privileged workflow changes permit only an official upstream Action tag's matching SHA for the same repository/subpath; no permission, input, command, or Node change.

Generate the lockfile in the secret-free stage with fixed commands and disabled lifecycle scripts. Publish only the validated file set. A failed or ambiguous publication retains the consumed reservation; do not repeat the write automatically.

## Independent review evidence

Create a fresh read-only review session after any repaired head. Supply the complete expected changed-file set and both base/head contents, including manifests and lockfile. If input limits prevent full coverage, report incomplete evidence and block acceptance rather than silently dropping files.

Require strict JSON with `verdict` (`approve`, `request_changes`, or `blocked`), `findings` (severity `critical`, `high`, `medium`, `low`, or `info`, changed-file reference, and message), `coveredFiles` (the exact expected unique file names), and `assessment` (`security` and `compatibility`, each `pass`, `fail`, or `unknown`, plus a rationale). Only `approve` with complete coverage, both assessments `pass`, and no critical/high/medium finding can pass. Low/info findings remain visible. Unknown values, schema extras, conflicting findings, incomplete coverage, or incomplete assessment fail closed. The model does not select trusted metadata. The wrapper records head/base, task nonce, original workflow/run/attempt, session identity, pinned runtime/model, trusted configuration digest, and full input digest.

The publisher independently reconstructs expected coverage and verifies schema, digests, authentic claim, successful worker provenance, and fresh head/base. It writes the App-authored `Dependabot Independent Review` check for that exact head, bound to the base and task nonce. A model summary, artifact alone, or same-named check from another App is not acceptance proof.

The controller accepts only the latest authentic check with matching durable task claim and current head/base. Stale review, base movement, superseding findings, or missing proof keeps the merge gate pending. App formal approval is recorded only after independent evidence and exact-head CI/Vercel/scope checks pass; native auto-merge remains subject to branch protection.

## Credentials and activation

Store only the Go provider key in the existing `dependabot-dispatch` environment; keep App credentials in `dependabot-controller` for trusted controller/publisher jobs. Both retain exact Branch `main`, no tag/PR-ref rules, and no administrator bypass. Ordinary PR CI cannot receive either credential. Worker isolation must prevent candidate execution while the Go key exists.

Obtain the Go key from Doppler through secure input or a narrow local transfer. Do not send a broad Doppler token to a runner or print provider credentials. Fresh names-only checks found no Go key in the homelab `prd`, `prd_admin`, or `prd_dns-pi` configurations; the user's belief that it is in homelab remains unresolved. Do not create a new provider credential or assume an existing one is valid.

Before activation, verify the environment policies, App installation and required gate ownership, provider key/model access, **Use balance** off, explicit provider/Actions budgets, enforced worker limits, artifact provenance, and one fully observed repair/review flow. Existing request quotas are not currency limits. Missing evidence leaves flags off. This design does not authorize secret insertion, activation, merge, or deployment without the applicable verified conditions.

## Verification before activation

- Prove runtime time/step bounds, tool denial, and project-config/plugin isolation with fake-provider tests before using the real key.
- Verify the validator is a separate job, its container lacks credentials and host services, and its fixed commands cannot receive the Go key. Dependency retrieval is confined to normal registry/public build access; additional provider or model fallback is disabled.
- Test strict review acceptance and rejection, complete dependency-file coverage, authentic run/claim ownership, and head/base races.
- Resolve the Go key's secure source and verify provider balance/budget controls before any paid request.

**Decision record:** [ADR 0011](../adr/0011-use-opencode-go-for-dependabot-workers.md).

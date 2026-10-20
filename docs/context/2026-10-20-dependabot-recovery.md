# Dependabot recovery: local implementation

The user approved events plus scheduled recovery, existing merge gates, bounded repairs, independent review, failure reporting, and a production failure interlock with manual rollback. Work is isolated in `codex/dependabot-recovery-20261020` from `d33fbae`. The original checkout remains untouched.

Existing App/OpenCode controller code already provides the trusted worker/publisher boundary and two lifetime repair attempts. The main gaps were skipped setup diagnostics on automatic paths and no production deployment interlock. New failing tests demonstrated that a failed production result still released the merge gate before the fix.

Read-only GitHub queries found deployment `7211824214` on main `d33fbae841274a2adb7c21182414d57826b4826d`, environment `Production`, creator bot `35613825`, and status `20118562961` with `success`. Vercel set `production_environment` false and App metadata null. The implementation therefore checks the exact environment and known bot on both latest records, plus the current main SHA. It does not accept old success after a new failed deployment or status. The actual API adapter was checked against live production without write credentials.

Production failure or missing evidence blocks bot work and cancels merge intent. The controller reads production again before releasing its gate. Existing default-branch Vercel status/CI events reevaluate gates, and the ten-minute scan covers missed events. Vercel records the deployment ref as a commit SHA; a deployment_status job would not reliably satisfy the main-only credential environment policy, so no SHA-ref credential path was added. A manual rollback to an old commit does not release automation until production matches current main. Deployment status does not establish runtime health.

The setup diagnostic runs daily at 12:17 UTC, on manual runs, and on Dependabot open/reopen events. High-volume status events and ten-minute ticks do not allocate a separate warning runner. Missing environment keys fail with the setup path, without printing credentials. Exhausted repairs and stalled reservations appear in the existing gate and run summary; no extra issues/comments or quota resets occur.

Validation: 282 Jest tests with coverage, Next.js build, post-build TypeScript, controller workflow actionlint, and whitespace checks passed. Full actionlint reports existing SC2086 warnings in `ci.yml` at lines 43, 82, 131, 192, and 232. The host defaults to Node 26 and disables lockfile use; installation succeeded with Node 24 on PATH and explicit `--lockfile=true`, frozen lockfile, and scripts disabled. No dependency files changed.

No commit, push, PR, hosted run, paid request, credential write, activation, or deployment was performed. The App, variables, isolated keys, branch protection, and provider/billing setup still require the [activation contract](../dependabot-controller-setup.md). [ADR 0011](../adr/0011-use-opencode-go-for-dependabot-workers.md) retains model and budget choices. [Implementation plan](../plans/2026-10-20-dependabot-recovery.md).


## CI run association gap

A second read-only audit confirmed empty `pull_requests` arrays on real Dependabot CI runs `39492089511`, `39266196980`, and `38468101032`. The previous policy would wait indefinitely even with correct head/workflow/jobs. New tests first reproduced this failure, then verified the authenticated exact-head commit-to-PR fallback. Forged identities, stale bases, missing associations, wrong CI origin, and non-ancestor main remain rejected. The bot head `5a9126e` now has no associations after its PR was merged/deleted, so live open-PR fallback validation remains an activation check.

The fallback never overrides a nonempty contradictory run association. Numeric/node PR identity, head/ref/repos, current base/ref/repo, and open state must match; the already-required main ancestry check proves that the tested immutable head contains current main. Timestamps are not treated as a substitute for ancestry.

# Dependabot recovery implementation plan

Approved scope: retain the existing merge policy and OpenCode isolation/model/budget contract. Do not activate automation or modify external settings.

- [x] Add failing tests for a production deployment failure, stale production success, a changed production result during merge evaluation, and automatic setup diagnostics.
- [x] Read trusted GitHub Production deployment status; block and cancel bot merge intent until current main has a successful trusted deployment. Recheck immediately before gate success. Keep rollback manual.
- [x] Use existing status/CI events plus scheduled deployment recovery. Show setup gaps on scheduled/manual runs, and on relevant automatic events, without comments, issues, repeated dispatch, or provider calls.
- [x] Preserve two lifetime repairs, daily quotas, exact-head/base CI and independent review. Report exhausted or stalled tasks through the existing gate and workflow summary.
- [x] Run Jest coverage, TypeScript, build, and actionlint; update setup, architecture, ADR, context index, and TODO with verified results and activation gaps.

- [x] Verify empty CI run PR associations live; add failing regression tests and authenticated exact-head commit association recovery without weakening current-main ancestry or CI origin checks.

Completion boundary: tested local files only. No commit, push, pull request, merge, credential writes, or paid calls.

Validation: 282 Jest tests with coverage, build, TypeScript, and controller actionlint passed. Full actionlint has five pre-existing SC2086 warnings in ci.yml; see context. Hosted execution and activation remain pending.

# pr-repair

`.github/workflows/pr-repair.yml` calls the shared controller
[`NoahJenkins/.github/pr-repair`](https://github.com/NoahJenkins/.github/tree/main/pr-repair)
at a pinned commit. Repository policy is `.github/pr-repair.json` on `main`;
pull requests cannot change it for themselves.

## What it does here

- Scope: npm patch and minor updates (majors only with a security fix) and GitHub Actions updates.
- A failing eligible update gets a bounded repair (default 2 per update, 6
  model tasks a day). Candidate checks run in credential-free containers
  first. The controller App then publishes a replacement PR on
  `pr-repair/<number>`.
- The replacement needs the required checks and an independent review of its
  exact head. Then native auto-merge is queued with `expectedHeadOid`, and only
  while the latest Production deployment succeeded. The original closes after
  the replacement merges, if its head did not move.
- Originals: not merged by pr-repair; `dependabot-auto-merge.yml` keeps enabling auto-merge for patch, minor, Actions, and security updates.
- Human pull requests are never repaired, approved, resolved, or merged.

Every Dependabot PR shows one state on its `pr-repair` check and on the
`pr-repair status` issue. Possible states include `missing-configuration`,
`unsupported-scope`, `exhausted`, `conflict`, `production-paused`, and
`queued-merge`.

## Credentials

Plan and publish use the `noah-portfolio-dependabot` App (`DEPENDABOT_CONTROLLER_APP_ID`, private key in the `dependabot-controller` environment). Inference uses only `COPILOT_GITHUB_TOKEN` from the `dependabot-dispatch` environment. Prepare and validate use a read-only `GITHUB_TOKEN`. No secret reaches candidate code.

## Model

GitHub Copilot CLI 1.0.103 with `gpt-6-luna`, the choice this repository's controller already used. There is no fallback model or provider. A missing token pauses repair and reserves nothing.

## Activation

1. Merge this workflow and policy. Until step 2 it only reports status.
2. Set the repository variable `PR_REPAIR_ENABLED=true`.
3. The unused `DEPENDABOT_AUTOMATION_ENABLED`/`DEPENDABOT_AGENT_ENABLED` variables do not affect pr-repair; the old controller scripts are not wired to any workflow.

Rollback: delete `PR_REPAIR_ENABLED`.

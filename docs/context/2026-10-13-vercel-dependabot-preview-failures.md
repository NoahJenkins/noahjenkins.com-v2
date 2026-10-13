# Vercel Dependabot Preview Failures
*Generated: 2026-10-13*

## Summary

All three reported preview deployments failed because the repository requests Node.js `20.x`, which Vercel no longer accepts for new builds. The updates in the Dependabot PRs did not cause this failure. Each PR triggered a new deployment and exposed the existing runtime configuration problem.

The investigation used live GitHub and Vercel records. The original local checkout differs from live `main`; the implementation uses a separate worktree from current `origin/main` at `65cb146`. The user approved Node.js 24 alignment after the cause was confirmed, then approved remediation of the six high-severity audit findings. Validation and hosted deployment results are recorded below as they become available.

## Findings/Details

### Three matching deployment failures

| Dependabot PR | Update | Failed Vercel deployment |
| --- | --- | --- |
| [#282](https://github.com/NoahJenkins/noahjenkins.com-v2/pull/282) | `npm-routine`, nine package updates | [8k8xonx8rNMiq4mpJP1oPqsjywiA](https://vercel.com/noahs-projects-e38437a2/noahjenkins-com/8k8xonx8rNMiq4mpJP1oPqsjywiA) |
| [#283](https://github.com/NoahJenkins/noahjenkins.com-v2/pull/283) | `actions/setup-node` 7.1.0 | [EFo2xXNzdqP3cy5tSGHHEFC1EFBy](https://vercel.com/noahs-projects-e38437a2/noahjenkins-com/EFo2xXNzdqP3cy5tSGHHEFC1EFBy) |
| [#284](https://github.com/NoahJenkins/noahjenkins.com-v2/pull/284) | `actions/upload-artifact` 7.0.2 | [7RZm7nHD81UWNV6Li8wkbvr2pc4j](https://vercel.com/noahs-projects-e38437a2/noahjenkins-com/7RZm7nHD81UWNV6Li8wkbvr2pc4j) |

- All three deployments have state `ERROR` and code `BUILD_UTILS_NODE_VERSION_DISCONTINUED`.
- The error identifies `engines.node: 20.x` as discontinued and requests `24.x`.
- At investigation time, live `main` set `engines.node` to `20.x` in `package.json`. Both `.nvmrc` and `.node-version` pinned `20`, and all five CI jobs used `node-version: 20`.
- At investigation time, the Vercel project setting was `22.x`, but the `package.json` engine setting takes precedence. [Vercel Node.js version documentation](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- Vercel disabled new builds and functions with Node.js 20 on October 1, 2026. Existing deployments remain operational. [Vercel deprecation notice](https://vercel.com/changelog/node-js-20-is-being-deprecated)
- Earlier Dependabot PRs [#280](https://github.com/NoahJenkins/noahjenkins.com-v2/pull/280) (closed) and [#281](https://github.com/NoahJenkins/noahjenkins.com-v2/pull/281) (open) failed with the same code on October 5. This confirms that the failure preceded today's package updates.

### Production and CI status at investigation time

- The latest production deployment, [ByoKAe3AP86cNbD3TbwGDet2DWy5](https://vercel.com/noahs-projects-e38437a2/noahjenkins-com/ByoKAe3AP86cNbD3TbwGDet2DWy5), is `READY`. It was created on September 28 from commit `65cb146`.
- `https://www.noahjenkins.com` returned HTTP 200 on October 13. This confirms reachability; it does not validate every site feature.
- Build, Jest, Playwright, and TypeScript checks passed for today's three PRs.
- The separate `Security Audit` check failed. PR #284's audit reported 13 vulnerabilities: six high, six moderate, and one low. The report includes Next.js advisories with a patched version of `16.3.8`. The approved dependency remediation and current audit result are recorded below.

### Approved implementation and verification

The implementation aligns `package.json`, `.nvmrc`, `.node-version`, all five CI jobs, and the Vercel project to Node.js `24.x`. Dependency fixes address the separate high-severity audit findings. Preview creation, audit thresholds, and the Dependabot automation policy are unchanged.

Dependency changes:

- Set Next.js to `^16.3.8`, resolved as `16.3.8`, within the existing minor version.
- Update the existing `brace-expansion` override from `5.0.9` to `5.0.12` and `sharp` from `0.35.4` to `0.35.5`.
- Add a `source-map-js` override at `1.2.2`.
- Refresh transitive `expect` from `30.2.0` to `30.5.2` with `pnpm update expect --depth 10`. This replaces `jest-message-util@30.2.0` with `30.5.1`, which uses `picomatch`, and removes the vulnerable `micromatch`/`braces` chain from the lockfile.

Verification:

- Before and after dependency remediation, Node.js `24.21.0` passed frozen install with `--config.lockfile=true`, `pnpm build`, and `tsc --noEmit`. The final build used Next.js `16.3.8`. All 107 Jest tests in eight suites passed with 85.85% line coverage after the dependency changes.
- The initial full Playwright run had 44 passing and 19 failing tests. All failures occurred when Firefox launched with `Could not find profile folder`, before page load. A separate temporary-directory retry and a targeted test with a fresh isolated Firefox installation produced the same error. Those checks did not resolve the local launch problem. The final run for the other browsers is pending; full hosted Linux Playwright must validate Firefox after the draft PR is created.
- Vercel project setting: changed from `22.x` to `24.x` through an authenticated project update; a fresh project read confirmed `24.x`.
- After dependency remediation, `pnpm audit --audit-level=high` exits successfully on Node.js `24.21.0`, with zero high or critical findings. One moderate `sprintf-js` advisory remains without an upstream patch. No audit suppression or gate change was used. A hosted `Security Audit` result is still pending.
- Hosted preview: pending.
- Main integration and affected PR rebases: pending hosted checks and integration.

Skipping previews for GitHub Actions-only changes could reduce deployment notifications, but it would change deployment policy and would not repair the runtime problem. No preview suppression policy was adopted. The runtime change is recorded in ADR 0009 and the CI/CD architecture document.

**Related context:** [pnpm Workspace Root Memory Investigation](./2026-06-01-pnpm-workspace-root-memory-investigation.md) records the earlier local Node.js 20 alignment.

**Related ADRs:** [ADR 0009: Adopt Node.js 24](../adr/0009-adopt-nodejs-24.md) records the runtime decision. [ADR 0008: Reduce Dependabot Volume and Harden Post-CI Automation](../adr/0008-reduce-dependabot-volume-and-harden-post-ci-automation.md) remains the current automation policy.

**Related architecture:** [CI/CD Pipeline](../architecture/ci-cd-pipeline.md).

## Open Questions

- Do the final local browser run, hosted CI, and a hosted preview pass after dependency remediation?
- Does the full hosted Linux Playwright run pass Firefox tests?
- When will an upstream patch become available for the remaining moderate `sprintf-js` advisory?

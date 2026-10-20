# PR backlog and Dependabot alert investigation

Inspected all six open PRs on October 20, 2026. The Dependabot controller has no repository configuration variables, and both dedicated credential environments have no secrets. Every recent controller run, including scheduled runs, was skipped by its missing-App condition. CI success therefore did not produce an approval or native auto-merge request.

ADR 0010 superseded the earlier auto-close policy: blocked PRs intentionally stay open for independent review. Reintroducing unconditional close/merge behavior would bypass that policy. The controller now reports missing setup visibly in a secret-free hosted job. Activation still requires the dedicated App, state issue, protected environment credentials, required gate binding, budgets, and explicit enable flags described in the setup guide.

## Disposition prepared

- #281: Framer Motion 14.0.0 included; original branch was behind main and lacked review.
- #283: setup-node 7.1.0 included; official release tag verified against its pinned commit.
- #284: upload-artifact 7.0.2 included; official release tag verified against its pinned commit.
- #288: draft human PR, outside Dependabot policy, with a documentation conflict against the newer OpenCode implementation. Its opt-in Dell routing, architecture contract, and 24 policy tests are preserved. The conflict and obsolete Copilot references are reconciled. No runner activation is performed.
- #290: all 12 routine dependency updates included with its existing resolved versions.
- #291: superseded by #290's newer sanitize-html 2.18.1.

The changes are consolidated for one complete CI run. Superseded PRs can close against the replacement; production merge remains a separate authorized action.

## Security fixes

Alert #67, GHSA-374f-7chj-9948: sanitize-html 2.17.7 permits namespace-prefixed SVG animation URL injection under permissive tag configurations. Upgraded to 2.18.1. The existing About-page tag allowlist already excludes SVG/animation elements. A direct package reproduction retained javascript: before the upgrade and removed it afterward for bare and namespace-prefixed animation tags; an ordinary README link remained unchanged. Browser verification confirmed the real GitHub README and its images still render.

Alert #66, GHSA-hp3w-g68c-fv3c: sprintf-js has no patched version. The only dependency path was Jest coverage -> @istanbuljs/load-nyc-config -> js-yaml 3.15.2 -> argparse 1.0.10 -> sprintf-js. Updating the existing js-yaml override to 4.3.2 removes argparse v1 and sprintf-js entirely. The Istanbul consumer uses load(), which v4 supports. Tests now declare js-yaml explicitly as a development dependency and use load() instead of the removed safeLoad() API.

## Local verification

Using isolated Node 24.21.0 and pnpm 10.17.1:

- Frozen scripts-disabled install passed.
- pnpm audit --audit-level=low: no known vulnerabilities.
- All 262 Jest tests in 17 suites passed with coverage.
- TypeScript check and Next.js production build passed.
- actionlint 1.7.12 and git diff --check passed.
- Direct sanitizer payload/control checks passed; sprintf-js is absent from the lockfile.
- Local production About page rendered the live GitHub profile README, links, and images.

Hosted CI and final GitHub alert state must be checked on the published/merged revision. GitHub alerts remain open until the default branch contains the fixes; they must not be dismissed to simulate remediation. Dell execution and paid automation activation are not established by these checks.

# ADR 0009: Adopt Node.js 24

**Status:** accepted

**Date:** 2026-10-13

## Context

The repository pinned Node.js 20 in `package.json`, `.nvmrc`, `.node-version`, and all five CI jobs. Vercel stopped accepting new Node.js 20 builds and functions on October 1, 2026. Three Dependabot previews failed with `BUILD_UTILS_NODE_VERSION_DISCONTINUED`; earlier October 5 previews failed for the same reason. Existing production traffic remained available. [Vercel deprecation notice](https://vercel.com/changelog/node-js-20-is-being-deprecated)

The Vercel project used `22.x`, but `package.json` requested `20.x` and took precedence. A dashboard-only change cannot correct that manifest. [Vercel Node.js version documentation](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)

## Options considered

1. Keep Node.js 20 or change only the Vercel project setting. New builds remain blocked by the manifest.
2. Align all environments to Node.js 22. This removes the immediate unsupported version but does not follow the deployment error's recommended version.
3. Align all environments to Node.js 24. This uses the supported version requested by the deployment error and keeps local, CI, and hosted runtimes consistent.

## Decision

Adopt option 3 with the user's approval. Set `engines.node` to `24.x`, local version pins to `24`, all five CI jobs to Node.js 24, and the Vercel project to `24.x`.

Keep preview creation and the Dependabot policy in ADR 0008. The user also approved dependency remediation for the existing high-severity audit findings; this updates package constraints, overrides, and the lockfile without changing the audit gate. The dependency changes and verification evidence are recorded in the related context note. Verify the final change with local checks and a hosted preview before claiming deployment recovery.

## Consequences

- New deployments use a supported runtime once the corrected manifest reaches Vercel.
- Contributors must select Node.js 24 for this repository.
- A major runtime change requires tests and build validation; setting the version alone is not evidence of compatibility.
- Approved dependency remediation clears the high-severity audit gate locally; hosted checks must confirm the same result. One moderate advisory remains without an upstream patch.
- A rollback must use a Vercel-supported runtime; reverting new builds to Node.js 20 restores the original failure.

## Related documents

- [Vercel Dependabot Preview Failures](../context/2026-10-13-vercel-dependabot-preview-failures.md)
- [CI/CD Pipeline](../architecture/ci-cd-pipeline.md)
- [ADR 0008: Reduce Dependabot Volume and Harden Post-CI Automation](./0008-reduce-dependabot-volume-and-harden-post-ci-automation.md)

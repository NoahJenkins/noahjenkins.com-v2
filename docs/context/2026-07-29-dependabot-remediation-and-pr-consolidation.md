# Dependabot Remediation and PR Consolidation

## Summary

The required `Security Audit` gate blocked five approved Dependabot pull requests because the default branch resolved vulnerable versions of Next.js, Sharp, brace-expansion, and PostCSS. The remediation uses the repository's root pnpm overrides and a current Next.js patch release so the protected gate can remain enforced.

## Findings

- Eight open Dependabot alerts affected `next` below `16.2.11`; the remediation uses `^16.2.12`.
- `sharp` was transitive through Next.js and required `0.35.3`.
- `brace-expansion` was transitive through Jest's reporting dependency chain; CI identified the stricter `5.0.8` patched floor.
- The root PostCSS override pinned `8.5.16`, which kept the audit vulnerable even though the direct dependency range allowed newer versions.

## Outcome

The remediation branch updates the direct Next.js range and root overrides, then regenerates the lockfile with the repository-pinned Node 20 and pnpm 10.17.1 toolchain. Dependabot PRs #233 and #239 overlap the consolidated Next.js change and are closed as superseded. The remaining non-overlapping updates are rebased and merged only after protected checks pass.

## Open Questions

None. GitHub's default-branch Dependabot rescan remains the closure signal after merge.

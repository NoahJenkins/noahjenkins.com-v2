# Security Baseline Report
*Generated: 2026-02-21*

## Summary
The repository has a generally solid baseline with lockfile-based dependency management (`pnpm-lock.yaml`), Dependabot automation, and restricted CI workflow permissions. The primary risk found is a high-severity transitive vulnerability (`minimatch`, CVE-2026-26996 / GHSA-3ppc-4f35-3m26) surfaced by `pnpm audit` through Jest dependency paths. No hardcoded secrets were detected by a lightweight regex scan, but dedicated secret scanning in CI is still recommended.

## Critical Findings
- No critical-severity vulnerabilities detected.
- Two high-severity findings detected (same advisory through separate dependency paths):
  - `minimatch` ReDoS vulnerability (`<10.2.1`) via Jest transitive dependencies.

## Dependency Inventory
- Total direct dependencies: 32 (from `package.json` dependencies + devDependencies)
- Dependencies with known vulnerabilities (`pnpm audit`): 2 high
- Outdated direct dependencies reported by `pnpm outdated`: 5
- Lockfile present: Yes (`pnpm-lock.yaml`)
- Automated update config present: Yes (`.github/dependabot.yml`)

## Detailed Findings

### Known Vulnerabilities
1. **GHSA-3ppc-4f35-3m26 / CVE-2026-26996**
   - Severity: **High**
   - Affected component: `minimatch` (`<10.2.1`)
   - Impact: potential Regular Expression Denial of Service (ReDoS)
   - Observed paths:
     - `. > jest > @jest/core > @jest/reporters > glob > minimatch`
     - `. > jest > @jest/core > @jest/transform > babel-plugin-istanbul > test-exclude > minimatch`
   - Recommended remediation: upgrade dependency chain to resolve to `minimatch >=10.2.1`

### Configuration Issues
- CI pipeline currently has no dedicated security stage (e.g., dependency audit/SAST/secret scan jobs).
- CI dependency install step allows fallback from `--frozen-lockfile` to `--no-frozen-lockfile`; this improves resilience but weakens strict reproducibility enforcement.

### Secrets & Credentials
- Lightweight codebase pattern scan did not find obvious hardcoded API keys/tokens/password literals.
- `.gitignore` includes key secret patterns (`.env`, `.env.local`, `.env.*.local`, `*.pem`, `*.key`, `secrets.yml`).

## Recommendations
1. Prioritize a dependency update path that removes vulnerable `minimatch` transitive versions in the Jest toolchain.
2. Add automated `pnpm audit` (or equivalent) and secret scanning to CI so findings are continuously enforced.
3. Consider enforcing strict lockfile installs in CI for default path (`--frozen-lockfile` without fallback) once lockfile hygiene is stable.

## Open Questions
- Should CI treat high-severity audit findings as merge-blocking?
- Should a dedicated security scanning workflow be added (e.g., CodeQL, Trivy, or similar)?
- Is there a preferred policy for patching transitive dev-tool vulnerabilities with low runtime exposure?

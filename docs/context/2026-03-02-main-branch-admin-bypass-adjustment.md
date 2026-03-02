# Main Branch Admin Bypass Adjustment
*Generated: 2026-03-02*

## Summary
Adjusted branch protection enforcement to allow administrator bypass on `main` so maintainers can continue direct commit/push workflows from VS Code while preserving PR and CI requirements for non-admin users.

## Options/Findings
- Previous setting (`enforce_admins: true`) blocked direct admin push to `main` after policy tightening.
- Updated `scripts/branch-protection.json` to `enforce_admins: false`.
- Re-applied protection via `./scripts/setup-branch-protection.sh`.
- Verified live GitHub branch protection now shows `enforce_admins.enabled: false`.
- Required checks and review settings remain configured for standard PR flow.

## Verification
- Script output confirms:
  - required checks retained (`Security Audit`, `Jest Tests`, `Playwright Tests`, `TypeScript Check`, `Build Check`)
  - `required_approving_review_count: 1`
  - `enforce_admins.enabled: false`

## Open Questions
- Should admin bypass remain permanent, or be toggled only during urgent maintenance windows?
- Should admins still prefer feature-branch PRs for larger changes even though direct push is available?

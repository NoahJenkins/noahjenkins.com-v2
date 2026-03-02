# ADR 0004: Allow Administrator Bypass on Main

**Status:** accepted  
**Date:** 2026-03-02

## Context

Branch protection was configured to enforce PR + required-check rules for all users, including administrators. This blocked direct push from VS Code to `main`, which is part of the maintainer's current workflow for small, low-risk updates.

## Options considered

1. **Keep full enforcement for administrators**
   - Pros: strongest consistency and guardrails
   - Cons: blocks established maintainer workflow and increases friction for small operational changes

2. **Disable branch protection entirely**
   - Pros: maximum convenience
   - Cons: unacceptable risk; removes all merge safeguards

3. **Keep branch protection but allow administrator bypass**
   - Pros: preserves PR/check protections for standard contributors while restoring maintainer direct-push capability
   - Cons: creates a privileged bypass path that depends on disciplined admin behavior

## Decision

Adopt **Option 3**.

Set `enforce_admins` to `false` in branch protection config for `main`. Maintain all existing required status checks and PR review requirements for non-admin workflows.

## Consequences

- Maintainers with admin permissions can commit/push directly from VS Code when needed.
- Non-admin contributors continue to use PR-based flow with required checks/review.
- Repository safety still depends on administrators using bypass responsibly.
- Policy should be revisited as team size and compliance requirements evolve.

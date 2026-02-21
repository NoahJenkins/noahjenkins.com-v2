# ADR 0002: Consolidate UI Components

**Status:** accepted
**Date:** 2026-02-21

## Context

The repository exhibited component fragmentation. Global and shared UI components were located in both the root `components/` directory and `app/components/`. Furthermore, there were empty "ghost directories" (`animations`, `ui`, `layout`) inside `app/components/`. Imports for these components across application routes were using brittle relative paths (e.g., `../../components/ui/button`), which complicated refactoring and file movement.

## Options considered

1. **Keep existing structure:** Leave global app components in `app/components/` and generic UI components in `components/`. (Pros: No immediate changes required. Cons: Ambiguous boundaries, fragile imports, maintenance overhead).
2. **Consolidate all components into `app/components/`:** (Pros: Localizes to Next.js App Router. Cons: Violates established convention in many Next.js generic scaffolds that place shared components outside the `app/` routing tree).
3. **Consolidate all global components into root `components/` and strictly use `@/components/` alias:** (Pros: Clear directory boundaries, robust import paths tolerant to file moves, industry standard convention).

## Decision

We chose **Option 3**. All shared components were moved from `app/components/` to the root `components/` directory. The `app/components/` directory was deleted. Additionally, all imports targeting these components across the `app/` directory were refactored to use the absolute alias `@/components/` instead of relative paths. Local route-specific components (e.g., `app/voices/components/`) were left intact and continue to use relative imports strictly for their parent route.

## Consequences

- Improved predictability for developers looking for shared UI components.
- Reduced import path fragility.
- Requires team members to build the habit of using the `@/components/` alias for shared components rather than relying on IDE auto-imports that might default to relative paths.

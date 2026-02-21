# Component Consolidation & Path Alias Standardization

Date: 2026-02-21

## Summary

The Next.js application structure was simplified by addressing component fragmentation. UI components were previously split between `components/` and `app/components/`. We consolidated these into the root `components/` directory and deprecated the `app/components/` folder along with unused ghost directories (`animations`, `ui`, `layout`, `blog`).

## Options/Findings

- **Component Fragmentation**: `app/components/` and `components/` created ambiguity on where to place or import shared components.
- **Pathing**: Imports across the appliction were using fragile relative paths (`../../components`).
- **Action Taken**:
  - Moved `footer.tsx`, `mdx.tsx`, `nav.tsx`, and `posts.tsx` from `app/components/` to `components/`.
  - Deleted `app/components/` and `blog/` root folder.
  - Standardized component imports across all routes to use the `@/components/` Next.js alias.
  - Removed `pnpm` override for `minimatch` in `package.json` that was breaking the Jest test suite `test-exclude` dependency.

## Open Questions

- Ensure no team members have open PRs attempting to add to the now-deleted `app/components/` directory.

## Result

- Resolved the fragmentation. Unified global UI components into `components/`.
- Restored `jest` test stability.
- Created ADR to document the path alias standard: [ADR 0002: Consolidate UI Components](../adr/0002-consolidate-ui-components.md).

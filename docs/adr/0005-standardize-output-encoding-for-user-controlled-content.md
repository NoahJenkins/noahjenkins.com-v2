# ADR 0005: Standardize Output Encoding for User-Controlled Content

**Status:** accepted  
**Date:** 2026-03-02

## Context

GitHub security alerts reported stored XSS risks in multiple rendering contexts (HTML link path composition, JSON-LD script embedding, and RSS XML generation). Existing sanitization was ad hoc and inconsistent across output formats.

## Options considered

1. **Patch each alert location independently**
   - Pros: minimal local change
   - Cons: inconsistent patterns, repeated logic, higher regression risk

2. **Adopt shared encoding utilities by output context**
   - Pros: consistent security boundary handling, easier review, reusable across app surfaces
   - Cons: requires introducing and adopting new helper module

3. **Rely only on upstream framework escaping**
   - Pros: least custom code
   - Cons: insufficient for non-HTML sinks (JSON-LD script text and XML feed strings)

## Decision

Adopt **Option 2**.

Create `lib/security.ts` with context-specific encoders and apply them at output sinks:
- `encodePathSegment` for URL path segments
- `escapeXml` for RSS/XML content
- `toSafeJsonLd` for JSON-LD script serialization

Use these helpers where post metadata/slugs are interpolated into rendered outputs.

## Consequences

- Reduces XSS risk across mixed output contexts.
- Improves consistency and maintainability of secure output handling.
- Adds a small utility surface that must be kept in sync with future rendering paths.
- Encourages sink-focused encoding rather than one-off sanitizer implementations.

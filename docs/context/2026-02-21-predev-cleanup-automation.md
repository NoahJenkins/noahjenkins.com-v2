# Predev Cleanup Automation for PNPM Dev Scripts
*Generated: 2026-02-21*

## Summary
Added startup cleanup automation so both `pnpm dev` and `pnpm run dev` consistently clear stale Next.js dev locks/processes before starting.

## Options/Findings
- Added `predev` script to kill existing `next dev` processes and remove `.next/dev/lock`.
- Added `dev:clean` convenience script that explicitly runs cleanup then starts dev.
- Because package script lifecycle hooks run before `dev`, this applies to both `pnpm dev` and `pnpm run dev`.

## Verification
- `pnpm run dev` output shows `predev` runs first, then `next dev` starts successfully.
- No lock acquisition errors were observed during verification startup.

## Open Questions
- Should we make cleanup behavior configurable (e.g., skip process kill for multi-instance workflows)?

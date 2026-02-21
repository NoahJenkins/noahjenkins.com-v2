# 2026-02-21 Sync: Copilot agent sync to Claude

Summary

- Performed automated sync of repository Copilot artifacts into detected agent targets using `/sync-agents` process.
- Detected agent: Claude Code (`.claude/` directory present).
- Actions: wrote `CLAUDE.md` at repo root, created `.claude/agents/*` agent profiles (model fields normalized to `sonnet`), and copied `.github/skills/*/SKILL.md` into `.claude/skills/`.

Findings

- Source of truth: `.github/copilot-instructions.md` was present and copied verbatim to `CLAUDE.md`.
- Path-scoped instructions: none detected (`.github/instructions/` absent).
- Custom agent profiles in `.github/agents/` were synced into `.claude/agents/` with model normalization:
  - Non-Claude model values were rewritten to `sonnet` and provenance preserved via a YAML comment.
- Skills from `.github/skills/` were copied to `.claude/skills/` verbatim.

Files written

- `CLAUDE.md` — full copy of `.github/copilot-instructions.md` with sync header
- `.claude/agents/*.md` — synced agent profiles with normalized `model: sonnet`
- `.claude/skills/*/SKILL.md` — verbatim copies of each skill's `SKILL.md`

Consequences

- Claude Code users in this repository will now see a synchronized set of instructions, agent profiles, and skills.
- Model normalization to `sonnet` applied where source models were non-Claude; review individual agent files if a different mapping is preferred.

Next steps

- If you want other agent ecosystems synced (Gemini, Codex/OpenCode, Cursor, etc.), initialize their detection signals (for example, add `GEMINI.md` or `.agents/`) and re-run `/sync-agents`.
- Review `.claude/agents/*` files to confirm normalized `model` values are acceptable.

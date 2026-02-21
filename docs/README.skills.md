# Agent Skills

This document lists all GitHub Copilot agent skills installed in this repository under `.github/skills/`.

Skills are reusable capability modules that extend what Copilot coding agents can do. They follow the open `SKILL.md` standard and are compatible with GitHub Copilot, Claude Code, and OpenAI Codex.

---

## Installed Skills

| Skill | Directory | Description |
| ----- | --------- | ----------- |
| `sync-agents` | `.github/skills/sync-agents/` | Synchronize GitHub Copilot instructions, custom agents, and skills into detected AI coding agent configurations in this repository (Claude Code, Cursor, Windsurf, etc.). |
| `format-blog-post` | `.github/skills/format-blog-post/` | Take raw pasted blog post text and format it as a correctly structured MDX file, then write it to `app/blog/posts/` so it is published on the next push. |

---

## How to Invoke a Skill

Skills are invoked from GitHub Copilot chat (or any compatible agent) by referencing the skill name:

```
Use the format-blog-post skill. Here is the blog post text: [paste text here]
```

```
Use the sync-agents skill to mirror Copilot customizations to all detected agent configs.
```

---

## Adding a New Skill

1. Create a directory under `.github/skills/<skill-name>/`.
2. Add a `SKILL.md` file with valid YAML frontmatter (`name`, `description`).
3. Ensure `name` in the frontmatter matches the directory name exactly.
4. Add the skill to the table above and to the **Custom Skills** section of [`README.md`](../README.md).

See `.github/skills/sync-agents/SKILL.md` for a full reference example.

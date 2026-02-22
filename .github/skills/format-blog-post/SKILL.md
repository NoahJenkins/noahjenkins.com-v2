---
name: format-blog-post
description: "Take raw pasted blog post text and format it as a correctly structured MDX file, then write it to app/blog/posts/ in this repository so it is published on the next push."
---

# Format Blog Post

Take raw, unformatted blog post text pasted by the user and produce a properly structured `.mdx` file placed at `app/blog/posts/<slug>.mdx`, ready to be committed and published.

<context>

## Repository conventions

Posts live in `app/blog/posts/` as `.mdx` files.

**Required frontmatter fields:**

| Field         | Type   | Notes                                                       |
| ------------- | ------ | ----------------------------------------------------------- |
| `title`       | string | Double-quoted. Preserve the author's original title casing. |
| `publishedAt` | string | `YYYY-MM-DD` format. Default to today's date if not stated. |

**Optional frontmatter fields:**

| Field     | Type            | Notes                                                                                                         |
| --------- | --------------- | ------------------------------------------------------------------------------------------------------------- |
| `summary` | string          | Single-sentence description. Derive from the post if absent.                                                  |
| `image`   | string          | Absolute path under `/assets/images/`. Omit if not provided.                                                  |
| `tags`    | string (inline) | Comma-separated values on a single line, e.g. `personal, career`. Omit if no tags can be reasonably inferred. |

**File naming (slug) rules:**

- **CRITICAL**: Prepend the `publishedAt` date to the filename explicitly: `YYYY-MM-DD-slug`. This ensures posts are organized chronologically in the file system.
- Derive the slug from the post title.
- Lowercase, words separated by hyphens.
- Remove punctuation (colons, apostrophes, commas, quotes).
- Limit to 60 characters.
- Examples:
  - "2025 Year in Review: Mountains and Valleys" (Published: 2025-12-31) → `2025-12-31-2025-year-in-review-mountains-and-valleys`
  - "Mid-Year Learning Update 2025" (Published: 2025-06-01) → `2025-06-01-mid-year-update-2025`

**Markdown/MDX body conventions observed in existing posts:**

- Section headings use `##` (h2). Use `###` only for subsections.
- Emphasis: `**bold**` for key phrases.
- Unordered lists: `- item` with a blank line before and after.
- Blockquotes: `> text` for pull quotes.
- No JSX/component imports unless the user's source text explicitly uses them.
- Preserve paragraph breaks from the source text exactly — do not collapse multi-paragraph sections into one.
- Do not add prose that was not in the original text. Only reformat.

**Illustrative post frontmatter examples (do not copy verbatim — derive from the actual input):**

```mdx
---
title: "2025 Year in Review: Mountains and Valleys"
publishedAt: 2025-12-31
summary: "A personal and professional recap of 2025: promotions, certifications, learning, and family."
image: /assets/images/2025-review-blog-hero-image.png
tags: personal, career
---
```

```mdx
---
title: "2024 In Review, Looking Back"
publishedAt: 2025-01-01
---
```

</context>

## Your Task

1. **Read the pasted text.**
   - The user will paste the raw blog post content directly in the chat or attach it as context.
   - If no text is provided, ask: "Please paste the blog post text you want to format."

2. **Extract or infer frontmatter values.**
   - `title`: Use any explicit title line (H1, bold heading, or first line). If ambiguous, ask the user.
   - `publishedAt`: Use any date mentioned as the post date. If none, use today's date in `YYYY-MM-DD` format.
   - `summary`: Use an explicit summary or TL;DR sentence from the post, or derive a one-sentence description. Omit if nothing suitable exists.
   - `image`: Include only if the user supplies an image path. Otherwise omit.
   - `tags`: Infer 1–4 lowercase tags from the post subject matter (e.g. `personal`, `career`, `tech`, `certifications`, `faith`, `learning`). Omit if the post is too general.

3. **Generate the slug.**
   - Apply the slug rules from the conventions section above.
   - The output filename will be `<slug>.mdx`.

4. **Format the body.**
   - Reformat the raw text using the Markdown conventions above.
   - Remove any title-only H1 line if it duplicates the frontmatter `title` (the site renders the title from frontmatter, not the body).
   - Preserve the author's voice and wording exactly — only apply structural MDX formatting.
   - Headings that are standalone lines in the source become `##` headings.
   - Bullet lists, numbered lists, and blockquotes should be preserved if already present; detect and convert any plain-text list patterns (lines starting with `-`, `*`, or a number followed by `.`) into proper Markdown lists.

5. **Write the file.**
   - Create the file at `app/blog/posts/<slug>.mdx` in the repository.
   - Do not overwrite an existing file with the same slug without first confirming with the user.

6. **Confirm completion.**
   - Report the created file path and the resolved frontmatter values.
   - Remind the user: "Commit and push this file to publish the post."

## Output Format

A single `.mdx` file written to `app/blog/posts/<slug>.mdx` with the structure:

```
---
title: "<Title>"
publishedAt: YYYY-MM-DD
summary: "<Optional one-sentence summary>"
tags: <optional, comma-separated>
---

<Formatted MDX body>
```

All frontmatter values are on their own lines. No trailing spaces. A single blank line separates the closing `---` from the body.

## Constraints

- Never invent content. Only the frontmatter `summary` and `tags` may be lightly derived; everything else must come from the source text.
- Never overwrite an existing file without explicit user confirmation.
- If the source text contains no recognizable title, do not guess — ask the user before proceeding.
- Do not add JSX imports or React components unless they were present in the source text.
- Do not add a license, copyright, or attribution block unless requested.
- If the post date is ambiguous (e.g. "last Tuesday"), default to today's date and note the assumption in your confirmation message.
- Keep the slug under 60 characters and free of special characters other than hyphens.

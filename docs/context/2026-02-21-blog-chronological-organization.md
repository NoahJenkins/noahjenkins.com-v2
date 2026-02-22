# 2026-02-21 Blog Chronological Organization

## Summary

Organized the blog posts to render chronologically (newest first) and updated the content ingestion skill to enforce a date-prefix naming convention for all future posts.

## Problem

The blog posts were rendered in an arbitrary order (depending on file system reading), making it difficult for readers to find the latest content. Additionally, the `format-blog-post` skill created files using only the title slug, which didn't provide any natural ordering in the file system.

## Changes

### 1. Blog Utility Update

Modified `app/blog/utils.ts` to sort the posts by `publishedAt` metadata.

- **Old Logic:** Returned posts in the order provided by `fs.readdirSync`.
- **New Logic:** Uses `Array.prototype.sort()` with `new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime()` to ensure a stable, descending chronological sort.

### 2. Format Blog Post Skill Update

Updated `.github/skills/format-blog-post/SKILL.md` to change the file naming conventions.

- **Rule:** All new posts now prepend the ISO date (`YYYY-MM-DD-`) to the filename slug.
- **Reasoning:** This allows the `app/blog/posts/` directory to be sorted chronologically by name in the file system/IDE while keeping the logic decoupled from the actual rendering sort (which still uses metadata).

### 3. Retroactive File System Re-organization

After validating the new chronological approach, a node script was run across all existing `app/blog/posts/*.mdx` files to prepend their respective `publishedAt` frontmatter dates to their filenames. This formally aligns the historical post files with the new convention natively in the code repository.

## Validation Results

- Verified sort order via local execution of `getBlogPosts()`.
- Fixed a Jest test failure in `test/app/blog/utils.test.ts` where mocked posts with identical dates were causing unstable sort order in tests.
- Confirmed full test suite pass (`pnpm test`).
- Verified build integrity (`pnpm build`).

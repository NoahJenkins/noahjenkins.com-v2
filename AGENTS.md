# noahjenkins.com

## Design Context

### Users
This is Noah Jenkins' personal portfolio, blog, and project showcase. It serves an even split of hiring managers/recruiters, consulting or collaboration prospects, voice-over clients, developer peers, and Noah himself as a public record of skills, projects, writing, and creative work. Visitors should quickly understand Noah's technical credibility, creative range, and active learning/building trajectory.

### Brand Personality
The brand personality is technical, creative, and fun. The interface should feel capable and polished without becoming sterile, and it should preserve room for personal touches, playful interactions, voice-acting personality, and developer-focused details like the terminal experience.

### Aesthetic Direction
Keep the current dark-first animated tech look. Use black and deep gray surfaces, high-contrast white/gray text, Geist typography, and the established gold/yellow accent gradient from `#fecb3e` to `#ffb43f`. Motion should stay bold but purposeful, using gradients, scroll reveals, hover states, and micro-interactions to make the site feel alive. Preserve terminal-green styling for CLI/terminal-specific surfaces. Do not introduce a light-mode-first redesign or a generic SaaS/marketing aesthetic.

### Design Principles
- Lead with the work: make projects, skills, writing, demos, and proof points easy to find and scan.
- Balance credibility with personality: technical pages should feel trustworthy, while personal, blog, and voice sections can carry more warmth and fun.
- Preserve the dark/gold identity: future UI should extend the existing palette and animation language instead of replacing it.
- Keep motion intentional: animations should clarify hierarchy, reward interaction, or reinforce the tech-forward brand without distracting from content.
- Design dark-first only: optimize contrast, spacing, and readability for the dark theme rather than building parallel light-mode surfaces.

## Agent pull requests

Mode: auto-merge

Finished work in this repository is a merged pull request. Use the `ship`
skill in `.agents/skills/ship/` for every change. This rule replaces any
general instruction to stop at a local change.

A merge to `main` deploys the site to production on Vercel. This mode permits
that deploy.

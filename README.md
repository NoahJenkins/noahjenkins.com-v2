# Noah Jenkins Portfolio & Blog

A modern portfolio website and blog built with Next.js, Tailwind CSS, and TypeScript. Features include MDX/Markdown support, SEO optimization, RSS feed, dynamic OG images, syntax highlighting, analytics, and more.

---

## Repository Structure

```
/
├── app/
│   ├── layout.tsx                # Global layout, navigation, footer, analytics
│   ├── global.css                # Global styles (Tailwind v4)
│   ├── page.tsx                  # Home page
│   ├── about/                    # About page
│   │   └── page.tsx
│   ├── blog/                     # Blog listing and utilities
│   │   ├── page.tsx
│   │   ├── utils.ts
│   │   ├── format-date.ts
│   │   ├── [slug]/               # Individual blog post pages
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   └── blog-hero.tsx
│   │   └── posts/                # MDX blog posts
│   ├── components/               # Shared UI components (nav, footer, cards, etc.)
│   ├── voices/                   # Voice acting showcase
│   │   ├── page.tsx
│   │   └── components/
│   ├── projects/                 # Projects portfolio
│   │   ├── page.tsx
│   │   └── components/
│   ├── terminal/                 # Interactive terminal/resume
│   │   ├── page.tsx
│   │   └── components/
│   ├── tools/                    # Utility tools (CSS generator, etc.)
│   ├── og/                       # Open Graph image route
│   ├── rss/                      # RSS feed route
│   ├── sitemap.ts                # Sitemap generator
│   ├── robots.ts                 # Robots.txt generator
├── components/                   # Global components (terminal modal, animations, UI)
├── lib/                          # Utility libraries (GitHub API, helpers)
├── public/                       # Static assets (images, audio)
├── package.json                  # Project dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── postcss.config.js             # PostCSS configuration
├── .gitignore
├── README.md
```

---

## Development Environment Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [pnpm](https://pnpm.io/) (recommended package manager)

### Installation

```bash
pnpm install
```

### Running in Development Mode

```bash
pnpm dev
```

### Building for Production

```bash
pnpm build
```

### Starting Production Server

```bash
pnpm start
```

### Deployment

Deploy easily to [Vercel](https://vercel.com/) or any platform supporting Next.js.

---

## Pages & Components Overview

### Home (`/`)

- **File:** [`app/page.tsx`](app/page.tsx:1)
- **Components:** Hero section, social links, featured work, about preview.
- **UI:** Uses custom Button, Card, Typewriter, ScrollReveal, GradientAnimation.

### About (`/about`)

- **File:** [`app/about/page.tsx`](app/about/page.tsx:1)
- **Components:** GitHub stats, featured repositories, profile README (dynamically rendered), call-to-action.
- **UI:** GitHubStatsComponent, RepoCard, ScrollReveal, Button.

### Blog (`/blog`)

- **File:** [`app/blog/page.tsx`](app/blog/page.tsx:1)
- **Components:** BlogHero, BlogPosts (lists MDX posts), utilities for fetching posts.
- **UI:** BlogHero, BlogPosts, custom cards.

### Voices (`/voices`)

- **File:** [`app/voices/page.tsx`](app/voices/page.tsx:1)
- **Components:** DemoShowcase (audio samples), services cards, studio setup, experience grid.
- **UI:** Card, ScrollReveal, Headphones, Mic, Play icons.

### Projects (`/projects`)

- **File:** [`app/projects/page.tsx`](app/projects/page.tsx:1)
- **Components:** ProjectsContent (showcases portfolio projects).
- **UI:** Custom cards, grid layout.

### Terminal (`/terminal`)

- **File:** [`app/terminal/page.tsx`](app/terminal/page.tsx:1)
- **Components:** Terminal (interactive resume/command processor).
- **UI:** TerminalOutput, CommandProcessor.

### Global Layout

- **File:** [`app/layout.tsx`](app/layout.tsx:1)
- **Components:** Navbar, Footer, GlobalTerminal, Analytics, SpeedInsights.
- **Purpose:** Provides consistent navigation, theming, and analytics across all pages.

---

## Additional Features

- **MDX/Markdown Blog Posts:** Add new posts in [`app/blog/posts/`](app/blog/posts/) using `.mdx` format.
- **SEO Optimization:** Automatic sitemap, robots.txt, Open Graph images.
- **Analytics:** Integrated with Vercel Analytics and Speed Insights.
- **Custom Terminal:** Interactive resume and command processor.
- **Voice Acting Demos:** Audio samples in [`public/assets/audio/`](public/assets/audio/).

---

## License

MIT

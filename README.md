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

## Testing

This project includes comprehensive test coverage using both Jest and Playwright to ensure code quality and UI functionality.

### Jest Tests (Unit & Integration)

**What they test:**
- Utility functions (date formatting, blog utilities)
- GitHub API integration
- Command processor logic
- CSS generation utilities

**Location:** [`test/`](test/) directory with structure mirroring [`app/`](app/)

**Run Jest tests:**
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

**Example test files:**
- [`test/app/blog/format-date.test.ts`](test/app/blog/format-date.test.ts) - Date formatting functions
- [`test/app/terminal/command-processor.test.ts`](test/app/terminal/command-processor.test.ts) - Terminal command logic
- [`test/lib/github-api.test.ts`](test/lib/github-api.test.ts) - GitHub API integration

### Playwright Tests (UI/E2E)

**What they test:**
- **Terminal Interface** (Desktop only): Complete interactive terminal functionality including command execution, keyboard navigation, drag/drop, close button, command history
- **Navigation**: Cross-page navigation, responsive design, footer links
- **Cross-browser compatibility**: Chrome, Firefox, Safari (desktop + mobile)

**Location:** [`test/ui/`](test/ui/) directory

**Run Playwright tests:**
```bash
# Run all UI tests across all browsers
pnpm test:ui

# Run tests with browser visible (helpful for debugging)
pnpm test:ui:headed

# Debug mode with step-through
pnpm test:ui:debug

# Run tests for specific browser
pnpm test:ui --project=chromium
pnpm test:ui --project="Mobile Chrome"
```

**Test Coverage:**
- **Desktop Browsers** (Chrome, Firefox, Safari): 19 tests each
  - 16 Terminal Interface tests
  - 3 Navigation tests
- **Mobile Browsers** (Mobile Chrome, Mobile Safari): 3 tests each
  - 3 Navigation tests only (Terminal is desktop-only)

**Key Test Files:**
- [`test/ui/terminal.spec.ts`](test/ui/terminal.spec.ts) - Comprehensive terminal functionality testing
- [`test/ui/navigation.spec.ts`](test/ui/navigation.spec.ts) - Cross-page navigation and responsive design

**Browser Configuration:**
Terminal tests are automatically excluded from mobile browsers since the terminal interface is designed for desktop use only.

### Test Commands Summary

All custom test commands are defined in [`package.json`](package.json:3-15). Configuration files: [`jest.config.js`](jest.config.js:1), [`playwright.config.ts`](playwright.config.ts:1).

```bash
# Run all tests (Jest then Playwright)
pnpm test:all

# Run all tests in CI (allows empty test suites)
pnpm test:all:ci

# Run all tests after stopping any running dev server
pnpm test:all:clean

# Run Jest unit/integration tests
pnpm test

# Run Jest tests in watch mode
pnpm test:watch

# Run Playwright UI/E2E tests
pnpm test:ui

# Run Playwright tests with browser visible
pnpm test:ui:headed

# Run Playwright tests in debug mode
pnpm test:ui:debug
```

**Configuration notes:**
- Jest configuration: [`jest.config.js`](jest.config.js:1)
- Playwright configuration: [`playwright.config.ts`](playwright.config.ts:1)
- Test files are located in [`test/`](test/) and mirror the app structure.

**Example usage:**
```bash
# Run all tests (recommended for local development)
pnpm test:all

# Run all tests in CI/CD pipeline
pnpm test:all:ci

# Clean up and run all tests (useful if dev server is running)
pnpm test:all:clean
```

---

## License

MIT

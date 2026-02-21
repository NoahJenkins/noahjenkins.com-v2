# Noah Jenkins Portfolio & Blog

A modern, full-stack portfolio website and blog built with Next.js 15, Tailwind CSS v4, and TypeScript. Features dynamic GitHub integration, interactive terminal, voice acting showcase, CSS gradient generator, comprehensive testing, and automated CI/CD pipeline.

---

## Repository Structure

```
/
├── app/                          # Next.js 15 App Router pages and layouts
│   ├── layout.tsx                # Root layout with navigation, footer, analytics
│   ├── global.css                # Global styles (Tailwind CSS v4)
│   ├── page.tsx                  # Homepage with hero, featured work, animations
│   ├── about/                    # Dynamic GitHub-integrated about page
│   │   └── page.tsx              # GitHub stats, repos, README rendering
│   ├── blog/                     # MDX-powered blog system
│   │   ├── page.tsx              # Blog listing page
│   │   ├── utils.ts              # Blog post parsing utilities
│   │   ├── format-date.ts        # Date formatting functions
│   │   ├── [slug]/               # Individual blog post pages
│   │   │   └── page.tsx          # MDX rendering with syntax highlighting
│   │   ├── components/
│   │   │   └── blog-hero.tsx     # Blog page hero section
│   │   └── posts/                # MDX blog posts
│   │       ├── *.mdx             # Blog posts with frontmatter
│   ├── connections/              # Social media landing page (for presentations)
│   │   └── page.tsx              # QR code-friendly social links showcase
│   ├── components/               # Shared app-specific components
│   │   ├── animations/           # Framer Motion animation components
│   │   ├── layout/               # Layout-specific components
│   │   ├── ui/                   # Reusable UI components
│   │   ├── footer.tsx            # Site footer
│   │   ├── nav.tsx               # Navigation bar
│   │   ├── posts.tsx             # Blog post listing component
│   │   └── mdx.tsx               # MDX rendering components
│   ├── voices/                   # Voice acting portfolio
│   │   ├── page.tsx              # Voice acting showcase with audio players
│   │   └── components/
│   │       ├── audio-player.tsx  # Custom audio player component
│   │       ├── demo-showcase.tsx # Voice demo showcase
│   │       └── waveform.tsx      # Audio waveform visualization
│   ├── projects/                 # Portfolio projects showcase
│   │   ├── page.tsx              # Projects overview page
│   │   └── components/
│   │       └── projects-content.tsx # Projects grid and content
│   ├── terminal/                 # Interactive terminal/resume
│   │   ├── page.tsx              # Terminal page layout
│   │   └── components/
│   │       ├── terminal.tsx      # Main terminal component
│   │       ├── command-processor.tsx # Command processing logic
│   │       └── terminal-output.tsx   # Terminal output rendering
│   ├── tools/                    # Developer tools collection
│   │   └── css-generator/        # CSS gradient generator tool
│   │       ├── page.tsx          # Gradient generator page
│   │       └── components/
│   │           ├── gradient-generator.tsx # Main generator component
│   │           ├── gradient-preview.tsx   # Live preview panel
│   │           └── code-output.tsx        # Code export functionality
│   ├── contexts/                 # React context providers
│   ├── og/                       # Dynamic Open Graph image generation
│   │   └── route.tsx             # OG image API route
│   ├── rss/                      # RSS feed generation
│   │   └── route.ts              # RSS XML feed endpoint
│   ├── sitemap.ts                # Dynamic sitemap generation
│   ├── robots.ts                 # Robots.txt generation
│   └── not-found.tsx             # Custom 404 page
├── components/                   # Global reusable components
│   ├── animations/               # Animation components (scroll reveal, typewriter)
│   │   ├── gradient-animation.tsx
│   │   ├── scroll-reveal.tsx
│   │   └── typewriter.tsx
│   ├── ui/                       # Core UI component library
│   │   ├── button.tsx            # Button component with variants
│   │   ├── card.tsx              # Card component system
│   │   ├── github-stats.tsx      # GitHub statistics display
│   │   └── repo-card.tsx         # Repository card component
│   ├── global-terminal.tsx       # Global terminal modal
│   └── terminal-modal.tsx        # Terminal modal component
├── lib/                          # Utility libraries and API clients
│   ├── github-api.ts             # GitHub API integration with fallbacks
│   └── utils.ts                  # General utility functions
├── test/                         # Comprehensive test suite
│   ├── app/                      # App-specific unit tests
│   │   ├── blog/                 # Blog functionality tests
│   │   ├── terminal/             # Terminal command processor tests
│   │   └── tools/                # Tools functionality tests
│   ├── lib/                      # Library function tests
│   ├── ui/                       # Playwright E2E tests
│   │   ├── navigation.spec.ts    # Cross-page navigation tests
│   │   └── terminal.spec.ts      # Terminal UI interaction tests
│   └── README.md                 # Test documentation
├── public/                       # Static assets
│   └── assets/
│       ├── images/               # Images and icons
│       └── audio/                # Voice acting demo files
├── .github/                      # GitHub Actions CI/CD
│   ├── workflows/
│   │   ├── ci.yml                # Main CI pipeline (Jest + Playwright)
│   │   └── jest.yml              # Jest-only workflow
│   └── dependabot.yml            # Automated dependency updates
├── scripts/                      # Utility scripts
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── postcss.config.js             # PostCSS configuration
├── jest.config.js                # Jest testing configuration
├── playwright.config.ts          # Playwright E2E testing configuration
├── jest.setup.js                 # Jest test setup and mocks
└── README.md                     # This file
```

---

## Development Environment Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [pnpm](https://pnpm.io/) (required package manager)

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

### Homepage (`/`)

- **File:** [`app/page.tsx`](app/page.tsx:1)
- **Purpose:** Landing page with hero section, social links, featured work preview, and call-to-action
- **Components:** 
  - Hero section with animated typewriter effect and gradient background
  - Social media links (GitHub, LinkedIn, Twitter, Email)
  - Featured work cards (Cloud Solutions, Web Development, Voice Acting)
  - Call-to-action section with links to About and Projects
- **UI Elements:** Button, Card, Typewriter, ScrollReveal, GradientAnimation, Framer Motion animations
- **Features:** Responsive design, scroll indicators, hover effects, gradient text

### About Page (`/about`)

- **File:** [`app/about/page.tsx`](app/about/page.tsx:1)
- **Purpose:** Dynamic GitHub-integrated profile page with live data
- **Components:**
  - GitHub statistics dashboard (repos, stars, followers, commits)
  - Featured repositories with language tags and stats
  - Dynamic GitHub README rendering with custom markdown parser
  - Professional links and call-to-action
- **UI Elements:** GitHubStatsComponent, RepoCard, ScrollReveal, Button, loading spinner
- **Features:** Live GitHub API integration, markdown-to-HTML conversion, error fallbacks, responsive grid layouts
- **API Integration:** Real-time data from GitHub API with caching and error handling

### Blog System (`/blog`)

- **File:** [`app/blog/page.tsx`](app/blog/page.tsx:1)
- **Purpose:** MDX-powered blog with dynamic post listing
- **Components:**
  - BlogHero with introductory text
  - BlogPosts component for listing all posts
  - Individual post pages with MDX rendering ([slug]/page.tsx)
- **UI Elements:** BlogHero, BlogPosts, custom post cards, date formatting
- **Features:** MDX support, frontmatter parsing, syntax highlighting, SEO optimization, RSS feed integration
- **Content:** Located in `app/blog/posts/` directory as .mdx files

### Voice Acting Showcase (`/voices`)

- **File:** [`app/voices/page.tsx`](app/voices/page.tsx:1)
- **Purpose:** Professional voice acting portfolio with audio samples
- **Components:**
  - DemoShowcase with interactive audio players and waveform visualization
  - Services grid (Commercial, Audiobook, E-Learning, Corporate)
  - Professional studio equipment breakdown
  - Experience statistics and credentials
- **UI Elements:** AudioPlayer, Waveform, DemoShowcase, Card, ScrollReveal
- **Features:** Custom audio players, waveform visualization, service descriptions, equipment specs
- **Audio Files:** Professional voice samples stored in `public/assets/audio/`

### Projects Portfolio (`/projects`)

- **File:** [`app/projects/page.tsx`](app/projects/page.tsx:1)
- **Purpose:** Showcase of development projects and technical work
- **Components:**
  - ProjectsContent with categorized project sections
  - Project cards with descriptions, technologies, and links
  - Filtering by category (Cloud Infrastructure, Web & Mobile, Voice Acting)
- **UI Elements:** ProjectsContent, custom cards, category filters, responsive grid
- **Features:** Project categorization, technology tags, external links, responsive design

### Interactive Terminal (`/terminal`)

- **File:** [`app/terminal/page.tsx`](app/terminal/page.tsx:1)
- **Purpose:** Interactive terminal-based resume and command processor
- **Components:**
  - Terminal interface with command input and output
  - CommandProcessor for handling various commands
  - TerminalOutput for displaying command results
- **UI Elements:** Terminal, CommandProcessor, TerminalOutput
- **Features:** Full command processing, command history, file system simulation, Easter eggs
- **Commands:** help, about, experience, skills, education, contact, projects, ls, cat, clear, r2d2, and more

### CSS Gradient Generator (`/tools/css-generator`)

- **File:** [`app/tools/css-generator/page.tsx`](app/tools/css-generator/page.tsx:1)
- **Purpose:** Interactive tool for creating CSS gradients
- **Components:**
  - GradientGenerator with live preview and controls
  - GradientPreview for real-time visualization
  - CodeOutput for exporting CSS, SCSS, and Tailwind formats
- **UI Elements:** Interactive color pickers, gradient controls, code export panels
- **Features:** Linear/radial/conic gradients, live preview, multiple export formats, save/load functionality

### Connections Landing Page (`/connections`)

- **File:** [`app/connections/page.tsx`](app/connections/page.tsx:1)
- **Purpose:** Social media showcase page designed for QR code access during presentations and talks
- **Components:**
  - Social links grid with LinkedIn, X (Twitter), GitHub, and Website
  - Custom X icon component (official Twitter/X logo)
  - Animated cards with hover effects and external link buttons
- **UI Elements:** Card grid, custom XIcon, motion animations, gradient styling
- **Features:** QR code-friendly design, large touch targets, presentation-optimized layout
- **Note:** This page is not included in regular navigation - specifically designed as a landing zone for talks and presentations to showcase social media presence

### Global Layout System

- **File:** [`app/layout.tsx`](app/layout.tsx:1)
- **Purpose:** Root layout providing consistent structure across all pages
- **Components:**
  - Navbar with responsive navigation and theme toggle
  - Footer with social links and site information
  - GlobalTerminal modal accessible from any page
  - Analytics integration (Vercel Analytics & Speed Insights)
- **Features:** SEO metadata, responsive navigation, global terminal access, performance monitoring
- **Styling:** Tailwind CSS v4, Geist font family, dark theme optimized

---

## Project Description

This repository powers Noah Jenkins' personal site and blog: a Next.js App Router application that combines portfolio content, MDX blog publishing, interactive tools, voice demos, and automated testing/CI.

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm

### Installation
1. Clone the repository
2. Install dependencies: `pnpm install`
3. `.env.example` is not present in this repository because no tracked `.env` file was detected during onboarding
4. Configure environment variables if your local setup requires them

### Running Locally
Development server: `pnpm dev`

Application runs at: `http://localhost:3000`

### Testing
Run tests: `pnpm test`

Run UI tests: `pnpm test:ui`

Run all test suites: `pnpm test:all`

### Building
Production build: `pnpm build`

## Configuration

- No committed `.env.example` exists because this repository currently has no `.env` file in source control.
- CI and local workflows rely on standard runtime variables such as `CI`.
- External integrations: GitHub API usage in `lib/github-api.ts`, Vercel Analytics / Speed Insights in app layout.

## Documentation

- [Architecture Documentation](./docs/architecture/)
- [Architecture Decision Records](./docs/adr/)
- [Planning & Research Notes](./docs/context/)
- [Project Task Tracker](./docs/TODO.md)

## Contributing

- Use pull request template: `/.github/PULL_REQUEST_TEMPLATE.md`
- Use issue templates in `/.github/ISSUE_TEMPLATE/`
- Keep tests green (`pnpm test`, `pnpm test:ui` when relevant) before opening PRs

## License

No license file is currently detected in this repository.

`# TODO:` Add a LICENSE file and update this section when a project license is selected.

---

## Additional Features

- **MDX/Markdown Blog Posts:** Add new posts in [`app/blog/posts/`](app/blog/posts/) using `.mdx` format.
- **SEO Optimization:** Automatic sitemap, robots.txt, Open Graph images.
- **Analytics:** Integrated with Vercel Analytics and Speed Insights.
- **Custom Terminal:** Interactive resume and command processor.
- **Voice Acting Demos:** Audio samples in [`public/assets/audio/`](public/assets/audio/).

---

## Custom Agents

This repository includes several Custom Agents for GitHub Copilot (stored under `.github/agents/`) to help with development, testing, accessibility, SEO, and CI workflows. The following agents are installed:

- `.github/agents/expert-nextjs-developer.agent.md` — Next.js 16 / App Router expert.
- `.github/agents/expert-react-frontend-engineer.agent.md` — React 19.2 frontend expert.
- `.github/agents/playwright-tester.agent.md` — Playwright test generation & debugging mode.
- `.github/agents/accessibility.agent.md` — Web accessibility (WCAG) specialist.
- `.github/agents/search-ai-optimization-expert.agent.md` — SEO / AEO / GEO optimization expert.
- `.github/agents/github-actions-expert.agent.md` — GitHub Actions security and CI/CD expert.

To use these agents in VS Code: open the Chat pane, choose "Install agent from file", and pick one of the files in `.github/agents/`. They can assist with code suggestions, PR guidance, test generation, accessibility reviews, SEO improvements, and workflow hardening.

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

## CI/CD Pipeline

This project implements a comprehensive continuous integration and deployment pipeline using GitHub Actions with multiple workflows for different testing and deployment scenarios.

### GitHub Actions Workflows

#### Main CI Pipeline (`ci.yml`)

**File:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml:1)

**Triggers:** Push and Pull Requests to `main` branch

**Jobs:**
1. **Jest Tests** (Node.js 18)
   - Installs dependencies with pnpm and proper caching
   - Runs unit and integration tests
   - Uploads coverage reports to Codecov
   - Tests utility functions, API integration, command processor, CSS generation

2. **Playwright Tests** (Node.js 18)  
   - Installs dependencies and Playwright browsers
   - Builds Next.js application
   - Starts production server
   - Runs E2E tests across Chrome, Firefox, Safari (desktop + mobile)
   - Uploads test reports and results as artifacts
   - Tests terminal interface, navigation, responsive design

3. **Lint & Type Check** (Node.js 18)
   - Runs TypeScript type checking with `tsc --noEmit`
   - Conditionally runs ESLint if configuration exists
   - Continues on errors to not block deployment

4. **Build Check** (Node.js 18)
   - Verifies production build succeeds
   - Validates `.next` directory creation
   - Ensures deployment readiness

**Features:**
- Concurrency control (cancels in-progress workflows on new pushes)
- Parallel job execution for faster feedback
- Comprehensive artifact collection
- Error handling and fallback strategies
- Latest pnpm version with lockfile compatibility fallbacks
- Optimized pnpm store caching for faster dependency installation


### Dependency Management

#### Dependabot Configuration

**File:** [`.github/dependabot.yml`](.github/dependabot.yml:1)

**Features:**
- **Weekly Updates:** Scheduled for Monday 9:00 AM CT
- **Grouped Updates:** Related packages updated together (React, Next.js, Testing, Tailwind, Types, Vercel)
- **Smart Ignoring:** Major version updates ignored for stability-critical packages
- **PR Management:** Max 10 dependency PRs, 5 GitHub Actions PRs
- **Auto-Assignment:** PRs automatically assigned to @NoahJenkins
- **Semantic Commits:** Properly prefixed commit messages (`deps:`, `ci:`)

**Package Groups:**
- React ecosystem (react*, @types/react*)
- Next.js framework (@next/*, next*)
- Testing tools (jest*, @testing-library/*, @playwright/*)
- Tailwind CSS (tailwind*, @tailwindcss/*)
- TypeScript types (@types/*)
- Vercel integrations (@vercel/*)

**Stability Controls:**
- Next.js canary version pinned
- Tailwind CSS alpha version controlled
- TypeScript major versions manually reviewed

### Deployment Pipeline

#### Vercel Integration

**Platform:** [Vercel](https://vercel.com/) with automatic deployments

**Deployment Strategy:**
- **Production Deployments:** Every push to `main` branch
- **Preview Deployments:** Every pull request
- **Zero-Config:** No manual setup required
- **Environment Variables:** Managed securely through Vercel dashboard
- **Performance Monitoring:** Built-in analytics and speed insights

**Features:**
- Automatic builds triggered by GitHub webhooks
- Preview URLs for pull request testing
- Production optimizations (SSG, ISR, Edge Functions)
- Global CDN distribution
- Automatic HTTPS and custom domain support

### Pipeline Benefits

1. **Quality Assurance:** Every change tested across multiple browsers and environments
2. **Fast Feedback:** Parallel job execution provides quick results
3. **Comprehensive Coverage:** Unit tests, E2E tests, type checking, and build validation
4. **Automated Dependencies:** Weekly updates with intelligent grouping and conflict resolution
5. **Zero-Downtime Deployment:** Seamless production updates with rollback capabilities
6. **Performance Monitoring:** Built-in analytics and performance tracking

### Monitoring & Alerts

- **Test Results:** Available in GitHub Actions tab with detailed logs
- **Coverage Reports:** Integrated with Codecov for coverage tracking
- **Build Status:** Visible in pull requests and commit history
- **Deployment Status:** Real-time updates in Vercel dashboard
- **Performance Metrics:** Vercel Analytics for user experience monitoring

This robust CI/CD pipeline ensures code quality, prevents regressions, and maintains a reliable deployment process while minimizing manual intervention.

---

## License

MIT

# Noah Jenkins Personal Website Development Plan

## Project Overview
Building a modern, minimal personal website for Noah Jenkins (Cloud Engineer, Web Developer, Voice Actor) using Next.js 14, hosted on Vercel with bold animations and responsive design.

## Design System

### Color Palette
- **Primary Gradient**: `linear-gradient(to right, #fecb3e, #ffb43f)` 
- **Dark Mode**: Deep blacks (#0a0a0a, #111111) with the gradient as accent
- **Light Mode**: Clean whites (#ffffff, #fafafa) with the gradient as accent
- **Terminal**: Classic green (#00ff00) on black (#000000)
- **Text**: High contrast grays and whites
- **Accent Colors**: Extract complementary colors from the gradient

### Typography
- **Primary Font**: Geist (already included)
- **Terminal Font**: JetBrains Mono or Fira Code for terminal sections
- **Hierarchy**: Clear distinction between headings, body text, and code

### Animation Philosophy
- **Bold & Creative**: Page transitions, hover effects, scroll-triggered animations
- **Performance First**: Use CSS transforms and opacity for smooth 60fps animations
- **Purposeful**: Each animation should enhance UX, not distract

## Architecture & Dependencies

### Additional Dependencies to Add
```json
{
  "wavesurfer.js": "^7.0.0",
  "framer-motion": "^10.0.0", 
  "next-themes": "^0.2.1",
  "lucide-react": "^0.263.1",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^1.14.0"
}
```

### File Structure Updates
```
app/
├── globals.css (enhanced with animations)
├── layout.tsx (theme provider, nav)
├── page.tsx (hero/landing page)
├── providers.tsx (theme provider)
├── about/
│   └── page.tsx (renders GitHub README.md)
├── resume/
│   ├── page.tsx (terminal interface)
│   └── components/
│       ├── terminal.tsx
│       ├── command-processor.tsx
│       └── terminal-output.tsx
├── tools/
│   └── css-generator/
│       ├── page.tsx
│       └── components/
│           ├── gradient-generator.tsx
│           ├── gradient-preview.tsx
│           └── code-output.tsx
├── voices/
│   ├── page.tsx
│   └── components/
│       ├── audio-player.tsx
│       ├── waveform.tsx
│       └── demo-showcase.tsx
├── blog/ (existing structure)
├── components/
│   ├── ui/ (reusable UI components)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── toggle.tsx
│   │   └── animated-background.tsx
│   ├── layout/
│   │   ├── navigation.tsx
│   │   ├── mobile-nav.tsx
│   │   ├── footer.tsx
│   │   └── theme-toggle.tsx
│   └── animations/
│       ├── page-transition.tsx
│       ├── scroll-reveal.tsx
│       └── gradient-animation.tsx
└── lib/
    ├── utils.ts
    ├── constants.ts
    └── github-api.ts
```

## Page Specifications

### 1. Homepage (Landing)
**Purpose**: First impression with bold visual impact
**Features**:
- Hero section with animated gradient background
- Animated text introduction
- Navigation to key sections
- Scroll-triggered animations
- Professional headshot with hover effects

**Components**:
- Hero with gradient animation
- Role/title with typewriter effect
- Call-to-action buttons with hover animations
- Featured work preview cards
- Social links with micro-interactions

### 2. About Page (/about)
**Purpose**: Dynamic rendering of GitHub README.md
**Features**:
- Fetch and parse GitHub README.md
- Markdown rendering with custom styling
- Animated content reveal
- Integration with GitHub API for live stats

**Technical Implementation**:
- API route to fetch GitHub README
- MDX processing for rich content
- Animated sections with Framer Motion
- GitHub stats integration (repos, commits, etc.)

### 3. Resume Page (/resume)
**Purpose**: Interactive terminal-style resume
**Features**:
- Classic green-on-black terminal theme
- Command-line interface simulation
- Available commands: `help`, `about`, `experience`, `skills`, `education`, `projects`, `contact`, `clear`
- Typewriter effect for output
- Command history with arrow keys

**Terminal Commands**:
```bash
help        - Show available commands
about       - Personal summary
experience  - Work history
skills      - Technical skills
education   - Educational background
projects    - Notable projects
contact     - Contact information
clear       - Clear terminal
whoami      - Current user info
ls          - List available sections
cat [file]  - Display file contents
```

### 4. CSS Generator (/tools/css-generator)
**Purpose**: Interactive gradient generator tool
**Features**:
- Live gradient preview
- Multiple gradient types (linear, radial, conic)
- Color picker integration
- Direction/angle controls
- Copy-to-clipboard functionality
- Save/load presets
- CSS code output

**Components**:
- Real-time preview panel
- Color stop editor
- Direction controls
- Code output with syntax highlighting
- Export options (CSS, SCSS, Tailwind)

### 5. Voices Page (/voices)
**Purpose**: Voice-over demo showcase
**Features**:
- WaveSurfer.js integration
- Professional audio player
- Waveform visualization
- Play/pause/seek controls
- Download links for demos
- Demo descriptions and context

**Audio Player Features**:
- Custom-styled player matching site theme
- Waveform visualization with gradient colors
- Progress tracking
- Volume controls
- Speed adjustment
- Professional presentation

### 6. Blog (/blog)
**Purpose**: Tech and life topics (existing structure enhanced)
**Enhancements**:
- Improved typography
- Reading time estimation
- Tag system
- Search functionality
- Related posts
- Animated transitions between posts

## Component Library

### UI Components
1. **Button Component**
   - Variants: primary, secondary, ghost, terminal
   - Sizes: sm, md, lg
   - Loading states and disabled states
   - Hover animations

2. **Card Component**
   - Glass morphism effects
   - Hover animations
   - Gradient borders
   - Shadow variations

3. **Theme Toggle**
   - Smooth dark/light mode transition
   - Icon animation
   - System preference detection

4. **Navigation**
   - Desktop: horizontal nav with gradient underlines
   - Mobile: hamburger menu with smooth transitions
   - Active state indicators
   - Scroll-based styling changes

### Animation Components
1. **Page Transitions**
   - Smooth page-to-page navigation
   - Loading states
   - Exit/enter animations

2. **Scroll Reveal**
   - Intersection Observer-based
   - Staggered animations
   - Performance optimized

3. **Gradient Animation**
   - Rotating gradient backgrounds
   - Hover effect variations
   - CSS-based for performance

## Dark Mode Implementation

### Theme Configuration
```typescript
// themes.ts
export const themes = {
  light: {
    background: '#ffffff',
    foreground: '#0a0a0a',
    card: '#fafafa',
    border: '#e5e5e5',
    gradient: 'linear-gradient(to right, #fecb3e, #ffb43f)'
  },
  dark: {
    background: '#0a0a0a',
    foreground: '#ffffff',
    card: '#111111',
    border: '#333333',
    gradient: 'linear-gradient(to right, #fecb3e, #ffb43f)'
  }
}
```

### Implementation Strategy
- Use `next-themes` for theme persistence
- CSS custom properties for theme values
- Smooth transitions between themes
- System preference detection
- Manual toggle option

## Performance & SEO

### Core Web Vitals Optimization
- Image optimization with Next.js Image
- Code splitting per route
- Lazy loading for non-critical components
- Preloading for critical resources

### SEO Implementation
- Dynamic meta tags per page
- Open Graph images
- Structured data for personal/professional info
- Sitemap generation
- RSS feed for blog

### Analytics Integration
- Vercel Analytics (already configured)
- Custom event tracking for interactions
- Performance monitoring
- User journey analysis

## Development Phases

### Phase 1: Foundation (Week 1)
1. Setup enhanced dependencies
2. Configure theme system
3. Build core UI components
4. Implement navigation and layout
5. Setup animation foundations

### Phase 2: Core Pages (Week 2)
1. Homepage with hero animations
2. About page with GitHub integration
3. Terminal resume interface
4. Basic blog enhancements

### Phase 3: Advanced Features (Week 3)
1. CSS Generator tool
2. Voice player with WaveSurfer.js
3. Advanced animations and transitions
4. Mobile responsiveness polish

### Phase 4: Polish & Deploy (Week 4)
1. Performance optimization
2. SEO implementation
3. Cross-browser testing
4. Vercel deployment configuration
5. Analytics setup

## Technical Considerations

### GitHub API Integration
```typescript
// lib/github-api.ts
export async function getGitHubReadme() {
  const response = await fetch(
    'https://api.github.com/repos/noahjenkins/noahjenkins/readme',
    { headers: { 'Accept': 'application/vnd.github.v3.raw' } }
  );
  return response.text();
}
```

### WaveSurfer.js Integration
```typescript
// components/audio-player.tsx
import WaveSurfer from 'wavesurfer.js';

// Configuration for professional audio player
const wavesurferConfig = {
  waveColor: '#fecb3e',
  progressColor: '#ffb43f',
  backgroundColor: 'transparent',
  barWidth: 2,
  barGap: 1,
  responsive: true
};
```

### Terminal Simulation
```typescript
// components/terminal.tsx
const commands = {
  help: () => 'Available commands: help, about, experience, skills...',
  about: () => 'Cloud Engineer & Web Developer passionate about...',
  experience: () => renderExperience(),
  skills: () => renderSkills(),
  // ... other commands
};
```

## Responsive Design Strategy

### Breakpoints
- Mobile: 0-640px
- Tablet: 641-1024px
- Desktop: 1025px+

### Mobile-First Approach
- Start with mobile layout
- Progressive enhancement for larger screens
- Touch-friendly interactions
- Optimized navigation for mobile

### Key Responsive Considerations
- Terminal interface adaptation for mobile
- Audio player controls for touch
- Navigation menu transforms
- Typography scaling
- Animation performance on mobile

## Deployment Configuration

### Vercel Setup
```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "analytics": true
}
```

### Environment Variables
- GitHub token (for API rate limits)
- Analytics configuration
- Any third-party service keys

## Success Metrics

### Technical Metrics
- Lighthouse score > 90 across all categories
- Core Web Vitals in green
- Cross-browser compatibility
- Mobile responsiveness score

### User Experience Metrics
- Time on site
- Page engagement
- Animation performance
- Accessibility compliance (WCAG 2.1 AA)

## Next Steps
1. Review and approve this plan
2. Setup development environment
3. Begin Phase 1 implementation
4. Regular progress reviews
5. User testing and feedback integration

---

This plan provides a comprehensive roadmap for building a professional, modern, and engaging personal website that showcases Noah's diverse skills while maintaining excellent performance and user experience.
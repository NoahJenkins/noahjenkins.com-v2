# Test Suite Documentation

This directory contains comprehensive test suites for the noahjenkins.com website.

## Test Structure

```
__tests__/
├── lib/
│   ├── utils.test.ts          # Tests for utility functions (cn class merger)
│   └── github-api.test.ts     # Tests for GitHub API functions
├── app/
│   ├── blog/
│   │   ├── format-date.test.ts    # Tests for date formatting functions
│   │   └── utils.test.ts          # Tests for blog utility functions
│   ├── terminal/
│   │   └── command-processor.test.ts  # Tests for terminal command processor
│   └── tools/
│       └── css-generator/
│           └── css-generation.test.ts  # Tests for CSS gradient generator logic
└── README.md
```

## Functions Tested

### Core Utilities
- **`cn()`** - Class name utility function for merging Tailwind classes
- **`formatDate()`** - Date formatting with relative time display
- **`getBlogPosts()`** - Blog post parsing and metadata extraction

### GitHub API Integration
- **`getGitHubReadme()`** - Fetches GitHub profile README with fallback
- **`getGitHubStats()`** - Calculates GitHub statistics (repos, stars, etc.)
- **`getFeaturedRepos()`** - Gets featured repositories

### Terminal Command Processor
- **`CommandProcessor.processCommand()`** - Main command processing logic
- All terminal commands (`help`, `about`, `experience`, `skills`, etc.)
- File system simulation (`cat`, `ls`)
- Easter egg commands (`r2d2`, `darth`, `moria`, `precious`)

### CSS Gradient Generator
- **`generateCSS()`** - CSS gradient string generation for linear, radial, and conic gradients
- **`generateCode()`** - Code output generation for CSS, SCSS, and Tailwind formats
- Color stop management and position calculation logic
- Gradient validation and edge case handling

## Test Features

- **Comprehensive Coverage**: 82 tests covering all major functions
- **Mock Implementation**: Proper mocking of external dependencies (fs, fetch, console)
- **Edge Case Testing**: Tests for error conditions, empty inputs, and boundary cases
- **Clean Output**: Console errors suppressed for cleaner test output
- **Date Mocking**: Time-based tests use fake timers for consistency

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test __tests__/lib/utils.test.ts
```

## Test Coverage

All critical business logic functions are tested, including:
- ✅ Utility functions
- ✅ Date formatting
- ✅ Blog post processing
- ✅ GitHub API integration with fallbacks
- ✅ Terminal command processing
- ✅ CSS gradient generation and code output
- ✅ Error handling and edge cases

## Configuration

- **Jest Config**: `jest.config.js` with Next.js integration
- **Setup File**: `jest.setup.js` with DOM testing utilities and global mocks
- **TypeScript Support**: Full TypeScript support with proper type checking
- **Module Aliasing**: Path aliases configured for clean imports
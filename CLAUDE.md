# CLAUDE.md - AI Assistant Guide for v0 SDK Monorepo

> **Last Updated:** 2025-11-23
> **Repository:** v0-sdk-monorepo
> **Version:** 0.8.0

This document provides comprehensive guidance for AI assistants working with the v0 SDK monorepo codebase.

## Table of Contents

- [Repository Overview](#repository-overview)
- [Architecture & Structure](#architecture--structure)
- [Development Environment](#development-environment)
- [Monorepo Organization](#monorepo-organization)
- [Package Details](#package-details)
- [Development Workflows](#development-workflows)
- [Testing Conventions](#testing-conventions)
- [Code Style & Formatting](#code-style--formatting)
- [Build System](#build-system)
- [Release Management](#release-management)
- [Git Workflows](#git-workflows)
- [Key Conventions for AI Assistants](#key-conventions-for-ai-assistants)
- [Common Patterns](#common-patterns)
- [Environment Variables](#environment-variables)
- [Important Files & Directories](#important-files--directories)

---

## Repository Overview

This is a **TypeScript monorepo** containing SDKs and tools for interacting with the v0 Platform API. The v0 Platform enables AI-powered chat conversations, project generation, and integrations.

**Current Status:** Developer Preview (Beta) - subject to change

**License:** Apache 2.0

**Primary Technologies:**
- TypeScript 5.7.3
- Node.js 22+
- pnpm 9+ (workspace package manager)
- Turborepo (build orchestration)
- Vitest (testing)
- Bunchee (bundling)
- Changesets (version management)

---

## Architecture & Structure

### High-Level Architecture

```
v0-sdk-monorepo/
├── packages/               # Published packages
│   ├── v0-sdk/            # Core TypeScript SDK
│   ├── react/             # React rendering components
│   ├── ai-tools/          # AI SDK integration tools
│   └── create-v0-sdk-app/ # CLI scaffolding tool
├── examples/              # Example applications
│   ├── v0-clone/          # Full-featured clone
│   ├── simple-v0/         # Minimal implementation
│   ├── classic-v0/        # Classic UI clone
│   ├── v0-sdk-react-example/
│   └── ai-tools-example/
├── .changeset/            # Changesets for releases
├── .husky/                # Git hooks
├── turbo.json            # Turborepo configuration
├── pnpm-workspace.yaml   # pnpm workspace config
└── tsconfig.json         # Root TypeScript config
```

### Dependency Graph

```
create-v0-sdk-app (CLI tool)
       ↓
v0-sdk (Core SDK)
       ↓
    ┌──┴──┐
    ↓     ↓
@v0-sdk/  @v0-sdk/
 react    ai-tools
```

---

## Development Environment

### Prerequisites

**Required:**
- **Node.js:** ≥22 (specified in package.json engines)
- **pnpm:** ≥9 (specified in package.json engines)
- Package manager locked to: `pnpm@9.15.0`

**Environment Variables:**
- `V0_API_KEY` - Required for API operations (get from v0.dev/chat/settings/keys)
- Additional env vars documented in [Environment Variables](#environment-variables)

### Initial Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Verify setup
pnpm test
pnpm type-check
```

---

## Monorepo Organization

### Workspace Configuration

**File:** `pnpm-workspace.yaml`
```yaml
packages:
  - 'packages/*'
  - 'examples/*'
```

All packages in `packages/` and `examples/` are part of the workspace.

### Internal Dependencies

Packages use workspace protocol for internal dependencies:
```json
{
  "dependencies": {
    "v0-sdk": "workspace:*"
  }
}
```

This ensures packages always use the local workspace version during development.

---

## Package Details

### 1. `v0-sdk` (Core SDK)

**Location:** `packages/v0-sdk/`
**Published as:** `v0-sdk`
**Version:** 0.14.0
**Purpose:** TypeScript SDK for v0 Platform API

**Structure:**
```
v0-sdk/
├── src/
│   ├── index.ts           # Public API exports
│   ├── sdk/
│   │   ├── v0.ts         # Main SDK implementation (43KB+)
│   │   └── core.ts       # Core fetcher & utilities
│   └── scripts/
│       └── generate.ts   # SDK generation from OpenAPI
└── tests/
    ├── core.test.ts      # Core functionality tests
    ├── createClient.test.ts
    ├── chats/
    ├── deployments/
    ├── projects/
    └── ...               # Feature-organized tests
```

**Key Scripts:**
- `pnpm build` - Build with bunchee
- `pnpm test` - Run Vitest tests
- `pnpm sdk:generate` - Generate SDK from OpenAPI spec

**Exports:**
- ESM: `dist/index.js`
- CJS: `dist/index.cjs`
- Types: `dist/index.d.ts`

---

### 2. `@v0-sdk/react` (React Components)

**Location:** `packages/react/`
**Published as:** `@v0-sdk/react`
**Version:** 0.3.1
**Purpose:** Headless React components for rendering v0 Platform content

**Structure:**
```
react/
├── src/
│   ├── index.ts          # Public exports
│   ├── components/       # React components
│   │   ├── message.tsx
│   │   ├── streaming-message.tsx
│   │   ├── code-project-part.tsx
│   │   ├── code-block.tsx
│   │   └── ...
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── types.ts         # TypeScript types
│   └── globals.d.ts     # Global type declarations
```

**Peer Dependencies:**
- React: `^18.0.0 || ^19.0.0`

**Key Exports:**
- Components: `Message`, `StreamingMessage`, `CodeBlock`, etc.
- Hooks: `useMessage`, `useStreamingMessage`, `useCodeBlock`, etc.
- Backward compatibility aliases maintained

---

### 3. `@v0-sdk/ai-tools` (AI SDK Tools)

**Location:** `packages/ai-tools/`
**Published as:** `@v0-sdk/ai-tools`
**Version:** 0.2.2
**Purpose:** AI SDK integration tools for v0 Platform

**Dependencies:**
- `v0-sdk` (workspace)
- `zod` - Schema validation
- Peer: `ai` (≥5.0.0)

**Structure:**
```
ai-tools/
├── src/
│   └── ...              # AI tool implementations
└── tests/
    └── ...              # Test files
```

---

### 4. `create-v0-sdk-app` (CLI Tool)

**Location:** `packages/create-v0-sdk-app/`
**Published as:** `create-v0-sdk-app`
**Version:** 0.1.3
**Purpose:** CLI for scaffolding v0 SDK applications

**Binary:** `create-v0-sdk-app`

**Dependencies:**
- `commander` - CLI framework
- `prompts` - Interactive prompts
- `picocolors` - Terminal colors
- `cross-spawn` - Cross-platform process spawning
- `fast-glob` - File pattern matching
- `tar` - Archive handling

---

## Development Workflows

### Common Commands

**Root-level commands** (run from repository root):

```bash
# Build all packages
pnpm build

# Build only SDK packages (not examples)
pnpm build:packages

# Run tests for all packages
pnpm test

# Watch mode for tests
pnpm test:watch

# Type-check all packages
pnpm type-check

# Lint all packages
pnpm lint

# Format code
pnpm format

# Check formatting
pnpm format:check

# Development mode (watch & rebuild)
pnpm dev

# Generate SDK from OpenAPI
pnpm sdk:generate
```

**Package-specific commands:**

```bash
# Run command in specific package
pnpm --filter v0-sdk build
pnpm --filter v0-sdk test
pnpm --filter @v0-sdk/react build

# Run in multiple packages
pnpm --filter v0-sdk --filter @v0-sdk/react build
```

### Turborepo Task Execution

Turborepo manages task dependencies and caching. Key task configurations:

**Build Task:**
- Depends on: `^build` (dependencies must build first)
- Outputs: `dist/**`, `.next/**`
- Cached by default

**Test Task:**
- Depends on: `^build`, `build` (requires build completion)
- Not cached (by default)

**Type-check Task:**
- Depends on: `^build`, `build`

**Development Task:**
- `cache: false`
- `persistent: true` (keeps running)

---

## Testing Conventions

### Testing Framework

**Vitest** is used for all unit and integration testing.

### Test File Organization

Tests are organized by feature/domain:

```
packages/v0-sdk/tests/
├── core.test.ts           # Core functionality
├── createClient.test.ts   # Client creation
├── chats/                 # Chat-related tests
├── deployments/           # Deployment tests
├── projects/              # Project tests
├── hooks/                 # Webhook tests
├── integrations/          # Integration tests
└── ...
```

### Test File Naming

- Pattern: `*.test.ts`
- Co-located with source or in `tests/` directory

### Test Structure

Standard Vitest patterns:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
    vi.clearAllMocks()
  })

  describe('Sub-feature', () => {
    it('should do something specific', () => {
      // Arrange
      // Act
      // Assert
      expect(result).toBe(expected)
    })
  })
})
```

### Mocking

- Use `vi.fn()` for function mocks
- Use `vi.mock()` for module mocks
- Global mocks: `global.fetch = vi.fn()`
- Always clear mocks in `beforeEach`

### Running Tests

```bash
# Run all tests (CI mode)
pnpm test

# Watch mode
pnpm test:watch

# Specific package
pnpm --filter v0-sdk test
```

---

## Code Style & Formatting

### Prettier Configuration

**Applied consistently across entire monorepo:**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all"
}
```

### Key Rules

- **No semicolons**
- **Single quotes** for strings
- **Trailing commas** everywhere possible
- Automatic formatting enforced via pre-commit hooks

### Formatting Commands

```bash
# Format all files
pnpm format

# Check formatting (CI)
pnpm format:check
```

### Pre-commit Hook

**File:** `.husky/pre-commit`

Automatically runs `pnpm format` before every commit to ensure consistent formatting.

### TypeScript Configuration

**Root `tsconfig.json`:**
- Target: `ES2022`
- Module: `ESNext`
- Module Resolution: `bundler`
- Strict mode: `enabled`
- `skipLibCheck: true`
- `isolatedModules: true`

**Path Aliases:**
```json
{
  "paths": {
    "v0-sdk": ["./packages/v0-sdk/src"]
  }
}
```

---

## Build System

### Bundler: Bunchee

All packages use **bunchee** for bundling:
- Outputs: ESM, CJS, TypeScript declarations
- Zero-config bundler optimized for libraries
- Automatically generates `.d.ts` files

### Build Outputs

Each package produces:
```
dist/
├── index.js       # ESM
├── index.cjs      # CommonJS
└── index.d.ts     # TypeScript types
```

### Package Exports

Standard export configuration:

```json
{
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

### Clean Build

```bash
# Clean all packages
pnpm turbo clean

# Clean specific package
pnpm --filter v0-sdk clean
```

Clean script: `rm -rf dist *.tsbuildinfo`

---

## Release Management

### Changesets Workflow

**Tool:** [@changesets/cli](https://github.com/changesets/changesets)

**Configuration:** `.changeset/config.json`
- Base branch: `main`
- Access: `public`
- Update internal dependencies: `patch`

### Creating a Changeset

**Every PR that modifies packages MUST include a changeset** (enforced by CI).

```bash
# Create a changeset
pnpm changeset
```

Follow prompts to:
1. Select affected packages
2. Choose version bump type (patch/minor/major)
3. Write change summary

### Changeset Types

- **Patch** (0.0.X) - Bug fixes, internal changes (most common)
- **Minor** (0.X.0) - New features, backward compatible
- **Major** (X.0.0) - Breaking changes

**Default expectation:** Use **patch** for most changes.

### Automated Release Process

1. Developer creates PR with changeset
2. PR reviewed and merged to `main`
3. GitHub Actions automatically:
   - Creates "Version Packages" PR
   - Updates versions and CHANGELOGs
4. When "Version Packages" PR is merged:
   - Packages automatically published to npm

### Manual Release (if needed)

```bash
# Version packages (update package.json & CHANGELOG)
pnpm ci:version

# Build and publish
pnpm ci:release
```

---

## Git Workflows

### Branching Strategy

- **Main branch:** `main`
- **Feature branches:** `feature/your-feature-name`
- **Changeset PRs:** Auto-generated by GitHub Actions

### Commit Messages

Conventional commit format recommended:

```
feat: add new feature
fix: resolve bug in component
docs: update documentation
chore: update dependencies
test: add test coverage
refactor: improve code structure
```

### Pre-commit Automation

**.husky/pre-commit** automatically:
1. Formats code with Prettier
2. Stages formatted files

No manual formatting needed - just commit!

---

## Key Conventions for AI Assistants

### 1. **Never Modify Generated Code**

The SDK (`packages/v0-sdk/src/sdk/v0.ts`) is **generated from OpenAPI spec**.

- **DO NOT** manually edit `v0.ts`
- To update SDK: run `pnpm sdk:generate`
- Core utilities in `core.ts` can be modified

### 2. **Always Include Changesets**

When modifying packages:
1. Make code changes
2. Run `pnpm changeset`
3. Include changeset file in PR
4. Default to **patch** version bump

### 3. **Follow Test Organization**

- Tests organized by feature/domain
- Place tests in appropriate subdirectories
- Use descriptive `describe` blocks
- Mock external dependencies

### 4. **Respect Workspace Dependencies**

When adding dependencies:
- Internal packages: use `workspace:*`
- External packages: use specific versions
- Check if dependency exists elsewhere first

### 5. **Maintain Export Patterns**

Each package has specific export patterns:
- **v0-sdk:** Exports SDK client and types
- **@v0-sdk/react:** Exports components + hooks + types
- **@v0-sdk/ai-tools:** Exports tools + schemas

### 6. **Build Before Testing**

Tests depend on built packages:
```bash
pnpm build    # Required before tests
pnpm test
```

### 7. **Format Before Committing**

Pre-commit hook handles this, but manually:
```bash
pnpm format   # Format all code
```

### 8. **Use Type-Safe Patterns**

- Strict TypeScript mode enabled
- Export types from packages
- Use Zod for runtime validation (ai-tools)

### 9. **Examples Are Separate**

- Examples in `examples/` are for demonstration
- Not published to npm
- Can have different dependencies/patterns
- Must work with workspace versions of SDK packages

### 10. **Backward Compatibility**

When refactoring exports:
- Maintain old export names as aliases
- See `@v0-sdk/react` for examples:
  ```typescript
  export { Message as MessageRenderer }  // Old name
  export { Message }                     // New name
  ```

---

## Common Patterns

### Creating a New Package

1. Create directory in `packages/`
2. Add `package.json` with:
   - `name`: Use `@v0-sdk/` scope or `v0-sdk` for main
   - `version`: Start at `0.1.0`
   - `type: "module"`
   - Standard scripts: `build`, `test`, `type-check`, `clean`
3. Add to workspace (automatic via `pnpm-workspace.yaml`)
4. Update `turbo.json` if needed
5. Create changeset

### Adding a New Test

1. Determine appropriate test directory
2. Create `feature.test.ts`
3. Use Vitest imports and patterns
4. Mock external dependencies
5. Run tests: `pnpm --filter <package> test`

### Adding a Dependency

```bash
# To specific package
pnpm --filter v0-sdk add <package>

# Dev dependency
pnpm --filter v0-sdk add -D <package>

# Workspace dependency
# Edit package.json manually:
"dependencies": {
  "v0-sdk": "workspace:*"
}
```

### Updating Types

1. Modify TypeScript source
2. Run `pnpm build` (generates new `.d.ts`)
3. Exported types available to consumers
4. Consider backward compatibility

### SDK Generation Workflow

```bash
# Regenerate SDK from OpenAPI spec
pnpm --filter v0-sdk sdk:generate

# This will:
# 1. Fetch latest OpenAPI spec
# 2. Generate TypeScript SDK
# 3. Format code with Prettier
```

---

## Environment Variables

### Required for Development

- `V0_API_KEY` - API key from v0.dev/chat/settings/keys

### Example-Specific Variables

Different examples may require:
- `AUTH_SECRET`
- `POSTGRES_URL`
- `AI_GATEWAY_API_KEY`
- `GITHUB_EXPORTER_CLIENT_ID`
- `GITHUB_EXPORTER_CLIENT_SECRET`
- `V0_API_URL` (optional, defaults to https://api.v0.dev/v1)
- Stripe variables (for payment examples)
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET`

See `turbo.json` for full list.

### Setting Environment Variables

Create `.env.local` in example directories:
```bash
V0_API_KEY=your_key_here
# ... other vars
```

---

## Important Files & Directories

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Root package config, scripts, prettier config |
| `pnpm-workspace.yaml` | Workspace configuration |
| `turbo.json` | Turborepo task configuration |
| `tsconfig.json` | Root TypeScript configuration |
| `.changeset/config.json` | Changesets configuration |
| `.husky/pre-commit` | Git pre-commit hook |

### Source Directories

| Directory | Contents |
|-----------|----------|
| `packages/v0-sdk/src/` | Core SDK source |
| `packages/react/src/` | React components & hooks |
| `packages/ai-tools/src/` | AI SDK tools |
| `packages/create-v0-sdk-app/src/` | CLI tool source |

### Test Directories

| Directory | Contents |
|-----------|----------|
| `packages/v0-sdk/tests/` | SDK tests |
| `packages/ai-tools/tests/` | AI tools tests |

### Build Outputs

| Directory | Contents |
|-----------|----------|
| `packages/*/dist/` | Compiled package outputs (gitignored) |
| `.next/` | Next.js build outputs in examples (gitignored) |

### Documentation

| File | Purpose |
|------|---------|
| `README.md` | Repository overview & quick start |
| `CONTRIBUTING.md` | Contribution guidelines |
| `LICENSE` | Apache 2.0 license |
| `.changeset/README.md` | Changesets documentation |

---

## SDK Architecture Details

### Core SDK (`v0-sdk`)

**Main files:**
- `src/sdk/v0.ts` - Generated SDK (43KB+, DO NOT EDIT)
- `src/sdk/core.ts` - Core fetcher implementation
- `src/index.ts` - Public API surface

**Key Exports:**
```typescript
// Client
export { v0, createClient, type V0ClientConfig }

// Streaming
export { parseStreamingResponse, type StreamEvent }

// Types (extensive)
export type {
  ChatDetail, ChatSummary,
  ProjectDetail, ProjectSummary,
  // ... 100+ types
}
```

### React Package (`@v0-sdk/react`)

**Architecture:**
- **Headless components** - Logic without styling
- **Custom hooks** - For building custom UIs
- **Utilities** - Shared helpers

**Pattern:**
```typescript
// Component with hook
export function Message(props: MessageProps) {
  const data = useMessage(props)
  return <div>...</div>
}

// Export both for flexibility
export { Message, useMessage }
```

---

## Quick Reference

### Package Manager Commands

```bash
# Install dependencies
pnpm install

# Add dependency to specific package
pnpm --filter <package-name> add <dependency>

# Run script in specific package
pnpm --filter <package-name> <script>

# Run script in all packages
pnpm <script>
```

### Turborepo Commands

```bash
# Build with dependency graph
pnpm build

# Build with verbose output
pnpm build --verbose

# Force rebuild (skip cache)
pnpm build --force

# Build specific package
pnpm --filter <package-name> build
```

### Common Workflows

**Adding a feature:**
1. Create feature branch
2. Make changes in appropriate package
3. Add/update tests
4. Run `pnpm build && pnpm test`
5. Run `pnpm changeset`
6. Commit & push
7. Open PR

**Fixing a bug:**
1. Add failing test
2. Fix bug
3. Verify test passes
4. Create changeset (patch)
5. Submit PR

**Updating dependencies:**
1. Update `package.json`
2. Run `pnpm install`
3. Test changes
4. Create changeset if user-facing
5. Submit PR

---

## Troubleshooting

### Build Fails

```bash
# Clean and rebuild
pnpm turbo clean
pnpm install
pnpm build
```

### Type Errors

```bash
# Ensure packages are built
pnpm build

# Run type-check
pnpm type-check
```

### Test Failures

```bash
# Rebuild first
pnpm build

# Run tests with verbose output
pnpm --filter <package> test -- --verbose
```

### Workspace Issues

```bash
# Clear all node_modules and reinstall
rm -rf node_modules packages/*/node_modules examples/*/node_modules
pnpm install
```

---

## Additional Resources

- [v0 Documentation](https://v0.dev/docs)
- [v0 API Documentation](https://v0.dev/docs/api)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Changesets Documentation](https://github.com/changesets/changesets)
- [pnpm Documentation](https://pnpm.io/)
- [Vitest Documentation](https://vitest.dev/)

---

## Summary for AI Assistants

When working with this codebase:

✅ **DO:**
- Use `pnpm` for all package management
- Include changesets with every package modification
- Follow existing test organization patterns
- Maintain backward compatibility
- Format code with Prettier
- Build before testing
- Use workspace dependencies for internal packages

❌ **DON'T:**
- Edit generated SDK code (`v0.ts`)
- Skip changesets
- Mix `npm` or `yarn` with `pnpm`
- Add semicolons or double quotes (against prettier config)
- Publish manually (use automated release process)
- Break backward compatibility without major version bump

---

**End of CLAUDE.md**

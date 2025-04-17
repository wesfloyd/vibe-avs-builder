# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build, Lint & Test Commands
- Dev: `pnpm dev` (runs `next dev --turbo`)
- Build: `pnpm build` (runs DB migration then Next.js build)
- Lint: `pnpm lint` (runs Next.js lint + Biome lint)
- Format: `pnpm format` (runs Biome formatter)
- Test: `pnpm test` (runs Playwright tests)
- Single test: `pnpm exec playwright test tests/artifacts.test.ts` (or specific file)

## Code Style Guidelines
- TypeScript with strict mode enabled
- Biome for linting and formatting (2-space indentation)
- React components with Next.js 
- CSS with Tailwind
- Path aliases: import with `@/` prefix
- JSX: Use double quotes, always wrap props in parentheses
- Quotes: Single quotes for JS/TS, double for JSX
- Database: Drizzle ORM with Postgres
- Error handling: Prefer typed errors when possible
- Imports: Group by external dependencies, then internal modules
- Testing: Playwright for integration tests
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JX3 is a game information management system built as a full-stack web application. It manages character info, activities, raids, and loot drops for the JX3 (剑网3) game.

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **Monorepo**: Turborepo with Bun workspaces
- **Frontend** (`apps/web`): React + TanStack Start + Vite + Tailwind CSS v4
- **API** (`apps/api`): Elysia (Bun-native framework)
- **Database** (`packages/db`): PostgreSQL + Drizzle ORM + postgres.js driver
- **Auth** (`packages/auth`): Better Auth (factory pattern, schema exported for db)
- **Linting/Formatting**: Biome (root config inherited by sub-projects)

## Commands

```bash
# Development (runs all apps concurrently)
bun run dev

# Build all packages
bun run build

# Lint and format check
bun run lint
bun run check

# Run tests
bun run test

# Single app dev
bun run --filter @jx3/web dev
bun run --filter @jx3/api dev
```

## Architecture

```
apps/
  web/       — TanStack Start frontend (port 3000), file-based routing in src/routes/
  api/       — Elysia API server, entry at src/index.ts
packages/
  db/        — Drizzle ORM schema, db instance, migrations
  auth/      — Better Auth config (createAuth factory), core schema, auth client
```

## Conventions

- Package names use `@jx3/` namespace
- Biome config: 2-space indent, single quotes, recommended rules
- Sub-projects extend root `biome.json` via `"extends": ["../../biome.json"]`
- Web uses `#/*` path alias mapping to `./src/*`
- API runs with `--watch` in dev mode
- Never use `any` as a type. Use precise types, generics, or `unknown` with type narrowing instead.
- New packages must add `bun-types` to devDependencies and ensure all `.ts` files (including root config files like `drizzle.config.ts`) are in tsconfig's `include` scope. Use `noEmit: true` instead of `outDir`/`rootDir` to avoid path conflicts with config files outside `src/`.

## Commit Format

Use Conventional Commits:

```
<type>(<scope>): <description>
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`

Scope uses package name: `web`, `api`, `db`, `shared`. Use `root` or omit for root-level changes.

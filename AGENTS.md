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
- **Logging** (`packages/logger`): Pino-based structured logging with Elysia plugin
- **JX3 APIs** (`packages/jx3api`): Typed clients for third-party JX3 game data APIs
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

# Typescript type check
bun run typecheck

# Run tests
bun run test

# Single app dev
bun run --filter @jx3/web dev
bun run --filter @jx3/api dev
```

## Before Delivery

After code changes, run from the repo root before marking work complete:

```bash
bun run check
bun run typecheck
```

Fix any Biome or TypeScript failures first. For a single package, use `bun run --filter @jx3/<package> check` and `typecheck`. Run `bun run test` when behavior or tests changed.

## Architecture

```
apps/
  web/       — TanStack Start frontend (port 3000), file-based routing in src/routes/
  api/       — Elysia API server, entry at src/index.ts
packages/
  db/        — Drizzle ORM schema, db instance, migrations
  auth/      — Better Auth config (createAuth factory), core schema, auth client
  logger/    — Pino logger (createLogger)
  jx3api/    — Third-party JX3 API clients (jx3box spider, etc.)
```

## @jx3/jx3api

Third-party JX3 game API integration. Apps must import upstream calls from here,
not fetch external URLs directly.

```
packages/jx3api/src/
  client.ts              — fetchJson helper
  errors.ts              — Jx3ApiError
  providers/<provider>/  — per-upstream folder (config, types, endpoint modules)
```

| Provider | Method | Upstream |
|----------|--------|----------|
| jx3box | `getServerStates()` | `GET spider2.jx3box.com/api/spider/server/server_state` |

See `packages/jx3api/README.md` and `.cursor/rules/jx3api-conventions.mdc` for adding endpoints.

## Logging

Use `@jx3/logger` for all server-side logging. Do not use raw `console.log` in API or web server code.

| Context | Import | Notes |
|---------|--------|-------|
| Elysia API | `@jx3/logger`, `apps/api/src/plugins/logger.ts` | Mount `loggerPlugin` early in `createApp()`; use `log` from handler context or `logger.child({ module })` |
| TanStack Start (server) | `#/lib/logger` | Isomorphic wrapper: Pino on server via `createIsomorphicFn` |
| TanStack Start (client) | `#/lib/logger` | Same import; resolves to `console` on the client bundle |
| Shared packages | `@jx3/logger` | `createLogger('package-name')` or accept a child logger from the caller |

- Set `LOG_LEVEL` to override the default (`debug` in dev, `info` in production).
- Dev output uses `pino-pretty`; production emits JSON to stdout.
- In Elysia handlers, prefer the request-scoped `log` injected by `loggerPlugin`.
- On the web client, import from `#/lib/logger` — never import `@jx3/logger` directly in client code.

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

Scope uses package name: `web`, `api`, `db`, `auth`, `logger`, `jx3api`. Use `root` or omit for root-level changes.

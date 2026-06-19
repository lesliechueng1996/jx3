# JX3

A web application for managing JX3 (剑网3 / Swordsman Online) game information: characters, raid runs, loot drops, and admin maintenance of game metadata (schools, kungfu, servers, expansions, dungeons, items, and more).

## Features

### User-facing

- **My Characters** — Manage personal game characters
- **Create Raid** — Create raid runs, manage sign-ups and loot assignment
- **Raid History** — View past raids you created or joined
- **Profile** — View and edit account information

### Super admin

- User, school, kungfu, and server management
- Expansion, season, and dungeon management
- Game item management (search and sync via third-party APIs)
- Sync server list from JX3Box

### Authentication

- Email and password sign-in
- GitHub OAuth
- Role-based access control (`user` / `admin` / `super_admin`)

## Tech stack

| Layer | Technology |
|-------|------------|
| Runtime | [Bun](https://bun.sh) |
| Monorepo | [Turborepo](https://turbo.build) |
| Frontend | React 19, TanStack Start / Router / Query, Tailwind CSS v4, shadcn/ui |
| Backend | [Elysia](https://elysiajs.com) (Bun-native) |
| Database | PostgreSQL + [Drizzle ORM](https://orm.drizzle.team) |
| Auth | [Better Auth](https://www.better-auth.com) |
| Object storage | Supabase Storage (file uploads) |
| Third-party data | `@jx3/jx3api` (JX3Box, JX3API, etc.) |
| Code quality | Biome (lint + format), TypeScript, Vitest / Bun test |

## Prerequisites

- **Bun** `1.3.14+` (see root `packageManager` field)
- **PostgreSQL** database
- **Supabase** project (optional, for avatar/asset uploads)
- **GitHub OAuth App** (optional, for GitHub sign-in)

## Getting started

### 1. Clone and install

```bash
git clone <repository-url>
cd jx3
bun install
```

### 2. Configure environment variables

Create a `.env` file at the repo root (or inject variables in each app's runtime). Common variables:

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | — |
| `BETTER_AUTH_SECRET` | Yes | Better Auth signing secret | — |
| `BETTER_AUTH_URL` | Yes | Public web URL (with scheme) | `http://localhost:3000` |
| `WEB_ORIGIN` | No | CORS / trusted origin | `http://localhost:3000` |
| `WEB_URL` | No | Web server self-requests | `http://localhost:3000` |
| `API_URL` | No | Upstream API URL for web proxy | `http://localhost:3001` |
| `API_PORT` | No | API listen port | `3001` |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth client ID | — |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth client secret | — |
| `SUPABASE_URL` | No | Supabase project URL | — |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service role key | — |
| `SUPABASE_STORAGE_BUCKET` | No | Storage bucket name | `assets` |
| `LOG_LEVEL` | No | Log level | `debug` in dev, `info` in production |
| `NODE_ENV` | No | Runtime environment | — |

### 3. Initialize the database

```bash
# Apply existing migrations
bun run --filter @jx3/db db:migrate
```

After changing the schema, generate a new migration:

```bash
bun run --filter @jx3/db db:generate
# Review the SQL, then run db:migrate
```

Browse the database locally with Drizzle Studio:

```bash
bun run --filter @jx3/db db:studio
```

### 4. Start development servers

Run frontend and API together:

```bash
bun run dev
```

Or run them separately:

```bash
bun run --filter @jx3/web dev   # http://localhost:3000
bun run --filter @jx3/api dev   # http://localhost:3001
```

### 5. Open the app

| Service | URL |
|---------|-----|
| Web frontend | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger docs | http://localhost:3001/swagger |

The web app proxies `/api/auth/*` and `/api/v1/*` to the API via TanStack Start routes, so browser requests stay same-origin.

## Common commands

From the repo root:

```bash
bun run dev          # Dev mode (all apps)
bun run build        # Build
bun run check        # Biome check
bun run typecheck    # TypeScript type check
bun run test         # Run tests
bun run test:cov     # Tests with coverage
bun run fix          # Auto-fix format/lint issues
```

Filter to a single package:

```bash
bun run --filter @jx3/web dev
bun run --filter @jx3/api test
bun run --filter @jx3/db db:migrate
```

## Project structure

```
apps/
  web/          # TanStack Start frontend (port 3000)
  api/          # Elysia API server (port 3001)
packages/
  db/           # Drizzle schema and migrations
  auth/         # Better Auth config, roles, and permissions
  logger/       # Pino structured logging
  jx3api/       # Third-party JX3 game API clients
```

### API conventions

- Business endpoints: `/api/v1/<resource>`, RESTful style
- Auth endpoints: `/api/auth/*` (Better Auth native paths)
- Request/response validation with Zod; errors use `{ error: { code, message, details? } }`

### Frontend conventions

- File-based routing: `apps/web/src/routes/`
- Route-local components: `-components/` folders (excluded from URL)
- UI copy: Simplified Chinese
- Data fetching: TanStack Query + `/api/v1/*` proxy

See [AGENTS.md](./AGENTS.md) for more development conventions.

## Testing

```bash
# Entire repo
bun run test

# Single package
bun run --filter @jx3/api test
bun run --filter @jx3/web test
bun run --filter @jx3/jx3api test
```

Before shipping changes:

```bash
bun run check
bun run typecheck
```

## Related docs

- [AGENTS.md](./AGENTS.md) — AI / contributor development guide
- [packages/jx3api/README.md](./packages/jx3api/README.md) — Third-party JX3 API integration

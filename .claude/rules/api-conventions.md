---
description: When creating or modifying backend HTTP endpoints in apps/api
paths:
  - apps/api/src/**
---

# Backend API Conventions

## Versioning & RESTful style

- Business resources live under `/api/v1/<resource>` and follow strict REST:
  nouns for paths, HTTP verbs for actions, plural resource names, proper status codes.
- Better Auth native routes under `/api/auth/*` are an explicit exception: they keep
  the library's RPC-style paths (e.g. `/sign-in/email`). Do not rewrite them.

## Validation

- Every business endpoint validates `params` / `query` / `body` / `response` with zod,
  passed to the Elysia route's schema options.
- Reusable schemas live in `apps/api/src/schemas/`.

## Documentation

- Every business endpoint sets `detail` (`tags`, `summary`, `description`) so it appears
  in Swagger at `/swagger`. Group endpoints with consistent tags.

## Errors

- Error responses use the shape `{ error: { code, message, details? } }` via
  `errorResponse()` from `schemas/common.ts`.
- 400 for validation failures (include `details`), 401 for missing/invalid auth.

## Auth

- Protect routes with the `auth: true` macro (`middleware/auth-macro.ts`), which injects
  `user` and `session`. Never read sessions ad hoc inside handlers.

## Structure & testing

- Keep route handlers thin; put mappable/pure logic in `schemas/` or helpers so it is
  unit-testable without a live DB. Inject dependencies (e.g. `getSession`) rather than
  importing singletons into testable units.
- Tests use `bun test` via `app.handle()`. Coverage gate is >= 90%
  (`bunfig.toml`); exclude only bootstrap/wiring files via `coveragePathIgnorePatterns`.

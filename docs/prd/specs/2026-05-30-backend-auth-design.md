# Backend Auth Design (PRD)

- **Date**: 2026-05-30
- **Status**: Approved (design phase)
- **Scope**: First backend API feature for JX3 — authentication (email/password + GitHub SSO)

## 1. Goals

- Build login functionality where the backend API (`apps/api`) is the single source of
  truth for authentication.
- Support two login methods: email + password, and GitHub SSO.
- Use the existing Better Auth setup (`packages/auth`, factory pattern).
- Design the relationship between `apps/api` and the full-stack `apps/web` so future
  mobile/desktop clients can reuse the same backend auth.
- All business endpoints follow strict RESTful style, validate input with zod, and ship
  with Swagger/OpenAPI documentation.
- Establish backend API conventions in `.claude/rules/api-conventions.md`.

## 2. Non-Goals (first version)

- Email verification / password reset / magic links (no email infrastructure yet).
- Admin user-management REST endpoints (admin plugin stays enabled, but no REST wrappers).
- Account-management endpoints beyond `GET /api/v1/me` (sessions list, change password).
- Production-grade web login UI styling (minimal UI to close the login loop only).

## 3. Architecture

```
Browser
  │  (same-origin, httpOnly cookie)
  ▼
apps/web  (TanStack Start, :3000)
  │  (1) pages / SSR
  │  (2) BFF proxy: /api/auth/*  ── forward (cookie pass-through) ──┐
  ▼                                                                 ▼
                                              apps/api  (Elysia, :3001)
                                                │  (3) Better Auth handler /api/auth/*
                                                │  (4) business REST /api/v1/* + swagger
                                                ▼
                                            packages/auth (createAuth)
                                                ▼
                                            packages/db (Postgres)
```

- **API is the auth authority**: all session issue/verify happens in `apps/api`.
- **Web is a BFF**: `apps/web` exposes `/api/auth/*` and forwards to the API, passing
  cookies through and relaying `Set-Cookie` back to the browser. The browser is always
  same-origin; the session cookie is a web-domain httpOnly cookie (XSS cannot read it).
- **Future mobile/desktop**: call the API `/api/auth/*` directly with
  `Authorization: Bearer <token>` via the bearer plugin (no cookies).
- **Port change**: API moves from `3000` to `3001` (web owns 3000).

## 4. packages/auth changes

Enhance the `createAuth(db)` factory:

- `emailAndPassword: { enabled: true }` (no forced email verification).
- `socialProviders.github` with `clientId` / `clientSecret` from env.
- `plugins: [admin(), bearer()]` (bearer added for future non-cookie clients).
- `trustedOrigins`: web origin + API self.
- `baseURL` / `secret` from env.

`packages/auth/src/client.ts` (`authClient`):

- `baseURL` points to web same-origin `/api/auth`.
- Add client plugins for `admin` and `bearer`.

New env vars: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GITHUB_CLIENT_ID`,
`GITHUB_CLIENT_SECRET`, `WEB_ORIGIN`, `API_URL`.

> The bearer plugin does not change table structure. If enabling it produces a
> Better Auth schema diff, follow `.claude/rules/db-migrations.md`: run `db:generate`,
> then migrate **only after explicit user confirmation**.

## 5. apps/api structure

```
apps/api/src/
  index.ts              # assemble Elysia: cors + swagger + auth handler + v1 routes
  lib/auth.ts           # const auth = createAuth(db)
  middleware/
    auth-guard.ts       # resolve session from request, inject user/session; 401 if missing
  routes/
    auth.ts             # mount Better Auth handler: ALL /api/auth/*  (catch-all)
    me.ts               # GET /api/v1/me  (RESTful business endpoint example)
  schemas/
    common.ts           # zod: unified error response, pagination, etc.
```

### Endpoints (first version)

| Method & Path | Description | Docs |
|---|---|---|
| `ALL /api/auth/*` | Better Auth native: email sign-up/in, GitHub SSO, sign-out, get-session | Swagger tag + note, marked as auth exception |
| `GET /api/v1/me` | Current logged-in user; 401 if not authenticated | zod response schema + full swagger |

- **Swagger**: `@elysiajs/swagger` mounted at `/swagger`. Business endpoints use Elysia
  schema (zod validation + auto OpenAPI). Auth native routes get a dedicated tag.
- **CORS**: allow `WEB_ORIGIN`, `credentials: true`.
- **zod**: business endpoints validate params/query/body/response with zod.

## 6. apps/web BFF proxy and login UI

- **Proxy route**: `apps/web/src/routes/api/auth/$.ts` (TanStack Start server route,
  catch-all). Forwards `/api/auth/*` to `${API_URL}/api/auth/*`, passing through
  method/body/headers/cookie and relaying `Set-Cookie`.
- **Login/register page**: `/login` (email+password form + "Sign in with GitHub" button).
  Calls `authClient.signIn.email` / `authClient.signIn.social({ provider: 'github' })` /
  `authClient.signUp.email`. Form validation with zod.
- **Session read**: root route uses `authClient.getSession` or an SSR loader to get the
  current user.

> Web UI is minimal — just enough to exercise the login loop. Styling is out of scope.

## 7. Error handling

- Unified error shape: `{ error: { code, message, details? } }`.
- zod validation failure -> 400 with `details`.
- Not authenticated -> 401.
- Other errors from Better Auth native routes pass through as-is.

## 8. Testing & coverage

- **Runner**: `bun test`.
- **Type**: unit tests.
- **Coverage**: >= 90%, enforced via `bunfig.toml` `[test]`:
  - `coverage = true`
  - `coverageThreshold = 0.9` (build fails below threshold)
  - `coveragePathIgnorePatterns` to exclude files that should not be counted:
    entry/bootstrap files (`src/index.ts`), generated files, type-only modules,
    config files.
  - `coverageSkipTestFiles = true` so test files themselves are not counted.
- **API tests** via Elysia `app.handle()`: register -> login -> access `/api/v1/me`
  with cookie -> logout loop. GitHub SSO depends on an external callback, so only the
  redirect initiation is tested.

## 9. Deliverables

1. This PRD: `docs/prd/specs/2026-05-30-backend-auth-design.md`
2. Backend API conventions: `.claude/rules/api-conventions.md` (RESTful style, zod
   validation, swagger docs, error format, `/api/v1` version prefix, auth exception note).
3. Code: auth enhancement + API + web proxy + login page + tests (>= 90% coverage).

## 10. Open considerations

- GitHub does not issue refresh tokens for OAuth apps; access tokens persist until
  revoked. No refresh handling needed.
- GitHub OAuth redirect URI (dev): `http://localhost:3000/api/auth/callback/github`
  (via the web BFF origin), `user:email` scope required.

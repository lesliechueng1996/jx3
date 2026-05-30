# Backend Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email/password + GitHub SSO login where `apps/api` is the auth authority and `apps/web` proxies auth as a BFF, with zod validation, Swagger docs, and >=90% test coverage.

**Architecture:** `packages/auth` exposes a configured Better Auth factory. `apps/api` (Elysia, :3001) mounts the Better Auth handler at `/api/auth/*` and serves business REST under `/api/v1/*` with zod + Swagger. `apps/web` (TanStack Start, :3000) exposes a catch-all server route that proxies `/api/auth/*` to the API and relays cookies. Logic is split into pure, injectable units so it can be unit-tested without a live database.

**Tech Stack:** Bun, TypeScript, Elysia, @elysiajs/swagger, @elysiajs/cors, Better Auth (admin + bearer plugins), zod, Drizzle, TanStack Start, `bun test`.

**Spec:** `docs/prd/specs/2026-05-30-backend-auth-design.md`

---

## File Structure

**`packages/auth/src/index.ts`** (modify) — `createAuth(db)` with emailAndPassword, GitHub provider, `admin()` + `bearer()` plugins, trustedOrigins.
**`packages/auth/src/client.ts`** (modify) — `authClient` with baseURL + `adminClient()`/`bearer` plugins; reads `set-auth-token`.

**`apps/api/src/lib/auth.ts`** (create) — `export const auth = createAuth(db)`. Wiring only (coverage-excluded).
**`apps/api/src/schemas/common.ts`** (create) — zod error schema + `errorResponse()` helper.
**`apps/api/src/schemas/user.ts`** (create) — zod me-response schema + `toMeResponse(user)` mapper.
**`apps/api/src/middleware/auth-macro.ts`** (create) — `authMacro(getSession)` Elysia macro factory (injectable resolver).
**`apps/api/src/routes/me.ts`** (create) — `GET /api/v1/me` using the macro.
**`apps/api/src/app.ts`** (create) — `createApp({ auth })` assembles cors + swagger + mounted auth handler + v1 routes. Testable via `app.handle()`.
**`apps/api/src/index.ts`** (modify) — bootstrap: `createApp({ auth }).listen(3001)`. Coverage-excluded.
**`apps/api/bunfig.toml`** (create) — `[test]` coverage config (threshold 0.9 + ignore patterns).

**`apps/web/src/lib/proxy.ts`** (create) — `buildUpstreamRequest()` (pure) + `proxyAuth()` forward helper.
**`apps/web/src/routes/api/auth/$.ts`** (create) — catch-all server route delegating to `proxyAuth`.
**`apps/web/src/lib/auth-client.ts`** (create) — re-export configured `authClient` for web.
**`apps/web/src/routes/login.tsx`** (create) — minimal login/register page.

**`.claude/rules/api-conventions.md`** (create) — backend API conventions.

---

## Task 1: Configure Better Auth factory

**Files:**
- Modify: `packages/auth/src/index.ts`
- Modify: `packages/auth/package.json` (add `zod` + `bun-types`, add test script)
- Test: `packages/auth/src/index.test.ts`

- [ ] **Step 1: Add deps and test script to `packages/auth/package.json`**

Add to `dependencies`: `"zod": "^3.24.0"`. Add to `devDependencies`: `"bun-types": "^1.3.14"`.
Add to `scripts`: `"test": "bun test"`. Then run `bun install` from repo root.

- [ ] **Step 2: Write the failing test**

```ts
// packages/auth/src/index.test.ts
import { describe, expect, it } from 'bun:test';
import { createAuth } from './index';

const fakeDb = {} as Parameters<typeof createAuth>[0];

describe('createAuth', () => {
  it('enables email/password and github provider', () => {
    const auth = createAuth(fakeDb);
    expect(auth.options.emailAndPassword?.enabled).toBe(true);
    expect(auth.options.socialProviders?.github).toBeDefined();
  });

  it('exposes a request handler', () => {
    const auth = createAuth(fakeDb);
    expect(typeof auth.handler).toBe('function');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `bun test packages/auth/src/index.test.ts`
Expected: FAIL (github provider undefined / emailAndPassword undefined).

- [ ] **Step 4: Implement the configured factory**

```ts
// packages/auth/src/index.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, bearer } from 'better-auth/plugins';

type DrizzleDB = Parameters<typeof drizzleAdapter>[0];

export const createAuth = (db: DrizzleDB) =>
  betterAuth({
    database: drizzleAdapter(db, { provider: 'pg' }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: [process.env.WEB_ORIGIN ?? 'http://localhost:3000'],
    emailAndPassword: { enabled: true },
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID as string,
        clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      },
    },
    plugins: [admin(), bearer()],
  });

export type Auth = ReturnType<typeof createAuth>;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun test packages/auth/src/index.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/auth/src/index.ts packages/auth/src/index.test.ts packages/auth/package.json bun.lock
git commit -m "feat(auth): configure email/password, github sso, bearer plugin"
```

## Task 2: Configure auth client

**Files:**
- Modify: `packages/auth/src/client.ts`
- Test: `packages/auth/src/client.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/auth/src/client.test.ts
import { describe, expect, it } from 'bun:test';
import { authClient } from './client';

describe('authClient', () => {
  it('exposes email + social sign-in methods', () => {
    expect(typeof authClient.signIn.email).toBe('function');
    expect(typeof authClient.signIn.social).toBe('function');
    expect(typeof authClient.signUp.email).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/auth/src/client.test.ts`
Expected: FAIL (cannot resolve `./client` shape / plugins not set).

- [ ] **Step 3: Implement the configured client**

```ts
// packages/auth/src/client.ts
import { createAuthClient } from 'better-auth/client';
import { adminClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  basePath: '/api/auth',
  plugins: [adminClient()],
  fetchOptions: {
    onSuccess: (ctx) => {
      const token = ctx.response.headers.get('set-auth-token');
      if (token && typeof localStorage !== 'undefined') {
        localStorage.setItem('bearer_token', token);
      }
    },
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/auth/src/client.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add packages/auth/src/client.ts packages/auth/src/client.test.ts
git commit -m "feat(auth): configure auth client with admin plugin and token capture"
```

## Task 3: API zod schemas + helpers

**Files:**
- Create: `apps/api/src/schemas/common.ts`
- Create: `apps/api/src/schemas/user.ts`
- Modify: `apps/api/package.json` (add `zod`, `@jx3/auth`, `@jx3/db` deps + test script)
- Test: `apps/api/src/schemas/common.test.ts`, `apps/api/src/schemas/user.test.ts`

- [ ] **Step 1: Add deps + test script to `apps/api/package.json`**

Add to `dependencies`: `"zod": "^3.24.0"`, `"@jx3/auth": "workspace:*"`, `"@jx3/db": "workspace:*"`.
Add to `scripts`: `"test": "bun test"`, `"test:cov": "bun test --coverage"`. Run `bun install` from root.

- [ ] **Step 2: Write the failing test for common.ts**

```ts
// apps/api/src/schemas/common.test.ts
import { describe, expect, it } from 'bun:test';
import { errorResponse, errorSchema } from './common';

describe('errorResponse', () => {
  it('wraps code and message', () => {
    const body = errorResponse('UNAUTHORIZED', 'Not signed in');
    expect(body).toEqual({ error: { code: 'UNAUTHORIZED', message: 'Not signed in' } });
    expect(errorSchema.safeParse(body).success).toBe(true);
  });

  it('includes details when provided', () => {
    const body = errorResponse('BAD_REQUEST', 'Invalid', { field: 'email' });
    expect(body.error.details).toEqual({ field: 'email' });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `bun test apps/api/src/schemas/common.test.ts`
Expected: FAIL (cannot find module `./common`).

- [ ] **Step 4: Implement common.ts**

```ts
// apps/api/src/schemas/common.ts
import { z } from 'zod';

export const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ErrorResponse = z.infer<typeof errorSchema>;

export const errorResponse = (
  code: string,
  message: string,
  details?: unknown,
): ErrorResponse =>
  details === undefined
    ? { error: { code, message } }
    : { error: { code, message, details } };
```

- [ ] **Step 5: Write the failing test for user.ts**

```ts
// apps/api/src/schemas/user.test.ts
import { describe, expect, it } from 'bun:test';
import { meResponseSchema, toMeResponse } from './user';

const user = {
  id: 'u1',
  name: 'Alice',
  email: 'alice@example.com',
  emailVerified: false,
  image: null,
  role: 'user',
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

describe('toMeResponse', () => {
  it('maps user fields and serializes createdAt', () => {
    const dto = toMeResponse(user);
    expect(dto).toEqual({
      id: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      emailVerified: false,
      image: null,
      role: 'user',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(meResponseSchema.safeParse(dto).success).toBe(true);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `bun test apps/api/src/schemas/user.test.ts`
Expected: FAIL (cannot find module `./user`).

- [ ] **Step 7: Implement user.ts**

```ts
// apps/api/src/schemas/user.ts
import { z } from 'zod';

export const meResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: z.string().nullable(),
  createdAt: z.string(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;

export interface UserLike {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role?: string | null;
  createdAt: Date;
}

export const toMeResponse = (user: UserLike): MeResponse => ({
  id: user.id,
  name: user.name,
  email: user.email,
  emailVerified: user.emailVerified,
  image: user.image ?? null,
  role: user.role ?? null,
  createdAt: user.createdAt.toISOString(),
});
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `bun test apps/api/src/schemas/`
Expected: PASS (3 tests).

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/schemas apps/api/package.json bun.lock
git commit -m "feat(api): add zod error and user response schemas"
```

## Task 4: Auth macro middleware (injectable)

The macro takes a `getSession` function so it can be unit-tested without Better Auth.

**Files:**
- Create: `apps/api/src/middleware/auth-macro.ts`
- Test: `apps/api/src/middleware/auth-macro.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/middleware/auth-macro.test.ts
import { describe, expect, it } from 'bun:test';
import { Elysia } from 'elysia';
import { authMacro } from './auth-macro';

const user = { id: 'u1', name: 'A', email: 'a@e.com', emailVerified: true, createdAt: new Date() };

const makeApp = (session: unknown) =>
  new Elysia()
    .use(authMacro(async () => session as never))
    .get('/protected', ({ user }) => ({ id: user.id }), { auth: true });

describe('authMacro', () => {
  it('returns 401 when no session', async () => {
    const res = await makeApp(null).handle(new Request('http://localhost/protected'));
    expect(res.status).toBe(401);
  });

  it('injects user when session present', async () => {
    const res = await makeApp({ user, session: { id: 's1' } }).handle(
      new Request('http://localhost/protected'),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 'u1' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/api/src/middleware/auth-macro.test.ts`
Expected: FAIL (cannot find module `./auth-macro`).

- [ ] **Step 3: Implement the macro factory**

```ts
// apps/api/src/middleware/auth-macro.ts
import { Elysia } from 'elysia';
import { errorResponse } from '../schemas/common';

interface SessionResult {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    role?: string | null;
    createdAt: Date;
  };
  session: { id: string };
}

type GetSession = (headers: Headers) => Promise<SessionResult | null>;

export const authMacro = (getSession: GetSession) =>
  new Elysia({ name: 'auth-macro' }).macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const result = await getSession(headers);
        if (!result) {
          return status(401, errorResponse('UNAUTHORIZED', 'Authentication required'));
        }
        return { user: result.user, session: result.session };
      },
    },
  });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/api/src/middleware/auth-macro.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/middleware
git commit -m "feat(api): add injectable auth macro for route protection"
```

## Task 5: /api/v1/me route + app assembly

**Files:**
- Create: `apps/api/src/routes/me.ts`
- Create: `apps/api/src/app.ts`
- Test: `apps/api/src/routes/me.test.ts`, `apps/api/src/app.test.ts`

- [ ] **Step 1: Write the failing test for the me route**

```ts
// apps/api/src/routes/me.test.ts
import { describe, expect, it } from 'bun:test';
import { Elysia } from 'elysia';
import { authMacro } from '../middleware/auth-macro';
import { meRoute } from './me';

const user = {
  id: 'u1', name: 'Alice', email: 'alice@example.com',
  emailVerified: false, image: null, role: 'user',
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

const app = (session: unknown) =>
  new Elysia().use(authMacro(async () => session as never)).use(meRoute);

describe('GET /api/v1/me', () => {
  it('401 when unauthenticated', async () => {
    const res = await app(null).handle(new Request('http://localhost/api/v1/me'));
    expect(res.status).toBe(401);
  });

  it('returns current user', async () => {
    const res = await app({ user, session: { id: 's1' } }).handle(
      new Request('http://localhost/api/v1/me'),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: 'u1', email: 'alice@example.com' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/api/src/routes/me.test.ts`
Expected: FAIL (cannot find module `./me`).

- [ ] **Step 3: Implement the me route**

```ts
// apps/api/src/routes/me.ts
import { Elysia } from 'elysia';
import { toMeResponse } from '../schemas/user';

export const meRoute = new Elysia().get(
  '/api/v1/me',
  ({ user }) => toMeResponse(user),
  {
    auth: true,
    detail: {
      tags: ['User'],
      summary: 'Get current authenticated user',
      description: 'Returns the profile of the currently signed-in user. 401 if not authenticated.',
    },
  },
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/api/src/routes/me.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Write the failing test for app assembly**

```ts
// apps/api/src/app.test.ts
import { describe, expect, it } from 'bun:test';
import { createApp } from './app';

const user = {
  id: 'u1', name: 'Alice', email: 'alice@example.com',
  emailVerified: false, image: null, role: 'user',
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

const fakeAuth = {
  handler: (_req: Request) => new Response('auth-ok', { status: 200 }),
  api: { getSession: async () => ({ user, session: { id: 's1' } }) },
} as unknown as Parameters<typeof createApp>[0]['auth'];

describe('createApp', () => {
  it('serves swagger json', async () => {
    const app = createApp({ auth: fakeAuth });
    const res = await app.handle(new Request('http://localhost/swagger/json'));
    expect(res.status).toBe(200);
  });

  it('routes /api/v1/me through the auth macro', async () => {
    const app = createApp({ auth: fakeAuth });
    const res = await app.handle(new Request('http://localhost/api/v1/me'));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: 'u1' });
  });

  it('delegates /api/auth/* to the better-auth handler', async () => {
    const app = createApp({ auth: fakeAuth });
    const res = await app.handle(new Request('http://localhost/api/auth/get-session'));
    expect(await res.text()).toBe('auth-ok');
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `bun test apps/api/src/app.test.ts`
Expected: FAIL (cannot find module `./app`).

- [ ] **Step 7: Implement app assembly**

```ts
// apps/api/src/app.ts
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import type { Auth } from '@jx3/auth';
import { Elysia } from 'elysia';
import { authMacro } from './middleware/auth-macro';
import { meRoute } from './routes/me';

export interface AppDeps {
  auth: Pick<Auth, 'handler' | 'api'>;
}

export const createApp = ({ auth }: AppDeps) =>
  new Elysia()
    .use(
      cors({
        origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
      }),
    )
    .use(
      swagger({
        path: '/swagger',
        documentation: {
          info: { title: 'JX3 API', version: '1.0.0' },
          tags: [
            { name: 'User', description: 'User resources' },
            { name: 'Auth', description: 'Better Auth native routes (RPC-style exception)' },
          ],
        },
      }),
    )
    .all('/api/auth/*', ({ request }) => auth.handler(request))
    .use(authMacro((headers) => auth.api.getSession({ headers })))
    .use(meRoute);

export type App = ReturnType<typeof createApp>;
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `bun test apps/api/src/app.test.ts apps/api/src/routes/me.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/routes apps/api/src/app.ts apps/api/src/app.test.ts
git commit -m "feat(api): add /api/v1/me route and app assembly with swagger"
```

## Task 6: API bootstrap + coverage config

`lib/auth.ts` and `index.ts` are thin wiring; they are coverage-excluded.

**Files:**
- Create: `apps/api/src/lib/auth.ts`
- Modify: `apps/api/src/index.ts`
- Create: `apps/api/bunfig.toml`

- [ ] **Step 1: Create the auth wiring module**

```ts
// apps/api/src/lib/auth.ts
import { createAuth } from '@jx3/auth';
import { db } from '@jx3/db';

export const auth = createAuth(db);
```

- [ ] **Step 2: Replace the bootstrap in index.ts**

```ts
// apps/api/src/index.ts
import { createApp } from './app';
import { auth } from './lib/auth';

const app = createApp({ auth }).listen(Number(process.env.API_PORT ?? 3001));

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
```

- [ ] **Step 3: Create coverage config**

```toml
# apps/api/bunfig.toml
[test]
coverage = true
coverageThreshold = 0.9
coverageSkipTestFiles = true
coveragePathIgnorePatterns = [
  "src/index.ts",
  "src/lib/auth.ts",
  "**/*.test.ts",
]
```

- [ ] **Step 4: Run the full API suite with coverage**

Run (from `apps/api`): `bun test --coverage`
Expected: PASS, coverage table printed, no threshold failure (>= 90%).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/lib/auth.ts apps/api/src/index.ts apps/api/bunfig.toml
git commit -m "feat(api): wire auth instance, bootstrap on :3001, add coverage config"
```

## Task 7: Web BFF proxy helper + route

`proxyRequest` is a pure function (testable); the route file is thin wiring.

**Files:**
- Create: `apps/web/src/lib/proxy.ts`
- Create: `apps/web/src/routes/api/auth/$.ts`
- Test: `apps/web/src/lib/proxy.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/lib/proxy.test.ts
import { describe, expect, it } from 'bun:test';
import { buildUpstreamRequest } from './proxy';

describe('buildUpstreamRequest', () => {
  it('rewrites path to upstream and keeps method + query', () => {
    const incoming = new Request('http://localhost:3000/api/auth/get-session?x=1', {
      method: 'GET',
    });
    const req = buildUpstreamRequest(incoming, 'get-session', 'http://localhost:3001');
    expect(req.url).toBe('http://localhost:3001/api/auth/get-session?x=1');
    expect(req.method).toBe('GET');
  });

  it('preserves cookie header', () => {
    const incoming = new Request('http://localhost:3000/api/auth/x', {
      headers: { cookie: 'session=abc' },
    });
    const req = buildUpstreamRequest(incoming, 'x', 'http://localhost:3001');
    expect(req.headers.get('cookie')).toBe('session=abc');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/web/src/lib/proxy.test.ts`
Expected: FAIL (cannot find module `./proxy`).

- [ ] **Step 3: Implement the proxy helper**

```ts
// apps/web/src/lib/proxy.ts
const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export function buildUpstreamRequest(
  request: Request,
  splat: string,
  apiUrl: string = API_URL,
): Request {
  const incoming = new URL(request.url);
  const target = new URL(`/api/auth/${splat}`, apiUrl);
  target.search = incoming.search;

  return new Request(target, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'manual',
    // duplex is required when streaming a request body
    ...(request.body ? { duplex: 'half' } : {}),
  } as RequestInit);
}

export async function proxyAuth(request: Request, splat: string): Promise<Response> {
  return fetch(buildUpstreamRequest(request, splat));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/web/src/lib/proxy.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Create the catch-all server route**

```ts
// apps/web/src/routes/api/auth/$.ts
import { createFileRoute } from '@tanstack/react-router';
import { proxyAuth } from '#/lib/proxy';

const handle = ({ request, params }: { request: Request; params: { _splat?: string } }) =>
  proxyAuth(request, params._splat ?? '');

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
      OPTIONS: handle,
    },
  },
});
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/proxy.ts apps/web/src/lib/proxy.test.ts apps/web/src/routes/api
git commit -m "feat(web): add BFF proxy for /api/auth/* to backend api"
```

## Task 8: Web auth client + login page

> The >=90% coverage gate applies to the API package (Task 6 `bunfig.toml`). The web login
> UI is minimal scaffolding to close the login loop; only the pure `proxy.ts` helper (Task 7)
> is unit-tested on the web side.

**Files:**
- Create: `apps/web/src/lib/auth-client.ts`
- Create: `apps/web/src/routes/login.tsx`

- [ ] **Step 1: Re-export the configured auth client**

```ts
// apps/web/src/lib/auth-client.ts
export { authClient } from '@jx3/auth/client';
```

- [ ] **Step 2: Add `@jx3/auth` to web deps**

In `apps/web/package.json` add to `dependencies`: `"@jx3/auth": "workspace:*"`.
Run `bun install` from repo root.

- [ ] **Step 3: Create the login page**

```tsx
// apps/web/src/routes/login.tsx
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { type FormEvent, useState } from 'react';
import { z } from 'zod';
import { authClient } from '#/lib/auth-client';

export const Route = createFileRoute('/login')({ component: LoginPage });

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>, mode: 'in' | 'up') {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const parsed = credentials.safeParse({
      email: form.get('email'),
      password: form.get('password'),
    });
    if (!parsed.success) {
      setError('Invalid email or password (min 8 chars)');
      return;
    }
    const fn = mode === 'in' ? authClient.signIn.email : authClient.signUp.email;
    const { error } = await fn(
      mode === 'up' ? { ...parsed.data, name: parsed.data.email } : parsed.data,
    );
    if (error) setError(error.message ?? 'Failed');
    else router.navigate({ to: '/' });
  }

  return (
    <div className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-bold">Sign in</h1>
      {error && <p className="mt-2 text-red-600">{error}</p>}
      <form className="mt-4 flex flex-col gap-2" onSubmit={(e) => onSubmit(e, 'in')}>
        <input name="email" type="email" placeholder="Email" className="border p-2" />
        <input name="password" type="password" placeholder="Password" className="border p-2" />
        <button type="submit" className="bg-black p-2 text-white">Sign in</button>
        <button
          type="button"
          className="border p-2"
          onClick={(e) => onSubmit(e as never, 'up')}
        >
          Sign up
        </button>
      </form>
      <button
        type="button"
        className="mt-4 w-full border p-2"
        onClick={() => authClient.signIn.social({ provider: 'github', callbackURL: '/' })}
      >
        Sign in with GitHub
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Verify the web app type-checks and builds**

Run (from `apps/web`): `bun run check`
Expected: no Biome errors. (If `signUp.email` typing needs `name`, it is already provided.)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/auth-client.ts apps/web/src/routes/login.tsx apps/web/package.json bun.lock
git commit -m "feat(web): add login/register page with email and github sign-in"
```

## Task 9: Backend API conventions rule

**Files:**
- Create: `.claude/rules/api-conventions.md`

- [ ] **Step 1: Write the conventions file**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add .claude/rules/api-conventions.md
git commit -m "docs(api): add backend api conventions rule"
```

## Task 10: Full verification

- [ ] **Step 1: Run all tests with coverage from repo root**

Run: `bun run test`
Expected: all package test suites PASS; API coverage >= 90% (no threshold failure).

- [ ] **Step 2: Lint/format check**

Run: `bun run check`
Expected: no Biome errors across workspaces.

- [ ] **Step 3: Add env vars to `.env`**

Append to root `.env` (fill real GitHub OAuth values):

```
BETTER_AUTH_SECRET=<generate: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
WEB_ORIGIN=http://localhost:3000
API_URL=http://localhost:3001
API_PORT=3001
GITHUB_CLIENT_ID=<from github developer settings>
GITHUB_CLIENT_SECRET=<from github developer settings>
```

GitHub OAuth App callback URL (dev): `http://localhost:3000/api/auth/callback/github`,
scope `user:email`.

- [ ] **Step 4: Manual smoke test (optional, requires DB + env)**

Run `bun run dev`. Visit `http://localhost:3000/login`, sign up with email, confirm
redirect to `/`, then `GET http://localhost:3000/api/auth/get-session` returns the session.
Check Swagger at `http://localhost:3001/swagger`.

> If Better Auth produces a schema diff when bearer is enabled, follow
> `.claude/rules/db-migrations.md`: `db:generate`, then migrate **only after user confirms**.

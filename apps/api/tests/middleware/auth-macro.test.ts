import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { SUPER_ADMIN_ROLE } from '@jx3/auth/roles';
import { Elysia } from 'elysia';

const user = {
  id: 'u1',
  name: 'A',
  email: 'a@e.com',
  emailVerified: true,
  role: 'user',
  createdAt: new Date(),
};

let mockSession: { user: typeof user; session: { id: string } } | null = null;
let getSessionCalls = 0;

mock.module('../../src/lib/auth', () => ({
  auth: {
    api: {
      getSession: async () => {
        getSessionCalls += 1;
        return mockSession;
      },
    },
  },
}));

const { authMacro } = await import('../../src/middleware/auth-macro');

const makeApp = (requiredRole?: string) =>
  new Elysia()
    .use(authMacro)
    .get(
      '/protected',
      ({ user }) => ({ id: user.id, role: user.role }),
      requiredRole ? { auth: requiredRole } : { auth: true },
    );

describe('authMacro', () => {
  beforeEach(() => {
    mockSession = null;
    user.role = 'user';
    getSessionCalls = 0;
  });

  it('returns 401 when no session', async () => {
    const res = await makeApp().handle(
      new Request('http://localhost/protected'),
    );
    expect(res.status).toBe(401);
  });

  it('injects user when session present', async () => {
    mockSession = { user, session: { id: 's1' } };
    const res = await makeApp().handle(
      new Request('http://localhost/protected'),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 'u1', role: 'user' });
  });

  it('returns 401 for role-protected route without session', async () => {
    const res = await makeApp(SUPER_ADMIN_ROLE).handle(
      new Request('http://localhost/protected'),
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 when role does not match', async () => {
    mockSession = { user, session: { id: 's1' } };
    const res = await makeApp(SUPER_ADMIN_ROLE).handle(
      new Request('http://localhost/protected'),
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
    });
  });

  it('allows access when role matches', async () => {
    user.role = SUPER_ADMIN_ROLE;
    mockSession = { user, session: { id: 's1' } };
    const res = await makeApp(SUPER_ADMIN_ROLE).handle(
      new Request('http://localhost/protected'),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 'u1', role: SUPER_ADMIN_ROLE });
  });

  it('resolves session once for role-protected routes', async () => {
    user.role = SUPER_ADMIN_ROLE;
    mockSession = { user, session: { id: 's1' } };
    await makeApp(SUPER_ADMIN_ROLE).handle(
      new Request('http://localhost/protected'),
    );
    expect(getSessionCalls).toBe(1);
  });
});

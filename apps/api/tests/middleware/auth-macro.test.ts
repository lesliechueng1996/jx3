import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const user = {
  id: 'u1',
  name: 'A',
  email: 'a@e.com',
  emailVerified: true,
  createdAt: new Date(),
};

let mockSession: { user: typeof user; session: { id: string } } | null = null;

mock.module('../../src/lib/auth', () => ({
  auth: {
    api: {
      getSession: async () => mockSession,
    },
  },
}));

const { authMacro } = await import('../../src/middleware/auth-macro');

const makeApp = () =>
  new Elysia()
    .use(authMacro)
    .get('/protected', ({ user }) => ({ id: user.id }), { auth: true });

describe('authMacro', () => {
  beforeEach(() => {
    mockSession = null;
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
    expect(await res.json()).toEqual({ id: 'u1' });
  });
});

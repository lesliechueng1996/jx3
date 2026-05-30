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

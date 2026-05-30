import { describe, expect, it } from 'bun:test';
import { Elysia } from 'elysia';
import { authMacro } from '../../src/middleware/auth-macro';
import { toMeResponse } from '../../src/schemas/user';

const user = {
  id: 'u1',
  name: 'Alice',
  email: 'alice@example.com',
  emailVerified: false,
  image: null,
  role: 'user',
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

const app = (session: unknown) =>
  new Elysia()
    .use(authMacro(async () => session as never, 'me-route-test'))
    .get('/api/v1/me', ({ user }) => toMeResponse(user), { auth: true });

describe('GET /api/v1/me', () => {
  it('401 when unauthenticated', async () => {
    const res = await app(null).handle(
      new Request('http://localhost/api/v1/me'),
    );
    expect(res.status).toBe(401);
  });

  it('returns current user', async () => {
    const res = await app({ user, session: { id: 's1' } }).handle(
      new Request('http://localhost/api/v1/me'),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      id: 'u1',
      email: 'alice@example.com',
    });
  });
});

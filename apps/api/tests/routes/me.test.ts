import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const user = {
  id: 'u1',
  name: 'Alice',
  email: 'alice@example.com',
  emailVerified: false,
  image: null,
  role: 'user',
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

let mockSession: { user: typeof user; session: { id: string } } | null = null;

mock.module('../../src/lib/auth', () => ({
  auth: {
    api: {
      getSession: async () => mockSession,
    },
  },
}));

const { meRoute } = await import('../../src/routes/me');

describe('GET /api/v1/me', () => {
  beforeEach(() => {
    mockSession = null;
  });

  it('401 when unauthenticated', async () => {
    const res = await new Elysia()
      .use(meRoute)
      .handle(new Request('http://localhost/api/v1/me'));
    expect(res.status).toBe(401);
  });

  it('returns current user', async () => {
    mockSession = { user, session: { id: 's1' } };
    const res = await new Elysia()
      .use(meRoute)
      .handle(new Request('http://localhost/api/v1/me'));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      id: 'u1',
      email: 'alice@example.com',
    });
  });
});

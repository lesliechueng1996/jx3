import { describe, expect, it } from 'bun:test';
import { createApp } from './app';

const user = {
  id: 'u1',
  name: 'Alice',
  email: 'alice@example.com',
  emailVerified: false,
  image: null,
  role: 'user',
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
    const res = await app.handle(
      new Request('http://localhost/api/auth/get-session'),
    );
    expect(await res.text()).toBe('auth-ok');
  });
});

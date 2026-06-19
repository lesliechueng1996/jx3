import { describe, expect, it, mock } from 'bun:test';

mock.module('../src/lib/auth', () => ({
  auth: {
    handler: (_req: Request) => new Response('auth-ok', { status: 200 }),
    api: { getSession: async () => null },
  },
}));

const app = (await import('../src/index')).default;

describe('index default export', () => {
  it('exports an Elysia app that handles requests', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/auth/get-session'),
    );
    expect(await res.text()).toBe('auth-ok');
  });
});

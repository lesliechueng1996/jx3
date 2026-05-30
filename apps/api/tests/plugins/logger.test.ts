import { describe, expect, it } from 'bun:test';
import { createLogger } from '@jx3/logger';
import { Elysia } from 'elysia';
import { createLoggerPlugin } from '../../src/plugins/logger';

describe('createLoggerPlugin', () => {
  it('logs requests without breaking handlers', async () => {
    const log = createLogger('test-api');
    const app = new Elysia()
      .use(createLoggerPlugin(log))
      .get('/health', () => 'ok');

    const res = await app.handle(new Request('http://localhost/health'));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('ok');
  });

  it('logs failed requests without swallowing errors', async () => {
    const log = createLogger('test-api');
    const app = new Elysia()
      .use(createLoggerPlugin(log))
      .get('/fail', () => {
        throw new Error('boom');
      });

    const res = await app.handle(new Request('http://localhost/fail'));
    expect(res.status).toBe(500);
  });
});

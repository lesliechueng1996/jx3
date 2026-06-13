import { describe, expect, it, mock } from 'bun:test';
import type { Logger } from '@jx3/logger';
import { createLogger } from '@jx3/logger';
import { createLoggerPlugin, loggerPlugin } from '../../src/plugins/logger';

const createMockLogger = () => {
  const info = mock(() => {});
  const error = mock(() => {});
  const childLogger = {
    info,
    error,
    child: mock(() => childLogger),
  };

  return {
    child: mock(() => childLogger),
    info,
    error,
    childLogger,
  };
};

describe('createLoggerPlugin', () => {
  it('logs completed requests on routes registered on the plugin', async () => {
    const baseLogger = createMockLogger();
    const app = createLoggerPlugin(baseLogger as unknown as Logger).get(
      '/health',
      () => 'ok',
    );

    const res = await app.handle(new Request('http://localhost/health'));

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('ok');
    expect(baseLogger.child).toHaveBeenCalled();
    expect(baseLogger.childLogger.info).toHaveBeenCalled();
  });

  it('logs failed requests without swallowing errors', async () => {
    const baseLogger = createMockLogger();
    const app = createLoggerPlugin(baseLogger as unknown as Logger).get(
      '/fail',
      () => {
        throw new Error('boom');
      },
    );

    const res = await app.handle(new Request('http://localhost/fail'));

    expect(res.status).toBe(500);
    expect(baseLogger.childLogger.error).toHaveBeenCalled();
  });

  it('logs successful responses with status metadata', async () => {
    const baseLogger = createMockLogger();
    const app = createLoggerPlugin(baseLogger as unknown as Logger).get(
      '/created',
      ({ set }) => {
        set.status = 201;
        return { ok: true };
      },
    );

    const res = await app.handle(new Request('http://localhost/created'));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    expect(baseLogger.childLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 201,
        durationMs: expect.any(Number),
      }),
      'request completed',
    );
  });

  it('works with the real logger instance', async () => {
    const log = createLogger('test-api');
    const app = createLoggerPlugin(log).get('/health', () => 'ok');
    const res = await app.handle(new Request('http://localhost/health'));

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('ok');
  });
});

describe('loggerPlugin', () => {
  it('exports a default plugin instance', async () => {
    const app = loggerPlugin.get('/ok', () => 'ok');
    const res = await app.handle(new Request('http://localhost/ok'));

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('ok');
  });
});

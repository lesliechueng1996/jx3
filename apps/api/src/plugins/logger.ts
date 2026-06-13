import { type Logger, logger as rootLogger } from '@jx3/logger';
import { Elysia } from 'elysia';

export function createLoggerPlugin(baseLogger: Logger = rootLogger) {
  return new Elysia({ name: 'logger' })
    .derive({ as: 'global' }, ({ request }) => {
      const url = new URL(request.url);
      const startedAt = performance.now();
      const log = baseLogger.child({
        reqId: crypto.randomUUID(),
        method: request.method,
        path: url.pathname,
      });

      return { log, startedAt };
    })
    .onAfterHandle(({ log, set, startedAt }) => {
      log.info(
        {
          status: set.status,
          durationMs: Math.round(performance.now() - startedAt),
        },
        'request completed',
      );
    })
    .onError(({ log, error, startedAt }) => {
      const durationMs =
        startedAt != null
          ? Math.round(performance.now() - startedAt)
          : undefined;
      (log ?? baseLogger).error({ err: error, durationMs }, 'request failed');
    });
}

export const loggerPlugin = createLoggerPlugin();

import { type Logger, logger as rootLogger } from '@jx3/logger';
import { Elysia } from 'elysia';

export function createLoggerPlugin(baseLogger: Logger = rootLogger) {
  return new Elysia({ name: 'logger' })
    .derive({ as: 'global' }, ({ request }) => {
      const url = new URL(request.url);
      const log = baseLogger.child({
        reqId: crypto.randomUUID(),
        method: request.method,
        path: url.pathname,
      });

      return { log };
    })
    .onAfterHandle(({ log, set }) => {
      log.info({ status: set.status }, 'request completed');
    })
    .onError(({ log, error }) => {
      (log ?? baseLogger).error({ err: error }, 'request failed');
    });
}

export const loggerPlugin = createLoggerPlugin();

import { type AppLogger, createLogger as createPinoLogger } from '@jx3/logger';
import { createIsomorphicFn } from '@tanstack/react-start';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

function createConsoleLogger(name: string): AppLogger {
  const write =
    (level: LogLevel) =>
    (first: string | object, second?: string, ...rest: unknown[]) => {
      const output =
        level === 'debug'
          ? console.debug
          : level === 'info'
            ? console.info
            : level === 'warn'
              ? console.warn
              : level === 'error'
                ? console.error
                : console.error;
      const prefix = `[${name}]`;

      if (typeof first === 'string') {
        output(prefix, first, second, ...rest);
        return;
      }

      output(prefix, second ?? '', first, ...rest);
    };

  return {
    level: 'debug',
    debug: write('debug'),
    info: write('info'),
    warn: write('warn'),
    error: write('error'),
    fatal: write('fatal'),
    child: (bindings: Record<string, unknown>) =>
      createConsoleLogger(`${name}:${JSON.stringify(bindings)}`),
  };
}

const resolveLogger = createIsomorphicFn()
  .server((name: string) => createPinoLogger(name))
  .client((name: string) => createConsoleLogger(name));

export function createLogger(name: string): AppLogger {
  return resolveLogger(name);
}

export type { AppLogger };
export const logger = createLogger('web');

import pino, { type Logger, type LoggerOptions } from 'pino';
import pretty from 'pino-pretty';

const isProduction = process.env.NODE_ENV === 'production';

function createDestination() {
  if (isProduction) {
    return undefined;
  }

  return pretty({
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
  });
}

export type { Logger, LoggerOptions } from 'pino';

export type LogFn = (
  first: string | object,
  second?: string,
  ...rest: unknown[]
) => void;

/** Logger surface used by apps; full Pino Logger satisfies this. */
export interface AppLogger {
  level: string;
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  fatal: LogFn;
  child: (bindings: Record<string, unknown>) => AppLogger;
}

export function createLogger(name: string, options?: LoggerOptions): Logger {
  const destination = createDestination();
  const baseOptions: LoggerOptions = {
    name,
    level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
    ...options,
  };

  return destination ? pino(baseOptions, destination) : pino(baseOptions);
}

export const logger = createLogger('jx3');

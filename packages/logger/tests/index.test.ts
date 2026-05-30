import { describe, expect, it } from 'bun:test';
import { createLogger } from '../src/index';

describe('createLogger', () => {
  it('creates a logger with the given name', () => {
    const log = createLogger('test');
    expect(log.level).toBeDefined();
    expect(typeof log.info).toBe('function');
    expect(typeof log.child).toBe('function');
  });

  it('creates child loggers with bindings', () => {
    const log = createLogger('test');
    const child = log.child({ module: 'auth' });
    expect(typeof child.info).toBe('function');
  });
});

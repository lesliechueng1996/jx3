import { describe, expect, it } from 'bun:test';
import { createAuth } from '../src/index';

const fakeDb = {} as Parameters<typeof createAuth>[0];

describe('createAuth', () => {
  it('enables email/password and github provider', () => {
    const auth = createAuth(fakeDb);
    expect(auth.options.emailAndPassword?.enabled).toBe(true);
    expect(auth.options.socialProviders?.github).toBeDefined();
  });

  it('exposes a request handler', () => {
    const auth = createAuth(fakeDb);
    expect(typeof auth.handler).toBe('function');
  });
});

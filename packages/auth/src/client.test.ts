import { describe, expect, it } from 'bun:test';
import { authClient } from './client';

describe('authClient', () => {
  it('exposes email + social sign-in methods', () => {
    expect(typeof authClient.signIn.email).toBe('function');
    expect(typeof authClient.signIn.social).toBe('function');
    expect(typeof authClient.signUp.email).toBe('function');
  });
});

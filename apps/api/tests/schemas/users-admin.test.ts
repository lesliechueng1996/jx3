import { describe, expect, it } from 'bun:test';
import {
  maskEmail,
  normalizeProviders,
} from '../../src/schemas/users-admin';

describe('maskEmail', () => {
  it('masks the local part and keeps the domain', () => {
    expect(maskEmail('alice@example.com')).toBe('a***@example.com');
  });

  it('returns fallback for invalid email', () => {
    expect(maskEmail('invalid')).toBe('***');
  });
});

describe('normalizeProviders', () => {
  it('keeps supported providers only', () => {
    expect(normalizeProviders(['credential', 'github', 'google'])).toEqual([
      'credential',
      'github',
    ]);
  });
});

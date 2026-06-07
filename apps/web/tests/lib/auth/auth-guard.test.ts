import { describe, expect, it } from 'vitest';
import {
  isPublicPath,
  safeRedirectPath,
} from '../../../src/lib/auth/auth-guard';

describe('isPublicPath', () => {
  it('returns true for login and auth API paths', () => {
    expect(isPublicPath('/login')).toBe(true);
    expect(isPublicPath('/api/auth/sign-in')).toBe(true);
  });

  it('returns false for protected paths', () => {
    expect(isPublicPath('/')).toBe(false);
    expect(isPublicPath('/admin/users')).toBe(false);
  });
});

describe('safeRedirectPath', () => {
  it('returns / when redirect is missing or unsafe', () => {
    expect(safeRedirectPath(undefined)).toBe('/');
    expect(safeRedirectPath('')).toBe('/');
    expect(safeRedirectPath('//evil.com')).toBe('/');
    expect(safeRedirectPath('https://evil.com')).toBe('/');
  });

  it('returns safe relative paths', () => {
    expect(safeRedirectPath('/settings')).toBe('/settings');
    expect(safeRedirectPath('/admin/users')).toBe('/admin/users');
  });
});

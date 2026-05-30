import { describe, expect, it } from 'vitest';
import { isPublicPath, safeRedirectPath } from '../../src/lib/auth-guard';

describe('isPublicPath', () => {
  it('allows login and auth api routes', () => {
    expect(isPublicPath('/login')).toBe(true);
    expect(isPublicPath('/login/')).toBe(true);
    expect(isPublicPath('/api/auth/get-session')).toBe(true);
  });

  it('requires auth for app routes', () => {
    expect(isPublicPath('/')).toBe(false);
    expect(isPublicPath('/settings')).toBe(false);
    expect(isPublicPath('/api/v1/me')).toBe(false);
  });
});

describe('safeRedirectPath', () => {
  it('returns / when redirect is missing or unsafe', () => {
    expect(safeRedirectPath(undefined)).toBe('/');
    expect(safeRedirectPath('https://evil.test')).toBe('/');
    expect(safeRedirectPath('//evil.test')).toBe('/');
  });

  it('allows same-origin relative paths', () => {
    expect(safeRedirectPath('/settings')).toBe('/settings');
    expect(safeRedirectPath('/')).toBe('/');
  });
});

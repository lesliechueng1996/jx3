import { describe, expect, it } from 'bun:test';
import { hasRole, SUPER_ADMIN_ROLE } from '../src/roles';

describe('hasRole', () => {
  it('matches exact role', () => {
    expect(hasRole('super_admin', SUPER_ADMIN_ROLE)).toBe(true);
  });

  it('rejects null or undefined role', () => {
    expect(hasRole(null, SUPER_ADMIN_ROLE)).toBe(false);
    expect(hasRole(undefined, SUPER_ADMIN_ROLE)).toBe(false);
  });

  it('rejects mismatched role', () => {
    expect(hasRole('user', SUPER_ADMIN_ROLE)).toBe(false);
  });
});

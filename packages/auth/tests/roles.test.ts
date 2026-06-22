import { describe, expect, it } from 'bun:test';
import {
  ADMIN_ROLE,
  APP_ROLE_LABELS,
  APP_ROLES,
  AUTH_PROVIDER_LABELS,
  hasRole,
  hasStaffRole,
  SUPER_ADMIN_ROLE,
  USER_ROLE,
} from '../src/roles';

describe('roles', () => {
  it('defines app roles and labels', () => {
    expect(APP_ROLES).toEqual([USER_ROLE, ADMIN_ROLE, SUPER_ADMIN_ROLE]);
    expect(APP_ROLE_LABELS[SUPER_ADMIN_ROLE]).toBe('超级管理员');
    expect(AUTH_PROVIDER_LABELS.credential).toBe('密码登录');
  });
});

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

describe('hasStaffRole', () => {
  it('accepts admin and super_admin', () => {
    expect(hasStaffRole(ADMIN_ROLE)).toBe(true);
    expect(hasStaffRole(SUPER_ADMIN_ROLE)).toBe(true);
  });

  it('rejects regular users and missing role', () => {
    expect(hasStaffRole(USER_ROLE)).toBe(false);
    expect(hasStaffRole(null)).toBe(false);
  });
});

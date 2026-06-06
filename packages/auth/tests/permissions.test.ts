import { describe, expect, it } from 'bun:test';
import {
  adminRolePermissions,
  superAdminRolePermissions,
  userRolePermissions,
} from '../src/permissions';

describe('auth role permissions', () => {
  it('grants no admin permissions to regular users', () => {
    expect(userRolePermissions.authorize({ user: ['list'] }).success).toBe(
      false,
    );
  });

  it('reserves business admin permissions for future use', () => {
    expect(adminRolePermissions.authorize({ user: ['list'] }).success).toBe(
      false,
    );
    expect(
      adminRolePermissions.authorize({ session: ['revoke'] }).success,
    ).toBe(false);
  });

  it('grants full admin permissions to super admins', () => {
    expect(
      superAdminRolePermissions.authorize({
        user: ['delete', 'set-role', 'impersonate-admins'],
      }).success,
    ).toBe(true);
    expect(
      superAdminRolePermissions.authorize({ session: ['revoke', 'delete'] })
        .success,
    ).toBe(true);
  });
});

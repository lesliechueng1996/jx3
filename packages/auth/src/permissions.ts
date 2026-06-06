import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';
import { ADMIN_ROLE, SUPER_ADMIN_ROLE, USER_ROLE } from './roles';

const statement = {
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

export const userRolePermissions = ac.newRole({});

// Business admin permissions are not defined yet.
export const adminRolePermissions = ac.newRole({});

// System admin: maps to Better Auth admin capabilities (user management, sessions, etc.).
export const superAdminRolePermissions = ac.newRole({
  ...adminAc.statements,
  user: ['impersonate-admins', ...adminAc.statements.user],
});

export const authRoles = {
  [USER_ROLE]: userRolePermissions,
  [ADMIN_ROLE]: adminRolePermissions,
  [SUPER_ADMIN_ROLE]: superAdminRolePermissions,
} as const;

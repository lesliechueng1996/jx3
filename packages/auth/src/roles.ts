export const USER_ROLE = 'user' as const;
export const ADMIN_ROLE = 'admin' as const;
export const SUPER_ADMIN_ROLE = 'super_admin' as const;

export const APP_ROLES = [USER_ROLE, ADMIN_ROLE, SUPER_ADMIN_ROLE] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  [USER_ROLE]: '普通用户',
  [ADMIN_ROLE]: '管理员',
  [SUPER_ADMIN_ROLE]: '超级管理员',
};

export const AUTH_PROVIDERS = ['credential', 'github'] as const;

export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export const AUTH_PROVIDER_LABELS: Record<AuthProvider, string> = {
  credential: '密码登录',
  github: 'GitHub',
};

export const hasRole = (
  userRole: string | null | undefined,
  requiredRole: string,
): boolean => (userRole ?? null) === requiredRole;

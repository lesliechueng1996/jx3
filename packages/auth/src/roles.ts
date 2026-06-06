export const SUPER_ADMIN_ROLE = 'super_admin' as const;

export type AppRole = typeof SUPER_ADMIN_ROLE | (string & {});

export const hasRole = (
  userRole: string | null | undefined,
  requiredRole: string,
): boolean => (userRole ?? null) === requiredRole;

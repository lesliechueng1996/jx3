import type { APP_ROLES, AuthProvider } from '@jx3/auth/roles';
import { z } from 'zod';
import { buildQueryString } from '#/lib/api/build-query';
import { requestJson } from '#/lib/api/request';

export const adminUserListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  emailMasked: z.string(),
  role: z.string().nullable(),
  banned: z.boolean(),
  banReason: z.string().nullable(),
  banDate: z.string().nullable(),
  lastLoginIp: z.string().nullable(),
  providers: z.array(z.enum(['credential', 'github'])),
  createdAt: z.string(),
});

export type AdminUserListItem = z.infer<typeof adminUserListItemSchema>;

export const listUsersResponseSchema = z.object({
  items: z.array(adminUserListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export type ListUsersResponse = z.infer<typeof listUsersResponseSchema>;

export type ListUsersFilters = {
  page: number;
  pageSize: number;
  name?: string;
  email?: string;
  role?: (typeof APP_ROLES)[number];
  banned?: boolean;
  provider?: AuthProvider;
};

const buildUsersQuery = (filters: ListUsersFilters): string =>
  buildQueryString({
    page: filters.page,
    pageSize: filters.pageSize,
    name: filters.name,
    email: filters.email,
    role: filters.role,
    banned: filters.banned,
    provider: filters.provider,
  });

export const usersAdminApi = {
  list(filters: ListUsersFilters) {
    return requestJson(
      `/api/v1/users?${buildUsersQuery(filters)}`,
      listUsersResponseSchema,
    );
  },
  update(userId: string, body: { name?: string; role?: string }) {
    return requestJson(`/api/v1/users/${userId}`, adminUserListItemSchema, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
  delete(userId: string) {
    return requestJson(
      `/api/v1/users/${userId}`,
      z.object({ success: z.literal(true) }),
      { method: 'DELETE' },
    );
  },
  ban(userId: string, banReason: string) {
    return requestJson(`/api/v1/users/${userId}/ban`, adminUserListItemSchema, {
      method: 'POST',
      body: JSON.stringify({ banReason }),
    });
  },
  unban(userId: string) {
    return requestJson(
      `/api/v1/users/${userId}/unban`,
      adminUserListItemSchema,
      { method: 'POST' },
    );
  },
  revokeSessions(userId: string) {
    return requestJson(
      `/api/v1/users/${userId}/revoke-sessions`,
      z.object({ success: z.literal(true) }),
      { method: 'POST' },
    );
  },
};

export const usersAdminQueryKey = ['admin-users'] as const;

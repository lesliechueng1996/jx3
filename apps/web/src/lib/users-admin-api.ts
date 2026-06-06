import type { APP_ROLES, AuthProvider } from '@jx3/auth/roles';
import { z } from 'zod';

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

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

const parseJson = async <T>(
  response: Response,
  schema: z.ZodType<T>,
): Promise<T> => {
  const payload: unknown = await response.json();
  return schema.parse(payload);
};

const requestJson = async <T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(path, {
    credentials: 'include',
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    try {
      const error = await parseJson(response, errorResponseSchema);
      throw new ApiRequestError(
        response.status,
        error.error.code,
        error.error.message,
      );
    } catch (error) {
      if (error instanceof ApiRequestError) {
        throw error;
      }
      throw new ApiRequestError(
        response.status,
        'REQUEST_FAILED',
        '请求失败',
      );
    }
  }

  return parseJson(response, schema);
};

const buildUsersQuery = (filters: ListUsersFilters): string => {
  const params = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  });

  if (filters.name) {
    params.set('name', filters.name);
  }
  if (filters.email) {
    params.set('email', filters.email);
  }
  if (filters.role) {
    params.set('role', filters.role);
  }
  if (filters.banned !== undefined) {
    params.set('banned', String(filters.banned));
  }
  if (filters.provider) {
    params.set('provider', filters.provider);
  }

  return params.toString();
};

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

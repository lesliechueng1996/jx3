import { APP_ROLES, AUTH_PROVIDERS, type AuthProvider } from '@jx3/auth/roles';
import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  name: z.string().optional(),
  email: z.string().optional(),
  role: z.enum(APP_ROLES).optional(),
  banned: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  provider: z.enum(AUTH_PROVIDERS).optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const adminUserListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  emailMasked: z.string(),
  role: z.string().nullable(),
  banned: z.boolean(),
  banReason: z.string().nullable(),
  banDate: z.string().nullable(),
  lastLoginIp: z.string().nullable(),
  providers: z.array(z.enum(AUTH_PROVIDERS)),
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

export const updateUserBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    role: z.enum(APP_ROLES).optional(),
  })
  .refine((value) => value.name !== undefined || value.role !== undefined, {
    message: 'At least one field must be provided',
  });

export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;

export const updateUserResponseSchema = adminUserListItemSchema;

export const banUserBodySchema = z.object({
  banReason: z.string().trim().min(1).max(500),
});

export type BanUserBody = z.infer<typeof banUserBodySchema>;

export const successResponseSchema = z.object({
  success: z.literal(true),
});

export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) {
    return '***';
  }

  const visible = localPart.slice(0, 1);
  return `${visible}***@${domain}`;
};

export const normalizeProviders = (providerIds: string[]): AuthProvider[] => {
  const normalized = new Set<AuthProvider>();
  for (const providerId of providerIds) {
    if (providerId === 'credential' || providerId === 'github') {
      normalized.add(providerId);
    }
  }
  return [...normalized];
};

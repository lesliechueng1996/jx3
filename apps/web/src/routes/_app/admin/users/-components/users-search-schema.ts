import { APP_ROLES, AUTH_PROVIDERS } from '@jx3/auth/roles';
import { z } from 'zod';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
} from '#/routes/_app/admin/-components/admin-list-search';

const optionalTrimmedString = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  });

const optionalBoolean = z
  .union([z.boolean(), z.literal('true'), z.literal('false')])
  .optional()
  .transform((value) => {
    if (value === true || value === 'true') {
      return true;
    }
    if (value === false || value === 'false') {
      return false;
    }
    return undefined;
  });

export const usersSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(DEFAULT_PAGE),
  pageSize: z.coerce.number().int().min(1).catch(DEFAULT_PAGE_SIZE),
  name: optionalTrimmedString,
  email: optionalTrimmedString,
  role: z.enum(APP_ROLES).optional(),
  banned: optionalBoolean,
  provider: z.enum(AUTH_PROVIDERS).optional(),
});

export type UsersSearch = z.infer<typeof usersSearchSchema>;

export const DEFAULT_USERS_SEARCH: UsersSearch = {
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  name: undefined,
  email: undefined,
  role: undefined,
  banned: undefined,
  provider: undefined,
};

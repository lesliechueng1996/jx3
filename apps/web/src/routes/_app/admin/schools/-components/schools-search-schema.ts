import { z } from 'zod';
import { SCHOOL_TYPES } from '#/lib/api/admin/schools-admin-api';
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

export const schoolsSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(DEFAULT_PAGE),
  pageSize: z.coerce.number().int().min(1).catch(DEFAULT_PAGE_SIZE),
  name: optionalTrimmedString,
  type: z.enum(SCHOOL_TYPES).optional(),
  alias: optionalTrimmedString,
});

export type SchoolsSearch = z.infer<typeof schoolsSearchSchema>;

export const DEFAULT_SCHOOLS_SEARCH: SchoolsSearch = {
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  name: undefined,
  type: undefined,
  alias: undefined,
};

import { z } from 'zod';
import { buildQueryString } from '#/lib/api/build-query';
import { requestJson } from '#/lib/api/request';

export const SCHOOL_TYPES = ['school', 'genre'] as const;

export type SchoolType = (typeof SCHOOL_TYPES)[number];

export const SCHOOL_TYPE_LABELS: Record<SchoolType, string> = {
  school: '门派',
  genre: '流派',
};

export const schoolTypeSchema = z.enum(SCHOOL_TYPES);

export const adminSchoolListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: schoolTypeSchema,
  icon: z.string().nullable(),
  alias: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminSchoolListItem = z.infer<typeof adminSchoolListItemSchema>;

export const listSchoolsResponseSchema = z.object({
  items: z.array(adminSchoolListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export type ListSchoolsResponse = z.infer<typeof listSchoolsResponseSchema>;

export type ListSchoolsFilters = {
  page: number;
  pageSize: number;
  name?: string;
  type?: SchoolType;
  alias?: string;
};

export type SchoolFormValues = {
  name: string;
  type: SchoolType;
  icon: string | null;
  alias: string[];
};

const buildSchoolsQuery = (filters: ListSchoolsFilters): string =>
  buildQueryString({
    page: filters.page,
    pageSize: filters.pageSize,
    name: filters.name,
    type: filters.type,
    alias: filters.alias,
  });

export const schoolsAdminApi = {
  list(filters: ListSchoolsFilters) {
    return requestJson(
      `/api/v1/schools?${buildSchoolsQuery(filters)}`,
      listSchoolsResponseSchema,
    );
  },
  create(body: SchoolFormValues) {
    return requestJson('/api/v1/schools', adminSchoolListItemSchema, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  update(schoolId: string, body: Partial<SchoolFormValues>) {
    return requestJson(
      `/api/v1/schools/${schoolId}`,
      adminSchoolListItemSchema,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    );
  },
  delete(schoolId: string) {
    return requestJson(
      `/api/v1/schools/${schoolId}`,
      z.object({ success: z.literal(true) }),
      { method: 'DELETE' },
    );
  },
};

export const schoolsAdminQueryKey = ['admin-schools'] as const;

export const parseAliasInput = (value: string): string[] =>
  value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

export const formatAliasInput = (alias: string[]): string => alias.join('，');

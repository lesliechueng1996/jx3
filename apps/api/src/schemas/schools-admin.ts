import { z } from 'zod';

export const SCHOOL_TYPES = ['school', 'genre'] as const;

export type SchoolType = (typeof SCHOOL_TYPES)[number];

export const schoolTypeSchema = z.enum(SCHOOL_TYPES);

export const listSchoolsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  name: z.string().optional(),
  type: schoolTypeSchema.optional(),
  alias: z.string().optional(),
});

export type ListSchoolsQuery = z.infer<typeof listSchoolsQuerySchema>;

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

const iconSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

export const createSchoolBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  type: schoolTypeSchema,
  icon: iconSchema,
  alias: z.array(z.string().trim().min(1)).default([]),
});

export type CreateSchoolBody = z.infer<typeof createSchoolBodySchema>;

export const updateSchoolBodySchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    type: schoolTypeSchema.optional(),
    icon: iconSchema,
    alias: z.array(z.string().trim().min(1)).optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.type !== undefined ||
      value.icon !== undefined ||
      value.alias !== undefined,
    { message: 'At least one field must be provided' },
  );

export type UpdateSchoolBody = z.infer<typeof updateSchoolBodySchema>;

export const updateSchoolResponseSchema = adminSchoolListItemSchema;

export const schoolOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type SchoolOption = z.infer<typeof schoolOptionSchema>;

export const listSchoolOptionsResponseSchema = z.object({
  items: z.array(schoolOptionSchema),
});

export type ListSchoolOptionsResponse = z.infer<
  typeof listSchoolOptionsResponseSchema
>;

export const successResponseSchema = z.object({
  success: z.literal(true),
});

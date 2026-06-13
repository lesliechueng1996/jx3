import { z } from 'zod';

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

const optionalDateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

export const adminExpansionListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  level: z.number().int(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminExpansionListItem = z.infer<
  typeof adminExpansionListItemSchema
>;

export const listExpansionsResponseSchema = z.object({
  items: z.array(adminExpansionListItemSchema),
});

export type ListExpansionsResponse = z.infer<
  typeof listExpansionsResponseSchema
>;

export const createExpansionBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
  level: z.number().int().min(1),
  startDate: dateStringSchema,
  endDate: optionalDateStringSchema,
});

export type CreateExpansionBody = z.infer<typeof createExpansionBodySchema>;

export const updateExpansionBodySchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    description: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((value) => (value === undefined ? undefined : value || null)),
    level: z.number().int().min(1).optional(),
    startDate: dateStringSchema.optional(),
    endDate: optionalDateStringSchema,
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined ||
      value.level !== undefined ||
      value.startDate !== undefined ||
      value.endDate !== undefined,
    { message: 'At least one field must be provided' },
  );

export type UpdateExpansionBody = z.infer<typeof updateExpansionBodySchema>;

export const updateExpansionResponseSchema = adminExpansionListItemSchema;

export const successResponseSchema = z.object({
  success: z.literal(true),
});

export const adminExpansionSeasonOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type AdminExpansionSeasonOption = z.infer<
  typeof adminExpansionSeasonOptionSchema
>;

export const adminExpansionFilterOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  seasons: z.array(adminExpansionSeasonOptionSchema),
});

export type AdminExpansionFilterOption = z.infer<
  typeof adminExpansionFilterOptionSchema
>;

export const listExpansionFilterOptionsResponseSchema = z.object({
  items: z.array(adminExpansionFilterOptionSchema),
});

export type ListExpansionFilterOptionsResponse = z.infer<
  typeof listExpansionFilterOptionsResponseSchema
>;

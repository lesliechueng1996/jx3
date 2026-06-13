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

export const adminSeasonListItemSchema = z.object({
  id: z.string(),
  expansionId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminSeasonListItem = z.infer<typeof adminSeasonListItemSchema>;

export const listSeasonsResponseSchema = z.object({
  items: z.array(adminSeasonListItemSchema),
});

export type ListSeasonsResponse = z.infer<typeof listSeasonsResponseSchema>;

export const createSeasonBodySchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    description: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((value) => (value ? value : null)),
    startDate: dateStringSchema,
    endDate: optionalDateStringSchema,
    sortOrder: z.number().int().min(1).optional(),
  })
  .refine((value) => !value.endDate || value.startDate <= value.endDate, {
    message: 'Start date must be on or before end date',
    path: ['endDate'],
  });

export type CreateSeasonBody = z.infer<typeof createSeasonBodySchema>;

export const updateSeasonBodySchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    description: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((value) => (value === undefined ? undefined : value || null)),
    startDate: dateStringSchema.optional(),
    endDate: optionalDateStringSchema,
    sortOrder: z.number().int().min(1).optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined ||
      value.startDate !== undefined ||
      value.endDate !== undefined ||
      value.sortOrder !== undefined,
    { message: 'At least one field must be provided' },
  );

export type UpdateSeasonBody = z.infer<typeof updateSeasonBodySchema>;

export const updateSeasonResponseSchema = adminSeasonListItemSchema;

export const successResponseSchema = z.object({
  success: z.literal(true),
});

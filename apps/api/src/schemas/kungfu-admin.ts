import { z } from 'zod';

export const KUNGFU_TYPES = ['defense', 'heal', 'attack'] as const;
export const ATTACK_TYPES = ['internal', 'external'] as const;
export const ATTACK_METHODS = ['melee', 'ranged'] as const;
export const FORMATION_RECOMMEND_FILTERS = [
  'external',
  'internal',
  'none',
] as const;

export type KungfuType = (typeof KUNGFU_TYPES)[number];
export type AttackType = (typeof ATTACK_TYPES)[number];
export type AttackMethod = (typeof ATTACK_METHODS)[number];
export type FormationRecommendFilter =
  (typeof FORMATION_RECOMMEND_FILTERS)[number];

export const kungfuTypeSchema = z.enum(KUNGFU_TYPES);
export const attackTypeSchema = z.enum(ATTACK_TYPES);
export const attackMethodSchema = z.enum(ATTACK_METHODS);
export const formationRecommendFilterSchema = z.enum(
  FORMATION_RECOMMEND_FILTERS,
);

const optionalBooleanQuery = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => (value === undefined ? undefined : value === 'true'));

export const listKungfuQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  name: z.string().optional(),
  schoolId: z.string().optional(),
  kungfuType: kungfuTypeSchema.optional(),
  attackType: attackTypeSchema.optional(),
  attackMethod: attackMethodSchema.optional(),
  formationRecommend: formationRecommendFilterSchema.optional(),
  isUnlimited: optionalBooleanQuery,
});

export type ListKungfuQuery = z.infer<typeof listKungfuQuerySchema>;

export const adminKungfuListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  schoolId: z.string(),
  schoolName: z.string(),
  kungfuType: kungfuTypeSchema,
  attackType: attackTypeSchema.nullable(),
  attackMethod: attackMethodSchema.nullable(),
  formationName: z.string().nullable(),
  formationEffect: z.string().nullable(),
  isPveExternalRecommended: z.boolean(),
  isPveInternalRecommended: z.boolean(),
  isUnlimited: z.boolean(),
  icon: z.string().nullable(),
  alias: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminKungfuListItem = z.infer<typeof adminKungfuListItemSchema>;

export const listKungfuResponseSchema = z.object({
  items: z.array(adminKungfuListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export type ListKungfuResponse = z.infer<typeof listKungfuResponseSchema>;

const iconSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const formationNameSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const formationEffectSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const nullableAttackTypeSchema = attackTypeSchema
  .optional()
  .nullable()
  .transform((value) => value ?? null);

const nullableAttackMethodSchema = attackMethodSchema
  .optional()
  .nullable()
  .transform((value) => value ?? null);

export const createKungfuBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  schoolId: z.string().uuid(),
  kungfuType: kungfuTypeSchema,
  attackType: nullableAttackTypeSchema,
  attackMethod: nullableAttackMethodSchema,
  formationName: formationNameSchema,
  formationEffect: formationEffectSchema,
  isPveExternalRecommended: z.boolean().default(false),
  isPveInternalRecommended: z.boolean().default(false),
  isUnlimited: z.boolean().default(false),
  icon: iconSchema,
  alias: z.array(z.string().trim().min(1)).default([]),
});

export type CreateKungfuBody = z.infer<typeof createKungfuBodySchema>;

export const updateKungfuBodySchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    schoolId: z.string().uuid().optional(),
    kungfuType: kungfuTypeSchema.optional(),
    attackType: nullableAttackTypeSchema,
    attackMethod: nullableAttackMethodSchema,
    formationName: formationNameSchema,
    formationEffect: formationEffectSchema,
    isPveExternalRecommended: z.boolean().optional(),
    isPveInternalRecommended: z.boolean().optional(),
    isUnlimited: z.boolean().optional(),
    icon: iconSchema,
    alias: z.array(z.string().trim().min(1)).optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.schoolId !== undefined ||
      value.kungfuType !== undefined ||
      value.attackType !== undefined ||
      value.attackMethod !== undefined ||
      value.formationName !== undefined ||
      value.formationEffect !== undefined ||
      value.isPveExternalRecommended !== undefined ||
      value.isPveInternalRecommended !== undefined ||
      value.isUnlimited !== undefined ||
      value.icon !== undefined ||
      value.alias !== undefined,
    { message: 'At least one field must be provided' },
  );

export type UpdateKungfuBody = z.infer<typeof updateKungfuBodySchema>;

export const updateKungfuResponseSchema = adminKungfuListItemSchema;

export const successResponseSchema = z.object({
  success: z.literal(true),
});

export const listKungfuOptionsQuerySchema = z.object({
  schoolId: z.string().uuid().optional(),
});

export type ListKungfuOptionsQuery = z.infer<
  typeof listKungfuOptionsQuerySchema
>;

export const kungfuOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  schoolId: z.string(),
  icon: z.string().nullable(),
});

export type KungfuOption = z.infer<typeof kungfuOptionSchema>;

export const listKungfuOptionsResponseSchema = z.object({
  items: z.array(kungfuOptionSchema),
});

export type ListKungfuOptionsResponse = z.infer<
  typeof listKungfuOptionsResponseSchema
>;

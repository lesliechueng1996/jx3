import { z } from 'zod';

export const DUNGEON_DIFFICULTIES = ['normal', 'heroic', 'challenge'] as const;

export type DungeonDifficulty = (typeof DUNGEON_DIFFICULTIES)[number];

export const dungeonDifficultySchema = z.enum(DUNGEON_DIFFICULTIES);

const resetWeekdaySchema = z.number().int().min(1).max(7);

const resetWeekdaysSchema = z
  .array(resetWeekdaySchema)
  .transform((values) => [...new Set(values)].sort((a, b) => a - b));

export const listDungeonsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  name: z.string().optional(),
  expansionId: z.string().uuid().optional(),
  seasonId: z.string().uuid().optional(),
  difficulty: dungeonDifficultySchema.optional(),
});

export type ListDungeonsQuery = z.infer<typeof listDungeonsQuerySchema>;

export const adminDungeonListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  expansionId: z.string(),
  expansionName: z.string(),
  seasonId: z.string(),
  seasonName: z.string(),
  playerLimit: z.number().int(),
  difficulty: dungeonDifficultySchema,
  levelRequirement: z.number().int(),
  bossCount: z.number().int(),
  resetWeekdays: z.array(z.number().int()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminDungeonListItem = z.infer<typeof adminDungeonListItemSchema>;

export const listDungeonsResponseSchema = z.object({
  items: z.array(adminDungeonListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export type ListDungeonsResponse = z.infer<typeof listDungeonsResponseSchema>;

export const createDungeonBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  expansionId: z.string().uuid(),
  seasonId: z.string().uuid(),
  playerLimit: z.number().int().min(1),
  difficulty: dungeonDifficultySchema,
  levelRequirement: z.number().int().min(1),
  bossCount: z.number().int().min(1),
  resetWeekdays: resetWeekdaysSchema.default([]),
});

export type CreateDungeonBody = z.infer<typeof createDungeonBodySchema>;

export const updateDungeonBodySchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    expansionId: z.string().uuid().optional(),
    seasonId: z.string().uuid().optional(),
    playerLimit: z.number().int().min(1).optional(),
    difficulty: dungeonDifficultySchema.optional(),
    levelRequirement: z.number().int().min(1).optional(),
    bossCount: z.number().int().min(1).optional(),
    resetWeekdays: resetWeekdaysSchema.optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.expansionId !== undefined ||
      value.seasonId !== undefined ||
      value.playerLimit !== undefined ||
      value.difficulty !== undefined ||
      value.levelRequirement !== undefined ||
      value.bossCount !== undefined ||
      value.resetWeekdays !== undefined,
    { message: 'At least one field must be provided' },
  );

export type UpdateDungeonBody = z.infer<typeof updateDungeonBodySchema>;

export const updateDungeonResponseSchema = adminDungeonListItemSchema;

export const successResponseSchema = z.object({
  success: z.literal(true),
});

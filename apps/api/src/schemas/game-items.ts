import { z } from 'zod';

export const ITEM_TYPES = ['equipment', 'special'] as const;
export const ITEM_QUALITIES = [
  'white',
  'green',
  'blue',
  'purple',
  'orange',
] as const;

export const itemTypeSchema = z.enum(ITEM_TYPES);
export const itemQualitySchema = z.enum(ITEM_QUALITIES);

export const searchGameItemsQuerySchema = z.object({
  q: z.string().max(100).default(''),
});

export type SearchGameItemsQuery = z.infer<typeof searchGameItemsQuerySchema>;

export const createGameItemBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  type: itemTypeSchema,
  quality: itemQualitySchema,
  gameItemId: z.string().max(64).nullable().optional(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
});

export type CreateGameItemBody = z.infer<typeof createGameItemBodySchema>;

export const gameItemResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: itemTypeSchema,
  quality: itemQualitySchema,
  gameItemId: z.string().nullable(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  alias: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type GameItemResponse = z.infer<typeof gameItemResponseSchema>;

export const searchGameItemsResponseSchema = z.object({
  items: z.array(gameItemResponseSchema),
});

export type SearchGameItemsResponse = z.infer<
  typeof searchGameItemsResponseSchema
>;

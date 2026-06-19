import { z } from 'zod';
import {
  ITEM_QUALITIES,
  ITEM_TYPES,
  itemQualitySchema,
  itemTypeSchema,
} from './game-items';

export { ITEM_QUALITIES, ITEM_TYPES };

export const listGameItemsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  name: z.string().optional(),
  type: itemTypeSchema.optional(),
  quality: itemQualitySchema.optional(),
  alias: z.string().optional(),
});

export type ListGameItemsQuery = z.infer<typeof listGameItemsQuerySchema>;

export const adminGameItemListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  gameItemId: z.string().nullable(),
  type: itemTypeSchema,
  quality: itemQualitySchema,
  description: z.string().nullable(),
  icon: z.string().nullable(),
  alias: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminGameItemListItem = z.infer<typeof adminGameItemListItemSchema>;

export const listGameItemsResponseSchema = z.object({
  items: z.array(adminGameItemListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export type ListGameItemsResponse = z.infer<typeof listGameItemsResponseSchema>;

const aliasSchema = z.array(z.string().trim().min(1)).default([]);

export const createGameItemAdminBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  type: itemTypeSchema,
  quality: itemQualitySchema,
  gameItemId: z.string().max(64).nullable().optional(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  alias: aliasSchema,
});

export type CreateGameItemAdminBody = z.infer<
  typeof createGameItemAdminBodySchema
>;

export const updateGameItemBodySchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    type: itemTypeSchema.optional(),
    quality: itemQualitySchema.optional(),
    gameItemId: z.string().max(64).nullable().optional(),
    description: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
    alias: aliasSchema.optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.type !== undefined ||
      value.quality !== undefined ||
      value.gameItemId !== undefined ||
      value.description !== undefined ||
      value.icon !== undefined ||
      value.alias !== undefined,
    { message: 'At least one field must be provided' },
  );

export type UpdateGameItemBody = z.infer<typeof updateGameItemBodySchema>;

export const updateGameItemResponseSchema = adminGameItemListItemSchema;

export const successResponseSchema = z.object({
  success: z.literal(true),
});

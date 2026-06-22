import { z } from 'zod';
import { buildQueryString } from '#/lib/api/build-query';
import { requestJson } from '#/lib/api/request';

export const itemTypeSchema = z.enum([
  'equipment',
  'special',
  'small_iron',
  'enchantment',
]);
export const itemQualitySchema = z.enum([
  'white',
  'green',
  'blue',
  'purple',
  'orange',
]);

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

export type CreateGameItemPayload = {
  name: string;
  type: z.infer<typeof itemTypeSchema>;
  quality: z.infer<typeof itemQualitySchema>;
  gameItemId?: string | null;
  description?: string | null;
  icon?: string | null;
};

export const gameItemsApi = {
  search(query: string) {
    const qs = buildQueryString({ q: query });
    return requestJson(
      `/api/v1/game-items/search?${qs}`,
      searchGameItemsResponseSchema,
    );
  },
  create(body: CreateGameItemPayload) {
    return requestJson('/api/v1/game-items', gameItemResponseSchema, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};

export const gameItemsQueryKey = ['game-items'] as const;

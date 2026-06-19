import { z } from 'zod';
import { buildQueryString } from '#/lib/api/build-query';
import { requestJson } from '#/lib/api/request';

export const ITEM_TYPES = ['equipment', 'special'] as const;
export const ITEM_QUALITIES = [
  'white',
  'green',
  'blue',
  'purple',
  'orange',
] as const;

export type ItemType = (typeof ITEM_TYPES)[number];
export type ItemQuality = (typeof ITEM_QUALITIES)[number];

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  equipment: '装备',
  special: '特殊',
};

export const ITEM_QUALITY_LABELS: Record<ItemQuality, string> = {
  white: '白',
  green: '绿',
  blue: '蓝',
  purple: '紫',
  orange: '橙',
};

export const ITEM_QUALITY_CLASS: Record<ItemQuality, string> = {
  white: 'text-muted-foreground',
  green: 'text-green-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  orange: 'text-orange-500',
};

export const itemTypeSchema = z.enum(ITEM_TYPES);
export const itemQualitySchema = z.enum(ITEM_QUALITIES);

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

export type ListGameItemsFilters = {
  page: number;
  pageSize: number;
  name?: string;
  type?: ItemType;
  quality?: ItemQuality;
  alias?: string;
};

export type GameItemFormValues = {
  name: string;
  type: ItemType;
  quality: ItemQuality;
  gameItemId: string | null;
  description: string | null;
  icon: string | null;
  alias: string[];
};

const buildGameItemsQuery = (filters: ListGameItemsFilters): string =>
  buildQueryString({
    page: filters.page,
    pageSize: filters.pageSize,
    name: filters.name,
    type: filters.type,
    quality: filters.quality,
    alias: filters.alias,
  });

export const gameItemsAdminApi = {
  list(filters: ListGameItemsFilters) {
    return requestJson(
      `/api/v1/game-items?${buildGameItemsQuery(filters)}`,
      listGameItemsResponseSchema,
    );
  },
  create(body: GameItemFormValues) {
    return requestJson(
      '/api/v1/game-items/admin',
      adminGameItemListItemSchema,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
  },
  update(itemId: string, body: Partial<GameItemFormValues>) {
    return requestJson(
      `/api/v1/game-items/${itemId}`,
      adminGameItemListItemSchema,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    );
  },
  delete(itemId: string) {
    return requestJson(
      `/api/v1/game-items/${itemId}`,
      z.object({ success: z.literal(true) }),
      { method: 'DELETE' },
    );
  },
};

export const gameItemsAdminQueryKey = ['admin-game-items'] as const;

export const parseAliasInput = (value: string): string[] =>
  value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

export const formatAliasInput = (alias: string[]): string => alias.join('，');

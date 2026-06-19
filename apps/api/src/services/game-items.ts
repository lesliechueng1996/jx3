import { db } from '@jx3/db';
import { gameItem } from '@jx3/db/schema';
import type { Logger } from '@jx3/logger';
import { eq, ilike, or, sql } from 'drizzle-orm';
import type {
  CreateGameItemBody,
  GameItemResponse,
  SearchGameItemsResponse,
} from '../schemas/game-items';
import { resolveGameItemIcon } from './resolve-game-item-icon';

const toGameItemResponse = (
  row: typeof gameItem.$inferSelect,
): GameItemResponse => ({
  id: row.id,
  name: row.name,
  type: row.type,
  quality: row.quality,
  gameItemId: row.gameItemId,
  description: row.description,
  icon: row.icon,
  alias: row.alias,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const searchGameItems = async (
  query: string,
): Promise<SearchGameItemsResponse> => {
  const term = query.trim();
  if (!term) {
    return { items: [] };
  }

  const pattern = `%${term}%`;
  const rows = await db
    .select()
    .from(gameItem)
    .where(
      or(
        ilike(gameItem.name, pattern),
        ilike(sql`array_to_string(${gameItem.alias}, ',')`, pattern),
      ),
    )
    .limit(20);

  return { items: rows.map(toGameItemResponse) };
};

export const createGameItem = async (
  body: CreateGameItemBody,
  options: { logger?: Logger } = {},
): Promise<GameItemResponse> => {
  const icon = await resolveGameItemIcon(body.name.trim(), body.icon, options);

  const [created] = await db
    .insert(gameItem)
    .values({
      name: body.name.trim(),
      type: body.type,
      quality: body.quality,
      gameItemId: body.gameItemId ?? null,
      description: body.description ?? null,
      icon,
    })
    .returning();

  if (!created) {
    throw new Error('Failed to create game item');
  }

  return toGameItemResponse(created);
};

export const getGameItemById = async (itemId: string) => {
  const rows = await db
    .select()
    .from(gameItem)
    .where(eq(gameItem.id, itemId))
    .limit(1);

  return rows[0] ?? null;
};

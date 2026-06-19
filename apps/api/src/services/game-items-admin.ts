import { db } from '@jx3/db';
import { gameItem, raidLoot } from '@jx3/db/schema';
import { and, count, desc, eq, ilike, type SQL, sql } from 'drizzle-orm';
import type {
  AdminGameItemListItem,
  CreateGameItemAdminBody,
  ListGameItemsQuery,
  UpdateGameItemBody,
} from '../schemas/game-items-admin';

const toListItem = (
  row: typeof gameItem.$inferSelect,
): AdminGameItemListItem => ({
  id: row.id,
  name: row.name,
  gameItemId: row.gameItemId,
  type: row.type,
  quality: row.quality,
  description: row.description,
  icon: row.icon,
  alias: row.alias,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const buildWhereClause = (query: ListGameItemsQuery): SQL | undefined => {
  const conditions: SQL[] = [];

  if (query.name) {
    conditions.push(ilike(gameItem.name, `%${query.name}%`));
  }

  if (query.type) {
    conditions.push(eq(gameItem.type, query.type));
  }

  if (query.quality) {
    conditions.push(eq(gameItem.quality, query.quality));
  }

  if (query.alias) {
    conditions.push(
      ilike(sql`array_to_string(${gameItem.alias}, ',')`, `%${query.alias}%`),
    );
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return and(...conditions);
};

export const listAdminGameItems = async (
  query: ListGameItemsQuery,
): Promise<{
  items: AdminGameItemListItem[];
  total: number;
  page: number;
  pageSize: number;
}> => {
  const where = buildWhereClause(query);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(gameItem)
      .where(where)
      .orderBy(desc(gameItem.createdAt))
      .limit(query.pageSize)
      .offset(offset),
    db.select({ total: count() }).from(gameItem).where(where),
  ]);

  return {
    items: rows.map(toListItem),
    total: totalRows[0]?.total ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  };
};

export const getAdminGameItemById = async (
  itemId: string,
): Promise<AdminGameItemListItem | null> => {
  const rows = await db
    .select()
    .from(gameItem)
    .where(eq(gameItem.id, itemId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return toListItem(row);
};

export const createAdminGameItem = async (
  body: CreateGameItemAdminBody,
): Promise<AdminGameItemListItem> => {
  const rows = await db
    .insert(gameItem)
    .values({
      name: body.name,
      type: body.type,
      quality: body.quality,
      gameItemId: body.gameItemId ?? null,
      description: body.description ?? null,
      icon: body.icon ?? null,
      alias: body.alias,
    })
    .returning();

  const row = rows[0];
  if (!row) {
    throw new Error('Failed to create game item');
  }

  return toListItem(row);
};

export const updateAdminGameItem = async (
  itemId: string,
  body: UpdateGameItemBody,
): Promise<AdminGameItemListItem | null> => {
  const rows = await db
    .update(gameItem)
    .set({
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.type !== undefined ? { type: body.type } : {}),
      ...(body.quality !== undefined ? { quality: body.quality } : {}),
      ...(body.gameItemId !== undefined ? { gameItemId: body.gameItemId } : {}),
      ...(body.description !== undefined
        ? { description: body.description }
        : {}),
      ...(body.icon !== undefined ? { icon: body.icon } : {}),
      ...(body.alias !== undefined ? { alias: body.alias } : {}),
    })
    .where(eq(gameItem.id, itemId))
    .returning();

  const row = rows[0];
  if (!row) {
    return null;
  }

  return toListItem(row);
};

export const isGameItemReferenced = async (
  itemId: string,
): Promise<boolean> => {
  const rows = await db
    .select({ id: raidLoot.id })
    .from(raidLoot)
    .where(eq(raidLoot.itemId, itemId))
    .limit(1);

  return rows.length > 0;
};

export const deleteAdminGameItem = async (itemId: string): Promise<boolean> => {
  const rows = await db
    .delete(gameItem)
    .where(eq(gameItem.id, itemId))
    .returning({ id: gameItem.id });

  return rows.length > 0;
};

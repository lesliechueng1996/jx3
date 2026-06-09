import { db } from '@jx3/db';
import { gameDungeon, gameExpansion } from '@jx3/db/schema';
import { desc, eq } from 'drizzle-orm';
import type {
  AdminExpansionListItem,
  CreateExpansionBody,
  UpdateExpansionBody,
} from '../schemas/expansions-admin';

const toListItem = (
  row: typeof gameExpansion.$inferSelect,
): AdminExpansionListItem => ({
  id: row.id,
  name: row.name,
  description: row.description ?? null,
  level: row.level,
  startDate: row.startDate,
  endDate: row.endDate ?? null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const listAdminExpansions = async (): Promise<{
  items: AdminExpansionListItem[];
}> => {
  const rows = await db
    .select()
    .from(gameExpansion)
    .orderBy(desc(gameExpansion.startDate));

  return { items: rows.map(toListItem) };
};

export const getAdminExpansionById = async (
  expansionId: string,
): Promise<AdminExpansionListItem | null> => {
  const rows = await db
    .select()
    .from(gameExpansion)
    .where(eq(gameExpansion.id, expansionId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return toListItem(row);
};

export const createAdminExpansion = async (
  body: CreateExpansionBody,
): Promise<AdminExpansionListItem> => {
  const rows = await db
    .insert(gameExpansion)
    .values({
      name: body.name,
      description: body.description,
      level: body.level,
      startDate: body.startDate,
      endDate: body.endDate,
    })
    .returning();

  const row = rows[0];
  if (!row) {
    throw new Error('Failed to create expansion');
  }

  return toListItem(row);
};

export const updateAdminExpansion = async (
  expansionId: string,
  body: UpdateExpansionBody,
): Promise<AdminExpansionListItem | null> => {
  const rows = await db
    .update(gameExpansion)
    .set({
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined
        ? { description: body.description }
        : {}),
      ...(body.level !== undefined ? { level: body.level } : {}),
      ...(body.startDate !== undefined ? { startDate: body.startDate } : {}),
      ...(body.endDate !== undefined ? { endDate: body.endDate } : {}),
    })
    .where(eq(gameExpansion.id, expansionId))
    .returning();

  const row = rows[0];
  if (!row) {
    return null;
  }

  return toListItem(row);
};

export const isExpansionReferenced = async (
  expansionId: string,
): Promise<boolean> => {
  const rows = await db
    .select({ id: gameDungeon.id })
    .from(gameDungeon)
    .where(eq(gameDungeon.expansionId, expansionId))
    .limit(1);

  return rows.length > 0;
};

export const deleteAdminExpansion = async (
  expansionId: string,
): Promise<boolean> => {
  const rows = await db
    .delete(gameExpansion)
    .where(eq(gameExpansion.id, expansionId))
    .returning({ id: gameExpansion.id });

  return rows.length > 0;
};

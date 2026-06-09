import { db } from '@jx3/db';
import { gameCharacter, gameServer, raidSignup } from '@jx3/db/schema';
import { and, asc, eq, ne } from 'drizzle-orm';
import type {
  AdminGameServerListItem,
  CreateGameServerBody,
  UpdateGameServerBody,
} from '../schemas/game-servers-admin';

const toListItem = (
  row: typeof gameServer.$inferSelect,
): AdminGameServerListItem => ({
  id: row.id,
  serverId: row.serverId,
  zone: row.zone,
  name: row.name,
  alias: row.alias,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const listAdminGameServers = async (): Promise<{
  items: AdminGameServerListItem[];
}> => {
  const rows = await db
    .select()
    .from(gameServer)
    .orderBy(asc(gameServer.zone), asc(gameServer.name));

  return { items: rows.map(toListItem) };
};

export const getAdminGameServerById = async (
  id: string,
): Promise<AdminGameServerListItem | null> => {
  const rows = await db
    .select()
    .from(gameServer)
    .where(eq(gameServer.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return toListItem(row);
};

export const createAdminGameServer = async (
  body: CreateGameServerBody,
): Promise<AdminGameServerListItem> => {
  const rows = await db
    .insert(gameServer)
    .values({
      serverId: body.serverId,
      zone: body.zone,
      name: body.name,
      alias: body.alias,
    })
    .returning();

  const row = rows[0];
  if (!row) {
    throw new Error('Failed to create game server');
  }

  return toListItem(row);
};

export const updateAdminGameServer = async (
  id: string,
  body: UpdateGameServerBody,
): Promise<AdminGameServerListItem | null> => {
  const rows = await db
    .update(gameServer)
    .set({
      ...(body.serverId !== undefined ? { serverId: body.serverId } : {}),
      ...(body.zone !== undefined ? { zone: body.zone } : {}),
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.alias !== undefined ? { alias: body.alias } : {}),
    })
    .where(eq(gameServer.id, id))
    .returning();

  const row = rows[0];
  if (!row) {
    return null;
  }

  return toListItem(row);
};

export const isGameServerReferenced = async (id: string): Promise<boolean> => {
  const [characterRows, signupRows] = await Promise.all([
    db
      .select({ id: gameCharacter.id })
      .from(gameCharacter)
      .where(eq(gameCharacter.serverId, id))
      .limit(1),
    db
      .select({ id: raidSignup.id })
      .from(raidSignup)
      .where(eq(raidSignup.serverId, id))
      .limit(1),
  ]);

  return characterRows.length > 0 || signupRows.length > 0;
};

export const deleteAdminGameServer = async (id: string): Promise<boolean> => {
  const rows = await db
    .delete(gameServer)
    .where(eq(gameServer.id, id))
    .returning({ id: gameServer.id });

  return rows.length > 0;
};

export const isDuplicateGameServerId = async (
  serverId: string,
  excludeId?: string,
): Promise<boolean> => {
  const conditions = [eq(gameServer.serverId, serverId)];
  if (excludeId) {
    conditions.push(ne(gameServer.id, excludeId));
  }

  const rows = await db
    .select({ id: gameServer.id })
    .from(gameServer)
    .where(and(...conditions))
    .limit(1);

  return rows.length > 0;
};

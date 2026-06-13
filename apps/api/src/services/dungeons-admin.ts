import { db } from '@jx3/db';
import {
  gameDungeon,
  gameExpansion,
  gameSeason,
  raidRun,
} from '@jx3/db/schema';
import { and, count, desc, eq, ilike, type SQL } from 'drizzle-orm';
import type {
  AdminDungeonListItem,
  CreateDungeonBody,
  ListDungeonsQuery,
  UpdateDungeonBody,
} from '../schemas/dungeons-admin';
import { getAdminExpansionById } from './expansions-admin';
import { getAdminSeasonById } from './seasons-admin';

export class DungeonValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DungeonValidationError';
  }
}

type DungeonRow = typeof gameDungeon.$inferSelect & {
  expansionName: string;
  seasonName: string;
};

const toListItem = (row: DungeonRow): AdminDungeonListItem => ({
  id: row.id,
  name: row.name,
  expansionId: row.expansionId,
  expansionName: row.expansionName,
  seasonId: row.seasonId,
  seasonName: row.seasonName,
  playerLimit: row.playerLimit,
  difficulty: row.difficulty,
  levelRequirement: row.levelRequirement,
  bossCount: row.bossCount,
  resetWeekdays: row.resetWeekdays,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const buildWhereClause = (query: ListDungeonsQuery): SQL | undefined => {
  const conditions: SQL[] = [];

  if (query.name) {
    conditions.push(ilike(gameDungeon.name, `%${query.name}%`));
  }

  if (query.expansionId) {
    conditions.push(eq(gameDungeon.expansionId, query.expansionId));
  }

  if (query.seasonId) {
    conditions.push(eq(gameDungeon.seasonId, query.seasonId));
  }

  if (query.difficulty) {
    conditions.push(eq(gameDungeon.difficulty, query.difficulty));
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return and(...conditions);
};

const selectDungeonWithRelations = () =>
  db
    .select({
      id: gameDungeon.id,
      name: gameDungeon.name,
      expansionId: gameDungeon.expansionId,
      expansionName: gameExpansion.name,
      seasonId: gameDungeon.seasonId,
      seasonName: gameSeason.name,
      playerLimit: gameDungeon.playerLimit,
      difficulty: gameDungeon.difficulty,
      levelRequirement: gameDungeon.levelRequirement,
      bossCount: gameDungeon.bossCount,
      resetWeekdays: gameDungeon.resetWeekdays,
      createdAt: gameDungeon.createdAt,
      updatedAt: gameDungeon.updatedAt,
    })
    .from(gameDungeon)
    .innerJoin(gameExpansion, eq(gameDungeon.expansionId, gameExpansion.id))
    .innerJoin(gameSeason, eq(gameDungeon.seasonId, gameSeason.id));

const assertSeasonBelongsToExpansion = async (
  expansionId: string,
  seasonId: string,
): Promise<void> => {
  const season = await getAdminSeasonById(expansionId, seasonId);
  if (!season) {
    throw new DungeonValidationError(
      'Season not found or does not belong to the selected expansion',
    );
  }
};

const validateExpansionAndSeason = async (
  expansionId: string,
  seasonId: string,
): Promise<void> => {
  const expansion = await getAdminExpansionById(expansionId);
  if (!expansion) {
    throw new DungeonValidationError('Expansion not found');
  }

  await assertSeasonBelongsToExpansion(expansionId, seasonId);
};

export const listAdminDungeons = async (
  query: ListDungeonsQuery,
): Promise<{
  items: AdminDungeonListItem[];
  total: number;
  page: number;
  pageSize: number;
}> => {
  const where = buildWhereClause(query);
  const offset = (query.page - 1) * query.pageSize;

  const [rows, totalRows] = await Promise.all([
    selectDungeonWithRelations()
      .where(where)
      .orderBy(desc(gameDungeon.createdAt))
      .limit(query.pageSize)
      .offset(offset),
    db.select({ total: count() }).from(gameDungeon).where(where),
  ]);

  return {
    items: rows.map(toListItem),
    total: totalRows[0]?.total ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  };
};

export const getAdminDungeonById = async (
  dungeonId: string,
): Promise<AdminDungeonListItem | null> => {
  const rows = await selectDungeonWithRelations()
    .where(eq(gameDungeon.id, dungeonId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return toListItem(row);
};

export const createAdminDungeon = async (
  body: CreateDungeonBody,
): Promise<AdminDungeonListItem> => {
  await validateExpansionAndSeason(body.expansionId, body.seasonId);

  const rows = await db
    .insert(gameDungeon)
    .values({
      name: body.name,
      expansionId: body.expansionId,
      seasonId: body.seasonId,
      playerLimit: body.playerLimit,
      difficulty: body.difficulty,
      levelRequirement: body.levelRequirement,
      bossCount: body.bossCount,
      resetWeekdays: body.resetWeekdays,
    })
    .returning({ id: gameDungeon.id });

  const row = rows[0];
  if (!row) {
    throw new Error('Failed to create dungeon');
  }

  const created = await getAdminDungeonById(row.id);
  if (!created) {
    throw new Error('Failed to load created dungeon');
  }

  return created;
};

export const updateAdminDungeon = async (
  dungeonId: string,
  body: UpdateDungeonBody,
): Promise<AdminDungeonListItem | null> => {
  const existing = await getAdminDungeonById(dungeonId);
  if (!existing) {
    return null;
  }

  const nextExpansionId = body.expansionId ?? existing.expansionId;
  const nextSeasonId = body.seasonId ?? existing.seasonId;

  if (body.expansionId !== undefined || body.seasonId !== undefined) {
    await validateExpansionAndSeason(nextExpansionId, nextSeasonId);
  }

  const rows = await db
    .update(gameDungeon)
    .set({
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.expansionId !== undefined
        ? { expansionId: body.expansionId }
        : {}),
      ...(body.seasonId !== undefined ? { seasonId: body.seasonId } : {}),
      ...(body.playerLimit !== undefined
        ? { playerLimit: body.playerLimit }
        : {}),
      ...(body.difficulty !== undefined ? { difficulty: body.difficulty } : {}),
      ...(body.levelRequirement !== undefined
        ? { levelRequirement: body.levelRequirement }
        : {}),
      ...(body.bossCount !== undefined ? { bossCount: body.bossCount } : {}),
      ...(body.resetWeekdays !== undefined
        ? { resetWeekdays: body.resetWeekdays }
        : {}),
    })
    .where(eq(gameDungeon.id, dungeonId))
    .returning({ id: gameDungeon.id });

  const row = rows[0];
  if (!row) {
    return null;
  }

  return getAdminDungeonById(row.id);
};

export const isDungeonReferenced = async (
  dungeonId: string,
): Promise<boolean> => {
  const rows = await db
    .select({ id: raidRun.id })
    .from(raidRun)
    .where(eq(raidRun.dungeonId, dungeonId))
    .limit(1);

  return rows.length > 0;
};

export const deleteAdminDungeon = async (
  dungeonId: string,
): Promise<boolean> => {
  const rows = await db
    .delete(gameDungeon)
    .where(eq(gameDungeon.id, dungeonId))
    .returning({ id: gameDungeon.id });

  return rows.length > 0;
};

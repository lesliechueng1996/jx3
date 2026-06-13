import { db } from '@jx3/db';
import { gameDungeon, gameSeason } from '@jx3/db/schema';
import { and, asc, desc, eq, max } from 'drizzle-orm';
import type {
  AdminSeasonListItem,
  CreateSeasonBody,
  UpdateSeasonBody,
} from '../schemas/seasons-admin';
import { getAdminExpansionById } from './expansions-admin';

export class SeasonValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeasonValidationError';
  }
}

const toListItem = (
  row: typeof gameSeason.$inferSelect,
): AdminSeasonListItem => ({
  id: row.id,
  expansionId: row.expansionId,
  name: row.name,
  description: row.description ?? null,
  startDate: row.startDate,
  endDate: row.endDate ?? null,
  sortOrder: row.sortOrder,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const assertSeasonDatesWithinExpansion = (
  expansion: { startDate: string; endDate: string | null },
  season: { startDate: string; endDate: string | null },
): void => {
  if (season.startDate < expansion.startDate) {
    throw new SeasonValidationError(
      'Season start date must be within expansion date range',
    );
  }

  if (expansion.endDate && season.startDate > expansion.endDate) {
    throw new SeasonValidationError(
      'Season start date must be within expansion date range',
    );
  }

  if (season.endDate) {
    if (season.endDate < season.startDate) {
      throw new SeasonValidationError(
        'Season end date must be on or after start date',
      );
    }

    if (season.endDate < expansion.startDate) {
      throw new SeasonValidationError(
        'Season end date must be within expansion date range',
      );
    }

    if (expansion.endDate && season.endDate > expansion.endDate) {
      throw new SeasonValidationError(
        'Season end date must be within expansion date range',
      );
    }
  }
};

const resolveNextSortOrder = async (expansionId: string): Promise<number> => {
  const rows = await db
    .select({ maxSortOrder: max(gameSeason.sortOrder) })
    .from(gameSeason)
    .where(eq(gameSeason.expansionId, expansionId));

  const currentMax = rows[0]?.maxSortOrder;
  return currentMax === null || currentMax === undefined ? 1 : currentMax + 1;
};

export const listAdminSeasons = async (
  expansionId: string,
): Promise<{ items: AdminSeasonListItem[] }> => {
  const rows = await db
    .select()
    .from(gameSeason)
    .where(eq(gameSeason.expansionId, expansionId))
    .orderBy(asc(gameSeason.sortOrder), desc(gameSeason.startDate));

  return { items: rows.map(toListItem) };
};

export const getAdminSeasonById = async (
  expansionId: string,
  seasonId: string,
): Promise<AdminSeasonListItem | null> => {
  const rows = await db
    .select()
    .from(gameSeason)
    .where(
      and(eq(gameSeason.id, seasonId), eq(gameSeason.expansionId, expansionId)),
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return toListItem(row);
};

export const createAdminSeason = async (
  expansionId: string,
  body: CreateSeasonBody,
): Promise<AdminSeasonListItem> => {
  const expansion = await getAdminExpansionById(expansionId);
  if (!expansion) {
    throw new SeasonValidationError('Expansion not found');
  }

  assertSeasonDatesWithinExpansion(expansion, {
    startDate: body.startDate,
    endDate: body.endDate,
  });

  const sortOrder = body.sortOrder ?? (await resolveNextSortOrder(expansionId));

  const rows = await db
    .insert(gameSeason)
    .values({
      expansionId,
      name: body.name,
      description: body.description,
      startDate: body.startDate,
      endDate: body.endDate,
      sortOrder,
    })
    .returning();

  const row = rows[0];
  if (!row) {
    throw new Error('Failed to create season');
  }

  return toListItem(row);
};

export const updateAdminSeason = async (
  expansionId: string,
  seasonId: string,
  body: UpdateSeasonBody,
): Promise<AdminSeasonListItem | null> => {
  const existing = await getAdminSeasonById(expansionId, seasonId);
  if (!existing) {
    return null;
  }

  const expansion = await getAdminExpansionById(expansionId);
  if (!expansion) {
    throw new SeasonValidationError('Expansion not found');
  }

  const nextDates = {
    startDate: body.startDate ?? existing.startDate,
    endDate: body.endDate !== undefined ? body.endDate : existing.endDate,
  };

  assertSeasonDatesWithinExpansion(expansion, nextDates);

  const rows = await db
    .update(gameSeason)
    .set({
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined
        ? { description: body.description }
        : {}),
      ...(body.startDate !== undefined ? { startDate: body.startDate } : {}),
      ...(body.endDate !== undefined ? { endDate: body.endDate } : {}),
      ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
    })
    .where(
      and(eq(gameSeason.id, seasonId), eq(gameSeason.expansionId, expansionId)),
    )
    .returning();

  const row = rows[0];
  if (!row) {
    return null;
  }

  return toListItem(row);
};

export const isSeasonReferenced = async (
  seasonId: string,
): Promise<boolean> => {
  const rows = await db
    .select({ id: gameDungeon.id })
    .from(gameDungeon)
    .where(eq(gameDungeon.seasonId, seasonId))
    .limit(1);

  return rows.length > 0;
};

export const deleteAdminSeason = async (
  expansionId: string,
  seasonId: string,
): Promise<boolean> => {
  const rows = await db
    .delete(gameSeason)
    .where(
      and(eq(gameSeason.id, seasonId), eq(gameSeason.expansionId, expansionId)),
    )
    .returning({ id: gameSeason.id });

  return rows.length > 0;
};

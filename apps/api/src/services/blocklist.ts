import { user } from '@jx3/auth/schema';
import { db } from '@jx3/db';
import {
  gameSchool,
  gameServer,
  playerBlocklist,
  raidBrandBlocklist,
  raidRun,
  raidSignup,
} from '@jx3/db/schema';
import { and, asc, eq, ilike, inArray } from 'drizzle-orm';
import type {
  CreatePlayerBlocklistBody,
  CreateRaidBrandBlocklistBody,
  ListBlocklistQuery,
  PlayerBlocklistItem,
  RaidBrandBlocklistItem,
  RaidRunBlocklistCheckResponse,
} from '../schemas/blocklist';
import { matchSignupsAgainstBlocklist } from './blocklist-matching';
import { RaidRunForbiddenError } from './raid-run-errors';

export class BlocklistConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlocklistConflictError';
  }
}

export class BlocklistValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlocklistValidationError';
  }
}

const normalizeName = (value: string): string => value.trim();

const toRaidBrandBlocklistItem = (
  row: typeof raidBrandBlocklist.$inferSelect,
  createdByName: string,
): RaidBrandBlocklistItem => ({
  id: row.id,
  name: row.name,
  remark: row.remark,
  createdBy: row.createdBy,
  createdByName,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const toPlayerBlocklistItem = (
  row: typeof playerBlocklist.$inferSelect,
  serverName: string,
  schoolName: string | null,
  createdByName: string,
): PlayerBlocklistItem => ({
  id: row.id,
  characterName: row.characterName,
  serverId: row.serverId,
  serverName,
  schoolId: row.schoolId,
  schoolName,
  remark: row.remark,
  createdBy: row.createdBy,
  createdByName,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const getUserNamesByIds = async (
  userIds: string[],
): Promise<Map<string, string>> => {
  if (userIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(inArray(user.id, userIds));

  return new Map(rows.map((row) => [row.id, row.name]));
};

const assertServerExists = async (serverId: string): Promise<void> => {
  const [server] = await db
    .select({ id: gameServer.id })
    .from(gameServer)
    .where(eq(gameServer.id, serverId))
    .limit(1);

  if (!server) {
    throw new BlocklistValidationError('serverId is invalid');
  }
};

const assertSchoolExists = async (schoolId: string): Promise<void> => {
  const [school] = await db
    .select({ id: gameSchool.id })
    .from(gameSchool)
    .where(eq(gameSchool.id, schoolId))
    .limit(1);

  if (!school) {
    throw new BlocklistValidationError('schoolId is invalid');
  }
};

export const listRaidBrandBlocklist = async (
  query: ListBlocklistQuery,
): Promise<{ items: RaidBrandBlocklistItem[] }> => {
  const term = query.q?.trim();
  const rows = await db
    .select()
    .from(raidBrandBlocklist)
    .where(term ? ilike(raidBrandBlocklist.name, `%${term}%`) : undefined)
    .orderBy(asc(raidBrandBlocklist.name));

  const userNames = await getUserNamesByIds([
    ...new Set(rows.map((row) => row.createdBy)),
  ]);

  return {
    items: rows.map((row) =>
      toRaidBrandBlocklistItem(row, userNames.get(row.createdBy) ?? '未知用户'),
    ),
  };
};

export const createRaidBrandBlocklistEntry = async (
  userId: string,
  body: CreateRaidBrandBlocklistBody,
): Promise<RaidBrandBlocklistItem> => {
  const name = normalizeName(body.name);
  if (!name) {
    throw new BlocklistValidationError('name is required');
  }

  const [existing] = await db
    .select({ id: raidBrandBlocklist.id })
    .from(raidBrandBlocklist)
    .where(eq(raidBrandBlocklist.name, name))
    .limit(1);

  if (existing) {
    throw new BlocklistConflictError('This raid brand is already blocklisted');
  }

  const [created] = await db
    .insert(raidBrandBlocklist)
    .values({
      name,
      remark: body.remark?.trim() || null,
      createdBy: userId,
    })
    .returning();

  if (!created) {
    throw new Error('Failed to create raid brand blocklist entry');
  }

  const userNames = await getUserNamesByIds([userId]);
  return toRaidBrandBlocklistItem(created, userNames.get(userId) ?? '未知用户');
};

export const deleteRaidBrandBlocklistEntry = async (
  id: string,
): Promise<boolean> => {
  const [deleted] = await db
    .delete(raidBrandBlocklist)
    .where(eq(raidBrandBlocklist.id, id))
    .returning({ id: raidBrandBlocklist.id });

  return Boolean(deleted);
};

export const listPlayerBlocklist = async (
  query: ListBlocklistQuery,
): Promise<{ items: PlayerBlocklistItem[] }> => {
  const term = query.q?.trim();
  const conditions = [];

  if (term) {
    conditions.push(ilike(playerBlocklist.characterName, `%${term}%`));
  }

  if (query.serverId) {
    conditions.push(eq(playerBlocklist.serverId, query.serverId));
  }

  const rows = await db
    .select({
      entry: playerBlocklist,
      serverName: gameServer.name,
      schoolName: gameSchool.name,
    })
    .from(playerBlocklist)
    .innerJoin(gameServer, eq(playerBlocklist.serverId, gameServer.id))
    .leftJoin(gameSchool, eq(playerBlocklist.schoolId, gameSchool.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(playerBlocklist.characterName), asc(gameServer.name));

  const userNames = await getUserNamesByIds([
    ...new Set(rows.map((row) => row.entry.createdBy)),
  ]);

  return {
    items: rows.map((row) =>
      toPlayerBlocklistItem(
        row.entry,
        row.serverName,
        row.schoolName,
        userNames.get(row.entry.createdBy) ?? '未知用户',
      ),
    ),
  };
};

export const createPlayerBlocklistEntry = async (
  userId: string,
  body: CreatePlayerBlocklistBody,
): Promise<PlayerBlocklistItem> => {
  const characterName = normalizeName(body.characterName);
  if (!characterName) {
    throw new BlocklistValidationError('characterName is required');
  }

  await assertServerExists(body.serverId);
  if (body.schoolId) {
    await assertSchoolExists(body.schoolId);
  }

  const [existing] = await db
    .select({ id: playerBlocklist.id })
    .from(playerBlocklist)
    .where(
      and(
        eq(playerBlocklist.serverId, body.serverId),
        eq(playerBlocklist.characterName, characterName),
      ),
    )
    .limit(1);

  if (existing) {
    throw new BlocklistConflictError('This player is already blocklisted');
  }

  const [created] = await db
    .insert(playerBlocklist)
    .values({
      characterName,
      serverId: body.serverId,
      schoolId: body.schoolId ?? null,
      remark: body.remark?.trim() || null,
      createdBy: userId,
    })
    .returning();

  if (!created) {
    throw new Error('Failed to create player blocklist entry');
  }

  const [row] = await db
    .select({
      entry: playerBlocklist,
      serverName: gameServer.name,
      schoolName: gameSchool.name,
    })
    .from(playerBlocklist)
    .innerJoin(gameServer, eq(playerBlocklist.serverId, gameServer.id))
    .leftJoin(gameSchool, eq(playerBlocklist.schoolId, gameSchool.id))
    .where(eq(playerBlocklist.id, created.id))
    .limit(1);

  if (!row) {
    throw new Error('Failed to load created player blocklist entry');
  }

  const userNames = await getUserNamesByIds([userId]);
  return toPlayerBlocklistItem(
    row.entry,
    row.serverName,
    row.schoolName,
    userNames.get(userId) ?? '未知用户',
  );
};

export const deletePlayerBlocklistEntry = async (
  id: string,
): Promise<boolean> => {
  const [deleted] = await db
    .delete(playerBlocklist)
    .where(eq(playerBlocklist.id, id))
    .returning({ id: playerBlocklist.id });

  return Boolean(deleted);
};

const assertRaidRunParticipant = async (
  raidRunId: string,
  userId: string,
): Promise<typeof raidRun.$inferSelect> => {
  const [run] = await db
    .select()
    .from(raidRun)
    .where(eq(raidRun.id, raidRunId))
    .limit(1);

  if (!run) {
    throw new RaidRunForbiddenError('Raid run not found');
  }

  if (run.createdBy === userId) {
    return run;
  }

  const [participant] = await db
    .select({ id: raidSignup.id })
    .from(raidSignup)
    .where(
      and(eq(raidSignup.raidRunId, raidRunId), eq(raidSignup.userId, userId)),
    )
    .limit(1);

  if (!participant) {
    throw new RaidRunForbiddenError(
      'You are not allowed to check this raid run',
    );
  }

  return run;
};

export const checkRaidRunBlocklist = async (
  raidRunId: string,
  userId: string,
): Promise<RaidRunBlocklistCheckResponse> => {
  await assertRaidRunParticipant(raidRunId, userId);

  const signupRows = await db
    .select({
      id: raidSignup.id,
      characterName: raidSignup.characterName,
      serverId: raidSignup.serverId,
      serverName: gameServer.name,
      schoolName: gameSchool.name,
    })
    .from(raidSignup)
    .leftJoin(gameServer, eq(raidSignup.serverId, gameServer.id))
    .leftJoin(gameSchool, eq(raidSignup.schoolId, gameSchool.id))
    .where(eq(raidSignup.raidRunId, raidRunId));

  const blocklistRows = await db
    .select({
      id: playerBlocklist.id,
      characterName: playerBlocklist.characterName,
      serverId: playerBlocklist.serverId,
      serverName: gameServer.name,
      schoolName: gameSchool.name,
      remark: playerBlocklist.remark,
    })
    .from(playerBlocklist)
    .innerJoin(gameServer, eq(playerBlocklist.serverId, gameServer.id))
    .leftJoin(gameSchool, eq(playerBlocklist.schoolId, gameSchool.id));

  return matchSignupsAgainstBlocklist(signupRows, blocklistRows);
};

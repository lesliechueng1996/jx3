import { db } from '@jx3/db';
import {
  gameItem,
  gameServer,
  raidLoot,
  raidRun,
  raidSignup,
} from '@jx3/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import type {
  CreateRaidLootBody,
  PatchRaidLootBody,
  PatchRaidRunWageBody,
  RaidLootItem,
  RaidRunWageResponse,
} from '../schemas/raid-loot';
import { getGameItemById } from './game-items';
import { RaidRunConflictError, RaidRunForbiddenError } from './raid-run-errors';

const LOOT_EDITABLE_STATUSES = ['ongoing', 'completed'] as const;

const getRaidRunById = async (raidRunId: string) => {
  const rows = await db
    .select()
    .from(raidRun)
    .where(eq(raidRun.id, raidRunId))
    .limit(1);

  return rows[0] ?? null;
};

const assertOwner = (
  run: typeof raidRun.$inferSelect,
  userId: string,
): void => {
  if (run.createdBy !== userId) {
    throw new RaidRunForbiddenError('You are not the creator of this raid run');
  }
};

const assertLootEditable = (run: typeof raidRun.$inferSelect): void => {
  if (
    !LOOT_EDITABLE_STATUSES.includes(
      run.status as (typeof LOOT_EDITABLE_STATUSES)[number],
    )
  ) {
    throw new RaidRunConflictError('Loot and wage cannot be modified now');
  }
};

const toNumericString = (value: string | null): string | null =>
  value === null ? null : value;

const mapLootRow = (row: {
  loot: typeof raidLoot.$inferSelect;
  itemName: string;
  itemQuality: typeof gameItem.$inferSelect.quality;
  itemIcon: string | null;
  winnerCharacterName: string | null;
  winnerServerName: string | null;
}): RaidLootItem => ({
  id: row.loot.id,
  itemId: row.loot.itemId,
  itemName: row.itemName,
  itemQuality: row.itemQuality,
  itemIcon: row.itemIcon,
  quantity: row.loot.quantity,
  winnerSignupId: row.loot.winnerSignupId,
  winnerCharacterName: row.winnerCharacterName,
  winnerServerName: row.winnerServerName,
  price: row.loot.price,
  remark: row.loot.remark,
  createdAt: row.loot.createdAt.toISOString(),
  updatedAt: row.loot.updatedAt.toISOString(),
});

export const listRaidLoot = async (
  raidRunId: string,
): Promise<RaidLootItem[]> => {
  const rows = await db
    .select({
      loot: raidLoot,
      itemName: gameItem.name,
      itemQuality: gameItem.quality,
      itemIcon: gameItem.icon,
      winnerCharacterName: raidSignup.characterName,
      winnerServerName: gameServer.name,
    })
    .from(raidLoot)
    .innerJoin(gameItem, eq(raidLoot.itemId, gameItem.id))
    .leftJoin(raidSignup, eq(raidLoot.winnerSignupId, raidSignup.id))
    .leftJoin(gameServer, eq(raidSignup.serverId, gameServer.id))
    .where(eq(raidLoot.raidRunId, raidRunId))
    .orderBy(asc(raidLoot.createdAt));

  return rows.map(mapLootRow);
};

const assertWinnerSignup = async (
  raidRunId: string,
  winnerSignupId: string | null | undefined,
): Promise<void> => {
  if (!winnerSignupId) {
    return;
  }

  const rows = await db
    .select({ id: raidSignup.id })
    .from(raidSignup)
    .where(
      and(
        eq(raidSignup.id, winnerSignupId),
        eq(raidSignup.raidRunId, raidRunId),
      ),
    )
    .limit(1);

  if (!rows[0]) {
    throw new RaidRunConflictError('Winner signup not found in this raid run');
  }
};

const getLootItemById = async (raidRunId: string, lootId: string) => {
  const items = await listRaidLoot(raidRunId);
  return items.find((item) => item.id === lootId) ?? null;
};

export const createRaidLoot = async (
  raidRunId: string,
  userId: string,
  body: CreateRaidLootBody,
): Promise<RaidLootItem | null> => {
  const run = await getRaidRunById(raidRunId);
  if (!run) {
    return null;
  }

  assertOwner(run, userId);
  assertLootEditable(run);

  const item = await getGameItemById(body.itemId);
  if (!item) {
    throw new RaidRunConflictError('Game item not found');
  }

  await assertWinnerSignup(raidRunId, body.winnerSignupId ?? null);

  const [created] = await db
    .insert(raidLoot)
    .values({
      raidRunId,
      itemId: body.itemId,
      quantity: body.quantity ?? 1,
      winnerSignupId: body.winnerSignupId ?? null,
      price: body.price ?? null,
      createdBy: userId,
      remark: body.remark ?? null,
    })
    .returning();

  if (!created) {
    throw new RaidRunConflictError('Failed to create raid loot');
  }

  const lootItem = await getLootItemById(raidRunId, created.id);
  if (!lootItem) {
    throw new RaidRunConflictError('Failed to load created raid loot');
  }

  return lootItem;
};

export const patchRaidLoot = async (
  raidRunId: string,
  lootId: string,
  userId: string,
  body: PatchRaidLootBody,
): Promise<RaidLootItem | null> => {
  const run = await getRaidRunById(raidRunId);
  if (!run) {
    return null;
  }

  assertOwner(run, userId);
  assertLootEditable(run);

  const existingRows = await db
    .select()
    .from(raidLoot)
    .where(and(eq(raidLoot.id, lootId), eq(raidLoot.raidRunId, raidRunId)))
    .limit(1);

  const existing = existingRows[0];
  if (!existing) {
    return null;
  }

  if (body.winnerSignupId !== undefined) {
    await assertWinnerSignup(raidRunId, body.winnerSignupId);
  }

  const [updated] = await db
    .update(raidLoot)
    .set({
      ...(body.quantity !== undefined ? { quantity: body.quantity } : {}),
      ...(body.winnerSignupId !== undefined
        ? { winnerSignupId: body.winnerSignupId }
        : {}),
      ...(body.price !== undefined ? { price: body.price } : {}),
      ...(body.remark !== undefined ? { remark: body.remark } : {}),
    })
    .where(eq(raidLoot.id, lootId))
    .returning();

  if (!updated) {
    return null;
  }

  return getLootItemById(raidRunId, lootId);
};

export const deleteRaidLoot = async (
  raidRunId: string,
  lootId: string,
  userId: string,
): Promise<boolean> => {
  const run = await getRaidRunById(raidRunId);
  if (!run) {
    return false;
  }

  assertOwner(run, userId);
  assertLootEditable(run);

  const deleted = await db
    .delete(raidLoot)
    .where(and(eq(raidLoot.id, lootId), eq(raidLoot.raidRunId, raidRunId)))
    .returning({ id: raidLoot.id });

  return deleted.length > 0;
};

export const patchRaidRunWage = async (
  raidRunId: string,
  userId: string,
  body: PatchRaidRunWageBody,
): Promise<RaidRunWageResponse | null> => {
  const run = await getRaidRunById(raidRunId);
  if (!run) {
    return null;
  }

  assertOwner(run, userId);
  assertLootEditable(run);

  const [updated] = await db
    .update(raidRun)
    .set({
      totalIncome: body.totalIncome,
      wagePerPerson: body.wagePerPerson,
    })
    .where(eq(raidRun.id, raidRunId))
    .returning({
      totalIncome: raidRun.totalIncome,
      wagePerPerson: raidRun.wagePerPerson,
    });

  if (!updated) {
    return null;
  }

  return {
    totalIncome: toNumericString(updated.totalIncome),
    wagePerPerson: toNumericString(updated.wagePerPerson),
  };
};

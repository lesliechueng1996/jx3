import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createMockDb } from '../helpers/mock-db';

const mockDb = createMockDb();

mock.module('@jx3/db', () => ({
  db: mockDb,
}));

const getGameItemById = mock(async (itemId: string) =>
  itemId === 'item-1'
    ? {
        id: 'item-1',
        name: '玄晶',
        gameItemId: null,
        type: 'special' as const,
        quality: 'orange' as const,
        description: null,
        icon: null,
        alias: [],
        createdAt: new Date('2026-06-19T00:00:00.000Z'),
        updatedAt: new Date('2026-06-19T00:00:00.000Z'),
      }
    : null,
);

mock.module('../../src/services/game-items', () => ({
  getGameItemById,
}));

const { createRaidLoot, deleteRaidLoot, patchRaidLoot, patchRaidRunWage } =
  await import('../../src/services/raid-loot');

const {
  RaidRunConflictError: RunConflictError,
  RaidRunForbiddenError: RunForbiddenError,
} = await import('../../src/services/raid-run-errors');

const createdAt = new Date('2026-06-19T00:00:00.000Z');
const updatedAt = new Date('2026-06-19T00:00:00.000Z');

const ongoingRun = {
  id: 'run-1',
  name: '周末团',
  description: null,
  dungeonId: 'dungeon-1',
  gameRaidId: null,
  createdBy: 'user-1',
  status: 'ongoing' as const,
  gatherTime: null,
  startTime: new Date('2026-06-14T12:00:00.000Z'),
  endTime: null,
  reservedTank: 2,
  reservedHealer: 5,
  reservedDps: 10,
  reservedBoss: 1,
  totalIncome: null,
  wagePerPerson: null,
  remark: null,
  createdAt,
  updatedAt,
};

const lootRow = {
  id: 'loot-1',
  raidRunId: 'run-1',
  itemId: 'item-1',
  quantity: 1,
  winnerSignupId: null,
  price: null,
  createdBy: 'user-1',
  remark: null,
  createdAt,
  updatedAt,
};

const lootListRow = {
  loot: lootRow,
  itemName: '玄晶',
  itemQuality: 'orange' as const,
  itemIcon: null,
  winnerCharacterName: null,
  winnerServerName: null,
};

describe('raid-loot service', () => {
  beforeEach(() => {
    mockDb.setResults([]);
    getGameItemById.mockClear();
  });

  it('creates loot for an ongoing raid run', async () => {
    mockDb.setResults([[ongoingRun], [lootRow], [lootListRow]]);

    const created = await createRaidLoot('run-1', 'user-1', {
      itemId: 'item-1',
      quantity: 1,
    });

    expect(created?.itemName).toBe('玄晶');
    expect(created?.quantity).toBe(1);
  });

  it('rejects loot creation for non-owner', async () => {
    mockDb.setResults([[ongoingRun]]);

    await expect(
      createRaidLoot('run-1', 'user-2', {
        itemId: 'item-1',
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(RunForbiddenError);
  });

  it('rejects loot creation for recruiting raid run', async () => {
    mockDb.setResults([[{ ...ongoingRun, status: 'recruiting' as const }]]);

    await expect(
      createRaidLoot('run-1', 'user-1', {
        itemId: 'item-1',
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(RunConflictError);
  });

  it('patches raid run wage', async () => {
    mockDb.setResults([
      [ongoingRun],
      [{ totalIncome: '50000', wagePerPerson: '2000' }],
    ]);

    const updated = await patchRaidRunWage('run-1', 'user-1', {
      totalIncome: '50000',
      wagePerPerson: '2000',
    });

    expect(updated).toEqual({
      totalIncome: '50000',
      wagePerPerson: '2000',
    });
  });

  it('deletes loot for owner', async () => {
    mockDb.setResults([[ongoingRun], [{ id: 'loot-1' }]]);

    const deleted = await deleteRaidLoot('run-1', 'loot-1', 'user-1');

    expect(deleted).toBe(true);
  });

  it('patches loot winner and price', async () => {
    mockDb.setResults([
      [ongoingRun],
      [lootRow],
      [{ id: 'signup-1' }],
      [lootRow],
      [
        {
          ...lootListRow,
          loot: { ...lootRow, winnerSignupId: 'signup-1', price: 10000 },
          winnerCharacterName: '叶修',
          winnerServerName: '电信一区',
        },
      ],
    ]);

    const updated = await patchRaidLoot('run-1', 'loot-1', 'user-1', {
      winnerSignupId: 'signup-1',
      price: 10000,
    });

    expect(updated?.winnerCharacterName).toBe('叶修');
    expect(updated?.price).toBe(10000);
  });
});

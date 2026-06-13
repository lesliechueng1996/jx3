import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createMockDb } from '../helpers/mock-db';

const mockDb = createMockDb();

mock.module('@jx3/db', () => ({
  db: mockDb,
}));

const getAdminExpansionById = mock(async (expansionId: string) =>
  expansionId === 'exp-1'
    ? {
        id: 'exp-1',
        name: '横刀断浪',
        description: null,
        level: 130,
        startDate: '2024-01-01',
        endDate: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }
    : null,
);

const getAdminSeasonById = mock(
  async (expansionId: string, seasonId: string) =>
    expansionId === 'exp-1' && seasonId === 'season-1'
      ? {
          id: 'season-1',
          expansionId: 'exp-1',
          name: '第一赛季',
          description: null,
          startDate: '2024-01-01',
          endDate: null,
          sortOrder: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        }
      : null,
);

mock.module('../../src/services/expansions-admin', () => ({
  getAdminExpansionById,
}));

mock.module('../../src/services/seasons-admin', () => ({
  getAdminSeasonById,
}));

const {
  createAdminDungeon,
  deleteAdminDungeon,
  DungeonValidationError,
  getAdminDungeonById,
  isDungeonReferenced,
  listAdminDungeons,
  updateAdminDungeon,
} = await import('../../src/services/dungeons-admin');

const createdAt = new Date('2026-01-01T00:00:00Z');
const updatedAt = new Date('2026-01-02T00:00:00Z');

const dungeonRow = {
  id: 'dungeon-1',
  name: '雷域大泽',
  expansionId: 'exp-1',
  expansionName: '横刀断浪',
  seasonId: 'season-1',
  seasonName: '第一赛季',
  playerLimit: 25,
  difficulty: 'heroic' as const,
  levelRequirement: 130,
  bossCount: 6,
  resetWeekdays: [1, 4],
  createdAt,
  updatedAt,
};

describe('dungeons-admin service', () => {
  beforeEach(() => {
    mockDb.setResults([]);
    getAdminExpansionById.mockClear();
    getAdminSeasonById.mockClear();
    getAdminExpansionById.mockImplementation(async (expansionId: string) =>
      expansionId === 'exp-1'
        ? {
            id: 'exp-1',
            name: '横刀断浪',
            description: null,
            level: 130,
            startDate: '2024-01-01',
            endDate: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          }
        : null,
    );
    getAdminSeasonById.mockImplementation(
      async (expansionId: string, seasonId: string) =>
        expansionId === 'exp-1' && seasonId === 'season-1'
          ? {
              id: 'season-1',
              expansionId: 'exp-1',
              name: '第一赛季',
              description: null,
              startDate: '2024-01-01',
              endDate: null,
              sortOrder: 1,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            }
          : null,
    );
  });

  it('lists dungeons joined with expansion and season names', async () => {
    mockDb.setResults([[dungeonRow], [{ total: 1 }]]);

    const result = await listAdminDungeons({
      page: 1,
      pageSize: 20,
      expansionId: 'exp-1',
    });

    expect(result.items[0]).toMatchObject({
      id: 'dungeon-1',
      expansionName: '横刀断浪',
      seasonName: '第一赛季',
    });
    expect(result.total).toBe(1);
  });

  it('returns null when dungeon is missing', async () => {
    mockDb.setResults([[]]);

    await expect(getAdminDungeonById('missing')).resolves.toBeNull();
  });

  it('creates dungeon and reloads joined row', async () => {
    mockDb.setResults([[{ id: 'dungeon-1' }], [dungeonRow]]);

    const created = await createAdminDungeon({
      name: '雷域大泽',
      expansionId: 'exp-1',
      seasonId: 'season-1',
      playerLimit: 25,
      difficulty: 'heroic',
      levelRequirement: 130,
      bossCount: 6,
      resetWeekdays: [1, 4],
    });

    expect(created).toMatchObject({
      id: 'dungeon-1',
      expansionName: '横刀断浪',
    });
  });

  it('throws when expansion is missing on create', async () => {
    getAdminExpansionById.mockImplementation(async () => null);

    await expect(
      createAdminDungeon({
        name: '雷域大泽',
        expansionId: 'missing',
        seasonId: 'season-1',
        playerLimit: 25,
        difficulty: 'heroic',
        levelRequirement: 130,
        bossCount: 6,
        resetWeekdays: [],
      }),
    ).rejects.toBeInstanceOf(DungeonValidationError);
  });

  it('updates dungeon and reloads joined row', async () => {
    mockDb.setResults([[dungeonRow], [{ id: 'dungeon-1' }], [dungeonRow]]);

    const updated = await updateAdminDungeon('dungeon-1', {
      name: '新副本名',
    });

    expect(updated?.name).toBe('雷域大泽');
  });

  it('detects references and deletes dungeons', async () => {
    mockDb.setResults([[{ id: 'raid-1' }], [{ id: 'dungeon-1' }]]);

    await expect(isDungeonReferenced('dungeon-1')).resolves.toBe(true);
    await expect(deleteAdminDungeon('dungeon-1')).resolves.toBe(true);
  });
});

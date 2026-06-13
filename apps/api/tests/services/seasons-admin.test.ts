import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createMockDb } from '../helpers/mock-db';

const mockDb = createMockDb();

mock.module('@jx3/db', () => ({
  db: mockDb,
}));

const {
  createAdminSeason,
  deleteAdminSeason,
  getAdminSeasonById,
  isSeasonReferenced,
  listAdminSeasons,
  SeasonValidationError,
  updateAdminSeason,
} = await import('../../src/services/seasons-admin');

const createdAt = new Date('2026-01-01T00:00:00Z');
const updatedAt = new Date('2026-01-02T00:00:00Z');

const expansionRow = {
  id: 'exp-1',
  name: '横刀断浪',
  description: '资料片',
  level: 130,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  createdAt,
  updatedAt,
};

const seasonRow = {
  id: 'season-1',
  expansionId: 'exp-1',
  name: '赛季一',
  description: '描述',
  startDate: '2024-02-01',
  endDate: '2024-06-30',
  sortOrder: 1,
  createdAt,
  updatedAt,
};

describe('seasons-admin service', () => {
  beforeEach(() => {
    mockDb.setResults([]);
  });

  it('lists seasons for an expansion', async () => {
    mockDb.setResults([[seasonRow]]);

    await expect(listAdminSeasons('exp-1')).resolves.toEqual({
      items: [
        {
          id: 'season-1',
          expansionId: 'exp-1',
          name: '赛季一',
          description: '描述',
          startDate: '2024-02-01',
          endDate: '2024-06-30',
          sortOrder: 1,
          createdAt: createdAt.toISOString(),
          updatedAt: updatedAt.toISOString(),
        },
      ],
    });
  });

  it('rejects seasons outside the expansion date range', async () => {
    mockDb.setResults([[expansionRow]]);

    await expect(
      createAdminSeason('exp-1', {
        name: '赛季一',
        description: null,
        startDate: '2023-12-01',
        endDate: null,
        sortOrder: 0,
      }),
    ).rejects.toThrow(SeasonValidationError);
  });

  it('creates a season with the next sort order', async () => {
    mockDb.setResults([[expansionRow], [{ maxSortOrder: 2 }], [seasonRow]]);

    const created = await createAdminSeason('exp-1', {
      name: '赛季一',
      description: '描述',
      startDate: '2024-02-01',
      endDate: '2024-06-30',
    });

    expect(created.sortOrder).toBe(1);
  });

  it('updates an existing season', async () => {
    mockDb.setResults([
      [seasonRow],
      [expansionRow],
      [{ ...seasonRow, name: '赛季二' }],
    ]);

    const updated = await updateAdminSeason('exp-1', 'season-1', {
      name: '赛季二',
      endDate: '2024-06-30',
    });

    expect(updated?.name).toBe('赛季二');
  });

  it('detects references and deletes seasons', async () => {
    mockDb.setResults([[{ id: 'dungeon-1' }], [{ id: 'season-1' }]]);

    await expect(isSeasonReferenced('season-1')).resolves.toBe(true);
    await expect(deleteAdminSeason('exp-1', 'season-1')).resolves.toBe(true);
  });

  it('returns null when a season is missing', async () => {
    mockDb.setResults([[]]);

    await expect(getAdminSeasonById('exp-1', 'missing')).resolves.toBeNull();
  });

  it('rejects seasons that start after the expansion ends', async () => {
    mockDb.setResults([[expansionRow]]);

    await expect(
      createAdminSeason('exp-1', {
        name: '赛季一',
        description: null,
        startDate: '2025-01-01',
        endDate: null,
        sortOrder: 0,
      }),
    ).rejects.toThrow(SeasonValidationError);
  });

  it('rejects seasons that end before the expansion starts', async () => {
    mockDb.setResults([[expansionRow]]);

    await expect(
      createAdminSeason('exp-1', {
        name: '赛季一',
        description: null,
        startDate: '2024-02-01',
        endDate: '2023-12-31',
        sortOrder: 0,
      }),
    ).rejects.toThrow(SeasonValidationError);
  });

  it('throws when expansion disappears during update', async () => {
    mockDb.setResults([[seasonRow], []]);

    await expect(
      updateAdminSeason('exp-1', 'season-1', {
        name: '赛季二',
        endDate: '2024-06-30',
      }),
    ).rejects.toThrow('Expansion not found');
  });

  it('rejects seasons that end after the expansion', async () => {
    mockDb.setResults([[expansionRow]]);

    await expect(
      createAdminSeason('exp-1', {
        name: '赛季一',
        description: null,
        startDate: '2024-02-01',
        endDate: '2025-01-01',
        sortOrder: 0,
      }),
    ).rejects.toThrow(SeasonValidationError);
  });

  it('throws when create returning is empty', async () => {
    mockDb.setResults([[expansionRow], [{ maxSortOrder: null }], []]);

    await expect(
      createAdminSeason('exp-1', {
        name: '赛季一',
        description: null,
        startDate: '2024-02-01',
        endDate: null,
      }),
    ).rejects.toThrow('Failed to create season');
  });

  it('returns null when updating a missing season', async () => {
    mockDb.setResults([[]]);

    await expect(
      updateAdminSeason('exp-1', 'missing', {
        name: '赛季二',
        endDate: '2024-06-30',
      }),
    ).resolves.toBeNull();
  });

  it('rejects seasons with invalid end dates', async () => {
    mockDb.setResults([[expansionRow]]);

    await expect(
      createAdminSeason('exp-1', {
        name: '赛季一',
        description: null,
        startDate: '2024-02-01',
        endDate: '2024-01-01',
        sortOrder: 0,
      }),
    ).rejects.toThrow(SeasonValidationError);
  });

  it('throws when expansion is missing on create', async () => {
    mockDb.setResults([[]]);

    await expect(
      createAdminSeason('missing', {
        name: '赛季一',
        description: null,
        startDate: '2024-02-01',
        endDate: null,
        sortOrder: 0,
      }),
    ).rejects.toThrow('Expansion not found');
  });
});

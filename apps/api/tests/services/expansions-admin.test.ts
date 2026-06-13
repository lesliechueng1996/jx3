import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createMockDb } from '../helpers/mock-db';

const mockDb = createMockDb();

mock.module('@jx3/db', () => ({
  db: mockDb,
}));

const {
  createAdminExpansion,
  deleteAdminExpansion,
  getAdminExpansionById,
  isExpansionReferenced,
  listAdminExpansions,
  listExpansionFilterOptions,
  updateAdminExpansion,
} = await import('../../src/services/expansions-admin');

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

describe('expansions-admin service', () => {
  beforeEach(() => {
    mockDb.setResults([]);
  });

  it('lists expansions', async () => {
    mockDb.setResults([[expansionRow]]);

    await expect(listAdminExpansions()).resolves.toEqual({
      items: [
        {
          id: 'exp-1',
          name: '横刀断浪',
          description: '资料片',
          level: 130,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          createdAt: createdAt.toISOString(),
          updatedAt: updatedAt.toISOString(),
        },
      ],
    });
  });

  it('lists expansion filter options with nested seasons', async () => {
    mockDb.setResults([
      [{ id: 'exp-1', name: '横刀断浪' }],
      [
        {
          id: 'season-1',
          name: '第一赛季',
          expansionId: 'exp-1',
        },
      ],
    ]);

    await expect(listExpansionFilterOptions()).resolves.toEqual({
      items: [
        {
          id: 'exp-1',
          name: '横刀断浪',
          seasons: [{ id: 'season-1', name: '第一赛季' }],
        },
      ],
    });
  });

  it('returns null for a missing expansion', async () => {
    mockDb.setResults([[]]);

    await expect(getAdminExpansionById('missing')).resolves.toBeNull();
  });

  it('creates and updates expansions', async () => {
    mockDb.setResults([[expansionRow], [expansionRow]]);

    const created = await createAdminExpansion({
      name: '横刀断浪',
      description: '资料片',
      level: 130,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
    const updated = await updateAdminExpansion('exp-1', {
      name: '新资料片',
      endDate: '2024-12-31',
    });

    expect(created.id).toBe('exp-1');
    expect(updated?.name).toBe('横刀断浪');
  });

  it('throws when create returning is empty', async () => {
    mockDb.setResults([[]]);

    await expect(
      createAdminExpansion({
        name: '横刀断浪',
        description: null,
        level: 130,
        startDate: '2024-01-01',
        endDate: null,
      }),
    ).rejects.toThrow('Failed to create expansion');
  });

  it('detects references and deletes expansions', async () => {
    mockDb.setResults([[{ id: 'dungeon-1' }], [], [{ id: 'exp-1' }]]);

    await expect(isExpansionReferenced('exp-1')).resolves.toBe(true);
    await expect(deleteAdminExpansion('exp-1')).resolves.toBe(true);
  });
});

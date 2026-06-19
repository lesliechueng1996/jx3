import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createMockDb } from '../helpers/mock-db';

const mockDb = createMockDb();

mock.module('@jx3/db', () => ({
  db: mockDb,
}));

const { createGameItem, searchGameItems } = await import(
  '../../src/services/game-items'
);

const createdAt = new Date('2026-06-19T00:00:00.000Z');
const updatedAt = new Date('2026-06-19T00:00:00.000Z');

const itemRow = {
  id: 'item-1',
  name: '玄晶',
  gameItemId: null,
  type: 'special' as const,
  quality: 'orange' as const,
  description: null,
  icon: null,
  alias: ['玄晶碎片'],
  createdAt,
  updatedAt,
};

describe('game-items service', () => {
  beforeEach(() => {
    mockDb.setResults([]);
  });

  it('returns empty items for blank search', async () => {
    const result = await searchGameItems('');
    expect(result.items).toEqual([]);
  });

  it('searches game items by query', async () => {
    mockDb.setResults([[itemRow]]);

    const result = await searchGameItems('玄晶');

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.name).toBe('玄晶');
  });

  it('creates a game item', async () => {
    mockDb.setResults([[itemRow]]);

    const created = await createGameItem({
      name: '玄晶',
      type: 'special',
      quality: 'orange',
    });

    expect(created.id).toBe('item-1');
    expect(created.quality).toBe('orange');
  });

  it('loads a game item by id', async () => {
    mockDb.setResults([[itemRow]]);

    const { getGameItemById } = await import('../../src/services/game-items');
    const item = await getGameItemById('item-1');

    expect(item?.name).toBe('玄晶');
  });
});

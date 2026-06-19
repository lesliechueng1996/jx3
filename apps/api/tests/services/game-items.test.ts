import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Jx3ApiError } from '@jx3/jx3api';
import { createMockDb } from '../helpers/mock-db';

const mockDb = createMockDb();
const getItemIconByName = mock(async (name: string) => ({
  iconId: 22889,
  name,
  iconUrl: 'https://icon.jx3box.com/icon/22889.png',
}));

mock.module('@jx3/db', () => ({
  db: mockDb,
}));

mock.module('@jx3/jx3api', () => ({
  getItemIconByName,
  Jx3ApiError,
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
    getItemIconByName.mockClear();
    getItemIconByName.mockImplementation(async (name: string) => ({
      iconId: 22889,
      name,
      iconUrl: 'https://icon.jx3box.com/icon/22889.png',
    }));
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
    expect(getItemIconByName).toHaveBeenCalledWith('玄晶', {
      logger: undefined,
    });
  });

  it('resolves icon from jx3box when icon is omitted on create', async () => {
    const rowWithResolvedIcon = {
      ...itemRow,
      name: '第一尊',
      icon: 'https://icon.jx3box.com/icon/22889.png',
    };
    mockDb.setResults([[rowWithResolvedIcon]]);

    const created = await createGameItem({
      name: '第一尊',
      type: 'equipment',
      quality: 'purple',
    });

    expect(created.icon).toBe('https://icon.jx3box.com/icon/22889.png');
  });

  it('stores null icon when jx3box lookup returns NOT_FOUND', async () => {
    getItemIconByName.mockImplementation(async () => {
      throw new Jx3ApiError('No icon found for item "不存在"', {
        code: 'NOT_FOUND',
      });
    });
    mockDb.setResults([[itemRow]]);

    const created = await createGameItem({
      name: '不存在',
      type: 'special',
      quality: 'white',
    });

    expect(created.icon).toBeNull();
  });

  it('loads a game item by id', async () => {
    mockDb.setResults([[itemRow]]);

    const { getGameItemById } = await import('../../src/services/game-items');
    const item = await getGameItemById('item-1');

    expect(item?.name).toBe('玄晶');
  });
});

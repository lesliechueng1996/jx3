import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createMockDb } from '../helpers/mock-db';

const mockDb = createMockDb();

mock.module('@jx3/db', () => ({
  db: mockDb,
}));

const {
  createAdminGameItem,
  deleteAdminGameItem,
  getAdminGameItemById,
  isGameItemReferenced,
  listAdminGameItems,
  updateAdminGameItem,
} = await import('../../src/services/game-items-admin');

const createdAt = new Date('2026-01-01T00:00:00Z');
const updatedAt = new Date('2026-01-02T00:00:00Z');

const itemRow = {
  id: 'item-1',
  name: '玄晶',
  gameItemId: '12345',
  type: 'special' as const,
  quality: 'orange' as const,
  description: '稀有材料',
  icon: 'https://example.com/icon.png',
  alias: ['玄晶碎片'],
  createdAt,
  updatedAt,
};

describe('game-items-admin service', () => {
  beforeEach(() => {
    mockDb.setResults([]);
  });

  it('lists game items with pagination metadata', async () => {
    mockDb.setResults([[itemRow], [{ total: 1 }]]);

    const result = await listAdminGameItems({
      page: 1,
      pageSize: 20,
      name: '玄',
    });

    expect(result).toEqual({
      items: [
        {
          id: 'item-1',
          name: '玄晶',
          gameItemId: '12345',
          type: 'special',
          quality: 'orange',
          description: '稀有材料',
          icon: 'https://example.com/icon.png',
          alias: ['玄晶碎片'],
          createdAt: createdAt.toISOString(),
          updatedAt: updatedAt.toISOString(),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });
  });

  it('lists game items without filters', async () => {
    mockDb.setResults([[itemRow], [{ total: 1 }]]);

    const result = await listAdminGameItems({
      page: 1,
      pageSize: 20,
    });

    expect(result.items).toHaveLength(1);
  });

  it('lists game items with type, quality, and alias filters', async () => {
    mockDb.setResults([[itemRow], [{ total: 1 }]]);

    const result = await listAdminGameItems({
      page: 1,
      pageSize: 20,
      type: 'special',
      quality: 'orange',
      alias: '玄晶',
    });

    expect(result.total).toBe(1);
  });

  it('returns null for a missing game item', async () => {
    mockDb.setResults([[]]);

    await expect(getAdminGameItemById('missing')).resolves.toBeNull();
  });

  it('creates and updates a game item', async () => {
    mockDb.setResults([[itemRow], [itemRow]]);

    const created = await createAdminGameItem({
      name: '玄晶',
      type: 'special',
      quality: 'orange',
      gameItemId: '12345',
      description: '稀有材料',
      icon: 'https://example.com/icon.png',
      alias: ['玄晶碎片'],
    });
    const updated = await updateAdminGameItem('item-1', {
      name: '新玄晶',
    });

    expect(created.name).toBe('玄晶');
    expect(updated?.name).toBe('玄晶');
  });

  it('throws when create returning is empty', async () => {
    mockDb.setResults([[]]);

    await expect(
      createAdminGameItem({
        name: '玄晶',
        type: 'special',
        quality: 'orange',
        alias: [],
      }),
    ).rejects.toThrow('Failed to create game item');
  });

  it('returns null when updating a missing game item', async () => {
    mockDb.setResults([[]]);

    await expect(
      updateAdminGameItem('missing', { name: 'x' }),
    ).resolves.toBeNull();
  });

  it('detects references and deletes game items', async () => {
    mockDb.setResults([[{ id: 'loot-1' }], [{ id: 'item-1' }]]);

    await expect(isGameItemReferenced('item-1')).resolves.toBe(true);
    await expect(deleteAdminGameItem('item-1')).resolves.toBe(true);
  });

  it('returns false when game item is not referenced', async () => {
    mockDb.setResults([[]]);

    await expect(isGameItemReferenced('item-1')).resolves.toBe(false);
  });
});

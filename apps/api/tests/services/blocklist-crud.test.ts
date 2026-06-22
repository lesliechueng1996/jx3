import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createMockDb } from '../helpers/mock-db';

const mockDb = createMockDb();

mock.module('@jx3/db', () => ({
  db: mockDb,
}));

const {
  checkRaidRunBlocklist,
  createPlayerBlocklistEntry,
  createRaidBrandBlocklistEntry,
  deletePlayerBlocklistEntry,
  deleteRaidBrandBlocklistEntry,
  listPlayerBlocklist,
  listRaidBrandBlocklist,
  BlocklistConflictError,
  BlocklistValidationError,
} = await import('../../src/services/blocklist');

const serverA = '11111111-1111-4111-8111-111111111111';
const createdAt = new Date('2026-06-19T00:00:00.000Z');
const updatedAt = new Date('2026-06-19T00:00:00.000Z');

describe('blocklist service', () => {
  beforeEach(() => {
    mockDb.setResults([]);
    mockDb.reset();
  });

  it('lists raid brand blocklist entries', async () => {
    mockDb.setResults([
      [
        {
          id: 'brand-1',
          name: 'XX金团',
          remark: '跳车',
          createdBy: 'user-1',
          createdAt,
          updatedAt,
        },
      ],
      [{ id: 'user-1', name: 'Leader' }],
    ]);

    const result = await listRaidBrandBlocklist({ q: '金' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.createdByName).toBe('Leader');
  });

  it('creates raid brand blocklist entries', async () => {
    mockDb.setResults([
      [],
      [
        {
          id: 'brand-1',
          name: 'XX金团',
          remark: null,
          createdBy: 'user-1',
          createdAt,
          updatedAt,
        },
      ],
      [{ id: 'user-1', name: 'Leader' }],
    ]);

    const created = await createRaidBrandBlocklistEntry('user-1', {
      name: 'XX金团',
    });

    expect(created.name).toBe('XX金团');
    expect(created.createdByName).toBe('Leader');
  });

  it('rejects duplicate raid brand blocklist entries', async () => {
    mockDb.setResults([[{ id: 'brand-1' }]]);

    await expect(
      createRaidBrandBlocklistEntry('user-1', { name: 'XX金团' }),
    ).rejects.toBeInstanceOf(BlocklistConflictError);
  });

  it('deletes raid brand blocklist entries', async () => {
    mockDb.setResults([[{ id: 'brand-1' }]]);

    await expect(deleteRaidBrandBlocklistEntry('brand-1')).resolves.toBe(true);
  });

  it('rejects duplicate player blocklist entries', async () => {
    mockDb.setResults([[{ id: 'server-1' }], [{ id: 'player-1' }]]);

    await expect(
      createPlayerBlocklistEntry('user-1', {
        characterName: '叶修',
        serverId: serverA,
      }),
    ).rejects.toBeInstanceOf(BlocklistConflictError);
  });

  it('lists player blocklist entries', async () => {
    mockDb.setResults([
      [
        {
          entry: {
            id: 'player-1',
            characterName: '叶修',
            serverId: serverA,
            schoolId: null,
            remark: null,
            createdBy: 'user-1',
            createdAt,
            updatedAt,
          },
          serverName: '梦江南',
          schoolName: null,
        },
      ],
      [{ id: 'user-1', name: 'Leader' }],
    ]);

    const result = await listPlayerBlocklist({ q: '叶' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.serverName).toBe('梦江南');
  });

  it('creates player blocklist entries', async () => {
    mockDb.setResults([
      [{ id: serverA }],
      [],
      [
        {
          id: 'player-1',
          characterName: '叶修',
          serverId: serverA,
          schoolId: null,
          remark: null,
          createdBy: 'user-1',
          createdAt,
          updatedAt,
        },
      ],
      [
        {
          entry: {
            id: 'player-1',
            characterName: '叶修',
            serverId: serverA,
            schoolId: null,
            remark: null,
            createdBy: 'user-1',
            createdAt,
            updatedAt,
          },
          serverName: '梦江南',
          schoolName: null,
        },
      ],
      [{ id: 'user-1', name: 'Leader' }],
    ]);

    const created = await createPlayerBlocklistEntry('user-1', {
      characterName: '叶修',
      serverId: serverA,
    });

    expect(created.characterName).toBe('叶修');
  });

  it('rejects invalid server ids when creating players', async () => {
    mockDb.setResults([[]]);

    await expect(
      createPlayerBlocklistEntry('user-1', {
        characterName: '叶修',
        serverId: serverA,
      }),
    ).rejects.toBeInstanceOf(BlocklistValidationError);
  });

  it('deletes player blocklist entries', async () => {
    mockDb.setResults([[{ id: 'player-1' }]]);

    await expect(deletePlayerBlocklistEntry('player-1')).resolves.toBe(true);
  });

  it('checks raid run blocklist matches', async () => {
    mockDb.setResults([
      [{ id: 'run-1', createdBy: 'user-1' }],
      [
        {
          id: 'signup-1',
          characterName: '叶修',
          serverId: serverA,
          serverName: '梦江南',
          schoolName: null,
        },
      ],
      [
        {
          id: 'block-1',
          characterName: '叶修',
          serverId: serverA,
          serverName: '梦江南',
          schoolName: null,
          remark: '跳车',
        },
      ],
    ]);

    const result = await checkRaidRunBlocklist('run-1', 'user-1');

    expect(result.passed).toBe(false);
    expect(result.confirmedMatches).toHaveLength(1);
  });

  it('rejects blocklist checks for non-participants', async () => {
    mockDb.setResults([[{ id: 'run-1', createdBy: 'owner-1' }], []]);

    await expect(checkRaidRunBlocklist('run-1', 'user-2')).rejects.toThrow(
      'You are not allowed to check this raid run',
    );
  });

  it('rejects empty raid brand names', async () => {
    await expect(
      createRaidBrandBlocklistEntry('user-1', { name: '   ' }),
    ).rejects.toBeInstanceOf(BlocklistValidationError);
  });

  it('rejects invalid school ids when creating players', async () => {
    mockDb.setResults([[{ id: serverA }], []]);

    await expect(
      createPlayerBlocklistEntry('user-1', {
        characterName: '叶修',
        serverId: serverA,
        schoolId: '22222222-2222-4222-8222-222222222222',
      }),
    ).rejects.toBeInstanceOf(BlocklistValidationError);
  });
});

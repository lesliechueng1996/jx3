import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { GameServerDetail, GameServerState } from '@jx3/jx3api';
import { createMockDb } from '../helpers/mock-db';

const baseState: GameServerState = {
  zoneName: '电信区',
  serverName: '唯我独尊',
  ipAddress: '109.244.61.89',
  ipPort: '3724',
  channel: 'zhcn_hd',
  connectState: true,
  heat: '8',
  maintainTime: 1780283421,
  delay: 80,
  mainServer: '唯我独尊',
};

const baseDetail: GameServerDetail = {
  id: '0502',
  center: '24',
  zone: '电信区',
  name: '梦江南',
  event: 36,
  voice: {
    浩气盟: [32968],
    恶人谷: [36911],
  },
  alias: ['双梦镇', '双梦'],
  slaveServers: ['梦江南', '枫泾古镇', '如梦令'],
};

const mockDb = createMockDb();

const getServerStates = mock(async () => [baseState]);
const trySearchGameServer = mock(async (name: string) =>
  name === '梦江南' ? baseDetail : null,
);

mock.module('@jx3/db', () => ({
  db: mockDb,
}));

mock.module('@jx3/jx3api', () => ({
  getServerStates,
  trySearchGameServer,
}));

const {
  collectUniqueServerNames,
  createAdminGameServer,
  deleteAdminGameServer,
  getAdminGameServerById,
  isDuplicateGameServerId,
  isGameServerReferenced,
  listAdminGameServers,
  mapGameServerDetailToCreateBody,
  planGameServerSync,
  syncAdminGameServersFromJx3box,
  updateAdminGameServer,
} = await import('../../src/services/game-servers-admin');

const createdAt = new Date('2026-01-01T00:00:00Z');
const updatedAt = new Date('2026-01-02T00:00:00Z');

const serverRow = {
  id: 'gs-1',
  serverId: '0502',
  zone: '电信区',
  name: '梦江南',
  alias: ['双梦镇', '双梦'],
  createdAt,
  updatedAt,
};

describe('mapGameServerDetailToCreateBody', () => {
  it('maps jx3api server detail to create body', () => {
    expect(mapGameServerDetailToCreateBody(baseDetail)).toEqual({
      serverId: '0502',
      zone: '电信区',
      name: '梦江南',
      alias: ['双梦镇', '双梦'],
    });
  });
});

describe('collectUniqueServerNames', () => {
  it('deduplicates server names from jx3box states', () => {
    expect(
      collectUniqueServerNames([
        baseState,
        { ...baseState, zoneName: '网通区' },
        { ...baseState, serverName: '幽月轮', mainServer: '幽月轮' },
      ]),
    ).toEqual(['唯我独尊', '幽月轮']);
  });
});

describe('planGameServerSync', () => {
  it('updates matching servers by name and inserts missing ones', () => {
    expect(
      planGameServerSync(
        [
          {
            id: 'gs-1',
            serverId: 'old-id',
            zone: '旧大区',
            name: '梦江南',
            alias: ['旧别名'],
          },
        ],
        [
          {
            serverId: '0502',
            zone: '电信区',
            name: '梦江南',
            alias: ['双梦镇', '双梦'],
          },
          {
            serverId: '1001',
            zone: '电信区',
            name: '幽月轮',
            alias: [],
          },
        ],
      ),
    ).toEqual({
      toUpdate: [
        {
          id: 'gs-1',
          serverId: '0502',
          zone: '电信区',
          alias: ['双梦镇', '双梦'],
        },
      ],
      toInsert: [
        {
          serverId: '1001',
          zone: '电信区',
          name: '幽月轮',
          alias: [],
        },
      ],
    });
  });
});

describe('game-servers-admin service', () => {
  beforeEach(() => {
    mockDb.setResults([]);
    getServerStates.mockClear();
    trySearchGameServer.mockClear();
    getServerStates.mockImplementation(async () => [baseState]);
    trySearchGameServer.mockImplementation(async (name: string) =>
      name === '梦江南' ? baseDetail : null,
    );
  });

  it('lists game servers', async () => {
    mockDb.setResults([[serverRow]]);

    await expect(listAdminGameServers()).resolves.toEqual({
      items: [
        {
          id: 'gs-1',
          serverId: '0502',
          zone: '电信区',
          name: '梦江南',
          alias: ['双梦镇', '双梦'],
          createdAt: createdAt.toISOString(),
          updatedAt: updatedAt.toISOString(),
        },
      ],
    });
  });

  it('creates, updates, and deletes game servers', async () => {
    mockDb.setResults([[serverRow], [serverRow], [{ id: 'gs-1' }]]);

    const created = await createAdminGameServer({
      serverId: '0502',
      zone: '电信区',
      name: '梦江南',
      alias: ['双梦镇', '双梦'],
    });
    const updated = await updateAdminGameServer('gs-1', { zone: '网通区' });
    const deleted = await deleteAdminGameServer('gs-1');

    expect(created.name).toBe('梦江南');
    expect(updated?.zone).toBe('电信区');
    expect(deleted).toBe(true);
  });

  it('returns null for a missing game server', async () => {
    mockDb.setResults([[]]);

    await expect(getAdminGameServerById('missing')).resolves.toBeNull();
  });

  it('detects duplicate server ids and references', async () => {
    mockDb.setResults([
      [{ id: 'gs-2' }],
      [{ id: 'gs-2' }],
      [{ id: 'character-1' }],
      [],
    ]);

    await expect(isDuplicateGameServerId('0502')).resolves.toBe(true);
    await expect(isDuplicateGameServerId('0502', 'gs-1')).resolves.toBe(true);
    await expect(isGameServerReferenced('gs-1')).resolves.toBe(true);
  });

  it('returns null when updating a missing game server', async () => {
    mockDb.setResults([[]]);

    await expect(
      updateAdminGameServer('missing', { zone: '网通区' }),
    ).resolves.toBeNull();
  });

  it('throws when create returning is empty', async () => {
    mockDb.setResults([[]]);

    await expect(
      createAdminGameServer({
        serverId: '0502',
        zone: '电信区',
        name: '梦江南',
        alias: [],
      }),
    ).rejects.toThrow('Failed to create game server');
  });

  it('returns an existing game server by id', async () => {
    mockDb.setResults([[serverRow]]);

    await expect(getAdminGameServerById('gs-1')).resolves.toMatchObject({
      id: 'gs-1',
      name: '梦江南',
    });
  });

  it('inserts new servers during sync', async () => {
    getServerStates.mockImplementation(async () => [
      { ...baseState, serverName: '梦江南' },
    ]);
    trySearchGameServer.mockImplementation(async () => baseDetail);
    mockDb.setResults([[], []]);

    const result = await syncAdminGameServersFromJx3box();

    expect(result).toEqual({ synced: 1 });
  });

  it('syncs matched servers and inserts missing ones', async () => {
    getServerStates.mockImplementation(async () => [
      { ...baseState, serverName: '梦江南' },
    ]);
    trySearchGameServer.mockImplementation(async () => baseDetail);

    mockDb.setResults([
      [
        {
          id: 'gs-1',
          serverId: 'old-id',
          zone: '旧大区',
          name: '梦江南',
          alias: ['旧别名'],
          createdAt,
          updatedAt,
        },
      ],
      [],
      [],
    ]);

    const result = await syncAdminGameServersFromJx3box();

    expect(result).toEqual({ synced: 1 });
  });
});

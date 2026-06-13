import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { type AppRole, SUPER_ADMIN_ROLE, USER_ROLE } from '@jx3/auth/roles';
import { Elysia } from 'elysia';

const adminGameServer = {
  id: 'gs1',
  serverId: '10001',
  zone: '电信区',
  name: '幽月轮',
  alias: ['幽月'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const sessionUser: {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: null;
  role: AppRole;
  createdAt: Date;
} = {
  id: 'admin-1',
  name: 'Admin',
  email: 'admin@example.com',
  emailVerified: true,
  image: null,
  role: SUPER_ADMIN_ROLE,
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

let mockSession: {
  user: typeof sessionUser;
  session: { id: string };
} | null = null;

const listAdminGameServers = mock(async () => ({
  items: [adminGameServer],
}));

const getAdminGameServerById = mock(async (id: string) =>
  id === 'gs1' ? adminGameServer : null,
);

const createAdminGameServer = mock(async () => adminGameServer);
const updateAdminGameServer = mock(async () => adminGameServer);
const isDuplicateGameServerId = mock(async () => false);
const isGameServerReferenced = mock(async () => false);
const deleteAdminGameServer = mock(async () => true);
const syncAdminGameServersFromJx3box = mock(async () => ({ synced: 42 }));

mock.module('../../src/lib/auth', () => ({
  auth: {
    api: {
      getSession: async () => mockSession,
    },
  },
}));

mock.module('../../src/services/game-servers-admin', () => ({
  listAdminGameServers,
  getAdminGameServerById,
  createAdminGameServer,
  updateAdminGameServer,
  isDuplicateGameServerId,
  isGameServerReferenced,
  deleteAdminGameServer,
  syncAdminGameServersFromJx3box,
}));

const { gameServersAdminRoute } = await import(
  '../../src/routes/game-servers-admin'
);

const app = () => new Elysia().use(gameServersAdminRoute);

describe('game servers admin routes', () => {
  beforeEach(() => {
    mockSession = null;
    listAdminGameServers.mockClear();
    getAdminGameServerById.mockClear();
    createAdminGameServer.mockClear();
    updateAdminGameServer.mockClear();
    isDuplicateGameServerId.mockClear();
    isGameServerReferenced.mockClear();
    deleteAdminGameServer.mockClear();
    syncAdminGameServersFromJx3box.mockClear();
    getAdminGameServerById.mockImplementation(async (id: string) =>
      id === 'gs1' ? adminGameServer : null,
    );
    createAdminGameServer.mockImplementation(async () => adminGameServer);
    updateAdminGameServer.mockImplementation(async () => adminGameServer);
    isDuplicateGameServerId.mockImplementation(async () => false);
    isGameServerReferenced.mockImplementation(async () => false);
    deleteAdminGameServer.mockImplementation(async () => true);
    syncAdminGameServersFromJx3box.mockImplementation(async () => ({
      synced: 42,
    }));
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-servers'),
    );
    expect(res.status).toBe(401);
  });

  it('lists game servers for authenticated users', async () => {
    mockSession = {
      user: { ...sessionUser, role: USER_ROLE },
      session: { id: 's1' },
    };
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-servers'),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      items: [adminGameServer],
    });
    expect(listAdminGameServers).toHaveBeenCalled();
  });

  it('returns 403 for non super_admin users on sync', async () => {
    mockSession = {
      user: { ...sessionUser, role: USER_ROLE },
      session: { id: 's1' },
    };
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-servers/sync', {
        method: 'POST',
      }),
    );
    expect(res.status).toBe(403);
  });

  it('lists game servers for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-servers'),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      items: [adminGameServer],
    });
    expect(listAdminGameServers).toHaveBeenCalled();
  });

  it('syncs game servers for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-servers/sync', {
        method: 'POST',
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ synced: 42 });
    expect(syncAdminGameServersFromJx3box).toHaveBeenCalled();
  });

  it('returns 502 when sync fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    syncAdminGameServersFromJx3box.mockImplementation(async () => {
      throw new Error('upstream failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-servers/sync', {
        method: 'POST',
      }),
    );
    expect(res.status).toBe(502);
  });

  it('creates a game server for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-servers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          serverId: '10001',
          zone: '电信区',
          name: '幽月轮',
          alias: ['幽月'],
        }),
      }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject(adminGameServer);
    expect(createAdminGameServer).toHaveBeenCalled();
  });

  it('returns 409 when creating with duplicate server ID', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    isDuplicateGameServerId.mockImplementation(async () => true);
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-servers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          serverId: '10001',
          zone: '电信区',
          name: '幽月轮',
          alias: [],
        }),
      }),
    );
    expect(res.status).toBe(409);
    expect(createAdminGameServer).not.toHaveBeenCalled();
  });

  it('updates a game server for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-servers/gs1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '幽月轮新' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject(adminGameServer);
    expect(updateAdminGameServer).toHaveBeenCalled();
  });

  it('returns 404 when updating a missing game server', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    getAdminGameServerById.mockImplementation(async () => null);
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-servers/missing', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '幽月轮新' }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it('returns 409 when updating to a duplicate server ID', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    isDuplicateGameServerId.mockImplementation(async () => true);
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-servers/gs1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ serverId: '10002' }),
      }),
    );
    expect(res.status).toBe(409);
    expect(updateAdminGameServer).not.toHaveBeenCalled();
  });

  it('deletes a game server for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-servers/gs1', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(deleteAdminGameServer).toHaveBeenCalled();
  });

  it('returns 409 when deleting a referenced game server', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    isGameServerReferenced.mockImplementation(async () => true);
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-servers/gs1', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(409);
    expect(deleteAdminGameServer).not.toHaveBeenCalled();
  });

  it('returns 404 when deleting a missing game server', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    getAdminGameServerById.mockImplementation(async () => null);
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-servers/missing', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(404);
  });

  it('returns 400 when create fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    createAdminGameServer.mockImplementation(async () => {
      throw new Error('create failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-servers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          serverId: '10001',
          zone: '电信区',
          name: '幽月轮',
          alias: [],
        }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when update fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    updateAdminGameServer.mockImplementation(async () => {
      throw new Error('update failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-servers/gs1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '幽月轮新' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when delete fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    deleteAdminGameServer.mockImplementation(async () => {
      throw new Error('delete failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-servers/gs1', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(400);
  });
});

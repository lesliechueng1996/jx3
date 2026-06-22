import { beforeEach, describe, expect, it, mock } from 'bun:test';
import {
  ADMIN_ROLE,
  type AppRole,
  SUPER_ADMIN_ROLE,
  USER_ROLE,
} from '@jx3/auth/roles';
import { Elysia } from 'elysia';

const raidBrandItem = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'XX金团',
  remark: '跳车',
  createdBy: 'user-1',
  createdByName: 'Leader',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const playerItem = {
  id: '22222222-2222-4222-8222-222222222222',
  characterName: '叶修',
  serverId: '33333333-3333-4333-8333-333333333333',
  serverName: '梦江南',
  schoolId: null,
  schoolName: null,
  remark: '毛装备',
  createdBy: 'user-1',
  createdByName: 'Leader',
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
  id: 'user-1',
  name: 'Leader',
  email: 'leader@example.com',
  emailVerified: true,
  image: null,
  role: USER_ROLE,
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

let mockSession: {
  user: typeof sessionUser;
  session: { id: string };
} | null = null;

const listRaidBrandBlocklist = mock(async () => ({ items: [raidBrandItem] }));
const createRaidBrandBlocklistEntry = mock(async () => raidBrandItem);
const deleteRaidBrandBlocklistEntry = mock(async () => true);
const listPlayerBlocklist = mock(async () => ({ items: [playerItem] }));
const createPlayerBlocklistEntry = mock(async () => playerItem);
const deletePlayerBlocklistEntry = mock(async () => true);

class BlocklistConflictError extends Error {
  name = 'BlocklistConflictError';
}

class BlocklistValidationError extends Error {
  name = 'BlocklistValidationError';
}

mock.module('../../src/lib/auth', () => ({
  auth: {
    api: {
      getSession: async () => mockSession,
    },
  },
}));

mock.module('../../src/services/blocklist', () => ({
  listRaidBrandBlocklist,
  createRaidBrandBlocklistEntry,
  deleteRaidBrandBlocklistEntry,
  listPlayerBlocklist,
  createPlayerBlocklistEntry,
  deletePlayerBlocklistEntry,
  BlocklistConflictError,
  BlocklistValidationError,
}));

const { blocklistRoute } = await import('../../src/routes/blocklist');

const app = () => new Elysia().use(blocklistRoute);

describe('blocklist routes', () => {
  beforeEach(() => {
    mockSession = {
      user: sessionUser,
      session: { id: 'session-1' },
    };
    sessionUser.role = USER_ROLE;
    listRaidBrandBlocklist.mockClear();
    createRaidBrandBlocklistEntry.mockClear();
    deleteRaidBrandBlocklistEntry.mockClear();
    listPlayerBlocklist.mockClear();
    createPlayerBlocklistEntry.mockClear();
    deletePlayerBlocklistEntry.mockClear();
  });

  it('returns 401 when listing raid brands unauthenticated', async () => {
    mockSession = null;
    const res = await app().handle(
      new Request('http://localhost/api/v1/blocklist/raid-brands'),
    );
    expect(res.status).toBe(401);
  });

  it('lists raid brand blocklist entries for authenticated users', async () => {
    const res = await app().handle(
      new Request('http://localhost/api/v1/blocklist/raid-brands?q=金'),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [raidBrandItem] });
    expect(listRaidBrandBlocklist).toHaveBeenCalledWith({ q: '金' });
  });

  it('creates raid brand blocklist entries for authenticated users', async () => {
    const res = await app().handle(
      new Request('http://localhost/api/v1/blocklist/raid-brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'XX金团', remark: '跳车' }),
      }),
    );
    expect(res.status).toBe(201);
    expect(createRaidBrandBlocklistEntry).toHaveBeenCalled();
  });

  it('returns 403 when regular users delete raid brand entries', async () => {
    const res = await app().handle(
      new Request(
        `http://localhost/api/v1/blocklist/raid-brands/${raidBrandItem.id}`,
        { method: 'DELETE' },
      ),
    );
    expect(res.status).toBe(403);
    expect(deleteRaidBrandBlocklistEntry).not.toHaveBeenCalled();
  });

  it('allows admin users to delete raid brand entries', async () => {
    sessionUser.role = ADMIN_ROLE;
    const res = await app().handle(
      new Request(
        `http://localhost/api/v1/blocklist/raid-brands/${raidBrandItem.id}`,
        { method: 'DELETE' },
      ),
    );
    expect(res.status).toBe(204);
    expect(deleteRaidBrandBlocklistEntry).toHaveBeenCalledWith(
      raidBrandItem.id,
    );
  });

  it('allows super admin users to delete player entries', async () => {
    sessionUser.role = SUPER_ADMIN_ROLE;
    const res = await app().handle(
      new Request(
        `http://localhost/api/v1/blocklist/players/${playerItem.id}`,
        { method: 'DELETE' },
      ),
    );
    expect(res.status).toBe(204);
    expect(deletePlayerBlocklistEntry).toHaveBeenCalledWith(playerItem.id);
  });

  it('returns 409 when creating duplicate raid brand entries', async () => {
    createRaidBrandBlocklistEntry.mockImplementation(async () => {
      throw new BlocklistConflictError(
        'This raid brand is already blocklisted',
      );
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/blocklist/raid-brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'XX金团' }),
      }),
    );
    expect(res.status).toBe(409);
  });

  it('returns 400 when creating raid brand entries fails validation', async () => {
    createRaidBrandBlocklistEntry.mockImplementation(async () => {
      throw new BlocklistValidationError('name is required');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/blocklist/raid-brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'XX金团' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when deleting missing raid brand entries', async () => {
    sessionUser.role = ADMIN_ROLE;
    deleteRaidBrandBlocklistEntry.mockImplementation(async () => false);
    const res = await app().handle(
      new Request(
        `http://localhost/api/v1/blocklist/raid-brands/${raidBrandItem.id}`,
        { method: 'DELETE' },
      ),
    );
    expect(res.status).toBe(404);
  });

  it('lists player blocklist entries for authenticated users', async () => {
    const res = await app().handle(
      new Request('http://localhost/api/v1/blocklist/players?q=叶'),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [playerItem] });
  });

  it('returns 409 when creating duplicate player entries', async () => {
    createPlayerBlocklistEntry.mockImplementation(async () => {
      throw new BlocklistConflictError('This player is already blocklisted');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/blocklist/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: '叶修',
          serverId: playerItem.serverId,
        }),
      }),
    );
    expect(res.status).toBe(409);
  });

  it('returns 400 when creating player entries fails validation', async () => {
    createPlayerBlocklistEntry.mockImplementation(async () => {
      throw new BlocklistValidationError('serverId is invalid');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/blocklist/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: '叶修',
          serverId: playerItem.serverId,
        }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when deleting missing player entries', async () => {
    sessionUser.role = ADMIN_ROLE;
    deletePlayerBlocklistEntry.mockImplementation(async () => false);
    const res = await app().handle(
      new Request(
        `http://localhost/api/v1/blocklist/players/${playerItem.id}`,
        { method: 'DELETE' },
      ),
    );
    expect(res.status).toBe(404);
  });

  it('returns 400 when raid brand creation fails unexpectedly', async () => {
    createRaidBrandBlocklistEntry.mockImplementation(async () => {
      throw new Error('db failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/blocklist/raid-brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'XX金团' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when player creation fails unexpectedly', async () => {
    createPlayerBlocklistEntry.mockImplementation(async () => {
      throw new Error('db failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/blocklist/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: '叶修',
          serverId: playerItem.serverId,
        }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when deleting raid brand entries fails unexpectedly', async () => {
    sessionUser.role = ADMIN_ROLE;
    deleteRaidBrandBlocklistEntry.mockImplementation(async () => {
      throw new Error('db failed');
    });
    const res = await app().handle(
      new Request(
        `http://localhost/api/v1/blocklist/raid-brands/${raidBrandItem.id}`,
        { method: 'DELETE' },
      ),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when deleting player entries fails unexpectedly', async () => {
    sessionUser.role = ADMIN_ROLE;
    deletePlayerBlocklistEntry.mockImplementation(async () => {
      throw new Error('db failed');
    });
    const res = await app().handle(
      new Request(
        `http://localhost/api/v1/blocklist/players/${playerItem.id}`,
        { method: 'DELETE' },
      ),
    );
    expect(res.status).toBe(400);
  });
});

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { type AppRole, SUPER_ADMIN_ROLE, USER_ROLE } from '@jx3/auth/roles';
import { Elysia } from 'elysia';

const adminDungeon = {
  id: 'd1',
  name: '雷域大泽',
  expansionId: 'e1',
  expansionName: '横刀断浪',
  seasonId: 's1',
  seasonName: '第一赛季',
  playerLimit: 25,
  difficulty: 'heroic' as const,
  levelRequirement: 130,
  bossCount: 6,
  resetWeekdays: [1, 4],
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

const listAdminDungeons = mock(async () => ({
  items: [adminDungeon],
  total: 1,
  page: 1,
  pageSize: 20,
}));

const getAdminDungeonById = mock(async (dungeonId: string) =>
  dungeonId === 'd1' ? adminDungeon : null,
);

const createAdminDungeon = mock(async () => adminDungeon);
const updateAdminDungeon = mock(async () => adminDungeon);
const isDungeonReferenced = mock(async () => false);
const deleteAdminDungeon = mock(async () => true);

mock.module('../../src/lib/auth', () => ({
  auth: {
    api: {
      getSession: async () => mockSession,
    },
  },
}));

mock.module('../../src/services/dungeons-admin', () => ({
  listAdminDungeons,
  getAdminDungeonById,
  createAdminDungeon,
  updateAdminDungeon,
  isDungeonReferenced,
  deleteAdminDungeon,
  DungeonValidationError: class DungeonValidationError extends Error {
    name = 'DungeonValidationError';
  },
}));

const { dungeonsAdminRoute } = await import('../../src/routes/dungeons-admin');

const app = () => new Elysia().use(dungeonsAdminRoute);

const createBody = {
  name: '雷域大泽',
  expansionId: '00000000-0000-4000-8000-000000000001',
  seasonId: '00000000-0000-4000-8000-000000000002',
  playerLimit: 25,
  difficulty: 'heroic',
  levelRequirement: 130,
  bossCount: 6,
  resetWeekdays: [1, 4],
};

describe('dungeons admin routes', () => {
  beforeEach(() => {
    mockSession = null;
    listAdminDungeons.mockClear();
    getAdminDungeonById.mockClear();
    createAdminDungeon.mockClear();
    updateAdminDungeon.mockClear();
    isDungeonReferenced.mockClear();
    deleteAdminDungeon.mockClear();
    getAdminDungeonById.mockImplementation(async (dungeonId: string) =>
      dungeonId === 'd1' ? adminDungeon : null,
    );
    createAdminDungeon.mockImplementation(async () => adminDungeon);
    updateAdminDungeon.mockImplementation(async () => adminDungeon);
    isDungeonReferenced.mockImplementation(async () => false);
    deleteAdminDungeon.mockImplementation(async () => true);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await app().handle(
      new Request('http://localhost/api/v1/dungeons'),
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 for non super_admin users', async () => {
    mockSession = {
      user: { ...sessionUser, role: USER_ROLE },
      session: { id: 's1' },
    };
    const res = await app().handle(
      new Request('http://localhost/api/v1/dungeons'),
    );
    expect(res.status).toBe(403);
  });

  it('lists dungeons for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/dungeons'),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      items: [adminDungeon],
      total: 1,
    });
    expect(listAdminDungeons).toHaveBeenCalled();
  });

  it('creates a dungeon for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/dungeons', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(createBody),
      }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject(adminDungeon);
    expect(createAdminDungeon).toHaveBeenCalled();
  });

  it('updates a dungeon for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/dungeons/d1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '新副本名' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject(adminDungeon);
    expect(updateAdminDungeon).toHaveBeenCalled();
  });

  it('returns 404 when updating a missing dungeon', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    getAdminDungeonById.mockImplementation(async () => null);
    const res = await app().handle(
      new Request('http://localhost/api/v1/dungeons/missing', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '新副本名' }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it('deletes a dungeon for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/dungeons/d1', { method: 'DELETE' }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(deleteAdminDungeon).toHaveBeenCalled();
  });

  it('returns 409 when deleting a referenced dungeon', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    isDungeonReferenced.mockImplementation(async () => true);
    const res = await app().handle(
      new Request('http://localhost/api/v1/dungeons/d1', { method: 'DELETE' }),
    );
    expect(res.status).toBe(409);
    expect(deleteAdminDungeon).not.toHaveBeenCalled();
  });

  it('returns 404 when deleting a missing dungeon', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    getAdminDungeonById.mockImplementation(async () => null);
    const res = await app().handle(
      new Request('http://localhost/api/v1/dungeons/missing', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(404);
  });

  it('returns 400 when create fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    createAdminDungeon.mockImplementation(async () => {
      throw new Error('create failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/dungeons', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(createBody),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when update fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    updateAdminDungeon.mockImplementation(async () => {
      throw new Error('update failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/dungeons/d1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '新副本名' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when delete fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    deleteAdminDungeon.mockImplementation(async () => {
      throw new Error('delete failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/dungeons/d1', { method: 'DELETE' }),
    );
    expect(res.status).toBe(400);
  });
});

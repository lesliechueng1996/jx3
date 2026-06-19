import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { type AppRole, SUPER_ADMIN_ROLE, USER_ROLE } from '@jx3/auth/roles';
import { Elysia } from 'elysia';

const adminGameItem = {
  id: 'item-1',
  name: '玄晶',
  gameItemId: '12345',
  type: 'special' as const,
  quality: 'orange' as const,
  description: '稀有材料',
  icon: 'https://example.com/icon.png',
  alias: ['玄晶碎片'],
  createdAt: '2026-06-19T00:00:00.000Z',
  updatedAt: '2026-06-19T00:00:00.000Z',
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

const listAdminGameItems = mock(async () => ({
  items: [adminGameItem],
  total: 1,
  page: 1,
  pageSize: 20,
}));

const getAdminGameItemById = mock(async (itemId: string) =>
  itemId === 'item-1' ? adminGameItem : null,
);

const createAdminGameItem = mock(async () => adminGameItem);
const updateAdminGameItem = mock(async () => adminGameItem);
const isGameItemReferenced = mock(async () => false);
const deleteAdminGameItem = mock(async () => true);

mock.module('../../src/lib/auth', () => ({
  auth: {
    api: {
      getSession: async () => mockSession,
    },
  },
}));

mock.module('../../src/services/game-items-admin', () => ({
  listAdminGameItems,
  getAdminGameItemById,
  createAdminGameItem,
  updateAdminGameItem,
  isGameItemReferenced,
  deleteAdminGameItem,
}));

const { gameItemsAdminRoute } = await import(
  '../../src/routes/game-items-admin'
);

const app = () => new Elysia().use(gameItemsAdminRoute);

describe('game-items-admin routes', () => {
  beforeEach(() => {
    mockSession = {
      user: sessionUser,
      session: { id: 'session-1' },
    };
    listAdminGameItems.mockClear();
    getAdminGameItemById.mockClear();
    createAdminGameItem.mockClear();
    updateAdminGameItem.mockClear();
    isGameItemReferenced.mockClear();
    deleteAdminGameItem.mockClear();
    getAdminGameItemById.mockImplementation(async (itemId: string) =>
      itemId === 'item-1' ? adminGameItem : null,
    );
    createAdminGameItem.mockImplementation(async () => adminGameItem);
    updateAdminGameItem.mockImplementation(async () => adminGameItem);
    isGameItemReferenced.mockImplementation(async () => false);
    deleteAdminGameItem.mockImplementation(async () => true);
  });

  it('returns 401 when listing unauthenticated', async () => {
    mockSession = null;
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-items'),
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 when listing without super_admin role', async () => {
    mockSession = {
      user: { ...sessionUser, role: USER_ROLE },
      session: { id: 'session-1' },
    };
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-items'),
    );
    expect(res.status).toBe(403);
  });

  it('lists game items for super_admin', async () => {
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-items'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it('creates game items for super_admin', async () => {
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-items/admin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: '玄晶',
          type: 'special',
          quality: 'orange',
          alias: ['玄晶碎片'],
        }),
      }),
    );
    expect(res.status).toBe(201);
  });

  it('returns 400 when admin create fails unexpectedly', async () => {
    createAdminGameItem.mockImplementation(async () => {
      throw new Error('create failed');
    });

    const res = await app().handle(
      new Request('http://localhost/api/v1/game-items/admin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: '玄晶',
          type: 'special',
          quality: 'orange',
        }),
      }),
    );

    expect(res.status).toBe(400);
  });

  it('updates game items for super_admin', async () => {
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-items/item-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '新玄晶' }),
      }),
    );
    expect(res.status).toBe(200);
  });

  it('returns 404 when updating a missing game item', async () => {
    getAdminGameItemById.mockImplementation(async () => null);

    const res = await app().handle(
      new Request('http://localhost/api/v1/game-items/missing', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '新玄晶' }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it('returns 400 when update fails unexpectedly', async () => {
    updateAdminGameItem.mockImplementation(async () => {
      throw new Error('update failed');
    });

    const res = await app().handle(
      new Request('http://localhost/api/v1/game-items/item-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '新玄晶' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('deletes game items for super_admin', async () => {
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-items/item-1', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(200);
  });

  it('returns 409 when deleting a referenced game item', async () => {
    isGameItemReferenced.mockImplementation(async () => true);

    const res = await app().handle(
      new Request('http://localhost/api/v1/game-items/item-1', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(409);
  });

  it('returns 404 when deleting a missing game item', async () => {
    getAdminGameItemById.mockImplementation(async () => null);

    const res = await app().handle(
      new Request('http://localhost/api/v1/game-items/missing', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(404);
  });

  it('returns 400 when delete fails unexpectedly', async () => {
    deleteAdminGameItem.mockImplementation(async () => {
      throw new Error('delete failed');
    });

    const res = await app().handle(
      new Request('http://localhost/api/v1/game-items/item-1', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(400);
  });
});

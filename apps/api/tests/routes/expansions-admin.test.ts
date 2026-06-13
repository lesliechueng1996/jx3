import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { type AppRole, SUPER_ADMIN_ROLE, USER_ROLE } from '@jx3/auth/roles';
import { Elysia } from 'elysia';

const adminExpansion = {
  id: 'e1',
  name: '横刀断浪',
  description: '资料片描述',
  level: 130,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
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

const listAdminExpansions = mock(async () => ({
  items: [adminExpansion],
}));

const getAdminExpansionById = mock(async (expansionId: string) =>
  expansionId === 'e1' ? adminExpansion : null,
);

const createAdminExpansion = mock(async () => adminExpansion);
const updateAdminExpansion = mock(async () => adminExpansion);
const isExpansionReferenced = mock(async () => false);
const deleteAdminExpansion = mock(async () => true);

mock.module('../../src/lib/auth', () => ({
  auth: {
    api: {
      getSession: async () => mockSession,
    },
  },
}));

mock.module('../../src/services/expansions-admin', () => ({
  listAdminExpansions,
  getAdminExpansionById,
  createAdminExpansion,
  updateAdminExpansion,
  isExpansionReferenced,
  deleteAdminExpansion,
}));

const { expansionsAdminRoute } = await import(
  '../../src/routes/expansions-admin'
);

const app = () => new Elysia().use(expansionsAdminRoute);

describe('expansions admin routes', () => {
  beforeEach(() => {
    mockSession = null;
    listAdminExpansions.mockClear();
    getAdminExpansionById.mockClear();
    createAdminExpansion.mockClear();
    updateAdminExpansion.mockClear();
    isExpansionReferenced.mockClear();
    deleteAdminExpansion.mockClear();
    getAdminExpansionById.mockImplementation(async (expansionId: string) =>
      expansionId === 'e1' ? adminExpansion : null,
    );
    createAdminExpansion.mockImplementation(async () => adminExpansion);
    updateAdminExpansion.mockImplementation(async () => adminExpansion);
    isExpansionReferenced.mockImplementation(async () => false);
    deleteAdminExpansion.mockImplementation(async () => true);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await app().handle(
      new Request('http://localhost/api/v1/expansions'),
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 for non super_admin users', async () => {
    mockSession = {
      user: { ...sessionUser, role: USER_ROLE },
      session: { id: 's1' },
    };
    const res = await app().handle(
      new Request('http://localhost/api/v1/expansions'),
    );
    expect(res.status).toBe(403);
  });

  it('lists expansions for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/expansions'),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      items: [adminExpansion],
    });
    expect(listAdminExpansions).toHaveBeenCalled();
  });

  it('creates an expansion for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/expansions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: '横刀断浪',
          description: '资料片描述',
          level: 130,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        }),
      }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject(adminExpansion);
    expect(createAdminExpansion).toHaveBeenCalled();
  });

  it('updates an expansion for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/expansions/e1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '新名称' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject(adminExpansion);
    expect(updateAdminExpansion).toHaveBeenCalled();
  });

  it('returns 404 when updating a missing expansion', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    getAdminExpansionById.mockImplementation(async () => null);
    const res = await app().handle(
      new Request('http://localhost/api/v1/expansions/missing', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '新名称' }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it('deletes an expansion for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/expansions/e1', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(deleteAdminExpansion).toHaveBeenCalled();
  });

  it('returns 409 when deleting a referenced expansion', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    isExpansionReferenced.mockImplementation(async () => true);
    const res = await app().handle(
      new Request('http://localhost/api/v1/expansions/e1', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(409);
    expect(deleteAdminExpansion).not.toHaveBeenCalled();
  });

  it('returns 404 when deleting a missing expansion', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    getAdminExpansionById.mockImplementation(async () => null);
    const res = await app().handle(
      new Request('http://localhost/api/v1/expansions/missing', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(404);
  });

  it('returns 400 when create fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    createAdminExpansion.mockImplementation(async () => {
      throw new Error('create failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/expansions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: '横刀断浪',
          level: 130,
          startDate: '2024-01-01',
        }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when update fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    updateAdminExpansion.mockImplementation(async () => {
      throw new Error('update failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/expansions/e1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '新名称' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when delete fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    deleteAdminExpansion.mockImplementation(async () => {
      throw new Error('delete failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/expansions/e1', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(400);
  });
});

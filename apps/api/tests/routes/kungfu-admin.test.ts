import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';
import { SUPER_ADMIN_ROLE } from '@jx3/auth/roles';

const adminKungfu = {
  id: 'k1',
  name: '傲血战意',
  schoolId: 's1',
  schoolName: '天策',
  kungfuType: 'attack' as const,
  attackType: 'external' as const,
  attackMethod: 'melee' as const,
  formationEffect: null,
  isPveExternalRecommended: true,
  isPveInternalRecommended: false,
  isUnlimited: false,
  icon: 'https://example.com/icon.png',
  alias: ['傲血'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const sessionUser = {
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

const listAdminKungfu = mock(async () => ({
  items: [adminKungfu],
  total: 1,
  page: 1,
  pageSize: 20,
}));

const getAdminKungfuById = mock(async (kungfuId: string) =>
  kungfuId === 'k1' ? adminKungfu : null,
);

const createAdminKungfu = mock(async () => adminKungfu);
const updateAdminKungfu = mock(async () => adminKungfu);
const isKungfuReferenced = mock(async () => false);
const deleteAdminKungfu = mock(async () => true);

mock.module('../../src/lib/auth', () => ({
  auth: {
    api: {
      getSession: async () => mockSession,
    },
  },
}));

mock.module('../../src/services/kungfu-admin', () => ({
  listAdminKungfu,
  getAdminKungfuById,
  createAdminKungfu,
  updateAdminKungfu,
  isKungfuReferenced,
  deleteAdminKungfu,
}));

const { kungfuAdminRoute } = await import('../../src/routes/kungfu-admin');

const app = () => new Elysia().use(kungfuAdminRoute);

describe('kungfu admin routes', () => {
  beforeEach(() => {
    mockSession = null;
    listAdminKungfu.mockClear();
    getAdminKungfuById.mockClear();
    createAdminKungfu.mockClear();
    updateAdminKungfu.mockClear();
    isKungfuReferenced.mockClear();
    deleteAdminKungfu.mockClear();
    getAdminKungfuById.mockImplementation(async (kungfuId: string) =>
      kungfuId === 'k1' ? adminKungfu : null,
    );
    createAdminKungfu.mockImplementation(async () => adminKungfu);
    updateAdminKungfu.mockImplementation(async () => adminKungfu);
    isKungfuReferenced.mockImplementation(async () => false);
    deleteAdminKungfu.mockImplementation(async () => true);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await app().handle(new Request('http://localhost/api/v1/kungfu'));
    expect(res.status).toBe(401);
  });

  it('returns 403 for non super_admin users', async () => {
    mockSession = {
      user: { ...sessionUser, role: 'user' },
      session: { id: 's1' },
    };
    const res = await app().handle(new Request('http://localhost/api/v1/kungfu'));
    expect(res.status).toBe(403);
  });

  it('lists kungfu for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(new Request('http://localhost/api/v1/kungfu'));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      items: [adminKungfu],
      total: 1,
    });
    expect(listAdminKungfu).toHaveBeenCalled();
  });

  it('creates a kungfu for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/kungfu', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: '傲血战意',
          schoolId: '00000000-0000-4000-8000-000000000001',
          kungfuType: 'attack',
          attackType: 'external',
          attackMethod: 'melee',
          alias: ['傲血'],
        }),
      }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject(adminKungfu);
    expect(createAdminKungfu).toHaveBeenCalled();
  });

  it('updates a kungfu for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/kungfu/k1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '傲血' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject(adminKungfu);
    expect(updateAdminKungfu).toHaveBeenCalled();
  });

  it('returns 404 when updating a missing kungfu', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    getAdminKungfuById.mockImplementation(async () => null);
    const res = await app().handle(
      new Request('http://localhost/api/v1/kungfu/missing', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '傲血' }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it('deletes a kungfu for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/kungfu/k1', { method: 'DELETE' }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(deleteAdminKungfu).toHaveBeenCalled();
  });

  it('returns 409 when deleting a referenced kungfu', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    isKungfuReferenced.mockImplementation(async () => true);
    const res = await app().handle(
      new Request('http://localhost/api/v1/kungfu/k1', { method: 'DELETE' }),
    );
    expect(res.status).toBe(409);
    expect(deleteAdminKungfu).not.toHaveBeenCalled();
  });

  it('returns 404 when deleting a missing kungfu', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    getAdminKungfuById.mockImplementation(async () => null);
    const res = await app().handle(
      new Request('http://localhost/api/v1/kungfu/missing', { method: 'DELETE' }),
    );
    expect(res.status).toBe(404);
  });

  it('returns 400 when create fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    createAdminKungfu.mockImplementation(async () => {
      throw new Error('create failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/kungfu', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: '傲血战意',
          schoolId: '00000000-0000-4000-8000-000000000001',
          kungfuType: 'attack',
          alias: [],
        }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when update fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    updateAdminKungfu.mockImplementation(async () => {
      throw new Error('update failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/kungfu/k1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '傲血' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when delete fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    deleteAdminKungfu.mockImplementation(async () => {
      throw new Error('delete failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/kungfu/k1', { method: 'DELETE' }),
    );
    expect(res.status).toBe(400);
  });
});

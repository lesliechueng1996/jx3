import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { type AppRole, SUPER_ADMIN_ROLE, USER_ROLE } from '@jx3/auth/roles';
import { Elysia } from 'elysia';

const adminSchool = {
  id: 's1',
  name: '天策',
  type: 'school' as const,
  icon: 'https://example.com/icon.png',
  alias: ['天策府'],
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

const listAdminSchools = mock(async () => ({
  items: [adminSchool],
  total: 1,
  page: 1,
  pageSize: 20,
}));

const listAllSchoolOptions = mock(async () => ({
  items: [{ id: 's1', name: '天策' }],
}));

const getAdminSchoolById = mock(async (schoolId: string) =>
  schoolId === 's1' ? adminSchool : null,
);

const createAdminSchool = mock(async () => adminSchool);
const updateAdminSchool = mock(async () => adminSchool);
const isSchoolReferenced = mock(async () => false);
const deleteAdminSchool = mock(async () => true);

mock.module('../../src/lib/auth', () => ({
  auth: {
    api: {
      getSession: async () => mockSession,
    },
  },
}));

mock.module('../../src/services/schools-admin', () => ({
  listAdminSchools,
  listAllSchoolOptions,
  getAdminSchoolById,
  createAdminSchool,
  updateAdminSchool,
  isSchoolReferenced,
  deleteAdminSchool,
}));

const { schoolsAdminRoute } = await import('../../src/routes/schools-admin');

const app = () => new Elysia().use(schoolsAdminRoute);

describe('schools admin routes', () => {
  beforeEach(() => {
    mockSession = null;
    listAdminSchools.mockClear();
    listAllSchoolOptions.mockClear();
    getAdminSchoolById.mockClear();
    createAdminSchool.mockClear();
    updateAdminSchool.mockClear();
    isSchoolReferenced.mockClear();
    deleteAdminSchool.mockClear();
    getAdminSchoolById.mockImplementation(async (schoolId: string) =>
      schoolId === 's1' ? adminSchool : null,
    );
    createAdminSchool.mockImplementation(async () => adminSchool);
    updateAdminSchool.mockImplementation(async () => adminSchool);
    isSchoolReferenced.mockImplementation(async () => false);
    deleteAdminSchool.mockImplementation(async () => true);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await app().handle(
      new Request('http://localhost/api/v1/schools'),
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 for non super_admin users on admin list', async () => {
    mockSession = {
      user: { ...sessionUser, role: USER_ROLE },
      session: { id: 's1' },
    };
    const res = await app().handle(
      new Request('http://localhost/api/v1/schools'),
    );
    expect(res.status).toBe(403);
  });

  it('lists school options for authenticated users', async () => {
    mockSession = {
      user: { ...sessionUser, role: USER_ROLE },
      session: { id: 's1' },
    };
    const res = await app().handle(
      new Request('http://localhost/api/v1/schools/options'),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      items: [{ id: 's1', name: '天策' }],
    });
    expect(listAllSchoolOptions).toHaveBeenCalled();
  });

  it('lists schools for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/schools'),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      items: [adminSchool],
      total: 1,
    });
    expect(listAdminSchools).toHaveBeenCalled();
  });

  it('lists school options for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/schools/options'),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      items: [{ id: 's1', name: '天策' }],
    });
    expect(listAllSchoolOptions).toHaveBeenCalled();
  });

  it('creates a school for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/schools', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: '天策',
          type: 'school',
          icon: 'https://example.com/icon.png',
          alias: ['天策府'],
        }),
      }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject(adminSchool);
    expect(createAdminSchool).toHaveBeenCalled();
  });

  it('updates a school for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/schools/s1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '天策府' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject(adminSchool);
    expect(updateAdminSchool).toHaveBeenCalled();
  });

  it('returns 404 when updating a missing school', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    getAdminSchoolById.mockImplementation(async () => null);
    const res = await app().handle(
      new Request('http://localhost/api/v1/schools/missing', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '天策府' }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it('deletes a school for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/schools/s1', { method: 'DELETE' }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(deleteAdminSchool).toHaveBeenCalled();
  });

  it('returns 409 when deleting a referenced school', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    isSchoolReferenced.mockImplementation(async () => true);
    const res = await app().handle(
      new Request('http://localhost/api/v1/schools/s1', { method: 'DELETE' }),
    );
    expect(res.status).toBe(409);
    expect(deleteAdminSchool).not.toHaveBeenCalled();
  });

  it('returns 404 when deleting a missing school', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    getAdminSchoolById.mockImplementation(async () => null);
    const res = await app().handle(
      new Request('http://localhost/api/v1/schools/missing', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(404);
  });

  it('returns 400 when create fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    createAdminSchool.mockImplementation(async () => {
      throw new Error('create failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/schools', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: '天策',
          type: 'school',
          alias: [],
        }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when update fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    updateAdminSchool.mockImplementation(async () => {
      throw new Error('update failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/schools/s1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '天策府' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when delete fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    deleteAdminSchool.mockImplementation(async () => {
      throw new Error('delete failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/schools/s1', { method: 'DELETE' }),
    );
    expect(res.status).toBe(400);
  });
});

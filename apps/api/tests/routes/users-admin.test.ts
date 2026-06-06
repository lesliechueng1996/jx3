import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';
import { SUPER_ADMIN_ROLE } from '@jx3/auth/roles';

const adminUser = {
  id: 'u1',
  name: 'Alice',
  emailMasked: 'a***@example.com',
  role: 'user',
  banned: false,
  banReason: null,
  banDate: null,
  lastLoginIp: '127.0.0.1',
  providers: ['credential'] as const,
  createdAt: '2026-01-01T00:00:00.000Z',
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

const listAdminUsers = mock(async () => ({
  items: [adminUser],
  total: 1,
  page: 1,
  pageSize: 20,
}));

const getAdminUserById = mock(async (userId: string) =>
  userId === 'u1' ? adminUser : null,
);

const adminUpdateUser = mock(async () => ({ user: adminUser }));
const setRole = mock(async () => ({ user: adminUser }));
const removeUser = mock(async () => ({ success: true }));
const banUser = mock(async () => ({ user: { ...adminUser, banned: true } }));
const unbanUser = mock(async () => ({ user: adminUser }));
const revokeUserSessions = mock(async () => ({ success: true }));

mock.module('../../src/lib/auth', () => ({
  auth: {
    api: {
      getSession: async () => mockSession,
      adminUpdateUser,
      setRole,
      removeUser,
      banUser,
      unbanUser,
      revokeUserSessions,
    },
  },
}));

mock.module('../../src/services/users-admin', () => ({
  listAdminUsers,
  getAdminUserById,
}));

const { usersAdminRoute } = await import('../../src/routes/users-admin');

const app = () => new Elysia().use(usersAdminRoute);

describe('users admin routes', () => {
  beforeEach(() => {
    mockSession = null;
    listAdminUsers.mockClear();
    getAdminUserById.mockClear();
    getAdminUserById.mockImplementation(async (userId: string) =>
      userId === 'u1' ? adminUser : null,
    );
    adminUpdateUser.mockClear();
    setRole.mockClear();
    removeUser.mockClear();
    banUser.mockClear();
    unbanUser.mockClear();
    revokeUserSessions.mockClear();
    adminUpdateUser.mockImplementation(async () => ({ user: adminUser }));
    setRole.mockImplementation(async () => ({ user: adminUser }));
    removeUser.mockImplementation(async () => ({ success: true }));
    banUser.mockImplementation(async () => ({ user: { ...adminUser, banned: true } }));
    unbanUser.mockImplementation(async () => ({ user: adminUser }));
    revokeUserSessions.mockImplementation(async () => ({ success: true }));
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await app().handle(new Request('http://localhost/api/v1/users'));
    expect(res.status).toBe(401);
  });

  it('returns 403 for non super_admin users', async () => {
    mockSession = {
      user: { ...sessionUser, role: 'user' },
      session: { id: 's1' },
    };
    const res = await app().handle(new Request('http://localhost/api/v1/users'));
    expect(res.status).toBe(403);
  });

  it('lists users for super_admin', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(new Request('http://localhost/api/v1/users'));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      items: [adminUser],
      total: 1,
    });
    expect(listAdminUsers).toHaveBeenCalled();
  });

  it('updates a user', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/users/u1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Bob' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: 'u1', name: 'Alice' });
  });

  it('returns 404 when updating missing user', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    getAdminUserById.mockImplementationOnce(async () => null);
    const res = await app().handle(
      new Request('http://localhost/api/v1/users/missing', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Bob' }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it('deletes a user', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/users/u1', { method: 'DELETE' }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  it('bans a user', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/users/u1/ban', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ banReason: 'Spam' }),
      }),
    );
    expect(res.status).toBe(200);
  });

  it('returns 400 when banning yourself', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    getAdminUserById.mockImplementationOnce(async () => ({
      ...adminUser,
      id: sessionUser.id,
    }));
    const res = await app().handle(
      new Request(`http://localhost/api/v1/users/${sessionUser.id}/ban`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ banReason: 'Self ban attempt' }),
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: {
        code: 'SELF_BAN_FORBIDDEN',
        message: 'Cannot ban yourself',
      },
    });
    expect(banUser).not.toHaveBeenCalled();
  });

  it('unbans a user', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/users/u1/unban', { method: 'POST' }),
    );
    expect(res.status).toBe(200);
  });

  it('revokes user sessions', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    const res = await app().handle(
      new Request('http://localhost/api/v1/users/u1/revoke-sessions', {
        method: 'POST',
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  it('returns 404 when deleting missing user', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    getAdminUserById.mockImplementationOnce(async () => null);
    const res = await app().handle(
      new Request('http://localhost/api/v1/users/missing', { method: 'DELETE' }),
    );
    expect(res.status).toBe(404);
  });

  it('returns 404 when banning missing user', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    getAdminUserById.mockImplementationOnce(async () => null);
    const res = await app().handle(
      new Request('http://localhost/api/v1/users/missing/ban', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ banReason: 'Violation' }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it('returns 404 when revoking sessions for missing user', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    getAdminUserById.mockImplementationOnce(async () => null);
    const res = await app().handle(
      new Request('http://localhost/api/v1/users/missing/revoke-sessions', {
        method: 'POST',
      }),
    );
    expect(res.status).toBe(404);
  });

  it('returns 400 when update fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    adminUpdateUser.mockImplementationOnce(async () => {
      throw new Error('update failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/users/u1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Bob' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when delete fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    removeUser.mockImplementationOnce(async () => {
      throw new Error('delete failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/users/u1', { method: 'DELETE' }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when ban fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    banUser.mockImplementationOnce(async () => {
      throw new Error('ban failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/users/u1/ban', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ banReason: 'Violation' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when unban fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    unbanUser.mockImplementationOnce(async () => {
      throw new Error('unban failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/users/u1/unban', { method: 'POST' }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when revoke sessions fails', async () => {
    mockSession = { user: sessionUser, session: { id: 's1' } };
    revokeUserSessions.mockImplementationOnce(async () => {
      throw new Error('revoke failed');
    });
    const res = await app().handle(
      new Request('http://localhost/api/v1/users/u1/revoke-sessions', {
        method: 'POST',
      }),
    );
    expect(res.status).toBe(400);
  });
});

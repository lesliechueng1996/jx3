import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createMockDb } from '../helpers/mock-db';

const mockDb = createMockDb();

mock.module('@jx3/db', () => ({
  db: mockDb,
}));

const { getAdminUserById, listAdminUsers } = await import(
  '../../src/services/users-admin'
);

const createdAt = new Date('2026-01-01T00:00:00Z');
const updatedAt = new Date('2026-01-02T00:00:00Z');

const baseUser = {
  id: 'u1',
  name: 'Alice',
  email: 'alice@example.com',
  emailVerified: true,
  image: null,
  role: 'user',
  banned: false,
  banReason: null,
  banExpires: null,
  createdAt,
  updatedAt,
};

describe('users-admin service', () => {
  beforeEach(() => {
    mockDb.setResults([]);
  });

  it('returns an empty page when no users match', async () => {
    mockDb.setResults([[], [{ total: 0 }]]);

    const result = await listAdminUsers({
      page: 1,
      pageSize: 20,
    });

    expect(result).toEqual({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
  });

  it('maps users with providers and last login ip', async () => {
    mockDb.setResults([
      [baseUser],
      [{ total: 1 }],
      [{ userId: 'u1', providerId: 'credential' }],
      [{ userId: 'u1', ipAddress: '127.0.0.1', createdAt }],
    ]);

    const result = await listAdminUsers({
      page: 1,
      pageSize: 20,
      name: 'Ali',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      id: 'u1',
      name: 'Alice',
      emailMasked: 'a***@example.com',
      role: 'user',
      banned: false,
      lastLoginIp: '127.0.0.1',
      providers: ['credential'],
      createdAt: createdAt.toISOString(),
    });
  });

  it('returns null when a user is missing', async () => {
    mockDb.setResults([[]]);

    await expect(getAdminUserById('missing')).resolves.toBeNull();
  });

  it('returns a banned user with ban metadata', async () => {
    const bannedUser = {
      ...baseUser,
      banned: true,
      banReason: 'abuse',
    };

    mockDb.setResults([
      [bannedUser],
      [{ providerId: 'github' }],
      [{ ipAddress: '10.0.0.1', createdAt }],
    ]);

    const result = await getAdminUserById('u1');

    expect(result).toMatchObject({
      id: 'u1',
      banned: true,
      banReason: 'abuse',
      banDate: updatedAt.toISOString(),
      providers: ['github'],
      lastLoginIp: '10.0.0.1',
    });
  });

  it('applies list filters for name, email, role, banned, and provider', async () => {
    mockDb.setResults([[], [{ total: 0 }]]);

    const result = await listAdminUsers({
      page: 1,
      pageSize: 20,
      name: 'Ali',
      email: 'alice',
      role: 'user',
      banned: false,
      provider: 'credential',
    });

    expect(result.total).toBe(0);
  });
});

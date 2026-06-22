import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { type AppRole, USER_ROLE } from '@jx3/auth/roles';
import { Elysia } from 'elysia';

const searchItems = [
  {
    characterName: '叶修',
    serverId: '11111111-1111-4111-8111-111111111111',
    schoolId: '22222222-2222-4222-8222-222222222222',
    kungfuId: '33333333-3333-4333-8333-333333333333',
    serverLabel: '电信区 · 梦江南',
    kungfuName: '天策',
  },
];

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

const searchRaidSignups = mock(async () => ({ items: searchItems }));

mock.module('../../src/lib/auth', () => ({
  auth: {
    api: {
      getSession: async () => mockSession,
    },
  },
}));

mock.module('../../src/services/raid-signups', () => ({
  searchRaidSignups,
}));

const { raidSignupsRoute } = await import('../../src/routes/raid-signups');

const app = () => new Elysia().use(raidSignupsRoute);

describe('raid-signups routes', () => {
  beforeEach(() => {
    mockSession = {
      user: sessionUser,
      session: { id: 'session-1' },
    };
    searchRaidSignups.mockClear();
    searchRaidSignups.mockImplementation(async () => ({ items: searchItems }));
  });

  it('returns 401 when search is unauthenticated', async () => {
    mockSession = null;
    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-signups/search?q=叶'),
    );
    expect(res.status).toBe(401);
  });

  it('searches historical raid signups for authenticated users', async () => {
    const res = await app().handle(
      new Request(
        `http://localhost/api/v1/raid-signups/search?q=${encodeURIComponent('叶')}`,
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual(searchItems);
    expect(searchRaidSignups).toHaveBeenCalledWith('叶');
  });
});

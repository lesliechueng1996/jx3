import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { type AppRole, USER_ROLE } from '@jx3/auth/roles';
import { Elysia } from 'elysia';

const gameItem = {
  id: 'item-1',
  name: '玄晶',
  type: 'special' as const,
  quality: 'orange' as const,
  gameItemId: null,
  description: null,
  icon: null,
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

const searchGameItems = mock(async () => ({ items: [gameItem] }));
const createGameItem = mock(async () => gameItem);

mock.module('../../src/lib/auth', () => ({
  auth: {
    api: {
      getSession: async () => mockSession,
    },
  },
}));

mock.module('../../src/services/game-items', () => ({
  searchGameItems,
  createGameItem,
}));

const { gameItemsRoute } = await import('../../src/routes/game-items');

const app = () => new Elysia().use(gameItemsRoute);

describe('game-items routes', () => {
  beforeEach(() => {
    mockSession = {
      user: sessionUser,
      session: { id: 'session-1' },
    };
    searchGameItems.mockClear();
    createGameItem.mockClear();
  });

  it('returns 401 when searching unauthenticated', async () => {
    mockSession = null;
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-items/search?q=玄晶'),
    );
    expect(res.status).toBe(401);
  });

  it('searches game items for authenticated users', async () => {
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-items/search?q=玄晶'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
  });

  it('creates game items for authenticated users', async () => {
    const res = await app().handle(
      new Request('http://localhost/api/v1/game-items', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: '玄晶',
          type: 'special',
          quality: 'orange',
        }),
      }),
    );
    expect(res.status).toBe(201);
  });

  it('returns 400 when create fails unexpectedly', async () => {
    createGameItem.mockImplementation(async () => {
      throw new Error('create failed');
    });

    const res = await app().handle(
      new Request('http://localhost/api/v1/game-items', {
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
});

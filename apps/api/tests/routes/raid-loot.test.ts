import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { type AppRole, USER_ROLE } from '@jx3/auth/roles';
import { Elysia } from 'elysia';

const lootItem = {
  id: 'loot-1',
  itemId: 'item-1',
  itemName: '玄晶',
  itemQuality: 'orange' as const,
  itemIcon: null,
  quantity: 1,
  winnerSignupId: null,
  winnerCharacterName: null,
  winnerServerName: null,
  price: null,
  remark: null,
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

const createRaidLoot = mock(
  async (): Promise<typeof lootItem | null> => lootItem,
);
const patchRaidLoot = mock(
  async (): Promise<typeof lootItem | null> => lootItem,
);
const deleteRaidLoot = mock(async () => true);
const patchRaidRunWage = mock(
  async (): Promise<{ totalIncome: string; wagePerPerson: string } | null> => ({
    totalIncome: '50000',
    wagePerPerson: '2000',
  }),
);
const listRaidLoot = mock(async () => []);

mock.module('../../src/lib/auth', () => ({
  auth: {
    api: {
      getSession: async () => mockSession,
    },
  },
}));

mock.module('../../src/services/raid-loot', () => ({
  createRaidLoot,
  patchRaidLoot,
  deleteRaidLoot,
  patchRaidRunWage,
  listRaidLoot,
}));

const { raidRunsRoute } = await import('../../src/routes/raid-runs');

const app = () => new Elysia().use(raidRunsRoute);

describe('raid loot routes', () => {
  beforeEach(() => {
    mockSession = {
      user: sessionUser,
      session: { id: 'session-1' },
    };
    createRaidLoot.mockClear();
    patchRaidLoot.mockClear();
    deleteRaidLoot.mockClear();
    patchRaidRunWage.mockClear();
  });

  it('returns 401 when creating loot unauthenticated', async () => {
    mockSession = null;
    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1/loot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          itemId: '00000000-0000-4000-8000-000000000001',
          quantity: 1,
        }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it('creates loot for authenticated users', async () => {
    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1/loot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          itemId: '00000000-0000-4000-8000-000000000001',
          quantity: 1,
        }),
      }),
    );
    expect(res.status).toBe(201);
  });

  it('patches loot for authenticated users', async () => {
    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1/loot/loot-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ price: 10000 }),
      }),
    );
    expect(res.status).toBe(200);
  });

  it('deletes loot for authenticated users', async () => {
    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1/loot/loot-1', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(204);
  });

  it('patches wage for authenticated users', async () => {
    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1/wage', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          totalIncome: '50000',
          wagePerPerson: '2000',
        }),
      }),
    );
    expect(res.status).toBe(200);
  });

  it('returns 403 when loot creation is forbidden', async () => {
    const { RaidRunForbiddenError } = await import(
      '../../src/services/raid-run-errors'
    );
    createRaidLoot.mockImplementation(async () => {
      throw new RaidRunForbiddenError('forbidden');
    });

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1/loot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          itemId: '00000000-0000-4000-8000-000000000001',
          quantity: 1,
        }),
      }),
    );

    expect(res.status).toBe(403);
  });

  it('returns 404 when loot creation target is missing', async () => {
    createRaidLoot.mockImplementation(async () => null);

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1/loot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          itemId: '00000000-0000-4000-8000-000000000001',
          quantity: 1,
        }),
      }),
    );

    expect(res.status).toBe(404);
  });

  it('returns 409 when loot creation conflicts', async () => {
    const { RaidRunConflictError } = await import(
      '../../src/services/raid-run-errors'
    );
    createRaidLoot.mockImplementation(async () => {
      throw new RaidRunConflictError('conflict');
    });

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1/loot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          itemId: '00000000-0000-4000-8000-000000000001',
          quantity: 1,
        }),
      }),
    );

    expect(res.status).toBe(409);
  });

  it('returns 404 when patching missing loot', async () => {
    patchRaidLoot.mockImplementation(async () => null);

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1/loot/loot-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ price: 10000 }),
      }),
    );

    expect(res.status).toBe(404);
  });

  it('returns 404 when deleting missing loot', async () => {
    deleteRaidLoot.mockImplementation(async () => false);

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1/loot/loot-1', {
        method: 'DELETE',
      }),
    );

    expect(res.status).toBe(404);
  });

  it('returns 404 when patching missing wage target', async () => {
    patchRaidRunWage.mockImplementation(async () => null);

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1/wage', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          totalIncome: '50000',
          wagePerPerson: '2000',
        }),
      }),
    );

    expect(res.status).toBe(404);
  });

  it('returns 400 when loot creation fails unexpectedly', async () => {
    createRaidLoot.mockImplementation(async () => {
      throw new Error('db failed');
    });

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1/loot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          itemId: '00000000-0000-4000-8000-000000000001',
          quantity: 1,
        }),
      }),
    );

    expect(res.status).toBe(400);
  });

  it('returns 403 when deleting loot is forbidden', async () => {
    const { RaidRunForbiddenError } = await import(
      '../../src/services/raid-run-errors'
    );
    deleteRaidLoot.mockImplementation(async () => {
      throw new RaidRunForbiddenError('forbidden');
    });

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1/loot/loot-1', {
        method: 'DELETE',
      }),
    );

    expect(res.status).toBe(403);
  });

  it('returns 409 when patching wage conflicts', async () => {
    const { RaidRunConflictError } = await import(
      '../../src/services/raid-run-errors'
    );
    patchRaidRunWage.mockImplementation(async () => {
      throw new RaidRunConflictError('conflict');
    });

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1/wage', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          totalIncome: '50000',
          wagePerPerson: '2000',
        }),
      }),
    );

    expect(res.status).toBe(409);
  });
});

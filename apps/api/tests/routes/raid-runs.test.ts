import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { type AppRole, USER_ROLE } from '@jx3/auth/roles';
import { Elysia } from 'elysia';

const raidRunResponse = {
  id: 'run-1',
  name: '周末团',
  description: null,
  dungeonId: 'd1',
  status: 'pending' as const,
  gatherTime: null,
  startTime: '2026-06-14T12:00:00.000Z',
  endTime: null,
  reservedTank: 2,
  reservedHealer: 5,
  reservedDps: 15,
  reservedBoss: 1,
  totalIncome: null,
  wagePerPerson: null,
  remark: null,
  createdAt: '2026-06-13T00:00:00.000Z',
  updatedAt: '2026-06-13T00:00:00.000Z',
  signups: Array.from({ length: 25 }, (_, index) => ({
    id: `signup-${index}`,
    groupNumber: (index % 5) + 1,
    positionNumber: Math.floor(index / 5) + 1,
    role: 'pending' as const,
    status: 'pending' as const,
    isReserved: false,
    isLeader: false,
    isDarkRun: false,
    isFormationCore: false,
    serverId: null,
    characterName: null,
    schoolId: null,
    kungfuId: null,
    remark: null,
    createdAt: '2026-06-13T00:00:00.000Z',
    updatedAt: '2026-06-13T00:00:00.000Z',
  })),
  loot: [],
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

const createRaidRunDraft = mock(async () => raidRunResponse);
const getRaidRunDraft = mock(async (id: string) =>
  id === 'run-1' ? raidRunResponse : null,
);
const patchRaidRunDraft = mock(async () => raidRunResponse);
const publishRaidRun = mock(async () => ({
  ...raidRunResponse,
  status: 'recruiting' as const,
}));
const listMyRaidRuns = mock(async () => ({ items: [] }));

mock.module('../../src/lib/auth', () => ({
  auth: {
    api: {
      getSession: async () => mockSession,
    },
  },
}));

const RaidRunValidationError = class RaidRunValidationError extends Error {
  name = 'RaidRunValidationError';
};
const RaidRunForbiddenError = class RaidRunForbiddenError extends Error {
  name = 'RaidRunForbiddenError';
};
const RaidRunConflictError = class RaidRunConflictError extends Error {
  name = 'RaidRunConflictError';
};

mock.module('../../src/services/raid-runs', () => ({
  createRaidRunDraft,
  getRaidRunDraft,
  listMyRaidRuns,
  patchRaidRunDraft,
  publishRaidRun,
  RaidRunValidationError,
  RaidRunForbiddenError,
  RaidRunConflictError,
}));

const { raidRunsRoute } = await import('../../src/routes/raid-runs');

const app = () => new Elysia().use(raidRunsRoute);

const buildSignups = () =>
  Array.from({ length: 25 }, (_, index) => ({
    groupNumber: (index % 5) + 1,
    positionNumber: Math.floor(index / 5) + 1,
    role: 'pending' as const,
    characterName: null,
    serverId: null,
    schoolId: null,
    kungfuId: null,
    isLeader: false,
    isDarkRun: false,
    isFormationCore: false,
    remark: null,
  }));

describe('raid-runs routes', () => {
  beforeEach(() => {
    mockSession = null;
    createRaidRunDraft.mockClear();
    getRaidRunDraft.mockClear();
    patchRaidRunDraft.mockClear();
    publishRaidRun.mockClear();
    listMyRaidRuns.mockClear();
    createRaidRunDraft.mockImplementation(async () => raidRunResponse);
    getRaidRunDraft.mockImplementation(async (id: string) =>
      id === 'run-1' ? raidRunResponse : null,
    );
    patchRaidRunDraft.mockImplementation(async () => raidRunResponse);
    publishRaidRun.mockImplementation(async () => ({
      ...raidRunResponse,
      status: 'recruiting' as const,
    }));
    listMyRaidRuns.mockImplementation(async () => ({ items: [] }));
  });

  it('lists mine for authenticated users', async () => {
    mockSession = { user: sessionUser, session: { id: 'session-1' } };

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/mine?filter=created'),
    );

    expect(res.status).toBe(200);
    expect(listMyRaidRuns).toHaveBeenCalledWith('user-1', 'created');
  });

  it('returns 401 when listing mine unauthenticated', async () => {
    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/mine'),
    );

    expect(res.status).toBe(401);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signups: buildSignups() }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it('creates a draft for authenticated users', async () => {
    mockSession = { user: sessionUser, session: { id: 'session-1' } };

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: '周末团',
          signups: buildSignups(),
        }),
      }),
    );

    expect(res.status).toBe(201);
    expect(createRaidRunDraft).toHaveBeenCalledTimes(1);
  });

  it('returns 404 when draft is missing', async () => {
    mockSession = { user: sessionUser, session: { id: 'session-1' } };

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/missing'),
    );

    expect(res.status).toBe(404);
  });

  it('patches a draft for authenticated users', async () => {
    mockSession = { user: sessionUser, session: { id: 'session-1' } };

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '新名称' }),
      }),
    );

    expect(res.status).toBe(200);
    expect(patchRaidRunDraft).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when create validation fails', async () => {
    mockSession = { user: sessionUser, session: { id: 'session-1' } };
    createRaidRunDraft.mockImplementation(async () => {
      throw new RaidRunValidationError('invalid signups');
    });

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signups: buildSignups() }),
      }),
    );

    expect(res.status).toBe(400);
  });

  it('returns 403 when draft belongs to another user', async () => {
    mockSession = { user: sessionUser, session: { id: 'session-1' } };
    getRaidRunDraft.mockImplementation(async () => {
      throw new RaidRunForbiddenError('forbidden');
    });

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1'),
    );

    expect(res.status).toBe(403);
  });

  it('returns 403 when patching a foreign draft', async () => {
    mockSession = { user: sessionUser, session: { id: 'session-1' } };
    patchRaidRunDraft.mockImplementation(async () => {
      throw new RaidRunForbiddenError('forbidden');
    });

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '新名称' }),
      }),
    );

    expect(res.status).toBe(403);
  });

  it('returns 400 when patch validation fails', async () => {
    mockSession = { user: sessionUser, session: { id: 'session-1' } };
    patchRaidRunDraft.mockImplementation(async () => {
      throw new RaidRunValidationError('invalid signups');
    });

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '新名称' }),
      }),
    );

    expect(res.status).toBe(400);
  });

  it('returns 409 when patching a non-pending draft', async () => {
    mockSession = { user: sessionUser, session: { id: 'session-1' } };
    patchRaidRunDraft.mockImplementation(async () => {
      throw new RaidRunConflictError('conflict');
    });

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '新名称' }),
      }),
    );

    expect(res.status).toBe(409);
  });

  it('returns 403 when publish is forbidden', async () => {
    mockSession = { user: sessionUser, session: { id: 'session-1' } };
    publishRaidRun.mockImplementation(async () => {
      throw new RaidRunForbiddenError('forbidden');
    });

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(403);
  });

  it('returns 409 when publish conflicts', async () => {
    mockSession = { user: sessionUser, session: { id: 'session-1' } };
    publishRaidRun.mockImplementation(async () => {
      throw new RaidRunConflictError('conflict');
    });

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(409);
  });

  it('returns 400 when publish validation fails', async () => {
    mockSession = { user: sessionUser, session: { id: 'session-1' } };
    publishRaidRun.mockImplementation(async () => {
      throw new RaidRunValidationError('missing fields');
    });

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(400);
  });

  it('returns 404 when patch target is missing', async () => {
    mockSession = { user: sessionUser, session: { id: 'session-1' } };
    patchRaidRunDraft.mockImplementation(async () => null as never);

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/missing', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '新名称' }),
      }),
    );

    expect(res.status).toBe(404);
  });

  it('returns 404 when publish target is missing', async () => {
    mockSession = { user: sessionUser, session: { id: 'session-1' } };
    publishRaidRun.mockImplementation(async () => null as never);

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/missing/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(404);
  });

  it('returns 400 when create fails unexpectedly', async () => {
    mockSession = { user: sessionUser, session: { id: 'session-1' } };
    createRaidRunDraft.mockImplementation(async () => {
      throw new Error('db failed');
    });

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signups: buildSignups() }),
      }),
    );

    expect(res.status).toBe(400);
  });

  it('returns 400 when patch fails unexpectedly', async () => {
    mockSession = { user: sessionUser, session: { id: 'session-1' } };
    patchRaidRunDraft.mockImplementation(async () => {
      throw new Error('db failed');
    });

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '新名称' }),
      }),
    );

    expect(res.status).toBe(400);
  });

  it('returns 400 when publish fails unexpectedly', async () => {
    mockSession = { user: sessionUser, session: { id: 'session-1' } };
    publishRaidRun.mockImplementation(async () => {
      throw new Error('db failed');
    });

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(400);
  });

  it('publishes a draft for authenticated users', async () => {
    mockSession = { user: sessionUser, session: { id: 'session-1' } };

    const res = await app().handle(
      new Request('http://localhost/api/v1/raid-runs/run-1/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('recruiting');
    expect(publishRaidRun).toHaveBeenCalledTimes(1);
  });
});

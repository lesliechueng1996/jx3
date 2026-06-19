import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createMockDb } from '../helpers/mock-db';

const mockDb = createMockDb();

mock.module('@jx3/db', () => ({
  db: mockDb,
}));

const getAdminDungeonById = mock(async (dungeonId: string) =>
  dungeonId === 'dungeon-1'
    ? {
        id: 'dungeon-1',
        name: '雷域大泽',
        expansionId: 'exp-1',
        expansionName: '横刀断浪',
        seasonId: 'season-1',
        seasonName: '第一赛季',
        playerLimit: 25,
        difficulty: 'heroic' as const,
        levelRequirement: 130,
        bossCount: 6,
        resetWeekdays: [1, 4],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }
    : null,
);

mock.module('../../src/services/dungeons-admin', () => ({
  getAdminDungeonById,
}));

const {
  computeSlotRoles,
  createRaidRunDraft,
  deriveSignupFields,
  DRAFT_DUNGEON_SENTINEL,
  getRaidRunDraft,
  listMyRaidRuns,
  patchRaidRunDraft,
  publishRaidRun,
  RaidRunConflictError,
  RaidRunForbiddenError,
  RaidRunValidationError,
} = await import('../../src/services/raid-runs');

const createdAt = new Date('2026-06-13T00:00:00.000Z');
const updatedAt = new Date('2026-06-13T00:00:00.000Z');

const reserved = {
  reservedDps: 10,
  reservedHealer: 5,
  reservedTank: 2,
  reservedBoss: 1,
};

const buildSignups = (playerLimit = 25) => {
  const roles = computeSlotRoles(reserved, playerLimit);
  const signups = [];

  for (let groupNumber = 1; groupNumber <= 5; groupNumber += 1) {
    for (let positionNumber = 1; positionNumber <= 5; positionNumber += 1) {
      const index = (groupNumber - 1) * 5 + (positionNumber - 1);
      if (roles[index] === undefined) {
        continue;
      }

      signups.push({
        groupNumber,
        positionNumber,
        role: roles[index] ?? ('pending' as const),
        characterName: null,
        serverId: null,
        schoolId: null,
        kungfuId: null,
        isLeader: false,
        isDarkRun: false,
        isFormationCore: false,
        remark: null,
      });
    }
  }

  return signups;
};

const buildSignupRows = () =>
  buildSignups().map((signup, index) => ({
    id: `signup-${index}`,
    raidRunId: 'run-1',
    groupNumber: signup.groupNumber,
    positionNumber: signup.positionNumber,
    role: signup.role,
    status: 'pending' as const,
    isReserved: signup.role !== 'pending',
    isLeader: false,
    isDarkRun: false,
    isFormationCore: false,
    serverId: null,
    characterName: null,
    schoolId: null,
    kungfuId: null,
    userId: null,
    createdBy: 'user-1',
    remark: null,
    createdAt,
    updatedAt,
  }));

const runRow = {
  id: 'run-1',
  name: '周末团',
  description: null,
  dungeonId: 'dungeon-1',
  gameRaidId: null,
  createdBy: 'user-1',
  status: 'pending' as const,
  gatherTime: null,
  startTime: new Date('2026-06-14T12:00:00.000Z'),
  endTime: null,
  reservedTank: 2,
  reservedHealer: 5,
  reservedDps: 10,
  reservedBoss: 1,
  totalIncome: null,
  wagePerPerson: null,
  remark: null,
  createdAt,
  updatedAt,
};

describe('raid-runs service', () => {
  beforeEach(() => {
    mockDb.setResults([]);
    getAdminDungeonById.mockClear();
    getAdminDungeonById.mockImplementation(async (dungeonId: string) =>
      dungeonId === 'dungeon-1'
        ? {
            id: 'dungeon-1',
            name: '雷域大泽',
            expansionId: 'exp-1',
            expansionName: '横刀断浪',
            seasonId: 'season-1',
            seasonName: '第一赛季',
            playerLimit: 25,
            difficulty: 'heroic' as const,
            levelRequirement: 130,
            bossCount: 6,
            resetWeekdays: [1, 4],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          }
        : null,
    );
  });

  it('derives signup status from role and character name', () => {
    expect(deriveSignupFields('dps', null)).toEqual({
      status: 'pending',
      isReserved: true,
    });
    expect(deriveSignupFields('dps', '叶修')).toEqual({
      status: 'confirmed',
      isReserved: false,
    });
  });

  it('fills columns top-to-bottom then left-to-right', () => {
    const roles = computeSlotRoles({
      reservedTank: 3,
      reservedHealer: 5,
      reservedDps: 0,
      reservedBoss: 0,
    });

    expect(roles[0]).toBe('healer');
    expect(roles[1]).toBe('healer');
    expect(roles[2]).toBe('healer');
    expect(roles[3]).toBe('healer');
    expect(roles[4]).toBe('healer');
    expect(roles[5]).toBe('tank');
    expect(roles[6]).toBe('tank');
    expect(roles[7]).toBe('tank');
    expect(roles[8]).toBe('pending');
  });

  it('creates a pending raid run draft with 25 signups', async () => {
    const signupRows = buildSignupRows();
    mockDb.setResults([[runRow], signupRows]);

    const created = await createRaidRunDraft('user-1', {
      name: '周末团',
      dungeonId: 'dungeon-1',
      startTime: '2026-06-14T12:00:00.000Z',
      ...reserved,
      signups: buildSignups(),
    });

    expect(created.id).toBe('run-1');
    expect(created.status).toBe('pending');
    expect(created.signups).toHaveLength(25);
  });

  it('rejects reserved totals above dungeon player limit', async () => {
    getAdminDungeonById.mockImplementation(async (dungeonId: string) => {
      if (dungeonId === 'dungeon-10') {
        return {
          id: 'dungeon-10',
          name: '五人本',
          expansionId: 'exp-1',
          expansionName: '横刀断浪',
          seasonId: 'season-1',
          seasonName: '第一赛季',
          playerLimit: 10,
          difficulty: 'heroic' as const,
          levelRequirement: 130,
          bossCount: 1,
          resetWeekdays: [1],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        };
      }

      if (dungeonId === 'dungeon-1') {
        return {
          id: 'dungeon-1',
          name: '雷域大泽',
          expansionId: 'exp-1',
          expansionName: '横刀断浪',
          seasonId: 'season-1',
          seasonName: '第一赛季',
          playerLimit: 25,
          difficulty: 'heroic' as const,
          levelRequirement: 130,
          bossCount: 6,
          resetWeekdays: [1, 4],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        };
      }

      return null;
    });

    await expect(
      createRaidRunDraft('user-1', {
        dungeonId: 'dungeon-10',
        reservedDps: 8,
        reservedHealer: 5,
        reservedTank: 0,
        reservedBoss: 0,
        signups: buildSignups(10),
      }),
    ).rejects.toBeInstanceOf(RaidRunValidationError);
  });

  it('loads a draft for the creator', async () => {
    const signupRows = buildSignupRows();
    mockDb.setResults([[runRow], signupRows]);

    const loaded = await getRaidRunDraft('run-1', 'user-1');

    expect(loaded?.id).toBe('run-1');
    expect(loaded?.signups).toHaveLength(25);
  });

  it('rejects non-creators', async () => {
    mockDb.setResults([[runRow]]);

    await expect(getRaidRunDraft('run-1', 'other-user')).rejects.toBeInstanceOf(
      RaidRunForbiddenError,
    );
  });

  it('patches a pending draft', async () => {
    const signupRows = buildSignupRows();
    mockDb.setResults([[runRow], [runRow], signupRows]);

    const updated = await patchRaidRunDraft('run-1', 'user-1', {
      name: '新名称',
    });

    expect(updated?.name).toBe('周末团');
  });

  it('rejects patching a completed raid run', async () => {
    mockDb.setResults([[{ ...runRow, status: 'completed' as const }]]);

    await expect(
      patchRaidRunDraft('run-1', 'user-1', { name: '新名称' }),
    ).rejects.toBeInstanceOf(RaidRunConflictError);
  });

  it('patches a recruiting raid run', async () => {
    const recruitingRun = { ...runRow, status: 'recruiting' as const };
    const signupRows = buildSignupRows();
    mockDb.setResults([
      [recruitingRun],
      signupRows,
      [recruitingRun],
      signupRows,
    ]);

    const updated = await patchRaidRunDraft('run-1', 'user-1', {
      name: '新名称',
    });

    expect(updated?.name).toBe('周末团');
  });

  it('lists created raid runs including drafts', async () => {
    mockDb.setResults([
      [
        {
          run: runRow,
          dungeonName: '雷域大泽',
          signup: null,
          serverName: null,
        },
      ],
    ]);

    const result = await listMyRaidRuns('user-1', 'created');

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.isCreator).toBe(true);
    expect(result.items[0]?.status).toBe('pending');
  });

  it('lists joined raid runs excluding drafts', async () => {
    const recruitingRun = { ...runRow, status: 'recruiting' as const };
    const signupRow = {
      ...buildSignupRows()[0]!,
      userId: 'user-1',
      isLeader: true,
      characterName: '叶修',
    };

    mockDb.setResults([
      [
        {
          run: recruitingRun,
          signup: signupRow,
          dungeonName: '雷域大泽',
          serverName: '唯满侠',
        },
      ],
    ]);

    const result = await listMyRaidRuns('user-1', 'leader');

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.mySignup?.isLeader).toBe(true);
    expect(result.items[0]?.mySignup?.characterName).toBe('叶修');
  });

  it('lists all joined raid runs', async () => {
    const recruitingRun = { ...runRow, status: 'recruiting' as const };
    const signupRow = {
      ...buildSignupRows()[0]!,
      userId: 'user-2',
      isLeader: false,
    };

    mockDb.setResults([
      [
        {
          run: recruitingRun,
          signup: signupRow,
          dungeonName: '雷域大泽',
          serverName: null,
        },
      ],
    ]);

    const result = await listMyRaidRuns('user-2', 'all');

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.isCreator).toBe(false);
  });

  it('lists created published runs in all even without linked signup', async () => {
    const recruitingRun = {
      ...runRow,
      status: 'recruiting' as const,
      createdBy: 'user-1',
    };

    mockDb.setResults([
      [
        {
          run: recruitingRun,
          signup: null,
          dungeonName: '雷域大泽',
          serverName: null,
        },
      ],
    ]);

    const result = await listMyRaidRuns('user-1', 'all');

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.isCreator).toBe(true);
    expect(result.items[0]?.mySignup).toBeNull();
  });

  it('prefers leader signup when deduplicating joined runs', async () => {
    const recruitingRun = { ...runRow, status: 'recruiting' as const };
    const memberSignup = {
      ...buildSignupRows()[0]!,
      userId: 'user-1',
      isLeader: false,
    };
    const leaderSignup = {
      ...buildSignupRows()[1]!,
      userId: 'user-1',
      isLeader: true,
    };

    mockDb.setResults([
      [
        {
          run: recruitingRun,
          signup: memberSignup,
          dungeonName: '雷域大泽',
          serverName: null,
        },
        {
          run: recruitingRun,
          signup: leaderSignup,
          dungeonName: '雷域大泽',
          serverName: '唯满侠',
        },
      ],
    ]);

    const result = await listMyRaidRuns('user-1', 'all');

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.mySignup?.isLeader).toBe(true);
  });

  it('publishes a valid pending raid run', async () => {
    const signupRows = buildSignupRows();
    mockDb.setResults([
      [runRow],
      [{ id: 'dungeon-1' }],
      signupRows,
      [{ ...runRow, status: 'recruiting' as const }],
    ]);

    const published = await publishRaidRun('run-1', 'user-1');

    expect(published?.status).toBe('recruiting');
  });

  it('rejects duplicate formation cores in the same group', async () => {
    const signups = buildSignups();
    signups[0] = { ...signups[0]!, isFormationCore: true };
    signups[1] = { ...signups[1]!, isFormationCore: true };

    await expect(
      createRaidRunDraft('user-1', {
        ...reserved,
        signups,
      }),
    ).rejects.toBeInstanceOf(RaidRunValidationError);
  });

  it('rejects two leaders on publish', async () => {
    const signupRows = buildSignupRows();
    signupRows[0] = { ...signupRows[0]!, isLeader: true };
    signupRows[1] = { ...signupRows[1]!, isLeader: true };

    mockDb.setResults([[runRow], [{ id: 'dungeon-1' }], signupRows]);

    await expect(publishRaidRun('run-1', 'user-1')).rejects.toBeInstanceOf(
      RaidRunValidationError,
    );
  });

  it('rejects two dark run payers on publish', async () => {
    const signupRows = buildSignupRows();
    signupRows[0] = { ...signupRows[0]!, isDarkRun: true };
    signupRows[1] = { ...signupRows[1]!, isDarkRun: true };

    mockDb.setResults([[runRow], [{ id: 'dungeon-1' }], signupRows]);

    await expect(publishRaidRun('run-1', 'user-1')).rejects.toBeInstanceOf(
      RaidRunValidationError,
    );
  });

  it('rejects invalid dungeon on create', async () => {
    getAdminDungeonById.mockImplementation(async () => null);

    await expect(
      createRaidRunDraft('user-1', {
        dungeonId: 'missing-dungeon',
        ...reserved,
        signups: buildSignups(),
      }),
    ).rejects.toBeInstanceOf(RaidRunValidationError);
  });

  it('rejects duplicate signup coordinates on create', async () => {
    const signups = buildSignups();
    signups[1] = { ...signups[1]!, groupNumber: 1, positionNumber: 1 };

    await expect(
      createRaidRunDraft('user-1', {
        ...reserved,
        signups,
      }),
    ).rejects.toBeInstanceOf(RaidRunValidationError);
  });

  it('patches signup rows when signups are provided', async () => {
    const signupRows = buildSignupRows();
    mockDb.setResults([[runRow], [], signupRows, signupRows]);

    const updated = await patchRaidRunDraft('run-1', 'user-1', {
      signups: buildSignups(),
    });

    expect(updated?.signups).toHaveLength(25);
  });

  it('rejects publish when gather time is after start time', async () => {
    const signupRows = buildSignupRows();
    mockDb.setResults([
      [
        {
          ...runRow,
          gatherTime: new Date('2026-06-15T12:00:00.000Z'),
        },
      ],
      [{ id: 'dungeon-1' }],
      signupRows,
    ]);

    await expect(publishRaidRun('run-1', 'user-1')).rejects.toBeInstanceOf(
      RaidRunValidationError,
    );
  });

  it('rejects publish when dungeon no longer exists', async () => {
    const signupRows = buildSignupRows();
    mockDb.setResults([[runRow], [], signupRows]);

    await expect(publishRaidRun('run-1', 'user-1')).rejects.toBeInstanceOf(
      RaidRunValidationError,
    );
  });

  it('rejects invalid server references on create', async () => {
    const signups = buildSignups();
    (signups[0] as { serverId: string | null }).serverId =
      '00000000-0000-4000-8000-000000000099';

    mockDb.setResults([[]]);

    await expect(
      createRaidRunDraft('user-1', {
        ...reserved,
        signups,
      }),
    ).rejects.toBeInstanceOf(RaidRunValidationError);
  });

  it('rejects mismatched signup roles on create', async () => {
    const signups = buildSignups();
    signups[0] = { ...signups[0]!, role: 'tank' };

    await expect(
      createRaidRunDraft('user-1', {
        ...reserved,
        signups,
      }),
    ).rejects.toBeInstanceOf(RaidRunValidationError);
  });

  it('rejects publish when required fields are missing', async () => {
    const signupRows = buildSignupRows();
    mockDb.setResults([
      [
        {
          ...runRow,
          name: '',
          dungeonId: DRAFT_DUNGEON_SENTINEL,
        },
      ],
      signupRows,
    ]);

    await expect(publishRaidRun('run-1', 'user-1')).rejects.toBeInstanceOf(
      RaidRunValidationError,
    );
  });
});

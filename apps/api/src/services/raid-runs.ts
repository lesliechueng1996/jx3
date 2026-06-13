import { db } from '@jx3/db';
import {
  gameDungeon,
  gameKungfu,
  gameSchool,
  gameServer,
  raidRun,
  raidSignup,
} from '@jx3/db/schema';
import { and, asc, eq, inArray } from 'drizzle-orm';
import type {
  CreateRaidRunBody,
  PatchRaidRunBody,
  RaidRunResponse,
  RaidSignupResponse,
  RaidSignupRole,
  SignupInput,
} from '../schemas/raid-runs';
import { getAdminDungeonById } from './dungeons-admin';

export class RaidRunValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RaidRunValidationError';
  }
}

export class RaidRunForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RaidRunForbiddenError';
  }
}

export class RaidRunConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RaidRunConflictError';
  }
}

export const DRAFT_DUNGEON_SENTINEL = '00000000-0000-0000-0000-000000000000';
const DRAFT_START_TIME_SENTINEL = new Date('1970-01-01T00:00:00.000Z');

export type ReservedCounts = {
  reservedDps: number;
  reservedHealer: number;
  reservedTank: number;
  reservedBoss: number;
};

export const computeSlotRoles = (
  reserved: ReservedCounts,
): RaidSignupRole[] => {
  const roles: RaidSignupRole[] = [];
  const sequence: RaidSignupRole[] = [
    ...Array.from({ length: reserved.reservedDps }, () => 'dps' as const),
    ...Array.from({ length: reserved.reservedHealer }, () => 'healer' as const),
    ...Array.from({ length: reserved.reservedTank }, () => 'tank' as const),
    ...Array.from({ length: reserved.reservedBoss }, () => 'boss' as const),
  ];

  for (let position = 1; position <= 5; position += 1) {
    for (let group = 1; group <= 5; group += 1) {
      const index = (position - 1) * 5 + (group - 1);
      roles[index] = sequence[index] ?? 'pending';
    }
  }

  return roles;
};

export const slotKey = (groupNumber: number, positionNumber: number): string =>
  `${groupNumber}-${positionNumber}`;

export const getSlotIndex = (
  groupNumber: number,
  positionNumber: number,
): number => (positionNumber - 1) * 5 + (groupNumber - 1);

export const deriveSignupFields = (
  role: RaidSignupRole,
  characterName: string | null | undefined,
): { status: 'pending' | 'confirmed'; isReserved: boolean } => {
  const hasCharacter =
    characterName !== null &&
    characterName !== undefined &&
    characterName.trim().length > 0;

  if (hasCharacter) {
    return { status: 'confirmed', isReserved: false };
  }

  if (role !== 'pending') {
    return { status: 'pending', isReserved: true };
  }

  return { status: 'pending', isReserved: false };
};

const assertReservedTotal = (reserved: ReservedCounts): void => {
  const total =
    reserved.reservedDps +
    reserved.reservedHealer +
    reserved.reservedTank +
    reserved.reservedBoss;

  if (total > 25) {
    throw new RaidRunValidationError(
      'Reserved role counts must not exceed 25 in total',
    );
  }
};

const validateSignupCoordinates = (signups: SignupInput[]): void => {
  const keys = new Set<string>();

  for (const signup of signups) {
    const key = slotKey(signup.groupNumber, signup.positionNumber);
    if (keys.has(key)) {
      throw new RaidRunValidationError(
        `Duplicate signup slot: group ${signup.groupNumber}, position ${signup.positionNumber}`,
      );
    }
    keys.add(key);
  }

  if (keys.size !== 25) {
    throw new RaidRunValidationError(
      'signups must cover all 25 grid slots exactly once',
    );
  }
};

const validateSignupRoles = (
  signups: SignupInput[],
  reserved: ReservedCounts,
): void => {
  const expectedRoles = computeSlotRoles(reserved);
  const sorted = [...signups].sort((a, b) => {
    const indexA = getSlotIndex(a.groupNumber, a.positionNumber);
    const indexB = getSlotIndex(b.groupNumber, b.positionNumber);
    return indexA - indexB;
  });

  for (let index = 0; index < sorted.length; index += 1) {
    if (sorted[index]?.role !== expectedRoles[index]) {
      throw new RaidRunValidationError(
        'Signup roles do not match reserved role allocation',
      );
    }
  }
};

const validateFormationCorePerGroup = (signups: SignupInput[]): void => {
  const counts = new Map<number, number>();

  for (const signup of signups) {
    if (!signup.isFormationCore) {
      continue;
    }

    const current = counts.get(signup.groupNumber) ?? 0;
    counts.set(signup.groupNumber, current + 1);
  }

  for (const [groupNumber, count] of counts) {
    if (count > 1) {
      throw new RaidRunValidationError(
        `Group ${groupNumber} has more than one formation core`,
      );
    }
  }
};

const validateLeaderCount = (signups: SignupInput[]): void => {
  const leaderCount = signups.filter((signup) => signup.isLeader).length;
  if (leaderCount > 1) {
    throw new RaidRunValidationError('Only one leader is allowed per raid run');
  }
};

const toDbDungeonId = (dungeonId: string | null | undefined): string => {
  if (!dungeonId) {
    return DRAFT_DUNGEON_SENTINEL;
  }
  return dungeonId;
};

const fromDbDungeonId = (dungeonId: string): string | null =>
  dungeonId === DRAFT_DUNGEON_SENTINEL ? null : dungeonId;

const toDbStartTime = (startTime: string | null | undefined): Date => {
  if (!startTime) {
    return DRAFT_START_TIME_SENTINEL;
  }
  return new Date(startTime);
};

const fromDbStartTime = (startTime: Date): string | null =>
  startTime.getTime() === DRAFT_START_TIME_SENTINEL.getTime()
    ? null
    : startTime.toISOString();

const toOptionalDate = (value: string | null | undefined): Date | null => {
  if (!value) {
    return null;
  }
  return new Date(value);
};

const toIsoOrNull = (value: Date | null): string | null =>
  value ? value.toISOString() : null;

const toSignupResponse = (
  row: typeof raidSignup.$inferSelect,
): RaidSignupResponse => ({
  id: row.id,
  groupNumber: row.groupNumber,
  positionNumber: row.positionNumber,
  role: row.role,
  status: row.status,
  isReserved: row.isReserved,
  isLeader: row.isLeader,
  isDarkRun: row.isDarkRun,
  isFormationCore: row.isFormationCore,
  serverId: row.serverId,
  characterName: row.characterName,
  schoolId: row.schoolId,
  kungfuId: row.kungfuId,
  remark: row.remark,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const toRaidRunResponse = (
  run: typeof raidRun.$inferSelect,
  signups: RaidSignupResponse[],
): RaidRunResponse => ({
  id: run.id,
  name: run.name,
  description: run.description,
  dungeonId: fromDbDungeonId(run.dungeonId),
  status: run.status,
  gatherTime: toIsoOrNull(run.gatherTime),
  startTime: fromDbStartTime(run.startTime),
  endTime: toIsoOrNull(run.endTime),
  reservedTank: run.reservedTank,
  reservedHealer: run.reservedHealer,
  reservedDps: run.reservedDps,
  reservedBoss: run.reservedBoss,
  remark: run.remark,
  createdAt: run.createdAt.toISOString(),
  updatedAt: run.updatedAt.toISOString(),
  signups,
});

const validateForeignKeys = async (
  body: {
    dungeonId?: string | null;
    signups?: SignupInput[];
  },
  requireDungeon: boolean,
): Promise<void> => {
  if (body.dungeonId) {
    const dungeon = await getAdminDungeonById(body.dungeonId);
    if (!dungeon) {
      throw new RaidRunValidationError('Dungeon not found');
    }
  } else if (requireDungeon) {
    throw new RaidRunValidationError('dungeonId is required');
  }

  if (!body.signups) {
    return;
  }

  const serverIds = [
    ...new Set(
      body.signups
        .map((signup) => signup.serverId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const schoolIds = [
    ...new Set(
      body.signups
        .map((signup) => signup.schoolId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const kungfuIds = [
    ...new Set(
      body.signups
        .map((signup) => signup.kungfuId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  if (serverIds.length > 0) {
    const servers = await db
      .select({ id: gameServer.id })
      .from(gameServer)
      .where(inArray(gameServer.id, serverIds));
    if (servers.length !== serverIds.length) {
      throw new RaidRunValidationError('One or more server IDs are invalid');
    }
  }

  if (schoolIds.length > 0) {
    const schools = await db
      .select({ id: gameSchool.id })
      .from(gameSchool)
      .where(inArray(gameSchool.id, schoolIds));
    if (schools.length !== schoolIds.length) {
      throw new RaidRunValidationError('One or more school IDs are invalid');
    }
  }

  if (kungfuIds.length > 0) {
    const kungfus = await db
      .select({ id: gameKungfu.id, schoolId: gameKungfu.schoolId })
      .from(gameKungfu)
      .where(inArray(gameKungfu.id, kungfuIds));

    if (kungfus.length !== kungfuIds.length) {
      throw new RaidRunValidationError('One or more kungfu IDs are invalid');
    }

    for (const signup of body.signups) {
      if (!signup.kungfuId || !signup.schoolId) {
        continue;
      }

      const kungfu = kungfus.find((item) => item.id === signup.kungfuId);
      if (kungfu && kungfu.schoolId !== signup.schoolId) {
        throw new RaidRunValidationError(
          'Kungfu does not belong to the selected school',
        );
      }
    }
  }
};

const validateDraftSignups = (
  signups: SignupInput[],
  reserved: ReservedCounts,
): void => {
  validateSignupCoordinates(signups);
  validateSignupRoles(signups, reserved);
  validateFormationCorePerGroup(signups);
};

const validatePublishRun = (
  run: typeof raidRun.$inferSelect,
  signups: SignupInput[],
): void => {
  const name = run.name.trim();
  if (!name) {
    throw new RaidRunValidationError('name is required');
  }

  if (run.dungeonId === DRAFT_DUNGEON_SENTINEL) {
    throw new RaidRunValidationError('dungeonId is required');
  }

  if (run.startTime.getTime() === DRAFT_START_TIME_SENTINEL.getTime()) {
    throw new RaidRunValidationError('startTime is required');
  }

  if (run.gatherTime && run.gatherTime > run.startTime) {
    throw new RaidRunValidationError(
      'gatherTime must be before or equal to startTime',
    );
  }

  if (run.endTime && run.startTime >= run.endTime) {
    throw new RaidRunValidationError('startTime must be before endTime');
  }

  const reserved: ReservedCounts = {
    reservedDps: run.reservedDps,
    reservedHealer: run.reservedHealer,
    reservedTank: run.reservedTank,
    reservedBoss: run.reservedBoss,
  };

  assertReservedTotal(reserved);
  validateDraftSignups(signups, reserved);
  validateLeaderCount(signups);
};

const buildSignupInsertValues = (
  raidRunId: string,
  createdBy: string,
  signups: SignupInput[],
) =>
  signups.map((signup) => {
    const derived = deriveSignupFields(signup.role, signup.characterName);
    return {
      raidRunId,
      groupNumber: signup.groupNumber,
      positionNumber: signup.positionNumber,
      role: signup.role,
      status: derived.status,
      isReserved: derived.isReserved,
      isLeader: signup.isLeader,
      isDarkRun: signup.isDarkRun,
      isFormationCore: signup.isFormationCore,
      serverId: signup.serverId ?? null,
      characterName: signup.characterName?.trim() || null,
      schoolId: signup.schoolId ?? null,
      kungfuId: signup.kungfuId ?? null,
      userId: null,
      createdBy,
      remark: signup.remark ?? null,
    };
  });

const getRaidRunById = async (raidRunId: string) => {
  const rows = await db
    .select()
    .from(raidRun)
    .where(eq(raidRun.id, raidRunId))
    .limit(1);

  return rows[0] ?? null;
};

const getSignupsByRaidRunId = async (raidRunId: string) =>
  await db
    .select()
    .from(raidSignup)
    .where(eq(raidSignup.raidRunId, raidRunId))
    .orderBy(asc(raidSignup.groupNumber), asc(raidSignup.positionNumber));

const assertOwner = (
  run: typeof raidRun.$inferSelect,
  userId: string,
): void => {
  if (run.createdBy !== userId) {
    throw new RaidRunForbiddenError('You are not the creator of this raid run');
  }
};

const assertPending = (run: typeof raidRun.$inferSelect): void => {
  if (run.status !== 'pending') {
    throw new RaidRunConflictError('Only pending raid runs can be modified');
  }
};

export const getRaidRunDraft = async (
  raidRunId: string,
  userId: string,
): Promise<RaidRunResponse | null> => {
  const run = await getRaidRunById(raidRunId);
  if (!run) {
    return null;
  }

  assertOwner(run, userId);

  const signupRows = await getSignupsByRaidRunId(raidRunId);
  return toRaidRunResponse(
    run,
    signupRows.map((row) => toSignupResponse(row)),
  );
};

export const createRaidRunDraft = async (
  userId: string,
  body: CreateRaidRunBody,
): Promise<RaidRunResponse> => {
  const reserved: ReservedCounts = {
    reservedDps: body.reservedDps ?? 0,
    reservedHealer: body.reservedHealer ?? 0,
    reservedTank: body.reservedTank ?? 0,
    reservedBoss: body.reservedBoss ?? 0,
  };

  assertReservedTotal(reserved);
  validateDraftSignups(body.signups, reserved);
  await validateForeignKeys(body, false);

  const runValues = {
    name: body.name?.trim() ?? '',
    description: body.description ?? null,
    dungeonId: toDbDungeonId(body.dungeonId),
    createdBy: userId,
    status: 'pending' as const,
    gatherTime: toOptionalDate(body.gatherTime),
    startTime: toDbStartTime(body.startTime),
    endTime: toOptionalDate(body.endTime),
    reservedTank: reserved.reservedTank,
    reservedHealer: reserved.reservedHealer,
    reservedDps: reserved.reservedDps,
    reservedBoss: reserved.reservedBoss,
    remark: body.remark ?? null,
  };

  return db.transaction(async (tx) => {
    const [createdRun] = await tx.insert(raidRun).values(runValues).returning();

    if (!createdRun) {
      throw new RaidRunValidationError('Failed to create raid run');
    }

    const signupValues = buildSignupInsertValues(
      createdRun.id,
      userId,
      body.signups,
    );
    const createdSignups = await tx
      .insert(raidSignup)
      .values(signupValues)
      .returning();

    return toRaidRunResponse(
      createdRun,
      createdSignups.map((row) => toSignupResponse(row)),
    );
  });
};

export const patchRaidRunDraft = async (
  raidRunId: string,
  userId: string,
  body: PatchRaidRunBody,
): Promise<RaidRunResponse | null> => {
  const existing = await getRaidRunById(raidRunId);
  if (!existing) {
    return null;
  }

  assertOwner(existing, userId);
  assertPending(existing);

  const reserved: ReservedCounts = {
    reservedDps: body.reservedDps ?? existing.reservedDps,
    reservedHealer: body.reservedHealer ?? existing.reservedHealer,
    reservedTank: body.reservedTank ?? existing.reservedTank,
    reservedBoss: body.reservedBoss ?? existing.reservedBoss,
  };

  assertReservedTotal(reserved);

  if (body.signups) {
    validateDraftSignups(body.signups, reserved);
  }

  await validateForeignKeys(
    {
      dungeonId:
        body.dungeonId !== undefined ? body.dungeonId : existing.dungeonId,
      signups: body.signups,
    },
    false,
  );

  const runUpdates: Partial<typeof raidRun.$inferInsert> = {};

  if (body.name !== undefined) {
    runUpdates.name = body.name.trim();
  }
  if (body.description !== undefined) {
    runUpdates.description = body.description;
  }
  if (body.dungeonId !== undefined) {
    runUpdates.dungeonId = toDbDungeonId(body.dungeonId);
  }
  if (body.gatherTime !== undefined) {
    runUpdates.gatherTime = toOptionalDate(body.gatherTime);
  }
  if (body.startTime !== undefined) {
    runUpdates.startTime = toDbStartTime(body.startTime);
  }
  if (body.endTime !== undefined) {
    runUpdates.endTime = toOptionalDate(body.endTime);
  }
  if (body.reservedTank !== undefined) {
    runUpdates.reservedTank = body.reservedTank;
  }
  if (body.reservedHealer !== undefined) {
    runUpdates.reservedHealer = body.reservedHealer;
  }
  if (body.reservedDps !== undefined) {
    runUpdates.reservedDps = body.reservedDps;
  }
  if (body.reservedBoss !== undefined) {
    runUpdates.reservedBoss = body.reservedBoss;
  }
  if (body.remark !== undefined) {
    runUpdates.remark = body.remark;
  }

  return db.transaction(async (tx) => {
    let updatedRun = existing;

    if (Object.keys(runUpdates).length > 0) {
      const [row] = await tx
        .update(raidRun)
        .set(runUpdates)
        .where(eq(raidRun.id, raidRunId))
        .returning();

      if (!row) {
        return null;
      }

      updatedRun = row;
    }

    let signupResponses: RaidSignupResponse[];

    if (body.signups) {
      await tx.delete(raidSignup).where(eq(raidSignup.raidRunId, raidRunId));

      const signupValues = buildSignupInsertValues(
        raidRunId,
        userId,
        body.signups,
      );
      const createdSignups = await tx
        .insert(raidSignup)
        .values(signupValues)
        .returning();

      signupResponses = createdSignups.map((row) => toSignupResponse(row));
    } else {
      const signupRows = await tx
        .select()
        .from(raidSignup)
        .where(eq(raidSignup.raidRunId, raidRunId))
        .orderBy(asc(raidSignup.groupNumber), asc(raidSignup.positionNumber));

      signupResponses = signupRows.map((row) => toSignupResponse(row));
    }

    return toRaidRunResponse(updatedRun, signupResponses);
  });
};

export const publishRaidRun = async (
  raidRunId: string,
  userId: string,
): Promise<RaidRunResponse | null> => {
  const existing = await getRaidRunById(raidRunId);
  if (!existing) {
    return null;
  }

  assertOwner(existing, userId);
  assertPending(existing);

  const dungeon = await db
    .select({ id: gameDungeon.id })
    .from(gameDungeon)
    .where(eq(gameDungeon.id, existing.dungeonId))
    .limit(1);

  if (existing.dungeonId !== DRAFT_DUNGEON_SENTINEL && dungeon.length === 0) {
    throw new RaidRunValidationError('Dungeon not found');
  }

  const signupRows = await getSignupsByRaidRunId(raidRunId);
  const signupInputs: SignupInput[] = signupRows.map((row) => ({
    groupNumber: row.groupNumber ?? 1,
    positionNumber: row.positionNumber ?? 1,
    role: row.role,
    characterName: row.characterName,
    serverId: row.serverId,
    schoolId: row.schoolId,
    kungfuId: row.kungfuId,
    isLeader: row.isLeader,
    isDarkRun: row.isDarkRun,
    isFormationCore: row.isFormationCore,
    remark: row.remark,
  }));

  validatePublishRun(existing, signupInputs);

  const [publishedRun] = await db
    .update(raidRun)
    .set({ status: 'recruiting' })
    .where(and(eq(raidRun.id, raidRunId), eq(raidRun.status, 'pending')))
    .returning();

  if (!publishedRun) {
    return null;
  }

  return toRaidRunResponse(
    publishedRun,
    signupRows.map((row) => toSignupResponse(row)),
  );
};

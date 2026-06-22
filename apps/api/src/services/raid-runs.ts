import { db } from '@jx3/db';
import {
  gameDungeon,
  gameKungfu,
  gameSchool,
  gameServer,
  raidRun,
  raidSignup,
} from '@jx3/db/schema';
import { and, asc, desc, eq, inArray, ne, or } from 'drizzle-orm';
import type { RaidLootItem } from '../schemas/raid-loot';
import type {
  CreateRaidRunBody,
  ListMyRaidRunsResponse,
  PatchRaidRunBody,
  RaidRunListItem,
  RaidRunListItemMySignup,
  RaidRunResponse,
  RaidSignupResponse,
  RaidSignupRole,
  SignupInput,
} from '../schemas/raid-runs';
import { getAdminDungeonById } from './dungeons-admin';
import { listRaidLoot } from './raid-loot';
import {
  RaidRunConflictError,
  RaidRunForbiddenError,
  RaidRunValidationError,
} from './raid-run-errors';

export {
  RaidRunConflictError,
  RaidRunForbiddenError,
  RaidRunValidationError,
} from './raid-run-errors';

export const DRAFT_DUNGEON_SENTINEL = '00000000-0000-0000-0000-000000000000';
const DRAFT_START_TIME_SENTINEL = new Date('1970-01-01T00:00:00.000Z');

export type ReservedCounts = {
  reservedDps: number;
  reservedHealer: number;
  reservedTank: number;
  reservedBoss: number;
};

const RAID_GROUP_COUNT = 5;
const RAID_MAX_POSITIONS_PER_GROUP = 5;
const RAID_MAX_PLAYER_LIMIT = RAID_GROUP_COUNT * RAID_MAX_POSITIONS_PER_GROUP;
const DEFAULT_PLAYER_LIMIT = RAID_MAX_PLAYER_LIMIT;

const normalizePlayerLimit = (playerLimit: number = DEFAULT_PLAYER_LIMIT) =>
  Math.min(Math.max(1, Math.floor(playerLimit)), RAID_MAX_PLAYER_LIMIT);

const getRaidGridLayout = (playerLimit: number = DEFAULT_PLAYER_LIMIT) => {
  const limit = normalizePlayerLimit(playerLimit);

  return {
    playerLimit: limit,
    groupCount: RAID_GROUP_COUNT,
    positionsPerGroup: Math.ceil(limit / RAID_GROUP_COUNT),
  };
};

const isActiveSlot = (
  groupNumber: number,
  positionNumber: number,
  playerLimit: number = DEFAULT_PLAYER_LIMIT,
): boolean => {
  const { positionsPerGroup } = getRaidGridLayout(playerLimit);

  if (
    groupNumber < 1 ||
    groupNumber > RAID_GROUP_COUNT ||
    positionNumber < 1 ||
    positionNumber > positionsPerGroup
  ) {
    return false;
  }

  const ordinal = (groupNumber - 1) * positionsPerGroup + (positionNumber - 1);

  return ordinal < normalizePlayerLimit(playerLimit);
};

const listActiveSlotCoordinates = (
  playerLimit: number = DEFAULT_PLAYER_LIMIT,
): Array<{ groupNumber: number; positionNumber: number }> => {
  const { positionsPerGroup } = getRaidGridLayout(playerLimit);
  const coords: Array<{ groupNumber: number; positionNumber: number }> = [];

  for (let groupNumber = 1; groupNumber <= RAID_GROUP_COUNT; groupNumber += 1) {
    for (
      let positionNumber = 1;
      positionNumber <= positionsPerGroup;
      positionNumber += 1
    ) {
      if (isActiveSlot(groupNumber, positionNumber, playerLimit)) {
        coords.push({ groupNumber, positionNumber });
      }
    }
  }

  return coords;
};

export const computeSlotRoles = (
  reserved: ReservedCounts,
  playerLimit: number = DEFAULT_PLAYER_LIMIT,
): RaidSignupRole[] => {
  const roles: RaidSignupRole[] = [];
  const sequence: RaidSignupRole[] = [
    ...Array.from({ length: reserved.reservedDps }, () => 'dps' as const),
    ...Array.from({ length: reserved.reservedHealer }, () => 'healer' as const),
    ...Array.from({ length: reserved.reservedTank }, () => 'tank' as const),
    ...Array.from({ length: reserved.reservedBoss }, () => 'boss' as const),
  ];

  const activeCoords = listActiveSlotCoordinates(playerLimit);

  for (let index = 0; index < activeCoords.length; index += 1) {
    const { groupNumber, positionNumber } = activeCoords[index]!;
    const slotIndex = getSlotIndex(groupNumber, positionNumber);
    roles[slotIndex] = sequence[index] ?? 'pending';
  }

  return roles;
};

export const slotKey = (groupNumber: number, positionNumber: number): string =>
  `${groupNumber}-${positionNumber}`;

export const getSlotIndex = (
  groupNumber: number,
  positionNumber: number,
): number =>
  (groupNumber - 1) * RAID_MAX_POSITIONS_PER_GROUP + (positionNumber - 1);

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

const assertReservedTotal = (
  reserved: ReservedCounts,
  playerLimit: number,
): void => {
  const total =
    reserved.reservedDps +
    reserved.reservedHealer +
    reserved.reservedTank +
    reserved.reservedBoss;

  if (total > normalizePlayerLimit(playerLimit)) {
    throw new RaidRunValidationError(
      `Reserved role counts must not exceed ${normalizePlayerLimit(playerLimit)} in total`,
    );
  }
};

const validateSignupCoordinates = (
  signups: SignupInput[],
  playerLimit: number,
): void => {
  const keys = new Set<string>();
  const limit = normalizePlayerLimit(playerLimit);

  for (const signup of signups) {
    if (!isActiveSlot(signup.groupNumber, signup.positionNumber, limit)) {
      throw new RaidRunValidationError(
        `Invalid signup slot: group ${signup.groupNumber}, position ${signup.positionNumber}`,
      );
    }

    const key = slotKey(signup.groupNumber, signup.positionNumber);
    if (keys.has(key)) {
      throw new RaidRunValidationError(
        `Duplicate signup slot: group ${signup.groupNumber}, position ${signup.positionNumber}`,
      );
    }
    keys.add(key);
  }

  if (keys.size !== limit) {
    throw new RaidRunValidationError(
      `signups must cover all ${limit} grid slots exactly once`,
    );
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

const validateDarkRunCount = (signups: SignupInput[]): void => {
  const darkRunCount = signups.filter((signup) => signup.isDarkRun).length;
  if (darkRunCount > 1) {
    throw new RaidRunValidationError(
      'Only one dark run payer is allowed per raid run',
    );
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
  loot: RaidLootItem[] = [],
): RaidRunResponse => ({
  id: run.id,
  name: run.name,
  description: run.description,
  dungeonId: fromDbDungeonId(run.dungeonId),
  gameRaidId: run.gameRaidId,
  status: run.status,
  gatherTime: toIsoOrNull(run.gatherTime),
  startTime: fromDbStartTime(run.startTime),
  endTime: toIsoOrNull(run.endTime),
  reservedTank: run.reservedTank,
  reservedHealer: run.reservedHealer,
  reservedDps: run.reservedDps,
  reservedBoss: run.reservedBoss,
  totalIncome: run.totalIncome,
  wagePerPerson: run.wagePerPerson,
  remark: run.remark,
  createdAt: run.createdAt.toISOString(),
  updatedAt: run.updatedAt.toISOString(),
  signups,
  loot,
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

const resolvePlayerLimit = async (
  dungeonId: string | null | undefined,
): Promise<number> => {
  if (!dungeonId || dungeonId === DRAFT_DUNGEON_SENTINEL) {
    return DEFAULT_PLAYER_LIMIT;
  }

  const dungeon = await getAdminDungeonById(dungeonId);
  if (!dungeon) {
    throw new RaidRunValidationError('Dungeon not found');
  }

  return normalizePlayerLimit(dungeon.playerLimit);
};

const validateDraftSignups = (
  signups: SignupInput[],
  playerLimit: number,
): void => {
  validateSignupCoordinates(signups, playerLimit);
  validateFormationCorePerGroup(signups);
};

const validatePublishRun = async (
  run: typeof raidRun.$inferSelect,
  signups: SignupInput[],
): Promise<void> => {
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

  const playerLimit = await resolvePlayerLimit(run.dungeonId);
  const reserved: ReservedCounts = {
    reservedDps: run.reservedDps,
    reservedHealer: run.reservedHealer,
    reservedTank: run.reservedTank,
    reservedBoss: run.reservedBoss,
  };

  assertReservedTotal(reserved, playerLimit);
  validateDraftSignups(signups, playerLimit);
  validateLeaderCount(signups);
  validateDarkRunCount(signups);
};

const buildSignupCopyValues = (
  raidRunId: string,
  createdBy: string,
  sourceSignups: Array<typeof raidSignup.$inferSelect>,
) =>
  sourceSignups.map((signup) => ({
    raidRunId,
    groupNumber: signup.groupNumber,
    positionNumber: signup.positionNumber,
    role: signup.role,
    status: signup.status,
    isReserved: signup.isReserved,
    isLeader: signup.isLeader,
    isDarkRun: signup.isDarkRun,
    isFormationCore: signup.isFormationCore,
    serverId: signup.serverId,
    characterName: signup.characterName,
    schoolId: signup.schoolId,
    kungfuId: signup.kungfuId,
    userId: signup.userId,
    createdBy,
    remark: signup.remark,
  }));

const buildSignupInsertValues = (
  raidRunId: string,
  createdBy: string,
  signups: SignupInput[],
  existingBySlot?: Map<string, typeof raidSignup.$inferSelect>,
) =>
  signups.map((signup) => {
    const existing = existingBySlot?.get(
      slotKey(signup.groupNumber, signup.positionNumber),
    );
    const derived = deriveSignupFields(signup.role, signup.characterName);
    const preserveLinkedUser = Boolean(existing?.userId);

    return {
      raidRunId,
      groupNumber: signup.groupNumber,
      positionNumber: signup.positionNumber,
      role: signup.role,
      status: preserveLinkedUser ? existing!.status : derived.status,
      isReserved: preserveLinkedUser
        ? existing!.isReserved
        : derived.isReserved,
      isLeader: signup.isLeader,
      isDarkRun: signup.isDarkRun,
      isFormationCore: signup.isFormationCore,
      serverId: signup.serverId ?? null,
      characterName: signup.characterName?.trim() || null,
      schoolId: signup.schoolId ?? null,
      kungfuId: signup.kungfuId ?? null,
      userId: existing?.userId ?? null,
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

const EDITABLE_RAID_RUN_STATUSES = [
  'pending',
  'recruiting',
  'ongoing',
] as const;

const assertEditable = (run: typeof raidRun.$inferSelect): void => {
  if (
    !EDITABLE_RAID_RUN_STATUSES.includes(
      run.status as (typeof EDITABLE_RAID_RUN_STATUSES)[number],
    )
  ) {
    throw new RaidRunConflictError('This raid run cannot be modified');
  }
};

const assertPending = (run: typeof raidRun.$inferSelect): void => {
  if (run.status !== 'pending') {
    throw new RaidRunConflictError('Only pending raid runs can be published');
  }
};

const RAID_RUN_STATUS_TRANSITIONS: Record<
  (typeof raidRun.$inferSelect)['status'],
  ReadonlyArray<(typeof raidRun.$inferSelect)['status']>
> = {
  pending: ['recruiting', 'cancelled'],
  recruiting: ['ongoing', 'cancelled'],
  ongoing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const assertValidStatusTransition = (
  currentStatus: (typeof raidRun.$inferSelect)['status'],
  targetStatus: (typeof raidRun.$inferSelect)['status'],
): void => {
  const allowed = RAID_RUN_STATUS_TRANSITIONS[currentStatus];
  if (!allowed.includes(targetStatus)) {
    throw new RaidRunConflictError(
      `Cannot transition raid run from ${currentStatus} to ${targetStatus}`,
    );
  }
};

const validateRecruitingTransition = async (
  run: typeof raidRun.$inferSelect,
  signupRows: Array<typeof raidSignup.$inferSelect>,
): Promise<void> => {
  const dungeon = await db
    .select({ id: gameDungeon.id })
    .from(gameDungeon)
    .where(eq(gameDungeon.id, run.dungeonId))
    .limit(1);

  if (run.dungeonId !== DRAFT_DUNGEON_SENTINEL && dungeon.length === 0) {
    throw new RaidRunValidationError('Dungeon not found');
  }

  await validatePublishRun(run, signupRowsToInputs(signupRows));
};

const RAID_RUN_STATUS_SORT_WEIGHT: Record<
  (typeof raidRun.$inferSelect)['status'],
  number
> = {
  ongoing: 0,
  recruiting: 1,
  pending: 2,
  completed: 3,
  cancelled: 4,
};

const toMySignupSummary = (
  signup: typeof raidSignup.$inferSelect,
  serverName: string | null,
): RaidRunListItemMySignup => ({
  role: signup.role,
  status: signup.status,
  isLeader: signup.isLeader,
  characterName: signup.characterName,
  serverId: signup.serverId,
  serverName,
});

const toRaidRunListItem = (
  run: typeof raidRun.$inferSelect,
  userId: string,
  dungeonName: string | null,
  mySignup: RaidRunListItemMySignup | null,
): RaidRunListItem => ({
  id: run.id,
  name: run.name,
  status: run.status,
  dungeonId: fromDbDungeonId(run.dungeonId),
  dungeonName,
  gatherTime: toIsoOrNull(run.gatherTime),
  startTime: fromDbStartTime(run.startTime),
  endTime: toIsoOrNull(run.endTime),
  createdAt: run.createdAt.toISOString(),
  isCreator: run.createdBy === userId,
  mySignup,
});

const sortRaidRunListItems = (items: RaidRunListItem[]): RaidRunListItem[] =>
  [...items].sort((left, right) => {
    const statusDiff =
      RAID_RUN_STATUS_SORT_WEIGHT[left.status] -
      RAID_RUN_STATUS_SORT_WEIGHT[right.status];

    if (statusDiff !== 0) {
      return statusDiff;
    }

    const leftTime = left.startTime ?? left.createdAt;
    const rightTime = right.startTime ?? right.createdAt;
    return rightTime.localeCompare(leftTime);
  });

const signupRowsToInputs = (
  signupRows: Array<typeof raidSignup.$inferSelect>,
): SignupInput[] =>
  signupRows.map((row) => ({
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

const mergeRunForValidation = (
  existing: typeof raidRun.$inferSelect,
  runUpdates: Partial<typeof raidRun.$inferInsert>,
): typeof raidRun.$inferSelect => ({
  ...existing,
  ...runUpdates,
});

export const listMyRaidRuns = async (
  userId: string,
  filter: 'all' | 'created' | 'leader',
): Promise<ListMyRaidRunsResponse> => {
  if (filter === 'created') {
    const rows = await db
      .select({
        run: raidRun,
        dungeonName: gameDungeon.name,
        signup: raidSignup,
        serverName: gameServer.name,
      })
      .from(raidRun)
      .leftJoin(gameDungeon, eq(raidRun.dungeonId, gameDungeon.id))
      .leftJoin(
        raidSignup,
        and(
          eq(raidSignup.raidRunId, raidRun.id),
          eq(raidSignup.userId, userId),
        ),
      )
      .leftJoin(gameServer, eq(raidSignup.serverId, gameServer.id))
      .where(eq(raidRun.createdBy, userId))
      .orderBy(desc(raidRun.startTime))
      .limit(100);

    const itemsById = new Map<string, RaidRunListItem>();

    for (const row of rows) {
      const existing = itemsById.get(row.run.id);
      const mySignup = row.signup
        ? toMySignupSummary(row.signup, row.serverName)
        : null;

      if (!existing) {
        itemsById.set(
          row.run.id,
          toRaidRunListItem(row.run, userId, row.dungeonName, mySignup),
        );
        continue;
      }

      if (!existing.mySignup && mySignup) {
        itemsById.set(row.run.id, { ...existing, mySignup });
      }
    }

    return { items: sortRaidRunListItems([...itemsById.values()]) };
  }

  if (filter === 'all') {
    const rows = await db
      .select({
        run: raidRun,
        signup: raidSignup,
        dungeonName: gameDungeon.name,
        serverName: gameServer.name,
      })
      .from(raidRun)
      .leftJoin(gameDungeon, eq(raidRun.dungeonId, gameDungeon.id))
      .leftJoin(
        raidSignup,
        and(
          eq(raidSignup.raidRunId, raidRun.id),
          eq(raidSignup.userId, userId),
        ),
      )
      .leftJoin(gameServer, eq(raidSignup.serverId, gameServer.id))
      .where(
        and(
          ne(raidRun.status, 'pending'),
          or(eq(raidRun.createdBy, userId), eq(raidSignup.userId, userId)),
        ),
      )
      .orderBy(desc(raidRun.startTime))
      .limit(200);

    const itemsById = new Map<string, RaidRunListItem>();

    for (const row of rows) {
      const existing = itemsById.get(row.run.id);
      const mySignup = row.signup
        ? toMySignupSummary(row.signup, row.serverName)
        : null;

      if (!existing) {
        itemsById.set(
          row.run.id,
          toRaidRunListItem(row.run, userId, row.dungeonName, mySignup),
        );
        continue;
      }

      if (!existing.mySignup && mySignup) {
        itemsById.set(row.run.id, { ...existing, mySignup });
      } else if (
        mySignup?.isLeader &&
        existing.mySignup &&
        !existing.mySignup.isLeader
      ) {
        itemsById.set(
          row.run.id,
          toRaidRunListItem(row.run, userId, row.dungeonName, mySignup),
        );
      }
    }

    return { items: sortRaidRunListItems([...itemsById.values()]) };
  }

  const conditions = [
    eq(raidSignup.userId, userId),
    ne(raidRun.status, 'pending'),
    eq(raidSignup.isLeader, true),
  ];

  const rows = await db
    .select({
      run: raidRun,
      signup: raidSignup,
      dungeonName: gameDungeon.name,
      serverName: gameServer.name,
    })
    .from(raidSignup)
    .innerJoin(raidRun, eq(raidSignup.raidRunId, raidRun.id))
    .leftJoin(gameDungeon, eq(raidRun.dungeonId, gameDungeon.id))
    .leftJoin(gameServer, eq(raidSignup.serverId, gameServer.id))
    .where(and(...conditions))
    .orderBy(desc(raidRun.startTime))
    .limit(200);

  const itemsById = new Map<string, RaidRunListItem>();

  for (const row of rows) {
    const mySignup = toMySignupSummary(row.signup, row.serverName);
    const existing = itemsById.get(row.run.id);

    if (!existing) {
      itemsById.set(
        row.run.id,
        toRaidRunListItem(row.run, userId, row.dungeonName, mySignup),
      );
      continue;
    }

    if (mySignup.isLeader && !existing.mySignup?.isLeader) {
      itemsById.set(
        row.run.id,
        toRaidRunListItem(row.run, userId, row.dungeonName, mySignup),
      );
    }
  }

  return { items: sortRaidRunListItems([...itemsById.values()]) };
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
  const loot = await listRaidLoot(raidRunId);
  return toRaidRunResponse(
    run,
    signupRows.map((row) => toSignupResponse(row)),
    loot,
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

  const playerLimit = await resolvePlayerLimit(body.dungeonId);

  assertReservedTotal(reserved, playerLimit);
  validateDraftSignups(body.signups, playerLimit);
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
  assertEditable(existing);

  const reserved: ReservedCounts = {
    reservedDps: body.reservedDps ?? existing.reservedDps,
    reservedHealer: body.reservedHealer ?? existing.reservedHealer,
    reservedTank: body.reservedTank ?? existing.reservedTank,
    reservedBoss: body.reservedBoss ?? existing.reservedBoss,
  };

  const playerLimit = await resolvePlayerLimit(
    body.dungeonId !== undefined ? body.dungeonId : existing.dungeonId,
  );

  assertReservedTotal(reserved, playerLimit);

  if (body.signups) {
    validateDraftSignups(body.signups, playerLimit);
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

  const mergedRun = mergeRunForValidation(existing, runUpdates);

  if (existing.status !== 'pending') {
    const signupRowsForValidation = body.signups
      ? body.signups
      : signupRowsToInputs(await getSignupsByRaidRunId(raidRunId));

    await validatePublishRun(mergedRun, signupRowsForValidation);
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
      const existingSignups = await tx
        .select()
        .from(raidSignup)
        .where(eq(raidSignup.raidRunId, raidRunId));

      const existingBySlot = new Map(
        existingSignups.map((row) => [
          slotKey(row.groupNumber ?? 1, row.positionNumber ?? 1),
          row,
        ]),
      );

      await tx.delete(raidSignup).where(eq(raidSignup.raidRunId, raidRunId));

      const signupValues = buildSignupInsertValues(
        raidRunId,
        userId,
        body.signups,
        existingBySlot,
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

export const updateRaidRunStatus = async (
  raidRunId: string,
  userId: string,
  targetStatus: (typeof raidRun.$inferSelect)['status'],
): Promise<RaidRunResponse | null> => {
  const existing = await getRaidRunById(raidRunId);
  if (!existing) {
    return null;
  }

  assertOwner(existing, userId);
  assertValidStatusTransition(existing.status, targetStatus);

  const signupRows = await getSignupsByRaidRunId(raidRunId);

  if (existing.status === 'pending' && targetStatus === 'recruiting') {
    await validateRecruitingTransition(existing, signupRows);
  }

  const runUpdates: Partial<typeof raidRun.$inferInsert> = {
    status: targetStatus,
  };

  if (targetStatus === 'completed' && !existing.endTime) {
    runUpdates.endTime = new Date();
  }

  const [updatedRun] = await db
    .update(raidRun)
    .set(runUpdates)
    .where(and(eq(raidRun.id, raidRunId), eq(raidRun.status, existing.status)))
    .returning();

  if (!updatedRun) {
    return null;
  }

  return toRaidRunResponse(
    updatedRun,
    signupRows.map((row) => toSignupResponse(row)),
  );
};

export const publishRaidRun = async (
  raidRunId: string,
  userId: string,
): Promise<RaidRunResponse | null> => {
  const existing = await getRaidRunById(raidRunId);
  if (!existing) {
    return null;
  }

  assertPending(existing);

  return updateRaidRunStatus(raidRunId, userId, 'recruiting');
};

export const duplicateRaidRun = async (
  raidRunId: string,
  userId: string,
): Promise<RaidRunResponse | null> => {
  const source = await getRaidRunById(raidRunId);
  if (!source) {
    return null;
  }

  assertOwner(source, userId);

  const sourceSignups = await getSignupsByRaidRunId(raidRunId);
  const signupInputs = signupRowsToInputs(sourceSignups);
  const playerLimit = await resolvePlayerLimit(source.dungeonId);

  validateDraftSignups(signupInputs, playerLimit);
  await validateForeignKeys(
    {
      dungeonId: fromDbDungeonId(source.dungeonId),
      signups: signupInputs,
    },
    false,
  );

  const runValues = {
    name: source.name,
    description: source.description,
    dungeonId: source.dungeonId,
    createdBy: userId,
    status: 'pending' as const,
    gatherTime: source.gatherTime,
    startTime: source.startTime,
    endTime: source.endTime,
    reservedTank: source.reservedTank,
    reservedHealer: source.reservedHealer,
    reservedDps: source.reservedDps,
    reservedBoss: source.reservedBoss,
    remark: source.remark,
  };

  return db.transaction(async (tx) => {
    const [createdRun] = await tx.insert(raidRun).values(runValues).returning();

    if (!createdRun) {
      throw new RaidRunValidationError('Failed to duplicate raid run');
    }

    const signupValues = buildSignupCopyValues(
      createdRun.id,
      userId,
      sourceSignups,
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

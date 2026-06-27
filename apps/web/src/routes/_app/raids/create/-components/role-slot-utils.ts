export const RAID_SIGNUP_ROLES = [
  'pending',
  'tank',
  'healer',
  'dps',
  'boss',
] as const;

export type RaidSignupRole = (typeof RAID_SIGNUP_ROLES)[number];

export type ReservedCounts = {
  reservedDps: number;
  reservedHealer: number;
  reservedTank: number;
  reservedBoss: number;
};

export const RAID_GROUP_COUNT = 5;
export const RAID_MAX_POSITIONS_PER_GROUP = 5;
export const RAID_MAX_PLAYER_LIMIT =
  RAID_GROUP_COUNT * RAID_MAX_POSITIONS_PER_GROUP;
export const DEFAULT_PLAYER_LIMIT = RAID_MAX_PLAYER_LIMIT;

export type RaidGridLayout = {
  playerLimit: number;
  groupCount: number;
  positionsPerGroup: number;
};

export const ROLE_LABELS: Record<RaidSignupRole, string> = {
  pending: '待定',
  tank: '坦克',
  healer: '治疗',
  dps: 'DPS',
  boss: '老板',
};

export const ROLE_CELL_CLASSES: Record<RaidSignupRole, string> = {
  dps: 'bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30',
  healer: 'bg-green-500/20 border-green-500/50 hover:bg-green-500/30',
  tank: 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30',
  boss: 'bg-zinc-500/20 border-zinc-500/50 hover:bg-zinc-500/30',
  pending: 'bg-muted border-border hover:bg-muted/80',
};

export const normalizePlayerLimit = (
  playerLimit: number = DEFAULT_PLAYER_LIMIT,
): number =>
  Math.min(Math.max(1, Math.floor(playerLimit)), RAID_MAX_PLAYER_LIMIT);

export const resolvePlayerLimitForDraft = (input: {
  dungeonId: string | null;
  signups: readonly unknown[];
  dungeonPlayerLimit?: number | null;
}): number => {
  if (input.dungeonPlayerLimit != null) {
    return normalizePlayerLimit(input.dungeonPlayerLimit);
  }

  if (input.dungeonId && input.signups.length > 0) {
    return normalizePlayerLimit(input.signups.length);
  }

  return DEFAULT_PLAYER_LIMIT;
};

export const getRaidGridLayout = (
  playerLimit: number = DEFAULT_PLAYER_LIMIT,
): RaidGridLayout => {
  const limit = normalizePlayerLimit(playerLimit);

  return {
    playerLimit: limit,
    groupCount: RAID_GROUP_COUNT,
    positionsPerGroup: Math.ceil(limit / RAID_GROUP_COUNT),
  };
};

export const getSlotIndex = (
  groupNumber: number,
  positionNumber: number,
): number =>
  (groupNumber - 1) * RAID_MAX_POSITIONS_PER_GROUP + (positionNumber - 1);

export const slotKey = (groupNumber: number, positionNumber: number): string =>
  `${groupNumber}-${positionNumber}`;

export type SlotCoordinate = {
  groupNumber: number;
  positionNumber: number;
};

export const isActiveSlot = (
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

export const listActiveSlotCoordinates = (
  playerLimit: number = DEFAULT_PLAYER_LIMIT,
): SlotCoordinate[] => {
  const { positionsPerGroup } = getRaidGridLayout(playerLimit);
  const coords: SlotCoordinate[] = [];

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

export const getReservedTotal = (reserved: ReservedCounts): number =>
  reserved.reservedDps +
  reserved.reservedHealer +
  reserved.reservedTank +
  reserved.reservedBoss;

export const isReservedTotalValid = (
  reserved: ReservedCounts,
  playerLimit: number = DEFAULT_PLAYER_LIMIT,
): boolean => getReservedTotal(reserved) <= normalizePlayerLimit(playerLimit);

export const clampReservedCounts = (
  reserved: ReservedCounts,
  playerLimit: number = DEFAULT_PLAYER_LIMIT,
): ReservedCounts => {
  const limit = normalizePlayerLimit(playerLimit);
  let next: ReservedCounts = {
    reservedDps: Math.min(reserved.reservedDps, limit),
    reservedHealer: Math.min(reserved.reservedHealer, limit),
    reservedTank: Math.min(reserved.reservedTank, limit),
    reservedBoss: Math.min(reserved.reservedBoss, limit),
  };

  const reduceOrder: Array<keyof ReservedCounts> = [
    'reservedBoss',
    'reservedTank',
    'reservedHealer',
    'reservedDps',
  ];

  while (getReservedTotal(next) > limit) {
    const key = reduceOrder.find((field) => next[field] > 0);
    if (!key) {
      break;
    }

    next = {
      ...next,
      [key]: next[key] - 1,
    };
  }

  return next;
};

export const deriveReservedCounts = (
  roles: RaidSignupRole[],
): ReservedCounts => ({
  reservedDps: roles.filter((role) => role === 'dps').length,
  reservedHealer: roles.filter((role) => role === 'healer').length,
  reservedTank: roles.filter((role) => role === 'tank').length,
  reservedBoss: roles.filter((role) => role === 'boss').length,
});

export const formatSlotDisplayName = (
  characterName: string | null | undefined,
  serverName: string | null | undefined,
): string => {
  const name = characterName?.trim();
  const server = serverName?.trim();

  if (name && server) {
    return `${name}·${server}`;
  }

  if (name) {
    return name;
  }

  return '空位';
};

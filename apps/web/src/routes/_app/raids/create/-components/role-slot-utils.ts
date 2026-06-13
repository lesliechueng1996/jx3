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

export const getSlotIndex = (
  groupNumber: number,
  positionNumber: number,
): number => (groupNumber - 1) * 5 + (positionNumber - 1);

export const slotKey = (groupNumber: number, positionNumber: number): string =>
  `${groupNumber}-${positionNumber}`;

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

  let slot = 0;
  for (let group = 1; group <= 5; group += 1) {
    for (let position = 1; position <= 5; position += 1) {
      const index = getSlotIndex(group, position);
      roles[index] = sequence[slot] ?? 'pending';
      slot += 1;
    }
  }

  return roles;
};

export const getReservedTotal = (reserved: ReservedCounts): number =>
  reserved.reservedDps +
  reserved.reservedHealer +
  reserved.reservedTank +
  reserved.reservedBoss;

export const isReservedTotalValid = (reserved: ReservedCounts): boolean =>
  getReservedTotal(reserved) <= 25;

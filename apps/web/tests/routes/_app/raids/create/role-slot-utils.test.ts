import { describe, expect, it } from 'vitest';
import {
  applyDungeonSelection,
  applyReservedRoles,
  applySignupPatch,
  clearDarkRunExcept,
  clearLeaderExcept,
  createInitialRaidRunDraft,
  getDefaultReservedCountsForPlayerLimit,
  resizeDraftForPlayerLimit,
  swapSignupsAt,
  syncReservedCounts,
  updateSignupAt,
} from '#/routes/_app/raids/create/-components/raid-signup-draft';
import {
  clampReservedCounts,
  computeSlotRoles,
  deriveReservedCounts,
  formatSlotDisplayName,
  getSlotIndex,
  isActiveSlot,
  isReservedTotalValid,
  listActiveSlotCoordinates,
} from '#/routes/_app/raids/create/-components/role-slot-utils';

const roleAt = (
  roles: ReturnType<typeof computeSlotRoles>,
  groupNumber: number,
  positionNumber: number,
) => roles[getSlotIndex(groupNumber, positionNumber)];

describe('role-slot-utils', () => {
  it('fills columns top-to-bottom then left-to-right', () => {
    const roles = computeSlotRoles({
      reservedTank: 3,
      reservedHealer: 5,
      reservedDps: 0,
      reservedBoss: 0,
    });

    expect(roleAt(roles, 1, 1)).toBe('healer');
    expect(roleAt(roles, 1, 2)).toBe('healer');
    expect(roleAt(roles, 1, 3)).toBe('healer');
    expect(roleAt(roles, 1, 4)).toBe('healer');
    expect(roleAt(roles, 1, 5)).toBe('healer');
    expect(roleAt(roles, 2, 1)).toBe('tank');
    expect(roleAt(roles, 2, 2)).toBe('tank');
    expect(roleAt(roles, 2, 3)).toBe('tank');
    expect(roleAt(roles, 2, 4)).toBe('pending');
  });

  it('assigns roles in dps, healer, tank, boss order', () => {
    const roles = computeSlotRoles({
      reservedTank: 1,
      reservedHealer: 1,
      reservedDps: 2,
      reservedBoss: 0,
    });

    expect(roles.slice(0, 4)).toEqual(['dps', 'dps', 'healer', 'tank']);
  });

  it('validates reserved total against player limit', () => {
    expect(
      isReservedTotalValid(
        {
          reservedDps: 5,
          reservedHealer: 3,
          reservedTank: 2,
          reservedBoss: 0,
        },
        10,
      ),
    ).toBe(true);
    expect(
      isReservedTotalValid(
        {
          reservedDps: 6,
          reservedHealer: 3,
          reservedTank: 2,
          reservedBoss: 0,
        },
        10,
      ),
    ).toBe(false);
  });

  it('lists active slots for a 10-player raid', () => {
    expect(listActiveSlotCoordinates(10)).toHaveLength(10);
    expect(isActiveSlot(5, 2, 10)).toBe(true);
    expect(isActiveSlot(5, 3, 10)).toBe(false);
  });

  it('clamps reserved counts when player limit shrinks', () => {
    expect(
      clampReservedCounts(
        {
          reservedDps: 15,
          reservedHealer: 5,
          reservedTank: 3,
          reservedBoss: 2,
        },
        10,
      ),
    ).toEqual({
      reservedDps: 10,
      reservedHealer: 0,
      reservedTank: 0,
      reservedBoss: 0,
    });
  });

  it('derives reserved counts from signup roles', () => {
    expect(
      deriveReservedCounts([
        'dps',
        'dps',
        'healer',
        'tank',
        'boss',
        ...Array.from({ length: 20 }, () => 'pending' as const),
      ]),
    ).toEqual({
      reservedDps: 2,
      reservedHealer: 1,
      reservedTank: 1,
      reservedBoss: 1,
    });
  });

  it('formats slot display name', () => {
    expect(formatSlotDisplayName('四堆', '梦江南')).toBe('四堆·梦江南');
    expect(formatSlotDisplayName('四堆', null)).toBe('四堆');
    expect(formatSlotDisplayName(null, '梦江南')).toBe('空位');
    expect(formatSlotDisplayName(null, null)).toBe('空位');
  });
});

describe('raid-signup-draft', () => {
  it('preserves signup data when reserved roles change', () => {
    const draft = applyReservedRoles({
      ...createInitialRaidRunDraft(),
      reservedDps: 2,
      signups: createInitialRaidRunDraft().signups.map((signup) =>
        signup.groupNumber === 1 && signup.positionNumber === 1
          ? { ...signup, characterName: '叶修', role: 'dps' }
          : signup,
      ),
    });

    const reduced = applyReservedRoles({
      ...draft,
      reservedDps: 1,
    });

    const firstSlot = reduced.signups.find(
      (signup) => signup.groupNumber === 1 && signup.positionNumber === 1,
    );
    const secondSlot = reduced.signups.find(
      (signup) => signup.groupNumber === 1 && signup.positionNumber === 2,
    );

    expect(firstSlot?.characterName).toBe('叶修');
    expect(firstSlot?.role).toBe('dps');
    expect(secondSlot?.role).toBe('pending');
  });

  it('updates a single signup slot', () => {
    const draft = createInitialRaidRunDraft();
    const next = updateSignupAt(draft.signups, 2, 3, {
      characterName: '测试角色',
    });

    expect(findUpdated(next, 2, 3)?.characterName).toBe('测试角色');
    expect(findUpdated(next, 1, 1)?.characterName).toBeNull();
  });

  it('clears leader from other slots when setting a new leader', () => {
    const signups = createInitialRaidRunDraft().signups.map((signup) =>
      signup.groupNumber === 1 && signup.positionNumber === 1
        ? { ...signup, isLeader: true }
        : signup,
    );

    const next = clearLeaderExcept(signups, 3, 2).map((signup) =>
      signup.groupNumber === 3 && signup.positionNumber === 2
        ? { ...signup, isLeader: true }
        : signup,
    );

    expect(findUpdated(next, 1, 1)?.isLeader).toBe(false);
    expect(findUpdated(next, 3, 2)?.isLeader).toBe(true);
  });

  it('clears dark run from other slots when setting a new dark run payer', () => {
    const signups = createInitialRaidRunDraft().signups.map((signup) =>
      signup.groupNumber === 2 && signup.positionNumber === 4
        ? { ...signup, isDarkRun: true }
        : signup,
    );

    const next = clearDarkRunExcept(signups, 4, 1).map((signup) =>
      signup.groupNumber === 4 && signup.positionNumber === 1
        ? { ...signup, isDarkRun: true }
        : signup,
    );

    expect(findUpdated(next, 2, 4)?.isDarkRun).toBe(false);
    expect(findUpdated(next, 4, 1)?.isDarkRun).toBe(true);
  });

  it('syncs reserved counts when signup role changes', () => {
    const draft = createInitialRaidRunDraft();
    const next = applySignupPatch(draft, 1, 1, { role: 'tank' });

    expect(next.reservedTank).toBe(1);
    expect(findUpdated(next.signups, 1, 1)?.role).toBe('tank');
  });

  it('swaps two signup slots', () => {
    const signups = createInitialRaidRunDraft().signups.map((signup) => {
      if (signup.groupNumber === 1 && signup.positionNumber === 1) {
        return { ...signup, characterName: 'A', role: 'dps' as const };
      }
      if (signup.groupNumber === 2 && signup.positionNumber === 3) {
        return { ...signup, characterName: 'B', role: 'healer' as const };
      }
      return signup;
    });

    const next = swapSignupsAt(
      signups,
      { groupNumber: 1, positionNumber: 1 },
      { groupNumber: 2, positionNumber: 3 },
    );

    expect(findUpdated(next, 1, 1)?.characterName).toBe('B');
    expect(findUpdated(next, 1, 1)?.role).toBe('healer');
    expect(findUpdated(next, 2, 3)?.characterName).toBe('A');
    expect(findUpdated(next, 2, 3)?.role).toBe('dps');
  });

  it('provides default reserved counts for 25- and 10-player raids', () => {
    expect(getDefaultReservedCountsForPlayerLimit(25)).toEqual({
      reservedTank: 4,
      reservedHealer: 5,
      reservedDps: 16,
      reservedBoss: 0,
    });
    expect(getDefaultReservedCountsForPlayerLimit(10)).toEqual({
      reservedTank: 1,
      reservedHealer: 1,
      reservedDps: 8,
      reservedBoss: 0,
    });
    expect(getDefaultReservedCountsForPlayerLimit(5)).toEqual({
      reservedTank: 0,
      reservedHealer: 0,
      reservedDps: 0,
      reservedBoss: 0,
    });
  });

  it('applies default reserved counts when selecting a dungeon', () => {
    const draft = createInitialRaidRunDraft(25);
    const next = applyDungeonSelection(
      { ...draft, dungeonId: 'dungeon-10' },
      10,
    );

    expect(next.reservedTank).toBe(1);
    expect(next.reservedHealer).toBe(1);
    expect(next.reservedDps).toBe(8);
    expect(next.reservedBoss).toBe(0);
    expect(next.signups).toHaveLength(10);
    expect(next.signups.every((signup) => signup.role === 'pending')).toBe(
      true,
    );
  });

  it('preserves signup roles when selecting a dungeon', () => {
    const signups = createInitialRaidRunDraft(25).signups.map((signup) => {
      if (signup.groupNumber === 1 && signup.positionNumber === 1) {
        return { ...signup, characterName: 'A', role: 'healer' as const };
      }
      if (signup.groupNumber === 2 && signup.positionNumber === 3) {
        return { ...signup, characterName: 'B', role: 'tank' as const };
      }
      return signup;
    });

    const next = applyDungeonSelection(
      { ...createInitialRaidRunDraft(25), signups, dungeonId: 'dungeon-25' },
      25,
    );

    expect(findUpdated(next.signups, 1, 1)?.role).toBe('healer');
    expect(findUpdated(next.signups, 2, 3)?.role).toBe('tank');
  });

  it('resizes draft signups when player limit changes', () => {
    const draft = {
      ...createInitialRaidRunDraft(25),
      reservedDps: 12,
      reservedHealer: 8,
      reservedTank: 3,
      reservedBoss: 2,
    };
    const resized = resizeDraftForPlayerLimit(draft, 10);

    expect(resized.signups).toHaveLength(10);
    expect(resized.reservedDps).toBe(10);
    expect(resized.reservedHealer).toBe(0);
    expect(resized.reservedTank).toBe(0);
    expect(resized.reservedBoss).toBe(0);
  });

  it('preserves signup roles when resizing for player limit', () => {
    const signups = createInitialRaidRunDraft(25).signups.map((signup) => {
      if (signup.groupNumber === 1 && signup.positionNumber === 1) {
        return { ...signup, characterName: 'A', role: 'healer' as const };
      }
      if (signup.groupNumber === 2 && signup.positionNumber === 3) {
        return { ...signup, characterName: 'B', role: 'tank' as const };
      }
      return signup;
    });
    const draft = {
      ...createInitialRaidRunDraft(25),
      signups,
      reservedDps: 8,
      reservedHealer: 1,
      reservedTank: 1,
      reservedBoss: 0,
    };

    const resized = resizeDraftForPlayerLimit(draft, 25);

    expect(findUpdated(resized.signups, 1, 1)?.role).toBe('healer');
    expect(findUpdated(resized.signups, 2, 3)?.role).toBe('tank');
  });

  it('syncs reserved counts from all signups', () => {
    const draft = {
      ...createInitialRaidRunDraft(),
      signups: createInitialRaidRunDraft().signups.map((signup, index) => ({
        ...signup,
        role:
          index < 2
            ? ('dps' as const)
            : index === 2
              ? ('healer' as const)
              : ('pending' as const),
      })),
    };

    const synced = syncReservedCounts(draft);
    expect(synced.reservedDps).toBe(2);
    expect(synced.reservedHealer).toBe(1);
    expect(synced.reservedTank).toBe(0);
    expect(synced.reservedBoss).toBe(0);
  });
});

const findUpdated = (
  signups: ReturnType<typeof createInitialRaidRunDraft>['signups'],
  groupNumber: number,
  positionNumber: number,
) =>
  signups.find(
    (signup) =>
      signup.groupNumber === groupNumber &&
      signup.positionNumber === positionNumber,
  );

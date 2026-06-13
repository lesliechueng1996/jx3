import { describe, expect, it } from 'vitest';
import {
  applyReservedRoles,
  clearDarkRunExcept,
  clearLeaderExcept,
  createInitialRaidRunDraft,
  updateSignupAt,
} from '#/routes/_app/raids/create/-components/raid-signup-draft';
import {
  computeSlotRoles,
  getReservedTotal,
  getSlotIndex,
  isReservedTotalValid,
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

  it('validates reserved total', () => {
    expect(
      isReservedTotalValid({
        reservedDps: 10,
        reservedHealer: 5,
        reservedTank: 5,
        reservedBoss: 1,
      }),
    ).toBe(true);
    expect(
      getReservedTotal({
        reservedDps: 10,
        reservedHealer: 10,
        reservedTank: 5,
        reservedBoss: 1,
      }),
    ).toBe(26);
    expect(
      isReservedTotalValid({
        reservedDps: 10,
        reservedHealer: 10,
        reservedTank: 5,
        reservedBoss: 1,
      }),
    ).toBe(false);
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

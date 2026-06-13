import { describe, expect, it } from 'vitest';
import {
  applyReservedRoles,
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

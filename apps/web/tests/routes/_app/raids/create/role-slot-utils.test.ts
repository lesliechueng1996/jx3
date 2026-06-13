import { describe, expect, it } from 'vitest';
import {
  applyReservedRoles,
  createInitialRaidRunDraft,
  updateSignupAt,
} from '#/routes/_app/raids/create/-components/raid-signup-draft';
import {
  computeSlotRoles,
  getReservedTotal,
  isReservedTotalValid,
} from '#/routes/_app/raids/create/-components/role-slot-utils';

describe('role-slot-utils', () => {
  it('assigns roles in traversal order', () => {
    const roles = computeSlotRoles({
      reservedDps: 2,
      reservedHealer: 1,
      reservedTank: 1,
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
      signups: createInitialRaidRunDraft().signups.map((signup, index) =>
        index === 0
          ? { ...signup, characterName: '叶修', role: 'dps' }
          : signup,
      ),
    });

    const reduced = applyReservedRoles({
      ...draft,
      reservedDps: 1,
    });

    expect(reduced.signups[0]?.characterName).toBe('叶修');
    expect(reduced.signups[0]?.role).toBe('dps');
    expect(reduced.signups[1]?.role).toBe('pending');
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

import type { RaidRunDraft, SignupDraft } from './raid-run-form-schema';
import { computeSlotRoles, type RaidSignupRole } from './role-slot-utils';

export const createEmptySignup = (
  groupNumber: number,
  positionNumber: number,
  role: RaidSignupRole = 'pending',
): SignupDraft => ({
  groupNumber,
  positionNumber,
  role,
  characterName: null,
  serverId: null,
  schoolId: null,
  kungfuId: null,
  isLeader: false,
  isDarkRun: false,
  isFormationCore: false,
  remark: null,
});

export const createInitialSignups = (): SignupDraft[] => {
  const signups: SignupDraft[] = [];

  for (let position = 1; position <= 5; position += 1) {
    for (let group = 1; group <= 5; group += 1) {
      signups.push(createEmptySignup(group, position));
    }
  }

  return signups;
};

export const createInitialRaidRunDraft = (): RaidRunDraft => ({
  name: '',
  description: null,
  dungeonId: null,
  gatherTime: null,
  startTime: null,
  endTime: null,
  reservedTank: 0,
  reservedHealer: 0,
  reservedDps: 0,
  reservedBoss: 0,
  remark: null,
  signups: createInitialSignups(),
});

export const applyReservedRoles = (draft: RaidRunDraft): RaidRunDraft => {
  const roles = computeSlotRoles({
    reservedDps: draft.reservedDps,
    reservedHealer: draft.reservedHealer,
    reservedTank: draft.reservedTank,
    reservedBoss: draft.reservedBoss,
  });

  return {
    ...draft,
    signups: draft.signups.map((signup, index) => ({
      ...signup,
      role: roles[index] ?? 'pending',
    })),
  };
};

export const updateSignupAt = (
  signups: SignupDraft[],
  groupNumber: number,
  positionNumber: number,
  patch: Partial<SignupDraft>,
): SignupDraft[] =>
  signups.map((signup) =>
    signup.groupNumber === groupNumber &&
    signup.positionNumber === positionNumber
      ? { ...signup, ...patch }
      : signup,
  );

export const clearLeaderExcept = (
  signups: SignupDraft[],
  groupNumber: number,
  positionNumber: number,
): SignupDraft[] =>
  signups.map((signup) => ({
    ...signup,
    isLeader:
      signup.groupNumber === groupNumber &&
      signup.positionNumber === positionNumber
        ? signup.isLeader
        : false,
  }));

export const clearFormationCoreInGroupExcept = (
  signups: SignupDraft[],
  groupNumber: number,
  positionNumber: number,
): SignupDraft[] =>
  signups.map((signup) => ({
    ...signup,
    isFormationCore:
      signup.groupNumber === groupNumber &&
      signup.positionNumber !== positionNumber
        ? false
        : signup.isFormationCore,
  }));

export const findSignup = (
  signups: SignupDraft[],
  groupNumber: number,
  positionNumber: number,
): SignupDraft | undefined =>
  signups.find(
    (signup) =>
      signup.groupNumber === groupNumber &&
      signup.positionNumber === positionNumber,
  );

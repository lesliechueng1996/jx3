import type { RaidRunDraft, SignupDraft } from './raid-run-form-schema';
import {
  computeSlotRoles,
  deriveReservedCounts,
  getSlotIndex,
  type RaidSignupRole,
  type SlotCoordinate,
} from './role-slot-utils';

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

  for (let group = 1; group <= 5; group += 1) {
    for (let position = 1; position <= 5; position += 1) {
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
    signups: draft.signups.map((signup) => ({
      ...signup,
      role:
        roles[getSlotIndex(signup.groupNumber, signup.positionNumber)] ??
        'pending',
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

export const clearDarkRunExcept = (
  signups: SignupDraft[],
  groupNumber: number,
  positionNumber: number,
): SignupDraft[] =>
  signups.map((signup) => ({
    ...signup,
    isDarkRun:
      signup.groupNumber === groupNumber &&
      signup.positionNumber === positionNumber
        ? signup.isDarkRun
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

export const syncReservedCounts = (draft: RaidRunDraft): RaidRunDraft => {
  const reserved = deriveReservedCounts(
    draft.signups.map((signup) => signup.role),
  );

  return {
    ...draft,
    ...reserved,
  };
};

export const applySignupPatch = (
  draft: RaidRunDraft,
  groupNumber: number,
  positionNumber: number,
  patch: Partial<SignupDraft>,
): RaidRunDraft => {
  let signups = updateSignupAt(
    draft.signups,
    groupNumber,
    positionNumber,
    patch,
  );

  if (patch.isLeader) {
    signups = clearLeaderExcept(signups, groupNumber, positionNumber).map(
      (signup) =>
        signup.groupNumber === groupNumber &&
        signup.positionNumber === positionNumber
          ? { ...signup, isLeader: true }
          : signup,
    );
  }

  if (patch.isDarkRun) {
    signups = clearDarkRunExcept(signups, groupNumber, positionNumber).map(
      (signup) =>
        signup.groupNumber === groupNumber &&
        signup.positionNumber === positionNumber
          ? { ...signup, isDarkRun: true }
          : signup,
    );
  }

  if (patch.isFormationCore) {
    signups = clearFormationCoreInGroupExcept(
      signups,
      groupNumber,
      positionNumber,
    ).map((signup) =>
      signup.groupNumber === groupNumber &&
      signup.positionNumber === positionNumber
        ? { ...signup, isFormationCore: true }
        : signup,
    );
  }

  const nextDraft = { ...draft, signups };

  if (patch.role !== undefined) {
    return syncReservedCounts(nextDraft);
  }

  return nextDraft;
};

export const swapSignupsAt = (
  signups: SignupDraft[],
  from: SlotCoordinate,
  to: SlotCoordinate,
): SignupDraft[] => {
  if (
    from.groupNumber === to.groupNumber &&
    from.positionNumber === to.positionNumber
  ) {
    return signups;
  }

  const fromSignup = findSignup(signups, from.groupNumber, from.positionNumber);
  const toSignup = findSignup(signups, to.groupNumber, to.positionNumber);

  if (!fromSignup || !toSignup) {
    return signups;
  }

  return signups.map((signup) => {
    if (
      signup.groupNumber === from.groupNumber &&
      signup.positionNumber === from.positionNumber
    ) {
      return {
        ...toSignup,
        groupNumber: from.groupNumber,
        positionNumber: from.positionNumber,
      };
    }

    if (
      signup.groupNumber === to.groupNumber &&
      signup.positionNumber === to.positionNumber
    ) {
      return {
        ...fromSignup,
        groupNumber: to.groupNumber,
        positionNumber: to.positionNumber,
      };
    }

    return signup;
  });
};

import type { RaidRunDraft, SignupDraft } from './raid-run-form-schema';
import {
  clampReservedCounts,
  computeSlotRoles,
  DEFAULT_PLAYER_LIMIT,
  deriveReservedCounts,
  getSlotIndex,
  listActiveSlotCoordinates,
  type RaidSignupRole,
  type ReservedCounts,
  type SlotCoordinate,
  slotKey,
} from './role-slot-utils';

export const getDefaultReservedCountsForPlayerLimit = (
  playerLimit: number,
): ReservedCounts => {
  if (playerLimit === 25) {
    return {
      reservedTank: 4,
      reservedHealer: 5,
      reservedDps: 16,
      reservedBoss: 0,
    };
  }

  if (playerLimit === 10) {
    return {
      reservedTank: 1,
      reservedHealer: 1,
      reservedDps: 8,
      reservedBoss: 0,
    };
  }

  return {
    reservedTank: 0,
    reservedHealer: 0,
    reservedDps: 0,
    reservedBoss: 0,
  };
};

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

export const createInitialSignups = (
  playerLimit: number = DEFAULT_PLAYER_LIMIT,
): SignupDraft[] =>
  listActiveSlotCoordinates(playerLimit).map(
    ({ groupNumber, positionNumber }) =>
      createEmptySignup(groupNumber, positionNumber),
  );

export const createDefaultTimeToday = (
  hours: number,
  minutes: number,
): string => {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

export const createInitialRaidRunDraft = (
  playerLimit: number = DEFAULT_PLAYER_LIMIT,
): RaidRunDraft => ({
  name: '',
  description: null,
  dungeonId: null,
  gatherTime: createDefaultTimeToday(20, 0),
  startTime: createDefaultTimeToday(20, 30),
  endTime: createDefaultTimeToday(21, 30),
  reservedTank: 0,
  reservedHealer: 0,
  reservedDps: 0,
  reservedBoss: 0,
  remark: null,
  signups: createInitialSignups(playerLimit),
});

export const applyReservedRoles = (
  draft: RaidRunDraft,
  playerLimit: number = DEFAULT_PLAYER_LIMIT,
): RaidRunDraft => {
  const roles = computeSlotRoles(
    {
      reservedDps: draft.reservedDps,
      reservedHealer: draft.reservedHealer,
      reservedTank: draft.reservedTank,
      reservedBoss: draft.reservedBoss,
    },
    playerLimit,
  );

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

export const resizeDraftForPlayerLimit = (
  draft: RaidRunDraft,
  playerLimit: number,
): RaidRunDraft => {
  const signupByKey = new Map(
    draft.signups.map((signup) => [
      slotKey(signup.groupNumber, signup.positionNumber),
      signup,
    ]),
  );
  const signups = listActiveSlotCoordinates(playerLimit).map(
    ({ groupNumber, positionNumber }) => {
      const existing = signupByKey.get(slotKey(groupNumber, positionNumber));
      return existing ?? createEmptySignup(groupNumber, positionNumber);
    },
  );
  const reserved = clampReservedCounts(
    {
      reservedDps: draft.reservedDps,
      reservedHealer: draft.reservedHealer,
      reservedTank: draft.reservedTank,
      reservedBoss: draft.reservedBoss,
    },
    playerLimit,
  );

  return {
    ...draft,
    ...reserved,
    signups,
  };
};

export const applyDungeonSelection = (
  draft: RaidRunDraft,
  playerLimit: number,
): RaidRunDraft => {
  const signupByKey = new Map(
    draft.signups.map((signup) => [
      slotKey(signup.groupNumber, signup.positionNumber),
      signup,
    ]),
  );
  const signups = listActiveSlotCoordinates(playerLimit).map(
    ({ groupNumber, positionNumber }) => {
      const existing = signupByKey.get(slotKey(groupNumber, positionNumber));
      return existing ?? createEmptySignup(groupNumber, positionNumber);
    },
  );
  const reserved = getDefaultReservedCountsForPlayerLimit(playerLimit);

  return {
    ...draft,
    ...reserved,
    signups,
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

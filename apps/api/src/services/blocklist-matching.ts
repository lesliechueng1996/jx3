import type {
  BlocklistMatchEntry,
  RaidRunBlocklistCheckResponse,
} from '../schemas/blocklist';

type SignupRow = {
  id: string;
  characterName: string | null;
  serverId: string | null;
  serverName: string | null;
  schoolName: string | null;
};

type BlocklistRow = {
  id: string;
  characterName: string;
  serverId: string;
  serverName: string;
  schoolName: string | null;
  remark: string | null;
};

const normalizeName = (value: string): string => value.trim();

const toMatchEntry = (
  signup: SignupRow,
  blocklist: BlocklistRow,
): BlocklistMatchEntry => ({
  signupId: signup.id,
  characterName: signup.characterName ?? '',
  serverName: signup.serverName,
  schoolName: signup.schoolName,
  blocklistServerName: blocklist.serverName,
  blocklistSchoolName: blocklist.schoolName,
  remark: blocklist.remark,
});

export const matchSignupsAgainstBlocklist = (
  signupRows: SignupRow[],
  blocklistRows: BlocklistRow[],
): RaidRunBlocklistCheckResponse => {
  const confirmedMatches: BlocklistMatchEntry[] = [];
  const possibleMatches: BlocklistMatchEntry[] = [];
  let skippedCount = 0;

  const confirmedKeys = new Set<string>();

  for (const signup of signupRows) {
    const characterName = signup.characterName
      ? normalizeName(signup.characterName)
      : '';

    if (!characterName) {
      continue;
    }

    if (!signup.serverId) {
      skippedCount += 1;
    }

    for (const blocklist of blocklistRows) {
      if (normalizeName(blocklist.characterName) !== characterName) {
        continue;
      }

      const isConfirmed =
        signup.serverId !== null &&
        signup.serverId === blocklist.serverId &&
        normalizeName(signup.characterName ?? '') ===
          normalizeName(blocklist.characterName);

      if (!isConfirmed) {
        continue;
      }

      const key = `${signup.id}:${blocklist.id}`;
      if (confirmedKeys.has(key)) {
        continue;
      }

      confirmedKeys.add(key);
      confirmedMatches.push(toMatchEntry(signup, blocklist));
    }
  }

  const possibleKeys = new Set<string>();

  for (const signup of signupRows) {
    const characterName = signup.characterName
      ? normalizeName(signup.characterName)
      : '';

    if (!characterName) {
      continue;
    }

    for (const blocklist of blocklistRows) {
      if (normalizeName(blocklist.characterName) !== characterName) {
        continue;
      }

      const isConfirmed =
        signup.serverId !== null &&
        signup.serverId === blocklist.serverId &&
        normalizeName(signup.characterName ?? '') ===
          normalizeName(blocklist.characterName);

      if (isConfirmed) {
        continue;
      }

      const key = `${signup.id}:${blocklist.id}`;
      if (possibleKeys.has(key)) {
        continue;
      }

      possibleKeys.add(key);
      possibleMatches.push(toMatchEntry(signup, blocklist));
    }
  }

  return {
    passed: confirmedMatches.length === 0 && possibleMatches.length === 0,
    confirmedMatches,
    possibleMatches,
    skippedCount,
  };
};

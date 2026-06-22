import { db } from '@jx3/db';
import { gameKungfu, gameServer, raidSignup } from '@jx3/db/schema';
import { and, desc, eq, ilike, isNotNull, or } from 'drizzle-orm';
import type {
  RaidSignupSearchItem,
  SearchRaidSignupsResponse,
} from '../schemas/raid-signups';

const formatServerLabel = (zone: string | null, name: string | null) => {
  if (zone && name) {
    return `${zone} · ${name}`;
  }

  return name;
};

const toSearchItem = (row: {
  characterName: string | null;
  serverId: string | null;
  schoolId: string | null;
  kungfuId: string | null;
  serverZone: string | null;
  serverName: string | null;
  kungfuName: string | null;
}): RaidSignupSearchItem | null => {
  const characterName = row.characterName?.trim();
  if (!characterName) {
    return null;
  }

  return {
    characterName,
    serverId: row.serverId,
    schoolId: row.schoolId,
    kungfuId: row.kungfuId,
    serverLabel: formatServerLabel(row.serverZone, row.serverName),
    kungfuName: row.kungfuName,
  };
};

export const searchRaidSignups = async (
  query: string,
): Promise<SearchRaidSignupsResponse> => {
  const term = query.trim();
  if (!term) {
    return { items: [] };
  }

  const pattern = `%${term}%`;
  const rows = await db
    .select({
      characterName: raidSignup.characterName,
      serverId: raidSignup.serverId,
      schoolId: raidSignup.schoolId,
      kungfuId: raidSignup.kungfuId,
      serverZone: gameServer.zone,
      serverName: gameServer.name,
      kungfuName: gameKungfu.name,
    })
    .from(raidSignup)
    .leftJoin(gameServer, eq(raidSignup.serverId, gameServer.id))
    .leftJoin(gameKungfu, eq(raidSignup.kungfuId, gameKungfu.id))
    .where(
      and(
        ilike(raidSignup.characterName, pattern),
        or(isNotNull(raidSignup.serverId), isNotNull(raidSignup.kungfuId)),
      ),
    )
    .orderBy(desc(raidSignup.updatedAt))
    .limit(50);

  const seen = new Set<string>();
  const items: RaidSignupSearchItem[] = [];

  for (const row of rows) {
    const item = toSearchItem(row);
    if (!item) {
      continue;
    }

    const key = `${item.characterName}\0${item.serverId ?? ''}\0${item.kungfuId ?? ''}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    items.push(item);

    if (items.length >= 20) {
      break;
    }
  }

  return { items };
};

import { z } from 'zod';
import { buildQueryString } from '#/lib/api/build-query';
import { requestJson } from '#/lib/api/request';

export const raidBrandBlocklistItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  remark: z.string().nullable(),
  createdBy: z.string(),
  createdByName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RaidBrandBlocklistItem = z.infer<
  typeof raidBrandBlocklistItemSchema
>;

export const listRaidBrandBlocklistResponseSchema = z.object({
  items: z.array(raidBrandBlocklistItemSchema),
});

export const playerBlocklistItemSchema = z.object({
  id: z.string().uuid(),
  characterName: z.string(),
  serverId: z.string().uuid(),
  serverName: z.string(),
  schoolId: z.string().uuid().nullable(),
  schoolName: z.string().nullable(),
  remark: z.string().nullable(),
  createdBy: z.string(),
  createdByName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PlayerBlocklistItem = z.infer<typeof playerBlocklistItemSchema>;

export const listPlayerBlocklistResponseSchema = z.object({
  items: z.array(playerBlocklistItemSchema),
});

export const blocklistMatchEntrySchema = z.object({
  signupId: z.string().uuid(),
  characterName: z.string(),
  serverName: z.string().nullable(),
  schoolName: z.string().nullable(),
  blocklistServerName: z.string(),
  blocklistSchoolName: z.string().nullable(),
  remark: z.string().nullable(),
});

export type BlocklistMatchEntry = z.infer<typeof blocklistMatchEntrySchema>;

export const raidRunBlocklistCheckResponseSchema = z.object({
  passed: z.boolean(),
  confirmedMatches: z.array(blocklistMatchEntrySchema),
  possibleMatches: z.array(blocklistMatchEntrySchema),
  skippedCount: z.number().int(),
});

export type RaidRunBlocklistCheckResponse = z.infer<
  typeof raidRunBlocklistCheckResponseSchema
>;

export const blocklistQueryKey = ['blocklist'] as const;

export const blocklistApi = {
  listRaidBrands(q?: string) {
    const query = buildQueryString({ q: q?.trim() || undefined });
    return requestJson(
      `/api/v1/blocklist/raid-brands${query ? `?${query}` : ''}`,
      listRaidBrandBlocklistResponseSchema,
    );
  },
  createRaidBrand(body: { name: string; remark?: string | null }) {
    return requestJson(
      '/api/v1/blocklist/raid-brands',
      raidBrandBlocklistItemSchema,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
  },
  deleteRaidBrand(id: string) {
    return requestJson(`/api/v1/blocklist/raid-brands/${id}`, z.null(), {
      method: 'DELETE',
    });
  },
  listPlayers(filters?: { q?: string; serverId?: string }) {
    const query = buildQueryString({
      q: filters?.q?.trim() || undefined,
      serverId: filters?.serverId,
    });
    return requestJson(
      `/api/v1/blocklist/players${query ? `?${query}` : ''}`,
      listPlayerBlocklistResponseSchema,
    );
  },
  createPlayer(body: {
    characterName: string;
    serverId: string;
    schoolId?: string | null;
    remark?: string | null;
  }) {
    return requestJson('/api/v1/blocklist/players', playerBlocklistItemSchema, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  deletePlayer(id: string) {
    return requestJson(`/api/v1/blocklist/players/${id}`, z.null(), {
      method: 'DELETE',
    });
  },
  checkRaidRun(raidRunId: string) {
    return requestJson(
      `/api/v1/raid-runs/${raidRunId}/blocklist-check`,
      raidRunBlocklistCheckResponseSchema,
      { method: 'POST', body: JSON.stringify({}) },
    );
  },
};

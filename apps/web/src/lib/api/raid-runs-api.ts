import { z } from 'zod';
import { buildQueryString } from '#/lib/api/build-query';
import { requestJson } from '#/lib/api/request';
import type { signupDraftSchema } from '#/routes/_app/raids/create/-components/raid-run-form-schema';

export const itemQualitySchema = z.enum([
  'white',
  'green',
  'blue',
  'purple',
  'orange',
]);

export const raidLootItemSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  itemName: z.string(),
  itemQuality: itemQualitySchema,
  itemIcon: z.string().nullable(),
  quantity: z.number().int(),
  winnerSignupId: z.string().nullable(),
  winnerCharacterName: z.string().nullable(),
  winnerServerName: z.string().nullable(),
  price: z.number().int().nullable(),
  remark: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RaidLootItem = z.infer<typeof raidLootItemSchema>;

export const raidRunWageResponseSchema = z.object({
  totalIncome: z.string().nullable(),
  wagePerPerson: z.string().nullable(),
});

export type RaidRunWage = z.infer<typeof raidRunWageResponseSchema>;

export const raidRunGameRaidIdResponseSchema = z.object({
  gameRaidId: z.string().nullable(),
});

export type RaidRunGameRaidId = z.infer<typeof raidRunGameRaidIdResponseSchema>;

export const raidSignupRoleSchema = z.enum([
  'pending',
  'tank',
  'healer',
  'dps',
  'boss',
]);

export const raidRunStatusSchema = z.enum([
  'pending',
  'recruiting',
  'ongoing',
  'completed',
  'cancelled',
]);

export const raidSignupStatusSchema = z.enum([
  'pending',
  'confirmed',
  'waitlist',
  'rejected',
]);

export const raidSignupResponseSchema = z.object({
  id: z.string(),
  groupNumber: z.number().int().nullable(),
  positionNumber: z.number().int().nullable(),
  role: raidSignupRoleSchema,
  status: raidSignupStatusSchema,
  isReserved: z.boolean(),
  isLeader: z.boolean(),
  isDarkRun: z.boolean(),
  isFormationCore: z.boolean(),
  serverId: z.string().nullable(),
  characterName: z.string().nullable(),
  schoolId: z.string().nullable(),
  kungfuId: z.string().nullable(),
  remark: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RaidSignupResponse = z.infer<typeof raidSignupResponseSchema>;

export const raidRunResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  dungeonId: z.string().nullable(),
  gameRaidId: z.string().nullable(),
  status: raidRunStatusSchema,
  gatherTime: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  reservedTank: z.number().int(),
  reservedHealer: z.number().int(),
  reservedDps: z.number().int(),
  reservedBoss: z.number().int(),
  totalIncome: z.string().nullable(),
  wagePerPerson: z.string().nullable(),
  remark: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  signups: z.array(raidSignupResponseSchema),
  loot: z.array(raidLootItemSchema),
});

export type RaidRunResponse = z.infer<typeof raidRunResponseSchema>;

export const raidRunListItemMySignupSchema = z.object({
  role: raidSignupRoleSchema,
  status: raidSignupStatusSchema,
  isLeader: z.boolean(),
  characterName: z.string().nullable(),
  serverId: z.string().uuid().nullable(),
  serverName: z.string().nullable(),
});

export type RaidRunListItemMySignup = z.infer<
  typeof raidRunListItemMySignupSchema
>;

export const raidRunListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: raidRunStatusSchema,
  dungeonId: z.string().nullable(),
  dungeonName: z.string().nullable(),
  gatherTime: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  createdAt: z.string(),
  isCreator: z.boolean(),
  mySignup: raidRunListItemMySignupSchema.nullable(),
});

export type RaidRunListItem = z.infer<typeof raidRunListItemSchema>;

export const listMyRaidRunsResponseSchema = z.object({
  items: z.array(raidRunListItemSchema),
});

export type ListMyRaidRunsResponse = z.infer<
  typeof listMyRaidRunsResponseSchema
>;

export type RaidHistoryFilter = 'all' | 'created' | 'leader';

export type RaidRunPayload = {
  name?: string;
  description?: string | null;
  dungeonId?: string | null;
  gatherTime?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  reservedTank?: number;
  reservedHealer?: number;
  reservedDps?: number;
  reservedBoss?: number;
  remark?: string | null;
  signups: Array<z.infer<typeof signupDraftSchema>>;
};

export const raidRunsApi = {
  create(body: RaidRunPayload) {
    return requestJson('/api/v1/raid-runs', raidRunResponseSchema, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  get(raidRunId: string) {
    return requestJson(`/api/v1/raid-runs/${raidRunId}`, raidRunResponseSchema);
  },
  patch(raidRunId: string, body: Partial<RaidRunPayload>) {
    return requestJson(
      `/api/v1/raid-runs/${raidRunId}`,
      raidRunResponseSchema,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    );
  },
  publish(raidRunId: string) {
    return requestJson(
      `/api/v1/raid-runs/${raidRunId}/publish`,
      raidRunResponseSchema,
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
    );
  },
  duplicate(raidRunId: string) {
    return requestJson(
      `/api/v1/raid-runs/${raidRunId}/duplicate`,
      raidRunResponseSchema,
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
    );
  },
  updateStatus(
    raidRunId: string,
    status: Exclude<z.infer<typeof raidRunStatusSchema>, 'pending'>,
  ) {
    return requestJson(
      `/api/v1/raid-runs/${raidRunId}/status`,
      raidRunResponseSchema,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
    );
  },
  listMine(filter: RaidHistoryFilter) {
    const query = buildQueryString({ filter });
    return requestJson(
      `/api/v1/raid-runs/mine?${query}`,
      listMyRaidRunsResponseSchema,
    );
  },
  createLoot(
    raidRunId: string,
    body: {
      itemId: string;
      quantity?: number;
      winnerSignupId?: string | null;
      price?: number | null;
      remark?: string | null;
    },
  ) {
    return requestJson(
      `/api/v1/raid-runs/${raidRunId}/loot`,
      raidLootItemSchema,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
  },
  patchLoot(
    raidRunId: string,
    lootId: string,
    body: {
      quantity?: number;
      winnerSignupId?: string | null;
      price?: number | null;
      remark?: string | null;
    },
  ) {
    return requestJson(
      `/api/v1/raid-runs/${raidRunId}/loot/${lootId}`,
      raidLootItemSchema,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    );
  },
  deleteLoot(raidRunId: string, lootId: string) {
    return requestJson(
      `/api/v1/raid-runs/${raidRunId}/loot/${lootId}`,
      z.null(),
      {
        method: 'DELETE',
      },
    );
  },
  patchWage(
    raidRunId: string,
    body: { totalIncome: string | null; wagePerPerson: string | null },
  ) {
    return requestJson(
      `/api/v1/raid-runs/${raidRunId}/wage`,
      raidRunWageResponseSchema,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    );
  },
  patchGameRaidId(raidRunId: string, body: { gameRaidId: string | null }) {
    return requestJson(
      `/api/v1/raid-runs/${raidRunId}/game-raid-id`,
      raidRunGameRaidIdResponseSchema,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    );
  },
};

export const raidRunsQueryKey = ['raid-runs'] as const;
export const raidRunsMineQueryKey = ['raid-runs', 'mine'] as const;

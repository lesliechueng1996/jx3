import { z } from 'zod';
import { buildQueryString } from '#/lib/api/build-query';
import { requestJson } from '#/lib/api/request';
import type { signupDraftSchema } from '#/routes/_app/raids/create/-components/raid-run-form-schema';

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
  status: raidRunStatusSchema,
  gatherTime: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  reservedTank: z.number().int(),
  reservedHealer: z.number().int(),
  reservedDps: z.number().int(),
  reservedBoss: z.number().int(),
  remark: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  signups: z.array(raidSignupResponseSchema),
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
  listMine(filter: RaidHistoryFilter) {
    const query = buildQueryString({ filter });
    return requestJson(
      `/api/v1/raid-runs/mine?${query}`,
      listMyRaidRunsResponseSchema,
    );
  },
};

export const raidRunsQueryKey = ['raid-runs'] as const;
export const raidRunsMineQueryKey = ['raid-runs', 'mine'] as const;

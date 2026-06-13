import { z } from 'zod';
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
};

export const raidRunsQueryKey = ['raid-runs'] as const;

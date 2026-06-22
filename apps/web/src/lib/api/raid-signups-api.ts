import { z } from 'zod';
import { buildQueryString } from '#/lib/api/build-query';
import { requestJson } from '#/lib/api/request';

export const raidSignupSearchItemSchema = z.object({
  characterName: z.string(),
  serverId: z.string().uuid().nullable(),
  schoolId: z.string().uuid().nullable(),
  kungfuId: z.string().uuid().nullable(),
  serverLabel: z.string().nullable(),
  kungfuName: z.string().nullable(),
});

export type RaidSignupSearchItem = z.infer<typeof raidSignupSearchItemSchema>;

export const searchRaidSignupsResponseSchema = z.object({
  items: z.array(raidSignupSearchItemSchema),
});

export const raidSignupsApi = {
  search(query: string) {
    const qs = buildQueryString({ q: query });
    return requestJson(
      `/api/v1/raid-signups/search?${qs}`,
      searchRaidSignupsResponseSchema,
    );
  },
};

export const raidSignupsQueryKey = ['raid-signups'] as const;

import { z } from 'zod';

export const searchRaidSignupsQuerySchema = z.object({
  q: z.string().max(100).default(''),
});

export type SearchRaidSignupsQuery = z.infer<
  typeof searchRaidSignupsQuerySchema
>;

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

export type SearchRaidSignupsResponse = z.infer<
  typeof searchRaidSignupsResponseSchema
>;

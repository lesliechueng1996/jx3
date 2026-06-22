import { z } from 'zod';

export const listBlocklistQuerySchema = z.object({
  q: z.string().optional(),
  serverId: z.string().uuid().optional(),
});

export type ListBlocklistQuery = z.infer<typeof listBlocklistQuerySchema>;

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

export const createRaidBrandBlocklistBodySchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  remark: z.string().trim().nullable().optional(),
});

export type CreateRaidBrandBlocklistBody = z.infer<
  typeof createRaidBrandBlocklistBodySchema
>;

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

export const createPlayerBlocklistBodySchema = z.object({
  characterName: z.string().trim().min(1, 'characterName is required'),
  serverId: z.string().uuid(),
  schoolId: z.string().uuid().nullable().optional(),
  remark: z.string().trim().nullable().optional(),
});

export type CreatePlayerBlocklistBody = z.infer<
  typeof createPlayerBlocklistBodySchema
>;

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

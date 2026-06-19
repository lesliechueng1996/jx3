import { z } from 'zod';
import { raidLootItemSchema } from './raid-loot';

export const RAID_SIGNUP_ROLES = [
  'pending',
  'tank',
  'healer',
  'dps',
  'boss',
] as const;

export const RAID_RUN_STATUSES = [
  'pending',
  'recruiting',
  'ongoing',
  'completed',
  'cancelled',
] as const;

export const RAID_SIGNUP_STATUSES = [
  'pending',
  'confirmed',
  'waitlist',
  'rejected',
] as const;

export const raidSignupRoleSchema = z.enum(RAID_SIGNUP_ROLES);
export const raidRunStatusSchema = z.enum(RAID_RUN_STATUSES);
export const raidSignupStatusSchema = z.enum(RAID_SIGNUP_STATUSES);

export type RaidSignupRole = z.infer<typeof raidSignupRoleSchema>;

const reservedCountSchema = z.number().int().min(0).max(25).default(0);

const optionalTimestampSchema = z
  .string()
  .datetime({ offset: true })
  .nullable()
  .optional();

export const signupInputSchema = z.object({
  groupNumber: z.number().int().min(1).max(5),
  positionNumber: z.number().int().min(1).max(5),
  role: raidSignupRoleSchema,
  characterName: z.string().nullable().optional(),
  serverId: z.string().uuid().nullable().optional(),
  schoolId: z.string().uuid().nullable().optional(),
  kungfuId: z.string().uuid().nullable().optional(),
  isLeader: z.boolean().default(false),
  isDarkRun: z.boolean().default(false),
  isFormationCore: z.boolean().default(false),
  remark: z.string().nullable().optional(),
});

export type SignupInput = z.infer<typeof signupInputSchema>;

const signupsArraySchema = z
  .array(signupInputSchema)
  .min(1)
  .max(25, 'signups must contain at most 25 entries');

export const createRaidRunBodySchema = z.object({
  name: z.string().max(255).optional(),
  description: z.string().nullable().optional(),
  dungeonId: z.string().uuid().nullable().optional(),
  gatherTime: optionalTimestampSchema,
  startTime: optionalTimestampSchema,
  endTime: optionalTimestampSchema,
  reservedTank: reservedCountSchema,
  reservedHealer: reservedCountSchema,
  reservedDps: reservedCountSchema,
  reservedBoss: reservedCountSchema,
  remark: z.string().nullable().optional(),
  signups: signupsArraySchema,
});

export type CreateRaidRunBody = z.infer<typeof createRaidRunBodySchema>;

export const patchRaidRunBodySchema = z
  .object({
    name: z.string().max(255).optional(),
    description: z.string().nullable().optional(),
    dungeonId: z.string().uuid().nullable().optional(),
    gatherTime: optionalTimestampSchema,
    startTime: optionalTimestampSchema,
    endTime: optionalTimestampSchema,
    reservedTank: reservedCountSchema.optional(),
    reservedHealer: reservedCountSchema.optional(),
    reservedDps: reservedCountSchema.optional(),
    reservedBoss: reservedCountSchema.optional(),
    remark: z.string().nullable().optional(),
    signups: signupsArraySchema.optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined ||
      value.dungeonId !== undefined ||
      value.gatherTime !== undefined ||
      value.startTime !== undefined ||
      value.endTime !== undefined ||
      value.reservedTank !== undefined ||
      value.reservedHealer !== undefined ||
      value.reservedDps !== undefined ||
      value.reservedBoss !== undefined ||
      value.remark !== undefined ||
      value.signups !== undefined,
    { message: 'At least one field must be provided' },
  );

export type PatchRaidRunBody = z.infer<typeof patchRaidRunBodySchema>;

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
  totalIncome: z.string().nullable(),
  wagePerPerson: z.string().nullable(),
  remark: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  signups: z.array(raidSignupResponseSchema),
  loot: z.array(raidLootItemSchema),
});

export type RaidRunResponse = z.infer<typeof raidRunResponseSchema>;

export const publishRaidRunBodySchema = z.object({});

export type PublishRaidRunBody = z.infer<typeof publishRaidRunBodySchema>;

export const listMyRaidRunsQuerySchema = z.object({
  filter: z.enum(['all', 'created', 'leader']).default('all'),
});

export type ListMyRaidRunsQuery = z.infer<typeof listMyRaidRunsQuerySchema>;

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

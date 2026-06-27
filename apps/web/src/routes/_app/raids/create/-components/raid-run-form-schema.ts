import { z } from 'zod';
import {
  DEFAULT_PLAYER_LIMIT,
  getReservedTotal,
  normalizePlayerLimit,
  RAID_MAX_PLAYER_LIMIT,
} from './role-slot-utils';

export const raidSignupRoleSchema = z.enum([
  'pending',
  'tank',
  'healer',
  'dps',
  'boss',
]);

export const signupDraftSchema = z.object({
  groupNumber: z.number().int().min(1).max(5),
  positionNumber: z.number().int().min(1).max(5),
  role: raidSignupRoleSchema,
  characterName: z.string().nullable(),
  serverId: z.string().nullable(),
  schoolId: z.string().nullable(),
  kungfuId: z.string().nullable(),
  isLeader: z.boolean(),
  isDarkRun: z.boolean(),
  isFormationCore: z.boolean(),
  remark: z.string().nullable(),
});

export type SignupDraft = z.infer<typeof signupDraftSchema>;

const createReservedCountSchema = (playerLimit: number) =>
  z.number().int().min(0).max(playerLimit);

const createRaidRunDraftShape = (playerLimit: number) => ({
  name: z.string(),
  description: z.string().nullable(),
  dungeonId: z.string().nullable(),
  gatherTime: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  reservedTank: createReservedCountSchema(playerLimit),
  reservedHealer: createReservedCountSchema(playerLimit),
  reservedDps: createReservedCountSchema(playerLimit),
  reservedBoss: createReservedCountSchema(playerLimit),
  remark: z.string().nullable(),
  signups: z
    .array(signupDraftSchema)
    .length(playerLimit, `团员布局应为 ${playerLimit} 格`),
});

const createReservedRefine =
  (playerLimit: number) =>
  (value: {
    reservedTank: number;
    reservedHealer: number;
    reservedDps: number;
    reservedBoss: number;
  }) =>
    getReservedTotal(value) <= playerLimit;

export const createRaidRunDraftSchema = (
  playerLimit: number = DEFAULT_PLAYER_LIMIT,
) => {
  const limit = normalizePlayerLimit(playerLimit);
  return z.object(createRaidRunDraftShape(limit));
};

export type RaidRunDraft = z.infer<ReturnType<typeof createRaidRunDraftSchema>>;

export const createDraftSaveSchema = (
  playerLimit: number = DEFAULT_PLAYER_LIMIT,
) => {
  const limit = normalizePlayerLimit(playerLimit);

  return createRaidRunDraftSchema(limit).refine(createReservedRefine(limit), {
    message: `预留人数合计不能超过 ${limit}`,
    path: ['reservedDps'],
  });
};

export const draftSaveSchema = createDraftSaveSchema();

export const createPublishSchema = (
  playerLimit: number = DEFAULT_PLAYER_LIMIT,
) => {
  const limit = normalizePlayerLimit(playerLimit);

  return createRaidRunDraftSchema(limit)
    .extend({
      name: z.string().trim().min(1, '请填写团队名称'),
      dungeonId: z.string().uuid('请选择副本'),
      startTime: z.string().datetime({ offset: true }).min(1, '请填写进本时间'),
    })
    .refine(createReservedRefine(limit), {
      message: `预留人数合计不能超过 ${limit}`,
      path: ['reservedDps'],
    })
    .refine(
      (value) => {
        if (!value.gatherTime) {
          return true;
        }
        return new Date(value.gatherTime) <= new Date(value.startTime);
      },
      {
        message: '集合时间不能晚于进本时间',
        path: ['gatherTime'],
      },
    )
    .refine(
      (value) => {
        if (!value.endTime) {
          return true;
        }
        return new Date(value.startTime) < new Date(value.endTime);
      },
      {
        message: '进本时间必须早于结束时间',
        path: ['endTime'],
      },
    );
};

export const publishSchema = createPublishSchema();

export const RAID_RUN_DRAFT_MAX_PLAYER_LIMIT = RAID_MAX_PLAYER_LIMIT;

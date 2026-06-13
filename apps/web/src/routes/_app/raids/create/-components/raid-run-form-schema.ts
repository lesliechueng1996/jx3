import { z } from 'zod';
import { getReservedTotal } from './role-slot-utils';

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

export const raidRunDraftSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  dungeonId: z.string().nullable(),
  gatherTime: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  reservedTank: z.number().int().min(0).max(25),
  reservedHealer: z.number().int().min(0).max(25),
  reservedDps: z.number().int().min(0).max(25),
  reservedBoss: z.number().int().min(0).max(25),
  remark: z.string().nullable(),
  signups: z.array(signupDraftSchema).length(25),
});

export type RaidRunDraft = z.infer<typeof raidRunDraftSchema>;

const reservedRefine = (value: {
  reservedTank: number;
  reservedHealer: number;
  reservedDps: number;
  reservedBoss: number;
}) => getReservedTotal(value) <= 25;

export const draftSaveSchema = raidRunDraftSchema.refine(reservedRefine, {
  message: '预留人数合计不能超过 25',
  path: ['reservedDps'],
});

export const publishSchema = raidRunDraftSchema
  .extend({
    name: z.string().trim().min(1, '请填写团队名称'),
    dungeonId: z.string().uuid('请选择副本'),
    startTime: z.string().datetime({ offset: true }).min(1, '请填写进本时间'),
  })
  .refine(reservedRefine, {
    message: '预留人数合计不能超过 25',
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

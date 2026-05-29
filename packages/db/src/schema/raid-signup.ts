import * as t from 'drizzle-orm/pg-core';
import { pgEnum, pgTable } from 'drizzle-orm/pg-core';

// 报名位置类型: 待定、坦克、治疗、DPS、老板
export const raidSignupRoleEnum = pgEnum('raid_signup_role', [
  'pending',
  'tank',
  'healer',
  'dps',
  'boss',
]);

// 报名状态: 待审核、已确认、候补、已拒绝
export const raidSignupStatusEnum = pgEnum('raid_signup_status', [
  'pending',
  'confirmed',
  'waitlist',
  'rejected',
]);

export const raidSignup = pgTable(
  'raid_signup',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    // 开团记录 ID (关联 raid_run, 应用层校验)
    raidRunId: t.uuid('raid_run_id').notNull(),
    // 小队编号
    groupNumber: t.integer('group_number'),
    // 小队位置编号
    positionNumber: t.integer('position_number'),
    // 位置类型
    role: raidSignupRoleEnum('role').notNull().default('pending'),
    // 报名状态
    status: raidSignupStatusEnum('status').notNull().default('pending'),
    // 是否预留位
    isReserved: t.boolean('is_reserved').notNull().default(false),
    // 是否团长
    isLeader: t.boolean('is_leader').notNull().default(false),
    // 是否黑本 (率先进本)
    isDarkRun: t.boolean('is_dark_run').notNull().default(false),
    // 是否阵眼
    isFormationCore: t.boolean('is_formation_core').notNull().default(false),
    // 服务器 ID (关联 game_server, 应用层校验, 可空)
    serverId: t.uuid('server_id'),
    // 角色名 (可空)
    characterName: t.text('character_name'),
    // 门派 ID (关联 game_school, 应用层校验, 可空)
    schoolId: t.uuid('school_id'),
    // 心法 ID (关联 game_kungfu, 应用层校验, 可空)
    kungfuId: t.uuid('kungfu_id'),
    // 关联用户 (关联 auth user, 应用层校验, 可空)
    userId: t.text('user_id'),
    // 创建人 (关联 auth user, 应用层校验)
    createdBy: t.text('created_by').notNull(),
    // 备注
    remark: t.text('remark'),
    createdAt: t
      .timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: t
      .timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [t.index('raid_signup_raid_run_id_idx').on(table.raidRunId)],
);

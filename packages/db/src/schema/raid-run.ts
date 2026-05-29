import * as t from 'drizzle-orm/pg-core';
import { pgEnum, pgTable } from 'drizzle-orm/pg-core';

// 开团状态: 未开始、招募中、进行中、已结束、已取消
export const raidRunStatusEnum = pgEnum('raid_run_status', [
  'pending',
  'recruiting',
  'ongoing',
  'completed',
  'cancelled',
]);

export const raidRun = pgTable('raid_run', {
  id: t.uuid('id').primaryKey().defaultRandom(),
  // 团队名称
  name: t.text('name').notNull(),
  // 描述
  description: t.text('description'),
  // 副本 ID (关联 game_dungeon, 应用层校验)
  dungeonId: t.uuid('dungeon_id').notNull(),
  // 游戏内开团 ID (可空)
  gameRaidId: t.text('game_raid_id'),
  // 创建人 (关联 auth user, 应用层校验)
  createdBy: t.text('created_by').notNull(),
  // 开团状态
  status: raidRunStatusEnum('status').notNull().default('pending'),
  // 集合时间
  gatherTime: t.timestamp('gather_time', { withTimezone: true }),
  // 开团时间
  startTime: t.timestamp('start_time', { withTimezone: true }).notNull(),
  // 结束时间
  endTime: t.timestamp('end_time', { withTimezone: true }),
  // 坦克预留人数
  reservedTank: t.integer('reserved_tank').notNull().default(0),
  // 治疗预留人数
  reservedHealer: t.integer('reserved_healer').notNull().default(0),
  // DPS 预留人数
  reservedDps: t.integer('reserved_dps').notNull().default(0),
  // 老板预留人数
  reservedBoss: t.integer('reserved_boss').notNull().default(0),
  // 金团总计 (总收入)
  totalIncome: t.numeric('total_income', { precision: 12, scale: 2 }),
  // 每人工资
  wagePerPerson: t.numeric('wage_per_person', { precision: 12, scale: 2 }),
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
});

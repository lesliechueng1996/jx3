import * as t from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';

export const raidLoot = pgTable(
  'raid_loot',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    // 开团记录 ID (关联 raid_run, 应用层校验)
    raidRunId: t.uuid('raid_run_id').notNull(),
    // 物品 ID (关联 game_item, 应用层校验)
    itemId: t.uuid('item_id').notNull(),
    // 数量
    quantity: t.integer('quantity').notNull().default(1),
    // 获得人员报名记录 ID (关联 raid_signup, 应用层校验, 可空)
    winnerSignupId: t.uuid('winner_signup_id'),
    // 成交金额 (整数, 可空)
    price: t.integer('price'),
    // 记录人 (关联 auth user, 应用层校验)
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
  (table) => [
    t.index('raid_loot_raid_run_id_idx').on(table.raidRunId),
    t.index('raid_loot_item_id_idx').on(table.itemId),
    t.index('raid_loot_winner_signup_id_idx').on(table.winnerSignupId),
  ],
);

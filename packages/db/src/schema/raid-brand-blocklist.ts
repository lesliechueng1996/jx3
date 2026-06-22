import * as t from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';

export const raidBrandBlocklist = pgTable(
  'raid_brand_blocklist',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    // 团牌名称
    name: t.text('name').notNull(),
    // 避雷原因/备注
    remark: t.text('remark'),
    // 添加人 (关联 auth user, 应用层校验)
    createdBy: t.text('created_by').notNull(),
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
    t.unique('raid_brand_blocklist_name_unique').on(table.name),
    t.index('raid_brand_blocklist_name_idx').on(table.name),
  ],
);

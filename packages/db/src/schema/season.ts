import * as t from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';

export const gameSeason = pgTable('game_season', {
  id: t.uuid('id').primaryKey().defaultRandom(),
  // 所属资料片 (关联 game_expansion, 应用层校验)
  expansionId: t.uuid('expansion_id').notNull(),
  name: t.text('name').notNull(),
  description: t.text('description'),
  startDate: t.date('start_date').notNull(),
  endDate: t.date('end_date'),
  sortOrder: t.integer('sort_order').notNull().default(0),
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

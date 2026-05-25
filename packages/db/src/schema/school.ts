import * as t from 'drizzle-orm/pg-core';
import { pgEnum, pgTable } from 'drizzle-orm/pg-core';

// 门派类型: 门派、流派
export const schoolTypeEnum = pgEnum('school_type', ['school', 'genre']);

export const gameSchool = pgTable('game_school', {
  id: t.uuid('id').primaryKey().defaultRandom(),
  name: t.text('name').notNull(),
  type: schoolTypeEnum('type').notNull(),
  icon: t.text('icon'),
  alias: t.text('alias').array().notNull().default([]),
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

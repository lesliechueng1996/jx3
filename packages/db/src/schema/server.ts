import * as t from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';

export const gameServer = pgTable('game_server', {
  id: t.uuid('id').primaryKey().defaultRandom(),
  serverId: t.text('server_id').notNull().unique(),
  zone: t.text('zone').notNull(),
  name: t.text('name').notNull(),
  alias: t.text('alias').array().notNull().default([]),
  createdAt: t.timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: t.timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

import * as t from 'drizzle-orm/pg-core';
import { pgEnum, pgTable } from 'drizzle-orm/pg-core';

// 体型: 成男、成女、正太、萝莉
export const bodyTypeEnum = pgEnum('body_type', [
  'male',
  'female',
  'boy',
  'girl',
]);

export const gameCharacter = pgTable(
  'game_character',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    name: t.text('name').notNull(),
    gameRoleId: t.text('game_role_id').notNull(),
    serverId: t.uuid('server_id').notNull(),
    schoolId: t.uuid('school_id').notNull(),
    bodyType: bodyTypeEnum('body_type').notNull(),
    userId: t.text('user_id').notNull(),
    level: t.integer('level').notNull().default(1),
    isPrimary: t.boolean('is_primary').notNull().default(false),
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
    t
      .unique('game_character_server_name_unique')
      .on(table.serverId, table.name),
  ],
);

import * as t from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';

export const playerBlocklist = pgTable(
  'player_blocklist',
  {
    id: t.uuid('id').primaryKey().defaultRandom(),
    // 角色名
    characterName: t.text('character_name').notNull(),
    // 服务器 ID (关联 game_server, 应用层校验)
    serverId: t.uuid('server_id').notNull(),
    // 门派 ID (关联 game_school, 应用层校验, 可空)
    schoolId: t.uuid('school_id'),
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
    t
      .unique('player_blocklist_identity_unique')
      .on(table.serverId, table.characterName),
    t.index('player_blocklist_character_name_idx').on(table.characterName),
    t.index('player_blocklist_server_id_idx').on(table.serverId),
  ],
);

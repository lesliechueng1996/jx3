import * as t from 'drizzle-orm/pg-core';
import { pgEnum, pgTable } from 'drizzle-orm/pg-core';

// 副本难度: 普通、英雄、挑战
export const dungeonDifficultyEnum = pgEnum('dungeon_difficulty', [
  'normal',
  'heroic',
  'challenge',
]);

export const gameDungeon = pgTable('game_dungeon', {
  id: t.uuid('id').primaryKey().defaultRandom(),
  name: t.text('name').notNull(),
  expansionId: t.uuid('expansion_id').notNull(),
  // 所属赛季 (关联 game_season, 应用层校验)
  seasonId: t.uuid('season_id').notNull(),
  playerLimit: t.integer('player_limit').notNull(),
  difficulty: dungeonDifficultyEnum('difficulty').notNull(),
  levelRequirement: t.integer('level_requirement').notNull(),
  bossCount: t.integer('boss_count').notNull(),
  // CD 刷新日 (ISO 周几: 1=周一 ... 7=周日; 空数组表示无周常 CD)
  resetWeekdays: t.integer('reset_weekdays').array().notNull().default([]),
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

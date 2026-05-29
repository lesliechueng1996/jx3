import * as t from 'drizzle-orm/pg-core';
import { pgEnum, pgTable } from 'drizzle-orm/pg-core';
import { gameSchool } from './school';

// 心法类型: 防御、治疗、攻击
export const kungfuTypeEnum = pgEnum('kungfu_type', [
  'defense',
  'heal',
  'attack',
]);
// 攻击类型: 内功、外功
export const attackTypeEnum = pgEnum('attack_type', ['internal', 'external']);
// 攻击方式: 近战、远程
export const attackMethodEnum = pgEnum('attack_method', ['melee', 'ranged']);

export const gameKungfu = pgTable('game_kungfu', {
  id: t.uuid('id').primaryKey().defaultRandom(),
  name: t.text('name').notNull(),
  schoolId: t
    .uuid('school_id')
    .notNull()
    .references(() => gameSchool.id),
  kungfuType: kungfuTypeEnum('kungfu_type').notNull(),
  attackType: attackTypeEnum('attack_type'),
  attackMethod: attackMethodEnum('attack_method'),
  formationEffect: t.text('formation_effect'),
  isPveExternalRecommended: t
    .boolean('is_pve_external_recommended')
    .notNull()
    .default(false),
  isPveInternalRecommended: t
    .boolean('is_pve_internal_recommended')
    .notNull()
    .default(false),
  // 是否无界 (万物互联端)
  isUnlimited: t.boolean('is_unlimited').notNull().default(false),
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

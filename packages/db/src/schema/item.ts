import * as t from 'drizzle-orm/pg-core';
import { pgEnum, pgTable } from 'drizzle-orm/pg-core';

// 物品类型: 装备、特殊
export const itemTypeEnum = pgEnum('item_type', ['equipment', 'special']);
// 物品品质: 白、绿、蓝、紫、橙
export const itemQualityEnum = pgEnum('item_quality', [
  'white',
  'green',
  'blue',
  'purple',
  'orange',
]);

export const gameItem = pgTable('game_item', {
  id: t.uuid('id').primaryKey().defaultRandom(),
  // 物品名
  name: t.text('name').notNull(),
  // 游戏内物品 ID
  gameItemId: t.text('game_item_id'),
  // 类型
  type: itemTypeEnum('type').notNull(),
  // 品质
  quality: itemQualityEnum('quality').notNull(),
  // 描述
  description: t.text('description'),
  // 图标
  icon: t.text('icon'),
  // 别名
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

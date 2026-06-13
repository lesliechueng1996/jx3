import { z } from 'zod';
import { buildQueryString } from '#/lib/api/build-query';
import { requestJson } from '#/lib/api/request';

export const DUNGEON_DIFFICULTIES = ['normal', 'heroic', 'challenge'] as const;

export type DungeonDifficulty = (typeof DUNGEON_DIFFICULTIES)[number];

export const DUNGEON_DIFFICULTY_LABELS: Record<DungeonDifficulty, string> = {
  normal: '普通',
  heroic: '英雄',
  challenge: '挑战',
};

export const RESET_WEEKDAY_LABELS: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
};

export const RESET_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export const dungeonDifficultySchema = z.enum(DUNGEON_DIFFICULTIES);

export const adminDungeonListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  expansionId: z.string(),
  expansionName: z.string(),
  seasonId: z.string(),
  seasonName: z.string(),
  playerLimit: z.number().int(),
  difficulty: dungeonDifficultySchema,
  levelRequirement: z.number().int(),
  bossCount: z.number().int(),
  resetWeekdays: z.array(z.number().int()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminDungeonListItem = z.infer<typeof adminDungeonListItemSchema>;

export const listDungeonsResponseSchema = z.object({
  items: z.array(adminDungeonListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export type ListDungeonsResponse = z.infer<typeof listDungeonsResponseSchema>;

export type ListDungeonsFilters = {
  page: number;
  pageSize: number;
  name?: string;
  expansionId?: string;
  seasonId?: string;
  difficulty?: DungeonDifficulty;
};

export type DungeonFormValues = {
  name: string;
  expansionId: string;
  seasonId: string;
  playerLimit: number;
  difficulty: DungeonDifficulty;
  levelRequirement: number;
  bossCount: number;
  resetWeekdays: number[];
};

const buildDungeonsQuery = (filters: ListDungeonsFilters): string =>
  buildQueryString({
    page: filters.page,
    pageSize: filters.pageSize,
    name: filters.name,
    expansionId: filters.expansionId,
    seasonId: filters.seasonId,
    difficulty: filters.difficulty,
  });

export const formatResetWeekdays = (weekdays: number[]): string => {
  if (weekdays.length === 0) {
    return '无每周 CD';
  }

  return weekdays
    .slice()
    .sort((a, b) => a - b)
    .map((day) => RESET_WEEKDAY_LABELS[day] ?? String(day))
    .join('、');
};

export const dungeonsAdminApi = {
  list(filters: ListDungeonsFilters) {
    return requestJson(
      `/api/v1/dungeons?${buildDungeonsQuery(filters)}`,
      listDungeonsResponseSchema,
    );
  },
  create(body: DungeonFormValues) {
    return requestJson('/api/v1/dungeons', adminDungeonListItemSchema, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  update(dungeonId: string, body: Partial<DungeonFormValues>) {
    return requestJson(
      `/api/v1/dungeons/${dungeonId}`,
      adminDungeonListItemSchema,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    );
  },
  delete(dungeonId: string) {
    return requestJson(
      `/api/v1/dungeons/${dungeonId}`,
      z.object({ success: z.literal(true) }),
      { method: 'DELETE' },
    );
  },
};

export const dungeonsAdminQueryKey = ['admin-dungeons'] as const;

export const parsePositiveIntInput = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
};

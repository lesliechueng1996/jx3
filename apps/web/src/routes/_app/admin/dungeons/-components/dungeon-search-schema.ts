import { z } from 'zod';
import { DUNGEON_DIFFICULTIES } from '#/lib/api/admin/dungeons-admin-api';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
} from '#/routes/_app/admin/-components/admin-list-search';

const optionalTrimmedString = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  });

export const dungeonSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(DEFAULT_PAGE),
  pageSize: z.coerce.number().int().min(1).catch(DEFAULT_PAGE_SIZE),
  name: optionalTrimmedString,
  expansionId: optionalTrimmedString,
  seasonId: optionalTrimmedString,
  difficulty: z.enum(DUNGEON_DIFFICULTIES).optional(),
});

export type DungeonSearch = z.infer<typeof dungeonSearchSchema>;

export const DEFAULT_DUNGEON_SEARCH: DungeonSearch = {
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  name: undefined,
  expansionId: undefined,
  seasonId: undefined,
  difficulty: undefined,
};

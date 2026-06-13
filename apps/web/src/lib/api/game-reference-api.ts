import { z } from 'zod';
import {
  type adminDungeonListItemSchema,
  listDungeonsResponseSchema,
} from '#/lib/api/admin/dungeons-admin-api';
import { listGameServersResponseSchema } from '#/lib/api/admin/game-servers-admin-api';
import { listSchoolOptionsResponseSchema } from '#/lib/api/admin/schools-admin-api';
import { buildQueryString } from '#/lib/api/build-query';
import { requestJson } from '#/lib/api/request';

export const kungfuOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
});

export const listKungfuOptionsResponseSchema = z.object({
  items: z.array(kungfuOptionSchema),
});

export type KungfuOption = z.infer<typeof kungfuOptionSchema>;

export type DungeonOption = z.infer<typeof adminDungeonListItemSchema>;

export const gameReferenceApi = {
  searchDungeons(name: string) {
    const query = buildQueryString({
      page: 1,
      pageSize: 20,
      name: name.trim() || undefined,
    });
    return requestJson(`/api/v1/dungeons?${query}`, listDungeonsResponseSchema);
  },
  listGameServers() {
    return requestJson('/api/v1/game-servers', listGameServersResponseSchema);
  },
  listSchoolOptions() {
    return requestJson(
      '/api/v1/schools/options',
      listSchoolOptionsResponseSchema,
    );
  },
  listKungfuOptions(schoolId: string) {
    const query = buildQueryString({ schoolId });
    return requestJson(
      `/api/v1/kungfu/options?${query}`,
      listKungfuOptionsResponseSchema,
    );
  },
  listAllKungfuOptions() {
    return requestJson(
      '/api/v1/kungfu/options',
      listKungfuOptionsResponseSchema,
    );
  },
};

export const gameReferenceQueryKey = ['game-reference'] as const;

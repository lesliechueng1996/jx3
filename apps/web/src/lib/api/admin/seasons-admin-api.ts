import { z } from 'zod';
import { requestJson } from '#/lib/api/request';

export const adminSeasonListItemSchema = z.object({
  id: z.string(),
  expansionId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminSeasonListItem = z.infer<typeof adminSeasonListItemSchema>;

export const listSeasonsResponseSchema = z.object({
  items: z.array(adminSeasonListItemSchema),
});

export type ListSeasonsResponse = z.infer<typeof listSeasonsResponseSchema>;

export type SeasonFormValues = {
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  sortOrder: number;
};

export const seasonsAdminApi = {
  list(expansionId: string) {
    return requestJson(
      `/api/v1/expansions/${expansionId}/seasons`,
      listSeasonsResponseSchema,
    );
  },
  create(expansionId: string, body: Omit<SeasonFormValues, 'sortOrder'>) {
    return requestJson(
      `/api/v1/expansions/${expansionId}/seasons`,
      adminSeasonListItemSchema,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
  },
  update(
    expansionId: string,
    seasonId: string,
    body: Partial<SeasonFormValues>,
  ) {
    return requestJson(
      `/api/v1/expansions/${expansionId}/seasons/${seasonId}`,
      adminSeasonListItemSchema,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    );
  },
  delete(expansionId: string, seasonId: string) {
    return requestJson(
      `/api/v1/expansions/${expansionId}/seasons/${seasonId}`,
      z.object({ success: z.literal(true) }),
      { method: 'DELETE' },
    );
  },
};

export const seasonsAdminQueryKey = (expansionId: string) =>
  ['admin-seasons', expansionId] as const;

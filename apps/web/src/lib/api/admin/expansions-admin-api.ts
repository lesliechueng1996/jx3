import { z } from 'zod';
import { requestJson } from '#/lib/api/request';

export const adminExpansionListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  level: z.number().int(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminExpansionListItem = z.infer<
  typeof adminExpansionListItemSchema
>;

export const listExpansionsResponseSchema = z.object({
  items: z.array(adminExpansionListItemSchema),
});

export type ListExpansionsResponse = z.infer<
  typeof listExpansionsResponseSchema
>;

export type ExpansionFormValues = {
  name: string;
  description: string | null;
  level: number;
  startDate: string;
  endDate: string | null;
};

export const expansionsAdminApi = {
  list() {
    return requestJson('/api/v1/expansions', listExpansionsResponseSchema);
  },
  create(body: ExpansionFormValues) {
    return requestJson('/api/v1/expansions', adminExpansionListItemSchema, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  update(expansionId: string, body: Partial<ExpansionFormValues>) {
    return requestJson(
      `/api/v1/expansions/${expansionId}`,
      adminExpansionListItemSchema,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    );
  },
  delete(expansionId: string) {
    return requestJson(
      `/api/v1/expansions/${expansionId}`,
      z.object({ success: z.literal(true) }),
      { method: 'DELETE' },
    );
  },
};

export const expansionsAdminQueryKey = ['admin-expansions'] as const;

import { z } from 'zod';
import { requestJson } from '#/lib/api/request';

export const adminGameServerListItemSchema = z.object({
  id: z.string(),
  serverId: z.string(),
  zone: z.string(),
  name: z.string(),
  alias: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminGameServerListItem = z.infer<
  typeof adminGameServerListItemSchema
>;

export const listGameServersResponseSchema = z.object({
  items: z.array(adminGameServerListItemSchema),
});

export type ListGameServersResponse = z.infer<
  typeof listGameServersResponseSchema
>;

export type GameServerFormValues = {
  serverId: string;
  zone: string;
  name: string;
  alias: string[];
};

export const gameServersAdminApi = {
  list() {
    return requestJson('/api/v1/game-servers', listGameServersResponseSchema);
  },
  create(body: GameServerFormValues) {
    return requestJson('/api/v1/game-servers', adminGameServerListItemSchema, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  update(id: string, body: Partial<GameServerFormValues>) {
    return requestJson(
      `/api/v1/game-servers/${id}`,
      adminGameServerListItemSchema,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    );
  },
  delete(id: string) {
    return requestJson(
      `/api/v1/game-servers/${id}`,
      z.object({ success: z.literal(true) }),
      { method: 'DELETE' },
    );
  },
};

export const gameServersAdminQueryKey = ['admin-game-servers'] as const;

export const parseAliasInput = (value: string): string[] =>
  value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

export const formatAliasInput = (alias: string[]): string => alias.join('，');

import { z } from 'zod';

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

export const createGameServerBodySchema = z.object({
  serverId: z.string().trim().min(1).max(255),
  zone: z.string().trim().min(1).max(255),
  name: z.string().trim().min(1).max(255),
  alias: z.array(z.string().trim().min(1)).default([]),
});

export type CreateGameServerBody = z.infer<typeof createGameServerBodySchema>;

export const updateGameServerBodySchema = z
  .object({
    serverId: z.string().trim().min(1).max(255).optional(),
    zone: z.string().trim().min(1).max(255).optional(),
    name: z.string().trim().min(1).max(255).optional(),
    alias: z.array(z.string().trim().min(1)).optional(),
  })
  .refine(
    (value) =>
      value.serverId !== undefined ||
      value.zone !== undefined ||
      value.name !== undefined ||
      value.alias !== undefined,
    { message: 'At least one field must be provided' },
  );

export type UpdateGameServerBody = z.infer<typeof updateGameServerBodySchema>;

export const updateGameServerResponseSchema = adminGameServerListItemSchema;

export const successResponseSchema = z.object({
  success: z.literal(true),
});

export const syncGameServersResponseSchema = z.object({
  synced: z.number().int().nonnegative(),
});

export type SyncGameServersResponse = z.infer<
  typeof syncGameServersResponseSchema
>;

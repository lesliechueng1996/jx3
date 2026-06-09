import { SUPER_ADMIN_ROLE } from '@jx3/auth/roles';
import { Elysia, t } from 'elysia';
import { authMacro } from '../middleware/auth-macro';
import { loggerPlugin } from '../plugins/logger';
import { errorResponse } from '../schemas/common';
import {
  createGameServerBodySchema,
  listGameServersResponseSchema,
  successResponseSchema,
  syncGameServersResponseSchema,
  updateGameServerBodySchema,
  updateGameServerResponseSchema,
} from '../schemas/game-servers-admin';
import {
  createAdminGameServer,
  deleteAdminGameServer,
  getAdminGameServerById,
  isDuplicateGameServerId,
  isGameServerReferenced,
  listAdminGameServers,
  syncAdminGameServersFromJx3box,
  updateAdminGameServer,
} from '../services/game-servers-admin';

const gameServerIdParamsSchema = t.Object({
  id: t.String(),
});

export const gameServersAdminRoute = new Elysia({
  name: 'game-servers-admin-routes',
})
  .use(loggerPlugin)
  .use(authMacro)
  .get('/api/v1/game-servers', async () => listAdminGameServers(), {
    auth: SUPER_ADMIN_ROLE,
    response: {
      200: listGameServersResponseSchema,
      401: t.Any(),
      403: t.Any(),
    },
    detail: {
      tags: ['GameServers'],
      summary: 'List all game servers',
      description:
        'Returns all game servers without pagination. Requires super_admin role.',
    },
  })
  .post(
    '/api/v1/game-servers/sync',
    async ({ log, set }) => {
      try {
        return await syncAdminGameServersFromJx3box({ logger: log });
      } catch (error) {
        log.error({ err: error }, 'failed to sync game servers from jx3box');
        set.status = 502;
        return errorResponse(
          'SYNC_FAILED',
          'Failed to sync game servers from upstream',
        );
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      response: {
        200: syncGameServersResponseSchema,
        401: t.Any(),
        403: t.Any(),
        502: t.Any(),
      },
      detail: {
        tags: ['GameServers'],
        summary: 'Sync game servers from jx3box',
        description:
          'Upserts game servers from jx3box and jx3api master search by matching name. Requires super_admin role.',
      },
    },
  )
  .post(
    '/api/v1/game-servers',
    async ({ body, set, log }) => {
      if (await isDuplicateGameServerId(body.serverId)) {
        set.status = 409;
        return errorResponse(
          'DUPLICATE_SERVER_ID',
          'A game server with this server ID already exists',
        );
      }

      try {
        const created = await createAdminGameServer(body);
        set.status = 201;
        return created;
      } catch (error) {
        log.error({ err: error }, 'failed to create game server');
        set.status = 400;
        return errorResponse('CREATE_FAILED', 'Failed to create game server');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      body: createGameServerBodySchema,
      response: {
        201: updateGameServerResponseSchema,
        400: t.Any(),
        401: t.Any(),
        403: t.Any(),
        409: t.Any(),
      },
      detail: {
        tags: ['GameServers'],
        summary: 'Create a game server',
        description: 'Creates a new game server. Requires super_admin role.',
      },
    },
  )
  .patch(
    '/api/v1/game-servers/:id',
    async ({ params, body, set, log }) => {
      const existing = await getAdminGameServerById(params.id);
      if (!existing) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'Game server not found');
      }

      if (
        body.serverId !== undefined &&
        (await isDuplicateGameServerId(body.serverId, params.id))
      ) {
        set.status = 409;
        return errorResponse(
          'DUPLICATE_SERVER_ID',
          'A game server with this server ID already exists',
        );
      }

      try {
        const updated = await updateAdminGameServer(params.id, body);
        if (!updated) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Game server not found');
        }
        return updated;
      } catch (error) {
        log.error(
          { err: error, gameServerId: params.id },
          'failed to update game server',
        );
        set.status = 400;
        return errorResponse('UPDATE_FAILED', 'Failed to update game server');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: gameServerIdParamsSchema,
      body: updateGameServerBodySchema,
      response: {
        200: updateGameServerResponseSchema,
        400: t.Any(),
        401: t.Any(),
        403: t.Any(),
        404: t.Any(),
        409: t.Any(),
      },
      detail: {
        tags: ['GameServers'],
        summary: 'Update game server information',
        description: 'Updates a game server. Requires super_admin role.',
      },
    },
  )
  .delete(
    '/api/v1/game-servers/:id',
    async ({ params, set, log }) => {
      const existing = await getAdminGameServerById(params.id);
      if (!existing) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'Game server not found');
      }

      if (await isGameServerReferenced(params.id)) {
        set.status = 409;
        return errorResponse(
          'GAME_SERVER_IN_USE',
          'Game server is referenced by characters or raid signups and cannot be deleted',
        );
      }

      try {
        const deleted = await deleteAdminGameServer(params.id);
        if (!deleted) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Game server not found');
        }
        return { success: true as const };
      } catch (error) {
        log.error(
          { err: error, gameServerId: params.id },
          'failed to delete game server',
        );
        set.status = 400;
        return errorResponse('DELETE_FAILED', 'Failed to delete game server');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: gameServerIdParamsSchema,
      response: {
        200: successResponseSchema,
        400: t.Any(),
        401: t.Any(),
        403: t.Any(),
        404: t.Any(),
        409: t.Any(),
      },
      detail: {
        tags: ['GameServers'],
        summary: 'Delete a game server',
        description: 'Deletes a game server. Requires super_admin role.',
      },
    },
  );

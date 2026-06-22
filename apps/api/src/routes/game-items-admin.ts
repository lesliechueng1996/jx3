import { SUPER_ADMIN_ROLE } from '@jx3/auth/roles';
import { Elysia, t } from 'elysia';
import { authMacro } from '../middleware/auth-macro';
import { loggerPlugin } from '../plugins/logger';
import { errorResponse, errorSchema } from '../schemas/common';
import {
  createGameItemAdminBodySchema,
  listGameItemsQuerySchema,
  listGameItemsResponseSchema,
  successResponseSchema,
  updateGameItemBodySchema,
  updateGameItemResponseSchema,
} from '../schemas/game-items-admin';
import {
  createAdminGameItem,
  deleteAdminGameItem,
  getAdminGameItemById,
  isGameItemReferenced,
  listAdminGameItems,
  updateAdminGameItem,
} from '../services/game-items-admin';

const gameItemIdParamsSchema = t.Object({
  id: t.String(),
});

export const gameItemsAdminRoute = new Elysia({
  name: 'game-items-admin-routes',
})
  .use(loggerPlugin)
  .use(authMacro)
  .get('/api/v1/game-items', async ({ query }) => listAdminGameItems(query), {
    auth: SUPER_ADMIN_ROLE,
    query: listGameItemsQuerySchema,
    response: {
      200: listGameItemsResponseSchema,
      401: errorSchema,
      403: errorSchema,
    },
    detail: {
      tags: ['GameItems'],
      summary: 'List game items with pagination and filters',
      description:
        'Returns a paginated list of game items. Requires super_admin role.',
    },
  })
  .post(
    '/api/v1/game-items/admin',
    async ({ body, set, log }) => {
      try {
        const created = await createAdminGameItem(body, { logger: log });
        set.status = 201;
        return created;
      } catch (error) {
        log.error({ err: error }, 'failed to create game item');
        set.status = 400;
        return errorResponse('CREATE_FAILED', 'Failed to create game item');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      body: createGameItemAdminBodySchema,
      response: {
        201: updateGameItemResponseSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
      },
      detail: {
        tags: ['GameItems'],
        summary: 'Create a game item (admin)',
        description:
          'Creates a game item with full fields including alias. Requires super_admin role.',
      },
    },
  )
  .patch(
    '/api/v1/game-items/:id',
    async ({ params, body, set, log }) => {
      const existing = await getAdminGameItemById(params.id);
      if (!existing) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'Game item not found');
      }

      try {
        const updated = await updateAdminGameItem(params.id, body);
        if (!updated) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Game item not found');
        }
        return updated;
      } catch (error) {
        log.error(
          { err: error, gameItemId: params.id },
          'failed to update game item',
        );
        set.status = 400;
        return errorResponse('UPDATE_FAILED', 'Failed to update game item');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: gameItemIdParamsSchema,
      body: updateGameItemBodySchema,
      response: {
        200: updateGameItemResponseSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
      },
      detail: {
        tags: ['GameItems'],
        summary: 'Update game item information',
        description: 'Updates a game item. Requires super_admin role.',
      },
    },
  )
  .delete(
    '/api/v1/game-items/:id',
    async ({ params, set, log }) => {
      const existing = await getAdminGameItemById(params.id);
      if (!existing) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'Game item not found');
      }

      if (await isGameItemReferenced(params.id)) {
        set.status = 409;
        return errorResponse(
          'GAME_ITEM_IN_USE',
          'Game item is referenced by raid loot records and cannot be deleted',
        );
      }

      try {
        const deleted = await deleteAdminGameItem(params.id);
        if (!deleted) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Game item not found');
        }
        return { success: true as const };
      } catch (error) {
        log.error(
          { err: error, gameItemId: params.id },
          'failed to delete game item',
        );
        set.status = 400;
        return errorResponse('DELETE_FAILED', 'Failed to delete game item');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: gameItemIdParamsSchema,
      response: {
        200: successResponseSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
        409: errorSchema,
      },
      detail: {
        tags: ['GameItems'],
        summary: 'Delete a game item',
        description: 'Deletes a game item. Requires super_admin role.',
      },
    },
  );

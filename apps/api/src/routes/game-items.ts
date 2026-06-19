import { Elysia, t } from 'elysia';
import { authMacro } from '../middleware/auth-macro';
import { loggerPlugin } from '../plugins/logger';
import { errorResponse } from '../schemas/common';
import {
  createGameItemBodySchema,
  gameItemResponseSchema,
  searchGameItemsQuerySchema,
  searchGameItemsResponseSchema,
} from '../schemas/game-items';
import { createGameItem, searchGameItems } from '../services/game-items';

export const gameItemsRoute = new Elysia({ name: 'game-items-routes' })
  .use(loggerPlugin)
  .use(authMacro)
  .get(
    '/api/v1/game-items/search',
    async ({ query }) => searchGameItems(query.q),
    {
      auth: true,
      query: searchGameItemsQuerySchema,
      response: {
        200: searchGameItemsResponseSchema,
        401: t.Any(),
      },
      detail: {
        tags: ['GameItems'],
        summary: 'Search game items',
        description:
          'Searches game items by name or alias. Requires authentication.',
      },
    },
  )
  .post(
    '/api/v1/game-items',
    async ({ body, set, log }) => {
      try {
        const created = await createGameItem(body);
        set.status = 201;
        return created;
      } catch (error) {
        log.error({ err: error }, 'failed to create game item');
        set.status = 400;
        return errorResponse('CREATE_FAILED', 'Failed to create game item');
      }
    },
    {
      auth: true,
      body: createGameItemBodySchema,
      response: {
        201: gameItemResponseSchema,
        400: t.Any(),
        401: t.Any(),
      },
      detail: {
        tags: ['GameItems'],
        summary: 'Create a game item',
        description:
          'Creates a game item for inline loot recording. Requires authentication.',
      },
    },
  );

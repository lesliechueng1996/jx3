import { SUPER_ADMIN_ROLE } from '@jx3/auth/roles';
import { Elysia, t } from 'elysia';
import { authMacro } from '../middleware/auth-macro';
import { loggerPlugin } from '../plugins/logger';
import { errorResponse, errorSchema } from '../schemas/common';
import {
  createDungeonBodySchema,
  listDungeonsQuerySchema,
  listDungeonsResponseSchema,
  successResponseSchema,
  updateDungeonBodySchema,
  updateDungeonResponseSchema,
} from '../schemas/dungeons-admin';
import {
  createAdminDungeon,
  DungeonValidationError,
  deleteAdminDungeon,
  getAdminDungeonById,
  isDungeonReferenced,
  listAdminDungeons,
  updateAdminDungeon,
} from '../services/dungeons-admin';

const dungeonIdParamsSchema = t.Object({
  id: t.String(),
});

export const dungeonsAdminRoute = new Elysia({ name: 'dungeons-admin-routes' })
  .use(loggerPlugin)
  .use(authMacro)
  .get('/api/v1/dungeons', async ({ query }) => listAdminDungeons(query), {
    auth: true,
    query: listDungeonsQuerySchema,
    response: {
      200: listDungeonsResponseSchema,
      401: errorSchema,
    },
    detail: {
      tags: ['Dungeons'],
      summary: 'List dungeons with pagination and filters',
      description:
        'Returns a paginated list of game dungeons. Supports name search via the name query parameter. Requires authentication.',
    },
  })
  .post(
    '/api/v1/dungeons',
    async ({ body, set, log }) => {
      try {
        const created = await createAdminDungeon(body);
        set.status = 201;
        return created;
      } catch (error) {
        if (error instanceof DungeonValidationError) {
          set.status = 400;
          return errorResponse('VALIDATION_FAILED', error.message);
        }
        log.error({ err: error }, 'failed to create dungeon');
        set.status = 400;
        return errorResponse('CREATE_FAILED', 'Failed to create dungeon');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      body: createDungeonBodySchema,
      response: {
        201: updateDungeonResponseSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
      },
      detail: {
        tags: ['Dungeons'],
        summary: 'Create a dungeon',
        description: 'Creates a new game dungeon. Requires super_admin role.',
      },
    },
  )
  .patch(
    '/api/v1/dungeons/:id',
    async ({ params, body, set, log }) => {
      const existing = await getAdminDungeonById(params.id);
      if (!existing) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'Dungeon not found');
      }

      try {
        const updated = await updateAdminDungeon(params.id, body);
        if (!updated) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Dungeon not found');
        }
        return updated;
      } catch (error) {
        if (error instanceof DungeonValidationError) {
          set.status = 400;
          return errorResponse('VALIDATION_FAILED', error.message);
        }
        log.error(
          { err: error, dungeonId: params.id },
          'failed to update dungeon',
        );
        set.status = 400;
        return errorResponse('UPDATE_FAILED', 'Failed to update dungeon');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: dungeonIdParamsSchema,
      body: updateDungeonBodySchema,
      response: {
        200: updateDungeonResponseSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
      },
      detail: {
        tags: ['Dungeons'],
        summary: 'Update dungeon information',
        description: 'Updates a game dungeon. Requires super_admin role.',
      },
    },
  )
  .delete(
    '/api/v1/dungeons/:id',
    async ({ params, set, log }) => {
      const existing = await getAdminDungeonById(params.id);
      if (!existing) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'Dungeon not found');
      }

      if (await isDungeonReferenced(params.id)) {
        set.status = 409;
        return errorResponse(
          'DUNGEON_IN_USE',
          'Dungeon is referenced by raid runs and cannot be deleted',
        );
      }

      try {
        const deleted = await deleteAdminDungeon(params.id);
        if (!deleted) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Dungeon not found');
        }
        return { success: true as const };
      } catch (error) {
        log.error(
          { err: error, dungeonId: params.id },
          'failed to delete dungeon',
        );
        set.status = 400;
        return errorResponse('DELETE_FAILED', 'Failed to delete dungeon');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: dungeonIdParamsSchema,
      response: {
        200: successResponseSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
        409: errorSchema,
      },
      detail: {
        tags: ['Dungeons'],
        summary: 'Delete a dungeon',
        description: 'Deletes a game dungeon. Requires super_admin role.',
      },
    },
  );

import { SUPER_ADMIN_ROLE } from '@jx3/auth/roles';
import { Elysia, t } from 'elysia';
import { authMacro } from '../middleware/auth-macro';
import { loggerPlugin } from '../plugins/logger';
import { errorResponse } from '../schemas/common';
import {
  createExpansionBodySchema,
  listExpansionFilterOptionsResponseSchema,
  listExpansionsResponseSchema,
  successResponseSchema,
  updateExpansionBodySchema,
  updateExpansionResponseSchema,
} from '../schemas/expansions-admin';
import {
  createAdminExpansion,
  deleteAdminExpansion,
  getAdminExpansionById,
  isExpansionReferenced,
  listAdminExpansions,
  listExpansionFilterOptions,
  updateAdminExpansion,
} from '../services/expansions-admin';

const expansionIdParamsSchema = t.Object({
  id: t.String(),
});

export const expansionsAdminRoute = new Elysia({
  name: 'expansions-admin-routes',
})
  .use(loggerPlugin)
  .use(authMacro)
  .get('/api/v1/expansions', async () => listAdminExpansions(), {
    auth: SUPER_ADMIN_ROLE,
    response: {
      200: listExpansionsResponseSchema,
      401: t.Any(),
      403: t.Any(),
    },
    detail: {
      tags: ['Expansions'],
      summary: 'List all game expansions',
      description:
        'Returns all game expansions without pagination. Requires super_admin role.',
    },
  })
  .get(
    '/api/v1/expansions/filter-options',
    async () => listExpansionFilterOptions(),
    {
      auth: SUPER_ADMIN_ROLE,
      response: {
        200: listExpansionFilterOptionsResponseSchema,
        401: t.Any(),
        403: t.Any(),
      },
      detail: {
        tags: ['Expansions'],
        summary: 'List expansion and season filter options',
        description:
          'Returns all expansions with nested seasons for admin filter dropdowns. Requires super_admin role.',
      },
    },
  )
  .post(
    '/api/v1/expansions',
    async ({ body, set, log }) => {
      try {
        const created = await createAdminExpansion(body);
        set.status = 201;
        return created;
      } catch (error) {
        log.error({ err: error }, 'failed to create expansion');
        set.status = 400;
        return errorResponse('CREATE_FAILED', 'Failed to create expansion');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      body: createExpansionBodySchema,
      response: {
        201: updateExpansionResponseSchema,
        400: t.Any(),
        401: t.Any(),
        403: t.Any(),
      },
      detail: {
        tags: ['Expansions'],
        summary: 'Create an expansion',
        description: 'Creates a new game expansion. Requires super_admin role.',
      },
    },
  )
  .patch(
    '/api/v1/expansions/:id',
    async ({ params, body, set, log }) => {
      const existing = await getAdminExpansionById(params.id);
      if (!existing) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'Expansion not found');
      }

      try {
        const updated = await updateAdminExpansion(params.id, body);
        if (!updated) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Expansion not found');
        }
        return updated;
      } catch (error) {
        log.error(
          { err: error, expansionId: params.id },
          'failed to update expansion',
        );
        set.status = 400;
        return errorResponse('UPDATE_FAILED', 'Failed to update expansion');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: expansionIdParamsSchema,
      body: updateExpansionBodySchema,
      response: {
        200: updateExpansionResponseSchema,
        400: t.Any(),
        401: t.Any(),
        403: t.Any(),
        404: t.Any(),
      },
      detail: {
        tags: ['Expansions'],
        summary: 'Update expansion information',
        description: 'Updates a game expansion. Requires super_admin role.',
      },
    },
  )
  .delete(
    '/api/v1/expansions/:id',
    async ({ params, set, log }) => {
      const existing = await getAdminExpansionById(params.id);
      if (!existing) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'Expansion not found');
      }

      if (await isExpansionReferenced(params.id)) {
        set.status = 409;
        return errorResponse(
          'EXPANSION_IN_USE',
          'Expansion is referenced by seasons or dungeons and cannot be deleted',
        );
      }

      try {
        const deleted = await deleteAdminExpansion(params.id);
        if (!deleted) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Expansion not found');
        }
        return { success: true as const };
      } catch (error) {
        log.error(
          { err: error, expansionId: params.id },
          'failed to delete expansion',
        );
        set.status = 400;
        return errorResponse('DELETE_FAILED', 'Failed to delete expansion');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: expansionIdParamsSchema,
      response: {
        200: successResponseSchema,
        400: t.Any(),
        401: t.Any(),
        403: t.Any(),
        404: t.Any(),
        409: t.Any(),
      },
      detail: {
        tags: ['Expansions'],
        summary: 'Delete an expansion',
        description: 'Deletes a game expansion. Requires super_admin role.',
      },
    },
  );

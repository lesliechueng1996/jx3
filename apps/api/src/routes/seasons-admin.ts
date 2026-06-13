import { SUPER_ADMIN_ROLE } from '@jx3/auth/roles';
import { Elysia, t } from 'elysia';
import { authMacro } from '../middleware/auth-macro';
import { loggerPlugin } from '../plugins/logger';
import { errorResponse } from '../schemas/common';
import {
  createSeasonBodySchema,
  listSeasonsResponseSchema,
  successResponseSchema,
  updateSeasonBodySchema,
  updateSeasonResponseSchema,
} from '../schemas/seasons-admin';
import { getAdminExpansionById } from '../services/expansions-admin';
import {
  createAdminSeason,
  deleteAdminSeason,
  getAdminSeasonById,
  isSeasonReferenced,
  listAdminSeasons,
  SeasonValidationError,
  updateAdminSeason,
} from '../services/seasons-admin';

const expansionIdParamsSchema = t.Object({
  id: t.String(),
});

const expansionSeasonIdParamsSchema = t.Object({
  id: t.String(),
  seasonId: t.String(),
});

export const seasonsAdminRoute = new Elysia({
  name: 'seasons-admin-routes',
})
  .use(loggerPlugin)
  .use(authMacro)
  .get(
    '/api/v1/expansions/:id/seasons',
    async ({ params, set }) => {
      const expansion = await getAdminExpansionById(params.id);
      if (!expansion) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'Expansion not found');
      }

      return listAdminSeasons(params.id);
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: expansionIdParamsSchema,
      response: {
        200: listSeasonsResponseSchema,
        401: t.Any(),
        403: t.Any(),
        404: t.Any(),
      },
      detail: {
        tags: ['Expansions'],
        summary: 'List seasons for an expansion',
        description:
          'Returns all seasons belonging to a game expansion. Requires super_admin role.',
      },
    },
  )
  .post(
    '/api/v1/expansions/:id/seasons',
    async ({ params, body, set, log }) => {
      const expansion = await getAdminExpansionById(params.id);
      if (!expansion) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'Expansion not found');
      }

      try {
        const created = await createAdminSeason(params.id, body);
        set.status = 201;
        return created;
      } catch (error) {
        if (error instanceof SeasonValidationError) {
          set.status = 400;
          return errorResponse('VALIDATION_FAILED', error.message);
        }
        log.error(
          { err: error, expansionId: params.id },
          'failed to create season',
        );
        set.status = 400;
        return errorResponse('CREATE_FAILED', 'Failed to create season');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: expansionIdParamsSchema,
      body: createSeasonBodySchema,
      response: {
        201: updateSeasonResponseSchema,
        400: t.Any(),
        401: t.Any(),
        403: t.Any(),
        404: t.Any(),
      },
      detail: {
        tags: ['Expansions'],
        summary: 'Create a season',
        description:
          'Creates a new season under a game expansion. Requires super_admin role.',
      },
    },
  )
  .patch(
    '/api/v1/expansions/:id/seasons/:seasonId',
    async ({ params, body, set, log }) => {
      const existing = await getAdminSeasonById(params.id, params.seasonId);
      if (!existing) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'Season not found');
      }

      try {
        const updated = await updateAdminSeason(
          params.id,
          params.seasonId,
          body,
        );
        if (!updated) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Season not found');
        }
        return updated;
      } catch (error) {
        if (error instanceof SeasonValidationError) {
          set.status = 400;
          return errorResponse('VALIDATION_FAILED', error.message);
        }
        log.error(
          { err: error, expansionId: params.id, seasonId: params.seasonId },
          'failed to update season',
        );
        set.status = 400;
        return errorResponse('UPDATE_FAILED', 'Failed to update season');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: expansionSeasonIdParamsSchema,
      body: updateSeasonBodySchema,
      response: {
        200: updateSeasonResponseSchema,
        400: t.Any(),
        401: t.Any(),
        403: t.Any(),
        404: t.Any(),
      },
      detail: {
        tags: ['Expansions'],
        summary: 'Update season information',
        description: 'Updates a game season. Requires super_admin role.',
      },
    },
  )
  .delete(
    '/api/v1/expansions/:id/seasons/:seasonId',
    async ({ params, set, log }) => {
      const existing = await getAdminSeasonById(params.id, params.seasonId);
      if (!existing) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'Season not found');
      }

      if (await isSeasonReferenced(params.seasonId)) {
        set.status = 409;
        return errorResponse(
          'SEASON_IN_USE',
          'Season is referenced by dungeons and cannot be deleted',
        );
      }

      try {
        const deleted = await deleteAdminSeason(params.id, params.seasonId);
        if (!deleted) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Season not found');
        }
        return { success: true as const };
      } catch (error) {
        log.error(
          { err: error, expansionId: params.id, seasonId: params.seasonId },
          'failed to delete season',
        );
        set.status = 400;
        return errorResponse('DELETE_FAILED', 'Failed to delete season');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: expansionSeasonIdParamsSchema,
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
        summary: 'Delete a season',
        description: 'Deletes a game season. Requires super_admin role.',
      },
    },
  );

import { hasStaffRole } from '@jx3/auth/roles';
import { Elysia, t } from 'elysia';
import { authMacro } from '../middleware/auth-macro';
import { loggerPlugin } from '../plugins/logger';
import {
  createPlayerBlocklistBodySchema,
  createRaidBrandBlocklistBodySchema,
  listBlocklistQuerySchema,
  listPlayerBlocklistResponseSchema,
  listRaidBrandBlocklistResponseSchema,
  playerBlocklistItemSchema,
  raidBrandBlocklistItemSchema,
} from '../schemas/blocklist';
import { errorResponse, errorSchema } from '../schemas/common';
import {
  BlocklistConflictError,
  BlocklistValidationError,
  createPlayerBlocklistEntry,
  createRaidBrandBlocklistEntry,
  deletePlayerBlocklistEntry,
  deleteRaidBrandBlocklistEntry,
  listPlayerBlocklist,
  listRaidBrandBlocklist,
} from '../services/blocklist';

const blocklistIdParamsSchema = t.Object({
  id: t.String(),
});

export const blocklistRoute = new Elysia({ name: 'blocklist-routes' })
  .use(loggerPlugin)
  .use(authMacro)
  .get(
    '/api/v1/blocklist/raid-brands',
    async ({ query }) => listRaidBrandBlocklist(query),
    {
      auth: true,
      query: listBlocklistQuerySchema,
      response: {
        200: listRaidBrandBlocklistResponseSchema,
        401: errorSchema,
      },
      detail: {
        tags: ['Blocklist'],
        summary: 'List raid brand blocklist entries',
        description:
          'Returns public raid brand blocklist entries with optional name search. Requires authentication.',
      },
    },
  )
  .post(
    '/api/v1/blocklist/raid-brands',
    async ({ body, user, set, log }) => {
      try {
        const created = await createRaidBrandBlocklistEntry(user.id, body);
        set.status = 201;
        return created;
      } catch (error) {
        if (error instanceof BlocklistValidationError) {
          set.status = 400;
          return errorResponse('VALIDATION_FAILED', error.message);
        }
        if (error instanceof BlocklistConflictError) {
          set.status = 409;
          return errorResponse('CONFLICT', error.message);
        }
        log.error(
          { err: error },
          'failed to create raid brand blocklist entry',
        );
        set.status = 400;
        return errorResponse(
          'CREATE_FAILED',
          'Failed to create raid brand blocklist entry',
        );
      }
    },
    {
      auth: true,
      body: createRaidBrandBlocklistBodySchema,
      response: {
        201: raidBrandBlocklistItemSchema,
        400: errorSchema,
        401: errorSchema,
        409: errorSchema,
      },
      detail: {
        tags: ['Blocklist'],
        summary: 'Create a raid brand blocklist entry',
        description:
          'Adds a raid brand to the public blocklist. Requires authentication.',
      },
    },
  )
  .delete(
    '/api/v1/blocklist/raid-brands/:id',
    async ({ params, user, set, log }) => {
      if (!hasStaffRole(user.role)) {
        set.status = 403;
        return errorResponse('FORBIDDEN', 'Insufficient permissions');
      }

      try {
        const deleted = await deleteRaidBrandBlocklistEntry(params.id);
        if (!deleted) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Blocklist entry not found');
        }
        set.status = 204;
        return null;
      } catch (error) {
        log.error(
          { err: error, blocklistId: params.id },
          'failed to delete raid brand blocklist entry',
        );
        set.status = 400;
        return errorResponse(
          'DELETE_FAILED',
          'Failed to delete raid brand blocklist entry',
        );
      }
    },
    {
      auth: true,
      params: blocklistIdParamsSchema,
      response: {
        204: t.Null(),
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
      },
      detail: {
        tags: ['Blocklist'],
        summary: 'Delete a raid brand blocklist entry',
        description:
          'Removes a raid brand from the public blocklist. Requires admin or super admin role.',
      },
    },
  )
  .get(
    '/api/v1/blocklist/players',
    async ({ query }) => listPlayerBlocklist(query),
    {
      auth: true,
      query: listBlocklistQuerySchema,
      response: {
        200: listPlayerBlocklistResponseSchema,
        401: errorSchema,
      },
      detail: {
        tags: ['Blocklist'],
        summary: 'List player blocklist entries',
        description:
          'Returns public player blocklist entries with optional character name search and server filter. Requires authentication.',
      },
    },
  )
  .post(
    '/api/v1/blocklist/players',
    async ({ body, user, set, log }) => {
      try {
        const created = await createPlayerBlocklistEntry(user.id, body);
        set.status = 201;
        return created;
      } catch (error) {
        if (error instanceof BlocklistValidationError) {
          set.status = 400;
          return errorResponse('VALIDATION_FAILED', error.message);
        }
        if (error instanceof BlocklistConflictError) {
          set.status = 409;
          return errorResponse('CONFLICT', error.message);
        }
        log.error({ err: error }, 'failed to create player blocklist entry');
        set.status = 400;
        return errorResponse(
          'CREATE_FAILED',
          'Failed to create player blocklist entry',
        );
      }
    },
    {
      auth: true,
      body: createPlayerBlocklistBodySchema,
      response: {
        201: playerBlocklistItemSchema,
        400: errorSchema,
        401: errorSchema,
        409: errorSchema,
      },
      detail: {
        tags: ['Blocklist'],
        summary: 'Create a player blocklist entry',
        description:
          'Adds a player to the public blocklist. Requires authentication.',
      },
    },
  )
  .delete(
    '/api/v1/blocklist/players/:id',
    async ({ params, user, set, log }) => {
      if (!hasStaffRole(user.role)) {
        set.status = 403;
        return errorResponse('FORBIDDEN', 'Insufficient permissions');
      }

      try {
        const deleted = await deletePlayerBlocklistEntry(params.id);
        if (!deleted) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Blocklist entry not found');
        }
        set.status = 204;
        return null;
      } catch (error) {
        log.error(
          { err: error, blocklistId: params.id },
          'failed to delete player blocklist entry',
        );
        set.status = 400;
        return errorResponse(
          'DELETE_FAILED',
          'Failed to delete player blocklist entry',
        );
      }
    },
    {
      auth: true,
      params: blocklistIdParamsSchema,
      response: {
        204: t.Null(),
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
      },
      detail: {
        tags: ['Blocklist'],
        summary: 'Delete a player blocklist entry',
        description:
          'Removes a player from the public blocklist. Requires admin or super admin role.',
      },
    },
  );

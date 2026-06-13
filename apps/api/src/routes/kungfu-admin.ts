import { SUPER_ADMIN_ROLE } from '@jx3/auth/roles';
import { Elysia, t } from 'elysia';
import { authMacro } from '../middleware/auth-macro';
import { loggerPlugin } from '../plugins/logger';
import { errorResponse } from '../schemas/common';
import {
  createKungfuBodySchema,
  listKungfuOptionsQuerySchema,
  listKungfuOptionsResponseSchema,
  listKungfuQuerySchema,
  listKungfuResponseSchema,
  successResponseSchema,
  updateKungfuBodySchema,
  updateKungfuResponseSchema,
} from '../schemas/kungfu-admin';
import {
  createAdminKungfu,
  deleteAdminKungfu,
  getAdminKungfuById,
  isKungfuReferenced,
  listAdminKungfu,
  listAllKungfuOptions,
  updateAdminKungfu,
} from '../services/kungfu-admin';

const kungfuIdParamsSchema = t.Object({
  id: t.String(),
});

export const kungfuAdminRoute = new Elysia({ name: 'kungfu-admin-routes' })
  .use(loggerPlugin)
  .use(authMacro)
  .get('/api/v1/kungfu', async ({ query }) => listAdminKungfu(query), {
    auth: SUPER_ADMIN_ROLE,
    query: listKungfuQuerySchema,
    response: {
      200: listKungfuResponseSchema,
      401: t.Any(),
      403: t.Any(),
    },
    detail: {
      tags: ['Kungfu'],
      summary: 'List kungfu with pagination and filters',
      description:
        'Returns a paginated list of game kungfu. Requires super_admin role.',
    },
  })
  .get(
    '/api/v1/kungfu/options',
    async ({ query }) => listAllKungfuOptions(query.schoolId),
    {
      auth: true,
      query: listKungfuOptionsQuerySchema,
      response: {
        200: listKungfuOptionsResponseSchema,
        401: t.Any(),
      },
      detail: {
        tags: ['Kungfu'],
        summary: 'List kungfu for dropdowns',
        description:
          'Returns game kungfu as id/name options, optionally filtered by schoolId. Requires authentication.',
      },
    },
  )
  .post(
    '/api/v1/kungfu',
    async ({ body, set, log }) => {
      try {
        const created = await createAdminKungfu(body);
        set.status = 201;
        return created;
      } catch (error) {
        log.error({ err: error }, 'failed to create kungfu');
        set.status = 400;
        return errorResponse('CREATE_FAILED', 'Failed to create kungfu');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      body: createKungfuBodySchema,
      response: {
        201: updateKungfuResponseSchema,
        400: t.Any(),
        401: t.Any(),
        403: t.Any(),
      },
      detail: {
        tags: ['Kungfu'],
        summary: 'Create a kungfu',
        description: 'Creates a new game kungfu. Requires super_admin role.',
      },
    },
  )
  .patch(
    '/api/v1/kungfu/:id',
    async ({ params, body, set, log }) => {
      const existing = await getAdminKungfuById(params.id);
      if (!existing) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'Kungfu not found');
      }

      try {
        const updated = await updateAdminKungfu(params.id, body);
        if (!updated) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Kungfu not found');
        }
        return updated;
      } catch (error) {
        log.error(
          { err: error, kungfuId: params.id },
          'failed to update kungfu',
        );
        set.status = 400;
        return errorResponse('UPDATE_FAILED', 'Failed to update kungfu');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: kungfuIdParamsSchema,
      body: updateKungfuBodySchema,
      response: {
        200: updateKungfuResponseSchema,
        400: t.Any(),
        401: t.Any(),
        403: t.Any(),
        404: t.Any(),
      },
      detail: {
        tags: ['Kungfu'],
        summary: 'Update kungfu information',
        description: 'Updates a game kungfu. Requires super_admin role.',
      },
    },
  )
  .delete(
    '/api/v1/kungfu/:id',
    async ({ params, set, log }) => {
      const existing = await getAdminKungfuById(params.id);
      if (!existing) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'Kungfu not found');
      }

      if (await isKungfuReferenced(params.id)) {
        set.status = 409;
        return errorResponse(
          'KUNGFU_IN_USE',
          'Kungfu is referenced by raid signups and cannot be deleted',
        );
      }

      try {
        const deleted = await deleteAdminKungfu(params.id);
        if (!deleted) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Kungfu not found');
        }
        return { success: true as const };
      } catch (error) {
        log.error(
          { err: error, kungfuId: params.id },
          'failed to delete kungfu',
        );
        set.status = 400;
        return errorResponse('DELETE_FAILED', 'Failed to delete kungfu');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: kungfuIdParamsSchema,
      response: {
        200: successResponseSchema,
        400: t.Any(),
        401: t.Any(),
        403: t.Any(),
        404: t.Any(),
        409: t.Any(),
      },
      detail: {
        tags: ['Kungfu'],
        summary: 'Delete a kungfu',
        description: 'Deletes a game kungfu. Requires super_admin role.',
      },
    },
  );

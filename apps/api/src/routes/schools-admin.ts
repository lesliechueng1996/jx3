import { SUPER_ADMIN_ROLE } from '@jx3/auth/roles';
import { Elysia, t } from 'elysia';
import { authMacro } from '../middleware/auth-macro';
import { loggerPlugin } from '../plugins/logger';
import { errorResponse, errorSchema } from '../schemas/common';
import {
  createSchoolBodySchema,
  listSchoolOptionsResponseSchema,
  listSchoolsQuerySchema,
  listSchoolsResponseSchema,
  successResponseSchema,
  updateSchoolBodySchema,
  updateSchoolResponseSchema,
} from '../schemas/schools-admin';
import {
  createAdminSchool,
  deleteAdminSchool,
  getAdminSchoolById,
  isSchoolReferenced,
  listAdminSchools,
  listAllSchoolOptions,
  updateAdminSchool,
} from '../services/schools-admin';

const schoolIdParamsSchema = t.Object({
  id: t.String(),
});

export const schoolsAdminRoute = new Elysia({ name: 'schools-admin-routes' })
  .use(loggerPlugin)
  .use(authMacro)
  .get('/api/v1/schools', async ({ query }) => listAdminSchools(query), {
    auth: SUPER_ADMIN_ROLE,
    query: listSchoolsQuerySchema,
    response: {
      200: listSchoolsResponseSchema,
      401: errorSchema,
      403: errorSchema,
    },
    detail: {
      tags: ['Schools'],
      summary: 'List schools with pagination and filters',
      description:
        'Returns a paginated list of game schools. Requires super_admin role.',
    },
  })
  .get('/api/v1/schools/options', async () => listAllSchoolOptions(), {
    auth: true,
    response: {
      200: listSchoolOptionsResponseSchema,
      401: errorSchema,
    },
    detail: {
      tags: ['Schools'],
      summary: 'List all schools for dropdowns',
      description:
        'Returns all game schools as id/name options. Requires authentication.',
    },
  })
  .post(
    '/api/v1/schools',
    async ({ body, set, log }) => {
      try {
        const created = await createAdminSchool(body);
        set.status = 201;
        return created;
      } catch (error) {
        log.error({ err: error }, 'failed to create school');
        set.status = 400;
        return errorResponse('CREATE_FAILED', 'Failed to create school');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      body: createSchoolBodySchema,
      response: {
        201: updateSchoolResponseSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
      },
      detail: {
        tags: ['Schools'],
        summary: 'Create a school',
        description: 'Creates a new game school. Requires super_admin role.',
      },
    },
  )
  .patch(
    '/api/v1/schools/:id',
    async ({ params, body, set, log }) => {
      const existing = await getAdminSchoolById(params.id);
      if (!existing) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'School not found');
      }

      try {
        const updated = await updateAdminSchool(params.id, body);
        if (!updated) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'School not found');
        }
        return updated;
      } catch (error) {
        log.error(
          { err: error, schoolId: params.id },
          'failed to update school',
        );
        set.status = 400;
        return errorResponse('UPDATE_FAILED', 'Failed to update school');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: schoolIdParamsSchema,
      body: updateSchoolBodySchema,
      response: {
        200: updateSchoolResponseSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
      },
      detail: {
        tags: ['Schools'],
        summary: 'Update school information',
        description: 'Updates a game school. Requires super_admin role.',
      },
    },
  )
  .delete(
    '/api/v1/schools/:id',
    async ({ params, set, log }) => {
      const existing = await getAdminSchoolById(params.id);
      if (!existing) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'School not found');
      }

      if (await isSchoolReferenced(params.id)) {
        set.status = 409;
        return errorResponse(
          'SCHOOL_IN_USE',
          'School is referenced by characters or kungfu and cannot be deleted',
        );
      }

      try {
        const deleted = await deleteAdminSchool(params.id);
        if (!deleted) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'School not found');
        }
        return { success: true as const };
      } catch (error) {
        log.error(
          { err: error, schoolId: params.id },
          'failed to delete school',
        );
        set.status = 400;
        return errorResponse('DELETE_FAILED', 'Failed to delete school');
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: schoolIdParamsSchema,
      response: {
        200: successResponseSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
        409: errorSchema,
      },
      detail: {
        tags: ['Schools'],
        summary: 'Delete a school',
        description: 'Deletes a game school. Requires super_admin role.',
      },
    },
  );

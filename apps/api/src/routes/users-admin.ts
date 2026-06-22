import { SUPER_ADMIN_ROLE } from '@jx3/auth/roles';
import { Elysia, t } from 'elysia';
import { auth } from '../lib/auth';
import { authMacro } from '../middleware/auth-macro';
import { loggerPlugin } from '../plugins/logger';
import { errorResponse, errorSchema } from '../schemas/common';
import {
  banUserBodySchema,
  listUsersQuerySchema,
  listUsersResponseSchema,
  successResponseSchema,
  updateUserBodySchema,
  updateUserResponseSchema,
} from '../schemas/users-admin';
import { getAdminUserById, listAdminUsers } from '../services/users-admin';

const userIdParamsSchema = t.Object({
  id: t.String(),
});

export const usersAdminRoute = new Elysia({ name: 'users-admin-routes' })
  .use(loggerPlugin)
  .use(authMacro)
  .get('/api/v1/users', async ({ query }) => listAdminUsers(query), {
    auth: SUPER_ADMIN_ROLE,
    query: listUsersQuerySchema,
    response: {
      200: listUsersResponseSchema,
      401: errorSchema,
      403: errorSchema,
    },
    detail: {
      tags: ['Users'],
      summary: 'List users with pagination and filters',
      description:
        'Returns a paginated list of users. Requires super_admin role.',
    },
  })
  .patch(
    '/api/v1/users/:id',
    async ({ params, body, request, set, log }) => {
      const existing = await getAdminUserById(params.id);
      if (!existing) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'User not found');
      }

      try {
        if (body.name !== undefined) {
          await auth.api.adminUpdateUser({
            body: {
              userId: params.id,
              data: { name: body.name },
            },
            headers: request.headers,
          });
        }

        if (body.role !== undefined) {
          await auth.api.setRole({
            body: {
              userId: params.id,
              role: body.role,
            },
            headers: request.headers,
          });
        }
      } catch (error) {
        log.error({ err: error, userId: params.id }, 'failed to update user');
        set.status = 400;
        return errorResponse('UPDATE_FAILED', 'Failed to update user');
      }

      const updated = await getAdminUserById(params.id);
      if (!updated) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'User not found');
      }

      return updated;
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: userIdParamsSchema,
      body: updateUserBodySchema,
      response: {
        200: updateUserResponseSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
      },
      detail: {
        tags: ['Users'],
        summary: 'Update user name or role',
        description: 'Updates user profile fields. Requires super_admin role.',
      },
    },
  )
  .delete(
    '/api/v1/users/:id',
    async ({ params, request, set, log }) => {
      const existing = await getAdminUserById(params.id);
      if (!existing) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'User not found');
      }

      try {
        await auth.api.removeUser({
          body: { userId: params.id },
          headers: request.headers,
        });
      } catch (error) {
        log.error({ err: error, userId: params.id }, 'failed to delete user');
        set.status = 400;
        return errorResponse('DELETE_FAILED', 'Failed to delete user');
      }

      return { success: true as const };
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: userIdParamsSchema,
      response: {
        200: successResponseSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
      },
      detail: {
        tags: ['Users'],
        summary: 'Delete a user',
        description: 'Permanently deletes a user. Requires super_admin role.',
      },
    },
  )
  .post(
    '/api/v1/users/:id/ban',
    async ({ params, body, request, set, log, user }) => {
      if (params.id === user.id) {
        set.status = 400;
        return errorResponse('SELF_BAN_FORBIDDEN', 'Cannot ban yourself');
      }

      const existing = await getAdminUserById(params.id);
      if (!existing) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'User not found');
      }

      try {
        await auth.api.banUser({
          body: {
            userId: params.id,
            banReason: body.banReason,
          },
          headers: request.headers,
        });
      } catch (error) {
        log.error({ err: error, userId: params.id }, 'failed to ban user');
        set.status = 400;
        return errorResponse('BAN_FAILED', 'Failed to ban user');
      }

      const updated = await getAdminUserById(params.id);
      if (!updated) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'User not found');
      }

      return updated;
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: userIdParamsSchema,
      body: banUserBodySchema,
      response: {
        200: updateUserResponseSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
      },
      detail: {
        tags: ['Users'],
        summary: 'Ban a user',
        description:
          'Bans a user and revokes their sessions. Requires super_admin role.',
      },
    },
  )
  .post(
    '/api/v1/users/:id/unban',
    async ({ params, request, set, log }) => {
      const existing = await getAdminUserById(params.id);
      if (!existing) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'User not found');
      }

      try {
        await auth.api.unbanUser({
          body: { userId: params.id },
          headers: request.headers,
        });
      } catch (error) {
        log.error({ err: error, userId: params.id }, 'failed to unban user');
        set.status = 400;
        return errorResponse('UNBAN_FAILED', 'Failed to unban user');
      }

      const updated = await getAdminUserById(params.id);
      if (!updated) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'User not found');
      }

      return updated;
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: userIdParamsSchema,
      response: {
        200: updateUserResponseSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
      },
      detail: {
        tags: ['Users'],
        summary: 'Unban a user',
        description: 'Removes a user ban. Requires super_admin role.',
      },
    },
  )
  .post(
    '/api/v1/users/:id/revoke-sessions',
    async ({ params, request, set, log }) => {
      const existing = await getAdminUserById(params.id);
      if (!existing) {
        set.status = 404;
        return errorResponse('NOT_FOUND', 'User not found');
      }

      try {
        await auth.api.revokeUserSessions({
          body: { userId: params.id },
          headers: request.headers,
        });
      } catch (error) {
        log.error(
          { err: error, userId: params.id },
          'failed to revoke user sessions',
        );
        set.status = 400;
        return errorResponse('REVOKE_FAILED', 'Failed to revoke user sessions');
      }

      return { success: true as const };
    },
    {
      auth: SUPER_ADMIN_ROLE,
      params: userIdParamsSchema,
      response: {
        200: successResponseSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
      },
      detail: {
        tags: ['Users'],
        summary: 'Revoke all sessions for a user',
        description:
          'Revokes every active session for the user. Requires super_admin role.',
      },
    },
  );

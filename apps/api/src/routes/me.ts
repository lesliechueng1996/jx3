import { Elysia } from 'elysia';
import { authMacro } from '../middleware/auth-macro';
import { errorSchema } from '../schemas/common';
import { meResponseSchema, toMeResponse } from '../schemas/user';

export const meRoute = new Elysia({ name: 'me-routes' })
  .use(authMacro)
  .get('/api/v1/me', ({ user }) => toMeResponse(user), {
    auth: true,
    response: {
      200: meResponseSchema,
      401: errorSchema,
    },
    detail: {
      tags: ['User'],
      summary: 'Get current authenticated user',
      description:
        'Returns the profile of the currently signed-in user. 401 if not authenticated.',
    },
  });

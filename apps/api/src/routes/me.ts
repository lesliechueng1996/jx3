import { Elysia } from 'elysia';
import { toMeResponse } from '../schemas/user';

export const meRoute = new Elysia().get(
  '/api/v1/me',
  ({ user }) => toMeResponse(user),
  {
    auth: true,
    detail: {
      tags: ['User'],
      summary: 'Get current authenticated user',
      description:
        'Returns the profile of the currently signed-in user. 401 if not authenticated.',
    },
  },
);

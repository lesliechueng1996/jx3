import { Elysia } from 'elysia';
import { auth } from '../lib/auth';
import { errorResponse } from '../schemas/common';

export const authMacro = new Elysia({ name: 'auth-macro' }).macro({
  auth: {
    async resolve({ status, request: { headers } }) {
      const result = await auth.api.getSession({ headers });
      if (!result) {
        return status(
          401,
          errorResponse('UNAUTHORIZED', 'Authentication required'),
        );
      }
      return { user: result.user, session: result.session };
    },
  },
});

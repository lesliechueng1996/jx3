import { hasRole } from '@jx3/auth/roles';
import { createLogger } from '@jx3/logger';
import { Elysia } from 'elysia';
import { auth } from '../lib/auth';
import { errorResponse } from '../schemas/common';
import type { UserLike } from '../schemas/user';

const log = createLogger('auth-macro');

type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export type AuthContext = {
  user: UserLike;
  session: AuthSession['session'];
};

export const authMacro = new Elysia({ name: 'auth-macro' }).macro(
  'auth',
  (requiredRole?: string | boolean) => ({
    seed: typeof requiredRole === 'string' ? requiredRole : undefined,
    async resolve({ status, request: { headers } }) {
      const result = await auth.api.getSession({ headers });
      if (!result) {
        log.warn('authentication failed: no session');
        return status(
          401,
          errorResponse('UNAUTHORIZED', 'Authentication required'),
        );
      }

      log.debug(
        { userId: result.user.id, sessionId: result.session.id },
        'session resolved',
      );

      const user = result.user as UserLike;

      if (
        typeof requiredRole === 'string' &&
        !hasRole(user.role, requiredRole)
      ) {
        log.warn(
          { userId: user.id, role: user.role, requiredRole },
          'authorization failed: insufficient role',
        );
        return status(
          403,
          errorResponse('FORBIDDEN', 'Insufficient permissions'),
        );
      }

      if (typeof requiredRole === 'string') {
        log.debug(
          { userId: user.id, role: user.role, requiredRole },
          'role check passed',
        );
      }

      return {
        user,
        session: result.session,
      };
    },
  }),
);

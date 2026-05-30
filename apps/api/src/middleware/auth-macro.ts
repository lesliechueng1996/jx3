import { Elysia } from 'elysia';
import { errorResponse } from '../schemas/common';

interface SessionResult {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    role?: string | null;
    createdAt: Date;
  };
  session: { id: string };
}

type GetSession = (headers: Headers) => Promise<SessionResult | null>;

export const authMacro = (getSession: GetSession) =>
  new Elysia({ name: 'auth-macro' }).macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const result = await getSession(headers);
        if (!result) {
          return status(401, errorResponse('UNAUTHORIZED', 'Authentication required'));
        }
        return { user: result.user, session: result.session };
      },
    },
  });

import { createAuthClient } from 'better-auth/client';
import { adminClient } from 'better-auth/client/plugins';
import { ac, authRoles } from './permissions';

const DEFAULT_AUTH_BASE_URL = 'http://localhost:3000';

function resolveAuthBaseURL(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return process.env.BETTER_AUTH_URL ?? DEFAULT_AUTH_BASE_URL;
}

export const authClient = createAuthClient({
  baseURL: resolveAuthBaseURL(),
  basePath: '/api/auth',
  plugins: [
    adminClient({
      ac,
      roles: authRoles,
    }),
  ],
  fetchOptions: {
    onSuccess: (ctx) => {
      const token = ctx.response.headers.get('set-auth-token');
      if (token && typeof localStorage !== 'undefined') {
        localStorage.setItem('bearer_token', token);
      }
    },
  },
});

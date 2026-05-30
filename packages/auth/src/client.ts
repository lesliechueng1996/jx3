import { createAuthClient } from 'better-auth/client';
import { adminClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  basePath: '/api/auth',
  plugins: [adminClient()],
  fetchOptions: {
    onSuccess: (ctx) => {
      const token = ctx.response.headers.get('set-auth-token');
      if (token && typeof localStorage !== 'undefined') {
        localStorage.setItem('bearer_token', token);
      }
    },
  },
});

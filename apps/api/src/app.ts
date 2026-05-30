import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import type { Auth } from '@jx3/auth';
import { Elysia } from 'elysia';
import { authMacro } from './middleware/auth-macro';
import { meRoute } from './routes/me';

export interface AppDeps {
  auth: Pick<Auth, 'handler' | 'api'>;
}

export const createApp = ({ auth }: AppDeps) =>
  new Elysia()
    .use(
      cors({
        origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
      }),
    )
    .use(
      swagger({
        path: '/swagger',
        documentation: {
          info: { title: 'JX3 API', version: '1.0.0' },
          tags: [
            { name: 'User', description: 'User resources' },
            {
              name: 'Auth',
              description: 'Better Auth native routes (RPC-style exception)',
            },
          ],
        },
      }),
    )
    .all('/api/auth/*', ({ request }) => auth.handler(request))
    .use(authMacro((headers) => auth.api.getSession({ headers })))
    .use(meRoute);

export type App = ReturnType<typeof createApp>;

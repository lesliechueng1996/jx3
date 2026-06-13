import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';
import { auth } from './lib/auth';
import { authMacro } from './middleware/auth-macro';
import { loggerPlugin } from './plugins/logger';
import { dungeonsAdminRoute } from './routes/dungeons-admin';
import { expansionsAdminRoute } from './routes/expansions-admin';
import { gameServersAdminRoute } from './routes/game-servers-admin';
import { kungfuAdminRoute } from './routes/kungfu-admin';
import { meRoute } from './routes/me';
import { raidRunsRoute } from './routes/raid-runs';
import { schoolsAdminRoute } from './routes/schools-admin';
import { seasonsAdminRoute } from './routes/seasons-admin';
import { uploadsRoute } from './routes/uploads';
import { usersAdminRoute } from './routes/users-admin';

export const createApp = () =>
  new Elysia()
    .use(loggerPlugin)
    .use(
      cors({
        origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
            { name: 'Users', description: 'Super admin user management' },
            { name: 'Schools', description: 'Super admin school management' },
            { name: 'Kungfu', description: 'Super admin kungfu management' },
            {
              name: 'GameServers',
              description: 'Super admin game server management',
            },
            {
              name: 'Expansions',
              description: 'Super admin game expansion management',
            },
            {
              name: 'Dungeons',
              description: 'Super admin dungeon management',
            },
            {
              name: 'Raids',
              description: 'Raid run creation and management',
            },
            { name: 'Uploads', description: 'File upload resources' },
            {
              name: 'Auth',
              description: 'Better Auth native routes (RPC-style exception)',
            },
          ],
        },
      }),
    )
    .all('/api/auth/*', ({ request }) => auth.handler(request))
    .use(authMacro)
    .use(meRoute)
    .use(uploadsRoute)
    .use(usersAdminRoute)
    .use(schoolsAdminRoute)
    .use(kungfuAdminRoute)
    .use(gameServersAdminRoute)
    .use(expansionsAdminRoute)
    .use(seasonsAdminRoute)
    .use(dungeonsAdminRoute)
    .use(raidRunsRoute);

export type App = ReturnType<typeof createApp>;

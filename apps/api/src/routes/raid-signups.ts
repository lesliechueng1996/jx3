import { Elysia, t } from 'elysia';
import { authMacro } from '../middleware/auth-macro';
import { loggerPlugin } from '../plugins/logger';
import {
  searchRaidSignupsQuerySchema,
  searchRaidSignupsResponseSchema,
} from '../schemas/raid-signups';
import { searchRaidSignups } from '../services/raid-signups';

export const raidSignupsRoute = new Elysia({ name: 'raid-signups-routes' })
  .use(loggerPlugin)
  .use(authMacro)
  .get(
    '/api/v1/raid-signups/search',
    async ({ query }) => searchRaidSignups(query.q),
    {
      auth: true,
      query: searchRaidSignupsQuerySchema,
      response: {
        200: searchRaidSignupsResponseSchema,
        401: t.Any(),
      },
      detail: {
        tags: ['Raids'],
        summary: 'Search historical raid signups',
        description:
          'Fuzzy-searches historical raid signups by character name and returns recent matches with server and kungfu attributes. Requires authentication.',
      },
    },
  );

import { Elysia, t } from 'elysia';
import { authMacro } from '../middleware/auth-macro';
import { loggerPlugin } from '../plugins/logger';
import { errorResponse } from '../schemas/common';
import {
  createRaidRunBodySchema,
  listMyRaidRunsQuerySchema,
  listMyRaidRunsResponseSchema,
  patchRaidRunBodySchema,
  publishRaidRunBodySchema,
  raidRunResponseSchema,
} from '../schemas/raid-runs';
import {
  createRaidRunDraft,
  getRaidRunDraft,
  listMyRaidRuns,
  patchRaidRunDraft,
  publishRaidRun,
  RaidRunConflictError,
  RaidRunForbiddenError,
  RaidRunValidationError,
} from '../services/raid-runs';

const raidRunIdParamsSchema = t.Object({
  id: t.String(),
});

export const raidRunsRoute = new Elysia({ name: 'raid-runs-routes' })
  .use(loggerPlugin)
  .use(authMacro)
  .post(
    '/api/v1/raid-runs',
    async ({ body, user, set, log }) => {
      try {
        const created = await createRaidRunDraft(user.id, body);
        set.status = 201;
        return created;
      } catch (error) {
        if (error instanceof RaidRunValidationError) {
          set.status = 400;
          return errorResponse('VALIDATION_FAILED', error.message);
        }
        log.error({ err: error }, 'failed to create raid run draft');
        set.status = 400;
        return errorResponse('CREATE_FAILED', 'Failed to create raid run');
      }
    },
    {
      auth: true,
      body: createRaidRunBodySchema,
      response: {
        201: raidRunResponseSchema,
        400: t.Any(),
        401: t.Any(),
      },
      detail: {
        tags: ['Raids'],
        summary: 'Create a raid run draft',
        description:
          'Creates a pending raid run with 25 signup slots. Requires authentication.',
      },
    },
  )
  .get(
    '/api/v1/raid-runs/mine',
    async ({ query, user }) => {
      return listMyRaidRuns(user.id, query.filter);
    },
    {
      auth: true,
      query: listMyRaidRunsQuerySchema,
      response: {
        200: listMyRaidRunsResponseSchema,
        401: t.Any(),
      },
      detail: {
        tags: ['Raids'],
        summary: 'List my raid runs',
        description:
          'Returns raid runs the current user created or joined, filtered by participation role.',
      },
    },
  )
  .get(
    '/api/v1/raid-runs/:id',
    async ({ params, user, set }) => {
      try {
        const raidRun = await getRaidRunDraft(params.id, user.id);
        if (!raidRun) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Raid run not found');
        }
        return raidRun;
      } catch (error) {
        if (error instanceof RaidRunForbiddenError) {
          set.status = 403;
          return errorResponse('FORBIDDEN', error.message);
        }
        throw error;
      }
    },
    {
      auth: true,
      params: raidRunIdParamsSchema,
      response: {
        200: raidRunResponseSchema,
        401: t.Any(),
        403: t.Any(),
        404: t.Any(),
      },
      detail: {
        tags: ['Raids'],
        summary: 'Get a raid run draft',
        description:
          'Returns a raid run and its signups. Only the creator can access it.',
      },
    },
  )
  .patch(
    '/api/v1/raid-runs/:id',
    async ({ params, body, user, set, log }) => {
      try {
        const updated = await patchRaidRunDraft(params.id, user.id, body);
        if (!updated) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Raid run not found');
        }
        return updated;
      } catch (error) {
        if (error instanceof RaidRunForbiddenError) {
          set.status = 403;
          return errorResponse('FORBIDDEN', error.message);
        }
        if (error instanceof RaidRunConflictError) {
          set.status = 409;
          return errorResponse('CONFLICT', error.message);
        }
        if (error instanceof RaidRunValidationError) {
          set.status = 400;
          return errorResponse('VALIDATION_FAILED', error.message);
        }
        log.error(
          { err: error, raidRunId: params.id },
          'failed to patch raid run draft',
        );
        set.status = 400;
        return errorResponse('UPDATE_FAILED', 'Failed to update raid run');
      }
    },
    {
      auth: true,
      params: raidRunIdParamsSchema,
      body: patchRaidRunBodySchema,
      response: {
        200: raidRunResponseSchema,
        400: t.Any(),
        401: t.Any(),
        403: t.Any(),
        404: t.Any(),
        409: t.Any(),
      },
      detail: {
        tags: ['Raids'],
        summary: 'Update a raid run draft',
        description:
          'Updates a raid run owned by the creator. Pending drafts use draft validation; recruiting and ongoing runs use publish validation.',
      },
    },
  )
  .post(
    '/api/v1/raid-runs/:id/publish',
    async ({ params, user, set, log }) => {
      try {
        const published = await publishRaidRun(params.id, user.id);
        if (!published) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Raid run not found');
        }
        return published;
      } catch (error) {
        if (error instanceof RaidRunForbiddenError) {
          set.status = 403;
          return errorResponse('FORBIDDEN', error.message);
        }
        if (error instanceof RaidRunConflictError) {
          set.status = 409;
          return errorResponse('CONFLICT', error.message);
        }
        if (error instanceof RaidRunValidationError) {
          set.status = 400;
          return errorResponse('VALIDATION_FAILED', error.message);
        }
        log.error(
          { err: error, raidRunId: params.id },
          'failed to publish raid run',
        );
        set.status = 400;
        return errorResponse('PUBLISH_FAILED', 'Failed to publish raid run');
      }
    },
    {
      auth: true,
      params: raidRunIdParamsSchema,
      body: publishRaidRunBodySchema,
      response: {
        200: raidRunResponseSchema,
        400: t.Any(),
        401: t.Any(),
        403: t.Any(),
        404: t.Any(),
        409: t.Any(),
      },
      detail: {
        tags: ['Raids'],
        summary: 'Publish a raid run',
        description:
          'Validates and publishes a pending raid run to recruiting status.',
      },
    },
  );

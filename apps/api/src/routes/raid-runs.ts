import { Elysia, t } from 'elysia';
import { authMacro } from '../middleware/auth-macro';
import { loggerPlugin } from '../plugins/logger';
import { errorResponse, errorSchema } from '../schemas/common';
import {
  createRaidLootBodySchema,
  patchRaidLootBodySchema,
  patchRaidRunGameRaidIdBodySchema,
  patchRaidRunWageBodySchema,
  raidLootItemSchema,
  raidRunGameRaidIdResponseSchema,
  raidRunWageResponseSchema,
} from '../schemas/raid-loot';
import {
  createRaidRunBodySchema,
  duplicateRaidRunBodySchema,
  listMyRaidRunsQuerySchema,
  listMyRaidRunsResponseSchema,
  patchRaidRunBodySchema,
  patchRaidRunStatusBodySchema,
  publishRaidRunBodySchema,
  raidRunResponseSchema,
} from '../schemas/raid-runs';
import {
  createRaidLoot,
  deleteRaidLoot,
  patchRaidLoot,
  patchRaidRunGameRaidId,
  patchRaidRunWage,
} from '../services/raid-loot';
import {
  createRaidRunDraft,
  duplicateRaidRun,
  getRaidRunDraft,
  listMyRaidRuns,
  patchRaidRunDraft,
  publishRaidRun,
  RaidRunConflictError,
  RaidRunForbiddenError,
  RaidRunValidationError,
  updateRaidRunStatus,
} from '../services/raid-runs';

const raidRunIdParamsSchema = t.Object({
  id: t.String(),
});

const raidLootParamsSchema = t.Object({
  id: t.String(),
  lootId: t.String(),
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
        400: errorSchema,
        401: errorSchema,
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
        401: errorSchema,
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
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
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
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
        409: errorSchema,
      },
      detail: {
        tags: ['Raids'],
        summary: 'Update a raid run draft',
        description:
          'Updates a raid run owned by the creator. Pending drafts use draft validation; recruiting and ongoing runs use publish validation.',
      },
    },
  )
  .patch(
    '/api/v1/raid-runs/:id/status',
    async ({ params, body, user, set, log }) => {
      try {
        const updated = await updateRaidRunStatus(
          params.id,
          user.id,
          body.status,
        );
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
          { err: error, raidRunId: params.id, status: body.status },
          'failed to update raid run status',
        );
        set.status = 400;
        return errorResponse(
          'UPDATE_FAILED',
          'Failed to update raid run status',
        );
      }
    },
    {
      auth: true,
      params: raidRunIdParamsSchema,
      body: patchRaidRunStatusBodySchema,
      response: {
        200: raidRunResponseSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
        409: errorSchema,
      },
      detail: {
        tags: ['Raids'],
        summary: 'Update raid run status',
        description:
          'Transitions a raid run through pending → recruiting → ongoing → completed, or cancels it from any non-terminal state. Only the creator can update status.',
      },
    },
  )
  .post(
    '/api/v1/raid-runs/:id/duplicate',
    async ({ params, user, set, log }) => {
      try {
        const duplicated = await duplicateRaidRun(params.id, user.id);
        if (!duplicated) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Raid run not found');
        }
        set.status = 201;
        return duplicated;
      } catch (error) {
        if (error instanceof RaidRunForbiddenError) {
          set.status = 403;
          return errorResponse('FORBIDDEN', error.message);
        }
        if (error instanceof RaidRunValidationError) {
          set.status = 400;
          return errorResponse('VALIDATION_FAILED', error.message);
        }
        log.error(
          { err: error, raidRunId: params.id },
          'failed to duplicate raid run',
        );
        set.status = 400;
        return errorResponse(
          'DUPLICATE_FAILED',
          'Failed to duplicate raid run',
        );
      }
    },
    {
      auth: true,
      params: raidRunIdParamsSchema,
      body: duplicateRaidRunBodySchema,
      response: {
        201: raidRunResponseSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
      },
      detail: {
        tags: ['Raids'],
        summary: 'Duplicate a raid run',
        description:
          'Creates a pending copy of a raid run and its signups. Only the creator can duplicate. gameRaidId, totalIncome, and wagePerPerson are not copied.',
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
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
        409: errorSchema,
      },
      detail: {
        tags: ['Raids'],
        summary: 'Publish a raid run',
        description:
          'Validates and publishes a pending raid run to recruiting status.',
      },
    },
  )
  .post(
    '/api/v1/raid-runs/:id/loot',
    async ({ params, body, user, set, log }) => {
      try {
        const created = await createRaidLoot(params.id, user.id, body);
        if (!created) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Raid run not found');
        }
        set.status = 201;
        return created;
      } catch (error) {
        if (error instanceof RaidRunForbiddenError) {
          set.status = 403;
          return errorResponse('FORBIDDEN', error.message);
        }
        if (error instanceof RaidRunConflictError) {
          set.status = 409;
          return errorResponse('CONFLICT', error.message);
        }
        log.error(
          { err: error, raidRunId: params.id },
          'failed to create raid loot',
        );
        set.status = 400;
        return errorResponse('CREATE_FAILED', 'Failed to create raid loot');
      }
    },
    {
      auth: true,
      params: raidRunIdParamsSchema,
      body: createRaidLootBodySchema,
      response: {
        201: raidLootItemSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
        409: errorSchema,
      },
      detail: {
        tags: ['Raids'],
        summary: 'Add raid loot',
        description:
          'Records loot for an ongoing or completed raid run. Only the creator can add loot.',
      },
    },
  )
  .patch(
    '/api/v1/raid-runs/:id/loot/:lootId',
    async ({ params, body, user, set, log }) => {
      try {
        const updated = await patchRaidLoot(
          params.id,
          params.lootId,
          user.id,
          body,
        );
        if (!updated) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Raid loot not found');
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
        log.error(
          { err: error, raidRunId: params.id, lootId: params.lootId },
          'failed to patch raid loot',
        );
        set.status = 400;
        return errorResponse('UPDATE_FAILED', 'Failed to update raid loot');
      }
    },
    {
      auth: true,
      params: raidLootParamsSchema,
      body: patchRaidLootBodySchema,
      response: {
        200: raidLootItemSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
        409: errorSchema,
      },
      detail: {
        tags: ['Raids'],
        summary: 'Update raid loot',
        description:
          'Updates loot details such as winner or price for an ongoing or completed raid run.',
      },
    },
  )
  .delete(
    '/api/v1/raid-runs/:id/loot/:lootId',
    async ({ params, user, set, log }) => {
      try {
        const deleted = await deleteRaidLoot(params.id, params.lootId, user.id);
        if (!deleted) {
          set.status = 404;
          return errorResponse('NOT_FOUND', 'Raid loot not found');
        }
        set.status = 204;
        return null;
      } catch (error) {
        if (error instanceof RaidRunForbiddenError) {
          set.status = 403;
          return errorResponse('FORBIDDEN', error.message);
        }
        if (error instanceof RaidRunConflictError) {
          set.status = 409;
          return errorResponse('CONFLICT', error.message);
        }
        log.error(
          { err: error, raidRunId: params.id, lootId: params.lootId },
          'failed to delete raid loot',
        );
        set.status = 400;
        return errorResponse('DELETE_FAILED', 'Failed to delete raid loot');
      }
    },
    {
      auth: true,
      params: raidLootParamsSchema,
      response: {
        204: t.Null(),
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
        409: errorSchema,
      },
      detail: {
        tags: ['Raids'],
        summary: 'Delete raid loot',
        description:
          'Removes a loot record from an ongoing or completed raid run.',
      },
    },
  )
  .patch(
    '/api/v1/raid-runs/:id/wage',
    async ({ params, body, user, set, log }) => {
      try {
        const updated = await patchRaidRunWage(params.id, user.id, body);
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
        log.error(
          { err: error, raidRunId: params.id },
          'failed to patch raid run wage',
        );
        set.status = 400;
        return errorResponse('UPDATE_FAILED', 'Failed to update raid run wage');
      }
    },
    {
      auth: true,
      params: raidRunIdParamsSchema,
      body: patchRaidRunWageBodySchema,
      response: {
        200: raidRunWageResponseSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
        409: errorSchema,
      },
      detail: {
        tags: ['Raids'],
        summary: 'Record raid run wage',
        description:
          'Updates total income and wage per person for an ongoing or completed raid run.',
      },
    },
  )
  .patch(
    '/api/v1/raid-runs/:id/game-raid-id',
    async ({ params, body, user, set, log }) => {
      try {
        const updated = await patchRaidRunGameRaidId(params.id, user.id, body);
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
        log.error(
          { err: error, raidRunId: params.id },
          'failed to patch raid run game raid id',
        );
        set.status = 400;
        return errorResponse(
          'UPDATE_FAILED',
          'Failed to update raid run game raid id',
        );
      }
    },
    {
      auth: true,
      params: raidRunIdParamsSchema,
      body: patchRaidRunGameRaidIdBodySchema,
      response: {
        200: raidRunGameRaidIdResponseSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
        409: errorSchema,
      },
      detail: {
        tags: ['Raids'],
        summary: 'Record in-game raid id',
        description:
          'Updates the in-game raid team id for an ongoing or completed raid run.',
      },
    },
  );

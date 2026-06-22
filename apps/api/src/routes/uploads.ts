import { SUPER_ADMIN_ROLE } from '@jx3/auth/roles';
import { Elysia, t } from 'elysia';
import {
  UploadStorageError,
  UploadValidationError,
  uploadFile,
} from '../lib/storage';
import { authMacro } from '../middleware/auth-macro';
import { loggerPlugin } from '../plugins/logger';
import { errorResponse, errorSchema } from '../schemas/common';
import { uploadResponseSchema } from '../schemas/upload';

export const uploadsRoute = new Elysia({ name: 'uploads-routes' })
  .use(loggerPlugin)
  .use(authMacro)
  .post(
    '/api/v1/uploads',
    async ({ body, log, set }) => {
      try {
        return await uploadFile({
          file: body.file,
          folder: body.folder,
        });
      } catch (error) {
        if (error instanceof UploadValidationError) {
          set.status = 400;
          return errorResponse('VALIDATION_ERROR', error.message);
        }

        if (error instanceof UploadStorageError) {
          log.error({ err: error }, 'storage upload failed');
          set.status = 500;
          return errorResponse('UPLOAD_FAILED', 'Failed to upload file');
        }

        throw error;
      }
    },
    {
      auth: SUPER_ADMIN_ROLE,
      body: t.Object({
        file: t.File({
          maxSize: '5m',
        }),
        folder: t.Optional(t.Union([t.Literal('icons'), t.Literal('uploads')])),
      }),
      response: {
        200: uploadResponseSchema,
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        500: errorSchema,
      },
      detail: {
        tags: ['Uploads'],
        summary: 'Upload a public image file',
        description:
          'Uploads an image to Supabase public storage. Requires super_admin role. Returns the public URL for use in business resources.',
      },
    },
  );

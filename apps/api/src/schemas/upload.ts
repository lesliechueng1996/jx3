import { z } from 'zod';

export const uploadFolderSchema = z.enum(['icons', 'uploads']);

export type UploadFolder = z.infer<typeof uploadFolderSchema>;

export const uploadResponseSchema = z.object({
  url: z.string().url(),
  path: z.string(),
  contentType: z.string(),
  size: z.number().int().nonnegative(),
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;

export const DEFAULT_UPLOAD_FOLDER: UploadFolder = 'uploads';

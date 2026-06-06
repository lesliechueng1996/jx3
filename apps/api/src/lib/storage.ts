import type { SupabaseClient } from '@supabase/supabase-js';
import {
  DEFAULT_UPLOAD_FOLDER,
  type UploadFolder,
  uploadFolderSchema,
} from '../schemas/upload';
import { getStorageBucket, getSupabaseClient } from './supabase';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

export const extensionFromMime = (mimeType: string): string | null =>
  MIME_TO_EXT[mimeType] ?? null;

export const buildObjectPath = (
  folder: UploadFolder,
  filename: string,
): string => `${folder}/${filename}`;

export const resolveUploadFolder = (
  folder: string | undefined,
): UploadFolder => {
  const parsed = uploadFolderSchema.safeParse(folder ?? DEFAULT_UPLOAD_FOLDER);
  if (!parsed.success) {
    throw new UploadValidationError('Invalid upload folder');
  }
  return parsed.data;
};

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadValidationError';
  }
}

export class UploadStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadStorageError';
  }
}

export interface UploadFileInput {
  file: File;
  folder?: string;
  supabase?: SupabaseClient;
  bucket?: string;
}

export const uploadFile = async ({
  file,
  folder,
  supabase = getSupabaseClient(),
  bucket = getStorageBucket(),
}: UploadFileInput) => {
  const uploadFolder = resolveUploadFolder(folder);
  const extension = extensionFromMime(file.type);

  if (!extension) {
    throw new UploadValidationError('Unsupported image type');
  }

  const objectPath = buildObjectPath(
    uploadFolder,
    `${crypto.randomUUID()}.${extension}`,
  );

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(bucket)
    .upload(objectPath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new UploadStorageError(error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);

  return {
    url: data.publicUrl,
    path: objectPath,
    contentType: file.type,
    size: file.size,
  };
};

import { describe, expect, it } from 'bun:test';
import {
  buildObjectPath,
  extensionFromMime,
  resolveUploadFolder,
  UploadValidationError,
} from '../../src/lib/storage';
import { DEFAULT_UPLOAD_FOLDER } from '../../src/schemas/upload';

describe('extensionFromMime', () => {
  it('maps supported image mime types', () => {
    expect(extensionFromMime('image/png')).toBe('png');
    expect(extensionFromMime('image/jpeg')).toBe('jpg');
  });

  it('returns null for unsupported mime types', () => {
    expect(extensionFromMime('application/pdf')).toBeNull();
  });
});

describe('buildObjectPath', () => {
  it('joins folder and filename', () => {
    expect(buildObjectPath('icons', 'abc.png')).toBe('icons/abc.png');
  });
});

describe('resolveUploadFolder', () => {
  it('defaults to uploads', () => {
    expect(resolveUploadFolder(undefined)).toBe(DEFAULT_UPLOAD_FOLDER);
  });

  it('accepts allowed folders', () => {
    expect(resolveUploadFolder('icons')).toBe('icons');
  });

  it('rejects invalid folders', () => {
    expect(() => resolveUploadFolder('../secrets')).toThrow(
      UploadValidationError,
    );
  });
});

describe('uploadFile', () => {
  it('uploads to supabase and returns public url', async () => {
    const { uploadFile } = await import('../../src/lib/storage');
    const file = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47])],
      'test.png',
      {
        type: 'image/png',
      },
    );

    const supabase = {
      storage: {
        from: (_bucket: string) => ({
          upload: async () => ({ error: null }),
          getPublicUrl: (path: string) => ({
            data: {
              publicUrl: `https://example.supabase.co/public/${path}`,
            },
          }),
        }),
      },
    };

    const result = await uploadFile({
      file,
      folder: 'icons',
      supabase: supabase as never,
      bucket: 'assets',
    });

    expect(result.contentType).toBe('image/png');
    expect(result.size).toBe(file.size);
    expect(result.path.startsWith('icons/')).toBe(true);
    expect(result.url).toContain('icons/');
  });
});

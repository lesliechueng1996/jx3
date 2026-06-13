import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, mock } from 'bun:test';
import {
  SUPER_ADMIN_ROLE,
  USER_ROLE,
  type AppRole,
} from '@jx3/auth/roles';
import { Elysia } from 'elysia';

const user: {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: AppRole;
  createdAt: Date;
} = {
  id: 'u1',
  name: 'Admin',
  email: 'admin@example.com',
  emailVerified: true,
  role: SUPER_ADMIN_ROLE,
  createdAt: new Date(),
};

let mockSession: { user: typeof user; session: { id: string } } | null = null;

mock.module('../../src/lib/auth', () => ({
  auth: {
    api: {
      getSession: async () => mockSession,
    },
  },
}));

const { authMacro } = await import('../../src/middleware/auth-macro');
const { uploadsRoute } = await import('../../src/routes/uploads');
const {
  setSupabaseClientForTests,
  resetSupabaseClientForTests,
} = await import('../../src/lib/supabase');
const { UploadStorageError, UploadValidationError } = await import(
  '../../src/lib/storage'
);

const makeApp = () => new Elysia().use(authMacro).use(uploadsRoute);

const tempDir = mkdtempSync(join(tmpdir(), 'jx3-upload-test-'));
const pngPath = join(tempDir, 'test.png');
writeFileSync(pngPath, Buffer.alloc(128, 1));

const postUpload = (folder?: string) => {
  const form = new FormData();
  form.append('file', Bun.file(pngPath));
  if (folder) {
    form.append('folder', folder);
  }
  return makeApp().handle(
    new Request('http://localhost/api/v1/uploads', {
      method: 'POST',
      body: form,
    }),
  );
};

const createMockSupabase = (uploadError: string | null = null) => ({
  storage: {
    from: (_bucket: string) => ({
      upload: async () =>
        uploadError ? { error: { message: uploadError } } : { error: null },
      getPublicUrl: (path: string) => ({
        data: {
          publicUrl: `https://example.supabase.co/storage/v1/object/public/assets/${path}`,
        },
      }),
    }),
  },
});

describe('uploadsRoute', () => {
  beforeEach(() => {
    mockSession = null;
    user.role = SUPER_ADMIN_ROLE;
    resetSupabaseClientForTests();
    setSupabaseClientForTests(createMockSupabase() as never);
  });

  it('returns 401 without session', async () => {
    const res = await postUpload();
    expect(res.status).toBe(401);
  });

  it('returns 403 for non super_admin users', async () => {
    user.role = USER_ROLE;
    mockSession = { user, session: { id: 's1' } };
    const res = await postUpload();
    expect(res.status).toBe(403);
  });

  it('uploads file for super_admin users', async () => {
    mockSession = { user, session: { id: 's1' } };
    const res = await postUpload('icons');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contentType).toBe('image/png');
    expect(body.path.startsWith('icons/')).toBe(true);
    expect(body.url).toContain('/assets/icons/');
  });

  it('returns 400 for unsupported image types', async () => {
    mockSession = { user, session: { id: 's1' } };
    const txtPath = join(tempDir, 'test.txt');
    writeFileSync(txtPath, 'hello');
    const form = new FormData();
    form.append('file', new File([Buffer.from('hello')], 'test.txt', {
      type: 'text/plain',
    }));

    const res = await makeApp().handle(
      new Request('http://localhost/api/v1/uploads', {
        method: 'POST',
        body: form,
      }),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: { code: 'VALIDATION_ERROR', message: 'Unsupported image type' },
    });
  });

  it('returns 500 for storage errors', async () => {
    mockSession = { user, session: { id: 's1' } };
    resetSupabaseClientForTests();
    setSupabaseClientForTests(createMockSupabase('bucket unavailable') as never);
    const res = await postUpload();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: { code: 'UPLOAD_FAILED', message: 'Failed to upload file' },
    });
  });
});

describe('upload errors', () => {
  it('uses typed validation and storage errors', () => {
    expect(new UploadValidationError('bad').name).toBe('UploadValidationError');
    expect(new UploadStorageError('bad').name).toBe('UploadStorageError');
  });
});

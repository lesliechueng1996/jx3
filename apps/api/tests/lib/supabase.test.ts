import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import type { SupabaseClient } from '@supabase/supabase-js';

const mockClient = { kind: 'supabase-client' } as unknown as SupabaseClient;
const mockCreateClient = mock(() => mockClient);

mock.module('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

const {
  createSupabaseAdminClient,
  getStorageBucket,
  getSupabaseClient,
  resetSupabaseClientForTests,
  setSupabaseClientForTests,
} = await import('../../src/lib/supabase');

const originalEnv = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET,
};

describe('supabase client helpers', () => {
  beforeEach(() => {
    mockCreateClient.mockClear();
    resetSupabaseClientForTests();
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    delete process.env.SUPABASE_STORAGE_BUCKET;
  });

  afterEach(() => {
    resetSupabaseClientForTests();
    process.env.SUPABASE_URL = originalEnv.SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY =
      originalEnv.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_STORAGE_BUCKET = originalEnv.SUPABASE_STORAGE_BUCKET;
  });

  it('throws when required env vars are missing', () => {
    delete process.env.SUPABASE_URL;

    expect(() => createSupabaseAdminClient()).toThrow(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required',
    );
  });

  it('creates an admin client with auth disabled', () => {
    const client = createSupabaseAdminClient();

    expect(client).toBe(mockClient);
    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'service-role-key',
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );
  });

  it('reuses a cached client from getSupabaseClient', () => {
    const first = getSupabaseClient();
    const second = getSupabaseClient();

    expect(first).toBe(second);
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
  });

  it('allows tests to inject and reset the cached client', () => {
    const injected = { kind: 'injected-client' } as unknown as SupabaseClient;

    setSupabaseClientForTests(injected);
    expect(getSupabaseClient()).toBe(injected);
    expect(mockCreateClient).not.toHaveBeenCalled();

    resetSupabaseClientForTests();
    expect(getSupabaseClient()).toBe(mockClient);
  });

  it('defaults storage bucket to assets', () => {
    expect(getStorageBucket()).toBe('assets');
  });

  it('reads storage bucket from env', () => {
    process.env.SUPABASE_STORAGE_BUCKET = 'uploads';

    expect(getStorageBucket()).toBe('uploads');
  });
});

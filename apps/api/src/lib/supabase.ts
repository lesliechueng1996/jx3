import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

export const createSupabaseAdminClient = (): SupabaseClient => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export const getSupabaseClient = (): SupabaseClient => {
  if (!client) {
    client = createSupabaseAdminClient();
  }
  return client;
};

export const setSupabaseClientForTests = (nextClient: SupabaseClient): void => {
  client = nextClient;
};

export const resetSupabaseClientForTests = (): void => {
  client = undefined;
};

export const getStorageBucket = (): string =>
  process.env.SUPABASE_STORAGE_BUCKET ?? 'assets';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bxnomfjjvhdtbnqvgjmh.supabase.co';

let _client: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (_client) return _client;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'Missing environment variable: SUPABASE_SERVICE_ROLE_KEY. ' +
        'Add it to .env.local (local) and Vercel Environment Variables (production).',
    );
  }

  _client = createClient(SUPABASE_URL, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _client;
}

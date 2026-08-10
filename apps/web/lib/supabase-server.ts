import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './supabase-config';

let _client: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (_client) return _client;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'Missing environment variable: SUPABASE_SERVICE_ROLE_KEY. ' +
        'آن را در apps/web/.env.local بگذارید — در توسعه روی همین دستگاه، و در پروداکشن روی سرور (/opt/billiardhub/apps/web/.env.local). deploy.sh این فایل را دست نمی‌زند.',
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

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bxnomfjjvhdtbnqvgjmh.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

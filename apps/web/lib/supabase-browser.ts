'use client'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

/* کلاینتِ سمت‌مرورگر با anon key — فقط برای Realtime (اشتراکِ کانالِ دایرکت). */
let _c: SupabaseClient | null = null
export function getSupabaseBrowser(): SupabaseClient | null {
  if (_c) return _c
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null
  _c = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 20 } },
  })
  return _c
}

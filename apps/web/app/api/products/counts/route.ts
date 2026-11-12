import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/* ── شمارِ آگهیِ فعالِ هر فروشگاه: { [storeSlug]: n } ──
   فهرستِ فروشگاه‌ها پیش‌تر ۲۰۰ آگهیِ کامل می‌گرفت تا فقط بشمارد: هم سقفِ
   ۲۰۰ِ /api/products عدد را بعد از رشدِ کاتالوگ غلط می‌کرد، هم روی موبایل
   صدها ردیفِ بی‌مصرف دانلود می‌شد. این‌جا فقط یک ستون خوانده می‌شود.
   همان شرطِ فهرستِ عمومی (status = active)، پس عدد با صفحه‌ی فروشگاه یکی است.
   خطا ⟵ ۵۰۲، نه {} — «نمی‌دانیم» با «هیچ آگهی ندارد» یکی نیست. */
const PAGE = 1000

export async function GET() {
  const supabase = getSupabaseServer()
  const counts: Record<string, number> = {}
  for (let from = 0; from < 50_000; from += PAGE) {
    const { data, error } = await supabase
      .from('products').select('storeSlug')
      .eq('status', 'active').not('storeSlug', 'is', null)
      .range(from, from + PAGE - 1)
    if (error) {
      console.error('[products/counts] failed:', error.message)
      return NextResponse.json({ message: 'شمارش آگهی‌ها ممکن نشد' }, { status: 502 })
    }
    const rows = (data ?? []) as { storeSlug: string | null }[]
    for (const r of rows) if (r.storeSlug) counts[r.storeSlug] = (counts[r.storeSlug] ?? 0) + 1
    if (rows.length < PAGE) break
  }
  return NextResponse.json(counts, { headers: { 'Cache-Control': 'public, max-age=60' } })
}

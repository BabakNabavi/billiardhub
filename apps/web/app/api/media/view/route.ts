export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getSupabaseServer } from '@/lib/supabase-server'
import { clientIp } from '@/lib/finance/db'
import { CORS } from '@/lib/social-server'

/* ─────────────────────────────────────────────────────────────
   ثبتِ بازدیدِ ویدیو.

   عمداً از کلاینت و *پس از* شروعِ واقعیِ پخش صدا زده می‌شود، نه هنگامِ
   بازشدنِ صفحه: بازکردن یعنی کنجکاوی، پخش یعنی تماشا.

   شمردنِ تکراری در خودِ دیتابیس بسته می‌شود (تابعِ `count_video_view`
   در مهاجرتِ ۰۴۹) نه این‌جا — وگرنه بینِ «آیا قبلاً دیده؟» و «یکی
   اضافه کن» یک پنجره‌ی مسابقه می‌ماند که با چند درخواستِ هم‌زمان
   دور می‌خورد.

   شناسه‌ی بیننده هشِ HMAC از IP و مرورگر است. برگشت‌ناپذیر است و
   بیرون از این تابع معنایی ندارد؛ فقط برای تشخیصِ «همان بیننده در
   چند ساعتِ اخیر» به کار می‌رود.
   ───────────────────────────────────────────────────────────── */

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

export async function POST(req: NextRequest) {
  const secret = process.env.JWT_SECRET
  if (!secret) return NextResponse.json({ ok: false }, { status: 500, headers: CORS })

  const slug = String((await req.json().catch(() => ({})))?.slug ?? '').trim()
  if (!slug) return NextResponse.json({ ok: false }, { status: 400, headers: CORS })

  const viewer = 'v_' + createHmac('sha256', secret)
    .update([clientIp(req) ?? '', req.headers.get('user-agent') ?? ''].join('|'))
    .digest('hex').slice(0, 24)

  const { data, error } = await getSupabaseServer()
    .rpc('count_video_view', { p_slug: slug, p_viewer: viewer })

  if (error) {
    console.error('[media/view]', error.message)
    return NextResponse.json({ ok: false }, { status: 500, headers: CORS })
  }
  return NextResponse.json({ ok: true, counted: Number(data) > 0 }, { headers: CORS })
}

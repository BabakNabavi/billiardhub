export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { sb } from '@/lib/finance/db'
import { hitRateLimit, tooMany } from '@/lib/auth/rate-limit'

/* ─────────────────────────────────────────────────────────────
   ثبتِ بازدیدِ خبر.

   ── چرا لازم بود ──
   ⚠️ ستونِ `views` از مهاجرتِ ۰۲۵ در جدولِ `news` وجود داشت ولی
   **هیچ‌جا زیاد نمی‌شد**. یعنی هر خبر برای همیشه صفر بازدید داشت و
   صفحه‌ی قدیمی همان صفر را با آیکنِ چشم کنارِ هر کارت نشان می‌داد.
   «پربازدیدترین‌ها» بدونِ شمارنده یا دروغ است یا نباید وجود داشته
   باشد؛ این‌جا شمارنده‌ی واقعی راه می‌افتد.

   ── محدودیتِ شناخته‌شده ──
   ⚠️ این افزایش اتمیک **نیست**: می‌خواند، یکی اضافه می‌کند، می‌نویسد.
   دو بازدیدِ هم‌زمان می‌توانند یکی حساب شوند. همان الگویی است که
   `/api/products/[id]` هم دارد. راهِ درست یک تابعِ Postgres مثلِ
   `count_video_view` (مهاجرتِ ۰۴۹) است، ولی ساختنش تغییرِ اسکیماست و
   تغییرِ اسکیما در این پروژه فقط با تأییدِ صریحِ مالک انجام می‌شود.
   کم‌شمردنِ گاه‌به‌گاه پذیرفتنی است؛ عددِ ساختگی نه.

   ⚠️ گاردِ `sessionStorage`ِ کلاینت فقط ارفاق است و با یک حلقه‌ی
   curl دور می‌خورد. چون `views` تنها کلیدِ مرتب‌سازیِ
   «پربازدیدترین‌ها» است، بدونِ محدودیتِ سروری هر کسی می‌توانست
   ترتیبِ آن فهرست را بسازد. سقف: ۳۰ ثبت از هر IP برای هر خبر در
   ساعت — دستِ خواننده‌ی واقعی را نمی‌بندد و بادکردن را می‌بندد.
   ───────────────────────────────────────────────────────────── */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { id?: unknown }
  const key = String(body.id ?? '').trim()
  if (!key || key.length > 200) return NextResponse.json({ ok: false }, { status: 400 })

  const rl = await hitRateLimit(req, { action: 'news_view', max: 30, windowSec: 3600 }, key)
  if (!rl.ok) return tooMany(rl.retryAfterSec)

  try {
    const col = UUID.test(key) ? 'id' : 'slug'
    const { data, error } = await sb()
      .from('news').select('id,views')
      .eq(col, key).eq('status', 'published').maybeSingle()

    if (error || !data) return NextResponse.json({ ok: false }, { status: 404 })

    const row = data as { id: string; views?: number | null }
    const next = Math.max(0, Math.trunc(Number(row.views) || 0)) + 1

    /* ⚠️ فقط `views` نوشته می‌شود. اگر کلِ ردیف برگردانده و دوباره
       ذخیره شود، `updated_at` هم عوض می‌شود و نشانِ «به‌روزرسانی شد»
       روی خبری می‌نشیند که فقط کسی خوانده‌اش. */
    const { error: upErr } = await sb().from('news')
      .update({ views: next }).eq('id', row.id)
    if (upErr) {
      console.error('[news/view]', upErr.message)
      return NextResponse.json({ ok: false }, { status: 500 })
    }
    return NextResponse.json({ ok: true, views: next })
  } catch (e) {
    console.error('[news/view]', (e as Error).message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

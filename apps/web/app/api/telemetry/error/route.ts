export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rpc, actorFromRequest } from '@/lib/finance/db'
import { hitRateLimit, tooMany } from '@/lib/auth/rate-limit'
import { fingerprintOf, pathOf } from '@/lib/telemetry'

/* ─────────────────────────────────────────────────────────────
   دریافتِ خطای مرورگر.

   ── چرا این مسیر ورود نمی‌خواهد ──
   بیشترِ خطاهایی که واقعا مهم‌اند سرِ کاربرِ *واردنشده* می‌افتند —
   صفحه‌ی ثبت‌نام، صفحه‌ی اول، جریانِ پرداخت. اگر این مسیر پشتِ ورود
   بود، همان‌ها را هرگز نمی‌دیدیم.

   ── و چرا خطرناک نیست ──
   ۱) سقفِ نرخ روی IP: یک مرورگر نمی‌تواند سیل راه بیندازد.
   ۲) بدنه از پیش با Zod بریده می‌شود؛ هیچ رشته‌ی بلندی وارد نمی‌شود.
   ۳) ردیف‌ها بر پایه‌ی اثرانگشت تجمیع می‌شوند، پس هزاران رخدادِ یک
      خطا یک ردیف است نه هزار ردیف.
   ۴) نوشتن با کلیدِ سرویس از راهِ تابعِ `bh_log_error` انجام می‌شود؛
      خودِ anon هیچ دسترسی‌ای به جدول ندارد.

   ⚠️ این مسیر هرگز خطا برنمی‌گرداند که به چشمِ کاربر بیاید. اگر
   ثبتِ خطا خودش شکست بخورد، سکوت می‌کند — ابزارِ پایش نباید خودش
   منبعِ خطای تازه شود.
   ───────────────────────────────────────────────────────────── */

const Body = z.object({
  message: z.string().min(1).max(2000),
  stack: z.string().max(8000).optional(),
  url: z.string().max(500).optional(),
  release: z.string().max(80).optional(),
})

export async function POST(req: NextRequest) {
  const rl = await hitRateLimit(req, { action: 'telemetry_error', max: 30, windowSec: 600 })
  if (!rl.ok) return tooMany(rl.retryAfterSec)

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  /* ورودیِ بدشکل بی‌صدا دور ریخته می‌شود: به مرورگر چیزی برای
     تلاشِ دوباره نمی‌دهیم. */
  if (!parsed.success) return NextResponse.json({ ok: true })

  const b = parsed.data
  const actor = actorFromRequest(req)
  /* ⚠️ فقط مسیر، بدونِ کوئری — دلیلش در `pathOf` */
  const url = pathOf(b.url)

  /* ⚠️ `rpc` خطا **پرتاب نمی‌کند**، برمی‌گرداند. نسخه‌ی اول فقط
     try/catch داشت و هیچ‌چیز نمی‌گرفت: اگر مهاجرتِ ۰۹۸ اجرا نشده
     بود، هر فراخوان PGRST202 می‌گرفت و این مسیر تا ابد «موفق»
     گزارش می‌داد — یعنی ابزارِ پایش بی‌صدا مرده بود. */
  const { error } = await rpc('bh_log_error', {
    p_fingerprint: fingerprintOf('client', b.message, b.stack, url),
    p_source: 'client',
    p_message: b.message,
    p_stack: b.stack ?? null,
    p_url: url || null,
    p_user_agent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
    p_user_id: actor?.id ?? null,
    p_release: b.release ?? null,
  })
  if (error) console.error('[telemetry] bh_log_error:', error.code, error.message)

  return NextResponse.json({ ok: true })
}

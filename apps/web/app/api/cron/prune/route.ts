export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { rpc } from '@/lib/finance/db';
import { cronForbidden } from '@/lib/cron-guard';

/* ─────────────────────────────────────────────────────────────
   پاک‌سازیِ دوره‌ای.

   ── چرا لازم شد ──
   دو مهاجرتِ اخیر تابعِ پاک‌سازی ساختند و هیچ‌کدام فراخوانی نداشتند
   — یعنی نگه‌داری روی کاغذ بود نه در عمل:

   • `bh_prune_otp` (۰۹۹) — جدولِ OTP **شماره‌ی موبایل خام** در ستون
     دارد. بدونِ پاک‌سازی، هر شماره‌ای که تا ابد کد گرفته در جدول،
     در WAL و در بکاپِ هر شبه می‌ماند. کدها پنج دقیقه‌ای‌اند؛
     نگه‌داشتنشان هیچ ارزشی ندارد و فقط سطحِ داده‌ی شخصی را بزرگ
     می‌کند.

   • `bh_prune_errors` (۰۹۸) — ردیفِ رسیدگی‌شده‌ی بالای سی روز.

   ⚠️ هیچ‌کدام برگشت‌ناپذیرِ معنادار نیستند: OTPِ منقضی و خطای
   بسته‌شده‌ی یک‌ماهه.

   امنیت: رازِ درست (`CRON_SECRET`) یا درخواستِ لوکال — همان گاردِ
   بقیه‌ی کرون‌ها.
   زمان‌بند: `cron-tick.sh` روی سرور.
   ───────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const bad = cronForbidden(req);
  if (bad) return NextResponse.json({ message: bad.message }, { status: bad.status });

  const out: Record<string, number | string> = {};

  /* ⚠️ هر کدام جدا: اگر یکی از مهاجرت‌ها اجرا نشده باشد، آن یکی
     نباید دیگری را هم زمین بزند. */
  for (const fn of ['bh_prune_otp', 'bh_prune_errors'] as const) {
    const { data, error } = await rpc<number>(fn, {});
    if (error) {
      out[fn] = error.code === 'PGRST202' ? 'مهاجرت اجرا نشده' : `خطا: ${error.message ?? ''}`;
      continue;
    }
    out[fn] = typeof data === 'number' ? data : 0;
  }

  return NextResponse.json({ ok: true, pruned: out });
}

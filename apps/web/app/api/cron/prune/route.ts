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

   • `bh_prune_audit` (۱۰۵) — **فقط** `LOGIN_FAILED`ِ بالای ۱۸۰ روز.
     مهاجرتِ ۱۰۴ نوشتنِ این کنش را اضافه کرد و آن تنها ردیفی است که
     مهاجم می‌تواند هر قدر بخواهد بسازد؛ بقیه‌ی ۱۲۶ کنش (مالی،
     ادمین، رزرو) در هیچ سنی پاک نمی‌شوند.

   ⚠️ هیچ‌کدام برگشت‌ناپذیرِ معنادار نیستند: OTPِ منقضی، خطای
   بسته‌شده‌ی یک‌ماهه، و تلاشِ ناموفقِ ورودِ شش‌ماهه.

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
  /* ⚠️ `bh_prune_audit` فقط `LOGIN_FAILED`ِ بالای ۱۸۰ روز را می‌برد و
     بقیه‌ی ۱۲۶ کنش را در هیچ سنی دست نمی‌زند (مهاجرتِ ۱۰۵). دلیلش این
     است که ۱۰۴ نوشتنِ LOGIN_FAILED را اضافه کرد و آن تنها ردیفی است
     که *مهاجم* می‌تواند هر قدر بخواهد بسازد. */
  for (const fn of ['bh_prune_otp', 'bh_prune_errors', 'bh_prune_audit'] as const) {
    const { data, error } = await rpc<number>(fn, {});
    if (error) {
      out[fn] = error.code === 'PGRST202' ? 'مهاجرت اجرا نشده' : `خطا: ${error.message ?? ''}`;
      continue;
    }
    out[fn] = typeof data === 'number' ? data : 0;
  }

  return NextResponse.json({ ok: true, pruned: out });
}

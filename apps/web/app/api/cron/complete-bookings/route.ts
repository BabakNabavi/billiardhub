export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { rpc, audit } from '@/lib/finance/db';
import { cronForbidden } from '@/lib/cron-guard';
import { logHandled } from '@/lib/log-handled';

/* تحویل خدمت — رزروهایی که سانسشان تمام شده COMPLETED می‌شوند و
   همان‌جا سهم باشگاه و کمیسیون پلتفرم در دفتر ثبت می‌شود.

   چرا این cron لازم است: در مدل حساب مرکزی، باشگاه لحظه‌ی *پرداخت*
   طلبکار نمی‌شود بلکه پس از *برگزاری*. بدون این اجرا، هیچ رزروی
   هرگز COMPLETED نمی‌شود و بدهی پلتفرم به باشگاه‌ها اصلا ساخته
   نمی‌شود — یعنی تسویه غیرممکن می‌ماند.

   `bh_complete_due_bookings` خودش idempotent است: رزروی که قبلا
   تکمیل شده دوباره ردیف مالی نمی‌سازد (کلید یکتای `source_key`).
   پس اجرای چندباره در یک روز بی‌خطر است.

   ⚠️⚠️ زمان‌بند کجاست: `/opt/billiardhub/cron-tick.sh` روی سرور، از
   طریق `crontab -l` کاربر root. **نه** `apps/web/vercel.json`.

   آن فایل از زمان مهاجرت به VPS مرده است و ورسل دیگر استفاده نمی‌شود
   (CLAUDE.md). نتیجه‌اش این بود که این کرون ماه‌ها اجرا نشد و هیچ
   رزروی COMPLETED نشد — یعنی هیچ باشگاهی طلبکار نشد و تسویه عملا
   غیرممکن ماند، در حالی که همه‌ی کد درست بود. اگر روزی زمان‌بندی را
   عوض کردی، آن اسکریپت را عوض کن، نه vercel.json را.

   زمان‌بندی روزانه است (`5 4 * * *`): طلب باشگاه تا ۲۴ ساعت پس از
   برگزاری ساخته می‌شود، نه بلافاصله. ساعتی‌کردنش بی‌خطر است — تابع
   idempotent است.

   امنیت: راز درست (`CRON_SECRET`) یا درخواستِ لوکال — `lib/cron-guard`. */
export async function GET(req: NextRequest) {
  /* راز درست، یا درخواستِ واقعا لوکال. نسخه‌ی قبلی بدونِ راز کاملا
     باز بود — و این مسیرها وضعیتِ مالی را عوض می‌کنند. */
  const bad = cronForbidden(req);
  if (bad) return NextResponse.json({ message: bad.message }, { status: bad.status });

  const { data, error } = await rpc<number>('bh_complete_due_bookings', {});
  if (error) {
    if (/does not exist|schema cache|function/i.test(error.message || '')) {
      return NextResponse.json(
        { ok: false, message: 'مهاجرت ۰۴۱ اجرا نشده است' }, { status: 503 });
    }
    /* ⚠️ بی‌صدا ماندنِ این یکی گران‌ترین است: بدونِ تکمیلِ رزروها
       هیچ CLUB_EARNINGی نوشته نمی‌شود و تسویه غیرممکن می‌ماند. */
    console.error('[cron/complete-bookings]', error.message);
    void logHandled('cron/complete-bookings', error).catch(() => {});
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  const completed = Number(data) || 0;
  if (completed > 0) {
    audit({
      actorRole: 'system', action: 'BOOKINGS_COMPLETED',
      newValue: { completed },
    });
  }

  return NextResponse.json({ ok: true, completed });
}

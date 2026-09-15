export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { rpc, audit } from '@/lib/finance/db';
import { backfillPersons } from '@/lib/identity';
import { cronForbidden } from '@/lib/cron-guard';

/* انقضای خودکار کمپین‌های تبلیغاتی (فاز ۲):
   SCHEDULED ای که زمانش رسیده ⇒ ACTIVE، و ACTIVE ای که تمام شده ⇒ EXPIRED.

   نمایش عمومی هرگز به این cron وابسته نیست — مسیر خواندن، پنجره‌ی
   زمانی را همیشه فیلتر می‌کند و خودش هم lazy همین تابع را صدا می‌زند؛
   این cron فقط تضمین می‌کند وضعیت رکوردها (و پنل ادمین) حتی بدون
   ترافیک هم با واقعیت همگام بماند.

   امنیت: راز درست (`CRON_SECRET`) یا درخواستِ لوکال — `lib/cron-guard`.
   زمان‌بند: `/opt/billiardhub/cron-tick.sh` در crontab سرور، نه
   `vercel.json` که از زمان مهاجرت به VPS مرده است. */
export async function GET(req: NextRequest) {
  /* راز درست، یا درخواستِ واقعا لوکال. نسخه‌ی قبلی بدونِ راز کاملا
     باز بود — و این مسیرها وضعیتِ مالی را عوض می‌کنند. */
  const bad = cronForbidden(req);
  if (bad) return NextResponse.json({ message: bad.message }, { status: bad.status });

  const { data, error } = await rpc<{ activated: number; expired: number }>('bh_expire_campaigns', {});
  if (error) {
    if (/does not exist|schema cache|function/i.test(error.message || '')) {
      return NextResponse.json({ ok: false, message: 'مایگریشن ۰۱۵ اجرا نشده است' }, { status: 503 });
    }
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  const r = (data ?? { activated: 0, expired: 0 }) as { activated: number; expired: number };
  if (r.activated > 0 || r.expired > 0) {
    audit({ actorRole: 'system', action: 'CAMPAIGNS_EXPIRED', newValue: r });
  }

  /* فاز ۳ — بک‌فیل اشخاص: عمدا این‌جا (روی سرور پروداکشن) اجرا می‌شود
     تا هش کد ملی با secret همین محیط ساخته شود، نه ماشین توسعه. */
  const persons = await backfillPersons();
  if (persons.linked > 0) {
    audit({ actorRole: 'system', action: 'PERSONS_BACKFILLED', newValue: persons });
  }

  return NextResponse.json({ ok: true, ...r, persons });
}

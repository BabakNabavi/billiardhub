export const dynamic = 'force-dynamic';
/* این کران علاوه بر رزروها، سفارش‌های نیمه‌کاره‌ی ثبت‌نام مسابقه را هم
   منقضی می‌کند: کاربری که به درگاه رفت و برنگشت نباید ظرفیت را برای
   همیشه اشغال کند. عملیات Idempotent است. */
import { NextRequest, NextResponse } from 'next/server';
import { rpc, audit } from '@/lib/finance/db';
import { cronForbidden } from '@/lib/cron-guard';
import { logHandled } from '@/lib/log-handled';

/* تور ایمنی انقضا — رزروهای پرداخت‌نشده‌ای که مهلتشان گذشته آزاد می‌شوند.
   انقضا در دو نقطه‌ی دیگر هم اتفاق می‌افتد (هنگام ساخت رزرو و هنگام دیدن
   ساعت‌ها)، این cron فقط تضمین می‌کند حتی بدون ترافیک هم زمان‌ها آزاد شوند.

   امنیت: راز درست (`CRON_SECRET`) یا درخواستِ لوکال — `lib/cron-guard`.
   زمان‌بند: `/opt/billiardhub/cron-tick.sh` در crontab سرور، نه
   `vercel.json` که از زمان مهاجرت به VPS مرده است. */
export async function GET(req: NextRequest) {
  /* راز درست، یا درخواستِ واقعا لوکال. نسخه‌ی قبلی بدونِ راز کاملا
     باز بود — و این مسیرها وضعیتِ مالی را عوض می‌کنند. */
  const bad = cronForbidden(req);
  if (bad) return NextResponse.json({ message: bad.message }, { status: bad.status });

  const { data, error } = await rpc<number>('bh_expire_bookings', {});
  if (error) {
    if (/does not exist|schema cache|function/i.test(error.message || '')) {
      return NextResponse.json({ ok: false, message: 'مایگریشن دیتابیس اجرا نشده است' }, { status: 503 });
    }
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  const freed = Number(data) || 0;
  if (freed > 0) audit({ actorRole: 'system', action: 'BOOKINGS_EXPIRED', newValue: { freedSlots: freed } });

  /* سفارش‌های نیمه‌کاره‌ی ثبت‌نام مسابقه — کاربری که به درگاه رفت و
     برنگشت نباید ظرفیت را برای همیشه نگه دارد. */
  let expiredRegs = 0;
  try {
    const { data: n } = await rpc<number>('bh_tournament_expire_pending', { p_minutes: 30 });
    expiredRegs = Number(n) || 0;
    if (expiredRegs > 0) {
      audit({ actorRole: 'system', action: 'TOURNAMENT_REGS_EXPIRED', newValue: { count: expiredRegs } });
    }
  } catch (e) {
    /* ⚠️ این شاخه خطا را کاملا می‌بلعد و ۲۰۰ برمی‌گرداند، پس تنها
       ردش همین ثبت است. */
    console.error('[cron] tournament expire failed:', e);
    void logHandled('cron/expire-bookings:tournaments', e).catch(() => {});
  }

  return NextResponse.json(
    { ok: true, freedSlots: freed, expiredRegistrations: expiredRegs },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export const dynamic = 'force-dynamic';
/* این کران علاوه بر رزروها، سفارش‌های نیمه‌کاره‌ی ثبت‌نام مسابقه را هم
   منقضی می‌کند: کاربری که به درگاه رفت و برنگشت نباید ظرفیت را برای
   همیشه اشغال کند. عملیات Idempotent است. */
import { NextRequest, NextResponse } from 'next/server';
import { rpc, audit } from '@/lib/finance/db';
import { cronForbidden } from '@/lib/cron-guard';
import { logHandled } from '@/lib/log-handled';
import { PAYMENT_WINDOW_MINUTES } from '@/lib/tournaments/server';

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

  /* ⚠️ عدد، تعدادِ **رزروِ منقضی‌شده** است نه اسلات. تا مهاجرتِ ۱۰۷،
     تابعِ دیتابیس ROW_COUNTِ حذفِ اسلات‌ها را برمی‌گرداند، یعنی یک رزروِ
     سه‌ساعته عدد ۳ می‌داد و نامِ freedSlots درست بود. حالا شمارش از
     خودِ رزروها می‌آید، پس نام هم باید عوض شود — وگرنه ژورنال عددی
     با برچسبِ غلط نگه می‌دارد و هرکس بعدا رویش حساب کند اشتباه
     می‌کند. هیچ مصرف‌کننده‌ی دیگری این فیلد را نمی‌خواند (grep شد). */
  const expiredBookings = Number(data) || 0;
  if (expiredBookings > 0) audit({ actorRole: 'system', action: 'BOOKINGS_EXPIRED', newValue: { expiredBookings } });

  /* سفارش‌های نیمه‌کاره‌ی ثبت‌نام مسابقه — کاربری که به درگاه رفت و
     برنگشت نباید ظرفیت را برای همیشه نگه دارد. */
  /* ⚠️ `rpc()` پرتاب نمی‌کند، `{ data, error }` برمی‌گرداند. نسخه‌ی
     قبلی در try/catch بود و `error` را نمی‌خواند — یعنی شکستِ انقضا
     کاملا بی‌صدا بود و catch هرگز اجرا نمی‌شد. پنجره هم ۳۰ دقیقه بود
     در حالی که بقیه‌ی مسیرها ۱۵ می‌سنجند. */
  let expiredRegs = 0;
  const { data: n, error: regErr } = await rpc<number>('bh_tournament_expire_pending', {
    p_minutes: PAYMENT_WINDOW_MINUTES,
  });
  if (regErr) {
    console.error('[cron] tournament expire failed:', regErr.message);
    void logHandled('cron/expire-bookings:tournaments', new Error(regErr.message)).catch(() => {});
  } else {
    expiredRegs = Number(n) || 0;
    if (expiredRegs > 0) {
      audit({ actorRole: 'system', action: 'TOURNAMENT_REGS_EXPIRED', newValue: { count: expiredRegs } });
    }
  }

  return NextResponse.json(
    { ok: true, expiredBookings, expiredRegistrations: expiredRegs },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export const dynamic = 'force-dynamic';
/* این کران علاوه بر رزروها، سفارش‌های نیمه‌کاره‌ی ثبت‌نام مسابقه را هم
   منقضی می‌کند: کاربری که به درگاه رفت و برنگشت نباید ظرفیت را برای
   همیشه اشغال کند. عملیات Idempotent است. */
import { NextRequest, NextResponse } from 'next/server';
import { rpc, audit } from '@/lib/finance/db';

/* تور ایمنی انقضا — رزروهای پرداخت‌نشده‌ای که مهلتشان گذشته آزاد می‌شوند.
   انقضا در دو نقطه‌ی دیگر هم اتفاق می‌افتد (هنگام ساخت رزرو و هنگام دیدن
   ساعت‌ها)، این cron فقط تضمین می‌کند حتی بدون ترافیک هم زمان‌ها آزاد شوند.

   امنیت: اگر CRON_SECRET تنظیم شده باشد، فقط با همان هدر اجرا می‌شود.
   Vercel هنگام اجرای cron خودش این هدر را می‌فرستد. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 401 });
    }
  }

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
    console.error('[cron] tournament expire failed:', e);
  }

  return NextResponse.json(
    { ok: true, freedSlots: freed, expiredRegistrations: expiredRegs },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

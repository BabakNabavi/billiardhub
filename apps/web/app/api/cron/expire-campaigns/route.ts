export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { rpc, audit } from '@/lib/finance/db';

/* انقضای خودکار کمپین‌های تبلیغاتی (فاز ۲):
   SCHEDULED ای که زمانش رسیده ⇒ ACTIVE، و ACTIVE ای که تمام شده ⇒ EXPIRED.

   نمایشِ عمومی هرگز به این cron وابسته نیست — مسیرِ خواندن، پنجره‌ی
   زمانی را همیشه فیلتر می‌کند و خودش هم lazy همین تابع را صدا می‌زند؛
   این cron فقط تضمین می‌کند وضعیتِ رکوردها (و پنل ادمین) حتی بدونِ
   ترافیک هم با واقعیت همگام بماند.

   امنیت: اگر CRON_SECRET تنظیم شده باشد، فقط با همان هدر اجرا می‌شود
   (Vercel هنگام اجرای cron خودش هدر را می‌فرستد). */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 401 });
    }
  }

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
  return NextResponse.json({ ok: true, ...r });
}

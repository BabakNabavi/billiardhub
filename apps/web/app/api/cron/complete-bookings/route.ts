export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { rpc, audit } from '@/lib/finance/db';

/* تحویلِ خدمت — رزروهایی که سانسشان تمام شده COMPLETED می‌شوند و
   همان‌جا سهمِ باشگاه و کمیسیونِ پلتفرم در دفتر ثبت می‌شود.

   چرا این cron لازم است: در مدلِ حسابِ مرکزی، باشگاه لحظه‌ی *پرداخت*
   طلبکار نمی‌شود بلکه پس از *برگزاری*. بدونِ این اجرا، هیچ رزروی
   هرگز COMPLETED نمی‌شود و بدهیِ پلتفرم به باشگاه‌ها اصلاً ساخته
   نمی‌شود — یعنی تسویه غیرممکن می‌ماند.

   `bh_complete_due_bookings` خودش idempotent است: رزروی که قبلاً
   تکمیل شده دوباره ردیفِ مالی نمی‌سازد (کلیدِ یکتای `source_key`).
   پس اجرای چندباره در یک روز بی‌خطر است.

   ⚠️ زمان‌بندی عمداً روزانه است (`0 4 * * *`)، نه ساعتی.
   پلنِ Hobby در Vercel فقط کرونِ روزانه می‌پذیرد و کرونِ ساعتی را در
   *اعتبارسنجیِ کانفیگ* رد می‌کند — یعنی کلِ دیپلوی شکست می‌خورد پیش
   از آن‌که بیلد شروع شود، بدونِ آنکه دیپلویِ ناموفقی در فهرست ثبت شود.
   یک‌بار همین اتفاق افتاد و شش کامیت شش ساعت روی GitHub ماندند بدونِ
   آن‌که کسی بفهمد چرا منتشر نمی‌شوند.

   نتیجه‌ی این محدودیت: طلبِ باشگاه تا ۲۴ ساعت پس از برگزاری ساخته
   می‌شود، نه بلافاصله. اگر روزی پلن به Pro ارتقا یافت، برگرداندنِ
   `0 * * * *` بی‌خطر است.

   امنیت: مثلِ بقیه‌ی cronها، اگر CRON_SECRET تنظیم باشد فقط با همان
   هدر اجرا می‌شود. Vercel خودش آن را می‌فرستد. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 401 });
    }
  }

  const { data, error } = await rpc<number>('bh_complete_due_bookings', {});
  if (error) {
    if (/does not exist|schema cache|function/i.test(error.message || '')) {
      return NextResponse.json(
        { ok: false, message: 'مهاجرت ۰۴۱ اجرا نشده است' }, { status: 503 });
    }
    console.error('[cron/complete-bookings]', error.message);
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

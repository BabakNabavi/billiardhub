export const dynamic = 'force-dynamic';
import { callbackOrigin } from '@/lib/site-url';
import { NextRequest, NextResponse } from 'next/server';
import { actorFromRequest, isAdmin, audit } from '@/lib/finance/db';
import { getPaymentProvider, hasRealGateway } from '@/lib/payments';

/* سلامتِ درگاه پرداخت.

   ── چرا لازم شد ──
   خرابیِ درگاه بی‌صداست. توکنِ منقضی، دسترسیِ کم، یا آدرسِ اشتباهِ
   سایت هیچ‌کدام هشدار نمی‌دهند؛ فقط کاربر روی «پرداخت» می‌زند و خطا
   می‌گیرد. و چون از بیرون شبیه یک خرابیِ گذراست، اولین جایی که
   دنبالِ علت می‌گردیم کدِ خودمان است نه توکن.

   ── آزمونِ زنده ــ
   با `?probe=1` یک دستورِ پرداختِ کوچک ساخته و بی‌درنگ حذف می‌شود.
   این تنها راهِ اطمینان است: توکن، دسترسی‌ها، و اتصال هر سه با هم
   سنجیده می‌شوند. هیچ پولی جابه‌جا نمی‌شود چون کسی به درگاه نمی‌رود.

   بدونِ `probe=1` فقط تنظیمات گزارش می‌شود و هیچ درخواستی بیرون
   نمی‌رود. */

/* ── نردبانِ مبلغ ──
   توکنِ آزمایشیِ پی‌پینگ هر مبلغی را نمی‌پذیرد و خطایش
   («مبلغ تراکنش برای مشتری آزمایشی معتبر نیست») نمی‌گوید چه مبلغی
   مجاز است. به‌جای حدس‌زدن، چند مقدارِ متعارف امتحان می‌شود تا
   مرزش پیدا شود.

   هر دستورِ ساخته‌شده بی‌درنگ حذف می‌شود و چون کسی به صفحه‌ی درگاه
   نمی‌رود، هیچ پولی جابه‌جا نمی‌شود. */
const PROBE_LADDER = [1_000, 2_000, 5_000, 10_000, 50_000, 100_000];

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  if (!(await isAdmin(actor.id))) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });

  const provider = getPaymentProvider();
  const selected = (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();

  const out: Record<string, unknown> = {
    /* درگاهی که در تنظیمات انتخاب شده */
    selected,
    /* درگاهی که واقعاً به کار می‌رود — اگر انتخابی پیکربندی نشده
       باشد، سیستم به mock برمی‌گردد و این دو یکی نمی‌مانند. */
    active: provider.name,
    realGateway: hasRealGateway(),
    tokenSet: !!process.env.PAYPING_TOKEN,
    reversible: process.env.PAYPING_REVERSIBLE === 'on',
  };

  if (selected !== provider.name) {
    out.warning = `درگاه «${selected}» پیکربندی نشده و سیستم به «${provider.name}» برگشته است`;
  }

  if (req.nextUrl.searchParams.get('probe') !== '1') {
    return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
  }

  /* ── آزمونِ زنده ──
     یک مبلغِ مشخص با `?amount=`، وگرنه کلِ نردبان. */
  const one = Number(req.nextUrl.searchParams.get('amount') || 0);
  const ladder = one > 0 ? [Math.round(one)] : PROBE_LADDER;
  const callbackUrl = `${callbackOrigin()}/api/admin/payments/health`;

  const results: Record<string, unknown>[] = [];
  let okCount = 0;

  for (const amount of ladder) {
    const created = await provider.createPayment({
      paymentId: `health-${Date.now().toString(36)}-${amount}`,
      amount,
      description: 'آزمون سلامت درگاه — بدون پرداخت',
      callbackUrl,
    });

    /* در شکست، پاسخِ خامِ درگاه هم برمی‌گردد. این مسیر فقط برای ادمین
       باز است و پیامِ کوتاهِ درگاه («PolicyException») به‌تنهایی هیچ
       نمی‌گوید؛ کدِ HTTP و `metaData` علت را روشن می‌کنند. */
    results.push(created.ok
      ? { amount, ok: true }
      : { amount, ok: false, message: created.message, gateway: created.raw ?? null });

    /* دستورِ ساخته‌شده پاک می‌شود تا در گزارش‌ها نماند. اگر حذف نشد،
       مهم نیست — دستورِ پرداخت‌نشده خودش منقضی می‌شود. */
    if (created.ok && created.authority && selected === 'payping') {
      try {
        await fetch('https://api.payping.ir/v3/pay', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.PAYPING_TOKEN ?? ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paymentCode: created.authority }),
        });
      } catch { /* حذف نشد — دستورِ پرداخت‌نشده خودش می‌میرد */ }
    }

    /* دو موفقیت برای فهمیدنِ بازه کافی است؛ ادامه فقط دستورِ اضافه
       می‌سازد. */
    if (created.ok && ++okCount >= 2) break;
  }

  const accepted = results.filter(r => r.ok).map(r => r.amount);
  out.probe = {
    ok: accepted.length > 0,
    acceptedAmounts: accepted,
    message: accepted.length
      ? `درگاه پاسخ داد — این مبلغ‌ها پذیرفته شدند: ${accepted.join('، ')} تومان`
      : 'هیچ مبلغی پذیرفته نشد',
    tried: results,
  };

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'PAYMENT_HEALTH_PROBE',
    entityType: 'payment_provider', entityId: provider.name,
    newValue: { accepted },
  });

  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}

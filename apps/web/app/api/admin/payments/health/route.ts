export const dynamic = 'force-dynamic';
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

const PROBE_AMOUNT = 10_000;   // تومان — فقط برای ساخت و حذف

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

  /* ── آزمونِ زنده ── */
  const created = await provider.createPayment({
    paymentId: `health-${Date.now().toString(36)}`,
    amount: PROBE_AMOUNT,
    description: 'آزمون سلامت درگاه — بدون پرداخت',
    callbackUrl: `${req.nextUrl.origin}/api/admin/payments/health`,
  });

  out.probe = created.ok
    ? { ok: true, message: 'درگاه پاسخ داد و دستور پرداخت ساخته شد' }
    : { ok: false, message: created.message ?? 'ساخت دستور پرداخت ناموفق بود' };

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

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'PAYMENT_HEALTH_PROBE',
    entityType: 'payment_provider', entityId: provider.name,
    newValue: { ok: created.ok },
  });

  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}

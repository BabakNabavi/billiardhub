export const dynamic = 'force-dynamic';
import { callbackOrigin } from '@/lib/site-url';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sb, actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { getPaymentProvider, hasRealGateway } from '@/lib/payments';

/* ایجاد پرداخت برای یک رزرو در انتظار.
   مبلغ همیشه از رکورد رزرو (سروری) خوانده می‌شود، نه از کلاینت. */
export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });

  /* شناسه مستقیم در دو پرس‌وجو می‌رود — در مرز اعتبارسنجی می‌شود */
  const parsed = z.object({ bookingId: z.string().min(1).max(64) })
    .safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: 'bookingId الزامی است' }, { status: 400 });
  const { bookingId } = parsed.data;

  /* زمان‌سنجی: «انتقال به درگاه دیر است» — هر مرحله در لاگ، تا از اندازه تصمیم گرفته شود */
  const t0 = Date.now();
  /* رزرو و پرداختِ بازِ قبلی مستقل‌اند — هم‌زمان، نه پشتِ‌هم */
  const [{ data: bRow, error: bErr }, { data: openRow }] = await Promise.all([
    sb().from('bookings')
      .select('id,"userId","clubId",final_amount,booking_status,payment_status,expires_at,booking_reference')
      .eq('id', bookingId).maybeSingle(),
    sb().from('payments')
      .select('id,provider,provider_authority,amount,status')
      .eq('booking_id', bookingId).in('status', ['INITIATED', 'PENDING']).maybeSingle(),
  ]);
  const tRead = Date.now();

  if (bErr || !bRow) return NextResponse.json({ message: 'رزرو یافت نشد' }, { status: 404 });
  const b = bRow as {
    id: string; userId: string; clubId: string; final_amount: number;
    booking_status: string; payment_status: string; expires_at: string | null; booking_reference: string | null;
  };

  if (b.userId !== actor.id) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  if (b.payment_status === 'PAID') return NextResponse.json({ message: 'این رزرو قبلا پرداخت شده است' }, { status: 409 });
  if (b.booking_status !== 'PENDING_PAYMENT') return NextResponse.json({ message: 'این رزرو قابل پرداخت نیست' }, { status: 409 });
  if (b.expires_at && new Date(b.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ message: 'مهلت پرداخت به پایان رسیده؛ لطفا دوباره رزرو کنید' }, { status: 410 });
  }
  if (!b.final_amount || b.final_amount <= 0) {
    return NextResponse.json({ message: 'مبلغ رزرو معتبر نیست' }, { status: 400 });
  }

  /* ── دروازه‌ی واقعی الزامی است ──
     `getPaymentProvider()` وقتی درگاهی تنظیم نشده باشد بی‌صدا به mock
     می‌افتد. برای مسابقات از قبل جلویش گرفته شده بود، ولی رزرو این
     بررسی را نداشت: یعنی رزرو می‌توانست «پرداخت‌شده» شود بدون آنکه
     ریالی جابه‌جا شده باشد — و بعد بدهی واقعی به باشگاه بسازد.

     `BH_ALLOW_MOCK_PAYMENTS=1` تنها راه آگاهانه‌ی آزمایش است و به‌طور
     پیش‌فرض خاموش. */
  if (!hasRealGateway() && process.env.BH_ALLOW_MOCK_PAYMENTS !== '1') {
    return NextResponse.json({
      message: 'پرداخت آنلاین هنوز فعال نیست، لطفا بعدا تلاش کنید یا با باشگاه تماس بگیرید',
      gatewayDisabled: true,
    }, { status: 503 });
  }

  const provider = getPaymentProvider();

  /* اگر پرداخت باز قبلی برای همین رزرو هست، همان ادامه یابد (ضد پرداخت تکراری) —
     بالاتر هم‌زمان با رزرو خوانده شد */

  let paymentId: string;
  if (openRow && (openRow as { provider: string }).provider === provider.name
      && (openRow as { amount: number }).amount === b.final_amount) {
    paymentId = (openRow as { id: string }).id;
  } else {
    const { data: created, error: pErr } = await sb().from('payments').insert({
      booking_id: b.id, user_id: b.userId, club_id: b.clubId,
      provider: provider.name, amount: b.final_amount, currency: 'IRT', status: 'INITIATED',
      idempotency_key: `${b.id}:${b.final_amount}:${provider.name}`,
    }).select('id').single();
    if (pErr || !created) {
      if (/does not exist|schema cache/i.test(pErr?.message || '')) {
        return NextResponse.json({ message: 'سیستم پرداخت هنوز راه‌اندازی نشده است (مایگریشن دیتابیس اجرا نشده)' }, { status: 503 });
      }
      return NextResponse.json({ message: 'خطا در ایجاد پرداخت' }, { status: 500 });
    }
    paymentId = (created as { id: string }).id;
  }

  const tRow = Date.now();
  const origin = callbackOrigin();
  const callbackUrl = `${origin}/api/payments/callback/${provider.name}?payment=${paymentId}`;
  const res = await provider.createPayment({
    paymentId, amount: b.final_amount,
    description: `رزرو ${b.booking_reference ?? b.id}`,
    callbackUrl,
  });

  const tGateway = Date.now();
  if (!res.ok || !res.redirectUrl) {
    await sb().from('payments').update({ status: 'FAILED', raw_response: res.raw ?? { message: res.message }, updated_at: new Date().toISOString() }).eq('id', paymentId);
    return NextResponse.json({ message: res.message || 'ایجاد پرداخت ناموفق بود' }, { status: 502 });
  }

  await sb().from('payments').update({
    status: 'PENDING', provider_authority: res.authority ?? null,
    raw_response: res.raw ?? null, updated_at: new Date().toISOString(),
  }).eq('id', paymentId);

  console.info(`[timing] payment.create read=${tRead - t0}ms row=${tRow - tRead}ms gateway=${tGateway - tRow}ms save=${Date.now() - tGateway}ms total=${Date.now() - t0}ms`);

  audit({ actorId: actor.id, actorRole: actor.role, action: 'PAYMENT_CREATED',
          entityType: 'payment', entityId: paymentId,
          newValue: { amount: b.final_amount, provider: provider.name }, ip: clientIp(req) ?? undefined });

  return NextResponse.json({ paymentId, provider: provider.name, redirectUrl: res.redirectUrl, amount: b.final_amount });
}

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, rpc, audit, clientIp } from '@/lib/finance/db';
import { getPaymentProvider } from '@/lib/payments';
import { notifyBookingConfirmed } from '@/lib/notify';

/* بازگشت از درگاه — هرگز به گفته‌ی کلاینت اعتماد نمی‌شود:
   ۱) پرداخت سمت سرور verify می‌شود
   ۲) مبلغ پرداخت‌شده با مبلغ مورد انتظار مقایسه می‌شود
   ۳) تأیید idempotent است (کالبک تکراری هیچ اثر مالی دوباره ندارد)
   ۴) همه‌ی اثرات مالی در یک تراکنش اتمیک دیتابیس ثبت می‌شوند */

async function handle(req: NextRequest, providerName: string) {
  const url = req.nextUrl;
  const paymentId = url.searchParams.get('payment') || '';
  const authority = url.searchParams.get('Authority') || url.searchParams.get('authority') || '';
  const status = url.searchParams.get('Status') || url.searchParams.get('status') || '';

  const fail = (msg: string) => NextResponse.redirect(new URL(`/booking/result?ok=0&reason=${encodeURIComponent(msg)}`, url.origin));
  if (!paymentId) return fail('پرداخت نامعتبر');

  const { data: pRow } = await sb().from('payments')
    .select('id,booking_id,amount,status,provider,provider_authority').eq('id', paymentId).maybeSingle();
  if (!pRow) return fail('پرداخت یافت نشد');
  const pay = pRow as { id: string; booking_id: string; amount: number; status: string; provider: string; provider_authority: string | null };

  /* قبلاً تأیید شده ⇒ فقط به نتیجه هدایت کن (بدون هیچ عملیات مالی تکراری) */
  if (pay.status === 'PAID') {
    return NextResponse.redirect(new URL(`/booking/result?ok=1&booking=${pay.booking_id}`, url.origin));
  }

  /* کاربر پرداخت را لغو کرده است */
  if (status && /nok|cancel/i.test(status)) {
    await sb().from('payments').update({ status: 'CANCELED', updated_at: new Date().toISOString() }).eq('id', pay.id);
    return fail('پرداخت توسط شما لغو شد');
  }

  const provider = getPaymentProvider(pay.provider || providerName);

  /* ── شناسه‌ی درگاه از دیتابیس می‌آید، نه از نوارِ نشانی ──
     پیش‌تر `authority || pay.provider_authority` بود، یعنی مقدارِ
     کوئری‌استرینگ اولویت داشت. با آن، کسی می‌توانست شناسه‌ی یک پرداختِ
     واقعاً موفقِ *دیگر* را روی این پرداخت سوار کند و درگاه آن را تأیید
     می‌کرد. حالا فقط همان شناسه‌ای معتبر است که موقعِ ساختِ پرداخت
     ذخیره شده؛ اگر درگاه شناسه‌ی دیگری برگرداند، ناسازگاری است. */
  const auth = pay.provider_authority || '';
  if (!auth) return fail('شناسه‌ی پرداخت نامعتبر است');
  if (authority && pay.provider_authority && authority !== pay.provider_authority) {
    console.error('[payments/callback] authority mismatch', { paymentId: pay.id });
    return fail('شناسه‌ی پرداخت با درخواست اولیه هم‌خوانی ندارد');
  }

  const v = await provider.verifyPayment({ paymentId: pay.id, authority: auth, amount: pay.amount });
  if (!v.ok || !v.paid) {
    await sb().from('payments').update({
      status: 'FAILED', raw_response: (v.raw ?? { message: v.message }) as object, updated_at: new Date().toISOString(),
    }).eq('id', pay.id);
    return fail(v.message || 'پرداخت تأیید نشد');
  }

  /* بررسی مبلغ — اگر مبلغ واقعی با مورد انتظار نخواند، هرگز تأیید نکن */
  if (typeof v.amount === 'number' && v.amount !== pay.amount) {
    await sb().from('payments').update({ status: 'FAILED', raw_response: { reason: 'amount_mismatch', got: v.amount, want: pay.amount }, updated_at: new Date().toISOString() }).eq('id', pay.id);
    audit({ action: 'PAYMENT_AMOUNT_MISMATCH', entityType: 'payment', entityId: pay.id, newValue: { got: v.amount, want: pay.amount }, ip: clientIp(req) ?? undefined });
    return fail('مبلغ پرداخت با مبلغ رزرو مطابقت ندارد');
  }

  /* تأیید اتمیک: پرداخت + رزرو + دفتر مالی + کمیسیون + موجودی باشگاه */
  const { error } = await rpc('bh_confirm_payment', {
    p_payment_id: pay.id, p_provider_ref: v.refId ?? '', p_amount: pay.amount,
  });
  if (error) {
    const m = error.message || '';
    audit({ action: 'PAYMENT_CONFIRM_FAILED', entityType: 'payment', entityId: pay.id, newValue: { error: m } });
    if (/amount_mismatch/.test(m)) return fail('مغایرت مبلغ');
    return fail('خطا در نهایی‌کردن رزرو — با پشتیبانی تماس بگیرید');
  }

  audit({ action: 'PAYMENT_CONFIRMED', entityType: 'payment', entityId: pay.id,
          newValue: { refId: v.refId, amount: pay.amount }, ip: clientIp(req) ?? undefined });

  /* اطلاع‌رسانی — بی‌صدا و بدون انتظار؛ نباید ریدایرکت کاربر را کند کند */
  void notifyBookingConfirmed(pay.booking_id).catch(() => { /* بی‌صدا */ });

  return NextResponse.redirect(new URL(`/booking/result?ok=1&booking=${pay.booking_id}`, url.origin));
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  return handle(req, provider);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  return handle(req, provider);
}

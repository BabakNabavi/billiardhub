export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, audit, clientIp } from '@/lib/finance/db';
import { getPaymentProvider } from '@/lib/payments';
import { readGatewayReturn } from '@/lib/payments/return';
import { sendCampaign } from '@/lib/sms/club-campaign';

/* بازگشت از درگاه — پیامک باشگاه به اعضا.

   به گفته‌ی کلاینت اعتماد نمی‌شود: پرداخت سمت سرور verify می‌شود و
   مبلغِ واقعی با مبلغِ سفارش سنجیده می‌شود. کالبکِ تکراری هم دو بار
   اثر نمی‌گذارد — سفارشِ `PAID` بی‌درنگ به نتیجه می‌رود.

   ارسال بعد از تأیید انجام می‌شود و ردیفِ گیرنده کلیدِ مرکب دارد، پس
   حتی اگر این مسیر دوباره اجرا شود کسی پیامکِ تکراری نمی‌گیرد. */

async function handle(req: NextRequest, providerName: string) {
  const url = req.nextUrl;
  /* پی‌پینگ با POST و فرم برمی‌گردد، نه با کوئری */
  const ret = await readGatewayReturn(req);
  const authority = ret.authority;
  const campaignId = url.searchParams.get('campaign') || ret.clientRefId || '';

  const done = (ok: boolean, extra = '') =>
    NextResponse.redirect(new URL(`/dashboard/club?sms=${ok ? 'ok' : 'fail'}${extra}`, url.origin));
  const fail = (msg: string) => done(false, `&reason=${encodeURIComponent(msg)}`);

  if (!campaignId) return fail('سفارش نامعتبر');

  const { data: cRow } = await sb().from('club_sms_campaigns')
    .select('id,club_id,total_amount,status,provider,provider_ref').eq('id', campaignId).maybeSingle();
  if (!cRow) return fail('سفارش یافت نشد');
  const c = cRow as {
    id: string; club_id: string; total_amount: number;
    status: string; provider: string | null; provider_ref: string | null;
  };

  /* قبلاً پرداخت و ارسال شده ⇒ فقط نتیجه */
  if (c.status === 'PAID' || c.status === 'SENDING' || c.status === 'SENT') {
    return done(true, `&campaign=${c.id}`);
  }

  if (ret.canceled) {
    await sb().from('club_sms_campaigns')
      .update({ status: 'CANCELED', updated_at: new Date().toISOString() }).eq('id', c.id);
    return fail('پرداخت توسط شما لغو شد');
  }

  const provider = getPaymentProvider(c.provider || providerName);
  const auth = authority || c.provider_ref || '';
  if (!auth) return fail('شناسه‌ی پرداخت نامعتبر است');

  const v = await provider.verifyPayment({
    paymentId: c.id, authority: auth, amount: c.total_amount, refId: ret.refId,
  });
  if (!v.ok || !v.paid) {
    await sb().from('club_sms_campaigns')
      .update({ status: 'FAILED', error_note: v.message ?? null, updated_at: new Date().toISOString() })
      .eq('id', c.id);
    return fail(v.message || 'پرداخت تأیید نشد');
  }

  /* مبلغِ واقعی باید با قیمتِ سرور یکی باشد */
  if (typeof v.amount === 'number' && v.amount !== c.total_amount) {
    await sb().from('club_sms_campaigns')
      .update({ status: 'FAILED', error_note: 'مبلغ پرداخت با سفارش هم‌خوانی ندارد' })
      .eq('id', c.id);
    void audit({
      action: 'CLUB_SMS_AMOUNT_MISMATCH', entityType: 'club_sms_campaign', entityId: c.id,
      newValue: { got: v.amount, want: c.total_amount }, ip: clientIp(req) ?? undefined,
    });
    return fail('مبلغ پرداخت با سفارش مطابقت ندارد');
  }

  await sb().from('club_sms_campaigns').update({
    status: 'PAID', payment_id: c.id, provider_ref: v.refId ?? auth,
    updated_at: new Date().toISOString(),
  }).eq('id', c.id);

  void audit({
    action: 'CLUB_SMS_PAID', entityType: 'club_sms_campaign', entityId: c.id,
    newValue: { amount: c.total_amount, ref: v.refId ?? null }, ip: clientIp(req) ?? undefined,
  });

  /* ارسال همین‌جا و پیش از هدایت انجام می‌شود.
     کارِ پس‌زمینه در محیطِ بی‌سرور تضمینی نیست — تابع می‌تواند پیش از
     تمام‌شدنِ حلقه خاموش شود و باشگاه‌دار پول داده باشد و پیامکی
     نرفته باشد. کندیِ چند ثانیه‌ای بهترین معامله‌ی این‌جاست. */
  const r = await sendCampaign(c.id);
  return done(true, `&campaign=${c.id}&sent=${r.sent}`);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  return handle(req, provider);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  return handle(req, provider);
}

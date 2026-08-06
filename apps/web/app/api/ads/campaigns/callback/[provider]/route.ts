export const dynamic = 'force-dynamic';
import { callbackOrigin } from '@/lib/site-url';
import { NextRequest, NextResponse } from 'next/server';
import { sb, rpc, audit, clientIp } from '@/lib/finance/db';
import { getPaymentProvider } from '@/lib/payments';
import { readGatewayReturn } from '@/lib/payments/return';

/* بازگشت از درگاه خرید تبلیغ.

   هرگز به گفته‌ی کلاینت اعتماد نمی‌شود: پرداخت سمت سرور verify
   می‌شود، مبلغ واقعی با مبلغ سفارش مقایسه می‌شود، و فعال‌سازی در یک
   تراکنش اتمیک انجام می‌گیرد که کالبک تکراری دو بار اثر نمی‌گذارد و
   ظرفیت جایگاه را هم در همان تراکنش می‌سنجد. */

async function handle(req: NextRequest, providerName: string) {
  const url = req.nextUrl;
  /* پی‌پینگ با POST و فرم برمی‌گردد، نه با کوئری — `readGatewayReturn`
     هر دو شکل را می‌خواند. */
  const ret = await readGatewayReturn(req);
  const authority = ret.authority;
  const orderId = url.searchParams.get('order') || ret.clientRefId || '';

  const done = (ok: boolean, extra = '') =>
    NextResponse.redirect(new URL(`/advertise/result?ok=${ok ? 1 : 0}${extra}`, callbackOrigin()), { status: 303 });
  const fail = (msg: string) => done(false, `&reason=${encodeURIComponent(msg)}`);

  if (!orderId) return fail('سفارش نامعتبر');

  const { data: oRow } = await sb().from('campaign_orders')
    .select('id,user_id,campaign_id,amount,status,provider,provider_authority')
    .eq('id', orderId).maybeSingle();
  if (!oRow) return fail('سفارش یافت نشد');
  const o = oRow as {
    id: string; user_id: string; campaign_id: string | null; amount: number;
    status: string; provider: string; provider_authority: string | null;
  };

  /* قبلاً پرداخت شده ⇒ فقط نتیجه، بدون اثر دوباره */
  if (o.status === 'PAID') return done(true, `&order=${o.id}`);

  if (ret.canceled) {
    await sb().from('campaign_orders').update({ status: 'CANCELED' }).eq('id', o.id);
    if (o.campaign_id) await sb().from('campaigns').update({ status: 'CANCELLED' }).eq('id', o.campaign_id);
    return fail('پرداخت توسط شما لغو شد');
  }

  const provider = getPaymentProvider(o.provider || providerName);
  const auth = authority || o.provider_authority || '';
  if (!auth) return fail('شناسه‌ی پرداخت نامعتبر است');

  const v = await provider.verifyPayment({
    paymentId: o.id, authority: auth, amount: o.amount, refId: ret.refId,
  });
  if (!v.ok || !v.paid) {
    await sb().from('campaign_orders').update({ status: 'FAILED' }).eq('id', o.id);
    return fail(v.message || 'پرداخت تأیید نشد');
  }

  /* مبلغ واقعی پرداخت‌شده باید با قیمت سرور یکی باشد */
  if (typeof v.amount === 'number' && v.amount !== o.amount) {
    await sb().from('campaign_orders').update({ status: 'FAILED' }).eq('id', o.id);
    void audit({
      action: 'CAMPAIGN_AMOUNT_MISMATCH', entityType: 'campaign_order', entityId: o.id,
      newValue: { got: v.amount, want: o.amount }, ip: clientIp(req) ?? undefined,
    });
    return fail('مبلغ پرداخت با قیمت تبلیغ مطابقت ندارد');
  }

  const { data: act, error } = await rpc('bh_activate_campaign', { p_order_id: o.id, p_ref: v.refId ?? '' });
  if (error) {
    void audit({
      action: 'CAMPAIGN_ACTIVATE_FAILED', entityType: 'campaign_order', entityId: o.id,
      newValue: { error: error.message },
    });
    return fail('خطا در ثبت تبلیغ — با پشتیبانی تماس بگیرید');
  }

  /* ظرفیت جایگاه در همان تراکنش پر شده بود. تابع عمداً استثنا پرتاب
     نمی‌کند (وگرنه علامت‌گذاری سفارش هم برمی‌گشت) و نتیجه را
     برمی‌گرداند؛ این‌جا فقط پیام روشن به کاربر داده می‌شود. */
  const res = (act ?? {}) as { ok?: boolean; reason?: string };
  if (res.ok === false) {
    void audit({
      action: 'CAMPAIGN_ACTIVATE_REFUSED', entityType: 'campaign_order', entityId: o.id,
      newValue: { reason: res.reason },
    });
    if (res.reason === 'placement_full') {
      return fail('ظرفیت این جایگاه پیش از تکمیل پرداخت شما پر شد؛ مبلغ قابل بازگشت است — با پشتیبانی تماس بگیرید');
    }
    return fail('ثبت تبلیغ ممکن نشد — با پشتیبانی تماس بگیرید');
  }

  void audit({
    actorId: o.user_id, action: 'CAMPAIGN_PAID', entityType: 'campaign_order', entityId: o.id,
    newValue: { refId: v.refId, amount: o.amount, campaignId: o.campaign_id },
    ip: clientIp(req) ?? undefined,
  });

  return done(true, `&order=${o.id}`);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  return handle(req, (await ctx.params).provider);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  return handle(req, (await ctx.params).provider);
}

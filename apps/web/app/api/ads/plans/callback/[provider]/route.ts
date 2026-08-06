export const dynamic = 'force-dynamic';
import { callbackOrigin } from '@/lib/site-url';
import { NextRequest, NextResponse } from 'next/server';
import { sb, rpc, audit, clientIp } from '@/lib/finance/db';
import { getPaymentProvider } from '@/lib/payments';
import { readGatewayReturn } from '@/lib/payments/return';

/* بازگشت از درگاه خرید بسته‌ی آگهی.
   مثل مسیر رزرو: هرگز به گفته‌ی کلاینت اعتماد نمی‌شود — پرداخت سمت
   سرور verify می‌شود، مبلغ مقایسه می‌شود، و فعال‌سازی در یک تراکنش
   اتمیک انجام می‌گیرد که کالبک تکراری دو بار پلن نمی‌دهد. */

async function handle(req: NextRequest, providerName: string) {
  const url = req.nextUrl;
  /* پی‌پینگ با POST و فرم برمی‌گردد، نه با کوئری */
  const ret = await readGatewayReturn(req);
  const authority = ret.authority;
  const orderId = url.searchParams.get('order') || ret.clientRefId || '';

  const done = (ok: boolean, extra = '') =>
    NextResponse.redirect(new URL(`/plans/result?ok=${ok ? 1 : 0}${extra}`, callbackOrigin()), { status: 303 });
  const fail = (msg: string) => done(false, `&reason=${encodeURIComponent(msg)}`);

  if (!orderId) return fail('سفارش نامعتبر');

  const { data: oRow } = await sb().from('ad_plan_orders')
    .select('id,user_id,plan_id,amount,status,provider,provider_authority').eq('id', orderId).maybeSingle();
  if (!oRow) return fail('سفارش یافت نشد');
  const o = oRow as {
    id: string; user_id: string; plan_id: string; amount: number;
    status: string; provider: string; provider_authority: string | null;
  };

  /* قبلاً پرداخت شده ⇒ فقط نتیجه، بدون اثر دوباره */
  if (o.status === 'PAID') return done(true, `&order=${o.id}`);

  if (ret.canceled) {
    await sb().from('ad_plan_orders').update({ status: 'CANCELED' }).eq('id', o.id);
    return fail('پرداخت توسط شما لغو شد');
  }

  const provider = getPaymentProvider(o.provider || providerName);
  const auth = authority || o.provider_authority || '';
  if (!auth) return fail('شناسه‌ی پرداخت نامعتبر است');

  const v = await provider.verifyPayment({
    paymentId: o.id, authority: auth, amount: o.amount, refId: ret.refId,
  });
  if (!v.ok || !v.paid) {
    await sb().from('ad_plan_orders').update({ status: 'FAILED' }).eq('id', o.id);
    return fail(v.message || 'پرداخت تأیید نشد');
  }

  if (typeof v.amount === 'number' && v.amount !== o.amount) {
    await sb().from('ad_plan_orders').update({ status: 'FAILED' }).eq('id', o.id);
    void audit({
      action: 'AD_PLAN_AMOUNT_MISMATCH', entityType: 'ad_plan_order', entityId: o.id,
      newValue: { got: v.amount, want: o.amount }, ip: clientIp(req) ?? undefined,
    });
    return fail('مبلغ پرداخت با قیمت بسته مطابقت ندارد');
  }

  const { error } = await rpc('bh_activate_ad_plan', { p_order_id: o.id, p_ref: v.refId ?? '' });
  if (error) {
    void audit({ action: 'AD_PLAN_ACTIVATE_FAILED', entityType: 'ad_plan_order', entityId: o.id, newValue: { error: error.message } });
    return fail('خطا در فعال‌سازی بسته — با پشتیبانی تماس بگیرید');
  }

  void audit({
    actorId: o.user_id, action: 'AD_PLAN_ACTIVATED', entityType: 'ad_plan_order', entityId: o.id,
    newValue: { refId: v.refId, amount: o.amount }, ip: clientIp(req) ?? undefined,
  });

  return done(true, `&order=${o.id}`);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  return handle(req, (await ctx.params).provider);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  return handle(req, (await ctx.params).provider);
}

export const dynamic = 'force-dynamic';
import { callbackOrigin } from '@/lib/site-url';
import { NextRequest, NextResponse } from 'next/server';
import { sb, rpc, audit, clientIp } from '@/lib/finance/db';
import { getPaymentProvider } from '@/lib/payments';
import { readGatewayReturn } from '@/lib/payments/return';

/* بازگشت از درگاهِ ارتقای آگهی.

   همان قواعدِ بقیه‌ی کالبک‌ها: verify سمتِ سرور، مقایسه‌ی مبلغ، و
   اعمالِ اتمیک که کالبکِ تکراری دو بار حساب نمی‌شود.

   مقصدِ ریدایرکت صفحه‌ای است که واقعاً وجود دارد — یک‌بار در ماژولِ
   مسابقات مقصدی نوشته شده بود که صفحه نداشت و مسیرِ پویای `[id]`
   آن را می‌قاپید و به کسی که تازه پول داده بود «پیدا نشد» می‌گفت. */

async function handle(req: NextRequest, providerName: string) {
  const ret = await readGatewayReturn(req);
  const orderId = req.nextUrl.searchParams.get('order') || ret.clientRefId || '';

  const done = (state: string, extra = '') =>
    NextResponse.redirect(
      new URL(`/dashboard/shop?boost=${state}${extra}`, callbackOrigin()), { status: 303 });
  const fail = (msg: string) => done('failed', `&reason=${encodeURIComponent(msg)}`);

  if (!orderId) return fail('سفارش نامعتبر');

  const { data: oRow } = await sb().from('ad_boosts')
    .select('id,user_id,product_id,kind,price,days,status,provider,provider_authority,applied_at')
    .eq('id', orderId).maybeSingle();
  if (!oRow) return fail('سفارش یافت نشد');
  const o = oRow as {
    id: string; user_id: string; product_id: string; kind: string; price: number;
    status: string; provider: string | null; provider_authority: string | null;
    applied_at: string | null;
  };

  /* از قبل اعمال شده ⇒ همان پیامِ موفق. کالبکِ دوم نباید کاربر را
     بترساند. */
  if (o.applied_at) return done('ok', `&kind=${o.kind}`);

  if (ret.canceled) {
    await sb().from('ad_boosts').update({ status: 'CANCELED' }).eq('id', o.id);
    return done('cancelled');
  }

  const provider = getPaymentProvider(o.provider || providerName);
  const auth = ret.authority || o.provider_authority || '';
  if (!auth) return fail('شناسه‌ی پرداخت نامعتبر است');

  const v = await provider.verifyPayment({
    paymentId: o.id, authority: auth, amount: o.price, refId: ret.refId,
  });
  if (!v.ok || !v.paid) {
    await sb().from('ad_boosts').update({ status: 'FAILED' }).eq('id', o.id);
    return fail(v.message || 'پرداخت تأیید نشد');
  }

  if (typeof v.amount === 'number' && v.amount !== o.price) {
    await sb().from('ad_boosts').update({ status: 'FAILED' }).eq('id', o.id);
    void audit({
      action: 'AD_BOOST_AMOUNT_MISMATCH', entityType: 'ad_boost', entityId: o.id,
      newValue: { got: v.amount, want: o.price }, ip: clientIp(req) ?? undefined,
    });
    return fail('مبلغ پرداخت با تعرفه مطابقت ندارد');
  }

  const { data, error } = await rpc<{ ok: boolean; kind?: string; urgentUntil?: string | null }>(
    'bh_boost_apply', { p_order: o.id, p_ref: v.refId ?? '' });
  if (error || !data?.ok) {
    void audit({
      action: 'AD_BOOST_APPLY_FAILED', entityType: 'ad_boost', entityId: o.id,
      newValue: { error: error?.message ?? 'rpc' },
    });
    return fail('پرداخت انجام شد ولی ارتقا اعمال نشد — با پشتیبانی تماس بگیرید');
  }

  void audit({
    actorId: o.user_id, action: 'AD_BOOST_APPLIED', entityType: 'ad_boost', entityId: o.id,
    newValue: { kind: o.kind, amount: o.price, refId: v.refId, productId: o.product_id },
    ip: clientIp(req) ?? undefined,
  });

  return done('ok', `&kind=${o.kind}`);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  return handle(req, (await ctx.params).provider);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  return handle(req, (await ctx.params).provider);
}

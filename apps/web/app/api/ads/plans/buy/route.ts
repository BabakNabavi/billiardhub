export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { getPaymentProvider } from '@/lib/payments';
import { getPlan, createOrder } from '@/lib/ads/plans';

/* خرید بسته‌ی آگهی → درگاه.
   مبلغ همیشه از رکورد پلن روی سرور خوانده می‌شود، نه از کلاینت. */
export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'برای خرید بسته ابتدا وارد شوید' }, { status: 401 });

  const { planId } = await req.json().catch(() => ({}));
  if (!planId) return NextResponse.json({ message: 'بسته انتخاب نشده است' }, { status: 400 });

  const plan = await getPlan(String(planId));
  if (!plan) return NextResponse.json({ message: 'این بسته پیدا نشد' }, { status: 404 });
  if (!plan.isActive) return NextResponse.json({ message: 'این بسته دیگر قابل خرید نیست' }, { status: 409 });
  if (plan.price <= 0) return NextResponse.json({ message: 'قیمت این بسته تنظیم نشده است' }, { status: 409 });

  const order = await createOrder(actor.id, plan);
  if (!order) return NextResponse.json({ message: 'ثبت سفارش انجام نشد' }, { status: 500 });

  const provider = getPaymentProvider();
  const callbackUrl = `${req.nextUrl.origin}/api/ads/plans/callback/${provider.name}?order=${order.id}`;

  const res = await provider.createPayment({
    paymentId: order.id,
    amount: plan.price,
    description: `بسته‌ی آگهی ${plan.name}`,
    callbackUrl,
  });

  if (!res.ok || !res.redirectUrl) {
    await sb().from('ad_plan_orders').update({ status: 'FAILED' }).eq('id', order.id);
    return NextResponse.json({ message: res.message || 'اتصال به درگاه انجام نشد' }, { status: 502 });
  }

  await sb().from('ad_plan_orders').update({
    provider: provider.name, provider_authority: res.authority ?? null,
  }).eq('id', order.id);

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'AD_PLAN_ORDER_CREATED',
    entityType: 'ad_plan_order', entityId: order.id,
    newValue: { planId: plan.id, amount: plan.price, provider: provider.name },
    ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ orderId: order.id, redirectUrl: res.redirectUrl, amount: plan.price });
}

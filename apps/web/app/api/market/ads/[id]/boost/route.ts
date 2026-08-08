export const dynamic = 'force-dynamic';
import { callbackOrigin } from '@/lib/site-url';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { getPaymentProvider, hasRealGateway } from '@/lib/payments';
import { boostPricing, boostState, KIND_LABEL, type BoostKind } from '@/lib/market/boost';

/* ارتقای یک آگهی — «تازه‌سازی» یا «فوری».

   ترتیب عمداً همین است:
     ۱) هویت و مالکیت
     ۲) وضعیتِ آگهی (فعال، منقضی‌نشده، فروخته‌نشده)
     ۳) قیمت از تنظیماتِ سرور — نه از بدنه‌ی درخواست
     ۴) سفارشِ PENDING
     ۵) تازه بعد از آن، درگاه

   هر مبلغی که کلاینت بفرستد نادیده گرفته می‌شود. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ── وضعیتِ فعلی، برای پنجره‌ی انتخاب ── */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'آگهی پیدا نشد' }, { status: 404 });

  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const { data: row } = await sb().from('products')
    .select('id,"sellerId",status,"soldAt","expiresAt"').eq('id', id).maybeSingle();
  const p = row as { sellerId?: string; status?: string; soldAt?: string | null; expiresAt?: string | null } | null;
  if (!p) return NextResponse.json({ message: 'آگهی پیدا نشد' }, { status: 404 });
  if (p.sellerId !== actor.id) {
    return NextResponse.json({ message: 'این آگهی متعلق به شما نیست' }, { status: 403 });
  }

  const [pricing, state] = await Promise.all([boostPricing(), boostState(id)]);
  return NextResponse.json({ pricing, state, ...eligibility(p) },
    { headers: { 'Cache-Control': 'no-store' } });
}

/* آگهی‌ای که فروخته یا منقضی شده ارتقا نمی‌گیرد: پولی گرفته می‌شود
   برای دیده‌شدنِ چیزی که دیگر قابلِ خرید نیست. */
function eligibility(p: { status?: string; soldAt?: string | null; expiresAt?: string | null }) {
  if (p.soldAt) return { eligible: false, reason: 'این آگهی فروخته شده است' };
  if (p.expiresAt && new Date(p.expiresAt).getTime() < Date.now()) {
    return { eligible: false, reason: 'مهلت این آگهی تمام شده — اول تمدیدش کنید' };
  }
  if (String(p.status ?? '').toLowerCase() !== 'active') {
    return { eligible: false, reason: 'فقط آگهیِ فعال قابل ارتقا است' };
  }
  return { eligible: true as const };
}

/* ── خرید ── */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'آگهی پیدا نشد' }, { status: 404 });

  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'برای ارتقای آگهی ابتدا وارد شوید' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const kind = String(body?.kind ?? '') as BoostKind;
  if (kind !== 'bump' && kind !== 'urgent') {
    return NextResponse.json({ message: 'نوع ارتقا معتبر نیست' }, { status: 400 });
  }

  const { data: row } = await sb().from('products')
    .select('id,title,"sellerId",status,"soldAt","expiresAt"').eq('id', id).maybeSingle();
  const p = row as {
    title?: string; sellerId?: string; status?: string; soldAt?: string | null; expiresAt?: string | null;
  } | null;
  if (!p) return NextResponse.json({ message: 'آگهی پیدا نشد' }, { status: 404 });
  if (p.sellerId !== actor.id) {
    return NextResponse.json({ message: 'این آگهی متعلق به شما نیست' }, { status: 403 });
  }

  const el = eligibility(p);
  if (!el.eligible) return NextResponse.json({ message: el.reason }, { status: 409 });

  const pricing = await boostPricing();
  if (!pricing.enabled) {
    return NextResponse.json({ message: 'ارتقای آگهی فعلاً غیرفعال است' }, { status: 503 });
  }

  const price = kind === 'bump' ? pricing.bump.price : pricing.urgent.price;
  const days = kind === 'urgent' ? pricing.urgent.days : null;
  if (price <= 0) {
    return NextResponse.json({ message: 'قیمت این گزینه تنظیم نشده است' }, { status: 409 });
  }

  /* ── قفلِ تازه‌سازی ──
     بدونِ این، کسی که پول دارد هر دقیقه می‌خرد و برای همیشه نفرِ
     اول می‌ماند؛ آن‌وقت این دیگر ارتقا نیست، اجاره‌ی صدرِ فهرست
     است و بقیه از بازار می‌روند. */
  if (kind === 'bump') {
    const st = await boostState(id);
    if (st && !st.canBump) {
      return NextResponse.json({
        message: 'این آگهی به‌تازگی تازه‌سازی شده — کمی بعد دوباره تلاش کنید',
        readyAt: st.bumpReadyAt,
      }, { status: 429 });
    }
  }

  if (!hasRealGateway()) {
    return NextResponse.json({ message: 'پرداخت آنلاین هنوز فعال نشده است' }, { status: 503 });
  }

  const { data: made, error } = await sb().from('ad_boosts').insert({
    product_id: id, user_id: actor.id, kind, price, days, status: 'PENDING',
  }).select('id').single();
  if (error || !made) {
    console.error('[boost] insert:', error?.message);
    return NextResponse.json({ message: 'ثبت سفارش انجام نشد' }, { status: 500 });
  }
  const orderId = (made as { id: string }).id;

  const provider = getPaymentProvider();
  const callbackUrl = `${callbackOrigin()}/api/market/boost/callback/${provider.name}?order=${orderId}`;
  const pay = await provider.createPayment({
    paymentId: orderId,
    amount: price,
    description: `${KIND_LABEL[kind]} — ${String(p.title ?? '').slice(0, 40)}`,
    callbackUrl,
  });

  if (!pay.ok || !pay.redirectUrl) {
    await sb().from('ad_boosts').update({ status: 'FAILED' }).eq('id', orderId);
    return NextResponse.json({ message: pay.message ?? 'اتصال به درگاه انجام نشد' }, { status: 502 });
  }

  await sb().from('ad_boosts').update({
    provider: provider.name, provider_authority: pay.authority ?? null,
  }).eq('id', orderId);

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'AD_BOOST_STARTED',
    entityType: 'ad_boost', entityId: orderId,
    newValue: { productId: id, kind, price }, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, orderId, amount: price, redirectUrl: pay.redirectUrl });
}

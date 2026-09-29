export const dynamic = 'force-dynamic';
import { callbackOrigin } from '@/lib/site-url';
import { NextRequest, NextResponse } from 'next/server';
import { sb, rpc, audit, clientIp } from '@/lib/finance/db';
import { getPaymentProvider } from '@/lib/payments';
import { readGatewayReturn } from '@/lib/payments/return';

/* بازگشت از درگاه ارتقای آگهی.

   همان قواعد کالبکِ رزرو (`/api/payments/callback`) و مسابقه:
     • شناسه‌ی درگاه فقط از دیتابیس، نه از نوار نشانی؛
     • دقیقا یک بار استعلام، و «لغو» ادعای درگاه است نه حقیقت؛
     • سفارش فقط با پاسخِ **قطعی** ناموفق می‌شود؛
     • یک کدِ پیگیری فقط یک سفارش (در `bh_boost_apply`، مهاجرتِ ۱۱۱).

   ⚠️ این مسیر هیچ‌کدام را نداشت. authority از نشانی اولویت داشت و روی
   `provider_ref_id` قیدِ یکتا نبود، پس کسی که یک‌بار ارتقا خریده بود
   می‌توانست همان پرداخت را روی سفارش‌های تازه‌ی هم‌قیمت سوار کند و
   ارتقای رایگان بگیرد. و قطعیِ لحظه‌ای درگاه، سفارشِ پرداخت‌شده را
   FAILED می‌کرد.

   مقصد ریدایرکت صفحه‌ای است که واقعا وجود دارد — یک‌بار در ماژول
   مسابقات مقصدی نوشته شده بود که صفحه نداشت و مسیر پویای `[id]`
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

  /* از قبل اعمال شده ⇒ همان پیام موفق. کالبک دوم نباید کاربر را
     بترساند. */
  if (o.applied_at) return done('ok', `&kind=${o.kind}`);

  /* ── درخواست بی‌داده سفارش را «ناموفق» نمی‌کند ──
     پی‌پینگ برای تأیید به کد رهگیری نیاز دارد و آن را فقط در همان
     بازگشت اصلی می‌فرستد. اگر کسی بعدا همین نشانی را بدون پارامتر باز
     کند — تب قدیمی، خزنده، یا تلاش دستی برای بازیابی — نباید سندِ یک
     پرداختِ واقعی را خراب کند. */
  const fromGateway = !!(ret.refId || ret.authority || ret.canceled);
  if (!fromGateway) return done('pending', `&kind=${o.kind}`);

  /* ── شناسه‌ی درگاه از دیتابیس ── */
  const auth = o.provider_authority || '';
  if (!auth) return fail('شناسه‌ی پرداخت نامعتبر است');
  if (ret.authority && ret.authority !== auth) {
    /* هر دو بریده می‌شوند: این مسیر احراز هویت ندارد و تکرارِ بی‌نهایتش
       با بدنه‌ی بزرگ ژورنال را پر می‌کرد. */
    void audit({
      action: 'AD_BOOST_AUTHORITY_MISMATCH', entityType: 'ad_boost', entityId: o.id,
      newValue: { expected: auth.slice(0, 32), got: String(ret.authority).slice(0, 64) },
      ip: clientIp(req) ?? undefined,
    });
    return fail('شناسه‌ی پرداخت با سفارش هم‌خوانی ندارد');
  }

  const provider = getPaymentProvider(o.provider || providerName);
  const v = await provider.verifyPayment({
    paymentId: o.id, authority: auth, amount: o.price, refId: ret.refId, canceled: ret.canceled,
  });

  if (!v.paid) {
    /* فقط پاسخِ قطعی سفارش را می‌بندد. ۴۰۱/۴۲۹/۵xxِ درگاه هم `paid:false`
       می‌دهند؛ آن‌وقت سفارش PENDING می‌ماند تا استعلامِ بعدی — اگر پول
       رفته باشد، هنوز قابلِ اعمال است. */
    const final = (v.ok && v.definitive) || (ret.canceled && !ret.refId);
    if (final) {
      await sb().from('ad_boosts').update({ status: ret.canceled ? 'CANCELED' : 'FAILED' })
        .eq('id', o.id).is('applied_at', null);
    }
    /* «لغو» فقط وقتی پیامِ «مبلغی کم نشده» می‌گیرد که قطعی باشد؛ لغو با کدِ
       رهگیری و پاسخِ نامعلومِ درگاه یعنی شاید پول رفته — «در انتظار». */
    if (ret.canceled && final) return done('cancelled');
    return final ? fail(v.message || 'پرداخت تأیید نشد') : done('pending', `&kind=${o.kind}`);
  }

  /* ⚠️ «قبلا تأیید شده»ی پی‌پینگ (409/110) برای سفارشی که هنوز اعمال نشده.
     آداپتور در این حالت کدِ پیگیری را از **خودِ درخواست** پس می‌دهد و مبلغ
     را نمی‌سنجد؛ پس نمی‌شود ثابت کرد این پرداخت مالِ همین سفارش است — شاید
     کدِ پیگیریِ پرداختِ دیگری است. حالتِ واقعی‌اش نادر است (تأیید موفق و
     بعد شکستِ اعمال)؛ آن را به پشتیبانی می‌سپاریم و ژورنال می‌کنیم. */
  const code = (v.raw as { metaData?: { code?: number } } | undefined)?.metaData?.code;
  if (code === 110) {
    /* دو بازگشتِ هم‌زمانِ همان پرداخت: اولی اعمال کرده و دومی ۱۱۰ گرفته */
    const { data: again } = await sb().from('ad_boosts').select('applied_at').eq('id', o.id).maybeSingle();
    if ((again as { applied_at?: string | null } | null)?.applied_at) return done('ok', `&kind=${o.kind}`);
    void audit({
      action: 'AD_BOOST_ALREADY_VERIFIED', entityType: 'ad_boost', entityId: o.id,
      newValue: { refId: v.refId ?? null }, ip: clientIp(req) ?? undefined,
    });
    return fail('این پرداخت پیش‌تر ثبت شده است؛ اگر ارتقا اعمال نشده با پشتیبانی تماس بگیرید');
  }

  /* ضدِتکرار در خودِ کد — تا وقتی مهاجرتِ ۱۱۱ (ایندکسِ یکتا و بندِ
     `bh_boost_apply`) اجرا نشده هم برقرار باشد. */
  if (v.refId) {
    const { data: dup } = await sb().from('ad_boosts').select('id')
      .eq('provider_ref_id', String(v.refId)).neq('id', o.id).limit(1);
    if (dup && dup.length > 0) {
      void audit({
        action: 'AD_BOOST_REF_REUSED', entityType: 'ad_boost', entityId: o.id,
        newValue: { refId: String(v.refId).slice(0, 64) }, ip: clientIp(req) ?? undefined,
      });
      return fail('این پرداخت قبلا برای سفارشِ دیگری ثبت شده است');
    }
  }

  if (typeof v.amount === 'number' && v.amount !== o.price) {
    await sb().from('ad_boosts').update({ status: 'FAILED' }).eq('id', o.id).is('applied_at', null);
    void audit({
      action: 'AD_BOOST_AMOUNT_MISMATCH', entityType: 'ad_boost', entityId: o.id,
      newValue: { got: v.amount, want: o.price }, ip: clientIp(req) ?? undefined,
    });
    return fail('مبلغ پرداخت با تعرفه مطابقت ندارد');
  }

  const { data, error } = await rpc<{ ok: boolean; kind?: string; reason?: string; urgentUntil?: string | null }>(
    'bh_boost_apply', { p_order: o.id, p_ref: v.refId ?? '' });
  if (error || !data?.ok) {
    /* 23505 = ایندکسِ یکتای کدِ پیگیری در رقابتِ دو کالبکِ هم‌زمان */
    const reused = data?.reason === 'ref_reused' || error?.code === '23505';
    void audit({
      action: reused ? 'AD_BOOST_REF_REUSED' : 'AD_BOOST_APPLY_FAILED',
      entityType: 'ad_boost', entityId: o.id,
      newValue: { error: error?.message ?? data?.reason ?? 'rpc', refId: v.refId ?? null },
      ip: clientIp(req) ?? undefined,
    });
    /* پرداختی که قبلا سفارشِ دیگری را اعمال کرده، پولِ تازه نیست */
    if (reused) return fail('این پرداخت قبلا برای سفارشِ دیگری ثبت شده است');
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

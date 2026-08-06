export const dynamic = 'force-dynamic';
import { callbackOrigin } from '@/lib/site-url';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { getPaymentProvider } from '@/lib/payments';
import { quote, createOrder, eligibleFor } from '@/lib/ads/booking';

/* خرید جایگاه تبلیغاتی → درگاه.

   قیمت هرگز از بدنه‌ی درخواست خوانده نمی‌شود: کلاینت فقط می‌گوید کدام
   جایگاه و کدام پلن، و مبلغ از ردیف همان پلن در دیتابیس درمی‌آید. */
export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'برای خرید تبلیغ ابتدا وارد شوید' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const placementKey = String(b?.placementKey ?? '').trim();
  const planId = String(b?.planId ?? '').trim();
  if (!placementKey || !planId) {
    return NextResponse.json({ message: 'جایگاه و پلن را انتخاب کنید' }, { status: 400 });
  }

  /* ── واجد شرایط بودن ── */
  const elig = await eligibleFor(actor.id);
  if (elig.identityRequired) {
    return NextResponse.json({
      message: 'برای خرید تبلیغ ابتدا هویت خود (کد ملی) را تأیید کنید',
      identityRequired: true,
    }, { status: 403 });
  }
  if (!elig.placements.some(p => p.key === placementKey)) {
    return NextResponse.json({
      message: 'نقش تأییدشده‌ی شما اجازه‌ی خرید این جایگاه را نمی‌دهد',
    }, { status: 403 });
  }

  /* ── قیمت از سرور ── */
  const q = await quote(placementKey, planId);
  if (!q.ok) return NextResponse.json({ message: q.message }, { status: q.status });

  /* ── محتوای تبلیغ ── */
  const content: Record<string, unknown> = (b?.content && typeof b.content === 'object' ? b.content : {});
  if (q.placement.contentKind === 'banner' && !content.image_url && b?.imageUrl) {
    content.image_url = String(b.imageUrl).trim().slice(0, 800);
    content.link_url = String(b?.linkUrl ?? '').trim().slice(0, 800);
  }
  if (q.placement.contentKind === 'entity' && !content.ref && b?.ref) {
    content.entity_type = q.placement.entityType;
    content.ref = String(b.ref).trim().slice(0, 120);
  }
  /* ── جایگاه ویدیویی (پیش‌پخش) ──

     نشانیِ ویدیو باید از خودِ Storage همین سایت باشد، نه هر جای
     اینترنت. دلیلش امنیت نیست فقط: فایلِ بیرونی می‌تواند هر لحظه عوض
     شود یا از دسترس برود، و آن‌وقت تبلیغی که پول برایش داده شده در
     پلیر گیر می‌کند. آپلود از `/api/upload` می‌گذرد که امضای بایتی و
     سقفِ حجم را بررسی می‌کند. */
  if (q.placement.contentKind === 'video') {
    const raw = String(b?.videoUrl ?? content.videoUrl ?? '').trim();
    const ok = /^https?:\/\/[^/]+\/storage\/v1\/object\/public\/[^/]+\/ads\//.test(raw);
    if (!ok) {
      return NextResponse.json(
        { message: 'ویدیوی تبلیغ را از همین فرم بارگذاری کنید' },
        { status: 400 },
      );
    }
    content.videoUrl = raw.slice(0, 800);
    /* مقصدِ کلیک اختیاری است ولی اگر بود باید نشانیِ درست باشد */
    const dest = String(b?.clickUrl ?? content.clickUrl ?? '').trim();
    content.clickUrl = /^https?:\/\//.test(dest) ? dest.slice(0, 800) : null;
  }

  const draft = await createOrder(
    actor.id, q, content,
    String(b?.advertiser ?? '').trim().slice(0, 160),
    String(b?.title ?? '').trim().slice(0, 160),
  );
  if ('error' in draft) return NextResponse.json({ message: draft.error }, { status: 400 });

  /* ── درگاه ── */
  const provider = getPaymentProvider();
  const callbackUrl = `${callbackOrigin()}/api/ads/campaigns/callback/${provider.name}?order=${draft.orderId}`;

  const res = await provider.createPayment({
    paymentId: draft.orderId,
    amount: draft.amount,
    description: `تبلیغ — ${q.placement.title} (${q.plan.name})`,
    callbackUrl,
  });

  if (!res.ok || !res.redirectUrl) {
    await sb().from('campaign_orders').update({ status: 'FAILED' }).eq('id', draft.orderId);
    await sb().from('campaigns').update({ status: 'CANCELLED' }).eq('id', draft.campaignId);
    return NextResponse.json({ message: res.message || 'اتصال به درگاه انجام نشد' }, { status: 502 });
  }

  await sb().from('campaign_orders').update({
    provider: provider.name, provider_authority: res.authority ?? null,
  }).eq('id', draft.orderId);

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'CAMPAIGN_ORDER_CREATED',
    entityType: 'campaign_order', entityId: draft.orderId,
    newValue: { placementKey, planId, amount: draft.amount, provider: provider.name },
    ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({
    orderId: draft.orderId,
    campaignId: draft.campaignId,
    amount: draft.amount,
    redirectUrl: res.redirectUrl,
  });
}

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, rpc, actorFromRequest, audit } from '@/lib/finance/db';
import { can } from '@/lib/admin/permissions';
import {
  listPlacements, updatePlacement, getPlacement,
  listCampaigns, createCampaign, updateCampaign, deleteCampaign,
  listPricingPlans, updatePricingPlan, createPricingPlan, deletePricingPlan,
  validateContent, isPlacementKey, isCampaignStatus, expireCampaigns,
  isRotationMode, adStats,
  type PlacementMode, type RotationMode,
} from '@/lib/ads/core';

/* پنل ادمین سیستم تبلیغات (فاز ۲) — جایگاه‌ها، کمپین‌ها، پلن‌های
   قیمت‌گذاری و درخواست‌های تبلیغ. جایگزین /api/admin/ad-slots.

   هر جایگاه مستقل است: is_active و mode جدا؛ هیچ کلید سراسری‌ای
   خوانده یا نوشته نمی‌شود. */

/* اعداد ورودی ممکن است فارسی باشند. علامت منفی عمداً حفظ می‌شود:
   «اولویت ‎−۳» یعنی پایین‌ترین اولویت، نه ‎+۳. سقف هم لازم است چون
   عدد بزرگ‌تر از integer پستگرس، خطای ۵۰۰ می‌داد. */
const MAX_INT = 2_000_000_000;
const num = (v: unknown, d = 0) => {
  if (v !== null && typeof v === 'object') return d;          // آرایه/آبجکت عدد نیست
  const raw = String(v ?? '').replace(/[۰-۹]/g, x => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x)));
  const neg = /^\s*-/.test(raw);
  const cleaned = raw.replace(/[^0-9.]/g, '');
  if (!cleaned) return d;                                     // ورودی بی‌عدد ⇒ پیش‌فرض
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return d;
  return Math.max(-MAX_INT, Math.min(MAX_INT, neg ? -n : n));
};
const str = (v: unknown, max = 300) => String(v ?? '').trim().slice(0, max);

async function guard(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return { err: NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 }) };
  if (!(await can(actor.id, 'advertising'))) return { err: NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 }) };
  return { actor };
}

export async function GET(req: NextRequest) {
  const g = await guard(req);
  if (g.err) return g.err;

  try {
    /* قبل از نمایش، وضعیت‌ها با واقعیت همگام می‌شوند تا کمپین تمام‌شده
       در پنل «ACTIVE» دیده نشود — نقص سیستم قبلی */
    await expireCampaigns();

    const [placements, campaigns, plans, requests] = await Promise.all([
      listPlacements(),
      listCampaigns(),
      listPricingPlans(false),
      sb().from('ad_requests').select('*').order('created_at', { ascending: false }).limit(200)
        .then(r => (r.error ? [] : (r.data ?? []))),
    ]);
    /* آمار جداگانه و روی همه‌ی ردیف‌ها حساب می‌شود؛ فهرست بالا برای
       نمایش پنل صفحه‌بندی شده و مبنای درستی برای KPI نیست. */
    const stats = await adStats(placements);
    return NextResponse.json({ placements, campaigns, plans, requests, stats }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ placements: [], campaigns: [], plans: [], requests: [], stats: null });
  }
}

/* ساخت کمپین یا پلن تازه */
export async function POST(req: NextRequest) {
  const g = await guard(req);
  if (g.err) return g.err;

  const b = await req.json().catch(() => ({}));

  /* ── پلن قیمت‌گذاری ── */
  if (b?.type === 'plan') {
    const name = str(b?.name, 80);
    if (!name) return NextResponse.json({ message: 'نام پلن لازم است' }, { status: 400 });
    const plan = await createPricingPlan({
      name, description: str(b?.description, 400),
      placementKey: isPlacementKey(b?.placementKey) ? b.placementKey : null,
      price: num(b?.price), durationDays: num(b?.durationDays, 30),
      adQuantity: num(b?.adQuantity), creditAmount: num(b?.creditAmount),
      sortOrder: num(b?.sortOrder), badge: str(b?.badge, 40),
    });
    if (!plan) return NextResponse.json({ message: 'ساخت پلن انجام نشد' }, { status: 500 });
    void audit({ actorId: g.actor!.id, actorRole: g.actor!.role, action: 'AD_PRICING_PLAN_CREATED', entityType: 'ad_pricing_plan', entityId: plan.id, newValue: { name, price: plan.price } });
    return NextResponse.json({ plan }, { status: 201 });
  }

  /* ── کمپین ── */
  if (!isPlacementKey(b?.placementKey)) return NextResponse.json({ message: 'جایگاه نامعتبر است' }, { status: 400 });
  const placement = await getPlacement(b.placementKey);
  if (!placement) return NextResponse.json({ message: 'جایگاه پیدا نشد' }, { status: 404 });

  const content = (b?.content && typeof b.content === 'object' ? b.content : {}) as Record<string, unknown>;
  /* بنر می‌تواند با فیلدهای تخت فرم هم بیاید */
  if (placement.contentKind === 'banner' && !content.image_url && b?.imageUrl) {
    content.image_url = str(b.imageUrl, 800);
    content.link_url = str(b?.linkUrl, 800);
  }
  if (placement.contentKind === 'entity' && !content.ref && b?.ref) {
    content.entity_type = placement.entityType;
    content.ref = str(b.ref, 120);
  }

  const invalid = validateContent(placement, content);
  if (invalid) return NextResponse.json({ message: invalid }, { status: 400 });

  const status = isCampaignStatus(b?.status) ? b.status : 'ACTIVE';   // ادمین‌ساخته پیش‌فرض فعال
  const campaign = await createCampaign({
    placementKey: b.placementKey,
    advertiser: str(b?.advertiser, 160),
    title: str(b?.title, 160),
    content, status,
    startsAt: b?.startsAt ? String(b.startsAt) : undefined,
    endsAt: b?.endsAt ? String(b.endsAt) : undefined,
    durationDays: b?.durationDays !== undefined ? num(b.durationDays, placement.durationDays) : undefined,
    weight: num(b?.weight, 1), sortOrder: num(b?.sortOrder),
    adminNote: str(b?.adminNote, 500),
  });
  if (!campaign) return NextResponse.json({ message: 'ساخت کمپین انجام نشد' }, { status: 500 });

  void audit({
    actorId: g.actor!.id, actorRole: g.actor!.role, action: 'CAMPAIGN_CREATED',
    entityType: 'campaign', entityId: campaign.id,
    newValue: { placementKey: campaign.placementKey, status: campaign.status },
  });
  return NextResponse.json({ campaign }, { status: 201 });
}

/* ویرایش جایگاه، کمپین یا پلن */
export async function PATCH(req: NextRequest) {
  const g = await guard(req);
  if (g.err) return g.err;

  const b = await req.json().catch(() => ({}));

  /* ── جایگاه: is_active و mode مستقل ── */
  if (b?.placementKey && !b?.campaignId && !b?.planId) {
    if (!isPlacementKey(b.placementKey)) return NextResponse.json({ message: 'جایگاه نامعتبر است' }, { status: 400 });
    const patch: Parameters<typeof updatePlacement>[1] = {};
    if (b.isActive !== undefined) patch.isActive = !!b.isActive;
    if (b.mode !== undefined && ['free', 'manual', 'paid'].includes(String(b.mode))) patch.mode = String(b.mode) as PlacementMode;
    if (b.capacity !== undefined) patch.capacity = num(b.capacity);
    if (b.price !== undefined) patch.price = num(b.price);
    if (b.durationDays !== undefined) patch.durationDays = num(b.durationDays, 30);
    /* کنترل‌های فاز ۴ — هر کدام مستقل */
    if (b.displayCount !== undefined) patch.displayCount = num(b.displayCount);
    if (b.rotationMode !== undefined) {
      /* مقدار نرمال‌شده ذخیره می‌شود، نه ورودی خام: ['fair'] هم
         String() را رد می‌کند ولی آرایه به ستون text نمی‌رود و ۵۰۰ می‌داد */
      if (typeof b.rotationMode !== 'string' || !isRotationMode(b.rotationMode)) {
        return NextResponse.json({ message: 'حالت چرخش نامعتبر است' }, { status: 400 });
      }
      patch.rotationMode = b.rotationMode as RotationMode;
    }
    if (b.priority !== undefined) patch.priority = num(b.priority);

    const placement = await updatePlacement(b.placementKey, patch);
    if (!placement) return NextResponse.json({ message: 'ویرایش جایگاه انجام نشد' }, { status: 500 });
    void audit({ actorId: g.actor!.id, actorRole: g.actor!.role, action: 'PLACEMENT_UPDATED', entityType: 'placement', entityId: b.placementKey, newValue: patch });
    return NextResponse.json({ placement });
  }

  /* ── پلن قیمت‌گذاری ── */
  if (b?.planId) {
    const patch: Parameters<typeof updatePricingPlan>[1] = {};
    if (b.name !== undefined) patch.name = str(b.name, 80);
    if (b.description !== undefined) patch.description = str(b.description, 400);
    if (b.price !== undefined) patch.price = num(b.price);
    if (b.durationDays !== undefined) patch.durationDays = num(b.durationDays, 30);
    if (b.adQuantity !== undefined) patch.adQuantity = num(b.adQuantity);
    if (b.creditAmount !== undefined) patch.creditAmount = num(b.creditAmount);
    if (b.isActive !== undefined) patch.isActive = !!b.isActive;
    if (b.sortOrder !== undefined) patch.sortOrder = num(b.sortOrder);
    if (b.badge !== undefined) patch.badge = str(b.badge, 40);
    /* جابه‌جایی پلن بین جایگاه‌ها — رشته‌ی خالی یعنی پلن عمومی */
    if (b.placementKey !== undefined) {
      patch.placementKey = isPlacementKey(b.placementKey) ? String(b.placementKey) : null;
    }

    const plan = await updatePricingPlan(str(b.planId, 60), patch);
    if (!plan) return NextResponse.json({ message: 'ویرایش پلن انجام نشد' }, { status: 500 });
    void audit({ actorId: g.actor!.id, actorRole: g.actor!.role, action: 'AD_PRICING_PLAN_UPDATED', entityType: 'ad_pricing_plan', entityId: plan.id, newValue: patch });
    return NextResponse.json({ plan });
  }

  /* ── کمپین (شامل تغییر وضعیت) ── */
  const id = str(b?.campaignId, 60);
  if (!id) return NextResponse.json({ message: 'شناسه لازم است' }, { status: 400 });

  if (b?.status !== undefined && !isCampaignStatus(b.status)) {
    return NextResponse.json({ message: 'وضعیت کمپین نامعتبر است' }, { status: 400 });
  }

  /* تأیید کمپین خریداری‌شده: پنجره‌ی زمانی از لحظه‌ی تأیید شروع شود،
     نه از لحظه‌ی پرداخت — وگرنه تأخیر بررسی ادمین از مدتی که
     تبلیغ‌دهنده پول داده کم می‌کرد. */
  if (b?.status === 'ACTIVE' || b?.status === 'SCHEDULED') {
    const { data: cur } = await sb().from('campaigns').select('status').eq('id', id).maybeSingle();
    if ((cur as { status?: string } | null)?.status === 'PENDING_REVIEW') {
      const startsAt = b?.startsAt ? new Date(String(b.startsAt)).toISOString() : null;
      const { error } = await rpc('bh_approve_campaign', { p_campaign_id: id, p_start: startsAt });
      if (!error) {
        void audit({
          actorId: g.actor!.id, actorRole: g.actor!.role, action: 'CAMPAIGN_APPROVED',
          entityType: 'campaign', entityId: id, newValue: { startsAt },
        });
        const fresh = await listCampaigns({ placementKey: undefined });
        return NextResponse.json({ campaign: fresh.find(c => c.id === id) ?? null });
      }
    }
  }

  const campaign = await updateCampaign(id, b);
  if (!campaign) return NextResponse.json({ message: 'ویرایش کمپین انجام نشد' }, { status: 500 });
  void audit({ actorId: g.actor!.id, actorRole: g.actor!.role, action: 'CAMPAIGN_UPDATED', entityType: 'campaign', entityId: id, newValue: { status: campaign.status } });
  return NextResponse.json({ campaign });
}

export async function DELETE(req: NextRequest) {
  const g = await guard(req);
  if (g.err) return g.err;

  const sp = new URL(req.url).searchParams;

  const campaignId = sp.get('campaign') ?? '';
  if (campaignId) {
    const ok = await deleteCampaign(campaignId);
    if (!ok) return NextResponse.json({ message: 'حذف انجام نشد' }, { status: 500 });
    void audit({ actorId: g.actor!.id, actorRole: g.actor!.role, action: 'CAMPAIGN_DELETED', entityType: 'campaign', entityId: campaignId });
    return NextResponse.json({ ok: true });
  }

  /* بستن درخواست تبلیغ (حذف نیست) */
  const reqId = sp.get('request') ?? '';
  if (reqId) {
    const { error } = await sb().from('ad_requests').update({ status: 'CLOSED' }).eq('id', reqId);
    return error ? NextResponse.json({ message: 'انجام نشد' }, { status: 500 }) : NextResponse.json({ ok: true });
  }

  /* پلن: اگر سفارشی به آن ارجاع دارد فقط غیرفعال می‌شود، وگرنه واقعاً
     حذف. با ?mode=disable همیشه فقط غیرفعال می‌شود. */
  const planId = sp.get('plan') ?? '';
  if (planId) {
    if (sp.get('mode') === 'disable') {
      const plan = await updatePricingPlan(planId, { isActive: false });
      if (!plan) return NextResponse.json({ message: 'انجام نشد' }, { status: 500 });
      void audit({ actorId: g.actor!.id, actorRole: g.actor!.role, action: 'AD_PRICING_PLAN_DISABLED', entityType: 'ad_pricing_plan', entityId: planId });
      return NextResponse.json({ ok: true, deactivated: true });
    }
    const res = await deletePricingPlan(planId);
    if (!res.ok) return NextResponse.json({ message: res.message ?? 'انجام نشد' }, { status: 500 });
    void audit({
      actorId: g.actor!.id, actorRole: g.actor!.role,
      action: res.deactivated ? 'AD_PRICING_PLAN_DISABLED' : 'AD_PRICING_PLAN_DELETED',
      entityType: 'ad_pricing_plan', entityId: planId,
    });
    return NextResponse.json(res);
  }

  return NextResponse.json({ message: 'شناسه لازم است' }, { status: 400 });
}

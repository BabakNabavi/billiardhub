export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin, audit } from '@/lib/finance/db';
import {
  listPlacements, updatePlacement, getPlacement,
  listCampaigns, createCampaign, updateCampaign, deleteCampaign,
  listPricingPlans, updatePricingPlan, createPricingPlan,
  validateContent, isPlacementKey, isCampaignStatus, expireCampaigns,
  type PlacementMode,
} from '@/lib/ads/core';

/* پنلِ ادمینِ سیستمِ تبلیغات (فاز ۲) — جایگاه‌ها، کمپین‌ها، پلن‌های
   قیمت‌گذاری و درخواست‌های تبلیغ. جایگزینِ /api/admin/ad-slots.

   هر جایگاه مستقل است: is_active و mode جدا؛ هیچ کلیدِ سراسری‌ای
   خوانده یا نوشته نمی‌شود. */

const num = (v: unknown, d = 0) => {
  const n = Number(String(v ?? '').replace(/[۰-۹]/g, x => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x))).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : d;
};
const str = (v: unknown, max = 300) => String(v ?? '').trim().slice(0, max);

async function guard(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return { err: NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 }) };
  if (!(await isAdmin(actor.id))) return { err: NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 }) };
  return { actor };
}

export async function GET(req: NextRequest) {
  const g = await guard(req);
  if (g.err) return g.err;

  try {
    /* قبل از نمایش، وضعیت‌ها با واقعیت همگام می‌شوند تا کمپینِ تمام‌شده
       در پنل «ACTIVE» دیده نشود — نقصِ سیستمِ قبلی */
    await expireCampaigns();

    const [placements, campaigns, plans, requests] = await Promise.all([
      listPlacements(),
      listCampaigns(),
      listPricingPlans(false),
      sb().from('ad_requests').select('*').order('created_at', { ascending: false }).limit(200)
        .then(r => (r.error ? [] : (r.data ?? []))),
    ]);
    return NextResponse.json({ placements, campaigns, plans, requests }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ placements: [], campaigns: [], plans: [], requests: [] });
  }
}

/* ساختِ کمپین یا پلنِ تازه */
export async function POST(req: NextRequest) {
  const g = await guard(req);
  if (g.err) return g.err;

  const b = await req.json().catch(() => ({}));

  /* ── پلنِ قیمت‌گذاری ── */
  if (b?.type === 'plan') {
    const name = str(b?.name, 80);
    if (!name) return NextResponse.json({ message: 'نامِ پلن لازم است' }, { status: 400 });
    const plan = await createPricingPlan({
      name, description: str(b?.description, 400),
      placementKey: isPlacementKey(b?.placementKey) ? b.placementKey : null,
      price: num(b?.price), durationDays: num(b?.durationDays, 30),
      adQuantity: num(b?.adQuantity), sortOrder: num(b?.sortOrder), badge: str(b?.badge, 40),
    });
    if (!plan) return NextResponse.json({ message: 'ساختِ پلن انجام نشد' }, { status: 500 });
    void audit({ actorId: g.actor!.id, actorRole: g.actor!.role, action: 'AD_PRICING_PLAN_CREATED', entityType: 'ad_pricing_plan', entityId: plan.id, newValue: { name, price: plan.price } });
    return NextResponse.json({ plan }, { status: 201 });
  }

  /* ── کمپین ── */
  if (!isPlacementKey(b?.placementKey)) return NextResponse.json({ message: 'جایگاه نامعتبر است' }, { status: 400 });
  const placement = await getPlacement(b.placementKey);
  if (!placement) return NextResponse.json({ message: 'جایگاه پیدا نشد' }, { status: 404 });

  const content = (b?.content && typeof b.content === 'object' ? b.content : {}) as Record<string, unknown>;
  /* بنر می‌تواند با فیلدهای تختِ فرم هم بیاید */
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
  if (!campaign) return NextResponse.json({ message: 'ساختِ کمپین انجام نشد' }, { status: 500 });

  void audit({
    actorId: g.actor!.id, actorRole: g.actor!.role, action: 'CAMPAIGN_CREATED',
    entityType: 'campaign', entityId: campaign.id,
    newValue: { placementKey: campaign.placementKey, status: campaign.status },
  });
  return NextResponse.json({ campaign }, { status: 201 });
}

/* ویرایشِ جایگاه، کمپین یا پلن */
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

    const placement = await updatePlacement(b.placementKey, patch);
    if (!placement) return NextResponse.json({ message: 'ویرایشِ جایگاه انجام نشد' }, { status: 500 });
    void audit({ actorId: g.actor!.id, actorRole: g.actor!.role, action: 'PLACEMENT_UPDATED', entityType: 'placement', entityId: b.placementKey, newValue: patch });
    return NextResponse.json({ placement });
  }

  /* ── پلنِ قیمت‌گذاری ── */
  if (b?.planId) {
    const patch: Parameters<typeof updatePricingPlan>[1] = {};
    if (b.name !== undefined) patch.name = str(b.name, 80);
    if (b.description !== undefined) patch.description = str(b.description, 400);
    if (b.price !== undefined) patch.price = num(b.price);
    if (b.durationDays !== undefined) patch.durationDays = num(b.durationDays, 30);
    if (b.adQuantity !== undefined) patch.adQuantity = num(b.adQuantity);
    if (b.isActive !== undefined) patch.isActive = !!b.isActive;
    if (b.sortOrder !== undefined) patch.sortOrder = num(b.sortOrder);
    if (b.badge !== undefined) patch.badge = str(b.badge, 40);

    const plan = await updatePricingPlan(str(b.planId, 60), patch);
    if (!plan) return NextResponse.json({ message: 'ویرایشِ پلن انجام نشد' }, { status: 500 });
    void audit({ actorId: g.actor!.id, actorRole: g.actor!.role, action: 'AD_PRICING_PLAN_UPDATED', entityType: 'ad_pricing_plan', entityId: plan.id, newValue: patch });
    return NextResponse.json({ plan });
  }

  /* ── کمپین (شاملِ تغییرِ وضعیت) ── */
  const id = str(b?.campaignId, 60);
  if (!id) return NextResponse.json({ message: 'شناسه لازم است' }, { status: 400 });

  if (b?.status !== undefined && !isCampaignStatus(b.status)) {
    return NextResponse.json({ message: 'وضعیتِ کمپین نامعتبر است' }, { status: 400 });
  }
  const campaign = await updateCampaign(id, b);
  if (!campaign) return NextResponse.json({ message: 'ویرایشِ کمپین انجام نشد' }, { status: 500 });
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

  /* بستنِ درخواستِ تبلیغ (حذف نیست) */
  const reqId = sp.get('request') ?? '';
  if (reqId) {
    const { error } = await sb().from('ad_requests').update({ status: 'CLOSED' }).eq('id', reqId);
    return error ? NextResponse.json({ message: 'انجام نشد' }, { status: 500 }) : NextResponse.json({ ok: true });
  }

  /* پلن حذف نمی‌شود — فقط غیرفعال (سفارش‌ها به آن ارجاع خواهند داشت) */
  const planId = sp.get('plan') ?? '';
  if (planId) {
    const plan = await updatePricingPlan(planId, { isActive: false });
    return plan ? NextResponse.json({ ok: true }) : NextResponse.json({ message: 'انجام نشد' }, { status: 500 });
  }

  return NextResponse.json({ message: 'شناسه لازم است' }, { status: 400 });
}

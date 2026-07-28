export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin, audit } from '@/lib/finance/db';
import {
  listSlots, updateSlot, listPlacements, createPlacement, updatePlacement, deletePlacement, isSlotKey,
} from '@/lib/ads/slots';

/* جایگاه‌های تبلیغاتی و بنرها — فقط ادمین.
   ظرفیت/قیمت/مدتِ هر جایگاه و بنرهای اجاره‌شده همه از این‌جا. */

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
    const [slots, placements, reqRows] = await Promise.all([
      listSlots(),
      listPlacements(),
      sb().from('ad_requests').select('*').order('created_at', { ascending: false }).limit(200)
        .then(r => (r.error ? [] : (r.data ?? []))),
    ]);
    return NextResponse.json({ slots, placements, requests: reqRows }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ slots: [], placements: [], requests: [] });
  }
}

/* ساختِ بنرِ تازه در یک جایگاه */
export async function POST(req: NextRequest) {
  const g = await guard(req);
  if (g.err) return g.err;

  const b = await req.json().catch(() => ({}));
  if (!isSlotKey(b?.slotKey)) return NextResponse.json({ message: 'جایگاه نامعتبر است' }, { status: 400 });

  const imageUrl = str(b?.imageUrl, 800);
  if (!imageUrl) return NextResponse.json({ message: 'تصویرِ بنر لازم است' }, { status: 400 });

  const slot = (await listSlots()).find(s => s.key === b.slotKey);
  const placement = await createPlacement({
    slotKey: b.slotKey,
    advertiser: str(b?.advertiser, 160),
    title: str(b?.title, 160),
    imageUrl,
    linkUrl: str(b?.linkUrl, 800),
    durationDays: Math.round(num(b?.durationDays, slot?.durationDays ?? 30)),
  });
  if (!placement) return NextResponse.json({ message: 'ثبتِ بنر انجام نشد' }, { status: 500 });

  void audit({ actorId: g.actor!.id, actorRole: g.actor!.role, action: 'AD_PLACEMENT_CREATED', entityType: 'ad_placement', entityId: placement.id, newValue: { slotKey: b.slotKey } });
  return NextResponse.json({ placement }, { status: 201 });
}

/* ویرایشِ جایگاه (قیمت/ظرفیت/مدت) یا وضعیتِ یک بنر */
export async function PATCH(req: NextRequest) {
  const g = await guard(req);
  if (g.err) return g.err;

  const b = await req.json().catch(() => ({}));

  if (b?.slotKey && !b?.placementId) {
    if (!isSlotKey(b.slotKey)) return NextResponse.json({ message: 'جایگاه نامعتبر است' }, { status: 400 });
    const patch: Parameters<typeof updateSlot>[1] = {};
    if (b.capacity !== undefined) patch.capacity = num(b.capacity);
    if (b.price !== undefined) patch.price = num(b.price);
    if (b.durationDays !== undefined) patch.durationDays = num(b.durationDays, 30);
    if (b.isActive !== undefined) patch.isActive = !!b.isActive;

    const slot = await updateSlot(b.slotKey, patch);
    if (!slot) return NextResponse.json({ message: 'ویرایشِ جایگاه انجام نشد' }, { status: 500 });
    void audit({ actorId: g.actor!.id, actorRole: g.actor!.role, action: 'AD_SLOT_UPDATED', entityType: 'ad_slot', entityId: b.slotKey, newValue: patch });
    return NextResponse.json({ slot });
  }

  const id = str(b?.placementId, 60);
  if (!id) return NextResponse.json({ message: 'شناسه لازم است' }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (['ACTIVE', 'PAUSED', 'EXPIRED'].includes(String(b?.status))) patch.status = b.status;
  if (b?.title !== undefined) patch.title = str(b.title, 160);
  if (b?.linkUrl !== undefined) patch.link_url = str(b.linkUrl, 800);
  if (b?.imageUrl !== undefined) patch.image_url = str(b.imageUrl, 800);
  if (b?.advertiser !== undefined) patch.advertiser = str(b.advertiser, 160);
  if (b?.extendDays !== undefined) {
    const days = Math.max(1, Math.round(num(b.extendDays, 30)));
    patch.ends_at = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ message: 'تغییری فرستاده نشد' }, { status: 400 });

  const placement = await updatePlacement(id, patch);
  if (!placement) return NextResponse.json({ message: 'ویرایشِ بنر انجام نشد' }, { status: 500 });
  return NextResponse.json({ placement });
}

export async function DELETE(req: NextRequest) {
  const g = await guard(req);
  if (g.err) return g.err;

  const sp = new URL(req.url).searchParams;
  const id = sp.get('placement') ?? '';
  if (id) {
    const ok = await deletePlacement(id);
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ message: 'حذف انجام نشد' }, { status: 500 });
  }

  /* بستنِ یک درخواستِ تبلیغ */
  const reqId = sp.get('request') ?? '';
  if (reqId) {
    const { error } = await sb().from('ad_requests').update({ status: 'CLOSED' }).eq('id', reqId);
    return error ? NextResponse.json({ message: 'انجام نشد' }, { status: 500 }) : NextResponse.json({ ok: true });
  }

  return NextResponse.json({ message: 'شناسه لازم است' }, { status: 400 });
}

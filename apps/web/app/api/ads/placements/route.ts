export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import {
  livePlacements, trackCampaign, listPlacements, expireCampaigns,
  isPlacementKey, LEGACY_KEY_MAP, type EntityType,
} from '@/lib/ads/core';
import { resolveEntities, type EntitySnapshot } from '@/lib/ads/resolve';

/* محتوای زنده‌ی جایگاه‌های تبلیغاتی — عمومی.

   هر جایگاه فقط با is_active خودش دیده می‌شود؛ هیچ کلیدِ سراسری‌ای
   وجود ندارد. کمپین‌های «موجودیتی» همین‌جا سمتِ سرور به اسنپ‌شاتِ
   کارت تبدیل می‌شوند تا کلاینت به اسکیمای جدول‌ها وابسته نباشد. */

interface LiveOut {
  contentKind: 'banner' | 'entity';
  campaigns: {
    id: string; title: string; advertiser: string; weight: number;
    banner?: { imageUrl: string; linkUrl: string };
    entity?: EntitySnapshot;
  }[];
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const rawKey = sp.get('placement') ?? undefined;
  const key = rawKey ? (LEGACY_KEY_MAP[rawKey] ?? rawKey) : undefined;
  if (key && !isPlacementKey(key)) return NextResponse.json({ placements: {} });

  /* فهرستِ جایگاه‌ها با تعرفه — برای فرمِ درخواستِ تبلیغ */
  if (sp.get('catalog') === '1') {
    try {
      const all = (await listPlacements()).filter(p => p.isActive || p.mode === 'paid');
      return NextResponse.json({
        placements: all.map(p => ({
          key: p.key, title: p.title, description: p.description,
          mode: p.mode, price: p.price, durationDays: p.durationDays, isActive: p.isActive,
        })),
      }, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
      return NextResponse.json({ placements: [] });
    }
  }

  try {
    /* انقضای lazy: هیچ کمپینِ تمام‌شده‌ای حتی اگر cron عقب باشد نمایش
       داده نمی‌شود (پنجره‌ی زمانی هم فیلتر می‌شود؛ این فقط status را با
       واقعیت همگام می‌کند). await عمدی است: روی سرورلسِ Vercel، کارِ
       رهاشده بعد از پاسخ ممکن است هرگز اجرا نشود. */
    await expireCampaigns();

    const live = await livePlacements(key);
    const out: Record<string, LiveOut> = {};

    for (const [k, v] of Object.entries(live)) {
      const item: LiveOut = { contentKind: v.placement.contentKind, campaigns: [] };

      if (v.placement.contentKind === 'banner') {
        for (const c of v.campaigns) {
          item.campaigns.push({
            id: c.id, title: c.title, advertiser: c.advertiser, weight: c.weight,
            banner: {
              imageUrl: String((c.content as Record<string, unknown>).image_url ?? ''),
              linkUrl: String((c.content as Record<string, unknown>).link_url ?? ''),
            },
          });
        }
      } else {
        const entityType = (v.placement.entityType ?? 'product') as EntityType;
        const refs = v.campaigns.map(c => String((c.content as Record<string, unknown>).ref ?? '')).filter(Boolean);
        const snaps = await resolveEntities(entityType, refs);
        const byRef = new Map(snaps.map(s => [s.ref, s]));
        for (const c of v.campaigns) {
          const snap = byRef.get(String((c.content as Record<string, unknown>).ref ?? ''));
          if (!snap) continue;               // موجودیتِ حذف‌شده — کمپینِ یتیم نمایش داده نمی‌شود
          item.campaigns.push({ id: c.id, title: c.title, advertiser: c.advertiser, weight: c.weight, entity: snap });
        }
      }

      out[k] = item;
    }

    return NextResponse.json({ placements: out }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ placements: {} });
  }
}

/* شمارشِ نمایش/کلیک — اتمیک در دیتابیس؛ شکستش نباید صفحه را خراب کند.
   await عمدی است: روی سرورلسِ Vercel، Promiseِ رهاشده بعد از پاسخ ممکن
   است هرگز اجرا نشود و شمارنده گم شود؛ sendBeacon هم منتظرِ پاسخ نمی‌ماند
   پس این await هیچ هزینه‌ای برای کاربر ندارد. */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const id = String(b?.id ?? '').trim();
  const kind = b?.kind === 'click' ? 'click' : 'impression';
  if (/^[0-9a-f-]{36}$/i.test(id)) await trackCampaign(id, kind);
  return NextResponse.json({ ok: true });
}

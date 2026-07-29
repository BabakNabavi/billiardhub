export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { livePlacements, listPlacements, trackCampaign, LEGACY_KEY_MAP } from '@/lib/ads/core';

/* ⚠ سازگاری با نسخه‌ی قدیمی — DEPRECATED.

   سیستم جایگاه‌ها در فاز ۲ به /api/ads/placements منتقل شد (جدول‌های
   placements/campaigns). این مسیر فقط برای کلاینت‌های کش‌شده‌ای مانده
   که هنوز باندلِ قدیمی را دارند و با کلیدهای market_1/market_2/footer
   صدا می‌زنند؛ خروجی از سیستمِ جدید ساخته و به شکلِ قدیمی برگردانده
   می‌شود. پس از چند دیپلوی می‌توان حذفش کرد. */

const NEW_TO_LEGACY: Record<string, string> = Object.fromEntries(
  Object.entries(LEGACY_KEY_MAP).map(([legacy, next]) => [next, legacy]),
);

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;

  if (sp.get('catalog') === '1') {
    try {
      /* همان گیتِ فاز ۴ که در مسیرِ جدید هست: فقط جایگاهِ «پولی» قابلِ
         خرید است. بدونِ این شرط، کلاینتِ قدیمی راهِ دورزدنِ گیت می‌شد. */
      const all = (await listPlacements()).filter(p => p.contentKind === 'banner' && p.mode === 'paid');
      return NextResponse.json({
        slots: all.map(p => ({
          key: NEW_TO_LEGACY[p.key] ?? p.key, title: p.title, description: p.description,
          capacity: p.capacity, price: p.price, durationDays: p.durationDays, isActive: p.isActive,
        })),
      });
    } catch {
      return NextResponse.json({ slots: [] });
    }
  }

  try {
    const rawSlot = sp.get('slot') ?? undefined;
    const key = rawSlot ? (LEGACY_KEY_MAP[rawSlot] ?? rawSlot) : undefined;
    const live = await livePlacements(key);

    const banners: Record<string, { id: string; title: string; imageUrl: string; linkUrl: string; advertiser: string }[]> = {};
    let any = false;
    for (const [k, v] of Object.entries(live)) {
      if (v.placement.contentKind !== 'banner') continue;
      const legacy = NEW_TO_LEGACY[k] ?? k;
      banners[legacy] = v.campaigns.map(c => ({
        id: c.id, title: c.title,
        imageUrl: String((c.content as Record<string, unknown>).image_url ?? ''),
        linkUrl: String((c.content as Record<string, unknown>).link_url ?? ''),
        advertiser: c.advertiser,
      }));
      if (banners[legacy].length) any = true;
    }
    return NextResponse.json({ banners, enabled: any }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ banners: {}, enabled: false });
  }
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const id = String(b?.id ?? '').trim();
  const kind = b?.kind === 'click' ? 'click' : 'impression';
  /* await عمدی — Promiseِ رهاشده روی سرورلس ممکن است هرگز اجرا نشود */
  if (/^[0-9a-f-]{36}$/i.test(id)) await trackCampaign(id, kind);
  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { livePlacements, listPlacements, trackCampaign, LEGACY_KEY_MAP } from '@/lib/ads/core';
import { viewerHash } from '@/lib/ads/preroll';
import { hitRateLimit, ipOf } from '@/lib/auth/rate-limit';

/* کفِ ضدِتورم، نه شمارشِ اصلی (آن را dedupeِ ساعتیِ هر بیننده می‌کند): گشاد تا
   کاربرانِ پشتِ یک IPِ مشترکِ اپراتور (CGNAT) نمایشِ واقعی را از دست ندهند. */
const AD_BEACON_RULE = { action: 'ad_beacon', max: 300, windowSec: 600 };

/* ⚠ سازگاری با نسخه‌ی قدیمی — DEPRECATED.

   سیستم جایگاه‌ها در فاز ۲ به /api/ads/placements منتقل شد (جدول‌های
   placements/campaigns). این مسیر فقط برای کلاینت‌های کش‌شده‌ای مانده
   که هنوز باندل قدیمی را دارند و با کلیدهای market_1/market_2/footer
   صدا می‌زنند؛ خروجی از سیستم جدید ساخته و به شکل قدیمی برگردانده
   می‌شود. پس از چند دیپلوی می‌توان حذفش کرد. */

const NEW_TO_LEGACY: Record<string, string> = Object.fromEntries(
  Object.entries(LEGACY_KEY_MAP).map(([legacy, next]) => [next, legacy]),
);

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;

  if (sp.get('catalog') === '1') {
    try {
      /* همان گیت فاز ۴ که در مسیر جدید هست: فقط جایگاه «پولی» قابل
         خرید است. بدون این شرط، کلاینت قدیمی راه دورزدن گیت می‌شد. */
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
  /* await عمدی — Promise رهاشده روی سرورلس ممکن است هرگز اجرا نشود */
  /* ⚠️ هر بیننده در ساعت یک بار (مهاجرتِ ۱۱۲) — شناسه از `ipOf` (x-real-ipِ nginx، نه
     XFFِ دست‌کاری‌پذیر) + مرورگر. چون مرورگر را کلاینت می‌فرستد، سقفِ هر IP هم هست
     تا عوض‌کردنِ User-Agent در حلقه آمار را باد نکند. بیکن منتظرِ پاسخ نیست، پس
     درخواستِ سقف‌خورده فقط شمرده نمی‌شود — ۴۲۹ نمی‌گیرد. */
  if (/^[0-9a-f-]{36}$/i.test(id)) {
    const rl = await hitRateLimit(req, AD_BEACON_RULE);
    if (rl.ok) await trackCampaign(id, kind, viewerHash(ipOf(req), req.headers.get('user-agent')));
  }
  return NextResponse.json({ ok: true });
}

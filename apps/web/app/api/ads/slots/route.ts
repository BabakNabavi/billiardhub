export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb } from '@/lib/finance/db';
import { liveBanners, listSlots } from '@/lib/ads/slots';
import { getSetting } from '@/lib/ads/quota';

/* بنرهای زنده‌ی جایگاه‌ها — عمومی.
   وقتی کلیدِ ad_slots_enabled خاموش باشد، پاسخ خالی برمی‌گردد و هیچ
   جایگاهی روی صفحه ظاهر نمی‌شود. */
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const slot = sp.get('slot') ?? undefined;

  /* فهرستِ جایگاه‌ها با قیمت — برای صفحه‌ی درخواستِ تبلیغ */
  if (sp.get('catalog') === '1') {
    try {
      return NextResponse.json({ slots: (await listSlots()).filter(s => s.isActive) });
    } catch {
      return NextResponse.json({ slots: [] });
    }
  }

  try {
    const [banners, enabled] = await Promise.all([
      liveBanners(slot),
      getSetting<boolean>('ad_slots_enabled', false),
    ]);
    return NextResponse.json({ banners, enabled }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ banners: {}, enabled: false });
  }
}

/* شمارشِ نمایش و کلیک — بی‌صدا؛ شکستش نباید صفحه را خراب کند */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const id = String(b?.id ?? '').trim();
  const kind = b?.kind === 'click' ? 'clicks' : 'impressions';
  if (!id) return NextResponse.json({ ok: true });

  try {
    const { data } = await sb().from('ad_placements').select(kind).eq('id', id).maybeSingle();
    const cur = Number((data as Record<string, unknown> | null)?.[kind] ?? 0);
    await sb().from('ad_placements').update({ [kind]: cur + 1 }).eq('id', id);
  } catch { /* شمارنده مهم‌تر از صفحه نیست */ }

  return NextResponse.json({ ok: true });
}

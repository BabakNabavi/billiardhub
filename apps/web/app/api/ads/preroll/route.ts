export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { clientIp } from '@/lib/finance/db'
import { pickPreroll, trackAdEvent, viewerHash, type AdEvent } from '@/lib/ads/preroll'

/* ─────────────────────────────────────────────────────────────
   تبلیغِ پیش‌پخش — انتخاب و شمارش.

   ── چرا شناسه‌ی بیننده از کلاینت گرفته نمی‌شود ──
   هرچه کلاینت بفرستد قابلِ عوض‌کردن است؛ با یک شناسه‌ی تازه در هر
   درخواست، هم سقفِ فراوانی بی‌معنی می‌شود هم ضدِجعل. این‌جا از IP و
   مرورگر ساخته می‌شود.

   ── چرا خطا هم `null` برمی‌گرداند ──
   نبودِ تبلیغ حالتِ عادی است، نه استثنا. پلیر نباید برای این منتظر
   بماند یا بشکند: هر پاسخِ غیرِ ویدیو یعنی «مستقیم برو به ویدیوی
   اصلی».
   ───────────────────────────────────────────────────────────── */

const viewerOf = (req: NextRequest) =>
  viewerHash(clientIp(req) ?? null, req.headers.get('user-agent'))

/* GET → یک تبلیغ، یا `{ ad: null }` */
export async function GET(req: NextRequest) {
  try {
    const ad = await pickPreroll(viewerOf(req))
    return NextResponse.json({ ad }, {
      /* هرگز کش نشود: انتخاب به بیننده و سقفِ او بستگی دارد */
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (e) {
    console.error('[ads/preroll] pick:', e instanceof Error ? e.message : 'unknown')
    return NextResponse.json({ ad: null }, { headers: { 'Cache-Control': 'no-store' } })
  }
}

const EVENTS = new Set<AdEvent>(['impression', 'complete', 'skip', 'click'])

/* POST { campaignId, event } → ثبتِ رویداد */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({})) as Record<string, unknown>
  const campaignId = String(b.campaignId ?? '')
  const event = String(b.event ?? '') as AdEvent

  if (!EVENTS.has(event)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  /* `await` عمدی است: روی سرورلس، Promiseی رهاشده بعد از پاسخ ممکن
     است هرگز اجرا نشود و رویداد گم شود. */
  const counted = await trackAdEvent(campaignId, event, viewerOf(req))
  return NextResponse.json({ ok: true, counted }, { headers: { 'Cache-Control': 'no-store' } })
}

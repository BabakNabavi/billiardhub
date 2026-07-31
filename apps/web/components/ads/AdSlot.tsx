'use client'

/* ─────────────────────────────────────────────────────────────
   جایگاه تبلیغاتی v2 — روی سیستم Placement/Campaign (فاز ۲).

   ● نمایش هر جایگاه فقط به is_active خودش وابسته است؛ هیچ کلید
     سراسری‌ای وجود ندارد.
   ● جایگاه بنری با بیش از یک کمپین «اسلایدری» می‌چرخد (تصمیم D1)؛
     وزن کمپین در ترتیب چرخش لحاظ می‌شود.
   ● جایگاه خالی/غیرفعال هیچ‌چیزی رندر نمی‌کند — نه قاب، نه فاصله.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'

/* تایپ‌ها و `toPlacementState` به `lib/ads/placement-state` منتقل شدند.

   دلیل: این فایل `'use client'` است، پس هرچه از آن export شود یک
   «ارجاع کلاینت» می‌شود و Server Component نمی‌تواند صدایش بزند.
   `app/page.tsx` دقیقاً همین کار را می‌کرد و صفحه‌ی اصلی ۵۰۰ داد:

     Attempted to call toPlacementState() from the server but
     toPlacementState is on the client.

   این‌جا فقط دوباره export می‌شوند تا مصرف‌کننده‌های قبلی نشکنند. */
export type {
  PlacementKey, EntitySnapshot, LiveCampaign,
  PlacementPayload, PlacementStatus, PlacementState,
} from '../../lib/ads/placement-state'
export { toPlacementState } from '../../lib/ads/placement-state'

import type {
  PlacementKey, LiveCampaign, PlacementPayload, PlacementState,
} from '../../lib/ads/placement-state'
import { toPlacementState as toState } from '../../lib/ads/placement-state'

/* یک fetch برای کل صفحه، صرف‌نظر از تعداد جایگاه‌ها.
   شکست کش نمی‌شود — وگرنه یک خطای گذرای شبکه، تبلیغات را تا reload
   بعدی برای کل نشست SPA خاموش می‌کرد.
   کش عمر کوتاه دارد: چرخش عادلانه سمت سرور تصمیم‌گیری می‌شود، پس
   کش همیشگی یعنی کاربری که ساعت‌ها در SPA می‌ماند تا آخر همان یک
   ترتیب را می‌بیند و عدالت چرخش برایش اتفاق نمی‌افتد. */
const CACHE_TTL = 90_000
let cache: Promise<Record<string, PlacementPayload>> | null = null
let cachedAt = 0
function loadPlacements(): Promise<Record<string, PlacementPayload>> {
  if (cache && Date.now() - cachedAt > CACHE_TTL) cache = null
  if (!cache) {
    cachedAt = Date.now()
    cache = fetch('/api/ads/placements', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('bad status'))))
      .then(j => (j?.placements ?? {}) as Record<string, PlacementPayload>)
      .catch(() => { cache = null; return {} as Record<string, PlacementPayload> })
  }
  return cache
}

/* فقط http(s) یا مسیر داخلی — لایه‌ی دوم دفاع در برابر javascript: */
const safeHref = (v: string) => (/^(https?:\/\/|\/)/i.test(v) ? v : '')

const ping = (id: string, kind: 'impression' | 'click') => {
  try {
    navigator.sendBeacon?.('/api/ads/placements', new Blob([JSON.stringify({ id, kind })], { type: 'application/json' }))
  } catch { /* شمارنده مهم‌تر از صفحه نیست */ }
}

/** محتوای زنده‌ی یک جایگاه — برای سکشن‌های «ویژه» که خودشان رندر می‌کنند */
export function usePlacement(key: PlacementKey): LiveCampaign[] | null {
  return usePlacementState(key).items
}

/* `initial` از سرور می‌آید.

   بدون آن، سه سکشن اصلی صفحه (محصولات ویژه، باشگاه‌های پیشنهادی،
   فروشگاه‌های تجهیزات) در HTML اولیه خالی بودند و فقط بعد از اجرای
   جاوااسکریپت پر می‌شدند — یعنی خزنده‌ها محتوایی نمی‌دیدند و کاربر هم
   یک پرش چیدمان تجربه می‌کرد.

   با مقدار اولیه، همان داده در رندر سرور هست و کلاینت فقط در صورت
   تازه‌شدن به‌روزش می‌کند. */
export function usePlacementState(key: PlacementKey, initial?: PlacementState): PlacementState {
  const [state, setState] = useState<PlacementState>(
    initial ?? { status: 'loading', items: null, mode: null },
  )
  useEffect(() => {
    let alive = true
    void loadPlacements().then(all => {
      if (!alive) return
      setState(toState(all[key]))
    })
    return () => { alive = false }
  }, [key])
  return state
}

/** جایگاه بنری — با چرخش اسلایدری وقتی بیش از یک کمپین دارد */
export default function AdSlot({ slot, className, style, intervalMs = 5000 }: {
  slot: PlacementKey
  className?: string
  style?: React.CSSProperties
  intervalMs?: number
}) {
  const [banners, setBanners] = useState<LiveCampaign[] | null>(null)
  const [active, setActive] = useState(0)
  const seenRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    let alive = true
    void loadPlacements().then(all => {
      if (!alive) return
      const payload = all[slot]
      const list = (payload?.campaigns ?? []).filter(c => c.banner?.imageUrl)
      /* از فاز ۴، هر چهار حالت چرخش سمت سرور تصمیم‌گیری می‌شود و
         ترتیب همین آرایه نتیجه‌ی آن است؛ کلاینت فقط در همان ترتیب
         می‌چرخد. (تکرار وزنی قبلی حذف شد: هم کار سرور را دوباره
         می‌کرد، هم اسلایدهای تکراری پشت‌هم می‌ساخت.) */
      setBanners(list)
    })
    return () => { alive = false }
  }, [slot])

  /* چرخش خودکار */
  useEffect(() => {
    if (!banners || banners.length <= 1) return
    const t = setInterval(() => setActive(a => (a + 1) % banners.length), intervalMs)
    return () => clearInterval(t)
  }, [banners, intervalMs])

  /* هر کمپین یک‌بار در هر mount نمایش شمرده می‌شود — وقتی واقعاً دیده شد */
  const current = banners?.[active] ?? null
  useEffect(() => {
    if (!current) return
    if (seenRef.current.has(current.id)) return
    seenRef.current.add(current.id)
    ping(current.id, 'impression')
  }, [current])

  if (!banners || banners.length === 0 || !current?.banner) return null

  const distinct = [...new Set(banners.map(b => b.id))]

  const img = (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={current.banner.imageUrl} alt={current.title || current.advertiser || 'تبلیغ'}
      loading="lazy"
      style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 14 }}
    />
  )

  return (
    <div className={className} style={style} dir="rtl">
      <figure style={{ margin: 0, position: 'relative' }}>
        {safeHref(current.banner.linkUrl) ? (
          <a href={safeHref(current.banner.linkUrl)} target="_blank" rel="noopener noreferrer sponsored"
            onClick={() => ping(current.id, 'click')}
            style={{ display: 'block', textDecoration: 'none' }}>
            {img}
          </a>
        ) : img}

        {/* شفافیت با بازدیدکننده: تبلیغ باید تبلیغ به‌نظر برسد */}
        <figcaption style={{
          position: 'absolute', top: 8, insetInlineEnd: 8,
          fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.92)',
          background: 'rgba(0,0,0,0.42)', borderRadius: 6, padding: '3px 8px',
          backdropFilter: 'blur(4px)', pointerEvents: 'none',
        }}>
          تبلیغ{current.advertiser ? ` · ${current.advertiser}` : ''}
        </figcaption>

        {/* نقطه‌های اسلایدر — فقط با بیش از یک کمپین متمایز */}
        {distinct.length > 1 && (
          <div style={{ position: 'absolute', bottom: 8, insetInline: 0, display: 'flex', justifyContent: 'center', gap: 5, pointerEvents: 'none' }}>
            {distinct.map(id => (
              <span key={id} style={{
                width: id === current.id ? 16 : 5, height: 5, borderRadius: 3,
                background: id === current.id ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                transition: 'width .25s',
              }} />
            ))}
          </div>
        )}
      </figure>
    </div>
  )
}

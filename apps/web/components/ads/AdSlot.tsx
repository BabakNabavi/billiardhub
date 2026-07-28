'use client'

/* یک جایگاهِ تبلیغاتی روی سایت.

   تا وقتی ادمین کلیدِ جایگاه‌ها را روشن نکرده باشد، این کامپوننت
   هیچ چیزی رندر نمی‌کند — نه قابِ خالی، نه فاصله‌ی اضافه. یعنی
   می‌شود همین حالا در همه‌ی صفحات کارش گذاشت بدونِ اینکه ظاهرِ سایت
   عوض شود، و روزی که خواستید با یک کلید روشن شود. */

import { useEffect, useState } from 'react'

export type SlotKey = 'market_1' | 'market_2' | 'footer'

interface Banner {
  id: string
  title: string
  imageUrl: string
  linkUrl: string
  advertiser: string
}

/* یک‌بار برای کلِ صفحه خوانده می‌شود، نه به‌ازای هر جایگاه */
let cache: Promise<Record<string, Banner[]>> | null = null
function loadBanners(): Promise<Record<string, Banner[]>> {
  cache ??= fetch('/api/ads/slots', { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : null))
    .then(j => (j?.banners ?? {}) as Record<string, Banner[]>)
    .catch(() => ({}))
  return cache
}

const ping = (id: string, kind: 'impression' | 'click') => {
  try {
    navigator.sendBeacon?.('/api/ads/slots', new Blob([JSON.stringify({ id, kind })], { type: 'application/json' }))
  } catch { /* شمارنده مهم‌تر از صفحه نیست */ }
}

export default function AdSlot({ slot, className, style }: {
  slot: SlotKey
  className?: string
  style?: React.CSSProperties
}) {
  const [banners, setBanners] = useState<Banner[] | null>(null)

  useEffect(() => {
    let alive = true
    void loadBanners().then(all => { if (alive) setBanners(all[slot] ?? []) })
    return () => { alive = false }
  }, [slot])

  useEffect(() => {
    banners?.forEach(b => ping(b.id, 'impression'))
  }, [banners])

  if (!banners || banners.length === 0) return null

  return (
    <div className={className} style={{ display: 'grid', gap: 12, ...style }} dir="rtl">
      {banners.map(b => {
        const img = (
          <img
            src={b.imageUrl} alt={b.title || b.advertiser || 'تبلیغ'}
            loading="lazy"
            style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 14 }}
          />
        )
        return (
          <figure key={b.id} style={{ margin: 0, position: 'relative' }}>
            {b.linkUrl ? (
              <a href={b.linkUrl} target="_blank" rel="noopener noreferrer sponsored"
                onClick={() => ping(b.id, 'click')}
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
              تبلیغ{b.advertiser ? ` · ${b.advertiser}` : ''}
            </figcaption>
          </figure>
        )
      })}
    </div>
  )
}

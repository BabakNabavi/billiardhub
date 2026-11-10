'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { MapPin, Store } from 'lucide-react'
import { useHeroRotation } from '@/hooks/use-hero-rotation'
import { CARD, LABEL } from './hero-classes'
import type { HeroSpotItem } from './hero-types'

/* ─────────────────────────────────────────────────────────────
   کارتِ چرخانِ «یک مکان، یکی‌یکی» — باشگاه‌های تازه و فروشگاه‌ها.

   باشگاه عکسِ پهن دارد (cover)؛ فروشگاه فقط لوگوی مربعی، پس لوگو وسطِ
   همان کادرِ شیشه‌ای می‌نشیند (logo) تا دو کارت هم‌قد و هم‌شکل بمانند.
   عکسِ بعدی درست پیش از نوبتش گرفته می‌شود تا جابه‌جایی چشمک نزند.
   ───────────────────────────────────────────────────────────── */

export function HeroSpotCard({ items, pos, label, hrefBase, fit, everyMs, className = '' }: {
  items: HeroSpotItem[]
  pos: string
  /** [یکی، چندتا] — «تازه‌ترین باشگاه» / «تازه‌ترین باشگاه‌ها» */
  label: [string, string]
  hrefBase: string
  fit: 'cover' | 'logo'
  everyMs: number
  className?: string
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const { i, leaving } = useHeroRotation(items.length, everyMs, ref)

  /* پیش‌بارگذاری فقط وقتی جابه‌جایی واقعاً در راه است (محوشدن شروع شده) */
  useEffect(() => {
    const next = items[(i + 1) % items.length]
    if (leaving && next?.img) new Image().src = next.img
  }, [leaving, i, items])

  const c = items[i]
  if (!c) return null
  const fade = leaving ? ' hh-leaving' : ''

  return (
    <Link ref={ref} prefetch={false} href={`${hrefBase}/${c.id}`} className={`${CARD} ${pos} ${className}`}>
      {/* عکس و نام محو و عوض می‌شوند؛ برچسب و نقطه‌ها ثابت می‌مانند */}
      <div key={c.id} className={`hh-swap${fade}`}>
        {(fit === 'cover' || c.cover) && c.img ? (
          /* عکسِ پهنِ فروشگاهِ بی‌لوگو هم همین‌جا: مثلِ باشگاه کادر را پر می‌کند.
             lazy فقط برای کارتِ فروشگاه که در تبلت/دسکتاپ پنهان است */
          /* eslint-disable-next-line @next/next/no-img-element -- بهینه‌ساز تصویرِ Next خاموش است؛ thumbUrl اندازه را از Storage می‌گیرد */
          <img src={c.img} alt="" width={300} height={96} decoding="async" loading={fit === 'logo' ? 'lazy' : undefined}
            className="h-24 w-full rounded-card bg-white/10 object-cover max-[900px]:h-20" />
        ) : (
          <div className="flex h-24 w-full items-center justify-center rounded-card bg-white/10 max-[900px]:h-20">
            {c.img
              /* lazy: کارتِ فروشگاه در تبلت/دسکتاپ display:none است و lazy آن‌جا اصلاً دانلود نمی‌کند.
                 contain + گوشه‌ی کارتی: لوگوی نوشتاری بریده نشود */
              /* eslint-disable-next-line @next/next/no-img-element -- همان دلیلِ بالا */
              ? <img src={c.img} alt="" width={64} height={64} loading="lazy" decoding="async" className="h-16 w-16 rounded-card bg-white object-contain p-1" />
              : <Store size={28} aria-hidden className="text-white/50" />}
          </div>
        )}
      </div>
      <p className={`${LABEL} mt-3 flex items-center gap-1`}>
        {items.length > 1 ? label[1] : label[0]}
        {items.length > 1 && (
          <span aria-hidden className="ms-auto flex shrink-0 gap-1">
            {items.map((x, n) => (
              <span key={x.id} className={`h-1 rounded-full transition-[width,background-color] duration-slow ${n === i ? 'w-3 bg-gold-light' : 'w-1 bg-white/30'}`} />
            ))}
          </span>
        )}
      </p>
      <div key={`t-${c.id}`} className={`hh-swap${fade}`}>
        <p className="truncate text-sub font-bold">{c.name}</p>
        {c.meta && <p className={`${LABEL} flex items-center gap-1`}>{c.pin && <MapPin size={12} aria-hidden />}<span className="truncate">{c.meta}</span></p>}
      </div>
    </Link>
  )
}

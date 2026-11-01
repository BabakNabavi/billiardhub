'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'
import { useHeroRotation } from '@/hooks/use-hero-rotation'
import { CARD, LABEL } from './hero-classes'
import type { HeroClubItem } from './hero-types'

/* ─────────────────────────────────────────────────────────────
   پنج باشگاهِ تازه، یکی‌یکی — هر ۵ ثانیه (خواستِ مالک).
   عکسِ باشگاهِ بعدی پیش از نوبتش گرفته می‌شود تا جابه‌جایی چشمک نزند.
   ───────────────────────────────────────────────────────────── */

const EVERY_MS = 5000

export function HeroClubCard({ clubs, pos }: { clubs: HeroClubItem[]; pos: string }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const { i, leaving } = useHeroRotation(clubs.length, EVERY_MS, ref)

  /* پیش‌بارگذاریِ عکسِ نفرِ بعد — فقط وقتی جابه‌جایی واقعاً در راه است
     (محوشدن شروع شده)، نه برای هیروی بیرونِ دید یا تبِ پنهان */
  useEffect(() => {
    const next = clubs[(i + 1) % clubs.length]
    if (leaving && next) new Image().src = next.img
  }, [leaving, i, clubs])

  const c = clubs[i]
  if (!c) return null

  return (
    <Link ref={ref} prefetch={false} href={`/clubs/${c.id}`} className={`${CARD} ${pos}`}>
      {/* عکس و نام محو و عوض می‌شوند؛ برچسب و نقطه‌ها ثابت می‌مانند تا
          جابه‌جاییِ نقطه دیده شود */}
      <div key={c.id} className={`hh-swap${leaving ? ' hh-leaving' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- بهینه‌ساز تصویرِ Next خاموش است؛ thumbUrl اندازه را از Storage می‌گیرد */}
        <img src={c.img} alt="" width={300} height={96} decoding="async"
          className="h-24 w-full rounded-card bg-white/10 object-cover max-[900px]:h-20" />
      </div>
      <p className={`${LABEL} mt-3 flex items-center gap-1`}>
        {clubs.length > 1 ? 'تازه‌ترین باشگاه‌ها' : 'تازه‌ترین باشگاه'}
        {clubs.length > 1 && (
          <span aria-hidden className="ms-auto flex shrink-0 gap-1">
            {clubs.map((x, n) => (
              <span key={x.id} className={`h-1 rounded-full transition-[width,background-color] duration-slow ${n === i ? 'w-3 bg-gold-light' : 'w-1 bg-white/30'}`} />
            ))}
          </span>
        )}
      </p>
      <div key={`t-${c.id}`} className={`hh-swap${leaving ? ' hh-leaving' : ''}`}>
        <p className="truncate text-sub font-bold">{c.name}</p>
        {c.meta && <p className={`${LABEL} flex items-center gap-1`}><MapPin size={12} aria-hidden />{c.meta}</p>}
      </div>
    </Link>
  )
}

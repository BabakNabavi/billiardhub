'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useHeroRotation } from '@/hooks/use-hero-rotation'
import { CARD, LABEL, ROW_LINK } from './hero-classes'
import type { HeroAdItem } from './hero-types'

/* ─────────────────────────────────────────────────────────────
   ده آگهیِ تازه‌ی بازار، سه‌تا‌سه‌تا — هر ۵٫۵ ثانیه (خواستِ مالک).
   جای «آخرین مسابقه»: بازار هر روز آگهیِ تازه دارد، پس کارت کهنه نمی‌شود.

   پنجره دورِ فهرست می‌چرخد (۹، ۱۰، ۱ …) تا همیشه سه ردیف و ارتفاعِ
   کارت ثابت بماند. خودِ کارت لینک نیست (لینکِ تودرتو مجاز نیست)؛ هر
   ردیف لینکِ آگهیِ خودش است و سرِ کارت به /shop می‌رود.
   ───────────────────────────────────────────────────────────── */

const PER_PAGE = 3
const EVERY_MS = 5500

export function HeroAdsCard({ ads, pos }: { ads: HeroAdItem[]; pos: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const pages = Math.ceil(ads.length / PER_PAGE)
  const { i: page, leaving } = useHeroRotation(pages, EVERY_MS, ref)
  const shown = Array.from({ length: Math.min(PER_PAGE, ads.length) }, (_, n) => ads[(page * PER_PAGE + n) % ads.length]!)

  return (
    <div ref={ref} className={`${CARD} ${pos}`}>
      <Link prefetch={false} href="/shop" className={`${LABEL} ${ROW_LINK} -mx-1 flex items-center gap-1 px-1`}>
        <ShoppingBag size={12} aria-hidden className="hh-c-violet" />
        تازه‌ترین آگهی‌های بیلیارد بازار
        <span className="ms-auto font-bold text-gold-light">همه</span>
      </Link>
      <ul key={page} className={`hh-swap hh-ads mt-1${leaving ? ' hh-leaving' : ''}`}>
        {shown.map(p => (
          <li key={p.id}>
            <Link prefetch={false} href={`/shop/${p.id}`} className={`${ROW_LINK} -mx-1 flex items-center gap-2 px-1 py-1`}>
              {/* آگهیِ بی‌عکس ⟵ آیکونِ خنثی، نه عکسِ جانشینِ «چوب» */}
              {p.img === null
                ? <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-white/10 text-white/50 max-[900px]:h-10 max-[900px]:w-10"><ShoppingBag size={18} /></span>
                /* eslint-disable-next-line @next/next/no-img-element -- بهینه‌ساز تصویرِ Next خاموش است؛ thumbUrl اندازه را از Storage می‌گیرد */
                : <img src={p.img} alt="" width={48} height={48} loading="lazy" decoding="async"
                    className="h-12 w-12 shrink-0 rounded-card bg-white/10 object-cover max-[900px]:h-10 max-[900px]:w-10" />}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sub font-bold">{p.name}</span>
                {p.meta && <span className={`${LABEL} block truncate`}>{p.meta}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

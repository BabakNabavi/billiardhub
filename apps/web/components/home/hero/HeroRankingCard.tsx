'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { Trophy } from 'lucide-react'
import { faNum } from '@/lib/jalali'
import { useHeroRotation } from '@/hooks/use-hero-rotation'
import type { HeroRankingBoard } from './hero-types'
import { CARD, LABEL } from './hero-classes'

/* ─────────────────────────────────────────────────────────────
   رنکینگِ چرخان — هر ۶٫۵ ثانیه جدولِ بعدی (خواستِ مالک):
   اسنوکر آقایان ⟵ اسنوکر بانوان ⟵ … (ترتیب در lib/home-hero).

   دسکتاپ و موبایل هر دو چهار نفر (خواستِ مالک، ۱۹ آبانِ ۱۴۰۵؛ پیش‌تر موبایل
   سه نفر بود تا کارت کوتاه بماند).
   ارتفاع ثابت است: جدولِ کم‌نفر با جای خالی پر می‌شود تا کارت با هر
   چرخش بالا و پایین نپرد.
   ───────────────────────────────────────────────────────────── */

const EVERY_MS = 6500

export function HeroRankingCard({ boards, pos }: { boards: HeroRankingBoard[]; pos: string }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const { i, leaving } = useHeroRotation(boards.length, EVERY_MS, ref)
  const fade = leaving ? ' hh-leaving' : ''

  const b = boards[i]
  if (!b) return null
  const rows = Math.max(...boards.map(x => x.players.length))
  const href = `/ranking?${new URLSearchParams({ sport: b.sport, gender: b.gender, cat: b.category })}`

  return (
    <Link ref={ref} prefetch={false} href={href} className={`${CARD} ${pos}`}>
      <p className={`${LABEL} flex items-center gap-1`}>
        <Trophy size={12} aria-hidden className="text-gold-light" />
        {/* نقطه‌های شمارنده‌ی جدول‌ها عمداً نیست (خواستِ مالک، ۱۲ آبانِ ۱۴۰۵) */}
        <span key={b.label} className={`hh-swap truncate${fade}`}>رنکینگ {b.label}</span>
      </p>
      {/* key با جدول عوض می‌شود ⟵ ورودِ نرمِ ردیف‌ها (hh-swap) */}
      <ol key={`${b.sport}-${b.gender}-${b.category}`} className={`hh-swap mt-1${fade}`}>
        {Array.from({ length: rows }, (_, n) => {
          const p = b.players[n]
          return (
            <li key={n} aria-hidden={p ? undefined : true} className="flex items-center justify-between gap-2 border-b border-white/10 py-1 text-sub last:border-0">
              {p ? (
                <>
                  <span className="min-w-0 truncate"><span aria-hidden className="text-white/50">{faNum(p.rank)}.</span> {p.name}</span>
                  <b className="shrink-0 text-gold-light">{faNum(p.points)}</b>
                </>
              ) : <span>&nbsp;</span>}
            </li>
          )
        })}
      </ol>
    </Link>
  )
}

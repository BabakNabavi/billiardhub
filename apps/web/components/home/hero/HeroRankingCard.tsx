'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { Trophy } from 'lucide-react'
import { faNum } from '@/lib/jalali'
import { useHeroRotation } from '@/hooks/use-hero-rotation'
import type { HeroRankingBoard } from '@/lib/home-hero'
import { CARD, LABEL } from './hero-classes'

/* ─────────────────────────────────────────────────────────────
   رنکینگِ چرخان — هر ۶٫۵ ثانیه جدولِ بعدی (خواستِ مالک):
   اسنوکر آقایان ⟵ اسنوکر بانوان ⟵ … (ترتیب در lib/home-hero).

   دسکتاپ چهار نفر، موبایل سه نفر (ردیفِ چهارم پنهان، تا کارت کوتاه بماند).
   ارتفاع ثابت است: جدولِ کم‌نفر با جای خالی پر می‌شود تا کارت با هر
   چرخش بالا و پایین نپرد.
   ───────────────────────────────────────────────────────────── */

const EVERY_MS = 6500

export function HeroRankingCard({ boards, pos }: { boards: HeroRankingBoard[]; pos: string }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const i = useHeroRotation(boards.length, EVERY_MS, ref)

  const b = boards[i]
  if (!b) return null
  const rows = Math.max(...boards.map(x => x.players.length))
  const href = `/ranking?${new URLSearchParams({ sport: b.sport, gender: b.gender, cat: b.category })}`

  return (
    <Link ref={ref} prefetch={false} href={href} className={`${CARD} ${pos}`}>
      <p className={`${LABEL} flex items-center gap-1`}>
        <Trophy size={12} aria-hidden className="text-gold-light" />
        <span className="truncate">رنکینگِ {b.label}</span>
        {boards.length > 1 && (
          <span aria-hidden className="ms-auto flex shrink-0 gap-1">
            {boards.map((x, n) => (
              <span key={`${x.sport}-${x.gender}-${x.category}`} className={`h-1 rounded-full transition-all duration-slow ${n === i ? 'w-3 bg-gold-light' : 'w-1 bg-white/30'}`} />
            ))}
          </span>
        )}
      </p>
      {/* key با جدول عوض می‌شود ⟵ ورودِ نرمِ ردیف‌ها (hh-swap) */}
      <ol key={`${b.sport}-${b.gender}-${b.category}`} className="hh-swap mt-1">
        {Array.from({ length: rows }, (_, n) => {
          const p = b.players[n]
          return (
            <li key={n} className={`flex items-center justify-between gap-2 border-b border-white/10 py-1 text-sub last:border-0 ${n >= 3 ? 'max-[900px]:hidden' : ''} max-[900px]:[&:nth-child(3)]:border-0`}>
              {p ? (
                <>
                  <span className="min-w-0 truncate"><span className="text-white/50">{faNum(p.rank)}.</span> {p.name}</span>
                  <b className="shrink-0 text-gold-light">{faNum(p.points)}</b>
                </>
              ) : <span aria-hidden>&nbsp;</span>}
            </li>
          )
        })}
      </ol>
    </Link>
  )
}

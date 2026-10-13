'use client'

/* ─────────────────────────────────────────────────────────────
   ردیفِ باشگاه — نمای فهرست.

   همان سطح (`TILE`) و همان خط‌های متنِ کارتِ شبکه، فقط افقی؛ سوییچِ نما
   نباید ظاهرِ صفحه را عوض کند. امکانات این‌جا نیست: ردیف برای مرورِ
   سریع است و نام، شهر، میزها و مسابقه برای تصمیم کافی‌اند.
   روی گوشی دکمه‌ی قرصی جا ندارد؛ آن‌جا یک فلشِ کوچک کافی است.
   ───────────────────────────────────────────────────────────── */

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { Club } from '@/lib/clubs-data'
import type { Tournament } from '@/lib/mock-tournaments'
import { faDistance } from '@/lib/clubs/distance'
import { buttonClasses } from '@/components/ui/button-classes'
import VerifiedBadge from '@/components/VerifiedBadge'
import ClubStoryModal from '@/components/ClubStoryModal'
import { ClubMedia, StatusPill, StoryRing, TournamentTag, tableLine } from './ClubCardParts'
import { clubHref } from './ClubCard'
import { PILL_ON_CARD_HOVER, STRETCHED, TILE } from './tile-classes'

export function ClubRow({ club, tournaments, index }: { club: Club; tournaments: Tournament[]; index: number }) {
  const [storyOpen, setStoryOpen] = useState(false)
  const tables = tableLine(club)

  return (
    <article className={[TILE, 'flex items-stretch'].join(' ')} style={{ '--lq-i': Math.min(index, 8) } as CSSProperties}>
      <div className="relative min-h-32 w-28 shrink-0 overflow-hidden bg-mist sm:w-48">
        <ClubMedia club={club} logoSize={56} />
        <StoryRing club={club} size={32} onOpen={() => setStoryOpen(true)} className="absolute bottom-2 start-2" />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-4 p-4 sm:p-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="m-0 min-w-0 text-tile text-ink">
            <Link href={clubHref(club)} className={STRETCHED}>{club.name}</Link>
            {club.isVerified && <VerifiedBadge title="باشگاهِ تأییدشده" />}
          </h3>
          <p className="m-0 text-sub text-ink-2">
            {club.city}{club.distance !== undefined && `، ${faDistance(club.distance)}`}
          </p>
          {tables && <p className="m-0 mt-1 text-sub font-bold text-ink">{tables}</p>}
          <div className="flex flex-wrap items-center gap-2 empty:hidden">
            <StatusPill club={club} className="mt-2" />
            <TournamentTag tournaments={tournaments} className="mt-2" />
          </div>
        </div>
        <span aria-hidden className={buttonClasses({ size: 'sm', className: `hidden sm:inline-flex ${PILL_ON_CARD_HOVER}` })}>مشاهده و رزرو</span>
        {/* ⚠️ در RTL «جلو» سمتِ چپ است، پس ChevronLeft درست است */}
        <ChevronLeft size={20} aria-hidden className="shrink-0 text-ink-2 sm:hidden" />
      </div>

      {storyOpen && club.storyMediaUrl && (
        <ClubStoryModal
          club={{ name: club.name, logo: club.logo, storyMediaUrl: club.storyMediaUrl, storyType: club.storyType, storyText: club.storyText }}
          onClose={() => setStoryOpen(false)} />
      )}
    </article>
  )
}

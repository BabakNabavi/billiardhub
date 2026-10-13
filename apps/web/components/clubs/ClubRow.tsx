'use client'

/* ─────────────────────────────────────────────────────────────
   ردیفِ باشگاه — نمای فهرست.

   همان قطعه‌ها و همان سطحِ کارتِ شبکه، فقط افقی؛ سوییچِ نما نباید
   ظاهرِ صفحه را عوض کند. امکانات این‌جا نیست: ردیف برای مرورِ سریع
   است و نام، شهر، میزها و مسابقه برای تصمیم کافی‌اند.
   ───────────────────────────────────────────────────────────── */

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { ChevronLeft, MapPin } from 'lucide-react'
import type { Club } from '@/lib/clubs-data'
import type { Tournament } from '@/lib/mock-tournaments'
import { faDistance } from '@/lib/clubs/distance'
import VerifiedBadge from '@/components/VerifiedBadge'
import ClubStoryModal from '@/components/ClubStoryModal'
import { ClubMedia, StatusPill, StoryRing, TableChips, TournamentTag } from './ClubCardParts'
import { clubHref } from './ClubCard'

export function ClubRow({ club, tournaments, index }: { club: Club; tournaments: Tournament[]; index: number }) {
  const [storyOpen, setStoryOpen] = useState(false)

  return (
    <article className="lq-pcard lq-rise group relative flex items-stretch overflow-hidden"
      style={{ '--lq-i': Math.min(index, 8) } as CSSProperties}>
      <div className="relative min-h-28 w-28 shrink-0 overflow-hidden bg-mist sm:w-40">
        <ClubMedia club={club} logoSize={48} />
        <StoryRing club={club} size={32} onOpen={() => setStoryOpen(true)} className="absolute bottom-2 start-2" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="m-0 min-w-0 text-section text-ink">
            <Link href={clubHref(club)}
              className="text-inherit no-underline after:absolute after:inset-0 after:content-['']
                         focus-visible:outline-none after:rounded-card focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-gold-deep">
              {club.name}
            </Link>
            {club.isVerified && <VerifiedBadge title="باشگاهِ تأییدشده" />}
          </h3>
          <ChevronLeft size={20} aria-hidden
            className="mt-1 shrink-0 text-gold-text transition-transform duration-base ease-smooth group-hover:-translate-x-1 motion-reduce:group-hover:translate-x-0" />
        </div>
        <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-sub text-ink-2">
          <span className="inline-flex items-center gap-1"><MapPin size={14} aria-hidden />{club.city}</span>
          {club.distance !== undefined && <span>· {faDistance(club.distance)}</span>}
          <StatusPill club={club} />
        </p>
        <TableChips club={club} />
        <TournamentTag tournaments={tournaments} />
      </div>

      {storyOpen && club.storyMediaUrl && (
        <ClubStoryModal
          club={{ name: club.name, logo: club.logo, storyMediaUrl: club.storyMediaUrl, storyType: club.storyType, storyText: club.storyText }}
          onClose={() => setStoryOpen(false)} />
      )}
    </article>
  )
}

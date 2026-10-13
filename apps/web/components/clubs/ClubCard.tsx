'use client'

/* ─────────────────────────────────────────────────────────────
   کارتِ باشگاه — نمای شبکه.

   ── زبانِ تصویری (نسخه‌ی دوم، ۲۲ مهرِ ۱۴۰۵) ──
   به روشِ کاشی‌های فروشگاهِ اپل: سطحِ سفیدِ بی‌حاشیه با گوشه‌ی ۱۸
   پیکسل و فقط سایه‌ی نرم، عکسِ بزرگ، نامِ ۲۰ پیکسلی، مشخصات در یک خطِ
   متنِ خاکستری، و یک دکمه‌ی قرصی. نسخه‌ی اول کارتِ شیشه‌ای با حاشیه،
   چیپ‌های خاکستری و کاشی‌های آیکون داشت — به گفته‌ی مالک «هیچ نمایی از
   اپل» نداشت. شیشه برای نوارِ ابزار می‌ماند که روی محتوا شناور است؛
   محتوا جامد است.

   ── ساختار ──
   کلِ کارت کلیک می‌شود، ولی فقط با یک `<a>`: لینکِ روی نام با
   `after:inset-0` روی کارت پهن می‌شود. دکمه‌ی علاقه‌مندی و استوری `z-10`
   روی همان لایه می‌نشینند — المانِ تعاملی درونِ لینک HTMLِ نامعتبر است.
   دکمه‌ی «مشاهده و رزرو» فقط نشانه است (`aria-hidden`): خودِ کارت لینک است.
   ───────────────────────────────────────────────────────────── */

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import type { Club } from '@/lib/clubs-data'
import type { Tournament } from '@/lib/mock-tournaments'
import { faDistance } from '@/lib/clubs/distance'
import { faNum } from '@/lib/jalali'
import { buttonClasses } from '@/components/ui/button-classes'
import FavoriteButton from '@/components/FavoriteButton'
import VerifiedBadge from '@/components/VerifiedBadge'
import ClubStoryModal from '@/components/ClubStoryModal'
import { ClubMedia, StatusPill, StoryRing, TournamentTag, amenityLine, tableLine } from './ClubCardParts'
import { PILL_ON_CARD_HOVER, STRETCHED, TILE } from './tile-classes'

export const clubHref = (c: Club) => `/clubs/${c.slug || c.id}`


export function ClubCard({ club, tournaments, index }: { club: Club; tournaments: Tournament[]; index: number }) {
  const [storyOpen, setStoryOpen] = useState(false)
  const members = club.memberCount ?? 0
  const tables = tableLine(club)
  const amenities = amenityLine(club)

  return (
    <article className={[TILE, 'flex h-full flex-col'].join(' ')} style={{ '--lq-i': Math.min(index, 8) } as CSSProperties}>
      <div className="relative aspect-[3/2] overflow-hidden bg-mist">
        <ClubMedia club={club} logoSize={80} />
        <StatusPill club={club} overlay className="absolute start-4 top-4" />
        <div className="absolute end-4 top-4 z-10">
          {/* دکمه ۳۲ پیکسل دیده می‌شود ولی هدفِ لمسش با شبه‌عنصر ۴۸ است */}
          <FavoriteButton type="club" id={club.id} size={16}
            className="relative after:absolute after:-inset-2 after:content-['']" />
        </div>
        <StoryRing club={club} size={44} onOpen={() => setStoryOpen(true)} className="absolute bottom-4 start-4" />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="m-0 text-tile text-ink">
          <Link href={clubHref(club)} className={STRETCHED}>{club.name}</Link>
          {club.isVerified && <VerifiedBadge title="باشگاهِ تأییدشده" />}
        </h3>
        <p className="m-0 mt-1 text-sub text-ink-2">
          {club.city}{club.distance !== undefined && `، ${faDistance(club.distance)}`}
        </p>

        {(tables || amenities) && (
          <div className="mt-4 flex flex-col gap-1 text-sub">
            {tables && <p className="m-0 font-bold text-ink">{tables}</p>}
            {amenities && <p className="m-0 line-clamp-1 text-ink-2">{amenities}</p>}
          </div>
        )}

        <TournamentTag tournaments={tournaments} className="mt-4" />

        <div className="mt-auto flex items-center justify-between gap-3 pt-6">
          <span className="text-sub text-ink-2">{members > 0 ? `${faNum(members)} عضو` : ''}</span>
          <span aria-hidden className={buttonClasses({ size: 'sm', className: PILL_ON_CARD_HOVER })}>مشاهده و رزرو</span>
        </div>
      </div>

      {storyOpen && club.storyMediaUrl && (
        <ClubStoryModal
          club={{ name: club.name, logo: club.logo, storyMediaUrl: club.storyMediaUrl, storyType: club.storyType, storyText: club.storyText }}
          onClose={() => setStoryOpen(false)} />
      )}
    </article>
  )
}

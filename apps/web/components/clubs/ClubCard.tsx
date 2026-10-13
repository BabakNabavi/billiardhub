'use client'

/* ─────────────────────────────────────────────────────────────
   کارتِ باشگاه — نمای شبکه.

   ── ساختار ──
   کلِ کارت کلیک می‌شود، ولی فقط با یک `<a>`: لینکِ روی نام با
   `after:inset-0` روی کارت پهن می‌شود. پیش‌تر کلِ کارت داخلِ `<Link>`
   بود و دکمه‌ی علاقه‌مندی و استوری *داخلِ* لینک — المانِ تعاملی درونِ
   لینک HTMLِ نامعتبر است و صفحه‌خوان هر کارت را یک لینکِ بلندِ درهم
   می‌خواند. حالا دکمه‌ها `z-10` روی همان لایه می‌نشینند.

   متن راست‌چین است، نه وسط‌چین: فهرستی که چشم از بالا به پایین
   مرورش می‌کند، لبه‌ی ثابت می‌خواهد.
   ───────────────────────────────────────────────────────────── */

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { ChevronLeft, MapPin } from 'lucide-react'
import type { Club } from '@/lib/clubs-data'
import type { Tournament } from '@/lib/mock-tournaments'
import { faDistance } from '@/lib/clubs/distance'
import { faNum } from '@/lib/jalali'
import FavoriteButton from '@/components/FavoriteButton'
import VerifiedBadge from '@/components/VerifiedBadge'
import ClubStoryModal from '@/components/ClubStoryModal'
import { Amenities, ClubMedia, StatusPill, StoryRing, TableChips, TournamentTag } from './ClubCardParts'

export const clubHref = (c: Club) => `/clubs/${c.slug || c.id}`

export function ClubCard({ club, tournaments, index }: { club: Club; tournaments: Tournament[]; index: number }) {
  const [storyOpen, setStoryOpen] = useState(false)
  const members = club.memberCount ?? 0

  return (
    <article className="lq-pcard lq-rise group relative flex h-full flex-col overflow-hidden"
      style={{ '--lq-i': Math.min(index, 8) } as CSSProperties}>
      <div className="relative aspect-video overflow-hidden bg-mist">
        <ClubMedia club={club} logoSize={72} />
        <StatusPill club={club} overlay className="absolute start-3 top-3" />
        <div className="absolute end-3 top-3 z-10">
          {/* دکمه ۳۲ پیکسل دیده می‌شود ولی هدفِ لمسش با شبه‌عنصر ۴۸ است —
              کمتر از کفِ ۴۴ نبود که روی گوشی درست بخورد. */}
          <FavoriteButton type="club" id={club.id} size={16}
            className="relative after:absolute after:-inset-2 after:content-['']" />
        </div>
        <StoryRing club={club} size={44} onOpen={() => setStoryOpen(true)} className="absolute bottom-3 start-3" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <h3 className="m-0 text-section text-ink">
            <Link href={clubHref(club)}
              className="text-inherit no-underline after:absolute after:inset-0 after:content-['']
                         focus-visible:outline-none after:rounded-card focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-gold-deep">
              {club.name}
            </Link>
            {club.isVerified && <VerifiedBadge title="باشگاهِ تأییدشده" />}
          </h3>
          <p className="m-0 inline-flex items-center gap-1 text-sub text-ink-2">
            <MapPin size={14} aria-hidden />
            {club.city}
            {club.distance !== undefined && <span>· {faDistance(club.distance)}</span>}
          </p>
        </div>

        <TableChips club={club} />
        <Amenities club={club} />
        <TournamentTag tournaments={tournaments} />

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line/[.06] pt-3 text-sub">
          <span className="text-ink-2">{members > 0 ? `${faNum(members)} عضو` : ''}</span>
          {/* ⚠️ در RTL «جلو» سمتِ چپ است، پس ChevronLeft درست است */}
          <span aria-hidden className="inline-flex items-center gap-1 font-bold text-gold-text">
            مشاهده و رزرو
            <ChevronLeft size={16} className="transition-transform duration-base ease-smooth group-hover:-translate-x-1 motion-reduce:group-hover:translate-x-0" />
          </span>
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

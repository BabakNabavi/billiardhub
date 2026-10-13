'use client'

/* ─────────────────────────────────────────────────────────────
   قطعه‌های مشترکِ کارت و ردیفِ باشگاه.

   هرچه این‌جاست در هر دو نمای فهرست (شبکه و ردیف) یک شکل دارد؛ پیش‌تر
   هر نما نسخه‌ی خودش را می‌کشید و یک باشگاه با سوییچِ نما رنگ عوض
   می‌کرد.

   ── سه چیزی که عمداً رفت ──
   · رنگِ رنگین‌کمانیِ نوعِ میز (سبز/آبی/بنفش) — رنگ این‌جا معنایی
     نداشت؛ «۳ اسنوکر» با متن خوانده می‌شود.
   · عکسِ جایگزینِ تصادفی. باشگاهِ بی‌عکس عکسِ باشگاهِ دیگری می‌گرفت —
     تصویرِ جایی که آن باشگاه نیست. حالا نشانِ خودش روی زمینه‌ی خنثی.
   · «بسته» برای وضعیتِ نامعلوم. API فهرست ساعتِ کاری نمی‌فرستد، پس
     `isOpen` همیشه خالی بود و هر کارت «بسته» می‌گفت. حالا وضعیت فقط
     وقتی دیده می‌شود که واقعاً معلوم باشد.
   ───────────────────────────────────────────────────────────── */

import { Car, Coffee, Gamepad2, Trophy, Wifi, GraduationCap } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Club } from '@/lib/clubs-data'
import type { Tournament } from '@/lib/mock-tournaments'
import { tableSummary, TABLE_KINDS } from '@/lib/clubs/tables'
import { toFaDigits, faNum } from '@/lib/jalali'
import { hasAmenity, type AmenityKey } from '@/lib/clubs/filters'
import ClubLogo from '@/components/club/ClubLogo'

/* ── عکس ── */

/** فقط عکسِ واقعیِ خودِ باشگاه؛ نشانیِ پیش‌فرضِ قدیمی عکس حساب نمی‌شود */
export function clubPhoto(club: Club): string | null {
  const src = club.images?.[0]?.trim()
  if (!src || src.includes('billiadr-club-1') || src.includes('default')) return null
  return src
}

export function ClubMedia({ club, logoSize }: { club: Club; logoSize: number }) {
  const src = clubPhoto(club)
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-mist">
        <ClubLogo src={club.logo} name={club.name} size={logoSize} />
      </div>
    )
  }
  return (
    /* بزرگ‌نماییِ عکس در هاور رفت: خودِ کارت بالا می‌آید، دو حرکت روی هم
       شلوغی است. */
    <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
  )
}

/* ── وضعیتِ باز/بسته ── */

/** `overlay`: روی عکس (سطحِ سفیدِ نیمه‌شفاف). بدونِ آن: داخلِ متن. */
export function StatusPill({ club, overlay = false, className = '' }: { club: Club; overlay?: boolean; className?: string }) {
  if (typeof club.isOpen !== 'boolean') return null
  const open = club.isOpen
  return (
    <span className={['inline-flex items-center gap-2 rounded-full px-3 py-1 text-sub font-bold text-ink',
      overlay ? 'bg-surface/90 shadow-e0 backdrop-blur-1' : 'bg-line/[.05]', className].join(' ')}>
      <span aria-hidden className={['size-2 rounded-full', open ? 'bg-success' : 'bg-danger'].join(' ')} />
      {open ? (club.closeTime ? `باز تا ${toFaDigits(club.closeTime)}` : 'باز است') : 'بسته است'}
    </span>
  )
}

/* ── میزها و امکانات: متن، نه چیپ ──
   نسخه‌ی اول هر نوعِ میز را یک چیپِ خاکستری می‌کرد و هر امکان را یک
   آیکون+برچسب؛ کارت شبیهِ فرمِ فیلتر می‌شد. حالا یک خط متن با «،» —
   همان کاری که فهرست‌های اپل با مشخصات می‌کنند. */

/* ⚠️ «،» نه «·»: نقطه‌ی میانی کنارِ رقمِ فارسی همان صفرِ فارسی (۰) دیده
   می‌شود — «۲ · پاکت» روی صفحه «۲۰ پاکت» خوانده شد. */
const SEP = '، '

export function tableLine(club: Club): string {
  const sum = tableSummary(club)
  return TABLE_KINDS.filter(k => sum[k.key] > 0).map(k => `${faNum(sum[k.key])} ${k.label}`).join(SEP)
}

export const AMENITIES: { key: AmenityKey; label: string; icon: ReactNode }[] = [
  { key: 'hasCafe', label: 'کافه', icon: <Coffee size={14} aria-hidden /> },
  { key: 'hasParking', label: 'پارکینگ', icon: <Car size={14} aria-hidden /> },
  { key: 'hasWifi', label: 'وای‌فای', icon: <Wifi size={14} aria-hidden /> },
  { key: 'hasProfessionalCoach', label: 'مربی', icon: <GraduationCap size={14} aria-hidden /> },
  { key: 'playstations', label: 'پلی‌استیشن', icon: <Gamepad2 size={14} aria-hidden /> },
]

/** فقط آنچه باشگاه دارد. کاشیِ خاکستریِ «ندارد» اطلاعات نبود، شلوغی بود. */
export function amenityLine(club: Club): string {
  return AMENITIES.filter(a => hasAmenity(club, a.key)).map(a => a.label).join(SEP)
}

/* ── مسابقه ── */

const TOURNAMENT_TAG = {
  registration_open: { label: 'ثبت‌نامِ مسابقه باز است', tone: 'bg-gold/[.12] text-gold-text' },
  live: { label: 'مسابقه‌ی زنده', tone: 'bg-danger/10 text-danger-ink' },
  upcoming: { label: 'مسابقه به‌زودی', tone: 'bg-line/[.05] text-ink' },
} as const

export function TournamentTag({ tournaments, className = '' }: { tournaments: Tournament[]; className?: string }) {
  /* اولویت با چیزی است که الان کاری از بازدیدکننده می‌خواهد */
  const t = tournaments.find(x => x.status === 'live')
    ?? tournaments.find(x => x.status === 'registration_open')
    ?? tournaments.find(x => x.status === 'upcoming')
  if (!t || !(t.status in TOURNAMENT_TAG)) return null
  const tag = TOURNAMENT_TAG[t.status as keyof typeof TOURNAMENT_TAG]
  return (
    <span className={['inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-sub font-bold', tag.tone, className].join(' ')}>
      <Trophy size={14} aria-hidden />{tag.label}
    </span>
  )
}

/* ── حلقه‌ی استوری ── */

/** گرادیانِ حلقه همان الگوی آشنای استوری است، پس می‌ماند؛ هاله‌ی صورتیِ
 *  دورش (`box-shadow` بی‌آفست) تزئین بود و رفت. */
export function StoryRing({ club, size, onOpen, className = '' }: {
  club: Club; size: number; onOpen: () => void; className?: string
}) {
  if (!club.hasActiveStory || !club.storyMediaUrl) return null
  return (
    <button type="button" aria-label={`استوریِ ${club.name}`} onClick={onOpen}
      className={['z-10 rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] p-1',
        'transition-transform duration-fast ease-smooth active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2',
        className].join(' ')}>
      <span className="block rounded-full border-2 border-surface">
        <ClubLogo src={club.logo} name={club.name} size={size} />
      </span>
    </button>
  )
}

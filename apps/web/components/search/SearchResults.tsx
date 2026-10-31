/* ─────────────────────────────────────────────────────────────
   فهرستِ نتیجه‌های جست‌وجو، گروه به گروه — Server Component.

   هر گروه رنگِ همان بخش را دارد (همان رنگ‌های کارت‌های «بیشتر ببینید»):
   یک مقصد، یک رنگ، همه‌جای سایت. ردیف‌ها لینکِ واقعی‌اند؛ تصویر اگر
   نباشد، آیکونِ همان بخش جایش می‌نشیند — نه عکسِ ساختگی.
   ───────────────────────────────────────────────────────────── */

import Link from 'next/link'
import type { CSSProperties } from 'react'
import { ArrowLeft, Building2, Clapperboard, Medal, Newspaper, ShoppingBag, Trophy, Users, type LucideIcon } from 'lucide-react'
import { faNum } from '@/lib/jalali'
import { rankColor } from '@/lib/ranking-color'
import VerifiedBadge from '@/components/VerifiedBadge'
import type { GroupKey, SearchGroup } from '@/lib/search/types'

export const GROUP_META: Record<GroupKey, { label: string; Icon: LucideIcon; rgb: string }> = {
  clubs: { label: 'باشگاه‌ها', Icon: Building2, rgb: '199,166,106' },
  /* مربی، داور، بازیکن، فروشگاه، تولیدکننده و خدماتِ فنی */
  people: { label: 'افراد و کسب‌وکارها', Icon: Users, rgb: '244,114,182' },
  /* بازیکنانِ جدولِ رسمی — نام، رده و رتبه */
  rankings: { label: 'رنکینگ', Icon: Medal, rgb: '154,110,56' },
  tournaments: { label: 'مسابقات', Icon: Trophy, rgb: '74,158,255' },
  market: { label: 'بیلیارد بازار', Icon: ShoppingBag, rgb: '199,166,106' },
  news: { label: 'اخبار', Icon: Newspaper, rgb: '6,182,212' },
  videos: { label: 'بیلیارد مدیا', Icon: Clapperboard, rgb: '48,197,90' },
}

export function Thumb({ image, Icon, rank }: { image?: string | null; Icon: LucideIcon; rank?: number }) {
  /* رتبه جای تصویر: همان مربعِ رنگیِ جدول، تا رکورد از همین‌جا خوانده شود */
  if (rank) {
    return (
      <span className="flex size-12 shrink-0 items-center justify-center rounded-card text-sub font-black text-white" style={{ backgroundColor: rankColor(rank) }}>
        <span className="sr-only">رتبه </span>{faNum(rank)}
      </span>
    )
  }
  if (image) {
    /* تصویرِ کاربر از Storage با ابعادِ نامعلوم؛ next/image این‌جا ابعادِ ثابت و remotePatterns می‌خواهد */
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" loading="lazy" decoding="async" className="size-12 shrink-0 rounded-card bg-mist object-cover" />
  }
  return (
    <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-card bg-[rgba(var(--rgb),0.12)] text-[rgb(var(--rgb))]">
      <Icon size={20} />
    </span>
  )
}

/** بخش‌هایی که خودشان جست‌وجو دارند: «همه‌ی نتیجه‌ها» به همان صفحه می‌رود.
 *  بقیه همه‌ی نتیجه‌ها را همین‌جا نشان می‌دهند (تا ۱۲ تا)، پس لینکی لازم ندارند. */
const MORE: Partial<Record<GroupKey, (q: string) => string>> = {
  news: q => `/news?q=${encodeURIComponent(q)}`,
  videos: q => `/media?q=${encodeURIComponent(q)}`,
}

export function SearchResults({ groups, q }: { groups: SearchGroup[]; q: string }) {
  return (
    <div className="flex flex-col gap-8">
      {groups.filter(g => g.hits.length > 0).map(g => {
        const meta = GROUP_META[g.key]
        return (
          <section key={g.key} aria-labelledby={`sr-${g.key}`} style={{ ['--rgb' as never]: meta.rgb } as CSSProperties}>
            {/* لینکِ «همه‌ی نتیجه‌ها» بیرونِ h2 است: h2 نامِ بخش است (aria-labelledby) */}
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
            <h2 id={`sr-${g.key}`} className="m-0 flex items-center gap-2 text-section text-ink">
              <meta.Icon size={18} aria-hidden className="text-[rgb(var(--rgb))]" />
              {meta.label}
              <span className="text-body font-bold text-ink-2">
                {/* سقفِ واکشی پر شده باشد، شمارِ واقعی شاید بیشتر است */}
                {g.total > g.hits.length ? `${faNum(g.hits.length)} از ${faNum(g.total)}${g.capped ? '+' : ''}` : `${faNum(g.total)}${g.capped ? '+' : ''}`}
              </span>
            </h2>
            {MORE[g.key] && g.total > 0 && (
              <Link href={MORE[g.key]!(q)} prefetch={false}
                className="ms-auto inline-flex min-h-11 items-center gap-1 text-sub font-bold text-gold-text no-underline hover:underline
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
                همه‌ی نتیجه‌ها <ArrowLeft size={14} aria-hidden />
              </Link>
            )}
            </div>
            <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {g.hits.map(h => (
                <li key={h.href}>
                  {/* بی‌پیش‌واکشی: تا ۷۲ لینک روی صفحه، روی شبکه‌ی کند هزینه است */}
                  <Link href={h.href} prefetch={false}
                    className="lq-pcard flex items-center gap-3 p-3 text-inherit no-underline
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
                    <Thumb image={h.image} Icon={meta.Icon} rank={h.rank} />
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="flex min-w-0 items-center gap-1 text-body font-bold text-ink">
                        <span className="truncate">{h.title}</span>
                        {h.verified && <VerifiedBadge title="تأییدشده" />}
                      </span>
                      {h.sub && <span className="truncate text-sub text-ink-2">{h.sub}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

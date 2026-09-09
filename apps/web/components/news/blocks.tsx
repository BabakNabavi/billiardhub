/* ─────────────────────────────────────────────────────────────
   بلوک‌های صفحه‌ی تحریریه.

   ⚠️ هر بلوک وقتی داده‌اش نباشد `null` برمی‌گرداند — نه قاب خالی،
   نه «به‌زودی»، نه نمونه‌ی نمایشی. صفحه‌ی یک اتاق خبر تازه‌راه‌افتاده
   باید کوتاه و صادق باشد، نه پر از جای‌گیر.
   ───────────────────────────────────────────────────────────── */

import Link from 'next/link'
import { Kicker, Flags, Meta, Cover } from './bits'
import { sectionLabel } from '@/lib/news/sections'
import { stamp, iso, rank, readTime } from '@/lib/news/format'
import type { Article, SectionBlock } from '@/lib/news/server'

const href = (a: Article) => `/news/${encodeURIComponent(a.id)}`

/* ═══ نوار فوری ═══ */
export function BreakingBar({ items }: { items: Article[] }) {
  if (items.length === 0) return null
  return (
    <div className="nr-breaking">
      <div className="nr-breaking-in">
        <span className="nr-breaking-tag">
          <span className="nr-breaking-dot" aria-hidden />
          فوری
        </span>
        <ul className="nr-breaking-list">
          {items.map(a => (
            <li key={a.id}><Link href={href(a)}>{a.title}</Link></li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ═══ خبر صدر ═══ */
export function Lead({ a }: { a: Article }) {
  return (
    <Link className="nr-lead" href={href(a)}>
      <Cover a={a} ratio="16x9" priority sizes="(min-width: 1200px) 700px, (min-width: 900px) 60vw, 100vw" />
      <Kicker a={a} urgent={a.breaking} />
      <h2>{a.title}</h2>
      {a.excerpt && <p className="nr-lead-sum">{a.excerpt}</p>}
      <div className="nr-meta">
        <Flags a={a} />
        {a.author && <span>{a.author}</span>}
        {a.ts > 0 && <span><time dateTime={iso(a.ts)}>{stamp(a.ts)}</time></span>}
        {a.readMinutes > 0 && <span>{readTime(a.readMinutes)}</span>}
      </div>
    </Link>
  )
}

/* ═══ خبرهای دوم ═══ */
export function Secondary({ items }: { items: Article[] }) {
  if (items.length === 0) return null
  return (
    <div className="nr-second">
      {items.map(a => (
        <Link key={a.id} href={href(a)}>
          <div className={a.cover ? 'nr-sec-row' : undefined}>
            <div>
              <Kicker a={a} urgent={a.breaking} />
              <h3>{a.title}</h3>
              <Meta a={a} />
            </div>
            <Cover a={a} ratio="1x1" sizes="104px" />
          </div>
        </Link>
      ))}
    </div>
  )
}

/* ═══ جریان زمانی ═══ */
export function Stream({
  items, title = 'آخرین اخبار', more,
}: { items: Article[]; title?: string; more?: string }) {
  if (items.length === 0) return null
  return (
    <div className="nr-rail">
      <div className="nr-blockhd">
        <h2>{title}</h2>
        {more && <Link className="nr-more" href={more}>مشاهده همه</Link>}
      </div>
      <ul className="nr-stream">
        {items.map(a => (
          <li key={a.id}>
            <Link href={href(a)}>
              <time dateTime={iso(a.ts)}>{stamp(a.ts)}</time>
              <span>
                <span className="nr-stream-s">{sectionLabel(a.section)}</span>
                <span className="nr-stream-t">{a.title}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ═══ پربازدیدترین‌ها ═══
   ⚠️ فقط وقتی رندر می‌شود که شمارنده‌ی واقعی عددی بالای صفر داشته
   باشد؛ فهرست «پربازدید» با صفر بازدید یعنی دروغ تزئینی. */
export function MostRead({ items }: { items: Article[] }) {
  if (items.length === 0) return null
  return (
    <section aria-labelledby="nr-mr">
      <div className="nr-blockhd">
        <h2 id="nr-mr">پربازدیدترین‌ها</h2>
      </div>
      <ol className="nr-ranked">
        {items.map((a, i) => (
          <li key={a.id}>
            <Link href={href(a)}>
              <span className="nr-rank" aria-hidden>{rank(i)}</span>
              {/* div نه span: تیتر و متادیتا محتوای جریانی‌اند */}
              <div>
                <h3>{a.title}</h3>
                <Meta a={a} />
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

/* ═══ بلوک بخش ═══
   ⚠️ دو ترکیب متفاوت، بسته به اینکه بخش چند خبر دارد:
   با سه خبر پشتیبان یا بیشتر، «تصویر بزرگ + فهرست»؛ با کمتر،
   ردیفی از کارت‌های هم‌وزن. دلیلش را `.nr-row` در CSS توضیح داده:
   چیدمان دوستونی با یک آیتم، یک ستون خالی می‌سازد. */
export function Band({ b, alt = false, tint = false }: { b: SectionBlock; alt?: boolean; tint?: boolean }) {
  const head = (
    <div className="nr-blockhd">
      <h2 id={`nr-b-${b.key}`}>{b.label}</h2>
      <Link className="nr-more" href={`/news?s=${b.key}`}>مشاهده همه</Link>
    </div>
  )

  if (b.rest.length < 3) {
    return (
      <section className={`nr-band${tint ? ' nr-band--tint' : ''}`} aria-labelledby={`nr-b-${b.key}`}>
        <div className="nr-shell">
          {head}
          <div className="nr-row">
            {[b.lead, ...b.rest].map(a => (
              <Link key={a.id} className={`nr-row-item${a.cover ? '' : ' nr-noimg'}`} href={href(a)}>
                <Cover a={a} ratio="3x2" sizes="(min-width: 640px) 190px, 100vw" />
                <h3>{a.title}</h3>
                <Meta a={a} />
              </Link>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={`nr-band${alt ? ' nr-band--alt' : ''}${tint ? ' nr-band--tint' : ''}`} aria-labelledby={`nr-b-${b.key}`}>
      <div className="nr-shell">
        {head}
        <div className="nr-sec-grid">
          <Link className="nr-sec-lead" href={href(b.lead)}>
            <Cover a={b.lead} ratio="3x2" sizes="(min-width: 760px) 55vw, 100vw" />
            <h3>{b.lead.title}</h3>
            {b.lead.excerpt && <p>{b.lead.excerpt}</p>}
            <Meta a={b.lead} />
          </Link>
          {b.rest.length > 0 && (
            <ul className="nr-sec-list">
              {b.rest.map(a => (
                <li key={a.id}>
                  <Link href={href(a)} className={a.cover ? undefined : 'nr-noimg'}>
                    <div>
                      <h4>{a.title}</h4>
                      <Meta a={a} />
                    </div>
                    <Cover a={a} ratio="1x1" sizes="86px" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

/* ═══ گزارش ویژه ═══ */
export function Feature({ a }: { a: Article }) {
  return (
    <section className="nr-feature" aria-labelledby="nr-ft">
      <div className="nr-shell">
        <div className="nr-feature-grid">
          <Link href={href(a)}>
            <Cover a={a} ratio="3x2" sizes="(min-width: 860px) 52vw, 100vw" />
          </Link>
          <div>
            <span className="nr-kicker">گزارش ویژه</span>
            <Link href={href(a)}><h2 id="nr-ft">{a.title}</h2></Link>
            {a.excerpt && <p>{a.excerpt}</p>}
            <div className="nr-meta">
              {a.author && <span>{a.author}</span>}
              {a.ts > 0 && <span><time dateTime={iso(a.ts)}>{stamp(a.ts)}</time></span>}
              {a.readMinutes > 0 && <span>{readTime(a.readMinutes)}</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══ گفت‌وگو ═══
   ⚠️ چیدمان پرتره‌ای فقط وقتی معنا دارد که عکس باشد. مصاحبه‌ی
   بی‌عکس در همین بلوک ولی به‌شکل متنی می‌آید، نه با قاب خالی. */
export function Talks({ items }: { items: Article[] }) {
  if (items.length === 0) return null
  return (
    <section className="nr-band" aria-labelledby="nr-tk">
      <div className="nr-shell">
        <div className="nr-blockhd">
          <h2 id="nr-tk">گفت‌وگو</h2>
          <Link className="nr-more" href="/news?s=interview">مشاهده همه</Link>
        </div>
        <div className="nr-talks">
          {items.map(a => (
            <Link key={a.id} className="nr-talk" href={href(a)}>
              <Cover a={a} ratio="4x5" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 100vw" />
              <span className="nr-kicker">{a.exclusive ? 'مصاحبه اختصاصی' : 'گفت‌وگو'}</span>
              <h3>{a.title}</h3>
              <Meta a={a} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

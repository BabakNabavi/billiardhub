/* ─────────────────────────────────────────────────────────────
   صفحه‌ی اول تحریریه.

   ── چرا Server Component ──
   ⚠️ نسخه‌ی قبل `'use client'` بود و اخبار را در `useEffect`
   می‌گرفت؛ یعنی HTML اولیه هیچ تیتری نداشت. برای یک صفحه‌ی خبری
   این هم SEO را می‌کشد (گوگل یک صفحه‌ی خالی می‌دید) هم اولین
   نمایش را عقب می‌انداخت. حالا داده روی سرور خوانده و تیترها در
   خود HTML رندر می‌شوند.

   ── چه چیزی رندر می‌شود ──
   ⚠️ هر بلوک وابسته به داده‌ی واقعی است. تا وقتی ویراستار خبری
   منتشر نکرده، صفحه یک حالت خالی صادق نشان می‌دهد و تمام. هیچ
   خبر نمونه، هیچ عدد بازدید، هیچ نویسنده‌ی ساختگی.
   ───────────────────────────────────────────────────────────── */

import type { Metadata } from 'next'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { listNews, searchPublished, buildFront, type Article } from '@/lib/news/server'
import { sectionOf } from '@/lib/news/sections'
import { faDateLong, toFaDigits } from '@/lib/jalali'
import { SecNav } from '@/components/news/SecNav'
import NavOffset from '@/components/news/NavOffset'
import {
  BreakingBar, Lead, Secondary, Stream, MostRead, Band, Feature, Talks,
} from '@/components/news/blocks'
import { Cover, Meta, Kicker } from '@/components/news/bits'
import { SearchBar } from '@/components/news/SearchBar'
import './newsroom.css'

/* ⚠️ `revalidate` روی این صفحه بی‌اثر است، چون `searchParams`
   خوانده می‌شود و صفحه داینامیک می‌ماند. یعنی هر بازدید یک
   پرس‌وجوی ۱۲۰ ردیفی *به‌همراه ستون body* می‌زد — سنگین‌ترین
   صفحه‌ی سایت روی یک VPS. پس خود خواندن کش می‌شود، نه صفحه. */
const cachedList = unstable_cache(
  (section: string | null) => listNews({ section }),
  ['news:list'],
  { revalidate: 60, tags: ['news'] },
)

type SP = Promise<{ s?: string; q?: string; d?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { s, q } = await searchParams
  const sec = sectionOf(s ?? null)
  const title = q ? `جست‌وجو: ${q}` : sec ? `${sec.label} — اخبار` : 'اخبار بیلیارد هاب'
  const description = q
    ? `نتایج جست‌وجوی «${q}» در اخبار بیلیارد هاب.`
    : sec?.blurb ?? 'اتاق خبر بیلیارد هاب: اسنوکر، پول، کاروم، مسابقات، بازیکنان و صنعت بیلیارد.'
  return {
    /* ⚠️ `absolute`: قالب ریشه ('%s | بیلیارد هاب') را لایه‌ی
       میانی news/layout.tsx مصرف نمی‌کند، پس رشته‌ی ساده پسوند
       می‌گرفت و «اخبار بیلیارد هاب | بیلیارد هاب» می‌شد. */
    title: { absolute: `${title} | بیلیارد هاب` },
    description,
    /* ⚠️ نتایج جست‌وجو نباید ایندکس شوند: صفحه‌ی بی‌پایان تکراری
       می‌سازند. صفحه‌ی بخش اما محتوای واقعی دارد و می‌ماند. */
    ...(q ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: sec ? `/news?s=${sec.key}` : '/news' },
    openGraph: {
      title: `${title} | بیلیارد هاب`, description,
      url: sec ? `/news?s=${sec.key}` : '/news',
      siteName: 'بیلیارد هاب', locale: 'fa_IR', type: 'website',
    },
    twitter: { card: 'summary_large_image', title: `${title} | بیلیارد هاب`, description },
  }
}

/* ── بازه‌ی زمانی ── */
const RANGES = [
  { key: 'all',   label: 'همه' },
  { key: '24h',   label: '۲۴ ساعت' },
  { key: 'week',  label: 'هفته' },
  { key: 'month', label: 'ماه' },
] as const
const RANGE_MS: Record<string, number> = {
  '24h': 86_400_000, week: 7 * 86_400_000, month: 30 * 86_400_000,
}

export default async function NewsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim()
  const sectionKey = sectionOf(sp.s ?? null)?.key ?? null
  const range = sp.d && RANGE_MS[sp.d] ? sp.d : 'all'
  const filtering = Boolean(q || sectionKey || range !== 'all')

  /* ⚠️ فیلتر بخش به خود پرس‌وجو سپرده می‌شود، نه به حافظه. */
  const res = q
    ? { ok: true, rows: await searchPublished(q) }
    : await cachedList(sectionKey)
  const all = res.rows

  /* ⚠️ `window` نام نگیرد — سراسری مرورگر را سایه می‌اندازد. */
  const windowMs = RANGE_MS[range]
  const now = Date.now()
  const rows = all.filter(a =>
    (!sectionKey || a.section === sectionKey)
    && (!windowMs || (a.ts > 0 && now - a.ts <= windowMs)))

  /* یک‌بار حساب می‌شود، نه دوبار (نوار فوری و بدنه‌ی صفحه) */
  const front = filtering ? null : buildFront(rows, now)

  return (
    <div className="nr">
      <NavOffset />
      {front && <BreakingBar items={front.breaking} />}

      <header className="nr-masthead">
        <div className="nr-shell nr-masthead-in">
          <h1>{sectionKey ? sectionOf(sectionKey)!.label : 'اخبار بیلیارد هاب'}</h1>
          {/* ⚠️ شرح فقط در صفحه‌ی بخش. روی صفحه‌ی اول یک جمله‌ی
              تزئینی بود که فقط خبرها را پایین می‌برد. */}
          {sectionKey && <p>{sectionOf(sectionKey)!.blurb}</p>}
          <span className="nr-today">{faDateLong(new Date())}</span>
        </div>
      </header>

      <SecNav active={sectionKey} />

      <div className="nr-shell">
        <SearchBar q={q} section={sectionKey} range={range} ranges={RANGES} slim={!filtering} />
      </div>

      {/* ⚠️ «خالی» و «خطا» دو چیزند: فهرست خالی به‌خاطر خطای
          دیتابیس نباید «هنوز خبری منتشر نشده» نشان بدهد. */}
      {!res.ok
        ? <Failed />
        : filtering
          ? <Results rows={rows} q={q} sectionKey={sectionKey} />
          : <Front front={front!} />}
    </div>
  )
}

/* ═══════════════ صفحه‌ی اول ═══════════════ */
function Front({ front: f }: { front: ReturnType<typeof buildFront> }) {
  if (!f.lead) return <Empty />

  return (
    <>
      <div className="nr-shell">
        <div className="nr-front">
          <Lead a={f.lead} />
          <Secondary items={f.secondary} />
          <Stream items={f.latest} />
        </div>

        {(f.top.length > 0 || f.mostRead.length > 0) && (
          <div className="nr-duo">
            {f.top.length > 0 && (
              <section aria-labelledby="nr-top">
                <div className="nr-blockhd">
                  <h2 id="nr-top">مهم‌ترین خبرها</h2>
                </div>
                <ul className="nr-sec-list">
                  {f.top.map(a => (
                    <li key={a.id}>
                      <Link href={`/news/${encodeURIComponent(a.id)}`} className={a.cover ? undefined : 'nr-noimg'}>
                        <div>
                          <Kicker a={a} />
                          {/* h3 نه h4: تیتر بالادست h2 است و پرش سطح مجاز نیست */}
                          <h3>{a.title}</h3>
                          <Meta a={a} />
                        </div>
                        <Cover a={a} ratio="1x1" sizes="86px" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <MostRead items={f.mostRead} />
          </div>
        )}
      </div>

      {f.feature && <Feature a={f.feature} />}
      {f.interviews.length > 0 && <Talks items={f.interviews} />}

      {f.sections
        .filter(b => b.key !== 'interview')
        .map((b, i) => <Band key={b.key} b={b} alt={i % 2 === 1} tint={i % 2 === 1} />)}
    </>
  )
}

/* ═══════════════ نتایج بخش / جست‌وجو ═══════════════ */
function Results({ rows, q, sectionKey }: { rows: Article[]; q: string; sectionKey: string | null }) {
  if (rows.length === 0) {
    return (
      <div className="nr-shell">
        <div className="nr-empty">
          <h2>{q ? 'نتیجه‌ای پیدا نشد' : 'هنوز خبری در این بخش منتشر نشده'}</h2>
          <p>
            {q
              ? 'عبارت دیگری را امتحان کنید، یا بازه‌ی زمانی را روی «همه» بگذارید.'
              : 'به‌محض انتشار اولین خبر این بخش، همین‌جا دیده می‌شود.'}
          </p>
          <div className="nr-empty-act">
            <Link className="nr-btn" href="/news">همه‌ی اخبار</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="nr-shell">
      <div className="nr-blockhd nr-blockhd--top">
        <h2>{q ? `${toFaDigits(rows.length)} نتیجه` : sectionOf(sectionKey)?.label ?? 'اخبار'}</h2>
      </div>
      <ul className="nr-results">
        {rows.map(a => (
          <li key={a.id}>
            <Link href={`/news/${encodeURIComponent(a.id)}`} className={a.cover ? undefined : 'nr-noimg'}>
              <div>
                <Kicker a={a} urgent={a.breaking} />
                <h3>{a.title}</h3>
                {a.excerpt && <p>{a.excerpt}</p>}
                <Meta a={a} withAuthor />
              </div>
              <Cover a={a} ratio="3x2" sizes="(min-width: 760px) 220px, 128px" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ⚠️ خطای خواندن ≠ نبود خبر. تا پیش از این هر دو یک صفحه
   می‌دیدند و به کاربر گفته می‌شد «هنوز خبری منتشر نشده» در حالی
   که خبرها هستند و فقط دیتابیس جواب نداده. */
function Failed() {
  return (
    <div className="nr-shell">
      <div className="nr-empty">
        <h2>اخبار در دسترس نیست</h2>
        <p>خواندن اخبار از سرور ناموفق بود. این یک خطای موقت است، نه نبود خبر.</p>
        <div className="nr-empty-act">
          <Link className="nr-btn" href="/news">تلاش دوباره</Link>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════ حالت خالی ═══════════════
   ⚠️ این حالت همین امروز روی سایت زنده دیده می‌شود: جدول `news`
   هیچ ردیف منتشرشده‌ای ندارد. پس این صفحه‌ی جای‌گیر فرضی نیست،
   وضعیت واقعی فعلی محصول است و باید آبرومند باشد. */
function Empty() {
  return (
    <div className="nr-shell">
      <div className="nr-empty">
        <h2>اتاق خبر بیلیارد هاب به‌زودی منتشر می‌کند</h2>
        <p>
          هنوز خبری منتشر نشده است. این صفحه عمدا خالی است: تا وقتی خبر
          واقعی نداریم، خبر نمونه نمی‌گذاریم.
        </p>
        <p>
          پوشش ما اسنوکر، پول، کاروم، مسابقات، بازیکنان، تجهیزات و
          باشگاه‌های ایران و جهان خواهد بود.
        </p>
        <div className="nr-empty-act">
          <Link className="nr-btn" href="/media">بیلیارد مدیا</Link>
          <Link className="nr-btn nr-btn--ghost" href="/tournaments">مسابقات</Link>
          <Link className="nr-btn nr-btn--ghost" href="/ranking">رنکینگ</Link>
        </div>
      </div>
    </div>
  )
}

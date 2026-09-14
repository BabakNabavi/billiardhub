'use client'

/* ─────────────────────────────────────────────────────────────
   خدمات فنی — دایرکتوری متخصصان.

   ── مفهوم قبلی کاملا برداشته شد ──
   نسخه‌های پیشین «نمایش محصول» بودند: رسانه‌ی تمام‌قاب، تیتر
   هشتاد پیکسلی، روایت آناتومی چوب، دوربین اسکرول. هیچ‌کدام به
   کاری که کاربر این صفحه دارد ربط نداشت.

   این صفحه حالا یک مسیر کاری است:
     نیاز ⟵ خدمت ⟵ متخصص ⟵ اعتماد ⟵ تماس

   ── واقعیت داده ──
   ⚠️ هر قلم اطلاعات فقط وقتی رندر می‌شود که ستونش در دیتابیس
   وجود داشته باشد. آنچه هست: شهر، `onsite`/`workshop`، `verified`،
   و `rating_avg`/`rating_count` (مهاجرت ۰۸۹).
   آنچه نیست: قیمت، سابقه، زمان پاسخ، فاصله، در دسترس بودن.
   این چهار نه ساخته می‌شوند و نه با «—» جعل می‌شوند؛ یا حذف‌اند یا
   خاموش و برچسب‌دار.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { SlidersHorizontal, X, UserPlus, Send } from 'lucide-react'
import { TECH_CATEGORIES, titlesOfCategory } from '@/lib/tech-categories'
import { TECHNICIANS, faDigits, type Technician } from '@/lib/technicians-data'
import {
  listApprovedTechnicians, profileToTechnician, type TechnicianProfile,
} from '@/lib/technician-store'
import { fetchProfilesResult } from '@/lib/profiles/client'
import { TechnicianCard, TechnicianCardSkeleton } from '@/components/tech/market/TechnicianCard'
import { ServiceSearch } from '@/components/tech/market/ServiceSearch'
import { ServiceCategoryList } from '@/components/tech/market/ServiceCategoryList'
import {
  ServiceFilters, EMPTY_FILTERS, countActive, type FilterState,
} from '@/components/tech/market/ServiceFilters'
import '@/components/tech/market/market.css'
/* ⚠️ بعد از market.css بار می‌شود: فقط زبان بصری را عوض می‌کند و
   هیچ کلاسی را جابه‌جا نمی‌کند. */
import { HeroArt } from '@/components/tech/market/HeroArt'
import '@/components/tech/market/hero-art.css'
import '@/components/tech/market/ios.css'

/** امتیاز تجمیعی هر متخصص — از ستون ردیف، نه jsonb */
type Rating = { avg: number; count: number }

export default function TechnicalServicesPage() {
  const [rows, setRows] = useState<Technician[]>([])
  const [ratings, setRatings] = useState<Map<string, Rating>>(new Map())
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [sheet, setSheet] = useState(false)

  const sheetClose = useRef<HTMLButtonElement>(null)
  const sheetPanel = useRef<HTMLDivElement>(null)
  const sheetOpener = useRef<HTMLElement | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    /* کش محلی تا صفحه در قطعی شبکه خالی نماند */
    try {
      const local = listApprovedTechnicians().map(profileToTechnician)
      if (local.length) setRows(local)
    } catch { /* حافظه‌ی محلی در دسترس نبود */ }

    /* ⚠️ مهلت صریح. `fetchProfiles` خودش مهلتی ندارد و اگر روت
       API معلق بماند — که روی شبکه‌ی کند یا دیتابیس کند ممکن است —
       وعده هرگز settle نمی‌شود و کاربر تا ابد اسکلت می‌بیند، نه
       خطا و نه دکمه‌ی تلاش دوباره. */
    const bail = setTimeout(() => { setFailed(true); setLoading(false) }, 12000)
    void fetchProfilesResult<TechnicianProfile>('technician')
      .then(res => {
        clearTimeout(bail)
        if (res.state === 'error') { setFailed(true); return }
        const remote = res.profiles
        const approved = remote.filter(r => r.status === 'approved')
        setRows(approved.map(r => profileToTechnician(
          { ...r.data, slug: r.slug, verified: r.verified } as TechnicianProfile,
        )))
        /* ⚠️ امتیاز از خود ردیف می‌آید (`ratingAvg`/`ratingCount`)،
           نه از jsonb و نه از محاسبه‌ی مرورگر. */
        const m = new Map<string, Rating>()
        for (const r of approved) {
          if ((r.ratingCount ?? 0) > 0) {
            m.set(r.slug, { avg: r.ratingAvg ?? 0, count: r.ratingCount ?? 0 })
          }
        }
        setRatings(m)
        setFailed(false)
      })
      .finally(() => { clearTimeout(bail); setLoading(false) })
  }, [])

  const ALL = useMemo(() => {
    const staticOnly = TECHNICIANS.filter(t => !rows.some(r => r.id === t.id))
    return [...rows, ...staticOnly]
  }, [rows])

  const cities = useMemo(
    () => [...new Set(ALL.map(t => t.city).filter(c => c && c !== '—'))].sort(),
    [ALL],
  )

  const hasAnyRating = ratings.size > 0

  /* شمار واقعی متخصص هر دسته */
  const catCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const cat of TECH_CATEGORIES) {
      const titles = new Set(titlesOfCategory(cat.id))
      m.set(cat.id, ALL.filter(t => t.services.some(s => titles.has(s))).length)
    }
    return m
  }, [ALL])

  const results = useMemo(() => {
    const q = query.trim()
    const catTitles = category ? new Set(titlesOfCategory(category)) : null
    return ALL.filter(t => {
      if (filters.city !== 'all' && t.city !== filters.city) return false
      if (filters.mode === 'onsite' && !t.onsite) return false
      if (filters.mode === 'workshop' && !t.workshop) return false
      if (filters.verifiedOnly && !t.verified) return false
      if (filters.minRating > 0) {
        const r = ratings.get(t.id)
        if (!r || r.avg < filters.minRating) return false
      }
      if (catTitles && !t.services.some(s => catTitles.has(s))) return false
      if (q
        && !t.name.includes(q) && !t.title.includes(q)
        && !t.services.some(s => s.includes(q))
        && !(t.club ?? '').includes(q)) return false
      return true
    })
  }, [ALL, query, category, filters, ratings])

  const active = countActive(filters) + (category ? 1 : 0)
  const clearAll = useCallback(() => { setFilters(EMPTY_FILTERS); setCategory(null); setQuery('') }, [])

  const scrollToResults = useCallback(() => {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    resultsRef.current?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' })
  }, [])

  /* شیت موبایل: قفل بدنه، Escape، و بازگشت فوکوس */
  useEffect(() => {
    if (!sheet) { document.body.style.overflow = ''; sheetOpener.current?.focus(); return }
    document.body.style.overflow = 'hidden'
    sheetClose.current?.focus()
    /* ⚠️ بدون دام فوکوس، Tab از دل یک دیالوگ `aria-modal` مستقیم
       می‌رود توی صفحه‌ی پشتش — یعنی ادعای مودال دروغ است. */
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSheet(false); return }
      if (e.key !== 'Tab') return
      const root = sheetPanel.current
      if (!root) return
      const f = [...root.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])',
      )].filter(el => el.offsetParent !== null)
      if (f.length === 0) return
      const first = f[0]!, last = f[f.length - 1]!
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [sheet])

  return (
    <div className="tm">
      {/* ═══════ ۱ — کشف خدمت ═══════ */}
      <section className="tm-hero">
        {/* ⚠️ عکس جای خود را به پوسترِ طراحی‌شده داد: مالک گفت آن
            تصویرِ تیره جذاب نیست و هر صفحه باید پوسترِ خودش را
            داشته باشد. هیچ بایتِ شبکه‌ای اضافه نمی‌کند — SVG
            درون‌خطی و CSS. */}
        <HeroArt variant="services" />
        <div className="tm-wrap tm-hero-in">
          <div>
            {/* ⚠️ تیتر کوتاه شد و لحنش رسمی: نسخه‌ی قبلی یازده کلمه بود
                و روی ۳۹۰ چهار خط می‌گرفت، یعنی تاشوی اول را کامل
                می‌خورد و ماژول جست‌وجو زیر خط دید می‌افتاد. */}
            {/* ⚠️ دو span، نه یک جمله‌ی تخت. تیترِ تک‌وزنه «HTMLِ خالی»
                دیده می‌شد چون هیچ سلسله‌مراتبی نداشت؛ کنتراستِ وزن و
                مقیاس بین دو سطر همان چیزی است که به آن فرم می‌دهد.
                شکستِ *بینِ* دو سطر دستی است؛ ولی `text-wrap: pretty`
                از market.css ارث می‌رسد و شکستِ داخلِ هر span را
                همچنان خودش تنظیم می‌کند. */}
            <h1>
              <span className="tm-hero-k">متخصصین</span>{' '}
              <span className="tm-hero-t">خدمات فنی بیلیارد</span>
            </h1>
            {/* ⚠️ خط تیره برداشته شد: در RTL سرِ خط دوم می‌افتاد و
                جمله را دو تکه‌ی بی‌ربط نشان می‌داد. */}
            <p className="tm-hero-sub">
              تعمیر، رگلاژ، تعویض و نصب قطعات را از متخصصان ثبت‌شده بخواهید
            </p>
            <ServiceSearch
              query={query} onQuery={setQuery}
              city={filters.city} onCity={c => setFilters(f => ({ ...f, city: c }))}
              cities={cities} onSubmit={scrollToResults}
            />
          </div>

        </div>
      </section>

      {/* ═══════ ۲ — دسته‌های خدمت ═══════
          ⚠️ قابِ گرادیانی و جنسِ شیشه از نوارِ «کاوش کن»ِ صفحه‌ی اصلی
          می‌آید و قلمشان یکی است، ولی کارتِ این‌جا عمدا کوتاه‌تر است:
          مالک گفت بزرگ‌اند. جزئیات در ios.css کنارِ `.tm-cat`.
          لکه‌ها با شبه‌المان‌اند نه `div`، چون تزئینِ محض‌اند. */}
      <div className="tm-explore">
        <section className="tm-sec tm-wrap" aria-labelledby="tm-cats-h">
          <div className="tm-sec-head">
            <h2 className="tm-h2" id="tm-cats-h">خدمات فنی</h2>
            <Link className="tm-link" href="#tm-people">مشاهده همه متخصصان</Link>
          </div>
          <ServiceCategoryList
            active={category}
            onPick={id => { setCategory(id); scrollToResults() }}
            counts={catCounts}
          />
        </section>
      </div>

      {/* ═══════ ۳ — دایرکتوری ═══════ */}
      <section className="tm-sec tm-wrap" id="tm-people" aria-labelledby="tm-people-h" ref={resultsRef}>
        <div className="tm-sec-head">
          <h2 className="tm-h2" id="tm-people-h">متخصصان خدمات فنی</h2>
        </div>

        <div className="tm-dir">
          {/* ستون فیلتر — فقط دسکتاپ */}
          <aside className="tm-filters" aria-label="فیلترها">
            <ServiceFilters
              value={filters} onChange={setFilters}
              cities={cities} hasAnyRating={hasAnyRating} idPrefix="d"
            />
          </aside>

          <div>
            <div className="tm-controls">
              <span className="tm-count" aria-live="polite">
                {loading ? 'در حال بارگذاری…' : `${faDigits(String(results.length))} متخصص`}
              </span>
              {/* دکمه‌ی فیلتر فقط زیر ۱۰۲۴ معنا دارد */}
              <button
                type="button" className="tm-btn tm-btn--outline tm-btn--sm"
                onClick={e => { sheetOpener.current = e.currentTarget; setSheet(true) }}
                data-mobile-filters
              >
                <SlidersHorizontal size={15} aria-hidden />
                فیلترها{active > 0 && ` (${faDigits(String(active))})`}
              </button>
              {active > 0 && (
                <button type="button" className="tm-btn tm-btn--quiet tm-btn--sm" onClick={clearAll}>
                  پاک‌کردن
                </button>
              )}
            </div>

            {loading ? (
              <div className="tm-list" aria-hidden>
                {Array.from({ length: 3 }, (_, i) => <TechnicianCardSkeleton key={i} />)}
              </div>
            ) : failed && ALL.length === 0 ? (
              <div className="tm-empty" role="alert">
                <h3>فهرست متخصصان بارگذاری نشد</h3>
                <p>ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کن و دوباره تلاش کن</p>
                <button className="tm-btn tm-btn--outline" type="button"
                  onClick={() => window.location.reload()}>تلاش دوباره</button>
              </div>
            ) : results.length === 0 ? (
              <div className="tm-empty">
                <h3>متخصصی با این جست‌وجو پیدا نشد</h3>
                <p>
                  {active > 0
                    ? 'فیلترها را کمتر کن یا شهر دیگری را امتحان کن'
                    : 'هنوز متخصصی در این بخش ثبت نشده است'}
                </p>
                {active > 0 && (
                  <button className="tm-btn tm-btn--outline" type="button" onClick={clearAll}>
                    نمایش همه
                  </button>
                )}
              </div>
            ) : (
              <div className="tm-list">
                {results.map(t => {
                  const r = ratings.get(t.id)
                  return (
                    <TechnicianCard
                      key={t.id} tech={t}
                      ratingAvg={r?.avg} ratingCount={r?.count}
                    />
                  )
                })}
              </div>
            )}

            {/* ═══════ ۴ — ثبت درخواست ═══════ */}
            <div className="tm-cta tm-cta-mt">
              <div>
                <h2>متخصص مناسب پیدا نکردی؟</h2>
                <p>نیازت را برای ما توضیح بده تا درخواستت را برای متخصصان مرتبط ارسال کنیم</p>
              </div>
              <Link className="tm-btn tm-btn--gold" href="/support?topic=technical-service">
                <Send size={16} aria-hidden />
                ثبت درخواست خدمات
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ ۵ — ثبت‌نام متخصص ═══════ */}
      <section className="tm-sec tm-wrap">
        <div className="tm-cta tm-cta--dark">
          <div>
            <h2>خدمات فنی ارائه می‌دهی؟</h2>
            <p>پروفایل حرفه‌ای خودت را در بیلیارد هاب بساز و خدماتت را به مشتریان جدید معرفی کن</p>
          </div>
          <Link className="tm-btn tm-btn--gold" href="/dashboard/technician">
            <UserPlus size={16} aria-hidden />
            ثبت‌نام به عنوان متخصص
          </Link>
        </div>
      </section>

      {/* ═══════ شیت فیلتر موبایل ═══════ */}
      {sheet && (
        <div className="tm-sheet" role="presentation" onClick={() => setSheet(false)}>
          <div
            ref={sheetPanel}
            className="tm-sheet-panel"
            role="dialog" aria-modal="true" aria-labelledby="tm-sheet-h"
            onClick={e => e.stopPropagation()}
          >
            <div className="tm-sheet-head">
              <strong id="tm-sheet-h">فیلترها</strong>
              <button ref={sheetClose} type="button" className="tm-icon-btn"
                onClick={() => setSheet(false)} aria-label="بستن">
                <X size={16} aria-hidden />
              </button>
            </div>

            <ServiceFilters
              value={filters} onChange={setFilters}
              cities={cities} hasAnyRating={hasAnyRating} idPrefix="m"
            />

            <div className="tm-sheet-foot">
              <button type="button" className="tm-btn tm-btn--outline"
                onClick={() => setFilters(EMPTY_FILTERS)}>پاک‌کردن</button>
              <button type="button" className="tm-btn tm-btn--primary"
                onClick={() => setSheet(false)}>
                نمایش {faDigits(String(results.length))} متخصص
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

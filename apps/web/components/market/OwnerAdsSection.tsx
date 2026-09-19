'use client'

/* ─────────────────────────────────────────────────────────────
   «آگهی‌های من» — ویترینِ آگهی‌های یک پروفایل، داخلِ صفحه‌ی خودش.

   صفحه‌ی فروشگاه (`app/sellers/[id]`) از روزِ اول چنین بخشی دارد:
   نوارِ دسته‌بندی، جست‌وجو، گریدِ کارت و صفحه‌بندی. تولیدکننده هم
   همان را می‌خواهد — آگهی‌هایی که خودش ثبت می‌کند، چه محصولِ تولیدیِ
   خودش باشد چه هر چیزِ دیگری که می‌فروشد.

   این‌جا فقط نمایش است: ردیف‌ها از بیرون می‌آیند (صفحه خودش
   `fetchProductsByOwner` را صدا می‌زند)، پس کامپوننت به هیچ مسیرِ
   API گره نخورده.

   ── چرا کلاس‌ها با `oa-` شروع می‌شوند ──
   صفحه‌ی تولیدکننده خودش `.prod-card-sec1` را با نسبتِ ثابت تعریف
   کرده (کارتِ «محصولات ما»). اگر این بخش هم همان نام را می‌گرفت،
   دو تعریفِ ناسازگار روی یک صفحه می‌نشستند و کارتی که آخر تعریف
   شده بود برنده می‌شد. پیشوندِ جدا یعنی دو گرید مستقل‌اند.

   جنسِ سطحِ کارت همچنان از `.lq-pcard` در globals.css می‌آید، پس با
   بازار و صفحه‌ی اصلی یکی می‌ماند.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MARKET_CATEGORIES, normalizeCategory } from '../../lib/market/categories'
import ProductTitle from './ProductTitle'
import { CardMeta, CardPrice } from './CardFacts'
import ProductMedia from './ProductMedia'
import './product-media.css'
import { toFa, faNum, MONO, Icon, toggleSet, LQ, LQ_NEUTRAL, LQ_FELT_ON } from '../../app/sellers/[id]/shared'
import type { ShopProduct } from '../../app/shop/products'

const PER_PAGE = 12

export interface OwnerAdsSectionProps {
  /** آگهی‌های همین پروفایل — فچ با صفحه است، نه با این کامپوننت */
  rows: ShopProduct[]
  loading?: boolean
  /** درخواست شکست خورد — فهرست خالی با «آگهی ندارد» یکی نیست */
  error?: boolean
  onRetry?: () => void
  title?: string
  searchPlaceholder?: string
}

export default function OwnerAdsSection({
  rows,
  loading = false,
  error = false,
  onRetry,
  title = 'آگهی‌های ما',
  searchPlaceholder = 'جستجو در آگهی‌ها…',
}: OwnerAdsSectionProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const qid = useId()

  const [cat, setCat] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  /* نشانِ علاقه‌مندی — مثل صفحه‌ی فروشگاه فقط در همین بازدید
     می‌ماند؛ هنوز جایی ذخیره نمی‌شود. */
  const [wish, setWish] = useState<Set<string>>(new Set())

  /* ⚠️ `normalizeCategory` اجباری است: ردیف‌های قدیمی هنوز کلیدهای
     منسوخ (`case-bag`، `case`، `bag`) را دارند و هیچ‌کدام با شناسه‌ی
     چیپ‌ها یکی نیستند. بدون این، آن آگهی‌ها در سطلی نامرئی شمرده
     می‌شدند و با زدن هر چیپی از گرید ناپدید. */
  const catCounts = useMemo(() => {
    const c: Record<string, number> = {}
    rows.forEach(p => {
      const k = normalizeCategory(p.cat)
      c[k] = (c[k] ?? 0) + 1
    })
    return c
  }, [rows])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(p => {
      if (cat !== 'all' && normalizeCategory(p.cat) !== cat) return false
      if (!q) return true
      return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.model.toLowerCase().includes(q)
    })
  }, [rows, cat, query])

  const pageCount = Math.max(1, Math.ceil(visible.length / PER_PAGE))
  const safePage = Math.min(page, pageCount)
  const paged = visible.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  useEffect(() => { setPage(1) }, [cat, query])

  /* اول و آخر همیشه، به‌اضافه‌ی دو صفحه‌ی اطراف صفحه‌ی جاری. صفر
     یعنی «…» — شماره‌ی صفحه هرگز صفر نیست پس با آن اشتباه نمی‌شود. */
  const pageWindow = useMemo(() => {
    const keep = new Set<number>([1, pageCount])
    for (let n = safePage - 2; n <= safePage + 2; n++) {
      if (n >= 1 && n <= pageCount) keep.add(n)
    }
    const sorted = [...keep].sort((a, b) => a - b)
    const out: number[] = []
    sorted.forEach((n, i) => {
      if (i > 0 && n - sorted[i - 1]! > 1) out.push(0)
      out.push(n)
    })
    return out
  }, [pageCount, safePage])

  const goToPage = (n: number) => {
    setPage(n)
    requestAnimationFrame(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  /* بخشِ خالیِ دائمی چیزی به صفحه اضافه نمی‌کند — پروفایلی که هیچ
     آگهی‌ای ثبت نکرده، این بخش را اصلا نمی‌بیند. حالتِ «پیدا نشد»
     فقط وقتی معنا دارد که فیلترِ خودِ کاربر فهرست را خالی کرده.

     ⚠️ خطا از این قاعده مستثناست: «نتوانستم بخوانم» با «آگهی ندارد»
     یکی نیست و اگر این‌جا هم `null` برگردد، بخش بی‌صدا غیب می‌شود. */
  if (!loading && !error && rows.length === 0) return null

  return (
    <section className="mx-auto max-w-[1240px] px-4 pb-16 pt-2 sm:px-6">
      <style>{`
        .oa-card { width: 100%; }
        .oa-body { padding: 21px 10px 12px; }
        .oa-h {
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; font-weight: var(--ad-title-w);
        }
        .oa-t {
          display: block; margin-top: 3px; font-size: var(--ad-sub); font-weight: var(--ad-sub-w);
          color: #6F6A5C; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .oa-name {
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          font-size: var(--ad-title); line-height: var(--ad-title-lh); color: #1C1C1A;
        }
        .oa-pct  { font-size: var(--ad-pct);   font-weight: var(--ad-pct-w); }
        .oa-old  { font-size: var(--ad-old); }
        .oa-now  { font-size: var(--ad-price); font-weight: var(--ad-price-w); }
        .oa-unit { font-size: var(--ad-unit);  font-weight: var(--ad-unit-w); }
        @media (max-width: 700px) {
          .oa-body { padding: 14px 7px 7px; }
          .oa-name { line-height: 1.35; color: #666; }
        }

        .oa-catwrap {
          border-radius: 16px; padding: 9px 10px;
          background: linear-gradient(135deg, rgba(255,255,255,0.86) 0%, rgba(247,245,240,0.72) 100%);
          border: 1px solid rgba(199,166,106,0.26);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.9), 0 6px 22px rgba(28,27,23,0.06);
          backdrop-filter: blur(18px) saturate(1.6);
          -webkit-backdrop-filter: blur(18px) saturate(1.6);
        }
        .oa-strip {
          display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none;
          -ms-overflow-style: none; padding-bottom: 1px;
        }
        .oa-strip::-webkit-scrollbar { display: none; }
        .oa-chip {
          flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; gap: 4px;
          width: 74px; padding: 8px 4px 7px; border-radius: 13px; cursor: pointer;
          background: #fff; border: 1px solid rgba(28,27,23,0.09);
          transition: transform .2s cubic-bezier(.22,1,.36,1), border-color .2s, box-shadow .2s, background .2s;
        }
        .oa-chip:hover { transform: translateY(-2px); border-color: rgba(199,166,106,0.55); box-shadow: 0 8px 20px rgba(28,27,23,0.10); }
        .oa-chip:focus-visible { outline: 2px solid #14532D; outline-offset: 2px; }
        .oa-chip.on {
          background: linear-gradient(160deg, rgba(199,166,106,0.20), rgba(199,166,106,0.07));
          border-color: rgba(199,166,106,0.70);
          box-shadow: 0 6px 18px rgba(199,166,106,0.24);
        }
        .oa-ic {
          width: 38px; height: 38px; border-radius: 11px; display: flex;
          align-items: center; justify-content: center; overflow: hidden;
          background: radial-gradient(circle at 34% 28%, #FFFDF8, #F1EDE3);
          border: 1px solid rgba(28,27,23,0.07);
        }
        .oa-ic img { width: 30px; height: 30px; object-fit: contain; }
        .oa-all { color: #8F6531; background: radial-gradient(circle at 34% 28%, #FFF6E4, #F3E6CB); }
        .oa-lb { font-size: 11px; font-weight: 700; color: #3E3A32; white-space: nowrap; }
        .oa-chip.on .oa-lb { color: #7A5626; }
        .oa-ct { font-size: 10px; font-weight: 700; color: #A69F8E; font-variant-numeric: tabular-nums; }
        .oa-chip.on .oa-ct { color: #8F6531; }
        .oa-ct-0 { opacity: .65; }

        .oa-skel {
          border-radius: 12px; background: #EFECE4; aspect-ratio: 1 / 1.7;
          animation: oaPulse 1.2s ease-in-out infinite alternate;
        }
        @keyframes oaPulse { from { opacity: .55 } to { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) {
          .oa-chip { transition: none } .oa-chip:hover { transform: none }
          .oa-skel { animation: none }
        }
      `}</style>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-5 w-[3px] rounded bg-gradient-to-b from-[#C7A66A] to-[#8A6020]" />
            <h2 className="text-xl font-bold text-[#1C1B17] sm:text-2xl">{title}</h2>
          </div>
          <span className="ms-3 text-[12.5px] text-[#6F6A5C]">
            {loading ? 'در حال بارگذاری…' : error ? 'خطا در بارگذاری' : `${faNum(visible.length)} آگهی`}
          </span>
        </div>
      </div>

      {/* جست‌وجو — شناسه از `useId`: این بخش ممکن است دو بار روی یک
          صفحه بنشیند و شناسه‌ی ثابت پیوندِ label را می‌شکند. */}
      <div className="relative">
        <label className="sr-only" htmlFor={qid}>{searchPlaceholder}</label>
        <input
          id={qid}
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-[10px] border border-[#E7E2D6] bg-white px-4 py-2.5 text-[13.5px] text-[#1C1B17] placeholder:text-[#6F6A5C] focus:border-[#14532D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(20,83,45,0.35)]"
        />
      </div>

      {/* نوار دسته‌بندی — همان ترتیب و همان آیکون‌های بیلیارد بازار */}
      <div className="oa-catwrap mt-3">
        <div className="oa-strip">
          <button
            type="button"
            onClick={() => setCat('all')}
            aria-pressed={cat === 'all'}
            className={`oa-chip${cat === 'all' ? ' on' : ''}`}
          >
            <span className="oa-ic oa-all" aria-hidden>{Icon.storefront}</span>
            <span className="oa-lb">همه</span>
            <span className="oa-ct">{faNum(rows.length)}</span>
          </button>
          {MARKET_CATEGORIES.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(cat === c.id ? 'all' : c.id)}
              aria-pressed={cat === c.id}
              className={`oa-chip${cat === c.id ? ' on' : ''}`}
            >
              <span className="oa-ic"><img src={c.img} alt="" loading="lazy" /></span>
              <span className="oa-lb">{c.label}</span>
              {(catCounts[c.id] ?? 0) > 0
                ? <span className="oa-ct">{faNum(catCounts[c.id] ?? 0)}</span>
                : <span className="oa-ct oa-ct-0">—</span>}
            </button>
          ))}
        </div>
      </div>

      <div ref={gridRef} className="mt-5 scroll-mt-20">
        {loading ? (
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 min-[640px]:grid-cols-3 min-[860px]:grid-cols-4 min-[1040px]:grid-cols-5 min-[1200px]:grid-cols-6">
            {Array.from({ length: PER_PAGE }, (_, i) => (
              <div key={i} className="oa-skel" aria-hidden />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-[#E7E2D6] bg-white px-6 py-14 text-center text-[13.5px] text-[#6F6A5C]">
            آگهی‌ها بارگذاری نشد.
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="ms-2 font-bold text-[#8F6531] transition hover:opacity-70"
              >
                تلاش دوباره
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 min-[640px]:grid-cols-3 min-[860px]:grid-cols-4 min-[1040px]:grid-cols-5 min-[1200px]:grid-cols-6">
            {/* ⚠️ لینکِ واقعی، نه `onClick` روی `<article>`: کاربرِ
                کیبورد باید بتواند روی کارت tab بزند و «بازکردن در
                تبِ جدید» هم باید کار کند. `ShareChip` داخلِ
                ProductMedia از قبل حساب کرده که کارت یک لینک است. */}
            {paged.map(p => (
              <Link
                key={p.id}
                href={`/shop/${p.id}`}
                className="oa-card lq-pcard group flex flex-col overflow-hidden"
              >
                <ProductMedia
                  src={p.img} alt={p.name} href={`/shop/${p.id}`}
                  imgCount={p.imgCount}
                  saved={wish.has(String(p.id))}
                  saveLabel={{ on: 'حذف از علاقه‌مندی', off: 'افزودن به علاقه‌مندی' }}
                  onToggleSave={() => setWish(prev => toggleSet(prev, String(p.id)))}
                  imgClassName="group-hover:scale-[1.05]"
                />
                <div className="oa-body flex flex-1 flex-col gap-1.5">
                  <ProductTitle p={p} className="oa-name" headClassName="oa-h" tailClassName="oa-t" />
                  <CardMeta p={p} />
                  <div className="mt-auto flex items-center gap-1.5">
                    <CardPrice p={p} cls={{
                      pct: `inline-flex shrink-0 items-center justify-center rounded-full bg-[#b400ae] px-2.5 pb-0.5 pt-1 leading-none text-white oa-pct ${MONO}`,
                      box: 'ms-auto text-end',
                      old: `-mb-[3px] mt-[3px] leading-[1.1] text-[rgba(28,28,26,0.5)] line-through tabular-nums oa-old ${MONO}`,
                      now: `tabular-nums text-[#1C1C1A] oa-now ${MONO}`,
                      unit: 'inline-block no-underline oa-unit',
                    }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="rounded-2xl border border-[#E7E2D6] bg-white px-6 py-14 text-center text-[13.5px] text-[#6F6A5C]">
            آگهی‌ای با این فیلتر پیدا نشد.
            {(cat !== 'all' || query) && (
              <button
                type="button"
                onClick={() => { setCat('all'); setQuery('') }}
                className="ms-2 font-bold text-[#8F6531] transition hover:opacity-70"
              >
                نمایش همه آگهی‌ها
              </button>
            )}
          </div>
        )}

        {/* ── صفحه‌بندی ──
            ⚠️ پنجره‌دار، نه «یک دکمه به ازای هر صفحه»: با سقفِ ۲۰۰
            آگهی تا ۱۷ دکمه می‌شد و روی ۳۷۵px سه سطر می‌رفت.

            ⚠️ نشانه‌ها lucide‌اند نه ‹ و ›: آن دو کاراکتر در متنِ
            راست‌به‌چپ آینه می‌شوند و «بعدی» به سمتِ اشتباه اشاره
            می‌کرد. در RTL «بعدی» یعنی چپ. */}
        {!loading && !error && pageCount > 1 && (
          <nav aria-label="صفحه‌بندی آگهی‌ها" className="mt-9 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(Math.max(1, safePage - 1))}
              disabled={safePage === 1}
              aria-label="صفحه‌ی قبل"
              className={`${LQ} ${LQ_NEUTRAL} flex h-9 w-9 items-center justify-center rounded-xl text-[#5B564B] disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <ChevronRight size={16} aria-hidden />
            </button>
            {pageWindow.map((n, i) => (
              n === 0 ? (
                <span key={`gap-${i}`} aria-hidden className="flex h-9 w-5 items-center justify-center text-[13px] text-[#A69F8E]">…</span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => goToPage(n)}
                  aria-label={`صفحه‌ی ${toFa(n)}`}
                  aria-current={safePage === n ? 'page' : undefined}
                  className={`${LQ} flex h-9 w-9 items-center justify-center rounded-xl text-[13px] ${
                    safePage === n ? `${LQ_FELT_ON} font-bold` : `${LQ_NEUTRAL} text-[#5B564B]`
                  } ${MONO}`}
                >
                  {toFa(n)}
                </button>
              )
            ))}
            <button
              type="button"
              onClick={() => goToPage(Math.min(pageCount, safePage + 1))}
              disabled={safePage === pageCount}
              aria-label="صفحه‌ی بعد"
              className={`${LQ} ${LQ_NEUTRAL} flex h-9 w-9 items-center justify-center rounded-xl text-[#5B564B] disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <ChevronLeft size={16} aria-hidden />
            </button>
          </nav>
        )}
      </div>
    </section>
  )
}

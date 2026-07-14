'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toFa, faNum, parsePrice, MONO, toggleSet, Stars, Icon, LQ, LQI, LQ_NEUTRAL, LQ_FELT, LQ_FELT_ON, LQ_GREEN } from './shared'
import { productsBySeller } from '../../shop/products'
import ClubStoryModal from '../../../components/ClubStoryModal'

/*
  نسخه‌ی فلت — UX فروشگاه واقعی
  دسته‌بندی‌ها: عیناً از «بیلیارد بازار» (۱۴ دسته)
*/

/* ─── دسته‌بندی‌های بیلیارد بازار ─── */
const BAZAAR_CATS = [
  { id: 'cue',       label: 'چوب' },
  { id: 'table',     label: 'میز' },
  { id: 'ball',      label: 'توپ' },
  { id: 'tip',       label: 'تیپ' },
  { id: 'chalk',     label: 'گچ' },
  { id: 'extension', label: 'اکستنشن' },
  { id: 'case-bag',  label: 'کیس و کیف' },
  { id: 'rest',      label: 'رست' },
  { id: 'cloth',     label: 'پارچه' },
  { id: 'oil',       label: 'روغن' },
  { id: 'towel',     label: 'حوله' },
  { id: 'clothing',  label: 'پوشاک' },
  { id: 'accessory', label: 'اکسسوری' },
  { id: 'other',     label: 'سایر' },
] as const
type CatKey = typeof BAZAAR_CATS[number]['id']
const CAT_LABEL = Object.fromEntries(BAZAAR_CATS.map(c => [c.id, c.label])) as Record<CatKey, string>

interface Product {
  id: string; name: string; cat: CatKey; brand: string
  price: number; old?: number; rating: number; reviews: number; sales: number
  badge?: { text: string; kind: 'sale' | 'new' }; img: string
}

const SELLER_ID = '1'

const STORE = {
  id: SELLER_ID, brand: 'پروکیو', title: 'پروکیو | تجهیزات حرفه‌ای بیلیارد', logoText: 'پک',
  verified: true, rating: 4.8, reviews: 312, memberSince: 1402,
  whatsapp: '989121234567', phones: ['021-88221100', '0912-123-4567'], instagram: 'procue.ir',
  address: 'تهران، خیابان ولیعصر، بالاتر از پارک ملت، پلاک ۴۵',
  hours: 'شنبه تا پنج‌شنبه، ۹ تا ۲۰',
  shipping: 'تحویل حضوری هم در فروشگاه امکان‌پذیر است',
  storyImage: '/images/shop/Pro_table.jpg',
  storyText: 'جدیدترین کالکشن چوب‌های کربنی Predator رسید — همین حالا ببینید!',
}

/* محصولات از منبع واحد بیلیارد بازار (همین فروشنده) */
const PRODUCTS: Product[] = productsBySeller(SELLER_ID).map(sp => ({
  id: String(sp.id),
  name: sp.name,
  cat: sp.cat as CatKey,
  brand: sp.brand,
  price: sp.price,
  old: sp.old > 0 ? sp.old : undefined,
  rating: sp.rating,
  reviews: sp.reviews,
  sales: sp.sales,
  badge: sp.disc > 0 ? { text: `${toFa(sp.disc)}٪ تخفیف`, kind: 'sale' as const } : undefined,
  img: sp.img,
}))

/* بازه‌های قیمت سریع (تومان) */
const PRICE_RANGES: { label: string; from?: number; to?: number }[] = [
  { label: 'زیر ۱ میلیون',        to: 1000000 },
  { label: '۱ تا ۵ میلیون',       from: 1000000,  to: 5000000 },
  { label: '۵ تا ۲۰ میلیون',      from: 5000000,  to: 20000000 },
  { label: 'بالای ۲۰ میلیون',     from: 20000000 },
]

type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'rating'
const SORT_OPTIONS: { k: SortKey; l: string }[] = [
  { k: 'popular',    l: 'پرفروش‌ترین' },
  { k: 'price-asc',  l: 'ارزان‌ترین' },
  { k: 'price-desc', l: 'گران‌ترین' },
  { k: 'rating',     l: 'بیشترین امتیاز' },
]

/* ─── دراپ‌داون حرفه‌ای (کاستوم، با انیمیشن و کیبورد) ─── */
function SortDropdown({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [])

  const current = SORT_OPTIONS.find(o => o.k === value)!

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox" aria-expanded={open}
        className={`${LQ} ${LQ_NEUTRAL} flex items-center gap-2.5 rounded-2xl px-3.5 py-2 text-[13px] ${
          open ? 'ring-2 ring-[#14532D]/20' : ''
        }`}
      >
        <span className="text-[#8A8474]">مرتب‌سازی:</span>
        <span className="font-semibold text-[#1C1B17]">{current.l}</span>
        <span className={`text-[#8A8474] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>{Icon.chevron}</span>
      </button>

      <div
        role="listbox"
        className={`absolute start-0 top-full z-30 mt-2 w-52 origin-top overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_16px_40px_rgba(28,27,23,0.16)] backdrop-blur-xl transition-all duration-150 ${
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        {SORT_OPTIONS.map(o => {
          const selected = o.k === value
          return (
            <button
              key={o.k}
              role="option" aria-selected={selected}
              onClick={() => { onChange(o.k); setOpen(false) }}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-right text-[13px] transition-colors ${
                selected ? 'bg-[#DCEEE4]/60 font-semibold text-[#14532D]' : 'text-[#5B564B] hover:bg-white/70'
              }`}
            >
              {o.l}
              {selected && <span className="text-[#14532D]">{Icon.check}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ═══ صفحه ═══ */
export default function FlatShop() {
  const store = STORE

  /* filters */
  const [checkedCats, setCheckedCats] = useState<Set<CatKey>>(new Set())
  const [priceFrom, setPriceFrom] = useState('')
  const [priceTo, setPriceTo]     = useState('')
  const [quickRange, setQuickRange] = useState<number | null>(null)
  const [query, setQuery]         = useState('')
  const [sort, setSort]           = useState<SortKey>('popular')
  const [page, setPage]           = useState(1)
  const [sheetOpen, setSheetOpen] = useState(false)

  /* wishlist + story */
  const [wish, setWish] = useState<Set<string>>(new Set())
  const [storyOpen, setStoryOpen] = useState(false)
  const router = useRouter()

  /* قفل اسکرول وقتی شیت موبایل باز است */
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sheetOpen])

  const navActive: 'all' | CatKey =
    checkedCats.size === 0 ? 'all' : checkedCats.size === 1 ? [...checkedCats][0]! : 'all'

  const setNavCat = (k: 'all' | CatKey) =>
    setCheckedCats(k === 'all' ? new Set() : new Set([k]))

  const clearFilters = () => {
    setCheckedCats(new Set()); setPriceFrom(''); setPriceTo(''); setQuickRange(null); setQuery('')
  }

  const activeFilterCount =
    checkedCats.size + (quickRange !== null ? 1 : 0) + (priceFrom ? 1 : 0) + (priceTo ? 1 : 0)

  const catCounts = useMemo(() => {
    const c = Object.fromEntries(BAZAAR_CATS.map(x => [x.id, 0])) as Record<CatKey, number>
    PRODUCTS.forEach(p => { c[p.cat]++ })
    return c
  }, [])

  const pickQuickRange = (idx: number, r: { from?: number; to?: number }) => {
    if (quickRange === idx) { setQuickRange(null); setPriceFrom(''); setPriceTo('') }
    else { setQuickRange(idx); setPriceFrom(r.from ? String(r.from) : ''); setPriceTo(r.to ? String(r.to) : '') }
  }

  const visible = useMemo(() => {
    const from = parsePrice(priceFrom)
    const to   = parsePrice(priceTo)
    const q = query.trim()
    const list = PRODUCTS.filter(p => {
      if (checkedCats.size && !checkedCats.has(p.cat)) return false
      if (from !== null && p.price < from) return false
      if (to !== null && p.price > to) return false
      if (q && !p.name.includes(q) && !p.brand.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
    const sorted = [...list]
    if (sort === 'popular')    sorted.sort((a, b) => b.sales - a.sales)
    if (sort === 'price-asc')  sorted.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price)
    if (sort === 'rating')     sorted.sort((a, b) => b.rating - a.rating)
    return sorted
  }, [checkedCats, priceFrom, priceTo, query, sort])

  const heading = navActive === 'all' ? 'همه محصولات' : CAT_LABEL[navActive]

  /* پنل فیلتر — هم در سایدبار دسکتاپ هم در شیت موبایل */
  const FilterPanel = (
    <>
      <div className="border-b border-[#E7E2D6] pb-5">
        <h4 className="mb-3.5 text-[13px] font-semibold">دسته‌بندی</h4>
        {BAZAAR_CATS.map(c => (
          <label key={c.id} className="mb-2.5 flex cursor-pointer items-center gap-2.5 text-[13px] text-[#5B564B]">
            <input
              type="checkbox"
              checked={checkedCats.has(c.id)}
              onChange={() => setCheckedCats(prev => toggleSet(prev, c.id))}
              className="h-[15px] w-[15px] accent-[#14532D]"
            />
            {c.label}
            <span className={`mr-auto text-[11.5px] text-[#8A8474] ${MONO}`}>{faNum(catCounts[c.id])}</span>
          </label>
        ))}
      </div>

      {/* بازه‌ی قیمت — سریع + دستی */}
      <div className="pt-5">
        <h4 className="mb-3.5 text-[13px] font-semibold">محدوده قیمت (تومان)</h4>
        <div className="mb-3 flex flex-wrap gap-2">
          {PRICE_RANGES.map((r, i) => {
            const on = quickRange === i
            return (
              <button key={i} onClick={() => pickQuickRange(i, r)}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  on ? 'border-[#14532D]/40 bg-[#14532D]/[0.10] text-[#14532D]' : 'border-[#E7E2D6] bg-white text-[#5B564B] hover:border-[#14532D]/30'
                }`}>
                {r.label}
              </button>
            )
          })}
        </div>
        <div className="flex gap-2">
          <input
            value={priceFrom} onChange={e => { setPriceFrom(e.target.value); setQuickRange(null) }} placeholder="از"
            className={`w-full rounded-lg border border-[#E7E2D6] bg-white px-2.5 py-2 text-[12.5px] focus:border-[#14532D] focus:outline-none ${MONO}`}
          />
          <input
            value={priceTo} onChange={e => { setPriceTo(e.target.value); setQuickRange(null) }} placeholder="تا"
            className={`w-full rounded-lg border border-[#E7E2D6] bg-white px-2.5 py-2 text-[12.5px] focus:border-[#14532D] focus:outline-none ${MONO}`}
          />
        </div>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="mt-4 text-[12.5px] font-medium text-[#14532D] transition-opacity hover:opacity-70">
            پاک کردن فیلترها ({faNum(activeFilterCount)})
          </button>
        )}
      </div>
    </>
  )

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F5F0] font-[Vazirmatn,Tahoma,sans-serif] text-[#1C1B17]">

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-[72px] z-40 border-b border-[#E7E2D6] bg-white">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-5 gap-y-2.5 px-4 py-3 sm:px-6">
          <Link href={`/sellers/${store.id}`} className="flex shrink-0 items-center gap-2.5 text-[17px] font-bold">
            <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_32%_30%,#2b2b2b,#0a0a0a_70%)]">
              <span className="flex h-[13px] w-[13px] items-center justify-center rounded-full bg-white text-[8px] font-bold text-[#111]">۸</span>
            </span>
            {store.brand}
          </Link>

          {/* سرچ — بلافاصله کنار لوگو؛ روی موبایل ردیف کامل دوم */}
          <div className="relative order-last w-full sm:order-none sm:w-auto sm:max-w-[520px] sm:flex-1">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="جستجوی محصول، مثلا چوب کربنی..."
              className="w-full rounded-[10px] border border-[#E7E2D6] bg-[#F7F5F0] px-4 py-2.5 pl-11 text-[13.5px] text-[#1C1B17] placeholder:text-[#8A8474] focus:border-[#14532D] focus:outline-none"
            />
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8474]">{Icon.search}</span>
          </div>
        </div>

      </header>

      {/* ── breadcrumb ── */}
      <div className="mx-auto max-w-[1240px] px-4 pt-4 text-[12.5px] text-[#8A8474] sm:px-6">
        <Link href="/" className="transition-colors hover:text-[#14532D]">خانه</Link>
        <span className="mx-1.5">/</span>
        <Link href="/sellers" className="transition-colors hover:text-[#14532D]">فروشگاه</Link>
        <span className="mx-1.5">/</span>
        <span>{heading}</span>
      </div>

      {/* ═══ STORE CARD ═══ */}
      <div className="mx-auto mt-4 max-w-[1240px] px-4 sm:px-6">
        <div className="flex flex-wrap items-start gap-5 rounded-2xl border border-[#E7E2D6] bg-white p-4 sm:gap-6 sm:p-6">
          {/* لوگوی دایره‌ای با حلقه‌ی استوری (مثل صفحه‌ی باشگاه) */}
          <button
            type="button" onClick={() => setStoryOpen(true)} aria-label="مشاهده استوری فروشگاه"
            className="shrink-0 rounded-full p-[3px] transition-transform duration-200 hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)', boxShadow: '0 0 14px rgba(214,41,118,0.35)' }}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-[2.5px] border-white bg-gradient-to-bl from-[#14532D] to-[#1E6B3C] text-lg font-bold text-white sm:h-16 sm:w-16 sm:text-xl">
              {store.logoText}
            </span>
          </button>

          <div className="min-w-[200px] flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-[15.5px] font-bold sm:text-[17px]">{store.title}</h2>
              {store.verified && (
                <span className="rounded-full bg-[#DCEEE4] px-2.5 py-1 text-[11px] font-semibold text-[#14532D]">
                  فروشگاه تایید شده
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12.5px] text-[#8A8474]">
              <Stars r={store.rating}/>
              <span className={`font-semibold text-[#1C1B17] ${MONO}`}>{faNum(store.rating, 1)}</span>
              از {faNum(store.reviews)} نظر · عضو از {toFa(store.memberSince)}
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <a
                href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noopener noreferrer"
                className={`${LQ} ${LQ_GREEN} flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-semibold`}
              >
                {Icon.wa} واتساپ
              </a>
              <a
                href={`tel:${store.phones[1]?.replace(/-/g, '') ?? ''}`}
                className={`${LQ} ${LQ_FELT} flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-semibold`}
              >
                {Icon.phone} تماس
              </a>
            </div>

          </div>
        </div>
      </div>

      {/* ═══ LAYOUT ═══ */}
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-8 px-4 pb-20 pt-5 sm:px-6 min-[861px]:grid-cols-[236px_1fr]">

        {/* سایدبار دسکتاپ */}
        <aside className="sticky top-[146px] hidden self-start rounded-2xl border border-[#E7E2D6] bg-white p-5 shadow-[0_4px_20px_rgba(28,27,23,0.05)] min-[861px]:block">
          {FilterPanel}
        </aside>

        <main>
          {/* toolbar */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg font-bold sm:text-xl">{heading}</h1>
              <span className="text-[12.5px] text-[#8A8474]">{faNum(visible.length)} محصول</span>
            </div>
            <div className="flex items-center gap-2">
              {/* دکمه فیلتر موبایل */}
              <button
                onClick={() => setSheetOpen(true)}
                className={`${LQ} ${LQ_NEUTRAL} flex items-center gap-2 rounded-2xl px-3.5 py-2 text-[13px] text-[#5B564B] min-[861px]:hidden`}
              >
                {Icon.funnel} فیلترها
                {activeFilterCount > 0 && (
                  <span className={`flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#14532D] px-1 text-[10px] font-bold text-white ${MONO}`}>
                    {faNum(activeFilterCount)}
                  </span>
                )}
              </button>
              <SortDropdown value={sort} onChange={setSort}/>
            </div>
          </div>

          {/* گرید — ۴ کارت در دسکتاپ */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 min-[700px]:grid-cols-3 min-[1000px]:grid-cols-4">
            {visible.map(p => {
              const isWished = wish.has(p.id)
              return (
                <article
                  key={p.id}
                  onClick={() => router.push(`/shop/${p.id}`)}
                  className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#E7E2D6] bg-white transition-all duration-200 hover:-translate-y-[3px] hover:border-[#14532D]/30 hover:shadow-[0_12px_26px_rgba(28,27,23,0.10)]"
                >
                  <div className="relative aspect-square overflow-hidden bg-[#F7F5F0]">
                    <img src={p.img} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"/>
                    {p.badge && (
                      <span className={`absolute right-2.5 top-2.5 rounded-md px-2 py-1 text-[11px] font-semibold text-white ${
                        p.badge.kind === 'sale' ? 'bg-[#B23B2E]' : 'bg-[#A8791F]'
                      }`}>
                        {p.badge.text}
                      </span>
                    )}
                    <button
                      aria-label="علاقه‌مندی"
                      onClick={e => { e.stopPropagation(); setWish(prev => toggleSet(prev, p.id)) }}
                      className={`${LQI} absolute left-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full ${
                        isWished ? 'text-[#B23B2E]' : 'text-[#5B564B] hover:text-[#B23B2E]'
                      }`}
                    >
                      {Icon.heart}
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col gap-1.5 p-3 pb-3.5 sm:gap-2 sm:p-3.5 sm:pb-4">
                    <div className="text-[11.5px] text-[#8A8474]">{CAT_LABEL[p.cat]}</div>
                    <div className="text-[13.5px] font-semibold leading-relaxed sm:text-[14px]">{p.name}</div>
                    <div className="flex items-center gap-1.5 text-[11.5px] text-[#8A8474]">
                      <Stars r={p.rating}/>
                      <span className={MONO}>{faNum(p.rating, 1)} ({faNum(p.reviews)})</span>
                    </div>
                    <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
                      <span className={`text-[14.5px] font-semibold ${MONO}`}>{faNum(p.price)}</span>
                      {p.old && <span className={`text-[11.5px] text-[#8A8474] line-through ${MONO}`}>{faNum(p.old)}</span>}
                      <span className="text-[10.5px] text-[#8A8474]">تومان</span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {visible.length === 0 && (
            <div className="rounded-2xl border border-[#E7E2D6] bg-white px-6 py-14 text-center text-[13.5px] text-[#8A8474]">
              محصولی با این فیلترها پیدا نشد.
              <button onClick={clearFilters} className="mr-2 font-semibold text-[#14532D] hover:opacity-70">پاک کردن فیلترها</button>
            </div>
          )}

          {visible.length > 0 && (
            <div className="mt-9 flex justify-center gap-2">
              {['۱', '۲', '۳', '‹'].map((label, i) => (
                <button
                  key={i}
                  onClick={() => i < 3 && setPage(i + 1)}
                  className={`${LQ} flex h-9 w-9 items-center justify-center rounded-xl text-[13px] ${
                    page === i + 1
                      ? `${LQ_FELT_ON} font-bold`
                      : `${LQ_NEUTRAL} text-[#5B564B]`
                  } ${MONO}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ═══ FOOTER — کارت اختصاصی فروشگاه (سبک sellers/2) ═══ */}
      <footer className="px-4 pb-8 pt-2 sm:px-6">
        <div className="mx-auto max-w-[1240px] overflow-hidden rounded-2xl border border-[#E8E3D6] bg-[#FAFAF7] shadow-[0_4px_20px_rgba(28,27,23,0.05)]">
          <div className="grid grid-cols-1 gap-x-8 gap-y-9 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-4">

            {/* برند */}
            <div>
              <div className="flex items-center gap-2.5 text-[16px] font-bold">
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_32%_30%,#2b2b2b,#0a0a0a_70%)]">
                  <span className="flex h-[13px] w-[13px] items-center justify-center rounded-full bg-white text-[8px] font-bold text-[#111]">۸</span>
                </span>
                {store.brand}
              </div>
              <p className="mt-3 max-w-[240px] text-[12.5px] leading-relaxed text-[#5B564B]">
                فروشگاه تخصصی تجهیزات بیلیارد — عرضه‌ی مستقیم چوب، میز، توپ و لوازم جانبی حرفه‌ای.
              </p>
            </div>

            {/* دسته‌بندی‌ها — روی موبایل حذف */}
            <div className="hidden sm:block">
              <h4 className="mb-4 text-[10.5px] font-bold tracking-[0.08em] text-[#A69F8E]">دسته‌بندی‌ها</h4>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px] text-[#5B564B]">
                {BAZAAR_CATS.slice(0, 8).map(c => (
                  <li key={c.id}>
                    <button
                      onClick={() => { setNavCat(c.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      className="py-0.5 transition-colors hover:text-[#14532D]"
                    >
                      {c.label}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => { setNavCat('all'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    className="py-0.5 font-medium text-[#14532D] transition-opacity hover:opacity-70"
                  >
                    مشاهده همه ←
                  </button>
                </li>
              </ul>
            </div>

            {/* راه‌های ارتباطی */}
            <div>
              <h4 className="mb-4 text-[10.5px] font-bold tracking-[0.08em] text-[#A69F8E]">راه‌های ارتباطی</h4>
              <ul className="space-y-3 text-[13px] text-[#5B564B]">
                <li className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                  {store.phones.map(ph => (
                    <a key={ph} href={`tel:${ph.replace(/-/g, '')}`} className={`flex items-center gap-2 py-0.5 transition-colors hover:text-[#14532D] ${MONO}`}>
                      <span className="text-[#14532D]">{Icon.phone}</span>{toFa(ph)}
                    </a>
                  ))}
                </li>
                <li className="flex items-center gap-2.5 py-0.5">
                  <span className="text-[#14532D]">{Icon.clock}</span>{store.hours}
                </li>
                {/* آیکون‌های شبکه اجتماعی — مثل فوتر اصلی سایت (مربع گرد خنثی، هاور طلایی) */}
                <li className="flex items-center gap-2.5 pt-3">
                  <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="واتساپ"
                    className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-[#E7E2D6] bg-[rgba(26,25,23,0.05)] text-[#8A8474] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C7A66A]/45 hover:bg-[#C7A66A]/[0.12] hover:text-[#C7A66A]">
                    {Icon.wa}
                  </a>
                  <a href={`https://instagram.com/${store.instagram}`} target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام"
                    className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-[#E7E2D6] bg-[rgba(26,25,23,0.05)] text-[#8A8474] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C7A66A]/45 hover:bg-[#C7A66A]/[0.12] hover:text-[#C7A66A]">
                    {Icon.insta}
                  </a>
                </li>
              </ul>
            </div>

            {/* موقعیت فروشگاه */}
            <div>
              <h4 className="mb-4 text-[10.5px] font-bold tracking-[0.08em] text-[#A69F8E]">موقعیت فروشگاه</h4>
              <p className="mb-3 flex items-start gap-2 text-[13px] leading-relaxed text-[#5B564B]">
                <span className="mt-0.5 shrink-0 text-[#14532D]">{Icon.pin}</span>
                {store.address}
              </p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(store.address)}`}
                target="_blank" rel="noopener noreferrer"
                className="group relative block h-28 overflow-hidden rounded-xl border border-[#E8E3D6] bg-[#F4F1EA]"
                aria-label="مشاهده روی نقشه"
              >
                <svg viewBox="0 0 300 120" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                  {[0,1,2,3].map(i => <line key={`h${i}`} x1="0" y1={i * 40} x2="300" y2={i * 40} stroke="#1C1B17" strokeWidth="0.5" opacity="0.07"/>)}
                  {[0,1,2,3,4,5,6].map(i => <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="120" stroke="#1C1B17" strokeWidth="0.5" opacity="0.07"/>)}
                  <line x1="0" y1="82" x2="300" y2="82" stroke="#1C1B17" strokeWidth="2" opacity="0.08"/>
                  <line x1="105" y1="0" x2="105" y2="120" stroke="#1C1B17" strokeWidth="2" opacity="0.08"/>
                </svg>
                <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-[70%] items-center justify-center rounded-full bg-[#14532D] text-white shadow-md transition-transform group-hover:scale-110">
                  {Icon.pin}
                </span>
                <span className="absolute bottom-2 right-2 rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-[#14532D] shadow-sm">
                  مشاهده روی نقشه
                </span>
              </a>
            </div>
          </div>

          {/* نوار پایین */}
          <div className="border-t border-[#E8E3D6] px-6 py-4 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-[#8A8474]">
              <span>© {toFa(1405)} {store.brand} — تمام حقوق محفوظ است</span>
              <Link href="/" className="transition-colors hover:opacity-80">قدرت‌گرفته از بیلیارد <span className="font-bold text-[#C7A66A]">هاب</span></Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ شیت فیلتر موبایل ═══ */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 min-[861px]:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)}/>
          <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-2xl bg-white px-5 pb-6 pt-4">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#E7E2D6]"/>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[15px] font-bold">فیلترها</h3>
              <button aria-label="بستن" onClick={() => setSheetOpen(false)} className={`${LQI} flex h-9 w-9 items-center justify-center rounded-xl text-[#5B564B]`}>
                {Icon.close}
              </button>
            </div>
            {FilterPanel}
            <button
              onClick={() => setSheetOpen(false)}
              className={`${LQ} ${LQ_FELT_ON} mt-2 w-full rounded-2xl py-3 text-[13.5px] font-bold`}
            >
              مشاهده {faNum(visible.length)} محصول
            </button>
          </div>
        </div>
      )}

      {/* ═══ استوری فروشگاه (مثل صفحه‌ی باشگاه) ═══ */}
      {storyOpen && (
        <ClubStoryModal
          club={{ name: store.brand, storyMediaUrl: store.storyImage, storyText: store.storyText, badge: 'فروشگاه' }}
          onClose={() => setStoryOpen(false)}
        />
      )}
    </div>
  )
}

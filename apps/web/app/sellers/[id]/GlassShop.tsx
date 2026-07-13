'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { faNum, MONO, toggleSet, Icon, SHEEN } from './shared'
import ClubStoryModal from '../../../components/ClubStoryModal'

/*
  نسخه‌ی شیشه‌ای (Liquid Glass) — کپی دقیق procue-shop-reference.html
  ساختار، متن‌ها و منطق JS مرجع عیناً؛ فقط کلاس‌های بصری طبق مقادیر مشخص‌شده.
*/

/* کلاس‌های دقیق مشخص‌شده */
const CARD  = "backdrop-blur-xl bg-white/35 border border-white/50 rounded-3xl shadow-[0_8px_32px_rgba(31,41,55,0.12)] relative before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/70 before:rounded-t-3xl"
const BTN   = `${SHEEN} backdrop-blur-[40px] backdrop-saturate-[2.4] bg-white/50 border border-white/80 rounded-2xl shadow-[inset_0_1.5px_0_rgba(255,255,255,0.95),0_8px_32px_rgba(31,41,55,0.10)] hover:bg-white/75 hover:-translate-y-0.5 hover:shadow-[inset_0_1.5px_0_rgba(255,255,255,1),0_14px_40px_rgba(31,41,55,0.16)] active:scale-95 transition-all duration-300`

type CatKey = 'table' | 'cue' | 'chalk' | 'access'
interface RefProduct {
  id: string; cat: CatKey; price: number; rating: number
  catLabel: string; name: string; stars: string; ratingLabel: string
  priceLabel: string; oldLabel?: string; badge?: string
  thumb: 'felt' | 'wood' | 'chalk'
  pid: number   // → /shop/{pid} جزئیات محصول
}

/* محصولات — عیناً از فایل مرجع */
const PRODUCTS: RefProduct[] = [
  { id: 'c1', pid: 1, cat: 'cue',    price: 4200000,  rating: 4.8, catLabel: 'چوب بیلیارد', name: 'چوب کربنی پروکیو سری X',      stars: '★★★★★', ratingLabel: '۴.۸ (۱۲۴)', priceLabel: '۴,۲۰۰,۰۰۰', oldLabel: '۴,۹۰۰,۰۰۰', badge: '۱۵٪ تخفیف', thumb: 'wood'  },
  { id: 'c2', pid: 2, cat: 'table',  price: 89000000, rating: 5.0, catLabel: 'میز بیلیارد', name: 'میز بیلیارد استاندارد جهانی',  stars: '★★★★★', ratingLabel: '۵.۰ (۳۸)',                    priceLabel: '۸۹,۰۰۰,۰۰۰',                                              thumb: 'felt'  },
  { id: 'c3', pid: 4, cat: 'chalk',  price: 180000,   rating: 4.6, catLabel: 'گچ و پودر',   name: 'گچ مسترز آبی (بسته ۱۲ عددی)', stars: '★★★★★', ratingLabel: '۴.۶ (۲۱۰)',                   priceLabel: '۱۸۰,۰۰۰',                                                 thumb: 'chalk' },
  { id: 'c4', pid: 3, cat: 'access', price: 3900000,  rating: 4.7, catLabel: 'اکسسوری',     name: 'ست کامل توپ اسنوکر رسمی',     stars: '★★★★★', ratingLabel: '۴.۷ (۶۶)',                    priceLabel: '۳,۹۰۰,۰۰۰',                        badge: 'جدید',          thumb: 'wood'  },
  { id: 'c5', pid: 7, cat: 'cue',    price: 2100000,  rating: 4.4, catLabel: 'چوب بیلیارد', name: 'چوب چوبی کلاسیک ویکتوری',     stars: '★★★★★', ratingLabel: '۴.۴ (۹۰)',                    priceLabel: '۲,۱۰۰,۰۰۰',                                               thumb: 'felt'  },
  { id: 'c6', pid: 6, cat: 'access', price: 650000,   rating: 4.5, catLabel: 'اکسسوری',     name: 'کاور محافظ چوب بیلیارد',      stars: '★★★★★', ratingLabel: '۴.۵ (۴۴)',                    priceLabel: '۶۵۰,۰۰۰',                                                 thumb: 'chalk' },
]

const THUMB_BG: Record<RefProduct['thumb'], string> = {
  felt:  'bg-[radial-gradient(circle_at_32%_28%,#2E8A62,#0E3B2A_75%)]',
  wood:  'bg-[radial-gradient(circle_at_32%_28%,#a97a4a,#5c3a20_75%)]',
  chalk: 'bg-[radial-gradient(circle_at_32%_28%,#4a7ecf,#1e3f7a_75%)]',
}

const NAV: { k: 'all' | CatKey; l: string }[] = [
  { k: 'all',    l: 'همه محصولات' },
  { k: 'table',  l: 'میز بیلیارد' },
  { k: 'cue',    l: 'چوب و اسنوکر' },
  { k: 'chalk',  l: 'گچ و پودر' },
  { k: 'access', l: 'اکسسوری' },
]

export default function GlassShop() {
  /* منطق عیناً از مرجع: فیلتر دسته (نو + چک‌باکس)، مرتب‌سازی، تماس، علاقه‌مندی */
  const [navCat, setNavCat]       = useState<'all' | CatKey>('all')
  const [checked, setChecked]     = useState<Set<CatKey>>(new Set())
  const [sort, setSort]           = useState<'popular' | 'price-asc' | 'price-desc' | 'rating'>('popular')
  const [countLabel, setCountLabel] = useState('۹۶ محصول')
  const [wish, setWish] = useState<Set<string>>(new Set())
  const [priceFrom, setPriceFrom] = useState('')
  const [priceTo, setPriceTo]     = useState('')
  const [storyOpen, setStoryOpen] = useState(false)
  const router = useRouter()

  const visible = useMemo(() => {
    const list = PRODUCTS.filter(p => {
      if (checked.size > 0) return checked.has(p.cat)
      if (navCat !== 'all') return p.cat === navCat
      return true
    })
    const sorted = [...list]
    if (sort === 'price-asc')  sorted.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price)
    if (sort === 'rating')     sorted.sort((a, b) => b.rating - a.rating)
    return sorted
  }, [navCat, checked, sort])

  /* مثل مرجع: شمارنده بعد از هر تعامل فیلتر آپدیت می‌شود */
  const syncCount = (list: RefProduct[]) => setCountLabel(`${faNum(list.length)} محصول`)

  const clickNav = (k: 'all' | CatKey) => {
    setNavCat(k)
    const next = k === 'all' ? new Set<CatKey>() : new Set<CatKey>([k])
    setChecked(next)
    syncCount(PRODUCTS.filter(p => (k === 'all' ? true : p.cat === k)))
  }

  const clickCheckbox = (k: CatKey) => {
    const next = toggleSet(checked, k)
    setChecked(next)
    syncCount(PRODUCTS.filter(p => (next.size === 0 ? true : next.has(p.cat))))
  }

  const clearFilters = () => {
    setChecked(new Set()); setNavCat('all'); setPriceFrom(''); setPriceTo('')
    syncCount(PRODUCTS)
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-emerald-100 font-[Vazirmatn,Tahoma,sans-serif] text-[#1C1B17]">

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-2.5 px-4 py-3.5 sm:px-6">
          <div className="flex shrink-0 items-center gap-2.5 text-[17px] font-bold text-[#14532D]">
            <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_32%_30%,#2b2b2b,#0a0a0a_70%)]">
              <span className="flex h-[13px] w-[13px] items-center justify-center rounded-full bg-white text-[8px] font-bold text-[#111]">۸</span>
            </span>
            پروکیو
          </div>

          <div className="relative order-last w-full sm:order-none sm:w-auto sm:max-w-[520px] sm:flex-1">
            <input
              type="text"
              placeholder="جستجوی محصول، مثلا چوب کربنی..."
              className="w-full rounded-2xl border border-white/60 bg-white/50 px-4 py-2.5 pl-11 text-[13.5px] text-[#1C1B17] backdrop-blur-md placeholder:text-[#8A8474] focus:border-[#14532D]/50 focus:outline-none focus:ring-2 focus:ring-[#14532D]/20"
            />
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8474]">{Icon.search}</span>
          </div>
        </div>

      </header>

      {/* ── breadcrumb ── */}
      <div className="mx-auto max-w-[1240px] px-4 pt-[18px] text-[13px] text-[#8A8474] sm:px-6">
        <a href="#" className="transition-colors hover:text-[#14532D]">خانه</a>
        <span className="mx-1.5">/</span>
        <a href="#" className="transition-colors hover:text-[#14532D]">فروشگاه</a>
        <span className="mx-1.5">/</span>
        <span>همه محصولات</span>
      </div>

      {/* ═══ کارت درباره فروشگاه ═══ */}
      <div className="mx-auto mt-4 max-w-[1240px] px-4 sm:px-6">
        <div className={`${CARD} flex flex-wrap items-start gap-5 p-5 sm:gap-6 sm:p-6`}>
          {/* لوگوی دایره‌ای با حلقه‌ی استوری */}
          <button
            type="button" onClick={() => setStoryOpen(true)} aria-label="مشاهده استوری فروشگاه"
            className="shrink-0 rounded-full p-[3px] transition-transform duration-200 hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)', boxShadow: '0 0 14px rgba(214,41,118,0.35)' }}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-[2.5px] border-white bg-gradient-to-bl from-[#14532D] to-[#1E6B3C] text-xl font-bold text-white">
              پک
            </span>
          </button>

          <div className="min-w-[220px] flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[17px] font-bold">پروکیو | تجهیزات حرفه‌ای بیلیارد</h2>
              <span className="rounded-full border border-white/60 bg-white/50 px-2.5 py-1 text-[11px] font-semibold text-[#14532D] backdrop-blur-md">
                فروشگاه تایید شده
              </span>
            </div>
            <div className="mt-1 text-[12.5px] text-[#8A8474]">
              <span className="text-[#D9A441]">★★★★★</span> ۴.۸ از ۳۱۲ نظر · عضو از ۱۴۰۲
            </div>

            <div className="mt-3.5 flex flex-wrap gap-2.5">
              <a
                href="https://wa.me/989121234567" target="_blank" rel="noopener noreferrer"
                className={`${SHEEN} flex items-center gap-2 rounded-2xl border border-[#25D366]/45 bg-[#25D366]/[0.18] px-4 py-2.5 text-[13px] font-semibold text-[#0E7A38] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.8),0_8px_28px_rgba(37,211,102,0.20)] backdrop-blur-[40px] backdrop-saturate-[2.4] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#25D366]/[0.28] active:scale-95`}
              >
                {Icon.wa} واتساپ
              </a>
              <a href="tel:09121234567" className={`${BTN} flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-[#14532D]`}>
                {Icon.phone} تماس
              </a>
              <a
                href="https://instagram.com/procue.ir" target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام"
                className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-[0_4px_12px_rgba(214,41,118,0.35)] transition-transform duration-200 hover:scale-105 active:scale-95"
                style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' }}
              >
                {Icon.insta}
              </a>
            </div>

          </div>
        </div>
      </div>

      {/* ═══ LAYOUT ═══ */}
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-8 px-4 pb-20 pt-5 sm:px-6 min-[861px]:grid-cols-[236px_1fr]">

        {/* سایدبار فیلتر */}
        <aside className="sticky top-[88px] hidden flex-col gap-3 self-start min-[861px]:flex">
          <div className={`${CARD} px-5 py-5`}>
            <h4 className="mb-3.5 text-[13.5px] font-semibold">دسته‌بندی</h4>
            {([
              { k: 'table',  l: 'میز بیلیارد',          c: '۱۸' },
              { k: 'cue',    l: 'چوب بیلیارد و اسنوکر', c: '۴۲' },
              { k: 'chalk',  l: 'گچ و پودر',            c: '۱۲' },
              { k: 'access', l: 'اکسسوری و یدکی',       c: '۲۴' },
            ] as { k: CatKey; l: string; c: string }[]).map(row => (
              <label key={row.k} className="mb-2.5 flex cursor-pointer items-center gap-2.5 text-[13.5px] text-[#5B564B]">
                <input
                  type="checkbox"
                  checked={checked.has(row.k)}
                  onChange={() => clickCheckbox(row.k)}
                  className="h-[15px] w-[15px] accent-[#14532D]"
                />
                {row.l}
                <span className={`mr-auto text-[12px] text-[#8A8474] ${MONO}`}>{row.c}</span>
              </label>
            ))}
          </div>

          <div className={`${CARD} px-5 py-5`}>
            <h4 className="mb-3.5 text-[13.5px] font-semibold">محدوده قیمت (تومان)</h4>
            <div className="flex gap-2">
              <input
                value={priceFrom} onChange={e => setPriceFrom(e.target.value)} placeholder="از"
                className={`w-full rounded-xl border border-white/60 bg-white/50 px-2.5 py-2 text-[13px] backdrop-blur-md focus:border-[#14532D]/50 focus:outline-none ${MONO}`}
              />
              <input
                value={priceTo} onChange={e => setPriceTo(e.target.value)} placeholder="تا"
                className={`w-full rounded-xl border border-white/60 bg-white/50 px-2.5 py-2 text-[13px] backdrop-blur-md focus:border-[#14532D]/50 focus:outline-none ${MONO}`}
              />
            </div>
          </div>

          <div className={`${CARD} px-5 py-5`}>
            <h4 className="mb-3.5 text-[13.5px] font-semibold">برند</h4>
            {[{ l: 'ProCue', c: '۲۲' }, { l: 'Rasson', c: '۹' }, { l: 'Predator', c: '۱۴' }].map(b => (
              <label key={b.l} className="mb-2.5 flex cursor-pointer items-center gap-2.5 text-[13.5px] text-[#5B564B]">
                <input type="checkbox" className="h-[15px] w-[15px] accent-[#14532D]"/>
                {b.l}
                <span className={`mr-auto text-[12px] text-[#8A8474] ${MONO}`}>{b.c}</span>
              </label>
            ))}
          </div>

          <div className={`${CARD} px-5 py-5`}>
            <h4 className="mb-3.5 text-[13.5px] font-semibold">امتیاز</h4>
            {[{ l: '★★★★★ و بالاتر', c: '۳۱' }, { l: '★★★★ و بالاتر', c: '۵۸' }].map(r => (
              <label key={r.l} className="mb-2.5 flex cursor-pointer items-center gap-2.5 text-[13.5px] text-[#5B564B]">
                <input type="checkbox" className="h-[15px] w-[15px] accent-[#14532D]"/>
                <span className="text-[#D9A441]">{r.l.split(' ')[0]}</span> و بالاتر
                <span className={`mr-auto text-[12px] text-[#8A8474] ${MONO}`}>{r.c}</span>
              </label>
            ))}
            <button onClick={clearFilters} className="mt-3.5 inline-block text-[12.5px] font-medium text-[#14532D] transition-opacity hover:opacity-70">
              پاک کردن فیلترها
            </button>
          </div>
        </aside>

        {/* main */}
        <main>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <h1 className="text-xl font-bold">همه محصولات</h1>
              <span className="text-[13px] text-[#8A8474]">{countLabel}</span>
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as typeof sort)}
              className="cursor-pointer rounded-2xl border border-white/60 bg-white/50 px-3.5 py-2.5 text-[13.5px] text-[#1C1B17] shadow-md backdrop-blur-md transition-all duration-200 hover:bg-white/70 focus:outline-none"
            >
              <option value="popular">مرتب‌سازی: پرفروش‌ترین</option>
              <option value="price-asc">ارزان‌ترین</option>
              <option value="price-desc">گران‌ترین</option>
              <option value="rating">بیشترین امتیاز</option>
            </select>
          </div>

          {/* گرید محصولات */}
          <div className="grid grid-cols-2 gap-[18px] min-[701px]:grid-cols-3 max-[700px]:grid-cols-2">
            {visible.map(p => {
              const isWished = wish.has(p.id)
              return (
                <div key={p.id} onClick={() => router.push(`/shop/${p.pid}`)} className={`${CARD} group flex cursor-pointer flex-col overflow-hidden transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_16px_44px_rgba(31,41,55,0.18)]`}>
                  <div className={`relative aspect-square overflow-hidden ${THUMB_BG[p.thumb]}`}>
                    {p.badge && (
                      <span className="absolute right-2.5 top-2.5 z-10 rounded-md bg-[#B23B2E] px-2 py-1 text-[11px] font-semibold text-white">
                        {p.badge}
                      </span>
                    )}
                    <button
                      aria-label="علاقه‌مندی"
                      onClick={e => { e.stopPropagation(); setWish(prev => toggleSet(prev, p.id)) }}
                      className={`absolute left-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/50 bg-white/40 backdrop-blur-md transition-all duration-200 hover:bg-white/60 ${
                        isWished ? 'text-[#B23B2E]' : 'text-[#5B564B]'
                      }`}
                    >
                      ♥
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-3.5 pb-4">
                    <div className="text-[11.5px] text-[#8A8474]">{p.catLabel}</div>
                    <div className="text-[14.5px] font-semibold leading-relaxed">{p.name}</div>
                    <div className="flex items-center gap-1.5 text-[12px] text-[#8A8474]">
                      <span className="text-[#D9A441]">{p.stars}</span> {p.ratingLabel}
                    </div>
                    <div className="mt-auto flex items-center gap-2 pt-1">
                      <span className={`text-[15px] font-semibold ${MONO}`}>{p.priceLabel}</span>
                      {p.oldLabel && <span className={`text-[12px] text-[#8A8474] line-through ${MONO}`}>{p.oldLabel}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* pagination */}
          <div className="mt-9 flex justify-center gap-2">
            {['۱', '۲', '۳', '‹'].map((label, i) => (
              <button
                key={i}
                className={`${SHEEN} flex h-9 w-9 items-center justify-center rounded-2xl text-[13.5px] backdrop-blur-[40px] backdrop-saturate-[2.4] transition-all duration-200 active:scale-95 ${
                  i === 0
                    ? 'border border-[#14532D]/45 bg-[#14532D]/[0.20] font-bold text-[#14532D] ring-1 ring-[#14532D]/25 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.8),0_6px_18px_rgba(20,83,45,0.18)]'
                    : 'border border-white/80 bg-white/50 text-[#5B564B] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.95),0_4px_14px_rgba(31,41,55,0.08)] hover:bg-white/75'
                } ${MONO}`}
              >
                {label}
              </button>
            ))}
          </div>
        </main>
      </div>

      {/* ═══ FOOTER — سایت اختصاصی فروشگاه (تم شیشه‌ای) ═══ */}
      <footer className="px-4 pb-8 sm:px-6">
        <div className={`${CARD} mx-auto max-w-[1240px] overflow-hidden`}>
          <div className="grid grid-cols-1 gap-8 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4">

            {/* برند */}
            <div>
              <div className="flex items-center gap-2.5 text-[16px] font-bold text-[#14532D]">
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_32%_30%,#2b2b2b,#0a0a0a_70%)]">
                  <span className="flex h-[13px] w-[13px] items-center justify-center rounded-full bg-white text-[8px] font-bold text-[#111]">۸</span>
                </span>
                پروکیو
              </div>
              <p className="mt-3 max-w-[240px] text-[12.5px] leading-relaxed text-[#5B564B]">
                فروشگاه تخصصی تجهیزات بیلیارد — عرضه‌ی مستقیم چوب، میز، توپ و لوازم جانبی حرفه‌ای.
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11.5px] text-[#8A8474]">
                <span className="rounded-full border border-white/60 bg-white/50 px-2.5 py-1 font-semibold text-[#14532D] backdrop-blur-md">فروشگاه تایید شده</span>
                عضو از ۱۴۰۲
              </div>
            </div>

            {/* دسته‌بندی‌ها */}
            <div>
              <h4 className="mb-4 text-[13.5px] font-bold">دسته‌بندی‌ها</h4>
              <ul className="space-y-2.5 text-[13px] text-[#5B564B]">
                {NAV.filter(n => n.k !== 'all').map(n => (
                  <li key={n.k}>
                    <button
                      onClick={() => { clickNav(n.k); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      className="transition-colors hover:text-[#14532D]"
                    >
                      {n.l}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => { clickNav('all'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    className="font-medium text-[#14532D] transition-opacity hover:opacity-70"
                  >
                    مشاهده همه ←
                  </button>
                </li>
              </ul>
            </div>

            {/* راه‌های ارتباطی */}
            <div>
              <h4 className="mb-4 text-[13.5px] font-bold">راه‌های ارتباطی</h4>
              <ul className="space-y-2.5 text-[13px] text-[#5B564B]">
                <li>
                  <a href="tel:02188221100" className={`flex items-center gap-2 transition-colors hover:text-[#14532D] ${MONO}`}>
                    <span className="text-[#14532D]">{Icon.phone}</span>۰۲۱-۸۸۲۲۱۱۰۰
                  </a>
                </li>
                <li>
                  <a href="tel:09121234567" className={`flex items-center gap-2 transition-colors hover:text-[#14532D] ${MONO}`}>
                    <span className="text-[#14532D]">{Icon.phone}</span>۰۹۱۲-۱۲۳-۴۵۶۷
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/989121234567" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-colors hover:text-[#14532D]">
                    <span className="text-[#14532D]">{Icon.wa}</span>واتساپ فروشگاه
                  </a>
                </li>
                <li>
                  <a href="https://instagram.com/procue.ir" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-colors hover:text-[#14532D]">
                    <span className="text-[#14532D]">{Icon.insta}</span>procue.ir@
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#14532D]">{Icon.clock}</span>شنبه تا پنج‌شنبه، ۹ تا ۲۰
                </li>
              </ul>
            </div>

            {/* موقعیت فروشگاه */}
            <div>
              <h4 className="mb-4 text-[13.5px] font-bold">موقعیت فروشگاه</h4>
              <p className="mb-3 flex items-start gap-2 text-[13px] leading-relaxed text-[#5B564B]">
                <span className="mt-0.5 shrink-0 text-[#14532D]">{Icon.pin}</span>
                تهران، خیابان ولیعصر، بالاتر از پارک ملت، پلاک ۴۵
              </p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent('تهران، خیابان ولیعصر، بالاتر از پارک ملت، پلاک ۴۵')}`}
                target="_blank" rel="noopener noreferrer"
                className="group relative block h-28 overflow-hidden rounded-2xl border border-white/60 bg-white/40 backdrop-blur-md"
                aria-label="مشاهده روی نقشه"
              >
                <svg viewBox="0 0 300 120" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                  {[0,1,2,3].map(i => <line key={`h${i}`} x1="0" y1={i * 40} x2="300" y2={i * 40} stroke="#1C1B17" strokeWidth="0.5" opacity="0.08"/>)}
                  {[0,1,2,3,4,5,6].map(i => <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="120" stroke="#1C1B17" strokeWidth="0.5" opacity="0.08"/>)}
                  <line x1="0" y1="82" x2="300" y2="82" stroke="#1C1B17" strokeWidth="2" opacity="0.09"/>
                  <line x1="105" y1="0" x2="105" y2="120" stroke="#1C1B17" strokeWidth="2" opacity="0.09"/>
                </svg>
                <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-[70%] items-center justify-center rounded-full bg-[#14532D] text-white shadow-md transition-transform group-hover:scale-110">
                  {Icon.pin}
                </span>
                <span className="absolute bottom-2 right-2 rounded-lg border border-white/60 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-[#14532D] backdrop-blur-md">
                  مشاهده روی نقشه
                </span>
              </a>
            </div>
          </div>

          {/* نوار پایین */}
          <div className="border-t border-white/50 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-[#8A8474]">
              <span>© ۱۴۰۵ پروکیو — تمام حقوق محفوظ است</span>
              <a href="/" className="transition-colors hover:opacity-80">قدرت‌گرفته از بیلیارد <span className="font-bold text-[#C7A66A]">هاب</span></a>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ استوری فروشگاه (مثل صفحه‌ی باشگاه) ═══ */}
      {storyOpen && (
        <ClubStoryModal
          club={{ name: 'پروکیو', storyMediaUrl: '/images/shop/Pro_table.jpg', storyText: 'جدیدترین کالکشن چوب‌های کربنی Predator رسید — همین حالا ببینید!', badge: 'فروشگاه' }}
          onClose={() => setStoryOpen(false)}
        />
      )}
    </div>
  )
}

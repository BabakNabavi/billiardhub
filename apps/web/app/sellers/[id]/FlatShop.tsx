'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toFa, faNum, parsePrice, MONO, toggleSet, Icon, LQ, LQI, LQ_NEUTRAL, LQ_FELT_ON } from './shared'
import { productsBySeller } from '../../shop/products'
import ClubStoryModal from '../../../components/ClubStoryModal'
import { getSellerProfile, type SellerProfile } from '../../../lib/seller-store'

/*
  نسخه‌ی فلت — UX فروشگاه واقعی
  دسته‌بندی‌ها: عیناً از «بیلیارد بازار» (۱۴ دسته)
*/

/* ── گالری تصاویر فروشگاه — فقط نمایش ───────────────────────────────
   این صفحه عمومی است، پس آپلود اینجا نیست (قبلاً بود و هر بازدیدکننده‌ای
   می‌توانست عکس اضافه کند). مدیریت عکس‌ها در /dashboard/seller است. */
function StoreGallery({ shots }: { shots: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  if (shots.length === 0) return null

  return (
    <section className="mx-auto max-w-[1240px] px-4 pb-10 sm:px-6">
      <div className="rounded-2xl border border-[#E7E2D6] bg-white p-4 sm:p-6">
        <h3 className="mb-4 text-[14.5px] font-bold">گالری تصاویر فروشگاه</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 min-[1000px]:grid-cols-4">
          {shots.map((src, i) => (
            <button
              key={i} type="button" onClick={() => setLightbox(src)} aria-label={`عکس ${toFa(i + 1)}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-[#E7E2D6] bg-[#F7F5F0]"
            >
              <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"/>
            </button>
          ))}
        </div>
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)} role="presentation"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
        >
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-xl object-contain"/>
        </div>
      )}
    </section>
  )
}

/* ─── دسته‌بندی‌های بیلیارد بازار ─── */
const BAZAAR_CATS = [
  { id: 'cue',       label: 'چوب' },
  { id: 'table',     label: 'میز' },
  { id: 'ball',      label: 'توپ' },
  { id: 'tip',       label: 'تیپ' },
  { id: 'chalk',     label: 'گچ' },
  { id: 'extension', label: 'اکستنشن' },
  { id: 'cue-case',  label: 'کیس' },
  { id: 'ball-bag',  label: 'کیف توپ' },
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
  price: number; old?: number; disc: number; rating: number; reviews: number; sales: number
  badge?: { text: string; kind: 'sale' | 'new' }; img: string
}

const SELLER_ID = '1'

/* پیش‌فرض‌ها — تا وقتی صاحب فروشگاه در /dashboard/seller چیزی ذخیره نکرده،
   صفحه با همین‌ها نمایش داده می‌شود. هر فیلدِ ذخیره‌شده جای همتای خودش را می‌گیرد. */
const STORE = {
  id: SELLER_ID, brand: 'پروکیو', title: 'فروشگاه تجهیزات بیلیارد بابی', logoText: 'پک',
  city: 'تهران',
  desc: 'عرضه‌ی مستقیم چوب، میز، توپ و لوازم جانبی حرفه‌ای',
  contactPhone: '66554433',
  /* لوگوی آپلودشده‌ی فروشگاه؛ تا وقتی null است آیکون پیش‌فرض نشان داده می‌شود */
  logo: null as string | null,
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
  disc: sp.disc,
  rating: sp.rating,
  reviews: sp.reviews,
  sales: sp.sales,
  badge: sp.disc > 0 ? { text: `${toFa(sp.disc)}٪ تخفیف`, kind: 'sale' as const } : undefined,
  img: sp.img,
}))

/* بازه‌های قیمت سریع (تومان) */
type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'newest'
const SORT_OPTIONS: { k: SortKey; l: string }[] = [
  { k: 'popular',    l: 'پرفروش‌ترین' },
  { k: 'price-asc',  l: 'ارزان‌ترین' },
  { k: 'price-desc', l: 'گران‌ترین' },
  { k: 'newest',     l: 'جدیدترین' },
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
        className={`flex items-center gap-2.5 rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] px-3.5 py-2 text-[13px] font-bold text-[#9A6E38] transition hover:-translate-y-0.5 ${
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
  /* پروفایلِ ذخیره‌شده‌ی صاحب فروشگاه (از /dashboard/seller).
     بعد از mount خوانده می‌شود تا SSR و کلاینت یکی باشند. */
  const [profile, setProfile] = useState<SellerProfile | null>(null)
  useEffect(() => { setProfile(getSellerProfile(SELLER_ID)) }, [])

  /* فقط فیلدهای پرشده جای پیش‌فرض را می‌گیرند — یک فیلدِ خالی نباید صفحه را خالی کند */
  const store = useMemo(() => {
    if (!profile) return STORE
    const pick = (v: string | undefined, fallback: string) => (v && v.trim() ? v : fallback)
    const phones = profile.phones.filter(p => p.trim())
    return {
      ...STORE,
      logo:         profile.logo || null,
      title:        pick(profile.title, STORE.title),
      brand:        pick(profile.brand, STORE.brand),
      city:         pick(profile.city, STORE.city),
      desc:         pick(profile.desc, STORE.desc),
      contactPhone: pick(profile.contactPhone, STORE.contactPhone),
      address:      pick(profile.address, STORE.address),
      hours:        pick(profile.hours, STORE.hours),
      whatsapp:     pick(profile.whatsapp, STORE.whatsapp),
      instagram:    pick(profile.instagram, STORE.instagram),
      storyImage:   pick(profile.storyImage, STORE.storyImage),
      storyText:    pick(profile.storyText, STORE.storyText),
      phones:       phones.length ? phones : STORE.phones,
    }
  }, [profile])

  /* filters */
  const [checkedCats, setCheckedCats] = useState<Set<CatKey>>(new Set())
  const [priceFrom, setPriceFrom] = useState('')
  const [priceTo, setPriceTo]     = useState('')
  const [sort, setSort]           = useState<SortKey>('popular')
  const [page, setPage]           = useState(1)
  const [query, setQuery]         = useState('')
  /* مقدار اولیه ثابت است تا SSR و کلاینت یکی باشند؛ بعد از mount اصلاح می‌شود */
  const [mobile, setMobile]       = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 699px)')
    const apply = () => setMobile(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
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
    setCheckedCats(new Set()); setPriceFrom(''); setPriceTo('')
  }

  const activeFilterCount =
    checkedCats.size + (priceFrom ? 1 : 0) + (priceTo ? 1 : 0)

  const catCounts = useMemo(() => {
    const c = Object.fromEntries(BAZAAR_CATS.map(x => [x.id, 0])) as Record<CatKey, number>
    PRODUCTS.forEach(p => { c[p.cat]++ })
    return c
  }, [])

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
    /* جدیدترین: idهای بزرگ‌تر محصولات تازه‌ترند (منبع واحد بیلیارد بازار ترتیبی درج می‌شود) */
    if (sort === 'newest')     sorted.sort((a, b) => Number(b.id) - Number(a.id))
    return sorted
  }, [checkedCats, priceFrom, priceTo, query, sort])

  /* صفحه‌بندی واقعی — قبلاً دکمه‌ها تزئینی بودند و لیست هیچ‌وقت برش نمی‌خورد.
     دسکتاپ ۸ تا (۲ ردیفِ ۴تایی)، موبایل ۶ تا (۳ ردیفِ ۲تایی).
     تا وقتی همه در یک صفحه جا شوند هیچ دکمه‌ای نیست؛ بعدش به ازای هر صفحه یک عدد. */
  const perPage   = mobile ? 6 : 8
  const pageCount = Math.max(1, Math.ceil(visible.length / perPage))
  const safePage  = Math.min(page, pageCount)
  const paged     = visible.slice((safePage - 1) * perPage, safePage * perPage)

  /* اگر فیلتر باعث شد صفحه‌ی فعلی دیگر وجود نداشته باشد، برگرد به صفحه‌ی ۱ */
  useEffect(() => { if (page > pageCount) setPage(1) }, [page, pageCount])

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

      {/* بازه‌ی قیمت — فقط ورودی دستیِ از/تا (دکمه‌های بازه‌ی سریع حذف شدند) */}
      <div className="pt-5">
        <h4 className="mb-3.5 text-[13px] font-semibold">محدوده قیمت (تومان)</h4>
        <div className="flex gap-2">
          <input
            value={priceFrom} onChange={e => setPriceFrom(e.target.value)} placeholder="از"
            className={`w-full rounded-lg border border-[#E7E2D6] bg-white px-2.5 py-2 text-[12.5px] focus:border-[#14532D] focus:outline-none ${MONO}`}
          />
          <input
            value={priceTo} onChange={e => setPriceTo(e.target.value)} placeholder="تا"
            className={`w-full rounded-lg border border-[#E7E2D6] bg-white px-2.5 py-2 text-[12.5px] focus:border-[#14532D] focus:outline-none ${MONO}`}
          />
        </div>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="mt-4 inline-flex items-center rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] px-3 py-1.5 text-[12.5px] font-bold text-[#9A6E38] transition hover:-translate-y-0.5">
            پاک کردن فیلترها ({faNum(activeFilterCount)})
          </button>
        )}
      </div>
    </>
  )

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F5F0] font-[Vazirmatn,Tahoma,sans-serif] text-[#1C1B17]">

      <style>{`
        /* کارت محصول — هم‌فرمِ کارت sec1 در صفحه‌ی بیلیارد بازار.
           عرض را گرید تعیین می‌کند (برخلاف sec1 که کاروسل با عرض ثابت است)، ولی نسبت،
           سهم عکس، گردی، بوردر و فونت‌ها عیناً همان‌اند. */
        .prod-card-sec1 {
          /* ۱.۷۵ = ۱.۹۴۴ منهای ۱۰٪ */
          aspect-ratio: 1 / 1.75;
          border-radius: 10px;
          border: 1.5px solid rgba(28,28,26,0.18);
          transition: transform .22s cubic-bezier(0.22,1,0.36,1), box-shadow .22s;
        }
        .prod-card-sec1:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(28,28,26,0.12); }
        .pc-body-sec1 { padding: 21px 10px 12px; }
        /* نام محصول — حداکثر دو خط، مثل sec1 */
        .pc-name-sec1 {
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        @media(max-width:700px) {
          .prod-card-sec1 { aspect-ratio: 1 / 1.662; }  /* ۱.۸۴۷ منهای ۱۰٪ */
          .pc-body-sec1 { padding: 14px 7px 7px; }
          .pc-name-sec1 { font-size: 13.05px; line-height: 1.35; color: #666; }
        }
        /* دکمه‌ی علاقه‌مندی */
        .wish-btn { transition: transform .18s cubic-bezier(0.22,1,0.36,1), color .18s, background .18s, border-color .18s; }
        .wish-btn:hover  { transform: scale(1.08); }
        .wish-btn:active { transform: scale(0.9); }
        @media (prefers-reduced-motion: reduce) { .wish-btn { transition: none; } .wish-btn:hover, .wish-btn:active { transform: none; } }
      `}</style>

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
            <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-[2.5px] border-white bg-gradient-to-bl from-[#14532D] to-[#1E6B3C] text-white sm:h-16 sm:w-16">
              {/* لوگوی آپلودشده، وگرنه آیکون پیش‌فرضِ فروشگاه */}
              {store.logo
                ? <img src={store.logo} alt={store.title} className="h-full w-full object-cover"/>
                : Icon.storefront}
            </span>
          </button>

          <div className="min-w-[200px] flex-1">
            <h2 className="text-[15.5px] font-bold sm:text-[17px]">{store.title}</h2>
            <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-[#8A8474]">
              <span className="text-[#14532D]">{Icon.pin}</span>{store.city}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-[#5B564B]">{store.desc}</p>
            <a
              href={`tel:${store.contactPhone}`}
              className={`mt-2.5 inline-flex items-center gap-1.5 text-[13px] text-[#5B564B] transition-colors hover:text-[#14532D] ${MONO}`}
            >
              <span className="text-[#14532D]">{Icon.phone}</span>
              {toFa(store.contactPhone)}
            </a>
          </div>
        </div>

        {/* سرچ — زیر باکس فروشگاه */}
        <div className="relative mt-3">
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1) }}
            placeholder="جستجو در محصولات این فروشگاه..."
            className="w-full rounded-[10px] border border-[#E7E2D6] bg-white px-4 py-2.5 pl-11 text-[13.5px] text-[#1C1B17] placeholder:text-[#8A8474] focus:border-[#14532D] focus:outline-none"
          />
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8474]">{Icon.search}</span>
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
                className="flex items-center gap-2 rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] px-3.5 py-2 text-[13px] font-bold text-[#9A6E38] transition hover:-translate-y-0.5 min-[861px]:hidden"
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
            {paged.map(p => {
              const isWished = wish.has(p.id)
              return (
                /* کارت هم‌فرمِ sec1 (صفحه‌ی بیلیارد بازار). کلاس‌های bz-scroll-card/pc-body آنجا داخل
                   <style> همان صفحه‌اند و اینجا وجود ندارند، پس مقادیرشان اینجا بازتولید شده:
                   نسبت ۱:۱.۹۴۴ (موبایل ۱:۱.۸۴۷)، عکس ۶۰٪، radius ۱۰، بوردر ۱.۵px، فونت‌ها و ردیف قیمت. */
                <article
                  key={p.id}
                  onClick={() => router.push(`/shop/${p.id}`)}
                  className="prod-card-sec1 group flex cursor-pointer flex-col overflow-hidden bg-white"
                >
                  <div className="relative shrink-0 basis-[60%] overflow-hidden border-b-[1.5px] border-[rgba(28,28,26,0.18)] bg-[#F4F3F1]">
                    <img src={p.img} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"/>
                    {/* قلب — خطی تا وقتی انتخاب نشده، توپر بعد از انتخاب (قبلاً همیشه توپر بود و
                        فقط رنگ عوض می‌شد). شیشه‌ی مات + فشار کوچک هنگام کلیک. */}
                    <button
                      aria-label={isWished ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی'}
                      aria-pressed={isWished}
                      onClick={e => { e.stopPropagation(); setWish(prev => toggleSet(prev, p.id)) }}
                      className={`wish-btn absolute left-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md ${
                        isWished
                          ? 'border-[#B23B2E]/30 bg-white/85 text-[#B23B2E]'
                          : 'border-white/70 bg-white/55 text-[#5B564B] hover:text-[#B23B2E]'
                      }`}
                    >
                      {isWished ? Icon.heart : Icon.heartO}
                    </button>
                  </div>

                  <div className="pc-body-sec1 flex flex-1 flex-col gap-1.5">
                    <span className="pc-name-sec1 text-[14.5px] leading-[1.55] text-[#1C1C1A]">{p.name}</span>
                    <div className="mt-auto flex items-center gap-1.5">
                      {p.disc > 0 && (
                        <span dir="ltr" className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#b400ae] px-2.5 pb-0.5 pt-1 text-[16px] font-extrabold leading-none text-white ${MONO}`}>
                          ٪{toFa(p.disc)}
                        </span>
                      )}
                      <div className="ms-auto text-right">
                        {p.disc > 0 && p.old !== undefined && (
                          <div className={`-mb-[3px] mt-[3px] text-[12.3px] leading-[1.1] text-[rgba(28,28,26,0.5)] line-through tabular-nums ${MONO}`}>
                            {faNum(p.old)} <span className="inline-block text-[10.6px] font-medium no-underline">تومان</span>
                          </div>
                        )}
                        <div className={`text-[15.5px] font-bold tabular-nums text-[#1C1C1A] ${MONO}`}>{faNum(p.price)}</div>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {visible.length === 0 && (
            <div className="rounded-2xl border border-[#E7E2D6] bg-white px-6 py-14 text-center text-[13.5px] text-[#8A8474]">
              محصولی با این فیلترها پیدا نشد.
              <button onClick={clearFilters} className="mr-2 font-bold text-[#9A6E38] transition hover:opacity-70">پاک کردن فیلترها</button>
            </div>
          )}

          {/* صفحه‌بندی — فقط وقتی محصولات در یک صفحه جا نمی‌شوند */}
          {pageCount > 1 && (
            <div className="mt-9 flex justify-center gap-2">
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  aria-current={safePage === i + 1 ? 'page' : undefined}
                  className={`${LQ} flex h-9 w-9 items-center justify-center rounded-xl text-[13px] ${
                    safePage === i + 1 ? `${LQ_FELT_ON} font-bold` : `${LQ_NEUTRAL} text-[#5B564B]`
                  } ${MONO}`}
                >
                  {toFa(i + 1)}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                disabled={safePage === pageCount}
                aria-label="صفحه‌ی بعد"
                className={`${LQ} ${LQ_NEUTRAL} flex h-9 w-9 items-center justify-center rounded-xl text-[13px] text-[#5B564B] disabled:cursor-not-allowed disabled:opacity-40`}
              >
                ‹
              </button>
            </div>
          )}
        </main>
      </div>

      {/* ═══ گالری تصاویر فروشگاه — قبل از فوتر. فقط نمایش؛ آپلود در /dashboard/seller ═══ */}
      <StoreGallery shots={profile?.gallery.map(s => s.url) ?? []}/>

      {/* ═══ FOOTER — کارت اختصاصی فروشگاه (سبک sellers/2) ═══ */}
      <footer className="px-4 pb-8 pt-2 sm:px-6">
        <div className="mx-auto max-w-[1240px] overflow-hidden rounded-2xl border border-[#E8E3D6] bg-[#FAFAF7] shadow-[0_4px_20px_rgba(28,27,23,0.05)]">
          {/* موبایل: فاصله‌ی بلوک‌ها ۳۶ ⇒ ۱۸ و پدینگ ۲۴ ⇒ ۱۸، تا فوتر جمع‌تر شود. دسکتاپ دست‌نخورده. */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-[18px] p-[18px] sm:grid-cols-2 sm:gap-y-9 sm:p-8 lg:grid-cols-4">

            {/* برند */}
            <div>
              <div className="flex items-center gap-2.5 text-[16px] font-bold">
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_32%_30%,#2b2b2b,#0a0a0a_70%)]">
                  <span className="flex h-[13px] w-[13px] items-center justify-center rounded-full bg-white text-[8px] font-bold text-[#111]">۸</span>
                </span>
                {store.brand}
              </div>
              {/* همان متنی که صاحب فروشگاه در «درباره‌ی فروشگاه» می‌نویسد — منبع واحد با هدر،
                  نه یک جمله‌ی هاردکد. فقط دسکتاپ؛ در موبایل فوتر باید جمع باشد. */}
              <p className="mt-1.5 hidden max-w-[240px] text-[12.5px] leading-relaxed text-[#5B564B] sm:mt-3 sm:block">
                {store.desc}
              </p>
            </div>

            {/* دسته‌بندی‌ها — روی موبایل حذف */}
            <div className="hidden sm:block">
              <h4 className="mb-2 text-[10.5px] font-bold tracking-[0.08em] text-[#A69F8E] sm:mb-4">دسته‌بندی‌ها</h4>
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
              </ul>
            </div>

            {/* راه‌های ارتباطی */}
            <div>
              <h4 className="mb-2 text-[10.5px] font-bold tracking-[0.08em] text-[#A69F8E] sm:mb-4">راه‌های ارتباطی</h4>
              <ul className="space-y-1.5 text-[13px] text-[#5B564B] sm:space-y-3">
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
                <li className="flex items-center gap-2.5 pt-1.5 sm:pt-3">
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
              <h4 className="mb-2 text-[10.5px] font-bold tracking-[0.08em] text-[#A69F8E] sm:mb-4">موقعیت فروشگاه</h4>
              <p className="mb-1.5 flex items-start gap-2 text-[13px] leading-relaxed text-[#5B564B] sm:mb-3">
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
                <span className="absolute bottom-2 right-2 rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] px-2.5 py-1 text-[11px] font-bold text-[#9A6E38] shadow-sm transition hover:-translate-y-0.5">
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
              className="mt-2 w-full rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] py-3 text-[13.5px] font-bold text-[#9A6E38] transition hover:-translate-y-0.5"
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

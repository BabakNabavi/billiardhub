'use client'

// apps/web/app/shop/page.tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

interface Product {
  id: string
  title: string
  description: string
  price: number
  discountPrice?: number
  discountPercent?: number
  category: string
  condition: string
  city: string
  stock: number
  images: string[]
  isOfficialStore: boolean
  isDailyDeal: boolean
  isSpecialSale: boolean
  views: number
  createdAt: string
}

const CATEGORIES = [
  { value: 'all',       label: 'همه محصولات',   icon: '🎱' },
  { value: 'cue',       label: 'چوب بیلیارد',   icon: '🎯' },
  { value: 'ball',      label: 'گوی',            icon: '⚫' },
  { value: 'table',     label: 'میز',            icon: '🟩' },
  { value: 'accessory', label: 'لوازم جانبی',   icon: '🔧' },
  { value: 'clothing',  label: 'پوشاک',          icon: '👕' },
]

const SORT_OPTIONS = [
  { value: 'newest',    label: 'جدیدترین' },
  { value: 'price_asc', label: 'ارزان‌ترین' },
  { value: 'price_desc',label: 'گران‌ترین' },
  { value: 'popular',   label: 'پربازدیدترین' },
]

// عکس‌های واقعی از public/images — map به دسته‌بندی
const FALLBACK_IMAGES: Record<string, string[]> = {
  cue:       ['/images/cue_billiard.jpg', '/images/cue_billiard_2.jpg', '/images/rest-pool-2.jpg'],
  ball:      ['/images/Ball-1.jpg', '/images/Ball.jpg'],
  table:     ['/images/Pro_table.jpg', '/images/Home_table.jpg', '/images/snooker-table.jpg', '/images/snooker-table-2.jpg'],
  accessory: ['/images/pool_chalk_1.jpg', '/images/pool_chalk_2.jpg', '/images/rest-pool.webp'],
  clothing:  ['/images/photo_2026-05-25_08-57-23.jpg'],
  default:   ['/images/billiadr-club-3.jpg', '/images/billiadr-club-5.jpg'],
}

function getImage(product: Product): string {
  if (product.images && product.images.length > 0) return product.images[0]
  const arr: string[] = (FALLBACK_IMAGES[product.category] ?? FALLBACK_IMAGES['default']) as string[]
  const idx = product.id.charCodeAt(0) % arr.length
  return arr[idx]
}

// برندهای محبوب بیلیارد
const BRANDS = [
  { name: 'Predator', img: '/images/cue_billiard_2.jpg' },
  { name: 'Aramith',  img: '/images/Ball-1.jpg' },
  { name: 'Riley',    img: '/images/rest-pool-2.jpg' },
  { name: 'Kamui',    img: '/images/pool_chalk_1.jpg' },
  { name: 'Olhausen', img: '/images/Pro_table.jpg' },
  { name: 'Brunswick',img: '/images/snooker-table-2.jpg' },
  { name: 'McDermott',img: '/images/cue_billiard.jpg' },
  { name: 'Mezz',     img: '/images/rest-pool.webp' },
]

function formatPrice(n: number) {
  return n.toLocaleString('fa-IR')
}

function CountdownTimer({ hours = 8, minutes = 32, seconds: initSec = 51 }) {
  const [time, setTime] = useState(hours * 3600 + minutes * 60 + initSec)
  useEffect(() => {
    const t = setInterval(() => setTime(s => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [])
  const h = Math.floor(time / 3600)
  const m = Math.floor((time % 3600) / 60)
  const s = time % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <div className="flex items-center gap-1 text-white font-mono">
      {[pad(h), pad(m), pad(s)].map((v, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="bg-black/40 rounded px-2 py-0.5 text-sm font-bold">{v}</span>
          {i < 2 && <span className="text-red-300 text-xs">:</span>}
        </span>
      ))}
    </div>
  )
}

function StarRating({ score = 4.2 }: { score?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3 h-3 ${i <= Math.round(score) ? 'text-amber-400' : 'text-zinc-700'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  )
}

function ProductCard({ product, rank }: { product: Product; rank?: number }) {
  const img = getImage(product)
  const hasDiscount = product.discountPrice && product.discountPrice < product.price
  const finalPrice = product.discountPrice || product.price
  const isOutOfStock = product.stock === 0

  return (
    <Link href={`/shop/${product.id}`} className="block group">
      <div className={`relative bg-zinc-900 border rounded-xl overflow-hidden transition-all duration-200 h-full flex flex-col
        ${isOutOfStock ? 'border-zinc-800 opacity-60' : 'border-zinc-800 hover:border-emerald-600/60 hover:shadow-lg hover:shadow-emerald-900/20'}`}>

        {/* Rank badge */}
        {rank && (
          <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-zinc-950/80 rounded-full flex items-center justify-center text-xs font-bold text-zinc-300 border border-zinc-700">
            {rank}
          </div>
        )}

        {/* Promo badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-end">
          {product.isDailyDeal && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">🔥 پیشنهاد روز</span>
          )}
          {product.isSpecialSale && (
            <span className="bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✨ فروش ویژه</span>
          )}
          {product.isOfficialStore && (
            <span className="bg-emerald-800 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-700">رسمی</span>
          )}
        </div>

        {/* Discount circle */}
        {hasDiscount && product.discountPercent && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-red-500 text-white text-[11px] font-bold w-9 h-9 rounded-full flex items-center justify-center leading-none">
              {product.discountPercent}٪
            </div>
          </div>
        )}

        {/* Image */}
        <div className="relative aspect-square bg-zinc-800 overflow-hidden">
          <img src={img} alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-3.jpg' }}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white text-sm font-bold border border-white/60 px-3 py-1 rounded-lg">ناموجود</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-1.5 flex-1">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide">
            {CATEGORIES.find(c => c.value === product.category)?.label} · {product.condition === 'new' ? 'نو' : 'دست دوم'}
          </p>
          <h3 className="text-sm font-medium text-zinc-100 leading-snug line-clamp-2 flex-1">{product.title}</h3>
          <StarRating score={4.2} />
          <div className="mt-auto pt-2 border-t border-zinc-800">
            {hasDiscount ? (
              <>
                <p className="text-xs text-zinc-500 line-through leading-none">{formatPrice(product.price)} تومان</p>
                <p className="text-emerald-400 font-bold text-[15px]">{formatPrice(finalPrice)} <span className="text-xs font-normal text-zinc-400">تومان</span></p>
              </>
            ) : (
              <p className="text-emerald-400 font-bold text-[15px]">{formatPrice(finalPrice)} <span className="text-xs font-normal text-zinc-400">تومان</span></p>
            )}
            <p className="text-[10px] text-zinc-600 mt-0.5">📍 {product.city}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-zinc-800" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-zinc-800 rounded w-1/3" />
        <div className="h-4 bg-zinc-800 rounded" />
        <div className="h-4 bg-zinc-800 rounded w-2/3" />
        <div className="h-5 bg-zinc-800 rounded w-1/2 mt-2" />
      </div>
    </div>
  )
}

// ── شگفت‌انگیز Section — liquid ────────────────────────────
function ShgeftAngiSection({ products }: { products: Product[] }) {
  const deals = products.filter(p => p.isDailyDeal || p.isSpecialSale || (p.discountPercent && p.discountPercent >= 10))
  if (deals.length === 0) return null
  return (
    <div className="mb-8 rounded-3xl overflow-hidden border border-red-900/30 relative"
      style={{ background: 'linear-gradient(135deg, #1a0a0a 0%, #0f0a0a 100%)' }}>
      {/* liquid blobs */}
      <div className="absolute top-0 right-0 w-80 h-32 opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #ef4444 0%, transparent 70%)', filter: 'blur(30px)' }} />
      <div className="absolute bottom-0 left-0 w-48 h-24 opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #f97316 0%, transparent 70%)', filter: 'blur(25px)' }} />

      {/* Header */}
      <div className="relative px-5 py-4 flex items-center justify-between border-b border-red-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl animate-pulse"
            style={{ background: 'linear-gradient(135deg, #dc2626, #ea580c)', boxShadow: '0 0 25px rgba(220,38,38,0.5)' }}>
            🔥
          </div>
          <div>
            <p className="font-bold text-white text-lg">پیشنهاد شگفت‌انگیز</p>
            <p className="text-red-300/70 text-xs">تخفیف‌های استثنایی — فقط تا:</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CountdownTimer hours={8} minutes={32} seconds={51} />
          <Link href="/shop?sort=price_desc"
            className="text-xs font-bold px-4 py-1.5 rounded-xl transition-all duration-200 hover:scale-105 border border-red-500/50 text-red-400 hover:bg-red-500/10">
            مشاهده همه ›
          </Link>
        </div>
      </div>

      {/* Products */}
      <div className="relative p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {deals.slice(0, 6).map(p => {
          const img = getImage(p)
          const finalPrice = p.discountPrice || p.price
          return (
            <Link key={p.id} href={`/shop/${p.id}`}
              className="group relative rounded-2xl overflow-hidden border border-zinc-800/50 hover:border-red-500/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-red-900/20"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)' }}>
              <div className="relative aspect-square overflow-hidden">
                <img src={img} alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-3.jpg' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {p.discountPercent ? (
                  <div className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #dc2626, #ea580c)', boxShadow: '0 0 10px rgba(220,38,38,0.6)' }}>
                    {p.discountPercent}٪
                  </div>
                ) : null}
              </div>
              <div className="p-2.5">
                <p className="text-xs text-zinc-300 line-clamp-2 leading-snug mb-1.5">{p.title}</p>
                {p.discountPrice && <p className="text-[10px] text-zinc-600 line-through leading-none">{formatPrice(p.price)} ت</p>}
                <p className="text-emerald-400 font-bold text-sm leading-none">{formatPrice(finalPrice)} <span className="text-zinc-500 text-[10px] font-normal">تومان</span></p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ── تبلیغ عریض ─────────────────────────────────────────────
function AdBanner() {
  return (
    <div className="relative rounded-2xl overflow-hidden h-28 mb-8 group cursor-pointer border border-amber-900/30"
      style={{ backdropFilter: 'blur(12px)' }}>
      <img src="/images/snooker-table.jpg" alt="تبلیغ"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-50" />
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(245,158,11,0.15) 100%)' }} />
      <div className="absolute inset-0 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl"
            style={{ backdropFilter: 'blur(8px)' }}>
            📢
          </div>
          <div>
            <p className="text-amber-400 text-xs font-semibold tracking-widest uppercase mb-0.5">فضای تبلیغاتی</p>
            <p className="text-white font-bold text-lg leading-tight">آگهی کسب‌وکار خود را اینجا ثبت کنید</p>
            <p className="text-zinc-400 text-xs mt-0.5">به هزاران بازیکن بیلیارد دسترسی پیدا کنید</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-left">
            <p className="text-zinc-400 text-xs">هزینه از</p>
            <p className="text-amber-400 font-bold text-lg">۵۰۰,۰۰۰ <span className="text-xs font-normal text-zinc-500">تومان</span></p>
          </div>
          <button className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 flex-shrink-0">
            تماس بگیرید
          </button>
        </div>
      </div>
      <div className="absolute top-3 right-3 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
        آگهی
      </div>
    </div>
  )
}

// ── محبوب‌ترین برندها — liquid modern ──────────────────────
function BrandsSection() {
  return (
    <div className="mb-8 relative rounded-3xl overflow-hidden border border-zinc-700/50"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #111827 40%, #0a1628 100%)' }}>
      {/* liquid blob bg */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="relative p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, #10b981, #6366f1)', boxShadow: '0 0 20px rgba(16,185,129,0.3)' }}>
              ⭐
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">محبوب‌ترین برندها</h2>
              <p className="text-zinc-500 text-xs">برندهای برتر بیلیارد جهان</p>
            </div>
          </div>
          <Link href="/shop" className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors">
            مشاهده همه ›
          </Link>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {BRANDS.map((brand, i) => (
            <Link key={brand.name} href={`/shop?search=${brand.name}`}
              className="flex flex-col items-center gap-2 group">
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-zinc-700/50 group-hover:border-emerald-500/60 transition-all duration-300 group-hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)' }}>
                <img src={brand.img} alt={brand.name}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300 group-hover:scale-110 transition-transform"
                  onError={e => { (e.target as HTMLImageElement).src = '/images/pool_chalk_1.jpg' }} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(99,102,241,0.15))' }} />
                {/* glow on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ boxShadow: 'inset 0 0 20px rgba(16,185,129,0.2)' }} />
              </div>
              <p className="text-[11px] text-zinc-500 group-hover:text-emerald-400 transition-colors duration-200 font-medium text-center leading-tight">
                {brand.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── پرفروش‌ترین‌ها — liquid ────────────────────────────────
function BestSellersSection({ products }: { products: Product[] }) {
  const best = [...products].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6)
  if (best.length === 0) return null
  return (
    <div className="mb-8 relative rounded-3xl border border-zinc-700/40 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1117 50%, #0a0f1e 100%)' }}>
      {/* blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #f59e0b 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="relative p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', boxShadow: '0 0 20px rgba(245,158,11,0.35)' }}>
              🏆
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">پرفروش‌ترین‌ها</h2>
              <p className="text-zinc-500 text-xs">محبوب‌ترین محصولات بازیکنان</p>
            </div>
          </div>
          <Link href="/shop?sort=popular" className="text-amber-400 text-sm hover:text-amber-300 transition-colors">مشاهده همه ›</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {best.map((p, i) => <ProductCard key={p.id} product={p} rank={i + 1} />)}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────
export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid')
  const searchRef = useRef<HTMLInputElement>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ category, sort, page: String(page), limit: '16' })
      if (search) params.set('search', search)
      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'خطا')
      setProducts(data.products); setTotal(data.total); setTotalPages(data.totalPages)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [category, sort, search, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { setPage(1) }, [category, sort, search])

  const isFiltered = search || category !== 'all'

  return (
    <div className="min-h-screen bg-zinc-950 text-white" dir="rtl">

      {/* Hero */}
      <div className="bg-gradient-to-l from-emerald-950 via-zinc-900 to-zinc-950 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">بیلیارد بازار</h1>
            <p className="text-zinc-400 text-sm mt-0.5">بزرگ‌ترین مارکت‌پلیس تجهیزات بیلیارد ایران</p>
          </div>
          <Link href="/shop/new" className="flex-shrink-0 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
            + ثبت آگهی رایگان
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Search */}
        <form onSubmit={e => { e.preventDefault(); setSearch(searchInput) }} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input ref={searchRef} type="text" value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="جستجو در بیلیارد بازار... (مثلاً: Predator، گوی آمریکایی)"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pr-10 pl-10 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
            />
            {searchInput && (
              <button type="button" onClick={() => { setSearchInput(''); setSearch('') }}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 rounded-xl text-sm font-medium transition-colors">
            جستجو
          </button>
        </form>

        {/* ── گرید اصلی ─────────────────────────────── */}
        <div className="flex gap-6">

          {/* Sidebar */}
          <aside className="hidden lg:block w-52 flex-shrink-0">
            <div className="sticky top-4 space-y-3">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">دسته‌بندی</p>
                </div>
                {CATEGORIES.map(cat => (
                  <button key={cat.value} onClick={() => setCategory(cat.value)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-right transition-colors
                      ${category === cat.value
                        ? 'bg-emerald-900/40 text-emerald-400 font-medium border-r-2 border-emerald-500'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}>
                    <span>{cat.icon}</span>{cat.label}
                  </button>
                ))}
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">مرتب‌سازی</p>
                </div>
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setSort(opt.value)}
                    className={`w-full flex items-center px-4 py-2.5 text-sm text-right transition-colors
                      ${sort === opt.value
                        ? 'bg-emerald-900/40 text-emerald-400 font-medium border-r-2 border-emerald-500'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* بنر تبلیغاتی سایدبار */}
              <div className="relative rounded-xl overflow-hidden h-40 cursor-pointer group border border-zinc-800">
                <img src="/images/billiadr-club-5.jpg" alt="تبلیغ" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                <div className="absolute inset-0 bg-black/60"/>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
                  <div className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">آگهی</div>
                  <p className="text-white text-xs font-bold">فضای تبلیغاتی</p>
                  <p className="text-zinc-400 text-[10px] mt-1">برای رزرو تماس بگیرید</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {/* Mobile categories */}
              <div className="flex gap-1.5 lg:hidden overflow-x-auto pb-1 flex-1">
                {CATEGORIES.map(cat => (
                  <button key={cat.value} onClick={() => setCategory(cat.value)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                      ${category === cat.value ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>

              <p className="hidden lg:block text-sm text-zinc-500 mr-auto">
                {loading ? '...' : <><span className="text-white font-medium">{total.toLocaleString('fa-IR')}</span> محصول</>}
              </p>

              <div className="flex items-center gap-2 mr-auto lg:mr-0">
                <select value={sort} onChange={e => setSort(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500">
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="flex border border-zinc-700 rounded-lg overflow-hidden">
                  <button onClick={() => setViewMode('grid')}
                    className={`px-2.5 py-1.5 transition-colors ${viewMode==='grid' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M1 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zM1 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zM1 12a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z"/>
                    </svg>
                  </button>
                  <button onClick={() => setViewMode('list')}
                    className={`px-2.5 py-1.5 transition-colors ${viewMode==='list' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                      <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {search && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-zinc-400">نتایج جستجو:</span>
                <span className="bg-emerald-900/40 text-emerald-400 border border-emerald-800 text-sm px-3 py-0.5 rounded-full flex items-center gap-1">
                  {search}
                  <button onClick={() => { setSearch(''); setSearchInput('') }} className="mr-1">×</button>
                </span>
              </div>
            )}

            {error && (
              <div className="bg-red-950 border border-red-800 rounded-xl p-4 mb-4 text-red-300 text-sm">{error}</div>
            )}

            {/* عنوان بخش */}
            {isFiltered && (
              <h2 className="text-lg font-bold text-white mb-4">
                {category !== 'all' ? CATEGORIES.find(c => c.value === category)?.label : 'همه محصولات'}
                {search && ` — "${search}"`}
              </h2>
            )}
            {!isFiltered && (
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">همه محصولات</h2>
                <p className="text-sm text-zinc-500">
                  {!loading && <><span className="text-white font-medium">{total.toLocaleString('fa-IR')}</span> محصول</>}
                </p>
              </div>
            )}

            {loading ? (
              <div className={`grid gap-3 ${viewMode==='grid' ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                {Array.from({length:8}).map((_,i) => <SkeletonCard key={i}/>)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24 text-zinc-600">
                <p className="text-5xl mb-4">🎱</p>
                <p className="text-lg text-zinc-400">محصولی پیدا نشد</p>
                <p className="text-sm mt-1">دسته‌بندی دیگری را امتحان کنید</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {products.map(p => <ProductCard key={p.id} product={p}/>)}
              </div>
            ) : (
              <div className="space-y-2">
                {products.map(p => {
                  const img = getImage(p)
                  const finalPrice = p.discountPrice || p.price
                  return (
                    <Link key={p.id} href={`/shop/${p.id}`}>
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex gap-4 hover:border-emerald-700/50 transition-colors">
                        <div className="w-20 h-20 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={img} alt={p.title} className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-3.jpg' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-500 mb-1">{CATEGORIES.find(c=>c.value===p.category)?.label} · {p.condition==='new'?'نو':'دست دوم'}</p>
                          <h3 className="text-sm font-medium text-zinc-100 line-clamp-1 mb-1">{p.title}</h3>
                          <StarRating score={4.2}/>
                        </div>
                        <div className="text-left flex-shrink-0">
                          {p.discountPrice && p.discountPrice < p.price && <p className="text-xs text-zinc-500 line-through">{formatPrice(p.price)}</p>}
                          <p className="text-emerald-400 font-bold text-sm">{formatPrice(finalPrice)} تومان</p>
                          <p className="text-xs text-zinc-600 mt-1">📍 {p.city}</p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1 mt-8">
                <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}
                  className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-400 text-sm hover:border-zinc-500 disabled:opacity-30 transition-colors">
                  ‹ قبلی
                </button>
                {Array.from({length:totalPages},(_,i)=>i+1)
                  .filter(p=>Math.abs(p-page)<=2||p===1||p===totalPages)
                  .reduce<(number|'...')[]>((acc,p,i,arr)=>{
                    if(i>0&&(p as number)-(arr[i-1] as number)>1) acc.push('...')
                    acc.push(p); return acc
                  },[])
                  .map((p,i) => p==='...'
                    ? <span key={`d${i}`} className="px-2 text-zinc-600">...</span>
                    : <button key={p} onClick={()=>setPage(p as number)}
                        className={`w-9 h-9 rounded-lg text-sm transition-all ${p===page?'bg-emerald-500 text-black font-bold':'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
                        {(p as number).toLocaleString('fa-IR')}
                      </button>
                  )}
                <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                  className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-400 text-sm hover:border-zinc-500 disabled:opacity-30 transition-colors">
                  بعدی ›
                </button>
              </div>
            )}
          </main>
        </div>

        {/* sections ویژه — فقط وقتی فیلتر نشده */}
        {!isFiltered && !loading && (
          <div className="mt-10 space-y-0">
            <ShgeftAngiSection products={products} />
            <AdBanner />
            <BestSellersSection products={products} />
            <BrandsSection />
          </div>
        )}

      </div>
    </div>
  )
}

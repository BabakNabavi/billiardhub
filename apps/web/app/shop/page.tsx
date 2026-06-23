'use client'

// apps/web/app/shop/page.tsx
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────
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
  isFeatured: boolean
  isOfficialStore: boolean
  views: number
  createdAt: string
}

const CATEGORIES = [
  { value: 'all', label: 'همه' },
  { value: 'cue', label: 'چوب بیلیارد' },
  { value: 'ball', label: 'توپ' },
  { value: 'table', label: 'میز' },
  { value: 'accessory', label: 'لوازم جانبی' },
  { value: 'clothing', label: 'اکسسوری' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'جدیدترین' },
  { value: 'price_asc', label: 'ارزان‌ترین' },
  { value: 'price_desc', label: 'گران‌ترین' },
  { value: 'popular', label: 'محبوب‌ترین' },
]

// ─── Helpers ─────────────────────────────────────────────
function formatPrice(n: number) {
  return n.toLocaleString('fa-IR') + ' تومان'
}

// ─── ProductCard ─────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  const mainImage = product.images?.[0] || null
  const finalPrice = product.discountPrice || product.price

  return (
    <Link href={`/shop/${product.id}`}>
      <div className="dark-card group cursor-pointer hover:border-emerald-500/60 transition-all duration-200">
        {/* Image */}
        <div className="relative w-full aspect-square bg-zinc-800 rounded-lg overflow-hidden mb-3">
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Badges */}
          {product.discountPercent && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {product.discountPercent}٪
            </span>
          )}
          {product.isOfficialStore && (
            <span className="absolute top-2 left-2 bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full">
              فروشگاه رسمی
            </span>
          )}
        </div>

        {/* Info */}
        <div className="space-y-1.5">
          <p className="text-sm text-zinc-400 capitalize">{product.category}</p>
          <h3 className="font-semibold text-white line-clamp-2 leading-snug">{product.title}</h3>
          <p className="text-xs text-zinc-500">{product.city} · {product.condition === 'new' ? 'نو' : 'دست دوم'}</p>

          <div className="pt-1">
            {product.discountPrice ? (
              <div>
                <span className="text-xs text-zinc-500 line-through ml-2">{formatPrice(product.price)}</span>
                <span className="text-emerald-400 font-bold">{formatPrice(finalPrice)}</span>
              </div>
            ) : (
              <span className="text-emerald-400 font-bold">{formatPrice(product.price)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Main Page ────────────────────────────────────────────
export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        category,
        sort,
        page: String(page),
        limit: '12',
      })
      if (search) params.set('search', search)

      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'خطا در دریافت محصولات')

      setProducts(data.products)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [category, sort, search, page])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [category, sort, search])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">فروشگاه</h1>
            <p className="text-zinc-400 mt-1">
              {loading ? '...' : `${total.toLocaleString('fa-IR')} محصول`}
            </p>
          </div>
          <Link href="/shop/new" className="neon-btn text-sm">
            + ثبت محصول
          </Link>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6 flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="جستجوی محصول..."
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
          />
          <button type="submit" className="neon-btn px-5">جستجو</button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput('') }}
              className="ghost-btn px-4"
            >
              ✕
            </button>
          )}
        </form>

        {/* Filters row */}
        <div className="flex flex-wrap gap-3 mb-8">
          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  category === cat.value
                    ? 'bg-emerald-500 text-black'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="mr-auto bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-red-300">
            {error}
          </div>
        )}

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="dark-card animate-pulse">
                <div className="aspect-square bg-zinc-800 rounded-lg mb-3" />
                <div className="h-3 bg-zinc-800 rounded w-1/3 mb-2" />
                <div className="h-4 bg-zinc-800 rounded w-2/3 mb-2" />
                <div className="h-4 bg-zinc-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-4xl mb-4">🎱</p>
            <p className="text-lg">محصولی پیدا نشد</p>
            {search && <p className="text-sm mt-2">جستجوی دیگری امتحان کنید</p>}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="ghost-btn px-4 py-2 disabled:opacity-30"
            >
              قبلی
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - page) <= 2)
              .map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                    p === page
                      ? 'bg-emerald-500 text-black'
                      : 'ghost-btn'
                  }`}
                >
                  {p.toLocaleString('fa-IR')}
                </button>
              ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="ghost-btn px-4 py-2 disabled:opacity-30"
            >
              بعدی
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

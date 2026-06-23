'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────
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
  isVerified: boolean
  views: number
  createdAt: string
}

// ─── Constants ────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'all',         label: 'همه',          icon: 'ti-ball-billiard' },
  { value: 'cue',         label: 'چوب بیلیارد',  icon: 'ti-tournament' },
  { value: 'ball',        label: 'گوی',          icon: 'ti-circle' },
  { value: 'table',       label: 'میز',          icon: 'ti-layout-board' },
  { value: 'accessory',   label: 'لوازم جانبی',  icon: 'ti-tool' },
  { value: 'clothing',    label: 'پوشاک',        icon: 'ti-shirt' },
  { value: 'educational', label: 'آموزشی',       icon: 'ti-book' },
  { value: 'other',       label: 'سایر',         icon: 'ti-dots' },
]

const SORT_OPTIONS = [
  { value: 'newest',     label: 'جدیدترین',      icon: 'ti-clock' },
  { value: 'price_asc',  label: 'ارزان‌ترین',    icon: 'ti-arrow-up' },
  { value: 'price_desc', label: 'گران‌ترین',     icon: 'ti-arrow-down' },
  { value: 'popular',    label: 'پربازدیدترین',  icon: 'ti-trending-up' },
]

const FALLBACK_IMAGES: Record<string, string[]> = {
  cue:       ['/images/cue_billiard.jpg', '/images/cue_billiard_2.jpg'],
  ball:      ['/images/Ball-1.jpg', '/images/Ball.jpg'],
  table:     ['/images/Pro_table.jpg', '/images/snooker-table.jpg'],
  accessory: ['/images/pool_chalk_1.jpg', '/images/rest-pool.webp'],
  clothing:  ['/images/photo_2026-05-25_08-57-23.jpg'],
  default:   ['/images/billiadr-club-3.jpg'],
}

// ─── Helpers ──────────────────────────────────────────────────
function toFa(v: string | number) {
  return String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
}

function fmt(n: number) {
  return Number(n).toLocaleString('fa-IR')
}

function hexToRgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${a})`
}

function getImage(p: Product): string {
  if (p.images?.length > 0) return p.images[0]!
  const arr = FALLBACK_IMAGES[p.category] ?? FALLBACK_IMAGES['default']!
  return arr[p.id.charCodeAt(0) % arr.length]!
}

// ─── Countdown ────────────────────────────────────────────────
function CountdownTimer({ totalSeconds = 8 * 3600 + 32 * 60 + 51 }) {
  const [rem, setRem] = useState(totalSeconds)
  useEffect(() => {
    const t = setInterval(() => setRem(s => s > 0 ? s - 1 : 0), 1000)
    return () => clearInterval(t)
  }, [])
  const h = Math.floor(rem / 3600)
  const m = Math.floor((rem % 3600) / 60)
  const s = rem % 60
  const pad = (n: number) => toFa(String(n).padStart(2, '0'))

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {[{ v: pad(h), l: 'ساعت' }, { v: pad(m), l: 'دقیقه' }, { v: pad(s), l: 'ثانیه' }].map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{
              background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 8, padding: '5px 10px', fontSize: 18, fontWeight: 900,
              color: '#fff', minWidth: 40, textAlign: 'center', lineHeight: 1,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}>{item.v}</div>
            <span style={{ fontSize: 9, color: 'rgba(255,180,180,0.5)' }}>{item.l}</span>
          </div>
          {i < 2 && <span style={{ color: '#ef4444', fontSize: 16, fontWeight: 900, marginBottom: 14, opacity: 0.8 }}>:</span>}
        </div>
      ))}
    </div>
  )
}

// ─── Product Card ─────────────────────────────────────────────
function ProductCard({ product, rank }: { product: Product; rank?: number }) {
  const [hov, setHov] = useState(false)
  const img = getImage(product)
  const hasDisc = product.discountPrice && product.discountPrice < product.price
  const finalPrice = product.discountPrice ?? product.price
  const oos = product.stock === 0
  const catLabel = CATEGORIES.find(c => c.value === product.category)?.label ?? product.category

  return (
    <Link href={`/shop/${product.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: hov ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.025)',
          border: `1px solid ${hov ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 18, overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          transform: hov ? 'translateY(-4px)' : 'none',
          boxShadow: hov ? '0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.1)' : '0 4px 16px rgba(0,0,0,0.25)',
          height: '100%', display: 'flex', flexDirection: 'column',
          opacity: oos ? 0.55 : 1, position: 'relative',
        }}
      >
        {/* shimmer top line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg,transparent,rgba(16,185,129,0.5),transparent)',
          opacity: hov ? 1 : 0, transition: 'opacity 0.3s',
        }} />

        {/* rank badge */}
        {rank && (
          <div style={{
            position: 'absolute', top: 10, right: 10, zIndex: 10,
            width: 26, height: 26, borderRadius: '50%',
            background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(245,158,11,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 900, color: '#f59e0b',
          }}>
            {toFa(rank)}
          </div>
        )}

        {/* discount circle */}
        {hasDisc && product.discountPercent && !rank && (
          <div style={{
            position: 'absolute', top: 10, right: 10, zIndex: 10,
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg,#dc2626,#ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 900, color: '#fff',
            boxShadow: '0 4px 12px rgba(220,38,38,0.5)',
          }}>
            {toFa(product.discountPercent)}٪
          </div>
        )}

        {/* badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {product.isDailyDeal && (
            <span style={{ background: 'rgba(220,38,38,0.9)', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#fff', backdropFilter: 'blur(8px)' }}>
              🔥 پیشنهاد روز
            </span>
          )}
          {product.isVerified && (
            <span style={{ background: 'rgba(16,185,129,0.9)', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#fff', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <i className="ti ti-verified" style={{ fontSize: 10 }} />رسمی
            </span>
          )}
        </div>

        {/* image */}
        <div style={{ aspectRatio: '1', overflow: 'hidden', flexShrink: 0, position: 'relative', background: 'rgba(255,255,255,0.03)' }}>
          <img
            src={img} alt={product.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: hov ? 'scale(1.08)' : 'scale(1)' }}
            onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-3.jpg' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 50%, rgba(6,13,10,0.75) 100%)',
            opacity: hov ? 1 : 0.4, transition: 'opacity 0.3s',
          }} />
          {oos && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, border: '1px solid rgba(255,255,255,0.4)', padding: '4px 14px', borderRadius: 8 }}>ناموجود</span>
            </div>
          )}
        </div>

        {/* body */}
        <div style={{ padding: '12px 14px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', margin: 0 }}>
            {catLabel} · {product.condition === 'new' ? 'نو' : product.condition === 'like_new' ? 'مثل نو' : 'دست دوم'}
          </p>
          <h3 style={{
            fontSize: 13, fontWeight: 700, color: '#f0faf5', margin: 0, lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1,
          }}>
            {product.title}
          </h3>
          <div style={{ display: 'flex', gap: 2 }}>
            {[1,2,3,4,5].map(i => (
              <i key={i} className={`ti ti-star${i <= 4 ? '-filled' : ''}`} style={{ fontSize: 10, color: i <= 4 ? '#f59e0b' : 'rgba(255,255,255,0.1)' }} />
            ))}
          </div>
        </div>

        {/* footer */}
        <div style={{ padding: '10px 14px 14px', marginTop: 'auto' }}>
          <div style={{ height: 1, background: 'rgba(16,185,129,0.1)', marginBottom: 10 }} />
          {hasDisc && (
            <p style={{ fontSize: 11, color: 'rgba(240,250,245,0.3)', textDecoration: 'line-through', margin: '0 0 2px', lineHeight: 1 }}>
              {fmt(product.price)} تومان
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 15, fontWeight: 900, color: '#10b981', margin: 0 }}>
              {fmt(finalPrice)} <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(240,250,245,0.35)' }}>تومان</span>
            </p>
            {product.city && (
              <span style={{ fontSize: 10, color: 'rgba(240,250,245,0.3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <i className="ti ti-map-pin" style={{ fontSize: 11, color: '#10b981' }} />
                {product.city}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 18, overflow: 'hidden' }}>
      <div style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.04)' }} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '40%' }} />
        <div style={{ height: 13, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} />
        <div style={{ height: 13, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '70%' }} />
        <div style={{ height: 15, background: 'rgba(16,185,129,0.06)', borderRadius: 4, width: '50%', marginTop: 4 }} />
      </div>
    </div>
  )
}

// ─── Deal Section ─────────────────────────────────────────────
function DealSection({ products }: { products: Product[] }) {
  const deals = products.filter(p => p.isDailyDeal || p.isSpecialSale || (p.discountPercent && p.discountPercent >= 10))
  if (deals.length === 0) return null

  return (
    <div style={{
      marginBottom: 32, borderRadius: 24, overflow: 'hidden',
      border: '1px solid rgba(239,68,68,0.2)', position: 'relative',
      background: 'linear-gradient(135deg,#1a0808 0%,#0d0505 100%)',
    }}>
      <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(239,68,68,0.15) 0%,transparent 65%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(239,68,68,0.6),transparent)' }} />

      <div style={{ position: 'relative', padding: '20px 20px', borderBottom: '1px solid rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg,#dc2626,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(220,38,38,0.5)', flexShrink: 0 }}>
            <i className="ti ti-flame" style={{ fontSize: 22, color: '#fff' }} />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '0 0 3px' }}>پیشنهاد شگفت‌انگیز</p>
            <p style={{ fontSize: 11, color: 'rgba(255,150,150,0.6)', margin: 0 }}>تخفیف‌های استثنایی — فقط تا:</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <CountdownTimer />
          <Link href="/shop?sort=price_desc" style={{ fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', textDecoration: 'none', background: 'rgba(239,68,68,0.08)' }}>
            مشاهده همه
          </Link>
        </div>
      </div>

      <div style={{ position: 'relative', padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10 }}>
        {deals.slice(0, 6).map(p => {
          const img = getImage(p)
          const finalPrice = p.discountPrice ?? p.price
          return (
            <Link key={p.id} href={`/shop/${p.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative' }}>
                  <img src={img} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-3.jpg' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.6) 100%)' }} />
                  {p.discountPercent ? (
                    <div style={{ position: 'absolute', top: 7, right: 7, width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#dc2626,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff' }}>
                      {toFa(p.discountPercent)}٪
                    </div>
                  ) : null}
                </div>
                <div style={{ padding: '9px 10px 11px' }}>
                  <p style={{ fontSize: 11, color: 'rgba(240,250,245,0.7)', margin: '0 0 5px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title}</p>
                  {p.discountPrice && <p style={{ fontSize: 10, color: 'rgba(240,250,245,0.3)', textDecoration: 'line-through', margin: '0 0 2px', lineHeight: 1 }}>{fmt(p.price)} ت</p>}
                  <p style={{ fontSize: 13, fontWeight: 900, color: '#10b981', margin: 0 }}>{fmt(finalPrice)} <span style={{ fontSize: 9, color: 'rgba(240,250,245,0.35)', fontWeight: 400 }}>تومان</span></p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ─── Best Sellers ─────────────────────────────────────────────
function BestSellers({ products }: { products: Product[] }) {
  const best = [...products].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6)
  if (best.length === 0) return null

  return (
    <div style={{
      marginBottom: 32, borderRadius: 24, overflow: 'hidden',
      border: '1px solid rgba(245,158,11,0.15)', position: 'relative',
      background: 'linear-gradient(135deg,#0d0e00,#0d1117)',
    }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '50%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.5),transparent)' }} />
      <div style={{ position: 'relative', padding: '20px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 22px rgba(245,158,11,0.4)', flexShrink: 0 }}>
              <i className="ti ti-trophy" style={{ fontSize: 20, color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '0 0 2px' }}>پرفروش‌ترین‌ها</h2>
              <p style={{ fontSize: 11, color: 'rgba(240,250,245,0.35)', margin: 0 }}>محبوب‌ترین محصولات بازیکنان</p>
            </div>
          </div>
          <Link href="/shop?sort=popular" style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            مشاهده همه <i className="ti ti-chevron-left" style={{ fontSize: 14 }} />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
          {best.map((p, i) => <ProductCard key={p.id} product={p} rank={i + 1} />)}
        </div>
      </div>
    </div>
  )
}

// ─── Ad Banner ────────────────────────────────────────────────
function AdBanner() {
  return (
    <div style={{ marginBottom: 32, borderRadius: 20, overflow: 'hidden', height: 110, position: 'relative', border: '1px solid rgba(245,158,11,0.2)', cursor: 'pointer' }}>
      <img src="/images/snooker-table.jpg" alt="تبلیغ" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.3)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0.3) 60%,rgba(245,158,11,0.1) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-speakerphone" style={{ fontSize: 20, color: '#f59e0b' }} />
          </div>
          <div>
            <p style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, letterSpacing: '0.1em', margin: '0 0 3px' }}>فضای تبلیغاتی</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: '0 0 2px' }}>آگهی کسب‌وکار خود را اینجا ثبت کنید</p>
            <p style={{ fontSize: 11, color: 'rgba(240,250,245,0.4)', margin: 0 }}>به هزاران بازیکن بیلیارد دسترسی پیدا کنید</p>
          </div>
        </div>
        <button style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', fontWeight: 800, fontSize: 12, padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 18px rgba(245,158,11,0.35)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          تماس بگیرید
        </button>
      </div>
      <div style={{ position: 'absolute', top: 8, right: 12, background: '#f59e0b', color: '#000', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>آگهی</div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [category, setCategory] = useState('all')
  const [sort, setSort]         = useState('newest')
  const [search, setSearch]     = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage]         = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]       = useState(0)

  const isFiltered = category !== 'all' || search !== '' || sort !== 'newest'

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        category, sort, page: String(page), limit: '12',
        ...(search ? { search } : {}),
      })
      const res = await fetch(`/api/products?${params}`)
      const j = await res.json()
      setProducts(j.products ?? [])
      setTotalPages(j.totalPages ?? 1)
      setTotal(j.total ?? 0)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [category, sort, search, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleCategory = (v: string) => { setCategory(v); setPage(1) }
  const handleSort = (v: string) => { setSort(v); setPage(1) }

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }
        @keyframes shimmer { 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }
        ::-webkit-scrollbar { width: 4px; height: 4px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.3); border-radius: 2px }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0a0f0d', fontFamily: 'Vazirmatn, Tahoma, sans-serif', direction: 'rtl', position: 'relative' }}>

        {/* liquid orbs */}
        <div style={{ position: 'fixed', width: 500, height: 500, background: 'radial-gradient(circle,rgba(16,185,129,0.1) 0%,transparent 65%)', top: -150, right: -100, filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', width: 400, height: 400, background: 'radial-gradient(circle,rgba(16,185,129,0.06) 0%,transparent 65%)', bottom: 0, left: -80, filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '28px 16px 80px' }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: '4px 14px', fontSize: 11, color: '#10b981', marginBottom: 12 }}>
              <i className="ti ti-shopping-bag" style={{ fontSize: 13 }} />
              بیلیارد بازار
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#e2e8f0', margin: '0 0 6px', lineHeight: 1.3 }}>
                  خرید و فروش تجهیزات بیلیارد
                </h1>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  {total > 0 ? <>{toFa(total)} محصول موجود</> : 'در حال بارگذاری...'}
                </p>
              </div>
              <Link href="/shop/new" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#10b981', color: '#0a0f0d', borderRadius: 12,
                padding: '10px 20px', fontSize: 13, fontWeight: 700,
                textDecoration: 'none', boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
              }}>
                <i className="ti ti-plus" style={{ fontSize: 16 }} />
                ثبت آگهی
              </Link>
            </div>
          </div>

          {/* ── Search ── */}
          <form onSubmit={handleSearch} style={{ marginBottom: 20 }}>
            <div style={{ position: 'relative' }}>
              <i className="ti ti-search" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#475569', pointerEvents: 'none' }} />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="جستجو در محصولات..."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#111a15', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14, padding: '13px 46px 13px 100px',
                  color: '#e2e8f0', fontSize: 14, fontFamily: 'inherit',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.4)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
              <button type="submit" style={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                background: '#10b981', border: 'none', borderRadius: 10,
                padding: '7px 16px', color: '#0a0f0d', fontSize: 12, fontWeight: 700,
                fontFamily: 'inherit', cursor: 'pointer',
              }}>
                جستجو
              </button>
            </div>
          </form>

          {/* ── Category tabs ── */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => {
              const isActive = category === cat.value
              return (
                <button key={cat.value} onClick={() => handleCategory(cat.value)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 10, flexShrink: 0,
                  border: `1px solid ${isActive ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.07)'}`,
                  background: isActive ? 'rgba(16,185,129,0.12)' : '#111a15',
                  color: isActive ? '#10b981' : '#64748b',
                  fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <i className={`ti ${cat.icon}`} style={{ fontSize: 14 }} />
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* ── Sort + count ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#475569' }}>
              {search && <><span style={{ color: '#10b981' }}>«{search}»</span> — </>}
              {toFa(total)} نتیجه
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {SORT_OPTIONS.map(s => {
                const isActive = sort === s.value
                return (
                  <button key={s.value} onClick={() => handleSort(s.value)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 9,
                    border: `1px solid ${isActive ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)',
                    color: isActive ? '#10b981' : '#64748b',
                    fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    <i className={`ti ${s.icon}`} style={{ fontSize: 12 }} />
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Products grid ── */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14 }}>
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <i className="ti ti-shopping-cart-off" style={{ fontSize: 48, color: '#1e293b', display: 'block', marginBottom: 16 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#334155', margin: '0 0 8px' }}>محصولی یافت نشد</h3>
              <p style={{ fontSize: 13, color: '#475569', margin: '0 0 20px' }}>دسته‌بندی دیگری را امتحان کنید</p>
              <button onClick={() => { setCategory('all'); setSearch(''); setSearchInput('') }} style={{
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 10, padding: '10px 20px', color: '#10b981',
                fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
              }}>
                نمایش همه محصولات
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14 }}>
              {products.map((p, i) => (
                <div key={p.id} style={{ animation: `fadeUp 0.35s ease ${Math.min(i, 8) * 0.04}s both` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 32 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', opacity: page === 1 ? 0.3 : 1 }}
              >
                ‹ قبلی
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i-1] as number) > 1) acc.push('...')
                  acc.push(p); return acc
                }, [])
                .map((p, i) => p === '...'
                  ? <span key={`d${i}`} style={{ color: '#475569', padding: '0 4px' }}>...</span>
                  : <button key={p} onClick={() => setPage(p as number)} style={{
                      width: 36, height: 36, borderRadius: 9, border: 'none',
                      background: p === page ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.04)',
                      color: p === page ? '#fff' : '#64748b',
                      fontSize: 13, fontWeight: p === page ? 700 : 400,
                      cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: p === page ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
                    }}>
                      {toFa(p as number)}
                    </button>
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', opacity: page === totalPages ? 0.3 : 1 }}
              >
                بعدی ›
              </button>
            </div>
          )}

          {/* ── Special sections ── */}
          {!isFiltered && !loading && products.length > 0 && (
            <div style={{ marginTop: 48 }}>
              <DealSection products={products} />
              <AdBanner />
              <BestSellers products={products} />
            </div>
          )}

        </div>
      </div>
    </>
  )
}

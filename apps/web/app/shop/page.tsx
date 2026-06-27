'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useCartStore } from '../../store/cart.store'

interface Product {
  id: string; title: string; description: string; price: number;
  discountPrice?: number; discountPercent?: number; category: string;
  condition: string; city: string; stock: number; images: string[];
  isOfficialStore: boolean; isDailyDeal: boolean; isSpecialSale: boolean;
  isVerified: boolean; views: number; createdAt: string;
}

const GOLD       = '#B8933A'
const GOLD_DIM   = 'rgba(199,166,106,0.65)'
const GOLD_LIGHT = 'rgba(199,166,106,0.1)'
const GOLD_BOR   = 'rgba(199,166,106,0.22)'
const TEXT       = '#1C1C1A'
const TEXT_SEC   = 'rgba(28,28,26,0.5)'
const TEXT_MUT   = 'rgba(28,28,26,0.28)'
const BORDER     = 'rgba(28,28,26,0.07)'
const SURF       = 'rgba(255,255,255,0.78)'

const CATEGORIES = [
  { value: 'all',         label: 'همه محصولات', icon: 'ti-layout-grid'  },
  { value: 'cue',         label: 'چوب بیلیارد', icon: 'ti-tournament'   },
  { value: 'ball',        label: 'گوی',          icon: 'ti-circle'       },
  { value: 'table',       label: 'میز',          icon: 'ti-layout-board' },
  { value: 'accessory',   label: 'لوازم جانبی', icon: 'ti-tool'         },
  { value: 'clothing',    label: 'پوشاک',        icon: 'ti-shirt'        },
  { value: 'educational', label: 'آموزشی',       icon: 'ti-book'         },
  { value: 'other',       label: 'سایر',         icon: 'ti-dots'         },
]

const SORT_OPTIONS = [
  { value: 'newest',    label: 'جدیدترین',    icon: 'ti-clock'           },
  { value: 'price_asc', label: 'ارزان‌ترین',  icon: 'ti-sort-ascending'  },
  { value: 'price_desc',label: 'گران‌ترین',   icon: 'ti-sort-descending' },
  { value: 'popular',   label: 'پربازدیدترین',icon: 'ti-trending-up'     },
]

const FALLBACK: Record<string, string> = {
  cue: '/images/cue_billiard.jpg', ball: '/images/Ball-1.jpg',
  table: '/images/Pro_table.jpg', accessory: '/images/pool_chalk_1.jpg',
  clothing: '/images/photo_2026-05-25_08-57-23.jpg',
  educational: '/images/snooker-table.jpg', default: '/images/billiadr-club-3.jpg',
}

function toFa(v: string | number) { return String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d) }
function fmt(n: number) { return Number(n).toLocaleString('fa-IR') }
function getImg(p: Product) { return p.images?.length ? p.images[0]! : (FALLBACK[p.category] ?? FALLBACK['default']!) }

// ── Countdown ─────────────────────────────────────────────────
function Countdown({ sec = 8 * 3600 + 32 * 60 + 51 }) {
  const [rem, setRem] = useState(sec)
  useEffect(() => { const t = setInterval(() => setRem(s => Math.max(0, s - 1)), 1000); return () => clearInterval(t) }, [])
  const pad = (n: number) => toFa(String(n).padStart(2, '0'))
  const h = Math.floor(rem / 3600), m = Math.floor((rem % 3600) / 60), s = rem % 60
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {[{ v: pad(h), l: 'ساعت' }, { v: pad(m), l: 'دقیقه' }, { v: pad(s), l: 'ثانیه' }].map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ background: '#1C1C1A', borderRadius: 8, padding: '6px 11px', fontSize: 20, fontWeight: 900, color: '#fff', minWidth: 40, textAlign: 'center' }}>{item.v}</div>
            <span style={{ fontSize: 10, color: TEXT_MUT }}>{item.l}</span>
          </div>
          {i < 2 && <span style={{ color: '#C0392B', fontSize: 18, fontWeight: 900, marginBottom: 14, opacity: 0.6 }}>:</span>}
        </div>
      ))}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', backdropFilter: 'blur(16px)' }}>
      <div style={{ aspectRatio: '1', background: 'rgba(28,28,26,0.04)' }} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 10, background: 'rgba(28,28,26,0.05)', borderRadius: 6, width: '40%' }} />
        <div style={{ height: 13, background: 'rgba(28,28,26,0.05)', borderRadius: 6 }} />
        <div style={{ height: 13, background: 'rgba(28,28,26,0.05)', borderRadius: 6, width: '70%' }} />
        <div style={{ height: 18, background: GOLD_LIGHT, borderRadius: 6, width: '55%', marginTop: 6 }} />
      </div>
    </div>
  )
}

// ── Product Card ──────────────────────────────────────────────
function ProductCard({ product, rank }: { product: Product; rank?: number }) {
  const [hov, setHov] = useState(false)
  const [added, setAdded] = useState(false)
  const { addItem } = useCartStore()
  const img = getImg(product)
  const finalPrice = product.discountPrice ?? product.price
  const oos = product.stock === 0

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (oos) return
    addItem({ id: product.id, title: product.title, price: product.price, discountPrice: product.discountPrice, image: img, category: product.category, sellerId: '', city: product.city, stock: product.stock })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <Link href={`/shop/${product.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          height: '100%', display: 'flex', flexDirection: 'column',
          background: hov ? 'rgba(255,255,255,0.97)' : SURF,
          border: `1px solid ${hov ? GOLD_BOR : BORDER}`,
          borderRadius: 20, overflow: 'hidden',
          transform: hov ? 'translateY(-5px)' : 'none',
          boxShadow: hov ? `0 20px 48px rgba(28,28,26,0.12), 0 0 0 1px rgba(199,166,106,0.05)` : '0 2px 10px rgba(28,28,26,0.06)',
          transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
          opacity: oos ? 0.55 : 1, position: 'relative', backdropFilter: 'blur(20px)',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '55%', height: '1px', background: `linear-gradient(90deg,transparent,${GOLD}45,transparent)`, opacity: hov ? 1 : 0, transition: 'opacity 0.3s' }} />

        {rank && (
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: `1px solid ${GOLD_BOR}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: GOLD, backdropFilter: 'blur(8px)' }}>
            {toFa(rank)}
          </div>
        )}

        {!rank && product.discountPercent && (
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#C0392B,#922B21)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff', boxShadow: '0 4px 12px rgba(192,57,43,0.4)' }}>
            {toFa(product.discountPercent)}٪
          </div>
        )}

        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {product.isDailyDeal && (
            <span style={{ background: 'rgba(192,57,43,0.88)', borderRadius: 20, padding: '2px 9px', fontSize: 10, fontWeight: 700, color: '#fff', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <i className="ti ti-flame" style={{ fontSize: 12 }} /> پیشنهاد روز
            </span>
          )}
          {product.isVerified && (
            <span style={{ background: 'rgba(26,122,94,0.88)', borderRadius: 20, padding: '2px 9px', fontSize: 10, fontWeight: 700, color: '#fff', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <i className="ti ti-verified" style={{ fontSize: 12 }} /> رسمی
            </span>
          )}
        </div>

        <div style={{ aspectRatio: '1', overflow: 'hidden', flexShrink: 0, position: 'relative', background: 'rgba(28,28,26,0.04)' }}>
          <img src={img} alt={product.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)', transform: hov ? 'scale(1.08)' : 'scale(1)', filter: 'brightness(0.88) saturate(0.85)' }}
            onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-3.jpg' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 45%,rgba(28,28,26,0.5) 100%)', opacity: hov ? 1 : 0.35, transition: 'opacity 0.35s' }} />

          <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: hov ? 1 : 0, transform: hov ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.3s' }}>
            <button onClick={handleAdd}
              style={{ background: added ? '#1A7A5E' : GOLD, backdropFilter: 'blur(12px)', border: 'none', borderRadius: 10, padding: '7px 18px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: oos ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, transition: 'background 0.2s', boxShadow: `0 4px 16px rgba(199,166,106,0.35)` }}>
              <i className={`ti ${added ? 'ti-check' : 'ti-shopping-cart-plus'}`} style={{ fontSize: 15 }} />
              {added ? 'اضافه شد' : oos ? 'ناموجود' : 'افزودن به سبد'}
            </button>
          </div>

          {oos && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(247,247,245,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
              <span style={{ color: TEXT, fontSize: 14, fontWeight: 700, border: `1px solid ${BORDER}`, padding: '5px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.85)' }}>ناموجود</span>
            </div>
          )}
        </div>

        <div style={{ padding: '14px 15px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ fontSize: 12, color: TEXT_MUT, margin: 0 }}>
            {CATEGORIES.find(c => c.value === product.category)?.label ?? product.category}
            {' · '}{product.condition === 'new' ? 'نو' : product.condition === 'like_new' ? 'مثل نو' : 'دست دوم'}
          </p>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT, margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
            {product.title}
          </h3>
          <div style={{ display: 'flex', gap: 2 }}>
            {[1,2,3,4,5].map(i => <i key={i} className={`ti ti-star${i <= 4 ? '-filled' : ''}`} style={{ fontSize: 12, color: i <= 4 ? '#C49A3C' : 'rgba(28,28,26,0.1)' }} />)}
          </div>
        </div>

        <div style={{ padding: '10px 15px 14px', marginTop: 'auto' }}>
          <div style={{ height: 1, background: BORDER, marginBottom: 10 }} />
          {product.discountPrice && (
            <p style={{ fontSize: 12, color: TEXT_MUT, textDecoration: 'line-through', margin: '0 0 2px', lineHeight: 1 }}>
              {fmt(product.price)} تومان
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: GOLD, margin: 0 }}>
              {fmt(finalPrice)} <span style={{ fontSize: 12, fontWeight: 400, color: TEXT_MUT }}>تومان</span>
            </p>
            {product.city && (
              <span style={{ fontSize: 12, color: TEXT_MUT, display: 'flex', alignItems: 'center', gap: 3 }}>
                <i className="ti ti-map-pin" style={{ fontSize: 13, color: GOLD_DIM }} />{product.city}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function ShopPage() {
  const [products, setProducts]       = useState<Product[]>([])
  const [loading, setLoading]         = useState(true)
  const [category, setCategory]       = useState('all')
  const [sort, setSort]               = useState('newest')
  const [search, setSearch]           = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage]               = useState(1)
  const [totalPages, setTotalPages]   = useState(1)
  const [total, setTotal]             = useState(0)
  const cartCount = useCartStore(s => s.totalItems())

  const isFiltered = category !== 'all' || search !== '' || sort !== 'newest'

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ category, sort, page: String(page), limit: '12', ...(search ? { search } : {}) })
      const res = await fetch(`/api/products?${params}`)
      const j = await res.json()
      setProducts(j.products ?? [])
      setTotalPages(j.totalPages ?? 1)
      setTotal(j.total ?? 0)
    } catch { setProducts([]) }
    finally { setLoading(false) }
  }, [category, sort, search, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(searchInput); setPage(1) }
  const setCategory_ = (v: string) => { setCategory(v); setPage(1) }
  const setSort_     = (v: string) => { setSort(v); setPage(1) }

  const deals    = products.filter(p => p.isDailyDeal || p.isSpecialSale || (p.discountPercent && p.discountPercent >= 10))
  const bestSell = [...products].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 6)

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:4px; height:4px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:${GOLD_BOR}; border-radius:2px }
        .cat-pill:hover { border-color:${GOLD_BOR} !important; background:${GOLD_LIGHT} !important; color:${GOLD} !important; }
        .sort-btn:hover  { border-color:${GOLD_BOR} !important; color:${GOLD} !important; background:${GOLD_LIGHT} !important; }
        .page-btn:hover  { background:${GOLD_LIGHT} !important; border-color:${GOLD_BOR} !important; color:${GOLD} !important; }
        @media(max-width:700px)  { .prod-grid{grid-template-columns:repeat(2,1fr)!important;} }
        @media(min-width:1200px) { .prod-grid{grid-template-columns:repeat(4,1fr)!important;} }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'Vazirmatn,Tahoma,sans-serif', direction: 'rtl', color: TEXT }}>

        <div style={{ position: 'fixed', top: -120, right: -100, width: 600, height: 600, background: `radial-gradient(circle,rgba(199,166,106,0.05)0%,transparent 65%)`, filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

        {/* ════ HERO (dark cinematic) ════ */}
        <div style={{ position: 'relative', overflow: 'hidden', background: '#1C1C1A' }}>
          <img src="/images/snooker-table.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.14) saturate(0.4)', transform: 'scale(1.04)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(28,28,26,0.5)0%,rgba(28,28,26,0.97)100%)' }} />
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '50%', height: 1, background: `linear-gradient(90deg,transparent,${GOLD}50,transparent)` }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '52px 20px 48px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: GOLD_LIGHT, border: `1px solid ${GOLD_BOR}`, borderRadius: 100, padding: '6px 18px', marginBottom: 20, animation: 'fadeUp 0.6s ease both' }}>
              <i className="ti ti-shopping-bag" style={{ fontSize: 15, color: GOLD }} />
              <span style={{ fontSize: 12, color: GOLD, fontWeight: 700, letterSpacing: '0.2em' }}>BILLIARDHUB — بیلیارد بازار</span>
            </div>
            <h1 style={{ fontSize: 'clamp(31px, 5.5vw, 57px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.04em', margin: '0 0 14px', animation: 'fadeUp 0.6s ease 0.1s both' }}>
              تجهیزات حرفه‌ای بیلیارد
            </h1>
            <p style={{ fontSize: 'clamp(14px, 1.7vw, 18px)', color: 'rgba(255,255,255,0.3)', margin: '0 0 36px', lineHeight: 1.7, animation: 'fadeUp 0.6s ease 0.2s both' }}>
              {total > 0 ? <>{toFa(total)} محصول از فروشندگان معتبر سراسر ایران</> : 'بهترین برندهای جهانی بیلیارد'}
            </p>

            <form onSubmit={handleSearch} style={{ animation: 'fadeUp 0.6s ease 0.3s both' }}>
              <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
                <i className="ti ti-search" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 20, color: 'rgba(255,255,255,0.22)', pointerEvents: 'none', zIndex: 1 }} />
                <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                  placeholder="جستجو... چوب، گوی، میز بیلیارد"
                  style={{ width: '100%', background: 'rgba(0,0,0,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '14px 48px 14px 110px', color: '#fff', fontSize: 16, fontFamily: 'inherit', outline: 'none', transition: 'all 0.3s' }}
                  onFocus={e => { e.target.style.borderColor = GOLD_BOR; e.target.style.background = 'rgba(199,166,106,0.06)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.08)'; e.target.style.background = 'rgba(0,0,0,0.07)' }} />
                <button type="submit" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: `linear-gradient(135deg,${GOLD},#A07840)`, border: 'none', borderRadius: 10, padding: '8px 20px', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', boxShadow: `0 4px 16px rgba(199,166,106,0.4)` }}>
                  جستجو
                </button>
              </div>
            </form>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 32, animation: 'fadeUp 0.6s ease 0.4s both', flexWrap: 'wrap' }}>
              {[{ icon: 'ti-shield-check', label: 'ضمانت اصالت' }, { icon: 'ti-truck', label: 'ارسال سریع' }, { icon: 'ti-rotate', label: '۷ روز مرجوعی' }, { icon: 'ti-users', label: '+۱۰٬۰۰۰ خریدار' }].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'rgba(255,255,255,0.26)' }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: 16, color: GOLD_DIM }} />{s.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ════ LIGHT CONTENT ════ */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1300, margin: '0 auto', padding: '36px 20px 80px' }}>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none', marginBottom: 28 }}>
            {CATEGORIES.map(cat => {
              const active = category === cat.value
              return (
                <button key={cat.value} className="cat-pill" onClick={() => setCategory_(cat.value)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0, padding: '9px 18px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${active ? GOLD_BOR : BORDER}`, background: active ? GOLD_LIGHT : SURF, backdropFilter: 'blur(16px)', color: active ? GOLD : TEXT_SEC, fontSize: 15, fontWeight: active ? 700 : 500, transition: 'all 0.25s', boxShadow: active ? `0 0 20px rgba(199,166,106,0.1)` : '0 1px 4px rgba(28,28,26,0.05)' }}>
                  <i className={`ti ${cat.icon}`} style={{ fontSize: 17 }} />{cat.label}
                </button>
              )
            })}
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {search && <span style={{ fontSize: 15, color: TEXT_SEC }}>نتایج برای <span style={{ color: GOLD, fontWeight: 700 }}>«{search}»</span></span>}
              <span style={{ fontSize: 14, color: TEXT_MUT, background: SURF, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '4px 10px', backdropFilter: 'blur(12px)' }}>{toFa(total)} محصول</span>
              {isFiltered && (
                <button onClick={() => { setCategory('all'); setSearch(''); setSearchInput(''); setSort('newest'); setPage(1) }}
                  style={{ fontSize: 13, color: '#C0392B', background: 'rgba(192,57,43,0.07)', border: '1px solid rgba(192,57,43,0.18)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="ti ti-x" style={{ fontSize: 13 }} /> حذف فیلتر
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SORT_OPTIONS.map(s => {
                const active = sort === s.value
                return (
                  <button key={s.value} className="sort-btn" onClick={() => setSort_(s.value)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 10, border: `1px solid ${active ? GOLD_BOR : BORDER}`, background: active ? GOLD_LIGHT : SURF, backdropFilter: 'blur(16px)', color: active ? GOLD : TEXT_SEC, fontSize: 14, fontWeight: active ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(28,28,26,0.04)' }}>
                    <i className={`ti ${s.icon}`} style={{ fontSize: 15 }} />{s.label}
                  </button>
                )
              })}
              <Link href="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: cartCount > 0 ? GOLD_LIGHT : SURF, border: `1px solid ${cartCount > 0 ? GOLD_BOR : BORDER}`, color: cartCount > 0 ? GOLD : TEXT_SEC, fontSize: 14, fontWeight: 700, textDecoration: 'none', backdropFilter: 'blur(16px)' }}>
                <i className="ti ti-shopping-cart" style={{ fontSize: 16 }} />
                سبد {cartCount > 0 && <span style={{ background: `linear-gradient(135deg,${GOLD},#A07840)`, color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>{toFa(cartCount)}</span>}
              </Link>
            </div>
          </div>

          {/* ══ DEALS ══ */}
          {!isFiltered && !loading && deals.length > 0 && (
            <div style={{ marginBottom: 40, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(192,57,43,0.18)', background: '#1C1C1A', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '45%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(192,57,43,0.6),transparent)' }} />
              <div style={{ position: 'relative', padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#C0392B,#922B21)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(192,57,43,0.4)', flexShrink: 0 }}>
                    <i className="ti ti-flame" style={{ fontSize: 22, color: '#fff' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 3px' }}>پیشنهاد شگفت‌انگیز</p>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.28)', margin: 0 }}>تخفیف‌های استثنایی — فقط تا پایان امروز</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <Countdown />
                  <Link href="/shop?sort=price_desc" style={{ fontSize: 14, fontWeight: 700, padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    مشاهده همه <i className="ti ti-arrow-left" style={{ fontSize: 15 }} />
                  </Link>
                </div>
              </div>
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
                {deals.slice(0, 6).map(p => (
                  <Link key={p.id} href={`/shop/${p.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)', background: 'rgba(0,0,0,0.04)', transition: 'all 0.25s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(192,57,43,0.3)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
                      <div style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative' }}>
                        <img src={getImg(p)} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5) saturate(0.7)' }} onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-3.jpg' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.7)100%)' }} />
                        {p.discountPercent && <div style={{ position: 'absolute', top: 7, right: 7, width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#C0392B,#922B21)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff' }}>{toFa(p.discountPercent)}٪</div>}
                      </div>
                      <div style={{ padding: '9px 11px 12px' }}>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 5px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title}</p>
                        {p.discountPrice && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', textDecoration: 'line-through', margin: '0 0 2px' }}>{fmt(p.price)} ت</p>}
                        <p style={{ fontSize: 16, fontWeight: 900, color: GOLD, margin: 0 }}>{fmt(p.discountPrice ?? p.price)} <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>ت</span></p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ══ PRODUCT GRID ══ */}
          <div className="prod-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {loading
              ? Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} />)
              : products.length === 0
                ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '70px 0' }}>
                    <i className="ti ti-shopping-cart-off" style={{ fontSize: 57, color: 'rgba(28,28,26,0.1)', display: 'block', marginBottom: 16 }} />
                    <h3 style={{ fontSize: 19, fontWeight: 700, color: TEXT_SEC, margin: '0 0 8px' }}>محصولی یافت نشد</h3>
                    <p style={{ fontSize: 15, color: TEXT_MUT, margin: '0 0 20px' }}>دسته‌بندی یا عبارت دیگری را امتحان کنید</p>
                    <button onClick={() => { setCategory('all'); setSearch(''); setSearchInput(''); setSort('newest') }}
                      style={{ background: GOLD_LIGHT, border: `1px solid ${GOLD_BOR}`, borderRadius: 12, padding: '11px 22px', color: GOLD, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <i className="ti ti-refresh" style={{ fontSize: 16 }} /> نمایش همه محصولات
                    </button>
                  </div>
                )
                : products.map((p, i) => (
                  <div key={p.id} style={{ animation: `fadeUp 0.35s ease ${Math.min(i, 8) * 0.04}s both` }}>
                    <ProductCard product={p} />
                  </div>
                ))
            }
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 40 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '9px 18px', borderRadius: 11, background: SURF, border: `1px solid ${BORDER}`, color: TEXT_SEC, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', opacity: page === 1 ? 0.3 : 1, transition: 'all 0.2s', backdropFilter: 'blur(12px)' }}>
                ‹ قبلی
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...')
                  acc.push(p); return acc
                }, [])
                .map((p, i) => p === '...'
                  ? <span key={`d${i}`} style={{ color: TEXT_MUT, padding: '0 6px' }}>…</span>
                  : <button key={p} className="page-btn" onClick={() => setPage(p as number)}
                    style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${p === page ? GOLD_BOR : BORDER}`, background: p === page ? `linear-gradient(135deg,${GOLD},#A07840)` : SURF, backdropFilter: 'blur(12px)', color: p === page ? '#fff' : TEXT_SEC, fontSize: 15, fontWeight: p === page ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', boxShadow: p === page ? `0 4px 14px rgba(199,166,106,0.3)` : 'none', transition: 'all 0.2s' }}>
                    {toFa(p as number)}
                  </button>
                )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '9px 18px', borderRadius: 11, background: SURF, border: `1px solid ${BORDER}`, color: TEXT_SEC, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', opacity: page === totalPages ? 0.3 : 1, transition: 'all 0.2s', backdropFilter: 'blur(12px)' }}>
                بعدی ›
              </button>
            </div>
          )}

          {/* ══ BEST SELLERS ══ */}
          {!isFiltered && !loading && bestSell.length > 0 && (
            <div style={{ marginTop: 56, borderRadius: 24, overflow: 'hidden', border: `1px solid ${GOLD_BOR}`, background: SURF, backdropFilter: 'blur(24px)', position: 'relative', boxShadow: '0 4px 24px rgba(28,28,26,0.07)' }}>
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '40%', height: 1, background: `linear-gradient(90deg,transparent,${GOLD}50,transparent)` }} />
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 13, background: `linear-gradient(135deg,${GOLD},#A07840)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 24px rgba(199,166,106,0.28)`, flexShrink: 0 }}>
                      <i className="ti ti-trophy" style={{ fontSize: 22, color: '#fff' }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 19, fontWeight: 900, color: TEXT, margin: '0 0 2px' }}>پرفروش‌ترین‌ها</h2>
                      <p style={{ fontSize: 14, color: TEXT_MUT, margin: 0 }}>محبوب‌ترین محصولات در بین خریداران</p>
                    </div>
                  </div>
                  <Link href="/shop?sort=popular" style={{ fontSize: 14, fontWeight: 700, color: GOLD, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    مشاهده همه <i className="ti ti-arrow-left" style={{ fontSize: 15 }} />
                  </Link>
                </div>
                <div className="prod-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                  {bestSell.map((p, i) => (
                    <div key={p.id} style={{ animation: `fadeUp 0.35s ease ${i * 0.05}s both` }}>
                      <ProductCard product={p} rank={i + 1} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ AD BANNER ══ */}
          {!isFiltered && !loading && (
            <div style={{ marginTop: 32, borderRadius: 20, overflow: 'hidden', height: 110, position: 'relative', border: `1px solid ${GOLD_BOR}`, cursor: 'pointer', boxShadow: '0 4px 20px rgba(28,28,26,0.07)' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,#1C1C1A 0%,#2A2A26 100%)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: GOLD_LIGHT, border: `1px solid ${GOLD_BOR}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="ti ti-speakerphone" style={{ fontSize: 22, color: GOLD }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, color: GOLD_DIM, fontWeight: 700, margin: '0 0 3px' }}>فضای تبلیغاتی</p>
                    <p style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: '0 0 2px' }}>آگهی کسب‌وکار خود را اینجا ثبت کنید</p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.26)', margin: 0 }}>به هزاران بازیکن حرفه‌ای دسترسی پیدا کنید</p>
                  </div>
                </div>
                <button style={{ background: `linear-gradient(135deg,${GOLD},#A07840)`, color: '#fff', fontWeight: 800, fontSize: 14, padding: '10px 20px', borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 6px 20px rgba(199,166,106,0.35)`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  تماس بگیرید
                </button>
              </div>
              <div style={{ position: 'absolute', top: 8, right: 14, background: GOLD, color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>آگهی</div>
            </div>
          )}

          {/* ══ SELL CTA (dark contrast block) ══ */}
          {!isFiltered && !loading && (
            <div style={{ marginTop: 40, padding: '40px', borderRadius: 22, background: '#1C1C1A', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 300, background: `radial-gradient(ellipse,rgba(199,166,106,0.08),transparent 70%)`, pointerEvents: 'none', filter: 'blur(20px)' }} />
              <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', width: 160, height: 1, background: `linear-gradient(90deg,transparent,${GOLD}50,transparent)` }} />
              <div style={{ position: 'relative' }}>
                <p style={{ fontSize: 12, color: GOLD_DIM, letterSpacing: '0.22em', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>SELL ON BILLIARDHUB</p>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 10px' }}>می‌خواهید بفروشید؟</h2>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.28)', margin: '0 0 24px', lineHeight: 1.7 }}>آگهی رایگان ثبت کنید و به هزاران خریدار دسترسی پیدا کنید</p>
                <Link href="/shop/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(135deg,${GOLD},#A07840)`, color: '#fff', padding: '13px 28px', borderRadius: 13, textDecoration: 'none', fontWeight: 800, fontSize: 16, boxShadow: `0 8px 28px rgba(199,166,106,0.35)` }}>
                  <i className="ti ti-plus" style={{ fontSize: 19 }} /> ثبت آگهی رایگان
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

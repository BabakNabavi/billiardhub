'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '../../../store/cart.store'

// ─── Types ─────────────────────────────────────────────────────
interface Product {
  id: string
  title: string
  description: string
  price: number
  discountPrice?: number
  discountPercent?: number
  category: string
  condition: string
  status: string
  city: string
  stock: number
  images: string[]
  video?: string
  isOfficialStore: boolean
  isDailyDeal: boolean
  isSpecialSale: boolean
  views: number
  sellerId: string
  createdAt: string
}

// ─── Constants ──────────────────────────────────────────────────
const FALLBACK_IMAGES: Record<string, string[]> = {
  cue:       ['/images/cue_billiard.jpg', '/images/cue_billiard_2.jpg', '/images/rest-pool-2.jpg'],
  ball:      ['/images/Ball-1.jpg', '/images/Ball.jpg'],
  table:     ['/images/Pro_table.jpg', '/images/Home_table.jpg', '/images/snooker-table.jpg', '/images/snooker-table-2.jpg'],
  accessory: ['/images/pool_chalk_1.jpg', '/images/pool_chalk_2.jpg', '/images/rest-pool.webp'],
  clothing:  ['/images/photo_2026-05-25_08-57-23.jpg'],
  default:   ['/images/billiadr-club-3.jpg', '/images/billiadr-club-5.jpg', '/images/billiadr-club-1.jpg'],
}

const CATEGORY_LABELS: Record<string, string> = {
  cue: 'چوب بیلیارد', ball: 'گوی', table: 'میز', accessory: 'لوازم جانبی',
  clothing: 'پوشاک', educational: 'آموزشی', other: 'سایر',
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'نو', used: 'دست دوم', like_new: 'مثل نو', refurbished: 'بازسازی‌شده',
}

// ─── Helpers ────────────────────────────────────────────────────
function toFa(v: string | number) {
  return String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
}
function fmt(n: number) { return Number(n).toLocaleString('fa-IR') }

function getAllImages(product: Product): string[] {
  if (product.images?.length > 0) return product.images
  const arr = (FALLBACK_IMAGES[product.category] ?? FALLBACK_IMAGES['default'])!
  return arr.slice(0, 4)
}

// ─── Sub-components ─────────────────────────────────────────────

function StarRow({ score = 4.3, count = 128 }: { score?: number; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {[1,2,3,4,5].map(i => (
          <svg key={i} width="14" height="14" viewBox="0 0 20 20" fill={i <= Math.round(score) ? '#f59e0b' : 'rgba(0,0,0,0.08)'}>
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        ))}
      </div>
      <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 700 }}>{toFa(score.toFixed(1))}</span>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>({toFa(count)} نظر)</span>
    </div>
  )
}

function TrustBadge({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,0,0,0.04)', borderRadius: 14 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(199,166,106,0.08)', border: '1px solid rgba(199,166,106,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#111111' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: open ? 16 : 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', textAlign: 'right', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: '#111111' }}>{q}</span>
        <span style={{ fontSize: 20, color: '#C7A66A', transition: 'transform 0.3s', transform: open ? 'rotate(45deg)' : 'rotate(0)', flexShrink: 0, lineHeight: 1 }}>+</span>
      </button>
      {open && (
        <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.50)', lineHeight: 1.8, margin: '0 0 4px', paddingRight: 4 }}>{a}</p>
      )}
    </div>
  )
}

function ReviewCard({ name, score, text, date }: { name: string; score: number; text: string; date: string }) {
  return (
    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#C7A66A,#A07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 14, flexShrink: 0 }}>
            {name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111111' }}>{name}</div>
            <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="10" height="10" viewBox="0 0 20 20" fill={i <= score ? '#f59e0b' : 'rgba(0,0,0,0.08)'}>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
            </div>
          </div>
        </div>
        <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.38)' }}>{date}</span>
      </div>
      <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.50)', lineHeight: 1.75, margin: 0 }}>{text}</p>
    </div>
  )
}

// ─── Loading Skeleton ────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <div style={{ aspectRatio: '1', background: 'rgba(0,0,0,0.03)', borderRadius: 24, animation: 'pulse 2s infinite' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[40, 70, 30, 90, 50, 60].map((w, i) => (
            <div key={i} style={{ height: i === 1 ? 32 : 14, width: `${w}%`, background: 'rgba(0,0,0,0.04)', borderRadius: 8, animation: 'pulse 2s infinite' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────
export default function ProductDetailPage() {
  const params = useParams()
  const { addItem, items } = useCartStore()

  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImg, setActiveImg] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [qty, setQty] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [activeTab, setActiveTab] = useState<'specs'|'reviews'|'faq'>('specs')
  const [showContact, setShowContact] = useState(false)

  const inCart = items.some(i => i.id === String(params.id))

  useEffect(() => {
    async function load() {
      if (!params.id) return
      setLoading(true)
      try {
        const res = await fetch(`/api/products/${params.id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'محصول پیدا نشد')
        setProduct(data.product)
        const rel = await fetch(`/api/products?category=${data.product.category}&limit=8`)
        const relData = await rel.json()
        setRelated((relData.products || []).filter((p: Product) => p.id !== data.product.id).slice(0, 6))
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'خطا')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  const handleAddToCart = useCallback(() => {
    if (!product) return
    const imgs = getAllImages(product)
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      discountPrice: product.discountPrice,
      image: imgs[0] ?? '',
      category: product.category,
      sellerId: product.sellerId,
      city: product.city,
      stock: product.stock,
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2500)
  }, [product, addItem])

  if (loading) return <ProductSkeleton />

  if (error || !product) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎱</div>
        <p style={{ fontSize: 18, color: '#111111', marginBottom: 8 }}>{error || 'محصول پیدا نشد'}</p>
        <Link href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#C7A66A,#A07840)', color: '#fff', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
          بازگشت به فروشگاه
        </Link>
      </div>
    </div>
  )

  const images = getAllImages(product)
  const finalPrice = product.discountPrice ?? product.price
  const savings = product.discountPrice ? product.price - product.discountPrice : 0

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes cartBounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        :root { --gold: #C7A66A; --gold-dark: #A07840; }
        .prod-img { transition: transform 0.6s cubic-bezier(0.4,0,0.2,1); }
        .prod-img:hover { transform: scale(1.04); }
        .thumb-btn { transition: all 0.2s; }
        .thumb-btn:hover { border-color: rgba(199,166,106,0.6) !important; }
        .related-card { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .related-card:hover { transform: translateY(-4px); border-color: rgba(199,166,106,0.3) !important; box-shadow: 0 16px 40px rgba(0,0,0,0.5) !important; }
        .qty-btn { transition: all 0.2s; }
        .qty-btn:hover { background: rgba(199,166,106,0.15) !important; border-color: rgba(199,166,106,0.4) !important; }
        @media(max-width:900px){
          .prod-grid { grid-template-columns: 1fr !important; }
          .trust-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media(max-width:600px){
          .trust-grid { grid-template-columns: 1fr !important; }
          .related-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'Vazirmatn,Tahoma,sans-serif', direction: 'rtl', color: '#111111' }}>

        {/* ── ambient orbs ── */}
        <div style={{ position: 'fixed', top: -100, right: -80, width: 500, height: 500, background: 'radial-gradient(circle,rgba(199,166,106,0.07) 0%,transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', bottom: 0, left: -80, width: 400, height: 400, background: 'radial-gradient(circle,rgba(6,182,212,0.04) 0%,transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '24px 20px 80px' }}>

          {/* ── Breadcrumb ── */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(0,0,0,0.38)', marginBottom: 32, flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: 'rgba(0,0,0,0.45)', textDecoration: 'none' }}>خانه</Link>
            <i className="ti ti-chevron-left" style={{ fontSize: 12 }} />
            <Link href="/shop" style={{ color: 'rgba(0,0,0,0.45)', textDecoration: 'none' }}>فروشگاه</Link>
            <i className="ti ti-chevron-left" style={{ fontSize: 12 }} />
            <Link href={`/shop?category=${product.category}`} style={{ color: 'rgba(0,0,0,0.45)', textDecoration: 'none' }}>{CATEGORY_LABELS[product.category] ?? product.category}</Link>
            <i className="ti ti-chevron-left" style={{ fontSize: 12 }} />
            <span style={{ color: 'rgba(0,0,0,0.50)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</span>
          </nav>

          {/* ── Main Grid ── */}
          <div className="prod-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '48px', marginBottom: 64, alignItems: 'start' }}>

            {/* ── LEFT: Gallery ── */}
            <div style={{ position: 'sticky', top: 80 }}>

              {/* Main image */}
              <div
                onClick={() => setZoom(true)}
                style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,0,0,0.07)', cursor: 'zoom-in', marginBottom: 12, aspectRatio: '1' }}
              >
                <img
                  src={images[activeImg]}
                  alt={product.title}
                  className="prod-img"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-3.jpg' }}
                />
                {/* gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, rgba(2,8,6,0.4) 100%)', pointerEvents: 'none' }} />

                {/* badges */}
                {product.discountPercent && (
                  <div style={{ position: 'absolute', top: 16, right: 16, width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#dc2626,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff', boxShadow: '0 8px 24px rgba(220,38,38,0.5)' }}>
                    {toFa(product.discountPercent)}٪
                  </div>
                )}
                {product.isDailyDeal && (
                  <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(239,68,68,0.9)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#fff', backdropFilter: 'blur(8px)' }}>
                    🔥 پیشنهاد روز
                  </div>
                )}
                {product.isOfficialStore && (
                  <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(199,166,106,0.85)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#fff', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className="ti ti-verified" style={{ fontSize: 13 }} /> فروشگاه رسمی
                  </div>
                )}

                {/* zoom icon */}
                <div style={{ position: 'absolute', bottom: 16, left: 16, width: 36, height: 36, borderRadius: 10, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                  <i className="ti ti-zoom-in" style={{ fontSize: 16 }} />
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                  {images.map((img, i) => (
                    <button
                      key={i}
                      className="thumb-btn"
                      onClick={() => setActiveImg(i)}
                      style={{ flexShrink: 0, width: 72, height: 72, borderRadius: 12, overflow: 'hidden', border: `2px solid ${i === activeImg ? '#C7A66A' : 'rgba(0,0,0,0.06)'}`, background: 'rgba(255,255,255,0.02)', cursor: 'pointer', padding: 0 }}
                    >
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-3.jpg' }} />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust line under gallery */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 20, padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(0,0,0,0.04)' }}>
                {[
                  { icon: 'ti-shield-check', label: 'ضمانت اصالت' },
                  { icon: 'ti-truck', label: 'ارسال سریع' },
                  { icon: 'ti-rotate', label: '۷ روز مرجوعی' },
                  { icon: 'ti-headset', label: 'پشتیبانی ۲۴/۷' },
                ].map(b => (
                  <div key={b.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <i className={`ti ${b.icon}`} style={{ fontSize: 18, color: '#C7A66A' }} />
                    <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.45)', whiteSpace: 'nowrap' }}>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Product Info ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp 0.5s ease both' }}>

              {/* category + condition tags */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'rgba(199,166,106,0.1)', border: '1px solid rgba(199,166,106,0.25)', color: '#C7A66A' }}>
                  {CATEGORY_LABELS[product.category] ?? product.category}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: product.condition === 'new' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${product.condition === 'new' ? 'rgba(59,130,246,0.3)' : 'rgba(245,158,11,0.3)'}`, color: product.condition === 'new' ? '#60a5fa' : '#f59e0b' }}>
                  {CONDITION_LABELS[product.condition] ?? product.condition}
                </span>
                <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.07)', color: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="ti ti-map-pin" style={{ fontSize: 11, color: '#C7A66A' }} />
                  {product.city}
                </span>
              </div>

              {/* Title */}
              <h1 style={{ fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 900, color: '#111111', lineHeight: 1.4, margin: 0, letterSpacing: '-0.02em' }}>
                {product.title}
              </h1>

              {/* Stars + views */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <StarRow score={4.3} count={128} />
                <span style={{ color: 'rgba(0,0,0,0.09)' }}>|</span>
                <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="ti ti-eye" style={{ fontSize: 13 }} />
                  {toFa(product.views)} بازدید
                </span>
              </div>

              {/* Thin divider */}
              <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(199,166,106,0.2), transparent)' }} />

              {/* Price box */}
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, padding: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'radial-gradient(circle,rgba(199,166,106,0.06) 0%,transparent 70%)', pointerEvents: 'none' }} />

                {product.discountPrice ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.40)', textDecoration: 'line-through' }}>{fmt(product.price)} تومان</span>
                      <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171', borderRadius: 20, padding: '2px 8px' }}>
                        {toFa(product.discountPercent ?? 0)}٪ تخفیف
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: 'clamp(28px,3vw,38px)', fontWeight: 900, color: '#C7A66A', lineHeight: 1, textShadow: '0 0 30px rgba(199,166,106,0.3)' }}>{fmt(finalPrice)}</span>
                      <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', fontWeight: 400 }}>تومان</span>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 12, color: '#C7A66A', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(199,166,106,0.06)', borderRadius: 10, padding: '6px 12px', width: 'fit-content' }}>
                      <i className="ti ti-coin" style={{ fontSize: 14 }} />
                      سود شما: <strong>{fmt(savings)}</strong> تومان
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 'clamp(28px,3vw,38px)', fontWeight: 900, color: '#C7A66A', lineHeight: 1, textShadow: '0 0 30px rgba(199,166,106,0.3)' }}>{fmt(finalPrice)}</span>
                    <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)' }}>تومان</span>
                  </div>
                )}

                {/* Stock indicator */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {product.stock > 0 ? (
                    <>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C7A66A', boxShadow: '0 0 8px rgba(199,166,106,0.8)', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#C7A66A', fontWeight: 600 }}>
                        موجود — {toFa(product.stock)} عدد باقی‌مانده
                      </span>
                    </>
                  ) : (
                    <>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>ناموجود</span>
                    </>
                  )}
                </div>
              </div>

              {/* Quantity selector */}
              {product.stock > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>تعداد:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, overflow: 'hidden' }}>
                    <button
                      className="qty-btn"
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      style={{ width: 38, height: 38, background: 'rgba(0,0,0,0.03)', border: 'none', cursor: 'pointer', color: '#111111', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid rgba(0,0,0,0.06)' }}
                    >−</button>
                    <span style={{ minWidth: 48, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#111111' }}>{toFa(qty)}</span>
                    <button
                      className="qty-btn"
                      onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                      style={{ width: 38, height: 38, background: 'rgba(0,0,0,0.03)', border: 'none', cursor: 'pointer', color: '#111111', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(0,0,0,0.06)' }}
                    >+</button>
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.38)' }}>حداکثر {toFa(product.stock)} عدد</span>
                </div>
              )}

              {/* CTAs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {product.stock > 0 ? (
                  <>
                    <button
                      onClick={handleAddToCart}
                      style={{
                        width: '100%', padding: '15px', borderRadius: 14, border: 'none', cursor: 'pointer',
                        background: addedToCart ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#C7A66A,#A07840)',
                        color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: '0 8px 28px rgba(199,166,106,0.35)',
                        transition: 'all 0.3s',
                        animation: addedToCart ? 'cartBounce 0.4s ease' : 'none',
                      }}
                    >
                      <i className={`ti ${addedToCart ? 'ti-check' : 'ti-shopping-cart-plus'}`} style={{ fontSize: 18 }} />
                      {addedToCart ? 'به سبد اضافه شد ✓' : inCart ? 'افزودن دوباره' : 'افزودن به سبد خرید'}
                    </button>
                    <Link
                      href="/checkout"
                      onClick={handleAddToCart}
                      style={{
                        width: '100%', padding: '14px', borderRadius: 14,
                        background: 'rgba(199,166,106,0.08)', border: '1px solid rgba(199,166,106,0.25)',
                        color: '#C7A66A', fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        textDecoration: 'none', transition: 'all 0.3s', boxSizing: 'border-box',
                      }}
                    >
                      <i className="ti ti-bolt" style={{ fontSize: 16 }} />
                      خرید سریع
                    </Link>
                    <button
                      onClick={() => setShowContact(v => !v)}
                      style={{ width: '100%', padding: '12px', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.02)', color: 'rgba(0,0,0,0.50)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.3s' }}
                    >
                      <i className="ti ti-phone" style={{ fontSize: 15 }} />
                      تماس با فروشنده
                    </button>
                  </>
                ) : (
                  <button disabled style={{ width: '100%', padding: '15px', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.03)', color: 'rgba(0,0,0,0.38)', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'not-allowed' }}>
                    محصول ناموجود است
                  </button>
                )}
              </div>

              {/* Contact reveal */}
              {showContact && (
                <div style={{ background: 'rgba(199,166,106,0.05)', border: '1px solid rgba(199,166,106,0.2)', borderRadius: 14, padding: '16px', animation: 'fadeUp 0.3s ease both' }}>
                  <p style={{ fontSize: 12, color: '#C7A66A', fontWeight: 700, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="ti ti-info-circle" style={{ fontSize: 14 }} />
                    اطلاعات فروشنده
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.50)', margin: '0 0 6px' }}>شناسه فروشنده: <code style={{ color: '#111111', fontSize: 11 }}>{product.sellerId.slice(0, 8)}…</code></p>
                  <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.38)', margin: 0 }}>⚠️ قبل از واریز وجه، کالا را تحویل بگیرید.</p>
                </div>
              )}

              {/* Trust badges grid */}
              <div className="trust-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <TrustBadge icon="🛡️" title="ضمانت اصالت" sub="گارانتی کالای اصل" />
                <TrustBadge icon="🚚" title="ارسال سریع" sub="تحویل ۱ تا ۳ روزه" />
                <TrustBadge icon="↩️" title="مرجوعی آسان" sub="تا ۷ روز بدون سوال" />
                <TrustBadge icon="🔒" title="پرداخت امن" sub="درگاه معتبر بانکی" />
              </div>

              {/* Share */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
                <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.38)' }}>اشتراک‌گذاری:</span>
                {['ti-brand-instagram', 'ti-brand-telegram', 'ti-link'].map(icon => (
                  <button key={icon} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.07)', cursor: 'pointer', color: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#C7A66A'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(199,166,106,0.3)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64748b'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.07)' }}>
                    <i className={`ti ${icon}`} style={{ fontSize: 15 }} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Tabs Section ── */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 24, overflow: 'hidden', marginBottom: 64 }}>
            {/* Tab header */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.05)', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {[
                { key: 'specs', label: 'مشخصات', icon: 'ti-list' },
                { key: 'reviews', label: 'نظرات (۱۲۸)', icon: 'ti-message-circle' },
                { key: 'faq', label: 'سوالات متداول', icon: 'ti-help-circle' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  style={{
                    flex: 1, minWidth: 120, padding: '18px 20px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, whiteSpace: 'nowrap',
                    color: activeTab === tab.key ? '#C7A66A' : '#64748b',
                    borderBottom: `2px solid ${activeTab === tab.key ? '#C7A66A' : 'transparent'}`,
                    transition: 'all 0.25s',
                  }}
                >
                  <i className={`ti ${tab.icon}`} style={{ fontSize: 15 }} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '28px 28px' }}>

              {/* Specs */}
              {activeTab === 'specs' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
                  {[
                    ['دسته‌بندی', CATEGORY_LABELS[product.category] ?? product.category],
                    ['وضعیت کالا', CONDITION_LABELS[product.condition] ?? product.condition],
                    ['شهر', product.city],
                    ['موجودی', `${toFa(product.stock)} عدد`],
                    ['بازدید', toFa(product.views)],
                    ['تاریخ ثبت', new Date(product.createdAt).toLocaleDateString('fa-IR')],
                  ].map(([k, v], i) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < 5 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                      <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>{k}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111111' }}>{v}</span>
                    </div>
                  ))}
                  {product.description && (
                    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.45)', marginBottom: 10, letterSpacing: '0.1em' }}>توضیحات</p>
                      <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.50)', lineHeight: 1.9, margin: 0, whiteSpace: 'pre-line' }}>{product.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Reviews */}
              {activeTab === 'reviews' && (
                <div>
                  {/* Rating summary */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28, padding: '20px 24px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(0,0,0,0.04)', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 52, fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>{toFa('4.3')}</div>
                      <StarRow score={4.3} count={128} />
                      <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.38)', marginTop: 6 }}>از ۵ — بر اساس ۱۲۸ نظر</p>
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      {[5,4,3,2,1].map(s => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', width: 12 }}>{toFa(s)}</span>
                          <i className="ti ti-star-filled" style={{ fontSize: 11, color: '#f59e0b' }} />
                          <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: '#f59e0b', borderRadius: 3, width: `${([72,18,6,3,1][5-s] ?? 0)}%`, opacity: 0.8 }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.38)', width: 28 }}>{toFa([72,18,6,3,1][5-s] ?? 0)}٪</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { name: 'علی رضایی', score: 5, text: 'کیفیت بی‌نظیر. دقیقاً همان چیزی بود که انتظار داشتم. ارسال سریع و بسته‌بندی عالی. حتماً دوباره از این فروشگاه خرید می‌کنم.', date: '۳ تیر ۱۴۰۴' },
                      { name: 'مریم کاظمی', score: 4, text: 'محصول خوبی است. کیفیت با توصیف مطابقت دارد. تنها نکته منفی تأخیر ۱ روزه در ارسال بود.', date: '۱ تیر ۱۴۰۴' },
                      { name: 'امیر حسینی', score: 5, text: 'بهترین خریدی که تا حالا کردم. دقیقاً همانطور که توصیف شده بود و حتی بهتر. ممنون از تیم بیلیارد پلاس.', date: '۲۸ خرداد ۱۴۰۴' },
                    ].map((r, i) => <ReviewCard key={i} {...r} />)}
                  </div>

                  <button style={{ width: '100%', marginTop: 20, padding: '12px', borderRadius: 12, background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)', color: 'rgba(0,0,0,0.45)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                    مشاهده همه نظرات
                  </button>
                </div>
              )}

              {/* FAQ */}
              {activeTab === 'faq' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { q: 'آیا محصول اصل است؟', a: 'بله، تمام محصولات فروشگاه رسمی بیلیارد پلاس دارای ضمانت اصالت هستند و در صورت مشاهده هرگونه اشکال، بدون سوال مرجوع می‌شوند.' },
                    { q: 'مدت زمان ارسال چقدر است؟', a: 'برای سفارش‌های ثبت‌شده تا ساعت ۱۴، ارسال همان روز انجام می‌شود. در سایر موارد، کالا ظرف ۱ تا ۳ روز کاری تحویل داده می‌شود.' },
                    { q: 'آیا امکان مرجوع کردن وجود دارد؟', a: 'بله، تا ۷ روز پس از دریافت کالا می‌توانید بدون ذکر دلیل، کالا را مرجوع کنید. هزینه ارسال مرجوعی به عهده فروشنده است.' },
                    { q: 'پرداخت به چه صورت انجام می‌شود؟', a: 'پرداخت از طریق درگاه بانکی امن انجام می‌شود. همچنین امکان پرداخت در محل در شهرهای منتخب وجود دارد.' },
                    { q: 'آیا گارانتی دارد؟', a: 'محصولات نو دارای ۱ سال گارانتی معتبر هستند. جزئیات گارانتی در کارت گارانتی موجود در بسته‌بندی ذکر شده است.' },
                  ].map((item, i) => <FAQItem key={i} {...item} />)}
                </div>
              )}
            </div>
          </div>

          {/* ── Related Products ── */}
          {related.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                  <p style={{ fontSize: 10, color: 'rgba(199,166,106,0.7)', letterSpacing: '0.22em', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>RELATED PRODUCTS</p>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111111', margin: 0 }}>محصولات مشابه</h2>
                </div>
                <Link href={`/shop?category=${product.category}`} style={{ fontSize: 13, color: '#C7A66A', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                  مشاهده همه <i className="ti ti-arrow-left" style={{ fontSize: 14 }} />
                </Link>
              </div>

              <div className="related-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {related.slice(0, 6).map(p => {
                  const img = p.images?.[0] ?? (FALLBACK_IMAGES[p.category] ?? FALLBACK_IMAGES['default'])![0]!
                  const fp = p.discountPrice ?? p.price
                  return (
                    <Link key={p.id} href={`/shop/${p.id}`} style={{ textDecoration: 'none' }}>
                      <div className="related-card" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, overflow: 'hidden' }}>
                        <div style={{ aspectRatio: '1', overflow: 'hidden' }}>
                          <img src={img ?? ''} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                            onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.06)' }}
                            onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)' }}
                            onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-3.jpg' }} />
                        </div>
                        <div style={{ padding: '12px 14px 14px' }}>
                          <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.50)', margin: '0 0 6px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title}</p>
                          {p.discountPrice && <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.30)', textDecoration: 'line-through', margin: '0 0 2px' }}>{fmt(p.price)} ت</p>}
                          <p style={{ fontSize: 15, fontWeight: 900, color: '#C7A66A', margin: 0 }}>{fmt(fp)} <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(0,0,0,0.45)' }}>تومان</span></p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* ── Zoom modal ── */}
        {zoom && (
          <div
            onClick={() => setZoom(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', backdropFilter: 'blur(20px)' }}
          >
            <img
              src={images[activeImg]}
              alt={product.title}
              style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 16 }}
              onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-3.jpg' }}
            />
            <button onClick={() => setZoom(false)} style={{ position: 'absolute', top: 20, left: 20, width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.10)', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        )}

        {/* ── Sticky bottom bar (mobile) ── */}
        {product.stock > 0 && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(2,8,6,0.97)', borderTop: '1px solid rgba(0,0,0,0.07)', backdropFilter: 'blur(24px)', padding: '12px 20px', display: 'none' }} className="mobile-sticky-bar">
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleAddToCart} style={{ flex: 1, padding: '14px', borderRadius: 12, background: addedToCart ? '#059669' : 'linear-gradient(135deg,#C7A66A,#A07840)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>
                {addedToCart ? 'اضافه شد ✓' : 'افزودن به سبد'}
              </button>
              <Link href="/checkout" onClick={handleAddToCart} style={{ flex: 1, padding: '14px', borderRadius: 12, background: 'rgba(199,166,106,0.1)', border: '1px solid rgba(199,166,106,0.3)', color: '#C7A66A', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                خرید سریع
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

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
  sellerName?: string
  sellerPhone?: string
  sellerWhatsapp?: string
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
      <span style={{ fontSize: 15, color: '#f59e0b', fontWeight: 700 }}>{toFa(score.toFixed(1))}</span>
      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)' }}>({toFa(count)} نظر)</span>
    </div>
  )
}

function TrustBadge({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,0,0,0.04)', borderRadius: 14 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(199,166,106,0.08)', border: '1px solid rgba(199,166,106,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111111' }}>{title}</div>
        <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginTop: 1 }}>{sub}</div>
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
        <span style={{ fontSize: 16, fontWeight: 600, color: '#111111' }}>{q}</span>
        <span style={{ fontSize: 22, color: '#C7A66A', transition: 'transform 0.3s', transform: open ? 'rotate(45deg)' : 'rotate(0)', flexShrink: 0, lineHeight: 1 }}>+</span>
      </button>
      {open && (
        <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.50)', lineHeight: 1.8, margin: '0 0 4px', paddingRight: 4 }}>{a}</p>
      )}
    </div>
  )
}

function ReviewCard({ name, score, text, date }: { name: string; score: number; text: string; date: string }) {
  return (
    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#C7A66A,#A07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
            {name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111111' }}>{name}</div>
            <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="10" height="10" viewBox="0 0 20 20" fill={i <= score ? '#f59e0b' : 'rgba(0,0,0,0.08)'}>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
            </div>
          </div>
        </div>
        <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.38)' }}>{date}</span>
      </div>
      <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.50)', lineHeight: 1.75, margin: 0 }}>{text}</p>
    </div>
  )
}

// ─── Seller Card ────────────────────────────────────────────────
function SellerCard({ name, phone, whatsapp }: { name: string; phone: string; whatsapp: string }) {
  const waLink = `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('سلام، در مورد محصول شما در بیلیارد بازار سوال داشتم')}`
  const initial = name.charAt(0)
  return (
    <div style={{
      background: 'rgba(255,255,255,0.72)',
      backdropFilter: 'blur(40px) saturate(200%)',
      WebkitBackdropFilter: 'blur(40px) saturate(200%)',
      border: '1px solid rgba(199,166,106,0.30)',
      borderRadius: 20,
      padding: '20px',
      boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.9), 0 8px 32px rgba(199,166,106,0.10)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* sheen */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />

      {/* seller header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, position: 'relative', zIndex: 1 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#C7A66A,#A07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff', boxShadow: '0 4px 14px rgba(199,166,106,0.4)', flexShrink: 0 }}>
          {initial}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#111111', display: 'flex', alignItems: 'center', gap: 6 }}>
            {name}
            <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.32)', color: '#C7A66A', borderRadius: 20, padding: '2px 8px' }}>
              فروشنده
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-star-filled" style={{ fontSize: 12, color: '#f59e0b' }} />
            ۴.۸ · فروشنده معتبر
          </div>
        </div>
      </div>

      {/* phone row */}
      <a href={`tel:${phone}`} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 14px', marginBottom: 12,
        background: 'rgba(199,166,106,0.06)', border: '1px solid rgba(199,166,106,0.20)',
        borderRadius: 12, textDecoration: 'none', position: 'relative', zIndex: 1,
        transition: 'background 0.2s',
      }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(199,166,106,0.12)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(199,166,106,0.06)')}
      >
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(199,166,106,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="ti ti-phone" style={{ fontSize: 16, color: '#C7A66A' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.40)', marginBottom: 1 }}>شماره تماس</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111111', direction: 'ltr', letterSpacing: '0.04em' }}>{phone}</div>
        </div>
        <i className="ti ti-chevron-left" style={{ fontSize: 15, color: '#C7A66A' }} />
      </a>

      {/* action buttons */}
      <div style={{ display: 'flex', gap: 8, position: 'relative', zIndex: 1 }}>
        <a href={`tel:${phone}`} style={{
          flex: 1, padding: '12px 8px', borderRadius: 12,
          background: 'linear-gradient(135deg,#C7A66A,#A07840)',
          color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          boxShadow: '0 4px 16px rgba(199,166,106,0.35)',
        }}>
          <i className="ti ti-phone" style={{ fontSize: 16 }} />
          تماس با فروشنده
        </a>
        <a href={waLink} target="_blank" rel="noopener noreferrer" style={{
          flex: 1, padding: '12px 8px', borderRadius: 12,
          background: 'linear-gradient(135deg,#25D366,#128C7E)',
          color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          boxShadow: '0 4px 16px rgba(37,211,102,0.28)',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          پیام واتساپ
        </a>
      </div>
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

  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImg, setActiveImg] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [activeTab, setActiveTab] = useState<'specs'|'reviews'|'faq'>('specs')

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

  if (loading) return <ProductSkeleton />

  if (error || !product) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 70, marginBottom: 16 }}>🎱</div>
        <p style={{ fontSize: 20, color: '#111111', marginBottom: 8 }}>{error || 'محصول پیدا نشد'}</p>
        <Link href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#C7A66A,#A07840)', color: '#fff', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 16 }}>
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
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'rgba(0,0,0,0.38)', marginBottom: 32, flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: 'rgba(0,0,0,0.45)', textDecoration: 'none' }}>خانه</Link>
            <i className="ti ti-chevron-left" style={{ fontSize: 14 }} />
            <Link href="/shop" style={{ color: 'rgba(0,0,0,0.45)', textDecoration: 'none' }}>فروشگاه</Link>
            <i className="ti ti-chevron-left" style={{ fontSize: 14 }} />
            <Link href={`/shop?category=${product.category}`} style={{ color: 'rgba(0,0,0,0.45)', textDecoration: 'none' }}>{CATEGORY_LABELS[product.category] ?? product.category}</Link>
            <i className="ti ti-chevron-left" style={{ fontSize: 14 }} />
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
                  <div style={{ position: 'absolute', top: 16, right: 16, width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#dc2626,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#fff', boxShadow: '0 8px 24px rgba(220,38,38,0.5)' }}>
                    {toFa(product.discountPercent)}٪
                  </div>
                )}
                {product.isDailyDeal && (
                  <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(239,68,68,0.9)', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 700, color: '#fff', backdropFilter: 'blur(8px)' }}>
                    🔥 پیشنهاد روز
                  </div>
                )}
                {product.isOfficialStore && (
                  <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(199,166,106,0.85)', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 700, color: '#fff', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className="ti ti-verified" style={{ fontSize: 15 }} /> فروشگاه رسمی
                  </div>
                )}

                {/* zoom icon */}
                <div style={{ position: 'absolute', bottom: 16, left: 16, width: 36, height: 36, borderRadius: 10, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                  <i className="ti ti-zoom-in" style={{ fontSize: 18 }} />
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
                    <i className={`ti ${b.icon}`} style={{ fontSize: 20, color: '#C7A66A' }} />
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', whiteSpace: 'nowrap' }}>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Product Info ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp 0.5s ease both' }}>

              {/* category + condition tags */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'rgba(199,166,106,0.1)', border: '1px solid rgba(199,166,106,0.25)', color: '#C7A66A' }}>
                  {CATEGORY_LABELS[product.category] ?? product.category}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: product.condition === 'new' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${product.condition === 'new' ? 'rgba(59,130,246,0.3)' : 'rgba(245,158,11,0.3)'}`, color: product.condition === 'new' ? '#60a5fa' : '#f59e0b' }}>
                  {CONDITION_LABELS[product.condition] ?? product.condition}
                </span>
                <span style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.07)', color: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="ti ti-map-pin" style={{ fontSize: 13, color: '#C7A66A' }} />
                  {product.city}
                </span>
              </div>

              {/* Title */}
              <h1 style={{ fontSize: 'clamp(22px, 2.8vw, 31px)', fontWeight: 900, color: '#111111', lineHeight: 1.4, margin: 0, letterSpacing: '-0.02em' }}>
                {product.title}
              </h1>

              {/* Stars + views */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <StarRow score={4.3} count={128} />
                <span style={{ color: 'rgba(0,0,0,0.09)' }}>|</span>
                <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="ti ti-eye" style={{ fontSize: 15 }} />
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
                      <span style={{ fontSize: 15, color: 'rgba(0,0,0,0.40)', textDecoration: 'line-through' }}>{fmt(product.price)} تومان</span>
                      <span style={{ fontSize: 13, fontWeight: 700, background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171', borderRadius: 20, padding: '2px 8px' }}>
                        {toFa(product.discountPercent ?? 0)}٪ تخفیف
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: 'clamp(31px, 3.3vw, 42px)', fontWeight: 900, color: '#C7A66A', lineHeight: 1, textShadow: '0 0 30px rgba(199,166,106,0.3)' }}>{fmt(finalPrice)}</span>
                      <span style={{ fontSize: 16, color: 'rgba(0,0,0,0.45)', fontWeight: 400 }}>تومان</span>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 14, color: '#C7A66A', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(199,166,106,0.06)', borderRadius: 10, padding: '6px 12px', width: 'fit-content' }}>
                      <i className="ti ti-coin" style={{ fontSize: 16 }} />
                      سود شما: <strong>{fmt(savings)}</strong> تومان
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 'clamp(31px, 3.3vw, 42px)', fontWeight: 900, color: '#C7A66A', lineHeight: 1, textShadow: '0 0 30px rgba(199,166,106,0.3)' }}>{fmt(finalPrice)}</span>
                    <span style={{ fontSize: 16, color: 'rgba(0,0,0,0.45)' }}>تومان</span>
                  </div>
                )}

                {/* Stock indicator */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {product.stock > 0 ? (
                    <>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C7A66A', boxShadow: '0 0 8px rgba(199,166,106,0.8)', flexShrink: 0 }} />
                      <span style={{ fontSize: 15, color: '#C7A66A', fontWeight: 600 }}>
                        موجود — {toFa(product.stock)} عدد باقی‌مانده
                      </span>
                    </>
                  ) : (
                    <>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                      <span style={{ fontSize: 15, color: '#ef4444', fontWeight: 600 }}>ناموجود</span>
                    </>
                  )}
                </div>
              </div>

              {/* Seller Info */}
              <SellerCard
                name={product.sellerName ?? 'فروشگاه بیلیارد بازار'}
                phone={product.sellerPhone ?? '09121234567'}
                whatsapp={product.sellerWhatsapp ?? '989121234567'}
              />

              {/* Trust badges grid */}
              <div className="trust-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <TrustBadge icon="🛡️" title="ضمانت اصالت" sub="گارانتی کالای اصل" />
                <TrustBadge icon="🚚" title="ارسال سریع" sub="تحویل ۱ تا ۳ روزه" />
                <TrustBadge icon="↩️" title="مرجوعی آسان" sub="تا ۷ روز بدون سوال" />
                <TrustBadge icon="🔒" title="پرداخت امن" sub="درگاه معتبر بانکی" />
              </div>

              {/* Share */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
                <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.38)' }}>اشتراک‌گذاری:</span>
                {['ti-brand-instagram', 'ti-brand-telegram', 'ti-link'].map(icon => (
                  <button key={icon} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.07)', cursor: 'pointer', color: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#C7A66A'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(199,166,106,0.3)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64748b'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.07)' }}>
                    <i className={`ti ${icon}`} style={{ fontSize: 17 }} />
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
                    fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, whiteSpace: 'nowrap',
                    color: activeTab === tab.key ? '#C7A66A' : '#64748b',
                    borderBottom: `2px solid ${activeTab === tab.key ? '#C7A66A' : 'transparent'}`,
                    transition: 'all 0.25s',
                  }}
                >
                  <i className={`ti ${tab.icon}`} style={{ fontSize: 17 }} />
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
                      <span style={{ fontSize: 15, color: 'rgba(0,0,0,0.45)' }}>{k}</span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#111111' }}>{v}</span>
                    </div>
                  ))}
                  {product.description && (
                    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(0,0,0,0.45)', marginBottom: 10 }}>توضیحات</p>
                      <p style={{ fontSize: 16, color: 'rgba(0,0,0,0.50)', lineHeight: 1.9, margin: 0, whiteSpace: 'pre-line' }}>{product.description}</p>
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
                      <div style={{ fontSize: 57, fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>{toFa('4.3')}</div>
                      <StarRow score={4.3} count={128} />
                      <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.38)', marginTop: 6 }}>از ۵ — بر اساس ۱۲۸ نظر</p>
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      {[5,4,3,2,1].map(s => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', width: 12 }}>{toFa(s)}</span>
                          <i className="ti ti-star-filled" style={{ fontSize: 13, color: '#f59e0b' }} />
                          <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: '#f59e0b', borderRadius: 3, width: `${([72,18,6,3,1][5-s] ?? 0)}%`, opacity: 0.8 }} />
                          </div>
                          <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.38)', width: 28 }}>{toFa([72,18,6,3,1][5-s] ?? 0)}٪</span>
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

                  <button style={{ width: '100%', marginTop: 20, padding: '12px', borderRadius: 12, background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)', color: 'rgba(0,0,0,0.45)', fontSize: 15, fontFamily: 'inherit', cursor: 'pointer' }}>
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
                  <p style={{ fontSize: 12, color: 'rgba(199,166,106,0.7)', letterSpacing: '0.22em', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>RELATED PRODUCTS</p>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111111', margin: 0 }}>محصولات مشابه</h2>
                </div>
                <Link href={`/shop?category=${product.category}`} style={{ fontSize: 15, color: '#C7A66A', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                  مشاهده همه <i className="ti ti-arrow-left" style={{ fontSize: 16 }} />
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
                          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.50)', margin: '0 0 6px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title}</p>
                          {p.discountPrice && <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.30)', textDecoration: 'line-through', margin: '0 0 2px' }}>{fmt(p.price)} ت</p>}
                          <p style={{ fontSize: 17, fontWeight: 900, color: '#C7A66A', margin: 0 }}>{fmt(fp)} <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(0,0,0,0.45)' }}>تومان</span></p>
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
            <button onClick={() => setZoom(false)} style={{ position: 'absolute', top: 20, left: 20, width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.10)', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        )}

      </div>
    </>
  )
}

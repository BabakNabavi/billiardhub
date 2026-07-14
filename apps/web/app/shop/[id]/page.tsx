'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Store, Phone, Heart, ShieldCheck, Truck, ArrowLeftRight } from 'lucide-react'
import { SHOP_PRODUCTS, CAT_LABELS, type ShopProduct } from '../products'

/* ─── tokens (تم بازار: طلایی/برنزی روی کاغذ روشن) ─── */
const BG    = '#F7F6F4'
const GOLD  = '#C7A66A'
const GOLDD = '#9A6E38'
const TEXT  = '#1C1C1A'
const TSEC  = 'rgba(28,28,26,0.56)'
const TMUT  = 'rgba(28,28,26,0.34)'
const HAIR  = 'rgba(28,28,26,0.10)'

const toFa  = (v: string | number) => String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
const fmt   = (n: number) => toFa(n.toLocaleString('fa-IR'))

/* ─── سطوح LQ ─── */
const glassPanel: React.CSSProperties = {
  background: 'rgba(255,255,255,0.6)',
  backdropFilter: 'blur(40px) saturate(2.4)', WebkitBackdropFilter: 'blur(40px) saturate(2.4)',
  border: '1px solid rgba(255,255,255,0.8)',
  boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.07)',
}
/* ── دکمه‌های LQ: طرح دکمه‌های «مشاهده و رزرو» صفحه‌ی اصلی ── */
const lqGold: React.CSSProperties = {
  background: 'rgba(199,166,106,0.12)',
  border: '1px solid rgba(199,166,106,0.34)',
  color: GOLDD, fontWeight: 700,
}
const lqGreen: React.CSSProperties = {
  background: 'rgba(37,211,102,0.12)',
  border: '1px solid rgba(37,211,102,0.34)',
  color: '#0E7A38', fontWeight: 700,
}
const lqWhite: React.CSSProperties = {
  background: 'rgba(28,28,26,0.04)',
  border: `1px solid ${HAIR}`,
  color: TEXT, fontWeight: 700,
}

function Stars({ r, size = 15 }: { r: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }} aria-hidden="true">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(r) ? '#D9A441' : 'none'} stroke={i <= Math.round(r) ? 'none' : 'rgba(217,164,65,0.35)'} strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const product: ShopProduct | undefined = useMemo(
    () => SHOP_PRODUCTS.find(p => String(p.id) === String(id)),
    [id]
  )

  const [wished, setWished] = useState(false)

  const related = useMemo(
    () => product ? SHOP_PRODUCTS.filter(p => p.cat === product.cat && p.id !== product.id).slice(0, 5) : [],
    [product]
  )

  if (!product) {
    return (
      <div style={{ minHeight: '100vh', background: BG, direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 14 }}>محصول پیدا نشد</p>
          <Link href="/shop" style={{ color: GOLDD, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>← بازگشت به بیلیارد بازار</Link>
        </div>
      </div>
    )
  }

  const waLink = `https://wa.me/${product.sellerWhatsapp}?text=${encodeURIComponent(`سلام، درباره «${product.name}» در بیلیارد بازار سوال داشتم`)}`

  return (
    <div style={{ minHeight: '100vh', background: BG, direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif', color: TEXT }}>
      <style>{`
        .lq-lift{transition:all .3s cubic-bezier(0.22,1,0.36,1);}
        .lq-lift:hover{transform:translateY(-2px);}
        .lq-lift:active{transform:scale(0.97);}
        .lq-sheen{position:relative;overflow:hidden;}
        .lq-sheen::after{content:'';position:absolute;inset:0;pointer-events:none;transform:translateX(-160%) skewX(-15deg);background:linear-gradient(110deg,transparent 40%,rgba(255,255,255,0.55) 50%,transparent 60%);}
        .lq-sheen:hover::after{transition:transform .65s ease;transform:translateX(200%) skewX(-15deg);}
        .pd-card{transition:transform .22s cubic-bezier(0.22,1,0.36,1),box-shadow .22s;}
        .pd-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(28,28,26,0.12)!important;}
        .pd-grid{grid-template-columns:1.05fr 1fr;}
        @media(max-width:820px){.pd-grid{grid-template-columns:1fr!important;}.pd-media{position:static!important;}}
        .rel-grid{grid-template-columns:repeat(5,1fr);}
        @media(max-width:1000px){.rel-grid{grid-template-columns:repeat(3,1fr)!important;}}
        @media(max-width:600px){.rel-grid{grid-template-columns:repeat(2,1fr)!important;}}
      `}</style>

      {/* ── سربرگ باریک ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(28px) saturate(1.8)', WebkitBackdropFilter: 'blur(28px) saturate(1.8)', borderBottom: `1px solid ${HAIR}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(14px,3vw,28px)', height: 58, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/shop" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden' }}>
              <img src="/images/Logo/logo1.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>بیلیارد بازار</span>
          </Link>
          <Link href="/shop" className="lq-lift" style={{ marginInlineStart: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 10, ...lqGold, fontSize: 12.5, textDecoration: 'none' }}>
            <ChevronLeft size={15} strokeWidth={2.4} />
            بازگشت
          </Link>
        </div>
      </header>

      {/* ── breadcrumb ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px clamp(14px,3vw,28px) 0', fontSize: 12.5, color: TMUT }}>
        <Link href="/shop" style={{ color: TMUT, textDecoration: 'none' }}>بیلیارد بازار</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <Link href="/shop" style={{ color: TMUT, textDecoration: 'none' }}>{CAT_LABELS[product.cat] ?? 'محصولات'}</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <span style={{ color: TSEC }}>{product.name}</span>
      </div>

      {/* ── جزئیات محصول ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px clamp(14px,3vw,28px) 48px' }}>
        <div className="pd-grid" style={{ display: 'grid', gap: 'clamp(18px,3vw,36px)', alignItems: 'start' }}>

          {/* تصویر */}
          <div className="lq-sheen pd-media" style={{ ...glassPanel, borderRadius: 26, padding: 14, position: 'sticky', top: 74 }}>
            <div style={{ position: 'relative', width: '100%', paddingTop: '92%', borderRadius: 16, overflow: 'hidden', background: '#EFEDE9' }}>
              <img src={product.img} alt={product.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              {product.disc > 0 && (
                <div style={{ position: 'absolute', top: 12, insetInlineEnd: 12, background: '#E53935', color: '#fff', fontSize: 12, fontWeight: 800, borderRadius: 8, padding: '3px 10px' }}>
                  {toFa(product.disc)}٪ تخفیف
                </div>
              )}
              <button
                onClick={() => setWished(w => !w)} aria-label="علاقه‌مندی" className="lq-lift"
                style={{ position: 'absolute', top: 12, insetInlineStart: 12, width: 40, height: 40, borderRadius: '50%', ...lqWhite, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: wished ? '#E53935' : TSEC }}
              >
                <Heart size={19} fill={wished ? '#E53935' : 'none'} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* اطلاعات */}
          <div>
            <span style={{ display: 'inline-block', fontSize: 11.5, fontWeight: 700, color: GOLDD, background: 'rgba(184,147,58,0.12)', border: '1px solid rgba(184,147,58,0.28)', borderRadius: 999, padding: '4px 12px', marginBottom: 12 }}>
              {CAT_LABELS[product.cat] ?? product.cat}
            </span>
            <h1 style={{ fontSize: 'clamp(20px,2.6vw,27px)', fontWeight: 800, lineHeight: 1.45, margin: '0 0 12px', letterSpacing: '-0.01em' }}>
              {product.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Stars r={product.rating} />
              <span style={{ fontSize: 12.5, color: TSEC, fontVariantNumeric: 'tabular-nums' }}>{toFa(product.rating.toFixed(1))} ({toFa(product.reviews)} نظر)</span>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: TMUT }} />
              <span style={{ fontSize: 12.5, color: '#16803C', fontWeight: 700 }}>موجود در انبار</span>
            </div>

            {/* قیمت */}
            <div style={{ ...lqWhite, borderRadius: 18, padding: '16px 18px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#1A6B3A', fontVariantNumeric: 'tabular-nums' }}>{fmt(product.price)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: TSEC }}>تومان</span>
                {product.old > 0 && (
                  <span style={{ marginInlineStart: 'auto', fontSize: 13.5, color: TMUT, textDecoration: 'line-through', fontVariantNumeric: 'tabular-nums' }}>{fmt(product.old)}</span>
                )}
              </div>
              {product.disc > 0 && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#B23B2E', fontWeight: 700 }}>
                  {toFa(product.disc)}٪ تخفیف — {fmt(product.old - product.price)} تومان سود شما
                </div>
              )}
            </div>

            {/* توضیحات */}
            <p style={{ fontSize: 13.5, lineHeight: 2, color: TSEC, margin: '0 0 20px' }}>{product.desc}</p>

            {/* کارت فروشنده — رفتن به فروشگاه + تماس */}
            <div style={{ ...glassPanel, borderRadius: 20, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${GOLD},${GOLDD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                  <Store size={20} strokeWidth={2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: TMUT, marginBottom: 2 }}>فروشنده این محصول</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.sellerName}</div>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#16803C', background: 'rgba(22,128,60,0.10)', border: '1px solid rgba(22,128,60,0.25)', borderRadius: 999, padding: '4px 10px' }}>
                  <ShieldCheck size={13} strokeWidth={2.2} /> تأییدشده
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                <Link href={`/sellers/${product.sellerId}`} className="lq-lift" style={{ gridColumn: '1 / -1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px', borderRadius: 10, ...lqGold, fontSize: 13, textDecoration: 'none' }}>
                  <Store size={16} strokeWidth={2.2} /> رفتن به صفحه فروشگاه
                </Link>
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="lq-lift" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 12, ...lqGreen, fontSize: 12.5, textDecoration: 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.77.46 3.45 1.28 4.9L2 22l5.32-1.39a9.9 9.9 0 004.72 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.13-2.9-7A9.82 9.82 0 0012.04 2z"/></svg>
                  واتساپ
                </a>
                <a href={`tel:${product.sellerPhone}`} className="lq-lift" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 10, ...lqGold, fontSize: 12.5, textDecoration: 'none' }}>
                  <Phone size={15} strokeWidth={2.2} /> تماس
                </a>
              </div>
            </div>

            {/* تضمین‌ها */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 18, padding: '2px 4px' }}>
              {[
                { icon: <ShieldCheck size={17} strokeWidth={2} />, t: 'گارانتی اصالت کالا' },
                { icon: <Truck size={17} strokeWidth={2} />,        t: 'ارسال به سراسر کشور' },
                { icon: <ArrowLeftRight size={17} strokeWidth={2} />, t: '۷ روز ضمانت بازگشت' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: TSEC }}>
                  <span style={{ color: GOLDD }}>{f.icon}</span>{f.t}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── محصولات مرتبط ── */}
        {related.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>محصولات مشابه</h2>
              <Link href="/shop" style={{ fontSize: 13, color: GOLDD, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                مشاهده همه <ChevronLeft size={14} strokeWidth={2.4} />
              </Link>
            </div>
            <div className="rel-grid" style={{ display: 'grid', gap: 12 }}>
              {related.map(p => (
                <Link key={p.id} href={`/shop/${p.id}`} className="pd-card" style={{ textDecoration: 'none', background: '#fff', borderRadius: 14, border: `1.5px solid ${HAIR}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: '100%', paddingTop: '100%', position: 'relative', background: '#F4F3F1', borderBottom: `1.5px solid ${HAIR}` }}>
                    <img src={p.img} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    {p.disc > 0 && (
                      <div style={{ position: 'absolute', top: 8, insetInlineEnd: 8, background: '#E53935', color: '#fff', fontSize: 11, fontWeight: 800, borderRadius: 7, padding: '2px 7px' }}>{toFa(p.disc)}٪</div>
                    )}
                  </div>
                  <div style={{ padding: '10px 10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 12, color: TEXT, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</span>
                    <span style={{ fontSize: 10.5, color: TMUT }}>{p.sellerName}</span>
                    <div style={{ marginTop: 'auto', fontSize: 13, fontWeight: 800, color: '#1A6B3A' }}>
                      {fmt(p.price)} <span style={{ fontSize: 11, fontWeight: 500 }}>تومان</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

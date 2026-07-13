'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const GOLD     = '#C7A66A'
const GOLD_D   = '#9A6E38'
const TEXT     = '#1C1C1A'
const TEXT_SEC = 'rgba(28,28,26,0.52)'
const TEXT_MUT = 'rgba(28,28,26,0.32)'

// ── Mock Data ─────────────────────────────────────────────────
const SELLERS = [
  {
    id: '1',
    name: 'آریا بیلیارد',
    city: 'تهران',
    verified: true,
    elite: true,
    rating: 4.8,
    reviewCount: 247,
    productCount: 312,
    since: '۱۳۸۵',
    sinceYear: 1385,
    brands: ['Predator', 'Mezz', 'McDermott'],
    specialties: ['چوب حرفه‌ای', 'میز', 'لوازم جانبی'],
    responseTime: '۲ ساعت',
    phone: '02188001234',
    bannerImage: '/images/shop/snooker-table.jpg',
    description: 'بزرگ‌ترین مجموعه تجهیزات بیلیارد در ایران با بیش از ۳۰۰ محصول اصل از برترین برندهای جهانی',
  },
  {
    id: '2',
    name: 'بیلیارد سنتر تهران',
    city: 'تهران',
    verified: true,
    elite: false,
    rating: 4.5,
    reviewCount: 124,
    productCount: 189,
    since: '۱۳۹۲',
    sinceYear: 1392,
    brands: ['Riley', 'Fury', 'BCE'],
    specialties: ['چوب', 'توپ'],
    responseTime: '۴ ساعت',
    phone: '02155009876',
    bannerImage: '/images/shop/cue_billiard_2.jpg',
    description: 'فروش تخصصی چوب و توپ بیلیارد با ضمانت اصالت کالا و خدمات پس از فروش',
  },
  {
    id: '3',
    name: 'بیلیارد اکبری اصفهان',
    city: 'اصفهان',
    verified: false,
    elite: false,
    rating: 4.2,
    reviewCount: 56,
    productCount: 78,
    since: '۱۳۹۸',
    sinceYear: 1398,
    brands: ['Fury', 'Viper', 'Cuetec'],
    specialties: ['چوب', 'لوازم جانبی'],
    responseTime: '۸ ساعت',
    phone: '03136001234',
    bannerImage: '/images/shop/Ball-1.jpg',
    description: 'فروشگاه تخصصی بیلیارد در اصفهان با قیمت‌های رقابتی و تنوع بالا',
  },
  {
    id: '4',
    name: 'آنلاین بیلیارد شاپ',
    city: 'مشهد',
    verified: true,
    elite: false,
    rating: 4.6,
    reviewCount: 89,
    productCount: 145,
    since: '۱۴۰۰',
    sinceYear: 1400,
    brands: ['McDermott', 'Lucasi', 'Players'],
    specialties: ['چوب', 'کیف چوب'],
    responseTime: '۱ ساعت',
    phone: '05138001234',
    bannerImage: '/images/shop/Home_table.jpg',
    description: 'ارسال سراسری — تخصصی در فروش آنلاین چوب و لوازم بیلیارد با بهترین قیمت',
  },
  {
    id: '5',
    name: 'پرستیژ بیلیارد شیراز',
    city: 'شیراز',
    verified: true,
    elite: true,
    rating: 4.7,
    reviewCount: 183,
    productCount: 228,
    since: '۱۳۸۹',
    sinceYear: 1389,
    brands: ['Predator', 'Viking', 'Scorpion'],
    specialties: ['میز اسنوکر', 'چوب', 'پارچه میز'],
    responseTime: '۳ ساعت',
    phone: '07132001234',
    bannerImage: '/images/shop/Pro_table.jpg',
    description: 'نماینده رسمی برند Predator در جنوب کشور — تخصصی در میزهای اسنوکر حرفه‌ای',
  },
  {
    id: '6',
    name: 'گلدن کیو تهران',
    city: 'تهران',
    verified: true,
    elite: false,
    rating: 4.4,
    reviewCount: 71,
    productCount: 95,
    since: '۱۳۹۶',
    sinceYear: 1396,
    brands: ['Mezz', 'Tiger', 'Pechauer'],
    specialties: ['تیپ', 'گچ', 'لوازم جانبی'],
    responseTime: '۶ ساعت',
    phone: '02177001234',
    bannerImage: '/images/shop/pool_chalk_1.jpg',
    description: 'متخصص فروش لوازم جانبی و قطعات حرفه‌ای بیلیارد — واردکننده مستقیم',
  },
]

const CITIES = ['همه', 'تهران', 'اصفهان', 'مشهد', 'شیراز']
const SPECIALTIES = ['همه', 'چوب', 'میز', 'توپ', 'لوازم جانبی', 'اسنوکر', 'پارچه میز']
const SORT_OPTIONS = [
  { value: 'rating',   label: 'بهترین امتیاز' },
  { value: 'products', label: 'بیشترین محصول' },
  { value: 'newest',   label: 'جدیدترین'       },
] as const

// ── Stars ─────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => {
        const full = i <= Math.floor(rating)
        const half = !full && i - 0.5 <= rating
        return (
          <svg key={i} width={13} height={13} viewBox="0 0 24 24"
            fill={full ? '#f59e0b' : half ? 'url(#half)' : 'none'}
            stroke="#f59e0b" strokeWidth={full || half ? 0 : 1.5}>
            {half && (
              <defs>
                <linearGradient id="half" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="50%" stopColor="#f59e0b"/>
                  <stop offset="50%" stopColor="transparent"/>
                </linearGradient>
              </defs>
            )}
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )
      })}
    </div>
  )
}

// ── Logo with gold story ring (fully visible) ─────────────────
function SellerLogo({ name, size = 62 }: { name: string; size?: number }) {
  const hues = [
    ['#C7A66A','#A07840'], ['#6A9EC7','#4070A0'], ['#9EC76A','#70A040'],
    ['#C76A9E','#A04070'], ['#6AC79E','#40A070'], ['#C79E6A','#A07040'],
  ]
  const idx = name.charCodeAt(0) % hues.length
  const [c1, c2] = hues[idx] ?? ['#C7A66A','#A07840']
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      padding: 2.5, background: `linear-gradient(135deg,${GOLD},${GOLD_D})`,
      boxShadow: `0 6px 18px rgba(199,166,106,0.45)`,
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        border: '2.5px solid #fff',
        background: `linear-gradient(135deg,${c1},${c2})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.36, fontWeight: 900, color: '#fff',
      }}>
        {name.charAt(0)}
      </div>
    </div>
  )
}

// ── Verified pill (inline, not overlapping banner) ────────────
function VerifiedPill() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"><polyline points="20 6 9 17 4 12"/></svg>
      تأیید شده
    </span>
  )
}
const PhoneIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.47-1.47a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>

// ── Seller Card — grid + list, modern gold theme ──────────────
function SellerCard({ seller, view }: { seller: typeof SELLERS[0]; view: 'grid' | 'list' }) {
  const [hov, setHov] = useState(false)
  const router = useRouter()

  const shell: React.CSSProperties = {
    background: '#fff', borderRadius: 22, overflow: 'hidden',
    border: `1.5px solid ${hov ? 'rgba(199,166,106,0.5)' : 'rgba(28,28,26,0.09)'}`,
    boxShadow: hov ? '0 18px 46px rgba(28,28,26,0.13), 0 4px 14px rgba(199,166,106,0.12)' : '0 2px 12px rgba(28,28,26,0.06)',
    transform: hov ? 'translateY(-5px)' : 'none',
    transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)', cursor: 'pointer',
  }

  const ratingRow = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <Stars rating={seller.rating} />
      <span style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>{seller.rating}</span>
      <span style={{ fontSize: 12.5, color: TEXT_MUT }}>({seller.reviewCount} نظر)</span>
    </div>
  )
  const metaRow = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: TEXT_SEC, flexWrap: 'wrap' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        {seller.city}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        از {seller.since}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        {seller.productCount} محصول
      </span>
    </div>
  )
  const brandsRow = (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
      {seller.brands.map(b => (
        <span key={b} style={{ fontSize: 11.5, fontWeight: 600, color: GOLD_D, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.26)', borderRadius: 20, padding: '2px 9px' }}>{b}</span>
      ))}
    </div>
  )
  const viewBtn = (
    <Link href={`/sellers/${seller.id}`} onClick={e => e.stopPropagation()} style={{
      padding: '10px 18px', borderRadius: 12, textAlign: 'center', textDecoration: 'none',
      background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D,
      fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      مشاهده فروشگاه
    </Link>
  )
  const callBtn = (
    <a href={`tel:${seller.phone}`} onClick={e => e.stopPropagation()} style={{
      padding: '10px 14px', borderRadius: 12, textDecoration: 'none',
      border: '1px solid rgba(28,28,26,0.12)', color: TEXT, background: 'rgba(28,28,26,0.04)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{PhoneIcon}</a>
  )

  /* ── LIST VIEW ── */
  if (view === 'list') {
    return (
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={() => router.push(`/sellers/${seller.id}`)}
        className="sel-list-card" style={{ ...shell, display: 'flex', alignItems: 'stretch' }}>
        {/* image */}
        <div className="sel-list-img" style={{ position: 'relative', width: 176, flexShrink: 0, overflow: 'hidden' }}>
          <img src={seller.bannerImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: hov ? 'scale(1.05)' : 'scale(1)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, rgba(0,0,0,0.05), rgba(0,0,0,0.35))' }} />
          {seller.elite && (
            <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(199,166,106,0.94)', color: '#3a2800', fontSize: 10.5, fontWeight: 800, borderRadius: 20, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              رسمی
            </div>
          )}
        </div>
        {/* info */}
        <div style={{ flex: 1, minWidth: 0, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: 0 }}>{seller.name}</h3>
            {seller.verified && <VerifiedPill />}
          </div>
          <p style={{ fontSize: 12.5, color: TEXT_SEC, margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{seller.description}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>{ratingRow}{metaRow}</div>
          <div className="sel-list-brands">{brandsRow}</div>
        </div>
        {/* actions */}
        <div className="sel-list-actions" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, padding: '16px 18px 16px 0', flexShrink: 0 }}>
          {viewBtn}{callBtn}
        </div>
      </div>
    )
  }

  /* ── GRID VIEW ── */
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={() => router.push(`/sellers/${seller.id}`)}
      style={{ ...shell, display: 'flex', flexDirection: 'column' }}>
      {/* banner */}
      <div style={{ height: 116, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <img src={seller.bannerImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: hov ? 'scale(1.05)' : 'scale(1)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.45) 100%)' }} />
        {seller.elite && (
          <div style={{ position: 'absolute', top: 10, right: 12, background: 'rgba(199,166,106,0.94)', backdropFilter: 'blur(8px)', color: '#3a2800', fontSize: 11, fontWeight: 800, borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            نماینده رسمی
          </div>
        )}
        <div style={{ position: 'absolute', top: 10, left: 12, background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.92)', fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {seller.responseTime}
        </div>
      </div>

      {/* body */}
      <div style={{ padding: '0 18px 18px' }}>
        {/* logo fully visible (no badge overlap on image) */}
        <div style={{ marginTop: -32, marginBottom: 12, position: 'relative', zIndex: 2 }}>
          <SellerLogo name={seller.name} size={62} />
        </div>

        {/* name + verified inline (fix: badge no longer stuck to image) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 5px', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: 0, lineHeight: 1.35 }}>{seller.name}</h3>
          {seller.verified && <VerifiedPill />}
        </div>

        <p style={{ fontSize: 12.5, color: TEXT_SEC, margin: '0 0 12px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{seller.description}</p>

        <div style={{ marginBottom: 10 }}>{ratingRow}</div>
        <div style={{ marginBottom: 12 }}>{metaRow}</div>
        <div style={{ marginBottom: 16 }}>{brandsRow}</div>

        {/* action buttons */}
        <div style={{ display: 'flex', gap: 8, borderTop: '1px solid rgba(28,28,26,0.06)', paddingTop: 14 }}>
          <div style={{ flex: 1 }}>
            <Link href={`/sellers/${seller.id}`} onClick={e => e.stopPropagation()} style={{
              display: 'block', padding: '10px 0', borderRadius: 12, textAlign: 'center', textDecoration: 'none',
              background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D,
              fontSize: 13, fontWeight: 700,
            }}>
              مشاهده فروشگاه
            </Link>
          </div>
          {callBtn}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function SellersPage() {
  const [search,      setSearch]      = useState('')
  const [activeCity,  setActiveCity]  = useState('همه')
  const [activeSpec,  setActiveSpec]  = useState('همه')
  const [onlyVerified,setOnlyVerified]= useState(false)
  const [sort,        setSort]        = useState<'rating'|'products'|'newest'>('rating')
  const [view,        setView]        = useState<'grid'|'list'>('grid')

  const filtered = useMemo(() => {
    return SELLERS
      .filter(s => !search.trim() || s.name.includes(search.trim()) || s.city.includes(search.trim()) || s.brands.some(b => b.toLowerCase().includes(search.toLowerCase())))
      .filter(s => activeCity === 'همه' || s.city === activeCity)
      .filter(s => activeSpec === 'همه' || s.specialties.some(sp => sp.includes(activeSpec) || activeSpec.includes(sp)))
      .filter(s => !onlyVerified || s.verified)
      .sort((a, b) => {
        if (sort === 'rating')   return b.rating - a.rating
        if (sort === 'products') return b.productCount - a.productCount
        return b.sinceYear - a.sinceYear
      })
  }, [search, activeCity, activeSpec, onlyVerified, sort])

  const totalProducts = SELLERS.reduce((sum, s) => sum + s.productCount, 0)
  const cities = [...new Set(SELLERS.map(s => s.city))].length
  const verifiedCount = SELLERS.filter(s => s.verified).length

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        * { box-sizing: border-box; }
        .sel-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
        @media(max-width:1000px) { .sel-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media(max-width:600px)  { .sel-grid { grid-template-columns: 1fr !important; } }
        .sel-list { display: flex; flex-direction: column; gap: 14px; }
        .s-chip { transition: all 0.18s; }
        .s-chip:hover { opacity: 0.85; }
        .search-inp:focus { border-color: rgba(199,166,106,0.7) !important; box-shadow: 0 0 0 3px rgba(199,166,106,0.14) !important; outline: none; }
        @media(max-width:640px){
          .sel-list-card { flex-direction: column !important; }
          .sel-list-img { width: 100% !important; height: 150px; }
          .sel-list-actions { flex-direction: row !important; padding: 0 18px 16px !important; }
          .sel-list-actions > a:first-child { flex: 1; }
          .sel-list-brands { display: none; }
        }
        .filt-scroll { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; }
        .filt-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ background: '#F7F7F5', minHeight: '100vh', direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif', color: TEXT }}>

        {/* ─────── HERO — luxury ─────── */}
        <div style={{ position: 'relative', minHeight: 'clamp(300px,40vw,400px)', overflow: 'hidden' }}>
          <img src="/images/shop/snooker-table.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(2px) brightness(0.38) saturate(0.75)', transform: 'scale(1.06)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 50% 0%, rgba(199,166,106,0.16) 0%, transparent 55%), linear-gradient(to bottom, rgba(8,7,5,0.62) 0%, rgba(14,11,7,0.86) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")', opacity: 0.5 }} />
          {/* thin gold top rule */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: 760, margin: '0 auto', padding: 'clamp(48px,7vw,72px) clamp(20px,4vw,40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', animation: 'fadeUp 0.6s ease both' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.4)', color: GOLD, fontSize: 11.5, fontWeight: 700, borderRadius: 24, padding: '6px 16px', marginBottom: 20, backdropFilter: 'blur(10px)', letterSpacing: '0.16em' }}>
              BILLIARD HUB · مارکت‌پلیس رسمی
            </div>
            <h1 style={{ fontSize: 'clamp(26px,4.6vw,46px)', fontWeight: 900, color: '#fff', margin: '0 0 12px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              فروشگاه‌های تجهیزات بیلیارد
            </h1>
            <p style={{ fontSize: 'clamp(13.5px,2vw,16px)', color: 'rgba(255,255,255,0.6)', margin: '0 0 26px', lineHeight: 1.8, maxWidth: 460 }}>
              معتبرترین فروشندگان چوب، میز، توپ و لوازم جانبی — همه در یک جا
            </p>

            {/* search */}
            <div style={{ width: '100%', maxWidth: 520, position: 'relative', marginBottom: 22 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(199,166,106,0.75)" strokeWidth="2.2" style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 2 }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="search-inp" type="text" placeholder="جستجوی فروشنده، شهر یا برند..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '15px 50px 15px 18px', borderRadius: 16, fontSize: 15,
                  background: 'rgba(255,255,255,0.09)', border: '1.5px solid rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', color: '#fff',
                  fontFamily: 'Vazirmatn,Tahoma,sans-serif', transition: 'border-color 0.2s, box-shadow 0.2s', direction: 'rtl' }}
              />
            </div>

            {/* premium stats row */}
            <div style={{ display: 'flex', gap: 'clamp(18px,4vw,44px)', alignItems: 'center' }}>
              {[
                { v: SELLERS.length,   l: 'فروشگاه فعال' },
                { v: totalProducts,    l: 'محصول موجود' },
                { v: verifiedCount,    l: 'تأییدشده' },
              ].map((st, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(18px,4vw,44px)' }}>
                  {i > 0 && <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.14)' }} />}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'clamp(18px,2.6vw,24px)', fontWeight: 900, color: GOLD, lineHeight: 1 }}>{st.v.toLocaleString('fa-IR')}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 5 }}>{st.l}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─────── BODY ─────── */}
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 clamp(16px,3vw,32px) 64px' }}>

          {/* ─── FILTER BAR (sticky, luxury glass) ─── */}
          <div style={{ position: 'sticky', top: 12, zIndex: 30, background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(28px) saturate(190%)', WebkitBackdropFilter: 'blur(28px) saturate(190%)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 20, boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 10px 34px rgba(28,28,26,0.10)', padding: 12, marginTop: -34, marginBottom: 24 }}>

            {/* row 1: city + specialty chips (scrollable on mobile) */}
            <div className="filt-scroll" style={{ paddingBottom: 4 }}>
              {CITIES.map(city => {
                const on = activeCity === city
                return (
                  <button key={city} className="s-chip" onClick={() => setActiveCity(city)} style={{
                    flexShrink: 0, padding: '7px 15px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    border: on ? 'none' : '1px solid rgba(28,28,26,0.10)',
                    background: on ? `linear-gradient(135deg,${GOLD},#A07840)` : 'rgba(255,255,255,0.7)',
                    color: on ? '#fff' : TEXT_SEC,
                    boxShadow: on ? '0 3px 10px rgba(199,166,106,0.36)' : 'none',
                    fontFamily: 'Vazirmatn,Tahoma,sans-serif',
                  }}>{city}</button>
                )
              })}
              <div style={{ width: 1, alignSelf: 'stretch', margin: '2px 4px', background: 'rgba(28,28,26,0.10)', flexShrink: 0 }} />
              {SPECIALTIES.map(sp => {
                const on = activeSpec === sp
                return (
                  <button key={sp} className="s-chip" onClick={() => setActiveSpec(sp)} style={{
                    flexShrink: 0, padding: '7px 15px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    border: on ? '1px solid rgba(199,166,106,0.45)' : '1px solid rgba(28,28,26,0.10)',
                    background: on ? 'rgba(199,166,106,0.14)' : 'rgba(255,255,255,0.7)',
                    color: on ? GOLD_D : TEXT_SEC, fontFamily: 'Vazirmatn,Tahoma,sans-serif',
                  }}>{sp}</button>
                )
              })}
            </div>

            {/* row 2: verified + sort + view toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(28,28,26,0.07)', flexWrap: 'wrap' }}>
              <button className="s-chip" onClick={() => setOnlyVerified(!onlyVerified)} style={{
                padding: '7px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                border: onlyVerified ? '1px solid rgba(199,166,106,0.45)' : '1px solid rgba(28,28,26,0.10)',
                background: onlyVerified ? 'rgba(199,166,106,0.14)' : 'rgba(255,255,255,0.7)',
                color: onlyVerified ? GOLD_D : TEXT_SEC, fontFamily: 'Vazirmatn,Tahoma,sans-serif',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                فقط تأیید شده
              </button>

              <span style={{ fontSize: 12.5, color: TEXT_MUT, marginRight: 4 }}>
                <b style={{ color: TEXT, fontWeight: 800 }}>{filtered.length.toLocaleString('fa-IR')}</b> فروشگاه
              </span>

              {/* left cluster */}
              <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative' }}>
                  <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} style={{
                    padding: '8px 34px 8px 14px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                    background: 'rgba(28,28,26,0.05)', border: '1px solid rgba(28,28,26,0.08)', color: TEXT_SEC,
                    fontFamily: 'Vazirmatn,Tahoma,sans-serif', appearance: 'none', WebkitAppearance: 'none',
                  }}>
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>مرتب: {o.label}</option>)}
                  </select>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUT} strokeWidth="2.5" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><polyline points="6 9 12 15 18 9"/></svg>
                </div>

                {/* view toggle (grid / list) */}
                <div style={{ display: 'flex', gap: 2, padding: 3, borderRadius: 12, background: 'rgba(28,28,26,0.05)', border: '1px solid rgba(28,28,26,0.08)' }}>
                  {([['grid','⊞'],['list','☰']] as [ 'grid'|'list', string ][]).map(([v]) => {
                    const on = view === v
                    return (
                      <button key={v} onClick={() => setView(v)} aria-label={v === 'grid' ? 'نمای شبکه‌ای' : 'نمای لیستی'} style={{
                        width: 34, height: 30, borderRadius: 9, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: on ? '#fff' : 'transparent', color: on ? GOLD_D : TEXT_MUT,
                        boxShadow: on ? '0 2px 6px rgba(28,28,26,0.12)' : 'none', transition: 'all 0.18s',
                      }}>
                        {v === 'grid'
                          ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
                          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ─── GRID / LIST ─── */}
          {filtered.length > 0 ? (
            <div className={view === 'grid' ? 'sel-grid' : 'sel-list'} style={{ marginBottom: 56 }}>
              {filtered.map((s, i) => (
                <div key={s.id} style={{ animation: `fadeUp ${0.3 + i * 0.05}s ease both` }}>
                  <SellerCard seller={s} view={view} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '64px 0', color: TEXT_MUT }}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <p style={{ fontSize: 17, fontWeight: 700, color: TEXT_SEC }}>فروشگاهی یافت نشد</p>
              <p style={{ fontSize: 14 }}>فیلترها را تغییر دهید یا جستجو را پاک کنید</p>
            </div>
          )}

          {/* ─── STATS ─── */}
          <div style={{ background: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(32px) saturate(200%)', WebkitBackdropFilter: 'blur(32px) saturate(200%)', border: '1px solid rgba(255,255,255,0.80)', borderRadius: 24, boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.06)', padding: 'clamp(20px,3vw,32px)', position: 'relative', overflow: 'hidden' }}>
            {/* sheen */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', borderRadius: '24px 24px 0 0', pointerEvents: 'none' }} />
            {/* ambient */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'radial-gradient(circle,rgba(199,166,106,0.07) 0%,transparent 65%)', filter: 'blur(30px)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <p style={{ fontSize: 12, color: GOLD, fontWeight: 700, letterSpacing: '0.18em', marginBottom: 4 }}>BILLIARD HUB</p>
                <h2 style={{ fontSize: 'clamp(18px,2.5vw,22px)', fontWeight: 900, color: TEXT, margin: 0 }}>بیلیارد هاب در یک نگاه</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(12px,2vw,20px)' }}>
                {[
                  { value: SELLERS.length, label: 'فروشگاه فعال', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
                  { value: totalProducts, label: 'محصول موجود', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
                  { value: cities, label: 'شهر پوشش‌داده‌شده', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
                ].map((stat, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: 'clamp(16px,2vw,24px) 12px', background: 'rgba(199,166,106,0.06)', border: '1px solid rgba(199,166,106,0.14)', borderRadius: 16 }}>
                    <div style={{ color: GOLD, display: 'flex', justifyContent: 'center', marginBottom: 10 }}>{stat.icon}</div>
                    <div style={{ fontSize: 'clamp(26px,3.5vw,36px)', fontWeight: 900, color: TEXT, lineHeight: 1, marginBottom: 6 }}>
                      {stat.value.toLocaleString('fa-IR')}
                    </div>
                    <div style={{ fontSize: 13, color: TEXT_SEC, fontWeight: 500 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

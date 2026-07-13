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

// ── Seller Card — modern, gold theme ──────────────────────────
function SellerCard({ seller }: { seller: typeof SELLERS[0] }) {
  const [hov, setHov] = useState(false)
  const router = useRouter()
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => router.push(`/sellers/${seller.id}`)}
      style={{
        background: '#fff',
        borderRadius: 22,
        overflow: 'hidden',
        border: `1.5px solid ${hov ? 'rgba(199,166,106,0.5)' : 'rgba(28,28,26,0.09)'}`,
        boxShadow: hov ? '0 18px 46px rgba(28,28,26,0.13), 0 4px 14px rgba(199,166,106,0.12)' : '0 2px 12px rgba(28,28,26,0.06)',
        transform: hov ? 'translateY(-5px)' : 'none',
        transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)',
        display: 'flex', flexDirection: 'column', cursor: 'pointer',
      }}
    >
      {/* banner */}
      <div style={{ height: 116, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={seller.bannerImage}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: hov ? 'scale(1.05)' : 'scale(1)' }}
        />
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
        {/* logo (fully visible, gold ring) + verified */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -32, marginBottom: 12, position: 'relative', zIndex: 2 }}>
          <SellerLogo name={seller.name} size={62} />
          {seller.verified && (
            <div style={{ background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D, fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '4px 10px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              تأیید شده
            </div>
          )}
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: '0 0 5px', lineHeight: 1.35 }}>{seller.name}</h3>
        <p style={{ fontSize: 12.5, color: TEXT_SEC, margin: '0 0 12px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{seller.description}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <Stars rating={seller.rating} />
          <span style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>{seller.rating}</span>
          <span style={{ fontSize: 12.5, color: TEXT_MUT }}>({seller.reviewCount} نظر)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12, fontSize: 13, color: TEXT_SEC }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {seller.city}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            از {seller.since}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 'auto' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            {seller.productCount} محصول
          </span>
        </div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
          {seller.brands.map(b => (
            <span key={b} style={{ fontSize: 11.5, fontWeight: 600, color: GOLD_D, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.26)', borderRadius: 20, padding: '2px 9px' }}>{b}</span>
          ))}
        </div>

        {/* action buttons — LQ (طرح مشاهده و رزرو) */}
        <div style={{ display: 'flex', gap: 8, borderTop: '1px solid rgba(28,28,26,0.06)', paddingTop: 14 }}>
          <Link href={`/sellers/${seller.id}`} onClick={e => e.stopPropagation()} style={{
            flex: 1, padding: '10px 0', borderRadius: 12, textAlign: 'center', textDecoration: 'none',
            background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D,
            fontSize: 13, fontWeight: 700,
          }}>
            مشاهده فروشگاه
          </Link>
          <a href={`tel:${seller.phone}`} onClick={e => e.stopPropagation()} style={{
            padding: '10px 14px', borderRadius: 12, textDecoration: 'none',
            border: '1px solid rgba(28,28,26,0.12)', color: TEXT,
            background: 'rgba(28,28,26,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.47-1.47a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function SellersPage() {
  const [search,      setSearch]      = useState('')
  const [activeCity,  setActiveCity]  = useState('همه')
  const [onlyVerified,setOnlyVerified]= useState(false)
  const [sort,        setSort]        = useState<'rating'|'products'|'newest'>('rating')

  const filtered = useMemo(() => {
    return SELLERS
      .filter(s => !search.trim() || s.name.includes(search.trim()) || s.city.includes(search.trim()) || s.brands.some(b => b.toLowerCase().includes(search.toLowerCase())))
      .filter(s => activeCity === 'همه' || s.city === activeCity)
      .filter(s => !onlyVerified || s.verified)
      .sort((a, b) => {
        if (sort === 'rating')   return b.rating - a.rating
        if (sort === 'products') return b.productCount - a.productCount
        return b.sinceYear - a.sinceYear
      })
  }, [search, activeCity, onlyVerified, sort])

  const totalProducts = SELLERS.reduce((sum, s) => sum + s.productCount, 0)
  const cities = [...new Set(SELLERS.map(s => s.city))].length

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        * { box-sizing: border-box; }
        .sel-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
        @media(max-width:1000px) { .sel-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media(max-width:600px)  { .sel-grid { grid-template-columns: 1fr !important; } }
        .s-chip { transition: all 0.18s; }
        .s-chip:hover { opacity: 0.85; }
        .search-inp:focus { border-color: rgba(199,166,106,0.7) !important; box-shadow: 0 0 0 3px rgba(199,166,106,0.14) !important; outline: none; }
      `}</style>

      <div style={{ background: '#F7F7F5', minHeight: '100vh', direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif', color: TEXT }}>

        {/* ─────── HERO ─────── */}
        <div style={{ position: 'relative', height: 'clamp(280px,38vw,420px)', overflow: 'hidden' }}>
          {/* background image */}
          <img src="/images/shop/snooker-table.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(3px) brightness(0.45) saturate(0.7)', transform: 'scale(1.06)' }} />
          {/* gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,8,5,0.55) 0%, rgba(20,15,8,0.78) 100%)' }} />
          {/* grain texture */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")', opacity: 0.6 }} />

          {/* hero content */}
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 720, margin: '0 auto', padding: '0 clamp(20px,4vw,40px)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', animation: 'fadeUp 0.6s ease both' }}>

            {/* badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.35)', color: GOLD, fontSize: 13, fontWeight: 700, borderRadius: 24, padding: '5px 16px', marginBottom: 18, backdropFilter: 'blur(10px)', letterSpacing: '0.04em' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
              فروشگاه‌های معتبر
            </div>

            <h1 style={{ fontSize: 'clamp(24px,4.5vw,44px)', fontWeight: 900, color: '#fff', margin: '0 0 10px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              فروشگاه‌های تجهیزات بیلیارد
            </h1>
            <p style={{ fontSize: 'clamp(14px,2vw,17px)', color: 'rgba(255,255,255,0.65)', margin: '0 0 28px', lineHeight: 1.7 }}>
              بهترین فروشگاه‌های چوب، میز، توپ و لوازم جانبی بیلیارد در ایران
            </p>

            {/* search bar */}
            <div style={{ width: '100%', maxWidth: 500, position: 'relative' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(199,166,106,0.7)" strokeWidth="2.2" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 2 }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="search-inp"
                type="text"
                placeholder="جستجوی فروشنده، شهر یا برند..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '14px 48px 14px 18px',
                  borderRadius: 14, fontSize: 15,
                  background: 'rgba(255,255,255,0.10)',
                  border: '1.5px solid rgba(255,255,255,0.20)',
                  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  color: '#fff', fontFamily: 'Vazirmatn,Tahoma,sans-serif',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  direction: 'rtl',
                }}
              />
            </div>
          </div>
        </div>

        {/* ─────── BODY ─────── */}
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '28px clamp(16px,3vw,32px) 64px' }}>

          {/* ─── FILTERS ─── */}
          <div style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.75)', borderRadius: 18, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 4px 20px rgba(0,0,0,0.06)', padding: '14px 18px', marginBottom: 28, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>

            {/* city pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CITIES.map(city => (
                <button key={city} className="s-chip" onClick={() => setActiveCity(city)} style={{
                  padding: '7px 16px', borderRadius: 24, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  border: activeCity === city ? 'none' : '1px solid rgba(255,255,255,0.88)',
                  background: activeCity === city ? `linear-gradient(135deg,${GOLD},#A07840)` : 'rgba(255,255,255,0.78)',
                  backdropFilter: activeCity === city ? 'none' : 'blur(14px) saturate(190%)',
                  WebkitBackdropFilter: activeCity === city ? 'none' : 'blur(14px) saturate(190%)',
                  color: activeCity === city ? '#fff' : TEXT_SEC,
                  boxShadow: activeCity === city ? 'inset 0 1.5px 0 rgba(255,255,255,0.28), 0 3px 10px rgba(199,166,106,0.36)' : 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 2px 8px rgba(0,0,0,0.05)',
                  fontFamily: 'Vazirmatn,Tahoma,sans-serif',
                }}>
                  {city}
                </button>
              ))}
            </div>

            {/* divider */}
            <div style={{ width: 1, height: 24, background: 'rgba(28,28,26,0.10)', flexShrink: 0 }} />

            {/* verified toggle */}
            <button className="s-chip" onClick={() => setOnlyVerified(!onlyVerified)} style={{
              padding: '7px 16px', borderRadius: 24, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: onlyVerified ? '1px solid rgba(199,166,106,0.42)' : '1px solid rgba(255,255,255,0.88)',
              background: onlyVerified ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.78)',
              backdropFilter: 'blur(14px) saturate(190%)',
              WebkitBackdropFilter: 'blur(14px) saturate(190%)',
              color: onlyVerified ? GOLD : TEXT_SEC,
              boxShadow: onlyVerified ? 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 3px 12px rgba(199,166,106,0.14)' : 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 2px 8px rgba(0,0,0,0.05)',
              fontFamily: 'Vazirmatn,Tahoma,sans-serif',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              فقط تأیید شده
            </button>

            {/* sort — pushed to left */}
            <div style={{ marginRight: 'auto', position: 'relative' }}>
              <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} style={{
                padding: '7px 36px 7px 16px', borderRadius: 24, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: 'rgba(28,28,26,0.06)', border: 'none', color: TEXT_SEC,
                fontFamily: 'Vazirmatn,Tahoma,sans-serif', appearance: 'none', WebkitAppearance: 'none',
              }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>مرتب: {o.label}</option>)}
              </select>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUT} strokeWidth="2.5" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          {/* count */}
          <p style={{ fontSize: 14, color: TEXT_SEC, marginBottom: 20, fontWeight: 500 }}>
            <span style={{ fontWeight: 800, color: TEXT }}>{filtered.length}</span> فروشگاه یافت شد
          </p>

          {/* ─── GRID ─── */}
          {filtered.length > 0 ? (
            <div className="sel-grid" style={{ marginBottom: 56 }}>
              {filtered.map((s, i) => (
                <div key={s.id} style={{ animation: `fadeUp ${0.35 + i * 0.06}s ease both` }}>
                  <SellerCard seller={s} />
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

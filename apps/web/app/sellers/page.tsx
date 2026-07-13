'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const GOLD     = '#C7A66A'
const GOLD_D   = '#9A6E38'
const GOLD_G   = 'linear-gradient(135deg,#7A4F10 0%,#C7A66A 50%,#8A6020 100%)'
const BG       = '#F7F7F5'
const TEXT     = '#1C1C1A'
const TEXT_SEC = 'rgba(28,28,26,0.52)'
const TEXT_MUT = 'rgba(28,28,26,0.32)'

/* billiard rack — 15 balls in triangle formation (coaches-style hero graphic) */
const RACK: [number, number][] = [
  [490,50],[442,133],[538,133],[394,216],[490,216],[586,216],
  [346,299],[442,299],[538,299],[634,299],
  [298,382],[394,382],[490,382],[586,382],[682,382],
]
const RACK_C = [
  '#C7A66A','#DC2626','#7C3AED','#DC2626','#C7A66A','#DC2626',
  '#C7A66A','#DC2626','#C7A66A','#DC2626',
  '#7C3AED','#DC2626','#C7A66A','#DC2626','#C7A66A',
]

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

const CATEGORY_OPTIONS = [
  { value: 'همه',          label: 'همه دسته‌ها' },
  { value: 'میز بیلیارد',  label: 'میز بیلیارد' },
  { value: 'چوب',          label: 'چوب (Cue)'   },
  { value: 'توپ',          label: 'توپ'         },
  { value: 'لوازم جانبی',  label: 'لوازم جانبی' },
  { value: 'پارچه میز',    label: 'پارچه میز'   },
] as const
const STATUS_OPTIONS = [
  { value: 'همه',          label: 'همه فروشگاه‌ها' },
  { value: 'verified',     label: 'تأیید شده'      },
  { value: 'elite',        label: 'نماینده رسمی'   },
  { value: 'top',          label: 'فروشگاه برتر'   },
] as const
const SORT_OPTIONS = [
  { value: 'rating',   label: 'بهترین امتیاز'   },
  { value: 'popular',  label: 'محبوب‌ترین'      },
  { value: 'products', label: 'بیشترین محصولات' },
  { value: 'newest',   label: 'جدیدترین'        },
] as const
type SortKey = typeof SORT_OPTIONS[number]['value']

/* مختصات تقریبی مرکز شهرها برای محاسبه‌ی نزدیک‌ترین فروشگاه */
const CITY_COORDS: Record<string, [number, number]> = {
  'تهران':  [35.6892, 51.3890],
  'اصفهان': [32.6539, 51.6660],
  'مشهد':   [36.2605, 59.6168],
  'شیراز':  [29.5918, 52.5837],
}
const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

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
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.34)', color: '#15803D', fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>
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
        <div className="sel-list-body" style={{ flex: 1, minWidth: 0, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: 0 }}>{seller.name}</h3>
            {seller.verified && <VerifiedPill />}
          </div>
          <p className="sel-list-desc" style={{ fontSize: 12.5, color: TEXT_SEC, margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{seller.description}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>{ratingRow}{metaRow}</div>
          <div className="sel-list-brands">{brandsRow}</div>
        </div>
        {/* actions */}
        <div className="sel-list-actions" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, padding: '16px 20px', flexShrink: 0, borderInlineStart: '1px solid rgba(28,28,26,0.06)' }}>
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

        {/* name + verified (verified pushed to the left so they align across cards) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, margin: '0 0 5px' }}>
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

// ── Professional dropdown ─────────────────────────────────────
function Dropdown({ label, options, value, onChange, minWidth = 150 }: {
  label?: string
  options: readonly { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  minWidth?: number
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [])
  const current = options.find(o => o.value === value) ?? options[0]!
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}
        className="dd-btn"
        style={{
          display: 'flex', alignItems: 'center', gap: 8, minWidth, padding: '9px 13px', borderRadius: 12,
          background: open ? '#fff' : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: 'Vazirmatn,Tahoma,sans-serif',
          border: open ? `1.5px solid ${GOLD}` : '1px solid rgba(28,28,26,0.1)', fontSize: 12.5, color: TEXT,
          boxShadow: open ? '0 4px 14px rgba(199,166,106,0.12)' : 'none', transition: 'all .18s',
        }}>
        {label && <span className="dd-label" style={{ color: TEXT_MUT, fontWeight: 500 }}>{label}</span>}
        <span style={{ fontWeight: 700 }}>{current.label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUT} strokeWidth="2.5" style={{ marginRight: 'auto', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div role="listbox" style={{
        position: 'absolute', insetInlineStart: 0, top: '100%', marginTop: 8, minWidth: minWidth + 20, zIndex: 90,
        background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(24px) saturate(1.8)', WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
        border: '1px solid rgba(28,28,26,0.08)', borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 16px 40px rgba(28,28,26,0.16)', transformOrigin: 'top', transition: 'all .15s',
        opacity: open ? 1 : 0, transform: open ? 'scale(1)' : 'scale(0.96)', pointerEvents: open ? 'auto' : 'none',
      }}>
        {options.map(o => {
          const sel = o.value === value
          return (
            <button key={o.value} type="button" role="option" aria-selected={sel}
              onClick={() => { onChange(o.value); setOpen(false) }}
              style={{
                display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                padding: '10px 14px', border: 'none', cursor: 'pointer', fontFamily: 'Vazirmatn,Tahoma,sans-serif', fontSize: 12.5, textAlign: 'right',
                background: sel ? 'rgba(199,166,106,0.14)' : 'transparent', color: sel ? GOLD_D : TEXT_SEC, fontWeight: sel ? 800 : 500,
              }}>
              {o.label}
              {sel && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GOLD_D} strokeWidth="2.6"><path d="M20 6L9 17l-5-5"/></svg>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function SellersPage() {
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('همه')
  const [status,   setStatus]   = useState('همه')
  const [sort,     setSort]     = useState<SortKey>('rating')
  const [view,     setView]     = useState<'grid'|'list'>('grid')

  /* نزدیک من */
  const [userLoc,   setUserLoc]   = useState<{ lat: number; lon: number } | null>(null)
  const [nearMe,    setNearMe]    = useState(false)
  const [locLoading, setLocLoading] = useState(false)
  const [locError,  setLocError]  = useState(false)

  const getLocation = () => {
    if (nearMe) { setNearMe(false); return }
    if (!navigator.geolocation) { setLocError(true); return }
    setLocLoading(true); setLocError(false)
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setNearMe(true); setLocLoading(false) },
      () => { setLocLoading(false); setLocError(true) },
      { timeout: 8000, enableHighAccuracy: false },
    )
  }

  const matchSpec = (s: typeof SELLERS[0], term: string) =>
    s.specialties.some(sp => sp.includes(term) || term.includes(sp)) || s.description.includes(term)
  const distOf = (s: typeof SELLERS[0]) => {
    const c = CITY_COORDS[s.city.split('،')[0]!.trim()]
    return userLoc && c ? calcDistance(userLoc.lat, userLoc.lon, c[0], c[1]) : undefined
  }

  const filtered = useMemo(() => {
    const list = SELLERS
      .filter(s => !search.trim() || s.name.includes(search.trim()) || s.city.includes(search.trim()) || s.brands.some(b => b.toLowerCase().includes(search.toLowerCase())) || s.specialties.some(sp => sp.includes(search.trim())))
      .filter(s => category === 'همه' || matchSpec(s, category))
      .filter(s => status === 'همه' || (status === 'verified' && s.verified) || (status === 'elite' && s.elite) || (status === 'top' && s.rating >= 4.7))
    return list.sort((a, b) => {
      if (nearMe && userLoc) { const da = distOf(a) ?? 9e9, db = distOf(b) ?? 9e9; if (da !== db) return da - db }
      if (sort === 'rating')   return b.rating - a.rating
      if (sort === 'popular')  return b.reviewCount - a.reviewCount
      if (sort === 'products') return b.productCount - a.productCount
      return b.sinceYear - a.sinceYear
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, status, sort, nearMe, userLoc])

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blob1{0%,100%{transform:translate(0,0) scale(1);}25%{transform:translate(-28px,-20px) scale(1.05);}55%{transform:translate(-10px,26px) scale(0.96);}80%{transform:translate(20px,-12px) scale(1.02);}}
        @keyframes blob2{0%,100%{transform:translate(0,0) scale(1);}20%{transform:translate(32px,20px) scale(1.04);}55%{transform:translate(44px,-26px) scale(0.92);}75%{transform:translate(10px,30px) scale(1.06);}}
        @keyframes blob3{0%,100%{transform:translate(0,0);}50%{transform:translate(-26px,-36px) scale(1.10);}}
        @keyframes rackCycle{0%{opacity:0;}6%{opacity:.42;}32%{opacity:.42;}40%{opacity:0;}100%{opacity:0;}}
        @keyframes streakA{0%{opacity:0;transform:translateX(-130%) skewX(-18deg);}15%{opacity:1;}85%{opacity:1;}100%{opacity:0;transform:translateX(230%) skewX(-18deg);}}
        @keyframes streakB{0%{opacity:0;transform:translateX(-120%) skewX(-14deg);}15%{opacity:.5;}85%{opacity:.5;}100%{opacity:0;transform:translateX(250%) skewX(-14deg);}}
        @keyframes lineReveal{from{clip-path:inset(0 0 105% 0);transform:translateY(14px);opacity:0;}to{clip-path:inset(0 0 -25% 0);transform:none;opacity:1;}}
        @keyframes scaleInX{from{opacity:0;transform:scaleX(0)}to{opacity:1;transform:scaleX(1)}}
        * { box-sizing: border-box; }
        .sel-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
        @media(max-width:1000px) { .sel-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media(max-width:600px)  { .sel-grid { grid-template-columns: 1fr !important; } }
        .sel-list { display: flex; flex-direction: column; gap: 14px; }
        .s-chip { transition: all 0.18s; }
        .s-chip:hover { opacity: 0.85; }
        .search-inp:focus { border-color: rgba(199,166,106,0.7) !important; box-shadow: 0 0 0 3px rgba(199,166,106,0.14) !important; outline: none; }
        @media(max-width:640px){
          /* لیست موبایل: افقی و جمع‌وجور مثل باشگاه‌ها (نه ستونی) */
          .sel-list-img { width: clamp(96px,28vw,128px) !important; }
          .sel-list-actions { display: none !important; }
          .sel-list-brands { display: none !important; }
          .sel-list-desc { display: none !important; }
          .sel-list-body { padding: 12px 14px !important; gap: 7px !important; }
        }
        .filt-scroll { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; }
        .filt-scroll::-webkit-scrollbar { display: none; }
        /* موبایل: حذف لیبل دراپ‌داون‌ها و جمع‌تر شدن باکس */
        @media(max-width:640px){
          .dd-label { display: none !important; }
          .dd-btn { min-width: 0 !important; padding: 9px 11px !important; }
        }
        /* more-filters drawer / sheet */
        @keyframes ovIn { from{opacity:0} to{opacity:1} }
        @keyframes drwX { from{transform:translateX(-100%)} to{transform:none} }
        @keyframes drwY { from{transform:translateY(100%)} to{transform:none} }
        .sel-drawer {
          position: absolute; z-index: 1; top: 0; bottom: 0; left: 0;
          width: min(420px, 92vw); display: flex; flex-direction: column;
          background: #FBFAF8; border-radius: 0 22px 22px 0;
          box-shadow: 0 0 60px rgba(20,18,14,0.28);
          animation: drwX .28s cubic-bezier(.22,1,.36,1);
        }
        @media(max-width:640px){
          .sel-drawer { top: auto; left: 0; right: 0; width: auto; max-height: 86vh;
            border-radius: 22px 22px 0 0; animation: drwY .3s cubic-bezier(.22,1,.36,1); }
        }
      `}</style>

      <div style={{ background: '#F7F7F5', minHeight: '100vh', direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif', color: TEXT }}>

        {/* ─────── HERO — coaches-style animated (light) ─────── */}
        <section style={{ position: 'relative', minHeight: 'clamp(150px,20vw,210px)', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          {/* aurora blobs */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', right: '-8%', top: '6%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,166,106,0.38) 0%, rgba(199,166,106,0.12) 45%, transparent 70%)', filter: 'blur(58px)', animation: 'blob1 15s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', left: '-6%', top: '18%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.20) 0%, rgba(124,58,237,0.06) 50%, transparent 72%)', filter: 'blur(54px)', animation: 'blob2 19s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', left: '38%', top: '48%', width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,166,106,0.22) 0%, transparent 68%)', filter: 'blur(42px)', animation: 'blob3 12s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', left: '4%', bottom: '-6%', width: 160, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.13) 0%, transparent 70%)', filter: 'blur(46px)' }} />
          </div>

          {/* animated billiard racks */}
          {([
            { left: '3%',  size: 224, rot: 0,   delay: '0s'  },
            { left: '25%', size: 198, rot: 140, delay: '6s'  },
            { left: '45%', size: 168, rot: 55,  delay: '12s' },
          ] as { left: string; size: number; rot: number; delay: string }[]).map((r, i) => (
            <svg key={i} style={{ position: 'absolute', left: r.left, top: '50%', width: r.size, height: r.size * 0.93, transform: `translateY(-50%) rotate(${r.rot}deg)`, pointerEvents: 'none', animation: `rackCycle 18s ${r.delay} ease-in-out infinite`, transformOrigin: 'center' }} viewBox="0 0 760 560">
              {RACK.map(([cx, cy], j) => <circle key={j} cx={cx} cy={cy} r={44} fill="none" stroke={RACK_C[j]} strokeWidth="1.5" />)}
              <line x1="0" y1="480" x2="700" y2="10" stroke={GOLD} strokeWidth="1" strokeDasharray="14 7" opacity="0.55" />
            </svg>
          ))}

          {/* light streaks */}
          <div style={{ position: 'absolute', top: '32%', left: 0, width: '50%', height: '1.5px', background: 'linear-gradient(to right,transparent,rgba(154,110,56,0.42),transparent)', transform: 'rotate(-5deg)', animation: 'streakA 12s 1s ease-in-out infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '56%', left: 0, width: '40%', height: '1px', background: 'linear-gradient(to right,transparent,rgba(154,110,56,0.28),transparent)', transform: 'rotate(-3deg)', animation: 'streakB 16s 5s ease-in-out infinite', pointerEvents: 'none' }} />

          {/* bottom fade */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: `linear-gradient(to top, ${BG}, transparent)`, pointerEvents: 'none' }} />

          {/* content */}
          <div style={{ position: 'relative', zIndex: 5, maxWidth: 1160, width: '100%', margin: '0 auto', padding: '0 clamp(20px,4vw,40px)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D, fontSize: 10.5, fontWeight: 800, borderRadius: 24, padding: '5px 13px', marginBottom: 14, letterSpacing: '0.12em', animation: 'fadeUp .5s .05s ease both' }}>
MARKET PLACE . BILLIARD HUB
            </div>

            <div style={{ overflow: 'hidden', paddingBottom: '0.14em' }}>
              <h1 style={{ fontSize: 'clamp(30px,4.6vw,52px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.045em', margin: 0, background: GOLD_G, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'lineReveal .72s .1s cubic-bezier(.4,0,.2,1) both' }}>
                فروشگاه‌های تجهیزات بیلیارد
              </h1>
            </div>

            <div style={{ transformOrigin: 'right', animation: 'scaleInX .5s .36s ease both' }}>
              <div style={{ width: 66, height: 2.5, marginTop: 9, borderRadius: 2, background: GOLD_G, boxShadow: '0 0 10px rgba(154,110,56,0.35)' }} />
            </div>

            <p style={{ fontSize: 'clamp(12.5px,1.4vw,15px)', color: TEXT_SEC, marginTop: 10, maxWidth: 440, animation: 'lineReveal .5s .46s ease both' }}>
              معتبرترین فروشندگان چوب، میز، توپ و لوازم جانبی — همه در یک جا
            </p>
          </div>
        </section>

        {/* ─────── BODY ─────── */}
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 clamp(16px,3vw,32px) 64px' }}>

          {/* ─── STICKY: search + filter, stacked under the navbar ─── */}
          <div style={{ position: 'sticky', top: 72, zIndex: 50, background: BG, paddingTop: 14, paddingBottom: 12, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* search box */}
            <div style={{ position: 'relative' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={GOLD_D} strokeWidth="2.2" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 2 }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="search-inp" type="text" placeholder="جستجوی فروشنده، شهر یا برند..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '13px 48px 13px 16px', borderRadius: 14, fontSize: 14.5,
                  background: 'rgba(255,255,255,0.86)', border: '1.5px solid rgba(28,28,26,0.1)',
                  backdropFilter: 'blur(18px) saturate(190%)', WebkitBackdropFilter: 'blur(18px) saturate(190%)',
                  boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 6px 20px rgba(28,28,26,0.07)',
                  color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif', transition: 'border-color 0.2s, box-shadow 0.2s', direction: 'rtl' }}
              />
            </div>

            {/* filter box */}
            <div className="sel-filterbar" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(28px) saturate(190%)', WebkitBackdropFilter: 'blur(28px) saturate(190%)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 16, boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 26px rgba(28,28,26,0.08)', padding: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

            {/* ۱ دسته‌بندی */}
            <Dropdown label="دسته‌بندی:" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} minWidth={150} />
            {/* ۲ مرتب‌سازی (بهترین امتیاز) */}
            <Dropdown label="نمایش بر اساس:" options={SORT_OPTIONS} value={sort} onChange={v => setSort(v as SortKey)} minWidth={160} />
            {/* ۳ وضعیت (همه فروشگاه‌ها) */}
            <Dropdown label="وضعیت:" options={STATUS_OPTIONS} value={status} onChange={setStatus} minWidth={140} />

            {/* ۴ نزدیک من */}
            <button onClick={getLocation} title={locError ? 'دسترسی به موقعیت رد شد' : 'نزدیک‌ترین فروشگاه‌ها'} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Vazirmatn,Tahoma,sans-serif', fontSize: 12.5, fontWeight: 700,
              border: nearMe ? `1.5px solid ${GOLD}` : locError ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(28,28,26,0.1)',
              background: nearMe ? 'rgba(199,166,106,0.14)' : 'rgba(255,255,255,0.7)', color: nearMe ? GOLD_D : locError ? '#ef4444' : TEXT_SEC, transition: 'all .2s',
            }}>
              {locLoading
                ? <span style={{ width: 14, height: 14, border: '2px solid rgba(199,166,106,0.3)', borderTop: `2px solid ${GOLD}`, borderRadius: '50%', display: 'inline-block', animation: 'spin .8s linear infinite' }} />
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>}
              نزدیک من
            </button>

            {/* ۵ نمای لیست / معمولی — کنار نزدیک من */}
            <div style={{ display: 'flex', gap: 4 }}>
              {([['grid', <svg key="g" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>], ['list', <svg key="l" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>]] as const).map(([v, icon]) => (
                <button key={v} onClick={() => setView(v as 'grid'|'list')} aria-label={v === 'grid' ? 'نمای شبکه‌ای' : 'نمای لیستی'} style={{
                  width: 36, height: 36, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s',
                  border: `1px solid ${view === v ? 'rgba(199,166,106,0.4)' : 'rgba(28,28,26,0.1)'}`,
                  background: view === v ? 'rgba(199,166,106,0.12)' : '#fff', color: view === v ? GOLD_D : TEXT_MUT,
                }}>{icon}</button>
              ))}
            </div>
            </div>
          </div>

          {/* ─── GRID / LIST (like clubs page) ─── */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: TEXT_MUT }}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <p style={{ fontSize: 17, fontWeight: 700, color: TEXT_SEC }}>فروشگاهی یافت نشد</p>
              <p style={{ fontSize: 14 }}>فیلترها را تغییر دهید یا جستجو را پاک کنید</p>
            </div>
          ) : view === 'grid' ? (
            <div className="sel-grid" style={{ marginBottom: 56 }}>
              {filtered.map((s, i) => (
                <div key={s.id} style={{ animation: `fadeUp ${0.3 + i * 0.05}s ease both` }}>
                  <SellerCard seller={s} view="grid" />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 56 }}>
              {filtered.map((s, i) => (
                <div key={s.id} style={{ animation: `fadeUp ${0.28 + i * 0.04}s ease both` }}>
                  <SellerCard seller={s} view="list" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

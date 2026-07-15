'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Search, LogIn, ChevronLeft } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import { SHOP_PRODUCTS } from './products'

const GOLD     = '#C7A66A'
const GOLD_BOR = 'rgba(199,166,106,0.32)'
const TEXT     = '#1C1C1A'
const TEXT_SEC = 'rgba(28,28,26,0.5)'
const TEXT_MUT = 'rgba(28,28,26,0.28)'

const LQ = {
  bg:         'rgba(255,255,255,0.55)',
  bgGold:     'rgba(199,166,106,0.13)',
  blur:       'blur(20px) saturate(1.6)',
  border:     '1px solid rgba(255,255,255,0.65)',
  borderGold: `1px solid ${GOLD_BOR}`,
  shadow:     '0 4px 24px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
  shadowGold: '0 4px 20px rgba(199,166,106,0.14), inset 0 1px 0 rgba(255,255,255,0.35)',
}

// ── Slides (گوی → توپ) ────────────────────────────────────────
const SLIDES = [
  {
    img: '/images/ads/1.gif',
    badge: 'میز اسنوکر', title: 'میزهای حرفه‌ای',
    sub: 'بهترین برندهای جهانی — ارسال به سراسر ایران',
    cta: 'مشاهده میزها', href: '/shop/category/table',
  },
  {
    img: '/images/ads/2.webp',
    badge: 'چوب بیلیارد', title: 'چوب‌های حرفه‌ای',
    sub: 'از کلاسیک تا کربن فایبر — برای هر سبک بازی',
    cta: 'مشاهده چوب‌ها', href: '/shop/category/cue',
  },
  {
    img: '/images/ads/3.webp',
    badge: 'توپ بیلیارد', title: 'توپ‌های استاندارد',
    sub: 'توپ‌های Aramith، Cyclop و سایر برندهای معتبر',
    cta: 'مشاهده توپ‌ها', href: '/shop/category/ball',
  },
  {
    img: '/images/ads/4.webp',
    badge: 'میز خانگی', title: 'بیلیارد در خانه',
    sub: 'میزهای کمپکت و زیبا برای منزل و اداره',
    cta: 'خرید میز خانگی', href: '/shop/category/table',
  },
  {
    img: '/images/ads/5.gif',
    badge: 'لوازم جانبی', title: 'اکسسوری کامل',
    sub: 'گچ، نگهدارنده، کیف چوب و بیش از ۵۰۰ محصول',
    cta: 'مشاهده لوازم', href: '/shop/category/accessory',
  },
  {
    img: '/images/ads/6.gif',
    badge: 'بیلیارد بازار', title: 'فروشگاه بیلیارد هاب',
    sub: 'همه‌ی تجهیزات بیلیارد در یک جا',
    cta: 'ورود به فروشگاه', href: '/shop',
  },
]

// ── Category definitions — modern gradient-icon style ─────────
const CATS = [
  {
    id: 'cue', label: 'چوب', g: ['#8B4513','#D2691E'],
    icon: <svg viewBox="0 0 28 28" fill="none" width={26} height={26}>
      <rect x="3" y="13" width="22" height="3" rx="1.5" fill="currentColor" transform="rotate(-38 3 13)"/>
      <rect x="18" y="4" width="7" height="3" rx="1.5" fill="currentColor" fillOpacity="0.6" transform="rotate(-38 18 4)"/>
      <rect x="2" y="19" width="5" height="4" rx="2" fill="currentColor" fillOpacity="0.4" transform="rotate(-38 2 19)"/>
    </svg>,
  },
  {
    id: 'table', label: 'میز', g: ['#1A6B3A','#28A860'],
    icon: <svg viewBox="0 0 28 28" fill="none" width={26} height={26}>
      <rect x="3" y="7" width="22" height="14" rx="3" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="3.5" cy="7.5" r="2.2" fill="currentColor"/>
      <circle cx="14" cy="7" r="2.2" fill="currentColor"/>
      <circle cx="24.5" cy="7.5" r="2.2" fill="currentColor"/>
      <circle cx="3.5" cy="20.5" r="2.2" fill="currentColor"/>
      <circle cx="14" cy="21" r="2.2" fill="currentColor"/>
      <circle cx="24.5" cy="20.5" r="2.2" fill="currentColor"/>
    </svg>,
  },
  {
    id: 'ball', label: 'توپ', g: ['#B71C1C','#E53935'],
    icon: <svg viewBox="0 0 28 28" fill="none" width={26} height={26}>
      <circle cx="14" cy="14" r="10" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M6 11 Q14 7 22 11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M6 17 Q14 13 22 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="10" cy="9" r="2" fill="currentColor" fillOpacity="0.5"/>
    </svg>,
  },
  {
    id: 'tip', label: 'تیپ', g: ['#0D47A1','#1976D2'],
    icon: <svg viewBox="0 0 28 28" fill="none" width={26} height={26}>
      <ellipse cx="14" cy="12" rx="7" ry="3" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.8"/>
      <line x1="7" y1="12" x2="7" y2="19" stroke="currentColor" strokeWidth="1.8"/>
      <line x1="21" y1="12" x2="21" y2="19" stroke="currentColor" strokeWidth="1.8"/>
      <ellipse cx="14" cy="19" rx="7" ry="3" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.8"/>
      <ellipse cx="14" cy="10.5" rx="5" ry="2" fill="currentColor" stroke="currentColor" strokeWidth="1.2"/>
    </svg>,
  },
  {
    id: 'chalk', label: 'گچ', g: ['#4A148C','#7B1FA2'],
    icon: <svg viewBox="0 0 28 28" fill="none" width={26} height={26}>
      <rect x="7" y="12" width="14" height="11" rx="2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M7 12 L10 8 L24 8 L21 12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
      <line x1="21" y1="12" x2="21" y2="23" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M9 10 Q14 7.5 20 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fillOpacity="0"/>
    </svg>,
  },
  {
    id: 'extension', label: 'اکستنشن', g: ['#004D40','#00897B'],
    icon: <svg viewBox="0 0 28 28" fill="none" width={26} height={26}>
      <line x1="3" y1="22" x2="13" y2="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="13" cy="12" r="2.5" fill="currentColor"/>
      <circle cx="18" cy="12" r="2.5" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="18" y1="12" x2="26" y2="7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <rect x="14" y="10.5" width="8" height="3" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none" fillOpacity="0"/>
    </svg>,
  },
  {
    id: 'case-bag', label: 'کیس و کیف', g: ['#4527A0','#7C4DFF'],
    icon: <svg viewBox="0 0 28 28" fill="none" width={26} height={26}>
      {/* case tube */}
      <rect x="2" y="12" width="14" height="6" rx="3" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6"/>
      <ellipse cx="2.5" cy="15" rx="1.6" ry="3" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="1.3"/>
      {/* bag */}
      <rect x="15" y="13" width="11" height="9" rx="2" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M18 13 L18 11 Q18 9 20.5 9 Q23 9 23 11 L23 13" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>,
  },
  {
    id: 'rest', label: 'رست', g: ['#1B5E20','#388E3C'],
    icon: <svg viewBox="0 0 28 28" fill="none" width={26} height={26}>
      <line x1="3" y1="25" x2="18" y2="13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="18" cy="13" r="2.2" fill="currentColor"/>
      <line x1="18" y1="13" x2="24" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18" y1="13" x2="26" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18" y1="13" x2="24" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 7 L24.5 5 L27 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>,
  },
  {
    id: 'cloth', label: 'پارچه', g: ['#006064','#00ACC1'],
    icon: <svg viewBox="0 0 28 28" fill="none" width={26} height={26}>
      <rect x="3" y="8" width="22" height="13" rx="2" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M3 12 L25 12" stroke="currentColor" strokeWidth="0.9" opacity="0.5"/>
      <path d="M3 16 L25 16" stroke="currentColor" strokeWidth="0.9" opacity="0.5"/>
      <path d="M9 8 L9 21" stroke="currentColor" strokeWidth="0.9" opacity="0.5"/>
      <path d="M16 8 L16 21" stroke="currentColor" strokeWidth="0.9" opacity="0.5"/>
      <ellipse cx="3.5" cy="14.5" rx="2" ry="6.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.4"/>
    </svg>,
  },
  {
    id: 'oil', label: 'روغن', g: ['#E65100','#F57C00'],
    icon: <svg viewBox="0 0 28 28" fill="none" width={26} height={26}>
      <path d="M11 7 L11 11 Q6 13 6 17 L6 22 Q6 24 8 24 L20 24 Q22 24 22 22 L22 17 Q22 13 17 11 L17 7 Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <rect x="11" y="5" width="6" height="3.5" rx="1.5" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M14 14 Q12 17 12 19 Q12 21.5 14 21.5 Q16 21.5 16 19 Q16 17 14 14Z" fill="currentColor" opacity="0.6"/>
    </svg>,
  },
  {
    id: 'towel', label: 'حوله', g: ['#AD1457','#D81B60'],
    icon: <svg viewBox="0 0 28 28" fill="none" width={26} height={26}>
      <rect x="5" y="7" width="18" height="5" rx="2.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.7"/>
      <rect x="5" y="14" width="18" height="5" rx="2.5" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.7"/>
      <rect x="5" y="21" width="18" height="4" rx="2" fill="currentColor" fillOpacity="0.55" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M5 9 Q14 7.5 23 9" stroke="currentColor" strokeWidth="0.8" opacity="0.45" fill="none"/>
    </svg>,
  },
  {
    id: 'clothing', label: 'پوشاک', g: ['#1A237E','#283593'],
    icon: <svg viewBox="0 0 28 28" fill="none" width={26} height={26}>
      <path d="M11 5 Q14 9 17 5 L23 9 L20 13 L20 23 L8 23 L8 13 L5 9 Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M11 5 Q14 8 17 5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
    </svg>,
  },
  {
    id: 'accessory', label: 'اکسسوری', g: ['#78550A','#B8860B'],
    icon: <svg viewBox="0 0 28 28" fill="none" width={26} height={26}>
      <path d="M8 23 L8 13 Q8 11 10 11 L12 11 L12 9 Q12 7 14 7 Q16 7 16 9 L16 11 L18 11 Q20 11 20 13 L20 23 Q20 25 14 25 Q8 25 8 23Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <line x1="12" y1="15" x2="12" y2="19" stroke="currentColor" strokeWidth="1.3" opacity="0.6"/>
      <line x1="16" y1="14" x2="16" y2="19" stroke="currentColor" strokeWidth="1.3" opacity="0.6"/>
      <path d="M8 20 Q14 22 20 20" stroke="currentColor" strokeWidth="1.3" fill="none" opacity="0.7"/>
    </svg>,
  },
  {
    id: 'other', label: 'سایر', g: ['#37474F','#546E7A'],
    icon: <svg viewBox="0 0 28 28" fill="none" width={26} height={26}>
      <circle cx="8"  cy="8"  r="2.8" fill="currentColor" opacity="0.5"/>
      <circle cx="14" cy="8"  r="2.8" fill="currentColor"/>
      <circle cx="20" cy="8"  r="2.8" fill="currentColor" opacity="0.5"/>
      <circle cx="8"  cy="14" r="2.8" fill="currentColor" opacity="0.5"/>
      <circle cx="14" cy="14" r="2.8" fill="currentColor" opacity="0.9"/>
      <circle cx="20" cy="14" r="2.8" fill="currentColor" opacity="0.5"/>
      <circle cx="8"  cy="20" r="2.8" fill="currentColor" opacity="0.35"/>
      <circle cx="14" cy="20" r="2.8" fill="currentColor" opacity="0.5"/>
      <circle cx="20" cy="20" r="2.8" fill="currentColor" opacity="0.35"/>
    </svg>,
  },
]

// ── Products: منبع واحد مشترک با صفحه‌ی جزئیات محصول ──────────
const PRODUCTS = SHOP_PRODUCTS

const parsePriceInput = (v: string) => {
  const n = parseInt(v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, ''), 10)
  return Number.isNaN(n) ? null : n
}

/* دکمه‌ی شیشه‌ای سفید — برای کنترل‌های آیکونی (بستن شیت) */
const LQ_WHITE_BTN: React.CSSProperties = {
  background: 'rgba(255,255,255,0.52)',
  backdropFilter: 'blur(40px) saturate(2.4)', WebkitBackdropFilter: 'blur(40px) saturate(2.4)',
  border: '1px solid rgba(255,255,255,0.82)',
  boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.07)',
}

function toFa(v: string | number) {
  return String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
}

// ── Shop Top Bar ──────────────────────────────────────────────
function ShopTopBar({
  searchInput, onSearchInput, onSearch, user,
}: {
  searchInput: string
  onSearchInput: (v: string) => void
  onSearch: (e: React.FormEvent) => void
  user: { firstName: string; avatar?: string | null } | null
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 150,
      background: 'rgba(255,255,255,0.82)',
      backdropFilter: 'blur(28px) saturate(1.8)',
      WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
      borderBottom: '1px solid rgba(255,255,255,0.6)',
      boxShadow: '0 1px 0 rgba(28,28,26,0.06), 0 4px 28px rgba(28,28,26,0.06)',
    }}>
      <div className="bb-row" style={{
        maxWidth: 1300, margin: '0 auto',
        padding: '0 clamp(12px,3vw,32px)',
        height: 60,
        display: 'flex', alignItems: 'center', gap: 14,
        direction: 'rtl',
      }}>
        {/* Brand */}
        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 10px rgba(199,166,106,0.28)' }}>
            <img src="/images/Logo/logo-256x256.png" alt="بیلیارد بازار" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="bb-brand" style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.03em', color: '#1C1C1A', whiteSpace: 'nowrap' }}>بیلیارد <span style={{ color: GOLD }}>هاب</span></span>
          </div>
        </Link>
        <div className="bb-divider" style={{ width: 1, height: 28, background: 'rgba(28,28,26,0.08)', flexShrink: 0 }} />
        {/* Search */}
        <form onSubmit={onSearch} className="bb-search" style={{ flex: 1, position: 'relative' }}>
          <button type="submit" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, zIndex: 2, display: 'flex', alignItems: 'center' }}>
            <Search size={16} color={focused ? GOLD : 'rgba(28,28,26,0.3)'} strokeWidth={2.2} />
          </button>
          {!searchInput && !focused && (
            <div style={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1, fontSize: 14, display: 'flex', alignItems: 'center', gap: 3, direction: 'rtl' }}>
              <span style={{ color: 'rgba(28,28,26,0.35)' }}>جستجو در بیلیارد </span>
              <span style={{ color: GOLD, opacity: 0.75, fontWeight: 600 }}>بازار</span>
            </div>
          )}
          <input
            value={searchInput}
            onChange={e => onSearchInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder=""
            style={{
              width: '100%', height: 40,
              background: focused ? 'rgba(255,255,255,0.85)' : LQ.bg,
              backdropFilter: LQ.blur, WebkitBackdropFilter: LQ.blur,
              border: focused ? `1.5px solid ${GOLD}` : LQ.border,
              borderRadius: 10, padding: '0 40px 0 14px', fontSize: 14, outline: 'none',
              boxShadow: focused ? `0 0 0 3px rgba(199,166,106,0.12),${LQ.shadow}` : LQ.shadow,
              transition: 'all 0.25s', direction: 'rtl', fontFamily: 'inherit', color: TEXT,
            }}
          />
        </form>
        {/* Auth — logged-in profile chip removed; only the guest login button remains */}
        {!user && (
          <Link href="/login" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, background: LQ.bgGold, backdropFilter: LQ.blur, WebkitBackdropFilter: LQ.blur, border: LQ.borderGold, borderRadius: 10, padding: '8px 16px', boxShadow: LQ.shadowGold, transition: 'all 0.25s' }}>
            <LogIn size={14} color={GOLD} strokeWidth={2.5} />
            <span style={{ fontSize: 13, fontWeight: 700, color: GOLD, whiteSpace: 'nowrap' }}>ورود | عضویت</span>
          </Link>
        )}
      </div>
    </div>
  )
}

// ── Hero Slider ───────────────────────────────────────────────
function HeroSlider() {
  const [active, setActive] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const next = useCallback(() => setActive(i => (i + 1) % SLIDES.length), [])
  useEffect(() => {
    timerRef.current = setTimeout(next, 4500)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [active, next])
  const slide = SLIDES[active]!
  return (
    <div className="hero-slider" style={{ position: 'relative', width: '100%', overflow: 'hidden', background: '#1C1C1A' }}>
      {SLIDES.map((s, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, opacity: i === active ? 1 : 0, transform: i === active ? 'scale(1)' : 'scale(1.025)', transition: 'opacity 0.75s ease,transform 0.75s ease', pointerEvents: i === active ? 'auto' : 'none' }}>
          <img src={s.img} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.55) saturate(0.85)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left,rgba(10,8,5,0.92) 0%,rgba(10,8,5,0.45) 50%,transparent 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(10,8,5,0.6) 0%,transparent 40%)' }} />
        </div>
      ))}
      <div style={{ paddingTop: 'clamp(220px,38vw,420px)' }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', padding: 'clamp(16px,5%,80px)', direction: 'rtl' }}>
        <div key={active} style={{ maxWidth: 460, animation: 'hsIn 0.55s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.32)', borderRadius: 100, padding: '4px 14px', marginBottom: 16, backdropFilter: 'blur(10px)' }}>
            <span style={{ fontSize: 12, color: GOLD, fontWeight: 700 }}>{slide.badge}</span>
          </div>
          <h2 style={{ fontSize: 'clamp(24px,4.5vw,46px)', fontWeight: 900, color: '#fff', margin: '0 0 12px', lineHeight: 1.15, letterSpacing: '-0.03em' }}>{slide.title}</h2>
          <p style={{ fontSize: 'clamp(13px,1.6vw,16px)', color: 'rgba(255,255,255,0.55)', margin: '0 0 28px', lineHeight: 1.8 }}>{slide.sub}</p>
          <Link href={slide.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 'clamp(5px,1.6vw,8px)', background: 'rgba(199,166,106,0.18)', backdropFilter: 'blur(20px) saturate(1.5)', WebkitBackdropFilter: 'blur(20px) saturate(1.5)', border: '1px solid rgba(199,166,106,0.5)', boxShadow: '0 8px 32px rgba(199,166,106,0.18),inset 0 1px 0 rgba(255,255,255,0.25)', color: '#fff', padding: 'clamp(8px,2.4vw,13px) clamp(14px,4vw,26px)', borderRadius: 'clamp(10px,2vw,13px)', textDecoration: 'none', fontSize: 'clamp(13px,1.6vw,14px)', fontWeight: 700, transition: 'all 0.25s' }}>
            {slide.cta}<ChevronLeft size={16} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
      {/* Dots */}
      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', gap: 6 }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ width: i === active ? 18 : 5, height: 5, borderRadius: 3, border: 'none', cursor: 'pointer', padding: 0, background: i === active ? GOLD : 'rgba(255,255,255,0.28)', backdropFilter: 'blur(8px)', boxShadow: i === active ? '0 0 8px rgba(199,166,106,0.55)' : 'none', transition: 'all 0.35s ease' }} />
        ))}
      </div>
    </div>
  )
}

// ── Categories Section ────────────────────────────────────────
function CategoriesSection({ activeCat, onPick }: { activeCat: string | null; onPick: (id: string) => void }) {
  const scrollRef  = useRef<HTMLDivElement>(null)
  const dragging   = useRef(false)
  const startX     = useRef(0)
  const scrollLeft = useRef(0)
  const [hovId, setHovId] = useState<string | null>(null)

  const onDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    e.preventDefault()
    dragging.current   = true
    startX.current     = e.pageX - scrollRef.current.offsetLeft
    scrollLeft.current = scrollRef.current.scrollLeft
    scrollRef.current.style.cursor = 'grabbing'
    const stop = () => {
      dragging.current = false
      if (scrollRef.current) scrollRef.current.style.cursor = 'grab'
      window.removeEventListener('mouseup', stop)
      window.removeEventListener('mousemove', move)
    }
    const move = (ev: MouseEvent) => {
      if (!scrollRef.current) return
      const x = ev.pageX - scrollRef.current.offsetLeft
      scrollRef.current.scrollLeft = scrollLeft.current - (x - startX.current) * 1.4
    }
    window.addEventListener('mouseup', stop)
    window.addEventListener('mousemove', move)
  }

  return (
    <div style={{ background: 'linear-gradient(140deg,#EDE9E2 0%,#F4F1EC 50%,#E8E4DD 100%)', overflow: 'visible' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '22px clamp(16px,3vw,32px) 16px', direction: 'rtl', overflow: 'visible' }}>
        <h2 style={{ fontSize: 'clamp(16px,1.7vw,21px)', fontWeight: 700, color: TEXT, marginBottom: 18 }}>دسته‌بندی‌های بیلیارد بازار</h2>
        <div
          ref={scrollRef}
          className="cat-scroll"
          onMouseDown={onDown}
          style={{ display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 12, paddingTop: 10, cursor: 'grab', userSelect: 'none' }}
        >
          {CATS.map(cat => {
            const active = activeCat === cat.id
            const hov = hovId === cat.id || active
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onPick(cat.id)}
                draggable={false}
                onMouseEnter={() => setHovId(cat.id)}
                onMouseLeave={() => setHovId(null)}
                style={{
                  textDecoration: 'none', flexShrink: 0, fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                  width: 78,
                  /* white card background removed — just the icon tile + label */
                  background: 'transparent', border: 'none', boxShadow: 'none',
                  borderRadius: 21,
                  padding: '10px 8px 6px',
                  transform: hov ? 'translateY(-5px)' : 'none',
                  transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1)',
                  cursor: 'pointer',
                  position: 'relative', overflow: 'visible',
                }}
              >
                {/* icon container — subtle tinted bg + colored border + glow */}
                <div style={{
                  width: 51, height: 51, borderRadius: 14, flexShrink: 0,
                  background: `linear-gradient(135deg,${cat.g[0]}33,${cat.g[1]}18)`,
                  border: `1px solid ${active ? cat.g[1] : `${cat.g[1]}52`}`,
                  boxShadow: hov ? `0 8px 22px ${cat.g[1]}66` : `0 4px 14px ${cat.g[1]}48`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: cat.g[1],
                  position: 'relative', zIndex: 1,
                  transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                }}>
                  <div style={{ filter: `drop-shadow(0 0 4px ${cat.g[1]}99)`, transform: 'scale(1.05)' }}>
                    {cat.icon}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: TEXT, textAlign: 'center', lineHeight: 1.3, position: 'relative', zIndex: 1 }}>
                  {cat.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Catalog Section — بخش اصلی فروش: فیلتر + مرتب‌سازی + گرید ──
type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'disc'
const SORT_OPTS: { k: SortKey; l: string }[] = [
  { k: 'newest',     l: 'جدیدترین' },
  { k: 'price-asc',  l: 'ارزان‌ترین' },
  { k: 'price-desc', l: 'گران‌ترین' },
  { k: 'disc',       l: 'بیشترین تخفیف' },
]

function BazaarSortDropdown({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [])
  const current = SORT_OPTS.find(o => o.k === value)!
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button" onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}
        className="lq-lift"
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10,
          background: 'rgba(199,166,106,0.12)',
          border: open ? '1px solid rgba(199,166,106,0.55)' : '1px solid rgba(199,166,106,0.34)',
          fontSize: 13, color: '#9A6E38', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <span className="bz-sort-label" style={{ color: 'rgba(154,110,56,0.72)', fontWeight: 600 }}>مرتب‌سازی:</span>
        <span style={{ fontWeight: 700 }}>{current.l}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', color: '#9A6E38' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      <div role="listbox" style={{
        position: 'absolute', insetInlineStart: 0, top: '100%', marginTop: 8, width: 200, zIndex: 60,
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(24px) saturate(1.8)', WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
        border: '1px solid rgba(255,255,255,0.7)', borderRadius: 14, overflow: 'hidden',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 16px 40px rgba(28,28,26,0.16)',
        transformOrigin: 'top', transition: 'all .15s',
        opacity: open ? 1 : 0, transform: open ? 'scale(1)' : 'scale(0.95)', pointerEvents: open ? 'auto' : 'none',
      }}>
        {SORT_OPTS.map(o => {
          const selected = o.k === value
          return (
            <button
              key={o.k} type="button" role="option" aria-selected={selected}
              onClick={() => { onChange(o.k); setOpen(false) }}
              style={{
                display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 15px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                background: selected ? 'rgba(199,166,106,0.12)' : 'transparent',
                border: selected ? '1px solid rgba(199,166,106,0.40)' : '1px solid transparent',
                color: selected ? '#9A6E38' : TEXT, fontWeight: selected ? 800 : 500, textAlign: 'right',
              }}
            >
              {o.l}
              {selected && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A6E38" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface CatalogFilters {
  cats: Set<string>; sellers: Set<string>
  priceFrom: string; priceTo: string; discOnly: boolean
  minRating: number | null
}

function CatalogSection({
  products, filters, setFilters, sort, setSort,
}: {
  products: typeof PRODUCTS
  filters: CatalogFilters
  setFilters: React.Dispatch<React.SetStateAction<CatalogFilters>>
  sort: SortKey
  setSort: (v: SortKey) => void
}) {
  const fmt = (n: number) => toFa(n.toLocaleString('fa-IR'))
  const [sheetOpen, setSheetOpen]     = useState(false)
  const [sellerQuery, setSellerQuery] = useState('')
  const [sellerOpen, setSellerOpen]   = useState(false)

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sheetOpen])

  const toggle = (key: 'cats' | 'sellers', v: string) =>
    setFilters(f => {
      const next = new Set(f[key])
      if (next.has(v)) next.delete(v); else next.add(v)
      return { ...f, [key]: next }
    })

  const clearAll = () => setFilters({ cats: new Set(), sellers: new Set(), priceFrom: '', priceTo: '', discOnly: false, minRating: null })

  const catCounts: Record<string, number> = {}
  products.forEach(p => { const c = (p as { cat?: string }).cat ?? 'other'; catCounts[c] = (catCounts[c] ?? 0) + 1 })
  const sellerNames = Array.from(new Set(products.map(p => p.sellerName)))

  const visible = (() => {
    const from = parsePriceInput(filters.priceFrom)
    const to   = parsePriceInput(filters.priceTo)
    const list = products.filter(p => {
      const c = (p as { cat?: string }).cat ?? 'other'
      if (filters.cats.size && !filters.cats.has(c)) return false
      if (filters.sellers.size && !filters.sellers.has(p.sellerName)) return false
      if (filters.discOnly && !(p.disc > 0)) return false
      if (filters.minRating !== null && p.rating < filters.minRating) return false
      if (from !== null && p.price < from) return false
      if (to !== null && p.price > to) return false
      return true
    })
    const sorted = [...list]
    if (sort === 'price-asc')  sorted.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price)
    if (sort === 'disc')       sorted.sort((a, b) => b.disc - a.disc)
    return sorted
  })()

  const activeCount =
    filters.cats.size + filters.sellers.size + (filters.discOnly ? 1 : 0) +
    (filters.priceFrom ? 1 : 0) + (filters.priceTo ? 1 : 0) + (filters.minRating !== null ? 1 : 0)

  const sellerMatches = sellerNames.filter(sn => !sellerQuery.trim() || sn.includes(sellerQuery.trim()))

  const panelCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(24px) saturate(1.8)', WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
    border: '1px solid rgba(255,255,255,0.75)', borderRadius: 18,
    boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 28px rgba(28,28,26,0.07)',
    padding: '16px 16px 14px',
  }
  const rowLabel: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9,
    fontSize: 13, color: 'rgba(28,28,26,0.62)', cursor: 'pointer',
  }
  const checkbox: React.CSSProperties = { width: 15, height: 15, accentColor: '#A07840', cursor: 'pointer' }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 10, fontSize: 12.5, outline: 'none',
    background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.85)',
    boxShadow: 'inset 0 1.5px 3px rgba(28,28,26,0.06)', fontFamily: 'inherit', color: TEXT, direction: 'rtl',
    fontVariantNumeric: 'tabular-nums',
  }

  const FilterBlocks = (
    <>
      {/* دسته‌بندی */}
      <div style={panelCard}>
        <h4 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 12px', color: TEXT }}>دسته‌بندی</h4>
        {CATS.map(c => (
          <label key={c.id} style={rowLabel}>
            <input type="checkbox" style={checkbox} checked={filters.cats.has(c.id)} onChange={() => toggle('cats', c.id)} />
            {c.label}
            <span style={{ marginRight: 'auto', fontSize: 11.5, color: TEXT_MUT, fontVariantNumeric: 'tabular-nums' }}>
              {toFa(catCounts[c.id] ?? 0)}
            </span>
          </label>
        ))}
      </div>

      {/* قیمت */}
      <div style={panelCard}>
        <h4 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 12px', color: TEXT }}>محدوده قیمت (تومان)</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={inputStyle} placeholder="از" value={filters.priceFrom} onChange={e => setFilters(f => ({ ...f, priceFrom: e.target.value }))} />
          <input style={inputStyle} placeholder="تا" value={filters.priceTo} onChange={e => setFilters(f => ({ ...f, priceTo: e.target.value }))} />
        </div>
      </div>

      {/* فروشنده — دراپ‌داون قابل‌جستجو (مناسب صدها فروشگاه) */}
      <div style={panelCard}>
        <h4 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 12px', color: TEXT }}>فروشنده</h4>

        {/* چیپ‌های انتخاب‌شده */}
        {filters.sellers.size > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {[...filters.sellers].map(sn => (
              <button key={sn} type="button" onClick={() => toggle('sellers', sn)} className="lq-lift"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                  background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.40)', color: '#9A6E38' }}>
                {sn}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            ))}
          </div>
        )}

        {/* ورودی جستجو */}
        <div style={{ position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUT} strokeWidth="2" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          <input
            value={sellerQuery}
            onChange={e => { setSellerQuery(e.target.value); setSellerOpen(true) }}
            onFocus={() => setSellerOpen(true)}
            placeholder="جستجوی فروشنده..."
            style={{ ...inputStyle, padding: '8px 32px 8px 10px' }}
          />
        </div>

        {/* لیست کشویی */}
        {sellerOpen && (
          <div style={{ marginTop: 8, maxHeight: 176, overflowY: 'auto', borderRadius: 10, border: '1px solid rgba(28,28,26,0.08)', background: 'rgba(255,255,255,0.6)' }}>
            {sellerMatches.length === 0 ? (
              <div style={{ padding: '12px 12px', fontSize: 12, color: TEXT_MUT, textAlign: 'center' }}>فروشنده‌ای پیدا نشد</div>
            ) : sellerMatches.map(sn => {
              const on = filters.sellers.has(sn)
              return (
                <button key={sn} type="button" onClick={() => toggle('sellers', sn)}
                  style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 9, padding: '8px 11px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, textAlign: 'right',
                    background: on ? 'rgba(199,166,106,0.12)' : 'transparent', color: on ? '#9A6E38' : 'rgba(28,28,26,0.68)', fontWeight: on ? 700 : 500 }}>
                  <span style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: on ? '#A07840' : 'transparent', border: on ? 'none' : '1.5px solid rgba(28,28,26,0.22)' }}>
                    {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                  </span>
                  {sn}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* امتیاز */}
      <div style={panelCard}>
        <h4 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 12px', color: TEXT }}>حداقل امتیاز</h4>
        {[4.5, 4].map(r => {
          const on = filters.minRating === r
          return (
            <label key={r} style={rowLabel} onClick={() => setFilters(f => ({ ...f, minRating: f.minRating === r ? null : r }))}>
              <span style={{ width: 15, height: 15, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: on ? '4px solid #A07840' : '1.5px solid rgba(28,28,26,0.25)' }} />
              <span style={{ color: '#D9A441', letterSpacing: '-1px' }}>★★★★★</span>
              <span style={{ marginRight: 'auto', fontSize: 11.5, color: TEXT_MUT, fontVariantNumeric: 'tabular-nums' }}>{toFa(r.toString().replace('.', '٫'))}+</span>
            </label>
          )
        })}
      </div>

      {/* تخفیف + پاک کردن */}
      <div style={panelCard}>
        <label style={{ ...rowLabel, marginBottom: 0 }}>
          <input type="checkbox" style={checkbox} checked={filters.discOnly} onChange={() => setFilters(f => ({ ...f, discOnly: !f.discOnly }))} />
          فقط کالاهای تخفیف‌دار
        </label>
        {activeCount > 0 && (
          <button type="button" onClick={clearAll} className="lq-lift" style={{ marginTop: 12, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', borderRadius: 10, cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: '#9A6E38', fontFamily: 'inherit', padding: '7px 12px' }}>
            پاک کردن همه فیلترها ({toFa(activeCount)})
          </button>
        )}
      </div>
    </>
  )

  return (
    <div id="bazaar-catalog" style={{ background: 'linear-gradient(to bottom,#E8E4DD 0,#E8E4DD clamp(130px,16vw,190px),#F7F6F4 clamp(220px,26vw,300px),#F7F6F4 100%)' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '28px clamp(16px,3vw,32px) 44px', direction: 'rtl' }}>

        {/* toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: 0 }}>محصولات بیلیارد بازار</h2>
            <span style={{ fontSize: 12.5, color: TEXT_SEC, fontVariantNumeric: 'tabular-nums' }}>{toFa(visible.length)} کالا</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* فیلتر موبایل */}
            <button
              type="button" onClick={() => setSheetOpen(true)} className="bz-filterbtn lq-lift"
              style={{
                alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10,
                background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)',
                fontSize: 13, color: '#9A6E38', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
              فیلترها
              {activeCount > 0 && (
                <span style={{ minWidth: 17, height: 17, borderRadius: 9, background: `linear-gradient(135deg,${GOLD},#A07840)`, color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                  {toFa(activeCount)}
                </span>
              )}
            </button>
            <BazaarSortDropdown value={sort} onChange={setSort}/>
            <Link href="/shop/new" className="lq-lift" style={{ fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 10, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: '#9A6E38' }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
              ثبت محصول
            </Link>
          </div>
        </div>

        {/* layout: سایدبار + گرید */}
        <div className="bz-catalog">
          <aside className="bz-sidebar" style={{ position: 'sticky', top: 76, alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FilterBlocks}
          </aside>

          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }} className="bz-grid">
              {visible.map(p => (
                <Link key={p.id} href={`/shop/${p.id}`} className="prod-card" style={{ textDecoration: 'none', background: '#fff', borderRadius: 14, border: '1.5px solid rgba(28,28,26,0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: '100%', paddingTop: '100%', position: 'relative', background: '#F4F3F1', overflow: 'hidden', borderBottom: '1.5px solid rgba(28,28,26,0.18)' }}>
                    <img src={p.img} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    {p.disc > 0 && (
                      <div style={{ position: 'absolute', top: 8, left: 8, background: '#E53935', color: '#fff', fontSize: 12, fontWeight: 800, borderRadius: 7, padding: '2px 7px' }}>
                        {toFa(p.disc)}٪
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '10px 10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 13.2, color: TEXT, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</span>
                    <span style={{ fontSize: 11.5, color: TEXT_MUT }}>{p.sellerName}</span>
                    <div style={{ marginTop: 'auto' }}>
                      {p.disc > 0 && (
                        <div style={{ fontSize: 12, color: TEXT_SEC, textDecoration: 'line-through', marginBottom: 2 }}>
                          {fmt(p.old)} تومان
                        </div>
                      )}
                      <div style={{ fontSize: 14.3, fontWeight: 800, color: '#1A6B3A' }}>
                        {fmt(p.price)} <span style={{ fontSize: 12, fontWeight: 500 }}>تومان</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {visible.length === 0 && (
              <div style={{ ...panelCard, textAlign: 'center', padding: '48px 20px', fontSize: 13.5, color: TEXT_SEC }}>
                کالایی با این فیلترها پیدا نشد.
                <button type="button" onClick={clearAll} className="lq-lift" style={{ marginRight: 8, display: 'inline-block', background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#9A6E38', fontFamily: 'inherit', padding: '6px 14px' }}>
                  پاک کردن فیلترها
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* شیت فیلتر موبایل */}
      {sheetOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
          <div onClick={() => setSheetOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}/>
          <div style={{ position: 'absolute', insetInline: 0, bottom: 0, maxHeight: '82vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', background: '#F7F6F4', padding: '14px 18px 24px', direction: 'rtl' }}>
            <div style={{ width: 40, height: 4, borderRadius: 4, background: 'rgba(28,28,26,0.14)', margin: '0 auto 12px' }}/>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: TEXT }}>فیلترها</h3>
              <button type="button" aria-label="بستن" onClick={() => setSheetOpen(false)} className="lq-lift" style={{ width: 36, height: 36, borderRadius: 12, ...LQ_WHITE_BTN, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {FilterBlocks}
            </div>
            <button
              type="button" onClick={() => setSheetOpen(false)} className="lq-lift"
              style={{ marginTop: 14, width: '100%', padding: '13px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: '#9A6E38' }}
            >
              مشاهده {toFa(visible.length)} کالا
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Deals Section ─────────────────────────────────────────────
const DEAL_PRODUCTS = [...PRODUCTS, ...PRODUCTS].slice(0, 12)

function DealsSection() {
  const INIT = 9 * 3600 + 20 * 60 + 19
  const [rem, setRem] = useState(INIT)
  const scrollRef  = useRef<HTMLDivElement>(null)
  const startX     = useRef(0)
  const scrollLeft = useRef(0)
  const dragging   = useRef(false)

  useEffect(() => {
    const t = setInterval(() => setRem(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  const h  = Math.floor(rem / 3600)
  const m  = Math.floor((rem % 3600) / 60)
  const s  = rem % 60
  const pad = (n: number) => toFa(String(n).padStart(2, '0'))
  const fmt = (n: number) => toFa(n.toLocaleString('fa-IR'))

  const scroll = (dir: 'next' | 'prev') => {
    scrollRef.current?.scrollBy({ left: dir === 'next' ? 520 : -520, behavior: 'smooth' })
  }
  const onDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    e.preventDefault()
    dragging.current   = true
    startX.current     = e.pageX - scrollRef.current.offsetLeft
    scrollLeft.current = scrollRef.current.scrollLeft
    scrollRef.current.style.cursor = 'grabbing'
    const stop = () => {
      dragging.current = false
      if (scrollRef.current) scrollRef.current.style.cursor = 'grab'
      window.removeEventListener('mouseup', stop)
      window.removeEventListener('mousemove', move)
    }
    const move = (ev: MouseEvent) => {
      if (!scrollRef.current) return
      const x = ev.pageX - scrollRef.current.offsetLeft
      scrollRef.current.scrollLeft = scrollLeft.current - (x - startX.current) * 1.4
    }
    window.addEventListener('mouseup', stop)
    window.addEventListener('mousemove', move)
  }

  return (
    <div style={{ background: '#fff', borderBottom: '1px solid rgba(28,28,26,0.07)' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 clamp(16px,3vw,32px)', direction: 'rtl' }}>
        {/* ── header ── */}
        <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(28,28,26,0.07)' }}>
          {/* RIGHT side: arrows */}
          <div style={{ display: 'flex', gap: 5 }}>
            {(['prev','next'] as const).map(dir => (
              <button key={dir} onClick={() => scroll(dir)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(28,28,26,0.13)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 16 16" fill="none" width={13} height={13}>
                  <path d={dir === 'prev' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'} stroke={TEXT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>
          {/* LEFT side: زمان باقیمانده (right) + clock (left) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SEC }}>زمان باقیمانده</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1C1C1A', borderRadius: 8, padding: '5px 12px' }}>
              <svg viewBox="0 0 18 18" fill="none" width={14} height={14}>
                <circle cx="9" cy="9" r="7.5" stroke="#C7A66A" strokeWidth="1.5"/>
                <line x1="9" y1="9" x2="9" y2="4.5" stroke="#C7A66A" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="9" y1="9" x2="12" y2="11" stroke="#C7A66A" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums', direction: 'ltr' }}>
                {pad(h)}:{pad(m)}:{pad(s)}
              </span>
            </div>
          </div>
        </div>
        {/* ── cards row ── */}
        <div
          ref={scrollRef}
          className="cat-scroll"
          onMouseDown={onDown}
          style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', cursor: 'grab', userSelect: 'none', padding: '14px 2px' }}
        >
          {/* ── BILLIARD PARTY promo card ── */}
          <Link href="/shop/party" draggable={false} style={{
            textDecoration: 'none', flexShrink: 0,
            width: 155, borderRadius: 14,
            background: 'linear-gradient(155deg,#1A0A30 0%,#2E1060 35%,#6B2FA0 65%,#C7690A 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '22px 12px 18px', gap: 0,
            position: 'relative', overflow: 'hidden',
            border: '1.5px solid rgba(199,166,106,0.45)',
            boxShadow: '0 6px 28px rgba(100,30,160,0.45), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}>
            {/* rays SVG */}
            <svg viewBox="0 0 160 160" width={160} height={160} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-54%)', opacity: 0.18, pointerEvents: 'none' }}>
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i * 30) * Math.PI / 180
                return <line key={i} x1={80} y1={80} x2={80 + Math.cos(a) * 90} y2={80 + Math.sin(a) * 90} stroke="#FFE566" strokeWidth="1.5" />
              })}
            </svg>
            {/* top glow */}
            <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 120, height: 80, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(255,210,0,0.28) 0%,transparent 70%)', pointerEvents: 'none' }} />
            {/* 3D % badge */}
            <div style={{ position: 'relative', zIndex: 2, marginBottom: 10,
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(145deg,#2A1400 0%,#0D0D10 100%)',
              border: '1.5px solid rgba(255,190,30,0.5)',
              boxShadow: 'inset 0 -3px 8px rgba(255,160,0,0.35), inset 0 2px 4px rgba(255,255,255,0.08), 0 6px 20px rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontSize: 26, fontWeight: 900, lineHeight: 1,
                background: 'linear-gradient(160deg,#FFE566 0%,#FFAA00 45%,#FF6500 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))',
                fontFamily: "'Playfair Display', Georgia, serif",
              }}>%</span>
            </div>
            {/* text */}
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', lineHeight: 1.1 }}>
              <div style={{
                fontSize: 16, fontWeight: 700, fontStyle: 'italic',
                fontFamily: "'Playfair Display', Georgia, serif",
                background: 'linear-gradient(90deg,#FFD580,#FFB347)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                letterSpacing: '0.01em', marginBottom: 3,
              }}>بیلیارد</div>
              <div style={{
                fontSize: 28, fontWeight: 900, fontStyle: 'italic',
                fontFamily: "'Playfair Display', Georgia, serif",
                background: 'linear-gradient(150deg,#fff 0%,#FFE8A0 55%,#FFC200 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                filter: 'drop-shadow(0 2px 8px rgba(255,160,0,0.55))',
                letterSpacing: '-0.01em',
              }}>پارتی</div>
            </div>
            {/* cta */}
            <div style={{ position: 'relative', zIndex: 2, marginTop: 14,
              fontSize: 10, fontWeight: 700, color: '#1C1C1A',
              background: 'linear-gradient(90deg,#FFE566,#FFAA00)',
              borderRadius: 20, padding: '4px 12px',
              display: 'flex', alignItems: 'center', gap: 2,
              boxShadow: '0 2px 8px rgba(255,160,0,0.4)',
            }}>
              مشاهده همه
              <ChevronLeft size={10} strokeWidth={2.5}/>
            </div>
          </Link>

          {/* deal product cards */}
          {DEAL_PRODUCTS.map((p, i) => (
            <Link key={`${p.id}-${i}`} href={`/shop/${p.id}`} draggable={false} className="prod-card" style={{
              textDecoration: 'none', flexShrink: 0, width: 158, borderRadius: 12,
              background: '#fff', display: 'flex', flexDirection: 'column',
              border: '1.5px solid rgba(28,28,26,0.13)',
              overflow: 'hidden',
            }}>
              <div style={{ width: '100%', paddingTop: '100%', position: 'relative', background: '#F8F7F5', overflow: 'hidden', borderBottom: '1.5px solid rgba(28,28,26,0.1)' }}>
                <img src={p.img} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                {p.disc > 0 && (
                  <div style={{ position: 'absolute', top: 8, left: 8, background: '#E53935', color: '#fff', fontSize: 11, fontWeight: 800, borderRadius: 7, padding: '2px 7px' }}>
                    {toFa(p.disc)}٪
                  </div>
                )}
              </div>
              <div style={{ padding: '10px 10px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 12, color: TEXT, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</span>
                <div style={{ marginTop: 'auto' }}>
                  {p.disc > 0 && (
                    <div style={{ fontSize: 11, color: TEXT_SEC, textDecoration: 'line-through', marginBottom: 1 }}>
                      {fmt(p.old)} تومان
                    </div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1A6B3A' }}>
                    {fmt(p.price)} <span style={{ fontSize: 10, fontWeight: 500 }}>تومان</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Ad Banners ─────────────────────────────────────────────────
const AD_BANNERS = [
  { img: '/images/shop/cue_billiard_2.jpg',  title: 'چوب‌های اصل', sub: 'اینجا پیدا میشه!',        cta: 'خرید',      href: '/shop/category/cue',       overlay: 'linear-gradient(135deg,rgba(80,35,5,0.72),rgba(160,90,20,0.52))' },
  { img: '/images/shop/Pro_table.jpg',        title: 'به‌وقت با هم بودن', sub: 'میزهای حرفه‌ای',   cta: 'خرید',      href: '/shop/category/table',     overlay: 'linear-gradient(135deg,rgba(5,50,20,0.70),rgba(20,100,50,0.48))' },
  { img: '/images/shop/Ball-1.jpg',           title: 'هر توپ یک قهرمانی', sub: 'Aramith · Cyclop', cta: 'خرید',      href: '/shop/category/ball',      overlay: 'linear-gradient(135deg,rgba(100,10,10,0.72),rgba(200,40,40,0.46))' },
  { img: '/images/shop/accessori.png',        title: 'تجهیزات کامل',  sub: 'لوازم جانبی حرفه‌ای',  cta: 'مشاهده',   href: '/shop/category/accessory', overlay: 'linear-gradient(135deg,rgba(100,70,5,0.72),rgba(199,166,106,0.5))' },
]

function AdBanners() {
  return (
    <div style={{ background: '#F7F6F4', padding: '20px 0' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 clamp(16px,3vw,32px)', direction: 'rtl' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }} className="banner-grid">
          {AD_BANNERS.map((b, i) => (
            <Link key={i} href={b.href} className="banner-card" style={{
              textDecoration: 'none', borderRadius: 14, overflow: 'hidden',
              height: 150, position: 'relative', display: 'block',
              border: '1.5px solid rgba(28,28,26,0.1)',
            }}>
              <img src={b.img} alt={b.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: b.overlay }} />
              <div style={{ position: 'absolute', inset: 0, padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.3, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{b.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 3, fontWeight: 500 }}>{b.sub}</div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', color: '#1C1C1A', fontSize: 12, fontWeight: 700, borderRadius: 8, padding: '5px 12px', alignSelf: 'flex-start' }}>
                  {b.cta}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Newest Section ────────────────────────────────────────────
function NewestSection({ products }: { products: typeof PRODUCTS }) {
  const fmt = (n: number) => toFa(n.toLocaleString('fa-IR'))
  const newestProducts = [...products].reverse()
  return (
    <div style={{ background: '#fff' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '28px clamp(16px,3vw,32px) 40px', direction: 'rtl' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: 0 }}>جدیدترین‌ها</h2>
          <Link href="/shop/newest" style={{ fontSize: 13, color: GOLD, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
            مشاهده همه
            <ChevronLeft size={13} strokeWidth={2.5} />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }} className="prod-grid">
          {newestProducts.map(p => (
            <Link key={`new-${p.id}`} href={`/shop/${p.id}`} draggable={false} className="prod-card" style={{ textDecoration: 'none', background: '#fff', borderRadius: 14, border: '1.5px solid rgba(28,28,26,0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '100%', paddingTop: '100%', position: 'relative', background: '#F4F3F1', overflow: 'hidden', borderBottom: '1.5px solid rgba(28,28,26,0.18)' }}>
                <img src={p.img} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
                {p.disc > 0 && (
                  <div style={{ position: 'absolute', top: 8, left: 8, background: '#E53935', color: '#fff', fontSize: 11, fontWeight: 800, borderRadius: 7, padding: '2px 7px' }}>
                    {toFa(p.disc)}٪
                  </div>
                )}
              </div>
              <div style={{ padding: '10px 10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, color: TEXT, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</span>
                <div style={{ marginTop: 'auto' }}>
                  {p.disc > 0 && (
                    <div style={{ fontSize: 11, color: TEXT_SEC, textDecoration: 'line-through', marginBottom: 2 }}>
                      {fmt(p.old)} تومان
                    </div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1A6B3A' }}>
                    {fmt(p.price)} <span style={{ fontSize: 11, fontWeight: 500 }}>تومان</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Dual Banner Sliders ────────────────────────────────────────
const DUAL_BANNERS = [
  {
    slides: [
      { img: '/images/shop/cue_billiard_2.jpg', title: 'چوب‌های اصل', sub: 'از کلاسیک تا کربن فایبر', overlay: 'linear-gradient(to top,rgba(50,20,0,0.88) 0%,rgba(50,20,0,0.25) 55%,transparent 100%)' },
      { img: '/images/shop/cue_billiard.jpg',   title: 'چوب کربن فایبر', sub: 'سبک · مقاوم · دقیق',    overlay: 'linear-gradient(to top,rgba(10,25,60,0.88) 0%,rgba(10,25,60,0.25) 55%,transparent 100%)' },
      { img: '/images/shop/pool_chalk_1.jpg',   title: 'گچ و لوازم جانبی', sub: 'کامل‌ترین انتخاب',   overlay: 'linear-gradient(to top,rgba(40,5,55,0.88) 0%,rgba(40,5,55,0.25) 55%,transparent 100%)' },
    ],
    href: '/shop/category/cue',
    cta: 'مشاهده',
  },
  {
    slides: [
      { img: '/images/shop/Pro_table.jpg',      title: 'میزهای حرفه‌ای',  sub: 'برای کلاب و مسابقه',     overlay: 'linear-gradient(to top,rgba(5,40,18,0.88) 0%,rgba(5,40,18,0.25) 55%,transparent 100%)' },
      { img: '/images/shop/Home_table.jpg',     title: 'میز خانگی',       sub: 'طراحی زیبا · قیمت مناسب', overlay: 'linear-gradient(to top,rgba(40,18,5,0.88) 0%,rgba(40,18,5,0.25) 55%,transparent 100%)' },
      { img: '/images/shop/snooker-table.jpg',  title: 'میز اسنوکر',      sub: 'استاندارد WPBSA',          overlay: 'linear-gradient(to top,rgba(5,18,50,0.88) 0%,rgba(5,18,50,0.25) 55%,transparent 100%)' },
    ],
    href: '/shop/category/table',
    cta: 'مشاهده',
  },
]

function BannerSlideCard({ banner }: { banner: typeof DUAL_BANNERS[0] }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % banner.slides.length), 3500)
    return () => clearInterval(t)
  }, [banner.slides.length])

  const slide = banner.slides[idx] ?? banner.slides[0]
  if (!slide) return null

  return (
    <div style={{ flex: 1, minWidth: 0, borderRadius: 16, overflow: 'hidden', position: 'relative', height: 216, border: '1.5px solid rgba(28,28,26,0.10)' }}>
      {/* slides */}
      {banner.slides.map((s, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, opacity: i === idx ? 1 : 0, transition: 'opacity 0.7s ease' }}>
          <img src={s.img} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
          <div style={{ position: 'absolute', inset: 0, background: s.overlay }} />
        </div>
      ))}
      {/* text + cta */}
      <div style={{ position: 'absolute', inset: 0, padding: '0 18px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', direction: 'rtl' }}>
        <div style={{ fontSize: 19, fontWeight: 900, color: '#fff', lineHeight: 1.25, textShadow: '0 2px 10px rgba(0,0,0,0.5)', transition: 'opacity 0.4s', opacity: 1 }}>{slide.title}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', marginTop: 5, marginBottom: 14, fontWeight: 500 }}>{slide.sub}</div>
        <Link href={banner.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', color: '#1C1C1A', fontSize: 12, fontWeight: 700, borderRadius: 8, padding: '6px 14px', textDecoration: 'none', alignSelf: 'flex-start' }}>
          {banner.cta}
          <ChevronLeft size={12} strokeWidth={2.5} />
        </Link>
      </div>
      {/* dots */}
      <div style={{ position: 'absolute', bottom: 14, right: 0, left: 0, display: 'flex', justifyContent: 'center', gap: 5, zIndex: 2 }}>
        {banner.slides.map((_, i) => (
          <div key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 3, background: i === idx ? '#fff' : 'rgba(255,255,255,0.42)', transition: 'width 0.35s, background 0.35s', cursor: 'pointer' }} />
        ))}
      </div>
    </div>
  )
}

function DualBannerSection() {
  return (
    <div style={{ background: '#F7F6F4', borderBottom: '1px solid rgba(28,28,26,0.07)' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '20px clamp(16px,3vw,32px)', direction: 'rtl' }}>
        <div style={{ display: 'flex', gap: 12 }} className="dual-banner">
          {DUAL_BANNERS.map((b, i) => <BannerSlideCard key={i} banner={b} />)}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function ShopPage() {
  const [searchInput, setSearchInput] = useState('')
  const [userProds, setUserProds] = useState<typeof PRODUCTS>([])
  const user      = useAuthStore(s => s.user)

  /* فیلترهای کاتالوگ اصلی */
  const [filters, setFilters] = useState<CatalogFilters>({
    cats: new Set(), sellers: new Set(), priceFrom: '', priceTo: '', discOnly: false, minRating: null,
  })
  const [sort, setSort] = useState<SortKey>('newest')

  /* کلیک روی چیپ دسته‌بندی → فیلتر همان دسته + اسکرول به کاتالوگ */
  const pickCategory = (id: string) => {
    setFilters(f => {
      const isActive = f.cats.size === 1 && f.cats.has(id)
      return { ...f, cats: isActive ? new Set() : new Set([id]) }
    })
    document.getElementById('bazaar-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const activeSingleCat = filters.cats.size === 1 ? [...filters.cats][0]! : null

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('userProducts') ?? '[]')
      if (Array.isArray(stored) && stored.length > 0) setUserProds(stored)
    } catch { /* ignore */ }
  }, [])

  const allProducts = [...userProds, ...PRODUCTS]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      window.location.href = `/shop/search?q=${encodeURIComponent(searchInput.trim())}`
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,900&display=swap');
        @keyframes hsIn { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:none} }
        * { box-sizing: border-box; }
        .hero-slider { height: clamp(220px,38vw,420px); }
        .cat-scroll::-webkit-scrollbar { display: none; }
        .prod-grid { grid-template-columns: repeat(6,1fr) !important; }
        @media(max-width:1100px) { .prod-grid { grid-template-columns: repeat(4,1fr) !important; } }
        @media(max-width:700px)  { .prod-grid { grid-template-columns: repeat(2,1fr) !important; } }
        .prod-card { transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s; }
        .prod-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(28,28,26,0.12) !important; }
        .banner-grid { grid-template-columns: repeat(4,1fr) !important; }
        @media(max-width:900px) { .banner-grid { grid-template-columns: repeat(2,1fr) !important; } }
        .banner-card { transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s; }
        .banner-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(28,28,26,0.16) !important; }
        @media(max-width:600px) { .dual-banner { flex-direction: column !important; } }
        @media(max-width:600px) {
          .bb-divider { display: none !important; }
          .hero-slider { height: clamp(190px,56vw,320px) !important; }
        }
        /* موبایل: سرچ در ردیف کامل دوم — دیگر له یا نصفه نمی‌شود */
        @media(max-width:640px) {
          .bb-row    { height: auto !important; flex-wrap: wrap; padding-top: 9px !important; padding-bottom: 10px !important; row-gap: 9px; }
          .bb-search { order: 10; flex: 0 0 100% !important; }
        }
        /* کاتالوگ اصلی بازار */
        .bz-catalog { display: grid; grid-template-columns: 252px 1fr; gap: 24px; }
        @media(max-width:900px) {
          .bz-catalog { grid-template-columns: 1fr !important; }
          .bz-sidebar { display: none !important; }
        }
        .bz-filterbtn { display: none !important; }
        @media(max-width:900px) { .bz-filterbtn { display: flex !important; } }
        /* موبایل: برچسب «مرتب‌سازی:» حذف تا «ثبت محصول» کنارش جا شود */
        @media(max-width:640px) { .bz-sort-label { display: none !important; } }
        .bz-grid { grid-template-columns: repeat(5,1fr) !important; }
        @media(max-width:1100px) { .bz-grid { grid-template-columns: repeat(4,1fr) !important; } }
        @media(max-width:700px)  { .bz-grid { grid-template-columns: repeat(2,1fr) !important; } }
        /* دکمه‌ی LQ: جاروی نور + لیفت */
        .lq-sheen { position: relative; overflow: hidden; }
        .lq-sheen::after {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          transform: translateX(-160%) skewX(-15deg);
          background: linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.55) 50%, transparent 60%);
        }
        .lq-sheen:hover::after { transition: transform .65s ease; transform: translateX(200%) skewX(-15deg); }
        .lq-lift { transition: all .3s cubic-bezier(0.22,1,0.36,1); }
        .lq-lift:hover { transform: translateY(-2px); }
        .lq-lift:active { transform: scale(0.96); }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5' }}>
        <ShopTopBar
          searchInput={searchInput}
          onSearchInput={setSearchInput}
          onSearch={handleSearch}
          user={user}
        />
        <HeroSlider />
        <CategoriesSection activeCat={activeSingleCat} onPick={pickCategory} />
        <CatalogSection
          products={allProducts}
          filters={filters}
          setFilters={setFilters}
          sort={sort}
          setSort={setSort}
        />
        <DealsSection />
        <AdBanners />
        <NewestSection products={allProducts} />
        <DualBannerSection />
      </div>
    </>
  )
}

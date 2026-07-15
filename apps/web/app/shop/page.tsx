'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Search, LogIn, ChevronLeft, Timer, LayoutGrid } from 'lucide-react'
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
    id: 'cue-case', label: 'کیس', g: ['#4527A0','#7C4DFF'],
    icon: <svg viewBox="0 0 28 28" fill="none" width={26} height={26}>
      {/* لوله‌ی کیس چوب */}
      <rect x="4" y="11" width="21" height="7" rx="3.5" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6"/>
      <ellipse cx="5" cy="14.5" rx="1.8" ry="3.5" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M12 11 L12 18" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.55"/>
      <path d="M19 8 L19 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.7"/>
    </svg>,
  },
  {
    id: 'ball-bag', label: 'کیف توپ', g: ['#00695C','#26A69A'],
    icon: <svg viewBox="0 0 28 28" fill="none" width={26} height={26}>
      {/* کیف توپ */}
      <rect x="5" y="11" width="18" height="12" rx="2.5" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M10 11 L10 8.5 Q10 6 14 6 Q18 6 18 8.5 L18 11" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <circle cx="14" cy="17" r="3.2" fill="currentColor" fillOpacity="0.45" stroke="currentColor" strokeWidth="1.3"/>
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
        <Link href="/" className="bb-brandlink" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 10px rgba(199,166,106,0.28)' }}>
            <img src="/images/Logo/logo-256x256.png" alt="بیلیارد بازار" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="bb-brand" style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.03em', color: '#1C1C1A', whiteSpace: 'nowrap' }}>بیلیارد <span style={{ color: GOLD }}>هاب</span></span>
          </div>
        </Link>
        {/* دسته‌بندی‌ها — فقط موبایل، روبه‌روی برند. اسکرول نرم به باکس دسته‌بندی‌ها */}
        <button
          type="button"
          className="bb-cats"
          onClick={() => document.getElementById('bazaar-categories')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          style={{
            alignItems: 'center', gap: 7, flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit',
            background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)',
            borderRadius: 10, padding: '8px 12px',
          }}
        >
          <LayoutGrid size={15} color="#9A6E38" strokeWidth={2.2} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#9A6E38', whiteSpace: 'nowrap' }}>دسته‌بندی‌ها</span>
        </button>
        {/* شکستِ خط در موبایل: برند+دسته‌بندی‌ها ردیف اول، سرچ+ورود ردیف دوم */}
        <div className="bb-break" aria-hidden />
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
          <Link href="/login" className="bb-auth" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, background: LQ.bgGold, backdropFilter: LQ.blur, WebkitBackdropFilter: LQ.blur, border: LQ.borderGold, borderRadius: 10, padding: '8px 16px', boxShadow: LQ.shadowGold, transition: 'all 0.25s' }}>
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
  return (
    <div className="hero-slider" style={{ position: 'relative', width: '100%', overflow: 'hidden', background: '#1C1C1A' }}>
      {SLIDES.map((s, i) => (
        <Link key={i} href={s.href} style={{ position: 'absolute', inset: 0, display: 'block', opacity: i === active ? 1 : 0, transform: i === active ? 'scale(1)' : 'scale(1.025)', transition: 'opacity 0.75s ease,transform 0.75s ease', pointerEvents: i === active ? 'auto' : 'none' }}>
          <img src={s.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Link>
      ))}
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
    <div id="bazaar-categories" style={{ background: '#fff', overflow: 'visible', scrollMarginTop: 110 }}>
      {/* بالا: ۲۰px پدینگ AdBanners + ۲۸ = ۴۸ | پایین: ۲۰ + ۲۸px پدینگ NewestSection = ۴۸
          (فاصله‌ی باکس با سکشن بالا و پایین، در هر دو طرف قرینه) */}
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '28px clamp(16px,3vw,32px) 20px', direction: 'rtl', overflow: 'visible' }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(28,28,26,0.06)', boxShadow: '0 1px 6px rgba(28,28,26,0.05)', padding: '2px 10px', overflow: 'hidden' }}>
        <div
          ref={scrollRef}
          className="cat-scroll"
          onMouseDown={onDown}
          style={{ display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 8, paddingTop: 6, cursor: 'grab', userSelect: 'none' }}
        >
          {CATS.map(cat => {
            const active = activeCat === cat.id
            const hov = hovId === cat.id || active
            return (
              <button
                key={cat.id}
                type="button"
                className="cat-tile"
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
                {/* تست: دایره برداشته شد — زمینه/بوردر/گلوی دایره حذف، فقط خودِ ایکون.
                   ابعاد ۶۲×۶۲ نگه داشته شد تا چیدمان و جای برچسب تکان نخورد. */}
                <div className="cat-icn" style={{
                  width: 62, height: 62, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: cat.g[1],
                  position: 'relative', zIndex: 1,
                  opacity: active ? 1 : 0.9,
                  transition: 'opacity 0.3s ease',
                }}>
                  {/* ۱.۵ = ۱.۲۵ + ۲۰٪ — ایکونِ پایه ۲۶px است ⇒ ۳۹px، داخل کادر ۶۲px جا می‌شود */}
                  <div className="cat-icn-in" style={{ filter: `drop-shadow(0 0 4px ${cat.g[1]}99)`, transform: 'scale(1.5)' }}>
                    {cat.icon}
                  </div>
                </div>
                <span className="cat-lbl" style={{ fontSize: 14.5, fontWeight: 700, color: TEXT, textAlign: 'center', lineHeight: 1.3, position: 'relative', zIndex: 1 }}>
                  {cat.label}
                </span>
              </button>
            )
          })}
        </div>
        </div>
      </div>
    </div>
  )
}

// ── Countdown — تایمر معکوس چرخه‌ای بالای کارت‌های محصول ──
const WEEK_MS = 7 * 24 * 3600 * 1000
const DAY_MS  = 24 * 3600 * 1000
/* لنگر چرخه: شمارش معکوس که از این تاریخ تکرار می‌شود (هیچ‌وقت منقضی نمی‌شود) */
const CYCLE_ANCHOR = Date.UTC(2026, 6, 15, 0, 0, 0)

function WeeklyCountdown({ onScroll, cycleMs = WEEK_MS }: { onScroll: (dir: 'prev' | 'next') => void; cycleMs?: number }) {
  /* مقدار اولیه ثابت است تا SSR و کلاینت یکی باشند؛ بعد از mount مقدار واقعی محاسبه می‌شود */
  const [rem, setRem] = useState(Math.floor(cycleMs / 1000))

  useEffect(() => {
    const tick = () => {
      const now = Date.now()
      // همیشه مرزِ بعدیِ چرخه ⇒ مقدار باقی‌مانده همیشه بین ۰ و طول چرخه است
      const target = CYCLE_ANCHOR + (Math.floor((now - CYCLE_ANCHOR) / cycleMs) + 1) * cycleMs
      setRem(Math.max(0, Math.floor((target - now) / 1000)))
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [cycleMs])

  const pad2 = (n: number) => toFa(String(n).padStart(2, '0'))
  /* عرض ثابت برای هر عدد ⇒ با عوض‌شدن ثانیه هیچ‌چیز تکان نمی‌خورد و فاصله‌ها قرینه می‌ماند */
  const numBox: React.CSSProperties = { display: 'inline-block', minWidth: 20, textAlign: 'center' }
  /* چرخه‌ی ۲۴ ساعته روز ندارد ⇒ ساعت تا ۲۴ می‌رود و خانه‌ی روز نمایش داده نمی‌شود */
  const showDays = cycleMs > DAY_MS
  const d = Math.floor(rem / 86400)
  const h = showDays ? Math.floor((rem % 86400) / 3600) : Math.floor(rem / 3600)
  const m = Math.floor((rem % 3600) / 60)
  const s = rem % 60

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap', margin: '42px 0 24px' }}>
      {/* برچسب — سمت راستِ تایمر */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span className="bz-blink" style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, boxShadow: `0 0 8px ${GOLD}`, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SEC, whiteSpace: 'nowrap' }}>زمان باقیمانده</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_SEC, marginInlineStart: -3 }}>:</span>
      </div>
      {/* همه‌ی اعداد در یک باکس — طرح LQ — روز:ساعت:دقیقه:ثانیه */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', borderRadius: 7, padding: '5px 12px' }}>
        <span style={{ fontSize: 15.4, fontWeight: 500, color: '#9A6E38', letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums', direction: 'ltr', flexShrink: 0 }}>
          {showDays && <><span style={numBox}>{pad2(d)}</span>:</>}
          <span style={numBox}>{pad2(h)}</span>:<span style={numBox}>{pad2(m)}</span>:<span style={numBox}>{pad2(s)}</span>
        </span>
        {/* خط جداکننده — کل ارتفاع دکمه (marginBlock منفی پدینگ عمودی را خنثی می‌کند) */}
        <span style={{ width: 1, alignSelf: 'stretch', marginBlock: -5, background: 'rgba(154,110,56,0.38)', flexShrink: 0 }} />
        {/* marginInlineEnd منفی = در RTL کمی به سمت چپ (لبه‌ی باکس) */}
        <Timer size={21.8} color="#F5C518" strokeWidth={2.2} style={{ flexShrink: 0, marginInlineEnd: -6 }} />
      </div>
      {/* فلش‌های اسکرول کارت‌ها — سمت چپ */}
      <div style={{ display: 'flex', gap: 5 }}>
        {(['prev', 'next'] as const).map(dir => (
          <button
            key={dir} type="button" onClick={() => onScroll(dir)}
            aria-label={dir === 'prev' ? 'کارت‌های قبلی' : 'کارت‌های بعدی'}
            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(28,28,26,0.13)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg viewBox="0 0 16 16" fill="none" width={13} height={13}>
              {/* در RTL اولین فرزند سمت راست است ⇒ prev فلشِ راست‌رو و next فلشِ چپ‌رو می‌گیرد تا سرها پشت‌به‌هم (رو به بیرون) باشند */}
              <path d={dir === 'prev' ? 'M6 3l5 5-5 5' : 'M10 3L5 8l5 5'} stroke={TEXT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Catalog Section — بخش اصلی فروش: فیلتر + مرتب‌سازی + گرید ──
/* پوستر «هفته‌های بیلیاردی» — کارت اول ردیف محصولات.
   نسبت تصویر ۱:۱٫۸۶۶ و کارت ۱:۲٫۲ است؛ با contain چیزی برش نمی‌خورد و
   نوار بالا/پایین با زردِ خودِ پوستر (نمونه‌برداری‌شده) یکی می‌شود. */
const PARTY_POSTER    = '/images/bazzar/week.png'
const PARTY_POSTER_BG = '#FDB805'
/* حداکثر محصولِ نمایش‌داده‌شده بین دو پوستر */
const CATALOG_LIMIT = 10

/* ── فیزیک اسکرول کاروسل — کشیدن + اینرسی + حالت فنری در دو انتها ──────────────
   scrollLeftِ بومی دست‌نخورده می‌ماند تا position:sticky کارت زرد کار کند؛ کششِ اضافه
   از دو سر با transform روی خودِ اسکرول‌پورت شبیه‌سازی می‌شود (transform روی خودِ
   اسکرول‌پورت به sticky دست نمی‌زند، چون sticky نسبت به همین اسکرول‌پورت حساب می‌شود).
   نکته‌ی RTL: scrollLeft بین ‎-(scrollWidth-clientWidth) (انتها) و ۰ (ابتدا) است. */
const MAX_OVER = 90                                              // بیشترین کششِ فنری (px)
const DECAY    = 0.998                                           // اصطکاکِ اینرسی، به ازای هر میلی‌ثانیه
/* میرایی: هرچه بیشتر بکشی، کمتر جلو می‌رود — به MAX_OVER نزدیک می‌شود ولی هرگز رد نمی‌کند */
const rubber = (x: number) => (MAX_OVER * x) / (x + MAX_OVER)

function useDragScroll() {
  const ref       = useRef<HTMLDivElement>(null)
  const dragged   = useRef(false)   // آیا واقعاً کشیده شد؟ (نه فقط یک کلیک ساده)
  const startX    = useRef(0)
  const startLeft = useRef(0)
  const lastX     = useRef(0)
  const lastT     = useRef(0)
  const vel       = useRef(0)       // px بر میلی‌ثانیه
  const over      = useRef(0)       // کششِ فعلی از دو سر (px)
  const raf       = useRef(0)

  const setOver = (v: number) => {
    over.current = v
    const el = ref.current
    if (el) el.style.transform = v ? `translateX(${v.toFixed(2)}px)` : ''
  }
  const limits = () => {
    const el = ref.current
    if (!el) return { min: 0, max: 0 }
    return { min: -(el.scrollWidth - el.clientWidth), max: 0 }
  }
  const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = 0 }

  /* بعد از رها کردن ماوس: اول اینرسی، و اگر به انتها خوردیم انرژی باقی‌مانده به کششِ فنری تبدیل و برگردانده می‌شود */
  const glide = () => {
    const el = ref.current
    if (!el) return
    let prev = performance.now()
    const step = (now: number) => {
      const dt = Math.min(32, now - prev)   // سقف dt تا با افت فریم پرش نکند
      prev = now
      if (over.current !== 0) {
        const next = over.current * Math.pow(0.82, dt / 16)
        setOver(Math.abs(next) < 0.5 ? 0 : next)
        if (over.current === 0) { raf.current = 0; return }
      } else {
        vel.current *= Math.pow(DECAY, dt)
        if (Math.abs(vel.current) < 0.015) { raf.current = 0; return }
        const { min, max } = limits()
        const next = el.scrollLeft + vel.current * dt
        if (next <= min || next >= max) {
          el.scrollLeft = next <= min ? min : max
          setOver((vel.current > 0 ? -1 : 1) * rubber(Math.abs(vel.current) * 30))
          vel.current = 0
        } else el.scrollLeft = next
      }
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }

  const onDown = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    e.preventDefault()
    stop()
    dragged.current   = false
    vel.current       = 0
    startX.current    = e.pageX
    startLeft.current = el.scrollLeft
    lastX.current     = e.pageX
    lastT.current     = performance.now()
    el.style.cursor   = 'grabbing'

    const move = (ev: MouseEvent) => {
      const el = ref.current
      if (!el) return
      const dx = ev.pageX - startX.current
      if (Math.abs(dx) > 5) dragged.current = true   // آستانه‌ی ۵px
      const now = performance.now()
      const dt  = now - lastT.current
      if (dt > 0) vel.current = ((ev.pageX - lastX.current) / dt) * -1.4
      lastX.current = ev.pageX
      lastT.current = now

      const { min, max } = limits()
      const target = startLeft.current - dx * 1.4
      if (target > max)      { el.scrollLeft = max; setOver(-rubber(target - max)) }   // از ابتدا رد شدیم
      else if (target < min) { el.scrollLeft = min; setOver(rubber(min - target)) }    // از انتها رد شدیم
      else                   { el.scrollLeft = target; if (over.current) setOver(0) }
    }
    const up = () => {
      if (ref.current) ref.current.style.cursor = 'grab'
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      glide()
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  /* بعد از کشیدن، کلیکِ ناشی از رها کردنِ ماوس نباید صفحه‌ی محصول را باز کند */
  const onClickCapture = (e: React.MouseEvent) => {
    if (dragged.current) { e.preventDefault(); e.stopPropagation() }
  }
  const scrollBy = (dir: 'prev' | 'next') => {
    stop()
    ref.current?.scrollBy({ left: dir === 'next' ? 520 : -520, behavior: 'smooth' })
  }

  useEffect(() => stop, [])   // پاک‌سازی rAF هنگام unmount

  return { ref, onDown, onClickCapture, scrollBy }
}

/* کارت پوستر — اولِ ردیف با «مشاهده همه»، آخرِ ردیف با فلش */
function PartyPosterCard({ href, variant }: { href: string; variant: 'cta' | 'arrow' }) {
  return (
    <Link href={href} draggable={false} className={`bz-scroll-card${variant === 'cta' ? ' bz-sticky-first' : ''}`} style={{
      textDecoration: 'none', flexShrink: 0, borderRadius: 10, overflow: 'hidden',
      /* کارت اول می‌چسبد (آفست و z-index از کلاس bz-sticky-first می‌آید)؛ کارت آخر عادی است.
         sticky هم مثل relative برای فرزندانِ absolute کانتینینگ‌بلاک می‌سازد. */
      position: variant === 'cta' ? 'sticky' : 'relative',
      display: 'block', background: PARTY_POSTER_BG, border: '1.5px solid rgba(150,100,0,0.22)',
    }}>
      <img
        src={PARTY_POSTER} alt="هفته‌های بیلیاردی — تخفیف‌های این هفته" draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
      {variant === 'cta' ? (
        <span style={{
          position: 'absolute', bottom: 16, insetInline: 0, zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          fontSize: 12.5, fontWeight: 500, color: '#5A3200',
        }}>
          مشاهده همه
          <ChevronLeft size={13} strokeWidth={2.2} />
        </span>
      ) : (
        /* فلش — کادر و آیکونِ خاکستریِ واضح */
        <span style={{ position: 'absolute', bottom: 26, insetInline: 0, zIndex: 2, display: 'flex', justifyContent: 'center' }}>
          <span style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'rgba(255,255,255,0.5)', border: '1.5px solid rgba(28,28,26,0.38)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 16 16" fill="none" width={15} height={15}>
              <path d="M10 3L5 8l5 5" stroke="rgba(28,28,26,0.62)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>
      )}
    </Link>
  )
}

/* پوسترهای آگهی زیر کارت‌های کاتالوگ — ۲ ردیف × ۲ ستون */
const CATALOG_AD_POSTERS = [
  { img: '/images/ads/3.webp', href: '/shop/category/table' },
  { img: '/images/ads/4.webp', href: '/shop/category/cue' },
  { img: '/images/ads/2.webp', href: '/shop/category/ball' },
  { img: '/images/ads/6.gif',  href: '/shop/category/accessory' },
]

type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'disc'

interface CatalogFilters {
  cats: Set<string>; sellers: Set<string>
  priceFrom: string; priceTo: string; discOnly: boolean
  minRating: number | null
}

function CatalogSection({
  products, filters, sort,
}: {
  products: typeof PRODUCTS
  filters: CatalogFilters
  setFilters: React.Dispatch<React.SetStateAction<CatalogFilters>>
  sort: SortKey
  setSort: (v: SortKey) => void
}) {
  const fmt = (n: number) => toFa(n.toLocaleString('fa-IR'))

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

  const panelCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(24px) saturate(1.8)', WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
    border: '1px solid rgba(255,255,255,0.75)', borderRadius: 18,
    boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 28px rgba(28,28,26,0.07)',
    padding: '16px 16px 14px',
  }

  const { ref: scrollRef, onDown, onClickCapture, scrollBy } = useDragScroll()

  return (
    <div id="bazaar-catalog" style={{ background: '#fff' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '10px clamp(16px,3vw,32px) 40px', direction: 'rtl' }}>


        <WeeklyCountdown onScroll={scrollBy} />

        {/* گرید محصولات */}
        <div className="bz-catalog">
          <div>
            <div ref={scrollRef} onMouseDown={onDown} onClickCapture={onClickCapture} className="bz-grid" style={{ display: 'flex', gap: 21, overflowX: 'auto', scrollbarWidth: 'none', cursor: 'grab', userSelect: 'none', paddingBottom: 8 }}>

              {/* پوستر — کارت اول از سمت راست */}
              <PartyPosterCard href="/shop" variant="cta" />

              {visible.slice(0, CATALOG_LIMIT).map(p => (
                <Link key={p.id} href={`/shop/${p.id}`} draggable={false} className="prod-card bz-scroll-card" style={{ textDecoration: 'none', background: '#fff', borderRadius: 10, border: '1.5px solid rgba(28,28,26,0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                  <div style={{ width: '100%', flex: '0 0 60%', position: 'relative', background: '#F4F3F1', overflow: 'hidden', borderBottom: '1.5px solid rgba(28,28,26,0.18)' }}>
                    <img src={p.img} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="pc-body" style={{ padding: '10px 10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span className="pc-name" style={{ fontSize: 14.5, color: TEXT, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</span>
                    <span style={{ fontSize: 12.65, color: TEXT_MUT }}>{p.sellerName}</span>
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {p.disc > 0 && (
                        <span className="pc-disc" dir="ltr" style={{ background: '#b400ae', color: '#fff', fontSize: 16, fontWeight: 800, borderRadius: 999, padding: '4px 10px 2px', lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          ٪{toFa(p.disc)}
                        </span>
                      )}
                      <div style={{ marginInlineStart: 'auto', textAlign: 'right' }}>
                        {p.disc > 0 && (
                          <div style={{ fontSize: 12.3, color: TEXT_SEC, textDecoration: 'line-through', lineHeight: 1.1, marginTop: 3, marginBottom: -3 }}>
                            {fmt(p.old)}
                          </div>
                        )}
                        <div style={{ fontSize: 15.5, fontWeight: 800, color: TEXT }}>
                          {fmt(p.price)} <span style={{ fontSize: 10.6, fontWeight: 500, color: TEXT_SEC }}>تومان</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {/* پوستر — کارت آخر (سمت چپ) با فلش. TODO: مقصد نهایی را کاربر بعداً مشخص می‌کند */}
              <PartyPosterCard href="/shop" variant="arrow" />
            </div>

            {visible.length === 0 && (
              <div style={{ ...panelCard, textAlign: 'center', padding: '48px 20px', fontSize: 13.5, color: TEXT_SEC }}>
                کالایی یافت نشد.
              </div>
            )}

            {/* پوسترهای آگهی — ۲ ردیف × ۲ ستون */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginTop: 18 }}>
              {CATALOG_AD_POSTERS.map((ad, i) => (
                <Link key={i} href={ad.href} className="cat-ad-poster" style={{ display: 'block', borderRadius: 12, overflow: 'hidden', border: '1.5px solid rgba(28,28,26,0.1)', lineHeight: 0 }}>
                  <img src={ad.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Deals Section ─────────────────────────────────────────────
const DEAL_PRODUCTS = [...PRODUCTS, ...PRODUCTS].slice(0, 12)

/* کارت «بیلیارد پارتی» — مثل PartyPosterCard در sec1 دو حالت دارد:
   cta = کارت اول از راست، arrow = کارت آخر (سمت چپ) */
function PartyPromoCard({ href, variant }: { href: string; variant: 'cta' | 'arrow' }) {
  return (
    <Link href={href} draggable={false} className="bz-scroll-card" style={{
      textDecoration: 'none', flexShrink: 0,
      borderRadius: 10,
      background: 'linear-gradient(155deg,#1A0A30 0%,#2E1060 35%,#6B2FA0 65%,#C7690A 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '22px 12px 18px', gap: 0,
      position: 'relative', overflow: 'hidden',
      border: '1.5px solid rgba(199,166,106,0.45)',
      boxShadow: '0 2px 8px rgba(100,30,160,0.14), inset 0 1px 0 rgba(255,255,255,0.1)',
    }}>
      {/* rays SVG */}
      <svg viewBox="0 0 160 160" width={160} height={160} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-54%)', opacity: 0.18, pointerEvents: 'none' }}>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30) * Math.PI / 180
          /* گرد می‌کنیم چون Math.cos/sin در Node و مرورگر در رقم‌های آخر فرق دارند ⇒ hydration mismatch */
          const r = (v: number) => Math.round(v * 1000) / 1000
          return <line key={i} x1={80} y1={80} x2={r(80 + Math.cos(a) * 90)} y2={r(80 + Math.sin(a) * 90)} stroke="#FFE566" strokeWidth="1.5" />
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
      {/* پایین کارت — مثل sec1: «مشاهده همه» یا فلش */}
      {variant === 'cta' ? (
        <span style={{
          position: 'absolute', bottom: 26, insetInline: 0, zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          fontSize: 12.5, fontWeight: 500, color: '#FFE8A0',
        }}>
          مشاهده همه
          <ChevronLeft size={13} strokeWidth={2.2} />
        </span>
      ) : (
        <span style={{ position: 'absolute', bottom: 26, insetInline: 0, zIndex: 2, display: 'flex', justifyContent: 'center' }}>
          <span style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 16 16" fill="none" width={15} height={15}>
              <path d="M10 3L5 8l5 5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>
      )}
    </Link>
  )
}

function DealsSection() {
  const fmt = (n: number) => toFa(n.toLocaleString('fa-IR'))

  const { ref: scrollRef, onDown, onClickCapture, scrollBy } = useDragScroll()

  return (
    <div style={{ background: '#fff' }}>
      {/* پدینگ پایین صفر است تا فاصله‌ی کارت‌ها تا بنرهای تبلیغاتی همان ۱۸px سکشن sec1 شود
          (۱۸px از پدینگ بالای AdBanners می‌آید) */}
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '10px clamp(16px,3vw,32px) 0', direction: 'rtl' }}>

        <WeeklyCountdown onScroll={scrollBy} cycleMs={DAY_MS} />

        {/* گرید محصولات */}
        <div className="bz-catalog">
          <div>
            <div ref={scrollRef} onMouseDown={onDown} onClickCapture={onClickCapture} className="bz-grid" style={{ display: 'flex', gap: 21, overflowX: 'auto', scrollbarWidth: 'none', cursor: 'grab', userSelect: 'none', paddingBottom: 8 }}>

          {/* بیلیارد پارتی — کارت اول از سمت راست */}
          <PartyPromoCard href="/shop/party" variant="cta" />

          {/* deal product cards — دقیقاً همان مارک‌آپ کارت‌های sec1 */}
          {DEAL_PRODUCTS.map((p, i) => (
            <Link key={`${p.id}-${i}`} href={`/shop/${p.id}`} draggable={false} className="prod-card bz-scroll-card" style={{ textDecoration: 'none', background: '#fff', borderRadius: 10, border: '1.5px solid rgba(28,28,26,0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ width: '100%', flex: '0 0 60%', position: 'relative', background: '#F4F3F1', overflow: 'hidden', borderBottom: '1.5px solid rgba(28,28,26,0.18)' }}>
                <img src={p.img} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="pc-body" style={{ padding: '10px 10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="pc-name" style={{ fontSize: 14.5, color: TEXT, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</span>
                <span style={{ fontSize: 12.65, color: TEXT_MUT }}>{p.sellerName}</span>
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {p.disc > 0 && (
                    <span className="pc-disc" dir="ltr" style={{ background: '#b400ae', color: '#fff', fontSize: 16, fontWeight: 800, borderRadius: 999, padding: '4px 10px 2px', lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      ٪{toFa(p.disc)}
                    </span>
                  )}
                  <div style={{ marginInlineStart: 'auto', textAlign: 'right' }}>
                    {p.disc > 0 && (
                      <div style={{ fontSize: 12.3, color: TEXT_SEC, textDecoration: 'line-through', lineHeight: 1.1, marginTop: 3, marginBottom: -3 }}>
                        {fmt(p.old)}
                      </div>
                    )}
                    <div style={{ fontSize: 15.5, fontWeight: 800, color: TEXT }}>
                      {fmt(p.price)} <span style={{ fontSize: 10.6, fontWeight: 500, color: TEXT_SEC }}>تومان</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* بیلیارد پارتی — کارت آخر (سمت چپ) با فلش. TODO: مقصد نهایی را کاربر بعداً مشخص می‌کند */}
          <PartyPromoCard href="/shop/party" variant="arrow" />
            </div>
          </div>
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
  /* ۱۸px بالا = همان فاصله‌ی کارت‌ها تا پوسترهای آگهی در sec1 */
  return (
    <div style={{ background: '#fff', padding: '18px 0 20px' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 clamp(16px,3vw,32px)', direction: 'rtl' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }} className="banner-grid">
          {AD_BANNERS.map((b, i) => (
            <Link key={i} href={b.href} className="banner-card" style={{
              textDecoration: 'none', borderRadius: 14, overflow: 'hidden',
              height: 135, position: 'relative', display: 'block',
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
      {/* پدینگ پایین صفر است تا فاصله‌ی کارت‌ها تا بنرهای تبلیغاتیِ زیرش همان ۱۸px سکشن sec1 شود
          (۱۸px از پدینگ بالای DualBannerSection می‌آید) */}
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '28px clamp(16px,3vw,32px) 0', direction: 'rtl' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: TEXT, margin: 0 }}>جدید ترین ها</h2>
          {/* دکمه — طرح LQ، دقیقاً هم‌رنگ و هم‌فرمِ دکمه‌ی تایمر (radius ۷ و padding یکسان) */}
          <Link href="/shop/newest" style={{
            fontSize: 13, fontWeight: 500, color: '#9A6E38', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 3,
            background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)',
            borderRadius: 7, padding: '5px 12px',
          }}>
            مشاهده همه
            <ChevronLeft size={13} strokeWidth={2.2} />
          </Link>
        </div>
        {/* گرید و چندسطری می‌ماند (بدون اسکرول افقی)، ولی کارت‌ها دقیقاً هم‌اندازه و هم‌فونتِ sec1 هستند.
            عرض ستون‌ها از .prod-grid می‌آید که همان ۱۷۶/۱۴۵px کارت‌های sec1 است.
            gap واحد ⇒ فاصله‌ی بالا/پایین دقیقاً برابرِ فاصله‌ی چپ/راست.
            space-between فقط در موبایل اثر دارد (آنجا ستون‌ها عرضِ ثابت دارند) تا ته سطر جای خالی نماند. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 22.8, justifyContent: 'space-between' }} className="prod-grid">
          {/* aspectRatio ۲.۰۳۷ = ۲.۱۴۴ × ۰.۹۵ — ۵٪ کوتاه‌تر (عرض ثابت مانده، پس کلِ کاهش روی ارتفاع می‌نشیند) */}
          {newestProducts.map(p => (
            <Link key={`new-${p.id}`} href={`/shop/${p.id}`} draggable={false} className="prod-card" style={{ textDecoration: 'none', background: '#fff', borderRadius: 10, border: '1.5px solid rgba(28,28,26,0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column', aspectRatio: '1 / 2.037' }}>
              <div style={{ width: '100%', flex: '0 0 60%', position: 'relative', background: '#F4F3F1', overflow: 'hidden', borderBottom: '1.5px solid rgba(28,28,26,0.18)' }}>
                <img src={p.img} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
              </div>
              <div className="pc-body" style={{ padding: '10px 10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="pc-name" style={{ fontSize: 14.5, color: TEXT, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</span>
                <span style={{ fontSize: 12.65, color: TEXT_MUT }}>{p.sellerName}</span>
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {p.disc > 0 && (
                    <span className="pc-disc" dir="ltr" style={{ background: '#b400ae', color: '#fff', fontSize: 16, fontWeight: 800, borderRadius: 999, padding: '4px 10px 2px', lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      ٪{toFa(p.disc)}
                    </span>
                  )}
                  <div style={{ marginInlineStart: 'auto', textAlign: 'right' }}>
                    {p.disc > 0 && (
                      <div style={{ fontSize: 12.3, color: TEXT_SEC, textDecoration: 'line-through', lineHeight: 1.1, marginTop: 3, marginBottom: -3 }}>
                        {fmt(p.old)}
                      </div>
                    )}
                    <div style={{ fontSize: 15.5, fontWeight: 800, color: TEXT }}>
                      {fmt(p.price)} <span style={{ fontSize: 10.6, fontWeight: 500, color: TEXT_SEC }}>تومان</span>
                    </div>
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
    <div style={{ flex: 1, minWidth: 0, borderRadius: 16, overflow: 'hidden', position: 'relative', height: 173, border: '1.5px solid rgba(28,28,26,0.10)' }}>
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
    <div style={{ background: '#fff', borderBottom: '1px solid rgba(28,28,26,0.07)' }}>
      {/* ۱۸px بالا = همان فاصله‌ی کارت‌ها تا پوسترهای آگهی در sec1 */}
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '18px clamp(16px,3vw,32px) 20px', direction: 'rtl' }}>
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
        .hero-slider { aspect-ratio: 2048 / 421; }
        .cat-scroll::-webkit-scrollbar { display: none; }
        @keyframes bzBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.18; } }
        .bz-blink { animation: bzBlink 1.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .bz-blink { animation: none; } }
        /* کارت‌های «جدیدترین‌ها» هم‌اندازه‌ی کارت‌های کاتالوگ (۱۶۸px دسکتاپ / ۱۳۸px موبایل) */
        /* ۶ ستونِ ۱fr به‌جای عرضِ ثابت: با gap ۲۲.۸ در عرضِ کاملِ کانتینر (۱۲۳۶) هر کارت دقیقاً ۱۸۷px
           می‌شود و چون ۱fr همه‌ی فضا را می‌خورد، فاصله‌ی افقی هم دقیقاً ۲۲.۸ می‌ماند — یعنی برابرِ
           فاصله‌ی عمودی. (با عرضِ ثابت + space-between فاصله‌ی افقی محاسباتی می‌شد و با عمودی فرق داشت.) */
        .prod-grid { grid-template-columns: repeat(6, 1fr) !important; }
        /* موبایل: ۲ ستونِ ۱fr به‌جای عرضِ ثابتِ ۱۴۵px. با عرضِ ثابت + space-between کلِ فضای اضافه
           می‌ریخت توی همان یک فاصله (روی گوشی ۳۶۰px حدود ۳۸px شکاف). حالا فاصله ثابتِ ۱۴px است و
           کارت خودش پهن می‌شود تا سطر را پر کند (۳۶۰px ⇒ کارت ۱۵۷px). */
        @media(max-width:700px)  {
          .prod-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 14px !important; }
          /* ۱.۶۵۴ = ۱.۷۴۱ منهای ۵٪ (روی‌هم ۱۹٪ کوتاه‌تر از ۲.۰۳۷ دسکتاپ) — فقط موبایل و فقط
             کارت‌های «جدید ترین ها». سلکتورِ نسل‌دار لازم است تا کارت‌های sec1/پارتی
             (که .prod-card هم دارند) دست‌نخورده بمانند. */
          .prod-grid .prod-card { aspect-ratio: 1 / 1.654 !important; }
        }
        .prod-card { transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s; }
        .prod-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(28,28,26,0.12) !important; }
        .banner-grid { grid-template-columns: repeat(4,1fr) !important; }
        @media(max-width:900px) { .banner-grid { grid-template-columns: repeat(2,1fr) !important; } }
        .cat-ad-poster { aspect-ratio: 2048 / 421; }
        .banner-card { transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s; }
        .banner-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(28,28,26,0.16) !important; }
        @media(max-width:600px) { .dual-banner { flex-direction: column !important; } }
        @media(max-width:600px) {
          .bb-divider { display: none !important; }
        }
        /* دکمه‌ی دسته‌بندی‌ها و شکستِ خط فقط در موبایل معنا دارند */
        .bb-cats, .bb-break { display: none; }
        /* موبایل — ردیف ۱: برند + دسته‌بندی‌ها (روبه‌روی هم) | ردیف ۲: سرچ + ورود|عضویت.
           bb-break یک آیتمِ بی‌ارتفاع با basis ۱۰۰٪ است و ردیف را قطعی می‌شکند
           (به‌جای تکیه بر اینکه عرض‌ها تصادفاً سرریز کنند).
           در RTL آیتمِ با order بزرگ‌تر سمت چپ می‌نشیند. */
        @media(max-width:640px) {
          /* row-gap حتماً !important — وگرنه gap:14 در استایل اینلاینِ .bb-row برنده می‌شود
             و فاصله‌ی عمودیِ دو ردیف روی ۱۴px می‌ماند. */
          .bb-row    { height: auto !important; flex-wrap: wrap; padding-top: 9px !important; padding-bottom: 10px !important; row-gap: 6px !important; }
          .bb-cats   { display: inline-flex; order: 1; margin-inline-start: auto; }
          .bb-break  { display: block; order: 5; flex: 0 0 100%; height: 0; }
          /* basis صفر + min-width صفر ⇒ سرچ عرضِ ذاتیِ input را تحمیل نمی‌کند و فقط فضای
             باقی‌مانده‌ی کنارِ دکمه‌ی ورود را پر می‌کند؛ در نتیجه هر دو در یک سطر می‌مانند.
             (با flex:1 1 auto سرچ ~۲۳۴px می‌گرفت و دکمه به سطر سوم می‌پرید.) */
          .bb-search { order: 10; flex: 1 1 0% !important; min-width: 0; }
          .bb-auth   { order: 11; padding: 8px 12px !important; }
        }
        /* کاتالوگ اصلی بازار */
        .bz-catalog { display: block; }
        @media(max-width:900px) {
          .bz-catalog { grid-template-columns: 1fr !important; }
          .bz-sidebar { display: none !important; }
        }
        .bz-filterbtn { display: none !important; }
        @media(max-width:900px) { .bz-filterbtn { display: flex !important; } }
        /* موبایل: برچسب «مرتب‌سازی:» حذف تا «ثبت محصول» کنارش جا شود */
        @media(max-width:640px) { .bz-sort-label { display: none !important; } }
        .bz-grid::-webkit-scrollbar { display: none; }
        /* contain: کششِ افقی به صفحه/back-navigation مرورگر نشت نکند.
           موبایل دست‌نخورده می‌ماند و از اسکرول لمسیِ بومی (که خودش اینرسی دارد) استفاده می‌کند. */
        .bz-grid { --card-w: 176px; overscroll-behavior-x: contain; will-change: transform; }
        @media (prefers-reduced-motion: reduce) { .bz-grid { will-change: auto; } }
        /* ۲.۰۴۶ = ۲.۲ منهای ۷٪ — فقط کارت‌های sec1 و بیلیارد پارتی (کارت‌های «جدیدترین‌ها» روی ۱:۲.۲ می‌مانند) */
        .bz-scroll-card { width: var(--card-w); aspect-ratio: 1 / 2.046; }
        /* کارت اولِ زرد: با اسکرول ۷۵٪ بیرون می‌رود، بعد قفل می‌شود و ۲۵٪ آن پیدا می‌ماند.
           آفستِ منفی روی لبه‌ی راست (RTL) ⇒ کارت اجازه دارد ۷۵٪ عرضش از پورت بیرون برود و همان‌جا می‌چسبد.
           z-index بالا ⇒ بقیه‌ی محصولات از زیرش رد می‌شوند. */
        .bz-sticky-first { position: sticky; right: calc(var(--card-w) * -0.75); z-index: 3; }
        @media(max-width:700px) {
          .bz-grid { --card-w: 145px; }
          .cat-tile { width: 70px !important; }
          .cat-icn { width: 56px !important; height: 56px !important; }
          .cat-icn-in { transform: scale(1.356) !important; }   /* ۱.۱۳ + ۲۰٪ */
          .cat-lbl { font-size: 13px !important; }
          .hero-slider { aspect-ratio: 2048 / 1052 !important; }
          /* متن کارت‌ها در موبایل جمع‌تر شود تا قیمت بریده نشود */
          .pc-body { padding: 5px 7px 7px !important; gap: 2px !important; }
          .pc-name { line-height: 1.35 !important; }
          /* پوسترهای آگهی ۵۰٪ بلندتر — و بنرهای زیر «زمان باقیمانده» هم‌ارتفاع با آن‌ها */
          .cat-ad-poster { aspect-ratio: 2048 / 632; }
          .banner-card   { height: auto !important; aspect-ratio: 2048 / 632; }
        }
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
        <CatalogSection
          products={allProducts}
          filters={filters}
          setFilters={setFilters}
          sort={sort}
          setSort={setSort}
        />
        <DealsSection />
        <AdBanners />
        <CategoriesSection activeCat={activeSingleCat} onPick={pickCategory} />
        <NewestSection products={allProducts} />
        <DualBannerSection />
      </div>
    </>
  )
}

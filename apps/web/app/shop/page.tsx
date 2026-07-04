'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ShoppingCart, Search, User, LogIn, ChevronLeft } from 'lucide-react'
import { useCartStore } from '../../store/cart.store'
import { useAuthStore } from '../../store/auth.store'

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
    img: '/images/shop/snooker-table.jpg',
    badge: 'میز اسنوکر', title: 'میزهای حرفه‌ای',
    sub: 'بهترین برندهای جهانی — ارسال به سراسر ایران',
    cta: 'مشاهده میزها', href: '/shop/category/table',
  },
  {
    img: '/images/shop/cue_billiard_2.jpg',
    badge: 'چوب بیلیارد', title: 'چوب‌های حرفه‌ای',
    sub: 'از کلاسیک تا کربن فایبر — برای هر سبک بازی',
    cta: 'مشاهده چوب‌ها', href: '/shop/category/cue',
  },
  {
    img: '/images/shop/Ball-1.jpg',
    badge: 'توپ بیلیارد', title: 'توپ‌های استاندارد',
    sub: 'توپ‌های Aramith، Cyclop و سایر برندهای معتبر',
    cta: 'مشاهده توپ‌ها', href: '/shop/category/ball',
  },
  {
    img: '/images/shop/Home_table.jpg',
    badge: 'میز خانگی', title: 'بیلیارد در خانه',
    sub: 'میزهای کمپکت و زیبا برای منزل و اداره',
    cta: 'خرید میز خانگی', href: '/shop/category/table',
  },
  {
    img: '/images/shop/pool_chalk_1.jpg',
    badge: 'لوازم جانبی', title: 'اکسسوری کامل',
    sub: 'گچ، نگهدارنده، کیف چوب و بیش از ۵۰۰ محصول',
    cta: 'مشاهده لوازم', href: '/shop/category/accessory',
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

// ── Mock products ──────────────────────────────────────────────
const PRODUCTS = [
  { id: 1,  img: '/images/shop/cue_billiard_2.jpg',   name: 'چوب حرفه‌ای Predator 314³',              price: 2800000, old: 3300000, disc: 15 },
  { id: 2,  img: '/images/shop/snooker-table.jpg',    name: 'میز اسنوکر Dynamo Tournament',            price: 45000000,old: 50000000,disc: 10 },
  { id: 3,  img: '/images/shop/Ball-1.jpg',           name: 'توپ Aramith Pro Cup استاندارد WPBSA',     price: 1200000, old: 1500000, disc: 20 },
  { id: 4,  img: '/images/shop/pool_chalk_1.jpg',     name: 'گچ Master Blue Square — ۱۴۴ عددی',       price: 180000,  old: 260000,  disc: 31 },
  { id: 5,  img: '/images/shop/rest-pool.webp',       name: 'رست اسنوکر حرفه‌ای پیچ استنلس',          price: 450000,  old: 480000,  disc: 6  },
  { id: 6,  img: '/images/shop/accessori.png',        name: 'کیف چوب بیلیارد دو قسمتی چرم',           price: 850000,  old: 970000,  disc: 12 },
  { id: 7,  img: '/images/shop/cue_billiard.jpg',     name: 'چوب کربن فایبر Mezz EC7-CF',             price: 6500000, old: 7100000, disc: 8  },
  { id: 8,  img: '/images/shop/Ball.jpg',             name: 'توپ Cyclop Omega Pool Set',               price: 950000,  old: 1120000, disc: 15 },
  { id: 9,  img: '/images/shop/Home_table.jpg',       name: 'میز بیلیارد خانگی — پایه چوب ماسیو',    price: 18000000,old: 19000000,disc: 5  },
  { id: 10, img: '/images/shop/pool_chalk_2.jpg',     name: 'گچ Predator 1080 Pure — ۵ عددی',         price: 220000,  old: 245000,  disc: 10 },
  { id: 11, img: '/images/shop/snooker-table-2.jpg',  name: 'میز اسنوکر Pro-Line ۱۲ فوتی',            price: 68000000,old: 75000000,disc: 9  },
  { id: 12, img: '/images/shop/Pro_table.jpg',        name: 'میز بیلیارد حرفه‌ای پارچه ایتالیایی',   price: 32000000,old: 36000000,disc: 11 },
]

function toFa(v: string | number) {
  return String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
}

// ── Shop Top Bar ──────────────────────────────────────────────
function ShopTopBar({
  searchInput, onSearchInput, onSearch, cartCount, user,
}: {
  searchInput: string
  onSearchInput: (v: string) => void
  onSearch: (e: React.FormEvent) => void
  cartCount: number
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
      <div style={{
        maxWidth: 1300, margin: '0 auto',
        padding: '0 clamp(12px,3vw,32px)',
        height: 60,
        display: 'flex', alignItems: 'center', gap: 14,
        direction: 'rtl',
      }}>
        {/* Brand */}
        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 10px rgba(199,166,106,0.28)' }}>
            <img src="/images/Logo/logo1.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="bb-brand" style={{ display: 'flex', flexDirection: 'column', gap: 1, lineHeight: 1 }}>
            <span style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: 14, fontWeight: 700, color: '#1C1C1A', letterSpacing: '0.04em' }}>Billiard</span>
            <span style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: 14, fontWeight: 900, color: GOLD, letterSpacing: '0.08em', fontStyle: 'italic' }}>Bazzar</span>
          </div>
        </Link>
        <div className="bb-divider" style={{ width: 1, height: 28, background: 'rgba(28,28,26,0.08)', flexShrink: 0 }} />
        {/* Search */}
        <form onSubmit={onSearch} style={{ flex: 1, position: 'relative' }}>
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
        {/* Cart */}
        <Link href="/cart" style={{
          textDecoration: 'none', flexShrink: 0, position: 'relative',
          width: 40, height: 40, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: cartCount > 0 ? LQ.bgGold : LQ.bg,
          backdropFilter: LQ.blur, WebkitBackdropFilter: LQ.blur,
          border: cartCount > 0 ? LQ.borderGold : LQ.border,
          boxShadow: cartCount > 0 ? LQ.shadowGold : LQ.shadow,
          transition: 'all 0.25s',
        }}>
          <ShoppingCart size={18} color={cartCount > 0 ? GOLD : TEXT_SEC} strokeWidth={2} />
          {cartCount > 0 && (
            <span style={{ position: 'absolute', top: -6, left: -6, minWidth: 18, height: 18, borderRadius: 9, background: `linear-gradient(135deg,${GOLD},#A07840)`, color: '#fff', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxShadow: '0 2px 6px rgba(199,166,106,0.45)' }}>
              {cartCount > 9 ? '۹+' : toFa(cartCount)}
            </span>
          )}
        </Link>
        {/* Auth */}
        {user ? (
          <Link href="/dashboard" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, background: LQ.bg, backdropFilter: LQ.blur, WebkitBackdropFilter: LQ.blur, border: LQ.border, borderRadius: 10, padding: '7px 13px', boxShadow: LQ.shadow, transition: 'all 0.25s' }}>
            <User size={14} color={TEXT} strokeWidth={2.2} />
            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{user.firstName}</span>
          </Link>
        ) : (
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
          <Link href={slide.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(199,166,106,0.18)', backdropFilter: 'blur(20px) saturate(1.5)', WebkitBackdropFilter: 'blur(20px) saturate(1.5)', border: '1px solid rgba(199,166,106,0.5)', boxShadow: '0 8px 32px rgba(199,166,106,0.18),inset 0 1px 0 rgba(255,255,255,0.25)', color: '#fff', padding: '13px 26px', borderRadius: 13, textDecoration: 'none', fontSize: 14, fontWeight: 700, transition: 'all 0.25s' }}>
            {slide.cta}<ChevronLeft size={16} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
      {/* Dots */}
      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', gap: 6 }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ width: i === active ? 26 : 7, height: 7, borderRadius: 4, border: 'none', cursor: 'pointer', padding: 0, background: i === active ? GOLD : 'rgba(255,255,255,0.28)', backdropFilter: 'blur(8px)', boxShadow: i === active ? '0 0 10px rgba(199,166,106,0.55)' : 'none', transition: 'all 0.35s ease' }} />
        ))}
      </div>
    </div>
  )
}

// ── Categories Section ────────────────────────────────────────
function CategoriesSection() {
  const scrollRef  = useRef<HTMLDivElement>(null)
  const dragging   = useRef(false)
  const startX     = useRef(0)
  const scrollLeft = useRef(0)
  const [hovId, setHovId] = useState<string | null>(null)

  const scroll = (dir: 'next' | 'prev') => {
    scrollRef.current?.scrollBy({ left: dir === 'next' ? 560 : -560, behavior: 'smooth' })
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
    <div style={{ background: 'linear-gradient(140deg,#EDE9E2 0%,#F4F1EC 50%,#E8E4DD 100%)', borderBottom: '1px solid rgba(28,28,26,0.07)', overflow: 'visible' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '22px clamp(16px,3vw,32px) 16px', direction: 'rtl', overflow: 'visible' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: 0 }}>دسته‌بندی‌های بیلیارد بازار</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['prev','next'] as const).map(dir => (
              <button key={dir} onClick={() => scroll(dir)} style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(20px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
                border: '1px solid rgba(255,255,255,0.82)',
                boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 4px 12px rgba(0,0,0,0.07)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg viewBox="0 0 18 18" fill="none" width={14} height={14}>
                  <path d={dir === 'prev' ? 'M11 4L6 9l5 5' : 'M7 4l5 5-5 5'} stroke={TEXT} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>
        </div>
        <div
          ref={scrollRef}
          className="cat-scroll"
          onMouseDown={onDown}
          style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 12, paddingTop: 10, cursor: 'grab', userSelect: 'none' }}
        >
          {CATS.map(cat => {
            const hov = hovId === cat.id
            return (
              <Link
                key={cat.id}
                href={`/shop/category/${cat.id}`}
                draggable={false}
                onMouseEnter={() => setHovId(cat.id)}
                onMouseLeave={() => setHovId(null)}
                style={{
                  textDecoration: 'none', flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  width: 82,
                  /* ── exact home-page card style ── */
                  background: hov ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.52)',
                  backdropFilter: 'blur(40px) saturate(240%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(240%)',
                  border: `1px solid ${hov ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.82)'}`,
                  borderRadius: 22,
                  padding: '14px 8px 10px',
                  boxShadow: hov
                    ? `inset 0 1.5px 0 rgba(255,255,255,1), 0 20px 52px ${cat.g[1]}2e, 0 8px 24px rgba(0,0,0,0.08)`
                    : 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.07)',
                  transform: hov ? 'translateY(-6px)' : 'none',
                  transition: 'background 0.3s ease, transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease, border-color 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {/* top sheen — exactly like home page */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,rgba(255,255,255,0) 100%)', borderRadius: '22px 22px 0 0', pointerEvents: 'none' }} />
                {/* icon container — home-page style: subtle tinted bg + colored border + glow */}
                <div style={{
                  width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                  background: `linear-gradient(135deg,${cat.g[0]}33,${cat.g[1]}18)`,
                  border: `1px solid ${cat.g[1]}52`,
                  boxShadow: `0 4px 14px ${cat.g[1]}48`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: cat.g[1],
                  position: 'relative', zIndex: 1,
                }}>
                  <div style={{ filter: `drop-shadow(0 0 4px ${cat.g[1]}99)` }}>
                    {cat.icon}
                  </div>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: TEXT, textAlign: 'center', lineHeight: 1.3, position: 'relative', zIndex: 1 }}>
                  {cat.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Products Section ──────────────────────────────────────────
function ProductsSection() {
  const fmt = (n: number) => toFa(n.toLocaleString('fa-IR'))
  return (
    <div style={{ background: '#F7F6F4' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '28px clamp(16px,3vw,32px) 40px', direction: 'rtl' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: 0 }}>پیشنهاد محصولات</h2>
          <Link href="/shop/all" style={{ fontSize: 13, color: GOLD, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
            مشاهده همه
            <ChevronLeft size={13} strokeWidth={2.5} />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }} className="prod-grid">
          {PRODUCTS.map(p => (
            <Link key={p.id} href={`/shop/product/${p.id}`} className="prod-card" style={{ textDecoration: 'none', background: '#fff', borderRadius: 14, border: '1.5px solid rgba(28,28,26,0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Image */}
              <div style={{ width: '100%', paddingTop: '100%', position: 'relative', background: '#F4F3F1', overflow: 'hidden', borderBottom: '1.5px solid rgba(28,28,26,0.18)' }}>
                <img src={p.img} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                {p.disc > 0 && (
                  <div style={{ position: 'absolute', top: 8, left: 8, background: '#E53935', color: '#fff', fontSize: 11, fontWeight: 800, borderRadius: 7, padding: '2px 7px' }}>
                    {toFa(p.disc)}٪
                  </div>
                )}
              </div>
              {/* Info */}
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
            <Link key={`${p.id}-${i}`} href={`/shop/product/${p.id}`} draggable={false} className="prod-card" style={{
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
const NEWEST_PRODUCTS = [...PRODUCTS].reverse()

function NewestSection() {
  const fmt = (n: number) => toFa(n.toLocaleString('fa-IR'))
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
          {NEWEST_PRODUCTS.map(p => (
            <Link key={`new-${p.id}`} href={`/shop/product/${p.id}`} draggable={false} className="prod-card" style={{ textDecoration: 'none', background: '#fff', borderRadius: 14, border: '1.5px solid rgba(28,28,26,0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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

  const slide = banner.slides[idx]

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
  const cartCount = useCartStore(s => s.totalItems())
  const user      = useAuthStore(s => s.user)

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
          .bb-brand   { display: none !important; }
          .bb-divider { display: none !important; }
          .hero-slider { height: clamp(190px,56vw,320px) !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5' }}>
        <ShopTopBar
          searchInput={searchInput}
          onSearchInput={setSearchInput}
          onSearch={handleSearch}
          cartCount={cartCount}
          user={user}
        />
        <HeroSlider />
        <CategoriesSection />
        <ProductsSection />
        <DealsSection />
        <AdBanners />
        <NewestSection />
        <DualBannerSection />
      </div>
    </>
  )
}

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

// ── Category definitions ───────────────────────────────────────
const CATS = [
  {
    id: 'cue', label: 'چوب', clr: '#9B6F3A', bg: 'rgba(155,111,58,0.11)',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" width={38} height={38}>
        <line x1="6" y1="30" x2="28" y2="8" stroke="#9B6F3A" strokeWidth="2.6" strokeLinecap="round"/>
        <line x1="28" y1="8" x2="31" y2="5" stroke="#9B6F3A" strokeWidth="4.5" strokeLinecap="round"/>
        <rect x="3" y="27" width="6" height="3" rx="1.5" fill="#9B6F3A" transform="rotate(-45 3 27)"/>
        <line x1="13" y1="23" x2="16" y2="20" stroke="#9B6F3A" strokeWidth="1.2" strokeLinecap="round" opacity="0.45"/>
        <line x1="17" y1="19" x2="20" y2="16" stroke="#9B6F3A" strokeWidth="1.2" strokeLinecap="round" opacity="0.45"/>
      </svg>
    ),
  },
  {
    id: 'table', label: 'میز', clr: '#2A7B50', bg: 'rgba(42,123,80,0.1)',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" width={38} height={38}>
        <rect x="3" y="9" width="30" height="18" rx="2.5" fill="#2A7B50" fillOpacity="0.12" stroke="#2A7B50" strokeWidth="1.9"/>
        {/* 6 pockets */}
        <circle cx="3.5" cy="9.5" r="2" fill="#2A7B50"/>
        <circle cx="18" cy="9" r="2" fill="#2A7B50"/>
        <circle cx="32.5" cy="9.5" r="2" fill="#2A7B50"/>
        <circle cx="3.5" cy="26.5" r="2" fill="#2A7B50"/>
        <circle cx="18" cy="27" r="2" fill="#2A7B50"/>
        <circle cx="32.5" cy="26.5" r="2" fill="#2A7B50"/>
      </svg>
    ),
  },
  {
    id: 'ball', label: 'توپ', clr: '#C0392B', bg: 'rgba(192,57,43,0.1)',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" width={38} height={38}>
        <circle cx="18" cy="18" r="12" fill="#C0392B" fillOpacity="0.13" stroke="#C0392B" strokeWidth="1.9"/>
        <path d="M10 14 Q18 10 26 14" stroke="#C0392B" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
        <path d="M10 22 Q18 18 26 22" stroke="#C0392B" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
        <circle cx="13" cy="12" r="2.5" fill="white" fillOpacity="0.45"/>
      </svg>
    ),
  },
  {
    id: 'tip', label: 'تیپ', clr: '#2E6DA4', bg: 'rgba(46,109,164,0.1)',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" width={38} height={38}>
        {/* Cue tip: small disc on top of ferrule */}
        <ellipse cx="18" cy="13" rx="8" ry="3.5" fill="#2E6DA4" fillOpacity="0.15" stroke="#2E6DA4" strokeWidth="1.9"/>
        <line x1="10" y1="13" x2="10" y2="22" stroke="#2E6DA4" strokeWidth="1.9"/>
        <line x1="26" y1="13" x2="26" y2="22" stroke="#2E6DA4" strokeWidth="1.9"/>
        <ellipse cx="18" cy="22" rx="8" ry="3.5" fill="#2E6DA4" fillOpacity="0.15" stroke="#2E6DA4" strokeWidth="1.9"/>
        {/* tip cap */}
        <ellipse cx="18" cy="11" rx="5" ry="2" fill="#2E6DA4" stroke="#2E6DA4" strokeWidth="1.4"/>
      </svg>
    ),
  },
  {
    id: 'chalk', label: 'گچ', clr: '#5B6FA8', bg: 'rgba(91,111,168,0.1)',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" width={38} height={38}>
        {/* Chalk cube */}
        <rect x="9" y="14" width="16" height="13" rx="2" fill="#5B6FA8" fillOpacity="0.13" stroke="#5B6FA8" strokeWidth="1.9"/>
        <path d="M9 14 L13 10 L29 10 L25 14" stroke="#5B6FA8" strokeWidth="1.9" strokeLinejoin="round"/>
        <line x1="25" y1="14" x2="25" y2="27" stroke="#5B6FA8" strokeWidth="1.9"/>
        <line x1="25" y1="10" x2="29" y2="10" stroke="#5B6FA8" strokeWidth="1.9"/>
        {/* Worn concave top */}
        <path d="M11 12 Q18 9 24 12" stroke="#5B6FA8" strokeWidth="1.4" strokeLinecap="round" fillOpacity="0"/>
      </svg>
    ),
  },
  {
    id: 'extension', label: 'اکستنشن', clr: '#2E7D80', bg: 'rgba(46,125,128,0.1)',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" width={38} height={38}>
        {/* Two cue sections connecting */}
        <line x1="4" y1="26" x2="15" y2="15" stroke="#2E7D80" strokeWidth="2.8" strokeLinecap="round"/>
        <circle cx="15" cy="15" r="2.5" fill="#2E7D80" stroke="#2E7D80" strokeWidth="1.5"/>
        <circle cx="21" cy="15" r="2.5" fill="none" stroke="#2E7D80" strokeWidth="1.5"/>
        <line x1="21" y1="15" x2="32" y2="10" stroke="#2E7D80" strokeWidth="2" strokeLinecap="round"/>
        {/* Extension lock ring */}
        <rect x="17" y="13" width="8" height="4" rx="2" stroke="#2E7D80" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
  },
  {
    id: 'case', label: 'کیس', clr: '#7B52AB', bg: 'rgba(123,82,171,0.1)',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" width={38} height={38}>
        {/* Long cylindrical cue case */}
        <rect x="5" y="14" width="26" height="9" rx="4.5" fill="#7B52AB" fillOpacity="0.13" stroke="#7B52AB" strokeWidth="1.9"/>
        <line x1="9" y1="14" x2="9" y2="23" stroke="#7B52AB" strokeWidth="1.2" opacity="0.45"/>
        <line x1="13" y1="14" x2="13" y2="23" stroke="#7B52AB" strokeWidth="1.2" opacity="0.45"/>
        {/* Cap/end */}
        <ellipse cx="5" cy="18.5" rx="2" ry="4.5" fill="#7B52AB" fillOpacity="0.25" stroke="#7B52AB" strokeWidth="1.6"/>
        {/* Strap */}
        <path d="M16 13 Q18 11 20 13" stroke="#7B52AB" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </svg>
    ),
  },
  {
    id: 'bag', label: 'کیف', clr: '#C47C2A', bg: 'rgba(196,124,42,0.1)',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" width={38} height={38}>
        {/* Bag body */}
        <rect x="5" y="14" width="26" height="17" rx="3" fill="#C47C2A" fillOpacity="0.12" stroke="#C47C2A" strokeWidth="1.9"/>
        {/* Handle */}
        <path d="M12 14 L12 10 Q12 7 18 7 Q24 7 24 10 L24 14" stroke="#C47C2A" strokeWidth="1.9" fill="none" strokeLinecap="round"/>
        {/* Zipper line */}
        <line x1="5" y1="19" x2="31" y2="19" stroke="#C47C2A" strokeWidth="1.4" strokeDasharray="2 2"/>
        {/* Front pocket */}
        <rect x="10" y="21" width="16" height="7" rx="2" stroke="#C47C2A" strokeWidth="1.3" fill="none" opacity="0.6"/>
      </svg>
    ),
  },
  {
    id: 'rest', label: 'رست', clr: '#3A7D44', bg: 'rgba(58,125,68,0.1)',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" width={38} height={38}>
        {/* Rest shaft */}
        <line x1="4" y1="30" x2="22" y2="18" stroke="#3A7D44" strokeWidth="2.4" strokeLinecap="round"/>
        {/* Spider/V head */}
        <path d="M22 18 L28 12" stroke="#3A7D44" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M22 18 L30 16" stroke="#3A7D44" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M22 18 L28 22" stroke="#3A7D44" strokeWidth="2.2" strokeLinecap="round"/>
        {/* V notch */}
        <path d="M25 12 L28 10 L31 12" stroke="#3A7D44" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="22" cy="18" r="2.2" fill="#3A7D44"/>
      </svg>
    ),
  },
  {
    id: 'cloth', label: 'پارچه', clr: '#2BAA5E', bg: 'rgba(43,170,94,0.1)',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" width={38} height={38}>
        {/* Billiard cloth — table with felt texture */}
        <rect x="4" y="11" width="28" height="16" rx="2" fill="#2BAA5E" fillOpacity="0.14" stroke="#2BAA5E" strokeWidth="1.9"/>
        {/* Fabric weave pattern */}
        <line x1="4" y1="16" x2="32" y2="16" stroke="#2BAA5E" strokeWidth="0.9" opacity="0.4"/>
        <line x1="4" y1="21" x2="32" y2="21" stroke="#2BAA5E" strokeWidth="0.9" opacity="0.4"/>
        <line x1="11" y1="11" x2="11" y2="27" stroke="#2BAA5E" strokeWidth="0.9" opacity="0.4"/>
        <line x1="18" y1="11" x2="18" y2="27" stroke="#2BAA5E" strokeWidth="0.9" opacity="0.4"/>
        <line x1="25" y1="11" x2="25" y2="27" stroke="#2BAA5E" strokeWidth="0.9" opacity="0.4"/>
        {/* Roll indicator */}
        <ellipse cx="4" cy="19" rx="2" ry="8" fill="#2BAA5E" fillOpacity="0.2" stroke="#2BAA5E" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: 'oil', label: 'روغن', clr: '#8D7B2A', bg: 'rgba(141,123,42,0.1)',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" width={38} height={38}>
        {/* Oil bottle */}
        <path d="M13 9 L13 13 Q8 15 8 20 L8 27 Q8 29 10 29 L26 29 Q28 29 28 27 L28 20 Q28 15 23 13 L23 9 Z" fill="#8D7B2A" fillOpacity="0.13" stroke="#8D7B2A" strokeWidth="1.9" strokeLinejoin="round"/>
        {/* Cap */}
        <rect x="13" y="7" width="10" height="4" rx="2" fill="#8D7B2A" fillOpacity="0.3" stroke="#8D7B2A" strokeWidth="1.6"/>
        {/* Oil drop inside */}
        <path d="M18 17 Q16 20 16 22 Q16 25 18 25 Q20 25 20 22 Q20 20 18 17Z" fill="#8D7B2A" opacity="0.55"/>
      </svg>
    ),
  },
  {
    id: 'towel', label: 'حوله', clr: '#C47A7A', bg: 'rgba(196,122,122,0.1)',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" width={38} height={38}>
        {/* Rolled/stacked towel */}
        <rect x="7" y="10" width="22" height="5" rx="2.5" fill="#C47A7A" fillOpacity="0.18" stroke="#C47A7A" strokeWidth="1.9"/>
        <rect x="7" y="17" width="22" height="5" rx="2.5" fill="#C47A7A" fillOpacity="0.25" stroke="#C47A7A" strokeWidth="1.9"/>
        <rect x="7" y="24" width="22" height="5" rx="2.5" fill="#C47A7A" fillOpacity="0.35" stroke="#C47A7A" strokeWidth="1.9"/>
        {/* Fold detail */}
        <path d="M7 12.5 Q18 10.5 29 12.5" stroke="#C47A7A" strokeWidth="0.8" opacity="0.4" fill="none"/>
        <path d="M7 19.5 Q18 17.5 29 19.5" stroke="#C47A7A" strokeWidth="0.8" opacity="0.4" fill="none"/>
      </svg>
    ),
  },
  {
    id: 'clothing', label: 'پوشاک', clr: '#2A4C8A', bg: 'rgba(42,76,138,0.1)',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" width={38} height={38}>
        {/* T-shirt */}
        <path d="M13 7 Q18 11 23 7 L30 12 L26 16 L26 29 L10 29 L10 16 L6 12 Z"
          fill="#2A4C8A" fillOpacity="0.13" stroke="#2A4C8A" strokeWidth="1.9" strokeLinejoin="round"/>
        {/* Collar */}
        <path d="M13 7 Q18 10 23 7" stroke="#2A4C8A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        {/* Logo area */}
        <circle cx="18" cy="20" r="3" stroke="#2A4C8A" strokeWidth="1.2" fill="none" opacity="0.5"/>
      </svg>
    ),
  },
  {
    id: 'accessory', label: 'اکسسوری', clr: '#C7A66A', bg: 'rgba(199,166,106,0.12)',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" width={38} height={38}>
        {/* Billiard glove */}
        <path d="M10 28 L10 16 Q10 14 12 14 L14 14 L14 12 Q14 10 16 10 Q18 10 18 12 L18 14 L20 14 L20 12 Q20 10 22 10 Q24 10 24 12 L24 14 Q26 14 26 16 L26 28 Q26 30 18 30 Q10 30 10 28Z"
          fill="#C7A66A" fillOpacity="0.14" stroke="#C7A66A" strokeWidth="1.9" strokeLinejoin="round"/>
        {/* Knuckle lines */}
        <line x1="14" y1="18" x2="14" y2="22" stroke="#C7A66A" strokeWidth="1.2" opacity="0.5"/>
        <line x1="18" y1="17" x2="18" y2="22" stroke="#C7A66A" strokeWidth="1.2" opacity="0.5"/>
        <line x1="22" y1="18" x2="22" y2="22" stroke="#C7A66A" strokeWidth="1.2" opacity="0.5"/>
        {/* Wrist strap */}
        <path d="M10 25 Q18 27 26 25" stroke="#C7A66A" strokeWidth="1.5" fill="none" opacity="0.6"/>
      </svg>
    ),
  },
  {
    id: 'other', label: 'سایر', clr: '#6C7A8A', bg: 'rgba(108,122,138,0.1)',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" width={38} height={38}>
        {/* Modern grid of 9 dots */}
        {[9,18,27].map(x => [9,18,27].map(y => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2.8" fill="#6C7A8A" opacity={x===18&&y===18?1:0.5}/>
        )))}
        <circle cx="18" cy="18" r="4.5" fill="none" stroke="#6C7A8A" strokeWidth="1.4"/>
      </svg>
    ),
  },
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
        <Link href="/shop" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
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
  const [hov, setHov] = useState<string | null>(null)
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid rgba(28,28,26,0.06)' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '28px clamp(16px,3vw,32px) 32px', direction: 'rtl' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: TEXT, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 4, height: 18, borderRadius: 2, background: GOLD }} />
            دسته‌بندی‌های بیلیارد بازار
          </h2>
          <Link href="/shop/categories" style={{ fontSize: 13, color: GOLD, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            مشاهده همه
            <ChevronLeft size={14} strokeWidth={2.5} />
          </Link>
        </div>
        {/* Horizontal scroll row */}
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}
          className="cat-scroll">
          {CATS.map(cat => (
            <Link
              key={cat.id}
              href={`/shop/category/${cat.id}`}
              onMouseEnter={() => setHov(cat.id)}
              onMouseLeave={() => setHov(null)}
              style={{
                textDecoration: 'none', flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                width: 84,
                cursor: 'pointer',
              }}
            >
              {/* Icon card */}
              <div style={{
                width: 76, height: 76, borderRadius: 22,
                background: hov === cat.id ? cat.bg.replace('0.1', '0.2').replace('0.12', '0.25').replace('0.11', '0.22') : cat.bg,
                border: `1.5px solid ${hov === cat.id ? cat.clr + '50' : 'rgba(28,28,26,0.06)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.25s ease',
                transform: hov === cat.id ? 'translateY(-3px)' : 'none',
                boxShadow: hov === cat.id
                  ? `0 8px 24px ${cat.clr}22, inset 0 1px 0 rgba(255,255,255,0.7)`
                  : '0 2px 8px rgba(28,28,26,0.05), inset 0 1px 0 rgba(255,255,255,0.8)',
              }}>
                {cat.icon}
              </div>
              {/* Label */}
              <span style={{
                fontSize: 12, fontWeight: hov === cat.id ? 700 : 500,
                color: hov === cat.id ? cat.clr : TEXT_SEC,
                textAlign: 'center', lineHeight: 1.3,
                transition: 'all 0.2s',
              }}>
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Deals Timer ───────────────────────────────────────────────
function DealsTimer() {
  const INIT = 8 * 3600 + 32 * 60 + 47
  const [rem, setRem] = useState(INIT)
  useEffect(() => {
    const t = setInterval(() => setRem(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  const pad = (n: number) => toFa(String(Math.floor(n)).padStart(2, '0'))
  const h = Math.floor(rem / 3600)
  const m = Math.floor((rem % 3600) / 60)
  const s = rem % 60

  const units = [
    {
      value: pad(h), label: 'ساعت',
      icon: (
        <svg viewBox="0 0 22 22" fill="none" width={20} height={20}>
          <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.8"/>
          <line x1="11" y1="11" x2="11" y2="5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="11" y1="11" x2="14.5" y2="13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="11" cy="11" r="1.2" fill="currentColor"/>
        </svg>
      ),
    },
    {
      value: pad(m), label: 'دقیقه',
      icon: (
        <svg viewBox="0 0 22 22" fill="none" width={20} height={20}>
          <circle cx="11" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8"/>
          <rect x="9.5" y="2" width="3" height="4" rx="1.5" fill="currentColor" opacity="0.7"/>
          <line x1="11" y1="12" x2="11" y2="7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="11" y1="12" x2="14" y2="14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      value: pad(s), label: 'ثانیه',
      icon: (
        <svg viewBox="0 0 22 22" fill="none" width={20} height={20}>
          <path d="M11 3 L9 10 L13 10 L11 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="11" cy="11" r="1.5" fill="currentColor"/>
        </svg>
      ),
    },
  ]

  return (
    <div style={{ background: '#0F0D0A', borderBottom: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden', position: 'relative' }}>
      {/* Glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 200, background: 'radial-gradient(ellipse,rgba(199,166,106,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px clamp(16px,3vw,32px)', direction: 'rtl', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          {/* Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(192,57,43,0.18)', border: '1px solid rgba(192,57,43,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 22 22" fill="none" width={18} height={18}>
                <path d="M11 2 C11 2 6 7 6 12 C6 14.76 8.24 17 11 17 C13.76 17 16 14.76 16 12 C16 7 11 2 11 2Z" fill="#C0392B" opacity="0.85"/>
                <path d="M11 9 L10 13 L12 13 Z" fill="white"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>پیشنهاد شگفت‌انگیز</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>تخفیف‌های ویژه — فقط تا پایان امروز</div>
            </div>
          </div>

          {/* Separator */}
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left,rgba(255,255,255,0.06),transparent)' }} />

          {/* Timer blocks — ساعت left | دقیقه middle | ثانیه right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, direction: 'ltr' }}>
            {units.map((u, i) => (
              <div key={u.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14,
                  padding: '10px 16px',
                  minWidth: 68,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                }}>
                  <div style={{ color: GOLD, opacity: 0.8 }}>{u.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{u.value}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.06em' }}>{u.label}</div>
                </div>
                {i < 2 && (
                  <span style={{ fontSize: 22, fontWeight: 900, color: 'rgba(255,255,255,0.2)', marginBottom: 14 }}>:</span>
                )}
              </div>
            ))}
          </div>

          {/* View deals button */}
          <Link href="/shop/deals" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(199,166,106,0.12)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${GOLD_BOR}`,
            borderRadius: 11, padding: '9px 18px',
            color: GOLD, fontSize: 13, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(199,166,106,0.1),inset 0 1px 0 rgba(255,255,255,0.1)',
            whiteSpace: 'nowrap',
          }}>
            مشاهده همه
            <ChevronLeft size={14} strokeWidth={2.5} />
          </Link>
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
        <DealsTimer />
      </div>
    </>
  )
}

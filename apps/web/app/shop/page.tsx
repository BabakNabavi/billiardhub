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
  { id: 'cue',       label: 'چوب',     img: '/images/shop/cue_billiard_2.jpg'   },
  { id: 'table',     label: 'میز',     img: '/images/shop/Pro_table.jpg'         },
  { id: 'ball',      label: 'توپ',     img: '/images/shop/Ball-1.jpg'            },
  { id: 'tip',       label: 'تیپ',     img: '/images/shop/cue_billiard.jpg'      },
  { id: 'chalk',     label: 'گچ',      img: '/images/shop/pool_chalk_1.jpg'      },
  { id: 'extension', label: 'اکستنشن', img: '/images/shop/cue_billiard_2.jpg'   },
  { id: 'case',      label: 'کیس',     img: '/images/shop/accessori.png'         },
  { id: 'bag',       label: 'کیف',     img: '/images/shop/rest-pool-2.jpg'       },
  { id: 'rest',      label: 'رست',     img: '/images/shop/rest-pool.webp'        },
  { id: 'cloth',     label: 'پارچه',   img: '/images/shop/snooker-table-2.jpg'   },
  { id: 'oil',       label: 'روغن',    img: '/images/shop/pool_chalk_2.jpg'      },
  { id: 'towel',     label: 'حوله',    img: '/images/shop/Home_table.jpg'        },
  { id: 'clothing',  label: 'پوشاک',   img: '/images/shop/snooker-table.jpg'     },
  { id: 'accessory', label: 'اکسسوری', img: '/images/shop/accessori.png'         },
  { id: 'other',     label: 'سایر',    img: '/images/shop/Ball.jpg'              },
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const scroll = (dir: 'next' | 'prev') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'next' ? 600 : -600, behavior: 'smooth' })
    }
  }
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid rgba(28,28,26,0.07)' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '22px clamp(16px,3vw,32px) 26px', direction: 'rtl' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: 0 }}>
            دسته‌بندی‌های بیلیارد بازار
          </h2>
          {/* Nav arrows — exactly like Snapp Shop */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => scroll('prev')} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(28,28,26,0.14)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s' }}>
              <svg viewBox="0 0 18 18" fill="none" width={16} height={16}>
                <path d="M11 4L6 9l5 5" stroke={TEXT} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button onClick={() => scroll('next')} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(28,28,26,0.14)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s' }}>
              <svg viewBox="0 0 18 18" fill="none" width={16} height={16}>
                <path d="M7 4l5 5-5 5" stroke={TEXT} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        {/* Scroll row */}
        <div
          ref={scrollRef}
          className="cat-scroll"
          style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}
        >
          {CATS.map(cat => (
            <Link
              key={cat.id}
              href={`/shop/category/${cat.id}`}
              style={{
                textDecoration: 'none', flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9,
                width: 112,
              }}
            >
              {/* Photo card — exactly like Snapp Shop */}
              <div style={{
                width: 112, height: 104,
                borderRadius: 16,
                overflow: 'hidden',
                background: '#F4F3F1',
                border: '1px solid rgba(28,28,26,0.07)',
              }}>
                <img
                  src={cat.img}
                  alt={cat.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: TEXT, textAlign: 'center', lineHeight: 1.3 }}>
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

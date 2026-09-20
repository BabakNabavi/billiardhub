'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MANUFACTURERS, type MockManufacturer } from '../../lib/manufacturers-data'
import { listApprovedManufacturers, profileToManufacturer } from '../../lib/manufacturer-store'
import type { ManufacturerProfile } from '../../lib/manufacturer-store'
import { fetchProfiles } from '../../lib/profiles/client'
import VerifiedBadge from '../../components/VerifiedBadge'
import { iranTel } from '../../lib/iran-geo'
import { toFaDigits } from '../../lib/jalali'

const GOLD     = '#C7A66A'
const GOLD_D   = '#8F6531'
/* هم‌رنگ پایه‌ی صحنه — وگرنه نوار چسبان وصله می‌شود */
const TEXT     = '#1C1C1A'
const TEXT_SEC = 'rgba(28,28,26,0.52)'
const TEXT_MUT = 'rgba(28,28,26,0.32)'


/* ── Subtle sliding header posters (text-less, behind the hero elements) ── */
const MFR_POSTERS = [
  { bg:'linear-gradient(125deg,#0b1322 0%,#17253f 55%,#1e2f4d 100%)', glow:'rgba(199,166,106,0.30)', accent:'rgba(199,166,106,0.55)', motif:'cues'  },
  { bg:'linear-gradient(130deg,#141414 0%,#272524 55%,#1a1a19 100%)', glow:'rgba(199,166,106,0.30)', accent:'rgba(199,166,106,0.55)', motif:'rack'  },
  { bg:'linear-gradient(130deg,#07231a 0%,#0e3a2a 55%,#0a2f22 100%)', glow:'rgba(199,166,106,0.26)', accent:'rgba(199,166,106,0.50)', motif:'table' },
  { bg:'linear-gradient(125deg,#1c0e13 0%,#341826 55%,#230f1a 100%)', glow:'rgba(199,166,106,0.26)', accent:'rgba(199,166,106,0.50)', motif:'eight' },
  { bg:'linear-gradient(130deg,#08201f 0%,#0d3835 55%,#0a2a28 100%)', glow:'rgba(199,166,106,0.26)', accent:'rgba(199,166,106,0.50)', motif:'aim'   },
]

function mfrMotif(motif: string) {
  const s = 190
  if (motif === 'rack') {
    const rows = [[[50,11]],[[41,27],[59,27]],[[32,43],[50,43],[68,43]],[[23,59],[41,59],[59,59],[77,59]],[[14,75],[32,75],[50,75],[68,75],[86,75]]]
    return (
      <svg width={s} viewBox="0 0 100 86" fill="none" aria-hidden>
        {rows.flat().map((pt,i)=>(<circle key={i} cx={pt![0]} cy={pt![1]} r="7.4" stroke={GOLD} strokeWidth="1.3" opacity="0.82"/>))}
        <circle cx="50" cy="11" r="3" fill={GOLD} opacity="0.6"/>
      </svg>
    )
  }
  if (motif === 'table') return (
    <svg width={s} viewBox="0 0 120 72" fill="none" aria-hidden>
      <rect x="4" y="4" width="112" height="64" rx="10" stroke={GOLD} strokeWidth="1.6" opacity="0.8"/>
      <rect x="12" y="12" width="96" height="48" rx="4" stroke={GOLD} strokeWidth="1" opacity="0.42"/>
      {[[10,10],[60,7],[110,10],[10,62],[60,65],[110,62]].map((p,i)=>(<circle key={i} cx={p[0]} cy={p[1]} r="4" fill={GOLD} opacity="0.68"/>))}
      <line x1="36" y1="12" x2="36" y2="60" stroke={GOLD} strokeWidth="1" opacity="0.4"/>
      <path d="M36 27 A9 9 0 0 0 36 45" stroke={GOLD} strokeWidth="1" opacity="0.4" fill="none"/>
      <circle cx="60" cy="36" r="1.8" fill={GOLD} opacity="0.7"/>
    </svg>
  )
  if (motif === 'eight') return (
    <svg width={s} viewBox="0 0 100 100" fill="none" aria-hidden>
      <circle cx="50" cy="50" r="38" stroke={GOLD} strokeWidth="1.8" opacity="0.85" fill="rgba(0,0,0,0.18)"/>
      <circle cx="50" cy="50" r="16" fill={GOLD} opacity="0.9"/>
      <text x="50" y="51" textAnchor="middle" dominantBaseline="central" fontSize="19" fontWeight="800" fill="#1c0e13">8</text>
      <ellipse cx="38" cy="36" rx="7" ry="4" fill={GOLD} opacity="0.22" transform="rotate(-30 38 36)"/>
    </svg>
  )
  if (motif === 'aim') return (
    <svg width={s} viewBox="0 0 100 100" fill="none" aria-hidden>
      <circle cx="50" cy="50" r="40" stroke={GOLD} strokeWidth="0.8" opacity="0.22"/>
      <circle cx="50" cy="50" r="28" stroke={GOLD} strokeWidth="1" opacity="0.38"/>
      <circle cx="50" cy="50" r="16" stroke={GOLD} strokeWidth="1.6" opacity="0.9" fill="rgba(0,0,0,0.18)"/>
      {[[50,6],[50,94],[6,50],[94,50]].map((pt,i)=>(<rect key={i} x={pt[0]!-3} y={pt[1]!-3} width="6" height="6" fill={GOLD} opacity="0.58" transform={`rotate(45 ${pt[0]} ${pt[1]})`}/>))}
      <circle cx="44" cy="44" r="3" fill={GOLD} opacity="0.4"/>
    </svg>
  )
  return (
    <svg width={s} viewBox="0 0 100 100" fill="none" aria-hidden>
      <g stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" opacity="0.78"><line x1="12" y1="86" x2="88" y2="16"/><line x1="12" y1="16" x2="88" y2="86"/></g>
      {[[12,86],[88,16],[12,16],[88,86]].map((pt,i)=>(<circle key={i} cx={pt[0]} cy={pt[1]} r="2.4" fill={GOLD} opacity="0.72"/>))}
      <circle cx="50" cy="51" r="13" fill="rgba(0,0,0,0.35)" stroke={GOLD} strokeWidth="1.6" opacity="0.95"/>
      <circle cx="45" cy="46" r="3" fill={GOLD} opacity="0.5"/>
    </svg>
  )
}

function MfrPoster({ variant }: { variant: number }) {
  const p = MFR_POSTERS[variant % MFR_POSTERS.length]!
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: p.bg }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '18px 18px', opacity: 0.6 }} />
      <div style={{ position: 'absolute', inset: '-20%', background: `radial-gradient(circle at 30% 40%, ${p.glow}, transparent 55%)` }} />
      <div style={{ position: 'absolute', top: '-25%', bottom: '-25%', left: '52%', width: 2, background: `linear-gradient(180deg, transparent, ${p.accent}, transparent)`, transform: 'rotate(19deg)', opacity: 0.4 }} />
      <div style={{ position: 'absolute', top: '-25%', bottom: '-25%', left: '58%', width: 1, background: `linear-gradient(180deg, transparent, ${p.accent}, transparent)`, transform: 'rotate(19deg)', opacity: 0.2 }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'translateX(-12%)' }}>
        <div style={{ display: 'flex' }}>{mfrMotif(p.motif)}</div>
      </div>
    </div>
  )
}

/* ── اسلایدهای هدر ── */
const MFR_SLIDES = [
  { title: 'تولیدکنندگان تجهیزات بیلیارد', sub: 'از کارگاه تا میز بازی' },
  { title: 'ساختِ ایران',          sub: 'میز، چوب و تجهیزات' },
  { title: 'سفارشِ اختصاصی',       sub: 'با ابعاد و رنگِ دلخواه' },
  { title: 'کیفیت جهانی',          sub: 'مستقیم از تولیدکننده' },
  { title: 'برندهای معتبر',        sub: 'همه در یک جا' },
]

/* ════════ HERO — همان الگوی صفحه‌ی مربیان ════════
   هدرِ قبلی روشن بود و پوسترها را با شفافیتِ کم پشتِ متن می‌گذاشت؛
   کنارِ هدرِ مربیان «ساده و معمولی» دیده می‌شد. */
/* ── عکسِ هدرِ فهرست ──
   ⚠️ به‌جای پوسترِ برداری، عکسِ واقعی — مالک داد. همان درسی که در
   `components/tech/market/HeroArt.tsx` ثبت شده: صحنه‌ی SVG هرچقدر
   هم دقیق کشیده شود، چشم فورا می‌فهمد عکس نیست.

   ⚠️ قیدِ ترکیب‌بندی: سوژه سمتِ چپ است و نیمه‌ی راستِ عکس عمدا تیره
   و خالی مانده، چون صفحه راست‌به‌چپ است و عنوانِ هیرو آن‌جا
   می‌نشیند. اگر روزی عکس عوض شد، همین قید باید رعایت شود.

   ⚠️ فایل‌ها از قبل به نسبتِ ۲٫۶:۱ بریده شده‌اند، نه ۳:۲ِ اصلِ عکس.
   دلیلش دیکد است نه بایت: نوارِ هیرو ۱۵۰ تا ۲۰۵ پیکسل بلند است و
   `object-fit: cover` روی یک عکسِ ۳:۲ نزدیک دو سومِ هر ردیفِ
   دیکدشده را دور می‌ریخت — روی اندرویدِ ضعیفِ مخاطبِ ما این وقت و
   حافظه است. برش (مرکز روی ۵۸٪ ارتفاع، جایی که دست‌ها و خودِ چوب
   است) همان‌جا در ساخت انجام شده.

   ⚠️ نردبان تا ۱۵۳۶ تمام می‌شود چون عرضِ بومیِ فایل همان است؛ پله‌ی
   بالاتر یعنی پیکسلِ ساختگی با هزینه‌ی بایت. موبایلِ DPR۲ پله‌ی
   ۷۶۸ را می‌گیرد: ۱۰ کیلوبایت AVIF. */
const HERO_W = [768, 1024, 1280, 1536] as const
const heroSet = (ext: string) =>
  HERO_W.map(w => `/images/manufacturers/hero-${w}.${ext} ${w}w`).join(', ')

function MfrHeroPhoto() {
  return (
    <picture>
      <source type="image/avif" srcSet={heroSet('avif')} sizes="100vw" />
      <img
        src="/images/manufacturers/hero-1024.webp"
        srcSet={heroSet('webp')}
        sizes="100vw"
        width={1536}
        height={591}
        alt=""
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </picture>
  )
}

function MfrHeroSlider() {
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  /* ⚠️ لایه‌های محوشونده‌ی پوستر حذف شدند و با آن‌ها `prevIdx` و
     `fadingRef`: حالا یک عکس پشتِ همه‌ی اسلایدهاست و آنچه عوض
     می‌شود فقط متن است. نگه‌داشتنِ آن دو یعنی وضعیتی که هیچ‌چیز
     را کنترل نمی‌کند. */
  const advance = (idx: number) => {
    if (idx === activeRef.current) return
    activeRef.current = idx
    setActive(idx)
  }

  useEffect(() => {
    const iv = setInterval(() => {
      const next = (activeRef.current + 1) % MFR_SLIDES.length
      activeRef.current = next
      setActive(next)
    }, 4500)
    return () => clearInterval(iv)
  }, [])

  return (
    <>
      <style>{`
        @keyframes kenBurnsM{0%{transform:scale(1.00) translate(0%,0%)}100%{transform:scale(1.10) translate(1.5%,1%)}}
        @keyframes mfrSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion: reduce){
          .mfr-hero-ken,.mfr-hero-txt{animation:none !important}
        }
      `}</style>
      <section style={{ position: 'relative', height: 'clamp(150px,16vw,205px)', overflow: 'hidden', background: '#0a0a0a', direction: 'rtl' }}>
        <div className="mfr-hero-ken" style={{ position: 'absolute', inset: 0, zIndex: 1, animation: 'kenBurnsM 14s ease-in-out infinite alternate', willChange: 'transform' }}>
          <MfrHeroPhoto />
        </div>
        {/* ⚠️ پرده سمتِ *راست* را تیره می‌کند نه چپ: عنوانِ فارسی
            آن‌جا می‌نشیند و سوژه‌ی عکس سمتِ چپ است. نسخه‌ی پوستری
            برعکس بود و با این عکس روی صورتِ سوژه می‌افتاد. */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: 'linear-gradient(to left, rgba(10,10,10,0.86) 0%, rgba(10,10,10,0.58) 34%, rgba(10,10,10,0.16) 70%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', zIndex: 3, background: 'linear-gradient(to top, rgba(0,0,0,0.80), transparent)' }} />

        <div style={{ position: 'absolute', inset: 0, zIndex: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(12px,2.4vw,32px) clamp(24px,6vw,80px)' }}>
          <div key={active} className="mfr-hero-txt" style={{ maxWidth: 1280, width: '100%', margin: '0 auto', animation: 'mfrSlideIn .55s cubic-bezier(0.22,1,0.36,1) both' }}>
            {/* ⚠️ بدونِ `textAlign`: از ظرفِ RTL جهت می‌گیرد و سمتِ
                شروع (راست) می‌نشیند — همان سمتی که پرده تیره‌اش
                می‌کند. با `left` روی نیمه‌ی روشنِ عکس می‌افتاد و
                طلاییِ ۸٫۹ پیکسلی آن‌جا خوانده نمی‌شد. */}
            <div style={{ marginBottom: 11 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.34)', color: '#D4A843', fontSize: 8.9, fontWeight: 800, borderRadius: 24, padding: '4px 11px', letterSpacing: '0.12em', transform: 'translateY(-13px)', animation: 'softBlink 2.6s .7s ease-in-out infinite' }}>
                MANUFACTURERS . BILLIARD HUB
              </div>
            </div>
            <h1 style={{ fontSize: 'clamp(25px,4vw,50px)', fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.03em', lineHeight: 1.08, transform: 'translateY(-6px)' }}>
              {MFR_SLIDES[active]?.title}
            </h1>
            <p style={{ fontSize: 'clamp(12px,1.35vw,17px)', color: '#D4A843', margin: '7px 0 0', fontWeight: 600, textShadow: '0 0 22px rgba(212,168,67,0.55)' }}>
              {MFR_SLIDES[active]?.sub}
            </p>
          </div>
        </div>

        <div className="hero-dots" style={{ position: 'absolute', bottom: 14, insetInlineStart: 'clamp(24px,6vw,80px)', zIndex: 6, display: 'flex', gap: 7 }}>
          {MFR_SLIDES.map((_, i) => (
            <button key={i} type="button" onClick={() => advance(i)}
              aria-label={`اسلاید ${toFaDigits(String(i + 1))}`}
              aria-current={i === active ? 'true' : undefined}
              style={{ width: i === active ? 24 : 7, height: 7, borderRadius: 4, border: 'none', cursor: 'pointer', padding: 0, background: i === active ? '#C7A66A' : 'rgba(255,255,255,0.32)', transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)' }} />
          ))}
        </div>
      </section>
    </>
  )
}


const CATEGORY_OPTIONS = [
  { value: 'همه',        label: 'همه تخصص‌ها' },
  { value: 'میز',        label: 'میز'         },
  { value: 'چوب',        label: 'چوب'         },
  { value: 'پارچه',      label: 'پارچه'       },
  { value: 'هوشمند',     label: 'هوشمند / دیجیتال' },
] as const
const STATUS_OPTIONS = [
  { value: 'همه',      label: 'همه تولیدکنندگان' },
  { value: 'verified', label: 'تأیید شده'        },
  { value: 'elite',    label: 'رسمی'             },
] as const
const SORT_OPTIONS = [
  { value: 'experience', label: 'باسابقه‌ترین'   },
  { value: 'products',   label: 'بیشترین محصول'  },
  { value: 'newest',     label: 'تازه‌ترین'      },
] as const
type SortKey = typeof SORT_OPTIONS[number]['value']

/* مختصات تقریبی مرکز شهرها برای «نزدیک من» */
const CITY_COORDS: Record<string, [number, number]> = {
  'تهران':  [35.6892, 51.3890],
  'اصفهان': [32.6539, 51.6660],
  'مشهد':   [36.2605, 59.6168],
  'یزد':    [31.8974, 54.3569],
  'شیراز':  [29.5918, 52.5837],
}
const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const PhoneIcon =<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.47-1.47a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>

// ── Manufacturer Card — grid + list, modern gold theme ──────────
function MfrCard({ mfr, view }: { mfr: MockManufacturer; view: 'grid' | 'list' }) {
  const [hov, setHov] = useState(false)
  const router = useRouter()

  const shell: React.CSSProperties = {
    background: 'rgba(255,255,255,0.78)', borderRadius: 14, overflow: 'hidden',
    border: `1.5px solid ${hov ? 'rgba(199,166,106,0.5)' : 'rgba(28,28,26,0.09)'}`,
    boxShadow: hov ? '0 18px 46px rgba(28,28,26,0.13), 0 4px 14px rgba(199,166,106,0.12)' : '0 2px 12px rgba(28,28,26,0.06)',
    transform: hov ? 'translateY(-5px)' : 'none',
    transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)', cursor: 'pointer',
  }

  /* ⚠️ شهر این‌جا نیست: روی خودِ بنر نشسته، همان‌جا که کارتِ باشگاه
     هم نشانش می‌دهد. دو بار تکرارش فقط ردیف را شلوغ می‌کرد.
     ⚠️ و چون `metaRow` بینِ هر دو نما مشترک است، چیپ باید روی بنرِ
     *هر دو* بنشیند وگرنه نمای فهرستی شهر را از دست می‌دهد. */
  const cityChip = mfr.city ? (
    <div style={{ position: 'absolute', bottom: 10, insetInlineStart: 12, background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.92)', fontSize: 11.5, fontWeight: 600, borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      {mfr.city}
    </div>
  ) : null

  /* ── ردیفِ متا، رنگی ──
     خاکستریِ یکدست بود و هیچ‌چیز از هیچ‌چیز جدا نمی‌شد. هر حقیقت
     رنگِ خودش را می‌گیرد: سالِ تأسیس سبزِ نمد (قدمت)، تعدادِ محصول
     آبی (ظرفیت). قرص‌ها کم‌رنگ‌اند تا تأکید بمانند نه سروصدا.
     ⚠️ «از» فقط این‌جاست: `since` دیگر خودش «از ۱۳۹۴» نیست. */
  const metaRow = (
    <div className="mfr-meta" style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
      {mfr.since && (
        <span className="badge badge-green">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          از {toFaDigits(mfr.since)}
        </span>
      )}
      {/* «۰ محصول» با رنگِ تأکید، تأکید روی هیچ است */}
      {mfr.productCount > 0 && (
        <span className="badge badge-blue">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          {toFaDigits(mfr.productCount)} محصول
        </span>
      )}
      {/* گواهینامه روی کارت هم دیده می‌شود — مالک خواست؛ و برای
          خریدار همان چیزی است که تولیدکننده‌ها را از هم جدا می‌کند. */}
      {(mfr.certificates?.length ?? 0) > 0 && (
        <span className="badge badge-gold" title={mfr.certificates.map(c => c.title).join('، ')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6 9 17l-5-5"/></svg>
          {toFaDigits(mfr.certificates.length)} گواهینامه
        </span>
      )}
    </div>
  )
  const specRow = mfr.specialties.length > 0 && (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: TEXT_MUT }}>تخصص:</span>
      {mfr.specialties.slice(0, 3).map(s => (
        <span key={s} style={{ fontSize: 11.5, fontWeight: 600, color: GOLD_D, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.26)', borderRadius: 20, padding: '2px 9px' }}>{s}</span>
      ))}
    </div>
  )
  const viewBtn = (
    <Link href={`/manufacturers/${mfr.id}`} onClick={e => e.stopPropagation()} style={{
      padding: '10px 18px', borderRadius: 10, textAlign: 'center', textDecoration: 'none',
      background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D,
      fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      مشاهده تولیدکننده
    </Link>
  )
  /* ── دکمه‌ی تماس ──
     ⚠️ شماره خام بود: «۲۲۸۵۹۵۵۱» بدونِ کدِ شهر، و گوشی با آن جایی
     را نمی‌گرفت. `iranTel` کدِ استان را از شهر درمی‌آورد و شماره‌ی
     قابلِ شماره‌گیری می‌سازد. بدونِ شماره هم دکمه اصلا نمی‌آید —
     پیش‌تر `tel:` تهی رندر می‌شد. */
  const tel = iranTel(mfr.phone, null, mfr.city)
  const callBtn = tel.href ? (
    <a href={`tel:${tel.href}`} onClick={e => e.stopPropagation()}
      aria-label={`تماس با ${mfr.name}`} title={tel.text}
      style={{
        padding: '10px 14px', borderRadius: 12, textDecoration: 'none',
        border: '1px solid rgba(28,28,26,0.12)', color: TEXT, background: 'rgba(28,28,26,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{PhoneIcon}</a>
  ) : null

  /* ── LIST VIEW ── */
  if (view === 'list') {
    return (
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={() => router.push(`/manufacturers/${mfr.id}`)}
        className="sel-list-card" style={{ ...shell, display: 'flex', alignItems: 'stretch' }}>
        <div className="sel-list-img" style={{ position: 'relative', width: 176, flexShrink: 0, overflow: 'hidden' }}>
          {mfr.bannerImage
            ? <img loading="lazy" decoding="async" src={mfr.bannerImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: hov ? 'scale(1.05)' : 'scale(1)' }} />
            : <MfrPoster variant={mfr.sinceYear} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, rgba(0,0,0,0.05), rgba(0,0,0,0.35))' }} />
          {mfr.elite && (
            <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(199,166,106,0.94)', color: '#3a2800', fontSize: 10.5, fontWeight: 800, borderRadius: 20, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              رسمی
            </div>
          )}
          {cityChip}
        </div>
        <div className="sel-list-body" style={{ flex: 1, minWidth: 0, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: 0 }}>{mfr.name}{mfr.verified && <VerifiedBadge title="تولیدکننده‌ی تأیید شده" />}</h3>
          </div>
          <p className="sel-list-desc" style={{ fontSize: 12.5, color: TEXT_SEC, margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{mfr.description}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>{metaRow}</div>
          <div className="sel-list-brands">{specRow}</div>
        </div>
        <div className="sel-list-actions" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, padding: '16px 20px', flexShrink: 0, borderInlineStart: '1px solid rgba(28,28,26,0.06)' }}>
          {viewBtn}{callBtn}
        </div>
      </div>
    )
  }

  /* ── GRID VIEW ── */
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={() => router.push(`/manufacturers/${mfr.id}`)}
      style={{ ...shell, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* banner (ارتفاع +۱۰٪ ⇒ کل کارت بلندتر) */}
      <div style={{ height: 154, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {mfr.bannerImage
            ? <img loading="lazy" decoding="async" src={mfr.bannerImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: hov ? 'scale(1.05)' : 'scale(1)' }} />
            : <MfrPoster variant={mfr.sinceYear} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.45) 100%)' }} />
        {mfr.elite && (
          <div style={{ position: 'absolute', top: 10, right: 12, background: 'rgba(199,166,106,0.94)', backdropFilter: 'blur(8px)', color: '#3a2800', fontSize: 11, fontWeight: 800, borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            تولیدکننده‌ی رسمی
          </div>
        )}
        {cityChip}
      </div>

      {/* body — flex تا کارت پر شود و دکمه‌ها ته کارت بچسبند ⇒ همه‌ی کارت‌ها یک‌اندازه */}
      {/* ⚠️ نشانِ گردِ شناورِ روی بنر برداشته شد: یک گلیفِ ساختگی بود
          (از نام ساخته می‌شد، نه لوگوی واقعی) که نصفش روی عکس
          می‌افتاد و همان چیزی بود که کارت را «بهم‌ریخته» نشان می‌داد.
          کارتِ باشگاه هم چنین چیزی ندارد. */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 18px 18px' }}>
        <div style={{ margin: '0 0 5px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: 0, lineHeight: 1.35 }}>{mfr.name}{mfr.verified && <VerifiedBadge title="تولیدکننده‌ی تأیید شده" />}</h3>
        </div>

        {mfr.description && (
          <p style={{ fontSize: 12.5, color: TEXT_SEC, margin: '0 0 12px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{mfr.description}</p>
        )}

        <div style={{ marginBottom: 12 }}>{metaRow}</div>
        {/* ⚠️ `minHeight` ثابت برداشته شد: تولیدکننده‌ای که تخصصی ثبت
            نکرده، یک نوارِ خالیِ ۲۶ پیکسلی وسطِ کارتش می‌ماند. */}
        {specRow && <div style={{ marginBottom: 16 }}>{specRow}</div>}

        <div style={{ marginTop: 'auto', display: 'flex', gap: 8, borderTop: '1px solid rgba(28,28,26,0.06)', paddingTop: 14 }}>
          <div style={{ flex: 1 }}>
            <Link href={`/manufacturers/${mfr.id}`} onClick={e => e.stopPropagation()} style={{
              display: 'block', padding: '10px 0', borderRadius: 10, textAlign: 'center', textDecoration: 'none',
              background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D,
              fontSize: 13, fontWeight: 700,
            }}>
              مشاهده تولیدکننده
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
export default function ManufacturersPage() {
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('همه')
  const [status,   setStatus]   = useState('همه')
  const [sort,     setSort]     = useState<SortKey>('experience')
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

  /* null یعنی هنوز از سرور نیامده — تا آن‌موقع نسخه‌ی مرورگر نمایش داده می‌شود */
  const [remoteMfrs, setRemoteMfrs] = useState<ManufacturerProfile[] | null>(null)
  useEffect(() => {
    void fetchProfiles<ManufacturerProfile>('manufacturer').then(rows => {
      setRemoteMfrs(rows.filter(r => r.status === 'approved')
        /* `verified` ستون جدول `profiles` است، نه داخل jsonb —
           بدون این، تیک ادمین به کارت نمی‌رسید. */
        .map(r => ({ ...r.data, slug: r.slug, verified: r.verified } as ManufacturerProfile)))
    })
  }, [])

  const matchCat = (m: MockManufacturer, term: string) =>
    m.specialties.some(sp => sp.includes(term) || term.includes(sp)) || m.description.includes(term)
  const distOf = (m: MockManufacturer) => {
    const c = CITY_COORDS[m.city.split('،')[0]!.trim()]
    return userLoc && c ? calcDistance(userLoc.lat, userLoc.lon, c[0], c[1]) : undefined
  }

  const filtered = useMemo(() => {
    /* تولیدکنندگان ثبت‌نامی اول لیست می‌نشینند — از سرور، و تا آمدن
       پاسخ از همین مرورگر */
    const registered = (remoteMfrs ?? listApprovedManufacturers()).map(profileToManufacturer)
    const ALL = [...registered, ...MANUFACTURERS.filter(m => !registered.some(r => r.id === m.id))]
    const list = ALL
      .filter(m => !search.trim() || m.name.includes(search.trim()) || m.city.includes(search.trim()) || m.specialties.some(sp => sp.includes(search.trim())))
      .filter(m => category === 'همه' || matchCat(m, category))
      .filter(m => status === 'همه' || (status === 'verified' && m.verified) || (status === 'elite' && m.elite))
    return [...list].sort((a, b) => {
      if (nearMe && userLoc) { const da = distOf(a) ?? 9e9, db = distOf(b) ?? 9e9; if (da !== db) return da - db }
      if (sort === 'products')   return b.productCount - a.productCount
      if (sort === 'newest')     return b.sinceYear - a.sinceYear
      return a.sinceYear - b.sinceYear   // experience = باسابقه‌ترین (قدیمی‌تر اول)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, status, sort, nearMe, userLoc, remoteMfrs])

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes softBlink { 0%,100%{opacity:1} 50%{opacity:0.5} }
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
        .sel-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; grid-auto-rows: 1fr; }
        @media(max-width:1000px) { .sel-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media(max-width:600px)  { .sel-grid { grid-template-columns: 1fr !important; } }
        /* حالت فوکوس از سیستم مشترک .input می‌آید */
        @media(max-width:640px){
          .sel-list-img { width: clamp(96px,28vw,128px) !important; }
          .sel-list-actions { display: none !important; }
          .sel-list-brands { display: none !important; }
          .sel-list-desc { display: none !important; }
          .sel-list-body { padding: 12px 14px !important; gap: 7px !important; }
        }
        @media(max-width:640px){
          .dd-label { display: none !important; }
          .dd-btn { min-width: 0 !important; padding: 0 11px !important; }
          .sel-hide-mob { display: none !important; }
        }

        /* ── قرص‌های حقیقتِ کارت ──
           ردیفِ متا خاکستریِ یکدست بود؛ حالا هر حقیقت رنگِ خودش را
           دارد. کلاس‌ها از سیستمِ مشترکِ globals می‌آیند
           (.badge / .badge-green / .badge-blue)، نه نسخه‌ی محلی.
           فقط nowrap این‌جاست چون کارت باریک است. */
        .mfr-meta .badge { white-space: nowrap; }

        /* ══ نوار ابزار — هم‌شکلِ نوارِ صفحه‌ی باشگاه‌ها ══ */
        .mfr-tb {
          position: sticky; top: 62px; z-index: 90;
          padding: 10px clamp(16px,4vw,40px);
          background: rgba(250,249,246,0.62);
          border-block-end: 1px solid rgba(28,28,26,0.07);
          backdrop-filter: blur(24px) saturate(1.6);
          -webkit-backdrop-filter: blur(24px) saturate(1.6);
        }
        .mfr-tb-in { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        /* همه‌ی کنترل‌ها یک ارتفاع: ردیفِ ناهم‌ارتفاع همان چیزی است که
           نوار را «بهم‌ریخته» نشان می‌داد.
           (padding این‌جا نیاید — اینلاین است و بدون !important بازنده) */
        .mfr-tb-in .dd-btn { height: 44px; }

        .mfr-tb-srch {
          display: flex; align-items: center; gap: 8px;
          height: 44px; padding-inline: 14px; border-radius: 12px;
          flex: 1 1 160px; min-width: 150px; max-width: 300px;
          background: rgba(255,255,255,0.72);
          border: 1px solid rgba(28,28,26,0.10);
          transition: border-color .3s, box-shadow .3s;
        }
        .mfr-tb-srch:focus-within { border-color: rgba(199,166,106,0.45); box-shadow: 0 0 0 3px rgba(199,166,106,0.10); }
        .mfr-tb-srch > svg { flex-shrink: 0; color: rgba(0,0,0,0.30); }
        .mfr-tb-srch input {
          flex: 1; min-width: 0; border: 0; background: none; outline: none;
          font: inherit; font-size: 13.5px; color: #1C1C1A;
        }
        .mfr-tb-srch input::placeholder { color: rgba(0,0,0,0.32); }
        .mfr-tb-srch input::-webkit-search-cancel-button { display: none; }
        .mfr-tb-srch > button {
          display: flex; flex-shrink: 0; padding: 0; border: 0; background: none;
          color: rgba(0,0,0,0.35); cursor: pointer;
        }
        .mfr-tb-srch > button:hover { color: rgba(0,0,0,0.6); }

        .mfr-tb-btn {
          display: flex; align-items: center; justify-content: center; gap: 7px; flex-shrink: 0;
          height: 44px; padding-inline: 16px; border-radius: 12px; white-space: nowrap;
          font: inherit; font-size: 13.5px; font-weight: 700; cursor: pointer;
          border: 1px solid rgba(0,0,0,0.09); background: #fff; color: rgba(0,0,0,0.55);
          transition: all .2s;
        }
        .mfr-tb-btn:hover { border-color: rgba(199,166,106,0.40); background: rgba(199,166,106,0.06); }
        .mfr-tb-btn:focus-visible, .mfr-tb-vbtn:focus-visible, .mfr-tb-srch > button:focus-visible {
          outline: 2px solid #14532D; outline-offset: 2px;
        }
        .mfr-tb-btn:disabled { cursor: not-allowed; opacity: .6; }
        .mfr-tb-btn.on { border-color: rgba(199,166,106,0.40); background: rgba(199,166,106,0.10); color: #A07840; }
        .mfr-tb-btn.bad { border-color: rgba(239,68,68,0.40); color: #dc2626; }
        .mfr-tb-spin {
          width: 14px; height: 14px; border-radius: 50%; display: inline-block;
          border: 2px solid rgba(199,166,106,0.3); border-top-color: #C7A66A;
          animation: spin .8s linear infinite;
        }

        .mfr-tb-view { display: flex; gap: 4px; flex-shrink: 0; }
        .mfr-tb-vbtn {
          width: 44px; height: 44px; border-radius: 12px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(28,28,26,0.10); background: #fff; color: rgba(0,0,0,0.42);
          transition: all .2s;
        }
        .mfr-tb-vbtn:hover { border-color: rgba(199,166,106,0.36); background: rgba(199,166,106,0.06); }
        .mfr-tb-vbtn.on { border-color: rgba(199,166,106,0.40); background: rgba(199,166,106,0.12); color: #A07840; }
        @media (prefers-reduced-motion: reduce) {
          .mfr-tb-btn, .mfr-tb-vbtn, .mfr-tb-srch { transition: none; }
          .mfr-tb-spin { animation: none; }
        }
      `}</style>

      <div className="lq-stage" style={{ minHeight: '100vh', direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif', color: TEXT }}>

        {/* ─────── HERO — همان الگوی صفحه‌ی مربیان ─────── */}
        <MfrHeroSlider />

        {/* ══ نوار ابزارِ چسبان — همان نوارِ صفحه‌ی باشگاه‌ها ══
            نسخه‌ی قبلی دو بلوکِ روی هم بود: یک سرچ‌باکسِ تمام‌عرض و
            زیرش یک کارتِ شیشه‌ایِ فیلترها. روی دسکتاپ نزدیک ۱۴۰
            پیکسل از بالای فهرست را می‌گرفت و دو سطحِ شیشه‌ی تودرتو
            می‌ساخت. حالا یک ردیف است، تمام‌عرض، با همان شیشه‌ی
            نیمه‌شفاف و همان ارتفاعِ ۴۴ که صفحه‌ی باشگاه‌ها دارد. */}
        <div className="mfr-tb">
          <div className="mfr-tb-in">
            <div className="mfr-tb-srch">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search" aria-label="جستجوی تولیدکننده"
                placeholder="جستجوی تولیدکننده، شهر یا تخصص..."
                value={search} onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} aria-label="پاک‌کردن جستجو">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            <span className="sel-hide-mob" style={{ display: 'contents' }}>
              <Dropdown label="تخصص:" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} minWidth={150} />
            </span>
            <span className="sel-hide-mob" style={{ display: 'contents' }}>
              <Dropdown label="نمایش بر اساس:" options={SORT_OPTIONS} value={sort} onChange={v => setSort(v as SortKey)} minWidth={160} />
            </span>
            <Dropdown label="وضعیت:" options={STATUS_OPTIONS} value={status} onChange={setStatus} minWidth={140} />

            {/* ⚠️ دکمه‌ی حالت‌دار است، پس `aria-pressed`؛ و در حالِ
                گرفتنِ موقعیت غیرفعال، وگرنه کلیکِ دوم یک درخواستِ
                موازیِ دیگر می‌فرستد. خطا هم باید *گفته* شود نه فقط
                قرمز شود. */}
            <button
              type="button" onClick={getLocation}
              disabled={locLoading}
              aria-pressed={nearMe}
              aria-busy={locLoading || undefined}
              title={locError ? 'دسترسی به موقعیت رد شد' : 'نزدیک‌ترین تولیدکنندگان'}
              className={'mfr-tb-btn' + (nearMe ? ' on' : '') + (locError ? ' bad' : '')}
            >
              {locLoading
                ? <span className="mfr-tb-spin" aria-hidden />
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>}
              نزدیک من
            </button>
            {/* خطای موقعیت باید شنیده هم بشود، نه فقط قرمز دیده شود */}
            <span aria-live="polite" className="sr-only">
              {locError ? 'دسترسی به موقعیت رد شد' : locLoading ? 'در حال یافتن موقعیت شما' : ''}
            </span>

            <div className="mfr-tb-view">
              {([['grid', <svg key="g" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>], ['list', <svg key="l" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>]] as const).map(([v, icon]) => (
                <button key={v} type="button" onClick={() => setView(v as 'grid'|'list')}
                  aria-pressed={view === v}
                  aria-label={v === 'grid' ? 'نمای شبکه‌ای' : 'نمای لیستی'}
                  className={'mfr-tb-vbtn' + (view === v ? ' on' : '')}>{icon}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ─────── BODY ─────── */}
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: 'clamp(16px,2.6vw,26px) clamp(16px,3vw,32px) 64px' }}>
          {/* ─── GRID / LIST ─── */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: TEXT_MUT }}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <p style={{ fontSize: 17, fontWeight: 700, color: TEXT_SEC }}>تولیدکننده‌ای یافت نشد</p>
              <p style={{ fontSize: 14 }}>فیلترها را تغییر دهید یا جستجو را پاک کنید</p>
            </div>
          ) : view === 'grid' ? (
            <div className="sel-grid" style={{ marginBottom: 56 }}>
              {filtered.map((m, i) => (
                <div key={m.id} style={{ animation: `fadeUp ${0.3 + i * 0.05}s ease both` }}>
                  <MfrCard mfr={m} view="grid" />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 56 }}>
              {filtered.map((m, i) => (
                <div key={m.id} style={{ animation: `fadeUp ${0.28 + i * 0.04}s ease both` }}>
                  <MfrCard mfr={m} view="list" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

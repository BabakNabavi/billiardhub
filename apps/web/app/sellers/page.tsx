'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { toFaDigits } from '../../lib/jalali'

import { listApprovedSellers, type SellerProfile } from '../../lib/seller-store'
import { fetchProfiles } from '../../lib/profiles/client'
import VerifiedBadge from '../../components/VerifiedBadge'
import type { MockSeller } from '../../lib/sellers-data'

const GOLD     = '#C7A66A'
const GOLD_D   = '#8F6531'
/* رنگ پایه‌ی صفحه حالا داخل کلاس مشترک lq-stage است */
const TEXT     = '#1C1C1A'
const TEXT_SEC = 'rgba(28,28,26,0.52)'
const TEXT_MUT = 'rgba(28,28,26,0.32)'


/* ── عکسِ هدرِ فهرست ──
   ⚠️ پیش از این پنج پوسترِ برداری (گرادیان + موتیفِ SVG) پشتِ متن
   محو می‌شدند. حالا یک عکسِ واقعی از یک فروشگاهِ بیلیارد — که مالک
   داد — پشتِ همه‌ی اسلایدها می‌نشیند و آنچه عوض می‌شود فقط متن
   است. همان درسِ هدرِ تولیدکنندگان: صحنه‌ی SVG هرچقدر هم دقیق
   کشیده شود، چشم فورا می‌فهمد عکس نیست.

   ⚠️ قیدِ ترکیب‌بندی — این‌جا برعکسِ هدرِ تولیدکنندگان است و مهم:
   صفحه راست‌به‌چپ است و عنوانِ هیرو سمتِ راست می‌نشیند، ولی
   روشن‌ترین جای این عکس هم همان سمتِ راست است (پنجره و میزِ آبی).
   پس پرده این‌جا از هدرِ تولیدکنندگان تیره‌تر بسته شده. اگر روزی
   عکس عوض شد، اول همین را بسنج.

   ⚠️ نسبتِ ۲٫۶:۱ و نردبانِ ۷۶۸…۱۵۳۶ عیناً مثل هدرِ تولیدکنندگان.
   دلیلش دیکد است نه بایت: نوارِ هیرو ۱۵۰ تا ۲۰۵ پیکسل بلند است و
   روی موبایلِ ۳۷۵ پیکسلی نسبتِ نمایش ۲٫۵:۱ می‌شود، پس آن‌جا این برش
   تقریبا هیچ ردیفِ دیکدشده‌ای را دور نمی‌ریزد. ⚠️ روی دسکتاپ این‌طور
   نیست: نوار به ۲۰۵ پیکسل قفل می‌شود و کادرِ نمایش ۷٫۵:۱ می‌شود،
   یعنی cover حدودِ دو سومِ ردیف‌ها را دور می‌ریزد. این معامله عمدی
   است، چون مخاطبِ اصلی موبایل است. برش مرکزِ ۵۲٪
   ارتفاع است، جایی که دیوارِ چوب‌ها و پیشخوانِ توپ‌ها هر دو در
   کادر می‌مانند.

   ⚠️ این عکس شلوغ‌تر از هدرِ تولیدکنندگان است (ردیفِ چوب‌ها و
   توپ‌های رنگی یعنی جزئیاتِ پرفرکانس)، پس با همان کیفیت حدودِ دو
   برابر بایت می‌گیرد. موبایلِ DPR۲ پله‌ی ۷۶۸ را می‌گیرد: ۱۹
   کیلوبایت AVIF. پایین‌تر بردنِ کیفیت از این، ردیفِ چوب‌ها را
   لک می‌کند. */
const HERO_W = [768, 1024, 1280, 1536] as const
/* ⚠️ `HERO_V` تزئین نیست؛ برداشتنش باگ را برمی‌گرداند.
   عکس‌ها با `Cache-Control: public, max-age=604800` سرو می‌شوند —
   هفت روز، به‌اضافه‌ی سی روز `stale-while-revalidate`. بارِ اول که
   عکسِ هدر عوض شد نامِ فایل همان ماند، پس آدرس عوض نشد و هر مرورگری
   که صفحه را در آن هفته دیده بود **اصلا درخواست نمی‌داد** و عکسِ
   قدیمی را نشان می‌داد. سرور درست بود و هشِ بایت‌ها هم یکی بود؛
   چیزی که فرق داشت فقط کشِ مرورگر بود. مالک همین را گزارش کرد.
   ⟵ هر بار عکس عوض شد، این عدد هم باید جلو برود. */
const HERO_V = 'v1'
const heroSet = (ext: string) =>
  HERO_W.map(w => `/images/sellers/hero-${w}-${HERO_V}.${ext} ${w}w`).join(', ')

function SellerHeroPhoto() {
  return (
    <picture>
      <source type="image/avif" srcSet={heroSet('avif')} sizes="100vw" />
      <img
        src={`/images/sellers/hero-1024-${HERO_V}.webp`}
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

/* ── اسلایدهای هدر ──
   متنِ هر اسلاید کوتاه است چون روی موبایل کنارِ تصویر جا باید بماند. */
const SELLER_SLIDES = [
  { title: 'فروشگاه‌های بیلیارد',  sub: 'چوب، میز، توپ و لوازم جانبی' },
  { title: 'از معتبرترین فروشندگان', sub: 'خرید مطمئن، قیمت شفاف' },
  { title: 'همه‌ی برندها، یک‌جا',   sub: 'مقایسه کن و انتخاب کن' },
  { title: 'تجهیز باشگاه و خانه',   sub: 'هر چه برای بازی لازم داری' },
  { title: 'نزدیک‌ترین فروشگاه',    sub: 'در شهر خودت پیدا کن' },
]

/* ════════ HERO — همان الگوی صفحه‌ی تولیدکنندگان ════════
   یک عکس پشتِ همه‌ی اسلایدها، دو پرده‌ی تیره برای خوانایی، و تنها
   چیزی که با اسلاید عوض می‌شود متن است. شرحِ عکس و برش بالاتر. */
function SellerHeroSlider() {
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  /* ⚠️ لایه‌های محوشونده‌ی پوستر رفتند و با آن‌ها `prevIdx` و
     `fadingRef`: حالا یک عکس پشتِ همه‌ی اسلایدهاست و آنچه عوض
     می‌شود فقط متن است. نگه‌داشتنشان یعنی وضعیتی که دیگر هیچ‌چیز
     را کنترل نمی‌کند. */
  /* ⚠️ کلیکِ روی نشانگر شمارش را از نو شروع می‌کند. بدونِ این، اگر
     درست پیشِ پایانِ چرخه بزنی، چند میلی‌ثانیه بعد خودکار ردش می‌کند
     و انتخابت گم می‌شود. */
  const restartRef = useRef<() => void>(() => {})

  const advance = (idx: number) => {
    if (idx === activeRef.current) return
    activeRef.current = idx
    setActive(idx)
    restartRef.current()
  }

  useEffect(() => {
    let iv: ReturnType<typeof setInterval> | null = null
    /* ⚠️ «حرکتِ کم» فقط انیمیشنِ CSS نیست: عوض‌شدنِ خودکارِ عنوان هر
       ۴٫۵ ثانیه هم حرکت است (WCAG 2.2.2). پرده‌ی reduced-motion پایین
       فقط ken-burns و ورودِ متن را می‌خواباند، نه این تایمر را. برای
       کسی که حرکت را خاموش کرده، روی اسلاید اول می‌ماند و نشانگرها
       همچنان کار می‌کنند. */
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const start = () => {
      if (iv) clearInterval(iv)
      if (reduced.matches) return
      iv = setInterval(() => {
        const next = (activeRef.current + 1) % SELLER_SLIDES.length
        activeRef.current = next
        setActive(next)
      }, 4500)
    }
    restartRef.current = start
    start()
    return () => { if (iv) clearInterval(iv) }
  }, [])

  return (
    <>
      <style>{`
        @keyframes kenBurnsS{0%{transform:scale(1.00) translate(0%,0%)}100%{transform:scale(1.10) translate(-1.5%,1%)}}
        @keyframes selSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion: reduce){
          .sel-hero-ken,.sel-hero-txt{animation:none !important}
        }
      `}</style>
      <section style={{ position: 'relative', height: 'clamp(150px,16vw,205px)', overflow: 'hidden', background: '#0a0a0a', direction: 'rtl' }}>
        <div className="sel-hero-ken" style={{ position: 'absolute', inset: 0, zIndex: 1, animation: 'kenBurnsS 14s ease-in-out infinite alternate', willChange: 'transform' }}>
          <SellerHeroPhoto />
        </div>
        {/* ⚠️ پرده سمتِ *راست* را تیره می‌کند نه چپ. نسخه‌ی پوستری
            برعکس بود (`to right`) و چون خودِ پوسترها تیره بودند کسی
            متوجه نشد؛ با یک عکسِ واقعی، عنوانِ فارسی درست روی
            روشن‌ترین نقطه می‌افتاد. */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: 'linear-gradient(to left, rgba(10,10,10,0.90) 0%, rgba(10,10,10,0.66) 34%, rgba(10,10,10,0.22) 70%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, insetInline: 0, height: '55%', zIndex: 3, background: 'linear-gradient(to top, rgba(0,0,0,0.80), transparent)' }} />

        <div style={{ position: 'absolute', inset: 0, zIndex: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(12px,2.4vw,32px) clamp(24px,6vw,80px)' }}>
          <div key={active} className="sel-hero-txt" style={{ maxWidth: 1280, width: '100%', margin: '0 auto', animation: 'selSlideIn .55s cubic-bezier(0.22,1,0.36,1) both' }}>
            {/* ⚠️ بدونِ `textAlign:'left'`: نشان از ظرفِ RTL جهت
                می‌گیرد و کنارِ عنوان سمتِ راست می‌نشیند — همان سمتی
                که پرده تیره‌اش می‌کند. با `left` روی نیمه‌ی روشن
                می‌افتاد و طلاییِ ۸٫۹ پیکسلی آن‌جا خوانده نمی‌شد. */}
            <div style={{ marginBottom: 11 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.34)', color: '#D4A843', fontSize: 8.9, fontWeight: 800, borderRadius: 24, padding: '4px 11px', letterSpacing: '0.12em', transform: 'translateY(-13px)', animation: 'softBlink 2.6s .7s ease-in-out infinite' }}>
                MARKET PLACE . BILLIARD HUB
              </div>
            </div>
            <h1 style={{ fontSize: 'clamp(25px,4vw,50px)', fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.03em', lineHeight: 1.08, transform: 'translateY(-6px)' }}>
              {SELLER_SLIDES[active]?.title}
            </h1>
            <p style={{ fontSize: 'clamp(12px,1.35vw,17px)', color: '#D4A843', margin: '7px 0 0', fontWeight: 600, textShadow: '0 0 22px rgba(212,168,67,0.55)' }}>
              {SELLER_SLIDES[active]?.sub}
            </p>
          </div>
        </div>

        {/* نشانگرها از دید پنهان‌اند ولی با فوکوس برمی‌گردند — همان
            رفتارِ هدرِ مربیان، تا کاربر کیبورد از تغییر اسلاید محروم نشود. */}
        <div className="hero-dots" style={{ position: 'absolute', bottom: 14, insetInlineStart: 'clamp(24px,6vw,80px)', zIndex: 6, display: 'flex', gap: 7 }}>
          {SELLER_SLIDES.map((_, i) => (
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


/* ── فقط فروشگاه‌های واقعی ────────────────────────────────────────
   تا امروز پایه‌ی این فهرست `MOCK_SELLERS` بود: پنج فروشگاه ساختگی با
   نام و شهر و تلفن، که همیشه — حتی روی Production — به کاربر نشان داده
   می‌شدند. جدول `profiles` صفر ردیف دارد، یعنی هرچه بازدیدکننده در
   این صفحه می‌دید ساختگی بود.

   بدتر اینکه صفحه‌ی اول صادق بود و همین فهرست را خالی نشان می‌داد؛ پس
   کاربر در Home هیچ فروشگاهی نمی‌دید و در /sellers پنج‌تا. همان کاری
   که قبلا با `SAMPLE_CLUBS` شد این‌جا هم انجام می‌شود: پایه خالی است و
   فهرست فقط از فروشگاه‌های تأییدشده‌ی واقعی پر می‌شود. */
const SELLERS: MockSeller[] = []

/* یک فروشگاه ذخیره‌شده (از /dashboard/seller، تاییدشده) را به شکل کارت همین لیست در می‌آورد.
   فیلدهایی که فروشنده وارد نکرده با پیش‌فرض خنثی پر می‌شوند تا کارت نشکند. */
function profileToSeller(p: SellerProfile): typeof SELLERS[0] {
  const phones = p.phones.filter(x => x.trim())
  return {
    id: p.slug,
    name: p.title || 'فروشگاه',
    city: p.city || '—',
    verified: p.verified,
    elite: false,
    rating: 5,
    reviewCount: 0,
    /* شمار محصول پیش‌تر از کاتالوگ ساختگی می‌آمد و برای هر فروشگاه
       واقعی عدد فروشگاه نمونه را نشان می‌داد. تا وقتی شمار واقعی از
       سرور نیامده، عددی نشان داده نمی‌شود. */
    productCount: 0,
    since: '۱۴۰۴',
    sinceYear: 1404,
    brands: (p.brands ?? []).filter(b => b.trim()),
    specialties: [] as string[],
    responseTime: '—',
    phone: p.contactPhone || phones[0] || '',
    bannerImage: p.gallery[0]?.url || p.storyImage || '/images/shop/Pro_table.webp',
    description: p.desc || '',
  }
}

/* فروشگاه‌های تاییدشده روی لیست هاردکد سوار می‌شوند؛ اگر id یکی بود، نسخه‌ی ذخیره‌شده برنده است */
function mergeStores(base: typeof SELLERS, approved: SellerProfile[]): typeof SELLERS {
  const byId = new Map(base.map(s => [s.id, s]))
  for (const p of approved) byId.set(p.slug, profileToSeller(p))
  return [...byId.values()]
}

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


// ── Logo — لوگوی آپلودشده، وگرنه آیکون مدرن فروشگاه (نه حرف اول اسم) ──
function SellerLogo({ name, logo, size = 62 }: { name: string; logo?: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      padding: 2.5, background: `linear-gradient(135deg,${GOLD},${GOLD_D})`,
      boxShadow: `0 6px 18px rgba(199,166,106,0.45)`,
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
        border: '2.5px solid #fff',
        background: 'linear-gradient(135deg,#14532D,#1E6B3C)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
      }}>
        {logo
          ? <img loading="lazy" decoding="async" src={logo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (
            <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
              <path d="M2 7h20"/>
              <path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>
            </svg>
          )}
      </div>
    </div>
  )
}

const PhoneIcon =<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.47-1.47a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>

// ── Seller Card — grid + list, modern gold theme ──────────────
function SellerCard({ seller, view }: { seller: typeof SELLERS[0]; view: 'grid' | 'list' }) {
  const [hov, setHov] = useState(false)

  /* جنس سطح از کلاس مشترک lq-pcard می‌آید؛ این‌جا فقط لبه‌ی
     طلایی hover می‌ماند که نشانه‌ی همین فهرست است. */
  const shell: React.CSSProperties = {
    overflow: 'hidden', cursor: 'pointer',
    borderColor: hov ? 'rgba(199,166,106,0.55)' : undefined,
  }

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
  const brandsRow = seller.brands.length > 0 && (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: TEXT_MUT }}>نمایندگی:</span>
      {seller.brands.map(b => (
        <span key={b} style={{ fontSize: 11.5, fontWeight: 600, color: GOLD_D, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.26)', borderRadius: 20, padding: '2px 9px' }}>{b}</span>
      ))}
    </div>
  )
  const viewBtn = (
    <Link href={`/sellers/${seller.id}`} style={{
      padding: '10px 18px', borderRadius: 10, textAlign: 'center', textDecoration: 'none',
      background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D,
      fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      مشاهده فروشگاه
    </Link>
  )
  const callBtn = (
    <a href={`tel:${seller.phone}`} style={{
      padding: '10px 14px', borderRadius: 12, textDecoration: 'none',
      border: '1px solid rgba(28,28,26,0.12)', color: TEXT, background: 'rgba(28,28,26,0.04)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{PhoneIcon}</a>
  )

  /* ── LIST VIEW ── */
  if (view === 'list') {
    return (
      /* ── چرا روکش لینک و نه onClick روی کارت ──
         `<div onClick>` نه با کیبورد باز می‌شود، نه حلقه‌ی فوکوس دارد،
         نه «باز کردن در تب جدید» — و قاعده‌ی دسترس‌پذیری پروژه هم
         ممنوعش می‌کند. لینک دور کل کارت هم نمی‌شود، چون داخلش دکمه‌ی
         تماس و «مشاهده فروشگاه» هستند و `<a>` تودرتو نامعتبر است.

         پس نام فروشگاه لینک می‌شود و `::after`ش کل کارت را می‌پوشاند:
         یک لینک واقعی با نام درست برای صفحه‌خوان، کلیک روی هرجای
         کارت، و دکمه‌های داخلی که با z-index رویش می‌مانند. */
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        className="sel-list-card sel-card lq-pcard" style={{ ...shell, display: 'flex', alignItems: 'stretch', minHeight: 158 }}>
        {/* image */}
        <div className="sel-list-img" style={{ position: 'relative', width: 176, flexShrink: 0, overflow: 'hidden' }}>
          <img loading="lazy" decoding="async" src={seller.bannerImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: hov ? 'scale(1.05)' : 'scale(1)' }} />
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
            <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: 0 }}>
              <Link href={`/sellers/${seller.id}`} className="sel-card-link">{seller.name}</Link>
              {seller.verified && <VerifiedBadge title="فروشگاه تأیید شده" />}
            </h3>
          </div>
          {/* ارتفاع ثابت برای توضیح و برندها ⇒ همه‌ی ردیف‌ها هم‌اندازه */}
          <p className="sel-list-desc" style={{ fontSize: 12.5, color: TEXT_SEC, margin: 0, lineHeight: 1.6, height: 40, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{seller.description}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>{metaRow}</div>
          <div className="sel-list-brands" style={{ height: 24, overflow: 'hidden' }}>{brandsRow}</div>
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
    /* روکش لینک — دلیلش کنار نمای فهرستی */
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="sel-card lq-pcard" style={{ ...shell, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* banner (ارتفاع +۱۰٪ ⇒ کل کارت بلندتر) */}
      <div style={{ height: 154, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <img loading="lazy" decoding="async" src={seller.bannerImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: hov ? 'scale(1.05)' : 'scale(1)' }} />
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

      {/* body — flex تا کارت پر شود و دکمه‌ها ته کارت بچسبند ⇒ همه‌ی کارت‌ها یک‌اندازه */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 18px 18px' }}>
        {/* logo fully visible (no badge overlap on image) */}
        {/* بدون z-index: لوگو تعاملی نیست و اگر بالای روکش بنشیند،
            کلیک روی همان ناحیه هیچ‌کاری نمی‌کند. ترتیب DOM برای
            دیده‌شدنش روی بنر کافی است. */}
        <div style={{ marginTop: -32, marginBottom: 12, position: 'relative' }}>
          <SellerLogo name={seller.name} size={62} />
        </div>

        {/* name */}
        <div style={{ margin: '0 0 5px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: 0, lineHeight: 1.35 }}>
            <Link href={`/sellers/${seller.id}`} className="sel-card-link">{seller.name}</Link>
            {seller.verified && <VerifiedBadge title="فروشگاه تأیید شده" />}
          </h3>
        </div>

        {/* توضیحات — همیشه فضای ۲ خط را می‌گیرد تا ارتفاع کارت‌ها یکسان بماند */}
        <p style={{ fontSize: 12.5, color: TEXT_SEC, margin: '0 0 12px', lineHeight: 1.6, minHeight: 40, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{seller.description}</p>

        <div style={{ marginBottom: 12 }}>{metaRow}</div>
        <div style={{ marginBottom: 16, minHeight: 26 }}>{brandsRow}</div>

        {/* action buttons — به ته کارت چسبیده */}
        <div style={{ marginTop: 'auto', display: 'flex', gap: 8, borderTop: '1px solid rgba(28,28,26,0.06)', paddingTop: 14 }}>
          <div style={{ flex: 1 }}>
            <Link href={`/sellers/${seller.id}`} style={{
              display: 'block', padding: '10px 0', borderRadius: 10, textAlign: 'center', textDecoration: 'none',
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

  /* فروشگاه‌های تاییدشده‌ی ذخیره‌شده. مقدار اولیه = SELLERS تا SSR و اولین رندر کلاینت یکی باشند؛
     بعد از mount، فروشگاه‌های approved از localStorage خوانده و اضافه می‌شوند. */
  const [stores, setStores] = useState<typeof SELLERS>(SELLERS)
  useEffect(() => {
    /* فورا هرچه در همین مرورگر هست، بعد فهرست سرور که همه‌ی
       فروشگاه‌ها را دارد نه فقط فروشگاه خود بیننده. */
    setStores(mergeStores(SELLERS, listApprovedSellers()))
    void fetchProfiles<SellerProfile>('seller').then(rows => {
      const remote = rows.filter(r => r.status === 'approved')
        .map(r => ({ ...r.data, slug: r.slug, verified: r.verified } as SellerProfile))
      if (remote.length) setStores(mergeStores(SELLERS, remote))
    })
  }, [])

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
    const list = stores
      .filter(s => !search.trim() || s.name.includes(search.trim()) || s.city.includes(search.trim()) || s.brands.some(b => b.toLowerCase().includes(search.toLowerCase())) || s.specialties.some(sp => sp.includes(search.trim())))
      .filter(s => category === 'همه' || matchSpec(s, category))
      .filter(s => status === 'همه' || (status === 'verified' && s.verified) || (status === 'elite' && s.elite) || (status === 'top' && s.rating >= 4.7))
    return [...list].sort((a, b) => {
      if (nearMe && userLoc) { const da = distOf(a) ?? 9e9, db = distOf(b) ?? 9e9; if (da !== db) return da - db }
      if (sort === 'rating')   return b.rating - a.rating
      if (sort === 'popular')  return b.reviewCount - a.reviewCount
      if (sort === 'products') return b.productCount - a.productCount
      return b.sinceYear - a.sinceYear
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stores, search, category, status, sort, nearMe, userLoc])

  return (
    <>
      <style>{`
        /* ── روکش لینک کارت فروشگاه ──
           لینک روی نام فروشگاه است و شبه‌عنصرش کل کارت را می‌پوشاند:
           کلیک روی هرجای کارت، ولی برای صفحه‌خوان یک لینک واقعی با
           نام همان فروشگاه. دکمه‌های داخلی (تماس، مشاهده فروشگاه) با
           z-index بالاتر رویش می‌مانند تا کار خودشان را بکنند.
           (بک‌تیک در این کامنت ممنوع — داخل template literal است) */
        .sel-card { position: relative; }
        .sel-card-link { color: inherit; text-decoration: none; }
        .sel-card-link::after { content: ''; position: absolute; inset: 0; z-index: 1; }
        /* ⚠️ حلقه روی خود روکش کشیده می‌شود، نه با ':has' روی کارت.
           آن نسخه روی موتوری که ':has' ندارد هیچ نشانه‌ی فوکوسی نمی‌داد
           — و این خرابی بی‌صداست، چون فقط با کیبورد دیده می‌شود. */
        .sel-card-link:focus-visible { outline: none; }
        .sel-card-link:focus-visible::after {
          outline: 2px solid #8F6531; outline-offset: -3px; border-radius: 14px;
        }
        /* هرچه خودش تعاملی است باید بالای روکش بماند */
        .sel-card a:not(.sel-card-link),
        .sel-card button { position: relative; z-index: 2; }

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
        .sel-list { display: flex; flex-direction: column; gap: 14px; }
        .s-chip { transition: all 0.18s; }
        .s-chip:hover { opacity: 0.85; }
        /* حالت فوکوس از سیستم مشترک .input می‌آید */
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
          .sel-hide-mob { display: none !important; }
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

      {/* رنگ پایه داخل lq-stage است؛ پس‌زمینه‌ی مات خود عنصر
          لکه‌های پشت شیشه را می‌پوشاند. */}
      <div className="lq-stage" style={{ minHeight: '100vh', direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif', color: TEXT }}>

        {/* ─────── HERO — همان الگوی صفحه‌ی مربیان ─────── */}
        <SellerHeroSlider />

        {/* ─────── BODY ─────── */}
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 clamp(16px,3vw,32px) 64px' }}>

          {/* ─── STICKY: search + filter, stacked under the navbar ─── */}
          <div style={{ position: 'sticky', top: 72, zIndex: 50, background: 'rgba(250,249,246,0.72)', backdropFilter: 'blur(24px) saturate(1.6)', WebkitBackdropFilter: 'blur(24px) saturate(1.6)', paddingTop: 14, paddingBottom: 12, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* search box */}
            <div style={{ position: 'relative' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={GOLD_D} strokeWidth="2.2" style={{ position: 'absolute', insetInlineStart: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 2 }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="input input-glass input-icon-start-lg" type="search" aria-label="جستجوی فروشگاه"
                placeholder="جستجوی فروشنده، شهر یا برند..."
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* filter box */}
            <div className="sel-filterbar" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(28px) saturate(190%)', WebkitBackdropFilter: 'blur(28px) saturate(190%)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 16, boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 26px rgba(28,28,26,0.08)', padding: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

            {/* ۱ دسته‌بندی — روی موبایل حذف */}
            <span className="sel-hide-mob" style={{ display: 'contents' }}>
              <Dropdown label="دسته‌بندی:" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} minWidth={150} />
            </span>
            {/* ۲ مرتب‌سازی (بهترین امتیاز) — روی موبایل حذف */}
            <span className="sel-hide-mob" style={{ display: 'contents' }}>
              <Dropdown label="نمایش بر اساس:" options={SORT_OPTIONS} value={sort} onChange={v => setSort(v as SortKey)} minWidth={160} />
            </span>
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

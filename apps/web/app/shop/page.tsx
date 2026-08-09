'use client'

/* ═════════════════════════════════════════════════════════════
   بیلیارد بازار — بازطراحی دیواری‌ساختار (نسخه‌ی نهایی، جایگزین /shop)
   ─────────────────────────────────────────────────────────────
   ● کاملاً ایزوله: صفحه‌ی فعلی /shop دست‌نخورده است و این مسیر
     را می‌توان بدون هیچ اثری حذف کرد.
   ● معماری الهام‌گرفته از تجربه‌ی مارکت‌پلیس دیوار (سایدبار
     دسته‌ها/فیلترها، قیمت از-تا، زمان انتشار) ولی با هویت بصری
     بیلیارد هاب و کارت‌های «عمودی» همان فرمت فعلی بازار.
   ● دیتا از منابع موجود:
     - محصولات: فقط از سرور (/api/market/ads) — هیچ کاتالوگ ثابتی نیست
     - شهرها: lib/iran-geo (getProvinceNames/getCities) — طبق قانون پروژه
   ● CATS_M آینه‌ی دقیق CATS صفحه‌ی /shop است (آن‌جا local است و
     export نشده؛ برای دست‌نزدن به صفحه‌ی فعلی این‌جا تکرار شده —
     بعد از تأیید نهایی در یک فایل مشترک ادغام شود).
   ═════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Search, MapPin, X, Check, ChevronDown,
  Sparkles, Store, Bookmark, Home, Plus, LayoutGrid, Zap,
  ScrollText, ArrowLeft,
} from 'lucide-react'
import ReportButton from '../../components/ReportButton'
import { apiFetch } from '../../lib/http'
import { getProvinceNames, getCities } from '../../lib/iran-geo'
import {
  MARKET_CATEGORIES, normalizeCategory, categoryLabel,
  CONDITIONS, conditionLabel,
} from '../../lib/market/categories'
import { productTitleParts } from '../../lib/market/title'
import ProductTitle from '../../components/market/ProductTitle'
/* همان موتورِ کاروسل‌های صفحه‌ی اصلی: درگِ روان + حرکتِ خودکار */
import { useHorizontalScroll, scrollSign, getPos, setPos } from '../../lib/useHorizontalScroll'

const GOLD   = '#C7A66A'
/* عمرِ نشانِ «جدید» — دو روز بود و بیش‌ازحد سخاوتمند: در بازارِ کم‌حجم
   عملاً همه‌ی آگهی‌ها نشان می‌گرفتند و نشان بی‌معنا می‌شد. */
const NEW_BADGE_MS = 24 * 60 * 60 * 1000

/* سقفِ نوارِ فوری. بیشتر از این، نوار به فهرستِ دومِ بازار تبدیل
   می‌شود و جایگاهی که فروشنده پولش را داده بی‌ارزش می‌شود. */
const URGENT_MAX = 12

const GOLD_D = '#9A6E38'
const TEXT   = '#1C1B17'
const SEC    = '#5B564B'
const MUT    = '#8A8474'
const LINE   = '#E7E2D6'

const toFa = (v: string | number) => String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
const toEn = (v: string) => v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
const parsePrice = (v: string) => {
  const n = parseInt(toEn(v).replace(/[^0-9]/g, ''), 10)
  return Number.isNaN(n) ? null : n
}

/* دسته‌ها از منبعِ واحد می‌آیند (lib/market/categories).

   پیش‌تر این‌جا آینه‌ای دستی از فهرستِ فرمِ ثبت آگهی بود و با آن یکی
   نبود: فرم فقط «کیس و کیف» داشت و این‌جا «کیس چوب» و «کیف توپ» —
   یعنی فیلترِ «کیف توپ» هرگز هیچ آگهی‌ای نداشت. */
const CATS_M = MARKET_CATEGORIES
const normCat = normalizeCategory
const catLabel = categoryLabel

/* «نیازمند تعمیر» اضافه شد: بدونِ آن فروشنده‌ی صادق مجبور بود
   «کارکرده» بزند و خریدار سرِ قرار غافلگیر شود. */
type Cond = typeof CONDITIONS[number]['id']
const COND_LABEL = Object.fromEntries(CONDITIONS.map(c => [c.id, c.label])) as Record<Cond, string>

interface Listing {
  key: string
  id: string | number
  /** تکه‌ی درشتِ عنوان — دسته‌بندی و نوع */
  name: string
  img: string
  brand: string
  /* برند و مدل تکه‌ی ریزِ عنوان را می‌سازند: «چوب اسنوکر O'min classic».
     پیش‌تر کارت فقط تکه‌ی اول را داشت و خریدار نمی‌دانست کدام چوب. */
  model: string
  /** «برند مدل» آماده‌ی نمایش — تکراری‌ها حذف شده */
  sub: string
  price: number
  old: number
  disc: number
  cat: string
  city: string
  condition: Cond
  createdAt: number | null   // فقط آگهی‌های کاربر تاریخ دارند
  /* آگهیِ توافقی قیمتِ قابلِ نمایش ندارد — کارت باید «توافقی» بنویسد،
     نه «۰ تومان» */
  negotiable: boolean
  sold: boolean
  /* آگهیِ فوری (مهاجرت ۰۷۹) — تا این لحظه در نوارِ بالای بازار
     می‌نشیند و نشانِ قرمز می‌گیرد. */
  urgentUntil: number | null
  /* شمارشِ بازدید — پایه‌ی ترتیبِ منصفانه‌ی نوارِ فوری */
  views: number
  source: 'shop' | 'user'
}

/* شهر فروشنده‌های نمونه از lib/sellers-data (id → city) */

/* ── آگهی‌های واقعی از سرور ────────────────────────────────────────
   تا پیش از این، آگهی‌ها فقط در localStorage مرورگر خود آگهی‌دهنده
   بودند و هیچ‌کس دیگری نمی‌دیدشان. */
function serverAdToListing(a: Record<string, any>): Listing {
  const imgs = Array.isArray(a.images) ? a.images : []
  /* ── قیمت: خط‌خورده و پرداختی، هر دو از دیتابیس ──
     پیش‌تر عددِ خط‌خورده از روی درصدِ گردشده بازسازی می‌شد
     (`price / (1 - disc/100)`) و عددی درمی‌آمد که هیچ فروشنده‌ای
     تایپ نکرده بود: ۷۵۰٬۰۰۰٬۰۰۰ با ٪۹ ⇒ «۸۲۴٬۱۷۵٬۸۲۴». */
  const listed = Number(a.price) || 0
  const paid = Number(a.discountPrice) || 0
  const hasDisc = paid > 0 && paid < listed
  const price = hasDisc ? paid : listed
  const disc = hasDisc
    ? (Number(a.discountPercent) || Math.round(((listed - paid) / listed) * 100))
    : 0
  const { head, tail } = productTitleParts(a)
  return {
    key: `db-${a.id}`, id: a.id,
    name: head,
    img: imgs[0] || '/images/shop/cue_billiard_2.webp',
    brand: a.brand || '',
    model: a.model || '',
    sub: tail,
    price, old: listed, disc,
    cat: normCat(a.category),
    city: a.city || '',
    condition: (COND_LABEL[a.condition as Cond] ? a.condition : 'new') as Cond,
    createdAt: a.createdAt ? new Date(a.createdAt).getTime() : null,
    negotiable: a.negotiable === true,
    sold: a.status === 'sold',
    urgentUntil: a.urgent_until ? new Date(a.urgent_until).getTime() : null,
    views: Number(a.views ?? 0) || 0,
    source: 'user',
  }
}

async function fetchServerAds(): Promise<Listing[] | null> {
  try {
    const r = await fetch('/api/market/ads', { cache: 'no-store' })
    if (!r.ok) return null
    const j = await r.json()
    return Array.isArray(j?.ads) ? j.ads.map(serverAdToListing) : null
  } catch { return null }
}

/* آگهی‌هایی که از قبل در مرورگر مانده‌اند یک‌بار به سرور منتقل می‌شوند
   تا با وصل‌شدن بازار به سرور چیزی گم نشود. */
async function migrateLocalAds(): Promise<void> {
  try {
    const raw = localStorage.getItem('userProducts')
    if (!raw) return
    const list = JSON.parse(raw) as Record<string, any>[]
    if (!Array.isArray(list) || list.length === 0) { localStorage.removeItem('userProducts'); return }

    /* هر آگهی یک سهمیه مصرف می‌کند و سهمیه برنمی‌گردد؛ پس آگهی
       منتقل‌نشده نباید بی‌صدا پاک شود. هرچه ناموفق ماند در مرورگر
       می‌ماند تا کاربر خودش تصمیم بگیرد (و با تمام‌شدن سهمیه، حلقه
       همان‌جا می‌ایستد). */
    const leftover: Record<string, any>[] = []
    let stop = false

    for (const p of list) {
      if (stop) { leftover.push(p); continue }
      const r = await apiFetch('/api/market/ads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: p.name, category: p.category, type: p.type, brand: p.brand, model: p.model,
          price: p.price, old: p.old, description: p.description, condition: p.condition,
          specs: p.specs, images: Array.isArray(p.images) ? p.images : (p.img ? [p.img] : []),
          section: p.section, province: p.sellerProvince, city: p.sellerCity, address: p.address,
          sellerName: p.sellerName, sellerPhone: p.sellerPhone, sellerWhatsapp: p.sellerWhatsapp,
          storeSlug: p.sellerId || undefined,
        }),
      }).catch(() => null)

      if (!r || !r.ok) {
        leftover.push(p)
        /* سهمیه تمام شد یا سرویس در دسترس نیست ⇒ ادامه بی‌فایده است */
        if (!r || r.status === 429 || r.status === 503 || r.status === 401) stop = true
      }
    }

    if (leftover.length === 0) localStorage.removeItem('userProducts')
    else localStorage.setItem('userProducts', JSON.stringify(leftover))
  } catch { /* ignore */ }
}


/* عنوانِ یک‌خطی از دو تکه‌ی کارت — همان چیزی که در جستجو و alt لازم است */
const fullTitle = (l: Listing) => [l.name, l.sub].filter(Boolean).join(' ')

/* ── کارت محصول — همان فرمت عمودی کارت‌های فعلی بازار (ایزوله) ── */
function MarketCard({ l, i, saved, onSave }: { l: Listing; i: number; saved: boolean; onSave: () => void }) {
  /* گزارشِ تخلف و alt تصویر عنوانِ کامل را می‌خواهند، نه فقط تکه‌ی اول */
  const full = fullTitle(l)
  return (
    <Link href={`/shop/${l.id}`} className="mk-card" style={{ animationDelay: `${Math.min(i, 12) * 40}ms`, position: 'relative' }}>
      <button type="button" className={`mk-bk${saved ? ' on' : ''}`} aria-label="نشان کردن"
        onClick={e => { e.preventDefault(); e.stopPropagation(); onSave() }}>
        <Bookmark size={16} />
      </button>
      <ReportButton targetId={l.id} targetTitle={full} className="mk-rp" />
      <div className="mk-img">
        <img src={l.img} alt={full} loading="lazy"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        {/* نشانِ فوری بر «جدید» مقدم است: آگهیِ فوری ممکن است تازه
            هم باشد و دو نشانِ روی هم کارت را شلوغ می‌کند. */}
        {l.urgentUntil && l.urgentUntil > Date.now() ? (
          <span className="mk-urg"><Zap size={9} /> فوری</span>
        ) : l.source === 'user' && l.createdAt && Date.now() - l.createdAt < NEW_BADGE_MS ? (
          <span className="mk-new"><Sparkles size={9} /> جدید</span>
        ) : null}
      </div>
      <div className="mk-body">
        <ProductTitle p={{ name: l.name, brand: l.sub }} className="mk-name" headClassName="mk-h" tailClassName="mk-t" />
        <div className="mk-meta">
          <MapPin size={10} style={{ color: GOLD, flexShrink: 0 }} />
          <span>{l.city || 'ایران'}</span>
          <span className="mk-cond">{COND_LABEL[l.condition]}</span>
        </div>
        <div className="mk-priceline">
          {!l.negotiable && l.disc > 0 && <span className="mk-pct" dir="ltr">٪{toFa(l.disc)}</span>}
          <div style={{ marginInlineStart: 'auto', textAlign: 'left' }}>
            {/* آگهیِ توافقی قیمت ندارد؛ «۰ تومان» نوشتن دروغ است */}
            {l.negotiable ? (
              <div className="mk-price">توافقی</div>
            ) : (
              <>
                {/* «تومان» روی خط خط‌خورده تا خط قیمت اصلی جا برای مبلغ + پیل ٪ داشته باشد */}
                {l.disc > 0 && <div className="mk-old">{toFa(l.old.toLocaleString('en-US'))} <span style={{ fontStyle: 'normal' }}>تومان</span></div>}
                <div className="mk-price">{toFa(l.price.toLocaleString('en-US'))}{l.disc === 0 && <i> تومان</i>}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ── ردیف افقی موبایل — به سبک دیوار با هویت بازار ── */
function MarketRow({ l, i, saved, onSave }: { l: Listing; i: number; saved: boolean; onSave: () => void }) {
  const full = fullTitle(l)
  return (
    <Link href={`/shop/${l.id}`} className="mk-row" style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}>
      <div className="info">
        <ProductTitle p={{ name: l.name, brand: l.sub }} className="ttl" headClassName="mk-h" tailClassName="mk-t" />
        <span className="cnd">{COND_LABEL[l.condition]}</span>
        {/* «تومان» روی خط خط‌خورده تا خط قیمت جا برای مبلغ + پیل ٪ داشته باشد */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!l.negotiable && l.disc > 0 && <span className="pctn" dir="ltr">٪{toFa(l.disc)}</span>}
          <span className="prc">{l.negotiable ? 'توافقی' : <>{toFa(l.price.toLocaleString('en-US'))}{l.disc === 0 && <i> تومان</i>}</>}</span>
        </span>
        {l.disc > 0 && <span className="oldp">{toFa(l.old.toLocaleString('en-US'))} تومان</span>}
        <span className="cty"><MapPin size={10} style={{ color: GOLD }} /> {l.city || 'ایران'}</span>
      </div>
      <button type="button" className={`mk-bk${saved ? ' on' : ''}`} aria-label="نشان کردن"
        onClick={e => { e.preventDefault(); e.stopPropagation(); onSave() }}>
        <Bookmark size={16} />
      </button>
      <ReportButton targetId={l.id} targetTitle={full} className="mk-rp" />
      <span className="pic">
        <img src={l.img} alt={full} loading="lazy"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
      </span>
    </Link>
  )
}

/* ── آکاردئون سایدبار ── */
function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: `1px solid ${LINE}` }}>
      <button type="button" onClick={() => setOpen(p => !p)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '14px 2px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: TEXT }}>{title}</span>
        <ChevronDown size={14} style={{ color: MUT, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .3s cubic-bezier(.22,1,.36,1)' }} />
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows .35s cubic-bezier(.22,1,.36,1)' }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ paddingBottom: 14 }}>{children}</div>
        </div>
      </div>
    </div>
  )
}

/* ── انتخاب شهر — چندشهره، جستجو روی داده‌ی iran-geo ── */
function CityPicker({ value, onToggle, onClear }: {
  value: string[]; onToggle: (c: string) => void; onClear: () => void
}) {
  const [q, setQ] = useState('')
  const all = useMemo(() => getProvinceNames().flatMap(p => getCities(p)), [])
  const matches = useMemo(() => {
    const t = q.trim()
    if (!t) return []
    return all.filter(c => c.includes(t)).slice(0, 12)
  }, [q, all])
  return (
    <div>
      {/* شهرهای انتخاب‌شده — با امکان حذف تکی */}
      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {value.map(c => (
            <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.1)', border: '1px solid rgba(199,166,106,0.32)', borderRadius: 999, padding: '4px 10px' }}>
              {c}
              <button type="button" onClick={() => onToggle(c)}
                style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      {/* ذره‌بین فقط نسبت به اینپوت وسط‌چین می‌شود، نه کل لیست */}
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: MUT, pointerEvents: 'none' }} />
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder={value.length ? 'افزودن شهر دیگر…' : 'جستجوی شهر…'}
          style={{ width: '100%', boxSizing: 'border-box', padding: '9px 30px 9px 10px', borderRadius: 10, border: `1px solid ${LINE}`, background: '#FAFAF7', fontSize: 12.5, fontFamily: 'inherit', outline: 'none', color: TEXT }} />
      </div>
      <div style={{ marginTop: 6, border: `1px solid ${LINE}`, borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
        {/* گزینه‌ی اول: کل ایران (حذف همه‌ی شهرها) */}
        <button type="button" onClick={() => { onClear(); setQ('') }}
          className="mk-cityopt"
          style={{ width: '100%', textAlign: 'right', padding: '8px 12px', background: 'none', border: 'none', borderBottom: `1px solid ${LINE}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, color: GOLD_D, display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={12} /> کل ایران
        </button>
        {matches.map(c => (
          <button key={c} type="button" onClick={() => { onToggle(c); setQ('') }}
            className="mk-cityopt"
            style={{ width: '100%', textAlign: 'right', padding: '8px 12px', background: 'none', border: 'none', borderBottom: `1px solid ${LINE}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: value.includes(c) ? 800 : 600, color: value.includes(c) ? GOLD_D : SEC, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {c}
            {value.includes(c) && <Check size={13} style={{ color: GOLD_D }} />}
          </button>
        ))}
      </div>
    </div>
  )
}

const SORTS = [
  { id: 'relevant', label: 'مرتبط‌ترین' },
  { id: 'newest',   label: 'جدیدترین' },
  { id: 'cheap',    label: 'ارزان‌ترین' },
  { id: 'expens',   label: 'گران‌ترین' },
] as const
type SortId = typeof SORTS[number]['id']

const TIME_OPTS = [
  { id: 'all',  label: 'همه' },
  { id: 'day',  label: '۲۴ ساعت اخیر' },
  { id: 'week', label: 'هفته‌ی اخیر' },
] as const
type TimeId = typeof TIME_OPTS[number]['id']

export default function MarketNewPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [ready, setReady] = useState(false)

  /* فیلترها */
  const [cat, setCat]       = useState('')
  const [cities, setCities] = useState<string[]>([])
  const [minP, setMinP]     = useState('')
  const [maxP, setMaxP]     = useState('')
  const [cond, setCond]     = useState<'' | Cond>('')
  const [onlyDisc, setOnlyDisc] = useState(false)
  const [time, setTime]     = useState<TimeId>('all')
  const [sort, setSort]     = useState<SortId>('relevant')
  const [q, setQ]           = useState('')
  const [cityOpen, setCityOpen] = useState(false)
  /* نشان‌ها — ذخیره‌ی محلی */
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const [showSaved, setShowSaved] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const cityRef = useRef<HTMLDivElement>(null)
  const mCityRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    /* فهرست فقط از سرور می‌آید.

       پیش‌تر این‌جا یک کاتالوگِ ثابتِ ساختگی فوراً نشان داده می‌شد تا
       «صفحه خالی نماند» و بعد آگهی‌های واقعی کنارش می‌نشستند. نتیجه
       این بود که بازدیدکننده محصولی می‌دید که وجود نداشت و روی کارتش
       که کلیک می‌کرد به فروشنده‌ای می‌رسید که ثبت نشده بود. فهرستِ
       خالی صادق‌تر از فهرستِ دروغین است. */
    try { setSavedKeys(new Set(JSON.parse(localStorage.getItem('bh_market_saved') ?? '[]'))) } catch {}

    void (async () => {
      await migrateLocalAds()
      const server = await fetchServerAds()
      setListings(server ?? [])
      setReady(true)
    })()
  }, [])
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      const inDesk = cityRef.current?.contains(e.target as Node)
      const inMob  = mCityRef.current?.contains(e.target as Node)
      if (!inDesk && !inMob) setCityOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  const toggleCity = (c: string) =>
    setCities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  /* برچسب دکمه‌ی لوکیشن: کل ایران / تهران / تهران +۲ */
  const cityBtnLabel = cities.length === 0 ? 'کل ایران'
    : cities.length === 1 ? cities[0]
    : `${cities[0]} +${toFa(cities.length - 1)}`

  const toggleSave = (key: string) => {
    setSavedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      try { localStorage.setItem('bh_market_saved', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const counts = useMemo(() => {
    const m: Record<string, number> = {}
    listings.forEach(l => { m[l.cat] = (m[l.cat] ?? 0) + 1 })
    return m
  }, [listings])

  /* ── نوارِ فوری ──
     نشانِ قرمز روی آگهی‌ای که در جایگاهِ چهارصدم است هیچ ارزشی
     ندارد؛ کسی که تا آن‌جا اسکرول نکرده رنگش را هم نمی‌بیند. پس
     «فوری» یک جایگاهِ رزروشده‌ی بالای بازار می‌خرد، نه فقط برچسب.

     ── چرا ترتیب چرخشی است ──
     اگر بر اساسِ زمانِ خرید مرتب شود، همان مشکل برمی‌گردد: کسی که
     دیروز خریده ته نوار می‌رود. کلیدِ مرتب‌سازی هر ساعت عوض می‌شود،
     پس هر آگهیِ فوری در طولِ روز چند ساعت جلوی نوار است. */
  const matched = useMemo(() => {
    const lo = parsePrice(minP), hi = parsePrice(maxP)
    const term = q.trim()
    let out = listings.filter(l => {
      if (cat && l.cat !== cat) return false
      if (cities.length > 0 && !cities.includes(l.city)) return false
      if (lo != null && l.price < lo) return false
      if (hi != null && l.price > hi) return false
      if (cond && l.condition !== cond) return false
      if (onlyDisc && l.disc <= 0) return false
      if (time !== 'all') {
        if (!l.createdAt) return false
        const age = Date.now() - l.createdAt
        if (time === 'day' && age > 86400000) return false
        if (time === 'week' && age > 86400000 * 7) return false
      }
      /* مدل هم جستجو می‌شود: کسی که «classic» را می‌نویسد دنبالِ مدل
         است، و پیش‌تر همان جستجو هیچ نتیجه‌ای نمی‌داد. */
      if (term && !(`${l.name} ${l.brand} ${l.model}`.includes(term))) return false
      if (showSaved && !savedKeys.has(l.key)) return false
      return true
    })
    if (sort === 'cheap')  out = [...out].sort((a, b) => a.price - b.price)
    if (sort === 'expens') out = [...out].sort((a, b) => b.price - a.price)
    if (sort === 'newest') out = [...out].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    return out
  }, [listings, cat, cities, minP, maxP, cond, onlyDisc, time, q, sort, showSaved, savedKeys])

  /* ── نوارِ فوری ──
     نشانِ قرمز روی آگهی‌ای که در جایگاهِ چهارصدم است هیچ ارزشی
     ندارد؛ کسی که تا آن‌جا اسکرول نکرده رنگش را هم نمی‌بیند. پس
     «فوری» یک جایگاهِ رزروشده‌ی بالای بازار می‌خرد، نه فقط برچسب.

     ── چرا ترتیب چرخشی است ──
     اگر بر اساسِ زمانِ خرید مرتب شود، همان مشکل برمی‌گردد: کسی که
     دیروز خریده ته نوار می‌رود. کلیدِ مرتب‌سازی هر ساعت عوض می‌شود،
     پس هر آگهیِ فوری در طولِ روز چند ساعت جلوی نوار است.

     ── دو چیزی که این‌جا عوض شد ──
     ۱) از `matched` ساخته می‌شود نه از کلِ `listings`. پیش‌تر
        بازدیدکننده‌ای که «چوب» را جستجو می‌کرد، در نوارِ فوری میز و
        توپ هم می‌دید — نوار فیلترها را نادیده می‌گرفت.
     ۲) هر آگهی‌ای که این‌جا بیاید، از فهرستِ پایین برداشته می‌شود.
        تا امروز آگهیِ فوری **دو بار** دیده می‌شد: یک بار در نوار و
        یک بار وسطِ فهرستِ عادی. با تمام‌شدنِ زمانِ فوری خودبه‌خود
        به فهرست برمی‌گردد، چون این فیلتر روی همان زمان است. */
  /* ── نمایشِ منصفانه ──
     چرخشِ ساعتی به‌تنهایی کافی نیست: نوار پیوسته به راست می‌رود، پس
     جایگاه‌های اولِ نوار بیشتر دیده می‌شوند. اگر ترتیب فقط تصادفی
     باشد، آگهی‌ای که شانس آورده هر ساعت جلو می‌افتد و بازدیدش از
     بقیه فاصله می‌گیرد.

     پس بازدیدِ تاکنونی هم در ترتیب دخالت می‌کند: آگهیِ کم‌بازدیدتر
     جلوتر می‌نشیند. عاملِ ساعتی سرِ جایش می‌ماند تا مساوی‌ها هر ساعت
     جابه‌جا شوند و ترتیب یخ نزند. */
  const urgent = useMemo(() => {
    const now = Date.now()
    const hour = Math.floor(now / 3600000)
    const jitter = (s: string) => {
      let h = hour
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
      return (h % 1000) / 1000
    }
    const live = matched.filter(l => !l.sold && l.urgentUntil !== null && l.urgentUntil > now)
    /* بازدید به بازه‌ی ۰..۱ نرمال می‌شود تا با jitter هم‌مقیاس بماند */
    const maxViews = Math.max(1, ...live.map(l => l.views))
    const score = (l: typeof live[number]) => l.views / maxViews + jitter(String(l.id))
    return [...live].sort((a, b) => score(a) - score(b)).slice(0, URGENT_MAX)
  }, [matched])

  /* فهرستِ عادی = هرچه در نوارِ فوری نیامده. */
  const filtered = useMemo(() => {
    if (urgent.length === 0) return matched
    const inBar = new Set(urgent.map(l => l.key))
    return matched.filter(l => !inBar.has(l.key))
  }, [matched, urgent])

  /* ── نوارِ فوری: حرکتِ خودکارِ نرم ──
     جایگاهِ فوری وقتی ارزش دارد که دیده شود، و کاربر لزوماً نوار را
     نمی‌کشد. حرکتِ آرام و پیوسته به راست همه‌ی آگهی‌ها را از جلوی چشم
     رد می‌کند. فهرست دوبل می‌شود تا حلقه بدونِ پرش بسته شود، و با
     لمس/موس/کیبورد می‌ایستد تا با دستِ کاربر نجنگد. */
  const urgRef = useRef<HTMLDivElement>(null)
  const urgPaused = useRef(false)
  useHorizontalScroll(urgRef, busy => { urgPaused.current = busy })
  /* دوبل‌سازی وقتی لازم است که فهرست از عرضِ نوار بیرون بزند؛ با
     دو-سه کارتی که جا می‌شوند، حرکت بی‌معناست و فقط آزار می‌دهد. */
  const urgLoop = urgent.length >= 2 ? [...urgent, ...urgent] : urgent
  useEffect(() => {
    if (urgent.length < 2) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const el = urgRef.current
    if (!el) return
    /* اگر همه‌ی کارت‌ها جا می‌شوند، چیزی برای حرکت نیست */
    if (el.scrollWidth <= el.clientWidth + 8) return
    const SPEED = 26                       // پیکسل بر ثانیه — عمداً کند
    const sign = scrollSign(el)
    setPos(el, sign, el.scrollWidth / 2)
    let last = 0, raf = 0
    const tick = (t: number) => {
      if (last && !urgPaused.current) {
        const half = el.scrollWidth / 2
        let p = getPos(el, sign) - (SPEED * (t - last)) / 1000
        if (p <= 0) p += half
        setPos(el, sign, p)
      }
      last = t
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [urgent.length])

  const chips: { label: string; clear: () => void }[] = []
  if (cat)      chips.push({ label: catLabel(cat), clear: () => setCat('') })
  cities.forEach(c => chips.push({ label: c, clear: () => toggleCity(c) }))
  if (cond)     chips.push({ label: COND_LABEL[cond], clear: () => setCond('') })
  if (onlyDisc) chips.push({ label: 'تخفیف‌دار', clear: () => setOnlyDisc(false) })
  if (time !== 'all') chips.push({ label: TIME_OPTS.find(t => t.id === time)!.label, clear: () => setTime('all') })
  if (parsePrice(minP) != null || parsePrice(maxP) != null)
    chips.push({ label: 'محدوده‌ی قیمت', clear: () => { setMinP(''); setMaxP('') } })
  const clearAll = () => { setCat(''); setCities([]); setMinP(''); setMaxP(''); setCond(''); setOnlyDisc(false); setTime('all'); setQ('') }

  /* بدنه‌ی فیلترها — مشترک بین سایدبار دسکتاپ و کشوی موبایل */
  const FilterBody = (
    <>
      <Section title="دسته‌بندی">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button type="button" onClick={() => setCat('')}
            className={`mk-catrow${cat === '' ? ' on' : ''}`}>
            <span className="ic" style={{ background: 'rgba(199,166,106,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={15} style={{ color: GOLD_D }} />
            </span>
            <span className="lb">همه‌ی دسته‌ها</span>
            <span className="ct">{toFa(listings.length)}</span>
          </button>
          {CATS_M.map(c => (
            <button key={c.id} type="button" onClick={() => setCat(cat === c.id ? '' : c.id)}
              className={`mk-catrow${cat === c.id ? ' on' : ''}`}>
              <span className="ic"><img loading="lazy" decoding="async" src={c.img} alt="" style={(c as { imgStyle?: React.CSSProperties }).imgStyle} /></span>
              <span className="lb">{c.label}</span>
              <span className="ct">{toFa(counts[c.id] ?? 0)}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="شهر">
        <CityPicker value={cities} onToggle={toggleCity} onClear={() => setCities([])} />
      </Section>

      <Section title="قیمت (تومان)">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input value={minP} onChange={e => setMinP(e.target.value)} placeholder="از" inputMode="numeric" className="mk-pricein" />
          <span style={{ color: MUT, fontSize: 12 }}>تا</span>
          <input value={maxP} onChange={e => setMaxP(e.target.value)} placeholder="تا" inputMode="numeric" className="mk-pricein" />
        </div>
      </Section>

      <Section title="وضعیت کالا">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {([['', 'همه'], ['new', 'نو'], ['like_new', 'در حد نو'], ['used', 'کارکرده']] as const).map(([v, lb]) => (
            <button key={v} type="button" onClick={() => setCond(v as '' | Cond)} className="mk-radio">
              <span className={`rb${cond === v ? ' on' : ''}`} />
              <span style={{ fontSize: 12.5, fontWeight: cond === v ? 800 : 600, color: cond === v ? TEXT : SEC }}>{lb}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="فقط تخفیف‌دار">
        <button type="button" onClick={() => setOnlyDisc(p => !p)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
          <span className={`mk-toggle${onlyDisc ? ' on' : ''}`}><i /></span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: onlyDisc ? GOLD_D : SEC }}>نمایش آگهی‌های دارای تخفیف</span>
        </button>
      </Section>

      <Section title="زمان انتشار" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TIME_OPTS.map(t => (
            <button key={t.id} type="button" onClick={() => setTime(t.id)} className="mk-radio">
              <span className={`rb${time === t.id ? ' on' : ''}`} />
              <span style={{ fontSize: 12.5, fontWeight: time === t.id ? 800 : 600, color: time === t.id ? TEXT : SEC }}>{t.label}</span>
            </button>
          ))}
        </div>
        <p style={{ fontSize: 10.5, color: MUT, margin: '10px 0 0', lineHeight: 1.8 }}>
          فقط آگهی‌های ثبت‌شده‌ی کاربران تاریخ انتشار دارند
        </p>
      </Section>
    </>
  )

  return (
    <div dir="rtl" style={{ background: '#F7F5F0', minHeight: '100vh', color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <style>{`
        @keyframes mkUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes mkSheet { from { transform: translateY(100%); } to { transform: none; } }
        /* «بازار» — رول عمودی: می‌رود بالا، از پایین برمی‌گردد */
        @keyframes mkWord {
          0%, 68%   { transform: translateY(0);      opacity: 1; }
          76%       { transform: translateY(-130%);  opacity: 0; }
          77%       { transform: translateY(130%);   opacity: 0; }
          86%, 100% { transform: translateY(0);      opacity: 1; }
        }
        /* اورلی پلیس‌هولدر فلکس است ⇒ متن و کلمه‌ی رول‌شونده دقیقاً هم‌مرکز */
        .mk-ph { display: flex; align-items: center; gap: 4px; }
        .mk-rollwrap { display: inline-flex; overflow: hidden; height: 1.5em; align-items: center; }
        .mk-roll { display: inline-block; line-height: 1.5; color: ${GOLD_D}; font-weight: 800;
          animation: mkWord 3.8s cubic-bezier(.22,1,.36,1) infinite; }
        @media (prefers-reduced-motion: reduce) { .mk-roll { animation: none; } }

        /* ── کارت — همان فرمت عمودی کارت‌های /shop ── */
        .mk-card { display: flex; flex-direction: column; background: #fff; border: 1.5px solid rgba(28,28,26,0.18);
          border-radius: 10px; overflow: hidden; text-decoration: none; color: inherit;
          transition: transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s;
          animation: mkUp .5s cubic-bezier(.22,1,.36,1) both; }
        .mk-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(28,28,26,0.12); }
        .mk-img { position: relative; aspect-ratio: 1 / 0.86; background: #F4F3F1; border-bottom: 1.5px solid rgba(28,28,26,0.18); overflow: hidden; }
        .mk-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
          transition: transform .6s cubic-bezier(.22,1,.36,1); }
        .mk-card:hover .mk-img img { transform: scale(1.045); }
        .mk-new { position: absolute; top: 8px; right: 8px; display: inline-flex; align-items: center; gap: 3px;
          font-size: 9px; font-weight: 800; color: #fff; background: rgba(27,122,75,0.92); border-radius: 999px; padding: '3px 8px'; padding: 3px 8px; }
        /* نوارِ فوری: افقی و کشیدنی، تا تعدادِ زیاد آن را نشکند */
        /* ── نوارِ فوری ──
           افقی و کشیدنی. سه چیز این‌جا حیاتی است و یک‌بار با
           دست‌کاریِ بی‌دقت شکست:

             ۱) min-width صفر روی خودِ نوار. بدونِ آن، ستونِ گریدِ
                والد به عرضِ *محتوا* باز می‌شود (پیش‌فرضِ آیتمِ گرید
                auto است) و کلِ صفحه‌ی موبایل به‌جای نوار اسکرولِ افقی
                می‌گیرد — کارتِ افقی و نوارِ قوانین از لبه می‌زدند
                بیرون. (بک‌تیک این‌جا ممنوع — داخلِ template literal است)
             ۲) عرضِ ثابتِ سلول، نه درصدِ ویوپورت.
             ۳) کششِ عمودی تا کارتِ یک‌خطی و دوخطی هم‌ارتفاع بمانند. */
        .mk-urgrow { display: flex; align-items: stretch; gap: 10px;
          min-width: 0; max-width: 100%;
          overflow-x: auto; padding-bottom: 8px;
          scroll-snap-type: x proximity; scrollbar-width: thin;
          -webkit-overflow-scrolling: touch; }
        .mk-urgrow::-webkit-scrollbar { height: 6px; }
        .mk-urgrow::-webkit-scrollbar-thumb { background: rgba(28,27,23,0.20); border-radius: 999px; }
        .mk-urgcell { flex: 0 0 auto; width: 168px; scroll-snap-align: start; display: flex; }
        .mk-urgcell > * { width: 100%; }
        @media (max-width: 560px) { .mk-urgcell { width: 144px; } }

        .mk-urg { position: absolute; top: 8px; right: 8px; display: inline-flex; align-items: center; gap: 3px;
          font-size: 9px; font-weight: 800; color: #fff; background: rgba(178,59,46,0.94); border-radius: 999px; padding: 3px 8px; }
        .mk-body { display: flex; flex-direction: column; gap: 6px; padding: 9px 9px 10px; flex: 1; }
        .mk-name { font-size: 12.5px; color: ${TEXT}; line-height: 1.55; min-height: 39px; }
        /* ── دو خطِ عنوان ──
           خطِ اول دسته‌بندی و نوع، بولد — همان چیزی که چشم اول دنبالش
           می‌گردد. خطِ دوم برند و مدل با وزنِ معمولی.

           کلامپ روی خودِ mk-name نیست (بکتیک این‌جا رشته‌ی style را
           می‌بندد): با آن، خطِ دومِ عنوان قربانیِ
           محدودیتِ دو خط می‌شد و برند و مدل — که تازه اضافه شده‌اند —
           دوباره ناپدید می‌شدند. هر خط کلامپِ خودش را دارد. */
        .mk-h { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; font-size: 13px; font-weight: 800; }
        .mk-t { display: block; font-size: 11.5px; font-weight: 400; color: ${MUT};
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mk-meta { display: flex; align-items: center; gap: 4px; font-size: 10px; color: ${MUT}; }
        .mk-cond { margin-inline-start: auto; background: #F4F3F1; border-radius: 999px; padding: 1.5px 7px; font-weight: 700; }
        .mk-priceline { margin-top: auto; display: flex; align-items: center; gap: 5px; }
        .mk-pct { background: #b400ae; color: #fff; font-size: 11.5px; font-weight: 800; border-radius: 999px;
          padding: 3px 8px 1px; line-height: 1; }
        .mk-old { font-size: 10px; color: ${MUT}; text-decoration: line-through; font-variant-numeric: tabular-nums; }
        .mk-price { font-size: 13px; font-weight: 900; color: ${TEXT}; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .mk-price i { font-style: normal; font-size: 10px; font-weight: 600; color: ${MUT}; }

        /* ── سایدبار ── */
        .mk-catrow { display: flex; align-items: center; gap: 9px; width: 100%; padding: 7px 8px; border-radius: 10px;
          background: none; border: none; cursor: pointer; font-family: inherit; text-align: right;
          transition: background .22s, transform .22s; }
        .mk-catrow:hover { background: rgba(199,166,106,0.07); transform: translateX(-2px); }
        .mk-catrow.on { background: rgba(199,166,106,0.13); }
        .mk-catrow .ic { width: 30px; height: 30px; border-radius: 9px; overflow: hidden; flex-shrink: 0; background: #F4F3F1; }
        .mk-catrow .ic img { width: 100%; height: 100%; object-fit: contain; }
        .mk-catrow .lb { font-size: 12.5px; font-weight: 700; color: ${SEC}; flex: 1; }
        .mk-catrow.on .lb { color: ${GOLD_D}; font-weight: 800; }
        .mk-catrow .ct { font-size: 10.5px; color: ${MUT}; font-variant-numeric: tabular-nums; }
        .mk-cityopt:hover { background: rgba(199,166,106,0.07) !important; }
        .mk-pricein { flex: 1; min-width: 0; box-sizing: border-box; padding: 9px 10px; border-radius: 10px;
          border: 1px solid ${LINE}; background: #FAFAF7; font-size: 12.5px; font-family: inherit; outline: none;
          color: ${TEXT}; text-align: center; transition: border-color .25s, box-shadow .25s; }
        .mk-pricein:focus { border-color: rgba(199,166,106,0.6); box-shadow: 0 0 0 3px rgba(199,166,106,0.12); }
        .mk-radio { display: flex; align-items: center; gap: 9px; background: none; border: none; cursor: pointer;
          padding: 5px 2px; font-family: inherit; }
        .mk-radio .rb { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid ${LINE}; position: relative;
          transition: border-color .25s; flex-shrink: 0; }
        .mk-radio .rb.on { border-color: ${GOLD_D}; }
        .mk-radio .rb.on::after { content: ''; position: absolute; inset: 3px; border-radius: 50%; background: ${GOLD_D}; }
        .mk-toggle { width: 38px; height: 21px; border-radius: 999px; background: ${LINE}; position: relative;
          transition: background .3s; flex-shrink: 0; display: inline-block; }
        .mk-toggle i { position: absolute; top: 2.5px; right: 2.5px; width: 16px; height: 16px; border-radius: 50%;
          background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.2); transition: transform .3s cubic-bezier(.22,1,.36,1); }
        .mk-toggle.on { background: ${GOLD}; }
        .mk-toggle.on i { transform: translateX(-17px); }

        /* ── چیپ‌های فیلتر فعال ── */
        .mk-chip { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 800;
          color: ${GOLD_D}; background: rgba(199,166,106,0.12); border: 1px solid rgba(199,166,106,0.34);
          border-radius: 999px; padding: 5px 11px; }
        .mk-chip button { display: flex; background: none; border: none; cursor: pointer; color: inherit; padding: 0; }

        /* دکمه‌ی LQ گرد — تینت طلایی، بوردر، هاور لیفت */
        .mk-lqbtn { display: inline-flex; align-items: center; gap: 7px; padding: 10px 22px;
          border-radius: 999px; text-decoration: none; font-size: 13px; font-weight: 800;
          color: ${GOLD_D}; background: rgba(199,166,106,0.12); border: 1px solid rgba(199,166,106,0.34);
          flex-shrink: 0; transition: transform .25s cubic-bezier(.22,1,.36,1), background .25s, box-shadow .25s; }
        .mk-lqbtn:hover { transform: translateY(-1px); background: rgba(199,166,106,0.2);
          box-shadow: 0 8px 20px rgba(199,166,106,0.25); }

        /* ── تاپ‌بار دسکتاپ / سرچ موبایل ── */
        .mk-topbar { position: sticky; top: 0; z-index: 150; padding-top: env(safe-area-inset-top);
          background: rgba(255,255,255,0.9); backdrop-filter: blur(24px) saturate(1.6); -webkit-backdrop-filter: blur(24px) saturate(1.6);
          border-bottom: 1px solid ${LINE}; }
        .mk-msearch { display: none; position: sticky; top: 0; z-index: 150; padding: calc(16px + env(safe-area-inset-top)) 14px 12px;
          background: rgba(247,245,240,0.94); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid ${LINE}; }

        /* ── گرید دسته‌های موبایل: ۳ ردیف ۵تایی ── */
        .mk-mcats { display: none; grid-template-columns: repeat(5, 1fr); gap: 11px 6px; padding: 0 4px 4px; margin-top: -20px; }
        .mk-mcat { display: flex; flex-direction: column; align-items: center; gap: 6px; background: none; border: none;
          cursor: pointer; font-family: inherit; padding: 0; }
        /* ۵٪+۵٪ بزرگ‌تر (۵۲ ⇒ ۵۸) */
        /* عرضِ ثابتِ ۵۸ در پنج ستون روی صفحه‌ی ۳۲۰ جا نمی‌شد:
           ۵×۵۸ + چهار فاصله‌ی ۶ + حاشیه = ۳۲۲ پیکسل، یعنی کلِ صفحه
           به پهلو کشیده می‌شد. حالا آیکن ستونِ خودش را پر می‌کند و از
           ۵۸ بزرگ‌تر نمی‌شود، پس روی صفحه‌های بزرگ‌تر همان قبلی است. */
        .mk-mcat .ic { width: 100%; max-width: 58px; aspect-ratio: 1; border-radius: 17px; background: #fff; border: 1px solid ${LINE};
          display: flex; align-items: center; justify-content: center; overflow: hidden; transition: all .25s cubic-bezier(.22,1,.36,1); }
        .mk-mcat .ic img { width: 78%; height: 78%; object-fit: contain; }
        .mk-mcat.on .ic { border-color: rgba(199,166,106,0.55); box-shadow: 0 0 0 3px rgba(199,166,106,0.14); background: rgba(199,166,106,0.08); }
        .mk-mcat:active .ic { transform: scale(0.93); }
        /* ۵٪ بزرگ‌تر از ۱۱px به‌خواستِ کاربر — ۱۱٫۵۵ گرد شده به ۱۱٫۶ */
        .mk-mcat .lb { font-size: 11.6px; font-weight: 700; color: ${SEC}; }
        .mk-mcat.on .lb { color: ${GOLD_D}; font-weight: 800; }

        /* ── ردیف افقی موبایل (به سبک دیوار، با هویت بازار) ── */
        .mk-rows { display: none; flex-direction: column; gap: 10px; }
        .mk-row { display: flex; gap: 12px; background: #fff; border: 1px solid ${LINE}; border-radius: 14px;
          padding: 11px; text-decoration: none; color: inherit; position: relative;
          animation: mkUp .45s cubic-bezier(.22,1,.36,1) both; }
        .mk-row:active { transform: scale(0.99); }
        .mk-row .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; padding-top: 2px; }
        .mk-row .ttl { font-size: 13px; font-weight: 700; color: ${TEXT}; line-height: 1.6; }
        /* ردیفِ موبایل کمی درشت‌تر از کارت است، پس هر دو خط یک پله بالاتر */
        .mk-row .ttl .mk-h { font-size: 13.5px; font-weight: 800; }
        .mk-row .ttl .mk-t { font-size: 12px; font-weight: 400; color: ${MUT}; }
        .mk-row .cnd { font-size: 10.5px; color: ${MUT}; }
        .mk-row .prc { font-size: 13.5px; font-weight: 900; color: ${TEXT}; font-variant-numeric: tabular-nums; }
        .mk-row .prc i { font-style: normal; font-size: 10px; font-weight: 600; color: ${MUT}; }
        .mk-row .cty { font-size: 10.5px; color: ${MUT}; display: flex; align-items: center; gap: 4px; margin-top: auto; }
        .mk-row .pic { width: 108px; height: 108px; border-radius: 11px; overflow: hidden; flex-shrink: 0;
          background: #F4F3F1; border: 1px solid ${LINE}; position: relative; }
        .mk-row .pic img { width: 100%; height: 100%; object-fit: cover; }
        .mk-row .pctn { background: #b400ae; color: #fff; font-size: 10px; font-weight: 800;
          border-radius: 999px; padding: 2px 7px 1px; line-height: 1.4; flex-shrink: 0; }
        .mk-row .oldp { font-size: 10.5px; color: ${MUT}; text-decoration: line-through;
          font-variant-numeric: tabular-nums; margin-top: -2px; }
        .mk-bk { position: absolute; top: 8px; left: 8px; background: none; border: none; cursor: pointer;
          color: ${MUT}; padding: 4px; display: flex; z-index: 2; }
        .mk-bk.on { color: ${GOLD_D}; }
        .mk-bk.on svg { fill: ${GOLD_D}; }
        /* گزارش تخلف — زیر آیکون نشان، با همان تراز */
        .mk-rp { position: absolute; top: 34px; left: 8px; z-index: 2;
          color: rgba(0,0,0,0.22) !important; transition: color .2s; }
        .mk-rp:hover { color: #B23B2E !important; }
        .mk-row .mk-rp { top: auto; bottom: 8px; left: 8px; }

        /* ── نوار پایین موبایل ── */
        /* left/right صریح — insetInline در CSS معتبر نیست و نوار جمع می‌شد */
        .mk-bottomnav { display: none; position: fixed; left: 0; right: 0; bottom: 0; z-index: 200; width: 100%; box-sizing: border-box;
          background: rgba(255,255,255,0.96); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border-top: 1px solid ${LINE}; padding: 7px 8px calc(7px + env(safe-area-inset-bottom));
          grid-template-columns: repeat(4, 1fr); }
        /* اندازه‌ها ۲۰٪ بزرگ‌تر از قبل: آیکون ۱۹→۲۳، برچسب ۱۰→۱۲ */
        .mk-bnav { display: flex; flex-direction: column; align-items: center; gap: 4px; background: none; border: none;
          cursor: pointer; font-family: inherit; text-decoration: none; padding: 4px 0; color: ${MUT}; }
        .mk-bnav .lb { font-size: 12px; font-weight: 700; }
        .mk-bnav.on { color: ${GOLD_D}; }
        .mk-bnav.on svg { fill: rgba(199,166,106,0.2); }

        /* ── نوار قوانین بازار (انتهای لیست) ── */
        .mk-rules { display: flex; align-items: center; gap: 12px; margin-top: 26px; padding: 14px 16px;
          background: #fff; border: 1px solid ${LINE}; border-radius: 16px; text-decoration: none;
          transition: border-color .25s, box-shadow .25s, transform .25s cubic-bezier(.22,1,.36,1); }
        .mk-rules:hover { border-color: rgba(199,166,106,0.42); transform: translateY(-1px);
          box-shadow: 0 10px 26px rgba(28,27,23,0.07); }
        .mk-rules .ic { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px;
          flex-shrink: 0; border-radius: 11px; color: ${GOLD_D};
          background: rgba(199,166,106,0.12); border: 1px solid rgba(199,166,106,0.28); }
        .mk-rules .tx { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
        .mk-rules .tx b { font-size: 13px; font-weight: 800; color: ${TEXT}; }
        .mk-rules .tx i { font-size: 11.5px; font-style: normal; font-weight: 500; color: ${MUT}; line-height: 1.8; }
        .mk-rules .ar { color: ${MUT}; flex-shrink: 0; transition: transform .25s, color .25s; }
        .mk-rules:hover .ar { color: ${GOLD_D}; transform: translateX(-3px); }
        @media (max-width: 520px) {
          .mk-rules .tx i { display: none; }
        }

        /* ── لی‌آوت ── */
        .mk-layout { display: grid; grid-template-columns: 272px minmax(0, 1fr); gap: 22px; align-items: start; }
        /* باکس فیلترها کاملاً fixed است و با هیچ اسکرولی تکان نمی‌خورد؛
           ستون گرید (.mk-sidebar) فقط جای ۲۷۲px را رزرو می‌کند.
           right با %‏ (نه vw) حساب می‌شود تا عرض اسکرول‌بار محاسبه را به‌هم نزند. */
        .mk-sidebar { min-width: 0; }
        .mk-sidebar-inner { position: fixed; top: 106px; width: 272px;
          right: calc(max((100% - 1300px) / 2, 0px) + clamp(16px, 3vw, 32px));
          background: #fff; border: 1px solid ${LINE}; border-radius: 16px;
          padding: 6px 16px 10px; max-height: calc(100vh - 126px); overflow-y: auto;
          scrollbar-width: thin; overscroll-behavior: contain; box-sizing: border-box; }
        /* دسکتاپ: لیست آگهی‌ها در ناحیه‌ی خودش اسکرول می‌شود (اپ‌شل) —
           هر تعداد آگهی هم باشد، صفحه و فوتر روی باکس فیلترها نمی‌آیند */
        @media (min-width: 901px) {
          .mk-main { padding-bottom: 24px !important; }
          .mk-listcol { height: calc(100vh - 136px); overflow-y: auto;
            overscroll-behavior: contain; scrollbar-width: thin;
            padding-inline-end: 6px; padding-bottom: 30px; box-sizing: border-box; }
        }
        /* minmax کوچک‌تر ⇒ یک کارت بیشتر در هر سطر دسکتاپ */
        .mk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; }
        .mk-mobilebar { display: none; }
        .mk-drawer { display: none; }
        @media (max-width: 900px) {
          .mk-topbar { display: none; }
          .mk-msearch { display: block; }
          /* «همه‌ی آگهی‌ها» — جداسازی حرفه‌ای: فاصله‌ی بیشتر + نیم‌خط طلایی محوشونده */
          .mk-statusbar { margin: 26px 2px 18px !important; }
          .mk-stitle { font-size: 14.5px !important; font-weight: 900 !important; }
          .mk-hr { align-self: center; height: 1px;
            background: linear-gradient(to left, rgba(154,110,56,0.38), rgba(154,110,56,0.03)); }
          .mk-mcats { display: grid; }
          .mk-layout { grid-template-columns: minmax(0,1fr); }
          .mk-sidebar { display: none; }
          .mk-mobilebar { display: flex; }
          .mk-grid { display: none; }
          .mk-rows { display: flex; }
          .mk-drawer { display: block; }
          .mk-bottomnav { display: grid; }
          .mk-desk-sort { display: none !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mk-card, .mk-row { animation: none; }
        }
      `}</style>

      {/* ═══ تاپ‌بار دسکتاپ — به‌جای نوبار و هدر ═══ */}
      <div className="mk-topbar">
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 clamp(16px,3vw,32px)', height: 76, display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* برند */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 10px rgba(199,166,106,0.26)' }}>
              <img loading="lazy" decoding="async" src="/images/Logo/bh-mark-256-v4.webp" alt="بیلیارد هاب" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </span>
            <span style={{ fontWeight: 900, fontSize: 17.5, letterSpacing: '-0.02em', color: TEXT, whiteSpace: 'nowrap' }}>
              بیلیارد <span style={{ color: GOLD }}>هاب</span>
            </span>
          </Link>

          {/* شهر */}
          <div ref={cityRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button type="button" onClick={() => setCityOpen(p => !p)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 11, border: `1px solid ${LINE}`, background: '#FAFAF7', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, color: cities.length ? GOLD_D : SEC }}>
              <MapPin size={14} style={{ color: GOLD_D }} />
              {cityBtnLabel}
              <ChevronDown size={12} style={{ color: MUT, transform: cityOpen ? 'rotate(180deg)' : 'none', transition: 'transform .3s' }} />
            </button>
            {cityOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 60, width: 260, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: 12, boxShadow: '0 18px 46px rgba(28,27,23,0.14)', animation: 'mkUp .25s cubic-bezier(.22,1,.36,1) both' }}>
                <CityPicker value={cities} onToggle={toggleCity} onClear={() => setCities([])} />
              </div>
            )}
          </div>

          {/* سرچ — پلیس‌هولدر با «بازار» طلایی */}
          <div style={{ position: 'relative', flex: 1, minWidth: 0, maxWidth: 520 }}>
            <Search size={14} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: MUT, pointerEvents: 'none' }} />
            <input value={q} onChange={e => setQ(e.target.value)} aria-label="جستجو در بیلیارد بازار"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 36px 10px 14px', borderRadius: 12, border: `1px solid ${LINE}`, background: '#FAFAF7', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: TEXT }} />
            {!q && (
              <span aria-hidden className="mk-ph" style={{ position: 'absolute', right: 36, top: 0, bottom: 0, fontSize: 12.5, color: MUT, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                جستجو در بیلیارد <span className="mk-rollwrap"><b className="mk-roll">بازار</b></span>
              </span>
            )}
          </div>

          <span style={{ flex: 1 }} />

          {/* نشان‌ها */}
          <button type="button" onClick={() => setShowSaved(p => !p)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, flexShrink: 0,
              color: showSaved ? GOLD_D : SEC, background: showSaved ? 'rgba(199,166,106,0.12)' : 'transparent',
              border: showSaved ? '1px solid rgba(199,166,106,0.34)' : `1px solid ${LINE}`, transition: 'all .22s' }}>
            <Bookmark size={15} style={showSaved ? { fill: GOLD_D } : undefined} /> نشان‌ها
            {savedKeys.size > 0 && <span style={{ fontSize: 10, color: MUT }}>{toFa(savedKeys.size)}</span>}
          </button>

          {/* ثبت آگهی — طرح LQ، کاملاً گرد با بوردر */}
          <Link href="/shop/new" className="mk-lqbtn">
            <Plus size={15} /> ثبت آگهی
          </Link>
        </div>
      </div>

      {/* ═══ سرچ‌بار موبایل — لوکیشن داخل خود باکس ═══ */}
      <div className="mk-msearch" ref={mCityRef}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#FAFAF7', border: `1px solid ${LINE}`, borderRadius: 14, overflow: 'visible', position: 'relative' }}>
          <Search size={15} style={{ color: MUT, flexShrink: 0, margin: '0 12px 0 4px' }} />
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <input value={q} onChange={e => setQ(e.target.value)} aria-label="جستجو در بیلیارد بازار"
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 0', background: 'none', border: 'none', outline: 'none', fontSize: 13.5, fontFamily: 'inherit', color: TEXT }} />
            {!q && (
              <span aria-hidden className="mk-ph" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, fontSize: 12.5, color: MUT, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                جستجو در بیلیارد <span className="mk-rollwrap"><b className="mk-roll">بازار</b></span>
              </span>
            )}
          </div>
          {/* لوکیشن — سمت چپ باکس */}
          <button type="button" onClick={() => setCityOpen(p => !p)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 12px', margin: '4px 6px 4px 4px', borderRadius: 10, borderInlineStart: `1px solid ${LINE}`, background: 'none', borderTop: 'none', borderBottom: 'none', borderInlineEnd: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 800, color: cities.length ? GOLD_D : SEC, flexShrink: 0 }}>
            <MapPin size={13} style={{ color: GOLD_D }} />
            {cityBtnLabel}
          </button>
          {cityOpen && (
            <div className="mk-mcitypop" style={{ position: 'absolute', top: 'calc(100% + 8px)', insetInline: 0, zIndex: 60, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: 12, boxShadow: '0 18px 46px rgba(28,27,23,0.16)', animation: 'mkUp .25s cubic-bezier(.22,1,.36,1) both' }}>
              <CityPicker value={cities} onToggle={toggleCity} onClear={() => setCities([])} />
            </div>
          )}
        </div>
      </div>

      {/* ═══ بدنه ═══ */}
      <main className="mk-main" style={{ maxWidth: 1300, margin: '0 auto', padding: '30px clamp(16px,3vw,32px) calc(96px + env(safe-area-inset-bottom))' }}>

        {/* گرید دسته‌ها — موبایل: ۳ ردیف ۵تایی */}
        <div className="mk-mcats">
          {CATS_M.map(c => (
            <button key={c.id} type="button" onClick={() => setCat(cat === c.id ? '' : c.id)}
              className={`mk-mcat${cat === c.id ? ' on' : ''}`}>
              <span className="ic"><img loading="lazy" decoding="async" src={c.img} alt="" style={(c as { imgStyle?: React.CSSProperties }).imgStyle} /></span>
              <span className="lb">{c.label}</span>
            </button>
          ))}
        </div>

        <div className="mk-layout">
          {/* ── سایدبار دسکتاپ ── */}
          <aside className="mk-sidebar"><div className="mk-sidebar-inner">{FilterBody}</div></aside>

          {/* ── محتوای اصلی ── */}
          <section ref={gridRef} className="mk-listcol">
            {/* نوار وضعیت: تعداد + مرتب‌سازی + چیپ‌ها */}
            <div className="mk-statusbar" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <span className="mk-stitle" style={{ fontSize: 13, fontWeight: 800 }}>
                {cat ? catLabel(cat) : 'همه‌ی آگهی‌ها'}
                {cities.length === 1 ? ` در ${cities[0]}` : cities.length > 1 ? ` در ${toFa(cities.length)} شهر` : ''}
              </span>
              <span style={{ fontSize: 11.5, color: MUT }}>{toFa(filtered.length)} آگهی</span>
              <span className="mk-hr" style={{ flex: 1 }} />
              <div className="mk-desk-sort" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 11, color: MUT, fontWeight: 700 }}>مرتب‌سازی:</span>
                {SORTS.map(s => (
                  <button key={s.id} type="button" onClick={() => setSort(s.id)}
                    style={{ padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, fontWeight: sort === s.id ? 800 : 600,
                      color: sort === s.id ? GOLD_D : SEC, background: sort === s.id ? 'rgba(199,166,106,0.12)' : 'transparent',
                      border: sort === s.id ? '1px solid rgba(199,166,106,0.34)' : `1px solid transparent`, transition: 'all .22s' }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {chips.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
                {chips.map(c => (
                  <span key={c.label} className="mk-chip">
                    {c.label}
                    <button type="button" onClick={c.clear}><X size={11} /></button>
                  </span>
                ))}
                <button type="button" onClick={clearAll}
                  style={{ fontSize: 11, fontWeight: 800, color: MUT, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
                  حذف همه
                </button>
              </div>
            )}

            {/* ── گرید کارت‌های عمودی ── */}
            {ready && matched.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '70px 20px', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16 }}>
                <Store size={34} style={{ color: MUT, opacity: 0.4, marginBottom: 12 }} />
                <p style={{ fontSize: 14.5, fontWeight: 800, margin: '0 0 6px' }}>آگهی‌ای با این فیلترها پیدا نشد</p>
                <button type="button" onClick={clearAll}
                  style={{ marginTop: 10, padding: '9px 20px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)' }}>
                  حذف فیلترها
                </button>
              </div>
            ) : (
              <>
                {/* ── نوارِ فوری ──
                    بالای فهرستِ عادی و آشکارا جدا از آن. همین
                    آشکاربودن است که یک جایگاهِ خریدنی را قابلِ قبول
                    می‌کند؛ اگر آگهیِ فوری در خودِ فهرستِ عادی هم بالا
                    می‌رفت، کاربر حس می‌کرد هیچ‌جای بازار دستِ آگهیِ
                    بی‌پول نیست. */}
                {urgent.length > 0 && (
                  <section style={{ marginBottom: 22 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                      <Zap size={15} style={{ color: '#B23B2E' }} />
                      <h2 style={{ fontSize: 14.5, fontWeight: 900, color: TEXT, margin: 0 }}>فوری</h2>
                    </div>
                    <div className="mk-urgrow" ref={urgRef}>
                      {urgLoop.map((l, i) => (
                        <div key={`${l.key}-${i}`} className="mk-urgcell">
                          <MarketCard l={l} i={i} saved={savedKeys.has(l.key)} onSave={() => toggleSave(l.key)} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* دسکتاپ: گرید کارت‌های عمودی */}
                <div className="mk-grid">
                  {filtered.map((l, i) => (
                    <MarketCard key={l.key} l={l} i={i} saved={savedKeys.has(l.key)} onSave={() => toggleSave(l.key)} />
                  ))}
                </div>
                {/* موبایل: ردیف‌های افقی */}
                <div className="mk-rows">
                  {filtered.map((l, i) => (
                    <MarketRow key={l.key} l={l} i={i} saved={savedKeys.has(l.key)} onSave={() => toggleSave(l.key)} />
                  ))}
                </div>
              </>
            )}
            {/* ── نوار قوانین بازار ── */}
            <Link href="/terms#market" className="mk-rules">
              <span className="ic"><ScrollText size={17} /></span>
              <span className="tx">
                <b>قوانین ثبت آگهی و معاملات در بیلیارد بازار</b>
                <i>پیش از ثبت آگهی یا انجام معامله، شرایط و مسئولیت‌های طرفین را بخوانید.</i>
              </span>
              <ArrowLeft size={16} className="ar" />
            </Link>
          </section>
        </div>
      </main>

      {/* ═══ نوار پایین موبایل ═══ */}
      <nav className="mk-bottomnav">
        <Link href="/" className="mk-bnav">
          <Home size={23} />
          <span className="lb">خانه</span>
        </Link>
        <button type="button" className={`mk-bnav${!showSaved ? ' on' : ''}`}
          onClick={() => { setShowSaved(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          <LayoutGrid size={23} />
          <span className="lb">آگهی‌ها</span>
        </button>
        <button type="button" className={`mk-bnav${showSaved ? ' on' : ''}`}
          onClick={() => { setShowSaved(p => !p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          <Bookmark size={23} />
          <span className="lb">نشان‌ها</span>
        </button>
        <Link href="/shop/new" className="mk-bnav">
          {/* گرد + بوردر، طرح LQ */}
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD_D, boxSizing: 'border-box' }}>
            <Plus size={17} />
          </span>
          <span className="lb">ثبت آگهی</span>
        </Link>
      </nav>

    </div>
  )
}

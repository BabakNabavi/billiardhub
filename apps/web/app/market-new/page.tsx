'use client'

/* ═════════════════════════════════════════════════════════════
   بیلیارد بازار — نسخه‌ی آزمایشیِ بازطراحی (/market-new)
   ─────────────────────────────────────────────────────────────
   ● کاملاً ایزوله: صفحه‌ی فعلی /shop دست‌نخورده است و این مسیر
     را می‌توان بدون هیچ اثری حذف کرد.
   ● معماری الهام‌گرفته از تجربه‌ی مارکت‌پلیسِ دیوار (سایدبار
     دسته‌ها/فیلترها، قیمت از-تا، زمان انتشار) ولی با هویت بصری
     بیلیارد هاب و کارت‌های «عمودی» همان فرمتِ فعلی بازار.
   ● دیتا از منابعِ موجود:
     - محصولات: SHOP_PRODUCTS از app/shop/products.ts (منبع واحد)
       + آگهی‌های کاربر از localStorage «userProducts»
     - شهر فروشنده‌های نمونه: MOCK_SELLERS از lib/sellers-data
     - شهرها: lib/iran-geo (getProvinceNames/getCities) — طبق قانون پروژه
   ● CATS_M آینه‌ی دقیقِ CATS صفحه‌ی /shop است (آن‌جا local است و
     export نشده؛ برای دست‌نزدن به صفحه‌ی فعلی این‌جا تکرار شده —
     بعد از تأیید نهایی در یک فایل مشترک ادغام شود).
   ═════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Search, MapPin, X, ChevronDown,
  Sparkles, Store, Bookmark, Home, Plus, LayoutGrid,
} from 'lucide-react'
import { SHOP_PRODUCTS } from '../shop/products'
import { MOCK_SELLERS } from '../../lib/sellers-data'
import { getProvinceNames, getCities } from '../../lib/iran-geo'

const GOLD   = '#C7A66A'
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

/* آینه‌ی CATS صفحه‌ی /shop — همان idها، لیبل‌ها و آیکون‌های تصویری */
const CATS_M = [
  { id: 'cue',       label: 'چوب',      img: '/images/icon/cue/cue-icon-256.png' },
  { id: 'table',     label: 'میز',      img: '/images/icon/table/wiraka.png' },
  { id: 'ball',      label: 'توپ',      img: '/images/icon/ball/ballset-icon-256.png' },
  { id: 'tip',       label: 'تیپ',      img: '/images/icon/tip/tip-icon-256.png' },
  { id: 'chalk',     label: 'گچ',       img: '/images/icon/chalk/chalk-icon-256.png' },
  { id: 'extension', label: 'اکستنشن',  img: '/images/icon/ex/shaft-icon-256.png' },
  { id: 'cue-case',  label: 'کیس',      img: '/images/icon/case/case-icon-256.png' },
  { id: 'ball-bag',  label: 'کیف توپ',  img: '/images/icon/kif/ballcase-icon-256.png' },
  { id: 'rest',      label: 'رست',      img: '/images/icon/rest/rest.png' },
  { id: 'cloth',     label: 'پارچه',    img: '/images/icon/parche/parche.png' },
  { id: 'oil',       label: 'روغن',     img: '/images/icon/oil/oil.png' },
  { id: 'towel',     label: 'حوله',     img: '/images/icon/hole/hole.png' },
  { id: 'clothing',  label: 'پوشاک',    img: '/images/icon/pooshak/pooshak.png' },
  { id: 'accessory', label: 'اکسسوری',  img: '/images/icon/accessori/accessori.png' },
  { id: 'other',     label: 'سایر',     img: '/images/icon/other/other.png' },
]
const CAT_IDS = new Set(CATS_M.map(c => c.id))
/* محصولاتِ نمونه cat=case-bag دارند که در CATS با id=cue-case آمده */
const normCat = (c?: string) => (c === 'case-bag' ? 'cue-case' : c && CAT_IDS.has(c) ? c : 'other')
const catLabel = (id: string) => CATS_M.find(c => c.id === id)?.label ?? id

type Cond = 'new' | 'like_new' | 'used'
const COND_LABEL: Record<Cond, string> = { new: 'نو', like_new: 'در حد نو', used: 'کارکرده' }

interface Listing {
  key: string
  id: string | number
  name: string
  img: string
  brand: string
  price: number
  old: number
  disc: number
  cat: string
  city: string
  condition: Cond
  createdAt: number | null   // فقط آگهی‌های کاربر تاریخ دارند
  source: 'shop' | 'user'
}

/* شهرِ فروشنده‌های نمونه از lib/sellers-data (id → city) */
const sellerCity = (sellerId: string) => MOCK_SELLERS.find(s => s.id === sellerId)?.city ?? ''

function loadListings(): Listing[] {
  const base: Listing[] = SHOP_PRODUCTS.map(p => ({
    key: `s-${p.id}`, id: p.id, name: p.name, img: p.img, brand: p.brand,
    price: p.price, old: p.old, disc: p.disc, cat: normCat(p.cat),
    city: sellerCity(p.sellerId), condition: 'new', createdAt: null, source: 'shop',
  }))
  let user: Listing[] = []
  try {
    const stored = JSON.parse(localStorage.getItem('userProducts') ?? '[]')
    if (Array.isArray(stored)) {
      user = stored.map((p: any) => ({
        key: `u-${p.id}`, id: p.id, name: p.name || 'محصول', img: p.img || (Array.isArray(p.images) ? p.images[0] : ''),
        brand: p.brand || '', price: Number(p.price) || 0, old: Number(p.old) || Number(p.price) || 0,
        disc: Number(p.disc) || 0, cat: normCat(p.category),
        city: p.sellerCity || '', condition: (['new', 'like_new', 'used'].includes(p.condition) ? p.condition : 'new') as Cond,
        createdAt: typeof p.id === 'number' && p.id > 1e12 ? p.id : null, source: 'user',
      }))
    }
  } catch { /* ignore */ }
  return [...user, ...base]
}

/* ── کارت محصول — همان فرمتِ عمودیِ کارت‌های فعلی بازار (ایزوله) ── */
function MarketCard({ l, i, saved, onSave }: { l: Listing; i: number; saved: boolean; onSave: () => void }) {
  return (
    <Link href={`/shop/${l.id}`} className="mk-card" style={{ animationDelay: `${Math.min(i, 12) * 40}ms`, position: 'relative' }}>
      <button type="button" className={`mk-bk${saved ? ' on' : ''}`} aria-label="نشان کردن"
        onClick={e => { e.preventDefault(); e.stopPropagation(); onSave() }}>
        <Bookmark size={16} />
      </button>
      <div className="mk-img">
        <img src={l.img} alt={l.name} loading="lazy"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        {l.source === 'user' && l.createdAt && Date.now() - l.createdAt < 86400000 * 2 && (
          <span className="mk-new"><Sparkles size={9} /> جدید</span>
        )}
      </div>
      <div className="mk-body">
        <span className="mk-name">{l.brand ? `${l.name}` : l.name}</span>
        <div className="mk-meta">
          <MapPin size={10} style={{ color: GOLD, flexShrink: 0 }} />
          <span>{l.city || 'ایران'}</span>
          <span className="mk-cond">{COND_LABEL[l.condition]}</span>
        </div>
        <div className="mk-priceline">
          {l.disc > 0 && <span className="mk-pct" dir="ltr">٪{toFa(l.disc)}</span>}
          <div style={{ marginInlineStart: 'auto', textAlign: 'left' }}>
            {l.disc > 0 && <div className="mk-old">{toFa(l.old.toLocaleString('en-US'))}</div>}
            <div className="mk-price">{toFa(l.price.toLocaleString('en-US'))} <i>تومان</i></div>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ── ردیف افقی موبایل — به سبکِ دیوار با هویتِ بازار ── */
function MarketRow({ l, i, saved, onSave }: { l: Listing; i: number; saved: boolean; onSave: () => void }) {
  return (
    <Link href={`/shop/${l.id}`} className="mk-row" style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}>
      <div className="info">
        <span className="ttl">{l.name}</span>
        <span className="cnd">{COND_LABEL[l.condition]}</span>
        {/* پیلِ ٪ کنارِ قیمتِ تخفیف‌خورده؛ قیمتِ اصلیِ خط‌خورده زیرش */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {l.disc > 0 && <span className="pctn" dir="ltr">٪{toFa(l.disc)}</span>}
          <span className="prc">{toFa(l.price.toLocaleString('en-US'))} <i>تومان</i></span>
        </span>
        {l.disc > 0 && <span className="oldp">{toFa(l.old.toLocaleString('en-US'))}</span>}
        <span className="cty"><MapPin size={10} style={{ color: GOLD }} /> {l.city || 'ایران'}</span>
      </div>
      <button type="button" className={`mk-bk${saved ? ' on' : ''}`} aria-label="نشان کردن"
        onClick={e => { e.preventDefault(); e.stopPropagation(); onSave() }}>
        <Bookmark size={16} />
      </button>
      <span className="pic">
        <img src={l.img} alt={l.name} loading="lazy"
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

/* ── انتخاب شهر — جستجو روی داده‌ی iran-geo ── */
function CityPicker({ value, onPick }: { value: string; onPick: (c: string) => void }) {
  const [q, setQ] = useState('')
  const all = useMemo(() => getProvinceNames().flatMap(p => getCities(p)), [])
  const matches = useMemo(() => {
    const t = q.trim()
    if (!t) return []
    return all.filter(c => c.includes(t)).slice(0, 12)
  }, [q, all])
  return (
    <div>
      {value ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(199,166,106,0.1)', border: '1px solid rgba(199,166,106,0.32)', borderRadius: 10, padding: '8px 12px' }}>
          <MapPin size={13} style={{ color: GOLD_D }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: GOLD_D, flex: 1 }}>{value}</span>
          <button type="button" onClick={() => onPick('')}
            style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', color: MUT, padding: 2 }}>
            <X size={13} />
          </button>
        </div>
      ) : (
        <div>
          {/* ذره‌بین فقط نسبت به اینپوت وسط‌چین می‌شود، نه کلِ لیست */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: MUT, pointerEvents: 'none' }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="جستجوی شهر…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 30px 9px 10px', borderRadius: 10, border: `1px solid ${LINE}`, background: '#FAFAF7', fontSize: 12.5, fontFamily: 'inherit', outline: 'none', color: TEXT }} />
          </div>
          <div style={{ marginTop: 6, border: `1px solid ${LINE}`, borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
            {/* گزینه‌ی اول: کل ایران (بدون فیلتر شهر) */}
            <button type="button" onClick={() => { onPick(''); setQ('') }}
              className="mk-cityopt"
              style={{ width: '100%', textAlign: 'right', padding: '8px 12px', background: 'none', border: 'none', borderBottom: `1px solid ${LINE}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, color: GOLD_D, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={12} /> کل ایران
            </button>
            {matches.map(c => (
              <button key={c} type="button" onClick={() => { onPick(c); setQ('') }}
                className="mk-cityopt"
                style={{ width: '100%', textAlign: 'right', padding: '8px 12px', background: 'none', border: 'none', borderBottom: `1px solid ${LINE}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, color: SEC }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
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
  const [city, setCity]     = useState('')
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
    setListings(loadListings())
    try { setSavedKeys(new Set(JSON.parse(localStorage.getItem('bh_market_saved') ?? '[]'))) } catch {}
    setReady(true)
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

  const filtered = useMemo(() => {
    const lo = parsePrice(minP), hi = parsePrice(maxP)
    const term = q.trim()
    let out = listings.filter(l => {
      if (cat && l.cat !== cat) return false
      if (city && l.city !== city) return false
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
      if (term && !(`${l.name} ${l.brand}`.includes(term))) return false
      if (showSaved && !savedKeys.has(l.key)) return false
      return true
    })
    if (sort === 'cheap')  out = [...out].sort((a, b) => a.price - b.price)
    if (sort === 'expens') out = [...out].sort((a, b) => b.price - a.price)
    if (sort === 'newest') out = [...out].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    return out
  }, [listings, cat, city, minP, maxP, cond, onlyDisc, time, q, sort, showSaved, savedKeys])

  const chips: { label: string; clear: () => void }[] = []
  if (cat)      chips.push({ label: catLabel(cat), clear: () => setCat('') })
  if (city)     chips.push({ label: city, clear: () => setCity('') })
  if (cond)     chips.push({ label: COND_LABEL[cond], clear: () => setCond('') })
  if (onlyDisc) chips.push({ label: 'تخفیف‌دار', clear: () => setOnlyDisc(false) })
  if (time !== 'all') chips.push({ label: TIME_OPTS.find(t => t.id === time)!.label, clear: () => setTime('all') })
  if (parsePrice(minP) != null || parsePrice(maxP) != null)
    chips.push({ label: 'محدوده‌ی قیمت', clear: () => { setMinP(''); setMaxP('') } })
  const clearAll = () => { setCat(''); setCity(''); setMinP(''); setMaxP(''); setCond(''); setOnlyDisc(false); setTime('all'); setQ('') }

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
              <span className="ic"><img src={c.img} alt="" /></span>
              <span className="lb">{c.label}</span>
              <span className="ct">{toFa(counts[c.id] ?? 0)}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="شهر">
        <CityPicker value={city} onPick={setCity} />
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

        /* ── کارت — همان فرمتِ عمودی کارت‌های /shop ── */
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
        .mk-body { display: flex; flex-direction: column; gap: 6px; padding: 9px 9px 10px; flex: 1; }
        .mk-name { font-size: 12.5px; color: ${TEXT}; line-height: 1.55; display: -webkit-box;
          -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 39px; }
        .mk-meta { display: flex; align-items: center; gap: 4px; font-size: 10px; color: ${MUT}; }
        .mk-cond { margin-inline-start: auto; background: #F4F3F1; border-radius: 999px; padding: 1.5px 7px; font-weight: 700; }
        .mk-priceline { margin-top: auto; display: flex; align-items: center; gap: 5px; }
        .mk-pct { background: #b400ae; color: #fff; font-size: 11.5px; font-weight: 800; border-radius: 999px;
          padding: 3px 8px 1px; line-height: 1; }
        .mk-old { font-size: 10px; color: ${MUT}; text-decoration: line-through; font-variant-numeric: tabular-nums; }
        .mk-price { font-size: 13px; font-weight: 900; color: ${TEXT}; font-variant-numeric: tabular-nums; }
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

        /* ── تاپ‌بار دسکتاپ / سرچ موبایل ── */
        .mk-topbar { position: sticky; top: 0; z-index: 150; padding-top: env(safe-area-inset-top);
          background: rgba(255,255,255,0.9); backdrop-filter: blur(24px) saturate(1.6); -webkit-backdrop-filter: blur(24px) saturate(1.6);
          border-bottom: 1px solid ${LINE}; }
        .mk-msearch { display: none; position: sticky; top: 0; z-index: 150; padding: calc(10px + env(safe-area-inset-top)) 14px 10px;
          background: rgba(247,245,240,0.94); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid ${LINE}; }

        /* ── گرید دسته‌های موبایل: ۳ ردیف ۵تایی ── */
        .mk-mcats { display: none; grid-template-columns: repeat(5, 1fr); gap: 12px 6px; padding: 16px 4px 6px; }
        .mk-mcat { display: flex; flex-direction: column; align-items: center; gap: 6px; background: none; border: none;
          cursor: pointer; font-family: inherit; padding: 0; }
        .mk-mcat .ic { width: 52px; height: 52px; border-radius: 16px; background: #fff; border: 1px solid ${LINE};
          display: flex; align-items: center; justify-content: center; overflow: hidden; transition: all .25s cubic-bezier(.22,1,.36,1); }
        .mk-mcat .ic img { width: 78%; height: 78%; object-fit: contain; }
        .mk-mcat.on .ic { border-color: rgba(199,166,106,0.55); box-shadow: 0 0 0 3px rgba(199,166,106,0.14); background: rgba(199,166,106,0.08); }
        .mk-mcat:active .ic { transform: scale(0.93); }
        .mk-mcat .lb { font-size: 10px; font-weight: 700; color: ${SEC}; }
        .mk-mcat.on .lb { color: ${GOLD_D}; font-weight: 800; }

        /* ── ردیف افقی موبایل (به سبک دیوار، با هویت بازار) ── */
        .mk-rows { display: none; flex-direction: column; gap: 10px; }
        .mk-row { display: flex; gap: 12px; background: #fff; border: 1px solid ${LINE}; border-radius: 14px;
          padding: 11px; text-decoration: none; color: inherit; position: relative;
          animation: mkUp .45s cubic-bezier(.22,1,.36,1) both; }
        .mk-row:active { transform: scale(0.99); }
        .mk-row .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; padding-top: 2px; }
        .mk-row .ttl { font-size: 13px; font-weight: 700; color: ${TEXT}; line-height: 1.6; display: -webkit-box;
          -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
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

        /* ── نوار پایین موبایل ── */
        .mk-bottomnav { display: none; position: fixed; insetInline: 0; bottom: 0; z-index: 200;
          background: rgba(255,255,255,0.96); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border-top: 1px solid ${LINE}; padding: 7px 8px calc(7px + env(safe-area-inset-bottom));
          grid-template-columns: repeat(4, 1fr); }
        .mk-bnav { display: flex; flex-direction: column; align-items: center; gap: 3px; background: none; border: none;
          cursor: pointer; font-family: inherit; text-decoration: none; padding: 3px 0; color: ${MUT}; }
        .mk-bnav .lb { font-size: 10px; font-weight: 700; }
        .mk-bnav.on { color: ${GOLD_D}; }
        .mk-bnav.on svg { fill: rgba(199,166,106,0.2); }

        /* ── لی‌آوت ── */
        .mk-layout { display: grid; grid-template-columns: 272px minmax(0, 1fr); gap: 22px; align-items: start; }
        .mk-sidebar { position: sticky; top: calc(76px + env(safe-area-inset-top)); background: #fff; border: 1px solid ${LINE};
          border-radius: 16px; padding: 6px 16px 10px; max-height: calc(100vh - 96px); overflow-y: auto; scrollbar-width: thin; }
        .mk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(176px, 1fr)); gap: 16px; }
        .mk-mobilebar { display: none; }
        .mk-drawer { display: none; }
        @media (max-width: 900px) {
          .mk-topbar { display: none; }
          .mk-msearch { display: block; }
          .mk-mcats { display: grid; }
          .mk-layout { grid-template-columns: 1fr; }
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
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 clamp(16px,3vw,32px)', height: 64, display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* برند */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 10px rgba(199,166,106,0.26)' }}>
              <img src="/images/Logo/logo-256x256.png" alt="بیلیارد هاب" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </span>
            <span style={{ fontWeight: 900, fontSize: 17.5, letterSpacing: '-0.02em', color: TEXT, whiteSpace: 'nowrap' }}>
              بیلیارد <span style={{ color: GOLD }}>هاب</span>
            </span>
          </Link>

          {/* شهر */}
          <div ref={cityRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button type="button" onClick={() => setCityOpen(p => !p)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 11, border: `1px solid ${LINE}`, background: '#FAFAF7', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, color: city ? GOLD_D : SEC }}>
              <MapPin size={14} style={{ color: GOLD_D }} />
              {city || 'کل ایران'}
              <ChevronDown size={12} style={{ color: MUT, transform: cityOpen ? 'rotate(180deg)' : 'none', transition: 'transform .3s' }} />
            </button>
            {cityOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 60, width: 250, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: 12, boxShadow: '0 18px 46px rgba(28,27,23,0.14)', animation: 'mkUp .25s cubic-bezier(.22,1,.36,1) both' }}>
                <CityPicker value={city} onPick={c => { setCity(c); setCityOpen(false) }} />
              </div>
            )}
          </div>

          {/* سرچ — پلیس‌هولدر با «بازار» طلایی */}
          <div style={{ position: 'relative', flex: 1, minWidth: 0, maxWidth: 520 }}>
            <Search size={14} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: MUT, pointerEvents: 'none' }} />
            <input value={q} onChange={e => setQ(e.target.value)} aria-label="جستجو در بیلیارد بازار"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 36px 10px 14px', borderRadius: 12, border: `1px solid ${LINE}`, background: '#FAFAF7', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: TEXT }} />
            {!q && (
              <span aria-hidden style={{ position: 'absolute', right: 36, top: '50%', transform: 'translateY(-50%)', fontSize: 12.5, color: MUT, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                جستجو در بیلیارد <b style={{ color: GOLD_D, fontWeight: 800 }}>بازار</b>
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

          {/* ثبت آگهی */}
          <Link href="/shop/new"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 11, textDecoration: 'none', fontSize: 13, fontWeight: 800, color: '#241B08', flexShrink: 0,
              background: `linear-gradient(135deg,#E8CE96,${GOLD} 55%,#A8853F)`, boxShadow: '0 6px 18px rgba(199,166,106,0.28)' }}>
            <Plus size={15} /> ثبت آگهی
          </Link>
        </div>
      </div>

      {/* ═══ سرچ‌بار موبایل — لوکیشن داخل خودِ باکس ═══ */}
      <div className="mk-msearch" ref={mCityRef}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#FAFAF7', border: `1px solid ${LINE}`, borderRadius: 14, overflow: 'visible', position: 'relative' }}>
          <Search size={15} style={{ color: MUT, flexShrink: 0, margin: '0 12px 0 4px' }} />
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <input value={q} onChange={e => setQ(e.target.value)} aria-label="جستجو در بیلیارد بازار"
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 0', background: 'none', border: 'none', outline: 'none', fontSize: 13.5, fontFamily: 'inherit', color: TEXT }} />
            {!q && (
              <span aria-hidden style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', fontSize: 12.5, color: MUT, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                جستجو در بیلیارد <b style={{ color: GOLD_D, fontWeight: 800 }}>بازار</b>
              </span>
            )}
          </div>
          {/* لوکیشن — سمت چپ باکس */}
          <button type="button" onClick={() => setCityOpen(p => !p)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 12px', margin: '4px 6px 4px 4px', borderRadius: 10, borderInlineStart: `1px solid ${LINE}`, background: 'none', borderTop: 'none', borderBottom: 'none', borderInlineEnd: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 800, color: city ? GOLD_D : SEC, flexShrink: 0 }}>
            <MapPin size={13} style={{ color: GOLD_D }} />
            {city || 'کل ایران'}
          </button>
          {cityOpen && (
            <div className="mk-mcitypop" style={{ position: 'absolute', top: 'calc(100% + 8px)', insetInline: 0, zIndex: 60, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: 12, boxShadow: '0 18px 46px rgba(28,27,23,0.16)', animation: 'mkUp .25s cubic-bezier(.22,1,.36,1) both' }}>
              <CityPicker value={city} onPick={c => { setCity(c); setCityOpen(false) }} />
            </div>
          )}
        </div>
      </div>

      {/* ═══ بدنه ═══ */}
      <main style={{ maxWidth: 1300, margin: '0 auto', padding: '18px clamp(16px,3vw,32px) calc(96px + env(safe-area-inset-bottom))' }}>

        {/* گرید دسته‌ها — موبایل: ۳ ردیف ۵تایی */}
        <div className="mk-mcats">
          {CATS_M.map(c => (
            <button key={c.id} type="button" onClick={() => setCat(cat === c.id ? '' : c.id)}
              className={`mk-mcat${cat === c.id ? ' on' : ''}`}>
              <span className="ic"><img src={c.img} alt="" /></span>
              <span className="lb">{c.label}</span>
            </button>
          ))}
        </div>

        <div className="mk-layout">
          {/* ── سایدبار دسکتاپ ── */}
          <aside className="mk-sidebar">{FilterBody}</aside>

          {/* ── محتوای اصلی ── */}
          <section ref={gridRef}>
            {/* نوار وضعیت: تعداد + مرتب‌سازی + چیپ‌ها */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 800 }}>
                {cat ? catLabel(cat) : 'همه‌ی آگهی‌ها'}{city ? ` در ${city}` : ''}
              </span>
              <span style={{ fontSize: 11.5, color: MUT }}>{toFa(filtered.length)} آگهی</span>
              <span style={{ flex: 1 }} />
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
            {ready && filtered.length === 0 ? (
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
          </section>
        </div>
      </main>

      {/* ═══ نوار پایین موبایل ═══ */}
      <nav className="mk-bottomnav">
        <Link href="/" className="mk-bnav">
          <Home size={19} />
          <span className="lb">خانه</span>
        </Link>
        <button type="button" className={`mk-bnav${!showSaved ? ' on' : ''}`}
          onClick={() => { setShowSaved(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          <LayoutGrid size={19} />
          <span className="lb">آگهی‌ها</span>
        </button>
        <button type="button" className={`mk-bnav${showSaved ? ' on' : ''}`}
          onClick={() => { setShowSaved(p => !p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          <Bookmark size={19} />
          <span className="lb">نشان‌ها</span>
        </button>
        <Link href="/shop/new" className="mk-bnav">
          <span style={{ width: 21, height: 21, borderRadius: 8, background: `linear-gradient(135deg,#E8CE96,${GOLD} 55%,#A8853F)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#241B08' }}>
            <Plus size={14} />
          </span>
          <span className="lb">ثبت آگهی</span>
        </Link>
      </nav>

    </div>
  )
}

'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toFa, faNum, MONO, toggleSet, Icon, LQ, LQ_NEUTRAL, LQ_FELT_ON } from './shared'
import { productsBySeller } from '../../shop/products'
import ClubStoryModal from '../../../components/ClubStoryModal'
import { getSellerProfile, type SellerProfile } from '../../../lib/seller-store'
import { telPrefix } from '../../../lib/iran-geo'

/*
  نسخه‌ی فلت — UX فروشگاه واقعی
  دسته‌بندی‌ها: عیناً از «بیلیارد بازار» (۱۴ دسته)
*/

/* ─── دسته‌بندی‌های بیلیارد بازار ─── */
const BAZAAR_CATS = [
  { id: 'cue',       label: 'چوب' },
  { id: 'table',     label: 'میز' },
  { id: 'ball',      label: 'توپ' },
  { id: 'tip',       label: 'تیپ' },
  { id: 'chalk',     label: 'گچ' },
  { id: 'extension', label: 'اکستنشن' },
  { id: 'cue-case',  label: 'کیس' },
  { id: 'ball-bag',  label: 'کیف توپ' },
  { id: 'rest',      label: 'رست' },
  { id: 'cloth',     label: 'پارچه' },
  { id: 'oil',       label: 'روغن' },
  { id: 'towel',     label: 'حوله' },
  { id: 'clothing',  label: 'پوشاک' },
  { id: 'accessory', label: 'اکسسوری' },
  { id: 'other',     label: 'سایر' },
] as const
type CatKey = typeof BAZAAR_CATS[number]['id']
const CAT_LABEL = Object.fromEntries(BAZAAR_CATS.map(c => [c.id, c.label])) as Record<CatKey, string>

interface Product {
  id: string; name: string; cat: CatKey; brand: string
  price: number; old?: number; disc: number; rating: number; reviews: number; sales: number
  badge?: { text: string; kind: 'sale' | 'new' }; img: string
}

const SELLER_ID = '1'

/* پیش‌فرض‌ها — تا وقتی صاحب فروشگاه در /dashboard/seller چیزی ذخیره نکرده،
   صفحه با همین‌ها نمایش داده می‌شود. هر فیلدِ ذخیره‌شده جای همتای خودش را می‌گیرد. */
const STORE = {
  id: SELLER_ID, brand: 'پروکیو', title: 'فروشگاه تجهیزات بیلیارد بابی', logoText: 'پک',
  province: 'تهران', city: 'تهران',
  desc: 'عرضه‌ی مستقیم چوب، میز، توپ و لوازم جانبی حرفه‌ای',
  contactPhone: '66554433',
  /* لوگوی آپلودشده‌ی فروشگاه؛ تا وقتی null است آیکون پیش‌فرض نشان داده می‌شود */
  logo: null as string | null,
  banners: [] as string[],
  brands: [] as string[],
  aboutImages: [] as string[],
  verified: true, rating: 4.8, reviews: 312, memberSince: 1402,
  whatsapp: '989121234567', phones: ['021-88221100', '0912-123-4567'], instagram: 'procue.ir',
  address: 'تهران، خیابان ولیعصر، بالاتر از پارک ملت، پلاک ۴۵',
  hours: 'شنبه تا پنج‌شنبه، ۹ تا ۲۰',
  shipping: 'تحویل حضوری هم در فروشگاه امکان‌پذیر است',
  storyImage: '/images/shop/Pro_table.jpg',
  storyText: 'جدیدترین کالکشن چوب‌های کربنی Predator رسید — همین حالا ببینید!',
}

/* محصولات از منبع واحد بیلیارد بازار (همین فروشنده) */
const PRODUCTS: Product[] = productsBySeller(SELLER_ID).map(sp => ({
  id: String(sp.id),
  name: sp.name,
  cat: sp.cat as CatKey,
  brand: sp.brand,
  price: sp.price,
  old: sp.old > 0 ? sp.old : undefined,
  disc: sp.disc,
  rating: sp.rating,
  reviews: sp.reviews,
  sales: sp.sales,
  badge: sp.disc > 0 ? { text: `${toFa(sp.disc)}٪ تخفیف`, kind: 'sale' as const } : undefined,
  img: sp.img,
}))

/* ─── اسلایدر عکسِ آپلودشده (بنر هدر + باکس درباره ما) ─── */
function ImageSlider({ images }: { images: string[] }) {
  const [i, setI] = useState(0)
  const shots = images
  useEffect(() => {
    if (shots.length < 2) return
    const t = setInterval(() => setI(v => (v + 1) % shots.length), 4500)
    return () => clearInterval(t)
  }, [shots.length])
  const active = Math.min(i, shots.length - 1)
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {shots.map((src, k) => (
        <img
          key={k} src={src} alt="" draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: k === active ? 1 : 0, transition: 'opacity 0.9s ease' }}
        />
      ))}
      {shots.length > 1 && (
        <div style={{ position: 'absolute', bottom: 10, insetInline: 0, zIndex: 2, display: 'flex', justifyContent: 'center', gap: 6 }}>
          {shots.map((_, k) => (
            <button key={k} type="button" aria-label={`تصویر ${k + 1}`} onClick={() => setI(k)}
              style={{ width: k === active ? 18 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer',
                background: k === active ? '#fff' : 'rgba(255,255,255,0.55)', transition: 'width .25s, background .25s' }} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ════════ پوسترهای پیش‌فرض — به‌سبکِ هدرِ صفحه‌ی مربیان (کامپوننتِ لایه‌ای، نه عکس) ════════
   هر پوستر: گرادیانِ تیره + بافتِ نقطه‌ای + گلوی طلایی + خطوطِ اریبِ چوب + موتیفِ ظریفِ خطیِ طلایی. */
const PGOLD = '#C7A66A'
const STORE_POSTERS = [
  { bg: 'linear-gradient(125deg,#07231a 0%,#0e3a2a 55%,#0a2f22 100%)', glow: 'rgba(199,166,106,0.30)', accent: 'rgba(199,166,106,0.55)', motif: 'rack'  },
  { bg: 'linear-gradient(130deg,#141414 0%,#232a26 55%,#12211b 100%)', glow: 'rgba(199,166,106,0.28)', accent: 'rgba(199,166,106,0.52)', motif: 'cues'  },
  { bg: 'linear-gradient(125deg,#0b1c2a 0%,#123047 55%,#0c2436 100%)', glow: 'rgba(199,166,106,0.26)', accent: 'rgba(199,166,106,0.50)', motif: 'table' },
  { bg: 'linear-gradient(130deg,#1c1210 0%,#33231a 55%,#20140f 100%)', glow: 'rgba(199,166,106,0.26)', accent: 'rgba(199,166,106,0.50)', motif: 'case'  },
  { bg: 'linear-gradient(125deg,#08201f 0%,#0d3835 55%,#0a2a28 100%)', glow: 'rgba(199,166,106,0.28)', accent: 'rgba(199,166,106,0.52)', motif: 'store' },
]

function storeMotif(motif: string) {
  const s = 172
  if (motif === 'rack') {
    const rows = [[[50,11]],[[41,27],[59,27]],[[32,43],[50,43],[68,43]],[[23,59],[41,59],[59,59],[77,59]],[[14,75],[32,75],[50,75],[68,75],[86,75]]]
    return (
      <svg width={s} viewBox="0 0 100 86" fill="none" aria-hidden>
        {rows.flat().map((pt, i) => (<circle key={i} cx={pt![0]} cy={pt![1]} r="7.4" stroke={PGOLD} strokeWidth="1.3" opacity="0.82"/>))}
        <path d="M12 79 L50 5 L88 79 Z" stroke={PGOLD} strokeWidth="1" opacity="0.34"/>
        <circle cx="50" cy="11" r="3" fill={PGOLD} opacity="0.6"/>
      </svg>
    )
  }
  if (motif === 'cues') return (
    <svg width={s} viewBox="0 0 100 100" fill="none" aria-hidden>
      <g stroke={PGOLD} strokeWidth="2.2" strokeLinecap="round" opacity="0.78"><line x1="12" y1="86" x2="88" y2="16"/><line x1="12" y1="16" x2="88" y2="86"/></g>
      {[[12,86],[88,16],[12,16],[88,86]].map((pt, i) => (<circle key={i} cx={pt[0]} cy={pt[1]} r="2.4" fill={PGOLD} opacity="0.72"/>))}
      <circle cx="50" cy="51" r="13" fill="rgba(0,0,0,0.35)" stroke={PGOLD} strokeWidth="1.6" opacity="0.95"/>
      <circle cx="45" cy="46" r="3" fill={PGOLD} opacity="0.5"/>
    </svg>
  )
  if (motif === 'table') return (
    <svg width={s} viewBox="0 0 100 74" fill="none" aria-hidden>
      <rect x="8" y="8" width="84" height="58" rx="9" stroke={PGOLD} strokeWidth="1.7" opacity="0.85"/>
      <rect x="16" y="16" width="68" height="42" rx="5" stroke={PGOLD} strokeWidth="0.8" opacity="0.4"/>
      {[[8,8],[50,6],[92,8],[8,66],[50,68],[92,66]].map((pt, i) => (<circle key={i} cx={pt[0]} cy={pt[1]} r="3.4" fill={PGOLD} opacity="0.6"/>))}
      {[[30,4],[70,4],[30,70],[70,70]].map((pt, i) => (<circle key={i} cx={pt[0]} cy={pt[1]} r="1.5" fill={PGOLD} opacity="0.7"/>))}
      <circle cx="40" cy="37" r="5.4" stroke={PGOLD} strokeWidth="1.4" opacity="0.8"/>
      <circle cx="58" cy="34" r="5.4" fill={PGOLD} opacity="0.22"/>
    </svg>
  )
  if (motif === 'case') return (
    <svg width={s} viewBox="0 0 100 100" fill="none" aria-hidden>
      <rect x="34" y="14" width="32" height="74" rx="9" stroke={PGOLD} strokeWidth="1.7" opacity="0.85"/>
      <path d="M42 14 v-4 a8 8 0 0 1 16 0 v4" stroke={PGOLD} strokeWidth="1.5" opacity="0.7"/>
      <line x1="34" y1="40" x2="66" y2="40" stroke={PGOLD} strokeWidth="1.1" opacity="0.5"/>
      <line x1="34" y1="62" x2="66" y2="62" stroke={PGOLD} strokeWidth="1.1" opacity="0.5"/>
      <g stroke={PGOLD} strokeWidth="2" strokeLinecap="round" opacity="0.6"><line x1="46" y1="20" x2="46" y2="82"/><line x1="54" y1="20" x2="54" y2="82"/></g>
      <circle cx="46" cy="20" r="2.4" fill={PGOLD} opacity="0.75"/><circle cx="54" cy="20" r="2.4" fill={PGOLD} opacity="0.75"/>
    </svg>
  )
  // store — سردرِ فروشگاه
  return (
    <svg width={s} viewBox="0 0 100 92" fill="none" aria-hidden>
      <path d="M12 30 L20 12 H80 L88 30" stroke={PGOLD} strokeWidth="1.7" opacity="0.85" strokeLinejoin="round"/>
      <path d="M12 30 q4 8 10 8 t10-8 10 8 10-8 10 8 10-8 10 8 10-8" stroke={PGOLD} strokeWidth="1.5" opacity="0.7"/>
      <rect x="20" y="42" width="60" height="42" rx="3" stroke={PGOLD} strokeWidth="1.5" opacity="0.8"/>
      <rect x="44" y="58" width="16" height="26" stroke={PGOLD} strokeWidth="1.3" opacity="0.7"/>
      <circle cx="66" cy="56" r="6" stroke={PGOLD} strokeWidth="1.2" opacity="0.55"/>
    </svg>
  )
}

function StorePoster({ variant }: { variant: number }) {
  const p = STORE_POSTERS[variant % STORE_POSTERS.length]!
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: p.bg }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '18px 18px', opacity: 0.6 }}/>
      <div style={{ position: 'absolute', inset: '-20%', background: `radial-gradient(circle at 32% 42%, ${p.glow}, transparent 55%)` }}/>
      <div style={{ position: 'absolute', top: '-25%', bottom: '-25%', left: '50%', width: 2, background: `linear-gradient(180deg, transparent, ${p.accent}, transparent)`, transform: 'rotate(19deg)', opacity: 0.4 }}/>
      <div style={{ position: 'absolute', top: '-25%', bottom: '-25%', left: '57%', width: 1, background: `linear-gradient(180deg, transparent, ${p.accent}, transparent)`, transform: 'rotate(19deg)', opacity: 0.2 }}/>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'translateX(-14%)', opacity: 0.62 }}>
        <div style={{ display: 'flex', filter: 'drop-shadow(0 5px 18px rgba(0,0,0,0.45))' }}>{storeMotif(p.motif)}</div>
      </div>
    </div>
  )
}

/* اسلایدرِ پوسترهای پیش‌فرض — کراس‌فِیدِ نرم بین چند پوستر */
function PosterSlider({ variants }: { variants: number[] }) {
  const [active, setActive] = useState(0)
  useEffect(() => {
    if (variants.length < 2) return
    const t = setInterval(() => setActive(a => (a + 1) % variants.length), 4500)
    return () => clearInterval(t)
  }, [variants.length])
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {variants.map((v, k) => (
        <div key={k} style={{ position: 'absolute', inset: 0, opacity: k === active ? 1 : 0, transition: 'opacity 0.9s ease' }}>
          <StorePoster variant={v}/>
        </div>
      ))}
      {variants.length > 1 && (
        <div style={{ position: 'absolute', bottom: 10, insetInline: 0, zIndex: 2, display: 'flex', justifyContent: 'center', gap: 6 }}>
          {variants.map((_, k) => (
            <button key={k} type="button" aria-label={`پوستر ${k + 1}`} onClick={() => setActive(k)}
              style={{ width: k === active ? 18 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer',
                background: k === active ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'width .25s, background .25s' }} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── دراپ‌داون دسته‌بندی محصولات (مدرن) ─── */
function CategoryDropdown({
  value, onChange, counts,
}: {
  value: 'all' | CatKey
  onChange: (v: 'all' | CatKey) => void
  counts: Record<CatKey, number>
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [])

  const total = Object.values(counts).reduce((s, n) => s + n, 0)
  const label = value === 'all' ? 'همه محصولات' : CAT_LABEL[value]
  const items: { key: 'all' | CatKey; label: string; count: number }[] = [
    { key: 'all', label: 'همه محصولات', count: total },
    ...BAZAAR_CATS.map(c => ({ key: c.id, label: c.label, count: counts[c.id] ?? 0 })),
  ]

  return (
    <div ref={ref} className="relative w-full max-w-[300px]">
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox" aria-expanded={open}
        className={`flex w-full items-center gap-2.5 rounded-xl border bg-white px-4 py-3 text-right transition ${
          open ? 'border-[#14532D] shadow-[0_0_0_3px_rgba(20,83,45,0.10)]' : 'border-[#E7E2D6] hover:border-[#14532D]/45'
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(199,166,106,0.14)] text-[#9A6E38]">{Icon.funnel}</span>
        <span className="flex-1">
          <span className="block text-[10.5px] text-[#8A8474]">دسته‌بندی</span>
          <span className="block text-[14px] font-bold text-[#1C1B17]">{label}</span>
        </span>
        <span className={`text-[#8A8474] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>{Icon.chevron}</span>
      </button>

      <div
        role="listbox"
        className={`absolute start-0 top-full z-40 mt-2 max-h-[340px] w-full origin-top overflow-y-auto rounded-2xl border border-[#E7E2D6] bg-white p-1.5 shadow-[0_20px_44px_rgba(28,27,23,0.16)] transition-all duration-150 ${
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        {items.map(it => {
          const selected = it.key === value
          return (
            <button
              key={it.key} role="option" aria-selected={selected}
              onClick={() => { onChange(it.key); setOpen(false) }}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-right text-[13.5px] transition-colors ${
                selected ? 'bg-[#DCEEE4]/70 font-bold text-[#14532D]' : 'text-[#5B564B] hover:bg-[#F7F5F0]'
              }${it.key === 'all' ? ' border-b border-[#EFEBE1] mb-1 rounded-b-none' : ''}`}
            >
              <span className="flex-1">{it.label}</span>
              <span className={`text-[11.5px] ${MONO} ${selected ? 'text-[#14532D]' : 'text-[#A69F8E]'}`}>{faNum(it.count)}</span>
              {selected && <span className="text-[#14532D]">{Icon.check}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ═══ صفحه ═══ */
export default function FlatShop() {
  /* پروفایلِ ذخیره‌شده‌ی صاحب فروشگاه (از /dashboard/seller).
     بعد از mount خوانده می‌شود تا SSR و کلاینت یکی باشند. */
  const [profile, setProfile] = useState<SellerProfile | null>(null)
  useEffect(() => { setProfile(getSellerProfile(SELLER_ID)) }, [])

  /* فقط فیلدهای پرشده جای پیش‌فرض را می‌گیرند — یک فیلدِ خالی نباید صفحه را خالی کند */
  const store = useMemo(() => {
    if (!profile) return STORE
    const pick = (v: string | undefined, fallback: string) => (v && v.trim() ? v : fallback)
    const phones = profile.phones.filter(p => p.trim())
    return {
      ...STORE,
      logo:         profile.logo || null,
      banners:      profile.banners?.length ? profile.banners : STORE.banners,
      brands:       profile.brands?.length ? profile.brands : STORE.brands,
      aboutImages:  profile.aboutImages?.length ? profile.aboutImages : STORE.aboutImages,
      title:        pick(profile.title, STORE.title),
      brand:        pick(profile.brand, STORE.brand),
      province:     pick(profile.province, STORE.province),
      city:         pick(profile.city, STORE.city),
      desc:         pick(profile.desc, STORE.desc),
      contactPhone: pick(profile.contactPhone, STORE.contactPhone),
      address:      pick(profile.address, STORE.address),
      hours:        pick(profile.hours, STORE.hours),
      whatsapp:     pick(profile.whatsapp, STORE.whatsapp),
      instagram:    pick(profile.instagram, STORE.instagram),
      storyImage:   pick(profile.storyImage, STORE.storyImage),
      storyText:    pick(profile.storyText, STORE.storyText),
      phones:       phones.length ? phones : STORE.phones,
    }
  }, [profile])

  /* شماره‌ی تماس با کد شهر (استان) — مثلاً ۰۲۱-۶۶۵۵۴۴۳۳ */
  const areaCode  = telPrefix(store.province)
  const phoneDig  = store.contactPhone.replace(/\D/g, '')
  const withCode  = !!areaCode && !!phoneDig && !phoneDig.startsWith('0')
  const phoneText = withCode ? `${areaCode}-${phoneDig}` : store.contactPhone
  const phoneHref = withCode ? `${areaCode}${phoneDig}` : phoneDig

  /* دسته‌بندیِ انتخاب‌شده در دراپ‌داون + جستجو + صفحه */
  const [cat, setCat]     = useState<'all' | CatKey>('all')
  const [page, setPage]   = useState(1)
  const [query, setQuery] = useState('')

  /* wishlist + story */
  const [wish, setWish] = useState<Set<string>>(new Set())
  const [storyOpen, setStoryOpen] = useState(false)
  const router = useRouter()

  const catCounts = useMemo(() => {
    const c = Object.fromEntries(BAZAAR_CATS.map(x => [x.id, 0])) as Record<CatKey, number>
    PRODUCTS.forEach(p => { c[p.cat]++ })
    return c
  }, [])

  const visible = useMemo(() => {
    const q = query.trim()
    return PRODUCTS.filter(p => {
      if (cat !== 'all' && p.cat !== cat) return false
      if (q && !p.name.includes(q) && !p.brand.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
  }, [cat, query])

  /* صفحه‌بندی: در حالت «همه محصولات» دو ردیف ۵تایی (۱۰ در هر صفحه).
     تا ۱۰ محصول هیچ دکمه‌ای نیست؛ از ۱۱ به بعد عددِ ۲ و … پایین صفحه می‌آید. */
  const PER_PAGE  = 10
  const pageCount = Math.max(1, Math.ceil(visible.length / PER_PAGE))
  const safePage  = Math.min(page, pageCount)
  const paged     = visible.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  /* با تغییر دسته/جستجو برگرد به صفحه‌ی ۱ */
  useEffect(() => { setPage(1) }, [cat, query])

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F5F0] font-[Vazirmatn,Tahoma,sans-serif] text-[#1C1B17]">

      <style>{`
        /* کارت محصول — هم‌فرمِ کارت sec1 در صفحه‌ی بیلیارد بازار.
           عرض را گرید تعیین می‌کند (برخلاف sec1 که کاروسل با عرض ثابت است)، ولی نسبت،
           سهم عکس، گردی، بوردر و فونت‌ها عیناً همان‌اند. */
        .prod-card-sec1 {
          /* ۱.۷۵ = ۱.۹۴۴ منهای ۱۰٪ */
          aspect-ratio: 1 / 1.75;
          border-radius: 10px;
          border: 1.5px solid rgba(28,28,26,0.18);
          transition: transform .22s cubic-bezier(0.22,1,0.36,1), box-shadow .22s;
        }
        .prod-card-sec1:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(28,28,26,0.12); }
        .pc-body-sec1 { padding: 21px 10px 12px; }
        /* نام محصول — حداکثر دو خط، مثل sec1 */
        .pc-name-sec1 {
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        @media(max-width:700px) {
          .prod-card-sec1 { aspect-ratio: 1 / 1.662; }  /* ۱.۸۴۷ منهای ۱۰٪ */
          .pc-body-sec1 { padding: 14px 7px 7px; }
          .pc-name-sec1 { font-size: 13.05px; line-height: 1.35; color: #666; }
        }
        /* دکمه‌ی علاقه‌مندی */
        .wish-btn { transition: transform .18s cubic-bezier(0.22,1,0.36,1), color .18s, background .18s, border-color .18s; }
        .wish-btn:hover  { transform: scale(1.08); }
        .wish-btn:active { transform: scale(0.9); }
        @media (prefers-reduced-motion: reduce) { .wish-btn { transition: none; } .wish-btn:hover, .wish-btn:active { transform: none; } }
      `}</style>

      {/* ── breadcrumb ── */}
      <div className="mx-auto max-w-[1240px] px-4 pt-4 text-[12.5px] text-[#8A8474] sm:px-6">
        <Link href="/" className="transition-colors hover:text-[#14532D]">خانه</Link>
        <span className="mx-1.5">/</span>
        <Link href="/sellers" className="transition-colors hover:text-[#14532D]">فروشگاه‌ها</Link>
        <span className="mx-1.5">/</span>
        <span>{store.title}</span>
      </div>

      {/* ═══ هدر: بنر اسلایدی + کارت فروشگاه ═══ */}
      <div className="mx-auto mt-4 max-w-[1240px] px-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-[#E7E2D6] bg-white">
          {/* بنر — اسلایدرِ عکسِ آپلودشده؛ اگر چیزی نگذاشته، اسلایدرِ ۳ پوسترِ پیش‌فرض */}
          <div className="relative" style={{ height: 'clamp(150px,24vw,250px)', background: '#0a2f22' }}>
            {store.banners.length
              ? <ImageSlider images={store.banners} />
              : <PosterSlider variants={[0, 1, 2]} />}
            <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0.04) 0%,rgba(0,0,0,0.32) 100%)' }} />
          </div>

          {/* کارت فروشگاه — لوگو نیمی روی بنر، بقیه زیرِ هم */}
          <div className="relative px-4 pb-5 sm:px-6 sm:pb-6">
            {/* لوگو با حلقه‌ی استوری — نیمی روی عکس */}
            <button
              type="button" onClick={() => setStoryOpen(true)} aria-label="مشاهده استوری فروشگاه"
              className="-mt-12 block shrink-0 rounded-full p-[3px] transition-transform duration-200 hover:scale-105 active:scale-95 sm:-mt-14"
              style={{ background: 'linear-gradient(135deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)', boxShadow: '0 6px 18px rgba(214,41,118,0.30)', width: 'fit-content' }}
            >
              <span className="flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-gradient-to-bl from-[#14532D] to-[#1E6B3C] text-white sm:h-[94px] sm:w-[94px]">
                {store.logo
                  ? <img src={store.logo} alt={store.title} className="h-full w-full object-cover"/>
                  : Icon.storefront}
              </span>
            </button>

            {/* نام، شهر (با دکمه‌ی تلفن روبه‌رویش سمت چپ)، توضیحات — زیرِ هم */}
            <h2 className="mt-3 text-[17px] font-bold sm:text-[19px]">{store.title}</h2>
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[12.5px] text-[#8A8474]">
                <span className="text-[#14532D]">{Icon.pin}</span>{[store.province, store.city].filter(Boolean).join('، ')}
              </div>
              {phoneDig && (
                <a
                  href={`tel:${phoneHref}`}
                  className={`inline-flex items-center gap-1.5 rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] px-3.5 py-2 text-[13px] font-bold text-[#9A6E38] transition hover:-translate-y-0.5 ${MONO}`}
                >
                  <span>{Icon.phone}</span>{toFa(phoneText)}
                </a>
              )}
            </div>
            <p className="mt-2 max-w-[720px] text-[13px] leading-relaxed text-[#5B564B]">{store.desc}</p>

            {/* برندهای نمایندگی */}
            {store.brands.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="text-[11.5px] text-[#8A8474]">نماینده‌ی:</span>
                {store.brands.map((b, i) => (
                  <span key={i} className="rounded-full border border-[#E7E2D6] bg-[#FAFAF7] px-2.5 py-1 text-[11.5px] font-semibold text-[#5B564B]">{b}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* سرچ — زیر باکس فروشگاه */}
        <div className="relative mt-3">
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1) }}
            placeholder="جستجو در محصولات این فروشگاه..."
            className="w-full rounded-[10px] border border-[#E7E2D6] bg-white px-4 py-2.5 pl-11 text-[13.5px] text-[#1C1B17] placeholder:text-[#8A8474] focus:border-[#14532D] focus:outline-none"
          />
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8474]">{Icon.search}</span>
        </div>
      </div>

      {/* ═══ محصولات فروشگاه ═══ */}
      <div className="mx-auto max-w-[1240px] px-4 pb-16 pt-6 sm:px-6">
        {/* تیتر + دراپ‌داون دسته‌بندی */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">محصولات فروشگاه</h1>
            <span className="text-[12.5px] text-[#8A8474]">{faNum(visible.length)} محصول</span>
          </div>
          <CategoryDropdown value={cat} onChange={setCat} counts={catCounts} />
        </div>

        {/* گرید — ۵ ستون در دسکتاپ (۲ ردیفِ ۵تایی = ۱۰ در هر صفحه) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 min-[640px]:grid-cols-3 min-[900px]:grid-cols-4 min-[1120px]:grid-cols-5">
            {paged.map(p => {
              const isWished = wish.has(p.id)
              return (
                /* کارت هم‌فرمِ sec1 (صفحه‌ی بیلیارد بازار). کلاس‌های bz-scroll-card/pc-body آنجا داخل
                   <style> همان صفحه‌اند و اینجا وجود ندارند، پس مقادیرشان اینجا بازتولید شده:
                   نسبت ۱:۱.۹۴۴ (موبایل ۱:۱.۸۴۷)، عکس ۶۰٪، radius ۱۰، بوردر ۱.۵px، فونت‌ها و ردیف قیمت. */
                <article
                  key={p.id}
                  onClick={() => router.push(`/shop/${p.id}`)}
                  className="prod-card-sec1 group flex cursor-pointer flex-col overflow-hidden bg-white"
                >
                  <div className="relative shrink-0 basis-[60%] overflow-hidden border-b-[1.5px] border-[rgba(28,28,26,0.18)] bg-[#F4F3F1]">
                    <img src={p.img} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"/>
                    {/* قلب — خطی تا وقتی انتخاب نشده، توپر بعد از انتخاب (قبلاً همیشه توپر بود و
                        فقط رنگ عوض می‌شد). شیشه‌ی مات + فشار کوچک هنگام کلیک. */}
                    <button
                      aria-label={isWished ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی'}
                      aria-pressed={isWished}
                      onClick={e => { e.stopPropagation(); setWish(prev => toggleSet(prev, p.id)) }}
                      className={`wish-btn absolute left-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md ${
                        isWished
                          ? 'border-[#B23B2E]/30 bg-white/85 text-[#B23B2E]'
                          : 'border-white/70 bg-white/55 text-[#5B564B] hover:text-[#B23B2E]'
                      }`}
                    >
                      {isWished ? Icon.heart : Icon.heartO}
                    </button>
                  </div>

                  <div className="pc-body-sec1 flex flex-1 flex-col gap-1.5">
                    <span className="pc-name-sec1 text-[14.5px] leading-[1.55] text-[#1C1C1A]">{p.name}</span>
                    <div className="mt-auto flex items-center gap-1.5">
                      {p.disc > 0 && (
                        <span dir="ltr" className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#b400ae] px-2.5 pb-0.5 pt-1 text-[16px] font-extrabold leading-none text-white ${MONO}`}>
                          ٪{toFa(p.disc)}
                        </span>
                      )}
                      <div className="ms-auto text-right">
                        {p.disc > 0 && p.old !== undefined && (
                          <div className={`-mb-[3px] mt-[3px] text-[12.3px] leading-[1.1] text-[rgba(28,28,26,0.5)] line-through tabular-nums ${MONO}`}>
                            {faNum(p.old)} <span className="inline-block text-[10.6px] font-medium no-underline">تومان</span>
                          </div>
                        )}
                        <div className={`text-[15.5px] font-bold tabular-nums text-[#1C1C1A] ${MONO}`}>{faNum(p.price)}</div>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

        {visible.length === 0 && (
          <div className="rounded-2xl border border-[#E7E2D6] bg-white px-6 py-14 text-center text-[13.5px] text-[#8A8474]">
            محصولی در این دسته‌بندی پیدا نشد.
            {cat !== 'all' && <button onClick={() => setCat('all')} className="mr-2 font-bold text-[#9A6E38] transition hover:opacity-70">نمایش همه محصولات</button>}
          </div>
        )}

        {/* صفحه‌بندی — تا ۱۰ محصول هیچ دکمه‌ای نیست؛ از ۱۱ به بعد عدد ۲ و … */}
        {pageCount > 1 && (
          <div className="mt-9 flex justify-center gap-2">
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                aria-current={safePage === i + 1 ? 'page' : undefined}
                className={`${LQ} flex h-9 w-9 items-center justify-center rounded-xl text-[13px] ${
                  safePage === i + 1 ? `${LQ_FELT_ON} font-bold` : `${LQ_NEUTRAL} text-[#5B564B]`
                } ${MONO}`}
              >
                {toFa(i + 1)}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(pageCount, p + 1))}
              disabled={safePage === pageCount}
              aria-label="صفحه‌ی بعد"
              className={`${LQ} ${LQ_NEUTRAL} flex h-9 w-9 items-center justify-center rounded-xl text-[13px] text-[#5B564B] disabled:cursor-not-allowed disabled:opacity-40`}
            >
              ‹
            </button>
          </div>
        )}
      </div>

      {/* ═══ درباره ما — ۱/۳ اسلایدر سمت راست، متن سمت چپ ═══ */}
      <div className="mx-auto max-w-[1240px] px-4 pb-14 sm:px-6">
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-[#E7E2D6] bg-white min-[760px]:grid-cols-[1fr_2fr]">
          {/* اسلایدر ۳ عکسی (سمت راست، یک‌سوم)؛ اگر خالی، پوسترِ پیش‌فرضِ «درباره ما» */}
          <div className="relative min-h-[210px] bg-[#0a2a28] min-[760px]:min-h-[270px]">
            {store.aboutImages.length
              ? <ImageSlider images={store.aboutImages} />
              : <StorePoster variant={4} />}
          </div>
          {/* متن (دو سوم) */}
          <div className="flex flex-col justify-center p-6 sm:p-8">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-4 w-[3px] rounded bg-gradient-to-b from-[#C7A66A] to-[#8A6020]" />
              <h3 className="text-[17px] font-bold sm:text-[19px]">درباره ما</h3>
            </div>
            <p className="text-[13.5px] leading-[2] text-[#5B564B]">{store.desc}</p>
          </div>
        </div>
      </div>

      {/* ═══ FOOTER — کارت اختصاصی فروشگاه (سبک sellers/2) ═══ */}
      <footer className="px-4 pb-8 pt-2 sm:px-6">
        <div className="mx-auto max-w-[1240px] overflow-hidden rounded-2xl border border-[#E8E3D6] bg-[#FAFAF7] shadow-[0_4px_20px_rgba(28,27,23,0.05)]">
          {/* موبایل: فاصله‌ی بلوک‌ها ۳۶ ⇒ ۱۸ و پدینگ ۲۴ ⇒ ۱۸، تا فوتر جمع‌تر شود. دسکتاپ دست‌نخورده. */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-[18px] p-[18px] sm:grid-cols-2 sm:gap-y-9 sm:p-8 lg:grid-cols-4">

            {/* برند */}
            <div>
              <div className="flex items-center gap-2.5 text-[16px] font-bold">
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_32%_30%,#2b2b2b,#0a0a0a_70%)]">
                  <span className="flex h-[13px] w-[13px] items-center justify-center rounded-full bg-white text-[8px] font-bold text-[#111]">۸</span>
                </span>
                {store.brand}
              </div>
              {/* همان متنی که صاحب فروشگاه در «درباره‌ی فروشگاه» می‌نویسد — منبع واحد با هدر،
                  نه یک جمله‌ی هاردکد. فقط دسکتاپ؛ در موبایل فوتر باید جمع باشد. */}
              <p className="mt-1.5 hidden max-w-[240px] text-[12.5px] leading-relaxed text-[#5B564B] sm:mt-3 sm:block">
                {store.desc}
              </p>
            </div>

            {/* دسته‌بندی‌ها — روی موبایل حذف */}
            <div className="hidden sm:block">
              <h4 className="mb-2 text-[10.5px] font-bold tracking-[0.08em] text-[#A69F8E] sm:mb-4">دسته‌بندی‌ها</h4>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px] text-[#5B564B]">
                {BAZAAR_CATS.slice(0, 8).map(c => (
                  <li key={c.id}>
                    <button
                      onClick={() => { setCat(c.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      className="py-0.5 transition-colors hover:text-[#14532D]"
                    >
                      {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* راه‌های ارتباطی */}
            <div>
              <h4 className="mb-2 text-[10.5px] font-bold tracking-[0.08em] text-[#A69F8E] sm:mb-4">راه‌های ارتباطی</h4>
              <ul className="space-y-1.5 text-[13px] text-[#5B564B] sm:space-y-3">
                <li className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                  {store.phones.map(ph => (
                    <a key={ph} href={`tel:${ph.replace(/-/g, '')}`} className={`flex items-center gap-2 py-0.5 transition-colors hover:text-[#14532D] ${MONO}`}>
                      <span className="text-[#14532D]">{Icon.phone}</span>{toFa(ph)}
                    </a>
                  ))}
                </li>
                <li className="flex items-center gap-2.5 py-0.5">
                  <span className="text-[#14532D]">{Icon.clock}</span>{store.hours}
                </li>
                {/* آیکون‌های شبکه اجتماعی — مثل فوتر اصلی سایت (مربع گرد خنثی، هاور طلایی) */}
                <li className="flex items-center gap-2.5 pt-1.5 sm:pt-3">
                  <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="واتساپ"
                    className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-[#E7E2D6] bg-[rgba(26,25,23,0.05)] text-[#8A8474] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C7A66A]/45 hover:bg-[#C7A66A]/[0.12] hover:text-[#C7A66A]">
                    {Icon.wa}
                  </a>
                  <a href={`https://instagram.com/${store.instagram}`} target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام"
                    className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-[#E7E2D6] bg-[rgba(26,25,23,0.05)] text-[#8A8474] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C7A66A]/45 hover:bg-[#C7A66A]/[0.12] hover:text-[#C7A66A]">
                    {Icon.insta}
                  </a>
                </li>
              </ul>
            </div>

            {/* موقعیت فروشگاه */}
            <div>
              <h4 className="mb-2 text-[10.5px] font-bold tracking-[0.08em] text-[#A69F8E] sm:mb-4">موقعیت فروشگاه</h4>
              <p className="mb-1.5 flex items-start gap-2 text-[13px] leading-relaxed text-[#5B564B] sm:mb-3">
                <span className="mt-0.5 shrink-0 text-[#14532D]">{Icon.pin}</span>
                {store.address}
              </p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(store.address)}`}
                target="_blank" rel="noopener noreferrer"
                className="group relative block h-28 overflow-hidden rounded-xl border border-[#E8E3D6] bg-[#F4F1EA]"
                aria-label="مشاهده روی نقشه"
              >
                <svg viewBox="0 0 300 120" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                  {[0,1,2,3].map(i => <line key={`h${i}`} x1="0" y1={i * 40} x2="300" y2={i * 40} stroke="#1C1B17" strokeWidth="0.5" opacity="0.07"/>)}
                  {[0,1,2,3,4,5,6].map(i => <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="120" stroke="#1C1B17" strokeWidth="0.5" opacity="0.07"/>)}
                  <line x1="0" y1="82" x2="300" y2="82" stroke="#1C1B17" strokeWidth="2" opacity="0.08"/>
                  <line x1="105" y1="0" x2="105" y2="120" stroke="#1C1B17" strokeWidth="2" opacity="0.08"/>
                </svg>
                <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-[70%] items-center justify-center rounded-full bg-[#14532D] text-white shadow-md transition-transform group-hover:scale-110">
                  {Icon.pin}
                </span>
                <span className="absolute bottom-2 right-2 rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] px-2.5 py-1 text-[11px] font-bold text-[#9A6E38] shadow-sm transition hover:-translate-y-0.5">
                  مشاهده روی نقشه
                </span>
              </a>
            </div>
          </div>

          {/* نوار پایین */}
          <div className="border-t border-[#E8E3D6] px-6 py-4 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-[#8A8474]">
              <span>© {toFa(1405)} {store.brand} — تمام حقوق محفوظ است</span>
              <Link href="/" className="transition-colors hover:opacity-80">قدرت‌گرفته از بیلیارد <span className="font-bold text-[#C7A66A]">هاب</span></Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ استوری فروشگاه (مثل صفحه‌ی باشگاه) ═══ */}
      {storyOpen && (
        <ClubStoryModal
          club={{ name: store.brand, storyMediaUrl: store.storyImage, storyText: store.storyText, badge: 'فروشگاه' }}
          onClose={() => setStoryOpen(false)}
        />
      )}
    </div>
  )
}

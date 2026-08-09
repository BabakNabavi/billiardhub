'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { toFa, faNum, MONO, toggleSet, Icon, LQ, LQ_NEUTRAL, LQ_FELT_ON } from './shared'
import { fetchProductsBySeller, type ShopProduct } from '../../shop/products'
import ClubStoryModal from '../../../components/ClubStoryModal'
import { getSellerProfile, type SellerProfile } from '../../../lib/seller-store'
import { fetchProfile } from '../../../lib/profiles/client'
import { telPrefix, provinceOfCity } from '../../../lib/iran-geo'
import { getMockSeller } from '../../../lib/sellers-data'
import { MARKET_CATEGORIES } from '../../../lib/market/categories'

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

const DEFAULT_SLUG = '1'

/* پیش‌فرض‌ها — تا وقتی صاحب فروشگاه در /dashboard/seller چیزی ذخیره نکرده،
   صفحه با همین‌ها نمایش داده می‌شود. هر فیلد ذخیره‌شده جای همتای خودش را می‌گیرد. */
const STORE = {
  id: DEFAULT_SLUG, brand: 'پروکیو', title: 'فروشگاه تجهیزات بیلیارد بابی', logoText: 'پک',
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
  storyImage: '/images/shop/Pro_table.webp',
  storyText: 'جدیدترین کالکشن چوب‌های کربنی Predator رسید — همین حالا ببینید!',
}

/* محصولات یک فروشنده (به شکل کارت) — بر اساس id همان فروشگاه */
function productsForSeller(rows: ShopProduct[]): Product[] {
  return rows.map(sp => ({
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
}

/* ─── اسلایدر عکس آپلودشده (بنر هدر + باکس درباره ما) ─── */
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
        <img loading="lazy" decoding="async" 
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

/* ════════ پوسترهای پیش‌فرض — به‌سبک هدر صفحه‌ی مربیان (کامپوننت لایه‌ای، نه عکس) ════════
   هر پوستر: گرادیان تیره + بافت نقطه‌ای + گلوی طلایی + خطوط اریب چوب + موتیف ظریف خطی طلایی. */
const STORE_POSTERS = [
  { bg: 'linear-gradient(115deg,#0c1424 0%,#17253f 55%,#1e2f4d 100%)', sub: 'PROFESSIONAL BILLIARD SHOP' },  // سرمه‌ای (مثل کاور مربی)
  { bg: 'linear-gradient(120deg,#07231a 0%,#0e3a2a 55%,#0a2f22 100%)', sub: 'CUES · BALLS · TABLES'        },  // نمد سبز
  { bg: 'linear-gradient(120deg,#141414 0%,#26221d 55%,#17140f 100%)', sub: 'PRO EQUIPMENT · لوازم حرفه‌ای' },  // زغالی-طلایی
  { bg: 'linear-gradient(120deg,#101c2b 0%,#14324a 55%,#0d2334 100%)', sub: 'ABOUT US · درباره ما'         },  // پوستر «درباره ما»
]

/* پوستر پیش‌فرض — عیناً به سبک کاور صفحه‌ی مربی: زمینه‌ی تیره + بافت نقطه‌ای +
   گلوی طلایی + خط اریب + وردمارک «بیلیارد هاب» + نام فروشگاه (خودکار) + زیرنویس.
   about=true ⇒ ترکیب وسط‌چین باکس «درباره ما»؛ وگرنه حالت راست‌چین هدر. */
function StorePoster({ variant, title, about = false }: { variant: number; title?: string; about?: boolean }) {
  const p = STORE_POSTERS[variant % STORE_POSTERS.length]!
  const layers = (
    <>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)', backgroundSize: '16px 16px' }}/>
      <div style={{ position: 'absolute', insetInlineStart: '-6%', top: '-40%', width: '46%', height: '180%', background: 'radial-gradient(ellipse, rgba(199,166,106,0.18) 0%, transparent 66%)', filter: 'blur(18px)', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: '54%', width: '1.5px', background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.45),transparent)', transform: 'rotate(-10deg)', pointerEvents: 'none' }}/>
    </>
  )
  const subtitleRow = (centered: boolean) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 20, height: '1.5px', background: 'linear-gradient(90deg,transparent,#C7A66A)', display: 'inline-block' }}/>
      <span dir="auto" style={{ fontSize: 'clamp(8.5px,1.25vw,11.5px)', fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(199,166,106,0.92)', whiteSpace: 'nowrap' }}>{p.sub}</span>
      {centered && <span style={{ width: 20, height: '1.5px', background: 'linear-gradient(90deg,#C7A66A,transparent)', display: 'inline-block' }}/>}
    </div>
  )

  if (about) {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: p.bg }}>
        {layers}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(7px,1.2vw,12px)', padding: 'clamp(12px,2vw,22px) 16px', textAlign: 'center' }}>
          <img loading="lazy" decoding="async" src="/images/Logo/bh-header-v4.png" alt="بیلیارد هاب" style={{ height: 'clamp(19px,3.2vw,34px)', width: 'auto' }}/>
          {title && <div style={{ fontSize: 'clamp(14px,2.5vw,23px)', fontWeight: 800, color: '#fff', lineHeight: 1.28, maxWidth: '94%', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</div>}
          {subtitleRow(true)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: p.bg }}>
      {layers}
      {/* وردمارک BILLIARD HUB + نام فروشگاه + زیرنویس (راست‌چین) */}
      <div style={{ position: 'absolute', top: '50%', insetInlineEnd: 'clamp(22px,5vw,54px)', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 9, maxWidth: 'min(62%,520px)' }}>
        <img loading="lazy" decoding="async" src="/images/Logo/bh-header-v4.png" alt="بیلیارد هاب" style={{ height: 'clamp(22px,3.3vw,36px)', width: 'auto' }}/>
        {title && <div style={{ fontSize: 'clamp(15px,2.3vw,24px)', fontWeight: 800, color: '#fff', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</div>}
        {subtitleRow(false)}
      </div>
    </div>
  )
}

/* اسلایدر پوسترهای پیش‌فرض — کراس‌فید نرم بین چند پوستر (نام فروشگاه خودکار روی همه) */
function PosterSlider({ variants, title }: { variants: number[]; title?: string }) {
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
          <StorePoster variant={v} title={title}/>
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
              <span className={`text-[11.5px] ${MONO} ${selected ? 'text-[#14532D]' : 'text-[#9A6E38]'}`}>{faNum(it.count)}</span>
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
  /* شناسه‌ی فروشگاه از آدرس (/sellers/[id]) — هر کارت فروشگاه خودش را باز می‌کند،
     نه همیشه فروشگاه شماره‌ی ۱. */
  const params = useParams()
  const sellerId = (Array.isArray(params?.id) ? params.id[0] : params?.id) || DEFAULT_SLUG

  /* پروفایل ذخیره‌شده‌ی همین فروشگاه (از /dashboard/seller).
     بعد از mount خوانده می‌شود تا SSR و کلاینت یکی باشند. */
  const [profile, setProfile] = useState<SellerProfile | null>(null)
  useEffect(() => {
    setProfile(getSellerProfile(sellerId))
    /* منبع حقیقت سرور است — فروشگاه کاربران دیگر فقط از این‌جا می‌آید */
    void fetchProfile<SellerProfile>('seller', sellerId).then(p => {
      if (p) setProfile({ ...p.data, slug: p.slug, verified: p.verified } as SellerProfile)
    })
  }, [sellerId])

  /* محصولات همین فروشگاه؛ فروشگاه نمونه که محصول اختصاصی ندارد، کاتالوگ دمو را نشان می‌دهد
     تا storefront خالی نماند. */
  /* محصولات از سرور می‌آیند، نه از کاتالوگِ ساختگی.

     پیش‌تر فروشگاهِ بی‌محصول، محصولاتِ فروشگاهِ «۱» را نشان می‌داد —
     کالای یک فروشنده زیر نامِ فروشنده‌ی دیگر. فروشگاهِ بی‌محصول باید
     خالی بماند، و حالا واقعاً می‌ماند. */
  const [rows, setRows] = useState<ShopProduct[]>([])
  useEffect(() => {
    let alive = true
    void fetchProductsBySeller(sellerId).then(r => { if (alive) setRows(r) })
    return () => { alive = false }
  }, [sellerId])
  const PRODUCTS = useMemo(() => productsForSeller(rows), [rows])

  /* فقط فیلدهای پرشده جای پیش‌فرض را می‌گیرند — یک فیلد خالی نباید صفحه را خالی کند */
  const store = useMemo(() => {
    if (!profile) {
      /* پروفایل واقعی نیست ⇒ اگر این id یکی از فروشگاه‌های نمونه است، اطلاعات همان را نشان بده
         (نه پیش‌فرض «بابی»). این باعث می‌شود هر کارت، فروشگاه خودش را باز کند. */
      const m = getMockSeller(sellerId)
      if (m) return {
        ...STORE, id: sellerId,
        title: m.name, brand: m.name,
        province: provinceOfCity(m.city), city: m.city,
        desc: m.description, contactPhone: m.phone,
        brands: m.brands, banners: [m.bannerImage], verified: m.verified,
      }
      return { ...STORE, id: sellerId }
    }
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
      /* ── استوری از داده‌ی نمونه پر نمی‌شود ──
         پیش‌تر فروشگاهی که هیچ استوری نگذاشته بود، حلقه‌ی رنگیِ
         استوری می‌گرفت و با زدنش یک استوریِ ساختگی باز می‌شد
         («کالکشن چوب‌های کربنی Predator»). یعنی سایت از طرفِ
         فروشنده چیزی تبلیغ می‌کرد که او نگذاشته بود. */
      storyImage:   profile.storyImage ?? '',
      storyText:    profile.storyText ?? '',
      phones:       phones.length ? phones : STORE.phones,
    }
  }, [profile, sellerId])

  /* شماره‌ی تماس با کد شهر (استان) — مثلاً ۰۲۱-۶۶۵۵۴۴۳۳ */
  const areaCode  = telPrefix(store.province)
  const phoneDig  = store.contactPhone.replace(/\D/g, '')
  const withCode  = !!areaCode && !!phoneDig && !phoneDig.startsWith('0')
  const phoneText = withCode ? `${areaCode}-${phoneDig}` : store.contactPhone
  const phoneHref = withCode ? `${areaCode}${phoneDig}` : phoneDig

  /* دسته‌بندی انتخاب‌شده در دراپ‌داون + جستجو + صفحه */
  const [cat, setCat]     = useState<'all' | CatKey>('all')
  const [page, setPage]   = useState(1)
  const [query, setQuery] = useState('')

  /* wishlist + story */
  const [wish, setWish] = useState<Set<string>>(new Set())
  const [storyOpen, setStoryOpen] = useState(false)
  /* استوریِ واقعی = فروشنده تصویری گذاشته باشد */
  const hasStory = !!String(store.storyImage ?? '').trim()
  const router = useRouter()

  const catCounts = useMemo(() => {
    const c = Object.fromEntries(BAZAAR_CATS.map(x => [x.id, 0])) as Record<CatKey, number>
    PRODUCTS.forEach(p => { c[p.cat]++ })
    return c
  }, [PRODUCTS])

  const visible = useMemo(() => {
    const q = query.trim()
    return PRODUCTS.filter(p => {
      if (cat !== 'all' && p.cat !== cat) return false
      if (q && !p.name.includes(q) && !p.brand.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
  }, [PRODUCTS, cat, query])

  /* صفحه‌بندی: در حالت «همه محصولات» دو ردیف ۵تایی (۱۰ در هر صفحه).
     تا ۱۰ محصول هیچ دکمه‌ای نیست؛ از ۱۱ به بعد عدد ۲ و … پایین صفحه می‌آید. */
  const PER_PAGE  = 10
  const pageCount = Math.max(1, Math.ceil(visible.length / PER_PAGE))
  const safePage  = Math.min(page, pageCount)
  const paged     = visible.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  /* با تغییر دسته/جستجو برگرد به صفحه‌ی ۱ */
  useEffect(() => { setPage(1) }, [cat, query])

  /* تغییر صفحه: نرم به بالای گرید محصولات اسکرول کن تا صفحه نپرد
     (وقتی صفحه‌ی بعدی محصول کمتری دارد، ارتفاع گرید کم می‌شود و بدون این، صفحه می‌پرد). */
  const gridRef = useRef<HTMLDivElement>(null)
  const goToPage = (n: number) => {
    setPage(n)
    requestAnimationFrame(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <div dir="rtl" className="shop-shell min-h-screen font-[Vazirmatn,Tahoma,sans-serif] text-[#1C1B17]">

      <style>{`
        /* کارت محصول — هم‌فرم کارت sec1 در صفحه‌ی بیلیارد بازار.
           عرض را گرید تعیین می‌کند (برخلاف sec1 که کاروسل با عرض ثابت است)، ولی نسبت،
           سهم عکس، گردی، بوردر و فونت‌ها عیناً همان‌اند. */
        .prod-card-sec1 {
          background: linear-gradient(158deg, rgba(255,255,255,0.94), rgba(250,248,243,0.86));
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          /* ۱.۷۵ = ۱.۹۴۴ منهای ۱۰٪ */
          aspect-ratio: 1 / 1.75;
          /* کوچک‌شدن حالا کارِ خودِ گرید است (شش ستون در دسکتاپ)، پس
             محدودکردنِ عرضِ کارت داخلِ سلول لازم نیست و فقط فاصله‌ی
             بصری را زیاد می‌کرد.
             (بک‌تیک در این کامنت ممنوع — داخلِ template literal است) */
          width: 100%;
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
        /* ══ پوسته‌ی صفحه ══
           پس‌زمینه خاکستریِ تختِ #F7F5F0 بود و همه‌چیز رویش سفیدِ
           بی‌سایه؛ صفحه «خشک» دیده می‌شد چون هیچ عمق و هیچ رنگی
           نداشت. سه هاله‌ی نرم — طلایی، نمدِ سبز، و کِرِمِ گرم — بدونِ
           اینکه خوانایی را کم کنند به صفحه عمق می‌دهند. ثابت‌اند و با
           اسکرول حرکت نمی‌کنند، پس هزینه‌ی رندر ندارند. */
        .shop-shell {
          position: relative;
          background:
            radial-gradient(1100px 520px at 88% -8%,  rgba(199,166,106,0.16), transparent 62%),
            radial-gradient(900px 460px at 4% 12%,    rgba(20,83,45,0.09),    transparent 60%),
            radial-gradient(760px 520px at 50% 108%,  rgba(199,166,106,0.10), transparent 62%),
            linear-gradient(180deg, #FBFAF7 0%, #F5F2EB 100%);
          background-attachment: fixed;
        }

        /* ══ هدرِ گلس ══
           کارتِ سفیدِ بوردردار جای خودش را به یک سطحِ شیشه‌ای می‌دهد:
           بلورِ اشباع‌شده، لبه‌ی روشنِ داخلی، و یک هالهٔ طلاییِ نرم که
           از گوشه رد می‌شود (حالتِ «liquid»). زیرِ بنر می‌نشیند و
           عکسِ بنر از پشتش کمی پیدا می‌شود. */
        .shop-head {
          position: relative;
          background: linear-gradient(150deg, rgba(255,255,255,0.80) 0%, rgba(252,250,245,0.62) 48%, rgba(247,243,234,0.72) 100%);
          border: 1px solid rgba(255,255,255,0.85);
          box-shadow:
            inset 0 1.5px 0 rgba(255,255,255,0.96),
            inset 0 -1px 0 rgba(199,166,106,0.16),
            0 18px 48px rgba(28,27,23,0.10);
          backdrop-filter: blur(34px) saturate(2.1);
          -webkit-backdrop-filter: blur(34px) saturate(2.1);
        }
        /* هالهٔ لیکویید — کند و بی‌صدا */
        .shop-head::before {
          content: ''; position: absolute; inset: -40% -20% auto -20%; height: 150%;
          pointer-events: none; z-index: 0;
          background: radial-gradient(closest-side, rgba(199,166,106,0.20), transparent 70%);
          filter: blur(26px);
          animation: shopGlow 14s ease-in-out infinite alternate;
        }
        .shop-head > * { position: relative; z-index: 1; }
        @keyframes shopGlow {
          from { transform: translate3d(-8%, -4%, 0) scale(1); }
          to   { transform: translate3d(10%,  6%, 0) scale(1.12); }
        }
        @media (prefers-reduced-motion: reduce) { .shop-head::before { animation: none } }

        /* ── نوارِ دسته‌بندیِ افقی (هم‌شکلِ بیلیارد بازار) ── */
        .scat-wrap {
          border-radius: 16px; padding: 9px 10px;
          background: linear-gradient(135deg, rgba(255,255,255,0.86) 0%, rgba(247,245,240,0.72) 100%);
          border: 1px solid rgba(199,166,106,0.26);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.9), 0 6px 22px rgba(28,27,23,0.06);
          backdrop-filter: blur(18px) saturate(1.6);
          -webkit-backdrop-filter: blur(18px) saturate(1.6);
        }
        .scat-strip {
          display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none;
          -ms-overflow-style: none; padding-bottom: 1px;
        }
        .scat-strip::-webkit-scrollbar { display: none; }
        .scat {
          flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; gap: 4px;
          width: 74px; padding: 8px 4px 7px; border-radius: 13px; cursor: pointer;
          background: #fff; border: 1px solid rgba(28,27,23,0.09);
          transition: transform .2s cubic-bezier(.22,1,.36,1), border-color .2s, box-shadow .2s, background .2s;
        }
        .scat:hover { transform: translateY(-2px); border-color: rgba(199,166,106,0.55); box-shadow: 0 8px 20px rgba(28,27,23,0.10); }
        .scat.on {
          background: linear-gradient(160deg, rgba(199,166,106,0.20), rgba(199,166,106,0.07));
          border-color: rgba(199,166,106,0.70);
          box-shadow: 0 6px 18px rgba(199,166,106,0.24);
        }
        .scat-ic {
          width: 38px; height: 38px; border-radius: 11px; display: flex;
          align-items: center; justify-content: center; overflow: hidden;
          background: radial-gradient(circle at 34% 28%, #FFFDF8, #F1EDE3);
          border: 1px solid rgba(28,27,23,0.07);
        }
        .scat-ic img { width: 30px; height: 30px; object-fit: contain; }
        .scat-all { color: #9A6E38; background: radial-gradient(circle at 34% 28%, #FFF6E4, #F3E6CB); }
        .scat-lb { font-size: 11px; font-weight: 700; color: #3E3A32; white-space: nowrap; }
        .scat.on .scat-lb { color: #7A5626; }
        .scat-ct { font-size: 10px; font-weight: 700; color: #A69F8E; font-variant-numeric: tabular-nums; }
        .scat.on .scat-ct { color: #9A6E38; }
        @media (prefers-reduced-motion: reduce) { .scat { transition: none } .scat:hover { transform: none } }

        /* ── نشانِ برندِ نمایندگی ── */
        .brand-chip {
          position: relative; overflow: hidden;
          display: inline-flex; align-items: center;
          padding: 5px 13px 4px;
          border-radius: 8px;
          background: linear-gradient(145deg,#23201A 0%,#14120E 60%,#1D1A14 100%);
          border: 1px solid rgba(199,166,106,0.42);
          box-shadow: 0 2px 10px rgba(28,27,23,0.22), inset 0 1px 0 rgba(199,166,106,0.20);
          transition: transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s, border-color .22s;
        }
        .brand-chip-txt {
          font-size: 11.5px; font-weight: 800; letter-spacing: 0.07em; white-space: nowrap;
          background: linear-gradient(100deg,#E8CE96 0%,#C7A66A 45%,#F0DDB0 70%,#A07840 100%);
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent; color: transparent;
        }
        /* برقِ نرمی که با هاور از روی نشان رد می‌شود */
        .brand-chip::after {
          content: ''; position: absolute; top: 0; bottom: 0; width: 45%;
          left: -60%; transform: skewX(-18deg); pointer-events: none;
          background: linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent);
          transition: left .55s ease;
        }
        .brand-chip:hover {
          transform: translateY(-1.5px);
          border-color: rgba(199,166,106,0.72);
          box-shadow: 0 6px 18px rgba(28,27,23,0.30), inset 0 1px 0 rgba(199,166,106,0.30);
        }
        .brand-chip:hover::after { left: 115%; }
        @media (prefers-reduced-motion: reduce) {
          .brand-chip, .brand-chip::after { transition: none; }
          .brand-chip:hover { transform: none; }
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
        <div className="shop-head overflow-hidden rounded-[22px]">
          {/* بنر — اسلایدر عکس آپلودشده؛ اگر چیزی نگذاشته، اسلایدر ۳ پوستر پیش‌فرض */}
          <div className="relative" style={{ height: 'clamp(150px,24vw,250px)', background: '#0a2f22' }}>
            {store.banners.length
              ? <ImageSlider images={store.banners} />
              : <PosterSlider variants={[0, 1, 2]} title={store.title} />}
            <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0.04) 0%,rgba(0,0,0,0.32) 100%)' }} />
          </div>

          {/* کارت فروشگاه — لوگو نیمی روی بنر، بقیه زیر هم */}
          <div className="relative px-4 pb-5 sm:px-6 sm:pb-6">
            {/* لوگو با حلقه‌ی استوری — نیمی روی عکس */}
            {/* حلقه‌ی رنگی و کلیک فقط وقتی استوریِ واقعی هست؛ وگرنه
                لوگوی ساده — بدونِ وعده‌ی چیزی که وجود ندارد. */}
            <button
              type="button" onClick={() => { if (hasStory) setStoryOpen(true) }}
              aria-label={hasStory ? 'مشاهده استوری فروشگاه' : store.brand}
              disabled={!hasStory}
              className={`-mt-12 block shrink-0 rounded-full p-[3px] transition-transform duration-200 sm:-mt-14${hasStory ? ' hover:scale-105 active:scale-95' : ''}`}
              style={hasStory
                ? { background: 'linear-gradient(135deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)', boxShadow: '0 6px 18px rgba(214,41,118,0.30)', width: 'fit-content' }
                : { background: 'rgba(28,28,26,0.10)', width: 'fit-content', cursor: 'default' }}
            >
              <span className="flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-gradient-to-bl from-[#14532D] to-[#1E6B3C] text-white sm:h-[94px] sm:w-[94px]">
                {store.logo
                  ? <img loading="lazy" decoding="async" src={store.logo} alt={store.title} className="h-full w-full object-cover"/>
                  : Icon.storefront}
              </span>
            </button>

            {/* نام، شهر (با دکمه‌ی تلفن روبه‌رویش سمت چپ)، توضیحات — زیر هم */}
            <h2 className="mt-3 text-[17px] font-bold text-[#1C1B17] sm:text-[19px]">{store.title}</h2>
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
            {/* ── برندهای نمایندگی ──
                چیپ‌های خاکستریِ قبلی مثل برچسبِ فیلتر بودند، در حالی
                که این‌ها ادعای اعتبارِ فروشگاه‌اند. حالا هر برند یک
                نشانِ لاکی‌مشکی با متنِ طلاییِ گرادیانی و حروفِ
                فاصله‌دار است — همان زبانی که برندهای بین‌المللیِ
                تجهیزات روی جعبه‌هایشان به کار می‌برند. برقِ نرمی هم
                با هاور از رویش رد می‌شود. */}
            {store.brands.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#A69F8E]">Authorized</span>
                <span className="h-[13px] w-px bg-[#E0DAC8]" />
                {store.brands.map((b, i) => (
                  <span key={i} className="brand-chip" dir="auto">
                    <span className="brand-chip-txt">{b}</span>
                  </span>
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

        {/* ── نوارِ دسته‌بندی ──
            همان آیکون‌ها و همان ترتیبِ صفحه‌ی «بیلیارد بازار»
            (`MARKET_CATEGORIES` — منبعِ واحد)، این‌بار افقی و کشیدنی
            زیرِ سرچ. جای دراپ‌داونِ قبلی را می‌گیرد که کنارِ تیتر
            پنهان بود و کاربر باید بازش می‌کرد تا بفهمد فروشگاه چه
            دارد. دسته‌ای که محصولی ندارد اصلاً نشان داده نمی‌شود. */}
        <div className="scat-wrap mt-3">
          <div className="scat-strip">
            <button type="button" onClick={() => setCat('all')}
              className={`scat${cat === 'all' ? ' on' : ''}`}>
              <span className="scat-ic scat-all">{Icon.storefront}</span>
              <span className="scat-lb">همه</span>
              <span className="scat-ct">{faNum(PRODUCTS.length)}</span>
            </button>
            {MARKET_CATEGORIES.filter(c => (catCounts[c.id as CatKey] ?? 0) > 0).map(c => (
              <button key={c.id} type="button"
                onClick={() => setCat(cat === c.id ? 'all' : (c.id as CatKey))}
                className={`scat${cat === c.id ? ' on' : ''}`}>
                <span className="scat-ic"><img src={c.img} alt="" loading="lazy" /></span>
                <span className="scat-lb">{c.label}</span>
                <span className="scat-ct">{faNum(catCounts[c.id as CatKey] ?? 0)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ محصولات فروشگاه ═══ */}
      <div ref={gridRef} className="mx-auto max-w-[1240px] px-4 pb-16 pt-6 sm:px-6" style={{ scrollMarginTop: 80 }}>
        {/* تیتر + دراپ‌داون دسته‌بندی */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            {/* همان نشانِ طلاییِ «درباره ما» — دو تیترِ اصلیِ صفحه باید
                یک‌شکل باشند؛ این یکی بی‌رنگ و بی‌نشان مانده بود. */}
            <div className="flex items-center gap-2">
              <span className="h-5 w-[3px] rounded bg-gradient-to-b from-[#C7A66A] to-[#8A6020]" />
              <h1 className="text-xl font-bold text-[#1C1B17] sm:text-2xl">محصولات فروشگاه</h1>
            </div>
            <span className="mr-[11px] text-[12.5px] text-[#8A8474]">
              {faNum(visible.length)} محصول{cat !== 'all' ? ` در «${CAT_LABEL[cat]}»` : ''}
            </span>
          </div>
          {/* دراپ‌داونِ دسته‌بندی برداشته شد — جایش نوارِ افقیِ زیرِ سرچ. */}
        </div>

        {/* گرید — ۵ ستون در دسکتاپ (۲ ردیف ۵تایی = ۱۰ در هر صفحه) */}
        {/* شش کارت در هر سطرِ دسکتاپ. فاصله‌ها هم کم شد: با پنج ستون و
            گَپِ ۱۶، فاصله‌ی بینِ کارت‌ها از خودِ کارت‌ها به چشم می‌آمد. */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 min-[640px]:grid-cols-3 min-[860px]:grid-cols-4 min-[1040px]:grid-cols-5 min-[1200px]:grid-cols-6">
            {paged.map(p => {
              const isWished = wish.has(p.id)
              return (
                /* کارت هم‌فرم sec1 (صفحه‌ی بیلیارد بازار). کلاس‌های bz-scroll-card/pc-body آنجا داخل
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
          <div className="shop-head rounded-[22px] px-6 py-14 text-center text-[13.5px] text-[#8A8474]">
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
                onClick={() => goToPage(i + 1)}
                aria-current={safePage === i + 1 ? 'page' : undefined}
                className={`${LQ} flex h-9 w-9 items-center justify-center rounded-xl text-[13px] ${
                  safePage === i + 1 ? `${LQ_FELT_ON} font-bold` : `${LQ_NEUTRAL} text-[#5B564B]`
                } ${MONO}`}
              >
                {toFa(i + 1)}
              </button>
            ))}
            <button
              onClick={() => goToPage(Math.min(pageCount, safePage + 1))}
              disabled={safePage === pageCount}
              aria-label="صفحه‌ی بعد"
              className={`${LQ} ${LQ_NEUTRAL} flex h-9 w-9 items-center justify-center rounded-xl text-[13px] text-[#5B564B] disabled:cursor-not-allowed disabled:opacity-40`}
            >
              ‹
            </button>
          </div>
        )}
      </div>

      {/* ── بخشِ «درباره ما» حذف شد ──
          همان متنِ «درباره‌ی فروشگاه» سه جای صفحه تکرار می‌شد: زیرِ
          نامِ فروشگاه در هدر، این‌جا، و در فوتر. یک متن سه بار یعنی
          صفحه پُر به‌نظر می‌رسد ولی چیزی به خواننده اضافه نمی‌کند.
          جای اصلی‌اش هدر است، همان‌جا که چشم اول می‌رود. */}

      {/* ═══ FOOTER — کارت اختصاصی فروشگاه (سبک sellers/2) ═══ */}
      <footer className="px-4 pb-8 pt-2 sm:px-6">
        <div className="mx-auto max-w-[1240px] overflow-hidden shop-head rounded-[22px]">
          {/* موبایل: فاصله‌ی بلوک‌ها ۳۶ ⇒ ۱۸ و پدینگ ۲۴ ⇒ ۱۸، تا فوتر جمع‌تر شود. دسکتاپ دست‌نخورده. */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-[18px] p-[18px] sm:grid-cols-2 sm:gap-y-9 sm:p-8 lg:grid-cols-4">

            {/* برند */}
            <div>
              <div className="flex items-center gap-2.5 text-[16px] font-bold">
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_32%_30%,#2b2b2b,#0a0a0a_70%)]">
                  <span className="flex h-[13px] w-[13px] items-center justify-center rounded-full bg-white text-[8px] font-bold text-[#111]">۸</span>
                </span>
                {store.title}
              </div>
              {/* توضیحات این‌جا تکرار می‌شد؛ جای اصلی‌اش هدر است. */}
            </div>

            {/* دسته‌بندی‌ها — روی موبایل حذف */}
            <div className="hidden sm:block">
              <h4 className="mb-2 text-[10.5px] font-bold tracking-[0.08em] text-[#9A6E38] sm:mb-4">دسته‌بندی‌ها</h4>
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
              <h4 className="mb-2 text-[10.5px] font-bold tracking-[0.08em] text-[#9A6E38] sm:mb-4">راه‌های ارتباطی</h4>
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
              <h4 className="mb-2 text-[10.5px] font-bold tracking-[0.08em] text-[#9A6E38] sm:mb-4">موقعیت فروشگاه</h4>
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
              <span>© {toFa(1405)} {store.title} — تمام حقوق محفوظ است</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ استوری فروشگاه (مثل صفحه‌ی باشگاه) ═══ */}
      {storyOpen && hasStory && (
        <ClubStoryModal
          club={{ name: store.brand, storyMediaUrl: store.storyImage, storyText: store.storyText, badge: 'فروشگاه' }}
          onClose={() => setStoryOpen(false)}
        />
      )}
    </div>
  )
}

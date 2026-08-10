'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Store, Phone, Heart, ShieldCheck } from 'lucide-react'
import { CAT_LABELS, type ShopProduct } from '../products'
import ReportButton from '../../../components/ReportButton'
import { productTitleParts, productTitle } from '../../../lib/market/title'
import ImageLightbox from '../../../components/market/ImageLightbox'
import { specRows } from '../../../lib/market/specs'
import { CONDITIONS, normalizeCondition } from '../../../lib/market/categories'
import { fetchProfile } from '../../../lib/profiles/client'

/* ─── tokens (تم بازار: طلایی/برنزی روی کاغذ روشن) ─── */
const BG    = '#F7F6F4'
const GOLD  = '#C7A66A'
const GOLDD = '#9A6E38'
const TEXT  = '#1C1C1A'
const TSEC  = 'rgba(28,28,26,0.56)'
const TMUT  = 'rgba(28,28,26,0.34)'
const HAIR  = 'rgba(28,28,26,0.10)'

const toFa  = (v: string | number) => String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
const fmt   = (n: number) => toFa(n.toLocaleString('fa-IR'))

/* ─── سطوح LQ ─── */
const glassPanel: React.CSSProperties = {
  background: 'rgba(255,255,255,0.6)',
  backdropFilter: 'blur(40px) saturate(2.4)', WebkitBackdropFilter: 'blur(40px) saturate(2.4)',
  border: '1px solid rgba(255,255,255,0.8)',
  boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.07)',
}
/* ── دکمه‌های LQ: طرح دکمه‌های «مشاهده و رزرو» صفحه‌ی اصلی ── */
const lqGold: React.CSSProperties = {
  background: 'rgba(199,166,106,0.12)',
  border: '1px solid rgba(199,166,106,0.34)',
  color: GOLDD, fontWeight: 700,
}
const lqGreen: React.CSSProperties = {
  background: 'rgba(37,211,102,0.12)',
  border: '1px solid rgba(37,211,102,0.34)',
  color: '#0E7A38', fontWeight: 700,
}
const lqWhite: React.CSSProperties = {
  background: 'rgba(28,28,26,0.04)',
  border: `1px solid ${HAIR}`,
  color: TEXT, fontWeight: 700,
}


/* آگهی کاربر روی سرور uuid دارد، محصولات کاتالوگ عدد؛ این صفحه هر دو را نشان می‌دهد.

   `model` این‌جا اضافه شده چون تیترِ صفحه دو تکه است — «چوب اسنوکر»
   درشت و «O'min classic» ریزتر — و مدل در `ShopProduct` نبود. */
type Detail = Omit<ShopProduct, 'id'> & {
  id: number | string
  model?: string
  /* ── تماس فقط این‌جا ──
     این دو از `ShopProduct` (مدلِ فهرست) برداشته شدند: هیچ کارتی
     نمایششان نمی‌دهد و بودنشان در پاسخِ فهرست یعنی با یک درخواست
     می‌شد شماره‌ی همه‌ی فروشنده‌ها را یک‌جا برداشت. این صفحه یک آگهی
     را نشان می‌دهد و مقدارش را از `/api/market/ads/[id]` می‌گیرد. */
  sellerPhone?: string
  sellerWhatsapp?: string
  /* ── همه‌ی تصویرها، نه فقط اولی ──
     فروشنده تا هشت عکس آپلود می‌کند و سرور هر هشت را ذخیره می‌کند،
     ولی این صفحه فقط `images[0]` را می‌خواند و بقیه هیچ‌جا دیده
     نمی‌شدند — نه گالری‌ای بود، نه نشانه‌ای که عکسِ دیگری هم هست. */
  images?: string[]
}

/* شکلِ سبکی که مسیرِ «مشابه» برمی‌گرداند — نه کلِ محصول */
interface RelatedItem {
  id: string
  title: string
  price: number
  negotiable: boolean
  category: string
  condition: string
  city: string | null
  brand: string | null
  model: string | null
  image: string
}

/* رکورد جدول products → شکل ShopProduct تا همین صفحه بتواند نمایشش دهد */
function normalizeUserProduct(up: Record<string, unknown>): Detail {
  const num = (v: unknown, d = 0) => {
    const n = Number(v)
    return Number.isFinite(n) && v !== null && v !== '' ? n : d
  }
  const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d)
  const imgs = Array.isArray(up.images)
    ? (up.images as unknown[]).map(x => str(x)).filter(Boolean)
    : undefined
  /* `price` قیمتِ خط‌خورده است و `discountPrice` پرداختی — همان
     قراردادی که `app/shop/products.ts` دارد. پیش‌تر این‌جا عددِ
     خط‌خورده از روی درصدِ گردشده بازسازی می‌شد و غلط درمی‌آمد. */
  const listed = num(up.price)
  const paid   = num(up.discountPrice)
  const hasDisc = paid > 0 && paid < listed
  const price = hasDisc ? paid : listed
  const disc  = hasDisc
    ? (num(up.discountPercent) || Math.round(((listed - paid) / listed) * 100))
    : num(up.disc, 0)
  return {
    id:             typeof up.id === 'string' ? up.id : num(up.id),
    cat:            str(up.category, 'other'),
    img:            str(up.img) || imgs?.[0] || '/images/shop/cue_billiard_2.webp',
    /* `img` تصویرِ اصلی می‌ماند (آگهیِ قدیمیِ محلی فقط همین را دارد)؛
       گالری از این فهرست ساخته می‌شود. */
    images:         imgs && imgs.length > 0 ? imgs : undefined,
    name:           str(up.name) || str(up.title, 'محصول'),
    desc:           str(up.description),
    brand:          str(up.brand),
    model:          str(up.model),
    price,
    /* آگهیِ قدیمیِ محلی `old` دارد؛ ردیفِ سرور قیمتِ فهرست را در
       `price` نگه می‌دارد. */
    old:            num(up.old, hasDisc ? listed : price),
    disc,
    rating:         5,
    reviews:        0,
    sales:          0,
    /* روی سرور sellerId شناسه‌ی کاربر است نه فروشگاه؛ صفحه‌ی فروشگاه
       فقط وقتی وجود دارد که storeSlug ثبت شده باشد. */
    sellerId:       str(up.storeSlug) || (typeof up.storeSlug === 'undefined' ? str(up.sellerId) : ''),
    sellerName:     str(up.sellerName),
    sellerPhone:    str(up.sellerPhone),
    sellerWhatsapp: str(up.sellerWhatsapp),
    city:           str(up.city),
    condition:      str(up.condition, 'new'),
    negotiable:     up.negotiable === true,
    createdAt:      up.createdAt ? (Date.parse(String(up.createdAt)) || null) : null,
  }
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  /* کاتالوگِ ثابتِ ساختگی برداشته شد؛ هر محصول از سرور می‌آید. */
  const staticProduct: ShopProduct | undefined = undefined

  /* اگر در کاتالوگ نمونه نبود، آگهی را از سرور بخوان (و برای آگهی‌های
     قدیمی که هنوز در همین مرورگر مانده‌اند، از localStorage).
     تا آمدن پاسخ «در حال بارگذاری» نشان می‌دهیم تا «پیدا نشد» فلش نزند. */
  const [userProduct, setUserProduct] = useState<Detail | null>(null)
  /* ردیفِ خامِ سرور — فیلدهایی مثل negotiable و status در نگاشتِ
     نمایشی نیستند و باید از خودِ ردیف خوانده شوند. */
  const [rawAd, setRawAd] = useState<Record<string, unknown> | null>(null)
  const [checked, setChecked] = useState(false)
  useEffect(() => {
    if (staticProduct) { setChecked(true); return }
    let alive = true
    void (async () => {
      try {
        const r = await fetch(`/api/market/ads/${encodeURIComponent(String(id))}`, { cache: 'no-store' })
        if (r.ok) {
          const j = await r.json()
          if (j?.ad && alive) { setRawAd(j.ad); setUserProduct(normalizeUserProduct(j.ad)); setChecked(true); return }
        }
      } catch { /* به مسیر محلی برمی‌گردیم */ }
      if (!alive) return
      try {
        const list = JSON.parse(localStorage.getItem('userProducts') ?? '[]') as Record<string, unknown>[]
        const up = list.find(p => String(p.id) === String(id))
        setUserProduct(up ? normalizeUserProduct(up) : null)
      } catch { setUserProduct(null) }
      setChecked(true)
    })()
    return () => { alive = false }
  }, [id])

  const product: Detail | undefined = staticProduct ?? userProduct ?? undefined
  /* از خودِ ردیفِ سرور خوانده می‌شوند، نه از شکلِ نگاشت‌شده — تا اگر
     روزی نگاشت عوض شد، این دو بی‌صدا خاموش نشوند. */
  /* برچسبِ فارسیِ هر کلید از همان تعریفی می‌آید که فرمِ ثبت با آن
     ساخته می‌شود (`lib/market/specs.ts`)، پس هیچ‌وقت از هم دور
     نمی‌افتند. */
  const specs = useMemo(
    () => specRows(product?.cat, rawAd?.specs),
    [product?.cat, rawAd],
  )
  const negotiable = rawAd?.negotiable === true
  const sold = String(rawAd?.status ?? '') === 'sold'

  /* آیا این محصول به یک فروشگاه ثبت‌شده تعلق دارد؟
     محصولات کاتالوگ همیشه فروشگاه دارند؛ آگهی کاربر عادی فقط وقتی
     که خودش فروشگاه داشته باشد sellerId می‌گیرد. بدون آن، دکمه‌ی
     «رفتن به فروشگاه» به صفحه‌ی خالی می‌رسید. */
  const hasStore = !!staticProduct || !!(userProduct && String(userProduct.sellerId ?? '').trim())

  /* ── نشانِ سبزِ «فروشگاه» فقط برای فروشگاهِ تأییدشده ──
     تا امروز هر آگهی‌ای که به فروشگاهی وصل بود این نشان را می‌گرفت،
     حتی فروشگاهی که جواز آپلود نکرده و تیک ندارد. یعنی سایت از طرفِ
     خودش اعتبار می‌داد. حالا از خودِ پروفایل خوانده می‌شود. */
  const [storeVerified, setStoreVerified] = useState(false)
  useEffect(() => {
    const slug = String(userProduct?.sellerId ?? '').trim()
    if (!slug) { setStoreVerified(false); return }
    let alive = true
    void fetchProfile<Record<string, unknown>>('seller', slug)
      .then(pr => { if (alive) setStoreVerified(pr?.verified === true) })
      .catch(() => { if (alive) setStoreVerified(false) })
    return () => { alive = false }
  }, [userProduct?.sellerId])

  const [wished, setWished] = useState(false)

  /* تصویرِ انتخاب‌شده‌ی گالری. با عوض‌شدنِ آگهی به اولی برمی‌گردد،
     وگرنه رفتن از آگهیِ هشت‌عکسه به آگهیِ دوعکسه تصویرِ خالی می‌داد. */
  const [imgIdx, setImgIdx] = useState(0)
  /* نمای تمام‌صفحه‌ی عکس‌ها */
  const [zoomed, setZoomed] = useState(false)
  useEffect(() => { setImgIdx(0); setZoomed(false) }, [id])

  /* ── محصولات مشابه ──
     رتبه‌بندی سمتِ سرور انجام می‌شود: دسته، برند، نوع، شهر، وضعیت و
     نزدیکیِ قیمت. رتبه‌بندی در مرورگر یعنی همه‌ی آگهی‌ها باید دانلود
     شوند تا هشت کارت نشان داده شود. */
  const [related, setRelated] = useState<RelatedItem[]>([])
  useEffect(() => {
    if (!id) return
    let alive = true
    void fetch(`/api/market/ads/${encodeURIComponent(String(id))}/related`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (alive && Array.isArray(j?.related)) setRelated(j.related) })
      .catch(() => { })
    return () => { alive = false }
  }, [id])

  if (!product) {
    if (!checked) {
      return (
        <div style={{ minHeight: '100vh', background: BG, direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: TSEC }}>در حال بارگذاری…</p>
        </div>
      )
    }
    return (
      <div style={{ minHeight: '100vh', background: BG, direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 14 }}>محصول پیدا نشد</p>
          <Link href="/shop" style={{ color: GOLDD, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>← بازگشت به بیلیارد بازار</Link>
        </div>
      </div>
    )
  }

  /* ── تیتر در دو تکه ──
     «چوب اسنوکر» درشت، «O'min classic» ریزتر کنارش. پیش‌تر فقط تکه‌ی
     اول بود و برند و مدل — که فروشنده نوشته بود — تا پایینِ صفحه در
     جدولِ مشخصات دیده نمی‌شدند. */
  const { head: titleHead, tail: titleTail } = productTitleParts(product)
  /* هرجا یک رشته لازم است (واتساپ، گزارشِ تخلف) عنوانِ کامل می‌رود؛
     «سلام، درباره چوب اسنوکر سوال داشتم» به فروشنده‌ای که پنج چوب
     گذاشته هیچ‌چیز نمی‌گوید. */
  const fullName = productTitle(product)

  /* گالری: همه‌ی عکس‌های آگهی. آگهیِ بی‌عکس و آگهیِ قدیمیِ محلی که
     فقط یک نشانی دارد، هر دو به همان یک تصویر می‌رسند. */
  const gallery = product.images && product.images.length > 0 ? product.images : [product.img]
  const shown = Math.min(imgIdx, gallery.length - 1)

  const waLink = `https://wa.me/${product.sellerWhatsapp}?text=${encodeURIComponent(`سلام، درباره «${fullName}» در بیلیارد بازار سوال داشتم`)}`

  return (
    <div style={{ minHeight: '100vh', background: BG, direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif', color: TEXT }}>
      <style>{`
        .lq-lift{transition:all .3s cubic-bezier(0.22,1,0.36,1);}
        .lq-lift:hover{transform:translateY(-2px);}
        .lq-lift:active{transform:scale(0.97);}
        .lq-sheen{position:relative;overflow:hidden;}
        .lq-sheen::after{content:'';position:absolute;inset:0;pointer-events:none;transform:translateX(-160%) skewX(-15deg);background:linear-gradient(110deg,transparent 40%,rgba(255,255,255,0.55) 50%,transparent 60%);}
        .lq-sheen:hover::after{transition:transform .65s ease;transform:translateX(200%) skewX(-15deg);}
        .pd-card{transition:transform .22s cubic-bezier(0.22,1,0.36,1),box-shadow .22s;}
        .pd-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(28,28,26,0.12)!important;}
        .pd-grid{grid-template-columns:1.05fr 1fr;}
        @media(max-width:820px){.pd-grid{grid-template-columns:1fr!important;}.pd-media{position:static!important;}}
        .rel-grid{grid-template-columns:repeat(5,1fr);}
        @media(max-width:1000px){.rel-grid{grid-template-columns:repeat(3,1fr)!important;}}
        @media(max-width:600px){.rel-grid{grid-template-columns:repeat(2,1fr)!important;}}
      `}</style>

      {/* ── سربرگ باریک ── */}
      {/* `safe-top`: در حالتِ نصب‌شده‌ی iOS این هدر زیرِ نوارِ وضعیت
          می‌افتاد و دکمه‌ی بازگشت و عنوان زیرِ ساعت و آنتن قرار
          می‌گرفتند. تعریفِ کلاس در `app/layout.tsx`. */}
      <header className="safe-top" style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(28px) saturate(1.8)', WebkitBackdropFilter: 'blur(28px) saturate(1.8)', borderBottom: `1px solid ${HAIR}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(14px,3vw,28px)', height: 58, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/shop" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden' }}>
              <img loading="lazy" decoding="async" src="/images/Logo/bh-mark-256-v4.webp" alt="بیلیارد بازار" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>بیلیارد بازار</span>
          </Link>
          <Link href="/shop" className="lq-lift" style={{ marginInlineStart: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 10, ...lqGold, fontSize: 12.5, textDecoration: 'none' }}>
            <ChevronLeft size={15} strokeWidth={2.4} />
            بازگشت
          </Link>
        </div>
      </header>

      {/* ── breadcrumb ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px clamp(14px,3vw,28px) 0', fontSize: 12.5, color: TMUT }}>
        <Link href="/shop" style={{ color: TMUT, textDecoration: 'none' }}>بیلیارد بازار</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <Link href="/shop" style={{ color: TMUT, textDecoration: 'none' }}>{CAT_LABELS[product.cat] ?? 'محصولات'}</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <span style={{ color: TSEC }}>{fullName}</span>
      </div>

      {/* ── جزئیات محصول ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px clamp(14px,3vw,28px) 48px' }}>
        <div className="pd-grid" style={{ display: 'grid', gap: 'clamp(18px,3vw,36px)', alignItems: 'start' }}>

          {/* تصویر */}
          <div className="lq-sheen pd-media" style={{ ...glassPanel, borderRadius: 26, padding: 14, position: 'sticky', top: 74 }}>
            <div style={{ position: 'relative', width: '100%', paddingTop: '92%', borderRadius: 16, overflow: 'hidden', background: '#EFEDE9' }}>
              {/* ── زدن روی عکس ⇒ نمای تمام‌صفحه ──
                  کادرِ کارت عکس را `cover` می‌برد؛ خریداری که دنبالِ
                  خط‌وخشِ یک کالای دستِ‌دوم است دقیقاً همان بخشِ
                  بریده‌شده را می‌خواهد ببیند. */}
              <button type="button" onClick={() => setZoomed(true)}
                aria-label="بزرگ‌نماییِ تصویر"
                style={{ position: 'absolute', inset: 0, padding: 0, border: 'none', background: 'none', cursor: 'zoom-in', display: 'block' }}>
                <img loading="lazy" decoding="async" src={gallery[shown]} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </button>
              {/* ── همان برچسبِ بازار ──
                  قرمزِ مستطیلیِ «۱۵٪ تخفیف» با پیلِ بنفشِ «٪۱۵» در
                  فهرستِ بازار فرق داشت؛ یک محصول در دو صفحه دو نشانِ
                  متفاوت می‌گرفت. رنگ و شکل و متن هر سه یکی شد. */}
              {product.disc > 0 && (
                <div dir="ltr" style={{ position: 'absolute', top: 12, insetInlineStart: 12, background: '#b400ae', color: '#fff', fontSize: 13.8, fontWeight: 800, borderRadius: 999, padding: '5px 12px 3px', lineHeight: 1 }}>
                  ٪{toFa(product.disc)}
                </div>
              )}
              <button
                onClick={() => setWished(w => !w)} aria-label="علاقه‌مندی" className="lq-lift"
                style={{ position: 'absolute', top: 12, insetInlineStart: 12, width: 40, height: 40, borderRadius: '50%', ...lqWhite, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: wished ? '#E53935' : TSEC }}
              >
                <Heart size={19} fill={wished ? '#E53935' : 'none'} strokeWidth={2} />
              </button>
            </div>

            {/* ── نوارِ عکس‌ها ──
                فقط وقتی بیش از یک عکس هست. یک تصویرِ تنها با نوارِ
                تک‌خانه‌ای زیرش، شبیهِ چیزی است که کار نمی‌کند. */}
            {gallery.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto', paddingBottom: 2 }}>
                {gallery.map((src, i) => (
                  <button key={`${src}-${i}`} type="button" onClick={() => setImgIdx(i)}
                    aria-label={`تصویر ${toFa(i + 1)}`} aria-current={i === shown}
                    style={{
                      flex: '0 0 auto', width: 62, height: 62, borderRadius: 12,
                      overflow: 'hidden', cursor: 'pointer', padding: 0, background: '#EFEDE9',
                      border: i === shown ? `2px solid ${GOLD}` : `1.5px solid ${HAIR}`,
                      opacity: i === shown ? 1 : 0.72, transition: 'opacity .2s, border-color .2s',
                    }}>
                    <img loading="lazy" decoding="async" src={src} alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* اطلاعات */}
          <div>
            {/* ── باکسِ هویتِ محصول ──
                چیپِ دسته‌بندیِ کادردار برداشته شد: همان واژه در نانِ
                بالای صفحه و در سرِ عنوان هم هست، پس سه بار تکرار
                می‌شد.

                برند و مدل حالا هم‌وزنِ عنوان‌اند، نه زیرنویسِ ریز.
                برای خریدارِ تجهیزات «O'min Classic» مهم‌تر از «چوب
                اسنوکر» است — آن یکی می‌گوید چه چیزی است، این یکی
                می‌گوید کدام. جهتشان هم خودکار است: با                 نامِ لاتین از چپ و نامِ فارسی از راست چیده می‌شود. */}
            <div style={{ ...glassPanel, borderRadius: 20, padding: '16px 18px', marginBottom: 16 }}>
              <h1 style={{ fontSize: 'clamp(19px,2.4vw,25px)', fontWeight: 800, lineHeight: 1.45, margin: 0, letterSpacing: '-0.01em' }}>
                {titleHead}
              </h1>
              {titleTail && (
                <div dir="auto" style={{
                  marginTop: 8, paddingTop: 10, borderTop: '1px dashed rgba(28,28,26,0.12)',
                  display: 'flex', alignItems: 'baseline', gap: 9, flexWrap: 'wrap',
                }}>
                  <span style={{ fontSize: 'clamp(16px,2vw,21px)', fontWeight: 800, color: TEXT, letterSpacing: '-0.01em' }}>
                    {titleTail}
                  </span>
                </div>
              )}
            </div>

            {/* ── امتیاز و «موجود در انبار» هر دو برداشته شدند ──
                امتیاز عددش ثابت و ساختگی بود (۵٫۰ با ۰ نظر).

                «موجود در انبار» هم پشتوانه‌ای نداشت: این‌جا آگهیِ
                دستِ‌دوم است، نه فروشگاهی با انبار. موجودی هیچ‌جا
                شمرده نمی‌شود (`stock` همیشه ۱ ذخیره می‌شود) و آگهی
                ممکن است همین حالا فروخته شده باشد. برچسبِ سبزِ
                «موجود» روی چنین چیزی، همان دروغِ کوچکی است که به
                همه‌ی صفحه بی‌اعتمادی می‌دهد. وضعیتِ واقعی — «فروخته
                شد» — جای خودش نشان داده می‌شود. */}

            {/* آگهیِ فروخته‌شده باز می‌ماند (لینکش ممکن است جایی باشد)
                ولی خریدار باید بی‌درنگ بفهمد که دیگر موجود نیست. */}
            {sold && (
              <div style={{
                marginBottom: 16, borderRadius: 14, padding: '12px 16px',
                background: 'rgba(178,59,46,0.06)', border: '1px solid rgba(178,59,46,0.24)',
                fontSize: 13, fontWeight: 800, color: '#B23B2E',
              }}>
                این کالا فروخته شده است.
              </div>
            )}

            {/* ── توضیحاتِ فروشنده ──
                یک پاراگرافِ لخت بود؛ کنارِ کارتِ شیشه‌ایِ فروشنده و
                جدولِ مشخصات، مثل متنی می‌ماند که جا مانده. حالا خودش
                یک بلوکِ مستقل است: نشانِ طلاییِ عمودی، تیترِ کوچک، و
                علامتِ نقل‌قول در پس‌زمینه که به متن وزن می‌دهد بدونِ
                آنکه خواندنش را سخت کند. */}
            {!!product.desc.trim() && (
              <div style={{ ...glassPanel, borderRadius: 20, padding: '16px 18px 18px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
                <span aria-hidden style={{ position: 'absolute', top: -18, insetInlineStart: 10, fontSize: 96, lineHeight: 1, color: 'rgba(199,166,106,0.13)', fontWeight: 900, pointerEvents: 'none', userSelect: 'none' }}>”</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11, position: 'relative' }}>
                  <span style={{ width: 3, height: 18, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},${GOLDD})` }} />
                  <h2 style={{ fontSize: 14.5, fontWeight: 800, color: TEXT, margin: 0 }}>توضیحات محصول</h2>
                </div>
                <p style={{ fontSize: 14, lineHeight: 2.1, color: 'rgba(28,28,26,0.72)', margin: 0, position: 'relative', whiteSpace: 'pre-line' }}>
                  {product.desc}
                </p>
              </div>
            )}

            {/* ── مشخصات فنی ──
                فروشنده هنگام ثبتِ آگهی ده‌ها مشخصه پر می‌کند — طول،
                وزن، قطرِ تیپ، جنسِ شفت، ضخامتِ سنگ — و همه‌شان در
                دیتابیس می‌نشستند و **هیچ‌جا دیده نمی‌شدند**. بازدیدکننده
                فقط عنوان و قیمت را می‌دید، یعنی دقیقاً همان چیزی که
                خریدِ آنلاینِ تجهیزات را غیرممکن می‌کند.

                طرح عمداً با بقیه‌ی جدول‌های سایت فرق دارد: خطِ نقطه‌چینِ
                رابط بینِ نام و مقدار — همان چیزی که در برگه‌ی مشخصاتِ
                کاتالوگ‌های حرفه‌ای دیده می‌شود — به‌جای ردیف‌های
                راه‌راه. چشم بدونِ مکث از نامِ مشخصه به مقدارش می‌رسد،
                حتی وقتی طولِ نام‌ها یکی نیست. */}
            {specs.length > 0 && (
              <div style={{ ...glassPanel, borderRadius: 20, padding: '18px 18px 8px', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                  <span style={{ width: 3, height: 18, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},${GOLDD})` }} />
                  <h2 style={{ fontSize: 14.5, fontWeight: 800, color: TEXT, margin: 0 }}>مشخصات فنی</h2>
                  <span style={{ fontSize: 11, fontWeight: 700, color: GOLDD, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.30)', borderRadius: 999, padding: '2px 9px' }}>
                    {specs.length.toLocaleString('fa-IR')} مورد
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', columnGap: 26 }}>
                  {specs.map(s => (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '9px 0', borderBottom: '1px solid rgba(28,28,26,0.06)' }}>
                      <span style={{ fontSize: 12.5, color: TSEC, whiteSpace: 'nowrap', flexShrink: 0 }}>{s.label}</span>
                      <span aria-hidden style={{ flex: 1, minWidth: 12, alignSelf: 'center', height: 1, borderBottom: '1.5px dotted rgba(28,28,26,0.20)' }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, whiteSpace: 'nowrap', flexShrink: 0 }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── وضعیت کالا ──
                هر آگهی در دیتابیس ستونِ `condition` دارد و فرمِ ثبت هم
                اجباری پرش می‌کند، ولی صفحه‌ی جزئیات هیچ‌جا نشانش
                نمی‌داد — خریدار نمی‌فهمید کالا نو است یا کارکرده، در
                حالی که کارتِ فهرست این را می‌گفت.

                برچسبِ فارسی از `conditionLabel` می‌آید (همان منبعی که
                فرم و کارت‌ها هم از آن می‌خوانند)، و رنگ با خودِ وضعیت
                عوض می‌شود تا در یک نگاه خوانده شود. */}
            {(() => {
              const cond = normalizeCondition(product.condition)
              const tone: Record<string, { bg: string; bd: string; fg: string }> = {
                new:          { bg: 'rgba(22,101,52,0.08)',  bd: 'rgba(22,101,52,0.22)',  fg: '#166534' },
                like_new:     { bg: 'rgba(8,145,178,0.08)',  bd: 'rgba(8,145,178,0.22)',  fg: '#0E7490' },
                used:         { bg: 'rgba(199,166,106,0.12)', bd: 'rgba(199,166,106,0.32)', fg: GOLDD },
                needs_repair: { bg: 'rgba(180,83,9,0.08)',   bd: 'rgba(180,83,9,0.24)',   fg: '#B45309' },
              }
              const t = tone[cond] ?? tone.new!
              return (
                <div style={{ ...glassPanel, borderRadius: 20, padding: '16px 18px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                    <span style={{ width: 3, height: 18, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},${GOLDD})` }} />
                    <h2 style={{ fontSize: 14.5, fontWeight: 800, color: TEXT, margin: 0 }}>وضعیت کالا</h2>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {CONDITIONS.map(c => {
                      const on = c.id === cond
                      return (
                        <span key={c.id} style={{
                          fontSize: 12.5, fontWeight: on ? 800 : 600, padding: '7px 14px', borderRadius: 999,
                          background: on ? t.bg : 'rgba(28,28,26,0.03)',
                          border: `1px solid ${on ? t.bd : 'rgba(28,28,26,0.08)'}`,
                          color: on ? t.fg : 'rgba(28,28,26,0.32)',
                        }}>
                          {c.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* قیمت — آگهیِ توافقی عدد ندارد، پس عدد هم نشان نمی‌دهیم */}
            <div style={{ ...lqWhite, borderRadius: 18, padding: '16px 18px', marginBottom: 16 }}>
              {negotiable ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: TSEC }}>قیمت:</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#1A6B3A' }}>توافقی</span>
                  <span style={{ marginInlineStart: 'auto', fontSize: 12, color: TMUT }}>با فروشنده تماس بگیرید</span>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 24, fontWeight: 900, color: '#1A6B3A', fontVariantNumeric: 'tabular-nums' }}>{fmt(product.price)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: TSEC }}>تومان</span>
                    {product.disc > 0 && product.old > product.price && (
                      <span style={{ marginInlineStart: 'auto', fontSize: 13.5, color: TMUT, textDecoration: 'line-through', fontVariantNumeric: 'tabular-nums' }}>{fmt(product.old)}</span>
                    )}
                  </div>
                  {product.disc > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span dir="ltr" style={{ background: '#b400ae', color: '#fff', fontSize: 11.5, fontWeight: 800, borderRadius: 999, padding: '3px 9px 1px', lineHeight: 1 }}>
                        ٪{toFa(product.disc)}
                      </span>
                      <span style={{ fontSize: 12, color: TSEC, fontWeight: 600 }}>
                        {fmt(product.old - product.price)} تومان سود شما
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* کارت فروشنده — رفتن به فروشگاه + تماس */}
            <div style={{ ...glassPanel, borderRadius: 20, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${GOLD},${GOLDD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                  <Store size={20} strokeWidth={2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: TMUT, marginBottom: 2 }}>
                    {hasStore ? 'فروشنده این محصول' : 'آگهی‌دهنده'}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.sellerName}</div>
                </div>
                {hasStore && storeVerified && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#16803C', background: 'rgba(22,128,60,0.10)', border: '1px solid rgba(22,128,60,0.25)', borderRadius: 999, padding: '4px 10px' }}>
                    <ShieldCheck size={13} strokeWidth={2.2} /> فروشگاه
                  </span>
                )}
              </div>

              {/* آگهی کاربر عادی فروشگاهی ندارد ⇒ فقط راه‌های تماس.
                  نشان «فروشگاه» هم نباید روی آگهی شخصی دیده شود. */}
              {!hasStore && (
                <p style={{ fontSize: 11.5, color: TMUT, lineHeight: 1.95, margin: '0 0 12px' }}>
                  بیلیارد هاب طرف معامله نیست؛ پیش از پرداخت، کالا را کامل بررسی و
                  از صحت اطلاعات مطمئن شوید.
                </p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                {hasStore && (
                  <Link href={`/sellers/${product.sellerId}`} className="lq-lift" style={{ gridColumn: '1 / -1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px', borderRadius: 10, ...lqGold, fontSize: 13, textDecoration: 'none' }}>
                    <Store size={16} strokeWidth={2.2} /> رفتن به صفحه فروشگاه
                  </Link>
                )}
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="lq-lift" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 12, ...lqGreen, fontSize: 12.5, textDecoration: 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.77.46 3.45 1.28 4.9L2 22l5.32-1.39a9.9 9.9 0 004.72 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.13-2.9-7A9.82 9.82 0 0012.04 2z"/></svg>
                  واتساپ
                </a>
                <a href={`tel:${product.sellerPhone}`} className="lq-lift" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 10, ...lqGold, fontSize: 12.5, textDecoration: 'none' }}>
                  <Phone size={15} strokeWidth={2.2} /> تماس
                </a>
                <ReportButton variant="button" targetId={product.id} targetTitle={fullName}
                  stopPropagation={false} style={{ gridColumn: '1 / -1' }} />
              </div>
            </div>

            {/* ── سه «تضمین» برداشته شدند ──
                «گارانتی اصالت کالا»، «ارسال به سراسر کشور» و «۷ روز
                ضمانت بازگشت» هیچ‌کدام پشتوانه‌ای نداشتند: بیلیارد هاب
                طرفِ معامله نیست و کالا را نه می‌فرستد نه پس می‌گیرد.
                نوشتنشان درست کنارِ متنی که می‌گوید «طرف معامله نیستیم»
                هم متناقض بود و هم می‌توانست تعهدِ حقوقی بسازد. */}
          </div>
        </div>

        {/* ── محصولات مرتبط ── */}
        {related.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>محصولات مشابه</h2>
              <Link href="/shop" style={{ fontSize: 13, color: GOLDD, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                مشاهده همه <ChevronLeft size={14} strokeWidth={2.4} />
              </Link>
            </div>
            <div className="rel-grid" style={{ display: 'grid', gap: 12 }}>
              {related.map(p => {
                const rp = productTitleParts({ name: p.title, brand: p.brand, model: p.model })
                return (
                <Link key={p.id} href={`/shop/${p.id}`} className="pd-card" style={{ textDecoration: 'none', background: '#fff', borderRadius: 14, border: `1.5px solid ${HAIR}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: '100%', paddingTop: '100%', position: 'relative', background: '#F4F3F1', borderBottom: `1.5px solid ${HAIR}` }}>
                    {p.image && (
                      <img loading="lazy" decoding="async" src={p.image} alt={p.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div style={{ padding: '10px 10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {/* همان دو خطِ کارتِ بازار: بولد بالا، برند و مدل پایینش */}
                    <span style={{ fontSize: 12, fontWeight: 800, color: TEXT, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{rp.head}</span>
                    {rp.tail && (
                      <span style={{ fontSize: 11, fontWeight: 400, color: TSEC, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rp.tail}</span>
                    )}
                    {/* برند حالا در خطِ عنوان است؛ دوباره گفتنش تکرار بود */}
                    {p.city && <span style={{ fontSize: 10.5, color: TMUT }}>{p.city}</span>}
                    <div style={{ marginTop: 'auto', fontSize: 13, fontWeight: 800, color: '#1A6B3A' }}>
                      {/* آگهیِ توافقی قیمت ندارد؛ «۰ تومان» دروغ است */}
                      {p.negotiable
                        ? 'توافقی'
                        : <>{fmt(p.price)} <span style={{ fontSize: 11, fontWeight: 500 }}>تومان</span></>}
                    </div>
                  </div>
                </Link>
                )
              })}
            </div>
          </div>
        )}

        {zoomed && (
          <ImageLightbox
            images={gallery} index={shown} alt={fullName}
            onIndex={setImgIdx} onClose={() => setZoomed(false)} />
        )}
      </div>
    </div>
  )
}

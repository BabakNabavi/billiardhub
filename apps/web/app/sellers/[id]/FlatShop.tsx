'use client'
import { applyImagePatch } from '@/lib/profiles/edit-image'
import { useChannelPublish, type PublishVideo } from '@/components/media/useChannelPublish'
import { useVideoEdit } from '@/components/media/useVideoEdit'
import { detailTitle, type VideoDetail } from '@/lib/media/video-details'
import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { toFa, faNum, MONO, toggleSet, Icon, LQ, LQ_NEUTRAL, LQ_FELT_ON } from './shared'
import { fetchProductsBySeller, type ShopProduct } from '../../shop/products'
import ClubStoryModal from '../../../components/ClubStoryModal'
/* همان تایپی که پنل فروشگاه می‌نویسد — نسخه‌ی محلی سوم نمی‌سازیم */
import type { SellerStory } from '../../../components/seller/StoryManager'
import { useProfileImageViewer } from '@/components/ProfileImageViewer'
import { useProfileVideoViewer } from '@/components/profile/ProfileVideoViewer'
import ProfileGallery from '@/components/profile/ProfileGallery'
import { uploadFile } from '@/lib/supabase'
import { videoMeta, formatDuration } from '@/lib/video-thumb'
import { notify } from '@/lib/ui/dialogs'
import '@/components/profile/profile-page.css'
import { getSellerProfile, type SellerProfile } from '../../../lib/seller-store'
import { fetchProfileResult } from '../../../lib/profiles/client'
import { useOwnerEdit } from '../../../lib/profiles/use-owner-edit'
import { compressImage } from '../../../lib/seller-store'
import { ask } from '../../../lib/ui/dialogs'
import ProfileHero from '../../../components/profile/ProfileHero'
import { telPrefix, provinceOfCity } from '../../../lib/iran-geo'
import { getMockSeller } from '../../../lib/sellers-data'
import { MARKET_CATEGORIES } from '../../../lib/market/categories'
import ProductTitle from '../../../components/market/ProductTitle'
import { CardMeta, CardPrice } from '../../../components/market/CardFacts'
import ProductMedia from '../../../components/market/ProductMedia'
import '../../../components/market/product-media.css'
/* بدون این، نوار روی دسکتاپ فقط با شیفت+چرخ حرکت می‌کرد و با موس
   «قفل» حس می‌شد. همان قلابی که کاروسل‌های صفحه‌ی اصلی دارند. */
import { useHorizontalScroll } from '../../../lib/useHorizontalScroll'

/*
  نسخه‌ی فلت — UX فروشگاه واقعی
  دسته‌بندی‌ها: عینا از «بیلیارد بازار» (۱۴ دسته)
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
  id: string; name: string; cat: CatKey; brand: string; model: string
  price: number; old?: number; disc: number; rating: number; reviews: number; sales: number
  /* شهر، وضعیت و توافقی‌بودن — همان چیزهایی که کارت فهرست
     بازار نشان می‌دهد و این‌جا اصلا به کارت نمی‌رسیدند */
  city: string; condition: string; negotiable: boolean
  badge?: { text: string; kind: 'sale' | 'new' }; img: string
  /** تعدادِ کلِ عکس‌های آگهی — نشانِ گوشه‌ی عکس از همین می‌آید */
  imgCount: number
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
  /* ⚠️ `false` عمدی است. تا امروز `true` بود و چون `store` با
     `...STORE` ساخته می‌شود، **هر** فروشگاهی تیک آبی می‌گرفت —
     حتی آن‌که ادمین تأییدش نکرده بود. تیک از `profile.verified`
     می‌آید و بس. */
  verified: false, rating: 4.8, reviews: 312, memberSince: 1402,
  whatsapp: '989121234567', phones: ['021-88221100', '0912-123-4567'], instagram: 'procue.ir',
  address: 'تهران، خیابان ولیعصر، بالاتر از پارک ملت، پلاک ۴۵',
  hours: 'شنبه تا پنج‌شنبه، ۹ تا ۲۰',
  shipping: 'تحویل حضوری هم در فروشگاه امکان‌پذیر است',

}

/* محصولات یک فروشنده (به شکل کارت) — بر اساس id همان فروشگاه */
function productsForSeller(rows: ShopProduct[]): Product[] {
  return rows.map(sp => ({
    id: String(sp.id),
    name: sp.name,
    cat: sp.cat as CatKey,
    brand: sp.brand,
    model: sp.model,
    price: sp.price,
    old: sp.old > 0 ? sp.old : undefined,
    disc: sp.disc,
    rating: sp.rating,
    reviews: sp.reviews,
    sales: sp.sales,
    city: sp.city,
    condition: sp.condition,
    negotiable: sp.negotiable,
    badge: sp.disc > 0 ? { text: `${toFa(sp.disc)}٪ تخفیف`, kind: 'sale' as const } : undefined,
    img: sp.img,
    imgCount: sp.imgCount,
  }))
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
  const [mine, setMine] = useState<boolean | undefined>(undefined)

  /* ── ویرایش درجا ──
     ⚠️ پیش از هر `return` شرطی این کامپوننت — قاعده‌ی هوک‌ها.
     `ownerId` از قبل داخل `profile` نشانده می‌شود (خط بالاتر). */
  /* عکس‌های گالری از پروفایل واقعی */
  const shots = profile?.gallery ?? []
  const vids = profile?.videos ?? []
  const edit = useOwnerEdit<SellerProfile>('seller', sellerId, profile, profile?.ownerId ?? null, setProfile, mine)
  const { gate: channelGate, ask: askChannel, publish: publishToChannel } = useChannelPublish('seller', profile?.ownerId ?? undefined, edit.isOwner, notify)

  /* ── همان گالری مشترک بقیه‌ی نقش‌ها ──
     ⚠️ این‌جا فقط یک شبکه‌ی عکس بود: نه ویدیویی، نه آلبومی، و حذف با
     *اندیس* انجام می‌شد. حالا همان کامپوننتی رندر می‌شود که مربی،
     داور، خدمات فنی و بازیکن دارند. */
  const MAX_VIDEO_MB = 25
  const [vidBusy, setVidBusy] = useState(false)
  /* انتشار در بیلیارد مدیا — پنجره فقط وقتی باز می‌شود که کانال
     همین نقش نباشد. آپلود گالری هرگز به نتیجه‌اش وابسته نیست. */

  const addShots = async (files: File[], album?: string) => {
    const items = await Promise.all(files.map(async fl => ({
      id: `m${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
      url: await compressImage(fl, 1000, 0.68),
      caption: '',
      ...(album ? { album } : {}),
    })))
    await edit.apply(d => ({ ...d, gallery: [...(d.gallery ?? []), ...items] }))
  }

  /* `details` از فرم مشخصات می‌آید (عنوان/دسته/توضیح). تا دیروز
     عنوان نام فایل بود و همان به مدیا می‌رفت. */
  const addVideoFiles = async (files: File[], album?: string, details?: VideoDetail[]) => {
    setVidBusy(true)
    const skipped: string[] = []
    const shipped: PublishVideo[] = []
    try {
      for (const [i, file] of files.entries()) {
        if (file.size > MAX_VIDEO_MB * 1024 * 1024) { skipped.push(file.name); continue }
        const meta = await videoMeta(file)
        const vid = `v${Date.now()}${Math.random().toString(36).slice(2, 6)}`
        const base = `profiles/videos/${profile?.ownerId ?? 'anon'}/${vid}`
        const url = await uploadFile('club-media', file, base)
        if (!url) { skipped.push(file.name); continue }
        const thumb = meta.thumb ? (await uploadFile('club-media', meta.thumb, `${base}-thumb`)) ?? '' : ''
        const ok = await edit.apply(d => ({
          ...d,
          videos: [...(d.videos ?? []), { id: vid, url, thumbnail: thumb, title: detailTitle(details, i, file), duration: formatDuration(meta.durationSec), ...(album ? { album } : {}) }],
        }))
        if (!ok) break
        /* ⚠️ فقط ویدیویی که *در گالری ذخیره شد* منتشر می‌شود. پیش‌تر
           این خط بالای `break` بود و ویدیویی که ذخیره‌اش شکست خورده
           بود هم به مدیا می‌رفت: در بیلیارد مدیا زنده، در پروفایل
           نبود، و کاربر پیام «ذخیره انجام نشد» دیده بود. */
        /* «فقط در گالری بماند» یک تصمیم صریح کاربر است */
        if (details?.[i]?.publish !== false) {
          shipped.push({
            title: detailTitle(details, i, file), src: url, thumb, durationSec: meta.durationSec,
            category: details?.[i]?.category, description: details?.[i]?.description,
          })
        }
      }
    } finally {
      setVidBusy(false)
      if (shipped.length) void publishToChannel(shipped, String(profile?.title ?? '')).catch(() => {})
      if (skipped.length) notify(`این ویدیوها اضافه نشدند (سقف ${MAX_VIDEO_MB} مگابایت): ${skipped.join('، ')}`)
    }
  }

  const newAlbum = async (name: string) => {
    const n = name.trim()
    if (!n) return
    await edit.apply(d => {
      const list = d.albums ?? []
      if (list.some(x => x.trim() === n)) return d
      return { ...d, albums: [...list, n] }
    })
  }

  const editImage = async (id: string, patch: { caption: string; album: string }) => {
    await edit.apply(d => applyImagePatch({ ...d, gallery: d.gallery ?? [] }, id, patch) as typeof d)
  }

  const deleteShot = async (mid: string) => {
    if (!(await ask('این تصویر حذف شود؟', { body: 'این کار برگشت‌پذیر نیست.', confirmLabel: 'حذف' }))) return
    await edit.apply(d => ({ ...d, gallery: (d.gallery ?? []).filter(g => g.id !== mid) }))
  }
  /* ── ویرایش عنوان ویدیو ──
     عنوان دو نسخه دارد: ردیف گالری پروفایل و ردیف بیلیارد مدیا.
     هوک دومی را می‌زند، این تابع اولی را. کلید نشانی فایل است،
     چون گالری شناسه‌ی ردیف مدیا را ندارد. */
  const { dialog: videoEditDialog, edit: editVideo } = useVideoEdit(
    async (target, detail) => {
      /* ⚠️ `map` بدون تطبیق هم «موفق» برمی‌گردد. اگر نشانی جور نشود
         (کدگذاری متفاوت، ردیف بی‌url)، هوک «شد» می‌شنید و مدیا را
         عوض می‌کرد در حالی که گالری عنوان قبلی را نشان می‌دهد —
         یعنی دو عنوان برای یک ویدیو. */
      let hit = false
      const ok = await edit.apply(prof => {
        const list = prof.videos ?? []
        hit = list.some(x => x.url === target.url)
        if (!hit) return prof
        return { ...prof, videos: list.map(x => (x.url === target.url ? { ...x, title: detail.title } : x)) }
      })
      return ok && hit
    },
    notify,
  )

  const deleteVideo = async (vid: string) => {
    if (!(await ask('این ویدیو حذف شود؟', { body: 'این کار برگشت‌پذیر نیست.', confirmLabel: 'حذف' }))) return
    await edit.apply(d => ({ ...d, videos: (d.videos ?? []).filter(v => v.id !== vid) }))
  }

  /* ── نامکی که وجود ندارد ──
     تا امروز اگر نشانی به فروشگاهی می‌رفت که نبود، صفحه داده‌ی
     نمونه‌ی قدیمی را نشان می‌داد — «فروشگاه تجهیزات بیلیارد بابی» با
     تلفن و آدرس ساختگی. یعنی سایت فروشگاهی را تبلیغ می‌کرد که وجود
     خارجی ندارد. حالا صریح می‌گوید پیدا نشد. */
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    setProfile(getSellerProfile(sellerId))
    setMissing(false)
    /* منبع حقیقت سرور است — فروشگاه کاربران دیگر فقط از این‌جا می‌آید */
    void fetchProfileResult<SellerProfile>('seller', sellerId).then(r => {
      const p = r.state === 'found' ? r.profile : null
      /* پرچم قطعی سرور — مقایسه‌ی مرورگر بی‌صدا شکست می‌خورد */
      if (r.state === 'found') setMine(r.isMine === true)
      /* `ownerId` ستون واقعی ردیف است و باید صریح منتقل شود؛ وگرنه
         مسیر استوری روی ردیف‌هایی که آن را داخل data ندارند خالی
         می‌ماند و همان ناهماهنگی قبلی برعکس تکرار می‌شود. */
      if (p) setProfile({ ...p.data, slug: p.slug, ownerId: p.ownerId, verified: p.verified } as SellerProfile)
      else if (!getSellerProfile(sellerId) && !getMockSeller(sellerId)) setMissing(true)
    })
  }, [sellerId])

  /* محصولات همین فروشگاه؛ فروشگاه نمونه که محصول اختصاصی ندارد، کاتالوگ دمو را نشان می‌دهد
     تا storefront خالی نماند. */
  /* محصولات از سرور می‌آیند، نه از کاتالوگ ساختگی.

     پیش‌تر فروشگاه بی‌محصول، محصولات فروشگاه «۱» را نشان می‌داد —
     کالای یک فروشنده زیر نام فروشنده‌ی دیگر. فروشگاه بی‌محصول باید
     خالی بماند، و حالا واقعا می‌ماند. */
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
      verified:     profile.verified === true,
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
         پیش‌تر فروشگاهی که هیچ استوری نگذاشته بود، حلقه‌ی رنگی
         استوری می‌گرفت و با زدنش یک استوری ساختگی باز می‌شد
         («کالکشن چوب‌های کربنی Predator»). یعنی سایت از طرف
         فروشنده چیزی تبلیغ می‌کرد که او نگذاشته بود. */
      /* فیلدهای «عکس/متن استوری» پروفایل دیگر خوانده نمی‌شوند: استوری
         از مسیر واقعی ۲۴ساعته می‌آید، نه از فیلد فرم. */
      phones:       phones.length ? phones : STORE.phones,
    }
  }, [profile, sellerId])

  /* شماره‌ی تماس با کد شهر (استان) — مثلا ۰۲۱-۶۶۵۵۴۴۳۳ */
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
  const { open: openImage, viewer: imageViewer } = useProfileImageViewer()
  const { open: openVideo, viewer: videoViewer } = useProfileVideoViewer()
  const catStripRef = useRef<HTMLDivElement>(null)
  useHorizontalScroll(catStripRef)
  /* ── استوری فقط از سیستم واقعی ۲۴ساعته ──
     تا امروز حلقه‌ی استوری از فیلد `storyImage` فرم ثبت فروشگاه
     ساخته می‌شد. آن فیلد پروفایل است نه استوری: انقضا ندارد، هیچ
     «انتشار»ی لازم ندارد، و همان لحظه‌ای که فروشنده عکسی در فرم
     می‌گذاشت روی صفحه‌اش حلقه‌ی استوری ظاهر می‌شد و *روزها* می‌ماند.

     نوار استوری صفحه‌ی اصلی قبلا از این فالبک جدا شده بود، ولی
     این صفحه نه — پس کاربر می‌دید نوار خالی است ولی کارت فروشگاه
     حلقه دارد.

     مسیر `/api/sellers/<ownerId>/stories` همان مدل باشگاه است و
     خودش منقضی‌ها را حذف می‌کند. */
  const [liveStories, setLiveStories] = useState<SellerStory[]>([])
  /* تا وقتی پاسخ نیامده، دکمه نه حلقه دارد نه ادعای استوری —
     وگرنه معنی‌اش وسط کار عوض می‌شود. */
  const [storiesLoading, setStoriesLoading] = useState(true)
  const [storyIdx, setStoryIdx] = useState(0)
  useEffect(() => {
    const owner = profile?.ownerId
    if (!owner) { setLiveStories([]); setStoriesLoading(false); return }
    setStoriesLoading(true)
    let alive = true
    void fetch(`/api/sellers/${owner}/stories`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : []))
      .then(rows => { if (alive) setLiveStories(Array.isArray(rows) ? rows : []) })
      .catch(() => { if (alive) setLiveStories([]) })
      .finally(() => { if (alive) setStoriesLoading(false) })
    return () => { alive = false }
  }, [profile?.ownerId])
  const hasStory = !storiesLoading && liveStories.length > 0
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

  if (missing) {
    return (
      <div dir="rtl" className="shop-shell flex min-h-screen items-center justify-center px-4 font-[Vazirmatn,Tahoma,sans-serif] text-[#1C1B17]">
        <div className="w-full max-w-[420px] rounded-2xl border border-[#E7E2D6] bg-white px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(199,166,106,0.12)] text-[#8F6531]">
            {Icon.storefront}
          </div>
          <h1 className="text-[17px] font-bold">این فروشگاه پیدا نشد</h1>
          <p className="mt-2 text-[13px] leading-[2] text-[#6F6A5C]">
            نشانی <span dir="ltr" className={MONO}>/sellers/{sellerId}</span> به فروشگاهی وصل نیست.
            ممکن است نشانی اشتباه تایپ شده باشد.
          </p>
          <Link href="/sellers" className="mt-5 inline-flex items-center justify-center rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] px-4 py-2.5 text-[13px] font-bold text-[#8F6531] transition hover:-translate-y-0.5">
            فهرست فروشگاه‌ها
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="shop-shell min-h-screen font-[Vazirmatn,Tahoma,sans-serif] text-[#1C1B17]">

      <style>{`
        /* کارت محصول — هم‌فرم کارت sec1 در صفحه‌ی بیلیارد بازار.
           عرض را گرید تعیین می‌کند (برخلاف sec1 که کاروسل با عرض ثابت است)، ولی نسبت،
           سهم عکس، گردی، بوردر و فونت‌ها عینا همان‌اند. */
        /* جنس سطح از .lq-pcard در globals.css می‌آید — همان کارتی که
           بازار و صفحه‌ی اصلی هم نشان می‌دهند. این‌جا فقط نسبت و چیدمان. */
        .prod-card-sec1 {
          /* ⚠️ نسبتِ ثابتِ کارت برداشته شد. قابِ عکس حالا نسبتِ خودش
             را دارد (فرمولِ واحدِ سایت) و بدنه هم محتوای خودش را
             می‌خواهد؛ با ارتفاعِ ثابت مجموعشان بیشتر می‌شد و
             overflow hidden ردیفِ قیمت را می‌برید. گرید خودش
             کارت‌های یک ردیف را هم‌ارتفاع می‌کند. */
          /* کوچک‌شدن حالا کار خود گرید است (شش ستون در دسکتاپ)، پس
             محدودکردن عرض کارت داخل سلول لازم نیست و فقط فاصله‌ی
             بصری را زیاد می‌کرد.
             (بک‌تیک در این کامنت ممنوع — داخل template literal است) */
          width: 100%;
        }
        .pc-body-sec1 { padding: 21px 10px 12px; }
        /* نام محصول — حداکثر دو خط، مثل sec1 */
        .pc-h { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; font-weight: var(--ad-title-w); }
        .pc-t { display: block; margin-top: 3px; font-size: var(--ad-sub); font-weight: var(--ad-sub-w); color: #6F6A5C;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pc-name-sec1 {
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          font-size: var(--ad-title); line-height: var(--ad-title-lh); color: #1C1C1A;
        }
        /* قیمت و پیلِ درصد — همان توکنِ دو کارتِ دیگر */
        .pc-pct  { font-size: var(--ad-pct);   font-weight: var(--ad-pct-w); }
        .pc-old  { font-size: var(--ad-old); }
        .pc-now  { font-size: var(--ad-price); font-weight: var(--ad-price-w); }
        .pc-unit { font-size: var(--ad-unit);  font-weight: var(--ad-unit-w); }
        @media(max-width:700px) {
          .pc-body-sec1 { padding: 14px 7px 7px; }
          /* ⚠️ رنگِ خاکستریِ موبایل در تبدیل گم شده بود */
          .pc-name-sec1 { line-height: 1.35; color: #666; }
        }
        /* ══ پوسته‌ی صفحه ══
           پس‌زمینه خاکستری تخت #F7F5F0 بود و همه‌چیز رویش سفید
           بی‌سایه؛ صفحه «خشک» دیده می‌شد چون هیچ عمق و هیچ رنگی
           نداشت. سه هاله‌ی نرم — طلایی، نمد سبز، و کرم گرم — بدون
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

        /* ══ هدر گلس ══
           کارت سفید بوردردار جای خودش را به یک سطح شیشه‌ای می‌دهد:
           بلور اشباع‌شده، لبه‌ی روشن داخلی، و یک هالهٔ طلایی نرم که
           از گوشه رد می‌شود (حالت «liquid»). زیر بنر می‌نشیند و
           عکس بنر از پشتش کمی پیدا می‌شود. */
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

        /* ── نوار دسته‌بندی افقی (هم‌شکل بیلیارد بازار) ── */
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
        .scat-all { color: #8F6531; background: radial-gradient(circle at 34% 28%, #FFF6E4, #F3E6CB); }
        .scat-lb { font-size: 11px; font-weight: 700; color: #3E3A32; white-space: nowrap; }
        .scat.on .scat-lb { color: #7A5626; }
        .scat-ct { font-size: 10px; font-weight: 700; color: #A69F8E; font-variant-numeric: tabular-nums; }
        .scat.on .scat-ct { color: #8F6531; }
        @media (prefers-reduced-motion: reduce) { .scat { transition: none } .scat:hover { transform: none } }

      `}</style>

      {/* ═══ هدر — همان کامپوننتِ مشترکِ مربی، داور و تولیدکننده ═══
          نسخه‌ی قبلی بنرِ اسلایدی + کارتِ سفید بود و کنارِ صفحه‌ی مربی
          «ساده و معمولی» دیده می‌شد. حالا همان ProfileHero است، نه
          چیزی شبیهش، پس از فردا هم از هم دور نمی‌شوند.

          دو چیزِ اختصاصیِ فروشگاه حفظ شد و به خودِ هدرِ مشترک اضافه
          شد: چرخشِ چند بنر، و حلقه‌ی استوری دورِ لوگو.

          ⚠️ بردکرامبِ جدا حذف شد — ProfileHero خودش یکی دارد.

          برند به‌تنهایی روی چیپ گنگ است؛ «نمایندگی X» همان چیزی را
          می‌گوید که ردیفِ برچسب‌دارِ قبلی می‌گفت. */}
      <ProfileHero
        name={store.title}
        city={[store.province, store.city].filter(Boolean).join('، ')}
        photo={store.logo || undefined}
        coverSlides={store.banners.length ? store.banners : undefined}
        story={hasStory ? { onOpen: () => { setStoryIdx(0); setStoryOpen(true) }, label: 'مشاهده استوری فروشگاه' } : undefined}
        verified={store.verified}
        disciplines={store.brands.map(b => ({ label: `نمایندگی ${b}` }))}
        onOpenPhoto={u => openImage(u, { title: 'لوگوی فروشگاه', alt: store.title })}
        role="seller"
        backHref="/sellers" backLabel="فروشگاه‌ها"
        publicUrl={`billiardhub.net/sellers/${sellerId}`}
        posterBase={undefined}
        stats={
          PRODUCTS.length > 0 ? (
            <ul className="ch-stats">
              <li><b>{faNum(PRODUCTS.length)}</b><span>آگهی</span></li>
            </ul>
          ) : undefined
        }
        actions={
          phoneDig ? (
            <a className="ch-hero-cta" href={`tel:${phoneHref}`}>
              {Icon.phone}<span className={MONO}>{toFa(phoneText)}</span>
            </a>
          ) : undefined
        }
      />
      <div className="mx-auto mt-4 max-w-[1240px] px-4 sm:px-6">
        {store.desc && (
          <p className="max-w-[720px] text-[13px] leading-relaxed text-[#5B564B]">{store.desc}</p>
        )}

        {/* سرچ — زیر باکس فروشگاه */}
        <div className="relative mt-3">
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1) }}
            placeholder="جستجو در محصولات این فروشگاه..."
            className="w-full rounded-[10px] border border-[#E7E2D6] bg-white px-4 py-2.5 pl-11 text-[13.5px] text-[#1C1B17] placeholder:text-[#6F6A5C] focus:border-[#14532D] focus:outline-none"
          />
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F6A5C]">{Icon.search}</span>
        </div>

        {/* ── نوار دسته‌بندی ──
            همان آیکون‌ها و همان ترتیب صفحه‌ی «بیلیارد بازار»
            (`MARKET_CATEGORIES` — منبع واحد)، این‌بار افقی و کشیدنی
            زیر سرچ. جای دراپ‌داون قبلی را می‌گیرد که کنار تیتر
            پنهان بود و کاربر باید بازش می‌کرد تا بفهمد فروشگاه چه
            دارد. دسته‌ای که محصولی ندارد اصلا نشان داده نمی‌شود. */}
        <div className="scat-wrap mt-3">
          <div className="scat-strip" ref={catStripRef}>
            <button type="button" onClick={() => setCat('all')}
              className={`scat${cat === 'all' ? ' on' : ''}`}>
              <span className="scat-ic scat-all">{Icon.storefront}</span>
              <span className="scat-lb">همه</span>
              <span className="scat-ct">{faNum(PRODUCTS.length)}</span>
            </button>
            {MARKET_CATEGORIES.map(c => (
              <button key={c.id} type="button"
                onClick={() => setCat(cat === c.id ? 'all' : (c.id as CatKey))}
                className={`scat${cat === c.id ? ' on' : ''}`}>
                <span className="scat-ic"><img src={c.img} alt="" loading="lazy" /></span>
                <span className="scat-lb">{c.label}</span>
                {(catCounts[c.id as CatKey] ?? 0) > 0
                  ? <span className="scat-ct">{faNum(catCounts[c.id as CatKey] ?? 0)}</span>
                  : <span className="scat-ct scat-ct-0">—</span>}
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
            {/* همان نشان طلایی «درباره ما» — دو تیتر اصلی صفحه باید
                یک‌شکل باشند؛ این یکی بی‌رنگ و بی‌نشان مانده بود. */}
            <div className="flex items-center gap-2">
              <span className="h-5 w-[3px] rounded bg-gradient-to-b from-[#C7A66A] to-[#8A6020]" />
              <h1 className="text-xl font-bold text-[#1C1B17] sm:text-2xl">محصولات فروشگاه</h1>
            </div>
            <span className="mr-[11px] text-[12.5px] text-[#6F6A5C]">
              {faNum(visible.length)} محصول{cat !== 'all' ? ` در «${CAT_LABEL[cat]}»` : ''}
            </span>
          </div>
          {/* دراپ‌داون دسته‌بندی برداشته شد — جایش نوار افقی زیر سرچ. */}
        </div>

        {/* گرید — ۵ ستون در دسکتاپ (۲ ردیف ۵تایی = ۱۰ در هر صفحه) */}
        {/* شش کارت در هر سطر دسکتاپ. فاصله‌ها هم کم شد: با پنج ستون و
            گپ ۱۶، فاصله‌ی بین کارت‌ها از خود کارت‌ها به چشم می‌آمد. */}
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
                  className="prod-card-sec1 lq-pcard group flex cursor-pointer flex-col overflow-hidden"
                >
                  {/* ⚠️ عکس دیگر «۶۰٪ ارتفاعِ کارت» نیست؛ نسبتش همان
                      نسبتِ بازار و صفحه‌ی اصلی است. تا امروز یک محصول
                      در سه صفحه سه شکل داشت. */}
                  <ProductMedia
                    src={p.img} alt={p.name} href={`/shop/${p.id}`}
                    imgCount={p.imgCount}
                    saved={isWished}
                    saveLabel={{ on: 'حذف از علاقه‌مندی', off: 'افزودن به علاقه‌مندی' }}
                    onToggleSave={() => setWish(prev => toggleSet(prev, p.id))}
                    imgClassName="group-hover:scale-[1.05]" />

                  <div className="pc-body-sec1 flex flex-1 flex-col gap-1.5">
                    <ProductTitle p={p} className="pc-name-sec1" headClassName="pc-h" tailClassName="pc-t" />
                    {/* شهر و وضعیت — همان نواری که فهرست بازار دارد */}
                    <CardMeta p={p} />
                    <div className="mt-auto flex items-center gap-1.5">
                      {/* قیمت از منبع واحد: «توافقی» این‌جا چاپ نمی‌شد و
                          کارت صفر دیتابیس را «۰» نشان می‌داد */}
                      <CardPrice p={p} cls={{
                        pct: `inline-flex shrink-0 items-center justify-center rounded-full bg-[#b400ae] px-2.5 pb-0.5 pt-1 leading-none text-white pc-pct ${MONO}`,
                        box: 'ms-auto text-right',
                        old: `-mb-[3px] mt-[3px] leading-[1.1] text-[rgba(28,28,26,0.5)] line-through tabular-nums pc-old ${MONO}`,
                        now: `tabular-nums text-[#1C1C1A] pc-now ${MONO}`,
                        unit: 'inline-block no-underline pc-unit',
                      }} />
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

        {visible.length === 0 && (
          <div className="shop-head rounded-[22px] px-6 py-14 text-center text-[13.5px] text-[#6F6A5C]">
            محصولی در این دسته‌بندی پیدا نشد.
            {cat !== 'all' && <button onClick={() => setCat('all')} className="mr-2 font-bold text-[#8F6531] transition hover:opacity-70">نمایش همه محصولات</button>}
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

      {/* ── بخش «درباره ما» حذف شد ──
          همان متن «درباره‌ی فروشگاه» سه جای صفحه تکرار می‌شد: زیر
          نام فروشگاه در هدر، این‌جا، و در فوتر. یک متن سه بار یعنی
          صفحه پر به‌نظر می‌رسد ولی چیزی به خواننده اضافه نمی‌کند.
          جای اصلی‌اش هدر است، همان‌جا که چشم اول می‌رود. */}

      {/* ═══ گالری فروشگاه — همان کامپوننت مشترک ═══ */}
      {(shots.length > 0 || vids.length > 0 || edit.isOwner) && (
        <section className="px-4 pb-6 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <ProfileGallery
              images={shots.map(sh => ({ id: sh.id, url: sh.url, caption: sh.caption ?? '', album: sh.album }))}
              videos={vids}
              albumNames={profile?.albums ?? []}
              onOpenImage={(urls, index, meta, ids) => openImage(urls, {
                index, ...meta,
                ...(edit.isOwner ? { onDelete: (i: number) => deleteShot(ids[i] ?? '') } : {}),
              })}
              onOpenVideo={v => openVideo(v, edit.isOwner ? { onDelete: () => deleteVideo(v.id), onEdit: () => editVideo(v) } : undefined)}
              canEdit={edit.isOwner} busy={edit.saving || vidBusy}
              onAddImages={addShots} onAddVideos={addVideoFiles} beforeAddVideos={() => askChannel(String(profile?.title ?? ''))} onNewAlbum={newAlbum}
              onEditImage={editImage}
            />
            {edit.error && <p role="alert" style={{ fontSize: 12, color: '#b91c1c', marginTop: 10 }}>{edit.error}</p>}
          </div>
        </section>
      )}

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
              <h4 className="mb-2 text-[10.5px] font-bold tracking-[0.08em] text-[#8F6531] sm:mb-4">دسته‌بندی‌ها</h4>
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
              <h4 className="mb-2 text-[10.5px] font-bold tracking-[0.08em] text-[#8F6531] sm:mb-4">راه‌های ارتباطی</h4>
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
                    className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-[#E7E2D6] bg-[rgba(26,25,23,0.05)] text-[#6F6A5C] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C7A66A]/45 hover:bg-[#C7A66A]/[0.12] hover:text-[#C7A66A]">
                    {Icon.wa}
                  </a>
                  <a href={`https://instagram.com/${store.instagram}`} target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام"
                    className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-[#E7E2D6] bg-[rgba(26,25,23,0.05)] text-[#6F6A5C] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C7A66A]/45 hover:bg-[#C7A66A]/[0.12] hover:text-[#C7A66A]">
                    {Icon.insta}
                  </a>
                </li>
              </ul>
            </div>

            {/* موقعیت فروشگاه */}
            <div>
              <h4 className="mb-2 text-[10.5px] font-bold tracking-[0.08em] text-[#8F6531] sm:mb-4">موقعیت فروشگاه</h4>
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
                <span className="absolute bottom-2 right-2 rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] px-2.5 py-1 text-[11px] font-bold text-[#8F6531] shadow-sm transition hover:-translate-y-0.5">
                  مشاهده روی نقشه
                </span>
              </a>
            </div>
          </div>

          {/* نوار پایین */}
          <div className="border-t border-[#E8E3D6] px-6 py-4 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-[#6F6A5C]">
              <span>© {toFa(1405)} {store.title} — تمام حقوق محفوظ است</span>
              {/* نشان پلتفرم — فروشگاه فوتر خودش را دارد، ولی
                  بازدیدکننده باید بداند این صفحه کجا میزبانی می‌شود. */}
              <Link href="/" className="transition-colors hover:opacity-80">قدرت‌گرفته از بیلیارد <span className="font-bold text-[#C7A66A]">هاب</span></Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ استوری فروشگاه (مثل صفحه‌ی باشگاه) ═══ */}
      {imageViewer}
      {videoViewer}
      {channelGate}
      {videoEditDialog}
      {storyOpen && hasStory && liveStories[storyIdx] && (
        <ClubStoryModal
          club={{
            name: store.brand,
            logo: store.logo || undefined,
            storyMediaUrl: liveStories[storyIdx]!.mediaUrl,
            storyType: liveStories[storyIdx]!.mediaType ?? 'image',
            storyText: liveStories[storyIdx]!.text,
            badge: 'فروشگاه',
          }}
          index={storyIdx}
          count={liveStories.length}
          onNext={() => {
            if (storyIdx + 1 < liveStories.length) { setStoryIdx(storyIdx + 1); return }
            setStoryOpen(false)
          }}
          onPrev={() => setStoryIdx(i => Math.max(0, i - 1))}
          onClose={() => setStoryOpen(false)}
        />
      )}
    </div>
  )
}

'use client'
import { applyImagePatch } from '@/lib/profiles/edit-image'
import { useChannelPublish, type PublishVideo } from '@/components/media/useChannelPublish'
import { useVideoEdit } from '@/components/media/useVideoEdit'
import { detailTitle, type VideoDetail } from '@/lib/media/video-details'
import { useState, useMemo, useRef, useEffect } from 'react'
import { ProfileMissing, ProfileLoading } from '@/components/profile/ProfileMissing'
import { useProfileImageViewer } from '@/components/ProfileImageViewer'
import { useProfileVideoViewer } from '@/components/profile/ProfileVideoViewer'
import ProfileGallery from '@/components/profile/ProfileGallery'
import { uploadFile } from '@/lib/supabase'
import { videoMeta, formatDuration } from '@/lib/video-thumb'
import { notify } from '@/lib/ui/dialogs'
import '@/components/profile/profile-page.css'
import { useParams } from 'next/navigation'
import { toFa, faNum, MONO, Icon, LQ, LQ_NEUTRAL, LQ_FELT_ON } from '../../sellers/[id]/shared'
import { getManufacturerProfile, profileToManufacturer } from '../../../lib/manufacturer-store'
import type { ManufacturerProfile } from '../../../lib/manufacturer-store'
import { fetchProfileResult } from '../../../lib/profiles/client'
import { useOwnerEdit } from '../../../lib/profiles/use-owner-edit'
import { compressImage } from '../../../lib/seller-store'
import { ask } from '../../../lib/ui/dialogs'
import ProfileHero from '../../../components/profile/ProfileHero'
import ManufacturerPoster from '../../../components/profile/ManufacturerPoster'
import ProductDialog from './ProductDialog'
import { Factory } from 'lucide-react'
import { iranTel } from '../../../lib/iran-geo'
import { getManufacturer, type MfrProduct } from '../../../lib/manufacturers-data'
import OwnerAdsSection from '../../../components/market/OwnerAdsSection'
import { fetchProductsByOwner, type ShopProduct } from '../../shop/products'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTabKeys } from '@/hooks/use-tab-keys'

const DEFAULT_ID = '1'

/* ⚠️ `MfrPoster` و پوسترهایش حذف شدند: تنها مصرفشان ستونِ تزئینیِ
   کنارِ «درباره ما» بود — یک‌سومِ عرض را می‌گرفت و هیچ‌چیز درباره‌ی
   خودِ تولیدکننده نمی‌گفت. */

/* ── تب‌ها ──
   بیرون از کامپوننت، چون هم نوار تب و هم هندلرِ کلیدهای جهت به
   همین ترتیب نیاز دارند و دو نسخه یعنی یک روز از هم دور می‌شوند. */
const MFR_TABS = [
  { key: 'about',    label: 'درباره ما' },
  { key: 'products', label: 'محصولات ما' },
  { key: 'ads',      label: 'آگهی‌های ما' },
  { key: 'gallery',  label: 'گالری' },
] as const
type MfrTab = typeof MFR_TABS[number]['key']

/* ─── دراپ‌داون دسته‌بندی محصولات (از خود محصولات همین تولیدکننده) ─── */
function CategoryDropdown({
  value, onChange, cats,
}: {
  value: string
  onChange: (v: string) => void
  cats: { key: string; label: string; count: number }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [])
  const label = cats.find(c => c.key === value)?.label ?? 'همه محصولات'
  return (
    <div ref={ref} className="relative w-full max-w-[300px]">
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox" aria-expanded={open}
        className={`flex w-full items-center gap-2.5 rounded-xl border bg-white px-4 py-3 text-right transition ${
          open ? 'border-[#14532D] shadow-[0_0_0_3px_rgba(20,83,45,0.10)]' : 'border-[#E7E2D6] hover:border-[#14532D]/45'
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(199,166,106,0.14)] text-[#8F6531]">{Icon.funnel}</span>
        <span className="flex-1">
          <span className="block text-[10.5px] text-[#6F6A5C]">دسته‌بندی</span>
          <span className="block text-[14px] font-bold text-[#1C1B17]">{label}</span>
        </span>
        <span className={`text-[#6F6A5C] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>{Icon.chevron}</span>
      </button>

      <div
        role="listbox"
        className={`absolute start-0 top-full z-40 mt-2 max-h-[340px] w-full origin-top overflow-y-auto rounded-2xl border border-[#E7E2D6] bg-white p-1.5 shadow-[0_20px_44px_rgba(28,27,23,0.16)] transition-all duration-150 ${
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        {cats.map(it => {
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
export default function ManufacturerPage() {
  const params = useParams()
  const mfrId = (Array.isArray(params?.id) ? params.id[0] : params?.id) || DEFAULT_ID
  /* اول داده‌ی ایستا؛ اگر نبود، پروفایل ثبت‌نامی (پنل ⇒ localStorage) */
  const [storedMfr, setStoredMfr] = useState<ReturnType<typeof profileToManufacturer> | null>(null)
  /* نمای نگاشت‌شده برای ذخیره کافی نیست — پروفایل خام هم می‌ماند */
  const [rawP, setRawP]           = useState<ManufacturerProfile | null>(null)
  const [ownerId, setOwnerId]     = useState<string | null>(null)
  /* پرچم قطعی سرور — مقایسه‌ی مرورگر بی‌صدا شکست می‌خورد */
  const [mine, setMine]           = useState<boolean | undefined>(undefined)
  const { open: openImage, viewer: imageViewer } = useProfileImageViewer()
  const { open: openVideo, viewer: videoViewer } = useProfileVideoViewer()

  /* ⚠️ پیش از هر `return` شرطی — قاعده‌ی هوک‌ها */
  const edit = useOwnerEdit<ManufacturerProfile>('manufacturer', mfrId, rawP, ownerId, raw => {
    setRawP(raw); setStoredMfr(profileToManufacturer(raw))
  }, mine)
  const { gate: channelGate, ask: askChannel, publish: publishToChannel } = useChannelPublish('manufacturer', ownerId ?? undefined, edit.isOwner, notify)
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
        const base = `profiles/videos/${ownerId ?? 'anon'}/${vid}`
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
      if (shipped.length) void publishToChannel(shipped, String(rawP?.name ?? '')).catch(() => {})
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

  /* `checked` لازم است تا «پیدا نشد» پیش از رسیدن پاسخ سرور نشان
     داده نشود — وگرنه هر بار یک لحظه صفحه‌ی خطا می‌پرید بالا. */
  const [checked, setChecked] = useState(false)
  /* شبکه شکست، نه اینکه پروفایل نباشد */
  const [netFail, setNetFail] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  useEffect(() => {
    if (getManufacturer(mfrId)) { setChecked(true); return }

    setChecked(false)
    setNetFail(false)
    const p = getManufacturerProfile(mfrId)
    setStoredMfr(p ? profileToManufacturer(p) : null)

    let alive = true
    /* تولیدکننده‌ی ثبت‌نامی کاربران دیگر فقط روی سرور است */
    void (async () => {
      try {
        const r = await fetchProfileResult<ManufacturerProfile>('manufacturer', mfrId)
        if (!alive) return
        if (r.state === 'found') {
          const m = r.profile
          const raw = { ...m.data, slug: m.slug, verified: m.verified } as ManufacturerProfile
          setRawP(raw); setOwnerId(m.ownerId)
          setMine(r.isMine === true)
          setStoredMfr(profileToManufacturer(raw))
        } else if (r.state === 'error') {
          setNetFail(true)
        }
      } catch {
        /* `fetchProfileResult` خودش خطا را می‌گیرد؛ تور ایمنی است
           تا استثنای غیرمنتظره صفحه را به «پیدا نشد» نیندازد. */
        if (alive) setNetFail(true)
      } finally {
        if (alive) setChecked(true)
      }
    })()

    return () => { alive = false }
  }, [mfrId, reloadKey])

  /* ── آگهی‌های خودِ تولیدکننده ──
     «محصولات ما» بالاتر کاتالوگِ تولیدی است و فروش نیست؛ این
     فهرست آگهی‌هایی است که همین صاحبِ پروفایل در بیلیارد بازار
     ثبت کرده — چه تولیدیِ خودش باشد چه هر وسیله‌ی دیگری.

     ملاک شناسه‌ی مالک است نه نامکِ فروشگاه: تولیدکننده‌ای که
     فروشگاهِ تأییدشده ندارد، آگهیاش با `storeSlug` تهی ذخیره شده.

     ⚠️ `withoutStore` عمدی است: اگر همین شخص فروشگاه هم داشته
     باشد، آگهی‌اش جای خودش را در صفحه‌ی فروشگاه دارد و نباید
     این‌جا دوباره دیده شود. یک آگهی، یک جا. */
  const [ads, setAds] = useState<ShopProduct[]>([])
  const [adsLoading, setAdsLoading] = useState(false)
  const [adsError, setAdsError] = useState(false)
  /* شمارنده‌ی «تلاش دوباره» — تغییرش افکت را از نو اجرا می‌کند */
  const [adsKey, setAdsKey] = useState(0)

  useEffect(() => {
    if (!ownerId) { setAds([]); setAdsLoading(false); setAdsError(false); return }
    let alive = true
    setAdsLoading(true)
    setAdsError(false)
    void (async () => {
      try {
        const r = await fetchProductsByOwner(ownerId, { withoutStore: true })
        if (alive) setAds(r)
      } catch {
        /* خطا را می‌بلعیم ولی بی‌صدا نه: بخش خودش «تلاش دوباره»
           نشان می‌دهد. رها کردنش یعنی unhandled rejection. */
        if (alive) { setAds([]); setAdsError(true) }
      } finally {
        if (alive) setAdsLoading(false)
      }
    })()
    return () => { alive = false }
  }, [ownerId, adsKey])

  /* ── چرا `MANUFACTURERS[0]!` حذف شد ──
     آن آرایه‌ی نمایشی پیش از رونمایی خالی شد، پس این فالبک از آن روز
     `undefined` برمی‌گرداند و علامت `!` فقط تایپ‌چکر را ساکت می‌کرد.
     نتیجه: هر نشانی تولیدکننده‌ای که وجود نداشت، سر `mfr.city`
     می‌ترکید و کاربر صفحه‌ی «مشکلی پیش آمد» می‌دید — از جمله
     تولیدکننده‌ای که تازه ثبت‌نام کرده و هنوز ذخیره نشده بود. */
  const mfr = getManufacturer(mfrId) ?? storedMfr

  /* ── شماره‌ی تماس ──
     ⚠️ از منبعِ واحد (`iranTel`)، نه منطقِ دست‌سازِ این صفحه. نسخه‌ی
     قبلی هر شماره‌ی بدونِ صفر را کددار می‌کرد، ولی `iranTel` فقط
     شماره‌ی ۶ تا ۸ رقمیِ شهری را — یعنی همان تولیدکننده می‌توانست
     در فهرست و در پروفایل دو شماره‌ی متفاوت بگیرد.
     `mfr` تا پیش از گاردِ پایین می‌تواند تهی باشد، پس محاسبه باید
     بی‌خطر بماند. */
  const tel = iranTel(mfr?.phone, null, mfr?.city)
  const phoneDig  = tel.digits
  const phoneText = tel.text
  const phoneHref = tel.href

  /* آرایه‌ی تازه در هر رندر، وابستگی دو useMemo پایین را همیشه
     تغییریافته نشان می‌داد و فیلترها بی‌دلیل دوباره اجرا می‌شدند. */
  const PRODUCTS = useMemo(() => mfr?.products ?? [], [mfr])

  const [cat, setCat]     = useState<string>('all')
  const [page, setPage]   = useState(1)
  const [query, setQuery] = useState('')
  const [tab, setTab]     = useState<MfrTab>('about')
  const [openProd, setOpenProd] = useState<MfrProduct | null>(null)
  const onTabKey = useTabKeys(MFR_TABS.map(x => x.key), tab, setTab, 'mtab-')

  /* دسته‌بندی‌ها از خود محصولات */
  const cats = useMemo(() => {
    const counts = new Map<string, number>()
    PRODUCTS.forEach(p => counts.set(p.category, (counts.get(p.category) ?? 0) + 1))
    return [
      { key: 'all', label: 'همه محصولات', count: PRODUCTS.length },
      ...[...counts.entries()].map(([label, count]) => ({ key: label, label, count })),
    ]
  }, [PRODUCTS])

  const visible = useMemo(() => {
    const q = query.trim()
    return PRODUCTS.filter(p => {
      if (cat !== 'all' && p.category !== cat) return false
      if (q && !p.name.includes(q) && !p.category.includes(q)) return false
      return true
    })
  }, [PRODUCTS, cat, query])

  const PER_PAGE  = 10
  const pageCount = Math.max(1, Math.ceil(visible.length / PER_PAGE))
  const safePage  = Math.min(page, pageCount)
  const paged     = visible.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  useEffect(() => { setPage(1) }, [cat, query])

  const gridRef = useRef<HTMLDivElement>(null)
  const goToPage = (n: number) => {
    setPage(n)
    requestAnimationFrame(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  /* ── جایگاه این گارد اتفاقی نیست ──
     پس از **همه‌ی** هوک‌ها می‌آید. اگر بالاتر باشد، در رندری که
     پروفایل نیامده تعداد هوک‌ها کمتر می‌شود و React با «تغییر
     ترتیب هوک‌ها» می‌شکند. */
  /* یونیون تفکیک‌شده‌ی `ProfileMissing` یا هر دو پراپ را می‌خواهد یا
     هیچ‌کدام را — پس یک‌جا ساخته و پخش می‌شود. */
  const retryProps = netFail
    ? { netFail: true as const, onRetry: () => { setChecked(false); setReloadKey(k => k + 1) } }
    : {}
  if (!mfr) {
    /* ⚠️ پوسته‌ی بیرونی برداشته شد: `ProfileMissing` خودش همان پوسته
       را دارد و تودرتو که می‌شد، padding دو بار اعمال می‌شد — روی
       ۳۷۵px کارت به‌جای ۳۳۵ می‌شد ۲۹۵ پیکسل. */
    if (!checked) return <ProfileLoading />
    return (
      <ProfileMissing
        icon={<Factory size={34} />}
        title="تولیدکننده پیدا نشد"
        message="ممکن است این پروفایل هنوز ذخیره نشده، حذف شده، یا نشانی تغییر کرده باشد."
        backHref="/manufacturers" backLabel="بازگشت به تولیدکنندگان"
        {...retryProps}
      />
    )
  }

  /* ⚠️ واحد فقط به عددِ خالص می‌چسبد. `exportCountries` در داده‌ی
     واقعی گاهی *فهرستِ نام کشورهاست* نه تعداد، و نسخه‌ی قبلی
     کورکورانه «کشور» ته آن می‌گذاشت: «عراق، افغانستان، پاکستان
     کشور». ارقام فارسی هم عدد‌اند — رجکسِ فقط‌لاتین واحدِ «۱۲۰» را
     بی‌صدا می‌انداخت. */
  const withUnit = (v: unknown, unit: string) => {
    const s = String(v ?? '').trim()
    if (!s) return ''
    return /^[\d۰-۹٠-٩]+$/.test(s) ? `${toFa(s)} ${unit}` : toFa(s)
  }

  /* ⚠️ «سال تأسیس / پرسنل / تولید شده / محصول» این‌جا تکرار نمی‌شوند:
     هر چهارتا همین بالا داخلِ خودِ هدر هستند و کارتِ دومِ کناری فقط
     همان اعداد را دو بار نشان می‌داد. این‌جا فقط چیزی می‌ماند که
     هدر جا نداشت. */
  const FACTS = [
    { label: 'ظرفیت تولید', value: mfr.productionCapability ? toFa(mfr.productionCapability) : '' },
    { label: 'صادرات',      value: withUnit(mfr.exportCountries, 'کشور') },
  ].filter(s => s.value)

  const hasContact = !!(phoneDig || mfr.hours || mfr.whatsapp || mfr.instagram)

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F5F0] font-[Vazirmatn,Tahoma,sans-serif] text-[#1C1B17]">

      <style>{`
        /* ══ چیدمان — هم‌زبانِ صفحه‌ی باشگاه ══
           همان عرض (۱۲۰۰)، همان گریدِ «محتوا + ستونِ ۳۰۰ پیکسلی» و
           همان کارتِ شیشه‌ای. کلاس‌ها پیشوندِ mfr- دارند چون صفحه‌ی
           باشگاه هم استایلِ سراسری تزریق می‌کند و نامِ مشترک یعنی
           هرکدام دیرتر بیاید برنده شود.
           (بک‌تیک در این کامنت ممنوع — داخل template literal است) */
        .mfr-wrap { max-width: 1200px; margin: 0 auto; padding: clamp(16px,3vw,32px) clamp(12px,3vw,28px) 56px; }
        .mfr-tabbar { display: flex; justify-content: center; margin-bottom: 24px; }
        .mfr-grid { display: grid; grid-template-columns: minmax(0,1fr) 300px; gap: 28px; align-items: start; }
        .mfr-grid--solo { grid-template-columns: minmax(0,1fr); }
        @media (max-width: 960px) { .mfr-grid { grid-template-columns: minmax(0,1fr); } }
        .mfr-col { display: flex; flex-direction: column; gap: 14px; }
        .mfr-card { padding: clamp(16px,3vw,24px); }

        /* ── دو عددِ تأکیدیِ نوارِ آمارِ هدر ──
           نوار سفیدِ یکدست بود و چشم جایی برای نشستن نداشت.
           ⚠️ انتخابگر باید کاملِ زنجیره را بیاورد: قاعده‌ی شیتِ مشترک
           سه‌کلاسه است و با یک کلاسِ تنها وزنِ کمتری داشتیم و رنگ
           نمی‌نشست.
           (بک‌تیک در این کامنت ممنوع — داخل template literal است) */
        .ch-hero-stats .ch-stats li.mfr-st--felt b { color: #6FD3AC; }
        .ch-hero-stats .ch-stats li.mfr-st--gold b { color: var(--gold-light); }

        .mfr-h { display: flex; align-items: center; gap: 10px; margin: 0 0 12px; font-size: 17px; font-weight: 800; color: #111111; }
        .mfr-bar { flex-shrink: 0; width: 3px; height: 16px; border-radius: 2px; background: linear-gradient(135deg,#C7A66A,#A07840); }
        .mfr-p { margin: 0; font-size: 15px; line-height: 1.9; color: rgba(0,0,0,0.50); }
        .mfr-sub { display: block; margin-inline-start: 13px; font-size: 12.5px; color: rgba(0,0,0,0.40); }
        .mfr-none { margin: 0; padding: 26px 0; text-align: center; font-size: 13.5px; color: rgba(0,0,0,0.38); }

        /* دو حقیقتِ کوتاه که در نوارِ آمارِ هدر جا نشدند */
        .mfr-facts { list-style: none; margin: 16px 0 0; padding: 0;
          display: grid; grid-template-columns: repeat(auto-fit, minmax(190px,1fr)); gap: 10px; }
        .mfr-facts li { display: flex; flex-direction: column; gap: 3px; padding: 12px 14px; border-radius: 12px;
          background: rgba(199,166,106,0.06); border: 1px solid rgba(199,166,106,0.18); }
        .mfr-facts li > span { font-size: 12px; font-weight: 700; color: #8F6531; }
        .mfr-facts li > b { font-size: 14px; font-weight: 700; line-height: 1.7; color: rgba(0,0,0,0.55); }

        .mfr-feat { list-style: none; margin: 0; padding: 0;
          display: grid; grid-template-columns: repeat(auto-fill, minmax(190px,1fr)); gap: 10px; }
        .mfr-feat li { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 12px;
          font-size: 14px; color: rgba(0,0,0,0.55);
          background: rgba(20,83,45,0.05); border: 1px solid rgba(20,83,45,0.12); }
        .mfr-ok { display: inline-flex; flex-shrink: 0; color: #14532D; }

        .mfr-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .mfr-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 13px; border-radius: 999px;
          font-size: 12.5px; font-weight: 700; color: rgba(0,0,0,0.55);
          background: rgba(255,255,255,0.72); border: 1px solid rgba(17,17,16,0.08); }

        .mfr-addr { display: flex; gap: 8px; margin: 0 0 12px; font-size: 14px; line-height: 1.9; color: rgba(0,0,0,0.50); }
        .mfr-pin { flex-shrink: 0; margin-top: 3px; color: #14532D; }
        .mfr-map { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 12px;
          font-size: 13px; font-weight: 700; text-decoration: none; color: #8F6531;
          background: rgba(199,166,106,0.12); border: 1px solid rgba(199,166,106,0.34);
          transition: transform .2s cubic-bezier(.22,1,.36,1); }
        .mfr-map:hover { transform: translateY(-2px); }

        .mfr-ct { display: flex; flex-direction: column; gap: 10px; }
        .mfr-ct > a, .mfr-ct > div { display: flex; align-items: center; gap: 9px;
          font-size: 13.5px; color: rgba(0,0,0,0.55); text-decoration: none; }
        .mfr-ct > a:hover { color: #14532D; }
        .mfr-soc { display: flex; gap: 9px; margin-top: 4px; }
        .mfr-soc a { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 11px;
          color: #6F6A5C; background: rgba(26,25,23,0.05); border: 1px solid #E7E2D6;
          transition: transform .2s, border-color .2s, background .2s, color .2s; }
        .mfr-soc a:hover { transform: translateY(-2px); border-color: rgba(199,166,106,0.45);
          background: rgba(199,166,106,0.12); color: #C7A66A; }

        /* ── نوار ابزارِ محصولات ── */
        .mfr-toolbar { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 14px; margin-bottom: 18px; }
        .mfr-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
        .mfr-search { position: relative; }
        .mfr-search input { width: min(260px, 60vw); padding: 11px 14px; border-radius: 12px;
          font: inherit; font-size: 13.5px; color: #1C1B17;
          background: rgba(255,255,255,0.78); border: 1px solid rgba(17,17,16,0.10); }
        .mfr-search input::placeholder { color: rgba(0,0,0,0.34); }
        .mfr-search input:focus { outline: none; border-color: #14532D; }
        .mfr-search input:focus-visible { box-shadow: 0 0 0 3px rgba(20,83,45,0.14); }
        .mfr-search > span { position: absolute; inset-inline-end: 12px; top: 50%; transform: translateY(-50%);
          pointer-events: none; color: rgba(0,0,0,0.34); }
        .mfr-search input { padding-inline-end: 38px; }

        .mfr-cat { width: 230px; }
        .mfr-cat > div { width: 100%; max-width: none; }
        /* هم‌ارتفاع با سرچ — وگرنه دو کنترلِ کنار هم دو قدِ متفاوت دارند */
        .mfr-cat > div > button { height: 44px; padding-block: 0; }
        @media (max-width: 640px) {
          .mfr-toolbar { align-items: stretch; }
          .mfr-tools { width: 100%; }
          .mfr-search { flex: 1 1 auto; }
          .mfr-search input { width: 100%; }
          .mfr-cat { width: 100%; }
        }

        /* ── کارتِ محصول ── */
        .mfr-prods { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
        @media (min-width: 640px)  { .mfr-prods { grid-template-columns: repeat(3, minmax(0,1fr)); } }
        @media (min-width: 900px)  { .mfr-prods { grid-template-columns: repeat(4, minmax(0,1fr)); } }
        @media (min-width: 1120px) { .mfr-prods { grid-template-columns: repeat(5, minmax(0,1fr)); } }
        .mfr-prod { display: flex; flex-direction: column; overflow: hidden; border-radius: 16px;
          padding: 0; text-align: start; font: inherit; color: inherit; cursor: pointer;
          background: rgba(255,255,255,0.72); border: 1px solid rgba(17,17,16,0.07);
          box-shadow: 0 1px 2px rgba(17,17,16,0.04);
          transition: transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s, border-color .28s; }
        .mfr-prod:hover { transform: translateY(-3px); border-color: rgba(199,166,106,0.42);
          box-shadow: 0 18px 38px -16px rgba(17,17,16,0.26); }
        .mfr-prod:focus-visible { outline: 2px solid #14532D; outline-offset: 2px; }
        .mfr-prod-noimg { position: absolute; inset: 0; display: grid; place-items: center;
          font-size: 12px; color: rgba(0,0,0,0.30); }
        .mfr-prod-more { margin-top: 6px; font-size: 11px; font-weight: 700; color: #8F6531; }
        .mfr-prod-img { position: relative; aspect-ratio: 1 / 1; overflow: hidden; background: #F1EFEA; }
        .mfr-prod-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        /* ⚠️ inset-inline-start یعنی راست در RTL — همان جایی که نشانِ
           کارت‌های دیگرِ همین بخش می‌نشیند. با inset-inline-end به چپ
           می‌پرید و دو قاعده‌ی متفاوت برای یک نشان می‌ساخت.
           (بک‌تیک در این کامنت ممنوع — داخل template literal است) */
        .mfr-prod-badge { position: absolute; inset-inline-start: 10px; top: 10px; padding: 4px 10px; border-radius: 999px;
          font-size: 11px; font-weight: 800; color: #3a2800; background: rgba(199,166,106,0.94); }
        .mfr-prod-body { display: flex; flex: 1; flex-direction: column; gap: 4px; padding: 13px; }
        .mfr-prod-cat { font-size: 11px; font-weight: 800; color: #8F6531; }
        .mfr-prod-name { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          font-size: 13.5px; font-weight: 600; line-height: 1.5; color: #1C1C1A; }
        /* دو خط، نه یک خطِ بریده: حالا توضیحِ محصول این‌جا می‌آید و
           با nowrap عملا هیچ‌چیز خوانده نمی‌شد. */
        .mfr-prod-spec { margin-top: 4px; display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
          font-size: 11.5px; line-height: 1.65; color: rgba(0,0,0,0.42); }

        .mfr-empty { margin: 0; padding: 40px 0; text-align: center; font-size: 13.5px; color: rgba(0,0,0,0.38); }
        .mfr-reset { margin-inline-start: 8px; border: 0; background: none; font: inherit; font-weight: 800;
          color: #8F6531; cursor: pointer; }
        .mfr-reset:hover { opacity: .7; }
        .mfr-pager { display: flex; justify-content: center; gap: 8px; margin-top: 28px; }

        @media (prefers-reduced-motion: reduce) {
          .mfr-prod, .mfr-map, .mfr-soc a { transition: none; }
          .mfr-prod:hover, .mfr-map:hover, .mfr-soc a:hover { transform: none; }
        }
      `}</style>

      {/* ⚠️ بردکرامبِ جدا حذف شد: ProfileHero خودش یکی دارد و دوتا
          پشتِ هم روی صفحه تکرار دیده می‌شد. */}

      {/* ═══ هدر — همان کامپوننتِ مشترکِ صفحه‌ی مربی و داور ═══
          ⚠️ نسخه‌ی قبلی بنرِ سفید با کارتِ تخت بود و کنارِ صفحه‌ی مربی
          «ساده و معمولی» دیده می‌شد. حالا همان ProfileHero است، نه
          چیزی شبیهش — پس از فردا هم با آن دو از هم دور نمی‌شوند.

          ⚠️ عمدا بدونِ photo: این پروفایل لوگوی جدا ندارد و بنر
          تصویرِ کارخانه نیست. نبودنش یعنی نشانِ نقش (سوله) رندر
          می‌شود — همان چیزی که هدرِ قبلی هم نشان می‌داد.

          «تولیدکننده‌ی رسمی» هم از هدرِ قبلی نگه داشته شد؛ grade
          همان نشانِ طلاییِ هدرِ مشترک است. */}
      <ProfileHero
        name={mfr.name}
        /* ⚠️ فقط شهر. «تهران، تهران» چیزی به کسی نمی‌گفت — استان
           همان‌جا برای کدِ تلفن استفاده می‌شود، نه برای نمایش. */
        city={mfr.city}
        cover={mfr.bannerImage || undefined}
        /* بی‌بنر ⇒ صحنه‌ی کارگاه، نه سه توپ روی نمد */
        posterNode={<ManufacturerPoster />}
        verified={mfr.verified}
        grade={mfr.elite ? { label: 'تولیدکننده‌ی رسمی', dots: 0 } : undefined}
        disciplines={mfr.specialties.map(s => ({ label: s }))}
        onOpenPhoto={u => openImage(u, { title: mfr.name, alt: mfr.name })}
        role="manufacturer"
        backHref="/manufacturers" backLabel="تولیدکنندگان"
        publicUrl={`billiardhub.net/manufacturers/${mfrId}`}
        posterBase={undefined}
        stats={
          /* ⚠️ دو عددِ اول رنگ می‌گیرند، نه هر چهارتا: وقتی همه رنگی
             باشند هیچ‌کدام تأکید نیست. تعدادِ محصول سبزِ نمد و سالِ
             تأسیس طلاییِ سیستم — بقیه سفیدِ خنثی می‌مانند. */
          <ul className="ch-stats">
            {PRODUCTS.length > 0 && (
              <li className="mfr-st mfr-st--felt"><b>{faNum(PRODUCTS.length)}</b><span>محصول</span></li>
            )}
            {mfr.since && <li className="mfr-st mfr-st--gold"><b>{toFa(mfr.since)}</b><span>سال تأسیس</span></li>}
            {mfr.employees && mfr.employees !== '—' && <li><b>{toFa(mfr.employees)}</b><span>پرسنل</span></li>}
            {mfr.totalProduced && mfr.totalProduced !== '—' && <li><b>{toFa(mfr.totalProduced)}</b><span>تولید شده</span></li>}
          </ul>
        }
        actions={
          phoneDig ? (
            <a className="ch-hero-cta" href={`tel:${phoneHref}`}>
              {Icon.phone}<span dir="ltr" className={MONO}>{toFa(phoneText)}</span>
            </a>
          ) : undefined
        }
      />

      {/* ══ تب‌ها و محتوا — همان چیدمانی که صفحه‌ی باشگاه دارد ══
          پیش‌تر همه‌چیز پشتِ سرِ هم روی یک صفحه‌ی بلند می‌ریخت:
          محصولات، آگهی‌ها، «درباره ما»ی پوستردار، گالری و یک فوترِ
          چهارستونی که تماس و نشانی را دوباره تکرار می‌کرد. حالا
          همان نوارِ تبِ باشگاه، همان گریدِ دوستونی و همان کارت‌های
          شیشه‌ای (`lqg`) — یک زبانِ طراحی برای هر دو صفحه. */}
      <div className="mfr-wrap">
        <div className="mfr-tabbar">
          <div className="lq-seg lq-seg-fill" role="tablist" aria-label="بخش‌های تولیدکننده" onKeyDown={onTabKey}>
            {MFR_TABS.map(t => (
              <button
                key={t.key} type="button" role="tab"
                aria-selected={tab === t.key}
                id={`mtab-${t.key}`} aria-controls={`mpanel-${t.key}`}
                tabIndex={tab === t.key ? 0 : -1}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── درباره ما ──
            بدون کارتِ تماس، ستونِ کناری خالی می‌ماند و روی دسکتاپ ۳۰۰
            پیکسل فضای سفید می‌گذارد؛ آن‌وقت گرید تک‌ستونی است. */}
        {tab === 'about' && (
          <div className={'mfr-grid' + (hasContact ? '' : ' mfr-grid--solo')} id="mpanel-about" role="tabpanel" aria-labelledby="mtab-about">
            <div className="mfr-col">
              <section className="lqg lqg-hover mfr-card">
                <h2 className="mfr-h"><span className="mfr-bar" aria-hidden />درباره ما</h2>
                <p className="mfr-p">{mfr.about}</p>
                {FACTS.length > 0 && (
                  <ul className="mfr-facts">
                    {FACTS.map(f => (
                      <li key={f.label}>
                        <span>{f.label}</span>
                        <b>{f.value}</b>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {mfr.specialties.length > 0 && (
                <section className="lqg lqg-hover mfr-card">
                  <h2 className="mfr-h"><span className="mfr-bar" aria-hidden />تخصص‌های تولیدی</h2>
                  <ul className="mfr-feat">
                    {mfr.specialties.map(s => (
                      <li key={s}><span className="mfr-ok" aria-hidden>{Icon.check}</span>{s}</li>
                    ))}
                  </ul>
                </section>
              )}

              {mfr.certificates.length > 0 && (
                <section className="lqg lqg-hover mfr-card">
                  <h2 className="mfr-h"><span className="mfr-bar" aria-hidden />گواهینامه‌ها و استانداردها</h2>
                  <div className="mfr-chips">
                    {mfr.certificates.map((c, i) => (
                      <span key={i} className="mfr-chip" title={`${c.issuer} — ${toFa(c.year)}`}>
                        <span className="mfr-ok" aria-hidden>{Icon.check}</span>{c.title}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {mfr.address && (
                <section className="lqg lqg-hover mfr-card">
                  <h2 className="mfr-h"><span className="mfr-bar" aria-hidden />موقعیت کارخانه</h2>
                  <p className="mfr-addr"><span className="mfr-pin" aria-hidden>{Icon.pin}</span>{mfr.address}</p>
                  <a className="mfr-map" target="_blank" rel="noopener noreferrer"
                    href={`https://maps.google.com/?q=${encodeURIComponent(mfr.address)}`}>
                    <span aria-hidden>{Icon.pin}</span>مشاهده روی نقشه
                  </a>
                </section>
              )}
            </div>

            {hasContact && (
            <div className="mfr-col">
              <section className="lqg mfr-card">
                <h2 className="mfr-h"><span className="mfr-bar" aria-hidden />اطلاعات تماس</h2>
                <div className="mfr-ct">
                  {phoneDig && (
                    <a href={`tel:${phoneHref}`}>
                      <span className="mfr-ok" aria-hidden>{Icon.phone}</span>
                      <span className={MONO} dir="ltr">{toFa(phoneText)}</span>
                    </a>
                  )}
                  {mfr.hours && (
                    <div><span className="mfr-ok" aria-hidden>{Icon.clock}</span>{mfr.hours}</div>
                  )}
                  {(mfr.whatsapp || mfr.instagram) && (
                    <div className="mfr-soc">
                      {mfr.whatsapp && (
                        <a href={`https://wa.me/${mfr.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="واتساپ">{Icon.wa}</a>
                      )}
                      {mfr.instagram && (
                        <a href={`https://instagram.com/${mfr.instagram}`} target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام">{Icon.insta}</a>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>
            )}
          </div>
        )}

        {/* ── محصولات ما ── */}
        {tab === 'products' && (
          <div id="mpanel-products" role="tabpanel" aria-labelledby="mtab-products">
            <section className="lqg mfr-card">
              <div className="mfr-toolbar">
                <div>
                  <h2 className="mfr-h"><span className="mfr-bar" aria-hidden />محصولات ما</h2>
                  <span className="mfr-sub">{faNum(visible.length)} محصول</span>
                </div>
                <div className="mfr-tools">
                  <div className="mfr-search">
                    <label className="sr-only" htmlFor="mfr-q">جستجو در محصولات این تولیدکننده</label>
                    <input
                      id="mfr-q" type="search" value={query}
                      onChange={e => { setQuery(e.target.value); setPage(1) }}
                      placeholder="جستجو در محصولات…"
                    />
                    <span aria-hidden>{Icon.search}</span>
                  </div>
                  {/* ⚠️ پوششِ عرض‌دار لازم است: خودِ دراپ‌داون
                      `w-full max-w-[300px]` است و بدون این، یک سطرِ
                      کامل می‌گرفت و زیرِ سرچ می‌افتاد. */}
                  <div className="mfr-cat"><CategoryDropdown value={cat} onChange={setCat} cats={cats} /></div>
                </div>
              </div>

              <div ref={gridRef} className="mfr-prods" style={{ scrollMarginTop: 80 }}>
                {/* ⚠️ دکمه، نه `article`: کارت حالا باز می‌شود و باید
                    با کیبورد هم قابلِ رسیدن باشد. */}
                {paged.map((p: MfrProduct) => (
                  <button
                    key={p.id} type="button" className="mfr-prod group"
                    onClick={() => setOpenProd(p)}
                    aria-label={`جزئیات ${p.name}`}
                  >
                    <div className="mfr-prod-img">
                      {p.image
                        ? <img src={p.image} alt="" loading="lazy" className="transition-transform duration-500 group-hover:scale-[1.05]" />
                        : <span className="mfr-prod-noimg">بدون تصویر</span>}
                      {p.badge && <span className="mfr-prod-badge">{p.badge}</span>}
                    </div>
                    <div className="mfr-prod-body">
                      {p.category && <span className="mfr-prod-cat">{p.category}</span>}
                      <span className="mfr-prod-name">{p.name}</span>
                      {/* خلاصه‌ی کوتاه؛ باقیِ مشخصات داخلِ پنجره */}
                      {(p.description || p.specs[0]) && (
                        <span className="mfr-prod-spec">{p.description || p.specs[0]}</span>
                      )}
                      {p.specs.length > 0 && (
                        <span className="mfr-prod-more">{faNum(p.specs.length)} مشخصه</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* «هنوز محصولی ثبت نشده» با «فیلترت چیزی پیدا نکرد» یکی
                  نیست: اولی کارِ کاربر نیست و دکمه‌ی پاک‌کردن هم
                  نمی‌خواهد. */}
              {visible.length === 0 && (
                <p className="mfr-empty">
                  {PRODUCTS.length === 0
                    ? 'هنوز محصولی ثبت نشده است.'
                    : 'محصولی با این فیلتر پیدا نشد.'}
                  {PRODUCTS.length > 0 && (cat !== 'all' || query) && (
                    <button type="button" onClick={() => { setCat('all'); setQuery('') }} className="mfr-reset">
                      نمایش همه محصولات
                    </button>
                  )}
                </p>
              )}

              {pageCount > 1 && (
                <nav aria-label="صفحه‌بندی محصولات" className="mfr-pager">
                  <button type="button" onClick={() => goToPage(Math.max(1, safePage - 1))}
                    disabled={safePage === 1} aria-label="صفحه‌ی قبل"
                    className={`${LQ} ${LQ_NEUTRAL} flex h-9 w-9 items-center justify-center rounded-xl text-[#5B564B] disabled:cursor-not-allowed disabled:opacity-40`}>
                    <ChevronRight size={16} aria-hidden />
                  </button>
                  {Array.from({ length: pageCount }, (_, i) => (
                    <button key={i} type="button" onClick={() => goToPage(i + 1)}
                      aria-label={`صفحه‌ی ${toFa(i + 1)}`}
                      aria-current={safePage === i + 1 ? 'page' : undefined}
                      className={`${LQ} flex h-9 w-9 items-center justify-center rounded-xl text-[13px] ${
                        safePage === i + 1 ? `${LQ_FELT_ON} font-bold` : `${LQ_NEUTRAL} text-[#5B564B]`
                      } ${MONO}`}>
                      {toFa(i + 1)}
                    </button>
                  ))}
                  <button type="button" onClick={() => goToPage(Math.min(pageCount, safePage + 1))}
                    disabled={safePage === pageCount} aria-label="صفحه‌ی بعد"
                    className={`${LQ} ${LQ_NEUTRAL} flex h-9 w-9 items-center justify-center rounded-xl text-[#5B564B] disabled:cursor-not-allowed disabled:opacity-40`}>
                    <ChevronLeft size={16} aria-hidden />
                  </button>
                </nav>
              )}
            </section>
          </div>
        )}

        {/* ── آگهی‌های ما ── */}
        {tab === 'ads' && (
          <div id="mpanel-ads" role="tabpanel" aria-labelledby="mtab-ads">
            <OwnerAdsSection
              rows={ads}
              loading={adsLoading}
              error={adsError}
              onRetry={() => setAdsKey(k => k + 1)}
              title="آگهی‌های ما"
              searchPlaceholder="جستجو در آگهی‌های این تولیدکننده…"
            />
            {!adsLoading && !adsError && ads.length === 0 && (
              <section className="lqg mfr-card">
                <p className="mfr-none">هنوز آگهی‌ای ثبت نشده است.</p>
              </section>
            )}
          </div>
        )}

        {/* ── گالری ── */}
        {tab === 'gallery' && (
          <div id="mpanel-gallery" role="tabpanel" aria-labelledby="mtab-gallery">
            <ProfileGallery
              images={(mfr.gallery ?? []).map(sh => ({ id: sh.id, url: sh.url, caption: sh.caption ?? '', album: sh.album }))}
              videos={rawP?.videos ?? []}
              albumNames={rawP?.albums ?? []}
              onOpenImage={(urls, index, meta, ids) => openImage(urls, {
                index, ...meta,
                ...(edit.isOwner ? { onDelete: (i: number) => deleteShot(ids[i] ?? '') } : {}),
              })}
              onOpenVideo={v => openVideo(v, edit.isOwner ? { onDelete: () => deleteVideo(v.id), onEdit: () => editVideo(v) } : undefined)}
              canEdit={edit.isOwner} busy={edit.saving || vidBusy}
              onAddImages={addShots} onAddVideos={addVideoFiles} beforeAddVideos={() => askChannel(String(rawP?.name ?? ''))} onNewAlbum={newAlbum}
              onEditImage={editImage}
            />
            {edit.error && <p role="alert" style={{ fontSize: 12, color: '#b91c1c', marginTop: 10 }}>{edit.error}</p>}
          </div>
        )}
      </div>

      {openProd && (
        <ProductDialog
          product={openProd}
          maker={mfr.name}
          telHref={phoneHref || undefined}
          telText={phoneText ? toFa(phoneText) : undefined}
          onClose={() => setOpenProd(null)}
        />
      )}

      {imageViewer}
      {videoViewer}
      {channelGate}
      {videoEditDialog}
    </div>
  )
}

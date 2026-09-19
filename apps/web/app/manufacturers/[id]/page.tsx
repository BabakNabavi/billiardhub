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
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toFa, faNum, MONO, Icon, LQ, LQ_NEUTRAL, LQ_FELT_ON } from '../../sellers/[id]/shared'
import { getManufacturerProfile, profileToManufacturer } from '../../../lib/manufacturer-store'
import type { ManufacturerProfile } from '../../../lib/manufacturer-store'
import { fetchProfileResult } from '../../../lib/profiles/client'
import { useOwnerEdit } from '../../../lib/profiles/use-owner-edit'
import { compressImage } from '../../../lib/seller-store'
import { ask } from '../../../lib/ui/dialogs'
import ProfileHero from '../../../components/profile/ProfileHero'
import { Factory } from 'lucide-react'
import { telPrefix, provinceOfCity } from '../../../lib/iran-geo'
import { getManufacturer, type MfrProduct } from '../../../lib/manufacturers-data'
import OwnerAdsSection from '../../../components/market/OwnerAdsSection'
import { fetchProductsByOwner, type ShopProduct } from '../../shop/products'

const DEFAULT_ID = '1'

/* آیکون کارخانه (لوگوی پیش‌فرض) */

/* ─── اسلایدر عکس بنر ─── */

/* ════════ پوسترهای پیش‌فرض — به‌سبک هدر صفحه‌ی فروشگاه (وردمارک «بیلیارد هاب») ════════ */
const MFR_POSTERS = [
  { bg: 'linear-gradient(115deg,#0c1424 0%,#17253f 55%,#1e2f4d 100%)', sub: 'PROFESSIONAL MANUFACTURER' },
  { bg: 'linear-gradient(120deg,#07231a 0%,#0e3a2a 55%,#0a2f22 100%)', sub: 'TABLES · CUES · CLOTH'      },
  { bg: 'linear-gradient(120deg,#141414 0%,#26221d 55%,#17140f 100%)', sub: 'MADE IN IRAN · ساخت ایران'  },
  { bg: 'linear-gradient(120deg,#101c2b 0%,#14324a 55%,#0d2334 100%)', sub: 'ABOUT US · درباره ما'       },
]

function MfrPoster({ variant, title, about = false }: { variant: number; title?: string; about?: boolean }) {
  const p = MFR_POSTERS[variant % MFR_POSTERS.length]!
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
          <img loading="lazy" decoding="async" src="/images/Logo/bh-header-v8.png" alt="بیلیارد هاب" style={{ height: 'clamp(19px,3.2vw,34px)', width: 'auto' }}/>
          {title && <div style={{ fontSize: 'clamp(14px,2.5vw,23px)', fontWeight: 800, color: '#fff', lineHeight: 1.28, maxWidth: '94%', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</div>}
          {subtitleRow(true)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: p.bg }}>
      {layers}
      <div style={{ position: 'absolute', top: '50%', insetInlineEnd: 'clamp(22px,5vw,54px)', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 9, maxWidth: 'min(62%,520px)' }}>
        <img loading="lazy" decoding="async" src="/images/Logo/bh-header-v8.png" alt="بیلیارد هاب" style={{ height: 'clamp(22px,3.3vw,36px)', width: 'auto' }}/>
        {title && <div style={{ fontSize: 'clamp(15px,2.3vw,24px)', fontWeight: 800, color: '#fff', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</div>}
        {subtitleRow(false)}
      </div>
    </div>
  )
}


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
     فروشگاهِ تأییدشده ندارد، آگهیاش با `storeSlug` تهی ذخیره شده. */
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
        const r = await fetchProductsByOwner(ownerId)
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

  const province = provinceOfCity(mfr?.city ?? '')

  /* شماره‌ی تماس (شماره‌ها خودشان کد شهر دارند) */
  const areaCode  = telPrefix(province)
  /* `mfr` تا پیش از گارد پایین می‌تواند تهی باشد؛ این مقادیر فقط
     پس از آن گارد رندر می‌شوند، ولی محاسبه‌شان باید بی‌خطر بماند. */
  const phoneDig  = (mfr?.phone ?? '').replace(/\D/g, '')
  const withCode  = !!areaCode && !!phoneDig && !phoneDig.startsWith('0')
  const phoneText = withCode ? `${areaCode}-${phoneDig}` : (mfr?.phone ?? '')
  const phoneHref = withCode ? `${areaCode}${phoneDig}` : phoneDig

  /* آرایه‌ی تازه در هر رندر، وابستگی دو useMemo پایین را همیشه
     تغییریافته نشان می‌داد و فیلترها بی‌دلیل دوباره اجرا می‌شدند. */
  const PRODUCTS = useMemo(() => mfr?.products ?? [], [mfr])

  const [cat, setCat]     = useState<string>('all')
  const [page, setPage]   = useState(1)
  const [query, setQuery] = useState('')

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

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F5F0] font-[Vazirmatn,Tahoma,sans-serif] text-[#1C1B17]">

      <style>{`
        .prod-card-sec1 {
          aspect-ratio: 1 / 1.55;
          border-radius: 10px;
          border: 1.5px solid rgba(28,28,26,0.18);
          transition: transform .22s cubic-bezier(0.22,1,0.36,1), box-shadow .22s;
        }
        .prod-card-sec1:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(28,28,26,0.12); }
        .pc-name-sec1 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        @media(max-width:700px) { .prod-card-sec1 { aspect-ratio: 1 / 1.5; } }
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
        city={[province, mfr.city].filter(Boolean).join('، ')}
        cover={mfr.bannerImage || undefined}
        verified={mfr.verified}
        grade={mfr.elite ? { label: 'تولیدکننده‌ی رسمی', dots: 0 } : undefined}
        disciplines={mfr.specialties.map(s => ({ label: s }))}
        onOpenPhoto={u => openImage(u, { title: mfr.name, alt: mfr.name })}
        role="manufacturer"
        backHref="/manufacturers" backLabel="تولیدکنندگان"
        publicUrl={`billiardhub.net/manufacturers/${mfrId}`}
        posterBase={undefined}
        stats={
          <ul className="ch-stats">
            {PRODUCTS.length > 0 && (
              <li><b>{faNum(PRODUCTS.length)}</b><span>محصول</span></li>
            )}
            {mfr.since && <li><b>{toFa(mfr.since)}</b><span>سال تأسیس</span></li>}
            {mfr.employees && <li><b>{toFa(mfr.employees)}</b><span>پرسنل</span></li>}
            {mfr.totalProduced && <li><b>{toFa(mfr.totalProduced)}</b><span>تولید شده</span></li>}
          </ul>
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
        {/* سرچ */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1) }}
            placeholder="جستجو در محصولات این تولیدکننده..."
            className="w-full rounded-[10px] border border-[#E7E2D6] bg-white px-4 py-2.5 pl-11 text-[13.5px] text-[#1C1B17] placeholder:text-[#6F6A5C] focus:border-[#14532D] focus:outline-none"
          />
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F6A5C]">{Icon.search}</span>
        </div>
      </div>

      {/* ═══ محصولات تولیدکننده ═══ */}
      <div ref={gridRef} className="mx-auto max-w-[1240px] px-4 pb-16 pt-6 sm:px-6" style={{ scrollMarginTop: 80 }}>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">محصولات ما</h1>
            <span className="text-[12.5px] text-[#6F6A5C]">{faNum(visible.length)} محصول</span>
          </div>
          <CategoryDropdown value={cat} onChange={setCat} cats={cats} />
        </div>

        {/* گرید — ۵ ستون در دسکتاپ */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 min-[640px]:grid-cols-3 min-[900px]:grid-cols-4 min-[1120px]:grid-cols-5">
          {paged.map((p: MfrProduct) => (
            <article
              key={p.id}
              className="prod-card-sec1 group flex flex-col overflow-hidden bg-white"
            >
              <div className="relative shrink-0 basis-[58%] overflow-hidden border-b-[1.5px] border-[rgba(28,28,26,0.18)] bg-[#F4F3F1]">
                <img src={p.image} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"/>
                {p.badge && (
                  <span className="absolute right-2.5 top-2.5 rounded-full bg-[rgba(199,166,106,0.94)] px-2.5 py-1 text-[11px] font-bold text-[#3a2800]">{p.badge}</span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-1 p-[13px]">
                <span className="text-[11px] font-bold text-[#8F6531]">{p.category}</span>
                <span className="pc-name-sec1 text-[13.5px] font-semibold leading-[1.5] text-[#1C1C1A]">{p.name}</span>
                {p.specs[0] && <span className="mt-auto truncate text-[11.5px] text-[#6F6A5C]">{p.specs[0]}</span>}
              </div>
            </article>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="rounded-2xl border border-[#E7E2D6] bg-white px-6 py-14 text-center text-[13.5px] text-[#6F6A5C]">
            محصولی در این دسته‌بندی پیدا نشد.
            {cat !== 'all' && <button onClick={() => setCat('all')} className="mr-2 font-bold text-[#8F6531] transition hover:opacity-70">نمایش همه محصولات</button>}
          </div>
        )}

        {/* صفحه‌بندی */}
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

      {/* ═══ آگهی‌های ما — همان ویترینِ صفحه‌ی فروشنده ═══ */}
      <OwnerAdsSection
        rows={ads}
        loading={adsLoading}
        error={adsError}
        onRetry={() => setAdsKey(k => k + 1)}
        title="آگهی‌های ما"
        searchPlaceholder="جستجو در آگهی‌های این تولیدکننده…"
      />

      {/* ═══ درباره ما — ۱/۳ پوستر/عکس سمت راست، متن سمت چپ ═══ */}
      <div className="mx-auto max-w-[1240px] px-4 pb-14 sm:px-6">
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-[#E7E2D6] bg-white min-[760px]:grid-cols-[1fr_2fr]">
          <div className="relative min-h-[147px] bg-[#0a2a28] min-[760px]:min-h-[300px]">
            <MfrPoster variant={3} title={mfr.name} about />
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-8">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-4 w-[3px] rounded bg-gradient-to-b from-[#C7A66A] to-[#8A6020]" />
              <h3 className="text-[17px] font-bold sm:text-[19px]">درباره ما</h3>
            </div>
            <p className="text-[13.5px] leading-[2] text-[#5B564B]">{mfr.about}</p>

            {/* آمار کلیدی */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'سال تأسیس', value: mfr.since },
                { label: 'پرسنل', value: `${mfr.employees} نفر` },
                { label: 'تولید شده', value: `${mfr.totalProduced} عدد` },
                { label: 'صادرات', value: `${mfr.exportCountries} کشور` },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-[#EFEBE1] bg-[#FAFAF7] px-3 py-2.5 text-center">
                  <div className={`text-[15px] font-bold text-[#1C1B17] ${MONO}`}>{toFa(s.value)}</div>
                  <div className="mt-0.5 text-[11px] text-[#6F6A5C]">{s.label}</div>
                </div>
              ))}
            </div>

            {/* ظرفیت تولید */}
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[rgba(199,166,106,0.28)] bg-[rgba(199,166,106,0.08)] px-4 py-2.5 text-[12.5px] text-[#5B564B]">
              <span className="text-[#8F6531]">{Icon.truck}</span>
              <span><span className="font-bold text-[#8F6531]">ظرفیت تولید:</span> {mfr.productionCapability}</span>
            </div>

            {/* گواهینامه‌ها */}
            {mfr.certificates.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 text-[11px] font-bold tracking-[0.06em] text-[#A69F8E]">گواهینامه‌ها و استانداردها</div>
                <div className="flex flex-wrap gap-2">
                  {mfr.certificates.map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E2D6] bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#5B564B]" title={`${c.issuer} — ${c.year}`}>
                      <span className="text-[#14532D]">{Icon.check}</span>{c.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ گالری تولیدکننده — همان کامپوننت مشترک ═══ */}
      {((mfr.gallery?.length ?? 0) > 0 || (rawP?.videos?.length ?? 0) > 0 || edit.isOwner) && (
        <section className="px-4 pb-6 sm:px-6">
          <div className="mx-auto max-w-[1240px]">
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
        </section>
      )}

      {/* ═══ FOOTER — کارت اختصاصی تولیدکننده ═══ */}
      <footer className="px-4 pb-8 pt-2 sm:px-6">
        <div className="mx-auto max-w-[1240px] overflow-hidden rounded-2xl border border-[#E8E3D6] bg-[#FAFAF7] shadow-[0_4px_20px_rgba(28,27,23,0.05)]">
          <div className="grid grid-cols-1 gap-x-8 gap-y-[18px] p-[18px] sm:grid-cols-2 sm:gap-y-9 sm:p-8 lg:grid-cols-4">

            {/* برند */}
            <div>
              <div className="flex items-center gap-2.5 text-[16px] font-bold">
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_32%_30%,#2b2b2b,#0a0a0a_70%)]">
                  <span className="flex h-[13px] w-[13px] items-center justify-center rounded-full bg-white text-[8px] font-bold text-[#111]">۸</span>
                </span>
                {mfr.name}
              </div>
              <p className="mt-1.5 hidden max-w-[240px] text-[12.5px] leading-relaxed text-[#5B564B] sm:mt-3 sm:block">
                {mfr.description}
              </p>
            </div>

            {/* تخصص‌ها — روی موبایل حذف */}
            <div className="hidden sm:block">
              <h4 className="mb-2 text-[10.5px] font-bold tracking-[0.08em] text-[#A69F8E] sm:mb-4">تخصص‌های تولیدی</h4>
              <ul className="grid grid-cols-1 gap-y-3 text-[13px] text-[#5B564B]">
                {mfr.specialties.map(s => (
                  <li key={s} className="flex items-center gap-2">
                    <span className="text-[#14532D]">{Icon.check}</span>{s}
                  </li>
                ))}
              </ul>
            </div>

            {/* راه‌های ارتباطی */}
            <div>
              <h4 className="mb-2 text-[10.5px] font-bold tracking-[0.08em] text-[#A69F8E] sm:mb-4">راه‌های ارتباطی</h4>
              <ul className="space-y-1.5 text-[13px] text-[#5B564B] sm:space-y-3">
                <li>
                  <a href={`tel:${phoneHref}`} className={`flex items-center gap-2 py-0.5 transition-colors hover:text-[#14532D] ${MONO}`}>
                    <span className="text-[#14532D]">{Icon.phone}</span>{toFa(phoneText)}
                  </a>
                </li>
                <li className="flex items-center gap-2.5 py-0.5">
                  <span className="text-[#14532D]">{Icon.clock}</span>{mfr.hours}
                </li>
                <li className="flex items-center gap-2.5 pt-1.5 sm:pt-3">
                  <a href={`https://wa.me/${mfr.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="واتساپ"
                    className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-[#E7E2D6] bg-[rgba(26,25,23,0.05)] text-[#6F6A5C] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C7A66A]/45 hover:bg-[#C7A66A]/[0.12] hover:text-[#C7A66A]">
                    {Icon.wa}
                  </a>
                  <a href={`https://instagram.com/${mfr.instagram}`} target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام"
                    className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-[#E7E2D6] bg-[rgba(26,25,23,0.05)] text-[#6F6A5C] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C7A66A]/45 hover:bg-[#C7A66A]/[0.12] hover:text-[#C7A66A]">
                    {Icon.insta}
                  </a>
                </li>
              </ul>
            </div>

            {/* موقعیت */}
            <div>
              <h4 className="mb-2 text-[10.5px] font-bold tracking-[0.08em] text-[#A69F8E] sm:mb-4">موقعیت کارخانه</h4>
              <p className="mb-1.5 flex items-start gap-2 text-[13px] leading-relaxed text-[#5B564B] sm:mb-3">
                <span className="mt-0.5 shrink-0 text-[#14532D]">{Icon.pin}</span>
                {mfr.address}
              </p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(mfr.address)}`}
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

          <div className="border-t border-[#E8E3D6] px-6 py-4 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-[#6F6A5C]">
              <span>© {toFa(1405)} {mfr.name} — تمام حقوق محفوظ است</span>
              {/* نشان پلتفرم — فروشگاه فوتر خودش را دارد، ولی
                  بازدیدکننده باید بداند این صفحه کجا میزبانی می‌شود. */}
              <Link href="/" className="transition-colors hover:opacity-80">قدرت‌گرفته از بیلیارد <span className="font-bold text-[#C7A66A]">هاب</span></Link>
            </div>
          </div>
        </div>
      </footer>

      {imageViewer}
      {videoViewer}
      {channelGate}
      {videoEditDialog}
    </div>
  )
}

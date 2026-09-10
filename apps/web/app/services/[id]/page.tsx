'use client'

/* ─────────────────────────────────────────────────────────────
   پروفایل متخصص خدمات فنی.

   ── ایده‌ی صفحه: کارگاه ──
   نسخه‌ی پیش از این ادیتوریال بود — تیتر، خط نقطه‌چین، ردیف متنی —
   و نتیجه‌اش روزنامه شد نه وب‌سایت یک حرفه‌ای: صفحه فقط کاغذ سفید
   و متن مشکی و خط طلایی داشت، بدون هیچ *ماده*ای.

   حالا صفحه از مواد همین حرفه ساخته می‌شود — ماهوت، چوب، برنج —
   و هویت متخصص رویشان می‌نشیند. سه زمین متفاوت ریتم می‌سازند:
   سرلوحه‌ی روشن با قاب مادی ← خدمات روی کاغذ گرم ← بند پایانی
   ماهوتی.

   ── قاعده‌ی حاکم بر ساختار ──
   ⚠️ بخش، به‌خاطر *وجود داده* ساخته نمی‌شود. هر بخش باید چیزی
   بگوید که جای دیگری گفته نشده؛ وگرنه اصلا رندر نمی‌شود.

   سیستم بصری در `technician-profile.css`. داده از
   `lib/technicians-data` و `lib/technician-store`.
   ───────────────────────────────────────────────────────────── */
import { useChannelPublish, type PublishVideo } from '@/components/media/useChannelPublish'
import { toFaDigits } from '@/lib/jalali'
import { norm, keepLongest } from '@/lib/text-dedupe'
import { telNumber, waLink } from '@/lib/phone-wa'
import { resolveServices } from '@/lib/tech-services'
import { useVideoEdit } from '@/components/media/useVideoEdit'
import { detailTitle, type VideoDetail } from '@/lib/media/video-details'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { preload } from 'react-dom'
import { ProfileMissing, ProfileLoading } from '@/components/profile/ProfileMissing'
import { useProfileImageViewer } from '@/components/ProfileImageViewer'
import { useProfileVideoViewer } from '@/components/profile/ProfileVideoViewer'
import ProfileGallery from '@/components/profile/ProfileGallery'
import '@/components/profile/profile-page.css'
import { TechnicianServices } from '@/components/tech/market/TechnicianServices'
import '@/components/tech/market/market.css'
import '@/components/tech/market/market-profile.css'
import { HeroArt } from '@/components/tech/market/HeroArt'
import '@/components/tech/market/hero-art.css'
import '@/components/tech/market/ios.css'
import Link from 'next/link'
import { useParams } from 'next/navigation'
/* ⚠️ آیکون تزئینی نداریم: هر آیکونی که این‌جا می‌ماند یا ناوبری
   است یا کنش. `MapPin` و `Clock` با بازطراحی حذف شدند — شهر و
   ساعت، *متن*اند و آیکون چیزی به آن‌ها اضافه نمی‌کرد. */
import { Wrench, Phone, MapPin, Home, ClipboardList } from 'lucide-react'
import { getTechnician } from '../../../lib/technicians-data'
import { useOwnerEdit } from '../../../lib/profiles/use-owner-edit'
import { compressImage } from '../../../lib/seller-store'
import { uploadFile } from '../../../lib/supabase'
import { videoMeta, formatDuration } from '../../../lib/video-thumb'
import { ask, notify } from '../../../lib/ui/dialogs'
import { getTechnicianProfile, profileToTechnician, type TechnicianProfile } from '../../../lib/technician-store'
import { fetchProfileResult } from '../../../lib/profiles/client'
import VerifiedBadge from '../../../components/VerifiedBadge'
import PendingNotice from '../../../components/profile/PendingNotice'
import type { Technician } from '../../../lib/technicians-data'

/* آیکون واتساپ (هم‌خانواده‌ی فوتر فروشگاه) */
/* ⚠️ عدد ثابت ننویس: نوار بالا `paddingTop: env(safe-area-inset-top)`
   دارد و در حالت standalone آی‌اواس بلندتر از ۷۲ پیکسل می‌شود؛
   `rootMargin` هم `env()` نمی‌فهمد. پس ارتفاع از *خود* نوار
   پرسیده می‌شود. ۷۲ فقط پس‌افت نبود نوار است. */
const navOffset = () => {
  const nav = document.querySelector('body > nav, header nav')
  const h = nav?.getBoundingClientRect().height ?? 0
  return h > 0 ? Math.round(h) : 72
}

/* ⚠️ همان دلیل بالا، این بار برای CSS: `scroll-margin` لنگرها
   باید بداند نوار ثابت و نوار تب‌ها *واقعا* چقدر بلندند.
   مقدار پس‌افت در `market-profile.css` است؛ این‌جا فقط با
   اندازه‌ی اندازه‌گیری‌شده بازنویسی می‌شود. */
const useTopOffsets = (ref: RefObject<HTMLDivElement | null>, ready: boolean) => {
  useEffect(() => {
    const root = ref.current
    if (!root || !ready) return
    const tabs = root.querySelector('.tmp-tabs')
    const nav = document.querySelector('body > nav, header nav')
    const apply = () => {
      root.style.setProperty('--tmp-nav', `${navOffset()}px`)
      const th = tabs?.getBoundingClientRect().height ?? 0
      if (th > 0) root.style.setProperty('--tmp-tabs-h', `${Math.round(th)}px`)
    }
    apply()
    window.addEventListener('resize', apply)
    /* چرخش گوشی و باز شدن ناحیه‌ی امن هیچ‌کدام رویداد resize
       قابل‌اتکایی روی iOS نمی‌دهند؛ ناظر اندازه می‌دهد. ناوبر هم
       پاییده می‌شود: ارتفاعش با safe-area و ناوبری نرم عوض
       می‌شود و آن‌وقت لنگر کهنه می‌ماند. */
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(apply)
    if (ro && tabs) ro.observe(tabs)
    if (ro && nav) ro.observe(nav)
    return () => { window.removeEventListener('resize', apply); ro?.disconnect() }
  }, [ref, ready])
}

export default function TechnicianProfilePage() {
  /* ⚠️ در *اولین* رندر، پیش از رسیدن داده. `<link>` داخل JSX دیر
     بود: صفحه اول `ProfileLoading` را برمی‌گرداند، پس لینک تازه
     بعد از پاسخ شبکه به سند اضافه می‌شد.
     ⚠️ در `layout` هم گذاشته نمی‌شود: ۱۲۸ کیلوبایت روی *هر* صفحه‌ی
     سایت، برای فونتی که فقط همین‌جا استفاده می‌شود. */
  preload('/fonts/Estedad/Estedad-Variable.woff2',
    { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' })

  const params = useParams()
  const id = (Array.isArray(params?.id) ? params.id[0] : params?.id) ?? ''
  const staticTech = useMemo(() => getTechnician(id), [id])

  /* پروفایل‌های ثبت‌نامی (پنل ⇒ localStorage) بعد از mount خوانده می‌شوند */
  const [stored, setStored]   = useState<Technician | null>(null)
  const [checked, setChecked] = useState(false)
  /* وضعیت پروفایل سرور. سرور نسخه‌ی تأییدنشده را فقط به صاحبش
     و ادمین می‌دهد، پس اگر رسید یعنی حق دیدنش را داریم — ولی
     باید بداند دیگران نمی‌بینندش، وگرنه لینک را جایی می‌فرستد
     که همه «پیدا نشد» می‌گیرند. */
  const [pending, setPending] = useState(false)
  /* نمای نگاشت‌شده برای ویرایش کافی نیست — پروفایل خام هم می‌ماند */
  const [rawP, setRawP]       = useState<TechnicianProfile | null>(null)
  const [ownerId, setOwnerId] = useState<string | null>(null)
  /* پرچم قطعی سرور — مقایسه‌ی مرورگر بی‌صدا شکست می‌خورد */
  const [mine, setMine] = useState<boolean | undefined>(undefined)
  /* شبکه شکست، نه اینکه پروفایل نباشد */
  const [netFail, setNetFail] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const { open: openImage, viewer: imageViewer } = useProfileImageViewer()
  const { open: openVideo, viewer: videoViewer } = useProfileVideoViewer()
  /* ── چرا سرور هم خوانده می‌شود ──
     تا امروز این صفحه فقط `localStorage` را می‌خواند، یعنی پروفایل
     یک متخصص را تنها روی دستگاه خودش می‌شد دید. تیک آبی هم ستون
     جدول `profiles` است و اصلا در localStorage نیست، پس هرگز
     نمایش داده نمی‌شد. کش محلی به‌عنوان مقدار اولیه می‌ماند تا
     صفحه در نبود شبکه خالی نشود. */
  useEffect(() => {
    /* پیش از خروج زودهنگام: وگرنه `netFail` نامک قبلی کهنه می‌ماند. */
    setNetFail(false)
    if (staticTech) { setChecked(true); return }

    /* بازنشانی — همان دلیل صفحه‌ی بازیکن: پروفایل قبلی نباید زیر
       نشانی تازه بماند. */
    setChecked(false)
    const local = getTechnicianProfile(id)
    setStored(local ? profileToTechnician(local) : null)

    let alive = true
    void (async () => {
      try {
        const r = await fetchProfileResult<TechnicianProfile>('technician', id)
        if (!alive) return
        /* همان دلیل صفحه‌ی بازیکن: قضاوت دوباره‌ی کلاینت،
           پیش‌نمایش صاحب پروفایل را حذف می‌کرد. */
        if (r.state === 'found') {
          const p = r.profile
          setPending(p.status !== 'approved')
          const raw = { ...p.data, slug: p.slug, verified: p.verified } as TechnicianProfile
          setRawP(raw); setOwnerId(p.ownerId)
          setMine(r.isMine === true)
          setStored(profileToTechnician(raw))
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
  }, [id, staticTech, reloadKey])

  const tech = staticTech ?? stored
  /* کاتالوگ یک‌بار حل می‌شود: هم هیرو خلاصه‌اش را می‌خواهد، هم بخش
     خدمات خودش را. `resolveServices` مقادیر قدیمی را هم نگه می‌دارد. */
  const svc = useMemo(() => resolveServices(tech?.services), [tech?.services])

  /* ⚠️ پیش از هر `return` شرطی — وگرنه React #310 و صفحه‌ی سفید */
  const edit = useOwnerEdit<TechnicianProfile>('technician', id, rawP, ownerId, raw => {
    setRawP(raw); setStored(profileToTechnician(raw))
  }, mine)
  const { gate: channelGate, ask: askChannel, publish: publishToChannel } = useChannelPublish('technician', ownerId ?? undefined, edit.isOwner, notify)

  /* ── همان گالری مربی و داور ──
     ⚠️ این صفحه گالری خودش را داشت: نوار آلبوم، شبکه‌ی ماسونری و یک
     لایت‌باکس دست‌ساز. یعنی دو پیاده‌سازی برای یک چیز، با دو رفتار —
     همان دوباره‌کاری‌ای که بارها منبع باگ بوده. حالا کامپوننت مشترک
     رندر می‌کند و این‌جا فقط «چه چیزی ذخیره شود» می‌ماند. */
  const MAX_VIDEO_MB = 25
  const [vidBusy, setVidBusy] = useState(false)
  /* انتشار در بیلیارد مدیا — پنجره فقط وقتی باز می‌شود که کانال
     همین نقش نباشد. آپلود گالری هرگز به نتیجه‌اش وابسته نیست. */

  const addImages = async (files: File[], album?: string) => {
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
      if (shipped.length) void publishToChannel(shipped, String(tech?.name ?? '')).catch(() => {})
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

  const deleteImage = async (mid: string) => {
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

  /* ── کنش چسبان موبایل ──
     ⚠️ همیشه روی صفحه نیست: تا وقتی دکمه‌های سرلوحه دیده
     می‌شوند لازم نیست، و روی بند پایانی هم دو دکمه‌ی یکسان
     هم‌زمان می‌شد. `IntersectionObserver` هر دو را می‌پاید.
     ⚠️ پیش از هر `return` شرطی — وگرنه React #310. */
  const [dock, setDock] = useState(false)
  const [openAbout, setOpenAbout] = useState(false)
  /* تب فعال — فقط برای نشانه‌گذاری، ناوبری با لنگر است */
  const [sec, setSec] = useState('about')
  const heroActsRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef<HTMLDivElement | null>(null)
  /* ریشه‌ی صفحه — ناظر تب فعال و کنش چسبان از این‌جا می‌گردند.
     (پیش‌تر دامنه‌ی `gsap.context` بود؛ آن سیستم حذف شد.) */
  const stageRef = useRef<HTMLDivElement | null>(null)

  /* لنگر تب‌ها با ارتفاع واقعی نوارها هم‌تراز می‌شود */
  useTopOffsets(stageRef, Boolean(tech?.id))

  useEffect(() => {
    setDock(false)
    const acts = heroActsRef.current, close = closeRef.current
    if (!acts || !close) return
    const seen = new Set<Element>()
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        /* ⚠️ «هنوز نرسیده» با «رد شده» یکی نیست. بند پایانی در
           هر دو حالت قطع می‌شود، و بدون این تفکیک، کاربر وقتی از
           بند پایانی گذشت و به فوتر سایت رسید دوباره داک را
           می‌دید — دقیقا همان چیزی که این گارد برای جلوگیری از
           آن نوشته شده. */
        const passed = e.target === close && e.boundingClientRect.top < 0
        if (e.isIntersecting || passed) seen.add(e.target)
        else seen.delete(e.target)
      }
      setDock(seen.size === 0)
    }, { rootMargin: `-${navOffset()}px 0px 0px 0px` })
    io.observe(acts); io.observe(close)
    return () => io.disconnect()
  /* ⚠️ به `phone` بسته نمی‌شود: آن پایین‌تر — بعد از گاردهای
     شرطی — ساخته می‌شود و هوک باید *بالای* همه‌ی return‌ها بماند.
     نبود شماره خودش داک را رندر نمی‌کند، پس ناظر بی‌ضرر است. */
  }, [tech?.id])

  /* تب فعال از روی بخشی که در قاب دید است.
     threshold پایین چون بخش‌ها بلندترند از ویوپورت. */
  useEffect(() => {
    const ids = ['about', 'services', 'work', 'media', 'contact']
    const nodes = ids
      .map(i => document.getElementById(i))
      .filter((n): n is HTMLElement => Boolean(n))
    if (nodes.length === 0) return
    const io = new IntersectionObserver(entries => {
      const vis = entries.filter(e => e.isIntersecting)
      if (vis.length === 0) return
      const top = vis.reduce((a, b) =>
        a.boundingClientRect.top < b.boundingClientRect.top ? a : b)
      setSec(top.target.id)
    }, { rootMargin: `-${navOffset() + 56}px 0px -55% 0px`, threshold: 0 })
    for (const n of nodes) io.observe(n)
    return () => io.disconnect()
  }, [tech?.id])

  /* ⚠️ حرکت فقط وقتی راه می‌افتد که داده رسیده باشد: SplitText
     روی متنی که هنوز نیامده گره‌های خالی می‌سازد و نام هرگز ظاهر
     نمی‌شود. */

  /* یونیون تفکیک‌شده‌ی  یا هر دو را می‌خواهد یا
     هیچ‌کدام را — پس یک‌جا ساخته و پخش می‌شود. */
  const retryProps = netFail
    ? { netFail: true as const, onRetry: () => { setChecked(false); setReloadKey(k => k + 1) } }
    : {}
  if (!tech) {
    if (!checked) return <ProfileLoading />
    return (
      <ProfileMissing
        icon={<Wrench size={34} />}
        title="متخصص پیدا نشد"
        message="ممکن است این پروفایل حذف شده یا نشانی تغییر کرده باشد."
        backHref="/services" backLabel="بازگشت به خدمات فنی"
        {...retryProps}
      />
    )
  }

  /* ── چه چیزی گفته می‌شود و کجا ──
     ⚠️ یک گذر روی همه‌ی متن‌ها، نه دو گذر جدا: قاعده‌ی «بلندتر
     می‌ماند» باید در مرز عنوان/معرفی/درباره هم برقرار باشد.
     `keepLongest` جایگاه را نگه می‌دارد. */
  const slots = keepLongest([tech.title, tech.intro, ...tech.about])
  const [lede = '', second = ''] = slots.slice(0, 2).filter((x): x is string => !!x)
  const rest = slots.slice(2).filter((x): x is string => !!x)
  /* بخش «درباره» فقط وقتی که واقعا متنی برای خواندن باشد */
  const hasProse = rest.length > 1 || (rest[0]?.length ?? 0) >= 90
  const about = hasProse ? rest : []
  const claim = hasProse ? second : (second || rest[0] || '')

  /* ⚠️ همه‌جا `norm`: مقدار فقط‌فاصله در JS صادق است. */
  const club = norm(tech.club)
  const city = norm(tech.city)
  const hours = norm(tech.hours)
  const coverage = tech.coverage.map(norm).filter(c => c && c !== city)
  const delivery = [tech.onsite && 'در محل شما', tech.workshop && 'پذیرش در کارگاه']
    .filter((x): x is string => !!x)
  const meta: [string, string][] = [
    ...(club ? [['باشگاه / مجموعه', club] as [string, string]] : []),
    ...(coverage.length ? [['شهرهای تحت پوشش', coverage.join('، ')] as [string, string]] : []),
    ...(delivery.length ? [['نحوه‌ی ارائه', delivery.join(' · ')] as [string, string]] : []),
    ...(hours ? [['ساعت کاری', hours] as [string, string]] : []),
  ]

  /* ⚠️ ردیف بدون شماره ممکن است؛ کنشی که کار خودش را نمی‌کند از
     نبودنش بدتر است. */
  /* ⚠️ شماره‌ها از `norm` (که فقط فاصله را جمع می‌کند) به
     نرمال‌سازیِ واقعیِ شماره منتقل شدند. لینک واتساپ پیش‌تر مستقیم
     از مقدارِ خام ساخته می‌شد، پس «@» یا فاصله یا نشانی wa.me که
     کاربر پیست کرده بود داخل مسیر می‌رفت و پیام‌دادن کار نمی‌کرد.
     نامعتبر ⟵ رشته‌ی خالی ⟵ دکمه اصلا ساخته نمی‌شود. */
  const phone = telNumber(tech.phone)
  /* ⚠️ فقط نام خدمات *واقعی خودش*. هیچ کلمه‌ی تزئینی اضافه
     نمی‌شود — نوار محتواست، نه دکور.
     ⚠️ یکتا: یک عنوان می‌تواند در دو دسته تکرار شود و کلید تکراری
     در React خطاست.
     ⚠️ شرط بی‌شکاف‌بودن این است که **یک نسخه از خود نوار پهن‌تر
     باشد**، نه اینکه صرفا چند کلمه داشته باشد. نوار تمام‌عرض
     صفحه است، پس با ۶۰ نویسه (~۷ قلم، ~۱۵۰۰ پیکسل) روی نمایشگر
     ۱۹۲۰ ته هر دور یک حفره‌ی ~۴۰۰ پیکسلی باز می‌شد — دقیقا همان
     چیزی که این تکرار قرار بود جلویش را بگیرد. ۱۸۰ نویسه با
     محافظه‌کارانه‌ترین حدس عرض نویسه از ۱۹۲۰ رد می‌شود.
     ⚠️ سقف صریح حلقه: عنوان خالی در داده طول رشته را هرگز
     بالا نمی‌برد و رندر را قفل می‌کند. */

  /* ⚠️ `whatsapp || phone` کافی نبود: ردیفِ قدیمی می‌تواند مقدارِ
     *ناخالی ولی بی‌مصرف* داشته باشد («ندارم»، آی‌دی اینستاگرام،
     شماره‌ی خارجی). آن‌وقت شرط برقرار بود، `waNumber` خالی
     برمی‌گرداند و دکمه ناپدید می‌شد — با اینکه شماره‌ی موبایلِ
     معتبر در فیلدِ تماس بود. */
  const waMsg = `سلام ${tech.name} عزیز، از طریق بیلیارد هاب با شما تماس می‌گیرم.`
  const waText = waLink(tech.whatsapp, waMsg) || waLink(tech.phone, waMsg)

  /* تب‌ها فقط لنگرند، نه روتر: محتوا کوتاه است و صفحه‌ی جدا برای
     هر تب یعنی سه رفت‌وبرگشت اضافه روی شبکه‌ی کند. */
  const tabs: [string, string][] = [
    ['about', 'معرفی'],
    ['services', 'خدمات'],
    ...(tech.projects.length > 0 ? [['work', 'نمونه‌کارها'] as [string, string]] : []),
    ...(tech.gallery.length > 0 || tech.videos.length > 0
      ? [['media', 'گالری'] as [string, string]] : []),
    ['contact', 'اطلاعات تماس'],
  ]

  return (
    <div className="tm tmp" ref={stageRef}>
      {/* ⚠️ بازطراحی این را جا انداخته بود: متخصصی که پروفایلش
          هنوز تأیید نشده، صفحه‌ی عادی می‌دید و نمی‌فهمید لینکش
          برای کسی باز نمی‌شود. */}
      {pending && <PendingNotice what="پروفایل شما" />}

      {/* ═══════ سربرگ پروفایل ═══════ */}
      <header className="tmp-head">
        {/* ⚠️ پوسترِ این صفحه عمدا با صفحه‌ی خدمات فرق دارد: نور از
            سمت مقابل می‌آید و ترکیبش میدانِ ماهوت است نه چوب و
            کمان — تا دو صفحه از هم تشخیص داده شوند. */}
        <HeroArt variant="profile" />
        <div className="tm-wrap tmp-head-in">
          <nav aria-label="مسیر">
            <ol className="tmp-crumb">
              <li><Link href="/">خانه</Link></li>
              <li><Link href="/services">خدمات فنی</Link></li>
              <li aria-current="page">{tech.name}</li>
            </ol>
          </nav>

          <div className="tmp-id">
            <span className="tmp-ava" aria-hidden>
              {tech.photo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={tech.photo} alt="" decoding="async" />
                : tech.name.slice(0, 1)}
            </span>

            <div>
              <h1 className="tmp-name">
                {tech.name}
                {tech.verified && <VerifiedBadge title="متخصص تأیید شده" />}
              </h1>
              {lede && <p className="tmp-role">{lede}</p>}
              {/* ⚠️ آیکون‌ها داخل نشانِ رنگی می‌روند — همان زبانی که
                  کارت متخصص در دایرکتوری دارد. پیش‌تر خطی و هم‌رنگِ
                  متنِ کم‌رنگِ سربرگ بودند و عملا دیده نمی‌شدند. */}
              <p className="tmp-facts">
                {city && (
                  <span><i className="tm-ic tm-ic--city" aria-hidden><MapPin size={13} /></i>{city}</span>
                )}
                {tech.onsite && (
                  <span><i className="tm-ic tm-ic--onsite" aria-hidden><Home size={13} /></i>اعزام به محل</span>
                )}
                {tech.workshop && (
                  <span><i className="tm-ic tm-ic--shop" aria-hidden><Wrench size={13} /></i>پذیرش در کارگاه</span>
                )}
                {svc.count > 0 && (
                  <span><i className="tm-ic tm-ic--star" aria-hidden><ClipboardList size={13} /></i>{toFaDigits(String(svc.count))} خدمت ثبت‌شده</span>
                )}
              </p>
            </div>

            <div className="tmp-head-act" ref={heroActsRef}>
              {phone && (
                <a className="tm-btn tm-btn--gold" href={`tel:${phone}`}>
                  <Phone size={16} aria-hidden />درخواست خدمت
                </a>
              )}
              {waText && (
                <a className="tm-btn tm-btn--outline" href={waText} target="_blank" rel="noopener noreferrer">
                  واتساپ
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ═══════ تب‌ها ═══════ */}
      {/* ⚠️ همان نوارِ قطعه‌ایِ صفحه‌ی باشگاه و گالری (.lq-seg)، نه
          خط‌زیرِ اختصاصیِ این صفحه. سه جای سایت سه شکلِ متفاوت تب
          داشتند و هیچ دلیلی برایش نبود.
          ⚠️ ولی `<a href="#...">` می‌ماند: اینها لنگرِ درون‌صفحه‌اند
          نه تبِ واقعی با پنل. دکمه‌کردنشان لینکِ قابل‌اشتراک و
          باز‌کردن‌در‌تبِ‌جدید را از کاربر می‌گرفت. */}
      <nav className="tmp-tabs" aria-label="بخش‌های پروفایل">
        <div className="tm-wrap">
          <div className="lq-seg tmp-seg">
            {tabs.map(([id2, label]) => (
              <a key={id2} href={`#${id2}`} aria-current={sec === id2 ? 'true' : undefined}>{label}</a>
            ))}
          </div>
        </div>
      </nav>

      {/* ═══════ بدنه ═══════ */}
      <div className="tm-wrap tmp-body">
        <div className="tmp-main">
          {/* ── معرفی ── */}
          <section className="tmp-card" id="about" aria-labelledby="tmp-about-h">
            <h2 id="tmp-about-h">درباره متخصص</h2>
            {claim || about.length > 0 ? (
              <>
                <div className={`tmp-prose${openAbout ? '' : ' tmp-clamp'}`}>
                  {claim && <p>{claim}</p>}
                  {about.map((t, k) => <p key={k}>{t}</p>)}
                </div>
                {/* دکمه فقط وقتی متن واقعا بلند است */}
                {(about.length > 0 || (claim?.length ?? 0) > 220) && (
                  <button type="button" className="tmp-more" onClick={() => setOpenAbout(v => !v)}>
                    {openAbout ? 'بستن' : 'مشاهده بیشتر'}
                  </button>
                )}
              </>
            ) : (
              <p className="tmp-none">این متخصص هنوز معرفی‌ای ننوشته است.</p>
            )}

            {meta.length > 0 && (
              <dl className="tmp-facts-grid tmp-facts-mt">
                {meta.map(([k, v]) => (
                  <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
            )}
          </section>

          {/* ── خدمات ── */}
          <section className="tmp-card" id="services" aria-labelledby="tmp-svc-h">
            <h2 id="tmp-svc-h">خدمات</h2>
            <TechnicianServices data={svc} phone={phone || undefined} />
          </section>

          {/* ── نمونه‌کارها ── */}
          {tech.projects.length > 0 && (
            <section className="tmp-card" id="work" aria-labelledby="tmp-work-h">
              <h2 id="tmp-work-h">نمونه‌کارها</h2>
              <div className="tmp-work">
                {tech.projects.map(pr => (
                  <article key={pr.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pr.image} alt={pr.title} loading="lazy" decoding="async" />
                    <div className="tmp-work-b">
                      <span className="tmp-work-t">{pr.title}</span>
                      {pr.service && <span className="tmp-work-s">{pr.service}</span>}
                      {pr.desc && <span className="tmp-work-d">{pr.desc}</span>}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* ── گالری — همان کامپوننت مربی و داور ── */}
          {(tech.gallery.length > 0 || tech.videos.length > 0 || edit.isOwner) && (
            <section className="tmp-card" id="media">
              <ProfileGallery
                images={tech.gallery}
                videos={tech.videos}
                albumNames={tech.albums}
                onOpenImage={(urls, index, meta2, ids) => openImage(urls, {
                  index, ...meta2,
                  ...(edit.isOwner ? { onDelete: (i: number) => deleteImage(ids[i] ?? '') } : {}),
                })}
                onOpenVideo={v => openVideo(v, edit.isOwner
                  ? { onDelete: () => deleteVideo(v.id), onEdit: () => editVideo(v) }
                  : undefined)}
                canEdit={edit.isOwner} busy={edit.saving || vidBusy}
                onAddImages={addImages} onAddVideos={addVideoFiles}
                beforeAddVideos={() => askChannel(String(tech?.name ?? ''))}
                onNewAlbum={newAlbum}
              />
              {edit.error && <p role="alert" className="tmp-none">خطا: {edit.error}</p>}
            </section>
          )}

          {/* ── تماس ── */}
          <section className="tmp-card" id="contact" aria-labelledby="tmp-c-h" ref={closeRef}>
            <h2 id="tmp-c-h">اطلاعات تماس</h2>
            {phone || waText ? (
              <div className="tmp-row">
                {phone && (
                  <a className="tm-btn tm-btn--gold" href={`tel:${phone}`}>
                    <Phone size={16} aria-hidden />{toFaDigits(phone)}
                  </a>
                )}
                {waText && (
                  <a className="tm-btn tm-btn--outline" href={waText} target="_blank" rel="noopener noreferrer">
                    واتساپ
                  </a>
                )}
              </div>
            ) : (
              <p className="tmp-none">راه ارتباطی ثبت نشده است.</p>
            )}
            {coverage.length > 0 && (
              <>
                <h2 className="tmp-h2-mt">محدوده خدمات</h2>
                <ul className="tm-chips">
                  {city && <li className="tm-chip">{city}</li>}
                  {coverage.map(c => <li key={c} className="tm-chip">{c}</li>)}
                </ul>
              </>
            )}
          </section>
        </div>

        {/* ── پنل تماس چسبان (دسکتاپ) ── */}
        <aside className="tmp-panel" aria-label="تماس با متخصص">
          <h2>{tech.name}</h2>
          {lede && <p className="tmp-role">{lede}</p>}
          {phone && (
            <a className="tm-btn tm-btn--gold" href={`tel:${phone}`}>
              <Phone size={16} aria-hidden />درخواست خدمت
            </a>
          )}
          {waText && (
            <a className="tm-btn tm-btn--outline" href={waText} target="_blank" rel="noopener noreferrer">
              گفت‌وگو در واتساپ
            </a>
          )}
          {hours && <p className="tmp-panel-note">ساعت کاری: {hours}</p>}
        </aside>
      </div>

      {/* ── کنش چسبان موبایل ── */}
      {phone && (
        <div className="tmp-sticky" data-show={dock ? '1' : '0'} aria-hidden={!dock}>
          <a className="tm-btn tm-btn--gold" href={`tel:${phone}`} tabIndex={dock ? 0 : -1}>
            <Phone size={16} aria-hidden />درخواست خدمت
          </a>
          {waText && (
            <a className="tm-btn tm-btn--outline" href={waText} target="_blank" rel="noopener noreferrer"
              tabIndex={dock ? 0 : -1} aria-label="گفت‌وگو در واتساپ">واتساپ</a>
          )}
        </div>
      )}

      {imageViewer}
      {videoViewer}
      {channelGate}
      {videoEditDialog}
    </div>
  )
}

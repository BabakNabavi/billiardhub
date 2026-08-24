'use client'

/* ─────────────────────────────────────────────────────────────
   پروفایلِ متخصصِ خدماتِ فنی.

   ── ایده‌ی صفحه: کارگاه ──
   نسخه‌ی پیش از این ادیتوریال بود — تیتر، خطِ نقطه‌چین، ردیفِ متنی —
   و نتیجه‌اش روزنامه شد نه وب‌سایتِ یک حرفه‌ای: صفحه فقط کاغذِ سفید
   و متنِ مشکی و خطِ طلایی داشت، بدونِ هیچ *ماده*ای.

   حالا صفحه از موادِ همین حرفه ساخته می‌شود — ماهوت، چوب، برنج —
   و هویتِ متخصص رویشان می‌نشیند. سه زمینِ متفاوت ریتم می‌سازند:
   سرلوحه‌ی روشن با قابِ مادّی ← خدمات روی کاغذِ گرم ← بندِ پایانیِ
   ماهوتی.

   ── قاعده‌ی حاکم بر ساختار ──
   ⚠️ بخش، به‌خاطرِ *وجودِ داده* ساخته نمی‌شود. هر بخش باید چیزی
   بگوید که جای دیگری گفته نشده؛ وگرنه اصلاً رندر نمی‌شود.

   سیستمِ بصری در `technician-profile.css`. داده از
   `lib/technicians-data` و `lib/technician-store`.
   ───────────────────────────────────────────────────────────── */
import { useChannelPublish, type PublishVideo } from '@/components/media/useChannelPublish'
import { toFaDigits } from '@/lib/jalali'
import { norm, keepLongest } from '@/lib/text-dedupe'
import { resolveServices } from '@/lib/tech-services'
import { ServiceCatalog } from '@/components/tech/ServiceCatalog'
import { BenchPlate } from '@/components/tech/CraftPlate'
import { useTilt } from '@/components/tech/use-tilt'
import { useStageMotion } from '@/components/tech/use-stage-motion'
import '@/components/tech/craft-plate.css'
import { useVideoEdit } from '@/components/media/useVideoEdit'
import { detailTitle, type VideoDetail } from '@/lib/media/video-details'
import { useEffect, useMemo, useRef, useState } from 'react'
import { preload } from 'react-dom'
import { ProfileMissing, ProfileLoading } from '@/components/profile/ProfileMissing'
import { useProfileImageViewer } from '@/components/ProfileImageViewer'
import { useProfileVideoViewer } from '@/components/profile/ProfileVideoViewer'
import ProfileGallery from '@/components/profile/ProfileGallery'
import '@/components/profile/profile-page.css'
import './technician-profile.css'
import Link from 'next/link'
import { useParams } from 'next/navigation'
/* ⚠️ آیکونِ تزئینی نداریم: هر آیکونی که این‌جا می‌ماند یا ناوبری
   است یا کنش. `MapPin` و `Clock` با بازطراحی حذف شدند — شهر و
   ساعت، *متن*اند و آیکون چیزی به آن‌ها اضافه نمی‌کرد. */
import { Wrench, Phone } from 'lucide-react'
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
/* ⚠️ عددِ ثابت ننویس: نوارِ بالا `paddingTop: env(safe-area-inset-top)`
   دارد و در حالتِ standaloneِ آی‌اواس بلندتر از ۷۲ پیکسل می‌شود؛
   `rootMargin` هم `env()` نمی‌فهمد. پس ارتفاع از *خودِ* نوار
   پرسیده می‌شود. ۷۲ فقط پس‌افتِ نبودِ نوار است. */
const navOffset = () => {
  const nav = document.querySelector('body > nav, header nav')
  const h = nav?.getBoundingClientRect().height ?? 0
  return h > 0 ? Math.round(h) : 72
}

const WaIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.77.46 3.45 1.28 4.9L2 22l5.32-1.39a9.9 9.9 0 004.72 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.13-2.9-7A9.82 9.82 0 0012.04 2z"/></svg>
)

export default function TechnicianProfilePage() {
  /* ⚠️ در *اولین* رندر، پیش از رسیدنِ داده. `<link>`ِ داخلِ JSX دیر
     بود: صفحه اول `ProfileLoading` را برمی‌گرداند، پس لینک تازه
     بعد از پاسخِ شبکه به سند اضافه می‌شد.
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
  /* وضعیتِ پروفایلِ سرور. سرور نسخه‌ی تأییدنشده را فقط به صاحبش
     و ادمین می‌دهد، پس اگر رسید یعنی حقِ دیدنش را داریم — ولی
     باید بداند دیگران نمی‌بینندش، وگرنه لینک را جایی می‌فرستد
     که همه «پیدا نشد» می‌گیرند. */
  const [pending, setPending] = useState(false)
  /* نمای نگاشت‌شده برای ویرایش کافی نیست — پروفایلِ خام هم می‌ماند */
  const [rawP, setRawP]       = useState<TechnicianProfile | null>(null)
  const [ownerId, setOwnerId] = useState<string | null>(null)
  /* پرچمِ قطعیِ سرور — مقایسه‌ی مرورگر بی‌صدا شکست می‌خورد */
  const [mine, setMine] = useState<boolean | undefined>(undefined)
  /* شبکه شکست، نه اینکه پروفایل نباشد */
  const [netFail, setNetFail] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const { open: openImage, viewer: imageViewer } = useProfileImageViewer()
  const { open: openVideo, viewer: videoViewer } = useProfileVideoViewer()
  /* ── چرا سرور هم خوانده می‌شود ──
     تا امروز این صفحه فقط `localStorage` را می‌خواند، یعنی پروفایلِ
     یک متخصص را تنها روی دستگاهِ خودش می‌شد دید. تیکِ آبی هم ستونِ
     جدولِ `profiles` است و اصلاً در localStorage نیست، پس هرگز
     نمایش داده نمی‌شد. کشِ محلی به‌عنوان مقدارِ اولیه می‌ماند تا
     صفحه در نبودِ شبکه خالی نشود. */
  useEffect(() => {
    /* پیش از خروجِ زودهنگام: وگرنه `netFail`ِ نامکِ قبلی کهنه می‌ماند. */
    setNetFail(false)
    if (staticTech) { setChecked(true); return }

    /* بازنشانی — همان دلیلِ صفحه‌ی بازیکن: پروفایلِ قبلی نباید زیرِ
       نشانیِ تازه بماند. */
    setChecked(false)
    const local = getTechnicianProfile(id)
    setStored(local ? profileToTechnician(local) : null)

    let alive = true
    void (async () => {
      try {
        const r = await fetchProfileResult<TechnicianProfile>('technician', id)
        if (!alive) return
        /* همان دلیلِ صفحه‌ی بازیکن: قضاوتِ دوباره‌ی کلاینت،
           پیش‌نمایشِ صاحبِ پروفایل را حذف می‌کرد. */
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
        /* `fetchProfileResult` خودش خطا را می‌گیرد؛ تورِ ایمنی است
           تا استثنای غیرمنتظره صفحه را به «پیدا نشد» نیندازد. */
        if (alive) setNetFail(true)
      } finally {
        if (alive) setChecked(true)
      }
    })()

    return () => { alive = false }
  }, [id, staticTech, reloadKey])

  const tech = staticTech ?? stored
  /* کاتالوگ یک‌بار حل می‌شود: هم هیرو خلاصه‌اش را می‌خواهد، هم بخشِ
     خدمات خودش را. `resolveServices` مقادیرِ قدیمی را هم نگه می‌دارد. */
  const svc = useMemo(() => resolveServices(tech?.services), [tech?.services])

  /* ⚠️ پیش از هر `return`ِ شرطی — وگرنه React #310 و صفحه‌ی سفید */
  const edit = useOwnerEdit<TechnicianProfile>('technician', id, rawP, ownerId, raw => {
    setRawP(raw); setStored(profileToTechnician(raw))
  }, mine)
  const { gate: channelGate, ask: askChannel, publish: publishToChannel } = useChannelPublish('technician', ownerId ?? undefined, edit.isOwner, notify)

  /* ── همان گالریِ مربی و داور ──
     ⚠️ این صفحه گالریِ خودش را داشت: نوارِ آلبوم، شبکه‌ی ماسونری و یک
     لایت‌باکسِ دست‌ساز. یعنی دو پیاده‌سازی برای یک چیز، با دو رفتار —
     همان دوباره‌کاری‌ای که بارها منبعِ باگ بوده. حالا کامپوننتِ مشترک
     رندر می‌کند و این‌جا فقط «چه چیزی ذخیره شود» می‌ماند. */
  const MAX_VIDEO_MB = 25
  const [vidBusy, setVidBusy] = useState(false)
  /* انتشار در بیلیارد مدیا — پنجره فقط وقتی باز می‌شود که کانالِ
     همین نقش نباشد. آپلودِ گالری هرگز به نتیجه‌اش وابسته نیست. */

  const addImages = async (files: File[], album?: string) => {
    const items = await Promise.all(files.map(async fl => ({
      id: `m${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
      url: await compressImage(fl, 1000, 0.68),
      caption: '',
      ...(album ? { album } : {}),
    })))
    await edit.apply(d => ({ ...d, gallery: [...(d.gallery ?? []), ...items] }))
  }

  /* `details` از فرمِ مشخصات می‌آید (عنوان/دسته/توضیح). تا دیروز
     عنوان نامِ فایل بود و همان به مدیا می‌رفت. */
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
        /* «فقط در گالری بماند» یک تصمیمِ صریحِ کاربر است */
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
  /* ── ویرایشِ عنوانِ ویدیو ──
     عنوان دو نسخه دارد: ردیفِ گالریِ پروفایل و ردیفِ بیلیارد مدیا.
     هوک دومی را می‌زند، این تابع اولی را. کلید نشانیِ فایل است،
     چون گالری شناسه‌ی ردیفِ مدیا را ندارد. */
  const { dialog: videoEditDialog, edit: editVideo } = useVideoEdit(
    async (target, detail) => {
      /* ⚠️ `map` بدونِ تطبیق هم «موفق» برمی‌گردد. اگر نشانی جور نشود
         (کدگذاریِ متفاوت، ردیفِ بی‌url)، هوک «شد» می‌شنید و مدیا را
         عوض می‌کرد در حالی که گالری عنوانِ قبلی را نشان می‌دهد —
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

  /* ── کنشِ چسبانِ موبایل ──
     ⚠️ همیشه روی صفحه نیست: تا وقتی دکمه‌های سرلوحه دیده
     می‌شوند لازم نیست، و روی بندِ پایانی هم دو دکمه‌ی یکسان
     هم‌زمان می‌شد. `IntersectionObserver` هر دو را می‌پاید.
     ⚠️ پیش از هر `return`ِ شرطی — وگرنه React #310. */
  const [dock, setDock] = useState(false)
  const heroActsRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef<HTMLDivElement | null>(null)
  /* کجیِ سه‌بعدیِ قابِ نقشه + ورودِ بخش‌ها هنگامِ رسیدن به دید */
  const plateTilt = useTilt()
  /* ⚠️ رفرنسِ ریشه برای `gsap.context`: همه‌ی تایم‌لاین‌ها به این
     گره محدود می‌شوند تا `revert` واقعاً همه را بکشد. */
  const stageRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    setDock(false)
    const acts = heroActsRef.current, close = closeRef.current
    if (!acts || !close) return
    const seen = new Set<Element>()
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        /* ⚠️ «هنوز نرسیده» با «رد شده» یکی نیست. بندِ پایانی در
           هر دو حالت قطع می‌شود، و بدونِ این تفکیک، کاربر وقتی از
           بندِ پایانی گذشت و به فوترِ سایت رسید دوباره داک را
           می‌دید — دقیقاً همان چیزی که این گارد برای جلوگیری از
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
     نبودِ شماره خودش داک را رندر نمی‌کند، پس ناظر بی‌ضرر است. */
  }, [tech?.id])

  /* ⚠️ حرکت فقط وقتی راه می‌افتد که داده رسیده باشد: SplitText
     روی متنی که هنوز نیامده گره‌های خالی می‌سازد و نام هرگز ظاهر
     نمی‌شود. */
  useStageMotion(stageRef, tech ? `${tech.id}|${tech.name}` : '')

  /* یونیونِ تفکیک‌شده‌ی  یا هر دو را می‌خواهد یا
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
     ⚠️ یک گذر روی همه‌ی متن‌ها، نه دو گذرِ جدا: قاعده‌ی «بلندتر
     می‌ماند» باید در مرزِ عنوان/معرفی/درباره هم برقرار باشد.
     `keepLongest` جایگاه را نگه می‌دارد. */
  const slots = keepLongest([tech.title, tech.intro, ...tech.about])
  const [lede = '', second = ''] = slots.slice(0, 2).filter((x): x is string => !!x)
  const rest = slots.slice(2).filter((x): x is string => !!x)
  /* بخشِ «درباره» فقط وقتی که واقعاً متنی برای خواندن باشد */
  const hasProse = rest.length > 1 || (rest[0]?.length ?? 0) >= 90
  const about = hasProse ? rest : []
  const claim = hasProse ? second : (second || rest[0] || '')

  /* ⚠️ همه‌جا `norm`: مقدارِ فقط‌فاصله در JS صادق است. */
  const club = norm(tech.club)
  const city = norm(tech.city)
  const hours = norm(tech.hours)
  const coverage = tech.coverage.map(norm).filter(c => c && c !== city)
  const delivery = [tech.onsite && 'در محلِ شما', tech.workshop && 'پذیرش در کارگاه']
    .filter((x): x is string => !!x)
  const meta: [string, string][] = [
    ...(club ? [['باشگاه / مجموعه', club] as [string, string]] : []),
    ...(coverage.length ? [['شهرهای تحت پوشش', coverage.join('، ')] as [string, string]] : []),
    ...(delivery.length ? [['نحوه‌ی ارائه', delivery.join(' · ')] as [string, string]] : []),
    ...(hours ? [['ساعت کاری', hours] as [string, string]] : []),
  ]

  /* ⚠️ ردیفِ بدونِ شماره ممکن است؛ کنشی که کارِ خودش را نمی‌کند از
     نبودنش بدتر است. */
  const phone = norm(tech.phone)
  const wa = norm(tech.whatsapp)
  /* ⚠️ فقط نامِ خدماتِ *واقعیِ خودش*. هیچ کلمه‌ی تزئینی اضافه
     نمی‌شود — نوار محتواست، نه دکور.
     ⚠️ یکتا: یک عنوان می‌تواند در دو دسته تکرار شود و کلیدِ تکراری
     در React خطاست.
     ⚠️ شرطِ بی‌شکاف‌بودن این است که **یک نسخه از خودِ نوار پهن‌تر
     باشد**، نه اینکه صرفاً چند کلمه داشته باشد. نوار تمام‌عرضِ
     صفحه است، پس با ۶۰ نویسه (~۷ قلم، ~۱۵۰۰ پیکسل) روی نمایشگرِ
     ۱۹۲۰ ته هر دور یک حفره‌ی ~۴۰۰ پیکسلی باز می‌شد — دقیقاً همان
     چیزی که این تکرار قرار بود جلویش را بگیرد. ۱۸۰ نویسه با
     محافظه‌کارانه‌ترین حدسِ عرضِ نویسه از ۱۹۲۰ رد می‌شود.
     ⚠️ سقفِ صریحِ حلقه: عنوانِ خالی در داده طولِ رشته را هرگز
     بالا نمی‌برد و رندر را قفل می‌کند. */
  const titles = [...new Set(svc.categories.flatMap(c => c.services.map(x => x.title)))]
  const marquee: string[] = []
  if (titles.length > 0) {
    for (let i = 0; i < 40 && marquee.join('').length < 180; i++) marquee.push(...titles)
  }

  const waText = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(`سلام ${tech.name} عزیز، از طریق بیلیارد هاب با شما تماس می‌گیرم.`)}`
    : ''

  return (
    <div className="tpx" ref={stageRef}>
      {pending && <PendingNotice what="پروفایلِ شما" />}

      {/* ═══ صحنه ═══
          ⚠️ زمینِ تیره تمِ صفحه نیست؛ *صحنه* است: کارگاه زیرِ چراغ.
          محتوای خواندنی پایین‌تر روی کاغذِ روشن می‌نشیند. */}
      <div className="tpx-stage">
        <div className="tpx-wrap">
          <nav aria-label="مسیر">
            <ol className="tpx-crumb">
              <li><Link href="/">خانه</Link></li>
              <li><Link href="/services">خدمات فنی</Link></li>
              <li aria-current="page">{tech.name}</li>
            </ol>
          </nav>
        </div>

        <header className="tpx-hero">
          <div className="tpx-wrap tpx-hero-grid">
            <div className="tpx-id" data-anim="idcol">
              {/* ⚠️ `dir="auto"`: نامِ لاتین یا ترکیبی بعد از تقسیمِ SplitText
                  (که هر کلمه را `inline-block` می‌کند) ترتیبش برعکس
                  می‌شد. */}
              <h1 className="tpx-name" dir="auto" data-split>
                {tech.name}
                {tech.verified && <span className="vb"><VerifiedBadge title="متخصص تأیید شده" /></span>}
              </h1>
              {lede && <p className="tpx-lede" data-anim="lede">{lede}</p>}
              {claim && <p className="tpx-intro" data-anim="intro">{claim}</p>}

              {/* ⚠️ هیچ عددِ ساختگی: فقط شهر و شمارِ خدماتِ واقعی.
                  «۱۵ سال تجربه» و «۵۰۰ پروژه» ساخته نمی‌شود. */}
              {/* ⚠️ بدونِ این شرط، پروفایلی بی‌شهر و بی‌خدمت یک
                  `<dl>`ِ خالی می‌ساخت: دو خطِ طلاییِ چسبیده به هم
                  و یک شکافِ اضافه در سرلوحه. */}
              {((city && city !== '—') || svc.count > 0) && (
              <dl className="tpx-stats">
                {city && city !== '—' && (
                  <div data-anim="stat">
                    <dt>شهر</dt>
                    <dd>{city}</dd>
                  </div>
                )}
                {/* ⚠️ `|| 1` حذف شد: پروفایلی که همه‌ی خدماتش قدیمی و
                    نگاشت‌نشده‌اند `categories.length === 0` دارد ولی
                    `count > 0` — و آن `|| 1` عددِ «۱ رشته» را از هوا
                    می‌ساخت. عددِ ساخته‌شده همان چیزی است که قاعده‌ی
                    خودمان ممنوع کرده. */}
                {svc.categories.length > 0 && (
                  <div data-anim="stat">
                    <dt>رشته</dt>
                    <dd>{toFaDigits(svc.categories.length)}</dd>
                  </div>
                )}
                {svc.count > 0 && (
                  <div data-anim="stat">
                    <dt>خدمات</dt>
                    <dd>{toFaDigits(svc.count)}</dd>
                  </div>
                )}
              </dl>
              )}

              <div className="tpx-acts" ref={heroActsRef}>
                {phone && <a className="tpx-btn solid" data-anim="act" href={`tel:${phone}`}><Phone size={16} aria-hidden /> ارتباط با متخصص</a>}
                {waText && <a className="tpx-btn ghost" data-anim="act" href={waText} target="_blank" rel="noopener noreferrer">{WaIcon} واتساپ</a>}
              </div>
            </div>

            {/* ⚠️ نقشه‌ی فنیِ رسم‌شده، نه عکس. عکسِ کارِ دیگران روی
                صفحه‌ی این شخص ادعای دروغ است و عکسِ استوک صفحه را
                ارزان می‌کند. این‌جا همان چیزی کشیده می‌شود که او
                رویش کار می‌کند. */}
            <figure className="tpx-plate" data-plate>
              <div className="tpx-plate-in" ref={plateTilt.ref}>
                <BenchPlate />
              </div>
              <figcaption>نقشه‌ی فنی — میز و چوبِ بیلیارد</figcaption>
            </figure>
          </div>
        </header>

        {/* ═══ نوارِ حرکتی ═══
            ⚠️ فهرست دو بار تکرار می‌شود چون انیمیشن نصفِ عرض را
            جابه‌جا می‌کند: بدونِ نسخه‌ی دوم، وسطِ حلقه شکاف می‌افتد.

            ⚠️ **کلِ نوار `aria-hidden` است، نه فقط نسخه‌ی دوم.**
            نسخه‌ی اول هم خودش تکرارِ پرکننده است؛ متخصصی با یک
            خدمت باعث می‌شد صفحه‌خوان همان عنوان را هفت بار بخواند.
            همین عنوان‌ها پایین‌تر در فهرستِ خدمات یک‌بار و درست
            اعلام می‌شوند — این نوار تزئینِ همان داده است.

            ⚠️ لایه‌ی `-skew` جداست چون انیمیشنِ CSS و GSAP هر دو
            `transform` می‌نویسند و **اعلانِ انیمیشنِ CSS در آبشار
            بالاتر از استایلِ اینلاین است**: روی یک عنصر، اسکیو
            هرگز دیده نمی‌شد و هر به‌روزرسانی مبدأ حلقه را جابه‌جا
            می‌کرد. حالا حلقه روی `ul` است و اسکیو روی والدش. */}
        {marquee.length > 0 && (
          <div className="tpx-marquee" data-marquee aria-hidden>
            <div className="tpx-marquee-skew">
              {/* ⚠️ مقدارِ محاسبه‌شده، پس اینلاین مجاز است: مدتِ ثابت
                  یعنی نوارِ یک-خدمتی و نوارِ هجده-خدمتی با دو سرعتِ
                  کاملاً متفاوت می‌دوند. */}
              <ul style={{ ['--dur' as string]: `${Math.round(marquee.length * 1.7)}s` }}>
                {marquee.map((t, i) => <li key={i}>{t}</li>)}
                {marquee.map((t, i) => <li key={`b${i}`}>{t}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ═══ بخشِ روشن: خواندنی ═══ */}
      <div className="tpx-light">
        {(hasProse || meta.length > 0) && (
          <section className="tpx-sec" data-reveal>
            <div className="tpx-wrap">
              {hasProse && (
                <div className="tpx-about">
                  <p className="tpx-claim">{about[0]}</p>
                  {about.length > 1 && (
                    <div className="tpx-prose">
                      {about.slice(1).map((p, i) => <p key={i}>{p}</p>)}
                    </div>
                  )}
                </div>
              )}
              {meta.length > 0 && (
                <dl className="tpx-meta">
                  {meta.map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </section>
        )}

        {svc.count > 0 && (
          <section className="tpx-sec" data-reveal>
            <div className="tpx-wrap">
              <div className="tpx-sec-head">
                <h2>رشته‌های تخصصی</h2>
                <p>آنچه {tech.name} انجام می‌دهد — فقط خدماتی که خودش انتخاب کرده است.</p>
              </div>
              <ServiceCatalog data={svc} />
            </div>
          </section>
        )}

        {tech.projects.length > 0 && (
          <section className="tpx-sec" data-reveal>
            <div className="tpx-wrap">
              <div className="tpx-sec-head"><h2>نمونه‌کارها</h2></div>
              <div className="tpx-work">
                {tech.projects.map(p => (
                  <figure key={p.id}>
                    <div className="im"><img src={p.image} alt={p.title} loading="lazy" decoding="async" /></div>
                    <figcaption>
                      <div className="kind">{p.service}</div>
                      <h3>{p.title}</h3>
                      <p>{p.desc}</p>
                      <div className="where">{p.city}{p.club ? ` — ${p.club}` : ''}</div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══ گالری — همان کامپوننتِ مربی و داور ═══ */}
        {(tech.gallery.length > 0 || tech.videos.length > 0 || edit.isOwner) && (
          <section className="tpx-sec">
            <div className="tpx-wrap">
              <ProfileGallery
                images={tech.gallery}
                videos={tech.videos}
                /* از نمای نرمال‌شده می‌آید، نه ردیفِ خام: ردیفِ پیش از مهاجرت
                   هنوز آلبومِ شیئی دارد و نامِ آلبوم آن‌جا نیست. */
                albumNames={tech.albums}
                onOpenImage={(urls, index, meta2, ids) => openImage(urls, {
                  index, ...meta2,
                  ...(edit.isOwner ? { onDelete: (i: number) => deleteImage(ids[i] ?? '') } : {}),
                })}
                onOpenVideo={v => openVideo(v, edit.isOwner ? { onDelete: () => deleteVideo(v.id), onEdit: () => editVideo(v) } : undefined)}
                canEdit={edit.isOwner} busy={edit.saving || vidBusy}
                onAddImages={addImages} onAddVideos={addVideoFiles} beforeAddVideos={() => askChannel(String(tech?.name ?? ''))} onNewAlbum={newAlbum}
              />
              {edit.error && <p role="alert" className="tpx-err">خطا: {edit.error}</p>}
            </div>
          </section>
        )}
      </div>

      {/* ═══ نتیجه‌گیری — برگشت به صحنه ═══ */}
      <section className="tpx-stage tpx-close">
        <div className="tpx-wrap inner" ref={closeRef}>
          <div>
            <h2>نیاز به تعمیر یا سرویس دارید؟</h2>
            <p>برای هماهنگی و مشاوره، مستقیم با {tech.name} در ارتباط باشید.</p>
          </div>
          <div className="tpx-acts">
            {phone && <a className="tpx-btn solid" data-anim="act" href={`tel:${phone}`}><Phone size={16} aria-hidden /> درخواست خدمات</a>}
            {waText && <a className="tpx-btn ghost" data-anim="act" href={waText} target="_blank" rel="noopener noreferrer">{WaIcon} گفت‌وگو در واتساپ</a>}
          </div>
        </div>
      </section>

      {/* ═══ داکِ شیشه‌ای — تنها لایه‌ی کنترلِ شناور ═══ */}
      {phone && (
        <div className="tpx-dock" data-show={dock ? '1' : '0'} aria-hidden={!dock}>
          <a className="tpx-btn solid" href={`tel:${phone}`} tabIndex={dock ? 0 : -1}>
            <Phone size={16} aria-hidden /> ارتباط با متخصص
          </a>
          {waText && (
            <a className="tpx-btn ghost" href={waText} target="_blank" rel="noopener noreferrer" tabIndex={dock ? 0 : -1}
              aria-label="گفت‌وگو در واتساپ">
              {WaIcon}
            </a>
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

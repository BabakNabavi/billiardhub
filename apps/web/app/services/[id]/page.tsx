'use client'

/* ─────────────────────────────────────────────────────────────
   پروفایلِ متخصصِ خدماتِ فنی.

   ── ایده‌ی صفحه ──
   «فهرستِ کارِ یک صنعتگر»، نه یک ردیف در دایرکتوری. سرلوحه‌ی
   تایپوگرافیک → درباره → کاتالوگِ خدمات (ستونِ فقرات) → نمونه‌کار →
   گالری → مشخصاتِ کار → بندِ پایانیِ تماس.

   ── قاعده‌ی حاکم بر ساختار ──
   ⚠️ بخش، به‌خاطرِ *وجودِ داده* ساخته نمی‌شود. هر بخش باید چیزی
   بگوید که جای دیگری گفته نشده؛ وگرنه اصلاً رندر نمی‌شود. با
   دادهٔ کمِ امروز صفحه چهار حرکت دارد و همان چهار حرکت هم عمدی به
   نظر می‌رسد — این معیارِ طراحی است، نه پیامدِ خالی‌بودن.

   سیستمِ بصری در `technician-profile.css` است. داده از
   `lib/technicians-data` و `lib/technician-store`.
   ───────────────────────────────────────────────────────────── */

import { useChannelPublish, type PublishVideo } from '@/components/media/useChannelPublish'
import { toFaDigits } from '@/lib/jalali'
import { norm, keepLongest } from '@/lib/text-dedupe'
import { resolveServices } from '@/lib/tech-services'
import { ServiceCatalog } from '@/components/tech/ServiceCatalog'
import { useVideoEdit } from '@/components/media/useVideoEdit'
import { detailTitle, type VideoDetail } from '@/lib/media/video-details'
import { Fragment, useEffect, useMemo, useState } from 'react'
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
const WaIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.77.46 3.45 1.28 4.9L2 22l5.32-1.39a9.9 9.9 0 004.72 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.13-2.9-7A9.82 9.82 0 0012.04 2z"/></svg>
)

export default function TechnicianProfilePage() {
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
     ⚠️ **یک گذر روی همه‌ی متن‌ها**، نه دو گذرِ جدا. عنوان، معرفی و
     بندهای «درباره» با هم سنجیده می‌شوند تا قاعده‌ی «بلندتر
     می‌ماند» در مرزِ بینشان هم برقرار باشد. دو گذرِ جدا این را
     می‌شکست: با `title=«خدمات فنی»` و
     `about=[«خدمات فنی بیلیارد و اسنوکر»]` بندِ درباره حذف می‌شد
     و «و اسنوکر» از صفحه می‌رفت.

     `keepLongest` جایگاه را نگه می‌دارد، پس دو خانه‌ی اول همچنان
     سرلوحه‌اند و بقیه «درباره». */
  const slots = keepLongest([tech.title, tech.intro, ...tech.about])
  const [lede = '', introTxt = ''] = slots.slice(0, 2).filter((x): x is string => !!x)
  const about = slots.slice(2).filter((x): x is string => !!x)

  /* ── بخشِ «فعالیت» فقط وقتی وجود دارد که چیزی برای گفتن باشد ──
     شهر از قبل در سرلوحه است. اگر پوشش همان شهر باشد و ساعت و نحوه
     خالی، این بخش هیچ اطلاعاتِ تازه‌ای ندارد — پس اصلاً ساخته
     نمی‌شود. بخش‌سازی به‌خاطرِ *وجودِ داده*، همان چیزی است که صفحه را
     به فهرستِ قاب تبدیل می‌کند. */
  /* ⚠️ همه‌جا `norm`: مقدارِ فقط‌فاصله در JS صادق است و بدونِ این،
     یک سطرِ خالی با خطِ زیرش رندر می‌شد.
     و پوششِ نمایش‌داده‌شده همان چیزی است که فیلتر شده — نه آرایه‌ی
     خام، وگرنه «، »های سرگردان می‌ماند. */
  const club = norm(tech.club)
  const city = norm(tech.city)
  const hours = norm(tech.hours)
  const coverage = tech.coverage.map(norm).filter(c => c && c !== city)
  const delivery = [tech.onsite && 'در محلِ شما', tech.workshop && 'پذیرش در کارگاه']
    .filter((x): x is string => !!x)
  const facts: [string, string][] = [
    ...(club ? [['باشگاه / مجموعه', club] as [string, string]] : []),
    ...(coverage.length ? [['شهرهای تحت پوشش', coverage.join('، ')] as [string, string]] : []),
    ...(delivery.length ? [['نحوه‌ی ارائه', delivery.join(' · ')] as [string, string]] : []),
    ...(hours ? [['ساعت کاری', hours] as [string, string]] : []),
  ]

  /* ⚠️ ردیفِ بدونِ شماره ممکن است: `profileToTechnician` هرچه بود
     رد می‌کند. بدونِ گارد، دکمه‌ها `tel:undefined` و `wa.me/`
     می‌شوند — کنشی که کارِ خودش را نمی‌کند، بدتر از نبودنش است. */
  const phone = norm(tech.phone)
  const waHref = norm(tech.whatsapp) ? `https://wa.me/${norm(tech.whatsapp)}` : ''

  return (
    <div className="tpx">
      {pending && <PendingNotice what="پروفایلِ شما" />}

      <div className="tpx-wrap">
        {/* ⚠️ فهرستِ مرتب، نه چند لینکِ کنارِ هم: صفحه‌خوان باید
            «۱ از ۳» را بگوید. جداکننده در CSS است، نه در DOM. */}
        <nav aria-label="مسیر">
          <ol className="tpx-crumb">
            <li><Link href="/">خانه</Link></li>
            <li><Link href="/services">خدمات فنی</Link></li>
            <li aria-current="page">{tech.name}</li>
          </ol>
        </nav>

        {/* ═══ سرلوحه ═══
            ⚠️ کارتِ هویت نیست. نامِ متخصص بزرگ‌ترین چیزِ صفحه است و
            بقیه زیرِ آن مرتب می‌شود. عکس — اگر باشد — تصویرِ واقعی
            در ستونِ مقابل است، نه آواتارِ دایره‌ای؛ و اگر نباشد،
            هیچ جای‌نگه‌داری ساخته نمی‌شود. */}
        <header className="tpx-mast">
          <div>
            <h1 className="tpx-name">
              {tech.name}
              {tech.verified && <span className="vb"><VerifiedBadge title="متخصص تأیید شده" /></span>}
            </h1>
            {lede && <p className="tpx-lede">{lede}</p>}
            {introTxt && <p className="tpx-intro">{introTxt}</p>}
          </div>

          {/* ⚠️ ستونِ دوم *همیشه* هست، عکس باشد یا نباشد. با یک ستون،
              صفحه در ۱۴۴۰ یک نوارِ باریکِ چسبیده به راست می‌شد و نیمِ
              دیگر خالی — که سفیدیِ عمدی نیست، ترکیب‌بندیِ نامتعادل
              است. این‌جا خلاصه و کنش می‌نشیند؛ عکس اگر باشد بالایش. */}
          <div className="aside">
            {tech.photo && (
              <button type="button" className="tpx-portrait"
                onClick={() => openImage(tech.photo ?? '', { title: 'عکس پروفایل', alt: tech.name })}
                aria-label={`بزرگ‌نمایی عکسِ ${tech.name}`}>
                <img src={tech.photo} alt={tech.name} loading="eager" decoding="async" />
              </button>
            )}
            <p className="tpx-facts">
              <b>{city}</b>
              {svc.count > 0 && (
                <>
                  <span className="sep" aria-hidden>·</span>
                  {svc.categories.map(c => c.title).join(' و ')}
                  {svc.categories.length > 0 && '، '}
                  <b>{toFaDigits(svc.count)} خدمت</b>
                </>
              )}
            </p>
            <div className="tpx-acts">
              {phone && <a className="tpx-btn gold" href={`tel:${phone}`}><Phone size={15} aria-hidden /> ارتباط با این متخصص</a>}
              {waHref && <a className="tpx-btn wa" href={waHref} target="_blank" rel="noopener noreferrer">{WaIcon} واتساپ</a>}
            </div>
          </div>
        </header>

        {about.length > 0 && (
          <section className="tpx-sec">
            <h2>درباره</h2>
            <div className="tpx-prose">
              {about.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </section>
        )}

        {/* ═══ کاتالوگِ خدمات — ستونِ فقراتِ صفحه ═══
            ⚠️ بخشِ خالی رندر نمی‌شود: متخصصی که هنوز خدمتی انتخاب
            نکرده نباید قابِ خالی ببیند. */}
        {svc.count > 0 && (
          <section className="tpx-sec">
            <h2>خدمات</h2>
            <ServiceCatalog data={svc} />
          </section>
        )}

        {tech.projects.length > 0 && (
          <section className="tpx-sec">
            <h2>نمونه‌کارها</h2>
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
          </section>
        )}

        {/* ═══ گالری — همان کامپوننتِ مربی و داور ═══ */}
        {(tech.gallery.length > 0 || tech.videos.length > 0 || edit.isOwner) && (
          <section className="tpx-sec">
            <ProfileGallery
              images={tech.gallery}
              videos={tech.videos}
              /* از نمای نرمال‌شده می‌آید، نه ردیفِ خام: ردیفِ پیش از مهاجرت
                 هنوز آلبومِ شیئی دارد و نامِ آلبوم آن‌جا نیست. */
              albumNames={tech.albums}
              onOpenImage={(urls, index, meta, ids) => openImage(urls, {
                index, ...meta,
                ...(edit.isOwner ? { onDelete: (i: number) => deleteImage(ids[i] ?? '') } : {}),
              })}
              onOpenVideo={v => openVideo(v, edit.isOwner ? { onDelete: () => deleteVideo(v.id), onEdit: () => editVideo(v) } : undefined)}
              canEdit={edit.isOwner} busy={edit.saving || vidBusy}
              onAddImages={addImages} onAddVideos={addVideoFiles} beforeAddVideos={() => askChannel(String(tech?.name ?? ''))} onNewAlbum={newAlbum}
            />
            {edit.error && <p role="alert" className="tpx-err">خطا: {edit.error}</p>}
          </section>
        )}

        {facts.length > 0 && (
          <section className="tpx-sec">
            <h2>فعالیت و دسترسی</h2>
            {/* ⚠️ `dl` نه جدول و نه کاشیِ آیکون‌دار: این‌ها مشخصاتِ
                کار هستند و رابطه‌ی «عنوان ← مقدار» را خودِ عنصر
                می‌گوید، بدونِ آیکونی که چیزی به آن اضافه نمی‌کند. */}
            <dl className="tpx-facts-grid">
              {facts.map(([k, v]) => (
                <Fragment key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </Fragment>
              ))}
            </dl>
          </section>
        )}
      </div>

      {/* ═══ نتیجه‌گیری ═══
          تنها تغییرِ زمینِ صفحه. بازدیدکننده تا این‌جا فهمیده این
          آدم کیست و چه می‌کند؛ حالا کارِ صفحه تمام است و فقط یک
          قدم مانده. وسط‌چین و هاله‌ی محو ندارد. */}
      <section className="tpx-close">
        <div className="tpx-wrap inner">
          <div className="say">
            <h2>به این خدمات نیاز دارید؟</h2>
            <p>برای هماهنگی و دریافت مشاوره، مستقیم با {tech.name} در ارتباط باشید.</p>
          </div>
          <div className="tpx-acts">
            {phone && <a className="tpx-btn gold" href={`tel:${phone}`}><Phone size={15} aria-hidden /> درخواست خدمات</a>}
            {waHref && <a className="tpx-btn wa" href={`${waHref}?text=${encodeURIComponent(`سلام ${tech.name} عزیز، از طریق بیلیارد هاب با شما تماس می‌گیرم.`)}`} target="_blank" rel="noopener noreferrer">{WaIcon} گفت‌وگو در واتساپ</a>}
          </div>
        </div>
      </section>

      {imageViewer}
      {videoViewer}
      {channelGate}
      {videoEditDialog}
    </div>
  )
}

'use client'

/* ─────────────────────────────────────────────────────────────
   پروفایل متخصص خدمات فنی — ادیتوریال، لوکس و شخصی.
   هیروی معرفی → درباره من → خدمات من → پروژه‌ها (پرتفولیو) →
   گالری آلبوم‌دار با لایت‌باکس فول‌اسکرین → محل فعالیت → CTA.
   بدون آمار/امتیاز. داده از lib/technicians-data.
   ───────────────────────────────────────────────────────────── */

import { useChannelPublish, type PublishVideo } from '@/components/media/useChannelPublish'
import { toFaDigits } from '@/lib/jalali'
import { resolveServices } from '@/lib/tech-services'
import { ServiceCatalog } from '@/components/tech/ServiceCatalog'
import { useVideoEdit } from '@/components/media/useVideoEdit'
import { detailTitle, type VideoDetail } from '@/lib/media/video-details'
import { useEffect, useMemo, useState } from 'react'
import { ProfileMissing, ProfileLoading } from '@/components/profile/ProfileMissing'
import { useProfileImageViewer } from '@/components/ProfileImageViewer'
import { useProfileVideoViewer } from '@/components/profile/ProfileVideoViewer'
import ProfileGallery from '@/components/profile/ProfileGallery'
import '@/components/profile/profile-page.css'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  MapPin, ChevronLeft, Wrench,
  Phone, Clock,
} from 'lucide-react'
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

const GOLD   = '#C7A66A'
const GOLD_D = '#8F6531'
const TEXT   = '#1C1B17'
const SEC    = '#5B564B'
const MUT    = '#6F6A5C'
const LINE   = '#E7E2D6'
const BG     = '#F7F7F5'

/* آیکون واتساپ (هم‌خانواده‌ی فوتر فروشگاه) */
const WaIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.77.46 3.45 1.28 4.9L2 22l5.32-1.39a9.9 9.9 0 004.72 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.13-2.9-7A9.82 9.82 0 0012.04 2z"/></svg>
)

function SectionHead({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{ width: 3, height: 17, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
      <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>{title}</h2>
      <span style={{ flex: 1, height: 1, background: LINE }} />
    </div>
  )
}

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

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      {pending && <PendingNotice what="پروفایلِ شما" />}
      <style>{`
        @keyframes tpFadeUp { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform:none; } }
        @keyframes tpFade   { from { opacity:0; } to { opacity:1; } }
        .tp-wrap { max-width: 1120px; margin: 0 auto; padding: 0 clamp(16px,3vw,28px); }

        .tp-hero { display: grid; grid-template-columns: 300px minmax(0,1fr); gap: clamp(20px,3.4vw,40px); align-items: center; }
        @media (max-width: 760px) { .tp-hero { grid-template-columns: 1fr; gap: 18px; } .tp-idcard { max-width: 260px; margin: 0 auto; } }

          color: ${SEC}; background: #fff; border: 1px solid ${LINE}; border-radius: 999px; padding: 7px 14px;
          transition: all .2s; }

        .tp-cta { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 42px;
          padding: 0 20px; border-radius: 11px; cursor: pointer; text-decoration: none; font-family: inherit;
          font-size: 13px; font-weight: 800; transition: all .25s cubic-bezier(.22,1,.36,1); }
        .tp-cta.gold { background: rgba(199,166,106,0.12); border: 1px solid rgba(199,166,106,0.34); color: ${GOLD_D}; }
        .tp-cta.gold:hover { transform: translateY(-2px); background: rgba(199,166,106,0.18); box-shadow: 0 8px 20px rgba(199,166,106,0.2); }
        .tp-cta.wa { background: rgba(37,211,102,0.10); border: 1px solid rgba(37,211,102,0.3); color: #0E7A38; }
        .tp-cta.wa:hover { transform: translateY(-2px); background: rgba(37,211,102,0.16); }

        /* پروژه‌ها */
        /* ⚠️ نمونه‌کار محتواست، نه بندانگشتی. تصویر نسبتِ ثابت و
           بلندتری می‌گیرد و در عرضِ زیاد سه‌ستونه نمی‌شود — سه ستون
           یعنی عکسِ کوچک‌تر، و کوچک‌کردنِ کارِ انجام‌شده خلافِ هدف است. */
        .tp-projects { display: grid; grid-template-columns: repeat(2, 1fr); gap: clamp(16px, 2.2vw, 24px); }
        @media (max-width: 700px) { .tp-projects { grid-template-columns: 1fr; } }
        .tp-proj { display: flex; flex-direction: column; background: #fff; border: 1px solid ${LINE}; border-radius: 16px;
          overflow: hidden; box-shadow: 0 2px 10px rgba(28,27,23,0.05);
          transition: transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s, border-color .28s; animation: tpFadeUp .5s ease both; }
        .tp-proj:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(28,27,23,0.11); border-color: rgba(199,166,106,0.35); }
        .tp-proj .im { aspect-ratio: 4 / 3; overflow: hidden; background: ${BG}; }
        .tp-proj .im img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .6s cubic-bezier(.22,1,.36,1); }
        .tp-proj:hover .im img { transform: scale(1.05); }

        /* گالری — Masonry با CSS columns */

      `}</style>

      <div className="tp-wrap" style={{ paddingTop: 18, paddingBottom: 76 }}>

        {/* بردکرامب */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUT, marginBottom: 20, animation: 'tpFadeUp .4s ease both' }}>
          <Link href="/" style={{ color: MUT, textDecoration: 'none' }}>خانه</Link>
          <ChevronLeft size={12} />
          <Link href="/services" style={{ color: MUT, textDecoration: 'none' }}>خدمات فنی</Link>
          <ChevronLeft size={12} />
          <span style={{ color: SEC }}>{tech.name}</span>
        </nav>

        {/* ═══ هیرو معرفی ═══ */}
        <header className="tp-hero" style={{ marginBottom: 'clamp(30px,4.4vw,48px)', animation: 'tpFadeUp .5s .05s ease both' }}>
          {/* کارت هویت */}
          <div className="tp-idcard" style={{ position: 'relative', aspectRatio: '3/3.4', borderRadius: 22, overflow: 'hidden', border: `1px solid ${LINE}`, boxShadow: '0 14px 38px rgba(154,110,56,0.13)', background: 'linear-gradient(170deg,#FBF9F5 0%,#F1ECE1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 76% 16%, rgba(199,166,106,0.20) 0%, transparent 48%), radial-gradient(circle at 18% 90%, rgba(20,83,45,0.08) 0%, transparent 44%), radial-gradient(rgba(28,27,23,0.03) 1px, transparent 1px)', backgroundSize: 'auto, auto, 17px 17px' }} />
            <div style={{ position: 'absolute', top: '-24%', bottom: '-24%', left: '26%', width: 1, background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.4),transparent)', transform: 'rotate(14deg)' }} />
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <span style={{ position: 'relative', width: 118, height: 118, margin: '0 auto', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 900, color: GOLD_D, background: 'linear-gradient(160deg,#FFFDF9,#F5EFE4)', boxShadow: '0 14px 30px rgba(154,110,56,0.18), inset 0 1px 0 #fff', overflow: 'visible' }}>
                <span style={{ position: 'absolute', inset: -9, borderRadius: '50%', border: '1px solid rgba(199,166,106,0.55)' }} />
                <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '1px dashed rgba(199,166,106,0.35)' }} />
                {tech.photo
                  ? (
                    <button type="button" onClick={() => openImage(tech.photo ?? '', { title: 'عکس پروفایل', alt: tech.name })}
                      aria-label="بزرگ‌نمایی عکس پروفایل"
                      style={{ width: '100%', height: '100%', padding: 0, border: 'none', background: 'none', borderRadius: '50%', cursor: 'zoom-in' }}>
                      <img loading="lazy" decoding="async" src={tech.photo} alt={tech.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                    </button>
                  )
                  : tech.name.slice(0, 1)}
              </span>
              <div style={{ marginTop: 16, fontSize: 10, fontWeight: 800, letterSpacing: '0.22em', color: 'rgba(154,110,56,0.65)' }}>BILLIARD HUB</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: MUT, marginTop: 3 }}>متخصص خدمات فنی</div>
            </div>
          </div>

          {/* معرفی */}
          <div>
            {/* کیکرِ «TECHNICAL SPECIALIST» برداشته شد؛ عنوانِ حرفه‌ایِ
                فارسی دو خط پایین‌تر همان را می‌گوید. */}
            <h1 style={{ fontSize: 'clamp(24px,3.6vw,38px)', fontWeight: 900, margin: '0 0 6px', lineHeight: 1.35, letterSpacing: '-0.02em' }}>{tech.name}{tech.verified && <VerifiedBadge title="متخصص تأیید شده" />}</h1>
            <div style={{ fontSize: 'clamp(13.5px,1.7vw,16px)', fontWeight: 800, color: GOLD_D, marginBottom: 10 }}>{tech.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: SEC, marginBottom: 14 }}>
              <MapPin size={14} style={{ color: '#14532D' }} />
              <span>{tech.city}</span>
              {tech.club && <><span style={{ color: MUT }}>·</span><span style={{ color: MUT }}>{tech.club}</span></>}
            </div>
            <p style={{ fontSize: 14, lineHeight: 2, color: SEC, margin: '0 0 16px', maxWidth: 560 }}>{tech.intro}</p>
            {svc.count > 0 && (
              /* ⚠️ خلاصه، نه فهرست: نامِ دسته‌ها + شمار. خودِ کاتالوگ
                 بخشِ مستقلِ خودش را دارد. */
              <p style={{ fontSize: 13, color: MUT, margin: '0 0 20px' }}>
                {svc.categories.map(c => c.title).join(' و ')}
                {svc.categories.length > 0 && ' — '}
                <span style={{ color: SEC, fontWeight: 700 }}>{toFaDigits(svc.count)} خدمت</span>
              </p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <a className="tp-cta gold" href={`tel:${tech.phone}`}><Phone size={15} /> ارتباط با این متخصص</a>
              <a className="tp-cta wa" href={`https://wa.me/${tech.whatsapp}`} target="_blank" rel="noopener noreferrer">{WaIcon} واتساپ</a>
            </div>
          </div>
        </header>

        {/* ═══ درباره من ═══ */}
        <section style={{ marginBottom: 'clamp(28px,4vw,44px)', animation: 'tpFadeUp .5s .1s ease both' }}>
          <SectionHead title="درباره من" />
          <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: 'clamp(18px,2.6vw,26px)' }}>
            {tech.about.map((p, i) => (
              <p key={i} style={{ fontSize: 14, lineHeight: 2.2, color: '#2B2822', margin: i === tech.about.length - 1 ? 0 : '0 0 14px' }}>{p}</p>
            ))}
            {/* ⚠️ اینجا هم چیپ بود — و درست بالای بخشی که چیپ‌هایش را
                برداشتیم. نامِ شهر برچسب نیست، بخشی از یک جمله است. */}
            <p style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #F0EDE5', fontSize: 12.5, lineHeight: 2, color: MUT, marginBottom: 0 }}>
              <span style={{ fontWeight: 800, color: SEC }}>شهرهای تحت پوشش: </span>
              {tech.coverage.join('، ')}
            </p>
          </div>
        </section>

        {/* ═══ کاتالوگِ خدمات ═══
            ⚠️ بخشِ خالی رندر نمی‌شود: متخصصی که هنوز خدمتی انتخاب
            نکرده نباید قابِ خالی ببیند. */}
        {svc.count > 0 && (
          <section style={{ marginBottom: 'clamp(28px,4vw,44px)' }}>
            <SectionHead title="خدمات" />
            <ServiceCatalog data={svc} />
          </section>
        )}

        {/* ═══ پروژه‌ها ═══ */}
        {tech.projects.length > 0 && (
          <section style={{ marginBottom: 'clamp(28px,4vw,44px)' }}>
            <SectionHead title="نمونه‌کارها" />
            <div className="tp-projects">
              {tech.projects.map((p, i) => (
                <article key={p.id} className="tp-proj" style={{ animationDelay: `${i * 70}ms` }}>
                  <div className="im"><img src={p.image} alt={p.title} loading="lazy" decoding="async" /></div>
                  <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {/* ⚠️ چیپِ نوعِ خدمت برداشته شد: همان الگوی برچسبی بود که
                        از کاتالوگ حذفش کردیم، و نوعِ خدمت را عنوانِ پروژه
                        خودش می‌گوید. حالا یک خطِ فراداده‌ی آرام. */}
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: GOLD_D }}>{p.service}</span>
                    <h3 style={{ fontSize: 15.5, fontWeight: 900, margin: '2px 0 0', lineHeight: 1.6 }}>{p.title}</h3>
                    <p style={{ fontSize: 12.5, lineHeight: 1.9, color: SEC, margin: 0 }}>{p.desc}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: MUT, marginTop: 4 }}>
                      <MapPin size={11} aria-hidden style={{ flexShrink: 0 }} />
                      {p.city}{p.club ? ` — ${p.club}` : ''}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ═══ گالری — همان کامپوننتِ مربی و داور ═══ */}
        {(tech.gallery.length > 0 || tech.videos.length > 0 || edit.isOwner) && (
          <section style={{ marginBottom: 'clamp(28px,4vw,44px)' }}>
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
            {edit.error && <p role="alert" style={{ fontSize: 12, color: '#b91c1c', margin: '10px 0 0' }}>{edit.error}</p>}
          </section>
        )}

        {/* ═══ محل فعالیت ═══ */}
        <section style={{ marginBottom: 'clamp(28px,4vw,44px)' }}>
          <SectionHead title="محل فعالیت" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '18px 20px' }}>
            <span style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(20,83,45,0.08)', border: '1px solid rgba(20,83,45,0.18)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#14532D', flexShrink: 0 }}>
              <MapPin size={19} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 900 }}>{tech.city}{tech.club ? ` — ${tech.club}` : ''}</div>
              <div style={{ fontSize: 12, color: MUT, marginTop: 3 }}>ارائه‌ی خدمات در {tech.coverage.join('، ')}</div>
              {/* ⚠️ جدولِ خشک نه — یک خطِ جمله‌وار. و فقط چیزی که متخصص
                  *گفته*: هیچ‌کدام پیش‌فرضِ «بله» ندارد. */}
              {(tech.onsite || tech.workshop) && (
                <div style={{ fontSize: 12.5, color: SEC, marginTop: 7, fontWeight: 700 }}>
                  {[tech.onsite && 'در محلِ شما', tech.workshop && 'پذیرش در کارگاه']
                    .filter(Boolean).join(' · ')}
                </div>
              )}
              {tech.hours.trim() && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: MUT, marginTop: 6 }}>
                  <Clock size={13} aria-hidden style={{ flexShrink: 0 }} />
                  <span>{tech.hours.trim()}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ═══ CTA پایانی ═══ */}
        <section style={{ position: 'relative', overflow: 'hidden', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 20, padding: 'clamp(24px,3.4vw,36px)', textAlign: 'center', boxShadow: '0 6px 24px rgba(28,27,23,0.06)' }}>
          <div style={{ position: 'absolute', left: '-6%', top: '-70%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,166,106,0.14) 0%, transparent 66%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <h2 style={{ fontSize: 'clamp(16px,2.2vw,21px)', fontWeight: 900, margin: '0 0 8px' }}>به این خدمات نیاز دارید؟</h2>
          <p style={{ fontSize: 13, color: SEC, margin: '0 0 18px', lineHeight: 1.9 }}>
            برای هماهنگی و دریافت مشاوره، مستقیم با {tech.name} در ارتباط باشید.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10 }}>
            <a className="tp-cta gold" href={`tel:${tech.phone}`}><Phone size={15} /> درخواست خدمات</a>
            <a className="tp-cta wa" href={`https://wa.me/${tech.whatsapp}?text=${encodeURIComponent(`سلام ${tech.name} عزیز، از طریق بیلیارد هاب با شما تماس می‌گیرم.`)}`} target="_blank" rel="noopener noreferrer">{WaIcon} گفت‌وگو در واتساپ</a>
          </div>
        </section>
      </div>

      {/* ═══ لایت‌باکس فول‌اسکرین ═══ */}
      {imageViewer}
      {videoViewer}
      {channelGate}
      {videoEditDialog}
    </div>
  )
}

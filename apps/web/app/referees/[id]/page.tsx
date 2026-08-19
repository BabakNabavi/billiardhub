'use client'

/* ─────────────────────────────────────────────────────────────
   پروفایل عمومی داور — همان طرحِ صفحه‌ی مربی.

   ── چه چیزی رفت ──
   ۱۰ داورِ ساختگی روی /referees/1..10 عمومی بودند: نام، مدرک و
   شماره‌ی تلفنِ قابلِ شماره‌گیریِ آدم‌هایی که وجود ندارند. فهرستِ
   /referees خالی است و هیچ لینکی به آن‌ها نمی‌داد، ولی نشانی‌ها
   زنده بودند. همان کاری که با صفحه‌ی مربی شد.

   هیرو، گالری و خطِ زمان از `components/profile/*` می‌آیند — یک
   طرح، دو مصرف‌کننده.
   ───────────────────────────────────────────────────────────── */

import { useState, useEffect, useRef } from 'react'
import ProfileHero from '../../../components/profile/ProfileHero'
import ProfileGallery from '../../../components/profile/ProfileGallery'
import GradeTimeline from '../../../components/profile/GradeTimeline'
import '../../../components/profile/profile-page.css'
import { fetchProfileResult } from '../../../lib/profiles/client'
import { useOwnerEdit } from '../../../lib/profiles/use-owner-edit'
import { compressImage } from '../../../lib/seller-store'
import { uploadFile } from '../../../lib/supabase'
import { videoMeta, formatDuration } from '../../../lib/video-thumb'
/* ⚠️ prompt/confirm بومی در این پروژه ممنوع است (گاردِ ایستا دارد):
   جریان را قفل می‌کنند، استایلِ سایت را نمی‌گیرند و روی وب‌ویوِ
   اپ رفتارشان یکسان نیست. `askText`/`ask` همان کار را با پنجره‌ی
   خودِ سایت می‌کنند. */
import { ask, notify } from '../../../lib/ui/dialogs'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useProfileImageViewer } from '@/components/ProfileImageViewer'
import { useProfileVideoViewer } from '@/components/profile/ProfileVideoViewer'
import { normalizeDigits } from '@/lib/text-fa'
import { Phone, Send, Copy, Check } from 'lucide-react'
import {
  getRefereeProfile, badgeFromGrades, disciplineLabel, GRADES,
  type RefereeProfile,
} from '../../../lib/referee-store'

/* همان سقفی که پنل اعمال می‌کند */
const MAX_VIDEO_MB = 25

/* ─── انواع ─── */
interface GImg  { id:string; url:string; caption:string; album?:string }
/* `url` نشانیِ فایل است؛ ردیفِ قدیمی فقط بندانگشتی دارد و کارتِ
   بی‌پخش رندر می‌شود. */
interface VItem { id:string; url?:string; thumbnail:string; title:string; duration:string; album?:string }

/* دقیقاً همان چیزی که پنلِ داور ذخیره می‌کند، نه یک ابرمجموعه.
   فیلدهای مرده‌ی نسخه‌ی قبلی (افتخارات، استوری، رنگِ نشان) با
   حذفِ داده‌ی نمایشی رفتند. */
interface RefereeView {
  id:string; name:string; city:string; verified:boolean
  photo?:string; coverImage?:string
  bio:string; fullBio:string
  disciplines:string[]
  phone:string; whatsapp:string; instagram?:string; telegram?:string
  gallery:GImg[]; videos:VItem[]
}

function mapLocalToView(p: RefereeProfile): RefereeView {
  return {
    id: p.slug,
    name: `${p.firstNameFa} ${p.lastNameFa}`.trim(),
    city: p.city,
    verified: p.verified,
    photo: p.photo || undefined,
    coverImage: p.coverImage || undefined,
    bio: p.shortBio,
    fullBio: p.fullBio,
    disciplines: p.disciplines,
    phone: p.phone,
    whatsapp: p.whatsapp,
    instagram: p.instagram || undefined,
    telegram: p.telegram || undefined,
    gallery: p.gallery.map(g => ({ id: g.id, url: g.url, caption: g.caption, album: g.album })),
    videos: p.videos.map(v => ({ id: v.id, url: v.url, thumbnail: v.thumbnail, title: v.title, duration: v.duration, album: v.album })),
  }
}

/* ─── Page ─── */
export default function RefereeProfilePage() {
  const { id } = useParams<{id:string}>()
  const [localP, setLocalP]   = useState<RefereeProfile | null>(null)
  const [checked, setChecked] = useState(false)
  /* شبکه شکست، نه اینکه پروفایل نباشد — بدونِ این، قطعیِ اینترنت
     پیامِ «این داور وجود ندارد» می‌گرفت. */
  const [netFail, setNetFail] = useState(false)
  /* مالکِ ردیف — از ستونِ سرور، نه از داده‌ی داخلِ فرم. فقط برای
     نشان‌دادنِ دکمه‌های ویرایش؛ اجازه‌ی واقعی روی سرور سنجیده می‌شود. */
  const [ownerId, setOwnerId] = useState<string | null>(null)
  /* پرچمِ قطعیِ سرور — مقایسه‌ی مرورگر فقط فالبک است */
  const [mine, setMine] = useState<boolean | undefined>(undefined)
  const [vidBusy, setVidBusy] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'manual'>('idle')
  const flashT = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (flashT.current) clearTimeout(flashT.current) }, [])

  /* ── چرا سرور هم خوانده می‌شود ──
     این صفحه فقط `localStorage` را می‌دید، یعنی پروفایل تنها در
     مرورگرِ خودِ صاحبش دیده می‌شد. حافظه‌ی محلی اول می‌آید چون فوری
     است؛ پاسخِ سرور رویش می‌نشیند. */
  useEffect(() => {
    setNetFail(false)
    if (!id) { setChecked(true); return }
    setLocalP(getRefereeProfile(id))
    let alive = true
    void (async () => {
      try {
        const r = await fetchProfileResult<RefereeProfile>('referee', id)
        if (!alive) return
        if (r.state === 'found') {
          setLocalP({ ...(r.profile.data as RefereeProfile), slug: r.profile.slug, verified: r.profile.verified })
          setOwnerId(r.profile.ownerId)
          setMine(r.isMine === true)
        }
        else if (r.state === 'error') setNetFail(true)
      } catch {
        /* `fetchProfileResult` خودش خطا را می‌گیرد؛ تورِ ایمنی است
           تا استثنای غیرمنتظره صفحه را به «پیدا نشد» نیندازد. */
        if (alive) setNetFail(true)
      } finally {
        if (alive) setChecked(true)
      }
    })()
    return () => { alive = false }
  }, [id, reloadKey])

  const referee = localP ? mapLocalToView(localP) : null
  const { open: openImage, viewer: imageViewer } = useProfileImageViewer()
  const { open: openVideo, viewer: videoViewer } = useProfileVideoViewer()

  /* ── ویرایشِ درجا ──
     ⚠️ این فراخوانی *باید* پیش از هر `return`ِ شرطی باشد. یک‌بار
     پایین‌تر — بعد از گاردِ اسکلت و گاردِ «پیدا نشد» — نوشته شد و
     صفحه با React #310 («تعدادِ هوک‌ها عوض شد») سفید می‌شد؛ برای
     همه، نه فقط مالک.

     صاحبِ پروفایل بدونِ رفتن به داشبورد عکس/ویدیو/آلبوم اضافه و حذف
     می‌کند. `apply` کلِ پروفایل را با یک فیلدِ عوض‌شده ذخیره می‌کند و
     نشانیِ Storage را که سرور برمی‌گرداند می‌نشاند. */
  const edit = useOwnerEdit<RefereeProfile>('referee', id, localP, ownerId, setLocalP, mine)

  if (!checked) {
    return (
      <div className="ch-page ch-skel" role="status" aria-busy="true" aria-label="در حال بارگذاری پروفایل داور">
        <div className="ch-skel-hero" />
        <div className="ch-body"><div className="ch-wrap ch-cols">
          <div className="ch-col">
            <div className="ch-skel-line ch-skel-sm" />
            <div className="ch-skel-line" /><div className="ch-skel-line" />
            <div className="ch-skel-line ch-skel-md" />
          </div>
          <div className="ch-col ch-rail"><div className="ch-skel-card" /></div>
        </div></div>
      </div>
    )
  }

  if (!referee) {
    return (
      <div className="lq-stage ch-notfound">
        <div className="lqg ch-notfound-card">
          <h1>{netFail ? 'بارگذاری نشد' : 'این داور پیدا نشد'}</h1>
          <p>{netFail
            ? 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.'
            : 'ممکن است نشانی اشتباه باشد یا پروفایل هنوز تأیید نشده باشد.'}</p>
          {/* راهِ بازگشت در حالتِ خطا هم می‌ماند — شاید شبکه برنگردد. */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {netFail && (
              <button type="button" className="btn btn-glass btn-sm" style={{ minHeight: 44 }}
                onClick={() => { setChecked(false); setReloadKey(k => k + 1) }}>تلاش دوباره</button>
            )}
            <Link href="/referees" className="btn btn-glass btn-sm" style={{ minHeight: 44 }}>بازگشت به داوران</Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── داده‌ی مشتق ──
     همه از فیلدهای واقعی می‌آید؛ هیچ عددِ ساختگی ساخته نمی‌شود. */
  const badge = localP ? badgeFromGrades(localP.grades) : null
  const grade = badge ? { label: badge.label, dots: badge.dots } : undefined
  const disciplines = referee.disciplines.map(k => ({ label: disciplineLabel(k) }))

  /* بر اساسِ رتبه مرتب می‌شود نه سال — همان دلیلِ صفحه‌ی مربی:
     چیپِ هیرو از `badgeFromGrades` می‌آید که رتبه‌ای است، و اگر
     خطِ زمان با سال مرتب شود نشانِ «بالاترین درجه» به ردیفِ اشتباه
     می‌چسبد. */
  const timeline = localP
    ? [...localP.grades]
        .sort((a, b) => GRADES.findIndex(x => x.key === b.key) - GRADES.findIndex(x => x.key === a.key))
        .map(g => ({ label: g.label, year: g.year }))
    : []

  /* «از سال» = کوچک‌ترین سالِ واقعی. ارقامِ فارسی و عربی نرمال
     می‌شوند وگرنه `Number('۱۳۹۸')` برابرِ NaN است. */
  const sinceYear = (() => {
    const years = (localP?.grades ?? [])
      .map(g => Number(normalizeDigits(String(g.year))))
      .filter(n => Number.isFinite(n) && n > 0)
    return years.length ? String(Math.min(...years)) : ''
  })()

  const paragraphs = (referee.fullBio || referee.bio || '').split(/\n{2,}/).map(s => s.trim()).filter(Boolean)
  const publicUrl = `www.billiardhub.net/referees/${referee.id}`

  /* `navigator.clipboard` روی http و سافاریِ قدیمی نیست؛ در آن حالت
     نشانی انتخاب می‌شود تا کاربر دستی بردارد. */
  const selectUrl = () => {
    const el = document.getElementById('ch-url-code')
    if (!el || typeof window.getSelection !== 'function') return
    const r = document.createRange()
    r.selectNodeContents(el)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(r)
  }

  const flash = (s: 'ok' | 'manual') => {
    setCopyState(s)
    if (flashT.current) clearTimeout(flashT.current)
    flashT.current = setTimeout(() => setCopyState('idle'), 2200)
  }

  const copyUrl = async () => {
    if (!navigator.clipboard?.writeText) { selectUrl(); flash('manual'); return }
    try {
      await navigator.clipboard.writeText(`https://${publicUrl}`)
      flash('ok')
    } catch {
      selectUrl(); flash('manual')
    }
  }

  const latin = localP ? `${localP.firstNameEn} ${localP.lastNameEn}`.trim().toUpperCase() : ''

  const addImages = async (files: FileList, album?: string) => {
    const items = await Promise.all([...files].map(async fl => ({
      id: `m${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
      url: await compressImage(fl, 1000, 0.68),
      caption: '',
      /* از داخلِ آلبوم که اضافه شود، همان‌جا می‌نشیند */
      ...(album ? { album } : {}),
    })))
    await edit.apply(d => ({ ...d, gallery: [...d.gallery, ...items] }))
  }
  /* ── ویدیو از گالریِ خودِ کاربر ──
     ⚠️ نسخه‌ی اول نشانیِ آپارات/یوتیوب می‌پرسید — کاربر درست گفت که
     این اصلاً کارِ این دکمه نیست. حالا مثل عکس فایل انتخاب می‌شود و
     همان مسیرِ آپلودی می‌رود که پنل استفاده می‌کند
     (`profiles/videos/<userId>/…` در Storage، نه data:URL داخلِ jsonb
     که ردیف را می‌ترکاند). */
  const addVideoFiles = async (files: FileList, album?: string) => {
    const file = files[0]
    if (!file) return
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      notify(`حجم ویدیو نباید بیش از ${MAX_VIDEO_MB} مگابایت باشد`); return
    }
    setVidBusy(true)
    try {
      const meta = await videoMeta(file)
      const vid = `v${Date.now()}${Math.random().toString(36).slice(2, 6)}`
      const base = `profiles/videos/${ownerId ?? 'anon'}/${vid}`
      const url = await uploadFile('club-media', file, base)
      if (!url) { notify('ویدیو بالا نرفت؛ دوباره تلاش کنید'); return }
      const thumb = meta.thumb ? (await uploadFile('club-media', meta.thumb, `${base}-thumb`)) ?? '' : ''
      await edit.apply(d => ({
        ...d,
        videos: [...d.videos, { id: vid, url, thumbnail: thumb, title: file.name.replace(/.[^.]+$/, ''), duration: formatDuration(meta.durationSec), ...(album ? { album } : {}) }],
      }))
    } finally { setVidBusy(false) }
  }
  /* ⚠️ نسخه‌ی قبلی نامِ آلبوم را روی «آخرین عکسِ بدونِ آلبوم»
     می‌نشاند، چون آلبوم فقط از روی رسانه‌ها ساخته می‌شد و آلبومِ خالی
     ممکن نبود. نتیجه‌اش این بود که آلبومِ تازه‌ی خالی، یکی از عکس‌های
     تبِ تصاویر را با خودش می‌برد. حالا فقط نام اعلام می‌شود. */
  const newAlbum = async (name: string) => {
    const n = name.trim()
    if (!n) return
    await edit.apply(d => {
      const list = d.albums ?? []
      if (list.some(x => x.trim() === n)) return d
      return { ...d, albums: [...list, n] }
    })
  }
  const deleteVideo = async (id: string) => {
    if (!(await ask('این ویدیو حذف شود؟', { body: 'این کار برگشت‌پذیر نیست.', confirmLabel: 'حذف' }))) return
    await edit.apply(d => ({ ...d, videos: d.videos.filter(v => v.id !== id) }))
  }
  /* ⚠️ با شناسه، نه با اندیس: داخلِ آلبوم اندیسِ خانه به زیرمجموعه
     برمی‌گشت و این فیلتر روی کلِ گالری بود — یعنی حذف از داخلِ آلبوم
     عکسِ دیگری را می‌برد. */
  const deleteImage = async (id: string) => {
    if (!(await ask('این تصویر حذف شود؟', { body: 'این کار برگشت‌پذیر نیست.', confirmLabel: 'حذف' }))) return
    await edit.apply(d => ({ ...d, gallery: d.gallery.filter(g => g.id !== id) }))
  }

  return (
    <div className="ch-page">
      <ProfileHero
        name={referee.name}
        nameLatin={latin || undefined}
        city={referee.city}
        sinceYear={sinceYear || undefined}
        photo={referee.photo}
        cover={referee.coverImage}
        verified={referee.verified}
        grade={grade}
        disciplines={disciplines}
        onOpenPhoto={u => openImage(u, { title: referee.name, alt: `عکس ${referee.name}` })}
        role="referee" backHref="/referees" backLabel="داوران"
        publicUrl={publicUrl}
      />

      <div className="ch-body">
        <div className="ch-wrap ch-cols">

          <main className="ch-col">
            <section aria-labelledby="ch-about-h">
              <div className="ch-sec-head">
                <h2 id="ch-about-h">معرفی</h2>
                <span className="en">ABOUT</span>
                <span className="rule" aria-hidden />
              </div>
              {paragraphs.length === 0
                ? <p className="ch-empty">این داور هنوز معرفی‌ای ننوشته است.</p>
                : paragraphs.map((t, i) => <p key={i} className="ch-prose">{t}</p>)}
            </section>

            <section aria-labelledby="ch-path-h">
              <div className="ch-sec-head">
                <h2 id="ch-path-h">مسیر داوری</h2>
                <span className="en">CAREER</span>
                <span className="rule" aria-hidden />
              </div>
              <GradeTimeline items={timeline} />
            </section>

            <ProfileGallery
              images={referee.gallery}
              videos={referee.videos}
              onOpenImage={(urls, index, meta, ids) => openImage(urls, {
                index, ...meta,
                ...(edit.isOwner ? { onDelete: (i: number) => deleteImage(ids[i] ?? '') } : {}),
              })}
              onOpenVideo={v => openVideo(v, edit.isOwner ? { onDelete: () => deleteVideo(v.id) } : undefined)}
              albumNames={localP?.albums ?? []}
              canEdit={edit.isOwner} busy={edit.saving || vidBusy}
              onAddImages={addImages} onAddVideos={addVideoFiles} onNewAlbum={newAlbum}
            />
            {edit.error && <p className="ch-empty" role="alert">{edit.error}</p>}
          </main>

          <aside className="ch-col ch-rail" aria-label="اطلاعات داور">
            {(referee.phone || referee.whatsapp || referee.instagram || referee.telegram) && (
              <section className="ch-card" aria-labelledby="ch-contact-h">
                <div className="ch-sec-head">
                  <h2 id="ch-contact-h">راه‌های ارتباطی</h2>
                  <span className="rule" aria-hidden />
                </div>
                <div className="ch-links">
                  {referee.phone && (
                    <a href={`tel:${referee.phone}`} className="ch-link" aria-label="تماس تلفنی">
                      <Phone size={17} aria-hidden />
                    </a>
                  )}
                  {referee.whatsapp && (
                    <a href={`https://wa.me/${referee.whatsapp}`} target="_blank" rel="noopener noreferrer"
                      className="ch-link" aria-label="واتساپ">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.77.46 3.45 1.28 4.9L2 22l5.32-1.39a9.9 9.9 0 004.72 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.13-2.9-7A9.82 9.82 0 0012.04 2z" />
                      </svg>
                    </a>
                  )}
                  {referee.instagram && (
                    <a href={`https://instagram.com/${referee.instagram}`} target="_blank" rel="noopener noreferrer"
                      className="ch-link" aria-label="اینستاگرام">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
                    </a>
                  )}
                  {referee.telegram && (
                    <a href={`https://t.me/${referee.telegram}`} target="_blank" rel="noopener noreferrer"
                      className="ch-link" aria-label="تلگرام">
                      <Send size={17} aria-hidden />
                    </a>
                  )}
                </div>
              </section>
            )}

            <section className="ch-card" aria-labelledby="ch-url-h">
              <div className="ch-sec-head">
                <h2 id="ch-url-h">آدرس اختصاصی</h2>
                <span className="en">MY LINK</span>
                <span className="rule" aria-hidden />
              </div>
              <div className="ch-url">
                <code id="ch-url-code" dir="ltr">{publicUrl}</code>
                <button type="button" onClick={copyUrl} className="ch-url-copy"
                  aria-label={copyState === 'ok' ? 'نشانی کپی شد' : 'کپی نشانی عمومی'}>
                  {copyState === 'ok' ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
                  {copyState === 'ok' ? 'کپی شد' : copyState === 'manual' ? 'دستی کپی کنید' : 'کپی'}
                </button>
              </div>
              <p aria-live="polite" className="ch-sr-live">
                {copyState === 'ok' ? 'نشانی در کلیپ‌بورد کپی شد.'
                  : copyState === 'manual' ? 'مرورگر اجازه‌ی کپی نداد؛ نشانی انتخاب شد — با Ctrl+C بردارید.' : ''}
              </p>
            </section>
          </aside>

        </div>
      </div>

      {imageViewer}
      {videoViewer}
    </div>
  )
}

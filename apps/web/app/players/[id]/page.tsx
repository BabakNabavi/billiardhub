'use client'

/* ─────────────────────────────────────────────────────────────
   پروفایل بازیکن — «Athlete Profile» سینمایی و ادیتوریال.
   عمداً از پروفایل مربی/داور/متخصص متمایز است: هیروی تیره با
   تایپوگرافی مونومنتال و رنکینگ گرافیکی → هویت → بیوگرافی →
   Career Highlights (تایم‌لاین) → مسابقات → باشگاه → گالری
   آلبوم‌دار + لایت‌باکس → پیوند با اخبار و بیلیارد مدیا.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useState } from 'react'
import { ProfileMissing, ProfileLoading } from '@/components/profile/ProfileMissing'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ChevronLeft, ArrowLeft,
  Trophy, Building2, Newspaper, Clapperboard,
} from 'lucide-react'
import { getPlayer, DISCIPLINE_LABEL, faDigits, type Player } from '../../../lib/players-data'
import { getPlayerProfile, profileToPlayer, type PlayerProfile } from '../../../lib/player-store'
import { useOwnerEdit } from '../../../lib/profiles/use-owner-edit'
import { compressImage } from '../../../lib/seller-store'
import { ask, notify } from '../../../lib/ui/dialogs'
import { useProfileImageViewer } from '@/components/ProfileImageViewer'
import { useProfileVideoViewer } from '@/components/profile/ProfileVideoViewer'
import ProfileGallery from '@/components/profile/ProfileGallery'
import { uploadFile } from '../../../lib/supabase'
import { videoMeta, formatDuration } from '../../../lib/video-thumb'
import '@/components/profile/profile-page.css'
import { fetchProfileResult } from '../../../lib/profiles/client'
import VerifiedBadge from '../../../components/VerifiedBadge'
import PendingNotice from '../../../components/profile/PendingNotice'
import { entryLabel } from '../../../lib/player-categories'
import { NEWS_ARTICLES } from '../../../lib/news-data'
import { useReveal, useCountUp } from '@/components/player/athlete-motion'
import './athlete.css'
import { MEDIA_VIDEOS } from '../../../lib/media-data'

/* سالِ جاریِ شمسی — همان تعریفِ صفحه‌های دیگر */
const CUR_JYEAR = (() => { try { return parseInt(new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric' }).format(new Date()), 10) || 1405 } catch { return 1405 } })()


export default function PlayerProfilePage() {
  const params = useParams()
  const id = (Array.isArray(params?.id) ? params.id[0] : params?.id) ?? ''
  const staticPlayer = useMemo(() => getPlayer(id), [id])

  /* پروفایل‌های ثبت‌نامی (پنل بازیکن ⇒ localStorage) بعد از mount خوانده می‌شوند */
  const [stored, setStored]   = useState<Player | null>(null)
  const [checked, setChecked] = useState(false)
  /* وضعیتِ پروفایلِ سرور. سرور نسخه‌ی تأییدنشده را فقط به صاحبش
     و ادمین می‌دهد، پس اگر رسید یعنی حقِ دیدنش را داریم — ولی
     باید بداند دیگران نمی‌بینندش، وگرنه لینک را جایی می‌فرستد
     که همه «پیدا نشد» می‌گیرند. */
  const [pending, setPending] = useState(false)
  /* ── چرا پروفایلِ خام هم نگه داشته می‌شود ──
     `stored` نمای *نگاشت‌شده* است (`Player`)، و ذخیره باید همان
     شکلی برگردد که پنل می‌نویسد (`PlayerProfile`). بدونِ نگه‌داشتنِ
     خام، ویرایشِ درجا داده را بازنویسیِ ناقص می‌کرد. */
  const [rawP, setRawP]       = useState<PlayerProfile | null>(null)
  const [ownerId, setOwnerId] = useState<string | null>(null)
  /* پرچمِ قطعیِ سرور — مقایسه‌ی مرورگر بی‌صدا شکست می‌خورد */
  const [mine, setMine] = useState<boolean | undefined>(undefined)
  /* شبکه شکست، نه اینکه پروفایل نباشد */
  const [netFail, setNetFail] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  /* ── چرا سرور هم خوانده می‌شود ──
     پیش‌تر فقط `localStorage` خوانده می‌شد، یعنی پروفایلِ یک بازیکن
     تنها روی دستگاهِ خودش دیده می‌شد. تیکِ آبی هم ستونِ جدولِ
     `profiles` است و اصلاً در localStorage نیست. کشِ محلی مقدارِ
     اولیه می‌ماند تا صفحه در نبودِ شبکه خالی نشود. */
  useEffect(() => {
    /* پیش از خروجِ زودهنگام: وگرنه `netFail`ِ نامکِ قبلی روی
       پروفایلِ ایستا کهنه می‌ماند. */
    setNetFail(false)
    if (staticPlayer) { setChecked(true); return }

    /* بازنشانی: بدونِ این، رفتن از /players/ali به /players/reza
       پروفایلِ علی را — با تیکِ علی — زیرِ نشانیِ رضا نگه می‌داشت، و
       اگر رضا وجود نداشت «بازیکن پیدا نشد» هرگز نشان داده نمی‌شد. */
    setChecked(false)
    const local = getPlayerProfile(id)
    setStored(local ? profileToPlayer(local) : null)

    let alive = true
    void (async () => {
      try {
        const r = await fetchProfileResult<PlayerProfile>('player', id)
        if (!alive) return
        /* شرطِ `status === 'approved'` این‌جا اشتباه بود: سرور
           پروفایلِ تأییدنشده را فقط به صاحبش و ادمین می‌دهد، پس هر
           چیزی که رسید حق دیدنش را دارد. با آن شرط، بازیکن
           پیش‌نمایشِ پروفایلِ خودش را «پیدا نشد» می‌دید. */
        if (r.state === 'found') {
          const p = r.profile
          setPending(p.status !== 'approved')
          const raw = { ...p.data, slug: p.slug, verified: p.verified } as PlayerProfile
          setRawP(raw); setOwnerId(p.ownerId)
          setMine(r.isMine === true)
          setStored(profileToPlayer(raw))
        } else if (r.state === 'error') {
          /* کشِ محلی می‌ماند؛ فقط اگر چیزی هم در کش نبود، پیامِ
             خطای شبکه نشان داده می‌شود نه «پیدا نشد». */
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
  }, [id, staticPlayer, reloadKey])

  const player = staticPlayer ?? stored

  /* ⚠️ پیش از هر `return`ِ شرطی. یک‌بار در صفحه‌ی مربی پایین‌تر
     نوشته شد و صفحه با React #310 سفید شد. */
  const edit = useOwnerEdit<PlayerProfile>('player', id, rawP, ownerId, raw => {
    setRawP(raw); setStored(profileToPlayer(raw))
  }, mine)

  /* ⚠️ هر دو هوک پیش از returnهای شرطی — قاعده‌ی هوک‌ها. یک‌بار در
     صفحه‌ی مربی زیرِ شرط رفت و صفحه با React #310 سفید شد. */
  /* آدرسِ عکسِ گالری ممکن است ۴۰۴ باشد؛ بدونِ این، به‌جای مونوگرام
     آیکونِ عکسِ شکسته داخلِ قابِ طاقی می‌نشیند. */
  const [badPortrait, setBadPortrait] = useState('')

  const { open: openImage, viewer: imageViewer } = useProfileImageViewer()
  const { open: openVideo, viewer: videoViewer } = useProfileVideoViewer()

  /* ── همان گالریِ بقیه‌ی نقش‌ها ──
     ⚠️ این صفحه هم گالریِ خودش را داشت: نوارِ آلبوم، ماسونری و
     لایت‌باکسِ دست‌ساز. حالا کامپوننتِ مشترک رندر می‌کند و این‌جا فقط
     «چه چیزی ذخیره شود» می‌ماند. */
  const MAX_VIDEO_MB = 25
  const [vidBusy, setVidBusy] = useState(false)

  const addImages = async (files: File[], album?: string) => {
    const items = await Promise.all(files.map(async fl => ({
      id: `m${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
      url: await compressImage(fl, 1000, 0.68),
      caption: '',
      ...(album ? { album } : {}),
    })))
    await edit.apply(d => ({ ...d, gallery: [...(d.gallery ?? []), ...items] }))
  }

  const addVideoFiles = async (files: File[], album?: string) => {
    setVidBusy(true)
    const skipped: string[] = []
    try {
      for (const file of files) {
        if (file.size > MAX_VIDEO_MB * 1024 * 1024) { skipped.push(file.name); continue }
        const meta = await videoMeta(file)
        const vid = `v${Date.now()}${Math.random().toString(36).slice(2, 6)}`
        const base = `profiles/videos/${ownerId ?? 'anon'}/${vid}`
        const url = await uploadFile('club-media', file, base)
        if (!url) { skipped.push(file.name); continue }
        const thumb = meta.thumb ? (await uploadFile('club-media', meta.thumb, `${base}-thumb`)) ?? '' : ''
        const ok = await edit.apply(d => ({
          ...d,
          videos: [...(d.videos ?? []), { id: vid, url, thumbnail: thumb, title: file.name.replace(/\.[^.]+$/, ''), duration: formatDuration(meta.durationSec), ...(album ? { album } : {}) }],
        }))
        if (!ok) break
      }
    } finally {
      setVidBusy(false)
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
  const deleteVideo = async (vid: string) => {
    if (!(await ask('این ویدیو حذف شود؟', { body: 'این کار برگشت‌پذیر نیست.', confirmLabel: 'حذف' }))) return
    await edit.apply(d => ({ ...d, videos: (d.videos ?? []).filter(v => v.id !== vid) }))
  }

  /* پیوند با اکوسیستم — اخبار و ویدیوهای مرتبط با برچسب‌های بازیکن */
  const relatedNews = useMemo(() => {
    if (!player) return []
    return NEWS_ARTICLES.filter(a => a.tags.some(t => player.tags.includes(t))).slice(0, 3)
  }, [player])
  const relatedVids = useMemo(() => {
    if (!player) return []
    return MEDIA_VIDEOS.filter(v => v.tags.some(t => player.tags.includes(t)) || v.category === 'interviews').slice(0, 3)
  }, [player])

  /* ⚠️ edit.isOwner مستقل از player و دیرتر true می‌شود (پروبِ ?mine=1).
     بخشِ گالریِ مالک همان لحظه سوار می‌شود؛ بدونِ این دپندنسی هرگز
     زیرِ نظر نمی‌رود و برای همیشه با opacity صفر می‌ماند. */
  useReveal([player, edit.isOwner])

  /* یونیونِ تفکیک‌شده‌ی  یا هر دو را می‌خواهد یا
     هیچ‌کدام را — پس یک‌جا ساخته و پخش می‌شود. */
  const retryProps = netFail
    ? { netFail: true as const, onRetry: () => { setChecked(false); setReloadKey(k => k + 1) } }
    : {}
  if (!player) {
    if (!checked) return <ProfileLoading />
    return (
      <ProfileMissing
        icon={<Trophy size={34} />}
        title="بازیکن پیدا نشد"
        message="ممکن است این پروفایل حذف شده یا نشانی تغییر کرده باشد."
        backHref="/players" backLabel="بازگشت به بازیکنان"
        {...retryProps}
      />
    )
  }

  const d = DISCIPLINE_LABEL[player.discipline] ?? DISCIPLINE_LABEL.snooker
  /* «اسنوکر — دسته برتر» برای هر رشته‌ای که بازیکن انتخاب کرده */
  const disciplineLines = (player.disciplines ?? []).map(e => entryLabel(e, player.gender))

  /* ── پرتره ──
     مدلِ بازیکن فیلدِ «عکسِ پرتره» ندارد؛ فقط `scene` (بافتِ پس‌زمینه)
     و گالری. پس اولین عکسِ گالری پرتره می‌شود و اگر گالری خالی بود،
     مونوگرامِ حروفِ لاتین — جای خالیِ خاکستری صفحه را ارزان می‌کند. */
  /* آدرسِ خراب ذخیره می‌شود نه یک بولین: با عوض‌شدنِ بازیکن یا جایگزینیِ
     عکس، پرچمِ چسبنده مونوگرام را روی عکسِ سالم هم نگه می‌داشت. */
  const portraitSrc = player.gallery[0]?.url ?? ''
  const portrait = portraitSrc && portraitSrc !== badPortrait ? portraitSrc : ''
  /* ⚠️ نگاشتِ پروفایل برای نامِ لاتینِ خالی رشته‌ی 'PLAYER' و برای
     سالِ شروع '—' می‌گذارد. اگر همان‌ها را رندر کنیم، «PLAYER» با
     ۲۳۶ پیکسل پشتِ هیرو می‌نشیند و «از سال —» زیرِ نام. */
  const latin = player.nameEn && player.nameEn !== 'PLAYER' ? player.nameEn : ''
  const since = player.careerStart && player.careerStart !== '—' ? player.careerStart : ''

  /* ── آمار ──
     فقط چیزی که واقعاً در داده هست. «۰ عنوان» بدتر از نبودنِ کارت
     است، پس خانه‌ی خالی اصلاً رندر نمی‌شود. رتبه‌ی رنکینگ هم عمداً
     این‌جا نیست: عددش را خودِ بازیکن وارد می‌کرد. */
  const years = (() => {
    const y = parseInt(String(since).replace(/[۰-۹]/g, ch => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch))), 10)
    return Number.isFinite(y) && y > 1300 ? Math.max(0, CUR_JYEAR - y) : 0
  })()
  const hasIntro   = !!player.intro || player.bio.length > 0
  const hasGallery = player.gallery.length > 0 || player.videos.length > 0 || edit.isOwner
  const hasRelated = relatedNews.length > 0 || relatedVids.length > 0

  const stats: { n: number; label: string }[] = [
    ...(years ? [{ n: years, label: 'سال سابقه' }] : []),
    ...(player.highlights.length ? [{ n: player.highlights.length, label: 'افتخار ثبت‌شده' }] : []),
    ...(player.tournaments.length ? [{ n: player.tournaments.length, label: 'مسابقه' }] : []),
    ...(disciplineLines.length ? [{ n: disciplineLines.length, label: 'رشته' }] : []),
  ]

  /* ── جمله‌ی معرفی: تیتر یا متن؟ ──
     جمله‌ی کوتاه در اندازه‌ی تیتر «بیانیه» می‌شود؛ همان جمله اگر بلند
     باشد در اندازه‌ی تیتر پنج سطر می‌گیرد و از بیانیه به دیوارِ متن
     تبدیل می‌شود. مرز تجربی است، نه دقیق. */
  const introIsStatement = !!player.intro && player.intro.length <= 130

  return (
    <div className="ap">
      {pending && <PendingNotice what="پروفایلِ شما" />}

      {/* ═══════════ ۱ · قاب ═══════════
          یک ایده: این آدم کیست. نام، و هیچ چیزِ دیگری که با آن رقابت کند. */}
      <header className={portrait ? "ap-hero" : "ap-hero ap-hero--bare"}>
        <div className="ap-hero-bg" style={{ backgroundImage: `url("${encodeURI(player.scene)}")` }} aria-hidden />
        <div className="ap-hero-veil" aria-hidden />

        <div className="ap-in ap-hero-top">
          <nav className="ap-crumb" aria-label="مسیر صفحه">
            <Link href="/">خانه</Link>
            <ChevronLeft size={12} aria-hidden />
            <Link href="/players">بازیکنان</Link>
          </nav>

          <span className="ap-eyebrow ap-lat">{d.en ?? 'BILLIARDS'}</span>

          <h1 className="ap-name">
            {player.name}
            {player.verified && (
              <span className="ap-tick">
                <VerifiedBadge title="بازیکن تأیید شده"
                  style={{ inlineSize: '0.3em', blockSize: '0.3em', marginInlineStart: 0 }} />
              </span>
            )}
          </h1>

          <div className="ap-meta">
            <span>{player.city}، {player.country}</span>
            {latin && <><span className="ap-dot" aria-hidden /><span dir="ltr" className="ap-lat">{latin}</span></>}
            {since && <><span className="ap-dot" aria-hidden /><span>از سال {faDigits(since)}</span></>}
          </div>

          {disciplineLines.length > 0 && (
            <div className="ap-meta ap-meta--sub">
              <span>{disciplineLines.join(' · ')}</span>
            </div>
          )}
        </div>

        {/* پرتره کفِ قاب را می‌بندد و در سیاهی حل می‌شود. نبودنش با یک
            خطِ نور پر می‌شود، نه با مونوگرامِ حروف — حرفِ تنها در قابی
            به این بزرگی «خطا» خوانده می‌شود. */}
        {/* ⚠️ نبودِ پرتره با هیچ چیزی پر نمی‌شود. جای‌گزینِ تزئینی —
            حرفِ اولِ نام، خطِ نور — در قابی به این بزرگی «چیزی کم است»
            می‌گوید؛ سکوت نمی‌گوید. قاب به‌جایش جمع و وسط‌چین می‌شود. */}
        {portrait && (
          <div className="ap-shot">
            <img src={portrait} alt={`پرتره ${player.name}`} decoding="async"
              onError={() => setBadPortrait(portraitSrc)} />
          </div>
        )}

        <div className="ap-scroll" aria-hidden>SCROLL</div>
      </header>

      {/* ═══════════ ۲ · اعداد ═══════════ */}
      {stats.length > 0 && (
        <section className="ap-act ap-act--tight" aria-label="آمار">
          <div className="ap-in">
            <div className="ap-figs">
              {stats.map((s, i) => <Figure key={s.label} n={s.n} label={s.label} delay={i * 90} />)}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ ۳ · معرفی ═══════════ */}
      {hasIntro && (
        <section className="ap-act ap-act--gray" aria-label="معرفی">
          <div className="ap-in ap-in--narrow ap-r">
            <span className="ap-eyebrow ap-lat">PROFILE</span>
            {/* جمله‌ی کوتاه خودش تیتر است؛ جمله‌ی بلند تیترِ جدا می‌خواهد
                تا این پرده تنها پرده‌ی بی‌سرتیترِ صفحه نباشد. */}
            {introIsStatement
              ? <h2 className="ap-h">{player.intro}</h2>
              : <>
                  <h2 className="ap-h">معرفی</h2>
                  {player.intro && <p className="ap-lede">{player.intro}</p>}
                </>}
            {player.bio.length > 0 && (
              <div className="ap-body ap-body--top">
                {player.bio.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════ ۴ · مسیر قهرمانی ═══════════ */}
      {player.highlights.length > 0 && (
        <section className="ap-act ap-act--night" aria-label="مسیر قهرمانی">
          <div className="ap-in">
            <div className="ap-r">
              <span className="ap-eyebrow ap-lat">CAREER</span>
              <h2 className="ap-h">مسیر قهرمانی</h2>
            </div>
            <div className="ap-rows">
              {player.highlights.map((h, i) => (
                <div key={i} className="ap-row ap-r" style={{ '--d': `${Math.min(i, 6) * 70}ms` } as React.CSSProperties}>
                  <div className="ap-row-y">{faDigits(h.year)}</div>
                  <div className="ap-row-t">{h.title}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ ۵ · مسابقات ═══════════ */}
      {player.tournaments.length > 0 && (
        <section className="ap-act" aria-label="مسابقات">
          <div className="ap-in">
            <div className="ap-r">
              <span className="ap-eyebrow ap-lat">EVENTS</span>
              <h2 className="ap-h">مسابقات</h2>
            </div>
            <div className="ap-rows">
              {player.tournaments.map((tr, i) => (
                <div key={i} className="ap-row ap-r" style={{ '--d': `${Math.min(i, 6) * 70}ms` } as React.CSSProperties}>
                  <div className="ap-row-y">{faDigits(tr.year)}</div>
                  <div className="ap-row-t">{tr.name}</div>
                  <div className="ap-row-r">{tr.result || ''}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ ۶ · باشگاه ═══════════ */}
      {player.club && (
        <section className="ap-act ap-act--night ap-act--tight" aria-label="باشگاه">
          <div className="ap-in ap-r">
            <span className="ap-eyebrow ap-lat">CLUB</span>
            <Link href={player.club.href ?? '/clubs'} className="ap-club">
              <Building2 size={22} className="ap-club-i" aria-hidden />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="ap-club-n">{player.club.name}</span>
                <span className="ap-club-s">باشگاه محل تمرین — {player.city}</span>
              </span>
              <ArrowLeft size={17} className="ap-club-i" aria-hidden />
            </Link>
          </div>
        </section>
      )}

      {/* ═══════════ ۷ · گالری ═══════════ */}
      {hasGallery && (
        <section className="ap-act" aria-label="گالری">
          <div className="ap-in ap-r">
            <span className="ap-eyebrow ap-lat">GALLERY</span>
            <h2 className="ap-h ap-h--gap">تصاویر و ویدیوها</h2>
            <ProfileGallery
              images={player.gallery}
              videos={player.videos}
              albumNames={player.albums}
              onOpenImage={(urls, index, meta, ids) => openImage(urls, {
                index, ...meta,
                ...(edit.isOwner ? { onDelete: (i: number) => deleteImage(ids[i] ?? '') } : {}),
              })}
              onOpenVideo={v => openVideo(v, edit.isOwner ? { onDelete: () => deleteVideo(v.id) } : undefined)}
              canEdit={edit.isOwner} busy={edit.saving || vidBusy}
              onAddImages={addImages} onAddVideos={addVideoFiles} onNewAlbum={newAlbum}
            />
            {edit.error && <p role="alert" className="ap-err">{edit.error}</p>}
          </div>
        </section>
      )}

      {/* ═══════════ ۸ · در بیلیارد هاب ═══════════ */}
      {hasRelated && (
        <section className="ap-act ap-act--gray" aria-label="مطالب مرتبط">
          <div className="ap-in ap-r">
            <span className="ap-eyebrow ap-lat">RELATED</span>
            <h2 className="ap-h">در بیلیارد هاب</h2>
            <div className="ap-links">
              {relatedNews.map(a => (
                <Link key={a.id} href={`/news/${a.id}`} className="ap-link">
                  <img src={a.image} alt="" loading="lazy" decoding="async" />
                  <span className="ap-link-txt">
                    <span className="ap-link-t">{a.title}</span>
                    <span className="ap-link-s">
                      <Newspaper size={12} aria-hidden />{a.date}
                    </span>
                  </span>
                </Link>
              ))}
              {relatedVids.map(v => (
                <Link key={v.id} href={`/media/${encodeURIComponent(v.id)}`} className="ap-link">
                  <img src={v.thumb} alt="" loading="lazy" decoding="async" />
                  <span className="ap-link-txt">
                    <span className="ap-link-t">{v.title}</span>
                    <span className="ap-link-s">
                      <Clapperboard size={12} aria-hidden /><span dir="ltr">{v.duration}</span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {imageViewer}
      {videoViewer}
    </div>
  )
}

/* یک عدد. وقتی به قاب می‌رسد بالا می‌آید و می‌شمارد — همان یک ژستِ
   صفحه، نه یک جلوه‌ی جدا. */
function Figure({ n, label, delay }: { n: number; label: string; delay: number }) {
  const { ref, n: shown } = useCountUp<HTMLDivElement>(n)
  return (
    <div className="ap-fig ap-r" ref={ref}
      style={{ '--d': `${delay}ms` } as React.CSSProperties}>
      <b>{faDigits(shown)}</b>
      <span>{label}</span>
    </div>
  )
}

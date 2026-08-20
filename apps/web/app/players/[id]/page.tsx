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
  MapPin, ChevronLeft, ArrowLeft,
  Trophy, Building2, Newspaper, Clapperboard,
} from 'lucide-react'
import { getPlayer, DISCIPLINE_LABEL, TONES, faDigits, type Player } from '../../../lib/players-data'
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
import { useReveal, useParallax, useCountUp } from '@/components/player/athlete-motion'
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
  const stageRef = useParallax<HTMLElement>()
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

  /* ⚠️ هر دو از JSONِ اعتبارسنجی‌نشده‌ی دیتابیس کلید می‌گیرند؛ یک ردیفِ
     قدیمی با tone: '' پیش از اولین رنگ‌آمیزی throw می‌کرد. */
  const d = DISCIPLINE_LABEL[player.discipline] ?? DISCIPLINE_LABEL.snooker
  const t = TONES[player.tone] ?? TONES.felt
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
  const initials = (latin || player.name).split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const surname = latin ? (latin.split(/\s+/).pop() ?? latin).toUpperCase() : ''

  /* ── آمار ──
     فقط چیزی که واقعاً در داده هست. «۰ عنوان» بدتر از نبودنِ کارت
     است، پس خانه‌ی خالی اصلاً رندر نمی‌شود. رتبه‌ی رنکینگ هم عمداً
     این‌جا نیست: عددش را خودِ بازیکن وارد می‌کرد. */
  const years = (() => {
    const y = parseInt(String(since).replace(/[۰-۹]/g, ch => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch))), 10)
    return Number.isFinite(y) && y > 1300 ? Math.max(0, CUR_JYEAR - y) : 0
  })()
  /* هر دو نیمه‌ی نوار باید از قاب (حداکثر ۱۱۱۶px) پهن‌تر باشند، وگرنه
     translateX(50%) وسطِ حلقه یک حفره‌ی خالی نشان می‌دهد. */
  const marquee = (() => {
    const base = [...player.highlights]
    while (base.length && base.length < 8) base.push(...player.highlights)
    return [...base, ...base]
  })()

  const hasIntro  = !!player.intro || player.bio.length > 0
  const hasGallery = player.gallery.length > 0 || player.videos.length > 0 || edit.isOwner
  const hasRelated = relatedNews.length > 0 || relatedVids.length > 0
  const sections = [
    ...(hasIntro ? ['intro'] : []),
    ...(player.highlights.length ? ['career'] : []),
    ...(player.tournaments.length ? ['events'] : []),
    ...(player.club ? ['club'] : []),
    ...(hasGallery ? ['gallery'] : []),
    ...(hasRelated ? ['related'] : []),
  ]
  const no = (k: string) => faDigits(String(sections.indexOf(k) + 1).padStart(2, '0'))

  const stats: { n: number; label: string }[] = [
    ...(years ? [{ n: years, label: 'سال سابقه' }] : []),
    ...(player.highlights.length ? [{ n: player.highlights.length, label: 'افتخار ثبت‌شده' }] : []),
    ...(player.tournaments.length ? [{ n: player.tournaments.length, label: 'مسابقه' }] : []),
    ...(disciplineLines.length ? [{ n: disciplineLines.length, label: 'رشته' }] : []),
  ]

  return (
    <div className="ath">
      {pending && <PendingNotice what="پروفایلِ شما" />}

      {/* ═══════════ پرده‌ی اول — صحنه ═══════════ */}
      <header ref={stageRef} className="ath-stage" style={{ '--tone': t.glow } as React.CSSProperties}>
        <div className="ath-scene" style={{ backgroundImage: `url("${encodeURI(player.scene)}")` }} aria-hidden />
        <div className="ath-amb" aria-hidden />
        <div className="ath-slash" aria-hidden />
        <div className="ath-grain" aria-hidden />
        {surname && <div className="ath-surname" aria-hidden>{surname}</div>}

        <div className="ath-wrap ath-stage-in">
          <nav className="ath-crumb" aria-label="مسیر صفحه">
            <Link href="/">خانه</Link>
            <ChevronLeft size={12} aria-hidden />
            <Link href="/players">بازیکنان</Link>
            <ChevronLeft size={12} aria-hidden />
            <span aria-current="page">{player.name}</span>
          </nav>

          <div className="ath-lede">
            <span className="ath-eyebrow">{d.en ?? 'BILLIARDS'}</span>

            {/* نام واژه‌به‌واژه از پشتِ ماسک بالا می‌آید */}
            {/* واژه‌ها برای ماسکِ حرکتی جدا شده‌اند و بینشان کاراکترِ فاصله
                نیست؛ پس صفحه‌خوان باید نامِ کامل را از نسخه‌ی پنهان بخواند. */}
            <h1 className="ath-name">
              <span className="sr-only">{player.name}</span>
              {player.name.split(' ').filter(Boolean).map((w, i) => (
                <span key={i} className="ath-word" aria-hidden>
                  <span style={{ '--i': i } as React.CSSProperties}>{w}</span>
                </span>
              ))}
              {/* نام تا ۹۶px بزرگ می‌شود؛ تیک با em همراهش مقیاس می‌گیرد —
                  همان استثنایی که VerifiedBadge برایش style را باز گذاشته. */}
              {player.verified && (
                <span className="ath-tick">
                  <VerifiedBadge title="بازیکن تأیید شده" style={{ inlineSize: '0.32em', blockSize: '0.32em', marginInlineStart: 0 }} />
                </span>
              )}
            </h1>

            <div className="ath-meta">
              <MapPin size={14} aria-hidden />
              <span>{player.city}، {player.country}</span>
              {latin && (
                <>
                  <span className="ath-dot" aria-hidden />
                  <span dir="ltr" className="ath-latin">{latin}</span>
                </>
              )}
              {since && (
                <>
                  <span className="ath-dot" aria-hidden />
                  <span>از سال {faDigits(since)}</span>
                </>
              )}
            </div>

            {(disciplineLines.length > 0 || player.club) && (
              <div className="ath-chips">
                {disciplineLines.map((l, i) => <span key={`${l}-${i}`} className="ath-chip">{l}</span>)}
                {player.club && <span className="ath-chip"><Building2 size={13} aria-hidden />{player.club.name}</span>}
              </div>
            )}
          </div>

          <div className="ath-portrait">
            {portrait
              ? <img src={portrait} alt={`پرتره‌ی ${player.name}`} decoding="async" fetchPriority="high" onError={() => setBadPortrait(portraitSrc)} />
              : <div className="ath-portrait-fb">{initials}</div>}
          </div>
        </div>

        <div className="ath-scroll" aria-hidden><span>SCROLL</span><i /></div>
      </header>

      {/* ═══════════ نوارِ آمار، روی درزِ دو پرده ═══════════ */}
      {stats.length > 0 && (
        <div className="ath-wrap">
          <div className="ath-stats">
            {stats.map(s => <StatTile key={s.label} n={s.n} label={s.label} />)}
          </div>
        </div>
      )}

      {/* ═══════════ پرده‌ی دوم — سند ═══════════ */}
      <div className="ath-wrap ath-act2">

        {hasIntro && (
          <section className="ath-rev">
            <div className="ath-head"><em>{no('intro')}</em><h2>معرفی</h2><i>PROFILE</i></div>
            {player.intro && <p className="ath-quote">{player.intro}</p>}
            {player.bio.length > 0 && (
              <div className={player.bio.length > 1 ? 'ath-bio' : 'ath-bio is-one'}>
                {player.bio.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}
          </section>
        )}

        {/* نوارِ روان — فهرست دوبار می‌آید تا حلقه بی‌درز بماند */}
        {player.highlights.length >= 3 && (
          <div className="ath-marquee" aria-hidden>
            <ul>
              {marquee.map((h, i) => (
                <li key={i}>{h.title}<b>{faDigits(h.year)}</b></li>
              ))}
            </ul>
          </div>
        )}

        {player.highlights.length > 0 && (
          <section className="ath-rev">
            <div className="ath-head"><em>{no('career')}</em><h2>مسیر قهرمانی</h2><i>CAREER</i></div>
            <div className="ath-tl">
              {player.highlights.map((h, i) => (
                <div key={i} className="ath-tl-item ath-rev" style={{ transitionDelay: `${Math.min(i, 6) * 70}ms` }}>
                  <div className="ath-tl-year">{faDigits(h.year)}</div>
                  <div className="ath-tl-title">{h.title}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {player.tournaments.length > 0 && (
          <section className="ath-rev">
            <div className="ath-head"><em>{no('events')}</em><h2>مسابقات</h2><i>EVENTS</i></div>
            <div className="ath-events">
              {player.tournaments.map((tr, i) => (
                <div key={i} className="ath-event">
                  <b>{tr.name}</b>
                  <span>
                    {faDigits(tr.year)}
                    {tr.result && <><i className="ath-dot" aria-hidden /><em>{tr.result}</em></>}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {player.club && (
          <section className="ath-rev">
            <div className="ath-head"><em>{no('club')}</em><h2>باشگاه</h2><i>CLUB</i></div>
            <Link href={player.club.href ?? '/clubs'} className="ath-club">
              <span className="ath-club-ico"><Building2 size={20} aria-hidden /></span>
              <span className="ath-club-txt">
                <b>{player.club.name}</b>
                <span>باشگاه محل تمرین — {player.city}</span>
              </span>
              <ArrowLeft size={16} className="ath-club-go" aria-hidden />
            </Link>
          </section>
        )}

        {hasGallery && (
          <section className="ath-rev">
            {/* سرصفحه‌ی خودِ ProfileGallery داخلِ .ath پنهان می‌شود (CSS) تا
                شماره‌گذاریِ صفحه یک‌دست بماند؛ h2ِ آن هنوز نامِ دسترس‌پذیرِ
                سکشن را می‌دهد، پس این یکی صرفاً تزئینی است. */}
            <div className="ath-head" aria-hidden><em>{no('gallery')}</em><h2>گالری</h2><i>GALLERY</i></div>
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
            {edit.error && <p role="alert" className="ath-err">{edit.error}</p>}
          </section>
        )}

        {hasRelated && (
          <section className="ath-rev">
            <div className="ath-head"><em>{no('related')}</em><h2>در بیلیارد هاب</h2><i>RELATED</i></div>
            <div className="ath-eco">
              {relatedNews.length > 0 && (
                <div className="ath-eco-card">
                  <div className="ath-eco-head">
                    <Newspaper size={14} aria-hidden /> اخبار مرتبط
                  </div>
                  {relatedNews.map(a => (
                    <Link key={a.id} href={`/news/${a.id}`} className="ath-eco-item">
                      <img src={a.image} alt="" loading="lazy" decoding="async" />
                      <span style={{ minWidth: 0 }}>
                        <span className="ath-eco-title">{a.title}</span>
                        <span className="ath-eco-meta">{a.date}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
              {relatedVids.length > 0 && (
                <div className="ath-eco-card">
                  <div className="ath-eco-head">
                    <Clapperboard size={14} aria-hidden /> ویدیوهای مرتبط
                  </div>
                  {relatedVids.map(v => (
                    <Link key={v.id} href={`/media/${encodeURIComponent(v.id)}`} className="ath-eco-item">
                      <img src={v.thumb} alt="" loading="lazy" decoding="async" />
                      <span style={{ minWidth: 0 }}>
                        <span className="ath-eco-title">{v.title}</span>
                        <span className="ath-eco-meta" dir="ltr">{v.duration}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {imageViewer}
      {videoViewer}
    </div>
  )
}

/* یک خانه‌ی آمار — عددش وقتی به کادر می‌رسد بالا می‌آید */
function StatTile({ n, label }: { n: number; label: string }) {
  const { ref, n: shown } = useCountUp<HTMLDivElement>(n)
  return (
    <div className="ath-stat" ref={ref}>
      <b>{faDigits(shown)}</b>
      <span>{label}</span>
    </div>
  )
}

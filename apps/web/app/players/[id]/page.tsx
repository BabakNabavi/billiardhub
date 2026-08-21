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
import { useReveal } from '@/components/player/athlete-motion'
import './athlete.css'
import { MEDIA_VIDEOS } from '../../../lib/media-data'

/* سالِ جاریِ شمسی — همان تعریفِ صفحه‌های دیگر */
/* «۲۰۲۳» یا «2023» → 2023. سال‌ها دستی وارد می‌شوند و هر دو شکل می‌آیند. */
const faNum = (v: string) => parseInt(String(v).replace(/[۰-۹]/g, ch => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch))), 10) || 0

/* ⚠️ فیلدِ سال آزاد است: یکی «۱۴۰۲» می‌نویسد و دیگری «2023». مقایسه‌ی
   خامِ این دو یعنی ۲۰۱۹ بالاتر از ۱۴۰۲ بنشیند و «آخرین عنوان» غلط
   شود. همه به شمسی می‌آیند و بعد مقایسه می‌شوند. */
const jYear = (v: string) => { const y = faNum(v); return y > 1900 ? y - 621 : y }

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
  /* مونوگرام برای وقتی عکسی نیست — پانلِ تیره خالی نماند */
  const initials = (latin || player.name).split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()

  /* ── آمار ──
     فقط چیزی که واقعاً در داده هست. «۰ عنوان» بدتر از نبودنِ کارت
     است، پس خانه‌ی خالی اصلاً رندر نمی‌شود. رتبه‌ی رنکینگ هم عمداً
     این‌جا نیست: عددش را خودِ بازیکن وارد می‌کرد. */
  const years = (() => {
    const y = jYear(since)
    return y > 1300 ? Math.max(0, CUR_JYEAR - y) : 0
  })()
  /* ── مشخصات ──
     فقط فیلدی که واقعاً داده دارد. ⚠️ `profileToPlayer` برای شهرِ خالی
     «—» می‌گذارد نه رشته‌ی خالی، پس بررسیِ falsy کافی نیست و همان
     خانه‌ی «—»ای رندر می‌شد که این‌جا از آن پرهیز می‌کنیم. */
  const has = (v?: string) => !!v && v !== '—'
  const honours = [...player.highlights].sort((a, b) => jYear(b.year) - jYear(a.year))
  const events  = [...player.tournaments].sort((a, b) => jYear(b.year) - jYear(a.year))
  const lastHonour = honours[0]

  const vitals: { label: string; value: string; sub?: string }[] = [
    /* تهران/تهران زیرِ هم بی‌معنی است — استان فقط وقتی می‌آید که
       با شهر یکی نباشد. */
    ...(has(player.city)
      ? [{ label: 'شهر', value: player.city,
          sub: has(player.province) && player.province !== player.city ? player.province : player.country }]
      : []),
    ...(since ? [{ label: 'شروع فعالیت', value: faDigits(since), sub: years ? `${faDigits(years)} سال سابقه` : undefined }] : []),
    ...(player.club ? [{ label: 'باشگاه', value: player.club.name, sub: 'محل تمرین' }] : []),
    ...(lastHonour ? [{ label: 'آخرین عنوان', value: lastHonour.title, sub: faDigits(lastHonour.year) }] : []),
    ...(disciplineLines.length > 1 ? [{ label: 'رشته‌ها', value: disciplineLines.slice(0, 2).join(' · ') }] : []),
  ]

  const stats: { n: number; label: string; hl?: boolean }[] = [
    ...(player.highlights.length ? [{ n: player.highlights.length, label: 'عنوان و افتخار', hl: true }] : []),
    ...(player.tournaments.length ? [{ n: player.tournaments.length, label: 'مسابقه‌ی ثبت‌شده' }] : []),
    ...(years ? [{ n: years, label: 'سال سابقه' }] : []),
    ...(disciplineLines.length > 1 ? [{ n: disciplineLines.length, label: 'رشته' }] : []),
  ]

  const hasIntro   = !!player.intro || player.bio.length > 0
  const hasGallery = player.gallery.length > 0 || player.videos.length > 0 || edit.isOwner
  const hasRelated = relatedNews.length > 0 || relatedVids.length > 0

  /* ⚠️ کلیدِ آخرین بخش باید از همان شرط‌هایی بیاید که رندر را تعیین
     می‌کنند. نسخه‌ی قبل یک زنجیره‌ی جدا داشت و روی پروفایلِ تازه —
     که هیچ بخشی ندارد — نامِ بخشی را می‌گفت که رندر نمی‌شد؛ نتیجه
     صفحه‌ای بی‌فاصله‌ی کف. */
  const shown = [
    stats.length ? 'career' : '',
    player.highlights.length ? 'honours' : '',
    player.tournaments.length ? 'events' : '',
    hasIntro ? 'intro' : '',
    player.club ? 'club' : '',
    hasGallery ? 'gallery' : '',
    hasRelated ? 'related' : '',
  ].filter(Boolean)
  const last = shown[shown.length - 1]
  const secCls = (k: string) => `ath-sec${last === k ? ' ath-sec--last' : ''}`

  return (
    <div className="ath">
      {pending && <PendingNotice what="پروفایلِ شما" />}

      {/* ═══════════ نوارِ هویت ═══════════ */}
      <header className="ath-hero">
        {/* بافتِ زمینه: شبکه‌ی نازک + حلقه‌های توپ. تزئین نیست — بدونش
            نوار یک مستطیلِ سیاهِ خالی است. */}
        <svg className="ath-hero-art" viewBox="0 0 1440 452" preserveAspectRatio="xMidYMid slice"
          fill="none" aria-hidden focusable="false">
          <defs>
            <linearGradient id="ath-felt" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#0F5140" stopOpacity=".5" />
              <stop offset="1" stopColor="#0F5140" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="1440" height="452" fill="url(#ath-felt)" />
          <g stroke="rgba(255,255,255,0.045)">
            <line x1="0" y1="113" x2="1440" y2="113" /><line x1="0" y1="226" x2="1440" y2="226" />
            <line x1="0" y1="339" x2="1440" y2="339" />
            <line x1="240" y1="0" x2="240" y2="452" /><line x1="480" y1="0" x2="480" y2="452" />
            <line x1="720" y1="0" x2="720" y2="452" /><line x1="960" y1="0" x2="960" y2="452" />
            <line x1="1200" y1="0" x2="1200" y2="452" />
          </g>
          <circle cx="1265" cy="126" r="118" stroke="rgba(199,166,106,0.13)" />
          <circle cx="1265" cy="126" r="72" stroke="rgba(199,166,106,0.09)" />
          <circle cx="1265" cy="126" r="26" fill="rgba(199,166,106,0.10)" />
        </svg>

        <div className="ath-wrap ath-hero-in">
          <div className="ath-id">
            <nav className="ath-crumb" aria-label="مسیر صفحه">
              <Link href="/">خانه</Link>
              <ChevronLeft size={12} aria-hidden />
              <Link href="/players">بازیکنان</Link>
            </nav>

            <span className="ath-kicker">{disciplineLines[0] ?? d.fa}</span>

            <h1 className="ath-name">
              {player.name}
              {player.verified && (
                <span className="ath-tick">
                  {/* اندازه با em تا با نامِ کشسان هم‌مقیاس بماند */}
                  <VerifiedBadge title="بازیکن تأیید شده"
                    style={{ inlineSize: '0.34em', blockSize: '0.34em', marginInlineStart: 0 }} />
                </span>
              )}
            </h1>

            {latin && <div className="ath-lat" dir="ltr">{latin}</div>}
          </div>

          <div className="ath-shot">
            {portrait
              ? <img src={portrait} alt={`عکس ${player.name}`} decoding="async"
                  onError={() => setBadPortrait(portraitSrc)} />
              : <div className="ath-shot-x" aria-hidden>{initials}</div>}
          </div>
        </div>
      </header>

      {/* ═══════════ مشخصات — روی درزِ تیره/روشن ═══════════ */}
      {vitals.length > 0 && (
        <div className="ath-wrap ath-vitals-wrap">
          <div className="ath-vitals-shell">
            <dl className="ath-vitals">
              {vitals.map(v => (
                <div className="ath-vit" key={v.label}>
                  <dt>{v.label}</dt>
                  <dd>
                    {v.value}
                    {v.sub && <span className="ath-vit-s ath-num">{v.sub}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      <div className="ath-wrap ath-body">

        {/* ═══════════ کارنامه ═══════════ */}
        {stats.length > 0 && (
          <section className={secCls('career')} aria-labelledby="ath-h-career">
            <div className="ath-sec-h ath-r">
              <h2 id="ath-h-career">کارنامه</h2>
              <span className="ath-en" aria-hidden>CAREER</span><span className="ath-rule" />
            </div>
            <dl className="ath-stats ath-r">
              {stats.map(s => (
                <div className={s.hl ? 'ath-stat ath-stat--hl' : 'ath-stat'} key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>{faDigits(s.n)}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* ═══════════ افتخارات ═══════════ */}
        {honours.length > 0 && (
          <section className={secCls('honours')} aria-labelledby="ath-h-honours">
            <div className="ath-sec-h ath-r">
              <h2 id="ath-h-honours">افتخارات</h2>
              <span className="ath-en" aria-hidden>HONOURS</span><span className="ath-rule" />
            </div>
            {/* دو ستون در عرضِ کامل، دو سومِ جدول را خالی می‌گذارد */}
            {/* ⚠️ همین جدول هم روی موبایل افقی اسکرول می‌شود (ستونِ
                عنوان از ۳۵۴px پهن‌تر می‌شود)، پس ناحیه‌اش باید نام و
                فوکوس داشته باشد. */}
            <div className="ath-tbl ath-tbl--narrow ath-r" tabIndex={0} role="region" aria-label="جدول افتخارات">
              <table>
                <caption className="ath-sr">فهرست افتخارات، از تازه‌ترین</caption>
                <thead><tr><th scope="col">سال</th><th scope="col">عنوان</th></tr></thead>
                <tbody>
                  {honours.map(h => (
                    <tr key={`${h.year}-${h.title}`}>
                      <td className="ath-y">{faDigits(h.year)}</td>
                      <td>{h.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ═══════════ مسابقات ═══════════ */}
        {events.length > 0 && (
          <section className={secCls('events')} aria-labelledby="ath-h-events">
            <div className="ath-sec-h ath-r">
              <h2 id="ath-h-events">مسابقات</h2>
              <span className="ath-en" aria-hidden>EVENTS</span><span className="ath-rule" />
            </div>
            {/* ⚠️ جدول روی موبایل افقی اسکرول می‌شود؛ ناحیه‌ی اسکرول باید
                نام و فوکوس داشته باشد وگرنه با کیبورد رسیدنی نیست. */}
            <div className="ath-tbl ath-r" tabIndex={0} role="region" aria-label="جدول مسابقات">
              <table>
                <caption className="ath-sr">فهرست مسابقات، از تازه‌ترین</caption>
                <thead>
                  <tr>
                    <th scope="col">سال</th><th scope="col">مسابقه</th>
                    <th scope="col" className="ath-res">نتیجه</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(tr => (
                    <tr key={`${tr.year}-${tr.name}`}>
                      <td className="ath-y">{faDigits(tr.year)}</td>
                      <td>{tr.name}</td>
                      <td className="ath-res">
                        {tr.result
                          ? <span className="ath-chip">{tr.result}</span>
                          : <span className="ath-sr">ثبت نشده</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ═══════════ معرفی ═══════════ */}
        {hasIntro && (
          <section className={secCls('intro')} aria-labelledby="ath-h-intro">
            <div className="ath-sec-h ath-r">
              <h2 id="ath-h-intro">معرفی</h2>
              <span className="ath-en" aria-hidden>PROFILE</span><span className="ath-rule" />
            </div>
            <div className="ath-r">
              {player.intro && <p className="ath-lede">{player.intro}</p>}
              {player.bio.length > 0 && (
                <div className="ath-bio">{player.bio.map((p, i) => <p key={i}>{p}</p>)}</div>
              )}
            </div>
          </section>
        )}

        {/* ═══════════ باشگاه ═══════════ */}
        {player.club && (
          <section className={secCls('club')} aria-labelledby="ath-h-club">
            <div className="ath-sec-h ath-r">
              <h2 id="ath-h-club">باشگاه</h2>
              <span className="ath-en" aria-hidden>CLUB</span><span className="ath-rule" />
            </div>
            <div className="ath-r">
              <Link href={player.club.href ?? '/clubs'} className="ath-club">
                <Building2 size={22} className="ath-club-i" aria-hidden />
                <span className="ath-club-txt">
                  <span className="ath-club-n">{player.club.name}</span>
                  {has(player.city) && <span className="ath-club-s">محل تمرین — {player.city}</span>}
                </span>
                <ArrowLeft size={17} className="ath-club-i" aria-hidden />
              </Link>
            </div>
          </section>
        )}

        {/* ═══════════ گالری ═══════════ */}
        {hasGallery && (
          <section className={secCls('gallery')} aria-labelledby="ath-h-gallery">
            <div className="ath-sec-h ath-r">
              <h2 id="ath-h-gallery">تصاویر و ویدیوها</h2>
              <span className="ath-en" aria-hidden>GALLERY</span><span className="ath-rule" />
            </div>
            <div className="ath-r">
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
            </div>
          </section>
        )}

        {/* ═══════════ در بیلیارد هاب ═══════════ */}
        {hasRelated && (
          <section className={secCls('related')} aria-labelledby="ath-h-related">
            <div className="ath-sec-h ath-r">
              <h2 id="ath-h-related">در بیلیارد هاب</h2>
              <span className="ath-en" aria-hidden>RELATED</span><span className="ath-rule" />
            </div>
            <div className="ath-links ath-r">
              {relatedNews.map(a => (
                <Link key={a.id} href={`/news/${a.id}`} className="ath-link">
                  <img src={a.image} alt="" loading="lazy" decoding="async" />
                  <span className="ath-link-txt">
                    <span className="ath-link-t">{a.title}</span>
                    <span className="ath-link-s"><Newspaper size={12} aria-hidden />{a.date}</span>
                  </span>
                </Link>
              ))}
              {relatedVids.map(v => (
                <Link key={v.id} href={`/media/${encodeURIComponent(v.id)}`} className="ath-link">
                  <img src={v.thumb} alt="" loading="lazy" decoding="async" />
                  <span className="ath-link-txt">
                    <span className="ath-link-t">{v.title}</span>
                    <span className="ath-link-s">
                      <Clapperboard size={12} aria-hidden /><span dir="ltr">{v.duration}</span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ⚠️ پروفایلی که هنوز چیزی ندارد نباید بعد از کارتِ مشخصات
            ناگهان تمام شود — نه برای بازدیدکننده، نه برای صاحبش که
            باید بداند قدمِ بعدی چیست. */}
        {shown.length === 0 && (
          <section className="ath-sec ath-sec--last">
            <div className="ath-empty">
              <p>این پروفایل هنوز تکمیل نشده است.</p>
              {edit.isOwner && (
                <Link href="/dashboard/player" className="ath-empty-cta">تکمیل پروفایل</Link>
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

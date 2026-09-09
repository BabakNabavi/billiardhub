'use client'

/* ─────────────────────────────────────────────────────────────
   گالری پروفایل (مربی و داور) — شبکه‌ی ادیتوریال، نه بندانگشتی.

   ── چه چیزی عوض شد ──
   نسخه‌ی قبلی شش ستون مربع ۷۱ پیکسلی بود؛ با دو عکس، دو تمبر کوچک
   کنار یک کارت خالی دیده می‌شد. حالا شبکه یکنواخت است و خانه‌ها
   کوچک — «نمونه‌کار»، نه دیوار عکس.

   ── تب «آلبوم‌ها» ──
   ⚠️ دو بار اشتباه ساخته شد و هر دو درس دارد:

   ۱) نسخه‌ی اول یک `albums: {id, name, imageIds[]}` بود که فقط در
      `useState` زندگی می‌کرد: مسیر ذخیره نداشت و می‌توانست به عکس
      حذف‌شده اشاره کند.
   ۲) نسخه‌ی دوم آلبوم را *فقط* از روی `media.album` می‌ساخت. آلبوم
      خالی ممکن نبود، پس «ساخت آلبوم» مجبور شد یکی از عکس‌های موجود
      را داخلش بیندازد — کاربر دید که «عکس تصاویر خودبه‌خود آمد
      داخل آلبوم». و چون آلبوم شیء مستقلی نبود، جایی برای «+»
      داخل آلبوم هم نبود.

   حالا نام‌ها در خود پروفایل اعلام می‌شوند (`albums: string[]`) و
   عضویت روی خود رسانه می‌ماند (`media.album`). آلبوم خالی ممکن
   است، آلبوم یتیم ممکن نیست، و داخل هر آلبوم همان خانه‌ی «+» هست
   که رسانه را مستقیم به همان آلبوم اضافه می‌کند.
   ───────────────────────────────────────────────────────────── */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { AskResult } from '@/components/media/useChannelPublish'
import VideoDetailsDialog, { type DetailTarget } from '@/components/media/VideoDetailsDialog'
import type { VideoDetail } from '@/lib/media/video-details'
import { Images, Clapperboard, FolderOpen, ArrowRight, Plus, Play, Loader2 } from 'lucide-react'
import { useTabKeys } from '@/hooks/use-tab-keys'
import { toFaDigits } from '@/lib/jalali'
import { askText, notify } from '@/lib/ui/dialogs'

export interface GalleryImage { id: string; url: string; caption: string; album?: string }
export interface GalleryVideo { id: string; url?: string; thumbnail: string; title: string; duration: string; album?: string }

/* همان سقفی که صفحه‌های نقش اعمال می‌کنند */
const MAX_VIDEO_MB = 25

const TABS = ['photos', 'videos', 'albums'] as const
type Tab = typeof TABS[number]

export default function ProfileGallery({
  images, videos, albumNames = [], onOpenImage, onOpenVideo,
  canEdit = false, busy = false, onAddImages, onAddVideos, onNewAlbum, beforeAddVideos,
}: {
  images: GalleryImage[]
  videos: GalleryVideo[]
  /** نام آلبوم‌های اعلام‌شده — آلبوم خالی هم باید دیده شود */
  albumNames?: string[]
  /** کل فهرست + اندیس، تا داخل نما بشود بعدی/قبلی رفت */
  /* `ids` هم می‌رود: حذف باید با شناسه انجام شود نه با اندیس.
      ⚠️ داخل آلبوم، اندیس خانه اندیس همان زیرمجموعه است و صفحه با
      آن روی کل گالری فیلتر می‌کرد — یعنی حذف از داخل آلبوم عکس
      دیگری را می‌برد. */
  onOpenImage: (urls: string[], index: number, meta: { title: string; alt: string }, ids: string[]) => void
  /** ویدیو در نمای تمام‌صفحه باز می‌شود، نه داخل خانه‌ی شبکه */
  onOpenVideo?: (v: GalleryVideo) => void
  /* ── ویرایش درجا ──
     فقط صاحب پروفایل این‌ها را می‌گیرد؛ نبودنشان یعنی دکمه‌ی «+»
     اصلا رندر نشود. با این‌ها لازم نیست برای یک عکس تا داشبورد
     برود و برگردد. */
  canEdit?: boolean
  busy?: boolean
  /** `album` یعنی رسانه مستقیم داخل همان آلبوم بنشیند */
  onAddImages?: (files: File[], album?: string) => void | Promise<void>
  /* ویدیو هم مثل عکس از گالری خود کاربر انتخاب می‌شود.
     ⚠️ `details` عنوان/دسته/توضیحی است که کاربر خودش داده — هم‌ترتیب
     با `files`. تا دیروز عنوان *نام فایل* بود و همان به بیلیارد
     مدیا می‌رفت؛ «screen record 04-14-2026» برای گوگل بی‌ارزش است. */
  onAddVideos?: (files: File[], album?: string, details?: VideoDetail[]) => void | Promise<void>
  /** ── پیش از بازکردن انتخابگر ویدیو ──
   *  صفحه این‌جا می‌پرسد «کانال بیلیارد مدیا داری؟».
   *
   *  ⚠️ چرا این‌جا و نه بعد از آپلود: نسخه‌ی اول بعد از آپلود
   *  می‌پرسید، یعنی کاربر ۲۵ مگابایت را روی شبکه‌ی موبایل بالا
   *  می‌فرستاد و تازه آن‌وقت پنجره می‌آمد.
   *
   *  ⚠️ **قرارداد**: `true` یعنی «تصمیم گرفته شد، همین حالا باز کن»
   *  و باید در همان تیک باز شود. قول فقط وقتی برمی‌گردد که پنجره‌ای
   *  باز شده باشد و کلیک خود کاربر داخل آن حلش کند. */
  beforeAddVideos?: () => AskResult
  onNewAlbum?: (name: string) => void | Promise<void>
}) {
  /* ── آلبوم‌ها: نام‌های اعلام‌شده + هرچه روی رسانه‌ها هست ──
     دومی برای ردیف‌های قدیمی است که فقط `media.album` دارند. */
  const albums = useMemo(() => {
    const map = new Map<string, { name: string; images: GalleryImage[]; videos: GalleryVideo[] }>()
    const put = (name: string) => {
      const key = name.trim()
      if (!map.has(key)) map.set(key, { name: key, images: [], videos: [] })
      return map.get(key)!
    }
    /* داده از jsonb می‌آید و اسکیمای سفت‌وسختی ندارد؛ یک مقدار
       غیررشته صفحه‌ی عمومی را برای همه سفید می‌کرد. */
    /* ⚠️ خود آرایه هم ممکن است آرایه نباشد: پاک‌سازی سرور فقط
       ذخیره‌های تازه را می‌گیرد و ردیف قدیمی خراب همچنان خوانده
       می‌شود. اول شکل، بعد عضوها. */
    for (const n of (Array.isArray(albumNames) ? albumNames : [])) { if (typeof n === 'string' && n.trim()) put(n) }
    for (const g of images) { const n = (g.album ?? '').trim(); if (n) put(n).images.push(g) }
    for (const v of videos) { const n = (v.album ?? '').trim(); if (n) put(n).videos.push(v) }
    return [...map.values()]
  }, [images, videos, albumNames])

  /* ── نقشی که هنوز ویدیو ندارد ──
     باشگاه ستون ویدیو ندارد (جدولش جداست و افزودن ستون مهاجرت
     می‌خواهد). تب خالی که دکمه‌اش هم کاری نمی‌کند بدتر از نبودنش
     است، پس وقتی نه ویدیویی هست نه راهی برای افزودنش، تب نمی‌آید. */
  const showVideos = videos.length > 0 || !!onAddVideos

  const [tab, setTab] = useState<Tab>(images.length === 0 && videos.length > 0 ? 'videos' : 'photos')
  const [openAlbum, setOpenAlbum] = useState<string | null>(null)
  /* فشرده‌سازی چند عکس روی موبایل ضعیف چند ثانیه است و در آن فاصله
     `edit.saving` هنوز روشن نشده — خانه‌ی «+» کلیک‌پذیر می‌ماند. */
  const [working, setWorking] = useState(false)
  /* فایل‌های انتخاب‌شده‌ای که منتظر مشخصات‌اند */
  /* ⚠️ `targets` همین‌جا یک‌بار ساخته می‌شود، نه در JSX: آرایه‌ی تازه
     در هر رندر یعنی افکت پیش‌نمایش پنجره هر بار blobها را باطل و
     دوباره می‌سازد. */
  const [detailFor, setDetailFor] = useState<{ files: File[]; targets: DetailTarget[]; album?: string } | null>(null)
  const detailDone = useRef<((d: VideoDetail[] | null) => void) | null>(null)

  /* ── چرا تب پیش‌فرض یک‌بار حساب‌شدن کافی نیست ──
     صفحه اول از `localStorage` پر می‌شود و پاسخ سرور یک تیک بعد
     می‌رسد. اگر نسخه‌ی محلی خالی باشد، مقدار اولیه «تصاویر» می‌ماند
     و بازدیدکننده پنل خالی می‌بیند درحالی‌که مربی فقط ویدیو دارد.
     `picked` نگه می‌دارد که کاربر خودش تبی انتخاب کرده یا نه — بعد از
     انتخاب او دیگر چیزی زیر دستش عوض نمی‌شود. */
  const fileRef = useRef<HTMLInputElement>(null)
  const vidRef = useRef<HTMLInputElement>(null)
  const bothRef = useRef<HTMLInputElement>(null)
  /* آلبوم مقصد انتخاب فایل در جریان. `ref` است نه state: بین
     کلیک و بازگشت پنجره‌ی فایل هیچ رندری لازم نیست و state این‌جا
     فقط یک رندر اضافه بود. */
  const target = useRef<string | undefined>(undefined)
  const picked = useRef(false)
  const choose = useCallback((k: Tab) => { picked.current = true; setOpenAlbum(null); setTab(k) }, [])

  /* آلبوم باز اگر ناپدید شود (آخرین رسانه‌اش حذف شد و اعلام‌شده هم
     نبود)، ماندن در نمای خالی گیج‌کننده است — به فهرست برمی‌گردد. */
  useEffect(() => {
    if (openAlbum && !albums.some(a => a.name === openAlbum)) setOpenAlbum(null)
  }, [albums, openAlbum])

  useEffect(() => {
    if (picked.current) return
    if (images.length === 0 && videos.length > 0) setTab('videos')
    else if (videos.length === 0 && images.length > 0) setTab('photos')
  }, [images.length, videos.length])

  /* `choose` داده می‌شود نه `setTab`: با `setTab` انتخاب کیبوردی ثبت
     نمی‌شد و افکت بالا می‌توانست تب کاربر را پس بگیرد. */
  const onTabKey = useTabKeys(TABS, tab, choose, 'chtab-')

  const cell = (g: GalleryImage, list: GalleryImage[], i: number) => (
    <button key={g.id} type="button" className="ch-gal-cell"
      onClick={() => onOpenImage(list.map(x => x.url), i, { title: g.caption || 'تصویر', alt: g.caption || 'تصویر گالری' }, list.map(x => x.id))}>
      {/* عنوان جای دیگری است: `alt` و عنوان نمای تمام‌صفحه.
          نوار روی خانه‌ی ۱۱۶ پیکسلی نصف تصویر را می‌پوشاند. */}
      <img src={g.url} alt={g.caption || 'تصویر گالری'} loading="lazy" decoding="async" />
    </button>
  )

  /* ── خانه‌ی ویدیو ──
     ⚠️ قبلا همین‌جا خود پخش‌کننده رندر می‌شد؛ یعنی فیلم در
     قاب ۱۱۶ پیکسلی پخش می‌شد و نوار کنترل نصف مربع را می‌گرفت.
     حالا فقط پوستر است و کلیک نمای تمام‌صفحه باز می‌کند. */
  const videoCell = (v: GalleryVideo) => (
    /* ردیف قدیمی نشانی فایل ندارد؛ دکمه‌ی پخشی که کاری نمی‌کند بدتر
       از نبودنش است — پس آن‌ها فقط یک قاب ساکت‌اند. */
    <button key={v.id} type="button" className="ch-vid-tile"
      onClick={() => onOpenVideo?.(v)} disabled={!v.url}
      aria-label={v.url ? (v.title ? `پخش ویدیو: ${v.title}` : 'پخش ویدیو') : 'این ویدیو در دسترس نیست'}>
      {/* بدون پوستر فقط نشان پخش می‌ماند؛ نسخه‌ی اول آیکون جایگزین
          را هم رویش می‌گذاشت و دو نشان روی هم می‌افتاد. */}
      {v.thumbnail && <img src={v.thumbnail} alt="" loading="lazy" decoding="async" />}
      <span className="ch-vid-play" aria-hidden>
        {v.url ? <Play size={26} fill="currentColor" /> : <Clapperboard size={22} />}
      </span>
      {v.duration && <span className="ch-vid-time" dir="ltr">{v.duration}</span>}
    </button>
  )

  /* ── «+» یک خانه است، نه دکمه‌ای بیرون باکس ──
     هم‌اندازه‌ی بقیه‌ی خانه‌ها و همیشه اول شبکه. برچسب متنی ندارد
     چون تب فعال خودش می‌گوید چه چیزی اضافه می‌شود؛ نام دسترس‌پذیر
     را `aria-label` می‌دهد. */
  const addTile = (label: string, onClick: () => void, icon?: React.ReactNode, cls = 'ch-gal-cell') => (
    <button type="button" className={`${cls} ch-add-tile`} onClick={onClick}
      disabled={busy || working} aria-label={label} title={label}>
      {busy || working ? <Loader2 size={22} className="ch-spin" aria-hidden /> : (icon ?? <Plus size={26} aria-hidden />)}
    </button>
  )

  const pickImages = (album?: string) => { target.current = album; fileRef.current?.click() }
  /* ── چرا این‌قدر دست‌وپاگیر نوشته شده ──
     بازکردن انتخابگر فایل «حرکت کاربر» می‌خواهد و سافاری آن را
     فقط در همان تیک رویداد (و میکروتسک‌هایش) می‌پذیرد. اگر بین
     کلیک و `click()` یک درخواست شبکه بنشیند، بی‌هیچ خطایی هیچ
     اتفاقی نمی‌افتد — دکمه‌ی «+» روی آیفون مرده می‌شود.

     پس وقتی `beforeAddVideos` همگام `true` می‌دهد، در همین تیک باز
     می‌کنیم؛ و وقتی قول می‌دهد یعنی پنجره‌ای باز شده و کلیک کاربر
     داخل آن پنجره حرکت تازه‌ای است.

     ⚠️ خطای دروازه هرگز نباید انتخابگر را ببندد: انتشار در مدیا
     اختیاری است، افزودن به گالری نه. */
  const openVideoPicker = () => vidRef.current?.click()
  const pickVideo = (album?: string) => {
    target.current = album
    let gate: AskResult = true
    try { gate = beforeAddVideos?.() ?? true } catch { gate = true }
    if (gate === true) { openVideoPicker(); return }
    gate.then(openVideoPicker, openVideoPicker)
  }
  /* ⚠️ این «+» داخل آلبوم است و عکس *و* ویدیو می‌گیرد. پس بر خلاف
     «+» تب ویدیوها، این‌جا پیش از انتخاب نمی‌پرسیم — کسی که فقط
     می‌خواهد یک عکس به آلبوم اضافه کند نباید سؤال کانال ویدیو
     ببیند. دروازه بعد از انتخاب و پیش از آپلود در `addMixed` است،
     و آن‌جا «حرکت کاربر» لازم نیست چون فایل‌ها انتخاب شده‌اند. */
  const pickBoth = (album?: string) => { target.current = album; bothRef.current?.click() }

  /* ── تقسیم انتخاب ترکیبی ──
     اول `type` که مرورگر می‌دهد؛ ولی بعضی انتخاب‌گرهای اندروید (و
     فایل‌های .mov/.heic) `type` خالی می‌دهند و آن فایل‌ها بی‌صدا
     می‌افتادند — پس پسوند تور دوم است، نه اول. */
  const isImg = (f: File) => f.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(f.name)
  const isVid = (f: File) => f.type.startsWith('video/') || /\.(mp4|mov|m4v|webm|mkv|3gp)$/i.test(f.name)

  /* ── مشخصات، پیش از آپلود ──
     ⚠️ یوتیوب فایل را همان لحظه بالا می‌فرستد و فرم را حین آپلود
     نشان می‌دهد. این‌جا عمدا برعکس است: مخاطب روی شبکه‌ی موبایل
     ایران است و اگر وسط فرم پشیمان شود نباید حجمش رفته باشد.
     `null` یعنی انصراف از کل افزودن. */
  const askDetails = useCallback((files: File[], album?: string) =>
    new Promise<VideoDetail[] | null>(resolve => {
      /* ⚠️ فراخوان دوم قول اول را یتیم می‌کرد و آن `addMixed` تا ابد
         پشت `await` می‌ماند — یعنی گالری در حالت «در حال کار» گیر. */
      detailDone.current?.(null)
      detailDone.current = resolve
      setDetailFor({ files, targets: files.map(f => ({ name: f.name, file: f })), album })
    }), [])
  const closeDetails = useCallback((d: VideoDetail[] | null) => {
    setDetailFor(null)
    const done = detailDone.current; detailDone.current = null
    done?.(d)
  }, [])
  const cancelDetails = useCallback(() => closeDetails(null), [closeDetails])
  /* قول باز نباید با unmount معلق بماند */
  useEffect(() => () => { detailDone.current?.(null); detailDone.current = null }, [])

  const addMixed = async (files: File[], album?: string) => {
    const imgs = files.filter(isImg)
    const allVids = files.filter(f => !isImg(f) && isVid(f))
    const rest = files.filter(f => !isImg(f) && !isVid(f))
    /* ⚠️ فایل بزرگ‌تر از سقف را صفحه‌ها بی‌صدا کنار می‌گذارند. اگر
       این‌جا فیلتر نشود، کاربر برایش عنوان و دسته می‌نویسد و بعد
       هیچ‌وقت آپلود نمی‌شود. */
    const vids = allVids.filter(f => f.size <= MAX_VIDEO_MB * 1024 * 1024)
    const heavy = allVids.filter(f => f.size > MAX_VIDEO_MB * 1024 * 1024)

    /* ── ترتیب مهم است ──
       ۱) اول مشخصات: انصراف باید *پیش از* هر آپلودی باشد، وگرنه
          «انصراف» عکس‌های همان انتخاب را آپلودشده رها می‌کرد.
       ۲) بعد دروازه‌ی کانال، و فقط اگر کاربر واقعا می‌خواهد منتشر
          کند — کسی که «فقط در گالری» زده نباید مجبور به ساخت کانال
          شود. */
    let details: VideoDetail[] | null = null
    if (vids.length) {
      details = await askDetails(vids, album)
      if (!details) return
    }

    setWorking(true)
    try {
      if (details?.some(d => d.publish)) {
        try { const g: AskResult | undefined = beforeAddVideos?.(); if (g !== true) await g } catch { /* دروازه اختیاری است */ }
      }
      if (imgs.length) await onAddImages?.(imgs, album)
      if (vids.length && details) await onAddVideos?.(vids, album, details)
      if (heavy.length) notify(`این ویدیوها از سقف ${toFaDigits(MAX_VIDEO_MB)} مگابایت بزرگ‌ترند: ${heavy.map(f => f.name).join('، ')}`)
      if (rest.length) notify(`این فایل‌ها نه عکس بودند نه ویدیو: ${rest.map(f => f.name).join('، ')}`)
    } catch {
      /* بدون این، یک فایل خراب عکس همه‌ی ویدیوهای همان انتخاب را
         هم می‌انداخت و کاربر هیچ پیامی نمی‌دید. */
      notify('افزودن رسانه انجام نشد؛ دوباره تلاش کنید')
    } finally { setWorking(false) }
  }

  const askAlbumName = async () => {
    const name = (await askText('آلبوم تازه', { placeholder: 'نام آلبوم' }))?.trim()
    if (name) await onNewAlbum?.(name)
  }

  const empty = (icon: React.ReactNode, text: string) => (
    <div className="ch-gal-empty">{icon}<p>{text}</p></div>
  )

  const current = openAlbum ? albums.find(a => a.name === openAlbum) ?? null : null

  return (
    <section aria-labelledby="ch-gallery-h">
      <div className="ch-sec-head">
        <h2 id="ch-gallery-h">گالری</h2>
        <span className="en">GALLERY</span>
        <span className="rule" aria-hidden />
      </div>

      <div className="lq-seg ch-gal-tabs" role="tablist" aria-label="بخش‌های گالری" onKeyDown={onTabKey}>
        {(([['photos', 'تصاویر', images.length], ['videos', 'ویدیوها', videos.length], ['albums', 'آلبوم‌ها', albums.length]] as const)
          .filter(([k]) => k !== 'videos' || showVideos)).map(([k, label, n]) => (
          <button key={k} type="button" role="tab" id={`chtab-${k}`}
            aria-selected={tab === k} aria-controls={`chpanel-${k}`} tabIndex={tab === k ? 0 : -1}
            onClick={() => choose(k)}>
            {label}{n > 0 && <span className="ch-gal-n">{toFaDigits(n)}</span>}
          </button>
        ))}
      </div>

      {/* ورودی‌های فایل بیرون از شبکه می‌مانند — پنهان‌اند و جا نمی‌گیرند */}
      {canEdit && (
        <>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden
            onChange={e => { const f = [...(e.target.files ?? [])]; e.target.value = ''; if (f.length) void addMixed(f, target.current) }} />
          {/* ⚠️ ویدیو هم فایل است، نه نشانی آپارات/یوتیوب. نسخه‌ی اول
              نشانی می‌پرسید که اصلا کار این دکمه نبود. */}
          <input ref={vidRef} type="file" accept="video/*" multiple hidden
            onChange={e => { const f = [...(e.target.files ?? [])]; e.target.value = ''; if (f.length) void addMixed(f, target.current) }} />
          {/* ── داخل آلبوم یک «+» بس است ──
              ⚠️ اول دو خانه گذاشته شد (عکس و ویدیو) و کاربر درست گفت
              که جالب نیست. یک ورودی هر دو را می‌گیرد و بر اساس نوع
              خود فایل تقسیم می‌شود. */}
          <input ref={bothRef} type="file" accept={onAddVideos ? 'image/*,video/*' : 'image/*'} multiple hidden
            onChange={e => { const f = [...(e.target.files ?? [])]; e.target.value = ''; if (f.length) void addMixed(f, target.current) }} />
        </>
      )}

      {/* هر سه پنل همیشه در DOM‌اند و غیرفعال `hidden` می‌گیرد:
          `aria-controls` نباید به شناسه‌ای اشاره کند که وجود ندارد. */}
      <div id="chpanel-photos" role="tabpanel" aria-labelledby="chtab-photos" hidden={tab !== 'photos'}>
        {images.length === 0 && !canEdit
          ? empty(<Images size={30} aria-hidden />, 'هنوز تصویری اضافه نشده است.')
          : (
            <div className="ch-gal-grid">
              {canEdit && onAddImages && addTile('افزودن تصویر', () => pickImages())}
              {images.map((g, i) => cell(g, images, i))}
            </div>
          )}
      </div>

      <div id="chpanel-videos" role="tabpanel" aria-labelledby="chtab-videos" hidden={tab !== 'videos'}>
        {videos.length === 0 && !canEdit
          ? empty(<Clapperboard size={30} aria-hidden />, 'هنوز ویدیویی اضافه نشده است.')
          /* ⚠️ شبکه‌ی ویدیو ستون‌های خودش را داشت و خانه‌ها اندازه‌ی
             دیگری می‌گرفتند. کاربر خواست هر سه تب یک اندازه باشند —
             همان اندازه‌ی تب تصاویر. پس همان شبکه استفاده می‌شود. */
          : (
            <div className="ch-gal-grid">
              {canEdit && onAddVideos && addTile('افزودن ویدیو', () => pickVideo())}
              {videos.map(v => videoCell(v))}
            </div>
          )}
      </div>

      {detailFor && (
        <VideoDetailsDialog
          /* ⚠️ کلید از خود فایل‌ها: اگر انتخاب تازه‌ای بنشیند، پنجره
             باید از نو ساخته شود — وگرنه `items` طول قبلی را نگه
             می‌دارد و اندیس‌ها از فهرست بیرون می‌زنند. */
          key={detailFor.files.map(f => `${f.name}:${f.size}`).join('|')}
          targets={detailFor.targets}
          onDone={closeDetails}
          /* عنوان نوشته‌شده حفظ می‌شود؛ فقط `publish` خاموش است. */
          onSkip={closeDetails}
          onClose={cancelDetails}
        />
      )}

      <div id="chpanel-albums" role="tabpanel" aria-labelledby="chtab-albums" hidden={tab !== 'albums'}>
        {albums.length === 0 && !canEdit ? (
          empty(<FolderOpen size={30} aria-hidden />, 'هنوز آلبومی ساخته نشده است.')
        ) : current ? (
          <>
            <div className="ch-alb-head">
              <button type="button" className="ch-alb-back" onClick={() => setOpenAlbum(null)}>
                <ArrowRight size={15} aria-hidden />همه‌ی آلبوم‌ها
              </button>
              <h3>{current.name}</h3>
            </div>
            {/* داخل آلبوم هم همان شبکه‌ی مربع — یک اندازه در همه‌جا.
                ⚠️ اول دو خانه بود (یکی عکس، یکی ویدیو). کاربر گفت باید
                یک «+» باشد که هر دو را بگیرد؛ درست هم هست. */}
            <div className="ch-gal-grid">
              {canEdit && (onAddImages || onAddVideos) && addTile(
                onAddVideos ? 'افزودن تصویر یا ویدیو به این آلبوم' : 'افزودن تصویر به این آلبوم',
                () => pickBoth(current.name))}
              {current.images.map((g, i) => cell(g, current.images, i))}
              {current.videos.map(v => videoCell(v))}
            </div>
            {!canEdit && current.images.length === 0 && current.videos.length === 0 && (
              empty(<FolderOpen size={30} aria-hidden />, 'این آلبوم هنوز خالی است.')
            )}
          </>
        ) : (
          <div className="ch-gal-grid">
            {canEdit && addTile('آلبوم تازه', () => void askAlbumName())}
            {albums.map(a => {
              const cover = a.images[0]?.url ?? a.videos[0]?.thumbnail
              const n = a.images.length + a.videos.length
              return (
                <button key={a.name} type="button" className="ch-alb" onClick={() => setOpenAlbum(a.name)}>
                  <span className="ch-alb-cover">
                    {cover
                      ? <img src={cover} alt="" loading="lazy" decoding="async" />
                      : <FolderOpen size={22} aria-hidden />}
                  </span>
                  <span className="ch-alb-meta">
                    <span className="ch-alb-name">{a.name}</span>
                    <span className="ch-alb-n">{toFaDigits(n)} مورد</span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

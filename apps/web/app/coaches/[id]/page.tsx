'use client'
import { applyImagePatch } from '@/lib/profiles/edit-image'
import { useChannelPublish, type PublishVideo } from '@/components/media/useChannelPublish'
import { useVideoEdit } from '@/components/media/useVideoEdit'
import { detailTitle, type VideoDetail } from '@/lib/media/video-details'
import { useState, useEffect } from 'react'
import ProfileHero from '../../../components/profile/ProfileHero'
import ProfileGallery from '../../../components/profile/ProfileGallery'
import Reviews from '../../../components/reviews/Reviews'
import SessionRequest from '../../../components/coach/SessionRequest'
import GradeLadder from '../../../components/profile/GradeLadder'
import ProfileContactLinks from '../../../components/profile/ProfileContactLinks'
import { useProfileSections } from '@/hooks/use-profile-sections'
import '../../../components/profile/profile-page.css'
import { fetchProfileResult } from '../../../lib/profiles/client'
import { useOwnerEdit } from '../../../lib/profiles/use-owner-edit'
import { compressImage } from '../../../lib/seller-store'
import { uploadFile } from '../../../lib/supabase'
import { videoMeta, formatDuration } from '../../../lib/video-thumb'
/* ⚠️ prompt/confirm بومی در این پروژه ممنوع است (گارد ایستا دارد):
   جریان را قفل می‌کنند، استایل سایت را نمی‌گیرند و روی وب‌ویو
   اپ رفتارشان یکسان نیست. `askText`/`ask` همان کار را با پنجره‌ی
   خود سایت می‌کنند. */
import { ask, notify } from '../../../lib/ui/dialogs'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useProfileImageViewer } from '@/components/ProfileImageViewer'
import { useProfileVideoViewer } from '@/components/profile/ProfileVideoViewer'
import { normalizeDigits } from '@/lib/text-fa'
import { toFaDigits } from '@/lib/jalali'
import { CalendarPlus } from 'lucide-react'
import { getCoachProfile, badgeFromGrades, disciplineLabel, GRADES, type CoachProfile } from '@/lib/coach-store'

/* همان سقفی که پنل اعمال می‌کند */
/* ترتیبِ نوارِ تب. بیرونِ کامپوننت چون مرجعش باید بین رندرها یکی بماند. */
const SECTION_IDS = ['media', 'about', 'career', 'reviews'] as const

const MAX_VIDEO_MB = 25

/* ─── انواع ─── */
interface GImg  { id:string; url:string; caption:string; album?:string }
/* `url` نشانی فایل است؛ ردیف قدیمی فقط بندانگشتی دارد و کارت
   بی‌پخش رندر می‌شود. */
interface VItem { id:string; url?:string; thumbnail:string; title:string; duration:string; album?:string }

/* شکلی که این صفحه رندر می‌کند — دقیقا همان چیزی که پنل مربی
   ذخیره می‌کند، نه یک ابرمجموعه. فیلدهای مرده‌ی قبلی (امتیاز،
   افتخارات، استوری) با حذف داده‌ی نمایشی رفتند. */
interface CoachView {
  id:string; name:string; city:string; verified:boolean
  photo?:string; coverImage?:string
  bio:string; fullBio:string
  disciplines:string[]
  phone:string; whatsapp:string; instagram?:string; telegram?:string
  gallery:GImg[]; videos:VItem[]
}

function mapLocalToView(p: CoachProfile): CoachView {
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
export default function CoachProfilePage() {
  const { id } = useParams<{id:string}>()
  const [localP, setLocalP]   = useState<CoachProfile | null>(null)
  const [checked, setChecked] = useState(false)
  /* `null` هنوز نمی‌دانیم · `false` سرور جواب داد · `true` شبکه شکست.
     بدون این، خطای شبکه با «پیدا نشد» یکی می‌شد و به کاربر می‌گفتیم
     مربی وجود ندارد درحالی‌که فقط اینترنت قطع بود. */
  const [netFail, setNetFail] = useState(false)
  /* مالک ردیف — از ستون سرور، نه از داده‌ی داخل فرم. فقط برای
     نشان‌دادن دکمه‌های ویرایش؛ اجازه‌ی واقعی روی سرور سنجیده می‌شود. */
  const [ownerId, setOwnerId] = useState<string | null>(null)
  /* پرچم قطعی سرور — مقایسه‌ی مرورگر فقط فالبک است */
  const [mine, setMine] = useState<boolean | undefined>(undefined)
  const [sessionPrice, setSessionPrice] = useState(0)
  const [sessionMin, setSessionMin] = useState(60)
  const [vidBusy, setVidBusy] = useState(false)
  /* انتشار در بیلیارد مدیا — پنجره فقط وقتی باز می‌شود که کانال
     همین نقش نباشد. آپلود گالری هرگز به نتیجه‌اش وابسته نیست. */

  /* ── چرا سرور هم خوانده می‌شود ──
     این صفحه فقط `localStorage` را می‌دید، یعنی پروفایل — عکس، معرفی،
     ویدیو — تنها در مرورگر خود صاحبش دیده می‌شد. حافظه‌ی محلی اول
     می‌آید چون فوری است؛ پاسخ سرور رویش می‌نشیند. */
  const [reloadKey, setReloadKey] = useState(0)
  useEffect(() => {
    if (!id) { setChecked(true); return }
    setLocalP(getCoachProfile(id))
    let alive = true
    setNetFail(false)
    void (async () => {
      try {
        const r = await fetchProfileResult<CoachProfile>('coach', id)
        if (!alive) return
        if (r.state === 'found') {
          setLocalP({ ...(r.profile.data as CoachProfile), slug: r.profile.slug, verified: r.profile.verified })
          setOwnerId(r.profile.ownerId)
          setMine(r.isMine === true)
          /* مبلغ و مدت جلسه ستون خود ردیف‌اند (مهاجرت ۰۹۱)، نه
             داخل jsonb — پس از پاسخ سرور خوانده می‌شوند. */
          setSessionPrice(Number(r.profile.sessionPrice ?? 0))
          setSessionMin(Number(r.profile.sessionMin ?? 60))
        }
        else if (r.state === 'error') setNetFail(true)
      } catch {
        /* `fetchProfileResult` خودش خطا را می‌گیرد؛ این فقط تور
           ایمنی است تا یک استثنای غیرمنتظره صفحه را در اسکلت
           قفل نکند. */
        if (alive) setNetFail(true)
      } finally {
        if (alive) setChecked(true)
      }
    })()
    return () => { alive = false }
  }, [id, reloadKey])

  const coach = localP ? mapLocalToView(localP) : null
  const { open: openImage, viewer: imageViewer } = useProfileImageViewer()
  const { open: openVideo, viewer: videoViewer } = useProfileVideoViewer()

  /* ── ویرایش درجا ──
     ⚠️ این فراخوانی *باید* پیش از هر `return` شرطی باشد. یک‌بار
     پایین‌تر — بعد از گارد اسکلت و گارد «پیدا نشد» — نوشته شد و
     صفحه با React #310 («تعداد هوک‌ها عوض شد») سفید می‌شد؛ برای
     همه، نه فقط مالک.

     صاحب پروفایل بدون رفتن به داشبورد عکس/ویدیو/آلبوم اضافه و حذف
     می‌کند. `apply` کل پروفایل را با یک فیلد عوض‌شده ذخیره می‌کند و
     نشانی Storage را که سرور برمی‌گرداند می‌نشاند. */
  const edit = useOwnerEdit<CoachProfile>('coach', id, localP, ownerId, setLocalP, mine)
  const { gate: channelGate, ask: askChannel, publish: publishToChannel } = useChannelPublish('coach', ownerId ?? undefined, edit.isOwner, notify)

  /* ⚠️ این هوک باید **بالای** returnهای زودهنگام بماند. قبلا پایین‌تر
     بود و نتیجه‌اش این بود که رندر اول (`checked === false`، یعنی
     اسکلت) یک هوک کمتر صدا می‌زد و رندر بعدی — وقتی داده می‌رسید —
     یکی بیشتر. React با خطای #310 کل صفحه را می‌انداخت، پس صفحه‌ی
     مربی و داور *همیشه* بعد از لود شدن می‌ترکید و کاربر «مشکلی پیش
     آمد» می‌دید. هر هوک تازه‌ای هم از این به بعد باید همین‌جا، بالای
     خط `if (!checked)` اضافه شود. */
  /* ── ویرایش عنوان ویدیو ──
     عنوان دو نسخه دارد: ردیف گالری پروفایل و ردیف بیلیارد مدیا.
     هوک دومی را می‌زند، این تابع اولی را. کلید نشانی فایل است،
     چون گالری شناسه‌ی ردیف مدیا را ندارد. */
  /* ⚠️ بالای هر early return — این فایل قبلا دقیقا با یک هوکِ
     زیرِ گارد، خطای React #310 روی سایتِ زنده داد. */
  useProfileSections(SECTION_IDS, [checked, reloadKey])

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

  /* ⚠️ `div` خالی بود. قاعده‌ی پروژه اسکلت می‌خواهد، و روی شبکه‌ی
     کند یک صفحه‌ی تماما سفید از خرابی قابل تشخیص نیست. */
  if (!checked) {
    return (
      /* `role="status"` لازم است: `aria-label` روی یک `div` بی‌نقش
         را بیشتر خواننده‌های صفحه نادیده می‌گیرند و اسکلت هیچ
         چیزی اعلام نمی‌کرد. عرض خطوط هم به CSS رفت — مقدار ثابت
         اینلاین جای درستش نیست. */
      /* ⚠️ اسکلت باید شکلِ چیزی باشد که می‌آید، وگرنه لحظه‌ی رسیدنِ
         داده یک بازچینشِ دیدنی است. این‌جا: هیرو ← نوارِ آمار ←
         نوارِ تب ← رسانه‌ی تمام‌عرض. */
      <div className="ch-page ch-ch ch-skel" role="status" aria-busy="true" aria-label="در حال بارگذاری پروفایل مربی">
        <div className="ch-skel-hero" />
        {/* ⚠️ آمار حالا داخلِ خودِ هدر است، پس اسکلت هم باید هدرِ
            بلندتر نشان دهد — وگرنه لحظه‌ی رسیدنِ داده حدود ۸۵ پیکسل
            پرش دارد، دقیقا همان چیزی که اسکلت برای نبودنش هست. */}
        <div className="ch-skel-tabs" />
        <div className="ch-body"><div className="ch-wrap">
          <div className="ch-skel-line ch-skel-sm" />
          <div className="ch-skel-card" />
        </div></div>
      </div>
    )
  }

  if (!coach) {
    /* خطای شبکه پیام خودش را می‌گیرد، با راه تلاش دوباره. */
    return (
      <div className="lq-stage ch-notfound">
        <div className="lqg ch-notfound-card">
          <h1>{netFail ? 'بارگذاری نشد' : 'این مربی پیدا نشد'}</h1>
          <p>{netFail
            ? 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.'
            : 'ممکن است نشانی اشتباه باشد یا پروفایل هنوز تأیید نشده باشد.'}</p>
          {/* راه بازگشت در حالت خطا هم می‌ماند — شاید شبکه برنگردد.
              `min-height` صریح چون `btn-sm` حدود ۳۶px است. */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {netFail && (
              <button type="button" className="btn btn-glass btn-sm" style={{ minHeight: 44 }}
                onClick={() => { setChecked(false); setReloadKey(k => k + 1) }}>تلاش دوباره</button>
            )}
            {/* «رفتن» نه «بازگشت»: بازدیدکننده ممکن است از صفحه‌ی
                باشگاه آمده باشد، نه از فهرست مربیان. */}
            <Link href="/coaches" className="btn btn-glass btn-sm" style={{ minHeight: 44 }}>رفتن به مربیان</Link>
            <Link href="/clubs" className="btn btn-glass btn-sm" style={{ minHeight: 44 }}>بازگشت به باشگاه</Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── داده‌ی مشتق ──
     همه از فیلدهای واقعی می‌آید. هیچ عدد ساختگی (امتیاز، تعداد
     شاگرد، ستاره) ساخته نمی‌شود؛ پروفایل یک آدم واقعی جای جعل
     اعتبار نیست. */
  const badge = localP ? badgeFromGrades(localP.grades) : null
  const grade = badge ? { label: badge.label, dots: badge.dots } : undefined
  const disciplines = coach.disciplines.map(k => ({ label: disciplineLabel(k) }))

  /* ── چرا بر اساس رتبه مرتب می‌شود، نه سال ──
     نسخه‌ی اول با `Number(year)` مرتب می‌کرد و دو جور می‌شکست:
     سال خالی `0` می‌شد و ته صف می‌رفت، و سال فارسی («۱۳۹۸») `NaN`
     می‌داد پس مقایسه صفر می‌شد و ترتیب اصلا اعمال نمی‌شد. آن‌وقت
     ردیف اول — که «بالاترین درجه» نشان می‌گیرد — می‌توانست پایین‌ترین
     درجه باشد، درحالی‌که چیپ هیرو از `badgeFromGrades` می‌آید و
     بر اساس رتبه است. دو عدد متناقض روی یک صفحه.
     حالا هر دو از یک ترتیب می‌آیند: اندیس `GRADES` — همان چیزی که
     `certificationLines` هم استفاده می‌کند. */
  /* ⚠️ نردبان با *کلید* کار می‌کند نه برچسب: برچسب متنِ نمایشی
     است و ممکن است عوض شود، ولی کلید همان چیزی است که `GRADES`
     می‌شناسد. کلیدِ ناشناخته همین‌جا می‌افتد. */
  const earned = new Map(
    (localP?.grades ?? [])
      .filter(g => GRADES.some(x => x.key === g.key))
      .map(g => [g.key, g.year] as const),
  )

  /* «از سال» = کوچک‌ترین سال واقعی، مستقل از ترتیب تایم‌لاین.
     ارقام فارسی و عربی با هلپر مشترک `normalizeDigits` نرمال
     می‌شوند — وگرنه `Number('۱۳۹۸')` برابر NaN است. */
  const sinceYear = (() => {
    const years = (localP?.grades ?? [])
      .map(g => Number(normalizeDigits(String(g.year))))
      .filter(n => Number.isFinite(n) && n > 0)
    return years.length ? String(Math.min(...years)) : ''
  })()
  const paragraphs = (coach.fullBio || coach.bio || '').split(/\n{2,}/).map(s => s.trim()).filter(Boolean)
  const publicUrl = `www.billiardhub.net/coaches/${coach.id}`

  const latin = localP ? `${localP.firstNameEn} ${localP.lastNameEn}`.trim().toUpperCase() : ''

  const addImages = async (files: File[], album?: string) => {
    const items = await Promise.all(files.map(async fl => ({
      id: `m${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
      url: await compressImage(fl, 1000, 0.68),
      caption: '',
      /* از داخل آلبوم که اضافه شود، همان‌جا می‌نشیند */
      ...(album ? { album } : {}),
    })))
    await edit.apply(d => ({ ...d, gallery: [...d.gallery, ...items] }))
  }
  /* ── ویدیو از گالری خود کاربر ──
     ⚠️ نسخه‌ی اول نشانی آپارات/یوتیوب می‌پرسید — کاربر درست گفت که
     این اصلا کار این دکمه نیست. حالا مثل عکس فایل انتخاب می‌شود و
     همان مسیر آپلودی می‌رود که پنل استفاده می‌کند
     (`profiles/videos/<userId>/…` در Storage، نه data:URL داخل jsonb
     که ردیف را می‌ترکاند). */
  /* `details` از فرم مشخصات می‌آید (عنوان/دسته/توضیح). تا دیروز
     عنوان نام فایل بود و همان به مدیا می‌رفت. */
  const addVideoFiles = async (files: File[], album?: string, details?: VideoDetail[]) => {
    /* ورودی ترکیبی داخل آلبوم می‌تواند چند ویدیو بدهد؛ یکی‌یکی و
       ترتیبی بالا می‌روند تا هر کدام روی نسخه‌ی تازه‌ی پروفایل بنشیند. */
    setVidBusy(true)
    /* پیام‌ها ته کار یک‌جا داده می‌شوند: `notify` یک نوار است و
       فراخوانی پشت هم فقط آخری را نشان می‌دهد. */
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
          videos: [...d.videos, { id: vid, url, thumbnail: thumb, title: detailTitle(details, i, file), duration: formatDuration(meta.durationSec), ...(album ? { album } : {}) }],
        }))
        /* ذخیره که شکست خورد، ادامه‌ی آپلود فقط فایل یتیم می‌سازد */
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
      if (shipped.length) void publishToChannel(shipped, String(coach?.name ?? '')).catch(() => {})
      if (skipped.length) notify(`این ویدیوها اضافه نشدند (سقف ${MAX_VIDEO_MB} مگابایت): ${skipped.join('، ')}`)
    }
  }
  /* ⚠️ نسخه‌ی قبلی نام آلبوم را روی «آخرین عکس بدون آلبوم»
     می‌نشاند، چون آلبوم فقط از روی رسانه‌ها ساخته می‌شد و آلبوم خالی
     ممکن نبود. نتیجه‌اش این بود که آلبوم تازه‌ی خالی، یکی از عکس‌های
     تب تصاویر را با خودش می‌برد. حالا فقط نام اعلام می‌شود. */
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
  const editImage = async (id: string, patch: { caption: string; album: string }) => {
    await edit.apply(d => applyImagePatch({ ...d, gallery: d.gallery ?? [] }, id, patch) as typeof d)
  }

  /* ⚠️ با شناسه، نه با اندیس: داخل آلبوم اندیس خانه به زیرمجموعه
     برمی‌گشت و این فیلتر روی کل گالری بود — یعنی حذف از داخل آلبوم
     عکس دیگری را می‌برد. */
  const deleteImage = async (id: string) => {
    if (!(await ask('این تصویر حذف شود؟', { body: 'این کار برگشت‌پذیر نیست.', confirmLabel: 'حذف' }))) return
    await edit.apply(d => ({ ...d, gallery: d.gallery.filter(g => g.id !== id) }))
  }

  return (
    <div className="ch-page ch-ch">
      {/* ⚠️ آمار فقط چیزهایی را می‌شمارد که واقعا در پروفایل هست.
          هیچ عددِ «دنبال‌کننده» یا «شاگرد» ساخته نمی‌شود؛ پروژه
          داده‌اش را ندارد. آیتمِ صفر اصلا رندر نمی‌شود. */}
      <ProfileHero
        name={coach.name}
        nameLatin={latin || undefined}
        city={coach.city}
        photo={coach.photo}
        cover={coach.coverImage}
        verified={coach.verified}
        grade={grade}
        disciplines={disciplines}
        onOpenPhoto={u => openImage(u, { title: coach.name, alt: `عکس ${coach.name}` })}
        role="coach" backHref="/coaches" backLabel="مربیان"
        publicUrl={publicUrl}
        posterBase="coach"
        stats={
          <ul className="ch-stats">
            {coach.videos.length > 0 && (
              <li><b>{toFaDigits(String(coach.videos.length))}</b><span>ویدیو</span></li>
            )}
            {coach.gallery.length > 0 && (
              <li><b>{toFaDigits(String(coach.gallery.length))}</b><span>تصویر</span></li>
            )}
            {(localP?.albums?.length ?? 0) > 0 && (
              <li><b>{toFaDigits(String(localP?.albums?.length ?? 0))}</b><span>آلبوم</span></li>
            )}
            {grade && <li><b className="ch-stats-t">{grade.label}</b><span>بالاترین درجه</span></li>}
            {sinceYear && <li><b>{toFaDigits(sinceYear)}</b><span>شروع مربیگری</span></li>}
          </ul>
        }
        actions={
          <>
            {/* ⚠️ لنگر است نه دکمه‌ی تکراری: فرمِ رزرو یکی است و
                پایین‌تر رندر می‌شود. دو نمونه یعنی دو state. */}
            {!edit.isOwner && (
              <a className="ch-hero-cta" href="#ch-sess-h">
                <CalendarPlus size={17} aria-hidden />درخواست جلسه
              </a>
            )}
          </>
        }
      />

      {/* ── نوارِ تب‌ها ──
          لنگر است نه روتر: محتوا کوتاه است و صفحه‌ی جدا برای هر تب
          روی شبکه‌ی کند یعنی رفت‌وبرگشتِ اضافه. */}
      <nav className="ch-tabsbar" aria-label="بخش‌های صفحه">
        <div className="ch-wrap ch-tabsbar-in">
          <a href="#media">رسانه</a>
          <a href="#about">درباره</a>
          <a href="#career">مسیر مربیگری</a>
          <a href="#reviews">نظرها</a>
        </div>
      </nav>

      <div className="ch-body">
        <div className="ch-wrap">

          {/* ── رسانه، تمام‌عرض ──
              ⚠️ پیش‌تر داخلِ ستونِ باریکِ کناری بود و ویدیوها اندازه‌ی
              تمبر دیده می‌شدند. محتوای اصلیِ یک مربی همین است. */}
          <section id="media" tabIndex={-1} className="ch-sec ch-rv">
            <ProfileGallery
              images={coach.gallery}
              videos={coach.videos}
              onOpenImage={(urls, index, meta, ids) => openImage(urls, {
                index, ...meta,
                ...(edit.isOwner ? { onDelete: (i: number) => deleteImage(ids[i] ?? '') } : {}),
              })}
              onOpenVideo={v => openVideo(v, edit.isOwner ? { onDelete: () => deleteVideo(v.id), onEdit: () => editVideo(v) } : undefined)}
              albumNames={localP?.albums ?? []}
              canEdit={edit.isOwner} busy={edit.saving || vidBusy}
              onAddImages={addImages} onAddVideos={addVideoFiles} beforeAddVideos={() => askChannel(String(coach?.name ?? ''))} onNewAlbum={newAlbum}
                onEditImage={editImage}
            />
            {edit.error && <p className="ch-empty" role="alert">{edit.error}</p>}
          </section>

          {/* ── دو ستون ──
              ⚠️ ستونِ اصلی سه بخش می‌گیرد و ریل یکی. پیش‌تر «معرفی»
              تنها کنارِ نردبان می‌ماند و چون نردبان بلند است، زیرِ
              «معرفی» حدود ۷۰۰ پیکسل سفیدیِ خالی می‌افتاد
              (اندازه‌گیری‌شده: ۱۳۸ در برابر ۸۳۶). «جلسه‌ی خصوصی» هم
              یک سطرِ کاملِ ۱۰۹۶ پیکسلی می‌گرفت که هیچ لازم نداشت. */}
          <div className="ch-two">
            <div className="ch-col-main">
              <section id="about" tabIndex={-1} className="ch-sec ch-rv" aria-labelledby="ch-about-h">
                <div className="ch-sec-head">
                  <h2 id="ch-about-h">معرفی</h2>
                  <span className="en">ABOUT</span>
                  <span className="rule" aria-hidden />
                </div>
                {paragraphs.length === 0
                  ? <p className="ch-empty">این مربی هنوز معرفی‌ای ننوشته است</p>
                  : paragraphs.map((t, i) => <p key={i} className="ch-prose">{t}</p>)}

                <ProfileContactLinks
                  phone={coach.phone} whatsapp={coach.whatsapp}
                  instagram={coach.instagram} telegram={coach.telegram} />
              </section>

              {/* ── نوارِ رزرو — برای مالکِ پروفایل معنی ندارد ── */}
              {!edit.isOwner && (
                <section className="ch-book ch-rv" aria-labelledby="ch-sess-h">
                  <div className="ch-book-t">
                    <h2 id="ch-sess-h">جلسه‌ی خصوصی با {coach.name}</h2>
                    <p>زمان و مکان را با خودِ مربی هماهنگ می‌کنید</p>
                  </div>
                  <SessionRequest coachSlug={id} price={sessionPrice} minutes={sessionMin} />
                </section>
              )}

            </div>

            <div className="ch-col-rail">
              <section id="career" tabIndex={-1} className="ch-sec ch-rv" aria-labelledby="ch-path-h">
                <div className="ch-sec-head">
                  <h2 id="ch-path-h">مسیر مربیگری</h2>
                  <span className="en">CAREER</span>
                  <span className="rule" aria-hidden />
                </div>
                {/* «مربی آزاد» یک انتخابِ صریح در پنل است، نه پروفایلِ
                    ناتمام؛ متنِ «ثبت نشده» او را ناقص جلوه می‌داد. */}
                <div className="ch-card ch-ladder">
                  <GradeLadder grades={GRADES} earned={earned} verified={coach.verified}
                    emptyText={localP?.freeCoach
                      ? 'این مربی به‌عنوان مربی آزاد فعالیت می‌کند و مدرک فدراسیونی ثبت نکرده است.'
                      : 'هنوز درجه‌ای ثبت نشده است.'} />
                </div>
              </section>
            </div>
          </div>

          {/* ── نظرها، پس از «مسیر مربیگری» ──
              پیش‌تر داخلِ ستونِ اصلی بود، یعنی در DOM **قبل از** مسیر
              مربیگری می‌آمد و روی موبایل هم همان‌جا دیده می‌شد.

              ⚠️ با `order` درست نشد — کامنتِ خودِ CSS هم همین را
              می‌گوید: ترتیبِ دیداری را عوض می‌کند ولی فوکوس و
              صفحه‌خوان روی DOM می‌مانند (نقضِ WCAG 2.4.3). پس خودِ
              DOM جابه‌جا شد.

              حالا بیرونِ هر دو ستون و تمام‌عرض است — که برای خواندنِ
              نظرها بهتر هم هست. نگرانیِ قدیمیِ «۳۱۸ پیکسل سفیدی» دیگر
              برقرار نیست: آن وقتی بود که ستونِ اصلی فقط «معرفی» را
              داشت؛ حالا «معرفی» و «جلسه‌ی خصوصی» هر دو در آن‌اند. */}
          {/* سرتیتر لازم است: حالا که بخش سطح‌بالاست، بدونِ `h2` از
              تیترِ صفحه مستقیم به `h3`های داخلِ `Reviews` می‌پرید، و
              خودِ بخش هم نامِ دسترس‌پذیر نداشت — برخلافِ همه‌ی
              خواهرهایش که `aria-labelledby` دارند. */}
          <section id="reviews" tabIndex={-1} className="ch-sec ch-rv" aria-labelledby="ch-rv-h">
            <div className="ch-sec-head">
              <h2 id="ch-rv-h">نظرها</h2>
              <span className="en">REVIEWS</span>
              <span className="rule" aria-hidden />
            </div>
            <Reviews endpoint={`/api/profiles/coach/${encodeURIComponent(id)}/reviews`} subject="این مربی"
              cannotReviewNote="برای ثبت نظر باید در باشگاهی که این مربی در آن ثبت شده، رزرو قطعی داشته باشید." />
          </section>

        </div>
      </div>

      {imageViewer}
      {videoViewer}
      {channelGate}
      {videoEditDialog}
    </div>
  )
}

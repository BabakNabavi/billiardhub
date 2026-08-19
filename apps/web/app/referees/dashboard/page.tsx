'use client'
import { useState, useEffect, useRef } from 'react'
import { provinceOfCity } from '../../../lib/iran-geo'
import { uploadFile } from '../../../lib/supabase'
import { videoMeta, formatDuration } from '../../../lib/video-thumb'
import { AlertDialog } from '../../../components/market/AdFormFields'
import Select from '../../../components/ui/Select'

/* ارقام فارسی — همه‌ی عددهای این پنل فارسی دیده می‌شوند */
const faNum = (v: string | number) => String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
import VerificationBadges from '../../../components/VerificationBadges'
import Link from 'next/link'
import { useAuthStore } from '../../../store/auth.store'
import ProvinceCitySelect from '../../../components/ProvinceCitySelect'
import ProfileSlugField from '../../../components/ProfileSlugField'
import ClubPicker from '../../../components/ClubPicker'
import AuthGuard from '../../../components/AuthGuard'
import {
  GRADES, DISCIPLINES, getRefereeProfiles, saveRefereeProfile, findRefereeByOwner, findUnclaimedReferee,
  type RefereeProfile, type RefereeGrade, type RefereeMedia, type RefereeVideo,
} from '../../../lib/referee-store'
import { isValidSlug } from '../../../lib/slug'
import { fetchMyProfileResult, saveProfileRemote } from '../../../lib/profiles/client'

/* ─── Tokens ─── */
const GOLD   = '#C7A66A'
const GOLD_D = '#8F6531'
const BG     = '#F6F4F0'
const TEXT   = '#111110'
const TEXT_S = 'rgba(17,17,16,0.52)'
const TEXT_M = 'rgba(17,17,16,0.30)'
const CBOR   = '1px solid rgba(17,17,16,0.10)'

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const r = new FileReader()
  r.onload  = () => resolve(String(r.result))
  r.onerror = reject
  r.readAsDataURL(file)
})

/* Downscale + re-encode images to keep localStorage well under quota. */
const compressImage = (file: File, maxDim: number, quality = 0.72): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read failed'))
    reader.onload = () => {
      const dataUrl = String(reader.result)
      const im = document.createElement('img')
      im.onerror = () => resolve(dataUrl)
      im.onload = () => {
        let w = im.naturalWidth || im.width
        let h = im.naturalHeight || im.height
        if (w >= h && w > maxDim)      { h = Math.round((h * maxDim) / w); w = maxDim }
        else if (h > w && h > maxDim)  { w = Math.round((w * maxDim) / h); h = maxDim }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(dataUrl); return }
        ctx.drawImage(im, 0, 0, w, h)
        try { resolve(canvas.toDataURL('image/jpeg', quality)) } catch { resolve(dataUrl) }
      }
      im.src = dataUrl
    }
    reader.readAsDataURL(file)
  })

/* Re-compress an existing data URL (e.g. images loaded from a saved draft). */
const compressDataUrl = (dataUrl: string, maxDim: number, quality = 0.72): Promise<string> =>
  new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) { resolve(dataUrl); return }
    const im = document.createElement('img')
    im.onerror = () => resolve(dataUrl)
    im.onload = () => {
      let w = im.naturalWidth || im.width
      let h = im.naturalHeight || im.height
      if (w >= h && w > maxDim)      { h = Math.round((h * maxDim) / w); w = maxDim }
      else if (h > w && h > maxDim)  { w = Math.round((w * maxDim) / h); h = maxDim }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(dataUrl); return }
      ctx.drawImage(im, 0, 0, w, h)
      try { resolve(canvas.toDataURL('image/jpeg', quality)) } catch { resolve(dataUrl) }
    }
    im.src = dataUrl
  })

const rid = () => Math.random().toString(36).slice(2, 9)

const emptyForm = {
  slug: '', firstNameFa: '', lastNameFa: '', firstNameEn: '', lastNameEn: '',
  province: '', city: '', disciplines: [] as string[], shortBio: '', fullBio: '',
  grades: [] as RefereeGrade[], gallery: [] as RefereeMedia[], videos: [] as RefereeVideo[],
  /* نامِ آلبوم‌ها. ⚠️ بدونِ این، پرکردنِ فرم از نسخه‌ی محلی آلبوم‌های
     خالی را می‌انداخت و ذخیره‌ی بعدی پاکشان می‌کرد. */
  albums: [] as string[],
  phone: '', whatsapp: '', instagram: '', telegram: '',
  photo: '', coverImage: '', certificate: null as { name: string; url: string } | null,
}
type FormState = typeof emptyForm

/* small style helpers */
const card: React.CSSProperties = { background: '#fff', border: CBOR, borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 16px rgba(17,17,16,0.05)' }
const inp:  React.CSSProperties = { width: '100%', padding: '10px 13px', border: '1px solid rgba(17,17,16,0.14)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', background: '#fff', color: TEXT, outline: 'none' }
/* ── چرا فیلدِ ناقص حاشیه‌ی قرمز می‌گیرد ──
   تا امروز فقط یک متنِ ریزِ قرمز زیرِ فیلد می‌آمد و یک نوار بالای
   صفحه. کاربری که ته فرمِ بلند دکمه را می‌زند، نه نوار را می‌بیند
   و نه آن متن را — پیام می‌گوید «فیلدهای الزامی را کامل کنید» و
   او دنبالِ فیلدی می‌گردد که پیدا نمی‌شود.

   خودِ کادر باید قرمز شود؛ همان چیزی که چشم از دور می‌بیند. */
/* همان سقفی که سرور اعمال می‌کند (`MAX_VIDEO` در lib/upload/policy).
   آن فایل کلاینت‌امن نیست، پس عدد این‌جا تکرار شده — و اگر روزی
   عوض شد، هر دو باید با هم عوض شوند. */
const MAX_VIDEO_MB = 25

const inpErr: React.CSSProperties = {
  ...inp, borderColor: 'rgba(239,68,68,0.75)', background: 'rgba(239,68,68,0.035)',
}

const inpRO: React.CSSProperties = { ...inp, background: 'rgba(17,17,16,0.045)', color: 'rgba(17,17,16,0.60)', cursor: 'not-allowed' }
/* نامِ فارسیِ هر فیلد — پیامِ خطا باید بگوید کدام‌یک، نه «یکی از».
   کلیدها همان‌هایی‌اند که `validate` می‌سازد. */
const FIELD_LABELS: Record<string, string> = {
  firstNameFa: 'نام (فارسی)',
  lastNameFa: 'نام خانوادگی (فارسی)',
  firstNameEn: 'نام (انگلیسی)',
  lastNameEn: 'نام خانوادگی (انگلیسی)',
  province: 'استان',
  city: 'شهر',
  slug: 'آدرس اختصاصی سایت',
  disciplines: 'رشته‌های تخصصی',
  fullBio: 'معرفی کامل',
  certificate: 'مدرک داوری',
}

const lbl:  React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 700, color: TEXT_S, marginBottom: 6 }
/* راهنمای ریزِ زیرِ فیلد — بر خلافِ placeholder با تایپ‌کردن ناپدید نمی‌شود */
const hint: React.CSSProperties = { fontSize: 11.5, color: TEXT_M, marginTop: 5, lineHeight: 1.7 }

/* ── برچسبِ فیلدِ لاتین ──
   خودِ ورودی `dir="ltr"` و چپ‌چین است ولی برچسبش مثلِ بقیه‌ی صفحه
   راست‌چین می‌ماند: «First name (English)» آن‌طرفِ کادر می‌افتد و چشم
   برای هر فیلد دو بار جهت عوض می‌کند. برچسب هم چپ می‌رود تا بالای
   شروعِ همان متنی بنشیند که توصیفش می‌کند. */
const lblLtr: React.CSSProperties = { ...lbl, textAlign: 'left', direction: 'ltr' }
const lqBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D, borderRadius: 10, fontWeight: 700, fontSize: 14, padding: '11px 22px', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none' }
const sectionTitle = (t: string, n: number) => (
  <h2 style={{ fontSize: 15, fontWeight: 800, color: TEXT, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 9 }}>
    <span style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(199,166,106,0.14)', color: GOLD_D, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</span>
    {t}
  </h2>
)

function RefereeDashboardInner() {
  const { user, _hydrated } = useAuthStore()
  const [form, setForm]       = useState<FormState>(emptyForm)
  const [errors, setErrors]   = useState<Record<string, string>>({})
  /* پیامِ خطا وسطِ صفحه می‌آید، نه نواری بالای فرمِ بلند */
  /* عنوان هم در حالت می‌نشیند: همین پنجره برای «فرم کامل نیست»،
     «آپلود نشد» و «ذخیره روی سرور انجام نشد» استفاده می‌شود و یک
     عنوانِ ثابت روی هر سه، دو تای آخر را دروغ می‌کرد. */
  const [alert, setAlert] = useState<{ title: string; lines: string[] } | null>(null)
  /* نامکی که واقعاً روی سرور ثبت شده. تا وقتی خالی است فیلدِ نشانی
     باز می‌ماند؛ نامکِ خودکارِ فرم نباید قفلش کند. */
  const [savedSlug, setSavedSlug] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const galleryInput = useRef<HTMLInputElement>(null)
  const videoInput   = useRef<HTMLInputElement>(null)


  /* prefill from the logged-in user; load existing submission if any.
     مالکیت بر اساس user.id است، نه شماره‌ی موبایل اختیاری — وگرنه پروفایلی که با
     شماره‌ی خالی ذخیره شده بود دیگر پیدا نمی‌شد و فرم خالی باز می‌شد. رکورد قدیمی
     بی‌صاحب را همین کاربر تصاحب می‌کند تا داده‌اش برگردد. */
  useEffect(() => {
    if (!_hydrated) return
    let mine = findRefereeByOwner(user)
    if (!mine && user) {
      const orphan = findUnclaimedReferee()
      if (orphan) { mine = { ...orphan, ownerId: user.id, ownerPhone: user.phone ?? orphan.ownerPhone }; saveRefereeProfile(mine) }
    }
    if (mine) {
      setForm({
        slug: mine.slug, firstNameFa: user?.firstName || mine.firstNameFa, lastNameFa: user?.lastName || mine.lastNameFa,
        firstNameEn: mine.firstNameEn, lastNameEn: mine.lastNameEn, province: mine.province, city: mine.city,
        disciplines: mine.disciplines, shortBio: mine.shortBio, fullBio: mine.fullBio,
        grades: mine.grades, gallery: mine.gallery, videos: mine.videos, albums: mine.albums ?? [],
        phone: mine.phone, whatsapp: mine.whatsapp, instagram: mine.instagram, telegram: mine.telegram,
        photo: mine.photo, coverImage: mine.coverImage, certificate: mine.certificate,
      })
    } else if (user) {
      setForm(f => ({ ...f, firstNameFa: user.firstName || '', lastNameFa: user.lastName || '', city: user.city || '', province: provinceOfCity(user.city || ''), phone: user.phone || '' }))
    }

    /* نسخه‌ی سرور مقدم است؛ پروفایل محلی قدیمی یک‌بار بالا فرستاده می‌شود */
    void (async () => {
      const res = await fetchMyProfileResult<Record<string, unknown>>('referee')
      /* خطا ⇒ نمی‌دانیم چیزی ثبت شده یا نه؛ نشانی قفل می‌ماند. */
      if (res.state === 'error') return
      const remote = res.state === 'found' ? res.profile : null
      if (!remote) {
        if (mine) {
          const up = await saveProfileRemote('referee', mine.slug, mine as unknown as Record<string, unknown>,
            { number: '', url: mine.certificate?.url ?? '' })
          /* فقط نوشتنِ تأییدشده قفل می‌کند؛ با ۴۰۹ چیزی نوشته نشده و
             فیلد باید باز بماند تا نامکِ تکراری قابلِ اصلاح باشد. */
          if (up.ok && up.profile?.slug) setSavedSlug(up.profile.slug)
          else setSavedSlug('')
        } else {
          /* کاربرِ کاملاً تازه: نه ردیفِ سرور، نه کشِ محلی.
             صریح باز می‌شود تا نامکش را خودش انتخاب کند. */
          setSavedSlug('')
        }
        return
      }
      setSavedSlug(remote.slug)
      /* ── چرا نامِ حساب دوباره نوشته می‌شود ──
         داده‌ی سرور روی مقدارهای پیش‌پرشده می‌نشیند. پروفایلی که با
         نامِ خالی ذخیره شده، دقیقاً همان بن‌بستی را برمی‌گرداند که این
         تغییر برای بستنش بود: فیلدِ قفل‌شده‌ی خالیِ اجباری. تا وقتی
         حساب نام دارد، همان مرجع است. */
      /* ── چرا داده‌ی سرور مستقیم spread نمی‌شود ──
         مسیرِ ذخیره فقط `typeof === object` را می‌سنجد، پس ردیفی با
         `fullBio: null` ممکن است. `validate` بلافاصله `.trim()` روی
         همان می‌زند و کلِ صفحه به error boundary می‌رود. فقط
         رشته‌ها و آرایه‌های واقعی پذیرفته می‌شوند؛ بقیه نادیده. */
      setForm(f => ({
        ...f,
        ...safeRemote(remote.data),
        ...(user?.firstName ? { firstNameFa: user.firstName } : {}),
        ...(user?.lastName ? { lastNameFa: user.lastName } : {}),
        slug: remote.slug,
      }))
    })()
  }, [_hydrated, user])


  /* قفل فقط وقتی که حساب واقعاً نام دارد — وگرنه کاربر راهی برای
     پرکردنِ یک فیلدِ اجباری نمی‌داشت. */
  /* هر کدام جدا: حسابی که فقط نام دارد نباید اجازه‌ی بازنویسیِ همان
     نام را بدهد، ولی نامِ خانوادگیِ نداشته‌اش باید قابلِ تایپ باشد. */
  /* `trim` لازم است: نامِ فقط-فاصله قفل می‌کرد ولی از اعتبارسنجی
     رد نمی‌شد — همان بن‌بستِ فیلدِ اجباریِ غیرقابلِ تایپ. */
  const firstLocked = !!user?.firstName?.trim()
  const lastLocked = !!user?.lastName?.trim()
  /* ── چرا خطا همین‌جا پاک می‌شود ──
     `errors` فقط موقعِ ارسال ساخته می‌شد، پس کادرِ قرمز بعد از اصلاحِ
     فیلد قرمز می‌ماند تا ارسالِ بعدی — کاربر فکر می‌کرد هنوز ایراد
     دارد. */
/* فقط کلیدهایی که خودِ فرم دارد، و فقط با نوعِ درست. هرچه غیرِ این
   باشد نادیده گرفته می‌شود — مقدارِ پیش‌فرضِ فرم سرِ جایش می‌ماند. */
function safeRemote(raw: unknown): Partial<FormState> {
  if (!raw || typeof raw !== 'object') return {}
  const src = raw as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(src)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') out[k] = v
    else if (Array.isArray(v)) out[k] = v
    else if (v && typeof v === 'object') out[k] = v
    /* null و undefined عمداً رد می‌شوند */
  }
  return out as Partial<FormState>
}

  /* ── چرا جدا از `set` هم لازم است ──
     `ProvinceCitySelect` و `ProfileSlugField` و چیپ‌های رشته مستقیم
     `setForm` صدا می‌زنند، پس کادرِ قرمزشان تا ارسالِ بعدی می‌ماند.
     این تابع همان پاک‌سازی را جدا در دسترس می‌گذارد. */
  const clearErr = (...keys: string[]) =>
    setErrors(prev => {
      if (!keys.some(k => prev[k])) return prev
      const n = { ...prev }
      for (const k of keys) n[k] = ''
      return n
    })

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm(f => ({ ...f, [k]: v }))
    clearErr(k as string)
  }

  const curJYear = (() => { try { return parseInt(new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric' }).format(new Date()), 10) || 1405 } catch { return 1405 } })()
  const YEARS = Array.from({ length: 61 }, (_, i) => curJYear - i)

  const toggleDiscipline = (k: string) =>
    setForm(f => ({ ...f, disciplines: f.disciplines.includes(k) ? f.disciplines.filter(x => x !== k) : [...f.disciplines, k] }))

  const gradeSelected = (k: string) => form.grades.some(g => g.key === k)
  // grades are cumulative: selecting one auto-selects all lower grades; deselecting drops it + all higher
  const toggleGrade = (idx: number) =>
    setForm(f => {
      const g = GRADES[idx]!
      const isOn = f.grades.some(x => x.key === g.key)
      const yearOf = (k: string) => f.grades.find(x => x.key === k)?.year ?? ''
      if (isOn) {
        const keep = new Set(GRADES.slice(0, idx).map(x => x.key))
        return { ...f, grades: f.grades.filter(x => keep.has(x.key)) }
      }
      return { ...f, grades: GRADES.slice(0, idx + 1).map(x => ({ key: x.key, label: x.label, year: yearOf(x.key) })) }
    })
  const setGradeYear = (k: string, year: string) =>
    setForm(f => ({ ...f, grades: f.grades.map(g => (g.key === k ? { ...g, year } : g)) }))

  /* پیشنهادِ نشانی حالا داخلِ خودِ `SiteAddressField` است */
  const slugTaken = () => {
    const p = getRefereeProfiles()[form.slug]
    if (!p) return false
    const mine = (p.ownerId && p.ownerId === user?.id) || (p.ownerPhone && p.ownerPhone === user?.phone) || (!p.ownerId && !p.ownerPhone)
    return !mine
  }

  const addPhoto = async (file?: File) => { if (file) set('photo', await compressImage(file, 480, 0.82)) }
  const addCover = async (file?: File) => { if (file) set('coverImage', await compressImage(file, 1280, 0.72)) }
  const addGallery = async (files: FileList | null) => {
    if (!files) return
    const items: RefereeMedia[] = []
    for (const f of Array.from(files).slice(0, 12)) items.push({ id: rid(), url: await compressImage(f, 1100, 0.72), caption: '' })
    setForm(f => ({ ...f, gallery: [...f.gallery, ...items] }))
  }
  const setCaption = (id: string, caption: string) =>
    setForm(f => ({ ...f, gallery: f.gallery.map(g => (g.id === id ? { ...g, caption } : g)) }))
  const removeGallery = (id: string) => setForm(f => ({ ...f, gallery: f.gallery.filter(g => g.id !== id) }))

  /* ── آلبوم‌ها ──
     آلبوم فقط یک نام روی خودِ رسانه است — نه فهرستِ جدا با شناسه.
     پس آلبومِ خالی وجود ندارد و حذفِ یک عکس هیچ‌جا ارجاعِ شکسته
     نمی‌گذارد. `datalist` نام‌های موجود را پیشنهاد می‌دهد تا کاربر
     مجبور به تایپِ دوباره — و غلط‌های املاییِ آلبومِ تکراری — نشود. */
  const setAlbum = (id: string, album: string) =>
    setForm(f => ({
      ...f,
      gallery: f.gallery.map(g => (g.id === id ? { ...g, album } : g)),
      videos:  f.videos.map(v => (v.id === id ? { ...v, album } : v)),
    }))
  const albumNames = Array.from(new Set(
    [...form.albums, ...[...form.gallery, ...form.videos].map(m => m.album ?? '')]
      .map(n => n.trim()).filter(Boolean),
  ))

  /* ── چرا این‌جا آپلودِ واقعی است ──
     تا امروز این دکمه `accept="image/*"` داشت و فقط یک عکس را به‌عنوان
     «بندانگشتی» می‌گرفت؛ ویدیویی در کار نبود و دکمه‌ی پخش روی صفحه‌ی
     عمومی هیچ کاری نمی‌کرد.

     حالا خودِ فایل بالا می‌رود (سرور نوعش را از بایت‌ها می‌سنجد و سقفِ
     حجم را اعمال می‌کند) و بندانگشتی از یک فریمِ همان ویدیو ساخته
     می‌شود — نه چیزی که کاربر جدا انتخاب کند. */
  const [videoBusy, setVideoBusy] = useState(false)
  const addVideo = async (file?: File) => {
    if (!file) return
    /* سقف را همین‌جا می‌سنجیم: `uploadFile` برای هر شکستی `null`
       می‌دهد و نمی‌شود فهمید حجم بود یا شبکه. */
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setAlert({ title: 'ویدیو بزرگ است', lines: [`حجم ویدیو نباید بیش از ${MAX_VIDEO_MB} مگابایت باشد.`] })
      return
    }
    setVideoBusy(true)
    try {
      const meta = await videoMeta(file)
      const id = rid()
      const url = await uploadFile('club-media', file, `profiles/videos/${user?.id ?? "anon"}/${id}`)
      if (!url) { setAlert({ title: 'ویدیو بالا نرفت', lines: ['دوباره تلاش کنید؛ اگر باز هم نشد، فرمت یا حجم فایل را بررسی کنید.'] }); return }
      /* بندانگشتی اختیاری است: نبودنش ویدیو را بی‌فایده نمی‌کند */
      const thumb = meta.thumb
        ? (await uploadFile('club-media', meta.thumb, `profiles/videos/${user?.id ?? "anon"}/${id}-thumb`)) ?? ''
        : ''
      setForm(f => ({
        ...f,
        videos: [...f.videos, { id, url, thumbnail: thumb, title: '', duration: formatDuration(meta.durationSec) }],
      }))
    } finally { setVideoBusy(false) }
  }
  const setVideo = (id: string, patch: Partial<RefereeVideo>) =>
    setForm(f => ({ ...f, videos: f.videos.map(v => (v.id === id ? { ...v, ...patch } : v)) }))
  const removeVideo = (id: string) => setForm(f => ({ ...f, videos: f.videos.filter(v => v.id !== id) }))

  const addCertificate = async (file?: File) => {
    if (!file) return
    const url = file.type.startsWith('image/') ? await compressImage(file, 1500, 0.8) : await fileToDataUrl(file)
    set('certificate', { name: file.name, url })
    setErrors(e => { const n = { ...e }; delete n.certificate; return n })
  }


  /* ── validation — certificate is MANDATORY for referees ── */
  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.firstNameFa.trim()) e.firstNameFa = 'الزامی'
    if (!form.lastNameFa.trim())  e.lastNameFa  = 'الزامی'
    if (!form.firstNameEn.trim()) e.firstNameEn = 'الزامی'
    if (!form.lastNameEn.trim())  e.lastNameEn  = 'الزامی'
    if (!form.province.trim())    e.province    = 'الزامی'
    if (!form.city.trim())        e.city        = 'الزامی'
    if (!form.slug.trim())        e.slug        = 'الزامی'
    else if (!isValidSlug(form.slug)) e.slug     = 'فقط حروف انگلیسی، عدد و خط تیره (۲ تا ۶۰ کاراکتر)'
    else if (slugTaken())         e.slug        = 'این نشانی قبلاً استفاده شده است'
    if (form.disciplines.length === 0) e.disciplines = 'حداقل یک رشته را انتخاب کنید'
    if (!form.fullBio.trim())     e.fullBio     = 'الزامی'
    if (!form.certificate)        e.certificate = 'آپلود مدرک داوری الزامی است — بدون مدرک امکان ثبت پروفایل وجود ندارد.'
    setErrors(e)
    const keys = Object.keys(e)
    if (keys.length) {
      /* نامِ فیلدها می‌آید، کادرها قرمز می‌شوند و صفحه روی اولین
         ایراد می‌ایستد — دلیلش در پنلِ مربی نوشته شده. */
      /* پیامِ خودِ فیلد هم می‌آید وقتی چیزی بیش از «الزامی» دارد —
         «این نشانی قبلاً استفاده شده» را نباید به «آدرس اختصاصی»
         تقلیل داد. */
      setAlert({
        title: 'فرم کامل نیست',
        lines: keys.map(k => {
          const name = FIELD_LABELS[k] ?? k
          return e[k] && e[k] !== 'الزامی' ? `${name} — ${e[k]}` : name
        }),
      })
      requestAnimationFrame(() => {
        /* `city` مقصدِ خودش را ندارد و زیرِ همان بلوکِ استان است — بدونِ
           این، رایج‌ترین حالتِ ناقص (استان پر، شهر خالی) هیچ‌جا نمی‌رفت. */
        const el = document.querySelector<HTMLElement>(
          `[data-field="${keys[0]}"],[data-field-alt="${keys[0]}"]`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el?.focus?.()
      })
      return false
    }
    setAlert(null)
    return true
  }

  const doSubmit = async () => {
    // re-compress every image (covers images loaded from an earlier draft, not just fresh uploads)
    const [photo, coverImage] = await Promise.all([
      compressDataUrl(form.photo, 480, 0.8),
      compressDataUrl(form.coverImage, 1200, 0.7),
    ])
    const gallery = await Promise.all(form.gallery.map(async g => ({ ...g, url: await compressDataUrl(g.url, 1000, 0.68) })))
    const videos  = await Promise.all(form.videos.map(async v => ({ ...v, thumbnail: await compressDataUrl(v.thumbnail, 700, 0.7) })))
    const certificate = form.certificate && form.certificate.url.startsWith('data:image')
      ? { ...form.certificate, url: await compressDataUrl(form.certificate.url, 1300, 0.75) }
      : form.certificate
    const profile: RefereeProfile = {
      ...form, photo, coverImage, gallery, videos, certificate,
      slug: form.slug.trim().toLowerCase(),
      status: 'pending',
      verified: false,
      submittedAt: new Date().toISOString(),
      ownerId: user?.id || '',
      ownerPhone: user?.phone || '',
    }
    /* منبع حقیقت سرور است؛ localStorage فقط کش همین مرورگر می‌ماند.
       تا پیش از این فقط localStorage نوشته می‌شد و پروفایل هیچ‌وقت به
       دیتابیس نمی‌رسید، پس پنل ادمین آن را نمی‌دید. */
    if (savedSlug === null) { setAlert({ title: 'یک لحظه', lines: ['نشانیِ اختصاصی هنوز خوانده نشده — چند لحظه صبر کنید یا صفحه را تازه کنید'] }); return }
    const res = await saveProfileRemote('referee', profile.slug, profile as unknown as Record<string, unknown>,
      { number: '', url: profile.certificate?.url ?? '' })
    if (!res.ok) {
      setAlert({ title: 'ذخیره نشد', lines: [res.message ?? 'ذخیره روی سرور انجام نشد'] })
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    /* از این لحظه نشانی منتشر شده و قفل می‌شود: هر تغییرِ بعدی
       لینک‌های منتشرشده و ارجاع‌های ذخیره‌شده را می‌شکند. */
    if (res.profile?.slug) setSavedSlug(res.profile.slug)

    const saved = (res.profile?.data as typeof profile | undefined) ?? profile
    try {
      saveRefereeProfile({ ...profile, ...saved })
    } catch {
      /* کش مرورگر پر است — داده روی سرور ذخیره شده */
    }
    setSubmitted(true)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onSubmit = () => {
    if (!validate()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    void doSubmit()
  }

  /* ── success screen ── */
  if (submitted) {
    return (
      <div style={{ direction: 'rtl', fontFamily: "'Vazirmatn',Tahoma,sans-serif", background: BG, minHeight: '100vh', color: TEXT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ ...card, maxWidth: 460, textAlign: 'center', padding: '36px 30px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(5,118,66,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#057642" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>اطلاعات شما ثبت شد</h1>
          <p style={{ fontSize: 13.5, color: TEXT_S, lineHeight: 1.9, marginBottom: 8 }}>
            پروفایل شما همراه با مدرک داوری برای بررسی و تایید به ادمین سیستم ارسال شد.
          </p>
          <p style={{ fontSize: 12.5, color: TEXT_M, lineHeight: 1.9, marginBottom: 22 }}>
            پس از تایید مدرک توسط ادمین، پروفایل شما با تیک آبی تایید در صفحه‌ی داوران منتشر می‌شود.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={`/referees/${form.slug}`} style={lqBtn}>مشاهده پیش‌نمایش پروفایل</Link>
            <button onClick={() => setSubmitted(false)} style={{ ...lqBtn, background: 'transparent', border: '1px solid rgba(17,17,16,0.14)', color: TEXT_S }}>ویرایش اطلاعات</button>
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: TEXT_M, direction: 'ltr' }}>www.billiardhub.net/referees/{form.slug}</div>
        </div>
      </div>
    )
  }

  const err = (k: string) => errors[k] ? <span style={{ display: 'block', color: '#ef4444', fontSize: 11.5, marginTop: 4 }}>{errors[k]}</span> : null
  const star = <span style={{ color: '#ef4444' }}> *</span>

  return (
    <div style={{ direction: 'rtl', fontFamily: "'Vazirmatn',Tahoma,sans-serif", background: BG, minHeight: '100vh', color: TEXT }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px clamp(16px,4vw,32px) 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(8,145,178,0.10)', border: '1px solid rgba(8,145,178,0.28)', color: '#0e7490', fontSize: 11, fontWeight: 800, borderRadius: 20, padding: '4px 12px', letterSpacing: '0.08em', marginBottom: 10 }}>
            REFEREE DASHBOARD
          </div>
          <h1 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 900, letterSpacing: '-0.02em' }}>داشبورد داور</h1>
          <p style={{ fontSize: 13.5, color: TEXT_S, marginTop: 6 }}>اطلاعات زیر را تکمیل کنید تا صفحه‌ی پروفایل داوری شما ساخته شود. آپلود مدرک داوری الزامی است.</p>
        </div>


        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* وضعیت تأیید — هویت، مدارک و ایمیل */}
          <VerificationBadges />

          {/* ── باکسِ استوری این‌جا نیست ──
              استوری بلافاصله منتشر می‌شود و ربطی به ثبتِ پروفایل ندارد؛
              وسطِ فرمِ ثبت فقط حواس را پرت می‌کرد و کاربر فکر می‌کرد
              بخشی از تکمیلِ پروفایل است. جایش پنلِ خودِ کاربر است، نه
              فرمِ ثبت. */}

          {/* 1 — Basic info */}
          <div style={card}>
            {sectionTitle('اطلاعات پایه', 1)}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
              {/* ── چرا این دو فیلد گاهی قفل نیستند ──
                  نام از حسابِ کاربری می‌آمد، قفل بود و ستاره هم نداشت —
                  ولی `validate` اجباری‌اش می‌دانست. حسابی که نامِ فارسی
                  نداشت، فرمی می‌ساخت که **هرگز ثبت نمی‌شد**: کاربر همه‌ی
                  فیلدهای ستاره‌دار را پر می‌کرد، پیامِ «فیلدهای الزامی را
                  کامل کنید» می‌گرفت، و فیلدِ مقصر نه ستاره داشت نه قابلِ
                  تایپ بود.

                  حالا قفل فقط وقتی است که واقعاً مقداری از حساب آمده. */}
              <div><label style={lbl}>نام{firstLocked ? null : star}</label><input
                style={firstLocked ? inpRO : (errors.firstNameFa ? inpErr : inp)}
                value={form.firstNameFa} onChange={e => set('firstNameFa', e.target.value)}
                disabled={firstLocked} placeholder={firstLocked ? '—' : 'مثال: احمد'}
                data-field="firstNameFa" />{err('firstNameFa')}</div>
              <div><label style={lbl}>نام خانوادگی{lastLocked ? null : star}</label><input
                style={lastLocked ? inpRO : (errors.lastNameFa ? inpErr : inp)}
                value={form.lastNameFa} onChange={e => set('lastNameFa', e.target.value)}
                disabled={lastLocked} placeholder={lastLocked ? '—' : 'مثال: رضایی'}
                data-field="lastNameFa" />{err('lastNameFa')}</div>
              <div style={{ gridColumn: '1 / -1', fontSize: 11.5, color: TEXT_M, marginTop: -6 }}>
                {firstLocked && lastLocked
                  ? 'نام و نام خانوادگی از اطلاعات حساب کاربری شما گرفته شده و قابل تغییر نیست.'
                  : 'حساب شما نام ثبت‌شده ندارد؛ همین‌جا وارد کنید.'}
              </div>
              <div><label style={lblLtr}>Last name (English){star}</label><input data-field="lastNameEn" style={{ ...(errors.lastNameEn ? inpErr : inp), direction: 'ltr', textAlign: 'left' }} value={form.lastNameEn} onChange={e => set('lastNameEn', e.target.value)} />{err('lastNameEn')}</div>
              <div><label style={lblLtr}>First name (English){star}</label><input data-field="firstNameEn" style={{ ...(errors.firstNameEn ? inpErr : inp), direction: 'ltr', textAlign: 'left' }} value={form.firstNameEn} onChange={e => set('firstNameEn', e.target.value)} />{err('firstNameEn')}</div>
                            {/* نشانیِ اختصاصیِ سایت — همان چیزی که پنلِ باشگاه از اول داشت */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div data-field="slug"> {/* نشانیِ اختصاصی */}
                <ProfileSlugField
                  kind="referee" value={form.slug} savedSlug={savedSlug}
                  onChange={v => { setForm(f => ({ ...f, slug: v })); clearErr('slug') }}
                  suggestFrom={`${form.firstNameEn || form.firstNameFa} ${form.lastNameEn || form.lastNameFa}`}
                />
                </div>
              </div>
<div style={{ gridColumn: '1 / -1' }}>
                <div data-field="province" data-field-alt="city"> {/* استان و شهر */}
                <ProvinceCitySelect
                  value={{ province: form.province, city: form.city }}
                  onChange={v => { setForm(f => ({ ...f, province: v.province, city: v.city })); clearErr('province', 'city') }}
                  required cityError={errors.city} provinceError={errors.province}
                />
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <ClubPicker />
              </div>
            </div>

            <div data-field="disciplines" style={{ marginTop: 16 }}>
              <label style={lbl}>رشته‌های تخصصی داوری (می‌توانید چند مورد انتخاب کنید){star}</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {DISCIPLINES.map(d => {
                  const on = form.disciplines.includes(d.key)
                  return (
                    <button key={d.key} type="button" onClick={() => toggleDiscipline(d.key)} style={{
                      padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: on ? 800 : 600, fontFamily: 'inherit',
                      border: on ? '1px solid rgba(199,166,106,0.45)' : '1px solid rgba(17,17,16,0.12)',
                      background: on ? 'rgba(199,166,106,0.14)' : '#fff', color: on ? GOLD_D : TEXT_S,
                    }}>{d.label}</button>
                  )
                })}
              </div>
              {err('disciplines')}
            </div>

            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 16 }}>
              <div>
                <label style={lbl}>عکس پروفایل</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', background: 'rgba(17,17,16,0.05)', flexShrink: 0, border: CBOR }}>
                    {form.photo && <img loading="lazy" decoding="async" src={form.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                    <label style={{ ...lqBtn, background: 'transparent', border: '1px solid rgba(17,17,16,0.14)', color: TEXT_S, fontSize: 13, padding: '9px 16px' }}>
                      {form.photo ? 'تغییر عکس' : 'انتخاب عکس'}
                      <input type="file" accept="image/*" hidden onChange={e => addPhoto(e.target.files?.[0])} />
                    </label>
                    {form.photo && <button type="button" onClick={() => set('photo', '')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', padding: 0 }}>حذف عکس</button>}
                  </div>
                </div>
              </div>
              <div>
                <label style={lbl}>عکس بکگراند (کاور پروفایل)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 100, height: 60, borderRadius: 10, overflow: 'hidden', background: 'rgba(17,17,16,0.05)', flexShrink: 0, border: CBOR }}>
                    {form.coverImage && <img loading="lazy" decoding="async" src={form.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                    <label style={{ ...lqBtn, background: 'transparent', border: '1px solid rgba(17,17,16,0.14)', color: TEXT_S, fontSize: 13, padding: '9px 16px' }}>
                      {form.coverImage ? 'تغییر عکس' : 'انتخاب عکس'}
                      <input type="file" accept="image/*" hidden onChange={e => addCover(e.target.files?.[0])} />
                    </label>
                    {form.coverImage && <button type="button" onClick={() => set('coverImage', '')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', padding: 0 }}>حذف عکس</button>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2 — About */}
          <div style={card}>
            {sectionTitle('معرفی', 2)}
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>بیو کوتاه (یک خط، برای کارت داوران)</label>
              <input style={inp} value={form.shortBio} onChange={e => set('shortBio', e.target.value)} placeholder="داور بین‌المللی با ۲۰ سال سابقه" />
            </div>
            <div>
              <label style={lbl}>معرفی کامل{star}</label>
              <textarea data-field="fullBio" style={{ ...(errors.fullBio ? inpErr : inp), minHeight: 120, resize: 'vertical', lineHeight: 1.9 }} value={form.fullBio} onChange={e => set('fullBio', e.target.value)} placeholder="درباره‌ی سوابق داوری، رویدادها و تخصص خود بنویسید..." />
              {err('fullBio')}
            </div>
          </div>

          {/* 3 — Refereeing grades */}
          <div style={card}>
            {sectionTitle('درجه داوری', 3)}
            <div style={{ background: 'rgba(199,166,106,0.08)', border: '1px solid rgba(199,166,106,0.22)', borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: GOLD_D, lineHeight: 1.8, marginBottom: 14 }}>
              مدارکی که دریافت کرده‌اید را به‌ترتیب انتخاب کنید و سال دریافت هر کدام را وارد نمایید.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {GRADES.map((g, idx) => {
                const on = gradeSelected(g.key)
                const yr = form.grades.find(x => x.key === g.key)?.year ?? ''
                return (
                  /* سال زیرِ نامِ درجه، نه کنارش — دلیلش کنارِ همین بلوک
                     در پنلِ مربی نوشته شده. */
                  <div key={g.key} style={{ padding: '9px 12px', borderRadius: 10, border: on ? '1px solid rgba(199,166,106,0.40)' : '1px solid rgba(17,17,16,0.10)', background: on ? 'rgba(199,166,106,0.07)' : '#fff' }}>
                    <button type="button" onClick={() => toggleGrade(idx)} style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'start', padding: 0 }}>
                      <span style={{ width: 19, height: 19, borderRadius: 6, flexShrink: 0, border: on ? 'none' : '1.5px solid rgba(17,17,16,0.22)', background: on ? GOLD : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {on && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                      </span>
                      <span dir="auto" className={g.latin ? 'bh-latin' : undefined} style={{ fontSize: 13.5, fontWeight: on ? 700 : 500, color: on ? TEXT : TEXT_S, unicodeBidi: 'isolate' }}>{g.label}</span>
                    </button>
                    {on && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, paddingInlineStart: 28 }}>
                        <span style={{ fontSize: 12, color: TEXT_S, flexShrink: 0 }}>سال دریافت</span>
                        <div style={{ maxWidth: 130, flex: 1 }}>
                        <Select
                            compact value={yr} ariaLabel={`سال دریافت ${g.label}`} placeholder="انتخاب"
                          options={YEARS.map(y => ({ value: String(y), label: faNum(y) }))}
                          onChange={v => setGradeYear(g.key, v)} />
                      </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 4 — Gallery */}
          <div style={card}>
            {sectionTitle('گالری', 4)}
            <label style={lbl}>تصاویر</label>
            {/* نام‌های آلبومِ موجود — همان‌جا پیشنهاد می‌شوند */}
            <datalist id="bh-albums">
              {albumNames.map(n => <option key={n} value={n} />)}
            </datalist>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10, marginBottom: 12 }}>
              {form.gallery.map(g => (
                <div key={g.id} style={{ border: CBOR, borderRadius: 10, overflow: 'hidden', background: 'rgba(17,17,16,0.04)' }}>
                  <div style={{ position: 'relative', aspectRatio: '1' }}>
                    <img loading="lazy" decoding="async" src={g.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <button type="button" onClick={() => removeGallery(g.id)} aria-label="حذف" style={{ position: 'absolute', top: 6, left: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                  <input value={g.caption} onChange={e => setCaption(g.id, e.target.value)} placeholder="کپشن..." style={{ ...inp, border: 'none', borderTop: CBOR, borderRadius: 0, fontSize: 12, padding: '7px 10px' }} />
                  <input value={g.album ?? ''} onChange={e => setAlbum(g.id, e.target.value)}
                    list="bh-albums" placeholder="آلبوم (اختیاری)..."
                    style={{ ...inp, border: 'none', borderTop: CBOR, borderRadius: 0, fontSize: 12, padding: '7px 10px', color: GOLD_D }} />
                </div>
              ))}
              <button type="button" onClick={() => galleryInput.current?.click()} style={{ aspectRatio: '1', border: '1.5px dashed rgba(199,166,106,0.45)', borderRadius: 10, background: 'rgba(199,166,106,0.05)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: GOLD_D, fontFamily: 'inherit', fontSize: 12, fontWeight: 700 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                افزودن تصویر
              </button>
              <input ref={galleryInput} type="file" accept="image/*" multiple hidden onChange={e => { addGallery(e.target.files); e.target.value = '' }} />
            </div>

            <label style={lbl}>ویدیوها (اختیاری)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {form.videos.map(v => (
                <div key={v.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', border: CBOR, borderRadius: 10, padding: 10 }}>
                  <div style={{ width: 76, height: 46, borderRadius: 8, overflow: 'hidden', background: 'rgba(17,17,16,0.06)', flexShrink: 0 }}>
                    {v.thumbnail && <img loading="lazy" decoding="async" src={v.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <input value={v.title} onChange={e => setVideo(v.id, { title: e.target.value })} placeholder="عنوان ویدیو" style={{ ...inp, flex: 1, minWidth: 140, padding: '8px 11px', fontSize: 13 }} />
                  <input value={v.duration} onChange={e => setVideo(v.id, { duration: e.target.value })} placeholder="مدت (۱۲:۳۴)" style={{ ...inp, width: 110, padding: '8px 11px', fontSize: 13 }} />
                  <button type="button" onClick={() => removeVideo(v.id)} aria-label="حذف" style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_M, padding: 4 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => videoInput.current?.click()} disabled={videoBusy} style={{ ...lqBtn, background: 'transparent', border: '1px dashed rgba(199,166,106,0.45)', alignSelf: 'flex-start', fontSize: 13, padding: '9px 16px' }}>{videoBusy ? 'در حال آپلود…' : '+ افزودن ویدیو'}</button>
              <input ref={videoInput} type="file" accept="video/mp4,video/quicktime,video/webm" hidden onChange={e => { void addVideo(e.target.files?.[0]); e.target.value = '' }} />
            </div>
          </div>

          {/* 5 — Contact */}
          <div style={card}>
            {sectionTitle('راه‌های ارتباطی', 5)}
            <p style={{ fontSize: 12.5, color: TEXT_M, marginBottom: 14 }}>هر کدام را که پر کنید، آیکونش در بخش «راه‌های ارتباطی» پروفایل نمایش داده می‌شود.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
              {/* دو قالبِ متفاوت — دلیلش کنارِ همین بلوک در پنلِ مربی */}
              <div>
                <label style={lbl}>شماره تماس</label>
                <input style={{ ...inp, direction: 'ltr', textAlign: 'left' }} inputMode="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="09121234567" />
                <div style={hint}>با صفرِ اول و بدون فاصله — <span className="bh-latin" dir="ltr">09121234567</span></div>
              </div>
              <div>
                <label style={lbl}>واتساپ</label>
                <input style={{ ...inp, direction: 'ltr', textAlign: 'left' }} inputMode="tel" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="989121234567" />
                <div style={hint}>با کد کشور و بدون صفر و بدون + — <span className="bh-latin" dir="ltr">989121234567</span></div>
              </div>
              <div><label style={lbl}>اینستاگرام</label><input style={{ ...inp, direction: 'ltr', textAlign: 'left' }} value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="referee.username" /></div>
              <div><label style={lbl}>تلگرام</label><input style={{ ...inp, direction: 'ltr', textAlign: 'left' }} value={form.telegram} onChange={e => set('telegram', e.target.value)} placeholder="referee_username" /></div>
            </div>
          </div>

          {/* 6 — Certificate (MANDATORY) */}
          <div data-field="certificate" style={{ ...card, border: errors.certificate ? '1px solid rgba(239,68,68,0.45)' : CBOR }}>
            {sectionTitle('آپلود مدرک داوری (الزامی)', 6)}
            <p style={{ fontSize: 12.5, color: TEXT_M, marginBottom: 14, lineHeight: 1.8 }}>آپلود مدرک داوری برای ثبت پروفایل <b style={{ color: '#b91c1c' }}>الزامی</b> است. این مدرک توسط ادمین سیستم بررسی می‌شود؛ در صورت تایید، پروفایل شما با تیک آبی تایید منتشر می‌شود.</p>
            {form.certificate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(5,118,66,0.25)', background: 'rgba(5,118,66,0.06)', borderRadius: 10, padding: '11px 14px', marginBottom: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#057642" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                <span style={{ flex: 1, fontSize: 13, color: TEXT, direction: 'ltr', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.certificate.name}</span>
                <button type="button" onClick={() => /* عمداً `set` نیست: `set` خطا را پاک می‌کند و برداشتنِ یک مدرکِ
                     اجباری باید همان خطا را برگرداند، نه پنهانش کند. */
                    setForm(f => ({ ...f, certificate: null }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_M, fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>حذف</button>
              </div>
            )}
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, border: `1.5px dashed ${errors.certificate ? 'rgba(239,68,68,0.5)' : 'rgba(199,166,106,0.45)'}`, borderRadius: 12, padding: '20px', cursor: 'pointer', color: GOLD_D, fontWeight: 700, fontSize: 13.5 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              {form.certificate ? 'آپلود مدرک جدید (جایگزین مدرک قبلی)' : 'انتخاب فایل مدرک داوری (تصویر یا PDF)'}
              <input type="file" accept="image/*,.pdf" hidden onChange={e => addCertificate(e.target.files?.[0])} />
            </label>
            {err('certificate')}
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
            <button type="button" onClick={onSubmit} style={{ ...lqBtn, padding: '13px 34px', fontSize: 15 }}>ثبت اطلاعات</button>
          </div>
        </div>
      </div>
      {/* پنجره‌ی خطا وسطِ صفحه — همان کامپوننتی که فرمِ آگهی هم دارد */}
      <AlertDialog
        open={!!alert}
        title={alert?.title ?? ''}
        lines={alert?.lines ?? []}
        onClose={() => setAlert(null)}
      />
    </div>
  )
}

export default function RefereeDashboardPage() {
  return (
    <AuthGuard>
      <RefereeDashboardInner />
    </AuthGuard>
  )
}

'use client'

/* ─────────────────────────────────────────────────────────────
   پنل تولیدکننده — تکمیل پروفایل کارخانه/برند.
   هرچه این‌جا ذخیره شود، همان در /manufacturers (دایرکتوری) و
   /manufacturers/<slug> (صفحه‌ی تولیدکننده) نمایش داده می‌شود.
   مالکیت با user.id — همان الگوی بقیه‌ی پنل‌ها.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '../../../store/auth.store'
import ProvinceCitySelect from '../../../components/ProvinceCitySelect'
import ProfileSlugField from '../../../components/ProfileSlugField'
import ClubPicker from '../../../components/ClubPicker'
import { compressImage } from '../../../lib/seller-store'
import {
  emptyManufacturerProfile, findManufacturerByOwner, newManufacturerSlug,
  saveManufacturerProfile, type ManufacturerProfile,
} from '../../../lib/manufacturer-store'
import { ProfileLoadSpinner, ProfileLoadError } from '../../../components/profile/ProfileLoadGate'
import { fetchMyProfileResult, saveProfileRemote } from '../../../lib/profiles/client'
import VerificationBadges from '../../../components/VerificationBadges'
import { Plus, Trash2, Images, Factory, ArrowLeft, MapPin } from 'lucide-react'

const CARD   = 'rounded-2xl border border-[#E7E2D6] bg-white p-5 shadow-[0_2px_10px_rgba(28,27,23,0.05)]'
const LQ_BTN = 'inline-flex items-center gap-2 rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] px-4 py-2.5 text-[13px] font-bold text-[#8F6531] transition hover:-translate-y-0.5'
const INPUT  = 'w-full rounded-xl border border-[#E7E2D6] bg-[#FAFAF7] px-3.5 py-2.5 text-[13.5px] text-[#1C1B17] outline-none transition focus:border-[#C7A66A] placeholder:text-[11.5px] placeholder:text-[#A69F8E]'
const LABEL  = 'mb-1.5 block text-[12.5px] font-bold text-[#5B564B]'
/* ارقام فارسی به لاتین — کد پستی باید رقمِ خوانا برای سرور بماند */
const faToEn = (v: string) => v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
const faNumFa = (n: number) => n.toLocaleString('fa-IR')

export default function ManufacturerDashboard() {
  const { user, _hydrated } = useAuthStore()

  const [form, setForm]     = useState<ManufacturerProfile>(() => emptyManufacturerProfile('draft'))
  const [specInput, setSpecInput] = useState('')
  const [loaded, setLoaded] = useState(false)
  /* نامکی که واقعا روی سرور ثبت شده. تا وقتی خالی است فیلد نشانی
     باز می‌ماند؛ نامک خودکار فرم نباید قفلش کند. */
  const [savedSlug, setSavedSlug] = useState<string | null>(null)
  /* خواندنِ نسخه‌ی سرور شکست خورد — فرم باز نمی‌شود، وگرنه کاربر
     روی داده‌ای کار می‌کند که نمی‌دانیم کاملِ کدام نسخه است. */
  const [loadErr, setLoadErr] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [saved, setSaved]   = useState(false)
  const [err, setErr]       = useState('')
  const [busy, setBusy]     = useState(false)

  const bannerRef = useRef<HTMLInputElement>(null)
  const licRef = useRef<HTMLInputElement>(null)
  const [cert, setCert] = useState({ title: '', issuer: '', year: '', image: '' })
  const certImgRef = useRef<HTMLInputElement>(null)
  const [geoBusy, setGeoBusy] = useState(false)
  const [geoErr, setGeoErr] = useState('')

  const isManufacturer = !!user && [user.primaryRole, ...(user.secondaryRoles ?? [])].includes('manufacturer')

  useEffect(() => {
    if (!_hydrated) return
    /* گاردِ پاسخِ کهنه: خروجِ کاربر یا «تلاش دوباره» وسطِ بارگذاری
       نباید بگذارد پاسخِ درخواستِ قبلی وضعیتِ تازه را خراب کند. */
    let alive = true
    /* ⚠️ بدونِ کاربر چیزی برای خواندن نیست؛ بدونِ این، گاردِ
       «تا نسخه‌ی سرور نرسیده فرم باز نشود» یک اسپینرِ ابدی می‌شد. */
    if (!user) { setLoaded(true); setSavedSlug(''); return }

    /* اول نسخه‌ی همین مرورگر تا فرم فورا پر شود، بعد نسخه‌ی سرور */
    const mine = findManufacturerByOwner(user)
    const local = mine ?? emptyManufacturerProfile(newManufacturerSlug(), user.id, user.phone ?? '')
    setForm(local)
    setLoaded(true)
    setLoadErr(false)

    void (async () => {
      const res = await fetchMyProfileResult<ManufacturerProfile>('manufacturer')
      /* خطا ⇒ نمی‌دانیم چیزی ثبت شده یا نه؛ نشانی قفل می‌ماند. */
      if (!alive) return
      if (res.state === 'error') { setLoadErr(true); return }
      const remote = res.state === 'found' ? res.profile : null
      if (!remote) {
        /* ⚠️ این‌جا قبلا پروفایلِ محلی **بی‌اجازه روی سرور ذخیره
           می‌شد** و بعد نشانیِ اختصاصی قفل می‌شد: کاربر پنل را
           باز می‌کرد، هنوز چیزی تایید نکرده بود، و نامکِ خودکار
           برایش ثبت و دائمی شده بود. تا وقتی خودش «ذخیره» را
           نزند چیزی روی سرور نمی‌رود. */
        setSavedSlug('')
        return
      }
      setSavedSlug(remote.slug)
      const merged: ManufacturerProfile = {
        ...local, ...remote.data,
        slug: remote.slug, ownerId: remote.ownerId,
        licenseNumber: remote.licenseNumber ?? '',
      }
      setForm(merged)
      try { saveManufacturerProfile(merged) } catch { /* کش مرورگر پر است */ }
    })()
    return () => { alive = false }
  }, [_hydrated, user?.id, reloadKey])

  const set = <K extends keyof ManufacturerProfile>(k: K, v: ManufacturerProfile[K]) => {
    setForm(f => ({ ...f, [k]: v })); setSaved(false); setErr('')
  }

  const addSpec = () => {
    const v = specInput.trim()
    if (!v || form.specialties.includes(v)) { setSpecInput(''); return }
    set('specialties', [...form.specialties, v]); setSpecInput('')
  }

  /* پروانه — عکس فشرده می‌شود، PDF همان‌طور خوانده می‌شود */
  const pickLicense = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setBusy(true)
    try {
      const url = f.type.startsWith('image/')
        ? await compressImage(f, 1400, 0.75)
        : await new Promise<string>((res, rej) => {
            const r = new FileReader()
            r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error('read'))
            r.readAsDataURL(f)
          })
      set('licenseFile', { name: f.name, url })
    } catch { setErr('فایل خوانده نشد.') }
    finally { setBusy(false); e.target.value = '' }
  }

  const pickBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setBusy(true)
    try { set('bannerImage', await compressImage(f, 1600, 0.72)) }
    catch { setErr('عکس خوانده نشد.') }
    finally { setBusy(false); e.target.value = '' }
  }

  /* ── گواهینامه ──
     ⚠️ تصویر اجباری است: «ISO 9001» تایپ‌شده بدون مدرک، فقط یک
     ادعاست و روی صفحه‌ی عمومی مثل واقعیت دیده می‌شود. */
  const addCert = () => {
    if (!cert.title.trim()) { setErr('عنوان گواهینامه لازم است.'); return }
    if (!cert.image) { setErr('تصویر گواهینامه لازم است.'); return }
    set('certificates', [...form.certificates, {
      title: cert.title.trim(), issuer: cert.issuer.trim(),
      year: cert.year.trim(), image: cert.image,
    }])
    setCert({ title: '', issuer: '', year: '', image: '' })
  }

  const pickCertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setBusy(true)
    try { const url = await compressImage(f, 1400, 0.74); setCert(c => ({ ...c, image: url })) }
    catch { setErr('عکس خوانده نشد.') }
    finally { setBusy(false); e.target.value = '' }
  }

  /* موقعیت دقیق — همان چیزی که فرم ثبت باشگاه می‌گیرد */
  const getLocation = () => {
    if (!navigator.geolocation) { setGeoErr('مرورگر موقعیت مکانی را پشتیبانی نمی‌کند'); return }
    setGeoBusy(true); setGeoErr('')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({
          ...f,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }))
        setSaved(false)
        setGeoBusy(false)
      },
      () => { setGeoErr('دسترسی به موقعیت مکانی رد شد'); setGeoBusy(false) },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim())        { setErr('نام کارخانه/برند لازم است.'); return }
    if (!form.city)               { setErr('شهر را انتخاب کنید.'); return }
    if (!form.description.trim()) { setErr('توضیح کوتاه لازم است.'); return }
    if (!form.phone.trim())       { setErr('شماره تماس لازم است.'); return }

    setBusy(true)
    void (async () => {
      /* منبع حقیقت سرور است؛ localStorage فقط کش همین مرورگر می‌ماند */
      if (savedSlug === null) { setErr('نشانی اختصاصی هنوز خوانده نشده — چند لحظه صبر کنید یا صفحه را تازه کنید'); setBusy(false); return }

      /* ── چرا محصولات از سرور خوانده می‌شوند، نه از فرم ──
         ⚠️ `POST` کلِ `data` را جایگزین می‌کند و این فرم دیگر محصول
         را ویرایش نمی‌کند (رفته روی صفحه‌ی عمومی). پس اگر همین تب
         باز مانده باشد و مالک در تبِ دیگری محصولی اضافه کند، ذخیره‌ی
         این فرم با فهرستِ کهنه‌ی لحظه‌ی بارگذاری آن را پاک می‌کرد —
         همان باگی که یک‌بار محصول‌ها را از بین برد. */
      const fresh = await fetchMyProfileResult<ManufacturerProfile>('manufacturer')
      if (fresh.state === 'error') {
        setErr('ارتباط با سرور برقرار نشد؛ برای اینکه اطلاعات قبلی پاک نشود ذخیره انجام نشد.')
        setBusy(false); return
      }
      const serverProducts = fresh.state === 'found' ? (fresh.profile.data.products ?? []) : []

      const next: ManufacturerProfile = {
        ...form,
        products: serverProducts,
        ownerId: user?.id || form.ownerId,
        ownerPhone: user?.phone || form.ownerPhone,
        status: 'approved',
      }

      const res = await saveProfileRemote('manufacturer', next.slug, next as unknown as Record<string, unknown>,
        { number: next.licenseNumber, url: next.licenseFile?.url ?? '' })
      if (!res.ok) { setErr(res.message ?? 'ذخیره روی سرور انجام نشد'); setBusy(false); return }
      /* عکس‌ها روی سرور به نشانی Storage تبدیل شده‌اند */
      if (res.profile?.slug) setSavedSlug(res.profile.slug)
    /* از این لحظه نشانی منتشر شده و قفل می‌شود: هر تغییر بعدی
       لینک‌های منتشرشده را می‌شکند. */
      const saved = (res.profile?.data as ManufacturerProfile | undefined) ?? next
      try { saveManufacturerProfile({ ...next, ...saved }) } catch { /* کش پر است */ }
      setForm(f => ({ ...f, ...saved }))
      setSaved(true); setErr(''); setBusy(false)
    })()
  }

  if (!_hydrated || !loaded) return null

  if (!isManufacturer) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#F7F5F0] p-6 text-center font-[Vazirmatn,Tahoma,sans-serif]">
        <div className={`${CARD} max-w-[420px]`}>
          <Factory size={26} className="mx-auto mb-3 text-[#6F6A5C]" />
          <h1 className="text-[16px] font-bold">این صفحه مخصوص تولیدکنندگان است</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#5B564B]">برای ساختن پروفایل، اول باید نقش «تولیدکننده» را بگیرید.</p>
          <Link href="/profile/role" className={`${LQ_BTN} mt-4`}>انتخاب نقش</Link>
        </div>
      </div>
    )
  }

  /* ── چرا فرم پیش از رسیدنِ نسخه‌ی سرور باز نمی‌شود ──
     ⚠️ این ریشه‌ی «دو محصول ثبت کردم، فقط آخری ماند» بود.

     افکتِ بالا اول نسخه‌ی مرورگر را می‌نشاند و بعد، وقتی پاسخِ سرور
     رسید، `setForm(merged)` می‌زند — و `merged` از روی همان نسخه‌ی
     اولیه ساخته شده، نه از روی چیزی که کاربر در این فاصله وارد
     کرده. روی شبکه‌ی کند، کاربر محصول اول را اضافه می‌کرد و چند
     ثانیه بعد پاسخِ سرور بی‌صدا پاکش می‌کرد؛ بعد محصول دوم را
     اضافه می‌کرد و ذخیره می‌شد — یعنی فقط آخری می‌ماند.

     راه‌حل، حذفِ خودِ مسابقه است: تا وقتی پایه‌ی داده نرسیده، چیزی
     برای ویرایش وجود ندارد. */
  if (savedSlug === null && !loadErr) return <ProfileLoadSpinner />
  if (loadErr) return <ProfileLoadError onRetry={() => setReloadKey(k => k + 1)} />

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F5F0] pb-24 text-[#1C1B17] font-[Vazirmatn,Tahoma,sans-serif]">
      <div className="mx-auto max-w-[900px] px-4 pt-6 sm:px-6">

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[19px] font-bold">پنل تولیدکننده</h1>
            <p className="mt-1 text-[12.5px] text-[#6F6A5C]">هرچه این‌جا وارد کنید، همان در بخش «تولیدکنندگان» سایت دیده می‌شود.</p>
          </div>
          <Link href={`/manufacturers/${form.slug}`} className={LQ_BTN}>
            <ArrowLeft size={14} /> مشاهده‌ی پروفایل
          </Link>
        </div>

        <form onSubmit={submit} className="space-y-5">

          {/* وضعیت تأیید — هویت، مدارک و ایمیل */}
          <VerificationBadges />


          {/* ═══ هویت کارخانه ═══ */}
          <section className={CARD}>
            <h2 className="mb-4 text-[14.5px] font-bold">هویت کارخانه / برند</h2>

            {/* بنر */}
            <div className="mb-5">
              <label className={LABEL}>بنر صفحه (عکس کارخانه یا محصولات)</label>
              <div className="flex items-center gap-3">
                <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={pickBanner} />
                <button type="button" onClick={() => bannerRef.current?.click()} className={LQ_BTN} disabled={busy}>
                  <Images size={14} /> {form.bannerImage ? 'تغییر بنر' : 'آپلود بنر'}
                </button>
                {form.bannerImage && (
                  <>
                    <img loading="lazy" decoding="async" src={form.bannerImage} alt="" className="h-14 w-24 rounded-lg border border-[#E7E2D6] object-cover" />
                    <button type="button" onClick={() => set('bannerImage', '')} className="text-[11.5px] font-bold text-[#B23B2E]">حذف</button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL}>نام کارخانه / برند *</label>
                <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="مثال: صنایع بیلیارد آریا" />
              </div>
              <div>
                <label className={LABEL}>سال تأسیس</label>
                <input className={INPUT} value={form.sinceYear} onChange={e => set('sinceYear', e.target.value)} placeholder="مثال: ۱۳۷۸" />
              </div>
                            {/* نشانی اختصاصی سایت — همان چیزی که پنل باشگاه از اول داشت */}
              <div className="sm:col-span-2">
                <ProfileSlugField
                  kind="manufacturer" value={form.slug} savedSlug={savedSlug}
                  onChange={v => setForm(f => ({ ...f, slug: v }))}
                  suggestFrom={form.name}
                />
              </div>
<div className="sm:col-span-2">
                <ProvinceCitySelect
                  value={{ province: form.province, city: form.city }}
                  onChange={v => { set('province', v.province); set('city', v.city) }}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <ClubPicker />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>تخصص‌ها (روی کارت نمایش داده می‌شود)</label>
                <div className="flex gap-2">
                  <input className={INPUT} value={specInput} onChange={e => setSpecInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSpec() } }} placeholder="مثال: میز اسنوکر + Enter" />
                  <button type="button" aria-label="افزودن مشخصه" onClick={addSpec} className={LQ_BTN}><Plus size={14} /></button>
                </div>
                {form.specialties.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {form.specialties.map(s => (
                      <span key={s} className="inline-flex items-center gap-1 rounded-full border border-[#E7E2D6] bg-[#FAFAF7] px-2.5 py-1 text-[11.5px] font-semibold text-[#5B564B]">
                        {s}
                        <button type="button" onClick={() => set('specialties', form.specialties.filter(x => x !== s))} className="text-[#B23B2E]">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>توضیح کوتاه *</label>
                <input className={INPUT} value={form.description} onChange={e => set('description', e.target.value)} placeholder="یک جمله درباره‌ی کارخانه و محصولات…" />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>شعار / تگ‌لاین</label>
                <input className={INPUT} value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="مثال: کیفیتی که حس می‌شود" />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>درباره‌ی ما</label>
                <textarea className={`${INPUT} min-h-[100px] leading-7`} value={form.about} onChange={e => set('about', e.target.value)} placeholder="تاریخچه، خط تولید، استانداردها…" />
              </div>
              <div>
                <label className={LABEL}>ظرفیت تولید</label>
                <input className={INPUT} value={form.productionCapability} onChange={e => set('productionCapability', e.target.value)} placeholder="مثال: ماهانه ۴۰ میز" />
              </div>
              <div>
                <label className={LABEL}>تعداد پرسنل</label>
                <input className={INPUT} value={form.employees} onChange={e => set('employees', e.target.value)} placeholder="مثال: ۲۵ نفر" />
              </div>
              <div>
                <label className={LABEL}>کشورهای صادرات</label>
                <input className={INPUT} value={form.exportCountries} onChange={e => set('exportCountries', e.target.value)} placeholder="مثال: عراق، امارات، عمان" />
              </div>
              <div>
                <label className={LABEL}>مجموع تولید تاکنون</label>
                <input className={INPUT} value={form.totalProduced} onChange={e => set('totalProduced', e.target.value)} placeholder="مثال: بیش از ۲٬۰۰۰ میز" />
              </div>
            </div>
          </section>

          {/* ═══ گواهینامه‌ها و استانداردها ═══ */}
          <section className={CARD}>
            <h2 className="mb-1 text-[14.5px] font-bold">گواهینامه‌ها و استانداردها</h2>
            <p className="mb-4 text-[12px] text-[#6F6A5C]">در صفحه‌ی تولیدکننده نمایش داده می‌شوند.</p>
            {form.certificates.length > 0 && (
              <div className="mb-4 space-y-2">
                {form.certificates.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-[#EFEBE1] bg-[#FAFAF7] px-3 py-2.5">
                    {c.image
                      ? <img loading="lazy" decoding="async" src={c.image} alt="" className="h-11 w-8 rounded border border-[#E7E2D6] object-cover" />
                      : <span className="h-11 w-8 shrink-0 rounded border border-[#E7E2D6] bg-[#F2EFE7]" aria-hidden />}
                    <span className="flex-1 text-[13px] font-bold">{c.title}</span>
                    <span className="text-[11.5px] text-[#6F6A5C]">{c.issuer}</span>
                    <span className="text-[11.5px] text-[#6F6A5C]">{c.year}</span>
                    <button type="button" onClick={() => set('certificates', form.certificates.filter((_, x) => x !== i))}
                      className="rounded-lg p-1.5 text-[#B23B2E] transition hover:bg-[rgba(178,59,46,0.08)]"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            {/* همان تله‌ی زیرفرمِ محصول: Enter این‌جا هم پروفایل را ذخیره
                می‌کرد و گواهینامه‌ی تایپ‌شده دور ریخته می‌شد. */}
            <div
              className="flex flex-col gap-2 rounded-xl border border-dashed border-[#D8D2C4] p-4 sm:flex-row"
              onKeyDown={e => {
                if (e.key !== 'Enter') return
                if ((e.target as HTMLElement).tagName !== 'INPUT') return
                if ((e.nativeEvent as unknown as { isComposing?: boolean }).isComposing) return
                e.preventDefault()
                addCert()
              }}
            >
              <input className={INPUT} value={cert.title} onChange={e => setCert(c => ({ ...c, title: e.target.value }))} placeholder="عنوان — مثال: ISO 9001" />
              <input className={INPUT} value={cert.issuer} onChange={e => setCert(c => ({ ...c, issuer: e.target.value }))} placeholder="صادرکننده" />
              <input className={`${INPUT} sm:w-28`} value={cert.year} onChange={e => setCert(c => ({ ...c, year: e.target.value }))} placeholder="سال" />
              {/* تصویر گواهینامه اجباری است — بدونِ مدرک فقط یک ادعاست */}
              <input ref={certImgRef} type="file" accept="image/*" className="hidden" onChange={pickCertImage} />
              <button type="button" onClick={() => certImgRef.current?.click()} className={`${LQ_BTN} shrink-0`} disabled={busy}>
                <Images size={14} /> {cert.image ? 'تغییر تصویر' : 'تصویر گواهینامه *'}
              </button>
              {cert.image && <img loading="lazy" decoding="async" src={cert.image} alt="" className="h-11 w-8 shrink-0 rounded border border-[#E7E2D6] object-cover" />}
              <button type="button" className={`${LQ_BTN} shrink-0`} onClick={addCert}>
                <Plus size={14} /> افزودن
              </button>
            </div>
          </section>

          {/* ═══ پروانه‌ی تولید / جواز کسب ═══ */}
          <section className={CARD}>
            <h2 className="mb-1 text-[14.5px] font-bold">پروانه‌ی تولید / جواز کسب</h2>
            <p className="mb-4 text-[12px] text-[#6F6A5C]">
              برای گرفتن تیک تأیید لازم است. ادمین شماره را با فایل آپلودشده تطبیق می‌دهد.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL}>شماره‌ی پروانه</label>
                <input className={INPUT} dir="ltr" style={{ textAlign: 'right' }}
                  value={form.licenseNumber}
                  onChange={e => set('licenseNumber', e.target.value.replace(/[^0-9A-Za-z\-/]/g, '').slice(0, 40))}
                  placeholder="مثال: 1234567890" />
              </div>
              <div>
                <label className={LABEL}>فایل پروانه (عکس یا PDF)</label>
                <input ref={licRef} type="file" accept="image/*,.pdf" className="hidden" onChange={pickLicense} />
                <button type="button" onClick={() => licRef.current?.click()} disabled={busy} className={LQ_BTN}>
                  <Images size={14} /> {form.licenseFile ? 'تغییر فایل' : 'آپلود فایل'}
                </button>
                {form.licenseFile && (
                  <div className="mt-2 flex items-center gap-2 text-[12px] text-[#5B564B]">
                    <span className="truncate" dir="ltr">{form.licenseFile.name}</span>
                    <button type="button" onClick={() => set('licenseFile', null)}
                      className="rounded-lg p-1 text-[#B23B2E] transition hover:bg-[rgba(178,59,46,0.08)]"><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ═══ راه‌های ارتباطی ═══ */}
          <section className={CARD}>
            <h2 className="mb-4 text-[14.5px] font-bold">راه‌های ارتباطی</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL}>شماره تماس *</label>
                <input className={INPUT} dir="ltr" style={{ textAlign: 'right' }} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="۰۲۱ - xxxxxxxx" />
              </div>
              {/* خط دوم — کارگاه معمولا یکی برای فروش دارد و یکی برای دفتر */}
              <div>
                <label className={LABEL}>شماره تماس دوم</label>
                <input className={INPUT} dir="ltr" style={{ textAlign: 'right' }} value={form.phone2 ?? ''} onChange={e => set('phone2', e.target.value)} placeholder="اختیاری" />
              </div>
              {/* موبایل جدا از واتساپ: شماره‌ی واتساپ لزوما شماره‌ی تماس نیست */}
              <div>
                <label className={LABEL}>موبایل</label>
                <input className={INPUT} dir="ltr" style={{ textAlign: 'right' }} value={form.mobile ?? ''} onChange={e => set('mobile', e.target.value)} placeholder="09xxxxxxxxx" />
              </div>
              <div>
                <label className={LABEL}>واتساپ</label>
                <input className={INPUT} dir="ltr" style={{ textAlign: 'right' }} value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="989xxxxxxxxx" />
              </div>
              <div>
                <label className={LABEL}>اینستاگرام</label>
                <input className={INPUT} dir="ltr" style={{ textAlign: 'right' }} value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="billiard.brand" />
              </div>
              <div>
                <label className={LABEL}>وب‌سایت</label>
                <input className={INPUT} dir="ltr" style={{ textAlign: 'right' }} value={form.website} onChange={e => set('website', e.target.value)} placeholder="www.example.com" />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>آدرس</label>
                <input className={INPUT} value={form.address} onChange={e => set('address', e.target.value)} placeholder="شهرک صنعتی…" />
              </div>
              <div>
                <label className={LABEL}>کد پستی</label>
                <input
                  className={INPUT} dir="ltr" style={{ textAlign: 'right' }}
                  inputMode="numeric" maxLength={10}
                  value={form.postalCode ?? ''}
                  /* ⚠️ فقط رقم و فقط ده رقم: کد پستی ایران ده‌رقمی است
                     و ارقام فارسی هم باید پذیرفته شوند. */
                  onChange={e => set('postalCode', faToEn(e.target.value).replace(/\D/g, '').slice(0, 10))}
                  placeholder="۱۰ رقم"
                />
              </div>
              {/* ── موقعیت دقیق ──
                  همان دکمه‌ای که فرم ثبت باشگاه دارد. نشانی متنی برای
                  خواندن است؛ مسیریابی به مختصات نیاز دارد. */}
              <div>
                <label className={LABEL}>موقعیت کارگاه</label>
                <button type="button" onClick={getLocation} disabled={geoBusy} className={LQ_BTN}>
                  <MapPin size={14} /> {geoBusy ? 'در حال دریافت…' : 'دریافت موقعیت فعلی'}
                </button>
                {form.latitude && form.longitude && (
                  <p className="mt-2 text-[12px] font-bold text-[#0E7A38]">
                    ثبت شد: {Number(form.latitude).toFixed(4)}، {Number(form.longitude).toFixed(4)}
                  </p>
                )}
                {geoErr && <p className="mt-2 text-[12px] font-bold text-[#B23B2E]">{geoErr}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>ساعات کاری</label>
                <input className={INPUT} value={form.hours} onChange={e => set('hours', e.target.value)} placeholder="مثال: شنبه تا پنجشنبه، ۸ تا ۱۷" />
              </div>
            </div>
          </section>

          {/* ═══ محصولات ═══
              ⚠️ فرمِ افزودن محصول از پنل برداشته شد. محصول حالا
              روی خودِ صفحه‌ی تولیدکننده و با همان دکمه‌ی + گالری
              اضافه می‌شود — جایی که نتیجه بی‌درنگ دیده می‌شود و
              لازم نیست کاربر بین پنل و صفحه رفت‌وبرگشت کند. */}
          <section className={CARD}>
            <h2 className="mb-1 text-[14.5px] font-bold">محصولات</h2>
            <p className="mb-4 text-[12px] leading-relaxed text-[#6F6A5C]">
              افزودن و ویرایش محصول از خودِ صفحه‌ی تولیدکننده انجام می‌شود —
              در بخش «محصولات ما» با دکمه‌ی <span className="font-bold text-[#8F6531]">+</span>،
              همان‌طور که عکس و ویدیو اضافه می‌کنید. این دکمه را فقط شما می‌بینید.
            </p>
            {/* ⚠️ تا پروفایل ذخیره نشده، صفحه‌ی عمومی وجود ندارد و این
                لینک به «تولیدکننده پیدا نشد» می‌رفت — و چون فرمِ
                محصول هم از این‌جا رفته، تنها راهِ ورود بن‌بست می‌شد. */}
            {savedSlug ? (
              <Link href={`/manufacturers/${savedSlug}`} className={LQ_BTN}>
                <ArrowLeft size={14} /> رفتن به «محصولات ما»
              </Link>
            ) : (
              <p className="text-[12.5px] font-bold text-[#8F6531]">
                ابتدا پروفایل را ذخیره کنید تا صفحه‌ی اختصاصی‌تان ساخته شود.
              </p>
            )}
            {form.products.length > 0 && (
              <p className="mt-3 text-[12px] text-[#6F6A5C]">
                {faNumFa(form.products.length)} محصول ثبت شده است.
              </p>
            )}
          </section>

          {/* ═══ ذخیره ═══ */}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className={`${LQ_BTN} px-7 py-3 text-[14px]`} disabled={busy}>
              ذخیره و انتشار پروفایل
            </button>
            {saved && <span className="text-[12.5px] font-bold text-[#0E7A38]">ذخیره و منتشر شد ✓ — در «تولیدکنندگان» نمایش داده می‌شود.</span>}
            {err && <span className="text-[12.5px] font-bold text-[#B23B2E]">{err}</span>}
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'
/* ─────────────────────────────────────────────────────────────
   پنل صاحب فروشگاه — /dashboard/seller
   دسترسی: هرکس نقش «فروشنده» (seller) را گرفته باشد.
   هر فیلد اینجا مستقیماً به یک چیزِ دیدنی در /sellers/<slug> وصل است.
   ───────────────────────────────────────────────────────────── */
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../../store/auth.store'
import {
  type SellerProfile,
  emptySellerProfile, findSellerByOwner, findUnclaimedSeller, newSellerSlug, saveSellerProfile, compressImage,
} from '../../../lib/seller-store'
import ProvinceCitySelect from '../../../components/ProvinceCitySelect'

const toFa = (v: string | number) => String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)

/* برای جواز کسبِ PDF (تصویر با canvas فشرده می‌شود، PDF مستقیم base64) */
const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onerror = () => reject(new Error('read failed'))
    r.onload = () => resolve(String(r.result))
    r.readAsDataURL(file)
  })

/* ── توکن‌های ظاهری، هم‌راستا با بقیه‌ی داشبوردها ── */
const CARD  = 'rounded-2xl border border-[#E7E2D6] bg-white p-5 sm:p-6'
const LABEL = 'mb-1.5 block text-[12.5px] font-semibold text-[#5B564B]'
const HINT  = 'mt-1 text-[11.5px] text-[#8A8474]'
const INPUT = 'w-full rounded-[10px] border border-[#E7E2D6] bg-[#FAFAF7] px-3.5 py-2.5 text-[13.5px] text-[#1C1B17] placeholder:text-[#A69F8E] focus:border-[#14532D] focus:outline-none'
const LQ_BTN = 'inline-flex items-center justify-center gap-2 rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] px-4 py-2.5 text-[13px] font-bold text-[#9A6E38] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0'

const Icon = {
  upload: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5-5 5 5"/><path d="M12 5v12"/></svg>,
  trash:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>,
  store:  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></svg>,
  plus:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  back:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>,
  doc:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>,
  check:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
}

/* اسلاگ فروشگاه = همان id در آدرس. فعلاً تک‌فروشگاهیِ نمونه؛ بعداً از سرور می‌آید. */
const DEFAULT_SLUG = '1'

export default function SellerDashboard() {
  const router = useRouter()
  const { user, _hydrated } = useAuthStore()

  const [form, setForm]   = useState<SellerProfile>(() => emptySellerProfile(DEFAULT_SLUG))
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [err, setErr]       = useState('')
  const [busy, setBusy]     = useState(false)
  const [warn, setWarn]     = useState(false)   // هشدارِ «بدون جواز کسب»
  const [brandInput, setBrandInput] = useState('')

  const logoRef   = useRef<HTMLInputElement>(null)
  const storyRef  = useRef<HTMLInputElement>(null)
  const certRef   = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const aboutRef  = useRef<HTMLInputElement>(null)

  const isSeller = useMemo(() => {
    if (!user) return false
    return [user.primaryRole, ...(user.secondaryRoles ?? [])].includes('seller')
  }, [user])

  /* بعد از هیدریت: فروشگاهِ خودِ همین کاربر را بارگذاری کن — بر اساسِ user.id (که همیشه
     موجود است). شماره‌ی موبایل اختیاری است و نباید مبنای مالکیت باشد، وگرنه فروشگاه با
     مالکِ خالی ذخیره می‌شد و دیگر پیدا نمی‌شد (فرم خالی می‌ماند).
       • اگر فروشگاهِ خودش را دارد → همان.
       • وگرنه اگر رکوردِ قدیمیِ بی‌صاحبی هست → همین کاربر تصاحبش می‌کند (بازیابیِ فروشگاهی
         که پیش‌تر بدونِ شناسه‌ی مالک ذخیره شده بود).
       • وگرنه فرمِ خالی با اسلاگِ *یکتای تازه* (نه «۱») تا روی فروشگاهِ دیگری ننویسد. */
  useEffect(() => {
    if (!_hydrated) return
    if (user) {
      let mine = findSellerByOwner(user)
      if (!mine) {
        const orphan = findUnclaimedSeller()
        if (orphan) {
          mine = { ...orphan, ownerId: user.id, ownerPhone: user.phone ?? orphan.ownerPhone }
          saveSellerProfile(mine)
        }
      }
      setForm(mine ?? emptySellerProfile(newSellerSlug(), user.phone ?? '', user.id))
    }
    setLoaded(true)
  }, [_hydrated, user?.id])

  const set = <K extends keyof SellerProfile>(k: K, v: SellerProfile[K]) => {
    setForm(f => ({ ...f, [k]: v })); setSaved(false); setErr('')
  }

  const pickImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    apply: (dataUrl: string) => void,
    maxDim = 1280,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setErr('')
    try { apply(await compressImage(file, maxDim)) }
    catch { setErr('عکس خوانده نشد. دوباره تلاش کنید.') }
    finally { setBusy(false); e.target.value = '' }
  }

  /* اسلایدرهای بنر هدر و «درباره ما» — آرایه‌ی رشته، حداکثر ۳ عکس */
  const addImages = async (e: React.ChangeEvent<HTMLInputElement>, key: 'banners' | 'aboutImages', max = 3) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setBusy(true); setErr('')
    try {
      const cur = form[key]
      const room = max - cur.length
      if (room <= 0) { setErr(`حداکثر ${toFa(max)} عکس.`); return }
      const urls = await Promise.all(files.slice(0, room).map(f => compressImage(f, 1600)))
      set(key, [...cur, ...urls])
    } catch { setErr('آپلود نشد. دوباره تلاش کنید.') }
    finally { setBusy(false); e.target.value = '' }
  }

  /* جواز کسب — عکس/PDF. مثل گالری فشرده می‌شود (اگر تصویر باشد). */
  const pickCertificate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setErr('')
    try {
      const url = file.type.startsWith('image/') ? await compressImage(file, 1400, 0.75) : await readAsDataUrl(file)
      set('certificate', { name: file.name, url })
    } catch { setErr('فایل خوانده نشد. دوباره تلاش کنید.') }
    finally { setBusy(false); e.target.value = '' }
  }

  const persist = () => {
    const ownerName = form.ownerName || [user?.firstName, user?.lastName].filter(Boolean).join(' ')
    /* انتشار هنگام ذخیره: فروشگاه بلافاصله در «فروشگاه‌ها» دیده می‌شود (جواز کسب اجباری است).
       اگر ادمین قبلاً ردش کرده بود، ویرایش دوباره منتشرش می‌کند. */
    saveSellerProfile({
      ...form,
      ownerName,
      ownerId: user?.id || form.ownerId,           // مالکیت به کاربرِ فعلی گره می‌خورد تا همیشه پیدا شود
      ownerPhone: user?.phone || form.ownerPhone,
      status: 'approved',
      submittedAt: form.submittedAt || new Date().toISOString(),
    })
    setSaved(true); setErr(''); setWarn(false)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setErr('نام فروشگاه لازم است.'); return }
    if (!form.certificate)  { setWarn(true); return }      // جواز کسب اجباری — مثل پنل مربی
    try { persist() }
    catch { setErr('حافظه‌ی مرورگر پر است — چند عکس از گالری حذف کنید و دوباره ذخیره کنید.') }
  }

  /* تا وقتی auth هیدریت نشده چیزی رندر نمی‌کنیم تا SSR و کلاینت یکی بمانند */
  if (!_hydrated || !loaded) return null

  if (!isSeller) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#F7F5F0] p-6 text-center">
        <div className={`${CARD} max-w-[420px]`}>
          <div className="mx-auto mb-3 w-fit text-[#8A8474]">{Icon.store}</div>
          <h1 className="text-[16px] font-bold">این صفحه مخصوص فروشندگان است</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#5B564B]">
            برای ساختن فروشگاه، اول باید نقش «فروشنده» را بگیرید.
          </p>
          <Link href="/profile/role" className={`${LQ_BTN} mt-4`}>انتخاب نقش</Link>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F5F0] pb-24 text-[#1C1B17]">
      <div className="mx-auto max-w-[900px] px-4 pt-6 sm:px-6">

        {/* سربرگ */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[19px] font-bold">پنل فروشگاه</h1>
            <p className="mt-1 text-[12.5px] text-[#8A8474]">
              هرچه اینجا وارد کنید، همان روی صفحه‌ی فروشگاه شما دیده می‌شود.
            </p>
          </div>
          <Link href={`/sellers/${form.slug}`} className={LQ_BTN}>
            {Icon.back} مشاهده‌ی فروشگاه
          </Link>
        </div>

        <form onSubmit={submit} className="space-y-5">

          {/* ═══ هویت فروشگاه ═══ */}
          <section className={CARD}>
            <h2 className="mb-4 text-[14.5px] font-bold">هویت فروشگاه</h2>

            {/* لوگو */}
            <div className="mb-5 flex flex-wrap items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-[2.5px] border-white bg-gradient-to-bl from-[#14532D] to-[#1E6B3C] text-white shadow-md">
                {form.logo
                  ? <img src={form.logo} alt="" className="h-full w-full object-cover"/>
                  : Icon.store}
              </span>
              <div>
                <span className={LABEL}>لوگوی فروشگاه</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => logoRef.current?.click()} disabled={busy} className={LQ_BTN}>
                    {Icon.upload} {form.logo ? 'تغییر لوگو' : 'آپلود لوگو'}
                  </button>
                  {form.logo && (
                    <button type="button" onClick={() => set('logo', '')}
                      className="rounded-[10px] border border-[#E7E2D6] px-3 py-2.5 text-[12.5px] text-[#5B564B] transition hover:text-[#B23B2E]">
                      حذف
                    </button>
                  )}
                </div>
                <p className={HINT}>تا وقتی لوگو آپلود نشود، آیکون پیش‌فرض فروشگاه نمایش داده می‌شود.</p>
                <input ref={logoRef} type="file" accept="image/*" className="hidden"
                  onChange={e => pickImage(e, url => set('logo', url), 400)}/>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL} htmlFor="f-title">نام فروشگاه *</label>
                <input id="f-title" className={INPUT} value={form.title}
                  onChange={e => set('title', e.target.value)} placeholder="فروشگاه تجهیزات بیلیارد بابی"/>
                <p className={HINT}>تیتر اصلی بالای صفحه‌ی فروشگاه.</p>
              </div>
              <div>
                <label className={LABEL} htmlFor="f-brand">نام کوتاه (برند)</label>
                <input id="f-brand" className={INPUT} value={form.brand}
                  onChange={e => set('brand', e.target.value)} placeholder="پروکیو"/>
                <p className={HINT}>در فوتر فروشگاه کنار نشان استفاده می‌شود.</p>
              </div>
              <div className="sm:col-span-2">
                <ProvinceCitySelect
                  value={{ province: form.province, city: form.city }}
                  onChange={v => setForm(f => ({ ...f, province: v.province, city: v.city }))}
                />
                <p className={HINT}>شهر کنار آیکون لوکیشن، زیر نام فروشگاه نمایش داده می‌شود.</p>
              </div>
              <div>
                <label className={LABEL} htmlFor="f-phone">شماره تماس</label>
                <input id="f-phone" className={INPUT} inputMode="tel" value={form.contactPhone}
                  onChange={e => set('contactPhone', e.target.value)} placeholder="66554433"/>
                <p className={HINT}>کنار آیکون تلفن در بالای صفحه.</p>
              </div>
            </div>

            <div className="mt-4">
              <label className={LABEL} htmlFor="f-desc">درباره‌ی فروشگاه</label>
              <textarea id="f-desc" rows={3} className={`${INPUT} resize-y leading-relaxed`} value={form.desc}
                onChange={e => set('desc', e.target.value)}
                placeholder="عرضه‌ی مستقیم چوب، میز، توپ و لوازم جانبی حرفه‌ای"/>
              <p className={HINT}>هم زیر نام فروشگاه و هم در باکس «درباره ما» نمایش داده می‌شود.</p>
            </div>
          </section>

          {/* ═══ بنر هدر (اسلایدر، حداکثر ۳) ═══ */}
          <section className={CARD}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[14.5px] font-bold">بنر هدر فروشگاه</h2>
                <p className="mt-1 text-[12px] text-[#8A8474]">
                  {form.banners.length ? `${toFa(form.banners.length)} از ۳ عکس` : 'حداکثر ۳ عکس (اسلایدی)؛ اگر خالی باشد بنر پیش‌فرض نمایش داده می‌شود'}
                </p>
              </div>
              <button type="button" onClick={() => bannerRef.current?.click()} disabled={busy || form.banners.length >= 3} className={LQ_BTN}>
                {Icon.upload} افزودن بنر
              </button>
              <input ref={bannerRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addImages(e, 'banners')}/>
            </div>
            {form.banners.length === 0 ? (
              <button type="button" onClick={() => bannerRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E7E2D6] py-9 text-[#8A8474] transition-colors hover:border-[#14532D]/40 hover:text-[#14532D]">
                {Icon.upload}<span className="text-[12.5px]">عکس پس‌زمینه‌ی هدر فروشگاه را اضافه کنید</span>
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {form.banners.map((url, i) => (
                  <div key={i} className="relative aspect-[16/7] overflow-hidden rounded-xl border border-[#E7E2D6] bg-[#F7F5F0]">
                    <img src={url} alt="" className="h-full w-full object-cover"/>
                    <button type="button" aria-label="حذف بنر"
                      onClick={() => set('banners', form.banners.filter((_, j) => j !== i))}
                      className="absolute left-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-white/85 text-[#5B564B] backdrop-blur-md transition hover:text-[#B23B2E]">
                      {Icon.trash}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ═══ برندهای نمایندگی ═══ */}
          <section className={CARD}>
            <h2 className="text-[14.5px] font-bold">برندهای نمایندگی</h2>
            <p className="mb-3 mt-1 text-[12px] leading-relaxed text-[#5B564B]">
              اگر نماینده‌ی برند یا برندهایی هستید، اینجا اضافه کنید؛ زیر نام فروشگاه به‌صورت برچسب نمایش داده می‌شوند.
            </p>
            {form.brands.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {form.brands.map((b, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E2D6] bg-[#FAFAF7] px-3 py-1.5 text-[12.5px] font-semibold text-[#5B564B]">
                    {b}
                    <button type="button" aria-label={`حذف ${b}`} onClick={() => set('brands', form.brands.filter((_, j) => j !== i))}
                      className="text-[#A69F8E] transition hover:text-[#B23B2E]">✕</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                className={INPUT} value={brandInput}
                onChange={e => setBrandInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = brandInput.trim(); if (v && !form.brands.includes(v)) { set('brands', [...form.brands, v]); setBrandInput('') } } }}
                placeholder="مثلاً Predator، Mezz، Aramith…"
              />
              <button type="button" onClick={() => { const v = brandInput.trim(); if (v && !form.brands.includes(v)) { set('brands', [...form.brands, v]); setBrandInput('') } }}
                className={LQ_BTN}>افزودن</button>
            </div>
          </section>

          {/* ═══ راه‌های ارتباطی ═══ */}
          <section className={CARD}>
            <h2 className="mb-1 text-[14.5px] font-bold">راه‌های ارتباطی</h2>
            <p className="mb-4 text-[12px] text-[#8A8474]">این‌ها در فوتر فروشگاه دیده می‌شوند.</p>

            <div className="mb-4">
              <span className={LABEL}>تلفن‌های فروشگاه</span>
              <div className="space-y-2">
                {form.phones.map((ph, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className={INPUT} inputMode="tel" value={ph}
                      onChange={e => set('phones', form.phones.map((v, j) => j === i ? e.target.value : v))}
                      placeholder="021-88221100"
                      aria-label={`تلفن ${toFa(i + 1)}`}
                    />
                    {form.phones.length > 1 && (
                      <button type="button" aria-label="حذف تلفن"
                        onClick={() => set('phones', form.phones.filter((_, j) => j !== i))}
                        className="shrink-0 rounded-[10px] border border-[#E7E2D6] px-3 text-[#5B564B] transition hover:text-[#B23B2E]">
                        {Icon.trash}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {form.phones.length < 4 && (
                <button type="button" onClick={() => set('phones', [...form.phones, ''])}
                  className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#9A6E38] transition hover:opacity-70">
                  {Icon.plus} افزودن تلفن
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL} htmlFor="f-wa">واتساپ</label>
                <input id="f-wa" className={INPUT} inputMode="tel" value={form.whatsapp}
                  onChange={e => set('whatsapp', e.target.value)} placeholder="989121234567"/>
                <p className={HINT}>با کد کشور و بدون + — مثل ۹۸۹۱۲۱۲۳۴۵۶۷.</p>
              </div>
              <div>
                <label className={LABEL} htmlFor="f-insta">اینستاگرام</label>
                <input id="f-insta" className={INPUT} dir="ltr" value={form.instagram}
                  onChange={e => set('instagram', e.target.value.replace(/^@/, ''))} placeholder="procue.ir"/>
                <p className={HINT}>فقط آیدی، بدون @.</p>
              </div>
              <div>
                <label className={LABEL} htmlFor="f-hours">ساعت کاری</label>
                <input id="f-hours" className={INPUT} value={form.hours}
                  onChange={e => set('hours', e.target.value)} placeholder="شنبه تا پنج‌شنبه، ۹ تا ۲۰"/>
              </div>
              <div>
                <label className={LABEL} htmlFor="f-addr">آدرس</label>
                <input id="f-addr" className={INPUT} value={form.address}
                  onChange={e => set('address', e.target.value)} placeholder="تهران، خیابان ولیعصر، پلاک ۴۵"/>
                <p className={HINT}>لینک نقشه‌ی فوتر هم از همین ساخته می‌شود.</p>
              </div>
            </div>
          </section>

          {/* ═══ استوری ═══ */}
          <section className={CARD}>
            <h2 className="mb-1 text-[14.5px] font-bold">استوری فروشگاه</h2>
            <p className="mb-4 text-[12px] text-[#8A8474]">
              با کلیک روی لوگوی فروشگاه باز می‌شود، و پس از ذخیره تا ۲۴ ساعت در نوار استوری‌های صفحه‌ی اول سایت هم دیده می‌شود.
            </p>
            <div className="flex flex-wrap items-start gap-4">
              <div className="shrink-0">
                <div className="flex h-28 w-20 items-center justify-center overflow-hidden rounded-xl border border-[#E7E2D6] bg-[#F7F5F0]">
                  {form.storyImage
                    ? <img src={form.storyImage} alt="" className="h-full w-full object-cover"/>
                    : <span className="text-[11px] text-[#A69F8E]">بدون عکس</span>}
                </div>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => storyRef.current?.click()} disabled={busy}
                    className="text-[12px] font-bold text-[#9A6E38] transition hover:opacity-70 disabled:opacity-45">
                    {form.storyImage ? 'تغییر' : 'آپلود'}
                  </button>
                  {form.storyImage && (
                    <button type="button" onClick={() => set('storyImage', '')}
                      className="text-[12px] text-[#5B564B] transition hover:text-[#B23B2E]">حذف</button>
                  )}
                </div>
                <input ref={storyRef} type="file" accept="image/*" className="hidden"
                  onChange={e => pickImage(e, url => set('storyImage', url))}/>
              </div>
              <div className="min-w-[200px] flex-1">
                <label className={LABEL} htmlFor="f-story">متن استوری</label>
                <textarea id="f-story" rows={4} className={`${INPUT} resize-y leading-relaxed`} value={form.storyText}
                  onChange={e => set('storyText', e.target.value)}
                  placeholder="جدیدترین کالکشن چوب‌های کربنی رسید — همین حالا ببینید!"/>
              </div>
            </div>
          </section>

          {/* ═══ عکس‌های «درباره ما» (اسلایدر، حداکثر ۳) ═══ */}
          <section className={CARD}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[14.5px] font-bold">عکس‌های «درباره ما»</h2>
                <p className="mt-1 text-[12px] text-[#8A8474]">
                  {form.aboutImages.length > 0
                    ? `${toFa(form.aboutImages.length)} از ۳ عکس`
                    : 'حداکثر ۳ عکس (اسلایدی) — کنار متنِ «درباره ما» پایین صفحه نمایش داده می‌شوند'}
                </p>
              </div>
              <button type="button" onClick={() => aboutRef.current?.click()}
                disabled={busy || form.aboutImages.length >= 3} className={LQ_BTN}>
                {Icon.upload} افزودن عکس
              </button>
              <input ref={aboutRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addImages(e, 'aboutImages')}/>
            </div>

            {form.aboutImages.length === 0 ? (
              <button type="button" onClick={() => aboutRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E7E2D6] py-10 text-[#8A8474] transition-colors hover:border-[#14532D]/40 hover:text-[#14532D]">
                {Icon.upload}
                <span className="text-[12.5px]">هنوز عکسی اضافه نشده</span>
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {form.aboutImages.map((url, i) => (
                  <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#E7E2D6] bg-[#F7F5F0]">
                    <img src={url} alt="" className="h-full w-full object-cover"/>
                    <button type="button" aria-label="حذف عکس"
                      onClick={() => set('aboutImages', form.aboutImages.filter((_, j) => j !== i))}
                      className="absolute left-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-white/85 text-[#5B564B] backdrop-blur-md transition hover:text-[#B23B2E]">
                      {Icon.trash}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ═══ محصولات — جای دیگری مدیریت می‌شوند ═══ */}
          <section className={CARD}>
            <h2 className="text-[14.5px] font-bold">محصولات</h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[#5B564B]">
              محصولات، قیمت‌ها و تخفیف‌ها در «فروشگاه من» مدیریت می‌شوند و همان‌ها روی صفحه‌ی فروشگاه می‌آیند.
            </p>
            <Link href="/dashboard/shop" className={`${LQ_BTN} mt-3`}>{Icon.back} مدیریت محصولات</Link>
          </section>

          {/* ═══ جواز کسب (اجباری) ═══ */}
          <section className={CARD}>
            <h2 className="text-[14.5px] font-bold">جواز کسب <span className="text-[#B23B2E]">*</span></h2>
            <p className="mb-4 mt-1 text-[12.5px] leading-relaxed text-[#5B564B]">
              برای انتشار فروشگاه، آپلود جواز کسب الزامی است. بدون آن، اطلاعات فروشگاه ثبت نمی‌شود.
            </p>
            {form.certificate ? (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E7E2D6] bg-[#FAFAF7] p-3">
                {form.certificate.url.startsWith('data:image')
                  ? <img src={form.certificate.url} alt="" className="h-16 w-16 shrink-0 rounded-lg border border-[#E7E2D6] object-cover"/>
                  : <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-[#E7E2D6] bg-white text-[#9A6E38]">{Icon.doc}</span>}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#14532D]">
                    <span className="text-[#057642]">{Icon.check}</span> جواز کسب آپلود شد
                  </div>
                  <div className="mt-0.5 truncate text-[11.5px] text-[#8A8474]" dir="ltr">{form.certificate.name}</div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => certRef.current?.click()} disabled={busy} className={LQ_BTN}>تغییر فایل</button>
                  <button type="button" onClick={() => set('certificate', null)}
                    className="rounded-[10px] border border-[#E7E2D6] px-3 py-2.5 text-[12.5px] text-[#5B564B] transition hover:text-[#B23B2E]">حذف</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => certRef.current?.click()} disabled={busy}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E7E2D6] py-10 text-[#8A8474] transition-colors hover:border-[#14532D]/40 hover:text-[#14532D]">
                {Icon.upload}
                <span className="text-[12.5px]">جواز کسب را آپلود کنید (عکس یا PDF)</span>
              </button>
            )}
            <input ref={certRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={pickCertificate}/>
          </section>

          {/* ═══ ذخیره ═══ */}
          <div className="sticky bottom-0 -mx-4 border-t border-[#E7E2D6] bg-[#F7F5F0]/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
            <div className="flex flex-wrap items-center justify-end gap-3">
              {err   && <p className="me-auto text-[12.5px] font-semibold text-[#B23B2E]">{err}</p>}
              {saved && !err && <p className="me-auto text-[12.5px] font-semibold text-[#14532D]">ذخیره و منتشر شد ✓ — در صفحه‌ی «فروشگاه‌ها» نمایش داده می‌شود</p>}
              {/* دکمه به طرح LQ (طلایی) */}
              <button type="submit" disabled={busy}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] px-6 py-2.5 text-[13.5px] font-bold text-[#9A6E38] transition hover:-translate-y-0.5 hover:bg-[rgba(199,166,106,0.18)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0">
                ذخیره‌ی تغییرات
              </button>
            </div>
          </div>
        </form>

        {/* هشدارِ بدونِ جواز کسب */}
        {warn && (
          <div onClick={() => setWarn(false)} role="presentation"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-5 backdrop-blur-sm">
            <div onClick={e => e.stopPropagation()} className="w-full max-w-[420px] rounded-2xl border border-[#E7E2D6] bg-white p-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(180,60,46,0.10)] text-[#B23B2E]">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
              </div>
              <h3 className="text-[16px] font-bold">جواز کسب آپلود نشده</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#5B564B]">
                بدون آپلود جواز کسب، اطلاعات فروشگاه شما ثبت و منتشر نمی‌شود. لطفاً ابتدا جواز کسب را آپلود کنید.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <button onClick={() => { setWarn(false); certRef.current?.click() }} className={LQ_BTN}>{Icon.upload} آپلود جواز کسب</button>
                <button onClick={() => setWarn(false)}
                  className="rounded-[10px] border border-[#E7E2D6] px-4 py-2.5 text-[13px] text-[#5B564B] transition hover:text-[#1C1B17]">انصراف</button>
              </div>
            </div>
          </div>
        )}

        <button onClick={() => router.push('/dashboard')}
          className="mt-6 text-[12.5px] text-[#8A8474] transition hover:text-[#14532D]">
          ← بازگشت به داشبورد
        </button>
      </div>
    </div>
  )
}

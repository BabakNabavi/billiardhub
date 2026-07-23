'use client'

/* ─────────────────────────────────────────────────────────────
   پنل تولیدکننده — تکمیلِ پروفایلِ کارخانه/برند.
   هرچه این‌جا ذخیره شود، همان در /manufacturers (دایرکتوری) و
   /manufacturers/<slug> (صفحه‌ی تولیدکننده) نمایش داده می‌شود.
   مالکیت با user.id — همان الگوی بقیه‌ی پنل‌ها.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '../../../store/auth.store'
import ProvinceCitySelect from '../../../components/ProvinceCitySelect'
import { compressImage } from '../../../lib/seller-store'
import type { MfrProduct } from '../../../lib/manufacturers-data'
import {
  emptyManufacturerProfile, findManufacturerByOwner, newManufacturerSlug,
  saveManufacturerProfile, type ManufacturerProfile,
} from '../../../lib/manufacturer-store'
import { Plus, Trash2, Images, Factory, ArrowLeft } from 'lucide-react'

const CARD   = 'rounded-2xl border border-[#E7E2D6] bg-white p-5 shadow-[0_2px_10px_rgba(28,27,23,0.05)]'
const LQ_BTN = 'inline-flex items-center gap-2 rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] px-4 py-2.5 text-[13px] font-bold text-[#9A6E38] transition hover:-translate-y-0.5'
const INPUT  = 'w-full rounded-xl border border-[#E7E2D6] bg-[#FAFAF7] px-3.5 py-2.5 text-[13.5px] text-[#1C1B17] outline-none transition focus:border-[#C7A66A] placeholder:text-[11.5px] placeholder:text-[#A69F8E]'
const LABEL  = 'mb-1.5 block text-[12.5px] font-bold text-[#5B564B]'
const rid = () => Math.random().toString(36).slice(2, 9)

export default function ManufacturerDashboard() {
  const { user, _hydrated } = useAuthStore()

  const [form, setForm]     = useState<ManufacturerProfile>(() => emptyManufacturerProfile('draft'))
  const [specInput, setSpecInput] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [err, setErr]       = useState('')
  const [busy, setBusy]     = useState(false)

  const bannerRef = useRef<HTMLInputElement>(null)
  const prodImgRef = useRef<HTMLInputElement>(null)
  const [prod, setProd] = useState({ name: '', category: '', description: '', image: '' })
  const [cert, setCert] = useState({ title: '', issuer: '', year: '' })

  const isManufacturer = !!user && [user.primaryRole, ...(user.secondaryRoles ?? [])].includes('manufacturer')

  useEffect(() => {
    if (!_hydrated) return
    if (user) {
      const mine = findManufacturerByOwner(user)
      setForm(mine ?? emptyManufacturerProfile(newManufacturerSlug(), user.id, user.phone ?? ''))
    }
    setLoaded(true)
  }, [_hydrated, user?.id])

  const set = <K extends keyof ManufacturerProfile>(k: K, v: ManufacturerProfile[K]) => {
    setForm(f => ({ ...f, [k]: v })); setSaved(false); setErr('')
  }

  const addSpec = () => {
    const v = specInput.trim()
    if (!v || form.specialties.includes(v)) { setSpecInput(''); return }
    set('specialties', [...form.specialties, v]); setSpecInput('')
  }

  const pickBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setBusy(true)
    try { set('bannerImage', await compressImage(f, 1600, 0.72)) }
    catch { setErr('عکس خوانده نشد.') }
    finally { setBusy(false); e.target.value = '' }
  }

  const pickProdImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setBusy(true)
    try { const url = await compressImage(f, 1000, 0.7); setProd(p => ({ ...p, image: url })) }
    catch { setErr('عکس خوانده نشد.') }
    finally { setBusy(false); e.target.value = '' }
  }

  const addProduct = () => {
    if (!prod.name.trim() || !prod.category.trim()) { setErr('نام و دسته‌ی محصول لازم است.'); return }
    const p: MfrProduct = {
      id: rid(), name: prod.name.trim(), category: prod.category.trim(),
      description: prod.description.trim(), specs: [],
      image: prod.image || '/images/shop/Pro_table.jpg',
    }
    set('products', [...form.products, p])
    setProd({ name: '', category: '', description: '', image: '' })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim())        { setErr('نام کارخانه/برند لازم است.'); return }
    if (!form.city)               { setErr('شهر را انتخاب کنید.'); return }
    if (!form.description.trim()) { setErr('توضیح کوتاه لازم است.'); return }
    if (!form.phone.trim())       { setErr('شماره تماس لازم است.'); return }
    try {
      saveManufacturerProfile({
        ...form,
        ownerId: user?.id || form.ownerId,
        ownerPhone: user?.phone || form.ownerPhone,
        status: 'approved',
      })
      setSaved(true); setErr('')
    } catch {
      setErr('حافظه‌ی مرورگر پر است — چند عکس محصول را حذف کنید و دوباره ذخیره کنید.')
    }
  }

  if (!_hydrated || !loaded) return null

  if (!isManufacturer) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#F7F5F0] p-6 text-center font-[Vazirmatn,Tahoma,sans-serif]">
        <div className={`${CARD} max-w-[420px]`}>
          <Factory size={26} className="mx-auto mb-3 text-[#8A8474]" />
          <h1 className="text-[16px] font-bold">این صفحه مخصوص تولیدکنندگان است</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#5B564B]">برای ساختن پروفایل، اول باید نقش «تولیدکننده» را بگیرید.</p>
          <Link href="/profile/role" className={`${LQ_BTN} mt-4`}>انتخاب نقش</Link>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F5F0] pb-24 text-[#1C1B17] font-[Vazirmatn,Tahoma,sans-serif]">
      <div className="mx-auto max-w-[900px] px-4 pt-6 sm:px-6">

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[19px] font-bold">پنل تولیدکننده</h1>
            <p className="mt-1 text-[12.5px] text-[#8A8474]">هرچه این‌جا وارد کنید، همان در بخش «تولیدکنندگان» سایت دیده می‌شود.</p>
          </div>
          <Link href={`/manufacturers/${form.slug}`} className={LQ_BTN}>
            <ArrowLeft size={14} /> مشاهده‌ی پروفایل
          </Link>
        </div>

        <form onSubmit={submit} className="space-y-5">

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
                    <img src={form.bannerImage} alt="" className="h-14 w-24 rounded-lg border border-[#E7E2D6] object-cover" />
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
              <div className="sm:col-span-2">
                <ProvinceCitySelect
                  value={{ province: form.province, city: form.city }}
                  onChange={v => { set('province', v.province); set('city', v.city) }}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>تخصص‌ها (روی کارت نمایش داده می‌شود)</label>
                <div className="flex gap-2">
                  <input className={INPUT} value={specInput} onChange={e => setSpecInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSpec() } }} placeholder="مثال: میز اسنوکر + Enter" />
                  <button type="button" onClick={addSpec} className={LQ_BTN}><Plus size={14} /></button>
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
            <p className="mb-4 text-[12px] text-[#8A8474]">در صفحه‌ی تولیدکننده نمایش داده می‌شوند.</p>
            {form.certificates.length > 0 && (
              <div className="mb-4 space-y-2">
                {form.certificates.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-[#EFEBE1] bg-[#FAFAF7] px-3 py-2.5">
                    <span className="flex-1 text-[13px] font-bold">{c.title}</span>
                    <span className="text-[11.5px] text-[#8A8474]">{c.issuer}</span>
                    <span className="text-[11.5px] text-[#8A8474]">{c.year}</span>
                    <button type="button" onClick={() => set('certificates', form.certificates.filter((_, x) => x !== i))}
                      className="rounded-lg p-1.5 text-[#B23B2E] transition hover:bg-[rgba(178,59,46,0.08)]"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-[#D8D2C4] p-4 sm:flex-row">
              <input className={INPUT} value={cert.title} onChange={e => setCert(c => ({ ...c, title: e.target.value }))} placeholder="عنوان — مثال: ISO 9001" />
              <input className={INPUT} value={cert.issuer} onChange={e => setCert(c => ({ ...c, issuer: e.target.value }))} placeholder="صادرکننده" />
              <input className={`${INPUT} sm:w-28`} value={cert.year} onChange={e => setCert(c => ({ ...c, year: e.target.value }))} placeholder="سال" />
              <button type="button" className={`${LQ_BTN} shrink-0`}
                onClick={() => {
                  if (!cert.title.trim()) { setErr('عنوان گواهینامه لازم است.'); return }
                  set('certificates', [...form.certificates, { title: cert.title.trim(), issuer: cert.issuer.trim(), year: cert.year.trim() }])
                  setCert({ title: '', issuer: '', year: '' })
                }}>
                <Plus size={14} /> افزودن
              </button>
            </div>
          </section>

          {/* ═══ راه‌های ارتباطی ═══ */}
          <section className={CARD}>
            <h2 className="mb-4 text-[14.5px] font-bold">راه‌های ارتباطی</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL}>شماره تماس *</label>
                <input className={INPUT} dir="ltr" style={{ textAlign: 'right' }} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="09xxxxxxxxx" />
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
              <div className="sm:col-span-2">
                <label className={LABEL}>ساعات کاری</label>
                <input className={INPUT} value={form.hours} onChange={e => set('hours', e.target.value)} placeholder="مثال: شنبه تا پنجشنبه، ۸ تا ۱۷" />
              </div>
            </div>
          </section>

          {/* ═══ محصولات ═══ */}
          <section className={CARD}>
            <h2 className="mb-1 text-[14.5px] font-bold">محصولات</h2>
            <p className="mb-4 text-[12px] text-[#8A8474]">در صفحه‌ی تولیدکننده به‌صورت گالریِ محصولات نمایش داده می‌شود.</p>

            {form.products.length > 0 && (
              <div className="mb-4 space-y-2">
                {form.products.map(p => (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl border border-[#EFEBE1] bg-[#FAFAF7] p-2.5">
                    <img src={p.image} alt="" className="h-12 w-16 rounded-lg border border-[#E7E2D6] object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold">{p.name}</div>
                      <div className="text-[11px] text-[#8A8474]">{p.category}</div>
                    </div>
                    <button type="button" onClick={() => set('products', form.products.filter(x => x.id !== p.id))}
                      className="rounded-lg p-2 text-[#B23B2E] transition hover:bg-[rgba(178,59,46,0.08)]"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 rounded-xl border border-dashed border-[#D8D2C4] p-4 sm:grid-cols-2">
              <input className={INPUT} value={prod.name} onChange={e => setProd(p => ({ ...p, name: e.target.value }))} placeholder="نام محصول — مثال: میز اسنوکر ۱۲ فوت" />
              <input className={INPUT} value={prod.category} onChange={e => setProd(p => ({ ...p, category: e.target.value }))} placeholder="دسته — مثال: میز اسنوکر" />
              <input className={`${INPUT} sm:col-span-2`} value={prod.description} onChange={e => setProd(p => ({ ...p, description: e.target.value }))} placeholder="توضیح کوتاه محصول…" />
              <div className="flex items-center gap-3 sm:col-span-2">
                <input ref={prodImgRef} type="file" accept="image/*" className="hidden" onChange={pickProdImage} />
                <button type="button" onClick={() => prodImgRef.current?.click()} className={LQ_BTN} disabled={busy}>
                  <Images size={14} /> {prod.image ? 'تغییر عکس' : 'عکس محصول'}
                </button>
                {prod.image && <img src={prod.image} alt="" className="h-11 w-16 rounded-lg border border-[#E7E2D6] object-cover" />}
                <button type="button" onClick={addProduct} className={`${LQ_BTN} mr-auto`} disabled={busy}><Plus size={14} /> افزودن محصول</button>
              </div>
            </div>
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

'use client'

/* ─────────────────────────────────────────────────────────────
   پنل متخصص خدمات فنی — تکمیلِ پروفایلِ حرفه‌ای.
   هرچه این‌جا ذخیره شود، همان در /services (دایرکتوری) و
   /services/<slug> (پروفایل عمومی) نمایش داده می‌شود.
   مالکیت با user.id — همان الگوی پنل فروشگاه/مربی/داور.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '../../../store/auth.store'
import ProvinceCitySelect from '../../../components/ProvinceCitySelect'
import { compressImage } from '../../../lib/seller-store'
import { TECH_SERVICES, type TechService, type TechProject, type TechAlbum } from '../../../lib/technicians-data'
import {
  emptyTechnicianProfile, findTechnicianByOwner, newTechnicianSlug,
  saveTechnicianProfile, type TechnicianProfile,
} from '../../../lib/technician-store'
import { Plus, Trash2, Images, Wrench, ArrowLeft, Check } from 'lucide-react'

const GOLD_D = '#9A6E38'
const TEXT   = '#1C1B17'
const SEC    = '#5B564B'
const MUT    = '#8A8474'
const LINE   = '#E7E2D6'

const CARD   = 'rounded-2xl border border-[#E7E2D6] bg-white p-5 shadow-[0_2px_10px_rgba(28,27,23,0.05)]'
const LQ_BTN = 'inline-flex items-center gap-2 rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] px-4 py-2.5 text-[13px] font-bold text-[#9A6E38] transition hover:-translate-y-0.5'
const INPUT  = 'w-full rounded-xl border border-[#E7E2D6] bg-[#FAFAF7] px-3.5 py-2.5 text-[13.5px] text-[#1C1B17] outline-none transition focus:border-[#C7A66A] placeholder:text-[11.5px] placeholder:text-[#A69F8E]'
const rid = () => Math.random().toString(36).slice(2, 9)

export default function TechnicianDashboard() {
  const { user, _hydrated } = useAuthStore()

  const [form, setForm]     = useState<TechnicianProfile>(() => emptyTechnicianProfile('draft'))
  const [aboutText, setAboutText] = useState('')
  const [covInput, setCovInput]   = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [err, setErr]       = useState('')
  const [busy, setBusy]     = useState(false)

  /* فرمِ پروژه‌ی جدید */
  const [prj, setPrj] = useState({ title: '', desc: '', city: '', club: '', service: '' as TechService | '', image: '' })
  const prjImgRef = useRef<HTMLInputElement>(null)
  const photoRef  = useRef<HTMLInputElement>(null)
  /* آلبومِ جدید */
  const [albTitle, setAlbTitle] = useState('')
  const [albDesc, setAlbDesc]   = useState('')
  const albImgRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const isTechnician = !!user && [user.primaryRole, ...(user.secondaryRoles ?? [])].includes('technician')

  useEffect(() => {
    if (!_hydrated) return
    if (user) {
      const mine = findTechnicianByOwner(user)
      const authName = [user.firstName, user.lastName].filter(Boolean).join(' ')
      const base = mine ?? { ...emptyTechnicianProfile(newTechnicianSlug(), user.id, user.phone ?? ''), name: authName }
      setForm(base)
      setAboutText(base.about.join('\n\n'))
    }
    setLoaded(true)
  }, [_hydrated, user?.id])

  const set = <K extends keyof TechnicianProfile>(k: K, v: TechnicianProfile[K]) => {
    setForm(f => ({ ...f, [k]: v })); setSaved(false); setErr('')
  }

  const toggleService = (s: TechService) =>
    set('services', form.services.includes(s) ? form.services.filter(x => x !== s) : [...form.services, s])

  const addCoverage = () => {
    const v = covInput.trim()
    if (!v || form.coverage.includes(v)) { setCovInput(''); return }
    set('coverage', [...form.coverage, v]); setCovInput('')
  }

  /* ── پروژه‌ها ── */
  const pickPrjImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true)
    try { setPrj(p => ({ ...p, image: '' })); const url = await compressImage(file, 1200, 0.7); setPrj(p => ({ ...p, image: url })) }
    catch { setErr('عکس خوانده نشد.') }
    finally { setBusy(false); e.target.value = '' }
  }
  const addProject = () => {
    if (!prj.title.trim() || !prj.service) { setErr('عنوان و نوعِ خدماتِ پروژه لازم است.'); return }
    const p: TechProject = {
      id: rid(), title: prj.title.trim(), desc: prj.desc.trim(),
      city: prj.city.trim() || form.city, club: prj.club.trim() || undefined,
      service: prj.service as TechService,
      image: prj.image || '/images/services/repaire.jfif',
    }
    set('projects', [...form.projects, p])
    setPrj({ title: '', desc: '', city: '', club: '', service: '', image: '' })
  }

  /* ── آلبوم‌ها ── */
  const addAlbum = () => {
    if (!albTitle.trim()) { setErr('نام آلبوم لازم است.'); return }
    const a: TechAlbum = { id: rid(), title: albTitle.trim(), desc: albDesc.trim(), photos: [] }
    set('albums', [...form.albums, a]); setAlbTitle(''); setAlbDesc('')
  }
  const addAlbumPhotos = async (albumId: string, files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    try {
      const urls = await Promise.all(Array.from(files).slice(0, 8).map(f => compressImage(f, 1200, 0.68)))
      set('albums', form.albums.map(a => a.id === albumId ? { ...a, photos: [...a.photos, ...urls] } : a))
    } catch { setErr('آپلود نشد. دوباره تلاش کنید.') }
    finally { setBusy(false) }
  }
  const removeAlbumPhoto = (albumId: string, idx: number) =>
    set('albums', form.albums.map(a => a.id === albumId ? { ...a, photos: a.photos.filter((_, i) => i !== idx) } : a))

  /* ── ذخیره = انتشار ── */
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim())  { setErr('نام و نام‌خانوادگی لازم است.'); return }
    if (!form.title.trim()) { setErr('عنوان تخصصی لازم است.'); return }
    if (!form.city)         { setErr('شهر را انتخاب کنید.'); return }
    if (!form.services.length) { setErr('حداقل یک نوع خدمات را انتخاب کنید.'); return }
    if (!form.phone.trim()) { setErr('شماره تماس لازم است.'); return }
    try {
      saveTechnicianProfile({
        ...form,
        ownerId: user?.id || form.ownerId,
        ownerPhone: user?.phone || form.ownerPhone,
        about: aboutText.split(/\n{2,}/).map(s => s.trim()).filter(Boolean),
        coverage: form.coverage.length ? form.coverage : [form.city],
        status: 'approved',
      })
      setSaved(true); setErr('')
    } catch {
      setErr('حافظه‌ی مرورگر پر است — چند عکس از آلبوم‌ها حذف کنید و دوباره ذخیره کنید.')
    }
  }

  if (!_hydrated || !loaded) return null

  if (!isTechnician) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#F7F5F0] p-6 text-center font-[Vazirmatn,Tahoma,sans-serif]">
        <div className={`${CARD} max-w-[420px]`}>
          <Wrench size={26} className="mx-auto mb-3 text-[#8A8474]" />
          <h1 className="text-[16px] font-bold">این صفحه مخصوص متخصصان خدمات فنی است</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#5B564B]">برای ساختن پروفایل، اول باید نقش «خدمات فنی» را بگیرید.</p>
          <Link href="/profile/role" className={`${LQ_BTN} mt-4`}>انتخاب نقش</Link>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F5F0] pb-24 text-[#1C1B17] font-[Vazirmatn,Tahoma,sans-serif]">
      <div className="mx-auto max-w-[900px] px-4 pt-6 sm:px-6">

        {/* سربرگ */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[19px] font-bold">پنل متخصص خدمات فنی</h1>
            <p className="mt-1 text-[12.5px] text-[#8A8474]">هرچه این‌جا وارد کنید، همان در دایرکتوری و پروفایل عمومی شما دیده می‌شود.</p>
          </div>
          <Link href={`/services/${form.slug}`} className={LQ_BTN}>
            <ArrowLeft size={14} /> مشاهده‌ی پروفایل
          </Link>
        </div>

        <form onSubmit={submit} className="space-y-5">

          {/* ═══ هویت حرفه‌ای ═══ */}
          <section className={CARD}>
            <h2 className="mb-4 text-[14.5px] font-bold">هویت حرفه‌ای</h2>

            {/* عکس پروفایل */}
            <div className="mb-5 flex items-center gap-4">
              <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-full border-2 border-[rgba(199,166,106,0.45)] bg-gradient-to-bl from-[#FFFDF9] to-[#F5EFE4] shadow-[0_8px_22px_rgba(154,110,56,0.16)]">
                {form.photo
                  ? <img src={form.photo} alt="" className="h-full w-full object-cover" />
                  : <span className="flex h-full w-full items-center justify-center text-[30px] font-black text-[#9A6E38]">{(form.name || 'م').slice(0, 1)}</span>}
              </div>
              <div className="flex flex-col gap-2">
                <input ref={photoRef} type="file" accept="image/*" className="hidden"
                  onChange={async e => {
                    const f = e.target.files?.[0]; if (!f) return
                    setBusy(true)
                    try { set('photo', await compressImage(f, 480, 0.82)) }
                    catch { setErr('عکس خوانده نشد.') }
                    finally { setBusy(false); e.target.value = '' }
                  }} />
                <button type="button" onClick={() => photoRef.current?.click()} className={LQ_BTN} disabled={busy}>
                  <Images size={14} /> {form.photo ? 'تغییر عکس پروفایل' : 'آپلود عکس پروفایل'}
                </button>
                {form.photo && (
                  <button type="button" onClick={() => set('photo', '')} className="text-right text-[11.5px] font-bold text-[#B23B2E]">حذف عکس</button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-bold text-[#5B564B]">نام و نام‌خانوادگی *</label>
                <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="مثال: مهدی کرمی" />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-bold text-[#5B564B]">عنوان تخصصی *</label>
                <input className={INPUT} value={form.title} onChange={e => set('title', e.target.value)} placeholder="مثال: متخصص پارچه و رگلاژ" />
              </div>
              <div className="sm:col-span-2">
                <ProvinceCitySelect
                  value={{ province: form.province, city: form.city }}
                  onChange={v => { set('province', v.province); set('city', v.city) }}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-bold text-[#5B564B]">باشگاه / مجموعه‌ی همکار</label>
                <input className={INPUT} value={form.club} onChange={e => set('club', e.target.value)} placeholder="مثال: باشگاه پلاتینیوم" />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-bold text-[#5B564B]">شهرهای تحت پوشش</label>
                <div className="flex gap-2">
                  <input className={INPUT} value={covInput} onChange={e => setCovInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCoverage() } }} placeholder="نام شهر + Enter" />
                  <button type="button" onClick={addCoverage} className={LQ_BTN}><Plus size={14} /></button>
                </div>
                {form.coverage.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {form.coverage.map(c => (
                      <span key={c} className="inline-flex items-center gap-1 rounded-full border border-[#E7E2D6] bg-[#FAFAF7] px-2.5 py-1 text-[11.5px] font-semibold text-[#5B564B]">
                        {c}
                        <button type="button" onClick={() => set('coverage', form.coverage.filter(x => x !== c))} className="text-[#B23B2E]">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[12.5px] font-bold text-[#5B564B]">معرفی یک‌خطی *</label>
                <input className={INPUT} value={form.intro} onChange={e => set('intro', e.target.value)} placeholder="مثال: پارچه‌کشی مسابقه‌ای و رگلاژ میلی‌متری…" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[12.5px] font-bold text-[#5B564B]">درباره من <span className="font-normal text-[#A69F8E]">— هر پاراگراف با یک خط خالی جدا شود</span></label>
                <textarea className={`${INPUT} min-h-[110px] leading-7`} value={aboutText} onChange={e => { setAboutText(e.target.value); setSaved(false) }} placeholder="سابقه، زمینه‌ی تخصص و نوع خدمات…" />
              </div>
            </div>
          </section>

          {/* ═══ خدمات ═══ */}
          <section className={CARD}>
            <h2 className="mb-4 text-[14.5px] font-bold">خدمات من *</h2>
            <div className="flex flex-wrap gap-2">
              {TECH_SERVICES.map(s => {
                const on = form.services.includes(s)
                return (
                  <button key={s} type="button" onClick={() => toggleService(s)}
                    className={`inline-flex items-center gap-1.5 rounded-[10px] border px-3.5 py-2 text-[12.5px] font-bold transition ${on ? 'border-[rgba(199,166,106,0.4)] bg-[rgba(199,166,106,0.13)] text-[#9A6E38]' : 'border-[#E7E2D6] bg-white text-[#5B564B] hover:border-[rgba(199,166,106,0.4)]'}`}>
                    {on && <Check size={13} />}{s}
                  </button>
                )
              })}
            </div>
          </section>

          {/* ═══ تماس ═══ */}
          <section className={CARD}>
            <h2 className="mb-4 text-[14.5px] font-bold">راه‌های ارتباطی</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-bold text-[#5B564B]">شماره تماس *</label>
                <input className={INPUT} dir="ltr" style={{ textAlign: 'right' }} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="09xxxxxxxxx" />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-bold text-[#5B564B]">واتساپ</label>
                <input className={INPUT} dir="ltr" style={{ textAlign: 'right' }} value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="989xxxxxxxxx" />
              </div>
            </div>
          </section>

          {/* ═══ پروژه‌ها ═══ */}
          <section className={CARD}>
            <h2 className="mb-1 text-[14.5px] font-bold">پروژه‌ها و کارهای انجام‌شده</h2>
            <p className="mb-4 text-[12px] text-[#8A8474]">به‌شکل پرتفولیو در پروفایل شما نمایش داده می‌شود.</p>

            {form.projects.length > 0 && (
              <div className="mb-4 space-y-2">
                {form.projects.map(p => (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl border border-[#EFEBE1] bg-[#FAFAF7] p-2.5">
                    <img src={p.image} alt="" className="h-12 w-16 rounded-lg border border-[#E7E2D6] object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold">{p.title}</div>
                      <div className="text-[11px] text-[#8A8474]">{p.service} · {p.city}{p.club ? ` — ${p.club}` : ''}</div>
                    </div>
                    <button type="button" onClick={() => set('projects', form.projects.filter(x => x.id !== p.id))}
                      className="rounded-lg p-2 text-[#B23B2E] transition hover:bg-[rgba(178,59,46,0.08)]"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 rounded-xl border border-dashed border-[#D8D2C4] p-4 sm:grid-cols-2">
              <input className={INPUT} value={prj.title} onChange={e => setPrj(p => ({ ...p, title: e.target.value }))} placeholder="عنوان پروژه — مثال: بازسازی میز اسنوکر" />
              <select className={INPUT} value={prj.service} onChange={e => setPrj(p => ({ ...p, service: e.target.value as TechService }))}>
                <option value="">نوع خدمات…</option>
                {TECH_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input className={INPUT} value={prj.city} onChange={e => setPrj(p => ({ ...p, city: e.target.value }))} placeholder={`شهر (پیش‌فرض: ${form.city || '—'})`} />
              <input className={INPUT} value={prj.club} onChange={e => setPrj(p => ({ ...p, club: e.target.value }))} placeholder="باشگاه / محل انجام (اگر بود)" />
              <input className={`${INPUT} sm:col-span-2`} value={prj.desc} onChange={e => setPrj(p => ({ ...p, desc: e.target.value }))} placeholder="توضیح کوتاه پروژه…" />
              <div className="flex items-center gap-3 sm:col-span-2">
                <input ref={prjImgRef} type="file" accept="image/*" className="hidden" onChange={pickPrjImage} />
                <button type="button" onClick={() => prjImgRef.current?.click()} className={LQ_BTN}><Images size={14} /> {prj.image ? 'تغییر عکس' : 'عکس پروژه'}</button>
                {prj.image && <img src={prj.image} alt="" className="h-11 w-16 rounded-lg border border-[#E7E2D6] object-cover" />}
                <button type="button" onClick={addProject} className={`${LQ_BTN} mr-auto`} disabled={busy}><Plus size={14} /> افزودن پروژه</button>
              </div>
            </div>
          </section>

          {/* ═══ گالری / آلبوم‌ها ═══ */}
          <section className={CARD}>
            <h2 className="mb-1 text-[14.5px] font-bold">گالری تصاویر — آلبوم‌ها</h2>
            <p className="mb-4 text-[12px] text-[#8A8474]">آلبوم بسازید (مثلاً «پروژه‌های کرمان») و عکس‌های هر آلبوم را اضافه کنید.</p>

            {form.albums.map(a => (
              <div key={a.id} className="mb-3 rounded-xl border border-[#EFEBE1] bg-[#FAFAF7] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[13px] font-bold">{a.title}</div>
                    {a.desc && <div className="text-[11px] text-[#8A8474]">{a.desc}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <input ref={el => { albImgRefs.current[a.id] = el }} type="file" accept="image/*" multiple className="hidden"
                      onChange={e => { addAlbumPhotos(a.id, e.target.files); e.target.value = '' }} />
                    <button type="button" onClick={() => albImgRefs.current[a.id]?.click()} className={LQ_BTN} disabled={busy}>
                      <Plus size={13} /> عکس
                    </button>
                    <button type="button" onClick={() => set('albums', form.albums.filter(x => x.id !== a.id))}
                      className="rounded-lg p-2 text-[#B23B2E] transition hover:bg-[rgba(178,59,46,0.08)]"><Trash2 size={15} /></button>
                  </div>
                </div>
                {a.photos.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {a.photos.map((ph, i) => (
                      <span key={i} className="relative">
                        <img src={ph} alt="" className="h-16 w-24 rounded-lg border border-[#E7E2D6] object-cover" />
                        <button type="button" onClick={() => removeAlbumPhoto(a.id, i)}
                          className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#B23B2E] text-[11px] text-white">×</button>
                      </span>
                    ))}
                  </div>
                ) : <p className="text-[11.5px] text-[#A69F8E]">هنوز عکسی ندارد.</p>}
              </div>
            ))}

            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-[#D8D2C4] p-4 sm:flex-row">
              <input className={INPUT} value={albTitle} onChange={e => setAlbTitle(e.target.value)} placeholder="نام آلبوم — مثال: پروژه‌های کرمان" />
              <input className={INPUT} value={albDesc} onChange={e => setAlbDesc(e.target.value)} placeholder="توضیح کوتاه (اختیاری نمایش داده می‌شود)" />
              <button type="button" onClick={addAlbum} className={`${LQ_BTN} shrink-0`}><Plus size={14} /> ساخت آلبوم</button>
            </div>
          </section>

          {/* ═══ ذخیره ═══ */}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className={`${LQ_BTN} px-7 py-3 text-[14px]`} disabled={busy}>
              ذخیره و انتشار پروفایل
            </button>
            {saved && <span className="text-[12.5px] font-bold text-[#0E7A38]">ذخیره و منتشر شد ✓ — در «خدمات فنی» نمایش داده می‌شود.</span>}
            {err && <span className="text-[12.5px] font-bold text-[#B23B2E]">{err}</span>}
          </div>
        </form>
      </div>
    </div>
  )
}

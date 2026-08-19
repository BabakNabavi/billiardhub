'use client'

/* ─────────────────────────────────────────────────────────────
   پنل متخصص خدمات فنی — تکمیل پروفایل حرفه‌ای.
   هرچه این‌جا ذخیره شود، همان در /services (دایرکتوری) و
   /services/<slug> (پروفایل عمومی) نمایش داده می‌شود.
   مالکیت با user.id — همان الگوی پنل فروشگاه/مربی/داور.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'
import Select from '../../../components/ui/Select'
import Link from 'next/link'
import { useAuthStore } from '../../../store/auth.store'
import ProvinceCitySelect from '../../../components/ProvinceCitySelect'
import CoverageCitySelect from '../../../components/CoverageCitySelect'
import ProfileSlugField from '../../../components/ProfileSlugField'
import ClubPicker from '../../../components/ClubPicker'
import { compressImage } from '../../../lib/seller-store'
import { TECH_SERVICES, normalizeTechMedia, type TechService, type TechProject } from '../../../lib/technicians-data'
import {
  emptyTechnicianProfile, findTechnicianByOwner, newTechnicianSlug,
  saveTechnicianProfile, type TechnicianProfile,
  // (منبع حقیقت از این پس سرور است؛ این‌ها فقط کش محلی‌اند)
} from '../../../lib/technician-store'
import { fetchMyProfileResult, saveProfileRemote } from '../../../lib/profiles/client'
import VerificationBadges from '../../../components/VerificationBadges'
import { Plus, Trash2, Images, Wrench, ArrowLeft, Check } from 'lucide-react'


const CARD   = 'rounded-2xl border border-[#E7E2D6] bg-white p-5 shadow-[0_2px_10px_rgba(28,27,23,0.05)]'
const LQ_BTN = 'inline-flex items-center gap-2 rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] px-4 py-2.5 text-[13px] font-bold text-[#8F6531] transition hover:-translate-y-0.5'
const INPUT  = 'w-full rounded-xl border border-[#E7E2D6] bg-[#FAFAF7] px-3.5 py-2.5 text-[13.5px] text-[#1C1B17] outline-none transition focus:border-[#C7A66A] placeholder:text-[11.5px] placeholder:text-[#A69F8E]'
const rid = () => Math.random().toString(36).slice(2, 9)

export default function TechnicianDashboard() {
  const { user, _hydrated } = useAuthStore()

  const [form, setForm]     = useState<TechnicianProfile>(() => emptyTechnicianProfile('draft'))
  const [aboutText, setAboutText] = useState('')
  const [loaded, setLoaded] = useState(false)
  /* نامکی که واقعاً روی سرور ثبت شده. تا وقتی خالی است فیلدِ نشانی
     باز می‌ماند؛ نامکِ خودکارِ فرم نباید قفلش کند. */
  const [savedSlug, setSavedSlug] = useState<string | null>(null)
  const [saved, setSaved]   = useState(false)
  const [err, setErr]       = useState('')
  const [busy, setBusy]     = useState(false)

  /* فرم پروژه‌ی جدید */
  const [prj, setPrj] = useState({ title: '', desc: '', city: '', club: '', service: '' as TechService | '', image: '' })
  const prjImgRef = useRef<HTMLInputElement>(null)
  const photoRef  = useRef<HTMLInputElement>(null)
  /* آلبوم جدید */
  const [albTitle, setAlbTitle] = useState('')
  /* ورودیِ عکس به‌ازای هر آلبوم — کلید نامِ آلبوم است، چون آلبوم دیگر
     شناسه ندارد و خودِ نام هویتش است (همان مدلِ مربی و داور). */
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

      /* نسخه‌ی سرور مقدم است؛ پروفایل محلی قدیمی یک‌بار بالا می‌رود */
      void (async () => {
        const res = await fetchMyProfileResult<TechnicianProfile>('technician')
      /* خطا ⇒ نمی‌دانیم چیزی ثبت شده یا نه؛ نشانی قفل می‌ماند. */
      if (res.state === 'error') return
      const remote = res.state === 'found' ? res.profile : null
        if (!remote) {
          if (mine) {
            const up = await saveProfileRemote('technician', mine.slug, mine as unknown as Record<string, unknown>)
            /* فقط نوشتنِ تأییدشده قفل می‌کند. */
            if (up.ok && up.profile?.slug) setSavedSlug(up.profile.slug)
            else { setSavedSlug(''); setErr(up.message ?? 'نشانیِ ثبت‌شده خوانده نشد — دوباره تلاش کنید') }
          } else {
            /* کاربرِ کاملاً تازه: نه ردیفِ سرور، نه کشِ محلی.
               صریح باز می‌شود تا نامکش را خودش انتخاب کند. */
            setSavedSlug('')
          }
          return
        }
        setSavedSlug(remote.slug)
        /* ⚠️ ردیفِ سرور می‌تواند هنوز آلبومِ شیئیِ پیش از مهاجرت داشته
           باشد. بدونِ این تبدیل، پنل روی `x.trim` می‌شکند و — بدتر —
           اولین ذخیره همان شکل را با شکلِ تازه جایگزین می‌کرد و
           عکس‌های داخلِ آلبوم‌ها از بین می‌رفت. */
        const merged = { ...base, ...remote.data, ...normalizeTechMedia(remote.data), slug: remote.slug }
        setForm(merged)
        setAboutText((merged.about ?? []).join('\n\n'))
      })()
    }
    setLoaded(true)
  }, [_hydrated, user?.id])

  const set = <K extends keyof TechnicianProfile>(k: K, v: TechnicianProfile[K]) => {
    setForm(f => ({ ...f, [k]: v })); setSaved(false); setErr('')
  }

  const toggleService = (s: TechService) =>
    set('services', form.services.includes(s) ? form.services.filter(x => x !== s) : [...form.services, s])

  /* ── پروژه‌ها ── */
  const pickPrjImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true)
    try { setPrj(p => ({ ...p, image: '' })); const url = await compressImage(file, 1200, 0.7); setPrj(p => ({ ...p, image: url })) }
    catch { setErr('عکس خوانده نشد.') }
    finally { setBusy(false); e.target.value = '' }
  }
  const addProject = () => {
    if (!prj.title.trim() || !prj.service) { setErr('عنوان و نوع خدمات پروژه لازم است.'); return }
    const p: TechProject = {
      id: rid(), title: prj.title.trim(), desc: prj.desc.trim(),
      city: prj.city.trim() || form.city, club: prj.club.trim() || undefined,
      service: prj.service as TechService,
      image: prj.image || '/images/services/repaire.jfif',
    }
    set('projects', [...form.projects, p])
    setPrj({ title: '', desc: '', city: '', club: '', service: '', image: '' })
  }

  /* ── آلبوم‌ها ──
     ⚠️ مدل عوض شد و با آن این بخش هم: آلبوم دیگر شیئی با عکس‌های
     داخلش نیست. نام‌ها در `albums` و خودِ عکس در `gallery` با برچسبِ
     نامِ آلبوم می‌نشیند — همان چیزی که صفحه‌ی عمومی رندر می‌کند. با دو
     مدلِ جدا، عکسی که از صفحه‌ی عمومی اضافه می‌شد در پنل دیده نمی‌شد. */
  const addAlbum = () => {
    const n = albTitle.trim()
    if (!n) { setErr('نام آلبوم لازم است.'); return }
    if (form.albums.some(x => x.trim() === n)) { setErr('آلبومی با همین نام هست.'); return }
    set('albums', [...form.albums, n]); setAlbTitle('')
  }
  const addAlbumPhotos = async (album: string, files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    try {
      const items = await Promise.all(Array.from(files).slice(0, 8).map(async f => ({
        id: `m${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
        url: await compressImage(f, 1200, 0.68),
        caption: '',
        ...(album ? { album } : {}),
      })))
      set('gallery', [...form.gallery, ...items])
    } catch { setErr('آپلود نشد. دوباره تلاش کنید.') }
    finally { setBusy(false) }
  }
  const removeGalleryItem = (id: string) => set('gallery', form.gallery.filter(g => g.id !== id))
  /* حذفِ آلبوم فقط برچسب را برمی‌دارد؛ عکس در گالری می‌ماند. پاک‌کردنِ
     خودکارِ عکس‌ها با یک کلیک، حذفِ برگشت‌ناپذیرِ چند فایل است. */
  const removeAlbum = (name: string) => {
    set('albums', form.albums.filter(x => x !== name))
    set('gallery', form.gallery.map(g => (g.album === name ? { ...g, album: undefined } : g)))
  }

  /* ── ذخیره = انتشار ── */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim())  { setErr('نام و نام‌خانوادگی لازم است.'); return }
    if (!form.title.trim()) { setErr('عنوان تخصصی لازم است.'); return }
    if (!form.city)         { setErr('شهر را انتخاب کنید.'); return }
    if (!form.services.length) { setErr('حداقل یک نوع خدمات را انتخاب کنید.'); return }
    if (!form.phone.trim()) { setErr('شماره تماس لازم است.'); return }

    const profile = {
      ...form,
      ownerId: user?.id || form.ownerId,
      ownerPhone: user?.phone || form.ownerPhone,
      about: aboutText.split(/\n{2,}/).map(s => s.trim()).filter(Boolean),
      coverage: form.coverage.length ? form.coverage : [form.city],
      status: 'approved' as const,
    }

    /* منبع حقیقت سرور است؛ localStorage فقط کش همین مرورگر می‌ماند.
       تا پیش از این فقط localStorage نوشته می‌شد و پنل ادمین پروفایل را
       اصلاً نمی‌دید. */
    if (savedSlug === null) { setErr('نشانیِ اختصاصی هنوز خوانده نشده — چند لحظه صبر کنید یا صفحه را تازه کنید'); return }
    const res = await saveProfileRemote('technician', profile.slug, profile as unknown as Record<string, unknown>)
    if (!res.ok) { setErr(res.message ?? 'ذخیره روی سرور انجام نشد'); return }

    /* از این لحظه نشانی منتشر شده و قفل می‌شود: هر تغییرِ بعدی
       لینک‌های منتشرشده را می‌شکند. */
    if (res.profile?.slug) setSavedSlug(res.profile.slug)
    const saved = (res.profile?.data as typeof profile | undefined) ?? profile
    try { saveTechnicianProfile({ ...profile, ...saved }) } catch { /* کش مرورگر پر است */ }
    setForm(f => ({ ...f, ...saved }))
    setSaved(true); setErr('')
  }

  if (!_hydrated || !loaded) return null

  if (!isTechnician) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#F7F5F0] p-6 text-center font-[Vazirmatn,Tahoma,sans-serif]">
        <div className={`${CARD} max-w-[420px]`}>
          <Wrench size={26} className="mx-auto mb-3 text-[#6F6A5C]" />
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
            <p className="mt-1 text-[12.5px] text-[#6F6A5C]">هرچه این‌جا وارد کنید، همان در دایرکتوری و پروفایل عمومی شما دیده می‌شود.</p>
          </div>
          <Link href={`/services/${form.slug}`} className={LQ_BTN}>
            <ArrowLeft size={14} /> مشاهده‌ی پروفایل
          </Link>
        </div>

        <form onSubmit={submit} className="space-y-5">

          {/* وضعیت تأیید — هویت، مدارک و ایمیل */}
          <VerificationBadges />


          {/* ═══ هویت حرفه‌ای ═══ */}
          <section className={CARD}>
            <h2 className="mb-4 text-[14.5px] font-bold">هویت حرفه‌ای</h2>

            {/* عکس پروفایل */}
            <div className="mb-5 flex items-center gap-4">
              <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-full border-2 border-[rgba(199,166,106,0.45)] bg-gradient-to-bl from-[#FFFDF9] to-[#F5EFE4] shadow-[0_8px_22px_rgba(154,110,56,0.16)]">
                {form.photo
                  ? <img loading="lazy" decoding="async" src={form.photo} alt="" className="h-full w-full object-cover" />
                  : <span className="flex h-full w-full items-center justify-center text-[30px] font-black text-[#8F6531]">{(form.name || 'م').slice(0, 1)}</span>}
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
                            {/* نشانیِ اختصاصیِ سایت — همان چیزی که پنلِ باشگاه از اول داشت */}
              <div className="sm:col-span-2">
                <ProfileSlugField
                  kind="technician" value={form.slug} savedSlug={savedSlug}
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
              <div>
                {/* ورودیِ متنیِ آزاد جای خود را به انتخاب از باشگاه‌های
                    ثبت‌شده داد: عضویت روی `club_members` می‌نشیند و
                    شمارشِ اعضای باشگاه از همان‌جا می‌آید. با نامِ دستی،
                    آن عدد هیچ‌وقت درست نمی‌شد. */}
                <ClubPicker label="باشگاه / مجموعه‌ی همکار" />
              </div>
              <div>
                <CoverageCitySelect
                  value={form.coverage}
                  onChange={v => set('coverage', v)} />
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
                    className={`inline-flex items-center gap-1.5 rounded-[10px] border px-3.5 py-2 text-[12.5px] font-bold transition ${on ? 'border-[rgba(199,166,106,0.4)] bg-[rgba(199,166,106,0.13)] text-[#8F6531]' : 'border-[#E7E2D6] bg-white text-[#5B564B] hover:border-[rgba(199,166,106,0.4)]'}`}>
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
            <p className="mb-4 text-[12px] text-[#6F6A5C]">به‌شکل پرتفولیو در پروفایل شما نمایش داده می‌شود.</p>

            {form.projects.length > 0 && (
              <div className="mb-4 space-y-2">
                {form.projects.map(p => (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl border border-[#EFEBE1] bg-[#FAFAF7] p-2.5">
                    <img loading="lazy" decoding="async" src={p.image} alt="" className="h-12 w-16 rounded-lg border border-[#E7E2D6] object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold">{p.title}</div>
                      <div className="text-[11px] text-[#6F6A5C]">{p.service} · {p.city}{p.club ? ` — ${p.club}` : ''}</div>
                    </div>
                    <button type="button" onClick={() => set('projects', form.projects.filter(x => x.id !== p.id))}
                      className="rounded-lg p-2 text-[#B23B2E] transition hover:bg-[rgba(178,59,46,0.08)]"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 rounded-xl border border-dashed border-[#D8D2C4] p-4 sm:grid-cols-2">
              <input className={INPUT} value={prj.title} onChange={e => setPrj(p => ({ ...p, title: e.target.value }))} placeholder="عنوان پروژه — مثال: بازسازی میز اسنوکر" />
              <Select
                value={prj.service} ariaLabel="نوع خدمات" placeholder="نوع خدمات…"
                options={TECH_SERVICES.map(s => ({ value: s, label: s }))}
                onChange={v => setPrj(p => ({ ...p, service: v as TechService }))} />
              <input className={INPUT} value={prj.city} onChange={e => setPrj(p => ({ ...p, city: e.target.value }))} placeholder={`شهر (پیش‌فرض: ${form.city || '—'})`} />
              <input className={INPUT} value={prj.club} onChange={e => setPrj(p => ({ ...p, club: e.target.value }))} placeholder="باشگاه / محل انجام (اگر بود)" />
              <input className={`${INPUT} sm:col-span-2`} value={prj.desc} onChange={e => setPrj(p => ({ ...p, desc: e.target.value }))} placeholder="توضیح کوتاه پروژه…" />
              <div className="flex items-center gap-3 sm:col-span-2">
                <input ref={prjImgRef} type="file" accept="image/*" className="hidden" onChange={pickPrjImage} />
                <button type="button" onClick={() => prjImgRef.current?.click()} className={LQ_BTN}><Images size={14} /> {prj.image ? 'تغییر عکس' : 'عکس پروژه'}</button>
                {prj.image && <img loading="lazy" decoding="async" src={prj.image} alt="" className="h-11 w-16 rounded-lg border border-[#E7E2D6] object-cover" />}
                <button type="button" onClick={addProject} className={`${LQ_BTN} mr-auto`} disabled={busy}><Plus size={14} /> افزودن پروژه</button>
              </div>
            </div>
          </section>

          {/* ═══ گالری / آلبوم‌ها ═══ */}
          <section className={CARD}>
            <h2 className="mb-1 text-[14.5px] font-bold">گالری تصاویر — آلبوم‌ها</h2>
            <p className="mb-4 text-[12px] text-[#6F6A5C]">آلبوم بسازید و عکس‌های هر آلبوم را اضافه کنید.</p>

            {form.albums.map(name => {
              const photos = form.gallery.filter(g => (g.album ?? '') === name)
              return (
                <div key={name} className="mb-3 rounded-xl border border-[#EFEBE1] bg-[#FAFAF7] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-[13px] font-bold">{name}</div>
                    <div className="flex items-center gap-2">
                      <input ref={el => { albImgRefs.current[name] = el }} type="file" accept="image/*" multiple className="hidden"
                        onChange={e => { void addAlbumPhotos(name, e.target.files); e.target.value = '' }} />
                      <button type="button" onClick={() => albImgRefs.current[name]?.click()} className={LQ_BTN} disabled={busy}>
                        <Plus size={13} /> عکس
                      </button>
                      <button type="button" onClick={() => removeAlbum(name)} aria-label={`حذف آلبوم ${name}`}
                        className="rounded-lg p-2 text-[#B23B2E] transition hover:bg-[rgba(178,59,46,0.08)]"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  {photos.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {photos.map(g => (
                        <span key={g.id} className="relative">
                          <img loading="lazy" decoding="async" src={g.url} alt="" className="h-16 w-24 rounded-lg border border-[#E7E2D6] object-cover" />
                          <button type="button" onClick={() => removeGalleryItem(g.id)} aria-label="حذف تصویر"
                            className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#B23B2E] text-[11px] text-white">×</button>
                        </span>
                      ))}
                    </div>
                  ) : <p className="text-[11.5px] text-[#A69F8E]">هنوز عکسی ندارد.</p>}
                </div>
              )
            })}

            {/* عکس‌های بدونِ آلبوم — در صفحه‌ی عمومی تبِ «تصاویر» هستند */}
            {form.gallery.some(g => !(g.album ?? '').trim()) && (
              <div className="mb-3 rounded-xl border border-[#EFEBE1] bg-[#FAFAF7] p-3">
                <div className="mb-2 text-[13px] font-bold">بدون آلبوم</div>
                <div className="flex flex-wrap gap-2">
                  {form.gallery.filter(g => !(g.album ?? '').trim()).map(g => (
                    <span key={g.id} className="relative">
                      <img loading="lazy" decoding="async" src={g.url} alt="" className="h-16 w-24 rounded-lg border border-[#E7E2D6] object-cover" />
                      <button type="button" onClick={() => removeGalleryItem(g.id)} aria-label="حذف تصویر"
                        className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#B23B2E] text-[11px] text-white">×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-[#D8D2C4] p-4 sm:flex-row">
              <input className={INPUT} value={albTitle} onChange={e => setAlbTitle(e.target.value)} placeholder="نام آلبوم — مثال: پروژه‌های کرمان" />
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

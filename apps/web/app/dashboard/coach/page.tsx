'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuthStore } from '../../../store/auth.store'
import { isValidSlug } from '../../../lib/slug'
import {
  GRADES, DISCIPLINES, getCoachProfiles, saveCoachProfile,
  type CoachProfile, type CoachGrade, type CoachMedia, type CoachVideo,
} from '../../../lib/coach-store'

/* ─── Tokens ─── */
const GOLD   = '#C7A66A'
const GOLD_D = '#9A6E38'
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
  city: '', disciplines: [] as string[], shortBio: '', fullBio: '',
  grades: [] as CoachGrade[], gallery: [] as CoachMedia[], videos: [] as CoachVideo[],
  phone: '', whatsapp: '', instagram: '', telegram: '',
  photo: '', coverImage: '', certificate: null as { name: string; url: string } | null,
}
type FormState = typeof emptyForm

/* small style helpers */
const card: React.CSSProperties = { background: '#fff', border: CBOR, borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 16px rgba(17,17,16,0.05)' }
const inp:  React.CSSProperties = { width: '100%', padding: '10px 13px', border: '1px solid rgba(17,17,16,0.14)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', background: '#fff', color: TEXT, outline: 'none' }
const inpRO: React.CSSProperties = { ...inp, background: 'rgba(17,17,16,0.045)', color: 'rgba(17,17,16,0.60)', cursor: 'not-allowed' }
const lbl:  React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 700, color: TEXT_S, marginBottom: 6 }
const lqBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D, borderRadius: 10, fontWeight: 700, fontSize: 14, padding: '11px 22px', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none' }
const sectionTitle = (t: string, n: number) => (
  <h2 style={{ fontSize: 15, fontWeight: 800, color: TEXT, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 9 }}>
    <span style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(199,166,106,0.14)', color: GOLD_D, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</span>
    {t}
  </h2>
)

export default function CoachDashboardPage() {
  const { user, _hydrated } = useAuthStore()
  const [form, setForm]       = useState<FormState>(emptyForm)
  const [errors, setErrors]   = useState<Record<string, string>>({})
  const [topError, setTopErr] = useState('')
  const [warnOpen, setWarn]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const galleryInput = useRef<HTMLInputElement>(null)
  const videoInput   = useRef<HTMLInputElement>(null)

  /* prefill from the logged-in user; load existing submission if any */
  useEffect(() => {
    if (!_hydrated) return
    const mine = user?.phone ? Object.values(getCoachProfiles()).find(p => p.ownerPhone === user.phone) : null
    if (mine) {
      setForm({
        slug: mine.slug, firstNameFa: user?.firstName || mine.firstNameFa, lastNameFa: user?.lastName || mine.lastNameFa,
        firstNameEn: mine.firstNameEn, lastNameEn: mine.lastNameEn, city: mine.city,
        disciplines: mine.disciplines, shortBio: mine.shortBio, fullBio: mine.fullBio,
        grades: mine.grades, gallery: mine.gallery, videos: mine.videos,
        phone: mine.phone, whatsapp: mine.whatsapp, instagram: mine.instagram, telegram: mine.telegram,
        photo: mine.photo, coverImage: mine.coverImage, certificate: mine.certificate,
      })
    } else if (user) {
      setForm(f => ({ ...f, firstNameFa: user.firstName || '', lastNameFa: user.lastName || '', city: user.city || '', phone: user.phone || '' }))
    }
  }, [_hydrated, user])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }))

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

  const suggestSlug = () => {
    const base = `${form.firstNameEn} ${form.lastNameEn}`.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (base) set('slug', base)
  }
  const slugTaken = () => {
    const p = getCoachProfiles()[form.slug]
    return !!p && p.ownerPhone !== user?.phone
  }

  const addPhoto = async (file?: File) => { if (file) set('photo', await compressImage(file, 480, 0.82)) }
  const addCover = async (file?: File) => { if (file) set('coverImage', await compressImage(file, 1280, 0.72)) }
  const addGallery = async (files: FileList | null) => {
    if (!files) return
    const items: CoachMedia[] = []
    for (const f of Array.from(files).slice(0, 12)) items.push({ id: rid(), url: await compressImage(f, 1100, 0.72), caption: '' })
    setForm(f => ({ ...f, gallery: [...f.gallery, ...items] }))
  }
  const setCaption = (id: string, caption: string) =>
    setForm(f => ({ ...f, gallery: f.gallery.map(g => (g.id === id ? { ...g, caption } : g)) }))
  const removeGallery = (id: string) => setForm(f => ({ ...f, gallery: f.gallery.filter(g => g.id !== id) }))

  const addVideo = async (file?: File) => {
    const thumb = file ? await compressImage(file, 720, 0.72) : ''
    setForm(f => ({ ...f, videos: [...f.videos, { id: rid(), thumbnail: thumb, title: '', duration: '' }] }))
  }
  const setVideo = (id: string, patch: Partial<CoachVideo>) =>
    setForm(f => ({ ...f, videos: f.videos.map(v => (v.id === id ? { ...v, ...patch } : v)) }))
  const removeVideo = (id: string) => setForm(f => ({ ...f, videos: f.videos.filter(v => v.id !== id) }))

  const addCertificate = async (file?: File) => {
    if (!file) return
    const url = file.type.startsWith('image/') ? await compressImage(file, 1500, 0.8) : await fileToDataUrl(file)
    set('certificate', { name: file.name, url })
  }

  /* ── validation ── */
  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.firstNameFa.trim()) e.firstNameFa = 'الزامی'
    if (!form.lastNameFa.trim())  e.lastNameFa  = 'الزامی'
    if (!form.firstNameEn.trim()) e.firstNameEn = 'الزامی'
    if (!form.lastNameEn.trim())  e.lastNameEn  = 'الزامی'
    if (!form.city.trim())        e.city        = 'الزامی'
    if (!form.slug.trim())        e.slug        = 'الزامی'
    else if (!isValidSlug(form.slug)) e.slug     = 'فقط حروف انگلیسی، عدد و خط تیره (۲ تا ۶۰ کاراکتر)'
    else if (slugTaken())         e.slug        = 'این نشانی قبلاً استفاده شده است'
    if (form.disciplines.length === 0) e.disciplines = 'حداقل یک رشته را انتخاب کنید'
    if (!form.fullBio.trim())     e.fullBio     = 'الزامی'
    setErrors(e)
    if (Object.keys(e).length) { setTopErr('لطفاً فیلدهای الزامی مشخص‌شده را تکمیل کنید.'); return false }
    setTopErr('')
    return true
  }

  const doSubmit = async () => {
    setWarn(false)
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
    const profile: CoachProfile = {
      ...form, photo, coverImage, gallery, videos, certificate,
      slug: form.slug.trim().toLowerCase(),
      status: 'pending',
      verified: false,
      freeCoach: !form.certificate,
      submittedAt: new Date().toISOString(),
      ownerPhone: user?.phone || '',
    }
    try {
      saveCoachProfile(profile)
    } catch {
      setTopErr('حجم تصاویر بیش از ظرفیت مجاز مرورگر است. لطفاً تعداد یا حجم تصاویرِ گالری / کاور / مدرک را کمتر کنید و دوباره ثبت کنید.')
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setSubmitted(true)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onSubmit = () => {
    if (!validate()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    if (!form.certificate) { setWarn(true); return }  // no certificate → warn first
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
            پروفایل شما برای بررسی و تایید به ادمین سیستم ارسال شد.
          </p>
          <p style={{ fontSize: 12.5, color: TEXT_M, lineHeight: 1.9, marginBottom: 22 }}>
            {form.certificate
              ? 'پس از تایید مدرک توسط ادمین، پروفایل شما تیک آبی تایید دریافت می‌کند.'
              : 'چون مدرکی آپلود نکرده‌اید، پس از تایید ادمین به‌عنوان «مربی آزاد» (بدون تیک آبی) نمایش داده می‌شوید.'}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={`/coaches/${form.slug}`} style={lqBtn}>مشاهده پیش‌نمایش پروفایل</Link>
            <button onClick={() => setSubmitted(false)} style={{ ...lqBtn, background: 'transparent', border: '1px solid rgba(17,17,16,0.14)', color: TEXT_S }}>ویرایش اطلاعات</button>
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: TEXT_M, direction: 'ltr' }}>www.billiardhub.net/coaches/{form.slug}</div>
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.30)', color: GOLD_D, fontSize: 11, fontWeight: 800, borderRadius: 20, padding: '4px 12px', letterSpacing: '0.08em', marginBottom: 10 }}>
            COACH DASHBOARD
          </div>
          <h1 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 900, letterSpacing: '-0.02em' }}>داشبورد مربی</h1>
          <p style={{ fontSize: 13.5, color: TEXT_S, marginTop: 6 }}>اطلاعات زیر را تکمیل کنید تا صفحه‌ی پروفایل مربی شما ساخته شود.</p>
        </div>

        {topError && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#b91c1c', borderRadius: 12, padding: '11px 16px', fontSize: 13, fontWeight: 600, marginBottom: 18 }}>
            {topError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 1 — Basic info */}
          <div style={card}>
            {sectionTitle('اطلاعات پایه', 1)}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
              <div><label style={lbl}>نام</label><input style={inpRO} value={form.firstNameFa} onChange={e => set('firstNameFa', e.target.value)} disabled placeholder="—" />{err('firstNameFa')}</div>
              <div><label style={lbl}>نام خانوادگی</label><input style={inpRO} value={form.lastNameFa} onChange={e => set('lastNameFa', e.target.value)} disabled placeholder="—" />{err('lastNameFa')}</div>
              <div style={{ gridColumn: '1 / -1', fontSize: 11.5, color: TEXT_M, marginTop: -6 }}>نام و نام خانوادگی از اطلاعات حساب کاربری شما گرفته شده و قابل تغییر نیست.</div>
              <div><label style={lbl}>Last name (English){star}</label><input style={{ ...inp, direction: 'ltr', textAlign: 'left' }} value={form.lastNameEn} onChange={e => set('lastNameEn', e.target.value)} placeholder="Rezaei" />{err('lastNameEn')}</div>
              <div><label style={lbl}>First name (English){star}</label><input style={{ ...inp, direction: 'ltr', textAlign: 'left' }} value={form.firstNameEn} onChange={e => set('firstNameEn', e.target.value)} placeholder="Ahmad" />{err('firstNameEn')}</div>
              <div><label style={lbl}>شهر{star}</label><input style={inp} value={form.city} onChange={e => set('city', e.target.value)} placeholder="تهران" />{err('city')}</div>
              <div>
                <label style={lbl}>نشانی اختصاصی پروفایل (URL){star}</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input style={{ ...inp, direction: 'ltr', textAlign: 'left' }} value={form.slug}
                    onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="ahmad-rezaei" />
                  <button type="button" onClick={suggestSlug} style={{ ...lqBtn, padding: '0 12px', fontSize: 12, whiteSpace: 'nowrap' }}>پیشنهاد</button>
                </div>
                <div style={{ fontSize: 11.5, color: TEXT_M, marginTop: 5, direction: 'ltr', textAlign: 'left' }}>www.billiardhub.net/coaches/{form.slug || '...'}</div>
                {err('slug')}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={lbl}>رشته‌های تخصصی (می‌توانید چند مورد انتخاب کنید){star}</label>
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
                    {form.photo && <img src={form.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
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
                    {form.coverImage && <img src={form.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
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
              <label style={lbl}>بیو کوتاه (یک خط، برای کارت مربیان)</label>
              <input style={inp} value={form.shortBio} onChange={e => set('shortBio', e.target.value)} placeholder="مربی ملی‌پوش با ۱۵ سال سابقه" />
            </div>
            <div>
              <label style={lbl}>معرفی کامل{star}</label>
              <textarea style={{ ...inp, minHeight: 120, resize: 'vertical', lineHeight: 1.9 }} value={form.fullBio} onChange={e => set('fullBio', e.target.value)} placeholder="درباره‌ی سوابق، روش تدریس و تخصص خود بنویسید..." />
              {err('fullBio')}
            </div>
          </div>

          {/* 3 — Coaching grades */}
          <div style={card}>
            {sectionTitle('درجه مربیگری', 3)}
            <div style={{ background: 'rgba(199,166,106,0.08)', border: '1px solid rgba(199,166,106,0.22)', borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: GOLD_D, lineHeight: 1.8, marginBottom: 14 }}>
              مدارکی که دریافت کرده‌اید را به‌ترتیب انتخاب کنید و سال دریافت هر کدام را وارد نمایید.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {GRADES.map((g, idx) => {
                const on = gradeSelected(g.key)
                const yr = form.grades.find(x => x.key === g.key)?.year ?? ''
                return (
                  <div key={g.key} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '9px 12px', borderRadius: 10, border: on ? '1px solid rgba(199,166,106,0.40)' : '1px solid rgba(17,17,16,0.10)', background: on ? 'rgba(199,166,106,0.07)' : '#fff' }}>
                    <button type="button" onClick={() => toggleGrade(idx)} style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', flex: 1, textAlign: 'right', minWidth: 0 }}>
                      <span style={{ width: 19, height: 19, borderRadius: 6, flexShrink: 0, border: on ? 'none' : '1.5px solid rgba(17,17,16,0.22)', background: on ? GOLD : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {on && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                      </span>
                      <span dir="auto" className={g.label.startsWith('WPBSA') ? 'bh-latin' : undefined} style={{ fontSize: 13.5, fontWeight: on ? 700 : 500, color: on ? TEXT : TEXT_S, unicodeBidi: 'isolate' }}>{g.label}</span>
                    </button>
                    {on && (
                      <select value={yr} onChange={e => setGradeYear(g.key, e.target.value)}
                        style={{ ...inp, width: 150, flexShrink: 0, padding: '7px 11px', fontSize: 12.5, direction: 'ltr', textAlign: 'left', cursor: 'pointer' }}>
                        <option value="">سال دریافت</option>
                        {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                      </select>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10, marginBottom: 12 }}>
              {form.gallery.map(g => (
                <div key={g.id} style={{ border: CBOR, borderRadius: 10, overflow: 'hidden', background: 'rgba(17,17,16,0.04)' }}>
                  <div style={{ position: 'relative', aspectRatio: '1' }}>
                    <img src={g.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <button type="button" onClick={() => removeGallery(g.id)} aria-label="حذف" style={{ position: 'absolute', top: 6, left: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                  <input value={g.caption} onChange={e => setCaption(g.id, e.target.value)} placeholder="کپشن..." style={{ ...inp, border: 'none', borderTop: CBOR, borderRadius: 0, fontSize: 12, padding: '7px 10px' }} />
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
                    {v.thumbnail && <img src={v.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <input value={v.title} onChange={e => setVideo(v.id, { title: e.target.value })} placeholder="عنوان ویدیو" style={{ ...inp, flex: 1, minWidth: 140, padding: '8px 11px', fontSize: 13 }} />
                  <input value={v.duration} onChange={e => setVideo(v.id, { duration: e.target.value })} placeholder="مدت (۱۲:۳۴)" style={{ ...inp, width: 110, padding: '8px 11px', fontSize: 13 }} />
                  <button type="button" onClick={() => removeVideo(v.id)} aria-label="حذف" style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_M, padding: 4 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => videoInput.current?.click()} style={{ ...lqBtn, background: 'transparent', border: '1px dashed rgba(199,166,106,0.45)', alignSelf: 'flex-start', fontSize: 13, padding: '9px 16px' }}>+ افزودن ویدیو (با تصویر بندانگشتی)</button>
              <input ref={videoInput} type="file" accept="image/*" hidden onChange={e => { addVideo(e.target.files?.[0]); e.target.value = '' }} />
            </div>
          </div>

          {/* 5 — Contact */}
          <div style={card}>
            {sectionTitle('راه‌های ارتباطی', 5)}
            <p style={{ fontSize: 12.5, color: TEXT_M, marginBottom: 14 }}>هر کدام را که پر کنید، آیکونش در بخش «راه‌های ارتباطی» پروفایل نمایش داده می‌شود.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
              <div><label style={lbl}>شماره تماس</label><input style={{ ...inp, direction: 'ltr', textAlign: 'left' }} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="09121234567" /></div>
              <div><label style={lbl}>واتساپ</label><input style={{ ...inp, direction: 'ltr', textAlign: 'left' }} value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="989121234567" /></div>
              <div><label style={lbl}>اینستاگرام</label><input style={{ ...inp, direction: 'ltr', textAlign: 'left' }} value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="coach.username" /></div>
              <div><label style={lbl}>تلگرام</label><input style={{ ...inp, direction: 'ltr', textAlign: 'left' }} value={form.telegram} onChange={e => set('telegram', e.target.value)} placeholder="coach_username" /></div>
            </div>
          </div>

          {/* 6 — Certificate (last) */}
          <div style={card}>
            {sectionTitle('آپلود آخرین مدرک مربیگری', 6)}
            <p style={{ fontSize: 12.5, color: TEXT_M, marginBottom: 14, lineHeight: 1.8 }}>این مدرک توسط ادمین سیستم بررسی می‌شود؛ در صورت تایید، پروفایل شما تیک آبی تایید دریافت می‌کند.</p>
            {form.certificate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(5,118,66,0.25)', background: 'rgba(5,118,66,0.06)', borderRadius: 10, padding: '11px 14px', marginBottom: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#057642" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                <span style={{ flex: 1, fontSize: 13, color: TEXT, direction: 'ltr', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.certificate.name}</span>
                <button type="button" onClick={() => set('certificate', null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_M, fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>حذف</button>
              </div>
            )}
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, border: '1.5px dashed rgba(199,166,106,0.45)', borderRadius: 12, padding: '20px', cursor: 'pointer', color: GOLD_D, fontWeight: 700, fontSize: 13.5 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              {form.certificate ? 'آپلود مدرک جدید (جایگزین مدرک قبلی)' : 'انتخاب فایل مدرک (تصویر یا PDF)'}
              <input type="file" accept="image/*,.pdf" hidden onChange={e => addCertificate(e.target.files?.[0])} />
            </label>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
            <button type="button" onClick={onSubmit} style={{ ...lqBtn, padding: '13px 34px', fontSize: 15 }}>ثبت اطلاعات</button>
          </div>
        </div>
      </div>

      {/* No-certificate warning */}
      {warnOpen && (
        <div onClick={() => setWarn(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, direction: 'rtl' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: '28px 26px', width: 'min(440px,92vw)', boxShadow: '0 28px 70px rgba(0,0,0,0.20)', fontFamily: "'Vazirmatn',Tahoma,sans-serif" }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>مدرک مربیگری آپلود نشده است</h3>
            <p style={{ fontSize: 13.5, color: TEXT_S, lineHeight: 2 }}>در صورت آپلود نکردن مدرک مربیگری پروفایل شما تیک آبی تایید دریافت نخواهد کرد و عنوان «مربی آزاد» را خواهید داشت.</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button onClick={() => setWarn(false)} style={{ ...lqBtn, background: 'transparent', border: '1px solid rgba(17,17,16,0.14)', color: TEXT_S }}>انصراف و آپلود مدرک</button>
              <button onClick={() => void doSubmit()} style={lqBtn}>ثبت به‌عنوان مربی آزاد</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

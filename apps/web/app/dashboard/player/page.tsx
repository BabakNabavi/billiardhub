'use client'

/* ─────────────────────────────────────────────────────────────
   پنل بازیکن — تکمیلِ پروفایلِ حرفه‌ای.
   تک‌تکِ فیلدهایی که در صفحه‌ی نمایشِ پروفایل بازیکن دیده می‌شوند
   این‌جا از کاربر گرفته می‌شود: هویت، رشته، رنکینگ، پرچم‌ها،
   باشگاه، تمِ کارت، تصویرِ پس‌زمینه، معرفی/بیوگرافی، شروع فعالیت،
   افتخارات (تایم‌لاین)، مسابقات، آلبوم‌ها و برچسب‌ها.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '../../../store/auth.store'
import ProvinceCitySelect from '../../../components/ProvinceCitySelect'
import { provinceOfCity } from '../../../lib/iran-geo'
import { fetchClubOptions, type ClubOption } from '../../../lib/clubs-data'
import { compressImage } from '../../../lib/seller-store'
import { TONES, type PlayerHighlight, type PlayerTournament, type PlayerAlbum } from '../../../lib/players-data'
import {
  emptyPlayerProfile, findPlayerByOwner, newPlayerSlug, savePlayerProfile,
  type PlayerProfile,
} from '../../../lib/player-store'
import { Plus, Trash2, Images, Trophy, ArrowLeft, Check } from 'lucide-react'

const CARD   = 'rounded-2xl border border-[#E7E2D6] bg-white p-5 shadow-[0_2px_10px_rgba(28,27,23,0.05)]'
const LQ_BTN = 'inline-flex items-center gap-2 rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] px-4 py-2.5 text-[13px] font-bold text-[#9A6E38] transition hover:-translate-y-0.5'
const INPUT  = 'w-full rounded-xl border border-[#E7E2D6] bg-[#FAFAF7] px-3.5 py-2.5 text-[13.5px] text-[#1C1B17] outline-none transition focus:border-[#C7A66A] placeholder:text-[11.5px] placeholder:text-[#A69F8E]'
const LABEL  = 'mb-1.5 block text-[12.5px] font-bold text-[#5B564B]'
const rid = () => Math.random().toString(36).slice(2, 9)

const TONE_LABEL: Record<keyof typeof TONES, string> = {
  felt: 'نمدِ سبز', night: 'شبِ سرمه‌ای', bronze: 'برنزِ طلایی',
}

export default function PlayerDashboard() {
  const { user, _hydrated } = useAuthStore()

  const [form, setForm]   = useState<PlayerProfile>(() => emptyPlayerProfile('draft'))
  const [bioText, setBioText] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [err, setErr]       = useState('')
  const [busy, setBusy]     = useState(false)

  const sceneRef = useRef<HTMLInputElement>(null)
  const albImgRefs = useRef<Record<string, HTMLInputElement | null>>({})

  /* فرم‌های افزودنی */
  const [hl, setHl]   = useState({ year: '', title: '' })
  const [tr, setTr]   = useState({ name: '', year: '', result: '' })
  const [albTitle, setAlbTitle] = useState('')
  const [clubOptions, setClubOptions] = useState<ClubOption[]>([])
  useEffect(() => { fetchClubOptions().then(setClubOptions) }, [])

  const isPlayer = !!user && [user.primaryRole, ...(user.secondaryRoles ?? [])].includes('player')

  useEffect(() => {
    if (!_hydrated) return
    if (user) {
      const mine = findPlayerByOwner(user)
      const authName = [user.firstName, user.lastName].filter(Boolean).join(' ')
      const base = mine ?? { ...emptyPlayerProfile(newPlayerSlug(), user.id, user.phone ?? ''), name: authName }
      setForm(base)
      setBioText(base.bio.join('\n\n'))
    }
    setLoaded(true)
  }, [_hydrated, user?.id])

  const set = <K extends keyof PlayerProfile>(k: K, v: PlayerProfile[K]) => {
    setForm(f => ({ ...f, [k]: v })); setSaved(false); setErr('')
  }

  const pickScene = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setBusy(true)
    try { set('scene', await compressImage(f, 1600, 0.7)) }
    catch { setErr('عکس خوانده نشد.') }
    finally { setBusy(false); e.target.value = '' }
  }

  const addTag = () => {
    const v = tagInput.trim()
    if (!v || form.tags.includes(v)) { setTagInput(''); return }
    set('tags', [...form.tags, v]); setTagInput('')
  }

  const addHighlight = () => {
    if (!hl.year.trim() || !hl.title.trim()) { setErr('سال و عنوانِ افتخار لازم است.'); return }
    const item: PlayerHighlight = { year: hl.year.trim(), title: hl.title.trim() }
    set('highlights', [...form.highlights, item]); setHl({ year: '', title: '' })
  }

  const addTournament = () => {
    if (!tr.name.trim() || !tr.year.trim() || !tr.result.trim()) { setErr('نام، سال و نتیجه‌ی مسابقه لازم است.'); return }
    const item: PlayerTournament = { name: tr.name.trim(), year: tr.year.trim(), result: tr.result.trim() }
    set('tournaments', [...form.tournaments, item]); setTr({ name: '', year: '', result: '' })
  }

  const addAlbum = () => {
    if (!albTitle.trim()) { setErr('نام آلبوم لازم است.'); return }
    const a: PlayerAlbum = { id: rid(), title: albTitle.trim(), photos: [] }
    set('albums', [...form.albums, a]); setAlbTitle('')
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim())   { setErr('نام و نام‌خانوادگی لازم است.'); return }
    if (!form.nameEn.trim()) { setErr('نام لاتین لازم است.'); return }
    if (!form.city)          { setErr('شهر را انتخاب کنید.'); return }
    if (!form.intro.trim())  { setErr('معرفی کوتاه لازم است.'); return }
    try {
      savePlayerProfile({
        ...form,
        ownerId: user?.id || form.ownerId,
        ownerPhone: user?.phone || form.ownerPhone,
        nameEn: form.nameEn.trim().toUpperCase(),
        bio: bioText.split(/\n{2,}/).map(s => s.trim()).filter(Boolean),
        status: 'approved',
      })
      setSaved(true); setErr('')
    } catch {
      setErr('حافظه‌ی مرورگر پر است — چند عکس از آلبوم‌ها حذف کنید و دوباره ذخیره کنید.')
    }
  }

  if (!_hydrated || !loaded) return null

  if (!isPlayer) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#F7F5F0] p-6 text-center font-[Vazirmatn,Tahoma,sans-serif]">
        <div className={`${CARD} max-w-[420px]`}>
          <Trophy size={26} className="mx-auto mb-3 text-[#8A8474]" />
          <h1 className="text-[16px] font-bold">این صفحه مخصوص بازیکنان است</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#5B564B]">برای ساختن پروفایل بازیکن، اول باید نقش «بازیکن» را بگیرید.</p>
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
            <h1 className="text-[19px] font-bold">پنل بازیکن</h1>
            <p className="mt-1 text-[12.5px] text-[#8A8474]">هرچه این‌جا وارد کنید، همان در پروفایل عمومی شما در بخش «بازیکنان» دیده می‌شود.</p>
          </div>
          <Link href={`/players/${form.slug}`} className={LQ_BTN}>
            <ArrowLeft size={14} /> مشاهده‌ی پروفایل
          </Link>
        </div>

        <form onSubmit={submit} className="space-y-5">

          {/* ═══ هویت بازیکن ═══ */}
          <section className={CARD}>
            <h2 className="mb-4 text-[14.5px] font-bold">هویت بازیکن</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL}>نام و نام‌خانوادگی *</label>
                <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="مثال: آرمان توکلی" />
              </div>
              <div>
                <label className={LABEL}>نام لاتین *</label>
                <input className={INPUT} dir="ltr" style={{ textAlign: 'right' }} value={form.nameEn} onChange={e => set('nameEn', e.target.value)} placeholder="ARMAN TAVAKOLI" />
              </div>
              <div>
                <label className={LABEL}>رشته *</label>
                <div className="flex gap-2">
                  {([['snooker', 'اسنوکر'], ['pool', 'پاکت بیلیارد']] as const).map(([k, l]) => (
                    <button key={k} type="button" onClick={() => set('discipline', k)}
                      className={`flex-1 rounded-[10px] border px-3 py-2.5 text-[12.5px] font-bold transition ${form.discipline === k ? 'border-[rgba(199,166,106,0.4)] bg-[rgba(199,166,106,0.13)] text-[#9A6E38]' : 'border-[#E7E2D6] bg-white text-[#5B564B]'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={LABEL}>جنسیت</label>
                <div className="flex gap-2">
                  {([['m', 'آقا'], ['f', 'خانم']] as const).map(([k, l]) => (
                    <button key={k} type="button" onClick={() => set('gender', k)}
                      className={`flex-1 rounded-[10px] border px-3 py-2.5 text-[12.5px] font-bold transition ${form.gender === k ? 'border-[rgba(199,166,106,0.4)] bg-[rgba(199,166,106,0.13)] text-[#9A6E38]' : 'border-[#E7E2D6] bg-white text-[#5B564B]'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <ProvinceCitySelect
                  value={{ province: form.province || provinceOfCity(form.city) || '', city: form.city }}
                  onChange={v => { setForm(f => ({ ...f, province: v.province, city: v.city })); setSaved(false); setErr('') }}
                  required cityLabel="شهر" provinceLabel="استان"
                />
              </div>
              <div>
                <label className={LABEL}>کشور</label>
                <input className={INPUT} value={form.country} onChange={e => set('country', e.target.value)} placeholder="ایران" />
              </div>
              <div>
                <label className={LABEL}>رتبه‌ی رنکینگ ملی <span className="font-normal text-[#A69F8E]">— خالی یعنی بدون رنکینگ</span></label>
                <input className={INPUT} dir="ltr" style={{ textAlign: 'right' }} value={form.ranking} onChange={e => set('ranking', e.target.value)} placeholder="مثال: 3" />
              </div>
              <div>
                <label className={LABEL}>باشگاه محل تمرین</label>
                {/* فقط باشگاه‌های ثبت‌شده (همان لیستِ صفحه‌ی /clubs) */}
                <select value={form.clubName} onChange={e => set('clubName', e.target.value)} style={{ width: '100%' }}>
                  <option value="">انتخاب باشگاه…</option>
                  {clubOptions.map(c => (
                    <option key={c.id} value={c.name}>{c.name} — {c.city}</option>
                  ))}
                  {form.clubName && !clubOptions.some(c => c.name === form.clubName) && (
                    <option value={form.clubName}>{form.clubName}</option>
                  )}
                </select>
              </div>
              <div>
                <label className={LABEL}>شروع فعالیت</label>
                <input className={INPUT} value={form.careerStart} onChange={e => set('careerStart', e.target.value)} placeholder="مثال: ۱۳۹۴" />
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                {([['national', 'ملی‌پوش هستم'], ['youth', 'رده‌ی جوانان']] as const).map(([k, l]) => {
                  const on = form[k]
                  return (
                    <button key={k} type="button" onClick={() => set(k, !on)}
                      className={`inline-flex items-center gap-1.5 rounded-[10px] border px-3.5 py-2 text-[12.5px] font-bold transition ${on ? 'border-[rgba(199,166,106,0.4)] bg-[rgba(199,166,106,0.13)] text-[#9A6E38]' : 'border-[#E7E2D6] bg-white text-[#5B564B]'}`}>
                      {on && <Check size={13} />}{l}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          {/* ═══ ظاهر کارت ═══ */}
          <section className={CARD}>
            <h2 className="mb-1 text-[14.5px] font-bold">ظاهر کارت و پس‌زمینه</h2>
            <p className="mb-4 text-[12px] text-[#8A8474]">تمِ رنگیِ کارت و تصویرِ پس‌زمینه‌ی سینماییِ پروفایل شما.</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {(Object.keys(TONES) as (keyof typeof TONES)[]).map(k => {
                const t = TONES[k]
                const on = form.tone === k
                return (
                  <button key={k} type="button" onClick={() => set('tone', k)}
                    className={`inline-flex items-center gap-2 rounded-[10px] border px-3.5 py-2 text-[12.5px] font-bold transition ${on ? 'border-[rgba(199,166,106,0.5)] bg-[rgba(199,166,106,0.13)] text-[#9A6E38]' : 'border-[#E7E2D6] bg-white text-[#5B564B]'}`}>
                    <span className="h-4 w-7 rounded-md" style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }} />
                    {TONE_LABEL[k]}
                    {on && <Check size={13} />}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-3">
              <input ref={sceneRef} type="file" accept="image/*" className="hidden" onChange={pickScene} />
              <button type="button" onClick={() => sceneRef.current?.click()} className={LQ_BTN} disabled={busy}>
                <Images size={14} /> {form.scene ? 'تغییر تصویر پس‌زمینه' : 'آپلود تصویر پس‌زمینه'}
              </button>
              {form.scene && (
                <>
                  <img src={form.scene} alt="" className="h-14 w-24 rounded-lg border border-[#E7E2D6] object-cover" />
                  <button type="button" onClick={() => set('scene', '')} className="text-[11.5px] font-bold text-[#B23B2E]">حذف</button>
                </>
              )}
            </div>
          </section>

          {/* ═══ معرفی و بیوگرافی ═══ */}
          <section className={CARD}>
            <h2 className="mb-4 text-[14.5px] font-bold">معرفی و بیوگرافی</h2>
            <div className="space-y-4">
              <div>
                <label className={LABEL}>معرفی کوتاه (یک خط) *</label>
                <input className={INPUT} value={form.intro} onChange={e => set('intro', e.target.value)} placeholder="مثال: مردِ شماره‌ی یکِ اسنوکر ایران…" />
              </div>
              <div>
                <label className={LABEL}>بیوگرافی <span className="font-normal text-[#A69F8E]">— هر پاراگراف با یک خط خالی جدا شود</span></label>
                <textarea className={`${INPUT} min-h-[120px] leading-7`} value={bioText} onChange={e => { setBioText(e.target.value); setSaved(false) }} placeholder="داستان، مسیر حرفه‌ای و سبک بازی…" />
              </div>
              <div>
                <label className={LABEL}>برچسب‌ها <span className="font-normal text-[#A69F8E]">— برای اتصال به اخبار و ویدیوهای مرتبط</span></label>
                <div className="flex gap-2">
                  <input className={INPUT} value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} placeholder="مثال: تیم ملی + Enter" />
                  <button type="button" onClick={addTag} className={LQ_BTN}><Plus size={14} /></button>
                </div>
                {form.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {form.tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 rounded-full border border-[#E7E2D6] bg-[#FAFAF7] px-2.5 py-1 text-[11.5px] font-semibold text-[#5B564B]">
                        {t}
                        <button type="button" onClick={() => set('tags', form.tags.filter(x => x !== t))} className="text-[#B23B2E]">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ═══ افتخارات ═══ */}
          <section className={CARD}>
            <h2 className="mb-1 text-[14.5px] font-bold">افتخارات و دستاوردها</h2>
            <p className="mb-4 text-[12px] text-[#8A8474]">به‌شکل تایم‌لاین در پروفایل نمایش داده می‌شود.</p>
            {form.highlights.length > 0 && (
              <div className="mb-4 space-y-2">
                {form.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-[#EFEBE1] bg-[#FAFAF7] px-3 py-2.5">
                    <span className="text-[13px] font-black text-[#9A6E38]">{h.year}</span>
                    <span className="flex-1 text-[13px] font-bold">{h.title}</span>
                    <button type="button" onClick={() => set('highlights', form.highlights.filter((_, x) => x !== i))}
                      className="rounded-lg p-1.5 text-[#B23B2E] transition hover:bg-[rgba(178,59,46,0.08)]"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-[#D8D2C4] p-4 sm:flex-row">
              <input className={`${INPUT} sm:w-28`} value={hl.year} onChange={e => setHl(h => ({ ...h, year: e.target.value }))} placeholder="سال — ۱۴۰۵" />
              <input className={INPUT} value={hl.title} onChange={e => setHl(h => ({ ...h, title: e.target.value }))} placeholder="عنوان — مثال: قهرمان مسابقات قهرمانی کشور" />
              <button type="button" onClick={addHighlight} className={`${LQ_BTN} shrink-0`}><Plus size={14} /> افزودن</button>
            </div>
          </section>

          {/* ═══ مسابقات ═══ */}
          <section className={CARD}>
            <h2 className="mb-4 text-[14.5px] font-bold">مسابقات و حضورها</h2>
            {form.tournaments.length > 0 && (
              <div className="mb-4 space-y-2">
                {form.tournaments.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-[#EFEBE1] bg-[#FAFAF7] px-3 py-2.5">
                    <span className="flex-1 text-[13px] font-bold">{t.name}</span>
                    <span className="text-[12px] text-[#8A8474]">{t.year}</span>
                    <span className="rounded-full border border-[rgba(199,166,106,0.26)] bg-[rgba(199,166,106,0.1)] px-2.5 py-0.5 text-[11.5px] font-bold text-[#9A6E38]">{t.result}</span>
                    <button type="button" onClick={() => set('tournaments', form.tournaments.filter((_, x) => x !== i))}
                      className="rounded-lg p-1.5 text-[#B23B2E] transition hover:bg-[rgba(178,59,46,0.08)]"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-[#D8D2C4] p-4 sm:flex-row">
              <input className={INPUT} value={tr.name} onChange={e => setTr(t => ({ ...t, name: e.target.value }))} placeholder="نام مسابقه — مثال: تهران مسترز" />
              <input className={`${INPUT} sm:w-28`} value={tr.year} onChange={e => setTr(t => ({ ...t, year: e.target.value }))} placeholder="سال" />
              <input className={`${INPUT} sm:w-40`} value={tr.result} onChange={e => setTr(t => ({ ...t, result: e.target.value }))} placeholder="نتیجه — قهرمان" />
              <button type="button" onClick={addTournament} className={`${LQ_BTN} shrink-0`}><Plus size={14} /> افزودن</button>
            </div>
          </section>

          {/* ═══ گالری ═══ */}
          <section className={CARD}>
            <h2 className="mb-1 text-[14.5px] font-bold">گالری — آلبوم‌ها</h2>
            <p className="mb-4 text-[12px] text-[#8A8474]">مثل «آلبوم مسابقات»، «آلبوم تیم ملی»، «آلبوم تمرینات»…</p>
            {form.albums.map(a => (
              <div key={a.id} className="mb-3 rounded-xl border border-[#EFEBE1] bg-[#FAFAF7] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-[13px] font-bold">{a.title}</div>
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
                        <button type="button"
                          onClick={() => set('albums', form.albums.map(x => x.id === a.id ? { ...x, photos: x.photos.filter((_, pi) => pi !== i) } : x))}
                          className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#B23B2E] text-[11px] text-white">×</button>
                      </span>
                    ))}
                  </div>
                ) : <p className="text-[11.5px] text-[#A69F8E]">هنوز عکسی ندارد.</p>}
              </div>
            ))}
            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-[#D8D2C4] p-4 sm:flex-row">
              <input className={INPUT} value={albTitle} onChange={e => setAlbTitle(e.target.value)} placeholder="نام آلبوم — مثال: آلبوم مسابقات" />
              <button type="button" onClick={addAlbum} className={`${LQ_BTN} shrink-0`}><Plus size={14} /> ساخت آلبوم</button>
            </div>
          </section>

          {/* ═══ ذخیره ═══ */}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className={`${LQ_BTN} px-7 py-3 text-[14px]`} disabled={busy}>
              ذخیره و انتشار پروفایل
            </button>
            {saved && <span className="text-[12.5px] font-bold text-[#0E7A38]">ذخیره و منتشر شد ✓ — در بخش «بازیکنان» نمایش داده می‌شود.</span>}
            {err && <span className="text-[12.5px] font-bold text-[#B23B2E]">{err}</span>}
          </div>
        </form>
      </div>
    </div>
  )
}

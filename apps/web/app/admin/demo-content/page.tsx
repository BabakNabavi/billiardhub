'use client'

/* ─────────────────────────────────────────────────────────────
   محتوای نمایشیِ صفحه‌های عمومی.

   سایتی که همه‌ی فهرست‌هایش خالی است، به بازدیدکننده می‌گوید این‌جا
   چیزی نیست. این صفحه فهرست‌ها را پر می‌کند تا کسب‌وکارهای واقعی
   بیایند و جایشان را بگیرند.

   هر ردیف با نشانِ `is_demo` ساخته می‌شود، پس همیشه از داده‌ی واقعی
   جدا می‌ماند و هر وقت خواستی یکی‌یکی یا یک‌جا پاک می‌شود.

   تیکِ «تأییدشده» روی این‌ها نمی‌آید. آن تیک یعنی هویت استعلام شده و
   روی موجودیتی که وجودِ خارجی ندارد ادعای درستی نیست.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../../store/auth.store'
import { apiFetch } from '../../../lib/http'
import ProvinceCitySelect from '../../../components/ProvinceCitySelect'
import { Trash2, Plus, Loader2, Users, ExternalLink } from 'lucide-react'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', RED = '#B23B2E'

type Kind = 'coach' | 'referee' | 'seller' | 'manufacturer' | 'technician' | 'player'

const KINDS: { key: Kind; fa: string; page: string }[] = [
  { key: 'coach',        fa: 'مربی',        page: '/coaches' },
  { key: 'referee',      fa: 'داور',        page: '/referees' },
  { key: 'seller',       fa: 'فروشگاه',     page: '/sellers' },
  { key: 'manufacturer', fa: 'تولیدکننده',  page: '/manufacturers' },
  { key: 'technician',   fa: 'خدمات فنی',   page: '/services' },
  { key: 'player',       fa: 'بازیکن',      page: '/players' },
]

/* رشته‌ها همان کلیدهایی‌اند که صفحه‌های عمومی فیلتر می‌کنند */
const DISCIPLINES = [
  { key: 'snooker',  fa: 'اسنوکر' },
  { key: 'pocket',   fa: 'پوکت' },
  { key: 'highball', fa: 'هی‌بال' },
  { key: 'carom',    fa: 'کارامبول' },
]

interface Row {
  id: string; kind: Kind; slug: string
  data: Record<string, unknown>
  createdAt: string
}

const box: React.CSSProperties = {
  width: '100%', border: `1px solid ${LINE}`, borderRadius: 9, padding: '8px 11px',
  fontSize: 13, color: INK, fontWeight: 600, fontFamily: 'inherit', background: '#fff',
}
const label: React.CSSProperties = { fontSize: 11.5, color: MUT, fontWeight: 700, display: 'block', marginBottom: 5 }

export default function DemoContentPage() {
  const router = useRouter()
  const { user, _hydrated } = useAuthStore()

  const [kind, setKind] = useState<Kind>('coach')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [geo, setGeo] = useState({ province: '', city: '' })
  const [shortBio, setShortBio] = useState('')
  const [photo, setPhoto] = useState('')
  const [disc, setDisc] = useState<string[]>(['snooker'])
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (!_hydrated) return
    if (!user || user.primaryRole !== 'admin') { router.push('/'); return }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hydrated, user, kind])

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const r = await apiFetch(`/api/admin/demo-profiles?kind=${kind}`, { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message ?? 'خواندن فهرست انجام نشد'); return }
      setRows(j.profiles ?? [])
    } catch { setErr('خطا در ارتباط با سرور') } finally { setLoading(false) }
  }

  /* عکس به data:URL تبدیل می‌شود؛ سرور خودش آن را در استوریج
     می‌گذارد و آدرسِ نهایی را جای این رشته می‌نشاند. */
  const onPhoto = (f?: File) => {
    if (!f) return
    if (f.size > 3 * 1024 * 1024) { setErr('عکس نباید بیشتر از ۳ مگابایت باشد'); return }
    const rd = new FileReader()
    rd.onload = () => setPhoto(String(rd.result ?? ''))
    rd.readAsDataURL(f)
  }

  const reset = () => {
    setFirstName(''); setLastName(''); setGeo({ province: '', city: '' })
    setShortBio(''); setPhoto(''); setPhone(''); setDisc(['snooker'])
  }

  const create = async () => {
    if (saving) return
    if (!firstName.trim()) { setErr('نام الزامی است'); return }
    setSaving(true); setErr('')
    try {
      /* شکلِ `data` همان چیزی است که صفحه‌ی عمومیِ هر نوع می‌خواند —
         وگرنه ردیف ساخته می‌شود ولی روی کارت خالی می‌افتد. */
      const data: Record<string, unknown> = {
        firstNameFa: firstName.trim(), lastNameFa: lastName.trim(),
        firstNameEn: '', lastNameEn: '',
        name: `${firstName} ${lastName}`.trim(),
        province: geo.province, city: geo.city,
        shortBio: shortBio.trim(), fullBio: shortBio.trim(),
        description: shortBio.trim(),
        photo, coverImage: '', logo: photo, image: photo,
        disciplines: disc, specialties: [],
        grades: [], gallery: [], videos: [],
        phone: phone.trim(), whatsapp: '', instagram: '', telegram: '',
        certificate: null, freeCoach: true,
        submittedAt: new Date().toISOString(),
      }
      const r = await apiFetch('/api/admin/demo-profiles', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, data }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message ?? 'ساخت انجام نشد'); return }
      reset(); void load()
    } catch { setErr('خطا در ارتباط با سرور') } finally { setSaving(false) }
  }

  const remove = async (id: string, name: string) => {
    if (!confirm(`«${name}» حذف شود؟`)) return
    try {
      const r = await apiFetch(`/api/admin/demo-profiles?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!r.ok) { const j = await r.json().catch(() => ({})); setErr(j?.message ?? 'حذف انجام نشد'); return }
      setRows(rs => rs.filter(x => x.id !== id))
    } catch { setErr('خطا در ارتباط با سرور') }
  }

  const cur = KINDS.find(k => k.key === kind)!
  const nameOf = (r: Row) =>
    String(r.data.name || `${r.data.firstNameFa ?? ''} ${r.data.lastNameFa ?? ''}`.trim() || r.slug)

  return (
    <div dir="rtl" style={{ maxWidth: 940, margin: '0 auto', padding: '22px 16px 60px', fontFamily: 'var(--font-base)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
        <Users size={19} style={{ color: GOLD_D }} />
        <h1 style={{ fontSize: 19, fontWeight: 900, color: INK, margin: 0 }}>محتوای نمایشی</h1>
      </div>
      <p style={{ fontSize: 12.5, color: SEC, lineHeight: 2, margin: '0 0 18px' }}>
        این‌ها فهرست‌های عمومی را پر می‌کنند تا سایت خالی دیده نشود. همه با نشانِ «نمایشی» ذخیره
        می‌شوند و از داده‌ی واقعی جدا می‌مانند — هر وقت کسب‌وکارِ واقعی جایش را گرفت، یکی را حذف کن.
        تیکِ «تأییدشده» روی این‌ها نمی‌آید.
      </p>

      {/* انتخابِ نوع */}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 18 }}>
        {KINDS.map(k => (
          <button key={k.key} onClick={() => setKind(k.key)} style={{
            padding: '7px 14px', borderRadius: 9, cursor: 'pointer', fontSize: 12.5, fontWeight: 800,
            fontFamily: 'inherit',
            background: kind === k.key ? 'rgba(199,166,106,0.14)' : '#FAFAF7',
            border: `1px solid ${kind === k.key ? 'rgba(199,166,106,0.40)' : LINE}`,
            color: kind === k.key ? GOLD_D : SEC,
          }}>{k.fa}</button>
        ))}
      </div>

      {err && (
        <div style={{ color: RED, fontSize: 12.5, fontWeight: 700, padding: '10px 12px', marginBottom: 14,
          border: `1px solid rgba(178,59,46,0.28)`, borderRadius: 10, background: 'rgba(178,59,46,0.05)' }}>
          {err}
        </div>
      )}

      {/* فرمِ ساخت */}
      <div style={{ border: `1px solid ${LINE}`, borderRadius: 14, padding: 16, marginBottom: 22, background: '#FEFEFC' }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: GOLD_D, marginBottom: 12 }}>
          افزودن {cur.fa} نمایشی
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12 }}>
          <div><label style={label}>نام</label>
            <input style={box} value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
          <div><label style={label}>نام خانوادگی / نام کسب‌وکار</label>
            <input style={box} value={lastName} onChange={e => setLastName(e.target.value)} /></div>
          <div><label style={label}>شماره تماس (اختیاری)</label>
            <input style={{ ...box, direction: 'ltr', textAlign: 'left' }} value={phone} onChange={e => setPhone(e.target.value)} /></div>
        </div>

        {/* قاعده‌ی پروژه: شهر/استان همیشه از این کامپوننت */}
        <div style={{ marginTop: 12 }}>
          <label style={label}>استان و شهر</label>
          <ProvinceCitySelect value={geo} onChange={setGeo} />
        </div>

        {(kind === 'coach' || kind === 'referee' || kind === 'player') && (
          <div style={{ marginTop: 12 }}>
            <label style={label}>رشته‌ها</label>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {DISCIPLINES.map(d => {
                const on = disc.includes(d.key)
                return (
                  <button key={d.key} type="button"
                    onClick={() => setDisc(s => on ? s.filter(x => x !== d.key) : [...s, d.key])}
                    style={{
                      padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                      fontFamily: 'inherit',
                      background: on ? 'rgba(199,166,106,0.14)' : '#fff',
                      border: `1px solid ${on ? 'rgba(199,166,106,0.40)' : LINE}`,
                      color: on ? GOLD_D : SEC,
                    }}>{d.fa}</button>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <label style={label}>معرفی کوتاه</label>
          <textarea style={{ ...box, resize: 'vertical' }} rows={3} value={shortBio} onChange={e => setShortBio(e.target.value)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={label}>عکس</label>
          <input type="file" accept="image/*" onChange={e => onPhoto(e.target.files?.[0])}
            style={{ fontSize: 12, color: SEC, fontFamily: 'inherit' }} />
          {photo && <img src={photo} alt="" style={{ marginTop: 8, width: 74, height: 74, objectFit: 'cover', borderRadius: 10, border: `1px solid ${LINE}` }} />}
          <div style={{ fontSize: 10.5, color: MUT, marginTop: 5 }}>
            از عکسِ چهره‌ی اشخاصِ واقعی استفاده نکن — عکسِ میز، باشگاه یا تصویرِ بدونِ چهره امن است.
          </div>
        </div>

        <button onClick={() => void create()} disabled={saving} style={{
          marginTop: 16, height: 38, padding: '0 18px', borderRadius: 10,
          cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1,
          background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)',
          color: GOLD_D, fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={15} />}
          {saving ? 'در حال ثبت…' : `افزودن ${cur.fa}`}
        </button>
      </div>

      {/* فهرست */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: INK }}>
          {cur.fa}‌های نمایشی ({rows.length})
        </span>
        <a href={cur.page} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 12, fontWeight: 700, color: GOLD_D, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          دیدنِ صفحه‌ی عمومی <ExternalLink size={12} />
        </a>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: SEC, fontSize: 13, padding: 18 }}>
          <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> در حال بارگذاری…
        </div>
      ) : rows.length === 0 ? (
        <div style={{ fontSize: 12.5, color: MUT, padding: '16px 0', lineHeight: 2 }}>
          هنوز {cur.fa} نمایشی‌ای ساخته نشده.
        </div>
      ) : (
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
          {rows.map((r, i) => (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', gap: 11, padding: '10px 13px',
              borderTop: i ? `1px solid ${LINE}` : 'none', background: '#fff',
            }}>
              {r.data.photo ? (
                <img src={String(r.data.photo)} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#F3F0E9', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: INK }}>{nameOf(r)}</div>
                <div style={{ fontSize: 11.5, color: MUT, marginTop: 2 }}>
                  {String(r.data.city || '—')} · <span className="bh-latin">{r.slug}</span>
                </div>
              </div>
              <span style={{
                fontSize: 10.5, fontWeight: 800, color: SEC, background: '#F5F3EE',
                borderRadius: 20, padding: '3px 9px', flexShrink: 0,
              }}>نمایشی</span>
              <button onClick={() => void remove(r.id, nameOf(r))} title="حذف" style={{
                flexShrink: 0, width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${LINE}`, background: '#FAFAF7', color: RED,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

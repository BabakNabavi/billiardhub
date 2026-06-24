'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────
interface UserProfile {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  avatar?: string
  bio?: string
  province?: string
  city?: string
  birthDate?: string
  gender?: string
  instagram?: string
  telegram?: string
  nationalId?: string
  nationalIdVerified: boolean
  phoneVerified: boolean
  emailVerified: boolean
  verificationStatus: string
  isProfileComplete: boolean
  primaryRole: string
  secondaryRoles: string[]
  clubId?: string
  clubNameManual?: string
  bankCard?: string
  bankCardOwner?: string
}

interface Club {
  id: string
  name: string
  city: string
  memberCount?: number
}

// ─── Helpers ──────────────────────────────────────────────────
function toFa(v: string | number) {
  return String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
}

function hexToRgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${a})`
}

function authHeader(): Record<string,string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const PROVINCES = [
  'آذربایجان شرقی','آذربایجان غربی','اردبیل','اصفهان','البرز',
  'ایلام','بوشهر','تهران','چهارمحال و بختیاری','خراسان جنوبی',
  'خراسان رضوی','خراسان شمالی','خوزستان','زنجان','سمنان',
  'سیستان و بلوچستان','فارس','قزوین','قم','کردستان',
  'کرمان','کرمانشاه','کهگیلویه و بویراحمد','گلستان','گیلان',
  'لرستان','مازندران','مرکزی','هرمزگان','همدان','یزد',
]

// ─── Section wrapper ──────────────────────────────────────────
function Section({ title, icon, color = '#10b981', children }: {
  title: string; icon: string; color?: string; children: React.ReactNode
}) {
  return (
    <div style={{ background: '#111a15', border: `1px solid ${hexToRgba(color, 0.15)}`, borderRadius: 18, padding: '20px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: hexToRgba(color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`ti ${icon}`} style={{ fontSize: 17, color }} />
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

// ─── Field ────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: '#0a0f0d', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10, padding: '10px 12px', color: '#e2e8f0',
  fontSize: 13, fontFamily: 'inherit', outline: 'none',
}

// ─── Club Search ──────────────────────────────────────────────
function ClubSearch({
  value, manualValue,
  onSelect, onManual,
}: {
  value?: string
  manualValue?: string
  onSelect: (clubId: string, name: string) => void
  onManual: (name: string) => void
}) {
  const [q, setQ]           = useState('')
  const [clubs, setClubs]   = useState<Club[]>([])
  const [open, setOpen]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [useManual, setUseManual] = useState(false)
  const [manual, setManual] = useState(manualValue ?? '')
  const timer = useRef<NodeJS.Timeout>()

  const search = async (v: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/user/profile/clubs?q=${encodeURIComponent(v)}`)
      const j = await res.json()
      setClubs(Array.isArray(j) ? j : [])
    } catch { setClubs([]) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    clearTimeout(timer.current)
    if (q.length < 1) { search(''); return }
    timer.current = setTimeout(() => search(q), 400)
  }, [q])

  useEffect(() => { search('') }, [])

  if (useManual) return (
    <div>
      <input
        value={manual}
        onChange={e => setManual(e.target.value)}
        placeholder="نام باشگاه را تایپ کنید"
        style={inputStyle}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => { onManual(manual); setUseManual(false) }} style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#10b981', border: 'none', color: '#0a0f0d', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
          ثبت
        </button>
        <button onClick={() => setUseManual(false)} style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
          انصراف
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <i className="ti ti-search" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#475569' }} />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="جستجو باشگاه..."
          style={{ ...inputStyle, paddingRight: 34 }}
        />
      </div>

      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#0f1a12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, marginTop: 4, maxHeight: 220, overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: '12px 14px', fontSize: 12, color: '#475569' }}>در حال جستجو...</div>
          )}
          {!loading && clubs.map(c => (
            <button key={c.id} onClick={() => { onSelect(c.id, c.name); setQ(c.name); setOpen(false) }} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{c.name}</span>
              <span style={{ fontSize: 10, color: '#475569' }}>{c.city} · {toFa(c.memberCount ?? 0)} عضو</span>
            </button>
          ))}
          <button onClick={() => { setOpen(false); setUseManual(true) }} style={{ width: '100%', padding: '10px 14px', background: 'rgba(16,185,129,0.05)', border: 'none', color: '#10b981', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'right' }}>
            <i className="ti ti-plus" style={{ marginLeft: 6, fontSize: 13 }} />
            باشگاه من در لیست نیست
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Bank card formatter ──────────────────────────────────────
function formatCard(v: string) {
  return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1-').replace(/-$/,'')
}

// ─── Page ─────────────────────────────────────────────────────
export default function ProfileMePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState<{ msg: string; type: 'success'|'error' } | null>(null)

  // editable fields
  const [bio, setBio]           = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity]         = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender]     = useState('')
  const [instagram, setInstagram] = useState('')
  const [bankCard, setBankCard] = useState('')
  const [bankOwner, setBankOwner] = useState('')
  const [clubName, setClubName] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`${API}/user/profile/me`, { headers: authHeader() })
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        if (!j) { router.push('/login'); return }
        setProfile(j)
        setBio(j.bio ?? '')
        setProvince(j.province ?? '')
        setCity(j.city ?? '')
        setBirthDate(j.birthDate ?? '')
        setGender(j.gender ?? '')
        setInstagram(j.instagram ?? '')
        setBankOwner(j.bankCardOwner ?? '')
        setClubName(j.clubNameManual ?? '')
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [])

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API}/user/profile`, {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, province, city, birthDate, gender, instagram }),
      })
      if (!res.ok) throw new Error()
      showToast('پروفایل ذخیره شد')
    } catch {
      showToast('خطا در ذخیره', 'error')
    } finally { setSaving(false) }
  }

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API}/user/profile/avatar`, { method: 'POST', headers: authHeader(), body: form })
    if (res.ok) {
      const j = await res.json()
      setProfile(p => p ? { ...p, avatar: j.url } : p)
      showToast('عکس پروفایل بروز شد')
    }
  }

  const handleBankCard = async () => {
    const clean = bankCard.replace(/-/g,'')
    if (clean.length !== 16) { showToast('شماره کارت باید ۱۶ رقم باشد', 'error'); return }
    const res = await fetch(`${API}/user/profile/bank-card`, {
      method: 'PUT',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ bankCard: clean, bankCardOwner: bankOwner }),
    })
    if (res.ok) showToast('کارت بانکی ثبت شد')
    else showToast('خطا در ثبت کارت', 'error')
  }

  const handleClub = async (clubId: string, name: string) => {
    setClubName(name)
    await fetch(`${API}/user/profile/club`, {
      method: 'PUT',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ clubId }),
    })
    showToast(`باشگاه ${name} انتخاب شد`)
  }

  const handleClubManual = async (name: string) => {
    setClubName(name)
    await fetch(`${API}/user/profile/club`, {
      method: 'PUT',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ clubNameManual: name }),
    })
    showToast(`باشگاه «${name}» ثبت شد`)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0f0d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Vazirmatn, Tahoma, sans-serif' }}>
      <i className="ti ti-loader-2" style={{ fontSize: 32, color: '#10b981' }} />
    </div>
  )

  if (!profile) return null

  const isVerified = profile.nationalIdVerified && profile.phoneVerified
  const fullName = `${profile.firstName} ${profile.lastName}`

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />

      <div style={{ minHeight: '100vh', background: '#0a0f0d', fontFamily: 'Vazirmatn, Tahoma, sans-serif', direction: 'rtl', position: 'relative' }}>

        {/* orbs */}
        <div style={{ position: 'fixed', width: 400, height: 400, background: 'radial-gradient(circle,rgba(16,185,129,0.12) 0%,transparent 70%)', top: -100, right: -80, filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '0 0 100px' }}>

          {/* ── Cover & avatar ── */}
          <div style={{ height: 140, background: 'linear-gradient(160deg,rgba(16,185,129,0.2) 0%,#0a0f0d 100%)', position: 'relative' }}>
            <button onClick={() => router.push('/dashboard')} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}>
              <i className="ti ti-arrow-right" style={{ fontSize: 18 }} />
            </button>
          </div>

          <div style={{ padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: -40, marginBottom: 20 }}>
              {/* avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid #0a0f0d', overflow: 'hidden', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#0a0f0d' }}>
                  {profile.avatar
                    ? <img src={profile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : fullName.trim()[0]
                  }
                </div>
                <button onClick={() => fileRef.current?.click()} style={{ position: 'absolute', bottom: 2, left: 2, width: 22, height: 22, borderRadius: '50%', background: '#10b981', border: '2px solid #0a0f0d', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <i className="ti ti-camera" style={{ fontSize: 11, color: '#0a0f0d' }} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
              </div>

              <div style={{ paddingBottom: 4, flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{fullName}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, color: '#64748b' }}>{profile.phone}</span>
                  {isVerified
                    ? <span style={{ fontSize: 9, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="ti ti-shield-check" style={{ fontSize: 10 }} />احراز شده
                      </span>
                    : <button onClick={() => router.push('/profile/verify')} style={{ fontSize: 9, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 20, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="ti ti-alert-triangle" style={{ fontSize: 10 }} />احراز هویت کنید
                      </button>
                  }
                </div>
              </div>
            </div>

            {/* ── وضعیت احراز هویت ── */}
            {!isVerified && (
              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <i className="ti ti-shield-off" style={{ fontSize: 24, color: '#f59e0b', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24', marginBottom: 4 }}>هویت تأیید نشده</div>
                  <div style={{ fontSize: 11, color: '#92400e', lineHeight: 1.6 }}>برای رزرو میز و خرید و فروش باید احراز هویت کنید</div>
                </div>
                <button onClick={() => router.push('/profile/verify')} style={{ background: '#f59e0b', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#000', fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0 }}>
                  احراز هویت
                </button>
              </div>
            )}

            {/* ── اطلاعات پایه ── */}
            <Section title="اطلاعات شخصی" icon="ti-user">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                <Field label="نام">
                  <input value={profile.firstName} disabled style={{ ...inputStyle, opacity: 0.6 }} />
                </Field>
                <Field label="نام خانوادگی">
                  <input value={profile.lastName} disabled style={{ ...inputStyle, opacity: 0.6 }} />
                </Field>
              </div>
              <Field label="بیوگرافی">
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="چند جمله درباره خودت..." style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                <Field label="جنسیت">
                  <select value={gender} onChange={e => setGender(e.target.value)} style={{ ...inputStyle, appearance: 'none' as any }}>
                    <option value="">انتخاب کنید</option>
                    <option value="male">مرد</option>
                    <option value="female">زن</option>
                  </select>
                </Field>
                <Field label="تاریخ تولد">
                  <input value={birthDate} onChange={e => setBirthDate(e.target.value)} placeholder="۱۳۷۰/۰۱/۰۱" style={inputStyle} />
                </Field>
              </div>
              <Field label="اینستاگرام">
                <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/..." style={inputStyle} />
              </Field>
            </Section>

            {/* ── موقعیت ── */}
            <Section title="موقعیت" icon="ti-map-pin" color="#06b6d4">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                <Field label="استان">
                  <select value={province} onChange={e => setProvince(e.target.value)} style={{ ...inputStyle, appearance: 'none' as any }}>
                    <option value="">انتخاب استان</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="شهر">
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="نام شهر" style={inputStyle} />
                </Field>
              </div>
            </Section>

            {/* ── باشگاه ── */}
            <Section title="باشگاه" icon="ti-building-store" color="#a78bfa">
              <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 12px', lineHeight: 1.6 }}>
                باشگاهی که در آن بازی می‌کنید را انتخاب کنید
              </p>
              {clubName && (
                <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ti ti-check" style={{ fontSize: 14 }} />
                  {clubName}
                </div>
              )}
              <ClubSearch
                value={profile.clubId}
                manualValue={profile.clubNameManual}
                onSelect={handleClub}
                onManual={handleClubManual}
              />
            </Section>

            {/* ── کارت بانکی ── */}
            <Section title="کارت بانکی" icon="ti-credit-card" color="#f59e0b">
              <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 12px', lineHeight: 1.6 }}>
                برای لغو رزرو و تسویه حساب — کارت باید به نام خودتان باشد
              </p>
              {profile.bankCard && (
                <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '8px 14px', marginBottom: 12, fontSize: 13, color: '#fbbf24', fontFamily: 'monospace', letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ti ti-credit-card" style={{ fontSize: 16 }} />
                  {profile.bankCard}
                </div>
              )}
              <Field label="شماره کارت">
                <input
                  value={bankCard}
                  onChange={e => setBankCard(formatCard(e.target.value))}
                  placeholder="---- ---- ---- ----"
                  inputMode="numeric"
                  style={{ ...inputStyle, letterSpacing: 3, direction: 'ltr', textAlign: 'center' }}
                />
              </Field>
              <Field label="نام صاحب کارت">
                <input value={bankOwner} onChange={e => setBankOwner(e.target.value)} placeholder="نام و نام خانوادگی" style={inputStyle} />
              </Field>
              <button onClick={handleBankCard} style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                ثبت کارت
              </button>
            </Section>

            {/* ── دسترسی‌ها ── */}
            <Section title="دسترسی‌ها" icon="ti-lock-open" color="#10b981">
              {[
                { label: 'رزرو میز', ok: isVerified, icon: 'ti-table' },
                { label: 'خرید و فروش', ok: isVerified, icon: 'ti-shopping-bag' },
                { label: 'مشاهده استوری', ok: isVerified, icon: 'ti-eye' },
                { label: 'ثبت آگهی', ok: isVerified, icon: 'ti-plus' },
                { label: 'پروفایل عمومی', ok: true, icon: 'ti-user' },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <i className={`ti ${f.icon}`} style={{ fontSize: 16, color: f.ok ? '#10b981' : '#334155', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: f.ok ? '#94a3b8' : '#334155', flex: 1 }}>{f.label}</span>
                  {f.ok
                    ? <i className="ti ti-check" style={{ fontSize: 14, color: '#10b981' }} />
                    : <span style={{ fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', borderRadius: 20, padding: '2px 8px' }}>نیاز به احراز</span>
                  }
                </div>
              ))}
            </Section>

            {/* ── Save button ── */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: saving ? '#1a2e24' : '#10b981', color: saving ? '#2d4a38' : '#0a0f0d', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: saving ? 'none' : '0 4px 16px rgba(16,185,129,0.3)' }}>
              {saving
                ? <><i className="ti ti-loader-2" style={{ fontSize: 16 }} />در حال ذخیره...</>
                : <><i className="ti ti-device-floppy" style={{ fontSize: 16 }} />ذخیره پروفایل</>
              }
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'success' ? '#10b981' : '#ef4444', color: toast.type === 'success' ? '#0a0f0d' : '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'Vazirmatn, Tahoma, sans-serif', padding: '10px 24px', borderRadius: 24, zIndex: 100, whiteSpace: 'nowrap', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
            {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
          </div>
        )}
      </div>
    </>
  )
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import ProvinceCitySelect from '../../../components/ProvinceCitySelect'
import { useRouter, useSearchParams } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────
type RoleValue =
  | 'user' | 'player' | 'coach' | 'referee'
  | 'technician' | 'seller' | 'manufacturer' | 'club_owner'

interface RoleRequest {
  id: string
  role: RoleValue
  status: 'pending' | 'approved' | 'rejected'
}

interface ProfileField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'url'
  placeholder: string
  options?: string[]
  required: boolean
}

interface RoleMeta {
  value: RoleValue
  label: string
  icon: string
  color: string
  description: string
  profileFields: ProfileField[]
}

// ─── Helpers ──────────────────────────────────────────────────
function toFarsiDigits(n: number | string): string {
  const fa = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹']
  return String(n).replace(/\d/g, d => fa[+d] ?? d)
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function authHeader(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ─── Role definitions ─────────────────────────────────────────
const ROLES: RoleMeta[] = [
  {
    value: 'user', label: 'کاربر عادی', icon: 'ti-user', color: 'rgba(0,0,0,0.50)',
    description: 'مشاهده و رزرو میز',
    profileFields: [
      { key: 'displayName', label: 'نام نمایشی', type: 'text', placeholder: 'نام و نام‌خانوادگی', required: true },
      { key: 'bio', label: 'معرفی کوتاه', type: 'textarea', placeholder: 'چند جمله درباره خودت...', required: false },
    ],
  },
  {
    value: 'player', label: 'بازیکن رنکینگی', icon: 'ti-chart-bar', color: '#C7A66A',
    description: 'رنکینگ ملی بیلیارد',
    profileFields: [
      { key: 'displayName', label: 'نام کامل', type: 'text', placeholder: 'نام و نام‌خانوادگی', required: true },
      { key: 'specialty', label: 'تخصص', type: 'select', placeholder: '', options: ['اسنوکر', 'پول', 'کارامبول', 'هندیکپ'], required: true },
      { key: 'nationalRank', label: 'رتبه ملی', type: 'number', placeholder: 'مثلاً ۱۲', required: false },
      { key: 'yearsActive', label: 'سال‌های فعالیت', type: 'number', placeholder: 'مثلاً ۸', required: false },
      { key: 'club', label: 'باشگاه فعلی', type: 'text', placeholder: 'نام باشگاه', required: false },
      { key: 'bio', label: 'بیوگرافی ورزشی', type: 'textarea', placeholder: 'افتخارات، سابقه بازی...', required: false },
      { key: 'instagram', label: 'اینستاگرام', type: 'url', placeholder: 'https://instagram.com/...', required: false },
    ],
  },
  {
    value: 'coach', label: 'مربی', icon: 'ti-school', color: '#a78bfa',
    description: 'تدریس و آموزش بیلیارد',
    profileFields: [
      { key: 'displayName', label: 'نام کامل', type: 'text', placeholder: 'نام و نام‌خانوادگی', required: true },
      { key: 'specialty', label: 'رشته تدریس', type: 'select', placeholder: '', options: ['اسنوکر', 'پول', 'کارامبول', 'همه رشته‌ها'], required: true },
      { key: 'licenseLevel', label: 'درجه مربیگری', type: 'select', placeholder: '', options: ['درجه ۳', 'درجه ۲', 'درجه ۱', 'ملی'], required: false },
      { key: 'experience', label: 'سابقه تدریس (سال)', type: 'number', placeholder: 'مثلاً ۵', required: true },
      { key: 'location', label: 'شهر فعالیت', type: 'text', placeholder: 'تهران، اصفهان...', required: true },
      { key: 'sessionPrice', label: 'هزینه هر جلسه (تومان)', type: 'number', placeholder: 'مثلاً ۵۰۰۰۰۰', required: false },
      { key: 'bio', label: 'درباره من', type: 'textarea', placeholder: 'روش تدریس، سوابق، دستاوردها...', required: false },
    ],
  },
  {
    value: 'referee', label: 'داور', icon: 'ti-scale', color: '#f59e0b',
    description: 'داوری مسابقات رسمی',
    profileFields: [
      { key: 'displayName', label: 'نام کامل', type: 'text', placeholder: 'نام و نام‌خانوادگی', required: true },
      { key: 'licenseLevel', label: 'درجه داوری', type: 'select', placeholder: '', options: ['درجه ۳', 'درجه ۲', 'درجه ۱', 'بین‌المللی'], required: true },
      { key: 'specialty', label: 'رشته داوری', type: 'select', placeholder: '', options: ['اسنوکر', 'پول', 'کارامبول', 'همه رشته‌ها'], required: true },
      { key: 'location', label: 'شهر', type: 'text', placeholder: 'محل اقامت', required: true },
      { key: 'matchCount', label: 'تعداد مسابقات داوری‌شده', type: 'number', placeholder: 'مثلاً ۴۰', required: false },
      { key: 'bio', label: 'سوابق داوری', type: 'textarea', placeholder: 'مسابقات مهم، لیگ‌ها...', required: false },
    ],
  },
  {
    value: 'technician', label: 'خدمات فنی', icon: 'ti-tool', color: '#06b6d4',
    description: 'تعمیر و نگهداری تجهیزات',
    profileFields: [
      { key: 'displayName', label: 'نام کامل', type: 'text', placeholder: 'نام و نام‌خانوادگی', required: true },
      { key: 'services', label: 'خدمات', type: 'select', placeholder: '', options: ['تعمیر میز', 'تعویض روکش', 'تراز کردن', 'لاک‌زنی', 'همه موارد'], required: true },
      { key: 'location', label: 'محدوده سرویس', type: 'text', placeholder: 'تهران — کرج', required: true },
      { key: 'phone', label: 'شماره تماس', type: 'text', placeholder: '۰۹۱۲...', required: true },
      { key: 'bio', label: 'معرفی', type: 'textarea', placeholder: 'خدمات، تجربه، نمونه کارها...', required: false },
    ],
  },
  {
    value: 'seller', label: 'فروشنده', icon: 'ti-shopping-bag', color: '#f97316',
    description: 'فروش تجهیزات بیلیارد',
    profileFields: [
      { key: 'displayName', label: 'نام فروشگاه', type: 'text', placeholder: 'نام برند یا فروشگاه', required: true },
      { key: 'location', label: 'آدرس / شهر', type: 'text', placeholder: 'تهران، بازار بزرگ...', required: true },
      { key: 'phone', label: 'شماره تماس', type: 'text', placeholder: '۰۲۱...', required: true },
      { key: 'website', label: 'وب‌سایت / اینستاگرام', type: 'url', placeholder: 'https://...', required: false },
      { key: 'bio', label: 'معرفی فروشگاه', type: 'textarea', placeholder: 'محصولات، برندها، خدمات...', required: false },
    ],
  },
  {
    value: 'manufacturer', label: 'تولیدکننده', icon: 'ti-building-factory', color: '#ef4444',
    description: 'تولید تجهیزات بیلیارد',
    profileFields: [
      { key: 'displayName', label: 'نام برند / کارخانه', type: 'text', placeholder: 'نام رسمی', required: true },
      { key: 'founded', label: 'سال تأسیس', type: 'number', placeholder: 'مثلاً ۱۳۸۵', required: false },
      { key: 'location', label: 'محل تولید', type: 'text', placeholder: 'استان / شهر', required: true },
      { key: 'website', label: 'وب‌سایت', type: 'url', placeholder: 'https://...', required: false },
      { key: 'bio', label: 'درباره برند', type: 'textarea', placeholder: 'تاریخچه، ظرفیت تولید، افتخارات...', required: false },
    ],
  },
  {
    value: 'club_owner', label: 'باشگاه‌دار', icon: 'ti-building-store', color: '#3b82f6',
    description: 'مدیریت باشگاه بیلیارد',
    profileFields: [
      { key: 'displayName', label: 'نام باشگاه', type: 'text', placeholder: 'نام رسمی باشگاه', required: true },
      { key: 'location', label: 'آدرس', type: 'text', placeholder: 'شهر — محله', required: true },
      { key: 'tableCount', label: 'تعداد میزها', type: 'number', placeholder: 'مثلاً ۶', required: true },
      { key: 'phone', label: 'شماره باشگاه', type: 'text', placeholder: '۰۲۱...', required: true },
      { key: 'instagram', label: 'اینستاگرام', type: 'url', placeholder: 'https://instagram.com/...', required: false },
      { key: 'bio', label: 'معرفی باشگاه', type: 'textarea', placeholder: 'امکانات، ساعت‌کاری، خدمات...', required: false },
    ],
  },
]

const ROLE_MAP = Object.fromEntries(ROLES.map(r => [r.value, r])) as Record<RoleValue, RoleMeta>

// ─── Field component ──────────────────────────────────────────
function Field({
  field,
  value,
  onChange,
}: {
  field: ProfileField
  value: string
  onChange: (v: string) => void
}) {
  const base: React.CSSProperties = {
    width: '100%', background: '#F7F7F5',
    border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10,
    padding: '10px 12px', color: '#111111', fontSize: 15,
    fontFamily: 'Vazirmatn, Tahoma, sans-serif', outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box',
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, color: 'rgba(0,0,0,0.50)', marginBottom: 6 }}>
        {field.label}
        {field.required && <span style={{ color: '#ef4444', marginRight: 4 }}>*</span>}
      </label>
      {field.type === 'textarea' ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          style={{ ...base, resize: 'vertical', minHeight: 80 }}
        />
      ) : field.type === 'select' ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ ...base, appearance: 'none' as any }}
        >
          <option value="">انتخاب کنید...</option>
          {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          style={base}
        />
      )}
    </div>
  )
}

// ─── RoleForm ─────────────────────────────────────────────────
function RoleForm({ role, onSaved }: { role: RoleMeta; onSaved: () => void }) {
  const [data, setData]       = useState<Record<string, string>>({})
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/roles/${role.value}/profile`, {
      headers: authHeader(),
    })
      .then(r => r.json())
      .then(j => { if (j.profile) setData(j.profile) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [role.value])

  const handleSave = async () => {
    const missing = role.profileFields.filter(f => f.required && !data[f.key])
    if (missing.length > 0) return
    setSaving(true)
    await fetch(`${API}/roles/${role.value}/profile`, {
      method: 'PUT',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); onSaved() }, 1200)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(0,0,0,0.38)', fontSize: 14 }}>
      در حال بارگذاری...
    </div>
  )

  const filledCount = role.profileFields.filter(f => data[f.key]).length
  const pct = Math.round((filledCount / role.profileFields.length) * 100)

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>تکمیل پروفایل</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: role.color }}>{toFarsiDigits(pct)}٪</span>
        </div>
        <div style={{ height: 4, background: 'rgba(0,0,0,0.05)', borderRadius: 4 }}>
          <div style={{ height: '100%', borderRadius: 4, background: role.color, width: `${pct}%`, transition: 'width 0.3s' }} />
        </div>
      </div>

      {role.profileFields.map(f => (
        f.key === 'location' ? (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <ProvinceCitySelect
              cityLabel={f.label.includes('شهر') ? f.label : 'شهر'}
              required={f.required}
              value={{ province: data.province ?? '', city: data.location ?? '' }}
              onChange={v => setData(d => ({ ...d, province: v.province, location: v.city }))}
            />
          </div>
        ) : (
          <Field
            key={f.key}
            field={f}
            value={data[f.key] ?? ''}
            onChange={v => setData(d => ({ ...d, [f.key]: v }))}
          />
        )
      ))}

      <button
        onClick={handleSave}
        disabled={saving || saved}
        style={{
          width: '100%', padding: '13px', borderRadius: 12, border: 'none',
          background: saved ? '#C7A66A' : saving ? 'rgba(0,0,0,0.04)' : role.color,
          color: '#FFFFFF', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
          cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {saved
          ? <><i className="ti ti-check" style={{ fontSize: 18 }} aria-hidden="true" />ذخیره شد</>
          : saving
          ? <><i className="ti ti-loader-2" style={{ fontSize: 18 }} aria-hidden="true" />در حال ذخیره...</>
          : <><i className="ti ti-device-floppy" style={{ fontSize: 18 }} aria-hidden="true" />ذخیره پروفایل</>
        }
      </button>
    </div>
  )
}

// ─── Inner (needs useSearchParams) ───────────────────────────
function ProfileSetupInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const initRole     = (searchParams.get('role') ?? '') as RoleValue

  const [userRoles, setUserRoles] = useState<RoleRequest[]>([])
  const [activeTab, setActiveTab] = useState<RoleValue | null>(null)
  const [loading, setLoading]     = useState(true)
  const [toast, setToast]         = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/roles/my`, { headers: authHeader() })
      .then(r => r.ok ? r.json() : [])
      .then((data: RoleRequest[]) => {
        const approved = data.filter(r => r.status === 'approved')
        setUserRoles(approved)
        if (initRole && approved.find(r => r.role === initRole)) {
          setActiveTab(initRole)
        } else if (approved.length > 0) {
          const first = approved[0]
          if (first) setActiveTab(first.role)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Vazirmatn, Tahoma, sans-serif' }}>
      <div style={{ textAlign: 'center', color: 'rgba(0,0,0,0.45)', fontSize: 15 }}>
        <i className="ti ti-loader-2" style={{ fontSize: 31, color: '#C7A66A', display: 'block', marginBottom: 12 }} />
        در حال بارگذاری...
      </div>
    </div>
  )

  if (userRoles.length === 0) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Vazirmatn, Tahoma, sans-serif', direction: 'rtl' }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <i className="ti ti-lock" style={{ fontSize: 44, color: 'rgba(0,0,0,0.35)', display: 'block', marginBottom: 16 }} />
        <div style={{ color: '#111111', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>هنوز نقشی تأیید نشده</div>
        <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 15, marginBottom: 24, lineHeight: 1.7 }}>ابتدا نقش درخواست بدید و منتظر تأیید ادمین بمانید.</div>
        <button onClick={() => router.push('/profile/role')} style={{ background: '#C7A66A', color: '#FFFFFF', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
          درخواست نقش
        </button>
      </div>
    </div>
  )

  const activeMeta = activeTab ? ROLE_MAP[activeTab] : null

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'Vazirmatn, Tahoma, sans-serif', direction: 'rtl', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'fixed', width: 300, height: 300, background: 'radial-gradient(circle, rgba(199,166,106,0.15) 0%, transparent 70%)', top: -80, right: -60, pointerEvents: 'none', filter: 'blur(50px)', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '28px 16px 100px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <button onClick={() => router.push('/profile/role')} style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(0,0,0,0.50)' }}>
              <i className="ti ti-arrow-right" style={{ fontSize: 20 }} aria-hidden="true" />
            </button>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111111' }}>پروفایل کاری</div>
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>{toFarsiDigits(userRoles.length)} نقش تأیید‌شده</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {userRoles.map(ur => {
              const m = ROLE_MAP[ur.role]
              if (!m) return null
              const isActive = activeTab === ur.role
              return (
                <button key={ur.role} onClick={() => setActiveTab(ur.role)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, flexShrink: 0, border: `1px solid ${isActive ? hexToRgba(m.color, 0.5) : 'rgba(0,0,0,0.07)'}`, background: isActive ? hexToRgba(m.color, 0.12) : 'rgba(0,0,0,0.04)', color: isActive ? m.color : '#64748b', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <i className={`ti ${m.icon}`} style={{ fontSize: 17 }} aria-hidden="true" />
                  {m.label}
                </button>
              )
            })}
          </div>

          {/* Form */}
          {activeMeta && activeTab && (
            <div style={{ background: '#F7F7F5', border: `1px solid ${hexToRgba(activeMeta.color, 0.2)}`, borderRadius: 16, padding: '20px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: hexToRgba(activeMeta.color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`ti ${activeMeta.icon}`} style={{ fontSize: 20, color: activeMeta.color }} aria-hidden="true" />
                </span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111111' }}>{activeMeta.label}</div>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{activeMeta.description}</div>
                </div>
                <button onClick={() => router.push(`/profile/${activeTab}`)} style={{ marginRight: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: activeMeta.color, background: hexToRgba(activeMeta.color, 0.1), border: `1px solid ${hexToRgba(activeMeta.color, 0.3)}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <i className="ti ti-eye" style={{ fontSize: 14 }} aria-hidden="true" />
                  مشاهده صفحه
                </button>
              </div>
              <RoleForm role={activeMeta} onSaved={() => showToast(`پروفایل ${activeMeta.label} ذخیره شد`)} />
            </div>
          )}
        </div>

        {toast && (
          <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#C7A66A', color: '#FFFFFF', fontSize: 14, fontWeight: 700, fontFamily: 'Vazirmatn, Tahoma, sans-serif', padding: '10px 24px', borderRadius: 24, zIndex: 100, whiteSpace: 'nowrap' }}>
            ✓ {toast}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────
export default function ProfileSetupPage() {
  return (
    <Suspense>
      <ProfileSetupInner />
    </Suspense>
  )
}

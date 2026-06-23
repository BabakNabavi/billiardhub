'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ROLES, ROLE_MAP, RoleMeta, RoleValue, RoleRequest,
  toFarsiDigits, hexToRgba, STATUS_COLOR, STATUS_LABEL,
} from '@/lib/roles'

function authHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ─── Single field renderer ────────────────────────────────────
function Field({
  field,
  value,
  onChange,
}: {
  field: { key: string; label: string; type: string; placeholder: string; options?: string[]; required: boolean }
  value: string
  onChange: (v: string) => void
}) {
  const base: React.CSSProperties = {
    width: '100%', background: '#0a0f0d',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    padding: '10px 12px', color: '#e2e8f0', fontSize: 13,
    fontFamily: 'Vazirmatn, Tahoma, sans-serif', outline: 'none',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
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
        <select value={value} onChange={e => onChange(e.target.value)} style={{ ...base, appearance: 'none' }}>
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

// ─── Role form tab ────────────────────────────────────────────
function RoleForm({
  role,
  onSaved,
}: {
  role: RoleMeta
  onSaved: () => void
}) {
  const [data, setData] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/roles/${role.value}/profile`, {
      headers: authHeader() as Record<string, string>,
    })
      .then(r => r.json())
      .then(j => { if (j.profile) setData(j.profile) })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [role.value])

  const handleSave = async () => {
    // Validate required fields
    const missing = role.profileFields.filter(f => f.required && !data[f.key])
    if (missing.length > 0) return

    setSaving(true)
    await fetch(`/api/roles/${role.value}/profile`, {
      method: 'PUT',
      headers: {
        ...(authHeader() as Record<string, string>),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); onSaved() }, 1200)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569', fontSize: 12 }}>
      در حال بارگذاری...
    </div>
  )

  const filledCount = role.profileFields.filter(f => data[f.key]).length
  const pct = Math.round((filledCount / role.profileFields.length) * 100)

  return (
    <div>
      {/* Progress */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#64748b' }}>تکمیل پروفایل</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: role.color }}>
            {toFarsiDigits(pct)}٪
          </span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
          <div style={{
            height: '100%', borderRadius: 4,
            background: role.color,
            width: `${pct}%`, transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* Fields */}
      {role.profileFields.map(f => (
        <Field
          key={f.key}
          field={f}
          value={data[f.key] ?? ''}
          onChange={v => setData(d => ({ ...d, [f.key]: v }))}
        />
      ))}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || saved}
        style={{
          width: '100%', padding: '13px', borderRadius: 12, border: 'none',
          background: saved ? '#10b981' : saving ? '#1a2e24' : role.color,
          color: saved || !saving ? '#0a0f0d' : '#2d4a38',
          fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
          cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {saved
          ? <><i className="ti ti-check" style={{ fontSize: 16 }} />ذخیره شد</>
          : saving
            ? <><i className="ti ti-loader-2" style={{ fontSize: 16 }} />در حال ذخیره...</>
            : <><i className="ti ti-device-floppy" style={{ fontSize: 16 }} />ذخیره پروفایل</>
        }
      </button>
    </div>
  )
}

// ─── Inner component (needs useSearchParams) ──────────────────
function ProfileSetupInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initRole = (searchParams.get('role') ?? '') as RoleValue

  const [userRoles, setUserRoles] = useState<RoleRequest[]>([])
  const [activeTab, setActiveTab] = useState<RoleValue | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/roles', { headers: authHeader() as Record<string, string> })
      .then(r => r.json())
      .then(j => {
        const approved = (j.roles ?? []).filter((r: RoleRequest) => r.status === 'approved') as RoleRequest[]
        setUserRoles(approved)
        // Auto-select from URL param or first approved
        if (initRole && approved.find(r => r.role === initRole)) {
          setActiveTab(initRole)
        } else if (approved.length > 0) {
          const firstRole = approved[0]
          if (firstRole) setActiveTab(firstRole.role as RoleValue)
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#0a0f0d',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Vazirmatn, Tahoma, sans-serif',
    }}>
      <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13 }}>
        <i className="ti ti-loader-2" style={{ fontSize: 28, color: '#10b981', display: 'block', marginBottom: 12 }} />
        در حال بارگذاری...
      </div>
    </div>
  )

  if (userRoles.length === 0) return (
    <div style={{
      minHeight: '100vh', background: '#0a0f0d',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Vazirmatn, Tahoma, sans-serif', direction: 'rtl',
    }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <i className="ti ti-lock" style={{ fontSize: 40, color: '#334155', display: 'block', marginBottom: 16 }} />
        <div style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
          هنوز نقشی تأیید نشده
        </div>
        <div style={{ color: '#64748b', fontSize: 13, marginBottom: 24, lineHeight: 1.7 }}>
          ابتدا نقش درخواست بدید و منتظر تأیید ادمین بمانید.
        </div>
        <button onClick={() => router.push('/profile/role')} style={{
          background: '#10b981', color: '#0a0f0d', border: 'none',
          borderRadius: 12, padding: '12px 24px', fontSize: 13, fontWeight: 700,
          fontFamily: 'inherit', cursor: 'pointer',
        }}>
          درخواست نقش
        </button>
      </div>
    </div>
  )

  const activeMeta = activeTab ? ROLE_MAP[activeTab] : null

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <div style={{
        minHeight: '100vh', background: '#0a0f0d',
        fontFamily: 'Vazirmatn, Tahoma, sans-serif', direction: 'rtl',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* orbs */}
        <div style={{ position: 'fixed', width: 300, height: 300, background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', top: -80, right: -60, pointerEvents: 'none', filter: 'blur(50px)', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '28px 16px 100px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <button onClick={() => router.push('/profile/role')} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#94a3b8',
            }}>
              <i className="ti ti-arrow-right" style={{ fontSize: 18 }} aria-hidden="true" />
            </button>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>پروفایل کاری</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                {toFarsiDigits(userRoles.length)} نقش تأیید‌شده
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{
            display: 'flex', gap: 6, marginBottom: 20,
            overflowX: 'auto', paddingBottom: 4,
            scrollbarWidth: 'none',
          }}>
            {userRoles.map(ur => {
              const m = ROLE_MAP[ur.role as RoleValue]
              const isActive = activeTab === ur.role
              return (
                <button
                  key={ur.role}
                  onClick={() => setActiveTab(ur.role as RoleValue)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 10, flexShrink: 0,
                    border: `1px solid ${isActive ? hexToRgba(m.color, 0.5) : 'rgba(255,255,255,0.07)'}`,
                    background: isActive ? hexToRgba(m.color, 0.12) : '#111a15',
                    color: isActive ? m.color : '#64748b',
                    fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <i className={`ti ${m.icon}`} style={{ fontSize: 15 }} aria-hidden="true" />
                  {m.label}
                </button>
              )
            })}
          </div>

          {/* Form */}
          {activeMeta && activeTab && (
            <div style={{
              background: '#111a15', border: `1px solid ${hexToRgba(activeMeta.color, 0.2)}`,
              borderRadius: 16, padding: '20px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: hexToRgba(activeMeta.color, 0.12),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`ti ${activeMeta.icon}`} style={{ fontSize: 18, color: activeMeta.color }} aria-hidden="true" />
                </span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{activeMeta.label}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{activeMeta.description}</div>
                </div>
                <button
                  onClick={() => router.push(`/profile/${activeTab}`)}
                  style={{
                    marginRight: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 10, color: activeMeta.color, background: hexToRgba(activeMeta.color, 0.1),
                    border: `1px solid ${hexToRgba(activeMeta.color, 0.3)}`, borderRadius: 8,
                    padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <i className="ti ti-eye" style={{ fontSize: 12 }} aria-hidden="true" />
                  مشاهده صفحه
                </button>
              </div>

              <RoleForm
                role={activeMeta}
                onSaved={() => showToast(`پروفایل ${activeMeta.label} ذخیره شد`)}
              />
            </div>
          )}
        </div>

        {toast && (
          <div style={{
            position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
            background: '#10b981', color: '#0a0f0d', fontSize: 12, fontWeight: 700,
            fontFamily: 'Vazirmatn, Tahoma, sans-serif', padding: '10px 24px',
            borderRadius: 24, zIndex: 100, whiteSpace: 'nowrap',
          }}>
            ✓ {toast}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Page export ──────────────────────────────────────────────
export default function ProfileSetupPage() {
  return (
    <Suspense>
      <ProfileSetupInner />
    </Suspense>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ROLE_MAP, RoleValue, toFarsiDigits, hexToRgba } from '@/lib/roles'

// ─── Types ────────────────────────────────────────────────────
interface PublicRole {
  role: RoleValue
  profile: Record<string, string>
}

interface PublicUser {
  id: string
  name?: string
  mobile?: string
  avatarUrl?: string
  roles: PublicRole[]
}

// ─── Field renderer (read-only) ───────────────────────────────
function ProfileField({ label, value, isUrl }: { label: string; value: string; isUrl?: boolean }) {
  if (!value) return null
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>{label}</div>
      {isUrl ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 13, color: '#10b981', wordBreak: 'break-all' }}
        >
          {value}
        </a>
      ) : (
        <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6 }}>{value}</div>
      )}
    </div>
  )
}

// ─── Role tab content ─────────────────────────────────────────
function RoleTabContent({ role, profile }: { role: RoleValue; profile: Record<string, string> }) {
  const meta = ROLE_MAP[role]
  const fields = meta.profileFields.filter(f => f.key !== 'displayName' && f.key !== 'bio')

  return (
    <div style={{
      background: '#111a15',
      border: `1px solid ${hexToRgba(meta.color, 0.2)}`,
      borderRadius: 16, padding: '20px 16px',
    }}>
      {/* Role header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{
          width: 40, height: 40, borderRadius: 11,
          background: hexToRgba(meta.color, 0.14),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className={`ti ${meta.icon}`} style={{ fontSize: 20, color: meta.color }} aria-hidden="true" />
        </span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{meta.label}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{meta.description}</div>
        </div>
        <div style={{
          marginRight: 'auto',
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 9, color: '#10b981',
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 20, padding: '3px 8px',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          تأیید شده
        </div>
      </div>

      {/* Bio — full width */}
      {profile.bio && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: '12px 14px', marginBottom: 16,
          fontSize: 13, color: '#94a3b8', lineHeight: 1.8,
        }}>
          {profile.bio}
        </div>
      )}

      {/* Key-value fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        {fields.map(f => {
          if (!profile[f.key]) return null
          return (
            <ProfileField
              key={f.key}
              label={f.label}
              value={profile[f.key]}
              isUrl={f.type === 'url'}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────
function Avatar({ name, url, size = 72 }: { name?: string; url?: string; size?: number }) {
  const initials = name
    ? name.trim().split(' ').map(p => p[0]).slice(0, 2).join('')
    : '?'

  if (url) {
    return (
      <img
        src={url}
        alt={name ?? ''}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.3, fontWeight: 700, color: '#0a0f0d',
    }}>
      {initials}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────
export default function PublicProfilePage() {
  const { userId } = useParams() as { userId: string }
  const router = useRouter()

  const [user, setUser]         = useState<PublicUser | null>(null)
  const [activeTab, setActiveTab] = useState<RoleValue | null>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/users/${userId}/public`)
      .then(r => {
        if (!r.ok) { setNotFound(true); return null }
        return r.json()
      })
      .then(j => {
        if (!j) return
        setUser(j.user)
        if (j.user.roles?.length > 0) setActiveTab(j.user.roles[0].role)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [userId])

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

  if (notFound || !user) return (
    <div style={{
      minHeight: '100vh', background: '#0a0f0d',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Vazirmatn, Tahoma, sans-serif', direction: 'rtl',
    }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <i className="ti ti-user-off" style={{ fontSize: 40, color: '#334155', display: 'block', marginBottom: 16 }} />
        <div style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>کاربر یافت نشد</div>
        <button onClick={() => router.back()} style={{
          background: '#111a15', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '10px 20px', color: '#94a3b8',
          fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', marginTop: 12,
        }}>
          بازگشت
        </button>
      </div>
    </div>
  )

  const activeRoleData = user.roles.find(r => r.role === activeTab)
  const displayName = activeRoleData?.profile?.displayName ?? user.name ?? 'کاربر بیلیارد پلاس'

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <div style={{
        minHeight: '100vh', background: '#0a0f0d',
        fontFamily: 'Vazirmatn, Tahoma, sans-serif', direction: 'rtl',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* orb */}
        <div style={{
          position: 'fixed', width: 360, height: 360,
          background: activeTab
            ? `radial-gradient(circle, ${hexToRgba(ROLE_MAP[activeTab].color, 0.14)} 0%, transparent 70%)`
            : 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
          top: -100, right: -80, filter: 'blur(55px)', zIndex: 0, pointerEvents: 'none',
          transition: 'background 0.5s',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '0 0 80px' }}>

          {/* Cover / hero */}
          <div style={{
            height: 160,
            background: activeTab
              ? `linear-gradient(160deg, ${hexToRgba(ROLE_MAP[activeTab].color, 0.25)} 0%, #0a0f0d 100%)`
              : 'linear-gradient(160deg, rgba(16,185,129,0.2) 0%, #0a0f0d 100%)',
            position: 'relative',
            transition: 'background 0.5s',
          }}>
            <button
              onClick={() => router.back()}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#94a3b8',
              }}
            >
              <i className="ti ti-arrow-right" style={{ fontSize: 18 }} aria-hidden="true" />
            </button>
          </div>

          {/* Profile info */}
          <div style={{ padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: -36, marginBottom: 20 }}>
              <div style={{
                border: '3px solid #0a0f0d', borderRadius: '50%',
                background: '#0a0f0d', flexShrink: 0,
              }}>
                <Avatar name={displayName} url={user.avatarUrl} size={72} />
              </div>
              <div style={{ paddingBottom: 4 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{displayName}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {user.roles.map(r => {
                    const m = ROLE_MAP[r.role]
                    return (
                      <span key={r.role} style={{
                        fontSize: 10, color: m.color,
                        background: hexToRgba(m.color, 0.1),
                        border: `1px solid ${hexToRgba(m.color, 0.3)}`,
                        borderRadius: 20, padding: '2px 8px',
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}>
                        <i className={`ti ${m.icon}`} style={{ fontSize: 10 }} aria-hidden="true" />
                        {m.label}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Role tabs */}
            {user.roles.length > 1 && (
              <div style={{
                display: 'flex', gap: 6, marginBottom: 16,
                overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none',
              }}>
                {user.roles.map(r => {
                  const m = ROLE_MAP[r.role]
                  const isActive = activeTab === r.role
                  return (
                    <button
                      key={r.role}
                      onClick={() => setActiveTab(r.role)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 10, flexShrink: 0,
                        border: `1px solid ${isActive ? hexToRgba(m.color, 0.5) : 'rgba(255,255,255,0.07)'}`,
                        background: isActive ? hexToRgba(m.color, 0.12) : '#111a15',
                        color: isActive ? m.color : '#64748b',
                        fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      <i className={`ti ${m.icon}`} style={{ fontSize: 14 }} aria-hidden="true" />
                      {m.label}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Active role profile */}
            {activeTab && activeRoleData && (
              <RoleTabContent role={activeTab} profile={activeRoleData.profile} />
            )}

            {user.roles.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#475569', fontSize: 13 }}>
                این کاربر هنوز پروفایلی تکمیل نکرده است.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

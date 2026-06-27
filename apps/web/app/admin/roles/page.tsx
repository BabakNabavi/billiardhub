'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_MAP, RoleValue, RoleStatus, toFarsiDigits, hexToRgba, STATUS_COLOR, STATUS_LABEL } from '@/lib/roles'

function authHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

interface RoleRequest {
  id: string
  user_id: string
  role: RoleValue
  status: RoleStatus
  doc_url?: string
  rejection_note?: string
  requested_at: string
  reviewed_at?: string
  users?: { mobile: string; name?: string }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'همین الان'
  if (h < 24) return `${toFarsiDigits(h)} ساعت پیش`
  return `${toFarsiDigits(Math.floor(h / 24))} روز پیش`
}

// ─── Request card ─────────────────────────────────────────────
function RequestCard({
  req,
  onAction,
}: {
  req: RoleRequest
  onAction: (id: string, action: 'approve' | 'reject', note?: string) => void
}) {
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote]           = useState('')
  const [busy, setBusy]           = useState(false)
  const meta = ROLE_MAP[req.role]

  const act = async (action: 'approve' | 'reject') => {
    setBusy(true)
    await onAction(req.id, action, action === 'reject' ? note : undefined)
    setBusy(false)
    setRejecting(false)
  }

  return (
    <div style={{
      background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 14, padding: '16px', marginBottom: 12,
    }}>
      {/* Row 1: user + role */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: hexToRgba(meta.color, 0.12),
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <i className={`ti ${meta.icon}`} style={{ fontSize: 22, color: meta.color }} aria-hidden="true" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111111', marginBottom: 2 }}>
            {req.users?.name ?? req.users?.mobile ?? req.user_id.slice(0, 8)}
          </div>
          <div style={{ fontSize: 13, color: meta.color }}>{meta.label}</div>
        </div>
        <div style={{
          fontSize: 12, color: STATUS_COLOR[req.status],
          background: hexToRgba(STATUS_COLOR[req.status], 0.1),
          border: `1px solid ${hexToRgba(STATUS_COLOR[req.status], 0.3)}`,
          borderRadius: 20, padding: '3px 10px',
        }}>
          {STATUS_LABEL[req.status]}
        </div>
      </div>

      {/* Time + doc */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.38)' }}>
          <i className="ti ti-clock" style={{ fontSize: 13, marginLeft: 3 }} aria-hidden="true" />
          {timeAgo(req.requested_at)}
        </span>
        {req.doc_url && (
          <a
            href={req.doc_url}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: 12, color: '#C7A66A', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
          >
            <i className="ti ti-file" style={{ fontSize: 13 }} aria-hidden="true" />
            مشاهده مدرک
          </a>
        )}
        {meta.requiresDoc && !req.doc_url && (
          <span style={{ fontSize: 12, color: '#f59e0b' }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: 13, marginLeft: 3 }} aria-hidden="true" />
            مدرک آپلود نشده
          </span>
        )}
      </div>

      {/* Actions (only for pending) */}
      {req.status === 'pending' && (
        <>
          {!rejecting ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => act('approve')}
                disabled={busy}
                style={{
                  flex: 1, padding: '9px', borderRadius: 10, border: 'none',
                  background: busy ? 'rgba(0,0,0,0.04)' : '#C7A66A',
                  color: busy ? 'rgba(0,0,0,0.35)' : '#FFFFFF',
                  fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: busy ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <i className="ti ti-check" style={{ fontSize: 16 }} aria-hidden="true" />
                تأیید
              </button>
              <button
                onClick={() => setRejecting(true)}
                style={{
                  flex: 1, padding: '9px', borderRadius: 10,
                  border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)',
                  color: '#ef4444', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <i className="ti ti-x" style={{ fontSize: 16 }} aria-hidden="true" />
                رد کردن
              </button>
            </div>
          ) : (
            <div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="دلیل رد (اختیاری)"
                rows={2}
                style={{
                  width: '100%', background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 10, padding: '8px 12px', color: '#111111', fontSize: 14,
                  fontFamily: 'inherit', resize: 'none', marginBottom: 8, outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => act('reject')}
                  disabled={busy}
                  style={{
                    flex: 1, padding: '9px', borderRadius: 10, border: 'none',
                    background: '#ef4444', color: '#fff',
                    fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >
                  تأیید رد
                </button>
                <button
                  onClick={() => setRejecting(false)}
                  style={{
                    flex: 1, padding: '9px', borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.08)', background: 'transparent',
                    color: 'rgba(0,0,0,0.45)', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >
                  انصراف
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Rejection note */}
      {req.status === 'rejected' && req.rejection_note && (
        <div style={{
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#fca5a5',
        }}>
          {req.rejection_note}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────
export default function AdminRolesPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<RoleRequest[]>([])
  const [filter, setFilter]     = useState<RoleStatus>('pending')
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState<string | null>(null)

  const load = async (status: RoleStatus) => {
    setLoading(true)
    const res = await fetch(`/api/admin/roles?status=${status}`, {
      headers: authHeader() as Record<string, string>,
    })
    if (!res.ok) { router.push('/dashboard'); return }
    const j = await res.json()
    setRequests(j.requests ?? [])
    setLoading(false)
  }

  useEffect(() => { load(filter) }, [filter])

  const handleAction = async (id: string, action: 'approve' | 'reject', note?: string) => {
    await fetch('/api/admin/roles', {
      method: 'PATCH',
      headers: {
        ...(authHeader() as Record<string, string>),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, action, note }),
    })
    setToast(action === 'approve' ? 'نقش تأیید شد' : 'نقش رد شد')
    setTimeout(() => setToast(null), 2000)
    load(filter)
  }

  const tabs: { status: RoleStatus; label: string }[] = [
    { status: 'pending',  label: 'در انتظار' },
    { status: 'approved', label: 'تأیید‌شده' },
    { status: 'rejected', label: 'رد‌شده' },
  ]

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <div style={{
        minHeight: '100vh', background: '#F7F7F5',
        fontFamily: 'Vazirmatn, Tahoma, sans-serif', direction: 'rtl',
        position: 'relative',
      }}>
        <div style={{ position: 'fixed', width: 300, height: 300, background: 'radial-gradient(circle, rgba(199,166,106,0.12) 0%, transparent 70%)', top: -80, right: -60, filter: 'blur(50px)', zIndex: 0, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto', padding: '28px 16px 80px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <button onClick={() => router.push('/dashboard')} style={{
              background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(0,0,0,0.50)',
            }}>
              <i className="ti ti-arrow-right" style={{ fontSize: 20 }} aria-hidden="true" />
            </button>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111111' }}>مدیریت درخواست نقش</div>
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>پانل ادمین</div>
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {tabs.map(t => (
              <button
                key={t.status}
                onClick={() => setFilter(t.status)}
                style={{
                  flex: 1, padding: '8px', borderRadius: 10,
                  border: `1px solid ${filter === t.status ? hexToRgba(STATUS_COLOR[t.status], 0.5) : 'rgba(0,0,0,0.07)'}`,
                  background: filter === t.status ? hexToRgba(STATUS_COLOR[t.status], 0.1) : 'rgba(0,0,0,0.04)',
                  color: filter === t.status ? STATUS_COLOR[t.status] : '#64748b',
                  fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(0,0,0,0.38)', fontSize: 15 }}>
              در حال بارگذاری...
            </div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <i className="ti ti-inbox" style={{ fontSize: 40, color: '#1e293b', display: 'block', marginBottom: 12 }} />
              <span style={{ fontSize: 15, color: 'rgba(0,0,0,0.38)' }}>درخواستی وجود ندارد</span>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.38)', marginBottom: 12 }}>
                {toFarsiDigits(requests.length)} درخواست
              </div>
              {requests.map(r => (
                <RequestCard key={r.id} req={r} onAction={handleAction} />
              ))}
            </>
          )}
        </div>

        {toast && (
          <div style={{
            position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
            background: '#C7A66A', color: '#FFFFFF', fontSize: 14, fontWeight: 700,
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

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_MAP, RoleValue, RoleStatus, toFarsiDigits, hexToRgba, STATUS_COLOR, STATUS_LABEL } from '@/lib/roles'
import { csrfToken, apiFetch } from '../../../lib/http'
import Ti from '../../../components/ui/Ti'

function authHeader(): Record<string,string> {
  /* نشست روی کوکی httpOnly است؛ فقط توکن CSRF لازم است */
  const t = csrfToken()
  return t ? { 'x-csrf-token': t } : {}
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

/* ── ردیفِ فشرده ──
   جایگزینِ کارتِ بزرگ. با شصت درخواست، کارتِ ۱۶۰پیکسلی یعنی ادمین
   باید ده صفحه اسکرول کند تا یک تصمیم بگیرد. این ردیف همه‌ی چیزهای
   لازم — نقش، مدرک، زمان، دو دکمه — را در یک خط جا می‌دهد و کادرِ
   دلیلِ رد فقط وقتی باز می‌شود که لازم باشد. */
function RequestRow({ req, onAction }: {
  req: RoleRequest
  onAction: (id: string, action: 'approve' | 'reject', note?: string) => Promise<void>
}) {
  const meta = ROLE_MAP[req.role] ?? { label: req.role, color: '#64748b', icon: 'user', requiresDoc: false }
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const act = async (action: 'approve' | 'reject') => {
    setBusy(true)
    await onAction(req.id, action, action === 'reject' ? note : undefined)
    setBusy(false)
    setRejecting(false)
  }

  /* نقشی که مدرک می‌خواهد و ندارد، اصلاً قابلِ تأیید نیست — دکمه‌ی
     تأییدش خاموش می‌ماند تا ادمین ناخواسته چیزی را که ندیده تأیید
     نکند. (از امروز سرور هم چنین درخواستی را نمی‌پذیرد.) */
  const missingDoc = meta.requiresDoc && !req.doc_url

  return (
    <div style={{ padding: '9px 14px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
        <Ti name={meta.icon} size={16} color={meta.color} />
        <span style={{ fontSize: 13.5, fontWeight: 700, color: meta.color, minWidth: 78 }}>{meta.label}</span>

        {req.doc_url ? (
          <a href={req.doc_url} target="_blank" rel="noreferrer"
            style={{ fontSize: 12, color: '#C7A66A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Ti name="file" size={13} /> مدرک
          </a>
        ) : missingDoc ? (
          <span style={{ fontSize: 11.5, color: '#B7791F' }}>
            <Ti name="alert-triangle" size={12} style={{ marginLeft: 3 }} /> بدون مدرک
          </span>
        ) : (
          <span style={{ fontSize: 11.5, color: 'rgba(0,0,0,0.3)' }}>مدرک لازم ندارد</span>
        )}

        <span style={{
          marginInlineStart: 'auto', fontSize: 11.5, color: STATUS_COLOR[req.status],
          background: hexToRgba(STATUS_COLOR[req.status], 0.1), borderRadius: 20, padding: '2px 9px',
        }}>
          {STATUS_LABEL[req.status]}
        </span>

        {req.status === 'pending' && !rejecting && (
          <>
            <button onClick={() => act('approve')} disabled={busy || missingDoc}
              title={missingDoc ? 'بدون مدرک قابل تأیید نیست' : 'تأیید'}
              style={{
                padding: '6px 12px', borderRadius: 9, border: 'none', fontSize: 12.5, fontWeight: 700,
                fontFamily: 'inherit', cursor: (busy || missingDoc) ? 'not-allowed' : 'pointer',
                background: (busy || missingDoc) ? 'rgba(0,0,0,0.05)' : '#C7A66A',
                color: (busy || missingDoc) ? 'rgba(0,0,0,0.3)' : '#fff',
              }}>
              تأیید
            </button>
            <button onClick={() => setRejecting(true)}
              style={{
                padding: '6px 12px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit',
                cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.08)', color: '#ef4444',
              }}>
              رد
            </button>
          </>
        )}
      </div>

      {rejecting && (
        <div style={{ display: 'flex', gap: 7, marginTop: 8, flexWrap: 'wrap' }}>
          <input value={note} onChange={e => setNote(e.target.value)}
            placeholder="دلیل رد — به کاربر نشان داده می‌شود"
            style={{
              flex: 1, minWidth: 170, background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 9, padding: '7px 11px', fontSize: 12.5, fontFamily: 'inherit', outline: 'none',
            }} />
          <button onClick={() => act('reject')} disabled={busy}
            style={{ padding: '7px 13px', borderRadius: 9, border: 'none', background: '#ef4444', color: '#fff', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
            تأیید رد
          </button>
          <button onClick={() => setRejecting(false)}
            style={{ padding: '7px 13px', borderRadius: 9, border: '1px solid rgba(0,0,0,0.08)', background: 'transparent', color: 'rgba(0,0,0,0.45)', fontSize: 12.5, fontFamily: 'inherit', cursor: 'pointer' }}>
            انصراف
          </button>
        </div>
      )}

      {req.status === 'rejected' && req.rejection_note && (
        <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>
          دلیل: {req.rejection_note}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────
export default function AdminRolesPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<RoleRequest[]>([])

  /* درخواست‌های یک کاربر کنارِ هم — بیست نفر با سه نقش یعنی شصت
     ردیفِ پراکنده که ادمین نمی‌فهمد کدامشان مالِ یک نفرند. */
  const grouped = useMemo(() => {
    const by = new Map<string, { key: string; name: string; items: RoleRequest[] }>()
    for (const r of requests) {
      const key = r.user_id
      const name = r.users?.name || r.users?.mobile || key.slice(0, 8)
      if (!by.has(key)) by.set(key, { key, name, items: [] })
      by.get(key)!.items.push(r)
    }
    /* تازه‌ترین درخواست بالا — همان ترتیبی که سرور می‌دهد */
    return [...by.values()]
  }, [requests])
  const [filter, setFilter]     = useState<RoleStatus>('pending')
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState<string | null>(null)

  const [svcDown, setSvcDown] = useState(false)

  /* اگر سرویس در دسترس نبود، به‌جای برگرداندن کاربر، صفحه با پیام خالی می‌ماند */
  const load = async (status: RoleStatus) => {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/admin/roles?status=${status}`, {
        headers: authHeader() as Record<string, string>,
      })
      if (!res.ok) { setSvcDown(true); setRequests([]); setLoading(false); return }
      const j = await res.json()
      setSvcDown(false)
      setRequests(j.requests ?? [])
      setLoading(false)
    } catch {
      setSvcDown(true); setRequests([]); setLoading(false)
    }
  }

  useEffect(() => { load(filter) }, [filter])

  const handleAction = async (id: string, action: 'approve' | 'reject', note?: string) => {
    await apiFetch('/api/admin/roles', {
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
    <>      <div style={{
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
              <Ti name="arrow-right" size={20} />
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

          {/* سرویس در دسترس نیست */}
          {svcDown && !loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(178,59,46,0.06)', border: '1px solid rgba(178,59,46,0.22)', borderRadius: 12, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: '#A03428' }}>
              سرویس درخواست‌های نقش فعلاً در دسترس نیست — بعداً دوباره تلاش کنید. (تأیید/لغو نقش‌ها به بک‌اند متصل است)
            </div>
          )}

          {/* List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(0,0,0,0.38)', fontSize: 15 }}>
              در حال بارگذاری...
            </div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Ti name="inbox" size={40} color={'#1e293b'} style={{ display: 'block', marginBottom: 12 }} />
              <span style={{ fontSize: 15, color: 'rgba(0,0,0,0.38)' }}>درخواستی وجود ندارد</span>
            </div>
          ) : (
            <>
              {/* ── گروه‌بندی بر اساس کاربر ──
                  با کارت‌های بزرگ، بیست نفر که هرکدام سه نقش خواسته‌اند
                  یعنی شصت کارتِ هم‌شکل پشتِ هم — ادمین نمی‌فهمد کدام
                  درخواست‌ها مالِ یک نفرند و باید با هم بررسی شوند.

                  حالا هر کاربر یک بلوک است و نقش‌هایش زیرش، فشرده. */}
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.38)', marginBottom: 12 }}>
                {toFarsiDigits(requests.length)} درخواست از {toFarsiDigits(grouped.length)} کاربر
              </div>
              {grouped.map(g => (
                <div key={g.key} style={{
                  background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
                  borderRadius: 14, marginBottom: 10, overflow: 'hidden',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                    padding: '10px 14px', background: '#F7F7F5',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                  }}>
                    <Ti name="user" size={15} color="rgba(0,0,0,0.45)" />
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{g.name}</span>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.38)' }}>
                      {toFarsiDigits(g.items.length)} نقش · {timeAgo(g.items[0]!.requested_at)}
                    </span>
                  </div>
                  <div>
                    {g.items.map(r => (
                      <RequestRow key={r.id} req={r} onAction={handleAction} />
                    ))}
                  </div>
                </div>
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

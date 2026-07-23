'use client'

import { useState, useEffect, type ElementType } from 'react'
import { useRouter } from 'next/navigation'
import { User, BarChart3, GraduationCap, Scale, Wrench, ShoppingBag, Factory, Store } from 'lucide-react'
import { useAuthStore } from '../../../store/auth.store'

// ─── Types (inline — نیاز به import از lib نیست) ──────────────
type RoleValue =
  | 'user' | 'player' | 'coach' | 'referee'
  | 'technician' | 'seller' | 'manufacturer' | 'club_owner'

type RoleStatus = 'pending' | 'approved' | 'rejected'

interface RoleRequest {
  id: string
  role: RoleValue
  status: RoleStatus
  docUrl?: string
  rejectionNote?: string
  requestedAt: string
}

interface RoleMeta {
  value: RoleValue
  label: string
  icon: string          // tabler webfont class (used by doc-upload step + chips)
  Icon: ElementType     // lucide component (used by the role cards)
  color: string
  description: string
  requiresDoc: boolean
  docHint: string
}

// ─── Helpers ──────────────────────────────────────────────────
function toFarsiDigits(n: number | string): string {
  return String(n).replace(/\d/g, d => ('۰۱۲۳۴۵۶۷۸۹'[+d] ?? d))
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

// ─── Constants ────────────────────────────────────────────────
const STATUS_LABEL: Record<RoleStatus, string> = {
  pending:  'در انتظار تأیید',
  approved: 'تأیید شده',
  rejected: 'رد شده',
}

const STATUS_COLOR: Record<RoleStatus, string> = {
  pending:  '#f59e0b',
  approved: '#C7A66A',
  rejected: '#ef4444',
}

const ROLES: RoleMeta[] = [
  { value: 'user',         label: 'کاربر عادی',     icon: 'ti-user',             Icon: User,          color: '#64748b', description: 'مشاهده و رزرو میز',        requiresDoc: false, docHint: '' },
  { value: 'player',       label: 'بازیکن رنکینگی', icon: 'ti-chart-bar',        Icon: BarChart3,     color: '#C7A66A', description: 'رنکینگ ملی بیلیارد',        requiresDoc: true,  docHint: 'کارت عضویت فدراسیون یا گواهی رتبه‌بندی ملی' },
  { value: 'coach',        label: 'مربی',            icon: 'ti-school',           Icon: GraduationCap, color: '#a78bfa', description: 'تدریس و آموزش بیلیارد',     requiresDoc: true,  docHint: 'مدرک مربیگری فدراسیون' },
  { value: 'referee',      label: 'داور',            icon: 'ti-scale',            Icon: Scale,         color: '#f59e0b', description: 'داوری مسابقات رسمی',        requiresDoc: true,  docHint: 'کارت داوری فدراسیون' },
  { value: 'technician',   label: 'خدمات فنی',       icon: 'ti-tool',             Icon: Wrench,        color: '#06b6d4', description: 'تعمیر و نگهداری تجهیزات',  requiresDoc: false, docHint: '' },
  { value: 'seller',       label: 'فروشنده',         icon: 'ti-shopping-bag',     Icon: ShoppingBag,   color: '#f97316', description: 'فروش تجهیزات بیلیارد',      requiresDoc: true,  docHint: 'جواز کسب یا صفحه فروشگاه رسمی' },
  { value: 'manufacturer', label: 'تولیدکننده',      icon: 'ti-building-factory', Icon: Factory,       color: '#ef4444', description: 'تولید تجهیزات بیلیارد',     requiresDoc: true,  docHint: 'جواز تولید یا گواهی ثبت برند' },
  { value: 'club_owner',   label: 'باشگاه‌دار',      icon: 'ti-building-store',   Icon: Store,         color: '#3b82f6', description: 'مدیریت باشگاه بیلیارد',    requiresDoc: true,  docHint: 'جواز کسب باشگاه یا مجوز اماکن ورزشی' },
]

const ROLE_MAP = Object.fromEntries(ROLES.map(r => [r.value, r])) as Record<RoleValue, RoleMeta>

// آدرس API بک‌اند NestJS
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ─── RoleCard ─────────────────────────────────────────────────
function RoleCard({
  role,
  request,
  isQueued,
  blocked,
  onToggle,
}: {
  role: RoleMeta
  request?: RoleRequest
  isQueued: boolean
  blocked: boolean
  onToggle: () => void
}) {
  const status = request?.status
  const isActive = isQueued || status === 'approved' || status === 'pending'
  const disabled = status === 'approved' || blocked
  const Icon = role.Icon
  const rgba = (a: number) => hexToRgba(role.color, a)

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      title={blocked ? 'با انتخاب یک نقش تخصصی، «کاربر عادی» غیرفعال می‌شود' : status ? STATUS_LABEL[status] : undefined}
      style={{
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9,
        padding: '16px 8px 13px',
        borderRadius: 20,
        background: isActive ? rgba(0.14) : 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(30px) saturate(200%)',
        WebkitBackdropFilter: 'blur(30px) saturate(200%)',
        border: `1px solid ${isActive ? rgba(0.5) : 'rgba(255,255,255,0.82)'}`,
        boxShadow: isActive
          ? `inset 0 1.5px 0 rgba(255,255,255,0.9), 0 8px 26px ${rgba(0.20)}`
          : 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 6px 22px rgba(0,0,0,0.06)',
        cursor: disabled ? (blocked ? 'not-allowed' : 'default') : 'pointer',
        opacity: blocked ? 0.4 : status === 'rejected' ? 0.6 : 1,
        transition: 'transform 0.26s cubic-bezier(0.22,1,0.36,1), background 0.26s, border-color 0.26s, box-shadow 0.26s',
        WebkitTapHighlightColor: 'transparent', outline: 'none',
        fontFamily: 'inherit', transform: 'translateY(0)',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-4px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* top sheen */}
      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.5) 0%,rgba(255,255,255,0) 100%)', pointerEvents: 'none', borderRadius: '20px 20px 0 0' }} />

      {/* check / status ring */}
      <span style={{
        position: 'absolute', top: 7, left: 7,
        width: 16, height: 16, borderRadius: '50%',
        border: `1.5px solid ${isActive ? role.color : 'rgba(0,0,0,0.12)'}`,
        background: (status === 'approved' || isQueued) ? role.color : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s', zIndex: 2,
      }}>
        {(status === 'approved' || isQueued) && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 3L3 5L7 1" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
        {status === 'pending' && !isQueued && (
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b' }} />
        )}
        {status === 'rejected' && !isQueued && (
          <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>✕</span>
        )}
      </span>

      {/* icon square — بیلیارد هاب «بیشتر» card style */}
      <span style={{
        width: 46, height: 46, borderRadius: 14, position: 'relative', zIndex: 1, flexShrink: 0,
        background: `linear-gradient(135deg,${rgba(0.20)},${rgba(0.08)})`,
        border: `1px solid ${rgba(0.32)}`,
        boxShadow: `0 4px 14px ${rgba(0.26)}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={21} color={role.color} style={{ filter: `drop-shadow(0 0 5px ${rgba(0.55)})` }} />
      </span>

      {/* label — fades out when the card is selected */}
      <span style={{
        fontSize: 12, fontWeight: 700, textAlign: 'center', lineHeight: 1.3, whiteSpace: 'nowrap',
        color: '#334155', position: 'relative', zIndex: 1,
        opacity: isActive ? 0.26 : 1,
        transition: 'opacity 0.26s ease',
      }}>
        {role.label}
      </span>

      {/* status badge */}
      {status && (
        <span style={{ fontSize: 10, color: STATUS_COLOR[status], position: 'relative', zIndex: 1 }}>
          {STATUS_LABEL[status]}
        </span>
      )}
    </button>
  )
}

// ─── DocUploadStep ─────────────────────────────────────────────
function DocUploadStep({
  queued,
  onBack,
  onDone,
}: {
  queued: RoleValue[]
  onBack: () => void
  onDone: () => void
}) {
  const [files, setFiles]     = useState<Record<string, File | null>>({})
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState<Record<string, 'idle' | 'uploading' | 'done' | 'error'>>({})

  const rolesNeedDoc = queued.filter(r => ROLE_MAP[r].requiresDoc)
  const rolesNoDoc   = queued.filter(r => !ROLE_MAP[r].requiresDoc)

  const handleSubmit = async () => {
    setUploading(true)

    for (const roleVal of queued) {
      const meta = ROLE_MAP[roleVal]
      let docUrl: string | undefined

      // آپلود مدرک در صورت نیاز
      if (meta.requiresDoc && files[roleVal]) {
        setProgress(p => ({ ...p, [roleVal]: 'uploading' }))
        const formData = new FormData()
        formData.append('file', files[roleVal]!)
        formData.append('role', roleVal)

        try {
          const upRes = await fetch(`${API}/roles/upload-doc`, {
            method: 'POST',
            headers: authHeader(),
            body: formData,
          })
          if (upRes.ok) {
            const j = await upRes.json()
            docUrl = j.url
            setProgress(p => ({ ...p, [roleVal]: 'done' }))
          } else {
            setProgress(p => ({ ...p, [roleVal]: 'error' }))
            continue
          }
        } catch {
          setProgress(p => ({ ...p, [roleVal]: 'error' }))
          continue
        }
      }

      // ثبت درخواست نقش
      await fetch(`${API}/roles/request`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleVal, docUrl }),
      })
    }

    setUploading(false)
    onDone()
  }

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', color: 'rgba(0,0,0,0.45)',
          fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
          marginBottom: 24, padding: 0,
        }}
      >
        <i className="ti ti-arrow-right" style={{ fontSize: 18 }} aria-hidden="true" />
        بازگشت
      </button>

      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.28)',
          borderRadius: 20, padding: '4px 14px', fontSize: 13, color: '#C7A66A', marginBottom: 14,
        }}>
          <i className="ti ti-upload" style={{ fontSize: 15 }} aria-hidden="true" />
          آپلود مدرک تأیید هویت
        </div>
        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', lineHeight: 1.7 }}>
          برای نقش‌هایی که نیاز به مدرک دارند، فایل خود را آپلود کنید.
          <br />
          <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.38)' }}>
            مدارک توسط ادمین بررسی و تأیید خواهند شد.
          </span>
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {rolesNeedDoc.map(roleVal => {
          const meta = ROLE_MAP[roleVal]
          const file = files[roleVal]
          const st   = progress[roleVal]
          return (
            <div key={roleVal} style={{
              background: '#F7F7F5',
              border: `1px solid ${file ? hexToRgba(meta.color, 0.4) : 'rgba(0,0,0,0.07)'}`,
              borderRadius: 14, padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: hexToRgba(meta.color, 0.12),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`ti ${meta.icon}`} style={{ fontSize: 19, color: meta.color }} aria-hidden="true" />
                </span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111111' }}>{meta.label}</div>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>{meta.docHint}</div>
                </div>
              </div>

              <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#F7F7F5', border: '1px dashed rgba(0,0,0,0.08)',
                borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
              }}>
                <i className="ti ti-file-upload" style={{ fontSize: 20, color: file ? meta.color : '#475569' }} aria-hidden="true" />
                <span style={{ fontSize: 13, color: file ? meta.color : '#475569', flex: 1 }}>
                  {file ? file.name : 'انتخاب فایل (JPG / PNG / PDF)'}
                </span>
                {st === 'done'  && <i className="ti ti-check" style={{ fontSize: 16, color: '#C7A66A' }} aria-hidden="true" />}
                {st === 'error' && <i className="ti ti-x"     style={{ fontSize: 16, color: '#ef4444' }} aria-hidden="true" />}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  style={{ display: 'none' }}
                  onChange={e => setFiles(f => ({ ...f, [roleVal]: e.target.files?.[0] ?? null }))}
                />
              </label>
            </div>
          )
        })}

        {rolesNoDoc.length > 0 && (
          <div style={{
            background: 'rgba(199,166,106,0.06)', border: '1px solid rgba(199,166,106,0.2)',
            borderRadius: 12, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <i className="ti ti-info-circle" style={{ fontSize: 20, color: '#C7A66A' }} aria-hidden="true" />
            <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.50)' }}>
              {rolesNoDoc.map(r => ROLE_MAP[r].label).join('، ')} نیازی به مدرک ندارند و سریع‌تر تأیید می‌شوند.
            </span>
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={uploading}
        style={{
          width: '100%', padding: '14px', borderRadius: 12, border: 'none',
          background: uploading ? 'rgba(0,0,0,0.04)' : '#C7A66A',
          color: uploading ? 'rgba(0,0,0,0.35)' : '#FFFFFF',
          fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
          cursor: uploading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {uploading
          ? <><i className="ti ti-loader-2" style={{ fontSize: 18 }} aria-hidden="true" />در حال ارسال...</>
          : <><i className="ti ti-send"     style={{ fontSize: 18 }} aria-hidden="true" />ارسال درخواست تأیید</>
        }
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function RolePage() {
  const router = useRouter()
  const { user, updateUser } = useAuthStore()
  const [requests, setRequests] = useState<RoleRequest[]>([])
  const [queued, setQueued]     = useState<Set<RoleValue>>(new Set())
  const [step, setStep]         = useState<'select' | 'upload'>('select')
  const [toast, setToast]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)

  // بارگذاری درخواست‌های قبلی از NestJS
  useEffect(() => {
    fetch(`${API}/roles/my`, { headers: authHeader() })
      .then(r => r.ok ? r.json() : [])
      .then(data => setRequests(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // نگاشت role → request برای دسترسی سریع
  const requestMap = Object.fromEntries(
    requests.map(r => [r.role, r])
  ) as Record<string, RoleRequest>

  // آیا کاربر نقش تخصصی (غیر از «کاربر عادی») تأییدشده/در انتظار دارد؟
  const hasNonUserRequest = requests.some(r => r.role !== 'user' && r.status !== 'rejected')

  const toggle = (val: RoleValue) => {
    if (requestMap[val]?.status === 'approved') return
    setQueued(prev => {
      const next = new Set(prev)
      if (next.has(val)) { next.delete(val); return next }
      if (val === 'user') {
        // «کاربر عادی» را نمی‌توان همراه یک نقش تخصصی انتخاب کرد
        const proQueued = Array.from(next).some(r => r !== 'user')
        if (proQueued || hasNonUserRequest) return next
        next.add('user')
      } else {
        next.add(val)
        next.delete('user')   // انتخاب یک نقش تخصصی، «کاربر عادی» را خاموش می‌کند
      }
      return next
    })
  }

  const handleDone = () => {
    showToast('نقش‌های شما فعال شد')
    const currentSecondary = user?.secondaryRoles ?? []
    const newRoles = queuedArr.filter(r => !currentSecondary.includes(r))
    if (newRoles.length > 0) {
      updateUser({ secondaryRoles: [...currentSecondary, ...newRoles] })
    }
    setQueued(new Set())
    setStep('select')
    fetch(`${API}/roles/my`, { headers: authHeader() })
      .then(r => r.ok ? r.json() : [])
      .then(data => setRequests(Array.isArray(data) ? data : []))
      .catch(() => {})
    setTimeout(() => router.push('/dashboard'), 1200)
  }

  const handleSubmitRoles = async () => {
    for (const roleVal of queuedArr) {
      await fetch(`${API}/roles/request`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleVal }),
      })
    }
    handleDone()
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const approvedCount = requests.filter(r => r.status === 'approved').length
  const pendingCount  = requests.filter(r => r.status === 'pending').length
  const queuedArr     = Array.from(queued) as RoleValue[]

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />

      <div style={{
        minHeight: '100vh', background: '#F7F7F5',
        fontFamily: 'Vazirmatn, Tahoma, sans-serif', direction: 'rtl',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* liquid orbs */}
        <div style={{ position: 'fixed', width: 340, height: 340, background: 'radial-gradient(circle, rgba(199,166,106,0.18) 0%, transparent 70%)', top: -100, right: -80, pointerEvents: 'none', filter: 'blur(50px)', zIndex: 0 }} />
        <div style={{ position: 'fixed', width: 280, height: 280, background: 'radial-gradient(circle, rgba(199,166,106,0.1) 0%, transparent 70%)', bottom: 100, left: -60, pointerEvents: 'none', filter: 'blur(60px)', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '36px 16px 100px' }}>

          {step === 'select' && (
            <>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.28)',
                  borderRadius: 20, padding: '4px 14px', fontSize: 13, color: '#C7A66A', marginBottom: 14,
                }}>
                  <i className="ti ti-shield-check" style={{ fontSize: 15 }} aria-hidden="true" />
                  هویت حرفه‌ای شما
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111111', marginBottom: 8, lineHeight: 1.5 }}>
                  {requests.length === 0 ? 'نقش‌های خود را انتخاب کنید' : 'مدیریت نقش‌ها'}
                </h1>
                <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.45)', lineHeight: 1.7 }}>
                  می‌توانید همزمان چند نقش داشته باشید
                </p>
              </div>

              {/* نقش‌های فعال — با امکانِ حذفِ نقشِ اشتباه */}
              {(user?.secondaryRoles ?? []).length > 0 && (
                <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: '14px 16px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: 'rgba(0,0,0,0.55)', marginBottom: 10 }}>نقش‌های فعال شما</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(user?.secondaryRoles ?? []).map(r => (
                      <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: '#9A6E38', background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.3)', borderRadius: 999, padding: '6px 8px 6px 6px' }}>
                        {ROLE_MAP[r as RoleValue]?.label ?? r}
                        <button
                          onClick={() => {
                            updateUser({ secondaryRoles: (user?.secondaryRoles ?? []).filter(x => x !== r) })
                            showToast('نقش حذف شد')
                          }}
                          title="حذف نقش"
                          style={{ width: 18, height: 18, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(178,59,46,0.12)', color: '#B23B2E', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, lineHeight: 1, fontFamily: 'inherit' }}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              {requests.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  {[
                    { label: 'تأیید‌شده', val: toFarsiDigits(approvedCount), color: '#C7A66A' },
                    { label: 'در انتظار',  val: toFarsiDigits(pendingCount),  color: '#f59e0b' },
                    { label: 'کل نقش‌ها', val: toFarsiDigits(requests.length), color: 'rgba(0,0,0,0.50)' },
                  ].map(s => (
                    <div key={s.label} style={{
                      flex: 1, background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.07)',
                      borderRadius: 12, padding: '10px 12px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Grid ۴ ستونه */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
                {ROLES.map(role => (
                  <RoleCard
                    key={role.value}
                    role={role}
                    request={requestMap[role.value]}
                    isQueued={queued.has(role.value)}
                    blocked={role.value === 'user' && (queuedArr.some(r => r !== 'user') || hasNonUserRequest)}
                    onToggle={() => toggle(role.value)}
                  />
                ))}
              </div>

              {/* Chips انتخاب‌شده */}
              {queued.size > 0 && (
                <div style={{
                  background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.07)',
                  borderRadius: 14, padding: '14px 16px', marginBottom: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C7A66A', display: 'inline-block' }} />
                    {toFarsiDigits(queued.size)} نقش جدید برای درخواست
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {queuedArr.map(val => {
                      const r = ROLE_MAP[val]
                      return (
                        <button key={val} onClick={() => toggle(val)} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '4px 10px 4px 6px', borderRadius: 20, fontSize: 12,
                          border: `1px solid ${hexToRgba(r.color, 0.35)}`,
                          background: hexToRgba(r.color, 0.1), color: r.color,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.color }} />
                          {r.label}
                          <i className="ti ti-x" style={{ fontSize: 12, marginRight: 2 }} aria-hidden="true" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* نقش‌های تأیید‌شده — لینک به پروفایل */}
              {approvedCount > 0 && (
                <div style={{
                  background: 'rgba(199,166,106,0.06)', border: '1px solid rgba(199,166,106,0.2)',
                  borderRadius: 14, padding: '14px 16px', marginBottom: 16,
                }}>
                  <div style={{ fontSize: 13, color: '#C7A66A', marginBottom: 10, fontWeight: 600 }}>
                    نقش‌های تأیید‌شده — تکمیل پروفایل
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {requests.filter(r => r.status === 'approved').map(req => {
                      const m = ROLE_MAP[req.role]
                      return (
                        <button key={req.role} onClick={() => router.push(`/profile/setup?role=${req.role}`)} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 12px', borderRadius: 20,
                          border: `1px solid ${hexToRgba(m.color, 0.4)}`,
                          background: hexToRgba(m.color, 0.1), color: m.color,
                          fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                          <i className={`ti ${m.icon}`} style={{ fontSize: 15 }} aria-hidden="true" />
                          {m.label}
                          <i className="ti ti-arrow-left" style={{ fontSize: 13 }} aria-hidden="true" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* دکمه‌ها */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={handleSubmitRoles}
                  disabled={queued.size === 0}
                  onMouseEnter={e => { if (queued.size > 0) e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12,
                    border: `1px solid ${queued.size === 0 ? 'transparent' : 'rgba(199,166,106,0.34)'}`,
                    background: queued.size === 0 ? 'rgba(0,0,0,0.04)' : 'rgba(199,166,106,0.12)',
                    color: queued.size === 0 ? 'rgba(0,0,0,0.35)' : '#9A6E38',
                    fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
                    cursor: queued.size === 0 ? 'not-allowed' : 'pointer',
                    transition: 'transform 0.2s ease, background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transform: 'translateY(0)',
                  }}
                >
                  <i className="ti ti-check" style={{ fontSize: 18 }} aria-hidden="true" />
                  {queued.size === 0
                    ? 'نقش جدیدی انتخاب کنید'
                    : `تأیید — فعال‌سازی ${toFarsiDigits(queued.size)} نقش`}
                </button>
                <button onClick={() => router.push('/dashboard')} style={{
                  width: '100%', padding: 12, borderRadius: 12,
                  border: '1px solid rgba(0,0,0,0.07)', background: 'transparent',
                  color: 'rgba(0,0,0,0.45)', fontSize: 15, fontFamily: 'inherit', cursor: 'pointer',
                }}>
                  بازگشت به داشبورد
                </button>
              </div>
            </>
          )}

        </div>

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
            background: '#C7A66A', color: '#FFFFFF', fontSize: 14, fontWeight: 700,
            fontFamily: 'Vazirmatn, Tahoma, sans-serif', padding: '10px 24px',
            borderRadius: 24, boxShadow: '0 4px 24px rgba(199,166,106,0.35)',
            zIndex: 100, whiteSpace: 'nowrap', maxWidth: '90vw', textAlign: 'center',
          }}>
            {toast}
          </div>
        )}
      </div>
    </>
  )
}

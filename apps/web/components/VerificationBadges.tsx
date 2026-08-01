'use client'

/* ─────────────────────────────────────────────────────────────
   تیک‌های تأیید پروفایل — یک نوار برای همه‌ی نقش‌ها.

   سه چیز: اطلاعات هویتی (هنگام ثبت‌نام استعلام شده)، مدارک (ادمین
   تأیید می‌کند)، و ایمیل (خود کاربر ثبت و استعلام می‌کند).

   ایمیل اجباری نیست، ولی عمداً برچسب «اختیاری» نمی‌خورد: نوشتنش
   کاربر را از انجامش منصرف می‌کند. اگر ثبت نشده باشد، فقط دعوت به
   ثبت می‌بیند — نه اخطار.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import { BadgeCheck, Check, Clock, Loader2, Mail, ShieldCheck, X } from 'lucide-react'
import { apiFetch } from '../lib/http'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#E7E2D6'
const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

/* «مدرک» سه حالت دارد، نه دو تا: نداشتن با «لازم نبودن» فرق می‌کند و
   «بارگذاری‌شده ولی هنوز بررسی‌نشده» هم حالتِ سومی است که پیش‌تر اصلاً
   دیده نمی‌شد. */
export type DocState = 'verified' | 'pending' | 'missing' | 'not_required'

export interface VerificationState {
  identity: boolean       // کد ملی و مشخصات، استعلام‌شده
  documents: DocState     // مدرک نقش — از /api/users/document-status
  documentsNote: string
  email: boolean
  emailAddress?: string
}

/* نشانِ کنارِ عنوان. «در انتظار بررسی» عمداً رنگِ کهربایی دارد نه سبز:
   سبز یعنی کار تمام است، و مدرکی که هنوز بررسی نشده تمام نیست. */
const CHIP = {
  done: { label: 'تأیید شده', color: FELT, bg: 'rgba(14,122,56,0.09)', border: 'rgba(14,122,56,0.26)' },
  pending: { label: 'در انتظار بررسی', color: '#92600A', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.32)' },
} as const

function Row({ icon, title, note, done, pending = false, children }: {
  icon: React.ReactNode; title: string; note: string; done: boolean
  /** بارگذاری شده ولی هنوز تأیید نشده */
  pending?: boolean
  children?: React.ReactNode
}) {
  const chip = done ? CHIP.done : pending ? CHIP.pending : null
  return (
    <div style={{
      display: 'flex', gap: 11, alignItems: 'flex-start',
      padding: '12px 0', borderBottom: `1px dashed ${LINE}`,
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        width: 30, height: 30, borderRadius: 9, marginTop: 1,
        background: done ? 'rgba(14,122,56,0.10)' : 'rgba(199,166,106,0.13)',
        color: done ? FELT : GOLD_D,
      }}>{icon}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: INK }}>{title}</span>
          {chip && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 800, color: chip.color,
              background: chip.bg, border: `1px solid ${chip.border}`,
              borderRadius: 20, padding: '2px 9px',
            }}>
              {done ? <Check size={11} /> : <Clock size={11} />} {chip.label}
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: MUT, margin: '5px 0 0', lineHeight: 1.9 }}>{note}</p>
        {children}
      </div>
    </div>
  )
}

export default function VerificationBadges({ style }: { style?: React.CSSProperties }) {
  const [state, setState] = useState<VerificationState | null>(null)
  const [email, setEmail] = useState('')
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await apiFetch('/api/users/profile', { cache: 'no-store' })
      if (!r.ok) return
      const j = await r.json()

      /* وضعیتِ مدرک از مسیرِ خودش می‌آید. پیش‌تر از
         `j.verificationStatus` خوانده می‌شد، ولی آن ستون با تأییدِ
         **کد ملی** روی 'verified' می‌رود — نتیجه‌اش این بود که ردیفِ
         «تأیید مدارک» بلافاصله بعد از استعلامِ هویت سبز می‌شد، بدون
         اینکه هیچ مدرکی آپلود یا بررسی شده باشد. */
      const d = await apiFetch('/api/users/document-status', { cache: 'no-store' })
        .then(res => res.ok ? res.json() : null)
        .catch(() => null)

      setState({
        identity: !!j.nationalIdVerified || !!j.nationalId,
        documents: (d?.state as DocState) ?? 'missing',
        documentsNote: d?.message ?? 'وضعیت مدارک در دسترس نیست.',
        email: !!j.emailVerified,
        emailAddress: j.email || '',
      })
      setEmail(j.email || '')
    } catch { /* پنل نباید به‌خاطر این بخش خالی بماند */ }
  }, [])
  useEffect(() => { void load() }, [load])

  const saveEmail = async () => {
    const e = email.trim().toLowerCase()
    if (!EMAIL_RE.test(e)) { setMsg({ text: 'نشانی ایمیل معتبر نیست', bad: true }); return }
    setBusy(true); setMsg(null)
    try {
      const r = await apiFetch('/api/auth/verify/email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setMsg({ text: j?.message || 'تأیید ایمیل انجام نشد', bad: true }); return }
      setMsg({ text: 'ایمیل شما تأیید شد', bad: false })
      setEditing(false)
      await load()
    } catch { setMsg({ text: 'خطا در ارتباط با سرور', bad: true }) }
    finally { setBusy(false) }
  }

  const removeEmail = async () => {
    setBusy(true); setMsg(null)
    try {
      await apiFetch('/api/auth/verify/email', { method: 'DELETE' })
      setEmail('')
      await load()
    } finally { setBusy(false) }
  }

  if (!state) return null

  return (
    <section dir="rtl" style={{
      background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '16px 18px 6px',
      fontFamily: 'inherit', ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <BadgeCheck size={17} style={{ color: GOLD_D }} />
        <h2 style={{ fontSize: 14.5, fontWeight: 900, color: INK, margin: 0 }}>وضعیت تأیید</h2>
      </div>

      <Row
        icon={<ShieldCheck size={16} />}
        title="اطلاعات هویتی"
        done={state.identity}
        note={state.identity
          ? 'مشخصات هویتی شما تأیید شده است.'
          : 'اطلاعات هویتی شما هنوز استعلام نشده است.'}
      />

      {/* سبز فقط وقتی مدرک واقعاً آپلود و تأیید شده. متن هم از سرور
          می‌آید تا با وضعیتِ واقعی یکی بماند. */}
      <Row
        icon={<BadgeCheck size={16} />}
        title="تأیید مدارک"
        done={state.documents === 'verified'}
        pending={state.documents === 'pending'}
        note={state.documentsNote}
      />

      <Row
        icon={<Mail size={16} />}
        title="تأیید ایمیل"
        done={state.email}
        note={state.email
          ? `نشانی ${state.emailAddress} ثبت و اعتبارسنجی شده است.`
          : 'نشانی ایمیلتان را ثبت کنید تا اطلاع‌رسانی‌های مهم به دستتان برسد.'}
      >
        {(!state.email || editing) ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 9 }}>
            <input
              value={email} onChange={e => { setEmail(e.target.value); setMsg(null) }}
              onKeyDown={e => { if (e.key === 'Enter') void saveEmail() }}
              placeholder="name@example.com" dir="ltr"
              style={{
                flex: 1, minWidth: 180, textAlign: 'right',
                border: `1px solid ${LINE}`, borderRadius: 10, padding: '9px 12px',
                fontSize: 13, fontFamily: 'inherit', color: INK, background: '#FAFAF7', outline: 'none',
              }} />
            <button type="button" onClick={() => void saveEmail()} disabled={busy}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 10,
                border: '1px solid rgba(199,166,106,0.34)', background: 'rgba(199,166,106,0.12)',
                color: GOLD_D, fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit',
                padding: '9px 15px', cursor: busy ? 'not-allowed' : 'pointer',
              }}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {state.email ? 'ذخیره' : 'ثبت و تأیید'}
            </button>
            {editing && (
              <button type="button" onClick={() => { setEditing(false); setEmail(state.emailAddress ?? ''); setMsg(null) }}
                style={{
                  display: 'inline-flex', alignItems: 'center', borderRadius: 10, border: `1px solid ${LINE}`,
                  background: 'rgba(0,0,0,0.03)', color: SEC, fontSize: 12.5, fontWeight: 800,
                  fontFamily: 'inherit', padding: '9px 13px', cursor: 'pointer',
                }}>
                <X size={13} />
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
            <button type="button" onClick={() => setEditing(true)}
              style={{
                borderRadius: 10, border: `1px solid ${LINE}`, background: 'rgba(0,0,0,0.03)',
                color: SEC, fontSize: 12, fontWeight: 800, fontFamily: 'inherit',
                padding: '7px 13px', cursor: 'pointer',
              }}>تغییر ایمیل</button>
            <button type="button" onClick={() => void removeEmail()} disabled={busy}
              style={{
                borderRadius: 10, border: '1px solid rgba(178,59,46,0.24)', background: 'rgba(178,59,46,0.06)',
                color: RED, fontSize: 12, fontWeight: 800, fontFamily: 'inherit',
                padding: '7px 13px', cursor: busy ? 'not-allowed' : 'pointer',
              }}>حذف</button>
          </div>
        )}

        {msg && (
          <p style={{ fontSize: 12, fontWeight: 700, color: msg.bad ? RED : FELT, margin: '9px 0 0', lineHeight: 1.9 }}>
            {msg.text}
          </p>
        )}
      </Row>
    </section>
  )
}

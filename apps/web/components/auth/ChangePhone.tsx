'use client'

/* ─────────────────────────────────────────────────────────────
   تغییر شماره‌ی موبایل حساب.

   سیم‌کارت فروخته می‌شود و کاربر باید بتواند شماره‌اش را عوض کند.
   ولی شماره‌ی تازه دقیقاً مثل روز ثبت‌نام استعلام می‌شود — کد پیامکی
   و بعد شاهکار با همان کد ملی حساب — وگرنه می‌شد هویت تأییدشده را
   به شماره‌ی شخص دیگری وصل کرد.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import { Loader2, Phone, ShieldCheck, X } from 'lucide-react'
import { apiFetch } from '../../lib/http'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#E7E2D6'
const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

const toFa = (v: string) => v.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
const toEn = (v: string) => v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '')

const INPUT: React.CSSProperties = {
  width: '100%', border: `1px solid ${LINE}`, borderRadius: 10, padding: '10px 13px',
  fontSize: 13.5, fontFamily: 'inherit', color: INK, background: '#FAFAF7', outline: 'none',
  direction: 'ltr', textAlign: 'right',
}
const BTN: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  borderRadius: 10, border: '1px solid rgba(199,166,106,0.34)', background: 'rgba(199,166,106,0.12)',
  color: GOLD_D, fontSize: 13, fontWeight: 800, fontFamily: 'inherit', padding: '10px 16px', cursor: 'pointer',
}

export default function ChangePhone({ current, onChanged }: {
  current: string
  onChanged?: (phone: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(0)
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null)

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait(w => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  const reset = () => { setOpen(false); setPhone(''); setCode(''); setSent(false); setMsg(null) }

  const post = async (body: Record<string, unknown>) => {
    const r = await apiFetch('/api/auth/change-phone', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    return { r, j: await r.json().catch(() => ({})) as Record<string, unknown> }
  }

  const send = async () => {
    if (!/^09\d{9}$/.test(phone)) { setMsg({ text: 'شماره موبایل معتبر نیست', bad: true }); return }
    setBusy(true); setMsg(null)
    try {
      const { r, j } = await post({ phone })
      if (!r.ok) {
        setMsg({ text: String(j.message ?? 'ارسال کد انجام نشد'), bad: true })
        if (typeof j.wait === 'number') setWait(j.wait)
        return
      }
      setSent(true); setWait(60); setMsg({ text: 'کد به شماره‌ی تازه پیامک شد', bad: false })
    } catch { setMsg({ text: 'خطا در ارتباط با سرور', bad: true }) }
    finally { setBusy(false) }
  }

  const confirm = async () => {
    if (!/^\d{4,6}$/.test(code)) { setMsg({ text: 'کد را کامل وارد کنید', bad: true }); return }
    setBusy(true); setMsg(null)
    try {
      const { r, j } = await post({ phone, code })
      if (!r.ok) { setMsg({ text: String(j.message ?? 'تغییر شماره انجام نشد'), bad: true }); return }
      onChanged?.(phone)
      reset()
    } catch { setMsg({ text: 'خطا در ارتباط با سرور', bad: true }) }
    finally { setBusy(false) }
  }

  if (!open) {
    return (
      <div style={{ display: 'flex', gap: 11, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 800, color: INK,
          direction: 'ltr',
        }}>
          <Phone size={15} style={{ color: GOLD_D }} />{toFa(current || '—')}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: FELT,
          background: 'rgba(14,122,56,0.09)', border: '1px solid rgba(14,122,56,0.26)',
          borderRadius: 20, padding: '2px 9px',
        }}>
          <ShieldCheck size={11} /> تأیید شده
        </span>
        <button type="button" onClick={() => setOpen(true)}
          style={{ ...BTN, marginInlineStart: 'auto', padding: '8px 14px', fontSize: 12.5 }}>
          تغییر شماره
        </button>
      </div>
    )
  }

  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 13, padding: 14, background: '#FAFAF7' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 13.5, fontWeight: 900, color: INK }}>تغییر شماره‌ی موبایل</span>
        <button type="button" onClick={reset} aria-label="بستن"
          style={{ marginInlineStart: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: MUT, display: 'flex' }}>
          <X size={15} />
        </button>
      </div>
      <p style={{ fontSize: 12, color: MUT, margin: '0 0 12px', lineHeight: 1.95 }}>
        شماره‌ی تازه باید به نام خودتان باشد؛ با کد پیامکی و استعلام شاهکار بررسی می‌شود.
        بعد از تأیید، شماره‌ی قبلی از حسابتان حذف می‌شود و ورود بعدی با شماره‌ی تازه است.
      </p>

      <div style={{ display: 'grid', gap: 10 }}>
        <input
          value={toFa(phone)} onChange={e => { setPhone(toEn(e.target.value).slice(0, 11)); setMsg(null) }}
          placeholder="شماره‌ی تازه (۱۱ رقمی)" inputMode="numeric" disabled={sent}
          style={{ ...INPUT, opacity: sent ? 0.6 : 1 }} />

        {sent && (
          <input
            value={toFa(code)} onChange={e => { setCode(toEn(e.target.value).slice(0, 6)); setMsg(null) }}
            onKeyDown={e => { if (e.key === 'Enter') void confirm() }}
            placeholder="کد پیامک‌شده" inputMode="numeric" autoFocus
            style={{ ...INPUT, textAlign: 'center', letterSpacing: 4 }} />
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!sent ? (
            <button type="button" onClick={() => void send()} disabled={busy} style={{ ...BTN, opacity: busy ? 0.6 : 1 }}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : null} ارسال کد
            </button>
          ) : (
            <>
              <button type="button" onClick={() => void confirm()} disabled={busy} style={{ ...BTN, opacity: busy ? 0.6 : 1 }}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : null} تأیید و تغییر
              </button>
              <button type="button" onClick={() => void send()} disabled={busy || wait > 0}
                style={{
                  ...BTN, background: 'rgba(0,0,0,0.03)', borderColor: LINE, color: SEC,
                  opacity: wait > 0 ? 0.5 : 1, cursor: wait > 0 ? 'default' : 'pointer',
                }}>
                {wait > 0 ? `ارسال دوباره (${toFa(String(wait))})` : 'ارسال دوباره'}
              </button>
            </>
          )}
        </div>

        {msg && (
          <p style={{ fontSize: 12, fontWeight: 700, color: msg.bad ? RED : FELT, margin: 0, lineHeight: 1.9 }}>
            {msg.text}
          </p>
        )}
      </div>
    </div>
  )
}

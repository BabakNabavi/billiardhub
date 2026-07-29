'use client'

/* ─────────────────────────────────────────────────────────────
   تغییرِ رمزِ عبورِ حساب — از داخلِ پروفایل.

   دو حالت دارد و خودش تشخیص می‌دهد کدام است:
     • حسابی که رمز دارد   ⇒ «تغییرِ رمز»، رمزِ فعلی هم پرسیده می‌شود
     • حسابی که رمز ندارد  ⇒ «تعیینِ رمز» (حسابِ ساخته‌شده با کدِ پیامکی)

   پس از موفقیت همه‌ی نشست‌ها باطل می‌شوند — از جمله همین نشست — پس
   کاربر باید دوباره وارد شود. این را از قبل به او می‌گوییم تا خروجِ
   ناگهانی گیجش نکند.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import { Loader2, Lock, Eye, EyeOff, Check, X } from 'lucide-react'
import { apiFetch } from '../../lib/http'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#E7E2D6'
const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

/* همان قواعدی که سرور در lib/auth/password.ts اعمال می‌کند */
const RULES: { label: string; ok: (p: string) => boolean }[] = [
  { label: 'حداقل ۸ نویسه',        ok: p => p.length >= 8 },
  { label: 'حرف کوچک انگلیسی',     ok: p => /[a-z]/.test(p) },
  { label: 'حرف بزرگ انگلیسی',     ok: p => /[A-Z]/.test(p) },
  { label: 'عدد',                  ok: p => /[0-9]/.test(p) },
  { label: 'نویسه ویژه مثل ! یا @', ok: p => /[^A-Za-z0-9]/.test(p) },
]

const INPUT: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: `1px solid ${LINE}`, borderRadius: 10,
  padding: '10px 13px', paddingInlineEnd: 40,
  fontSize: 13.5, fontFamily: 'inherit', color: INK, background: '#FAFAF7', outline: 'none',
}
const BTN: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  borderRadius: 10, border: '1px solid rgba(199,166,106,0.34)', background: 'rgba(199,166,106,0.12)',
  color: GOLD_D, fontSize: 13, fontWeight: 800, fontFamily: 'inherit', padding: '10px 16px', cursor: 'pointer',
}

function Secret({ value, onChange, placeholder, autoFocus, onEnter }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  autoFocus?: boolean
  onEnter?: () => void
}) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && onEnter) onEnter() }}
        placeholder={placeholder}
        autoComplete={placeholder.includes('فعلی') ? 'current-password' : 'new-password'}
        autoFocus={autoFocus}
        style={INPUT}
      />
      <button
        type="button" onClick={() => setShow(s => !s)}
        aria-label={show ? 'پنهان کردن رمز' : 'نمایش رمز'}
        style={{
          position: 'absolute', insetInlineEnd: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: MUT, display: 'flex', padding: 0,
        }}>
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

export default function ChangePassword({ onChanged }: { onChanged?: () => void }) {
  const [open, setOpen] = useState(false)
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null)

  /* «رمز دارد یا نه» را از سرور می‌پرسیم — خودِ هش هرگز برنمی‌گردد */
  useEffect(() => {
    let alive = true
    apiFetch('/api/auth/change-password', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (alive && j) setHasPassword(!!j.hasPassword) })
      .catch(() => { /* اگر نشد، حالتِ محافظه‌کارانه: رمز دارد */ if (alive) setHasPassword(true) })
    return () => { alive = false }
  }, [])

  const reset = () => {
    setOpen(false); setCurrent(''); setNext(''); setConfirm(''); setMsg(null)
  }

  const submit = async () => {
    if (hasPassword && !current.trim()) { setMsg({ text: 'رمزِ فعلی را وارد کنید', bad: true }); return }
    if (!RULES.every(r => r.ok(next)))  { setMsg({ text: 'رمزِ تازه همه‌ی شرط‌های زیر را ندارد', bad: true }); return }
    if (next !== confirm)               { setMsg({ text: 'رمزِ تازه و تکرارش یکی نیستند', bad: true }); return }

    setBusy(true); setMsg(null)
    try {
      const r = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next, confirmPassword: confirm }),
      })
      const j = await r.json().catch(() => ({} as Record<string, unknown>))
      if (!r.ok) { setMsg({ text: String(j.message ?? 'تغییرِ رمز انجام نشد'), bad: true }); return }

      setCurrent(''); setNext(''); setConfirm('')
      setMsg({ text: String(j.message ?? 'رمز عبور تغییر کرد؛ دوباره وارد شوید.'), bad: false })
      onChanged?.()
    } catch {
      setMsg({ text: 'خطا در ارتباط با سرور', bad: true })
    } finally { setBusy(false) }
  }

  const verb = hasPassword === false ? 'تعیینِ رمز' : 'تغییرِ رمز'

  /* خروج از همه‌ی دستگاه‌ها — مسیرش از قبل بود (`{all:true}`) ولی هیچ
     دکمه‌ای نداشت، پس کاربر راهی برای بستنِ نشستِ گوشیِ گم‌شده نداشت. */
  const logoutAll = async () => {
    /* `confirm` این‌جا نامِ فیلدِ «تکرارِ رمز» است و تابعِ مرورگر را
       سایه می‌اندازد؛ پس صریح از window خوانده می‌شود. */
    if (!window.confirm('از همه‌ی دستگاه‌ها خارج می‌شوید و باید دوباره وارد شوید. ادامه می‌دهید؟')) return
    setBusy(true)
    try {
      const r = await apiFetch('/api/auth/logout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      if (!r.ok) { setMsg({ text: 'انجام نشد', bad: true }); return }
      setMsg({ text: 'از همه‌ی دستگاه‌ها خارج شدید.', bad: false })
      onChanged?.()
    } catch {
      setMsg({ text: 'خطا در ارتباط با سرور', bad: true })
    } finally { setBusy(false) }
  }

  /* ── حالتِ جمع‌شده ── */
  if (!open) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap',
        border: `1px solid ${LINE}`, borderRadius: 13, padding: '11px 14px', background: '#FAFAF7',
      }}>
        <Lock size={15} style={{ color: MUT, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>
          {hasPassword === false ? 'برای حسابتان رمز تعیین نشده است' : 'رمز عبور'}
        </span>
        {hasPassword !== false && (
          <span style={{ fontSize: 12.5, color: MUT, letterSpacing: 2, lineHeight: 1 }}>••••••••</span>
        )}
        <button type="button" onClick={() => setOpen(true)}
          style={{ ...BTN, marginInlineStart: 'auto', padding: '8px 14px', fontSize: 12.5 }}>
          {verb}
        </button>
        <button type="button" onClick={() => void logoutAll()} disabled={busy}
          title="بستنِ نشستِ همه‌ی دستگاه‌ها"
          style={{
            ...BTN, padding: '8px 14px', fontSize: 12.5,
            background: 'rgba(0,0,0,0.03)', borderColor: LINE, color: SEC,
          }}>
          خروج از همه‌ی دستگاه‌ها
        </button>
        {msg && (
          <span style={{ flexBasis: '100%', fontSize: 12, fontWeight: 700, color: msg.bad ? RED : FELT }}>
            {msg.text}
          </span>
        )}
      </div>
    )
  }

  /* ── حالتِ باز ── */
  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 13, padding: 14, background: '#FAFAF7' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 13.5, fontWeight: 900, color: INK }}>{verb}ِ عبور</span>
        <button type="button" onClick={reset} aria-label="بستن"
          style={{ marginInlineStart: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: MUT, display: 'flex' }}>
          <X size={15} />
        </button>
      </div>
      <p style={{ fontSize: 12, color: MUT, margin: '0 0 12px', lineHeight: 1.95 }}>
        {hasPassword === false
          ? 'حسابتان با کدِ پیامکی ساخته شده و هنوز رمزی ندارد. با تعیینِ رمز می‌توانید بدونِ پیامک هم وارد شوید.'
          : 'پس از تغییرِ رمز، همه‌ی دستگاه‌ها — از جمله همین دستگاه — از حساب خارج می‌شوند و باید دوباره وارد شوید.'}
      </p>

      <div style={{ display: 'grid', gap: 10 }}>
        {hasPassword !== false && (
          <Secret value={current} onChange={v => { setCurrent(v); setMsg(null) }}
            placeholder="رمزِ فعلی" autoFocus />
        )}
        <Secret value={next} onChange={v => { setNext(v); setMsg(null) }}
          placeholder="رمزِ تازه" autoFocus={hasPassword === false} />
        <Secret value={confirm} onChange={v => { setConfirm(v); setMsg(null) }}
          placeholder="تکرارِ رمزِ تازه" onEnter={() => void submit()} />

        <ul style={{ listStyle: 'none', padding: 0, margin: '2px 0 0', display: 'grid', gap: 5 }}>
          {RULES.map(r => {
            const good = r.ok(next)
            return (
              <li key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: good ? FELT : MUT }}>
                <span style={{
                  width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${good ? 'rgba(14,122,56,0.35)' : LINE}`,
                  background: good ? 'rgba(14,122,56,0.09)' : '#fff',
                }}>
                  {good && <Check size={10} strokeWidth={3} />}
                </span>
                {r.label}
              </li>
            )
          })}
        </ul>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
          <button type="button" onClick={() => void submit()} disabled={busy}
            style={{ ...BTN, opacity: busy ? 0.6 : 1 }}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : null} ثبتِ رمزِ تازه
          </button>
          <button type="button" onClick={reset} disabled={busy}
            style={{ ...BTN, background: 'rgba(0,0,0,0.03)', borderColor: LINE, color: SEC }}>
            انصراف
          </button>
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

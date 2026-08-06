'use client'

/* مودال احراز هویت — هر کاربر لاگین می‌تواند خودش را verified کند:
   تأیید شماره با کد پیامکی (OTP) + تطبیق کد ملی با شماره (شاهکار). */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ShieldCheck, MessageSquare, Fingerprint, Loader2, Check } from 'lucide-react'
import { useAuthStore } from '../store/auth.store'
import { sendOtp, verifyOtp, verifyIdentity } from '../lib/otp-client'
import { isValidNationalId } from '../lib/national-id'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD = '#C7A66A', GOLD_D = '#9A6E38', FELT = '#0E7A38'

type Phase = 'phone' | 'otp' | 'nid'

export default function IdentityVerify({ open, onClose, onVerified }: { open: boolean; onClose: () => void; onVerified: () => void }) {
  const { user, updateUser } = useAuthStore()
  const [phase, setPhase] = useState<Phase>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp]     = useState('')
  const [nid, setNid]     = useState('')
  const [busy, setBusy]   = useState(false)
  const [msg, setMsg]     = useState('')
  const [resendIn, setResendIn] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (open && !started.current) { started.current = true; setPhone(user?.phone || ''); setPhase('phone'); setOtp(''); setNid(''); setMsg('') }
    if (!open) started.current = false
  }, [open, user])
  useEffect(() => { if (resendIn <= 0) return; const t = setTimeout(() => setResendIn(s => s - 1), 1000); return () => clearTimeout(t) }, [resendIn])

  if (!open) return null

  const digits = (v: string, n: number) => v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '').slice(0, n)

  const doSend = async () => {
    const p = digits(phone, 11)
    if (!/^09\d{9}$/.test(p)) { setMsg('شماره موبایل معتبر نیست'); return }
    setBusy(true); setMsg('')
    const r = await sendOtp(p); setBusy(false)
    if (r.ok) { setPhase('otp'); setOtp(''); setResendIn(60); setMsg('') }
    else setMsg(r.message || 'ارسال کد ناموفق بود')
  }
  const doVerifyOtp = async () => {
    if (!/^\d{4,6}$/.test(otp.trim())) { setMsg('کد را کامل وارد کنید'); return }
    setBusy(true); setMsg('')
    const r = await verifyOtp(digits(phone, 11), otp.trim()); setBusy(false)
    if (r.ok) { setPhase('nid'); setMsg('') } else setMsg(r.message || 'کد نادرست است')
  }
  const doShahkar = async () => {
    const n = digits(nid, 10)
    if (!isValidNationalId(n)) { setMsg('کد ملی معتبر نیست'); return }
    setBusy(true); setMsg('')
    const r = await verifyIdentity(digits(phone, 11), n); setBusy(false)
    if (!r.ok) { setMsg(r.message || 'استعلام احراز هویت ناموفق بود'); return }
    if (!r.match) { setMsg('کد ملی با این شماره مطابقت ندارد — شماره باید به‌نام خودتان باشد'); return }
    updateUser({ verified: true, phone: digits(phone, 11) })
    onVerified()
  }

  const titles: Record<Phase, string> = { phone: 'احراز هویت', otp: 'تأیید شماره', nid: 'تطبیق کد ملی' }
  const subs: Record<Phase, string> = {
    phone: 'برای فعال‌سازی امکانات ویژه (مثل انتشار ویدیو) شماره و کد ملی‌ات را تأیید کن',
    otp: `کد پیامک‌شده به ${digits(phone, 11)} را وارد کن`,
    nid: 'کد ملی باید به‌نام همین شماره باشد (استعلام سامانه‌ی شاهکار)',
  }

  return createPortal(
    <div dir="rtl" onClick={() => !busy && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(20,18,14,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'clamp(16px,6vh,80px) 16px', overflowY: 'auto', fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 22, border: `1px solid ${LINE}`, boxShadow: '0 40px 90px rgba(20,18,14,0.3)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '16px 20px', borderBottom: `1px solid ${LINE}` }}>
          <span style={{ display: 'inline-flex', width: 36, height: 36, borderRadius: 11, background: 'rgba(14,122,56,0.1)', color: FELT, alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={19} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 900, color: INK }}>{titles[phase]}</div>
            <div style={{ fontSize: 11.5, color: MUT, lineHeight: 1.7 }}>{subs[phase]}</div>
          </div>
          <button onClick={() => !busy && onClose()} aria-label="بستن" style={{ background: '#F4F3F1', border: `1px solid ${LINE}`, borderRadius: 10, padding: 8, cursor: 'pointer', color: SEC, display: 'flex', flexShrink: 0 }}><X size={16} /></button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {phase === 'phone' && (
            <>
              <Field icon={<MessageSquare size={16} />} value={phone} onChange={v => setPhone(digits(v, 11))} placeholder="مثال: 09121234567" ltr onEnter={doSend} />
              <Btn onClick={doSend} busy={busy} label="ارسال کد پیامکی" />
            </>
          )}
          {phase === 'otp' && (
            <>
              <input value={otp} onChange={e => { setOtp(digits(e.target.value, 6)); setMsg('') }} onKeyDown={e => e.key === 'Enter' && doVerifyOtp()} inputMode="numeric" maxLength={6} autoFocus placeholder="-----"
                /* تورفتگی نصفِ letter-spacing است؛ توضیحش در فرمِ ثبت‌نام */
                style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '0.5em', textIndent: '0.25em', fontSize: 24, fontWeight: 800, direction: 'ltr', padding: '13px', borderRadius: 13, border: `1px solid ${LINE}`, background: '#FAF8F3', color: INK, outline: 'none', fontFamily: 'inherit' }} />
              <Btn onClick={doVerifyOtp} busy={busy} label="تأیید کد" icon={<Check size={16} />} />
              <button onClick={doSend} disabled={resendIn > 0 || busy} style={{ background: 'none', border: 'none', cursor: resendIn > 0 ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: resendIn > 0 ? MUT : GOLD_D, padding: 0 }}>
                {resendIn > 0 ? `ارسال مجدد تا ${resendIn.toLocaleString('fa-IR')} ثانیه` : 'ارسال مجدد کد'}
              </button>
            </>
          )}
          {phase === 'nid' && (
            <>
              <Field icon={<Fingerprint size={16} />} value={nid} onChange={v => setNid(digits(v, 10))} placeholder="کد ملی ۱۰ رقمی" ltr onEnter={doShahkar} />
              <Btn onClick={doShahkar} busy={busy} label="تأیید و احراز هویت" icon={<ShieldCheck size={16} />} />
            </>
          )}
          {msg && <p style={{ fontSize: 12.5, fontWeight: 700, color: '#B23B2E', textAlign: 'center', margin: 0 }}>{msg}</p>}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Field({ icon, value, onChange, placeholder, ltr, onEnter }: { icon: React.ReactNode; value: string; onChange: (v: string) => void; placeholder: string; ltr?: boolean; onEnter?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FAF8F3', border: `1px solid ${LINE}`, borderRadius: 13, padding: '0 13px' }}>
      <span style={{ color: GOLD_D, display: 'flex', flexShrink: 0 }}>{icon}</span>
      <input value={value} onChange={e => onChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && onEnter?.()} placeholder={placeholder} inputMode="numeric" autoFocus
        style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', padding: '13px 0', fontSize: 14, fontFamily: 'inherit', color: INK, direction: ltr ? 'ltr' : 'rtl', textAlign: ltr ? 'left' : 'right' }} />
    </div>
  )
}
function Btn({ onClick, busy, label, icon }: { onClick: () => void; busy: boolean; label: string; icon?: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={busy}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 13, border: 'none', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, background: GOLD, color: '#241B08' }}>
      {busy ? <Loader2 size={17} style={{ animation: 'ivspin 1s linear infinite' }} /> : icon}{busy ? 'لطفاً صبر کنید…' : label}
      <style>{`@keyframes ivspin { to { transform: rotate(360deg); } }`}</style>
    </button>
  )
}

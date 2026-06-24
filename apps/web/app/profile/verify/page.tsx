'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ─── Helpers ──────────────────────────────────────────────────
function toFa(v: string | number) {
  return String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
}

function toEn(v: string) {
  return v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
}

function authHeader(): Record<string, string> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('auth-storage') : null
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    const token = parsed?.state?.token
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

// ─── Steps ────────────────────────────────────────────────────
function Steps({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'کد ملی' },
    { n: 2, label: 'پیامک' },
    { n: 3, label: 'تأیید' },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
      {steps.map((s, i) => (
        <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: s.n < current ? '#10b981' : s.n === current ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
              border: `2px solid ${s.n <= current ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
              color: s.n < current ? '#0a0f0d' : s.n === current ? '#10b981' : '#475569',
              transition: 'all 0.3s',
            }}>
              {s.n < current ? <i className="ti ti-check" style={{ fontSize: 14 }} /> : toFa(s.n)}
            </div>
            <span style={{ fontSize: 10, color: s.n === current ? '#10b981' : '#475569' }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: 60, height: 2, margin: '0 4px', marginBottom: 16, background: s.n < current ? '#10b981' : 'rgba(255,255,255,0.06)', transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── OTP Input ────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '')

  const handleChange = (i: number, v: string) => {
    // قبول هر دو عدد فارسی و انگلیسی
    const en = toEn(v).replace(/\D/g, '').slice(0, 1)
    if (en === '' && v !== '') return
    const arr = Array.from({ length: 6 }, (_, j) => value[j] ?? '')
    arr[i] = en
    onChange(arr.join(''))
    if (en && i < 5) document.getElementById(`otp-${i + 1}`)?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus()
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', direction: 'ltr' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d ? toFa(d) : ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          style={{
            width: 44, height: 52, textAlign: 'center',
            background: d ? 'rgba(16,185,129,0.1)' : '#111a15',
            border: `1.5px solid ${d ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 12, fontSize: 22, fontWeight: 700,
            color: '#e2e8f0', outline: 'none', fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
        />
      ))}
    </div>
  )
}

// ─── Error box ────────────────────────────────────────────────
function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ marginTop: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 8 }}>
      <i className="ti ti-alert-circle" style={{ fontSize: 16, flexShrink: 0 }} />
      {msg}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────
export default function VerifyPage() {
  const router = useRouter()

  const [step, setStep]       = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Step 1
  const [nationalId, setNationalId] = useState('')
  const [firstName, setFirstName]   = useState('')
  const [lastName, setLastName]     = useState('')

  // Step 2
  const [otp, setOtp]           = useState('')
  const [countdown, setCountdown] = useState(0)

  const startCountdown = () => {
    setCountdown(120)
    const t = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 })
    }, 1000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: '#111a15', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, padding: '12px 14px', color: '#e2e8f0',
    fontSize: 14, fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.2s',
  }

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    width: '100%', marginTop: 16, padding: '13px', borderRadius: 12, border: 'none',
    background: disabled ? '#1a2e24' : '#10b981',
    color: disabled ? '#2d4a38' : '#0a0f0d',
    fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  })

  // ── Step 1: تأیید کد ملی ──
  const handleNationalId = async () => {
    const enId = toEn(nationalId)
    if (enId.length !== 10) { setError('کد ملی باید ۱۰ رقم باشد'); return }
    if (!firstName.trim() || !lastName.trim()) { setError('نام و نام خانوادگی الزامی است'); return }

    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/auth/verify/national-id', {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationalId: enId, firstName, lastName }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.message ?? 'خطا در تأیید کد ملی')
      setStep(2)
      await handleSendOtp()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: ارسال OTP ──
  const handleSendOtp = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/auth/verify/otp/send', {
        method: 'POST',
        headers: authHeader(),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.message ?? 'خطا در ارسال پیامک')
      setSuccess(j.message)
      startCountdown()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: تأیید OTP ──
  const handleConfirmOtp = async () => {
    if (otp.length !== 6) { setError('کد ۶ رقمی را وارد کنید'); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/auth/verify/otp/confirm', {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otp }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.message ?? 'کد اشتباه است')
      setStep(3)
      setTimeout(() => router.push('/profile/me'), 1800)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />

      <div style={{ minHeight: '100vh', background: '#0a0f0d', fontFamily: 'Vazirmatn, Tahoma, sans-serif', direction: 'rtl', position: 'relative', overflow: 'hidden' }}>

        {/* orbs */}
        <div style={{ position: 'fixed', width: 360, height: 360, background: 'radial-gradient(circle,rgba(16,185,129,0.15) 0%,transparent 70%)', top: -100, right: -80, filter: 'blur(55px)', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'fixed', width: 260, height: 260, background: 'radial-gradient(circle,rgba(16,185,129,0.08) 0%,transparent 70%)', bottom: 60, left: -60, filter: 'blur(55px)', zIndex: 0, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 420, margin: '0 auto', padding: '40px 20px 80px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: '4px 14px', fontSize: 11, color: '#10b981', marginBottom: 14 }}>
              <i className="ti ti-shield-check" style={{ fontSize: 13 }} />
              احراز هویت
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' }}>
              {step === 3 ? 'احراز هویت کامل شد' : 'تأیید هویت کاربر'}
            </h1>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
              {step === 1 && 'کد ملی خود را با نام ثبت‌نامی تطبیق دهید'}
              {step === 2 && 'کد تأیید ارسال‌شده به موبایل را وارد کنید'}
              {step === 3 && 'اکنون به همه امکانات دسترسی دارید'}
            </p>
          </div>

          <Steps current={step} />

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div style={{ background: '#111a15', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '24px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
                      نام <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="نام"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
                      نام خانوادگی <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="نام خانوادگی"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
                    کد ملی <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    value={nationalId}
                    onChange={e => {
                      // قبول هر دو فارسی و انگلیسی، نمایش فارسی
                      const en = toEn(e.target.value).replace(/\D/g, '').slice(0, 10)
                      setNationalId(en)
                    }}
                    placeholder="۰۰۰۰۰۰۰۰۰۰"
                    inputMode="numeric"
                    style={{ ...inputStyle, letterSpacing: 6, textAlign: 'center', fontSize: 18, direction: 'ltr' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
                    <span style={{ fontSize: 16, letterSpacing: 6, color: '#10b981', fontWeight: 700, direction: 'ltr' }}>
                      {toFa(nationalId).padEnd(10, '·')}
                    </span>
                  </div>
                  <p style={{ fontSize: 10, color: '#475569', margin: '4px 0 0', textAlign: 'center' }}>
                    {toFa(nationalId.length)}/۱۰ رقم
                  </p>
                </div>
              </div>

              {error && <ErrorBox msg={error} />}

              <button onClick={handleNationalId} disabled={loading} style={btnStyle(loading)}>
                {loading
                  ? <><i className="ti ti-loader-2" style={{ fontSize: 16 }} />در حال بررسی...</>
                  : <><i className="ti ti-arrow-left" style={{ fontSize: 16 }} />ادامه</>
                }
              </button>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div style={{ background: '#111a15', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '24px 20px' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <i className="ti ti-device-mobile-message" style={{ fontSize: 26, color: '#10b981' }} />
                </div>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.7 }}>
                  کد ۶ رقمی به شماره موبایل ثبت‌شده
                  <br />
                  <span style={{ color: '#10b981', fontWeight: 600 }}>ارسال شد</span>
                </p>
                {success && <p style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{success}</p>}
              </div>

              <OtpInput value={otp} onChange={setOtp} />

              {countdown > 0 && (
                <p style={{ textAlign: 'center', fontSize: 12, color: '#475569', margin: '14px 0 0' }}>
                  ارسال مجدد تا <span style={{ color: '#10b981', fontWeight: 700 }}>{toFa(countdown)}</span> ثانیه دیگر
                </p>
              )}

              {countdown === 0 && (
                <button onClick={handleSendOtp} disabled={loading} style={{ width: '100%', marginTop: 12, padding: '10px', borderRadius: 10, border: '1px solid rgba(16,185,129,0.3)', background: 'transparent', color: '#10b981', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                  ارسال مجدد کد
                </button>
              )}

              {error && <ErrorBox msg={error} />}

              <button onClick={handleConfirmOtp} disabled={loading || otp.length < 6} style={btnStyle(loading || otp.length < 6)}>
                {loading
                  ? <><i className="ti ti-loader-2" style={{ fontSize: 16 }} />در حال بررسی...</>
                  : <><i className="ti ti-check" style={{ fontSize: 16 }} />تأیید کد</>
                }
              </button>

              <button onClick={() => setStep(1)} style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: '#64748b', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                بازگشت
              </button>
            </div>
          )}

          {/* ── Step 3: موفق ── */}
          {step === 3 && (
            <div style={{ background: '#111a15', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 32px rgba(16,185,129,0.2)' }}>
                <i className="ti ti-check" style={{ fontSize: 36, color: '#10b981' }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', margin: '0 0 8px' }}>هویت شما تأیید شد</h2>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 24px', lineHeight: 1.7 }}>
                اکنون می‌توانید از همه امکانات بیلیارد پلاس استفاده کنید
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: 'ti-table', label: 'رزرو میز' },
                  { icon: 'ti-shopping-bag', label: 'خرید و فروش' },
                  { icon: 'ti-eye', label: 'مشاهده استوری' },
                ].map(f => (
                  <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: '10px 14px' }}>
                    <i className={`ti ${f.icon}`} style={{ fontSize: 18, color: '#10b981' }} />
                    <span style={{ fontSize: 13, color: '#94a3b8', flex: 1 }}>{f.label}</span>
                    <i className="ti ti-check" style={{ fontSize: 14, color: '#10b981' }} />
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#475569', marginTop: 20 }}>در حال انتقال به پروفایل...</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

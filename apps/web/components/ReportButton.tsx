'use client'

/* گزارش تخلف — مثل دیوار: یک آیکون کوچک کنار هر آگهی، یک پنجره‌ی
   انتخاب دلیل، و ثبت در پنل ادمین. برای استفاده در کارت آگهی
   (variant="icon") و در صفحه‌ی جزئیات (variant="link" یا "button"). */

import { useEffect, useState } from 'react'
import { Flag, X, Loader2, CheckCircle2 } from 'lucide-react'
import { apiFetch } from '../lib/http'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

const REASONS = [
  { code: 'fake',      label: 'آگهی جعلی یا گمراه‌کننده' },
  { code: 'sold',      label: 'کالا فروخته شده / موجود نیست' },
  { code: 'price',     label: 'قیمت غیرواقعی یا فریب‌آمیز' },
  { code: 'duplicate', label: 'آگهی تکراری' },
  { code: 'scam',      label: 'کلاهبرداری یا درخواست بیعانه' },
  { code: 'contact',   label: 'شماره تماس اشتباه یا پاسخگو نیست' },
  { code: 'illegal',   label: 'کالای غیرمجاز یا خلاف قوانین' },
  { code: 'abuse',     label: 'محتوای توهین‌آمیز یا نامناسب' },
  { code: 'other',     label: 'موارد دیگر' },
]


interface Props {
  targetType?: 'product' | 'club' | 'user' | 'media' | 'ad'
  targetId: string | number
  targetTitle?: string
  variant?: 'icon' | 'link' | 'button'
  /* برای کارت‌هایی که خودشان داخل <Link> هستند */
  stopPropagation?: boolean
  className?: string
  style?: React.CSSProperties
}

export default function ReportButton({
  targetType = 'product', targetId, targetTitle,
  variant = 'icon', stopPropagation = true, className, style,
}: Props) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  /* قفل اسکرول پس‌زمینه وقتی پنجره باز است */
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  const submit = async () => {
    if (!code) { setErr('لطفاً دلیل گزارش را انتخاب کنید'); return }
    setBusy(true); setErr('')
    try {
      const r = await apiFetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType, targetId: String(targetId), targetTitle: targetTitle ?? '',
          targetUrl: typeof window !== 'undefined' ? window.location.href : '',
          reasonCode: code, details,
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message || 'ثبت گزارش انجام نشد'); return }
      setDone(true)
      setTimeout(() => { setOpen(false); setDone(false); setCode(''); setDetails('') }, 1800)
    } catch { setErr('خطا در ارتباط با سرور') }
    finally { setBusy(false) }
  }

  const openModal = (e: React.MouseEvent) => {
    if (stopPropagation) { e.preventDefault(); e.stopPropagation() }
    setOpen(true); setErr(''); setDone(false)
  }

  return (
    <>
      {variant === 'icon' && (
        <button type="button" onClick={openModal} aria-label="گزارش تخلف" title="گزارش تخلف"
          className={className}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: MUT, ...style }}>
          <Flag size={15} />
        </button>
      )}
      {variant === 'link' && (
        <button type="button" onClick={openModal} className={className}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: MUT, padding: 0, ...style }}>
          <Flag size={13} /> گزارش تخلف
        </button>
      )}
      {variant === 'button' && (
        <button type="button" onClick={openModal} className={className}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 16px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, background: '#fff', border: `1px solid ${LINE}`, color: SEC, ...style }}>
          <Flag size={14} /> گزارش تخلف
        </button>
      )}

      {open && (
        <div onClick={() => !busy && setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(20,18,14,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div dir="rtl" onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 20, border: `1px solid ${LINE}`, padding: 20, fontFamily: 'var(--font-base)' }}>

            {done ? (
              <div style={{ textAlign: 'center', padding: '22px 6px' }}>
                <span style={{ display: 'inline-flex', width: 56, height: 56, borderRadius: 18, background: 'rgba(14,122,56,0.10)', color: FELT, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <CheckCircle2 size={26} />
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: INK, margin: '0 0 8px' }}>گزارش شما ثبت شد</h3>
                <p style={{ fontSize: 12.5, color: MUT, margin: 0, lineHeight: 2 }}>
                  کارشناسان بیلیارد هاب این مورد را بررسی می‌کنند. از همراهی شما ممنونیم.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
                  <span style={{ display: 'inline-flex', width: 36, height: 36, borderRadius: 11, background: 'rgba(178,59,46,0.08)', color: RED, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Flag size={17} />
                  </span>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: INK, margin: 0, flex: 1 }}>گزارش تخلف</h3>
                  <button onClick={() => setOpen(false)} aria-label="بستن"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUT, padding: 4, display: 'flex' }}>
                    <X size={17} />
                  </button>
                </div>

                {targetTitle && (
                  <div style={{ fontSize: 12, color: MUT, marginBottom: 14, lineHeight: 1.9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    مورد گزارش: <b style={{ color: SEC }}>{targetTitle}</b>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  {REASONS.map(r => {
                    const on = code === r.code
                    return (
                      <button key={r.code} type="button" onClick={() => { setCode(r.code); setErr('') }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'right',
                          padding: '11px 13px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                          fontSize: 13, fontWeight: on ? 800 : 600, color: on ? GOLD_D : SEC,
                          background: on ? 'rgba(199,166,106,0.10)' : '#FAF8F3',
                          border: `1px solid ${on ? 'rgba(199,166,106,0.42)' : LINE}`, transition: 'all .16s',
                        }}>
                        <span style={{
                          width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
                          border: `1.5px solid ${on ? GOLD_D : 'rgba(0,0,0,0.18)'}`,
                          background: on ? GOLD_D : 'transparent',
                          boxShadow: on ? 'inset 0 0 0 3px #fff' : 'none',
                        }} />
                        {r.label}
                      </button>
                    )
                  })}
                </div>

                <textarea value={details} onChange={e => setDetails(e.target.value)} rows={3}
                  placeholder={code === 'other' ? 'توضیح دهید (الزامی)' : 'توضیح بیشتر (اختیاری)'}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 12, border: `1px solid ${LINE}`, fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 2, marginBottom: 12, color: INK }} />

                {err && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: RED, marginBottom: 10, lineHeight: 1.9 }}>{err}</div>
                )}

                <div style={{ fontSize: 11, color: MUT, lineHeight: 1.95, marginBottom: 14 }}>
                  گزارش‌های نادرست و تکراری بررسی نمی‌شوند. بیلیارد هاب طرف معامله نیست و صحت آگهی‌ها بر عهده‌ی آگهی‌دهنده است.
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setOpen(false)} disabled={busy}
                    style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${LINE}`, background: '#F4F3F1', color: SEC, fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                    انصراف
                  </button>
                  <button onClick={submit} disabled={busy}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 12, border: '1px solid rgba(199,166,106,0.45)', background: 'rgba(199,166,106,0.14)', color: GOLD_D, fontSize: 13.5, fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                    {busy ? <Loader2 size={15} style={{ animation: 'rbspin 1s linear infinite' }} /> : <Flag size={14} />} ثبت گزارش
                  </button>
                </div>
              </>
            )}
            <style>{`@keyframes rbspin{to{transform:rotate(360deg)}}`}</style>
          </div>
        </div>
      )}
    </>
  )
}

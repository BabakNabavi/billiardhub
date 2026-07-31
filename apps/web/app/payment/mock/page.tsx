'use client'

/* درگاه شبیه‌سازی‌شده — فقط وقتی PAYMENT_PROVIDER=mock است استفاده می‌شود.
   کل چرخه (هدایت → پرداخت → کالبک → تأیید سروری) را واقعی اجرا می‌کند. */

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ShieldCheck, Loader2, X } from 'lucide-react'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const FELT = '#0E7A38'

export default function MockGatewayPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F5F3EE' }} />}>
      <MockGateway />
    </Suspense>
  )
}

function MockGateway() {
  const sp = useSearchParams()
  const authority = sp.get('authority') || ''
  const amount = Number(sp.get('amount') || 0)
  const callback = sp.get('callback') || ''
  const [busy, setBusy] = useState<'ok' | 'no' | null>(null)
  const [secs, setSecs] = useState(300)

  useEffect(() => { const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000); return () => clearInterval(t) }, [])

  const go = (ok: boolean) => {
    if (!callback) return
    setBusy(ok ? 'ok' : 'no')
    const sep = callback.includes('?') ? '&' : '?'
    window.location.href = `${callback}${sep}authority=${encodeURIComponent(authority)}&status=${ok ? 'OK' : 'NOK'}`
  }

  const fa = (n: number) => n.toLocaleString('fa-IR')
  const mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0')

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F5F3EE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 22, border: `1px solid ${LINE}`, boxShadow: '0 30px 70px rgba(28,27,23,0.12)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 11 }}>
          <span style={{ display: 'inline-flex', width: 38, height: 38, borderRadius: 12, background: 'rgba(14,122,56,0.1)', color: FELT, alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={20} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: INK }}>درگاه پرداخت آزمایشی</div>
            <div style={{ fontSize: 11.5, color: MUT }}>محیط تست — هیچ مبلغ واقعی جابه‌جا نمی‌شود</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: SEC, fontVariantNumeric: 'tabular-nums' }}>{fa(+mm)}:{fa(+ss)}</div>
        </div>

        <div style={{ padding: 22 }}>
          <div style={{ background: '#FAF8F3', border: `1px solid ${LINE}`, borderRadius: 16, padding: 18, marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: SEC }}>مبلغ قابل پرداخت</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: INK, fontVariantNumeric: 'tabular-nums' }}>{fa(amount)} <span style={{ fontSize: 12, fontWeight: 700, color: MUT }}>تومان</span></span>
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${LINE}`, fontSize: 11, color: MUT, direction: 'ltr', textAlign: 'left', wordBreak: 'break-all' }}>{authority.slice(0, 46)}…</div>
          </div>

          <button onClick={() => go(true)} disabled={!!busy}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 14, border: 'none', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 800, background: FELT, color: '#fff' }}>
            {busy === 'ok' ? <Loader2 size={18} style={{ animation: 'mspin 1s linear infinite' }} /> : <ShieldCheck size={18} />}
            پرداخت موفق
          </button>
          <button onClick={() => go(false)} disabled={!!busy}
            style={{ width: '100%', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 14, border: `1px solid ${LINE}`, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, background: '#fff', color: SEC }}>
            {busy === 'no' ? <Loader2 size={16} style={{ animation: 'mspin 1s linear infinite' }} /> : <X size={16} />}
            انصراف از پرداخت
          </button>
          <p style={{ fontSize: 11, color: MUT, textAlign: 'center', marginTop: 14, lineHeight: 1.9 }}>
            پس از بازگشت، پرداخت <b style={{ color: SEC }}>سمت سرور</b> تأیید و رزرو نهایی می‌شود.
          </p>
          <style>{`@keyframes mspin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </div>
  )
}

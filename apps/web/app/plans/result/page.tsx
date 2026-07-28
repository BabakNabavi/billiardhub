'use client'

/* نتیجه‌ی بازگشت از درگاهِ خریدِ بسته.
   وضعیتِ واقعی از سرور خوانده می‌شود، نه از پارامترِ آدرس — چون
   پارامتر را می‌شود دستکاری کرد. */

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react'
import { apiFetch } from '../../../lib/http'
import { toFaDigits, faDate } from '../../../lib/jalali'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#E7E2D6'
const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

const BTN: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none',
  background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D,
  borderRadius: 10, padding: '11px 20px', fontSize: 13.5, fontWeight: 800,
}

interface Quota {
  limit: number; used: number; period: 'day' | 'week' | 'month'
  planName: string | null; planExpiresAt: string | null
}
const PERIOD_FA = { day: 'روز', week: 'هفته', month: 'ماه' } as const
const fa = (n: number) => toFaDigits(n.toLocaleString('en-US'))

function Result() {
  const sp = useSearchParams()
  const ok = sp.get('ok') === '1'
  const reason = sp.get('reason') ?? ''

  const [quota, setQuota] = useState<Quota | null>(null)
  const [loading, setLoading] = useState(ok)

  useEffect(() => {
    if (!ok) return
    void apiFetch('/api/ads/quota', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => setQuota(j?.quota ?? null))
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [ok])

  return (
    <div dir="rtl" style={{
      minHeight: '70vh', background: '#F7F5F0', color: INK, fontFamily: 'Vazirmatn,Tahoma,sans-serif',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', border: `1px solid ${LINE}`, borderRadius: 20, padding: '36px 30px',
        maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 4px 20px rgba(28,27,23,0.06)',
      }}>
        {ok ? <CheckCircle2 size={40} style={{ color: FELT, marginBottom: 12 }} />
            : <XCircle size={40} style={{ color: RED, marginBottom: 12 }} />}

        <h1 style={{ fontSize: 19, fontWeight: 900, margin: '0 0 10px' }}>
          {ok ? 'بسته‌ی شما فعال شد' : 'پرداخت انجام نشد'}
        </h1>

        <p style={{ fontSize: 13.5, color: SEC, lineHeight: 2, margin: '0 0 20px' }}>
          {ok
            ? 'از این لحظه می‌توانید طبقِ سهمیه‌ی بسته آگهی ثبت کنید.'
            : (reason || 'پرداخت تکمیل نشد. اگر مبلغی کسر شده باشد، طیِ ۷۲ ساعت به حسابتان برمی‌گردد.')}
        </p>

        {ok && (
          loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: MUT, marginBottom: 18 }}>
              <Loader2 size={15} className="animate-spin" /><span style={{ fontSize: 12.5 }}>در حال دریافتِ وضعیتِ بسته…</span>
            </div>
          ) : quota && (
            <div style={{
              background: '#FAFAF7', border: `1px solid ${LINE}`, borderRadius: 14,
              padding: '14px 16px', marginBottom: 20, textAlign: 'right',
            }}>
              {quota.planName && (
                <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 6 }}>{quota.planName}</div>
              )}
              <div style={{ fontSize: 12.5, color: MUT, lineHeight: 2 }}>
                {quota.limit === 0
                  ? 'آگهیِ نامحدود'
                  : `${fa(Math.max(0, quota.limit - quota.used))} آگهی از ${fa(quota.limit)} تای این ${PERIOD_FA[quota.period]} مانده`}
                {quota.planExpiresAt ? <><br />اعتبار تا {faDate(quota.planExpiresAt)}</> : null}
              </div>
            </div>
          )
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href={ok ? '/shop/new' : '/plans'} style={BTN}>
            {ok ? 'ثبتِ آگهی' : 'انتخابِ دوباره‌ی بسته'} <ArrowLeft size={14} />
          </Link>
          <Link href="/dashboard" style={{ ...BTN, background: 'rgba(0,0,0,0.04)', borderColor: LINE, color: SEC }}>
            پنلِ من
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PlanResultPage() {
  return (
    <Suspense fallback={null}>
      <Result />
    </Suspense>
  )
}

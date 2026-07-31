'use client'

/* آمار بسته‌ی آگهی کاربر — در پنل هر نقشی نشان داده می‌شود:
   چه بسته‌ای دارد، تا کی اعتبار دارد، چند آگهی مانده و چه خریده.

   وقتی محدودیت خاموش است هم نمایش داده می‌شود ولی صریح می‌گوید که
   فعلاً محدودیتی اعمال نمی‌شود، تا کسی بی‌دلیل نگران نشود. */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Loader2, ArrowLeft, Check } from 'lucide-react'
import { apiFetch } from '../../lib/http'
import { toFaDigits, faDate } from '../../lib/jalali'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#E7E2D6'
const GOLD = '#C7A66A', GOLD_D = '#9A6E38', FELT = '#0E7A38'

type Period = 'day' | 'week' | 'month'
const PERIOD_FA: Record<Period, string> = { day: 'روز', week: 'هفته', month: 'ماه' }

interface Quota {
  enabled: boolean; allowed: boolean; used: number; limit: number
  period: Period; resetAt: string | null
  planName: string | null; planExpiresAt: string | null
  /* فاز ۳ — سهمیه‌ی شخص‌محور */
  identityRequired?: boolean
  role?: string
}
interface Order {
  id: string; amount: number; status: string; createdAt: string
  snapshot: { name?: string } | null
}

const fa = (n: number) => toFaDigits(n.toLocaleString('en-US'))

export default function MyAdPlan({ compact = false }: { compact?: boolean }) {
  const [quota, setQuota] = useState<Quota | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void apiFetch('/api/ads/quota', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (j?.quota) { setQuota(j.quota); setOrders(j.orders ?? []) } })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 9, color: MUT }}>
        <Loader2 size={15} className="animate-spin" /><span style={{ fontSize: 12.5 }}>در حال بارگذاری بسته…</span>
      </div>
    )
  }
  if (!quota) return null

  const unlimited = quota.limit === 0
  const left = unlimited ? Infinity : Math.max(0, quota.limit - quota.used)
  const pct = unlimited ? 0 : Math.min(100, Math.round((quota.used / Math.max(1, quota.limit)) * 100))
  const paid = orders.filter(o => o.status === 'PAID')

  return (
    <section dir="rtl" style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 18, fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Package size={17} style={{ color: GOLD_D }} />
        <h2 style={{ fontSize: 14.5, fontWeight: 900, color: INK, margin: 0 }}>بسته‌ی آگهی من</h2>
        <Link href="/plans" style={{ marginInlineStart: 'auto', fontSize: 12.5, fontWeight: 800, color: GOLD_D, textDecoration: 'none' }}>
          بسته‌ها ←
        </Link>
      </div>

      <div style={{ fontSize: 13.5, fontWeight: 800, color: INK, marginBottom: 4 }}>
        {quota.planName ?? 'بسته‌ی رایگان'}
      </div>
      <div style={{ fontSize: 12.5, color: MUT, lineHeight: 1.9, marginBottom: 12 }}>
        {unlimited
          ? 'ثبت آگهی نامحدود'
          : `${fa(quota.used)} از ${fa(quota.limit)} آگهی این ${PERIOD_FA[quota.period]} استفاده شده`}
        {quota.planExpiresAt ? ` · اعتبار تا ${faDate(quota.planExpiresAt)}` : ''}
      </div>

      {!unlimited && (
        <>
          <div style={{ height: 7, borderRadius: 4, background: '#F0EDE4', overflow: 'hidden', marginBottom: 8 }}>
            <div style={{
              width: `${pct}%`, height: '100%', borderRadius: 4,
              background: pct >= 100 ? '#B23B2E' : `linear-gradient(90deg,${GOLD},#8A6020)`,
              transition: 'width .4s ease',
            }} />
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: left === 0 ? '#B23B2E' : FELT, marginBottom: 12 }}>
            {left === 0 ? 'سهمیه‌ی این بازه تمام شده' : `${fa(left)} آگهی مانده`}
          </div>
        </>
      )}

      {!quota.enabled && (
        <p style={{ fontSize: 12, color: MUT, lineHeight: 1.9, margin: '0 0 12px' }}>
          در حال حاضر محدودیتی اعمال نمی‌شود؛ این عدد فقط برای اطلاع شماست.
        </p>
      )}

      {quota.enabled && quota.identityRequired && (
        <p style={{ fontSize: 12, color: '#B23B2E', fontWeight: 700, lineHeight: 1.9, margin: '0 0 12px' }}>
          سهمیه‌ی رایگان به هویت تأییدشده تعلق می‌گیرد؛ برای فعال‌شدنش،
          کد ملی خود را از{' '}
          <Link href="/profile/verify" style={{ color: GOLD_D, textDecoration: 'underline' }}>بخش احراز هویت</Link>
          {' '}تأیید کنید.
        </p>
      )}

      {quota.enabled && left === 0 && (
        <Link href="/plans" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none',
          background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D,
          borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 800, marginBottom: 4,
        }}>
          خرید بسته <ArrowLeft size={14} />
        </Link>
      )}

      {!compact && paid.length > 0 && (
        <div style={{ borderTop: `1px dashed ${LINE}`, marginTop: 12, paddingTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: SEC, marginBottom: 8 }}>خریدهای شما</div>
          <div style={{ display: 'grid', gap: 7 }}>
            {paid.slice(0, 5).map(o => (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: SEC }}>
                <Check size={13} style={{ color: FELT, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{o.snapshot?.name ?? 'بسته‌ی آگهی'}</span>
                <span style={{ color: MUT, fontVariantNumeric: 'tabular-nums' }}>{fa(o.amount)} تومان</span>
                <span style={{ color: MUT }}>{faDate(o.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

'use client'

/* داشبورد تبلیغ‌دهنده (فاز ۶) — کمپین‌های خود کاربر با وضعیت،
   پرداخت و آمارشان. هیچ عددی این‌جا محاسبه نمی‌شود؛ همه از سرور
   می‌آید تا با آنچه ادمین می‌بیند یکی باشد. */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Megaphone, Loader2, AlertCircle, Eye, MousePointerClick, Wallet, Plus, ArrowLeft,
} from 'lucide-react'
import { apiFetch } from '../../../lib/http'
import { toFaDigits, faDate } from '../../../lib/jalali'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

const CARD: React.CSSProperties = {
  background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18,
  padding: 'clamp(16px,2.2vw,24px)', marginBottom: 16,
}

const STATUS_FA: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'پیش‌نویس', color: MUT, bg: 'rgba(0,0,0,0.05)' },
  PENDING_PAYMENT: { label: 'در انتظار پرداخت', color: '#B7791F', bg: 'rgba(183,121,31,0.10)' },
  PENDING_REVIEW: { label: 'در انتظار بررسی', color: GOLD_D, bg: 'rgba(199,166,106,0.13)' },
  SCHEDULED: { label: 'زمان‌بندی‌شده', color: '#1D4ED8', bg: 'rgba(29,78,216,0.08)' },
  ACTIVE: { label: 'فعال', color: FELT, bg: 'rgba(14,122,56,0.09)' },
  EXPIRED: { label: 'منقضی', color: MUT, bg: 'rgba(0,0,0,0.05)' },
  REJECTED: { label: 'رد شده', color: RED, bg: 'rgba(178,59,46,0.08)' },
  CANCELLED: { label: 'لغو شده', color: RED, bg: 'rgba(178,59,46,0.08)' },
}
const PAY_FA: Record<string, string> = {
  PENDING: 'در انتظار پرداخت', PAID: 'پرداخت‌شده',
  FAILED: 'ناموفق', CANCELED: 'لغو‌شده', REFUNDED: 'بازگشت‌داده‌شده',
}

interface Campaign {
  id: string; placementKey: string; placementTitle: string; planName: string | null
  title: string; status: string; startsAt: string; endsAt: string
  impressions: number; clicks: number; ctr: number
  /* تبلیغِ ویدیویی — برای بنر همیشه صفر */
  completedViews: number; skippedViews: number; skipRate: number
  amount: number | null; paymentStatus: string | null; createdAt: string
}
interface Totals {
  all: number; active: number; pending: number; scheduled: number; expired: number
  rejected: number; cancelled: number; impressions: number; clicks: number; ctr: number; spent: number
}

const fa = (n: number) => toFaDigits(n.toLocaleString('en-US'))

export default function AdvertiserDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null)
  const [totals, setTotals] = useState<Totals | null>(null)
  const [err, setErr] = useState('')
  const [filter, setFilter] = useState<string>('ALL')

  const load = useCallback(async () => {
    try {
      const r = await apiFetch('/api/ads/campaigns/mine', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message || 'برای دیدن تبلیغاتتان وارد شوید'); setCampaigns([]); return }
      setCampaigns(j.campaigns ?? [])
      setTotals(j.totals ?? null)
      setErr('')
    } catch { setErr('خطا در ارتباط با سرور'); setCampaigns([]) }
  }, [])
  useEffect(() => { void load() }, [load])

  const shown = (campaigns ?? []).filter(c => filter === 'ALL' || c.status === filter)

  const TABS: { key: string; label: string; n?: number }[] = [
    { key: 'ALL', label: 'همه', n: totals?.all },
    { key: 'ACTIVE', label: 'فعال', n: totals?.active },
    { key: 'PENDING_REVIEW', label: 'در انتظار بررسی' },
    { key: 'PENDING_PAYMENT', label: 'در انتظار پرداخت' },
    { key: 'SCHEDULED', label: 'زمان‌بندی‌شده', n: totals?.scheduled },
    { key: 'EXPIRED', label: 'منقضی', n: totals?.expired },
    { key: 'REJECTED', label: 'رد شده', n: totals?.rejected },
    { key: 'CANCELLED', label: 'لغو شده', n: totals?.cancelled },
  ]

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-base)', padding: 'clamp(14px,2.5vw,28px)', maxWidth: 1100, margin: '0 auto', minHeight: '70vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        <Megaphone size={21} style={{ color: GOLD_D }} />
        <h1 style={{ fontSize: 21, fontWeight: 900, color: INK, margin: 0 }}>تبلیغات من</h1>
        <Link href="/advertise" style={{
          marginInlineStart: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)',
          color: GOLD_D, borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 800, textDecoration: 'none',
        }}>
          <Plus size={14} /> تبلیغ تازه
        </Link>
      </div>
      <p style={{ fontSize: 13, color: MUT, margin: '0 0 18px', lineHeight: 1.95 }}>
        وضعیت هر کمپین، مدت نمایش و آمار واقعی آن — همان اعدادی که در پنل مدیریت ثبت شده است.
      </p>

      {err && (
        <div style={{ ...CARD, borderColor: 'rgba(178,59,46,0.3)', display: 'flex', gap: 9, alignItems: 'center' }}>
          <AlertCircle size={17} style={{ color: RED }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: RED }}>{err}</span>
        </div>
      )}

      {campaigns === null ? (
        <div style={{ ...CARD, display: 'flex', gap: 9, alignItems: 'center', color: MUT }}>
          <Loader2 size={16} className="animate-spin" /><span style={{ fontSize: 13 }}>در حال بارگذاری…</span>
        </div>
      ) : (
        <>
          {/* ── آمار کلی ── */}
          {totals && totals.all > 0 && (
            <div style={{ display: 'grid', gap: 11, gridTemplateColumns: 'repeat(auto-fit,minmax(148px,1fr))', marginBottom: 16 }}>
              {[
                { icon: <Megaphone size={14} />, label: 'کمپین فعال', value: fa(totals.active), color: FELT },
                { icon: <Eye size={14} />, label: 'نمایش', value: fa(totals.impressions) },
                { icon: <MousePointerClick size={14} />, label: 'کلیک', value: fa(totals.clicks), hint: `نرخ کلیک ${toFaDigits(totals.ctr.toFixed(2))}٪` },
                { icon: <Wallet size={14} />, label: 'هزینه‌ی پرداخت‌شده', value: `${fa(totals.spent)} تومان`, color: GOLD_D },
              ].map(k => (
                <div key={k.label} style={{ border: `1px solid ${LINE}`, borderRadius: 14, padding: '13px 15px', background: '#FAFAF7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7, color: k.color ?? MUT }}>
                    {k.icon}<span style={{ fontSize: 11.5, fontWeight: 800, color: SEC }}>{k.label}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: k.color ?? INK, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
                  {k.hint && <div style={{ fontSize: 11, color: MUT, marginTop: 3 }}>{k.hint}</div>}
                </div>
              ))}
            </div>
          )}

          {/* ── فیلتر وضعیت ── */}
          {campaigns.length > 0 && (
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setFilter(t.key)} style={{
                  border: `1px solid ${filter === t.key ? 'rgba(199,166,106,0.45)' : LINE}`,
                  background: filter === t.key ? 'rgba(199,166,106,0.13)' : '#fff',
                  color: filter === t.key ? GOLD_D : SEC,
                  borderRadius: 20, padding: '6px 13px', fontSize: 12, fontWeight: 800,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {t.label}{t.n !== undefined && t.n > 0 ? ` (${toFaDigits(t.n)})` : ''}
                </button>
              ))}
            </div>
          )}

          {/* ── فهرست ── */}
          {campaigns.length === 0 ? (
            <div style={{ ...CARD, textAlign: 'center', padding: 34 }}>
              <p style={{ fontSize: 13.5, color: SEC, margin: '0 0 14px', lineHeight: 2 }}>
                هنوز تبلیغی ثبت نکرده‌اید. جایگاه‌های قابل خرید و تعرفه‌هایشان را ببینید.
              </p>
              <Link href="/advertise" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none',
                background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)',
                color: GOLD_D, borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 800,
              }}>
                شروع تبلیغ <ArrowLeft size={14} />
              </Link>
            </div>
          ) : shown.length === 0 ? (
            <p style={{ fontSize: 13, color: MUT, textAlign: 'center', padding: 24 }}>در این وضعیت کمپینی ندارید.</p>
          ) : (
            <div style={{ display: 'grid', gap: 11 }}>
              {shown.map(c => {
                const st = STATUS_FA[c.status] ?? STATUS_FA.DRAFT!
                return (
                  <div key={c.id} style={{ ...CARD, marginBottom: 0, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 900, color: INK }}>{c.title || c.placementTitle}</span>
                      <span style={{ fontSize: 11.5, color: MUT }}>· {c.placementTitle}</span>
                      {c.planName && (
                        <span style={{ fontSize: 10.5, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.13)', borderRadius: 20, padding: '2px 8px' }}>
                          {c.planName}
                        </span>
                      )}
                      <span style={{ marginInlineStart: 'auto', fontSize: 11, fontWeight: 800, color: st.color, background: st.bg, borderRadius: 20, padding: '4px 11px' }}>
                        {st.label}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', fontSize: 12, color: SEC }}>
                      <div><span style={{ color: MUT }}>شروع: </span>{faDate(c.startsAt)}</div>
                      <div><span style={{ color: MUT }}>پایان: </span>{faDate(c.endsAt)}</div>
                      <div style={{ fontVariantNumeric: 'tabular-nums' }}><span style={{ color: MUT }}>نمایش: </span>{fa(c.impressions)}</div>
                      <div style={{ fontVariantNumeric: 'tabular-nums' }}><span style={{ color: MUT }}>کلیک: </span>{fa(c.clicks)}</div>
                      <div style={{ fontVariantNumeric: 'tabular-nums' }}><span style={{ color: MUT }}>CTR: </span>{toFaDigits(c.ctr.toFixed(2))}٪</div>

                      {/* فقط برای تبلیغِ ویدیویی معنا دارد؛ برای بنر
                          همیشه صفر است و نشان‌دادنش گمراه‌کننده. */}
                      {(c.completedViews > 0 || c.skippedViews > 0) && (
                        <>
                          <div style={{ fontVariantNumeric: 'tabular-nums' }}>
                            <span style={{ color: MUT }}>تماشای کامل: </span>{fa(c.completedViews)}
                          </div>
                          <div style={{ fontVariantNumeric: 'tabular-nums' }}>
                            <span style={{ color: MUT }}>رد شده: </span>{fa(c.skippedViews)}
                          </div>
                          <div style={{ fontVariantNumeric: 'tabular-nums' }}>
                            <span style={{ color: MUT }}>نرخ رد کردن: </span>{toFaDigits(c.skipRate.toFixed(1))}٪
                          </div>
                        </>
                      )}

                      {c.amount !== null && (
                        <div style={{ fontVariantNumeric: 'tabular-nums' }}>
                          <span style={{ color: MUT }}>مبلغ: </span>{fa(c.amount)} تومان
                          {c.paymentStatus && (
                            <span style={{ color: c.paymentStatus === 'PAID' ? FELT : MUT, fontWeight: 700 }}>
                              {' '}({PAY_FA[c.paymentStatus] ?? c.paymentStatus})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

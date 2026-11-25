'use client'

import { Power, Loader2, AlertCircle, BarChart3, Eye, MousePointerClick, Wallet } from 'lucide-react'
import { faDec } from '../../../lib/jalali'
import { INK, SEC, MUT, LINE, GOLD_D, FELT, CARD, Stats, fa } from './shared'

/* ── آمار تبلیغات ───────────────────────────────────────────── */
export function StatsSection({ s }: { s: Stats }) {
  const KPI = ({ icon, label, value, hint, color }: {
    icon: React.ReactNode; label: string; value: string; hint?: string; color?: string
  }) => (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 14, padding: '13px 15px', background: '#FAFAF7', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7, color: color ?? MUT }}>
        {icon}<span style={{ fontSize: 11.5, fontWeight: 800, color: SEC }}>{label}</span>
      </div>
      <div style={{ fontSize: 19, fontWeight: 900, color: color ?? INK, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: MUT, marginTop: 3, lineHeight: 1.7 }}>{hint}</div>}
    </div>
  )

  return (
    <section style={CARD}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <BarChart3 size={17} style={{ color: GOLD_D }} />
        <h2 style={{ fontSize: 15, fontWeight: 900, color: INK, margin: 0 }}>آمار تبلیغات</h2>
      </div>

      <div style={{ display: 'grid', gap: 11, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', marginBottom: 14 }}>
        <KPI icon={<Power size={14} />} label="کمپین فعال" value={fa(s.campaigns.active)} color={FELT}
          hint={`از ${fa(s.campaigns.total)} کمپین`} />
        <KPI icon={<Loader2 size={14} />} label="در انتظار" value={fa(s.campaigns.pending)}
          hint={`${fa(s.campaigns.scheduled)} زمان‌بندی‌شده · ${fa(s.campaigns.draft)} پیش‌نویس`} />
        <KPI icon={<AlertCircle size={14} />} label="منقضی" value={fa(s.campaigns.expired)}
          hint={`${fa(s.campaigns.rejected + s.campaigns.cancelled)} رد/لغو`} />
        <KPI icon={<Eye size={14} />} label="نمایش" value={fa(s.impressions)} />
        <KPI icon={<MousePointerClick size={14} />} label="کلیک" value={fa(s.clicks)}
          hint={`نرخ کلیک ${faDec(s.ctr, 2)}٪`} />
        <KPI icon={<Wallet size={14} />} label="درآمد (تومان)" value={fa(s.revenue.total)} color={GOLD_D}
          hint={s.revenue.orders > 0
            ? `${fa(s.revenue.orders)} سفارش پرداخت‌شده`
            : 'فروش آنلاین جایگاه در فاز بعد فعال می‌شود'} />
      </div>

      {s.byPlacement.some(b => b.impressions > 0 || b.active > 0) && (
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 13, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 460 }}>
            <thead>
              <tr style={{ background: '#FAFAF7' }}>
                {['جایگاه', 'فعال', 'نمایش', 'کلیک', 'CTR'].map(h => (
                  <th key={h} style={{ textAlign: h === 'جایگاه' ? 'right' : 'center', padding: '9px 12px', fontSize: 11.5, fontWeight: 800, color: SEC, borderBottom: `1px solid ${LINE}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.byPlacement.map(b => (
                <tr key={b.key}>
                  <td style={{ padding: '9px 12px', fontWeight: 700, color: INK, borderBottom: `1px solid ${LINE}` }}>{b.title}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'center', color: b.active > 0 ? FELT : MUT, fontWeight: 800, borderBottom: `1px solid ${LINE}` }}>{fa(b.active)}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'center', color: SEC, fontVariantNumeric: 'tabular-nums', borderBottom: `1px solid ${LINE}` }}>{fa(b.impressions)}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'center', color: SEC, fontVariantNumeric: 'tabular-nums', borderBottom: `1px solid ${LINE}` }}>{fa(b.clicks)}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'center', color: SEC, fontVariantNumeric: 'tabular-nums', borderBottom: `1px solid ${LINE}` }}>{faDec(b.ctr, 2)}٪</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

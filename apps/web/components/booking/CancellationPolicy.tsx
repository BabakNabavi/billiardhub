'use client'

/* جدول قوانین لغو رزرو — یک کامپوننت برای همه‌ی صفحه‌ها.
   متن و درصدها از lib/finance/cancellation.ts می‌آید تا نمایش و
   محاسبه‌ی واقعی بازپرداخت هیچ‌وقت از هم جدا نشوند. */

import { CANCELLATION_POLICY, CANCELLATION_TITLE, BOOKING_TITLE, BOOKING_RULES } from '../../lib/finance/cancellation'
import { toFaDigits } from '../../lib/jalali'

const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E', MUT = 'rgba(0,0,0,0.42)'

const tone = (pct: number) => (pct === 100 ? FELT : pct === 0 ? RED : GOLD_D)
const bg = (pct: number) =>
  pct === 100 ? 'rgba(14,122,56,0.08)' : pct === 0 ? 'rgba(178,59,46,0.07)' : 'rgba(199,166,106,0.13)'

export default function CancellationPolicy({ compact = false }: { compact?: boolean }) {
  return (
    <div style={{
      background: '#FAF8F3', border: '1px solid #EAE5DA', borderRadius: compact ? 14 : 16,
      padding: compact ? '12px 14px' : '16px 18px', fontFamily: 'inherit',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7, marginBottom: compact ? 9 : 12,
        fontSize: compact ? 12.5 : 14, fontWeight: 900, color: '#1C1B17',
      }}>
        <svg width={compact ? 14 : 16} height={compact ? 14 : 16} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="9" stroke={GOLD_D} strokeWidth="1.8" />
          <path d="M12 7v5.5l3.5 2" stroke={GOLD_D} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {CANCELLATION_TITLE}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 6 : 8 }}>
        {CANCELLATION_POLICY.map(t => (
          <div key={t.minHoursBefore} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{
              flexShrink: 0, minWidth: compact ? 40 : 46, textAlign: 'center',
              padding: compact ? '3px 6px' : '4px 8px', borderRadius: 8,
              fontSize: compact ? 10.5 : 11.5, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
              color: tone(t.refundPercent), background: bg(t.refundPercent),
              border: `1px solid ${tone(t.refundPercent)}28`,
            }}>
              {t.refundPercent === 0 ? '—' : `${toFaDigits(t.refundPercent)}٪`}
            </span>
            <span style={{
              fontSize: compact ? 11.5 : 12.5, lineHeight: 1.85, color: 'rgba(0,0,0,0.62)', minWidth: 0,
            }}>
              {t.rule}
            </span>
          </div>
        ))}
      </div>

      {/* قوانین عمومی رزرو — کاربر باید هر دو دسته را پیش از پرداخت دیده باشد */}
      {!compact && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7, margin: '18px 0 12px',
            fontSize: 14, fontWeight: 900, color: '#1C1B17',
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke={GOLD_D} strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M14 3v6h6" stroke={GOLD_D} strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
            {BOOKING_TITLE}
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {BOOKING_RULES.map((r, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                <span style={{
                  flexShrink: 0, width: 5, height: 5, borderRadius: 3, marginTop: 8,
                  background: GOLD_D, opacity: 0.55,
                }} />
                <span style={{ fontSize: 12.5, lineHeight: 1.95, color: 'rgba(0,0,0,0.62)', minWidth: 0 }}>{r}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div style={{ fontSize: compact ? 10.5 : 11.5, color: MUT, marginTop: compact ? 8 : 11, lineHeight: 1.9 }}>
        مبلغ قابل بازگشت هنگام لغو، بر اساس زمان باقی‌مانده تا شروع رزرو محاسبه و پیش از تأیید به شما نمایش داده می‌شود.
      </div>
    </div>
  )
}

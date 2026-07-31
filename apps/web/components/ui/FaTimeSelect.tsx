'use client'

/* ─────────────────────────────────────────────────────────────
   انتخاب ساعت با ارقام فارسی.

   `<input type="time">` بومی همیشه ارقام لاتین و قالب AM/PM را
   نشان می‌دهد و هیچ راهی برای فارسی‌کردنش نیست — ظاهرش را مرورگر
   می‌سازد، نه ما. برای همین با دو `<select>` جایگزین می‌شود.

   مقدار همان `HH:MM` ۲۴ساعتی لاتین می‌ماند، پس جای هر
   `<input type="time">` می‌نشیند بدون تغییر منطق اطراف.
   ───────────────────────────────────────────────────────────── */

const FA = '۰۱۲۳۴۵۶۷۸۹'
const toFa = (v: string | number) => String(v).replace(/[0-9]/g, d => FA[+d]!)

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))

export default function FaTimeSelect({
  value, onChange, minuteStep = 15, disabled, ariaLabel, compact = false,
}: {
  /** `HH:MM` ۲۴ساعتی — همان قالب input type="time" */
  value: string
  onChange: (next: string) => void
  /** ۱۵ برای ساعت کاری، ۵ یا ۱ اگر دقت بیشتری لازم شد */
  minuteStep?: 1 | 5 | 10 | 15 | 30
  disabled?: boolean
  ariaLabel?: string
  compact?: boolean
}) {
  const [h = '09', m = '00'] = String(value || '09:00').split(':')
  const mins = Array.from({ length: Math.floor(60 / minuteStep) }, (_, i) =>
    String(i * minuteStep).padStart(2, '0'))

  /* اگر دقیقه‌ی فعلی روی پله نیست، خودش هم در فهرست بیاید تا مقدار
     ذخیره‌شده‌ی قبلی بی‌صدا عوض نشود. */
  const minuteList = mins.includes(m) ? mins : [...mins, m].sort()

  const sel: React.CSSProperties = {
    border: '1px solid #E7E2D6', borderRadius: 9,
    padding: compact ? '6px 7px' : '8px 9px',
    fontSize: compact ? 13 : 14, fontWeight: 700, color: '#1C1B17',
    background: '#fff', fontFamily: 'inherit', outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1,
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <select
        aria-label={ariaLabel ? `ساعت ${ariaLabel}` : 'ساعت'}
        disabled={disabled} value={h} style={sel}
        onChange={e => onChange(`${e.target.value}:${m}`)}
      >
        {HOURS.map(x => <option key={x} value={x}>{toFa(x)}</option>)}
      </select>
      <span style={{ color: '#8A8474', fontWeight: 800 }}>:</span>
      <select
        aria-label={ariaLabel ? `دقیقه‌ی ${ariaLabel}` : 'دقیقه'}
        disabled={disabled} value={m} style={sel}
        onChange={e => onChange(`${h}:${e.target.value}`)}
      >
        {minuteList.map(x => <option key={x} value={x}>{toFa(x)}</option>)}
      </select>
    </span>
  )
}

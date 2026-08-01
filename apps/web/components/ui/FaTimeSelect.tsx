'use client'

/* ─────────────────────────────────────────────────────────────
   انتخاب ساعت با ارقام فارسی.

   ورودیِ زمانِ بومیِ مرورگر همیشه ارقام لاتین و قالب AM/PM را نشان
   می‌دهد و هیچ راهی برای فارسی‌کردنش نیست — ظاهرش را مرورگر می‌سازد،
   نه ما. برای همین با دو کشوی خودِ پروژه جایگزین شده است.

   مقدار همان `HH:MM` ۲۴ساعتی لاتین می‌ماند، پس جای هر
   `<input type="time">` می‌نشیند بدون تغییر منطق اطراف.
   ───────────────────────────────────────────────────────────── */

import Select from './Select'

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

  /* دو کشوی بومی جای خود را به کشوی مشترکِ پروژه دادند: کشوی سیستم در
     هر سیستم‌عاملی شکل خودش را دارد و کنارِ بقیه‌ی فرم ناهماهنگ و
     ابتدایی دیده می‌شد. */
  const box: React.CSSProperties = { width: compact ? 62 : 72, flexShrink: 0 }

  /* `direction: ltr` روی خودِ قاب، وگرنه در صفحه‌ی راست‌به‌چپ اولین
     فرزند سمتِ راست می‌نشیند و «۰۹:۳۰» به شکلِ «۳۰:۰۹» دیده می‌شود —
     ساعت و دقیقه جابه‌جا. مقدارِ ذخیره‌شده همان HH:MM می‌ماند. */
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, direction: 'ltr' }}>
      <Select
        value={h} compact={compact} disabled={disabled} style={box}
        ariaLabel={ariaLabel ? `ساعت ${ariaLabel}` : 'ساعت'}
        options={HOURS.map(x => ({ value: x, label: toFa(x) }))}
        onChange={v => onChange(`${v}:${m}`)}
      />
      <span style={{ color: '#8A8474', fontWeight: 800 }}>:</span>
      <Select
        value={m} compact={compact} disabled={disabled} style={box}
        ariaLabel={ariaLabel ? `دقیقه‌ی ${ariaLabel}` : 'دقیقه'}
        options={minuteList.map(x => ({ value: x, label: toFa(x) }))}
        onChange={v => onChange(`${h}:${v}`)}
      />
    </span>
  )
}

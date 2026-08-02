'use client'

/* ─────────────────────────────────────────────────────────────
   ورودی عددی فارسی.

   چرا لازم شد: `PersianDigits` عمداً `<input>` را دست نمی‌زند، چون
   مقدار داخلش همان چیزی است که به سرور می‌رود و فارسی‌کردنش
   اعتبارسنجی و ذخیره را می‌شکند. نتیجه این بود که کاربر همه‌جا فارسی
   می‌دید جز داخل فیلدها — تعداد میز، قیمت، شماره، مبلغ.

   این کامپوننت همان مرز را درست می‌کشد:
     • آنچه **دیده** می‌شود فارسی است
     • آنچه **فرستاده** می‌شود همیشه لاتین
     • کاربر می‌تواند فارسی یا لاتین تایپ کند؛ هر دو پذیرفته می‌شود

   `value` و `onChange` با رشته‌ی لاتین کار می‌کنند، پس جای هر
   `<input>` عددی موجود می‌نشیند بدون تغییر منطق اطراف.
   ───────────────────────────────────────────────────────────── */

import { useId } from 'react'

const FA = '۰۱۲۳۴۵۶۷۸۹'

export const toFa = (v: string | number) =>
  String(v ?? '').replace(/[0-9]/g, d => FA[+d]!)

export const toLatin = (v: string) =>
  String(v ?? '')
    .replace(/[۰-۹]/g, ch => String(FA.indexOf(ch)))
    .replace(/[٠-٩]/g, ch => String('٠١٢٣٤٥٦٧٨٩'.indexOf(ch)))   // ارقام عربی هم

/** «۱۲۳۴۵۶» → «۱۲۳٬۴۵۶» */
export const groupFa = (latin: string) =>
  toFa(latin.replace(/\B(?=(\d{3})+(?!\d))/g, '٬'))

/* مبلغ به حروف — تا میلیارد، که برای این پروژه بیش از کافی است */
const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه']
const TEENS = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده']
const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود']
const HUNDREDS = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد']

function under1000(n: number): string {
  const parts: string[] = []
  const h = Math.floor(n / 100); const r = n % 100
  if (h) parts.push(HUNDREDS[h]!)
  if (r >= 10 && r < 20) parts.push(TEENS[r - 10]!)
  else {
    const t = Math.floor(r / 10); const o = r % 10
    if (t) parts.push(TENS[t]!)
    if (o) parts.push(ONES[o]!)
  }
  return parts.join(' و ')
}

/** «۵۰۰۰۰» → «پنجاه هزار» */
export function amountInWords(latin: string): string {
  const n = parseInt(toLatin(latin).replace(/\D/g, ''), 10)
  if (!Number.isFinite(n) || n <= 0) return ''
  const scales: [number, string][] = [
    [1_000_000_000, 'میلیارد'], [1_000_000, 'میلیون'], [1_000, 'هزار'], [1, ''],
  ]
  const out: string[] = []
  let rest = n
  for (const [unit, label] of scales) {
    const q = Math.floor(rest / unit)
    if (q > 0) { out.push(`${under1000(q)}${label ? ' ' + label : ''}`.trim()); rest %= unit }
  }
  return out.join(' و ')
}

export default function FaNumberInput({
  value, onChange, placeholder, maxLength = 15, grouped = false,
  style, className, disabled, readOnly, ariaLabel, dir = 'rtl',
}: {
  /** همیشه لاتین — همان چیزی که به سرور می‌رود */
  value: string | number
  onChange: (latin: string) => void
  placeholder?: string
  maxLength?: number
  /** جداکننده‌ی سه‌رقمی (برای مبلغ) */
  grouped?: boolean
  style?: React.CSSProperties
  className?: string
  disabled?: boolean
  /** فقط‌خواندنی — برخلافِ `disabled`، مقدار همچنان انتخاب و کپی
   *  می‌شود و صفحه‌خوان هم آن را می‌خواند. برای فیلدی که استعلام شده
   *  و قفل است، همین درست است نه خاموش‌کردنِ کامل. */
  readOnly?: boolean
  ariaLabel?: string
  dir?: 'rtl' | 'ltr'
}) {
  const id = useId()
  const latin = toLatin(String(value ?? '')).replace(/[^0-9]/g, '')
  const shown = latin === '' ? '' : (grouped ? groupFa(latin) : toFa(latin))

  return (
    <input
      id={id}
      aria-label={ariaLabel}
      type="text"
      inputMode="numeric"
      dir={dir}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      style={style}
      value={shown}
      /* راهنمای متن هم فارسی نشان داده می‌شود.

          فقط گره‌های متنی را عوض می‌کند و به ویژگی‌ها
         (attribute) دست نمی‌زند، پس placeholder لاتین می‌ماند — کاربر
         مقدار را فارسی می‌دید ولی راهنما را «1». چون خودِ این کامپوننت
         مسئول نمایش فارسی است، همین‌جا هم تبدیل می‌شود. */
      placeholder={placeholder === undefined ? undefined : toFa(placeholder)}
      onChange={e => {
        /* هرچه تایپ شد — فارسی، عربی، لاتین یا با جداکننده — به لاتین
           خالص تبدیل و همان بالا فرستاده می‌شود. */
        const next = toLatin(e.target.value).replace(/[^0-9]/g, '').slice(0, maxLength)
        onChange(next)
      }}
    />
  )
}

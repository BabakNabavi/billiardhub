'use client'
import { useId } from 'react'
import { CONTACT_SUBJECTS } from '@/lib/contact-subjects'

/* فیلدهای فرمِ تماس: برچسبِ همیشه‌پیدا بالای فیلد (نه فلوتینگ)، خطا زیرِ
   همان فیلد و وصل‌شده با aria-describedby. */

/* فهرستِ موضوع‌ها در lib/contact-subjects است — همان که سرور می‌پذیرد */

const INPUT =
  'w-full rounded-field border bg-surface px-4 text-body text-ink placeholder:text-ink-2/60 ' +
  'transition-[border-color,box-shadow] duration-base ease-smooth ' +
  'focus:outline-none focus:border-gold-deep focus:ring-4 focus:ring-gold/20'

export function Field({ label, value, onChange, error, type = 'text', ltr = false, textarea = false, inputMode, maxLength, autoComplete }: {
  label: string; value: string; onChange: (v: string) => void; error?: string
  type?: string; ltr?: boolean; textarea?: boolean
  inputMode?: 'numeric' | 'email'; maxLength?: number; autoComplete?: string
}) {
  const id = useId()
  const errId = `${id}-err`
  const shared = {
    id, value, 'aria-invalid': !!error || undefined, 'aria-describedby': error ? errId : undefined,
    className: `${INPUT} ${error ? 'border-danger/50' : 'border-line/10'}`,
  }
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-body font-bold text-ink">{label}</label>
      {textarea
        ? <textarea {...shared} rows={5} onChange={e => onChange(e.target.value)} className={`${shared.className} resize-y py-3`} />
        : <input {...shared} type={type} inputMode={inputMode} maxLength={maxLength} autoComplete={autoComplete}
            dir={ltr ? 'ltr' : undefined} onChange={e => onChange(e.target.value)}
            className={`${shared.className} h-12 ${ltr ? 'text-end' : ''}`} />}
      {error && <p id={errId} className="text-body font-bold text-danger">{error}</p>}
    </div>
  )
}

/* موضوع به‌صورتِ تراشه‌های رادیویی: همه‌ی گزینه‌ها یک‌جا دیده می‌شوند و
   صفحه‌کلید (پیکان‌ها) و صفحه‌خوان رفتارِ بومیِ رادیو را می‌گیرند. */
export function SubjectChips({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const name = useId()
  return (
    <fieldset className="flex flex-col gap-3" aria-describedby={error ? `${name}-err` : undefined}>
      <legend className="mb-3 text-body font-bold text-ink">موضوع پیام</legend>
      <div className="flex flex-wrap gap-2">
        {CONTACT_SUBJECTS.map(s => (
          <label key={s} className="relative cursor-pointer">
            <input type="radio" name={name} value={s} checked={value === s} onChange={() => onChange(s)} className="peer sr-only" />
            <span className="inline-flex min-h-11 items-center rounded-full border border-line/10 bg-surface px-4 text-body font-bold text-ink-2 transition-colors duration-base hover:border-gold/40 hover:text-ink peer-checked:border-gold/40 peer-checked:bg-gold/[.12] peer-checked:text-gold-text peer-focus-visible:ring-2 peer-focus-visible:ring-gold-deep peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface">
              {s}
            </span>
          </label>
        ))}
      </div>
      {error && <p id={`${name}-err`} className="text-body font-bold text-danger">{error}</p>}
    </fieldset>
  )
}

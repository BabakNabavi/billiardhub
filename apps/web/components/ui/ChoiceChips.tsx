/* ─────────────────────────────────────────────────────────────
   گزینه‌های تراشه‌ای — یک‌انتخابی (رادیو) یا چندانتخابی (چک‌باکس).

   ورودیِ بومیِ پنهان زیرِ هر تراشه: صفحه‌کلید، صفحه‌خوان و گروه‌بندیِ
   رادیو رایگان می‌آیند و حالت‌ها (انتخاب، فوکوس، خاموش) با `peer-*` از
   همان ورودی خوانده می‌شوند. `disabled` روی fieldset همه را با هم خاموش
   می‌کند (هنگامِ ارسال).
   ───────────────────────────────────────────────────────────── */

interface Option { key: string; label: string }

const CHIP = [
  'inline-flex min-h-11 cursor-pointer select-none items-center rounded-field border border-line/10 bg-surface px-4',
  'text-sm text-ink-2 transition-colors duration-base motion-reduce:transition-none',
  'hover:border-gold/[.34] hover:text-ink',
  'peer-checked:border-gold/[.34] peer-checked:bg-gold/[.12] peer-checked:font-semibold peer-checked:text-gold-text',
  'peer-focus-visible:ring-2 peer-focus-visible:ring-gold-deep peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-paper',
  'peer-disabled:cursor-not-allowed peer-disabled:opacity-55',
].join(' ')

export function ChoiceChips({ legend, hint, name, options, value, onChange, multiple = false, disabled = false }: {
  legend: string
  /** توضیحِ کوتاه کنارِ عنوان، مثلا «اختیاری» */
  hint?: string
  name: string
  options: readonly Option[]
  value: readonly string[]
  onChange: (next: string[]) => void
  multiple?: boolean
  disabled?: boolean
}) {
  const toggle = (key: string) => {
    if (!multiple) return onChange([key])
    onChange(value.includes(key) ? value.filter(k => k !== key) : [...value, key])
  }
  return (
    <fieldset className="mt-6" disabled={disabled}>
      <legend className="text-sm font-semibold text-ink">
        {legend}
        {hint && <span className="ms-2 text-xs font-normal text-ink-3">{hint}</span>}
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map(o => (
          <label key={o.key}>
            <input
              type={multiple ? 'checkbox' : 'radio'} name={name} value={o.key}
              checked={value.includes(o.key)} onChange={() => toggle(o.key)}
              className="peer sr-only"
            />
            <span className={CHIP}>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

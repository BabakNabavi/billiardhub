/* ═══════════════════════════════════════════════════════════════
   مشخصاتِ فنی — تایپ‌ها و قواعد. بدونِ داده.
   ───────────────────────────────────────────────────────────────
   تعریفِ فیلدها تا امروز در `specs.ts` هاردکد بود: ده فیلد برای چوب
   و ده برای میز، بدونِ متنِ راهنما، بدونِ توضیحِ گزینه، و بدونِ
   بازه‌ی مجاز. حالا از `data/specs_catalog.json` می‌آید — بیست‌ودو
   فیلد برای چوب و نوزده برای میز.

   ── چرا این فایل از `spec-catalog.ts` جداست ──
   همان قاعده‌ی کاتالوگِ برند: فرم یک کامپوننتِ کلاینت است و نباید
   JSON را ایستا وارد کند. این‌جا فقط شکل و منطق است.
   ═══════════════════════════════════════════════════════════════ */

export type SpecFieldType = 'number' | 'text' | 'select' | 'boolean' | 'multi_select'

export interface SpecOption {
  id: string
  label_fa: string
  label_en?: string
  /* ── چرا توضیح زیرِ گزینه ──
     فروشنده‌ی دستِ‌دوم اغلب نمی‌داند سنگِ میزش ایتالیایی است یا
     چینی. «تیره‌تر، ریزدانه، رایج در میزهای حرفه‌ای» همان چیزی است
     که کمکش می‌کند درست انتخاب کند — و داده‌ی درست‌تر می‌سازد. */
  note_fa?: string
}

export interface SpecField {
  id: string
  label_fa: string
  type: SpecFieldType
  required?: boolean
  placeholder?: string
  /** بازه‌ی مجازِ عددی — سرور هم همین را می‌سنجد */
  min?: number
  max?: number
  step?: number
  max_length?: number
  /** متنِ راهنما زیرِ برچسب؛ نه tooltip — روی موبایل tooltip دیده نمی‌شود */
  help_fa?: string
  /** مقدارهای رایج، به‌صورت چیپ‌های یک‌کلیکی زیرِ فیلدِ عددی */
  common?: number[]
  allow_other?: boolean
  options?: SpecOption[]
  /** فهرست از کاتالوگِ دیگری می‌آید، نه از خودِ این فایل */
  source?: string
  note_fa?: string
  /** فقط وقتی مقدارِ فیلدِ دیگری تعیین شده باشد فعال است */
  depends_on?: string
  /** با انتخابِ فیلدِ دیگری خودکار پر می‌شود — ولی قفل نمی‌شود */
  auto_from?: string
}

export interface SpecCatalogShape {
  specs: Record<string, SpecField[]>
  condition_options: SpecOption[]
}

/** `slate_thickness` ⟵ `slateThickness` — کلیدِ ذخیره در ستونِ specs */
export const specKey = (id: string): string =>
  id.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())

/* ── ترتیبِ نمایش ──
   سوییچ‌های بله/خیر ته فرم می‌روند، بعد از یک خطِ جداکننده. دلیلش
   چیدمان است: هر سوییچ یک ردیفِ کم‌ارتفاع است و قاطی‌شدنشان با
   فیلدهای دوستونی، شبکه را دندانه‌دار می‌کند. */
export const isToggle = (f: SpecField) => f.type === 'boolean'

export function splitFields(fields: SpecField[]): { main: SpecField[]; toggles: SpecField[] } {
  return {
    main: fields.filter(f => !isToggle(f)),
    toggles: fields.filter(isToggle),
  }
}

/* ── شمارشِ پیشرفت ──
   «۷ فیلد از ۲۲ تکمیل شد». عمداً درصد نیست: درصد فشار می‌آورد که
   پر شود، در حالی که همه‌ی این‌ها جز وضعیت اختیاری‌اند و فروشنده‌ی
   دستِ‌دوم واقعاً بعضی‌شان را نمی‌داند. */
export function countFilled(
  fields: SpecField[], values: Record<string, unknown>,
): { filled: number; total: number } {
  let filled = 0
  for (const f of fields) {
    const v = values[specKey(f.id)]
    if (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== '') filled++
  }
  return { filled, total: fields.length }
}

export interface SpecValidation { ok: boolean; errors: Record<string, string> }

/**
 * اعتبارسنجی — همین تابع را سرور هم صدا می‌زند.
 *  · فقط `condition` اجباری است؛ بقیه اختیاری‌اند.
 *  · عدد باید در بازه‌ی `min`/`max` باشد — بازه از خودِ JSON می‌آید
 *    نه از کد، تا اصلاحش دیپلوی نخواهد.
 *  · مقدارِ `select` باید یکی از گزینه‌ها باشد، مگر «سایر» فعال باشد.
 */
export function validateSpecs(
  fields: SpecField[], values: Record<string, unknown>,
): SpecValidation {
  const errors: Record<string, string> = {}
  for (const f of fields) {
    const key = specKey(f.id)
    const raw = values[key]
    const empty = raw === undefined || raw === null || String(raw).trim() === ''
    if (empty) {
      if (f.required) errors[key] = `${f.label_fa} الزامی است`
      continue
    }

    if (f.type === 'number') {
      const n = Number(String(raw).replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06f0)))
      if (!Number.isFinite(n)) errors[key] = 'عدد معتبر وارد کنید'
      else if (f.min !== undefined && n < f.min) errors[key] = `کمتر از ${f.min} نمی‌تواند باشد`
      else if (f.max !== undefined && n > f.max) errors[key] = `بیشتر از ${f.max} نمی‌تواند باشد`
    }

    if (f.type === 'text' && f.max_length && String(raw).length > f.max_length) {
      errors[key] = `حداکثر ${f.max_length} نویسه`
    }

    /* گزینه‌ی خارج از فهرست فقط وقتی مجاز است که «سایر» روشن باشد؛
       فهرست‌های `source`دار این‌جا سنجیده نمی‌شوند چون داده‌شان
       جای دیگری است. */
    if (f.type === 'select' && f.options && !f.source && !f.allow_other) {
      if (!f.options.some(o => o.id === raw)) errors[key] = 'گزینه‌ی نامعتبر'
    }

    if (f.type === 'multi_select' && f.options) {
      const arr = Array.isArray(raw) ? raw : []
      if (arr.some(v => !f.options!.some(o => o.id === v))) errors[key] = 'گزینه‌ی نامعتبر'
    }
  }
  return { ok: Object.keys(errors).length === 0, errors }
}

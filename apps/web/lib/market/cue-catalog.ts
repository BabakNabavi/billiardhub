/* ═══════════════════════════════════════════════════════════════
   کاتالوگِ چوب — داده. **فقط سمتِ سرور.**
   ───────────────────────────────────────────────────────────────
   چهار نوع، ۱۱۴ برند، ۴۴۷ مدل در `data/cue-catalog.json`.

   ── چرا این فایل به مرورگر نمی‌رود ──
   خودِ JSON نود و هشت کیلوبایت است. واردکردنش در یک کامپوننتِ
   کلاینت یعنی همان حجم در باندلِ **هر بازدیدکننده‌ی فرم** — در حالی
   که کلِ جاوااسکریپتِ صفحه‌ی اصلی امروز ۲۱۵ کیلوبایت است.

   پس منطقِ خالص (اعتبارسنجی، تایپ‌ها، برچسب‌ها) در `cue-rules.ts`
   نشسته که هیچ داده‌ای وارد نمی‌کند، و کلاینت فقط از آن‌جا می‌خواند.
   کلاینت برندهای **یک نوع** را از `/api/cue-catalog/[type]` می‌گیرد.

   تستِ «مرزِ سرور و کلاینت» در `scripts/test-tournaments.mjs`
   نگهبانِ همین است.
   ═══════════════════════════════════════════════════════════════ */

import raw from '../../data/cue-catalog.json'
import {
  CUE_TYPE_IDS, validateCueSelection,
  type CueBrand, type CueCountry, type CueModel, type CueSelection,
  type CueType, type CueValidation, type CueTypeId,
} from './cue-rules'

export * from './cue-rules'

interface CueCatalog {
  types: CueType[]
  countries: Record<string, CueCountry>
}

const catalog = raw as unknown as CueCatalog

export const CUE_COUNTRIES = catalog.countries

/** فقط شناسه و برچسب — سبک، برای پاس‌دادن از Server Component */
export const CUE_TYPE_OPTIONS = catalog.types.map(t => ({
  id: t.id,
  label_fa: t.label_fa,
  brandCount: t.brands.length,
}))

export function getCueType(typeId: string): CueType | undefined {
  return catalog.types.find(t => t.id === typeId)
}

export function getCueBrands(typeId: string): CueBrand[] {
  return getCueType(typeId)?.brands ?? []
}

/** برند از روی شناسه — در همه‌ی نوع‌ها می‌گردد، چون شناسه یکتاست */
export function getCueBrand(brandId: string): CueBrand | undefined {
  for (const t of catalog.types) {
    const b = t.brands.find(x => x.id === brandId)
    if (b) return b
  }
  return undefined
}

export function getCueModel(brandId: string, modelId: string): CueModel | undefined {
  return getCueBrand(brandId)?.models.find(m => m.id === modelId)
}

/** همان اعتبارسنجی، با کاتالوگِ کامل — نسخه‌ای که سرور صدا می‌زند */
export function validateCueOnServer(input: CueSelection): CueValidation {
  return validateCueSelection(input, getCueBrand)
}

export { CUE_TYPE_IDS }
export type { CueTypeId }

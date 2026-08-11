/* ═══════════════════════════════════════════════════════════════
   کاتالوگِ محصول — داده. **فقط سمتِ سرور.**
   ───────────────────────────────────────────────────────────────
   `data/cue-catalog.json`   — ۴ نوع · ۱۱۴ برند · ۴۴۷ مدل
   `data/table_catalog.json` — ۵ نوع ·  ۵۸ برند · ۱۲۱ مدل · سایزها

   ── چرا این فایل به مرورگر نمی‌رود ──
   دو JSON روی هم بیش از صد کیلوبایت‌اند. واردکردنشان در یک کامپوننتِ
   کلاینت یعنی همان حجم در باندلِ **هر بازدیدکننده‌ی فرم** — در حالی
   که کلِ جاوااسکریپتِ صفحه‌ی اصلی امروز ۲۱۵ کیلوبایت است.

   پس منطقِ خالص (اعتبارسنجی، تایپ‌ها، برچسب‌ها) در `catalog-rules.ts`
   نشسته که هیچ داده‌ای وارد نمی‌کند، و کلاینت فقط از آن‌جا می‌خواند.
   کلاینت برندهای **یک نوع** را از `/api/catalog/[category]/[type]`
   می‌گیرد.

   تستِ «مرزِ سرور و کلاینت» در `scripts/test-tournaments.mjs`
   نگهبانِ همین است.
   ═══════════════════════════════════════════════════════════════ */

import cueRaw from '../../data/cue-catalog.json'
import tableRaw from '../../data/table_catalog.json'
import {
  validateSelection,
  type CatalogBrand, type CatalogCountry, type CatalogId, type CatalogModel,
  type CatalogSelection, type CatalogSize, type CatalogType, type CatalogValidation,
} from './catalog-rules'

export * from './catalog-rules'

interface CatalogFile {
  types: CatalogType[]
  countries: Record<string, CatalogCountry>
}

const FILES: Record<CatalogId, CatalogFile> = {
  cue: cueRaw as unknown as CatalogFile,
  table: tableRaw as unknown as CatalogFile,
}

export const countriesOf = (category: CatalogId) => FILES[category].countries

/** فقط شناسه و برچسب — سبک، برای پاس‌دادن از Server Component */
export const typeOptions = (category: CatalogId) =>
  FILES[category].types.map(t => ({
    id: t.id,
    label_fa: t.label_fa,
    brandCount: t.brands.length,
  }))

export function getType(category: CatalogId, typeId: string): CatalogType | undefined {
  return FILES[category].types.find(t => t.id === typeId)
}

export function getBrands(category: CatalogId, typeId: string): CatalogBrand[] {
  return getType(category, typeId)?.brands ?? []
}

export function getSizes(category: CatalogId, typeId: string): CatalogSize[] {
  return getType(category, typeId)?.sizes ?? []
}

/** برند از روی شناسه — در همه‌ی نوع‌های همان کاتالوگ می‌گردد */
export function getBrand(category: CatalogId, brandId: string): CatalogBrand | undefined {
  for (const t of FILES[category].types) {
    const b = t.brands.find(x => x.id === brandId)
    if (b) return b
  }
  return undefined
}

export function getModel(
  category: CatalogId, brandId: string, modelId: string,
): CatalogModel | undefined {
  return getBrand(category, brandId)?.models.find(m => m.id === modelId)
}

/** همان اعتبارسنجی، با کاتالوگِ کامل — نسخه‌ای که سرور صدا می‌زند */
export function validateOnServer(input: CatalogSelection): CatalogValidation {
  const type = getType(input.category, input.type)
  return validateSelection(
    input,
    id => getBrand(input.category, id),
    { forceFreeInput: !!type?.force_free_input, sizes: type?.sizes ?? [] },
  )
}

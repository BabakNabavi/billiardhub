/* ═══════════════════════════════════════════════════════════════
   مشخصاتِ فنی — داده. **فقط سمتِ سرور.**
   ───────────────────────────────────────────────────────────────
   `data/specs_catalog.json` — ۲۲ فیلد برای چوب، ۱۹ برای میز، و
   هفت گزینه‌ی وضعیت.

   ── چرا کلاینت مستقیم نمی‌خواندش ──
   فایل کوچک‌تر از کاتالوگِ برند است، ولی همان قاعده برقرار است: فرم
   فیلدهای **یک دسته** را می‌خواهد، نه همه را. مسیرِ استاتیکِ
   `/api/specs/[category]` همان یکی را می‌دهد.
   ═══════════════════════════════════════════════════════════════ */

import raw from '../../data/specs_catalog.json'
import { validateSpecs, type SpecCatalogShape, type SpecField, type SpecOption } from './spec-rules'

export * from './spec-rules'

const catalog = raw as unknown as SpecCatalogShape

/** دسته‌هایی که تعریفِ مشخصاتِ اختصاصی دارند */
export const SPEC_CATEGORIES = Object.keys(catalog.specs)

export const hasSpecCatalog = (category: string): boolean =>
  Object.prototype.hasOwnProperty.call(catalog.specs, category)

export function getSpecFields(category: string): SpecField[] {
  return catalog.specs[category] ?? []
}

export const CONDITION_OPTIONS: SpecOption[] = catalog.condition_options

/** همان اعتبارسنجی، با تعریفِ کاملِ دسته — نسخه‌ای که سرور صدا می‌زند */
export function validateSpecsOnServer(category: string, values: Record<string, unknown>) {
  return validateSpecs(getSpecFields(category), values)
}

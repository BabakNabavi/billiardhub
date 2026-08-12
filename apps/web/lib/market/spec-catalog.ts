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
export const SPEC_CATEGORIES = [...Object.keys(catalog.specs), 'cloth']

export const hasSpecCatalog = (category: string): boolean =>
  Object.prototype.hasOwnProperty.call(catalog.specs, category)

/* ── دسته‌ی «پارچه» ──
   JSON بخشِ `specs.cloth` ندارد، ولی `specs.table` از قبل سه فیلدِ
   پارچه را با گزینه و متنِ راهنما دارد: نوع، رنگ و وضعیتِ پارچه.

   برای محصولِ «پارچه» همان‌ها برداشته می‌شوند — نه یک فهرستِ تازه.
   دلیلش این است که اگر روزی گزینه‌ای به رنگِ پارچه اضافه شود، هر دو
   جا با هم عوض می‌شوند. برند و مدل این‌جا نمی‌آیند: بالای فرم از
   زنجیره‌ی کاتالوگ گرفته می‌شوند.

   با اضافه‌شدنِ `specs.cloth` به JSON، این اشتقاق خودبه‌خود کنار
   می‌رود. */
const CLOTH_FROM_TABLE = ['cloth_type', 'cloth_color', 'cloth_condition']

export function getSpecFields(category: string): SpecField[] {
  const own = catalog.specs[category]
  if (own) return own
  if (category === 'cloth') {
    const t = catalog.specs.table ?? []
    return CLOTH_FROM_TABLE
      .map(id => t.find(f => f.id === id))
      .filter((f): f is SpecField => !!f)
  }
  return []
}

export const CONDITION_OPTIONS: SpecOption[] = catalog.condition_options

/** همان اعتبارسنجی، با تعریفِ کاملِ دسته — نسخه‌ای که سرور صدا می‌زند */
export function validateSpecsOnServer(category: string, values: Record<string, unknown>) {
  return validateSpecs(getSpecFields(category), values)
}

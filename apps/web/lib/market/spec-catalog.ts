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
import { ACCESSORY_TYPE_OF, isAccessoryCategory, isCatalogId, type CatalogSize } from './catalog-rules'
import { accessorySpecs, getType } from './catalog'
import { specKey, validateSpecs, type SpecCatalogShape, type SpecField, type SpecOption } from './spec-rules'

export * from './spec-rules'

const catalog = raw as unknown as SpecCatalogShape

/** دسته‌هایی که تعریفِ مشخصاتِ اختصاصی دارند */
export const SPEC_CATEGORIES = [...new Set([...Object.keys(catalog.specs), ...Object.keys(ACCESSORY_TYPE_OF)])]

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
  /* ── لوازم جانبی ──
     فیلدهایشان داخلِ خودِ `accessories_catalog.json` است، نه در
     `specs_catalog.json`: هر دسته کاملاً فرق دارد (کیسِ چوب ۹ فیلد،
     حوله ۳) و یک فهرستِ مشترک بی‌معنا بود. */
  if (isAccessoryCategory(category)) {
    return accessorySpecs(ACCESSORY_TYPE_OF[category]!) as unknown as SpecField[]
  }
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
/* ── فهرست‌هایی که داده‌شان در `specs_catalog.json` نیست ──
   قطرِ توپ و «نوع ست» و اندازه‌ی میز، گزینه‌هایشان از کاتالوگِ
   برند می‌آید و به نوعِ انتخاب‌شده وابسته است. `validateSpecs`
   عمداً ردشان می‌کند چون داده را ندارد — این‌جا که کاتالوگ در
   دست است، سنجیده می‌شوند.

   بدونِ این، آگهیِ توپِ اسنوکر می‌توانست قطرِ کارامبول بگیرد؛
   فرم اجازه نمی‌داد ولی فرم قابلِ اعتماد نیست. */
const SOURCE_LISTS: Record<string, 'sizes' | 'set_types'> = {
  'types[].sizes': 'sizes',
  'types[].set_types': 'set_types',
}

export function validateSpecsOnServer(
  category: string, values: Record<string, unknown>,
  /** نوعِ انتخاب‌شده — بدونش فهرست‌های `source`دار سنجیده نمی‌شوند */
  typeId?: string,
) {
  const fields = getSpecFields(category)
  const base = validateSpecs(fields, values)
  if (!typeId || !isCatalogId(category)) return base
  const t = getType(category, typeId)
  if (!t) return base

  const errors = { ...base.errors }
  for (const f of fields) {
    const which = f.source ? SOURCE_LISTS[f.source] : undefined
    if (!which) continue
    const key = specKey(f.id)
    const v = values[key]
    if (v === undefined || v === null || String(v).trim() === '') continue
    /* «سایر» متنِ آزاد است و در کلیدِ جداگانه می‌نشیند */
    if (v === '__other__') { if (!f.allow_other) errors[key] = 'گزینه‌ی نامعتبر'; continue }
    const list: CatalogSize[] = (t[which] ?? [])
    if (!list.some(o => o.id === v)) errors[key] = `${f.label_fa} برای نوع انتخاب‌شده نیست`
  }
  return { ok: Object.keys(errors).length === 0, errors }
}

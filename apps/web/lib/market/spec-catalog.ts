/* ═══════════════════════════════════════════════════════════════
   مشخصات فنی — داده. **فقط سمت سرور.**
   ───────────────────────────────────────────────────────────────
   `data/specs_catalog.json` — ۲۲ فیلد برای چوب، ۱۹ برای میز، و
   هفت گزینه‌ی وضعیت.

   ── چرا کلاینت مستقیم نمی‌خواندش ──
   فایل کوچک‌تر از کاتالوگ برند است، ولی همان قاعده برقرار است: فرم
   فیلدهای **یک دسته** را می‌خواهد، نه همه را. مسیر استاتیک
   `/api/specs/[category]` همان یکی را می‌دهد.
   ═══════════════════════════════════════════════════════════════ */

import raw from '../../data/specs_catalog.json'
import { ACCESSORY_TYPE_OF, isAccessoryCategory, isCatalogId, type CatalogSize } from './catalog-rules'
import { accessorySpecs, getType } from './catalog'
import { legacySpecKeys } from './specs'
import { isFieldHidden, specKey, validateSpecs, type SpecCatalogShape, type SpecField, type SpecOption } from './spec-rules'

export * from './spec-rules'

const catalog = raw as unknown as SpecCatalogShape

/** دسته‌هایی که تعریف مشخصات اختصاصی دارند */
export const SPEC_CATEGORIES = [...new Set([...Object.keys(catalog.specs), ...Object.keys(ACCESSORY_TYPE_OF)])]

export const hasSpecCatalog = (category: string): boolean =>
  Object.prototype.hasOwnProperty.call(catalog.specs, category)


export function getSpecFields(category: string): SpecField[] {
  const own = catalog.specs[category]
  if (own) return own
  /* ── لوازم جانبی ──
     فیلدهایشان داخل خود `accessories_catalog.json` است، نه در
     `specs_catalog.json`: هر دسته کاملا فرق دارد (کیس چوب ۹ فیلد،
     حوله ۳) و یک فهرست مشترک بی‌معنا بود. */
  if (isAccessoryCategory(category)) {
    return accessorySpecs(ACCESSORY_TYPE_OF[category]!) as unknown as SpecField[]
  }
  return []
}

export const CONDITION_OPTIONS: SpecOption[] = catalog.condition_options

/** همان اعتبارسنجی، با تعریف کامل دسته — نسخه‌ای که سرور صدا می‌زند */
/* ── فهرست‌هایی که داده‌شان در `specs_catalog.json` نیست ──
   قطر توپ و «نوع ست» و اندازه‌ی میز، گزینه‌هایشان از کاتالوگ
   برند می‌آید و به نوع انتخاب‌شده وابسته است. `validateSpecs`
   عمدا ردشان می‌کند چون داده را ندارد — این‌جا که کاتالوگ در
   دست است، سنجیده می‌شوند.

   بدون این، آگهی توپ اسنوکر می‌توانست قطر کارامبول بگیرد؛
   فرم اجازه نمی‌داد ولی فرم قابل اعتماد نیست. */
const SOURCE_LISTS: Record<string, 'sizes' | 'set_types'> = {
  'types[].sizes': 'sizes',
  'types[].set_types': 'set_types',
}

/* ── سقف ستون JSONB ──
   `specs` هیچ محدودیتی در اسکیما ندارد. یک درخواست دستی می‌تواند
   هزار کلید یا یک رشته‌ی مگابایتی بفرستد و همان در هر بارگذاری
   بازار برگردد. سقف از بزرگ‌ترین دسته (میز، ۳۳ فیلد) با حاشیه‌ی
   کافی برای کلیدهای `_other` و باقی‌مانده‌های قدیمی گرفته شده. */
const MAX_SPEC_KEYS = 90
const MAX_SPEC_KEY_LEN = 60
const MAX_SPEC_VALUE_LEN = 500

export function validateSpecsOnServer(
  category: string, values: Record<string, unknown>,
  /** نوع انتخاب‌شده — بدونش فهرست‌های `source`دار سنجیده نمی‌شوند */
  typeId?: string,
  /* ── فقط مسیر ثبت ──
     آگهی تازه فقط کلیدهای شناخته‌شده دارد، پس هر کلید دیگری یعنی
     درخواست از جایی جز فرم آمده. مسیر **ویرایش** این را روشن
     نمی‌کند: آگهی‌های قدیمی کلیدهایی دارند که در تعریف امروز
     نیستند و فرم ویرایش همان‌ها را دست‌نخورده برمی‌گرداند —
     ردکردنشان یعنی ویرایش آگهی قدیمی ناممکن. */
  strict = false,
) {
  const fields = getSpecFields(category)
  const base = validateSpecs(fields, values)

  const capErrors: Record<string, string> = {}
  if (strict) {
    const allowed = new Set<string>(['نوع', 'مدل', 'برند', 'دسته'])
    for (const f of fields) { allowed.add(specKey(f.id)); allowed.add(`${specKey(f.id)}_other`) }
    /* تعریف نسل‌قبل هم مجاز است — دلیلش در `legacySpecKeys` */
    for (const k of legacySpecKeys(category)) allowed.add(k)
    const unknown = Object.keys(values).filter(k => !allowed.has(k))
    if (unknown.length) capErrors.specs = `مشخصه‌ی ناشناخته: ${unknown.slice(0, 3).join('، ')}`
  }
  const keys = Object.keys(values)
  if (keys.length > MAX_SPEC_KEYS) capErrors.specsCount = 'تعداد مشخصات بیش از حد مجاز است'
  for (const k of keys) {
    if (k.length > MAX_SPEC_KEY_LEN) { capErrors.specsKey = 'کلید مشخصه نامعتبر است'; break }
    const v = values[k]
    const len = Array.isArray(v) ? JSON.stringify(v).length : String(v ?? '').length
    if (len > MAX_SPEC_VALUE_LEN) { capErrors[k] = 'مقدار بیش از حد بلند است'; break }
  }

  /* ── فیلدی که در فرم دیده نمی‌شود، مقدار هم ندارد ──
     «تعداد لایه» فقط برای تیپ لایه‌لایه معنا دارد و فرم پنهانش
     می‌کند، ولی سرور تا امروز هر مقداری را می‌پذیرفت — یعنی قاعده
     فقط در مرورگر بود. فرم از قبل فیلد پنهان را ذخیره نمی‌کند،
     پس این گارد آگهی سالمی را رد نمی‌کند. */
  const hiddenErrors: Record<string, string> = {}
  for (const f of fields) {
    const k = specKey(f.id)
    const v = values[k]
    const empty = v === undefined || v === null || (Array.isArray(v) ? !v.length : String(v).trim() === '')
    if (empty) continue
    if (isFieldHidden(f, values, fields, typeId)) hiddenErrors[k] = `${f.label_fa} برای این انتخاب معنا ندارد`
  }
  const pre = { ...base.errors, ...capErrors, ...hiddenErrors }
  if (!typeId || !isCatalogId(category)) {
    return { ok: Object.keys(pre).length === 0, errors: pre }
  }
  const t = getType(category, typeId)
  if (!t) return { ok: Object.keys(pre).length === 0, errors: pre }

  const errors = { ...pre }
  for (const f of fields) {
    const which = f.source ? SOURCE_LISTS[f.source] : undefined
    if (!which) continue
    const key = specKey(f.id)
    const v = values[key]
    if (v === undefined || v === null || String(v).trim() === '') continue
    /* «سایر» متن آزاد است و در کلید جداگانه می‌نشیند */
    if (v === '__other__') { if (!f.allow_other) errors[key] = 'گزینه‌ی نامعتبر'; continue }
    const list: CatalogSize[] = (t[which] ?? [])
    if (!list.some(o => o.id === v)) errors[key] = `${f.label_fa} برای نوع انتخاب‌شده نیست`
  }
  return { ok: Object.keys(errors).length === 0, errors }
}

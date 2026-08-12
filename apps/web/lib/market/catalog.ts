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
import clothRaw from '../../data/cloth_catalog.json'
import chalkRaw from '../../data/chalk_catalog.json'
import tipRaw from '../../data/tip_catalog.json'
import accRaw from '../../data/accessories_catalog.json'
import {
  validateSelection,
  type CatalogBrand, type CatalogCountry, type CatalogId, type CatalogModel,
  type CatalogSelection, type CatalogSize, type CatalogType, type CatalogValidation,
} from './catalog-rules'

export * from './catalog-rules'

interface AccessoryCategory {
  id: string
  label_fa: string
  icon?: string
  has_brands?: boolean
  force_free_input?: boolean
  external_catalog?: string
  brands?: CatalogBrand[]
  specs?: SpecFieldLike[]
}

/* شکلِ فیلدِ مشخصات این‌جا تکرار نمی‌شود — از `spec-rules` می‌آید */
type SpecFieldLike = Record<string, unknown>

interface CatalogFile {
  types: CatalogType[]
  countries: Record<string, CatalogCountry>
}

/* ── لوازم جانبی، هم‌شکلِ بقیه ──
   فایلش `categories[]` دارد نه `types[]`، و `specs` را داخلِ خودِ
   دسته نگه می‌دارد. به‌جای اینکه هر مصرف‌کننده این تفاوت را بداند،
   همین‌جا به همان شکلِ همیشگی درمی‌آید — پس انتخابگر و مسیرِ API و
   اعتبارسنجی هیچ‌کدام تغییری نمی‌خواهند. */
const accFile: CatalogFile = {
  countries: (accRaw as unknown as { countries: Record<string, CatalogCountry> }).countries,
  types: (accRaw as unknown as { categories: AccessoryCategory[] }).categories.map(c => ({
    id: c.id,
    label_fa: c.label_fa,
    brands: c.brands ?? [],
    force_free_input: c.force_free_input || c.has_brands === false,
  })),
}

/** فیلدهای مشخصات، از داخلِ خودِ دسته‌ی لوازم */
export const accessorySpecs = (typeId: string) =>
  (accRaw as unknown as { categories: AccessoryCategory[] }).categories
    .find(c => c.id === typeId)?.specs ?? []

/** ایموجیِ دسته — روی ردیفِ دراپ‌داون می‌نشیند */
export const accessoryIcon = (typeId: string) =>
  (accRaw as unknown as { categories: AccessoryCategory[] }).categories
    .find(c => c.id === typeId)?.icon ?? ''

const FILES: Record<CatalogId, CatalogFile> = {
  cue: cueRaw as unknown as CatalogFile,
  table: tableRaw as unknown as CatalogFile,
  cloth: clothRaw as unknown as CatalogFile,
  chalk: chalkRaw as unknown as CatalogFile,
  tip: tipRaw as unknown as CatalogFile,
  accessories: accFile,
}

/* ── کشورها از هر سه کاتالوگ ادغام می‌شوند ──
   هر فایل فهرستِ خودش را دارد و گاهی یکی عقب می‌ماند: کاتالوگِ تازه‌ی
   میز برندِ سنگاپوری آورد ولی `SG` را در `countries` تعریف نکرده بود —
   نتیجه‌اش جعبه‌ی خاکستری به‌جای پرچم و نامِ «کشور نامشخص» بود.

   ادغام یعنی تعریفِ هر فایل، کمبودِ فایلِ دیگر را پر می‌کند. تعریفِ
   خودِ همان دسته اولویت دارد، چون ممکن است نامِ فارسی‌اش دقیق‌تر باشد.

   ⚠️ این جایگزینِ درست‌بودنِ داده نیست — تستِ «هر کشورِ هر سه کاتالوگ
   پرچمِ SVG دارد» همچنان کمبودِ **شکل** را می‌گیرد. */
const ALL_COUNTRIES: Record<string, CatalogCountry> = {
  ...(cueRaw as unknown as CatalogFile).countries,
  ...(clothRaw as unknown as CatalogFile).countries,
  ...(chalkRaw as unknown as CatalogFile).countries,
  ...(tipRaw as unknown as CatalogFile).countries,
  ...accFile.countries,
  ...(tableRaw as unknown as CatalogFile).countries,
}

export const countriesOf = (category: CatalogId) =>
  ({ ...ALL_COUNTRIES, ...FILES[category].countries })

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

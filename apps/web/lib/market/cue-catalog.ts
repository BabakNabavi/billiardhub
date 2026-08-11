/* ═══════════════════════════════════════════════════════════════
   کاتالوگِ چوب — نوع ← برند ← مدل. منبعِ واحد.
   ───────────────────────────────────────────────────────────────
   چهار نوع، ۱۱۴ برند، ۴۴۷ مدل. داده در
   `data/cue-catalog.json` است، نه در کد: به‌روزرسانیِ فهرست نباید
   نیازمندِ ویرایشِ کامپوننت باشد.

   ── چرا این ماژول به مرورگر نمی‌رود ──
   خودِ JSON نود و هشت کیلوبایت است. واردکردنش در یک کامپوننتِ
   کلاینت یعنی همان حجم در باندلِ **هر بازدیدکننده‌ی فرم** — در حالی
   که امروز کلِ جاوااسکریپتِ صفحه‌ی اصلی ۲۱۵ کیلوبایت است.

   پس فقط سمتِ سرور خوانده می‌شود و کلاینت برندهای **یک نوع** را از
   `/api/cue-catalog/[type]` می‌گیرد (استاتیک، کشِ یک‌ساله).

   تنها استثنا `validateCueSelection` است که عمداً داده نمی‌خواهد و
   با ورودیِ صریح کار می‌کند، تا همان قاعده هم روی سرور اجرا شود هم
   در فرم — بدونِ اینکه کاتالوگ به مرورگر برود.

   ── نسبتش با `chain.ts` ──
   `chain.ts` زنجیره‌ی همه‌ی دسته‌هاست (میز، تیپ، گچ، …). این فایل
   **فقط دسته‌ی چوب** را با داده‌ی به‌مراتب کامل‌تر جایگزین می‌کند؛
   بقیه‌ی دسته‌ها دست‌نخورده از `chain.ts` می‌آیند.
   ═══════════════════════════════════════════════════════════════ */

import raw from '../../data/cue-catalog.json'

export const CUE_TYPE_IDS = ['pocket_billiard', 'snooker', 'heyball', 'carom'] as const
export type CueTypeId = typeof CUE_TYPE_IDS[number]

/** پیشوندِ شناسه‌ی برند برای هر نوع — سرور با همین تعلق را می‌سنجد */
export const CUE_TYPE_PREFIX: Record<CueTypeId, string> = {
  pocket_billiard: 'pocket__',
  snooker: 'snk__',
  heyball: 'hey__',
  carom: 'car__',
}

export interface CueModel {
  id: string
  name_en: string
  name_fa: string
  /** سرتیترِ گروه در فهرست (مثلاً «Hunter (Signature)») */
  group?: string
  /** منسوخ — ته فهرست می‌رود ولی حذف نمی‌شود؛ بازارِ دستِ‌دوم است */
  discontinued?: boolean
  cue_type?: string
}

export interface CueBrand {
  id: string
  name_en: string
  name_fa: string
  /** کد دوحرفیِ کشورِ برند — `null` یعنی «بدونِ برند» */
  country: string | null
  tier: string
  allow_free_model: boolean
  models: CueModel[]
}

export interface CueType {
  id: CueTypeId
  label_fa: string
  label_en?: string
  brands: CueBrand[]
}

export interface CueCountry { fa: string; en: string; flag: string }

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

export const isCueTypeId = (v: unknown): v is CueTypeId =>
  typeof v === 'string' && (CUE_TYPE_IDS as readonly string[]).includes(v)

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

/* ── فهرستِ مرتب‌شده‌ی مدل‌ها ──
   منسوخ‌ها ته فهرست، و ترتیبِ گروه‌ها همان ترتیبِ ظاهرشدنشان در داده
   می‌ماند (نه الفبایی) — چون سازنده عمداً از ارزان به گران چیده. */
export function groupedCueModels(brand: CueBrand): [string, CueModel[]][] {
  const g = new Map<string, CueModel[]>()
  const ordered = [...brand.models].sort(
    (a, b) => Number(!!a.discontinued) - Number(!!b.discontinued),
  )
  for (const m of ordered) {
    const k = m.group ?? ''
    if (!g.has(k)) g.set(k, [])
    g.get(k)!.push(m)
  }
  return [...g.entries()]
}

/* ═══════════════════════════════════════════════════════════════
   اعتبارسنجی — همین تابع هم در فرم و هم در مسیرِ سرور صدا زده
   می‌شود. عمداً هیچ داده‌ای از کاتالوگ لازم ندارد مگر وقتی شناسه
   داده شده باشد، تا نسخه‌ی کلاینت هم بتواند از همین منطق استفاده
   کند بدونِ واردکردنِ کاتالوگ.
   ═══════════════════════════════════════════════════════════════ */

export interface CueSelection {
  cueType: string
  brandId: string | null
  brandCustom: string | null
  modelId: string | null
  modelCustom: string | null
}

export const MAX_CUSTOM_LEN = 60

const clean = (v: string | null | undefined) => (v ?? '').trim().slice(0, MAX_CUSTOM_LEN)

export interface CueValidation {
  ok: boolean
  /** کلیدِ فیلد ← پیام؛ خالی یعنی بی‌ایراد */
  errors: Record<string, string>
  /** مقدارِ پاک‌شده‌ای که باید ذخیره شود */
  value: CueSelection
}

/**
 * قاعده‌ها:
 *  · `cueType` باید یکی از چهار نوع باشد.
 *  · دقیقاً یکی از `brandId` یا `brandCustom` — نه هر دو، نه هیچ‌کدام.
 *  · `brandId` باید وجود داشته باشد و پیشوندش با نوع بخواند.
 *  · `modelId` باید متعلق به همان برند باشد.
 *  · مدل اختیاری است: هر دو خالی، خطا نیست.
 *
 * `lookup` تزریق می‌شود تا سمتِ کلاینت بتواند برندهای همان نوع را
 * (که از API گرفته) بدهد و کاتالوگِ کامل به مرورگر نرود.
 */
export function validateCueSelection(
  input: CueSelection,
  lookup?: { brand: (id: string) => CueBrand | undefined },
): CueValidation {
  const errors: Record<string, string> = {}
  const brandCustom = clean(input.brandCustom)
  const modelCustom = clean(input.modelCustom)
  const brandId = input.brandId || null
  const find = lookup?.brand ?? getCueBrand

  if (!isCueTypeId(input.cueType)) {
    errors.cueType = 'نوع چوب را انتخاب کنید'
  }

  if (!brandId && !brandCustom) {
    errors.brand = 'برند را انتخاب کنید'
  } else if (brandId && brandCustom) {
    errors.brand = 'یا برند را از فهرست انتخاب کنید یا نامش را بنویسید، نه هر دو'
  }

  let brand: CueBrand | undefined
  if (brandId) {
    brand = find(brandId)
    if (!brand) {
      errors.brand = 'این برند در فهرست نیست'
    } else if (isCueTypeId(input.cueType) && !brandId.startsWith(CUE_TYPE_PREFIX[input.cueType])) {
      errors.brand = 'این برند برای نوع انتخاب‌شده نیست'
    }
  }

  /* برندِ دستی ⇒ مدل هم دستی است؛ شناسه‌ی مدل بی‌معناست */
  const modelId = brandId ? input.modelId || null : null

  if (modelId) {
    if (!brand?.models.some(m => m.id === modelId)) {
      errors.model = 'این مدل برای برند انتخاب‌شده نیست'
    }
    if (modelCustom) {
      errors.model = 'یا مدل را از فهرست انتخاب کنید یا نامش را بنویسید، نه هر دو'
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      cueType: input.cueType,
      brandId: brandId && !errors.brand ? brandId : null,
      brandCustom: brandCustom || null,
      modelId,
      modelCustom: modelCustom || null,
    },
  }
}

/* ── برچسبِ نمایشی ──
   همان چیزی که روی کارت و صفحه‌ی آگهی دیده می‌شود. مقدارِ دستی بر
   شناسه مقدم است، چون وقتی کاربر خودش نوشته یعنی فهرست جوابش نداده. */
export function cueBrandLabel(sel: Pick<CueSelection, 'brandId' | 'brandCustom'>, brand?: CueBrand): string {
  if (sel.brandCustom) return sel.brandCustom
  const b = brand ?? (sel.brandId ? getCueBrand(sel.brandId) : undefined)
  return b?.name_en ?? ''
}

export function cueModelLabel(sel: Pick<CueSelection, 'brandId' | 'modelId' | 'modelCustom'>, model?: CueModel): string {
  if (sel.modelCustom) return sel.modelCustom
  const m = model ?? (sel.brandId && sel.modelId ? getCueModel(sel.brandId, sel.modelId) : undefined)
  return m?.name_en ?? ''
}

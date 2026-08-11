/* ═══════════════════════════════════════════════════════════════
   قواعدِ انتخابِ چوب — منطقِ خالص، بدونِ داده.
   ───────────────────────────────────────────────────────────────
   ── چرا از `cue-catalog.ts` جداست ──
   آن ماژول `data/cue-catalog.json` را ایستا وارد می‌کند: نود و هشت
   کیلوبایت. `CueSelector` یک کامپوننتِ `'use client'` است و اگر
   برای گرفتنِ همین چند تابع از آن‌جا وارد می‌کرد، کلِ کاتالوگ در
   باندلِ مرورگرِ **هر بازدیدکننده‌ی فرم** می‌نشست — دقیقاً همان
   چیزی که مسیرِ استاتیکِ per-type برای جلوگیری از آن ساخته شد.

   همین اشتباه یک‌بار با `thumbUrl` و `supabase-config` رخ داد و
   تستِ «مرزِ سرور و کلاینت» برای همین هست.

   پس هرچه داده نمی‌خواهد این‌جاست، و `cue-catalog.ts` این‌ها را
   دوباره export می‌کند تا سمتِ سرور یک ورودیِ واحد بماند.
   ═══════════════════════════════════════════════════════════════ */

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

export interface CueCountry { fa: string; en: string; flag: string }

export interface CueType {
  id: CueTypeId
  label_fa: string
  label_en?: string
  brands: CueBrand[]
}

export const isCueTypeId = (v: unknown): v is CueTypeId =>
  typeof v === 'string' && (CUE_TYPE_IDS as readonly string[]).includes(v)

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
 * `findBrand` تزریق می‌شود: سرور کاتالوگِ کامل را می‌دهد و کلاینت
 * برندهای همان نوعی را که از API گرفته — بدونِ اینکه کاتالوگ به
 * مرورگر برود.
 */
export function validateCueSelection(
  input: CueSelection,
  findBrand: (id: string) => CueBrand | undefined,
): CueValidation {
  const errors: Record<string, string> = {}
  const brandCustom = clean(input.brandCustom)
  const modelCustom = clean(input.modelCustom)
  const brandId = input.brandId || null

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
    brand = findBrand(brandId)
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

/* ── برچسبِ نمایشی ──
   مقدارِ دستی بر شناسه مقدم است، چون وقتی کاربر خودش نوشته یعنی
   فهرست جوابش نداده. */
export function cueBrandLabel(
  sel: Pick<CueSelection, 'brandId' | 'brandCustom'>, brand?: CueBrand,
): string {
  return sel.brandCustom?.trim() || brand?.name_en || ''
}

export function cueModelLabel(
  sel: Pick<CueSelection, 'modelId' | 'modelCustom'>, model?: CueModel,
): string {
  return sel.modelCustom?.trim() || model?.name_en || ''
}

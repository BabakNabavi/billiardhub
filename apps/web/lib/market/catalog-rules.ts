/* ═══════════════════════════════════════════════════════════════
   قواعدِ کاتالوگِ محصول — منطقِ خالص، بدونِ داده.
   ───────────────────────────────────────────────────────────────
   دو کاتالوگ داریم و هر دو یک شکل دارند:
     چوب  → ۴ نوع · ۱۱۴ برند · ۴۴۷ مدل
     میز  → ۵ نوع ·  ۵۸ برند · ۱۲۱ مدل  (+ سایز برای هر نوع)

   ── چرا از `catalog.ts` جداست ──
   آن ماژول هر دو JSON را ایستا وارد می‌کند: بیش از صد کیلوبایت.
   `CatalogSelector` یک کامپوننتِ `'use client'` است و اگر برای گرفتنِ
   همین چند تابع از آن‌جا وارد می‌کرد، کلِ کاتالوگ در باندلِ مرورگرِ
   **هر بازدیدکننده‌ی فرم** می‌نشست — دقیقاً همان چیزی که مسیرِ
   استاتیکِ per-type برای جلوگیری از آن ساخته شد.

   همین اشتباه یک‌بار با `thumbUrl` و `supabase-config` رخ داد و
   تستِ «مرزِ سرور و کلاینت» برای همین هست.

   پس هرچه داده نمی‌خواهد این‌جاست، و `catalog.ts` این‌ها را دوباره
   export می‌کند تا سمتِ سرور یک ورودیِ واحد بماند.
   ═══════════════════════════════════════════════════════════════ */

import { normalizeFa } from '../text-fa'

export const CATALOG_IDS = ['cue', 'table', 'cloth', 'chalk', 'tip'] as const
export type CatalogId = typeof CATALOG_IDS[number]

export const isCatalogId = (v: unknown): v is CatalogId =>
  typeof v === 'string' && (CATALOG_IDS as readonly string[]).includes(v)

/* ── نوع‌های هر کاتالوگ ──
   این‌ها **رونوشتِ سبکِ** `types[].id` در JSON‌اند و عمداً این‌جا
   تکرار شده‌اند: کلاینت برای نگاشتِ برچسبِ فارسیِ فرم به شناسه به
   آن‌ها نیاز دارد و نباید برای این کار صد کیلوبایت داده بگیرد.

   تستِ «نوع‌های کاتالوگ با داده می‌خوانند» نگهبانِ همگامیشان است —
   اگر نوعی به JSON اضافه شود و این‌جا نه، تست قرمز می‌شود. */
export const TYPE_IDS: Record<CatalogId, readonly string[]> = {
  cue: ['pocket_billiard', 'snooker', 'heyball', 'carom'],
  table: ['pocket_billiard', 'snooker', 'heyball', 'carom', 'home_table'],
  /* ── پارچه ──
     نوعش همان نوعِ **میز** است، نه یک بُعدِ تازه: پارچه‌ی اسنوکر
     با پارچه‌ی پاکت فرق دارد و فهرست‌هایشان قاطی نمی‌شود.
     «میز خانگی» پارچه‌ی اختصاصی ندارد، پس این‌جا نیست. */
  cloth: ['pocket_billiard', 'snooker', 'heyball', 'carom'],
  /* ── گچ ──
     گچِ اسنوکر و پاکت واقعاً فرق دارند: سبز در برابر آبی، و برای
     تیپِ نازک در برابر تیپِ پهن. چند برند در هر دو هستند ولی
     مدل‌های پیشنهادی‌شان فرق می‌کند — پس فهرست‌ها جدا می‌مانند.
     هی‌بال گچِ اختصاصی ندارد. */
  chalk: ['snooker', 'pocket_billiard', 'carom'],
  /* ── تیپ ──
     اسنوکر ۸.۵ تا ۱۱ میلی‌متر و اغلب تک‌لایه‌ی پرس‌شده؛ پاکتِ
     آمریکایی ۱۱.۷۵ تا ۱۴ و اغلب لایه‌لایه. سایز و مدل هیچ‌کدام
     بینِ دو رشته مشترک نیستند. */
  tip: ['snooker', 'pocket_billiard', 'carom'],
}

/** پیشوندِ شناسه‌ی برند — سرور با همین تعلقِ برند به نوع را می‌سنجد */
export const TYPE_PREFIX: Record<CatalogId, Record<string, string>> = {
  cue: {
    pocket_billiard: 'pocket__', snooker: 'snk__', heyball: 'hey__', carom: 'car__',
  },
  table: {
    pocket_billiard: 'tpkt__', snooker: 'tsnk__', heyball: 'they__',
    carom: 'tcar__', home_table: 'thome__',
  },
  /* شناسه‌ی برندِ پارچه با نامِ خودِ نوع پیشوند خورده */
  cloth: {
    pocket_billiard: 'pocket_billiard__', snooker: 'snooker__',
    heyball: 'heyball__', carom: 'carom__',
  },
  chalk: {
    snooker: 'csnk__', pocket_billiard: 'cpkt__', carom: 'ccar__',
  },
  /* ⚠️ پیشوندِ تیپ عیناً همان پیشوندِ میز است (`tsnk__`, `tpkt__`,
     `tcar__`). خطرناک نیست چون هر جست‌وجو دسته را می‌گیرد و
     `category` هم کنارِ شناسه ذخیره می‌شود — ولی تستی هست که
     می‌سنجد هیچ شناسه‌ی برندی بینِ دو کاتالوگ مشترک نشود. */
  tip: {
    snooker: 'tsnk__', pocket_billiard: 'tpkt__', carom: 'tcar__',
  },
}

/* ── پلِ بینِ فرم و کاتالوگ ──
   فرم «نوع» را به‌صورت رشته‌ی فارسی نگه می‌دارد و همان در ستونِ
   `type` ذخیره می‌شود؛ نامِ کارتِ بازار هم از «دسته + نوع» ساخته
   می‌شود. کاتالوگ ولی با شناسه کار می‌کند.

   این نگاشت تنها جایی است که آن دو به هم می‌رسند — و عمداً این‌جا
   نشسته نه داخلِ کامپوننت، تا اگر روزی برچسبی عوض شد یک‌جا اصلاح
   شود. */
export const TYPE_BY_FA: Record<CatalogId, Record<string, string>> = {
  cue: {
    'پاکت بیلیارد': 'pocket_billiard',
    'اسنوکر': 'snooker',
    'هی‌بال': 'heyball',
    'کارامبول': 'carom',
  },
  table: {
    'پاکت بیلیارد': 'pocket_billiard',
    'اسنوکر': 'snooker',
    'هی‌بال': 'heyball',
    'کارامبول': 'carom',
    'میز خانگی': 'home_table',
    /* فرم این نوع را «خانگی» می‌نویسد و کاتالوگ «میز خانگی».
       هر دو نگاشت می‌شوند وگرنه آگهی‌های موجود از فهرست می‌افتند. */
    'خانگی': 'home_table',
  },
  cloth: {
    'پاکت بیلیارد': 'pocket_billiard',
    'اسنوکر': 'snooker',
    'هی‌بال': 'heyball',
    'کارامبول': 'carom',
  },
  chalk: {
    'اسنوکر': 'snooker',
    'پاکت بیلیارد': 'pocket_billiard',
    'کارامبول': 'carom',
  },
  tip: {
    'اسنوکر': 'snooker',
    'پاکت بیلیارد': 'pocket_billiard',
    'کارامبول': 'carom',
  },
}

export const typeIdOf = (category: CatalogId, faLabel: string): string =>
  TYPE_BY_FA[category][faLabel] ?? ''

export const isTypeId = (category: CatalogId, v: unknown): v is string =>
  typeof v === 'string' && TYPE_IDS[category].includes(v)

// ── شکلِ داده ──────────────────────────────────────────────────

export interface CatalogModel {
  id: string
  name_en: string
  name_fa: string
  /** سرتیترِ گروه در فهرست (مثلاً «Hunter (Signature)») */
  group?: string
  /** منسوخ — ته فهرست می‌رود ولی حذف نمی‌شود؛ بازارِ دستِ‌دوم است */
  discontinued?: boolean
  cue_type?: string
  /* ── فقط پارچه ──
     با انتخابِ مدل، «نوع پارچه» و «وزن پارچه» خودکار پر می‌شوند
     ولی قفل نمی‌شوند — فروشنده می‌تواند عوضشان کند. */
  type?: string
  weight_oz?: string
  /* ── فقط تیپ ── سختی، ساختار و Shore D از مدل به مشخصات می‌روند */
  hardness?: string
  construction?: string
  shore_d?: number | string
  note_fa?: string
}

export interface CatalogBrand {
  id: string
  name_en: string
  name_fa: string
  /** کد دوحرفیِ کشورِ برند — `null` یعنی «بدونِ برند» */
  country: string | null
  tier: string
  allow_free_model: boolean
  /** املاهای رایجِ فارسی و غلط‌های تایپی — فروشنده «پرادن» می‌نویسد و
   *  باید Peradon را پیدا کند. اختیاری: کاتالوگِ بدونِ آن هم کار می‌کند. */
  aliases?: string[]
  models: CatalogModel[]
}

/* ── سایزِ میز ──
   عمداً **درونِ هر نوع** تعریف شده و بینِ نوع‌ها مشترک نیست: میزِ
   اسنوکرِ ۸ فوت سطحِ بازیِ بزرگ‌تری از پاکتِ ۸ فوت دارد، و کارامبول
   اصلاً با فوت اندازه‌گیری نمی‌شود. یک فهرستِ مشترک هر سه را خراب
   می‌کرد. */
export interface CatalogSize {
  id: string
  label_fa: string
  label_en?: string
  /** ابعادِ سطحِ بازی داخلِ باند — زیرنویسِ گزینه */
  playing_area_cm?: string
  note_fa?: string
  /** از پیش انتخاب می‌شود؛ رایج‌ترین سایزِ آن رشته */
  default?: boolean
}

export interface CatalogCountry { fa: string; en: string; flag: string }

export interface CatalogType {
  id: string
  label_fa: string
  label_en?: string
  brands: CatalogBrand[]
  sizes?: CatalogSize[]
  /* ── بدونِ فهرستِ برند ──
     «میز خانگی» آرایه‌ی `brands` خالی دارد و این پرچم را روشن.
     منطق روی همین پرچم نوشته شده، نه روی `id === 'home_table'`، تا
     اگر فردا نوعِ دیگری هم همین رفتار را خواست فقط داده عوض شود. */
  force_free_input?: boolean
}

// ── انتخابِ کاربر ──────────────────────────────────────────────

export interface CatalogSelection {
  category: CatalogId
  type: string
  brandId: string | null
  brandCustom: string | null
  modelId: string | null
  modelCustom: string | null
  /** فقط میز */
  sizeId?: string | null
  sizeCustom?: string | null
}

export const MAX_CUSTOM_LEN = 60
export const MAX_SIZE_LEN = 40

const clean = (v: string | null | undefined, max = MAX_CUSTOM_LEN) =>
  (v ?? '').trim().slice(0, max)

export interface CatalogValidation {
  ok: boolean
  /** کلیدِ فیلد ← پیام؛ خالی یعنی بی‌ایراد */
  errors: Record<string, string>
  /** مقدارِ پاک‌شده‌ای که باید ذخیره شود */
  value: CatalogSelection
}

/**
 * قاعده‌ها:
 *  · `type` باید یکی از نوع‌های همان کاتالوگ باشد.
 *  · نوعِ `force_free_input` (میز خانگی): برند و مدل فقط متنِ آزاد؛
 *    شناسه باید `null` بماند و هیچ‌کدام اجباری نیست.
 *  · وگرنه دقیقاً یکی از `brandId` یا `brandCustom` — نه هر دو، نه هیچ‌کدام.
 *  · `brandId` باید وجود داشته باشد و پیشوندش با نوع بخواند.
 *  · `modelId` باید متعلق به همان برند باشد. مدل اختیاری است.
 *  · `sizeId` باید در سایزهای **همان نوع** باشد — شناسه‌ها بینِ
 *    نوع‌ها تکراری‌اند (`9ft` هم در اسنوکر هست هم در پاکت)، پس
 *    نسنجیدنش یعنی سایزِ نوعِ دیگر پذیرفته می‌شود.
 *
 * `findBrand` و `sizesOf` تزریق می‌شوند: سرور کاتالوگِ کامل را می‌دهد
 * و کلاینت فقط همان نوعی را که از API گرفته — بدونِ اینکه کاتالوگ به
 * مرورگر برود.
 */
export function validateSelection(
  input: CatalogSelection,
  findBrand: (id: string) => CatalogBrand | undefined,
  opts: { forceFreeInput?: boolean; sizes?: CatalogSize[] } = {},
): CatalogValidation {
  const errors: Record<string, string> = {}
  const brandCustom = clean(input.brandCustom)
  const modelCustom = clean(input.modelCustom)
  const sizeCustom = clean(input.sizeCustom, MAX_SIZE_LEN)
  const free = !!opts.forceFreeInput

  if (!isTypeId(input.category, input.type)) {
    errors.type = 'نوع را انتخاب کنید'
  }

  let brandId = input.brandId || null
  let modelId = input.modelId || null

  if (free) {
    /* فهرستی در کار نیست، پس شناسه بی‌معناست و هیچ‌کدام اجباری نیست:
       میزِ خانگی اغلب برندِ مشخصی ندارد و اجبار داده‌ی الکی می‌سازد. */
    if (brandId || modelId) errors.brand = 'برای این نوع فقط نام را بنویسید'
    brandId = null
    modelId = null
  } else {
    if (!brandId && !brandCustom) {
      errors.brand = 'برند را انتخاب کنید'
    } else if (brandId && brandCustom) {
      errors.brand = 'یا برند را از فهرست انتخاب کنید یا نامش را بنویسید، نه هر دو'
    }

    let brand: CatalogBrand | undefined
    if (brandId) {
      brand = findBrand(brandId)
      const prefix = TYPE_PREFIX[input.category][input.type]
      if (!brand) {
        errors.brand = 'این برند در فهرست نیست'
      } else if (prefix && !brandId.startsWith(prefix)) {
        errors.brand = 'این برند برای نوع انتخاب‌شده نیست'
      }
    }

    /* برندِ دستی ⇒ مدل هم دستی است؛ شناسه‌ی مدل بی‌معناست */
    if (!brandId) modelId = null

    if (modelId) {
      if (!brand?.models.some(m => m.id === modelId)) {
        errors.model = 'این مدل برای برند انتخاب‌شده نیست'
      }
      if (modelCustom) {
        errors.model = 'یا مدل را از فهرست انتخاب کنید یا نامش را بنویسید، نه هر دو'
      }
    }
  }

  /* سایز اختیاری است — فروشنده‌ی دستِ‌دوم گاهی سایزِ دقیق را نمی‌داند */
  let sizeId = input.sizeId || null
  if (sizeId && opts.sizes && !opts.sizes.some(s => s.id === sizeId)) {
    errors.size = 'این سایز برای نوع انتخاب‌شده نیست'
    sizeId = null
  }
  if (sizeId && sizeCustom) {
    errors.size = 'یا سایز را از فهرست انتخاب کنید یا خودتان بنویسید، نه هر دو'
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      category: input.category,
      type: input.type,
      brandId: brandId && !errors.brand ? brandId : null,
      brandCustom: brandCustom || null,
      modelId,
      modelCustom: modelCustom || null,
      sizeId,
      sizeCustom: sizeCustom || null,
    },
  }
}

/* ── تطبیقِ نامِ برند ──
   یک تابع برای هر دو کاربرد: جست‌وجوی زنده در فهرست، و بازیابیِ
   آگهیِ قدیمی که فقط رشته دارد. اگر دو پیاده‌سازی می‌داشتیم، جست‌وجو
   چیزی را پیدا می‌کرد که بازیابی نمی‌شناخت.

   نرمال‌سازی در `lib/text-fa.ts` است چون فیلترِ دراپ‌داون در
   `AdFormFields` هم باید همان را بزند — وگرنه چیزی که جست‌وجو پیدا
   می‌کند با چیزی که این‌جا تطبیق می‌خورد یکی نمی‌ماند. */
export const normalizeBrandKey = normalizeFa

/** همه‌ی نام‌هایی که یک برند با آن‌ها شناخته می‌شود */
export const brandSearchTerms = (b: CatalogBrand, countryFa?: string): string[] =>
  [b.name_en, b.name_fa, ...(b.aliases ?? []), countryFa ?? ''].filter(Boolean)

/** آیا این متن به همین برند اشاره دارد؟ نام، نامِ فارسی، یا هر alias */
export function brandMatchesName(b: CatalogBrand, raw: string): boolean {
  const k = normalizeFa(raw)
  if (!k) return false
  return [b.name_en, b.name_fa, ...(b.aliases ?? [])]
    .some(n => normalizeFa(n) === k)
}

/* ── فهرستِ مرتب‌شده‌ی مدل‌ها ──
   منسوخ‌ها ته فهرست، و ترتیبِ گروه‌ها همان ترتیبِ ظاهرشدنشان در داده
   می‌ماند (نه الفبایی) — چون سازنده عمداً از ارزان به گران چیده. */
export function groupedModels(brand: CatalogBrand): [string, CatalogModel[]][] {
  const g = new Map<string, CatalogModel[]>()
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
export function brandLabel(
  sel: Pick<CatalogSelection, 'brandId' | 'brandCustom'>, brand?: CatalogBrand,
): string {
  return sel.brandCustom?.trim() || brand?.name_en || ''
}

export function modelLabel(
  sel: Pick<CatalogSelection, 'modelId' | 'modelCustom'>, model?: CatalogModel,
): string {
  return sel.modelCustom?.trim() || model?.name_en || ''
}

/** برچسبِ سایز برای ذخیره در مشخصاتِ فنی — دستی بر فهرست مقدم است */
export function sizeLabel(
  sel: Pick<CatalogSelection, 'sizeId' | 'sizeCustom'>, sizes?: CatalogSize[],
): string {
  const custom = sel.sizeCustom?.trim()
  if (custom) return custom
  if (!sel.sizeId) return ''
  return sizes?.find(s => s.id === sel.sizeId)?.label_fa ?? ''
}

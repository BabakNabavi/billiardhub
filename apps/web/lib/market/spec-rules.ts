/* ═══════════════════════════════════════════════════════════════
   مشخصاتِ فنی — تایپ‌ها و قواعد. بدونِ داده.
   ───────────────────────────────────────────────────────────────
   تعریفِ فیلدها تا امروز در `specs.ts` هاردکد بود: ده فیلد برای چوب
   و ده برای میز، بدونِ متنِ راهنما، بدونِ توضیحِ گزینه، و بدونِ
   بازه‌ی مجاز. حالا از `data/specs_catalog.json` می‌آید — بیست‌ودو
   فیلد برای چوب و نوزده برای میز.

   ── چرا این فایل از `spec-catalog.ts` جداست ──
   همان قاعده‌ی کاتالوگِ برند: فرم یک کامپوننتِ کلاینت است و نباید
   JSON را ایستا وارد کند. این‌جا فقط شکل و منطق است.
   ═══════════════════════════════════════════════════════════════ */

export type SpecFieldType = 'number' | 'text' | 'select' | 'boolean' | 'multi_select'

export interface SpecOption {
  id: string
  label_fa: string
  label_en?: string
  /* ── چرا توضیح زیرِ گزینه ──
     فروشنده‌ی دستِ‌دوم اغلب نمی‌داند سنگِ میزش ایتالیایی است یا
     چینی. «تیره‌تر، ریزدانه، رایج در میزهای حرفه‌ای» همان چیزی است
     که کمکش می‌کند درست انتخاب کند — و داده‌ی درست‌تر می‌سازد. */
  note_fa?: string
}

export interface SpecField {
  id: string
  label_fa: string
  type: SpecFieldType
  required?: boolean
  placeholder?: string
  /** بازه‌ی مجازِ عددی — سرور هم همین را می‌سنجد */
  min?: number
  max?: number
  step?: number
  max_length?: number
  /** متنِ راهنما زیرِ برچسب؛ نه tooltip — روی موبایل tooltip دیده نمی‌شود */
  help_fa?: string
  /** مقدارهای رایج، به‌صورت چیپ‌های یک‌کلیکی زیرِ فیلدِ عددی */
  common?: number[]
  allow_other?: boolean
  options?: SpecOption[]
  /** فهرست از کاتالوگِ دیگری می‌آید، نه از خودِ این فایل */
  source?: string
  note_fa?: string
  /** فقط وقتی مقدارِ فیلدِ دیگری تعیین شده باشد فعال است */
  depends_on?: string
  /** با انتخابِ فیلدِ دیگری خودکار پر می‌شود — ولی قفل نمی‌شود */
  auto_from?: string
  /* ── نمایشِ شرطی بر اساسِ ساختار ──
     «تعداد لایه» فقط برای تیپِ لایه‌لایه معنا دارد. داده خودش
     می‌گوید با کدام مقدارهای `construction` دیده شود. */
  depends_on_construction?: string[]
}

export interface SpecCatalogShape {
  specs: Record<string, SpecField[]>
  condition_options: SpecOption[]
}

/** `slate_thickness` ⟵ `slateThickness` — کلیدِ ذخیره در ستونِ specs */
export const specKey = (id: string): string =>
  id.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())

/* ── ترتیبِ نمایش ──
   سوییچ‌های بله/خیر ته فرم می‌روند، بعد از یک خطِ جداکننده. دلیلش
   چیدمان است: هر سوییچ یک ردیفِ کم‌ارتفاع است و قاطی‌شدنشان با
   فیلدهای دوستونی، شبکه را دندانه‌دار می‌کند. */
export const isToggle = (f: SpecField) => f.type === 'boolean'

export function splitFields(fields: SpecField[]): { main: SpecField[]; toggles: SpecField[] } {
  return {
    main: fields.filter(f => !isToggle(f)),
    toggles: fields.filter(isToggle),
  }
}

/* ── شمارشِ پیشرفت ──
   «۷ فیلد از ۲۲ تکمیل شد». عمداً درصد نیست: درصد فشار می‌آورد که
   پر شود، در حالی که همه‌ی این‌ها جز وضعیت اختیاری‌اند و فروشنده‌ی
   دستِ‌دوم واقعاً بعضی‌شان را نمی‌داند. */
export function countFilled(
  fields: SpecField[], values: Record<string, unknown>,
): { filled: number; total: number } {
  let filled = 0
  for (const f of fields) {
    const v = values[specKey(f.id)]
    if (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== false && String(v).trim() !== '') filled++
  }
  return { filled, total: fields.length }
}

export interface SpecValidation { ok: boolean; errors: Record<string, string> }

/**
 * اعتبارسنجی — همین تابع را سرور هم صدا می‌زند.
 *  · فقط `condition` اجباری است؛ بقیه اختیاری‌اند.
 *  · عدد باید در بازه‌ی `min`/`max` باشد — بازه از خودِ JSON می‌آید
 *    نه از کد، تا اصلاحش دیپلوی نخواهد.
 *  · مقدارِ `select` باید یکی از گزینه‌ها باشد، مگر «سایر» فعال باشد.
 */
export function validateSpecs(
  fields: SpecField[], values: Record<string, unknown>,
): SpecValidation {
  const errors: Record<string, string> = {}
  for (const f of fields) {
    const key = specKey(f.id)
    const raw = values[key]
    const empty = raw === undefined || raw === null || String(raw).trim() === ''
    if (empty) {
      if (f.required) errors[key] = `${f.label_fa} الزامی است`
      continue
    }

    if (f.type === 'number') {
      const n = Number(String(raw).replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06f0)))
      if (!Number.isFinite(n)) errors[key] = 'عدد معتبر وارد کنید'
      else if (f.min !== undefined && n < f.min) errors[key] = `کمتر از ${f.min} نمی‌تواند باشد`
      else if (f.max !== undefined && n > f.max) errors[key] = `بیشتر از ${f.max} نمی‌تواند باشد`
    }

    if (f.type === 'text' && f.max_length && String(raw).length > f.max_length) {
      errors[key] = `حداکثر ${f.max_length} نویسه`
    }

    /* گزینه‌ی خارج از فهرست فقط وقتی مجاز است که «سایر» روشن باشد؛
       فهرست‌های `source`دار این‌جا سنجیده نمی‌شوند چون داده‌شان
       جای دیگری است. */
    if (f.type === 'select' && f.options && !f.source && !f.allow_other) {
      if (!f.options.some(o => o.id === raw)) errors[key] = 'گزینه‌ی نامعتبر'
    }

    if (f.type === 'multi_select' && f.options) {
      const arr = Array.isArray(raw) ? raw : []
      if (arr.some(v => !f.options!.some(o => o.id === v))) errors[key] = 'گزینه‌ی نامعتبر'
    }
  }
  return { ok: Object.keys(errors).length === 0, errors }
}

/* ── ردیف‌های نمایشِ مشخصات ──
   از امروز مقدارها **شناسه** ذخیره می‌شوند نه برچسب: بدونِ شناسه،
   فرمِ ویرایش نمی‌تواند گزینه را از روی متنِ فارسی پیدا کند و
   فیلترکردن هم ممکن نیست.

   ولی آگهی‌های موجود برچسبِ فارسی دارند. پس هر مقدار اول به‌عنوان
   شناسه جست‌وجو می‌شود و اگر پیدا نشد، همان‌طور که هست نشان داده
   می‌شود — هیچ داده‌ای گم نمی‌شود. */
export interface SpecDisplayRow { key: string; label: string; value: string }

export function specDisplayRows(
  fields: SpecField[], specs: unknown,
  /* ── فیلدهای `source`دار ──
     اندازه و برند/مدلِ پارچه گزینه‌ای در این فایل ندارند؛ فهرستشان
     در کاتالوگِ میز و پارچه است. بدونِ این نگاشت، صفحه‌ی جزئیات
     «۱۲ft» و «snooker__strachan» نشان می‌داد. */
  resolve?: (fieldId: string, value: string) => string | undefined,
): SpecDisplayRow[] {
  if (!specs || typeof specs !== 'object' || Array.isArray(specs)) return []
  const raw = specs as Record<string, unknown>
  const byKey = new Map(fields.map(f => [specKey(f.id), f]))
  const rows: SpecDisplayRow[] = []

  const label = (f: SpecField | undefined, v: unknown): string => {
    if (!f) return String(v ?? '').trim()
    if (f.type === 'boolean') return v === true ? 'دارد' : ''
    if (f.type === 'multi_select') {
      const arr = Array.isArray(v) ? v : []
      return arr.map(x => f.options?.find(o => o.id === x)?.label_fa ?? String(x)).join('، ')
    }
    const s = String(v ?? '').trim()
    if (!s) return ''
    const viaSource = f.source ? resolve?.(f.id, s) : undefined
    if (viaSource) return viaSource
    return f.options?.find(o => o.id === s)?.label_fa ?? s
  }

  for (const [k, v] of Object.entries(raw)) {
    /* «سایر» متنش را در کلیدِ جفتِ `_other` می‌گذارد */
    if (k.endsWith('_other')) continue
    const f = byKey.get(k)
    const other = String(raw[`${k}_other`] ?? '').trim()
    const text = other || label(f, v)
    if (!text || text === 'سایر') continue
    rows.push({ key: k, label: f?.label_fa ?? k, value: text })
  }

  /* ترتیبِ کاتالوگ، نه ترتیبِ کلیدهای JSON — وگرنه هر آگهی چیدمانِ
     متفاوتی می‌گرفت. */
  const order = new Map(fields.map((f, i) => [specKey(f.id), i]))
  return rows.sort((a, b) => (order.get(a.key) ?? 999) - (order.get(b.key) ?? 999))
}

/* ── وابستگیِ فیلدها ──
   داده خودش می‌گوید کدام فیلد به کدام وابسته است:

     size        ← table_type      فهرستش از کاتالوگِ میز می‌آید
     cloth_brand ← table_type      پارچه‌ی اسنوکر با پاکت فرق دارد
     cloth_model ← cloth_brand     مدل زیرِ برند تعریف شده
     cloth_type  ← cloth_model.type   خودکار پر می‌شود، ولی قفل نه

   پیش‌تر این‌ها در خودِ فرم هاردکد بودند. حالا از `depends_on` و
   `auto_from` خوانده می‌شوند، تا اضافه‌شدنِ وابستگیِ بعدی فقط داده
   بخواهد نه کد. */

/* شناسه‌هایی که فیلدِ مشخصات نیستند و بالای فرم گرفته می‌شوند */
/* ── فیلدهای سطحِ فرم ──
   «نوع» و «برند» و «مدل» بالای فرم گرفته می‌شوند، نه در کارتِ
   مشخصات. داده با نامِ خودشان به آن‌ها ارجاع می‌دهد و هر دسته
   پسوندِ خودش را دارد: `table_type`، `ball_type`، `tip_type`، …
   پس قاعده عمومی است، نه فهرستِ ثابت — وگرنه دسته‌ی بعدی دوباره
   یک ارجاعِ معلق می‌سازد که بی‌صدا هیچ‌کاری نمی‌کند.

   (تستی هست که ارجاعِ معلق را می‌گیرد؛ همین قاعده را با آن هم‌راه
    نگه دار.) */
export const isFormLevelField = (id: string): boolean =>
  id.endsWith('_type') || id === 'brand' || id === 'model'

/* ── پر شدنِ خودکار از مدلِ کاتالوگ ──
   برند و مدل بالای فرم‌اند، نه فیلدِ مشخصات؛ پس `applySpecChange`
   هرگز برایشان صدا زده نمی‌شود. ولی مدلِ تیپ سختی و ساختار و
   Shore D را با خودش دارد و داده می‌گوید از همان‌جا پر شوند.

   دو راه پذیرفته می‌شود: `auto_from: model.<prop>` که صریح است، و
   هم‌نامیِ ساده — اگر شناسه‌ی فیلد دقیقاً یکی از ویژگی‌های مدل
   باشد. دومی برای `shore_d` لازم شد که در JSON اعلام نشده.

   هیچ‌کدام قفل نمی‌کنند: فروشنده می‌تواند عوضشان کند. */
/* ── ویژگی‌هایی که مدل‌های کاتالوگ حمل می‌کنند ──
   صریح‌اند و نه از روی کلیدهای خودِ شیء: مدلِ تازه‌ای که `shore_d`
   ندارد باید مقدارِ مدلِ قبلی را **پاک** کند، نه اینکه دست‌نخورده
   بگذاردش. با `in` روی شیء، کلیدِ نبوده یعنی «رد شو» و عددِ مدلِ
   قبلی روی مدلِ تازه می‌ماند. */
const MODEL_PROPS = ['hardness', 'construction', 'shore_d', 'type', 'weight_oz']

export function fillFromModel(
  fields: SpecField[], values: Record<string, unknown>,
  model: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const next = { ...values }
  for (const f of fields) {
    let v: unknown
    if (f.auto_from?.startsWith('model.')) v = model?.[f.auto_from.slice(6)]
    else if (MODEL_PROPS.includes(f.id)) v = model?.[f.id]
    else continue
    /* مدلِ تازه بدونِ مقدار ⇒ مقدارِ مدلِ قبلی باید پاک شود */
    next[specKey(f.id)] = v === undefined || v === null ? '' : v
  }
  return next
}

/** فیلدهایی که به این فیلد وابسته‌اند — با عوض‌شدنش پاک می‌شوند */
export const dependentsOf = (fields: SpecField[], id: string): SpecField[] =>
  fields.filter(f => f.depends_on === id)

/* ── پنهان در برابر غیرفعال ──
   وقتی والد یک **سوییچ** است، فیلدِ فرزند تا روشن‌نشدنش اصلاً
   معنا ندارد («نوع نگهدارنده» وقتی نگهدارنده‌ای نیست) — پس پنهان
   می‌شود. وقتی والد یک **فهرست** است، فیلد باید دیده شود تا کاربر
   بداند قدمِ بعدی چیست — پس فقط غیرفعال می‌شود.

   `depends_on_construction` هم همین است، با فهرستِ مقدارهای مجاز. */
export function isFieldHidden(
  field: SpecField, values: Record<string, unknown>, fields: SpecField[],
): boolean {
  if (field.depends_on_construction) {
    const c = String(values[specKey('construction')] ?? '')
    return !field.depends_on_construction.includes(c)
  }
  if (!field.depends_on || isFormLevelField(field.depends_on)) return false
  const parent = fields.find(f => f.id === field.depends_on)
  if (parent?.type !== 'boolean') return false
  return values[specKey(field.depends_on)] !== true
}

/** تا وقتی والدش خالی است، فهرستِ این فیلد بی‌معناست */
export function isFieldLocked(
  field: SpecField, values: Record<string, unknown>, typeChosen: boolean,
): boolean {
  /*
      «نوع» و «برند» و «مدل» بالای فرم‌اند، نه در کارتِ مشخصات. داده
      با نامِ خودشان به آن‌ها ارجاع می‌دهد: `table_type` برای میز،
      `ball_type` برای توپ، `cue_type` برای چوب. هر سه یک چیزند —
      همان انتخابِ نوعِ بالای فرم. */
  if (field.depends_on && isFormLevelField(field.depends_on)) return !typeChosen
  if (field.depends_on) {
    const v = values[specKey(field.depends_on)]
    return v === undefined || v === null || String(v).trim() === ''
  }
  /* فیلدِ `source`دارِ بدونِ وابستگیِ صریح هم به نوع نیاز دارد */
  return !!field.source && !typeChosen
}

/**
 * تغییرِ یک فیلد، با آبشارِ داده‌محور:
 *  · وابسته‌ها پاک می‌شوند (و وابسته‌های آن‌ها، به‌صورت بازگشتی).
 *  · هر فیلدی که `auto_from: <fieldId>.<prop>` دارد از مقدارِ تازه
 *    پر می‌شود — ولی قفل نمی‌شود؛ فروشنده می‌تواند عوضش کند.
 */
export function applySpecChange(
  fields: SpecField[],
  field: SpecField,
  value: unknown,
  values: Record<string, unknown>,
  /** ویژگی‌های شیءِ انتخاب‌شده — مثلاً `{ type: 'napped', weight_oz: '30' }` */
  picked?: Record<string, string | undefined>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...values, [specKey(field.id)]: value }

  const clearDeps = (id: string) => {
    for (const d of dependentsOf(fields, id)) {
      next[specKey(d.id)] = ''
      clearDeps(d.id)
    }
  }
  clearDeps(field.id)

  if (picked) {
    for (const f of fields) {
      if (!f.auto_from) continue
      const [srcId, prop] = f.auto_from.split('.')
      if (srcId !== field.id || !prop) continue
      const v = picked[prop]
      if (v) next[specKey(f.id)] = v
    }
  }
  return next
}

/* ── پلِ تعریفِ قدیمی ──
   `specs_catalog.json` فعلاً فقط چوب، میز و توپ را دارد. ولی تیپ، گچ
   و کیس هم در `specs.ts` تعریفِ دستیِ خودشان را داشتند و فرم نشانشان
   می‌داد.

   وقتی موتور به کاتالوگ منتقل شد، این سه دسته بی‌فیلد ماندند — فرمشان
   فقط «وضعیت کالا» داشت. تستِ ایستا نگرفتش چون هیچ ادعایی درباره‌ی
   دسته‌های بیرونِ کاتالوگ نداشتیم.

   پس تعریفِ قدیمی به شکلِ تازه ترجمه می‌شود. کلیدِ ذخیره عوض نمی‌شود
   (`shaftMaterial` همان می‌ماند)، پس آگهی‌های موجود دست‌نخورده‌اند.
   با اضافه‌شدنِ هر دسته به JSON، این پل خودبه‌خود کنار می‌رود. */
export interface LegacySpecDef {
  key: string
  label: string
  type: 'dropdown' | 'number' | 'text'
  options?: string[]
  unit?: string
  placeholder?: string
  dependsOn?: string
  optionsByDependency?: Record<string, string[]>
}

export function fromLegacyDefs(defs: LegacySpecDef[]): SpecField[] {
  return defs.map(d => {
    const opts = d.options ?? []
    /* «سایر» در تعریفِ قدیمی یک گزینه‌ی معمولی بود؛ در شکلِ تازه یک
       پرچم است که فیلدِ متنی را باز می‌کند. */
    const hasOther = opts.includes('سایر')
    const field: SpecField = {
      id: d.key,
      label_fa: d.unit ? `${d.label} (${d.unit})` : d.label,
      type: d.type === 'dropdown' ? 'select' : d.type,
      placeholder: d.placeholder,
      allow_other: hasOther || undefined,
      depends_on: d.dependsOn,
    }
    if (d.type === 'dropdown') {
      field.options = opts.filter(o => o !== 'سایر').map(o => ({ id: o, label_fa: o }))
    }
    return field
  })
}

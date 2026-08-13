/* ─────────────────────────────────────────────────────────────
   مشخصاتِ فنیِ محصول — تعریفِ واحد.

   این تعریف‌ها تا امروز داخلِ فرمِ ثبتِ آگهی زندگی می‌کردند
   (`app/shop/new/page.tsx`). یعنی مقدارها در دیتابیس ذخیره
   می‌شدند ولی هیچ‌جای دیگری نمی‌دانست کلیدِ `shaftMaterial` یعنی
   «جنس شفت» — و صفحه‌ی جزئیاتِ محصول همه‌شان را نادیده می‌گرفت.

   حالا فرم و صفحه‌ی نمایش هر دو از همین‌جا می‌خوانند.
   ───────────────────────────────────────────────────────────── */

// ── Spec field definitions ─────────────────────────────────────
export interface SpecFieldDef {
  key: string; label: string
  type: 'dropdown' | 'number' | 'text'
  options?: string[]; unit?: string; placeholder?: string; wide?: boolean
  dependsOn?: string                              // key of the field this field's options depend on
  optionsByDependency?: Record<string, string[]>  // options for each value of dependsOn
}

export const GENERIC_SPECS: SpecFieldDef[] = [
  { key: 'brand',     label: 'برند',   type: 'text',     placeholder: 'نام برند' },
  { key: 'condition', label: 'وضعیت', type: 'dropdown', options: ['نو','کارکرده'] },
]

export const CATEGORY_SPECS: Record<string, SpecFieldDef[]> = {
  cue: [
    { key: 'cueType', label: 'نوع', type: 'dropdown', options: ['پاکت بیلیارد','اسنوکر','هی‌بال','کارامبول','سایر'] },
    {
      key: 'brand', label: 'برند', type: 'dropdown',
      dependsOn: 'cueType',
      optionsByDependency: {
        'اسنوکر':         ['John Parris','Trevor White','Robert Osborne','Will Hunt','Peradon','Riley','Riley Burwat','BCE','PowerGlide','Cue Craft','Cannon','O\'Min','Phoenix','Master Cue','Dufferin','سایر'],
        'پاکت بیلیارد':  ['Predator','Mezz','McDermott','Meucci','Pechauer','Cuetec','Lucasi','Viking','Jacoby','Schon','Joss','Players','Poison','Action','Griffin','سایر'],
        'هی‌بال':         ['Mezz','Predator','McDermott','Lucasi','Players','سایر'],
        'کارامبول':       ['Joosep','Longoni','Predac','Fury','سایر'],
      },
    },
    { key: 'length',        label: 'طول',           type: 'number',   unit: 'سانتیمتر', placeholder: '147' },
    { key: 'weight',        label: 'وزن',           type: 'number',   unit: 'اونس',      placeholder: '19' },
    { key: 'tipDiameter',   label: 'قطر تیپ',       type: 'number',   unit: 'میلیمتر',  placeholder: '13' },
    { key: 'buttDiameter',  label: 'قطر بات',       type: 'number',   unit: 'میلیمتر',  placeholder: '30' },
    { key: 'shaftMaterial', label: 'جنس شفت',       type: 'dropdown', options: ['چوب افرا','کربن فایبر','ترکیبی','سایر'] },
    { key: 'tipType',       label: 'نوع تیپ',       type: 'text',     placeholder: 'مثال: Kamui Black' },
    { key: 'pieces',        label: 'تعداد تکه',     type: 'dropdown', options: ['یک تکه','دو تکه'] },
    { key: 'condition',     label: 'وضعیت',         type: 'dropdown', options: ['نو','کارکرده'] },
  ],
  table: [
    { key: 'tableType',      label: 'نوع',          type: 'dropdown', options: ['پاکت بیلیارد','اسنوکر','هی‌بال','کارامبول','خانگی'] },
    /* ── سایز ──
       فرم این را از `TableSizeField` می‌گیرد، نه از این فهرست:
       سایزها به نوعِ میز وابسته‌اند و فهرستِ مشترک سه چیز را خراب
       می‌کرد — کارامبول با فوت اندازه نمی‌شود، اسنوکر ۱۲ فوت دارد
       و پاکت ندارد، و «۸ فوت» در آن دو ابعادِ متفاوت است.
       تعریف این‌جا می‌ماند چون صفحه‌ی جزئیات برچسبش را از همین‌جا
       می‌خواند. فرم امروز از `specs_catalog.json` می‌آید و این تعریف
       فقط پلِ آگهی‌های قدیمی است. */
    { key: 'size',           label: 'اندازه',       type: 'dropdown', options: [] },
    { key: 'bodyMaterial',   label: 'جنس بدنه',     type: 'dropdown', options: ['اسلیت','MDF','چوب ماسیو','سایر'] },
    { key: 'slateThickness', label: 'ضخامت سنگ',   type: 'number',   unit: 'میلیمتر', placeholder: '45' },
    { key: 'clothType',      label: 'نوع پارچه',    type: 'dropdown', options: ['وُرستد','پشم','نایلون','سایر'] },
    { key: 'clothColor',     label: 'رنگ پارچه',    type: 'dropdown', options: ['سبز','آبی','قرمز','طوسی','سایر'] },
    { key: 'cushionType',    label: 'نوع باند',      type: 'dropdown', options: ['گوم طبیعی','سینتتیک','سایر'] },
    { key: 'brand',          label: 'برند',          type: 'dropdown', options: ['استار','شندر','ویراکا','لوتوس','برونزویک','دایموند','سایر'] },
    { key: 'model',          label: 'مدل',           type: 'text',     placeholder: 'مثال: Gold Crown VI', wide: true },
    { key: 'condition',      label: 'وضعیت',         type: 'dropdown', options: ['نو','کارکرده'] },
  ],
  ball: [
    { key: 'brand',     label: 'برند',      type: 'dropdown', options: ['آرامیت','سیکلوپ','سایر'] },
    { key: 'setType',   label: 'نوع ست',    type: 'dropdown', options: ['۱۵ تایی پاکت بیلیارد','۲۲ تایی اسنوکر','۳ تایی کارامبول','سایر'] },
    { key: 'diameter',  label: 'قطر',       type: 'number',   unit: 'میلیمتر', placeholder: '57.2' },
    { key: 'material',  label: 'جنس',       type: 'dropdown', options: ['فنولیک رزین','پلی‌استر','سایر'] },
    { key: 'condition', label: 'وضعیت',     type: 'dropdown', options: ['نو','کارکرده'] },
  ],
  tip: [
    { key: 'brand',        label: 'برند',          type: 'dropdown', options: ['Kamui','Taom','Moori','Elk Master','Tiger','Triangle','Le Pro','Predator','HOW Tips','Nili','سایر'] },
    { key: 'model',        label: 'مدل',            type: 'text',     placeholder: 'مثال: Kamui Black' },
    { key: 'diameter',     label: 'قطر',            type: 'dropdown', options: ['۹','۱۰','۱۱','۱۲','۱۲.۵','۱۳','۱۳.۵','۱۴ میلیمتر'] },
    { key: 'hardness',     label: 'سختی',           type: 'dropdown', options: ['خیلی نرم','نرم','متوسط','سخت','خیلی سخت'] },
    { key: 'tipType',      label: 'نوع',            type: 'dropdown', options: ['تک لایه چرم','چندلایه چرم','سینتتیک','فنولیک'] },
    { key: 'leatherType',  label: 'جنس چرم',        type: 'dropdown', options: ['چرم خوک','چرم گاو','چرم بوفالو','سایر'] },
    { key: 'layers',       label: 'تعداد لایه',     type: 'number',   placeholder: '1' },
    { key: 'packageCount', label: 'تعداد در بسته',  type: 'dropdown', options: ['تک فروشی','۵ عددی','۱۰ عددی'] },
  ],
  chalk: [
    { key: 'brand',        label: 'برند',          type: 'dropdown', options: ['Master','Predator','Taom','Triangle','Silver Cup','سایر'] },
    { key: 'packageCount', label: 'تعداد در بسته', type: 'dropdown', options: ['تک فروشی','۵ عددی','۱۲ عددی','۱۴۴ عددی'] },
    { key: 'color',        label: 'رنگ',           type: 'dropdown', options: ['آبی','سبز','سایر'] },
  ],
  'case-bag': [
    { key: 'caseType',  label: 'نوع',     type: 'dropdown', options: ['هارد کیس','سافت کیس','کیف','کوله‌پشتی'] },
    { key: 'capacity',  label: 'ظرفیت',  type: 'dropdown', options: ['۱×۱','۲×۲','۲×۴','۳×۵','۴×۸'] },
    { key: 'material',  label: 'جنس',    type: 'dropdown', options: ['چرم طبیعی','چرم مصنوعی','نایلون','سایر'] },
    { key: 'brand',     label: 'برند',   type: 'text',     placeholder: 'نام برند' },
    { key: 'condition', label: 'وضعیت', type: 'dropdown', options: ['نو','کارکرده'] },
  ],
}

/* ── برچسبِ کلیدهای نسل‌قبل ──
   آگهی‌های موجود کلیدهایی دارند که در `specs_catalog.json` امروز
   نیستند: `bodyMaterial` جای `frame_material` را داشت. صفحه‌ی
   آگهی کلیدِ ناشناخته را با نامِ خودش نشان می‌داد و خریدار
   «bodyMaterial : اسلیت» می‌دید.

   تعریفِ قدیمی همین‌جاست و برچسبِ فارسی‌اش را دارد؛ فقط باید
   خوانده شود. واحد هم اگر داشت کنارش می‌آید، مثلِ خودِ فرم. */
export function legacyLabelOf(category: string | null | undefined, key: string): string | undefined {
  const defs = [...(CATEGORY_SPECS[String(category ?? '')] ?? []), ...GENERIC_SPECS]
  const d = defs.find(x => x.key === key)
  if (!d) return undefined
  return d.unit ? `${d.label} (${d.unit})` : d.label
}

/* ── کلیدهای شناخته‌شده‌ی نسل‌قبل ──
   فهرستِ مجازِ مسیرِ ثبت نمی‌تواند فقط تعریفِ امروز باشد: مهاجرتِ
   آگهی‌های `localStorage` همان `specs`ِ قدیمی را POST می‌کند، و
   وقتی `/api/specs/[category]` از دسترس خارج شود فرم هم به همین
   تعریفِ قدیمی برمی‌گردد. هر دو مسیر آگهیِ سالم می‌سازند و نباید
   ۴۰۰ بگیرند. */
export function legacySpecKeys(category: string | null | undefined): string[] {
  const defs = [...(CATEGORY_SPECS[String(category ?? '')] ?? []), ...GENERIC_SPECS]
  const out = defs.flatMap(d => [d.key, `${d.key}_other`])
  /* برند و نوع پیش‌تر داخلِ `specs` هم می‌نشستند */
  return [...out, 'brand', 'model', 'type', 'cueType', 'tableType', 'ballType', 'tipType', 'caseType']
}

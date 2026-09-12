/* ─────────────────────────────────────────────────────────────
   کاتالوگ خدمات فنی — تنها منبع حقیقت.

   ── چرا این فایل ──
   تا امروز `TECH_SERVICES` یک آرایه‌ی تخت نه *رشته* بود: بدون
   دسته، بدون شناسه، بدون توضیح. نتیجه‌اش این بود که پروفایل
   عمومی خدمات را به‌صورت چیپ‌های ریز کنار هم می‌ریخت — یعنی
   «ابر برچسب»، نه کاتالوگ حرفه‌ای.

   ── معماری ──
   ⚠️ کاتالوگ *پیکربندی محصول* است نه داده‌ی کاربر، پس در کد
   می‌ماند — همان جایی که `MEDIA_CATEGORIES` هست. جدول تازه‌ی SQL
   ساخته نشد: پروفایل‌ها در ستون jsonb `profiles.data` ذخیره
   می‌شوند و افزودن سه جدول یعنی مهاجرت اسکیما روی سایت زنده،
   که قاعده‌اش تأیید صریح مالک است.

   *انتخاب* متخصص در `profiles.data.services` می‌ماند — همان‌جای
   قبلی — ولی از این پس با **شناسه‌ی پایدار**، نه متن فارسی. متن
   می‌تواند اصلاح شود بدون آنکه انتخاب کسی بشکند.

   ── قرارداد ──
   فرم ثبت‌نام و پروفایل عمومی هر دو از همین‌جا می‌خوانند. هیچ
   فهرست دومی جایی هاردکد نمی‌شود.
   ───────────────────────────────────────────────────────────── */

export interface TechServiceDef {
  /** شناسه‌ی پایدار — همین در پروفایل ذخیره می‌شود */
  id: string
  categoryId: string
  title: string
  /** توضیح فنی — ثانویه است و نباید با نام خدمت رقابت کند */
  description?: string
}

export interface TechServiceCategory {
  id: string
  title: string
  services: TechServiceDef[]
}

const cue = (id: string, title: string, description?: string): TechServiceDef =>
  ({ id, categoryId: 'cue', title, ...(description ? { description } : {}) })
const table = (id: string, title: string, description?: string): TechServiceDef =>
  ({ id, categoryId: 'table', title, ...(description ? { description } : {}) })

export const TECH_SERVICE_CATEGORIES: TechServiceCategory[] = [
  {
    id: 'cue',
    title: 'تعمیرات چوب',
    services: [
      cue('ferrule-replace', 'تعویض فرول'),
      cue('ferrule-resize', 'تغییر سایز فرول'),
      cue('tip-replace', 'تعویض تیپ'),
      cue('straighten', 'تاب‌گیری'),
      cue('full-service', 'سرویس کامل چوب',
        'احیای رنگ و خطوط و روغن‌کاری‌های چندمرحله‌ای بابت محافظت از چوب'),
      cue('joint', 'تعویض و نصب جوینت', 'رزوه‌ی وسط و انتهای چوب، تعویض جوینت شکسته و نصب جوینت نو'),
      cue('weight', 'تغییر وزن'),
      cue('balance', 'تغییر بالانس'),
      cue('butt-resize', 'تغییر سایز بات'),
      cue('extension', 'ساخت اکستنشن اختصاصی', 'وزن، قد و قطر دلخواه'),
    ],
  },
  {
    id: 'table',
    title: 'تعمیرات میز',
    services: [
      table('cloth', 'تعویض پارچه'),
      table('install', 'نصب کامل'),
      table('level', 'تراز مجدد'),
      table('cushion', 'تعویض لاستیک باند'),
      table('pocket-set', 'تعویض چرم و تور و ریل'),
      table('slate-repair', 'تعمیر شکستگی سنگ'),
      table('pocket-size', 'تغییر سایز دهانه پاکت'),
      table('diamonds', 'تعویض لوز میز'),
    ],
  },
]

export const ALL_TECH_SERVICES: TechServiceDef[] =
  TECH_SERVICE_CATEGORIES.flatMap(c => c.services)

const BY_ID = new Map(ALL_TECH_SERVICES.map(s => [s.id, s]))
const BY_TITLE = new Map(ALL_TECH_SERVICES.map(s => [s.title, s]))

/* ── نگاشت ردیف‌های پیش از این تغییر ──
   ⚠️ پروفایل‌های موجود متن فارسی فهرست قدیمی را ذخیره کرده‌اند.
   آن‌ها که معادل دقیق دارند نگاشت می‌شوند؛ بقیه **پاک نمی‌شوند** —
   زیر «سایر خدمات» می‌مانند تا داده‌ی کسی از بین نرود. */
/* ⚠️ `Map` نه شیء ساده: ایندکس خام شیء برای کلیدهایی مثل
   `constructor` یا `toString` یک *تابع* برمی‌گرداند در حالی که
   TypeScript آن را `string` تایپ می‌کند — و آن مقدار وارد مجموعه‌ی
   شناسه‌ها می‌شد. */
const LEGACY = new Map<string, string>([
  ['تعویض پارچه', 'cloth'],
  ['تعویض لاستیک باند', 'cushion'],
  ['رگلاژ و تراز میز', 'level'],
  ['نصب میز', 'install'],
])

/** یک مقدار ذخیره‌شده (شناسه‌ی تازه یا متن قدیمی) ⟵ شناسه، اگر بشود */
export const toServiceId = (stored: string): string | null =>
  BY_ID.has(stored) ? stored
    : LEGACY.get(stored) ?? BY_TITLE.get(stored)?.id ?? null

export interface ResolvedServices {
  /** فقط دسته‌هایی که این متخصص در آن‌ها خدمتی دارد */
  categories: { id: string; title: string; services: TechServiceDef[] }[]
  /** مقادیر قدیمی که معادل تازه ندارند — حفظ می‌شوند، ساخته نمی‌شوند */
  legacy: string[]
  count: number
}

/**
 * آنچه در پروفایل ذخیره شده ⟵ ساختار آماده‌ی نمایش.
 * ⚠️ فقط چیزی برمی‌گرداند که واقعا انتخاب شده. هیچ خدمتی برای
 * پرکردن صفحه اضافه نمی‌شود.
 */
export function resolveServices(stored: readonly string[] | undefined): ResolvedServices {
  const ids = new Set<string>()
  const legacy: string[] = []
  for (const raw of stored ?? []) {
    const v = String(raw).trim()
    if (!v) continue
    const id = toServiceId(v)
    if (id) ids.add(id)
    else if (!legacy.includes(v)) legacy.push(v)
  }
  const categories = TECH_SERVICE_CATEGORIES
    .map(c => ({ id: c.id, title: c.title, services: c.services.filter(s => ids.has(s.id)) }))
    .filter(c => c.services.length > 0)
  return { categories, legacy, count: ids.size + legacy.length }
}

/** انتخاب ذخیره‌شده ⟵ مجموعه‌ی شناسه‌ها، برای فرم ثبت‌نام */
export function storedToIds(stored: readonly string[] | undefined): string[] {
  const out: string[] = []
  for (const raw of stored ?? []) {
    const id = toServiceId(String(raw).trim())
    if (id && !out.includes(id)) out.push(id)
  }
  return out
}

/** شناسه‌های انتخاب‌شده + مقادیر قدیمی بی‌معادل ⟵ آنچه ذخیره می‌شود */
export function idsToStored(ids: readonly string[], keepLegacy: readonly string[] = []): string[] {
  return [...ids.filter(id => BY_ID.has(id)), ...keepLegacy]
}

/**
 * آنچه ذخیره شده ⟵ *عنوان فارسی*.
 *
 * ⚠️ لازم است چون دایرکتوری و جست‌وجو با متن کار می‌کنند، نه با
 * شناسه. بدون این، اولین ذخیره‌ی پنل باعث می‌شد کارت دایرکتوری
 * «cloth» و «ferrule-replace» نشان بدهد و فیلتر خدمات صفر نتیجه
 * بدهد — چون فهرست فیلتر عنوان فارسی است.
 */
export function storedToTitles(stored: readonly string[] | undefined): string[] {
  const r = resolveServices(stored)
  return [...r.categories.flatMap(c => c.services.map(s => s.title)), ...r.legacy]
}
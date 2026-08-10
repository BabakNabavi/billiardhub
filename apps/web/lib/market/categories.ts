/* ═══════════════════════════════════════════════════════════════
   دسته‌بندی‌های بیلیارد بازار — منبعِ واحد.
   ───────────────────────────────────────────────────────────────
   تا امروز سه فهرستِ جدا وجود داشت و با هم یکی نبودند:

     · فرمِ ثبت آگهی  (app/shop/new)      ۱۴ دسته، شاملِ `case-bag`
     · صفحه‌ی بازار   (app/shop/page)     ۱۵ دسته، شاملِ `cue-case` و `ball-bag`
     · CAT_LABELS     (app/shop/products) ۱۴ دسته، مثلِ فرم

   نتیجه‌ی عملی این بود که فروشنده فقط می‌توانست «کیس و کیف»
   (`case-bag`) را انتخاب کند، بازار آن را به «کیس چوب» (`cue-case`)
   نگاشت می‌کرد، و فیلترِ «کیف توپ» (`ball-bag`) در بازار **هرگز**
   هیچ آگهی‌ای نداشت — یک فیلترِ مرده که کاربر رویش کلیک می‌کرد و
   فهرستِ خالی می‌دید.

   حالا هر سه از این فایل می‌خوانند. اضافه‌کردنِ دسته یعنی یک ردیف
   این‌جا، نه سه جای مختلف.

   ── چرا در دیتابیس نیست؟ ──
   دسته‌ها آیکونِ تصویری دارند (فایلِ استاتیک) و در URL و در فیلترها
   به‌عنوان کلیدِ ثابت استفاده می‌شوند. جدولِ دسته یعنی یک کوئریِ اضافه
   در هر بارگذاریِ صفحه برای فهرستی که سالی یک‌بار عوض می‌شود، و
   آیکون‌ها باز هم در کد می‌مانند. اگر روزی ادمین بخواهد خودش دسته
   بسازد، همین شکل به جدول منتقل می‌شود بدونِ اینکه مصرف‌کننده‌ها
   تغییر کنند — همه‌شان از همین توابع می‌خوانند.
   ═══════════════════════════════════════════════════════════════ */

export interface MarketCategory {
  id: string
  label: string
  /** آیکونِ تصویری — فقط صفحه‌ی بازار استفاده می‌کند */
  img: string
  /** تنظیمِ ظاهریِ آیکون، وقتی تصویرِ منبع وسط‌چین نیست */
  imgStyle?: React.CSSProperties
}

export const MARKET_CATEGORIES: MarketCategory[] = [
  { id: 'cue',       label: 'چوب',      img: '/images/icon/cue/cue-icon-256-144.webp' },
  { id: 'table',     label: 'میز',      img: '/images/icon/table/wiraka-144.webp' },
  { id: 'ball',      label: 'توپ',      img: '/images/icon/ball/ballset-icon-256-144.webp' },
  { id: 'tip',       label: 'تیپ',      img: '/images/icon/tip/tip-icon-256-144.webp' },
  { id: 'chalk',     label: 'گچ',       img: '/images/icon/chalk/chalk-icon-256-144.webp' },
  { id: 'extension', label: 'اکستنشن',  img: '/images/icon/ex/shaft-icon-256-144.webp' },
  { id: 'cue-case',  label: 'کیس چوب',  img: '/images/icon/case/case-icon-256-144.webp' },
  { id: 'ball-bag',  label: 'کیف توپ',  img: '/images/icon/kif/ballcase-icon-256-144.webp' },
  { id: 'rest',      label: 'رست',      img: '/images/icon/rest/rest-144.webp' },
  { id: 'cloth',     label: 'پارچه',    img: '/images/icon/parche/parche-144.webp' },
  /* تصویر روغن در فایلش چپ‌نشین است — کمی به راست هل داده می‌شود */
  { id: 'oil',       label: 'روغن',     img: '/images/icon/oil/oil-144.webp', imgStyle: { transform: 'translateX(9%)' } },
  { id: 'towel',     label: 'حوله',     img: '/images/icon/hole/hole-144.webp' },
  { id: 'clothing',  label: 'پوشاک',    img: '/images/icon/pooshak/pooshak-144.webp' },
  { id: 'accessory', label: 'اکسسوری',  img: '/images/icon/accessori/accessori-144.webp' },
  { id: 'other',     label: 'سایر',     img: '/images/icon/other/other-144.webp' },
]

export const CATEGORY_IDS = new Set(MARKET_CATEGORIES.map(c => c.id))

/* کلیدهای قدیمی که در آگهی‌های ثبت‌شده مانده‌اند.

   `case-bag` تنها گزینه‌ی فرمِ قدیمی بود و هم کیس چوب و هم کیف توپ را
   یک‌کاسه می‌کرد. آگهی‌های قدیمی به «کیس چوب» می‌روند — انتخابِ
   محافظه‌کارانه، چون همان چیزی است که بازار تا امروز نشانشان می‌داد. */
export const LEGACY_CATEGORY_MAP: Record<string, string> = {
  'case-bag': 'cue-case',
  'case': 'cue-case',
  'bag': 'ball-bag',
}

/** هر کلیدی را به یک دسته‌ی معتبر می‌رساند؛ ناشناخته ⇒ «سایر» */
export function normalizeCategory(raw?: string | null): string {
  const v = String(raw ?? '').trim()
  if (!v) return 'other'
  const mapped = LEGACY_CATEGORY_MAP[v] ?? v
  return CATEGORY_IDS.has(mapped) ? mapped : 'other'
}

/** برچسبِ فارسیِ یک دسته */
export function categoryLabel(id?: string | null): string {
  const norm = normalizeCategory(id)
  return MARKET_CATEGORIES.find(c => c.id === norm)?.label ?? 'سایر'
}

/** شکلِ ساده برای فرم‌ها و کشوها — بدونِ آیکون */
export const CATEGORY_OPTIONS = MARKET_CATEGORIES.map(c => ({ id: c.id, label: c.label }))

/* ── وضعیتِ کالا ──────────────────────────────────────────────────
   این هم سه‌جا تکرار شده بود. «نیازمند تعمیر» اضافه شد: بازارِ
   دستِ‌دوم بدونِ آن، فروشنده‌ی صادق را وادار می‌کند «کارکرده» بزند و
   خریدار سرِ قرار غافلگیر شود. */
export const CONDITIONS = [
  { id: 'new', label: 'نو' },
  { id: 'like_new', label: 'در حد نو' },
  { id: 'used', label: 'کارکرده' },
  { id: 'needs_repair', label: 'نیازمند تعمیر' },
] as const

export type ConditionId = typeof CONDITIONS[number]['id']
export const CONDITION_IDS = new Set(CONDITIONS.map(c => c.id))
export const normalizeCondition = (v?: string | null): ConditionId =>
  (CONDITION_IDS.has(String(v ?? '') as ConditionId) ? String(v) : 'new') as ConditionId
export const conditionLabel = (v?: string | null): string =>
  CONDITIONS.find(c => c.id === normalizeCondition(v))?.label ?? 'نو'

/* ── وضعیتِ آگهی ──────────────────────────────────────────────────
   `sold` و `expired` تازه‌اند؛ بقیه از قبل در داده بودند. `deleted`
   عمداً می‌ماند چون کدِ فعلی روی آن حساب باز کرده است. */
export const LISTING_STATUSES = ['active', 'paused', 'sold', 'expired', 'pending', 'rejected', 'deleted'] as const
export type ListingStatus = typeof LISTING_STATUSES[number]

/** وضعیت‌هایی که آگهی در بازار دیده می‌شود */
export const VISIBLE_STATUSES: ListingStatus[] = ['active']

export const STATUS_LABEL: Record<ListingStatus, string> = {
  active: 'فعال',
  paused: 'متوقف',
  sold: 'فروخته شد',
  expired: 'منقضی',
  pending: 'در انتظار تأیید',
  rejected: 'رد شده',
  deleted: 'حذف‌شده',
}

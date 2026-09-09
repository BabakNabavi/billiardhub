/* ─────────────────────────────────────────────────────────────
   بخش‌های تحریریه — منبع واحد.

   ── چرا این فایل لازم شد ──
   ⚠️ پنل ادمین و سایت عمومی دو واژگان کاملا متفاوت داشتند:
   ادمین `tournament | ranking | club | product | general` می‌نوشت و
   `lib/news-data` دنبال `snooker | pool | players | tournms | clubs |
   gear | world | iran` می‌گشت. هیچ‌کدام با دیگری هم‌پوشانی نداشت، و
   چون دسته‌ی ناشناخته به اولین کلید برمی‌گشت، **هر خبری که ادمین
   منتشر می‌کرد روی سایت برچسب «اخبار اسنوکر» می‌خورد** — خبر
   محصولات هم، خبر رنکینگ هم.

   حالا هر دو از همین فهرست می‌خوانند و مقدارهای قدیمی با `ALIASES`
   به بخش درست نگاشته می‌شوند، تا ردیف‌های موجود دیتابیس هم درست
   دیده شوند بدون اینکه چیزی در دیتابیس دست بخورد.
   ───────────────────────────────────────────────────────────── */

export interface NewsSection {
  key: string
  /** نام بخش در ناوبری و بالای کارت */
  label: string
  /** فرم کوتاه برای جاهای تنگ (نوار افقی موبایل) */
  short: string
  /** در نوار ناوبری تحریریه دیده شود؟ */
  nav: boolean
  /** یک‌خطی برای متادیتای صفحه‌ی بخش */
  blurb: string
}

/* ⚠️ ترتیب همان ترتیب نوار ناوبری است — از پرترافیک به کم‌ترافیک،
   نه الفبایی. خواننده‌ی خبر رشته‌ی خودش را اول می‌خواهد. */
export const NEWS_SECTIONS = [
  { key: 'snooker',     label: 'اسنوکر',        short: 'اسنوکر',  nav: true,
    blurb: 'اخبار اسنوکر: تورنمنت‌ها، بازیکنان و نتایج' },
  { key: 'pool',        label: 'پاکت بیلیارد',   short: 'پاکت',    nav: true,
    blurb: 'اخبار پاکت بیلیارد: هشت‌توپ، نه‌توپ و ده‌توپ' },
  /* ⚠️ «کاروم» برداشته شد و جایش «هی بال» آمد. کلید `highball`
     همان کلیدی است که جدول `events` (مهاجرت ۰۲۵) و دسته‌های
     بیلیارد مدیا از قبل به کار می‌برند — کلید تازه نساختیم. */
  { key: 'highball',    label: 'هی بال',         short: 'هی بال',  nav: true,
    blurb: 'اخبار هی بال' },
  { key: 'tournaments', label: 'مسابقات',        short: 'مسابقات', nav: true,
    blurb: 'مسابقات و قهرمانی‌های داخلی و بین‌المللی' },
  { key: 'players',     label: 'بازیکنان',       short: 'بازیکنان', nav: true,
    blurb: 'اخبار بازیکنان، نقل‌وانتقال‌ها و کارنامه‌ها' },
  { key: 'equipment',   label: 'تجهیزات',        short: 'تجهیزات', nav: true,
    blurb: 'تجهیزات، چوب، میز و فناوری بیلیارد' },
  { key: 'clubs',       label: 'باشگاه‌ها',       short: 'باشگاه‌ها', nav: true,
    blurb: 'باشگاه‌ها، فدراسیون‌ها و صنعت بیلیارد' },
  { key: 'interview',   label: 'گفت‌وگو',         short: 'گفت‌وگو',  nav: true,
    blurb: 'مصاحبه‌های اختصاصی بیلیارد هاب' },
  { key: 'analysis',    label: 'تحلیل',          short: 'تحلیل',   nav: true,
    blurb: 'تحلیل، یادداشت و پرونده‌های ویژه' },
  { key: 'video',       label: 'ویدئو',          short: 'ویدئو',   nav: true,
    blurb: 'گزارش‌های تصویری و ویدئویی' },
  /* بخش‌های معتبر که در نوار نمی‌آیند تا نوار شلوغ نشود */
  { key: 'ranking',     label: 'رنکینگ',         short: 'رنکینگ',  nav: false,
    blurb: 'رنکینگ و رده‌بندی‌ها' },
  { key: 'world',       label: 'بین‌الملل',       short: 'بین‌الملل', nav: false,
    blurb: 'اخبار بین‌المللی بیلیارد' },
  { key: 'iran',        label: 'ایران',          short: 'ایران',   nav: false,
    blurb: 'اخبار بیلیارد ایران' },
] as const satisfies readonly NewsSection[]

export type NewsSectionKey = typeof NEWS_SECTIONS[number]['key']

const BY_KEY = new Map<string, NewsSection>(NEWS_SECTIONS.map(s => [s.key, s]))

/* ⚠️ نگاشت مقدارهای قدیمی. ردیف‌های موجود دیتابیس با همین مقدارها
   ذخیره شده‌اند و دست نمی‌خورند؛ فقط هنگام خواندن ترجمه می‌شوند.
   `general` عمدا نگاشت ندارد: «عمومی» یک بخش تحریریه نیست و خبر
   بی‌بخش باید بی‌بخش بماند، نه اینکه زورکی جایی برود. */
const ALIASES: Record<string, NewsSectionKey> = {
  tournament: 'tournaments',
  tournms: 'tournaments',
  club: 'clubs',
  product: 'equipment',
  gear: 'equipment',
  interviews: 'interview',
  pocket: 'pool',
  '8ball': 'pool',
  '9ball': 'pool',
  '10ball': 'pool',
  highbal: 'highball',
  'high-ball': 'highball',
  /* ⚠️ `carom` دیگر بخشی ندارد. ردیفی که با این مقدار ذخیره شده
     باشد بی‌بخش می‌شود (برچسب «اخبار») — نه اینکه زورکی به بخش
     دیگری برود. امروز چنین ردیفی وجود ندارد. */
}

/** مقدار خام دیتابیس ⟵ کلید بخش، یا `null` اگر بخشی ندارد. */
export function normalizeSection(raw: unknown): NewsSectionKey | null {
  const v = String(raw ?? '').trim().toLowerCase()
  if (!v) return null
  if (BY_KEY.has(v)) return v as NewsSectionKey
  return ALIASES[v] ?? null
}

/** بخش را از روی کلید بده؛ کلید نامعتبر ⟵ `null` (نه یک بخش الکی). */
export function sectionOf(key: string | null | undefined): NewsSection | null {
  return key ? BY_KEY.get(key) ?? null : null
}

/** برچسب نمایشی — خبر بی‌بخش «اخبار» است، نه یک رشته‌ی خالی. */
export function sectionLabel(key: string | null | undefined): string {
  return sectionOf(key)?.label ?? 'اخبار'
}

export const NAV_SECTIONS = NEWS_SECTIONS.filter(s => s.nav)

/* ⚠️ فیلتر بخش در دیتابیس باید نام‌های قدیمی را هم بگیرد، وگرنه
   خبری که با `tournament` ذخیره شده در صفحه‌ی «مسابقات» دیده
   نمی‌شود — همان ردیف‌هایی که پنل ادمین تا امروز می‌ساخت. */
export function sectionQueryValues(key: string): string[] {
  const legacy = Object.entries(ALIASES)
    .filter(([, v]) => v === key).map(([k]) => k)
  return [key, ...legacy]
}

/* ── برچسب‌های تحریریه ──
   ⚠️ جدول `news` ستونی برای «فوری» یا «ویژه» ندارد و مهاجرت اسکیما
   بیرون از اختیار این کار است. به‌جای ساختن ستون خیالی، از ستون
   `tags` که *هست* و ادمین همین حالا پرش می‌کند استفاده می‌شود.
   یعنی هیچ داده‌ای جعل نمی‌شود: نوار فوری فقط وقتی می‌آید که یک
   ویراستار واقعا این برچسب را روی خبر گذاشته باشد. */
export const TAG_BREAKING = 'فوری'
export const TAG_FEATURE  = 'ویژه'
export const TAG_EXCLUSIVE = 'اختصاصی'

export const EDITORIAL_TAGS = [TAG_BREAKING, TAG_FEATURE, TAG_EXCLUSIVE] as const

export const hasTag = (tags: readonly string[] | undefined, t: string) =>
  (tags ?? []).some(x => x.trim() === t)

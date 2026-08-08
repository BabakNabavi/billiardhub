/* ─────────────────────────────────────────────────────────────
   نوعِ بازی و فرمتِ مسابقه — منبعِ واحد.

   ── چرا این فایل ساخته شد ──
   همین دو فهرست در چهار جا تکرار شده بودند: فرمِ پنلِ باشگاه،
   صفحه‌ی عمومیِ مسابقه، کارتِ فهرست، و اعتبارسنجیِ سمتِ سرور. هر
   کدام هم کمی فرق داشتند و نتیجه‌اش این شد:

     • فرمِ پنل `8ball` را در `discipline` می‌نوشت، ولی نگاشتِ
       صفحه‌های عمومی فقط `pocket` و `highball` و `snooker` را
       می‌شناخت. یعنی هر مسابقه‌ی ایت‌بال یا ناین‌بالی که ساخته
       می‌شد، برای بازدیدکننده «سایر» نمایش داده می‌شد.
     • `highball` در همان نگاشت به `9ball` می‌رفت — یعنی هی‌بال
       اصلاً وجود نداشت و به‌جایش ناین‌بال نشان داده می‌شد.

   حالا هر دو سمت از همین فایل می‌خوانند.
   ───────────────────────────────────────────────────────────── */

/* `other` عمداً در تایپ مانده ولی از فهرستِ انتخاب بیرون است:
   ردیف‌های قدیمی که با آن ساخته شده‌اند باید همچنان درست نمایش داده
   شوند. چیزی که نمی‌شود ساخت، لازم نیست ناخوانا هم بشود. */
export type Discipline =
  '8ball' | '9ball' | '10ball' | 'snooker' | 'highball' | 'other'

export interface DisciplineInfo {
  key: Discipline
  label: string
  color: string
  rgb: string
}

/* آنچه باشگاه‌دار می‌تواند انتخاب کند */
export const DISCIPLINE_CHOICES: DisciplineInfo[] = [
  { key: 'snooker',  label: 'اسنوکر',    color: '#C7A66A', rgb: '199,166,106' },
  { key: '8ball',    label: 'ایت بال',   color: '#3b82f6', rgb: '59,130,246'  },
  { key: '9ball',    label: 'ناین بال',  color: '#30C55A', rgb: '48,197,90'   },
  { key: '10ball',   label: 'تن بال',    color: '#0ea5e9', rgb: '14,165,233'  },
  { key: 'highball', label: 'هی‌بال',    color: '#8b5cf6', rgb: '139,92,246'  },
]

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  snooker: 'اسنوکر', '8ball': 'ایت بال', '9ball': 'ناین بال',
  '10ball': 'تن بال', highball: 'هی‌بال', other: 'سایر',
}

export const DISCIPLINE_COLORS: Record<Discipline, string> = {
  snooker: '#C7A66A', '8ball': '#3b82f6', '9ball': '#30C55A',
  '10ball': '#0ea5e9', highball: '#8b5cf6', other: '#8b5cf6',
}

/* نام‌های قدیمی که در دیتابیس مانده‌اند. `pocket` اصطلاحِ فارسیِ
   ایت‌بال بود و چند ردیفِ اولیه با آن ساخته شدند. */
const ALIASES: Record<string, Discipline> = {
  pocket: '8ball',
  '8-ball': '8ball',
  '9-ball': '9ball',
  '10-ball': '10ball',
  tenball: '10ball',
  hi_ball: 'highball',
  'hi-ball': 'highball',
  hiball: 'highball',
}

/** هر رشته‌ای که از دیتابیس بیاید ← یک نوعِ بازیِ شناخته‌شده */
export function normalizeDiscipline(raw: string | null | undefined): Discipline {
  const s = String(raw ?? '').trim().toLowerCase()
  if (s in DISCIPLINE_LABELS) return s as Discipline
  return ALIASES[s] ?? 'other'
}

/* ── فرمت‌ها ───────────────────────────────────────────────────
   سه خانواده، و هر نوعِ بازی فقط آن‌هایی را می‌بیند که برایش معنی
   دارند:

     race{N}  «Race to N» — اول به N فریم/رک برسد برنده است.
                اسنوکر این را ندارد؛ اصطلاحش «Best of» است.
     bo{N}    «Best of N» — مالِ اسنوکر.
     time{M}  بازیِ زمان‌دار به دقیقه — مالِ هی‌بال، که هم فریمی
                بازی می‌شود هم ساعتی.

   کلیدها عمداً یک رشته‌ی واحدند نه دو ستون: `match_format` از قبل
   وجود داشت و شکستنش به «نوع + مقدار» یعنی مهاجرتِ داده و دو جای
   تازه برای ناهماهنگی.

   ── چرا از ۴ شروع می‌شود ──
   «Race to 3» برداشته شد: مسابقه‌ای که با دو رکِ بُرد تمام شود
   عملاً قرعه‌کشی است نه مسابقه، و هیچ باشگاهی برایش ورودی نمی‌گیرد.
   «Best of 3» اسنوکر سرِ جایش ماند؛ آن‌جا سه فریم یک مسابقه‌ی
   واقعی است.

   ── چرا زمان‌دار از ۶۰ شروع می‌شود ──
   ۳۰ و ۴۵ دقیقه اندازه‌ی یک بازیِ دوستانه است، نه یک دورِ مسابقه. */
export const RACE_TARGETS = [4, 5, 6, 7, 8, 9, 10, 11, 12] as const
export const BO_TARGETS    = [3, 5, 7, 9, 11] as const
export const TIME_MINUTES  = [60, 75, 90, 105, 120, 150, 180] as const

export type FormatKind = 'race' | 'bo' | 'time'

export interface FormatOption {
  value: string
  label: string
  /** برچسبِ لاتین است و باید با فونتِ سیستمی و چپ‌به‌راست بنشیند */
  latin: boolean
}

const raceOpt = (n: number): FormatOption => ({ value: `race${n}`, label: `Race to ${n}`, latin: true })
const boOpt   = (n: number): FormatOption => ({ value: `bo${n}`,   label: `Best of ${n}`, latin: true })
const timeOpt = (m: number): FormatOption => ({
  value: `time${m}`,
  label: `${String(m).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]!)} دقیقه`,
  latin: false,
})

export const RACE_OPTIONS: FormatOption[] = RACE_TARGETS.map(raceOpt)
export const BO_OPTIONS:   FormatOption[] = BO_TARGETS.map(boOpt)
export const TIME_OPTIONS: FormatOption[] = TIME_MINUTES.map(timeOpt)

/** خانواده‌های فرمتی که این نوعِ بازی می‌پذیرد */
export function kindsFor(d: Discipline): FormatKind[] {
  if (d === 'snooker') return ['bo']
  if (d === 'highball') return ['race', 'time']
  return ['race']                     // 8ball / 9ball / 10ball / other
}

/** برچسبِ خانواده‌ی فرمت — در فرمِ هی‌بال دیده می‌شود */
export const KIND_LABELS: Record<FormatKind, string> = {
  race: 'فریمی', bo: 'فریمی', time: 'زمان‌دار',
}

export function optionsForKind(k: FormatKind): FormatOption[] {
  return k === 'bo' ? BO_OPTIONS : k === 'time' ? TIME_OPTIONS : RACE_OPTIONS
}

/** همه‌ی فرمت‌های مجازِ یک نوعِ بازی — برای اعتبارسنجی */
export function optionsFor(d: Discipline): FormatOption[] {
  return kindsFor(d).flatMap(optionsForKind)
}

/** فرمتِ پیش‌فرضِ هر نوعِ بازی — وقتی کاربر نوع را عوض می‌کند */
export function defaultFormat(d: Discipline): string {
  return d === 'snooker' ? 'bo5' : 'race7'
}

export function kindOf(format: string): FormatKind | null {
  if (/^race\d{1,2}$/.test(format)) return 'race'
  if (/^bo(3|5|7|9|11)$/.test(format)) return 'bo'
  if (/^time\d{2,3}$/.test(format)) return 'time'
  return null
}

/* همه‌ی کلیدهای معتبر — سرور با همین می‌سنجد. `bo` برای هر نوعِ بازی
   پذیرفته می‌شود چون ردیف‌های قدیمی (که همه `bo` بودند) نباید موقعِ
   ویرایش رد شوند. */
export const ALL_FORMATS: ReadonlySet<string> = new Set([
  ...RACE_OPTIONS.map(o => o.value),
  ...BO_OPTIONS.map(o => o.value),
  ...TIME_OPTIONS.map(o => o.value),
])

const LABELS: Record<string, FormatOption> = Object.fromEntries(
  [...RACE_OPTIONS, ...BO_OPTIONS, ...TIME_OPTIONS].map(o => [o.value, o]),
)

/** برچسبِ خواندنی — اگر ناشناخته بود، خودِ کلید برمی‌گردد نه رشته‌ی خالی */
export function formatLabel(format: string | null | undefined): string {
  const k = String(format ?? '')
  return LABELS[k]?.label ?? k
}

/** آیا برچسبِ این فرمت لاتین است؟ (برای فونت و جهتِ متن) */
export function formatIsLatin(format: string | null | undefined): boolean {
  return LABELS[String(format ?? '')]?.latin ?? true
}

/* ── پوسترِ پیش‌فرض ────────────────────────────────────────────
   تا امروز مسابقه‌ی بی‌پوستر `/images/clubs/club1.png` می‌گرفت —
   عکسِ یک باشگاهِ نمونه. یعنی همه‌ی مسابقات شبیهِ هم بودند و هیچ‌کدام
   ربطی به بازیِ خودشان نداشت.

   حالا هر نوعِ بازی پوسترِ خودش را دارد (`scripts/build-tournament-posters.mjs`).
   باشگاه‌دار می‌تواند پوسترِ خودش را بگذارد؛ اگر نگذاشت این می‌آید و
   دستِ‌کم بازی از روی کارت پیداست. */
export function posterFor(d: Discipline): string {
  const key = d === 'other' ? 'snooker' : d
  return `/images/tournaments/${key}.svg`
}

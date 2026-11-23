/* ─────────────────────────────────────────────────────────────
   ساعتِ کاریِ باشگاه ⟵ ساعت‌های قابلِ رزرو. منطقِ خالص و مشترکِ سرور و مرورگر،
   بی هیچ import (آزمون: scripts/test-working-hours.mjs).

   ── باگی که این فایل بست (آذرِ ۱۴۰۵) ──
   شبکه‌ی رزرو برای *همه‌ی* باشگاه‌ها ثابتِ ۸ تا ۲۳ بود — هم در
   /api/bookings/slots، هم در جایگزینِ کلاینت — و ثبتِ رزرو هم ساعت کاری را
   نمی‌پرسید. باشگاهی که ۱۰ صبح باز می‌شود ساعتِ ۸ را رزرو می‌گرفت.
   حالا سه جا از همین یک تابع می‌خوانند: فهرستِ ساعت‌ها، صفحه‌ی رزرو، و
   POST /api/bookings (مرجعِ نهایی — درخواستِ دستی هم رد می‌شود).

   ── شکلِ داده (clubs.workingHours) ──
   { saturday: { isOpen: true, open: '10:00', close: '23:45' }, … }
   گامِ ۱۵ دقیقه. close ≤ open یعنی عبور از نیمه‌شب (۱۸:۰۰ تا ۰۲:۰۰)؛
   close = open یعنی ۲۴ ساعته؛ close = '24:00' (انتخابگرِ «تا» از آذرِ ۱۴۰۵) و
   '00:00'ِ قدیمی هر دو یعنی تا نیمه‌شب — خانه‌ی ساعتِ ۲۳ رزروشدنی است.

   ── قاعده‌ی هر خانه ──
   خانه‌ی ساعتِ h یعنی [h:00, h+1:00). فقط وقتی رزروشدنی است که *کاملش* در
   ساعتِ کاری باشد: با «۱۰:۳۰ تا ۲۳:۴۵»، خانه‌ی ۱۰ و ۲۳ رزرو نمی‌شوند — بازیکن
   ساعتِ ۱۰ پشتِ درِ بسته می‌ماند و ساعتِ ۲۳ بعد از بسته‌شدن بازی می‌کرد.
   شیفتِ شبِ دیروز روی ساعت‌های بامدادیِ امروز می‌نشیند (رزرو از نیمه‌شب
   نمی‌گذرد، پس ۰۰:۰۰ تا ۰۲:۰۰ مالِ تاریخِ روزِ بعد است).

   بازه‌های به‌هم‌چسبیده یکی می‌شوند: ادامه‌ی شبِ دیروز تا ۰۳:۳۰ و شروعِ امروز
   از ۰۳:۱۵ یعنی ساعتِ ۳ باز است، هرچند در هیچ‌کدام به‌تنهایی جا نمی‌شود.

   ── دادهِ نامعلوم ──
   باشگاهی که ساعت ثبت نکرده (یا روزِ ناقص دارد) پنجره‌ی ۰۹:۰۰ تا ۲۳:۰۰ را
   می‌گیرد — همان که پنلِ باشگاه‌دار (DEFAULT_HOURS در dashboard/club) و فرمِ
   ساختِ باشگاه برای ساعتِ ثبت‌نشده نشان می‌دهند، تا آنچه باشگاه‌دار می‌بیند
   همان باشد که رزرو می‌شود. «نمی‌دانیم» نباید رزروِ باشگاه را یک‌شبه ببندد.
   روزی که صریحاً «تعطیل» است هیچ ساعتی ندارد (جز ادامه‌ی شیفتِ شبِ دیروز).
   ───────────────────────────────────────────────────────────── */

export const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
export type WeekdayKey = (typeof WEEKDAYS)[number]

/** ۰۹:۰۰ تا ۲۳:۰۰ ⟵ خانه‌های ۹ تا ۲۲ — فقط وقتی ساعتِ آن روز معلوم نیست */
export const FALLBACK_HOURS: readonly number[] = Array.from({ length: 14 }, (_, i) => i + 9)

const DAY_MIN = 24 * 60

function toMinutes(v: unknown): number | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  if (s === '24:00') return DAY_MIN
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(s)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

export type DaySpec =
  | { kind: 'open'; open: number; close: number }
  | { kind: 'closed' }

/** یک روز از ساعتِ کاری؛ null یعنی نامعلوم (نبودِ داده یا شکلِ نادرست) */
export function daySpec(raw: unknown, key: WeekdayKey): DaySpec | null {
  if (!raw || typeof raw !== 'object') return null
  const d = (raw as Record<string, unknown>)[key]
  if (!d || typeof d !== 'object') return null
  const r = d as Record<string, unknown>
  if (r.isOpen === false) return { kind: 'closed' }
  if (r.isOpen !== true) return null
  const open = toMinutes(r.open), close = toMinutes(r.close)
  if (open === null || close === null || open >= DAY_MIN) return null
  return { kind: 'open', open, close }
}

/** روزِ هفته‌ی یک تاریخِ تقویمیِ YYYY-MM-DD — مستقل از منطقه‌ی زمانیِ دستگاه.
 *  تاریخِ ناموجود (۳۰ فوریه) null است، نه روزِ غلتیده‌ی بعدی. */
export function weekdayOf(date: string): WeekdayKey | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const d = new Date(`${date}T12:00:00Z`)
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== date) return null
  return WEEKDAYS[d.getUTCDay()] ?? null
}

type OpenDay = Extract<DaySpec, { kind: 'open' }>
/* شیفتی که از نیمه‌شب می‌گذرد (close ≤ open). close = 0 یعنی «تا نیمه‌شب» و بیرون‌ریزی ندارد. */
const isOvernight = (s: OpenDay) => s.close <= s.open
/* close = open یعنی ۲۴ ساعته */
const isAllDay = (s: OpenDay) => s.close === s.open

/* بازه‌هایی که هم‌پوشانی دارند یا به هم می‌چسبند یکی می‌شوند */
function mergeWindows(ws: [number, number][]): [number, number][] {
  const out: [number, number][] = []
  for (const [a, b] of [...ws].sort((x, y) => x[0] - y[0])) {
    const last = out[out.length - 1]
    if (last && a <= last[1]) last[1] = Math.max(last[1], b)
    else out.push([a, b])
  }
  return out
}

interface DayWindows {
  /** بازه‌های باز [از, تا) به دقیقه روی همان تاریخ، یکی‌شده و صعودی */
  windows: [number, number][]
  /** شیفتِ خودِ امروز (بی ادامه‌ی دیروز)؛ null یعنی امروز تعطیل است */
  own: [number, number] | null
  /** پایانِ ادامه‌ی شیفتِ شبِ دیروز روی امروز (دقیقه)؛ ۰ یعنی ندارد */
  spillUntil: number
  /** امروز ۲۴ ساعته است (close = open) */
  allDay: boolean
  /** false یعنی ساعتِ آن روز معلوم نیست */
  known: boolean
}

function dayWindows(raw: unknown, date: string): DayWindows {
  const none: DayWindows = { windows: [], own: null, spillUntil: 0, allDay: false, known: false }
  const key = weekdayOf(date)
  if (!key) return none
  const today = daySpec(raw, key)
  if (!today) return none

  const prev = daySpec(raw, WEEKDAYS[(WEEKDAYS.indexOf(key) + 6) % 7]!)
  /* ادامه‌ی شیفتِ شبِ دیروز — حتی اگر امروز خودش تعطیل باشد */
  const spillUntil = prev?.kind === 'open' && isOvernight(prev) && prev.close > 0 ? prev.close : 0
  const own: [number, number] | null = today.kind === 'open'
    ? [today.open, isOvernight(today) ? DAY_MIN : today.close]
    : null
  const parts: [number, number][] = []
  if (spillUntil > 0) parts.push([0, spillUntil])
  if (own) parts.push(own)
  return { windows: mergeWindows(parts), own, spillUntil, allDay: today.kind === 'open' && isAllDay(today), known: true }
}

/** بازه‌های باز [از, تا) به دقیقه روی همان تاریخ؛ known=false یعنی ساعتِ آن روز معلوم نیست */
export function openWindows(raw: unknown, date: string): { windows: [number, number][]; known: boolean } {
  const { windows, known } = dayWindows(raw, date)
  return { windows, known }
}

export interface BookableHours {
  /** ساعت‌های شروعِ قابلِ رزرو (۰..۲۳)، صعودی */
  hours: number[]
  /** از این‌ها، ساعت‌هایی که فقط ادامه‌ی شیفتِ شبِ دیروزند (بامدادِ همین تاریخ).
   *  صفحه برچسبِ «شب قبل» می‌زند: ۰ و ۱ِ بالای شبکه پایانِ شیفتِ *امشب* نیست */
  spill: number[]
  /** ساعتِ آن روز از دادهِ باشگاه آمده (نه پنجره‌ی پیش‌فرض) */
  known: boolean
  /** روزِ معلومی که هیچ خانه‌ی رزروشدنی ندارد */
  closedDay: boolean
}

export function bookableHours(raw: unknown, date: string): BookableHours {
  const { windows, own, spillUntil, allDay, known } = dayWindows(raw, date)
  if (!known) return { hours: [...FALLBACK_HOURS], spill: [], known: false, closedDay: false }
  const inside = (w: [number, number], from: number, to: number) => w[0] <= from && to <= w[1]
  const hours: number[] = [], spill: number[] = []
  for (let h = 0; h < 24; h++) {
    const from = h * 60, to = from + 60
    if (!windows.some(w => inside(w, from, to))) continue
    hours.push(h)
    /* باشگاهِ شبانه‌روزی شیفتِ پیوسته دارد — «شب قبل» آن‌جا معنا ندارد */
    if (!allDay && to <= spillUntil && !(own && inside(own, from, to))) spill.push(h)
  }
  return { hours, spill, known: true, closedDay: hours.length === 0 }
}

/** ساعت‌هایی از یک بازه که بیرونِ ساعتِ کاری‌اند (خالی یعنی همه مجاز) */
export function hoursOutsideWorking(raw: unknown, date: string, hours: readonly number[]): number[] {
  const ok = new Set(bookableHours(raw, date).hours)
  return hours.filter(h => !ok.has(h))
}

const pad2 = (n: number) => String(n).padStart(2, '0')
/* دقیقه ⟵ HH:MM؛ ۱۴۴۰ (۲۴:۰۰) همان ۰۰:۰۰ نمایش داده می‌شود */
const hhmm = (min: number) => `${pad2(Math.floor(min / 60) % 24)}:${pad2(min % 60)}`

export interface DayHoursLabel {
  /** خودِ این روز صریحاً تعطیل است (ممکن است ادامه‌ی شبِ دیروز را داشته باشد) */
  closed: boolean
  /** ادامه‌ی شیفتِ شبِ دیروز روی بامدادِ این روز */
  hasSpill: boolean
  /** متنِ نمایش با ارقامِ لاتین — صفحه و سرور به ارقامِ فارسی برمی‌گردانند */
  text: string
}

/** ساعتِ کاریِ همان تاریخ برای نمایش؛ null یعنی نامعلوم.
 *  «بامداد» فقط برای پایانِ تا ۰۶:۰۰ — ۱۴:۰۰ تا ۱۳:۰۰ «روز بعد» است، و
 *  close = open «شبانه‌روزی». */
export function dayHoursLabel(raw: unknown, date: string): DayHoursLabel | null {
  const key = weekdayOf(date)
  const today = key ? daySpec(raw, key) : null
  if (!today) return null
  const { spillUntil } = dayWindows(raw, date)
  const spill = spillUntil > 0 ? `00:00 تا ${hhmm(spillUntil)} ادامه شب قبل` : ''

  if (today.kind === 'closed') {
    return { closed: true, hasSpill: !!spill, text: spill ? `تعطیل، فقط ${spill}` : 'تعطیل' }
  }
  /* شبانه‌روزیِ پیوسته؛ اگر دیروز تعطیل بوده، همین روز از ساعتِ شروع باز می‌شود و
     متنِ عادیِ «… روز بعد» می‌گیرد */
  if (isAllDay(today) && spillUntil >= today.open) return { closed: false, hasSpill: false, text: 'شبانه‌روزی' }
  if (today.open === 0 && today.close === DAY_MIN) return { closed: false, hasSpill: false, text: 'شبانه‌روزی' }
  /* بسته‌شدن در نیمه‌شب — چه «24:00» ذخیره شده باشد چه «00:00»ِ قدیمی — «۲۴:۰۰»
     نمایش داده می‌شود (گزینه‌ی تازه‌ی انتخابگرِ «تا»؛ «00:00»ِ قدیمی در پنل همان
     ۰۰:۰۰ می‌ماند ولی معنایش یکی است) */
  const closeText = today.close === 0 || today.close === DAY_MIN ? '24:00' : hhmm(today.close)
  let own = `${hhmm(today.open)} تا ${closeText}`
  if (isOvernight(today) && today.close > 0) own += today.close <= 6 * 60 ? ' بامداد' : ' روز بعد'
  /* شیفتی که خودش از نیمه‌شبِ امروز شروع می‌شود، ادامه‌ی دیروز را در خود دارد */
  const showSpill = !!spill && spillUntil < today.open
  return { closed: false, hasSpill: showSpill, text: showSpill ? `${spill} و ${own}` : own }
}

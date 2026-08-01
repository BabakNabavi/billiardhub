/* ─────────────────────────────────────────────────────────────
   بستنِ رزرو — منطقِ مشترکِ سرور و مرورگر.

   سه سازوکارِ مستقل وجود دارد و تا امروز هرکدام جای دیگری زندگی
   می‌کرد؛ نتیجه‌اش رفتارِ متناقض بود:

     ۱) بستنِ امروز       (clubs.closeTodayReservations)
        فقط روزِ جاری. روزهای آینده باز.

     ۲) بستنِ موقت        (clubs.reserveClosedUntil)
        از همین لحظه تا یک زمانِ مشخص — که ممکن است وسطِ امروز
        تمام شود. پس یک قفلِ *ساعتی* است، نه روزانه.

     ۳) بستنِ یک میز      (tables.reservationClosed)
        فقط همان میز؛ بقیه‌ی میزها باز.

   نکته‌ی کلیدی که پیش‌تر رعایت نمی‌شد: هیچ‌کدام از این‌ها نباید
   «صفحه‌ی رزرو» را ببندد. باید فقط همان روز یا همان ساعت‌ها یا همان
   میز بسته شود. کاربر باید بتواند تاریخِ دیگری انتخاب کند.
   ───────────────────────────────────────────────────────────── */

/** «امروز» به وقتِ تهران — با UTC، از ۲۰:۳۰ به بعد فردا حساب می‌شد */
export function todayInTehran(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)
}

/** ساعتِ جاری به وقتِ تهران (۰..۲۳) */
export function hourInTehran(now: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tehran', hour: '2-digit', hour12: false,
  }).format(now))
}

export interface ClosureInput {
  /** clubs.closeTodayReservations */
  closeToday?: boolean | null
  /** clubs.reserveClosedUntil — ISO یا 'infinity' یا خالی */
  closedUntil?: string | null
  now?: Date
}

export interface ClosureState {
  /** همیشه بسته — تنها حالتی که کلِ رزرو معنا ندارد */
  always: boolean
  /** لحظه‌ی پایانِ بستنِ موقت (میلی‌ثانیه)، اگر فعال باشد */
  untilMs: number | null
  closeToday: boolean
}

const isAlways = (v: string) => v === 'infinity' || v === 'always'

export function closureState({ closeToday, closedUntil, now = new Date() }: ClosureInput): ClosureState {
  const raw = String(closedUntil ?? '').trim()
  if (!raw) return { always: false, untilMs: null, closeToday: !!closeToday }
  if (isAlways(raw)) return { always: true, untilMs: null, closeToday: !!closeToday }

  /* هم ISO (از دیتابیس) و هم میلی‌ثانیه‌ی عددی (از localStorageی قدیمی)
     پذیرفته می‌شود تا داده‌ی موجود بی‌صدا نادیده گرفته نشود. */
  const ms = /^\d+$/.test(raw) ? Number(raw) : Date.parse(raw)
  if (!Number.isFinite(ms) || ms <= now.getTime()) {
    return { always: false, untilMs: null, closeToday: !!closeToday }
  }
  return { always: false, untilMs: ms, closeToday: !!closeToday }
}

/** آیا کلِ این تاریخ بسته است؟ (نه کلِ رزرو) */
export function isDateClosed(date: string, s: ClosureState, now: Date = new Date()): boolean {
  if (s.always) return true
  if (s.closeToday && date === todayInTehran(now)) return true

  /* بستنِ موقت فقط وقتی کلِ یک روز را می‌بندد که تا پایانِ آن روز ادامه
     داشته باشد؛ وگرنه فقط چند ساعتِ اولش بسته است و بقیه‌ی روز باز
     می‌ماند — این‌جا بود که پیش‌تر کلِ صفحه بسته می‌شد. */
  if (s.untilMs !== null) {
    const endOfDate = Date.parse(`${date}T23:59:59+03:30`)
    if (Number.isFinite(endOfDate) && s.untilMs >= endOfDate) return true
  }
  return false
}

/**
 * ساعت‌هایی از یک تاریخ که به‌خاطر بستنِ موقت قابلِ رزرو نیستند.
 * برای نمایشِ قرمزِ همان ساعت‌ها در شبکه‌ی رزرو.
 */
export function closedHours(date: string, s: ClosureState, now: Date = new Date()): number[] {
  if (s.always) return Array.from({ length: 24 }, (_, i) => i)
  if (s.closeToday && date === todayInTehran(now)) return Array.from({ length: 24 }, (_, i) => i)
  if (s.untilMs === null) return []

  const out: number[] = []
  for (let h = 0; h < 24; h++) {
    /* یک ساعت وقتی بسته است که *شروعش* پیش از پایانِ قفل باشد:
       اگر قفل تا ۱۴:۳۰ است، ساعتِ ۱۴ هم هنوز بسته است چون بخشی از
       آن درونِ بازه‌ی قفل می‌افتد. */
    const slotStart = Date.parse(`${date}T${String(h).padStart(2, '0')}:00:00+03:30`)
    if (Number.isFinite(slotStart) && slotStart < s.untilMs) out.push(h)
  }
  return out
}

/** متنِ خوانا برای نشان‌دادن وضعیت */
export function closureLabel(s: ClosureState): string {
  if (s.always) return 'رزرو آنلاین همیشه بسته است'
  if (s.untilMs !== null) {
    const until = new Date(s.untilMs).toLocaleString('fa-IR', {
      timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit',
    })
    return s.closeToday
      ? `رزرو تا ${until} بسته است — و امروز همیشه بسته می‌ماند`
      : `رزرو تا ${until} بسته است`
  }
  if (s.closeToday) return 'رزرو امروز بسته است — روزهای آینده باز'
  return 'رزرو آنلاین باز است'
}

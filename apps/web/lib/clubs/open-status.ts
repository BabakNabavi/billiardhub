/* ─────────────────────────────────────────────────────────────
   وضعیتِ باز/بسته‌ی باشگاه از ساعتِ کاریِ ثبت‌شده، همیشه به وقتِ تهران.

   ⚠️ تفسیرِ ساعتِ کاری یک منبع دارد: lib/booking/working-hours (همان که شبکه‌ی رزرو
   و برچسبِ ساعتِ روز می‌خوانند). نسخه‌ی اول پارسرِ خودش را داشت و از همان روز اول
   جدا افتاد (فاصله‌ی دورِ ساعت، «00:00»ِ قدیمی) — بازبینی، آذرِ ۱۴۰۵. این‌جا فقط
   «الان کجای کدام بازه‌ایم» حساب می‌شود.

   ساعتِ بسته‌شدن پایانِ *بازه‌ی واقعی* است، نه ستونِ close همان روز: شیفتِ شبانه
   از نیمه‌شب می‌گذرد، و باشگاهِ پیوسته (۲۴ ساعته) «تا ۰۰:۰۰» نیست بلکه شبانه‌روزی.
   ───────────────────────────────────────────────────────────── */

import { openWindows, weekdayOf } from '@/lib/booking/working-hours'

export interface ClubOpenStatus {
  /** null یعنی ساعتِ امروز معلوم نیست — نشانی نمایش داده نمی‌شود، نه «باز» نه «بسته» */
  isOpen: boolean | null
  /** «HH:MM» با ارقامِ لاتین؛ نیمه‌شب «24:00». null وقتی بسته یا شبانه‌روزی است */
  closeTime: string | null
  /** باز و بی‌وقفه تا پایانِ فردا — «شبانه‌روزی» */
  allDay: boolean
  todayKey: string
}

const DAY_MIN = 24 * 60
const pad2 = (n: number) => String(n).padStart(2, '0')

/* ⚠️ تنبل: ساختنِ Intl با منطقه‌ی زمانی روی CPUِ ضعیف هزینه دارد و اولین استفاده پس از
   hydration است (هوک روی سرور چیزی حساب نمی‌کند) */
let tehranFmt: Intl.DateTimeFormat | null = null
function tehranParts(now: Date): { date: string; minute: number } {
  tehranFmt ??= new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  })
  const p = Object.fromEntries(tehranFmt.formatToParts(now).map(x => [x.type, x.value]))
  /* بعضی موتورها نیمه‌شب را «24» می‌دهند */
  const minute = (Number(p.hour) * 60 + Number(p.minute)) % DAY_MIN
  return { date: `${p.year}-${p.month}-${p.day}`, minute }
}

function nextDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export function clubOpenStatus(hours: unknown, now: Date): ClubOpenStatus {
  const { date, minute } = tehranParts(now)
  const todayKey = weekdayOf(date) ?? ''
  const today = openWindows(hours, date)
  if (!today.known) return { isOpen: null, closeTime: null, allDay: false, todayKey }

  const w = today.windows.find(([a, b]) => a <= minute && minute < b)
  if (!w) return { isOpen: false, closeTime: null, allDay: false, todayKey }

  let end = w[1]
  /* بازه تا نیمه‌شب است: اگر فردا از ۰۰:۰۰ ادامه دارد، پایان همان‌جاست */
  if (end === DAY_MIN) {
    const tomorrow = openWindows(hours, nextDate(date))
    const cont = tomorrow.known ? tomorrow.windows.find(([a]) => a === 0) : undefined
    if (cont) {
      if (cont[1] === DAY_MIN) return { isOpen: true, closeTime: null, allDay: true, todayKey }
      end = DAY_MIN + cont[1]
    }
  }
  const closeTime = end === DAY_MIN ? '24:00' : `${pad2(Math.floor(end / 60) % 24)}:${pad2(end % 60)}`
  return { isOpen: true, closeTime, allDay: false, todayKey }
}

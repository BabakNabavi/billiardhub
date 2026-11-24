/** وضعیت عمومی باشگاه از ساعات ثبت‌شده، همیشه به وقت تهران */
export interface ClubOpenStatus {
  isOpen: boolean | null
  closeTime: string | null
  todayKey: string
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const tehranClock = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Tehran', weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

function minutes(value: unknown): number | null {
  if (typeof value !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$|^24:00$/.test(value)) return null
  const [hour = 0, minute = 0] = value.split(':').map(Number)
  return hour * 60 + minute
}

function dayHours(hours: unknown, key: string) {
  if (!hours || typeof hours !== 'object') return null
  const day: unknown = (hours as Record<string, unknown>)[key]
  if (!day || typeof day !== 'object') return null
  const row = day as Record<string, unknown>
  if (row.isOpen === false) return { enabled: false, open: 0, close: 0, closeTime: '' }
  const open = minutes(row.open), close = minutes(row.close)
  if (row.isOpen !== true || open === null || open === 1440 || close === null) return null
  return { enabled: true, open, close, closeTime: row.close as string }
}

export function clubOpenStatus(hours: unknown, now: Date): ClubOpenStatus {
  const parts = tehranClock.formatToParts(now)
  const todayKey = (parts.find(p => p.type === 'weekday')?.value ?? '').toLowerCase()
  const minute = Number(parts.find(p => p.type === 'hour')?.value) * 60
    + Number(parts.find(p => p.type === 'minute')?.value)
  const today = dayHours(hours, todayKey)
  const yesterday = dayHours(hours, WEEKDAYS[(WEEKDAYS.indexOf(todayKey) + 6) % 7]!)
  // ادامه شیفت شب گذشته، حتی اگر روز جدید برای شروع شیفت تعطیل باشد
  if (yesterday?.enabled && yesterday.close <= yesterday.open && minute < yesterday.close) {
    return { isOpen: true, closeTime: yesterday.closeTime, todayKey }
  }
  if (!today) return { isOpen: null, closeTime: null, todayKey }
  const isOpen = today.enabled && minute >= today.open
    && (today.close <= today.open || minute < today.close)
  return { isOpen, closeTime: isOpen ? today.closeTime : null, todayKey }
}

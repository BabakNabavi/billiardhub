import { faNum } from '../jalali'

/* «۳ روز پیش» — زمانِ نسبیِ کارت‌ها، مثلِ یوتیوب. تاریخِ کامل در صفحه‌ی ویدیو می‌ماند. */
export function timeAgo(ts: number, now = Date.now()): string {
  if (!ts) return ''
  const s = Math.max(0, Math.floor((now - ts) / 1000))
  if (s < 60) return 'همین حالا'
  const m = Math.floor(s / 60)
  if (m < 60) return `${faNum(m)} دقیقه پیش`
  const h = Math.floor(m / 60)
  if (h < 24) return `${faNum(h)} ساعت پیش`
  const d = Math.floor(h / 24)
  if (d < 7) return `${faNum(d)} روز پیش`
  if (d < 30) return `${faNum(Math.floor(d / 7))} هفته پیش`
  if (d < 365) return `${faNum(Math.floor(d / 30))} ماه پیش`
  return `${faNum(Math.floor(d / 365))} سال پیش`
}

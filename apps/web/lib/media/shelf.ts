/* ─────────────────────────────────────────────────────────────
   قاعده‌های چیدمان بیلیارد مدیا.

   ⚠️ هیچ‌کدام از این‌ها داده نمی‌سازند. هر تابع فقط ویدیوهای واقعی
   دیتابیس را دسته می‌کند. جایی که پشتوانه‌ی داده نیست (اشتراک،
   لایک، پخش زنده، لیست پخش) اصلا تابعی ندارد — چون اگر تابع
   داشت، دیر یا زود کسی با عدد ساختگی پرش می‌کرد.
   ───────────────────────────────────────────────────────────── */

import type { MediaVideo } from '../media-data'

/* ── Shorts ──
   ⚠️ جدول `videos` پرچم «short» ندارد و ستون خیالی هم ساخته نشد.
   ولی `width` و `height` واقعی فایل را دارد؛ ویدیوی عمودی خودش
   Short است. این استنتاج است، نه جعل.

   ⚠️ فقط عمودی کافی نیست: یک مسابقه‌ی چهل‌دقیقه‌ای که اتفاقا عمودی
   فیلم‌برداری شده Short نیست. سقف سه دقیقه همان مرزی است که
   پلتفرم‌های ویدیو گذاشته‌اند.
   ردیفی که ابعادش ثبت نشده (NULL) Short حساب نمی‌شود — «نمی‌دانم»
   نباید به «بله» ترجمه شود. */
export const SHORT_MAX_SEC = 180

export function isShort(v: MediaVideo): boolean {
  const w = v.width, h = v.height
  if (!w || !h || h <= w) return false
  if (v.durationSec != null && v.durationSec > SHORT_MAX_SEC) return false
  return true
}

export const splitShorts = (items: MediaVideo[]) => ({
  shorts: items.filter(isShort),
  videos: items.filter(v => !isShort(v)),
})

/* ── کانال‌ها از روی ویدیوها ──
   ⚠️ جدول کانال ندارد؛ فهرست کانال‌ها در یک فایل JSON است و همه‌ی
   کانال‌ها ویدیو ندارند. برای قفسه‌ی «کانال‌ها» در صفحه‌ی اول، همان
   سازنده‌هایی که *واقعا* ویدیوی منتشرشده دارند از خود ویدیوها
   استخراج می‌شوند — پس هیچ کانال خالی یا ساختگی نشان داده نمی‌شود.

   ⚠️ «تعداد دنبال‌کننده» عمدا این‌جا نیست. جدولی برایش وجود ندارد و
   شمارش ویدیو را نمی‌شود به‌جایش قالب کرد. */
export interface ShelfChannel {
  handle: string
  name: string
  videoCount: number
  views: number
  /** بندانگشتی تازه‌ترین ویدیو — تنها تصویری که واقعا داریم */
  poster: string
}

/** فقط همین فیلدها خوانده می‌شوند — رندرِ سرورِ /media/channels بی‌نگاشتِ کاملِ
 *  publicToMedia (که در ماژولِ کلاینتی است) صدایش می‌زند */
export type ChannelSource = Pick<MediaVideo, 'views' | 'thumb'> & { creator: Pick<MediaVideo['creator'], 'handle' | 'name'> }

export function channelsFrom(items: ChannelSource[]): ShelfChannel[] {
  const map = new Map<string, ShelfChannel>()
  for (const v of items) {
    const h = v.creator.handle
    if (!h) continue
    const c = map.get(h)
    if (c) {
      c.videoCount += 1
      c.views += v.views
      if (!c.poster && v.thumb) c.poster = v.thumb
    } else {
      map.set(h, { handle: h, name: v.creator.name || h, videoCount: 1, views: v.views, poster: v.thumb })
    }
  }
  return [...map.values()].sort((a, b) => b.videoCount - a.videoCount)
}

/* «بعدی برای تماشا» به lib/media/recommend (rankUpNext) رفت — همان ربط + سلیقه‌ی بیننده */

/** «۱۲ هزار بازدید» — و برای صفر، هیچ. */
export const viewsLabel = (n: number, fa: (v: number) => string) =>
  n > 0 ? `${fa(n)} بازدید` : ''

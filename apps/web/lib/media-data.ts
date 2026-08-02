/* ─────────────────────────────────────────────────────────────
   بیلیارد مدیا — منبع واحد ویدیوها (جایگزین بخش «آموزش»).
   ساختار آینده‌پذیر: creator جدا از ویدیو تعریف شده تا بعداً به
   Channel/Playlist/Follow واقعی گسترش یابد.
   ───────────────────────────────────────────────────────────── */

export const MEDIA_CATEGORIES = [
  { key: 'snooker-training',  label: 'آموزش اسنوکر',         dot: '#14532D' },
  { key: 'pool-training',     label: 'آموزش پاکت بیلیارد',   dot: '#7C3AED' },
  { key: 'highball-training', label: 'آموزش هی‌بال',          dot: '#0D9488' },
  { key: 'techniques',        label: 'تکنیک‌ها و ترفندها',    dot: '#C7A66A' },
  { key: 'trick-shots',       label: 'ضربات نمایشی',          dot: '#DB2777' },
  { key: 'entertainment',     label: 'سرگرمی',                dot: '#F59E0B' },
  { key: 'referee-rules',     label: 'آموزش قوانین داوری',    dot: '#0891B2' },
  { key: 'highlights',        label: 'مسابقات و هایلایت',     dot: '#B23B2E' },
  { key: 'backstage',         label: 'پشت صحنه',              dot: '#64748B' },
  { key: 'interviews',        label: 'مصاحبه با بازیکنان',    dot: '#1D4ED8' },
  { key: 'gear',              label: 'معرفی تجهیزات',         dot: '#A07840' },
  { key: 'technical-services',label: 'خدمات فنی',             dot: '#7C2D12' },
  { key: 'clubs-events',      label: 'باشگاه‌ها و رویدادها',  dot: '#0E7A38' },
  { key: 'other',             label: 'سایر',                  dot: '#8A8474' },
] as const

export type MediaCategoryKey = typeof MEDIA_CATEGORIES[number]['key']

export interface MediaCreator {
  id: string
  name: string
  handle: string          // برای صفحه‌ی کانال در آینده
}

export interface MediaVideo {
  id: string
  title: string
  category: MediaCategoryKey
  creator: MediaCreator
  /** mm:ss با ارقام فارسی */
  duration: string
  views: number
  likes: number
  date: string
  /** برای مرتب‌سازی «جدیدترین» (بزرگ‌تر = تازه‌تر) */
  ts: number
  thumb: string
  /** فایل ویدیو — فعلاً دموی مشترک؛ ساختار per-video است */
  src: string
  description: string[]
  tags: string[]
  featured?: boolean
}

const CREATORS: Record<string, MediaCreator> = {
  hub:     { id: 'hub',     name: 'بیلیارد هاب',        handle: 'billiardhub' },
  academy: { id: 'academy', name: 'آکادمی بیلیارد هاب', handle: 'bh.academy' },
  masters: { id: 'masters', name: 'مسترز مدیا',          handle: 'masters.media' },
  gearlab: { id: 'gearlab', name: 'گیرلب',               handle: 'gearlab' },
  proplay: { id: 'proplay', name: 'پروپلی',              handle: 'proplay' },
}


/* ── فهرستِ محتوای دستی — عمداً خالی ─────────────────────────────
   تا امروز این‌جا ۱۶ ویدیوی ساختگی بود: عنوان‌های واقع‌نمای فارسی
   («گفت‌وگوی اختصاصی با قهرمان جهان»)، کانال‌ها، تعدادِ بازدید و
   لایکِ ساختگی — و هر ۱۶ تا به یک فایلِ نمونه اشاره می‌کردند.

   این‌ها روی سایتِ عمومی به‌عنوانِ محتوای واقعی نمایش داده می‌شدند.
   ساختنِ رویداد و نقلِ‌قولِ جعلی از قهرمانِ واقعی، حتی به‌عنوانِ
   محتوای نمایشی، چیزی نیست که بشود با آن منتشر شد.

   ساختارِ صفحه دست‌نخورده مانده: `/media` حالا فقط ویدیوهای واقعیِ
   آپلودشده‌ی کاربران را نشان می‌دهد (از `/api/media`). اگر روزی
   محتوای تحریریه‌ای واقعی داشتی، همین‌جا اضافه‌اش کن و بدونِ هیچ
   تغییرِ دیگری در سایت ظاهر می‌شود. نسخه‌ی قدیمی در تاریخچه‌ی گیت
   هست. */
export const MEDIA_VIDEOS: MediaVideo[] = []

export function getVideo(id: string): MediaVideo | null {
  return MEDIA_VIDEOS.find(v => v.id === id) ?? null
}

/* ── کانال‌ها — مثل یوتیوب: هر سازنده یک کانال ──────────────── */
export const CHANNEL_TAGLINES: Record<string, string> = {
  hub:     'رسانه‌ی رسمی بیلیارد هاب — رویدادها و گزارش‌های اختصاصی',
  academy: 'آموزش حرفه‌ای اسنوکر و پاکت بیلیارد، از مبتدی تا مسابقه',
  masters: 'پوشش کامل مسابقات؛ هایلایت، پشت صحنه و تحلیل',
  gearlab: 'تست و بررسی تخصصی تجهیزات بیلیارد',
  proplay: 'تکنیک، الگوخوانی و هنر بازی',
}

export interface MediaChannel {
  creator: MediaCreator
  tagline: string
  videoCount: number
  totalViews: number
}

/* کانال‌ها را از هر لیست ویدیو بساز (برای ادغام ویدیوهای کاربران) */
export function channelsFrom(videos: MediaVideo[]): MediaChannel[] {
  const map = new Map<string, MediaChannel>()
  for (const v of videos) {
    const c = map.get(v.creator.id)
    if (c) { c.videoCount++; c.totalViews += v.views }
    else map.set(v.creator.id, { creator: v.creator, tagline: CHANNEL_TAGLINES[v.creator.id] ?? '', videoCount: 1, totalViews: v.views })
  }
  return [...map.values()].sort((a, b) => b.totalViews - a.totalViews)
}
export function listChannels(): MediaChannel[] { return channelsFrom(MEDIA_VIDEOS) }

export function getChannel(handle: string): MediaChannel | null {
  return listChannels().find(c => c.creator.handle === handle) ?? null
}

export function channelVideos(handle: string): MediaVideo[] {
  return MEDIA_VIDEOS.filter(v => v.creator.handle === handle).sort((a, b) => b.ts - a.ts)
}

export function relatedVideos(v: MediaVideo, count = 6): MediaVideo[] {
  const same = MEDIA_VIDEOS.filter(x => x.id !== v.id && x.category === v.category)
  const rest = MEDIA_VIDEOS.filter(x => x.id !== v.id && x.category !== v.category)
  return [...same, ...rest].slice(0, count)
}

export function mediaCategoryOf(key: MediaCategoryKey) {
  return MEDIA_CATEGORIES.find(c => c.key === key)!
}

export const faNum = (n: number) => n.toLocaleString('fa-IR')
export const faDigits = (v: string | number) =>
  String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)

/* «۴۸٬۲۰۰» ⇒ «۴۸ هزار» برای شمارنده‌ی بازدید به سبک پلتفرم‌های ویدیویی */
export function compactViews(n: number): string {
  if (n >= 1_000_000) return `${faNum(Math.round(n / 100_000) / 10)} میلیون`
  if (n >= 1_000) return `${faNum(Math.round(n / 100) / 10)} هزار`
  return faNum(n)
}

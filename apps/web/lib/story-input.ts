import { SUPABASE_URL_RAW } from './supabase-url'

/* ورودیِ استوری — یک‌جا، برای هر دو مسیرِ باشگاه و فروشگاه.
 *
 * ⚠️ چرا این فایل هست: تا پیش از این، بدنه‌ی درخواست *همان‌طور که آمده
 * بود* داخل ایندکس نوشته می‌شد. یعنی `expiresAt` را کلاینت تعیین می‌کرد
 * و کلِ انقضای ۲۴ ساعته روی حرفِ مرورگر بند بود: یک گوشیِ با ساعتِ جلو،
 * یا یک POST دستی با `expiresAt: '2099-01-01'`، استوریِ همیشگی می‌ساخت.
 * دقیقاً همان چیزی که کاربر دید — «استوریِ فروشگاه چند روز است نرفته».
 *
 * حالا شناسه و تاریخ‌ها **فقط** روی سرور ساخته می‌شوند و هرچه کلاینت
 * درباره‌شان بگوید دور ریخته می‌شود.
 */

export const STORY_TTL_MS = 24 * 60 * 60 * 1000

export interface StoryRecord {
  /* امضای اندیس تا رکورد همان‌جا که `StoredStory` می‌خواهند جا شود
     (`lib/story-index`) — بدونش TypeScript این دو را بیگانه می‌بیند. */
  [k: string]: unknown
  id: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  text: string
  textColor: string
  textSize: number
  createdAt: string
  expiresAt: string
  /* چیدمانِ متن — فقط استوریِ باشگاه دارد. اگر این‌ها را دور بریزیم،
     ویرایشگرِ استوریِ باشگاه بی‌صدا از کار می‌افتد. */
  textBold?: boolean
  textAlign?: 'right' | 'center' | 'left'
  textPos?: 'top' | 'center' | 'bottom'
}

const str = (v: unknown, max: number) =>
  typeof v === 'string' ? v.slice(0, max) : ''

/* رسانه‌ی استوری برای *همه‌ی* بازدیدکننده‌ها در نوارِ صفحه‌ی اول رندر
   می‌شود، پس نشانی‌اش باید مالِ خودمان باشد:
   · مسیرِ هم‌ریشه (`/…`) — ولی نه `//host` که پروتکل‌نسبی است و به
     میزبانِ دیگری می‌رود،
   · یا همان میزبانی که فایل‌ها را روی آن آپلود می‌کنیم.
   وگرنه صاحبِ فروشگاه می‌تواند بعد از انتشار عکس را عوض کند یا یک
   پیکسلِ ردیاب بگذارد، و `purge` هم هرگز نمی‌تواند پاکش کند. */
/* نشانی از همان تک‌خواننده‌ی پروژه می‌آید (`lib/supabase-url`)، نه
   `process.env` — قاعده‌ای که خودِ آن فایل توضیحش داده. */
const mediaHosts = (): string[] => {
  const out: string[] = []
  for (const v of [SUPABASE_URL_RAW]) {
    if (!v) continue
    try { out.push(new URL(v).host) } catch { /* مقدارِ نامعتبر نادیده */ }
  }
  return out
}

const safeUrl = (v: unknown): string => {
  const s = str(v, 2048).trim()
  if (!s) return ''
  if (s.startsWith('//')) return ''
  if (s.startsWith('/')) return s
  try {
    const u = new URL(s)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return ''
    const hosts = mediaHosts()
    if (hosts.includes(u.host)) return s
    /* اگر متغیرِ محیطی در بیلد نبوده، انتشارِ استوری نباید بشکند —
       ولی فقط مسیرِ استانداردِ فضای ذخیره‌سازی پذیرفته می‌شود، نه هر
       نشانیِ دلخواه. */
    if (!hosts.length && u.pathname.includes('/storage/v1/object/public/')) return s
    return ''
  } catch {
    return ''
  }
}

const hex = (v: unknown) => {
  const s = str(v, 9).trim()
  return /^#[0-9a-fA-F]{3,8}$/.test(s) ? s : '#FFFFFF'
}

/** بدنه‌ی خام را به یک رکوردِ معتبر تبدیل می‌کند، یا `null` اگر رسانه ندارد. */
export function normalizeStory(raw: unknown, now = Date.now()): StoryRecord | null {
  const b = (raw ?? {}) as Record<string, unknown>
  const mediaUrl = safeUrl(b.mediaUrl)
  if (!mediaUrl) return null

  const size = Number(b.textSize)
  const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(v as T) ? (v as T) : fallback

  return {
    /* شناسه هم از سرور — وگرنه کلاینت می‌تواند استوریِ دیگری را بازنویسی کند */
    id: `s_${now}_${crypto.randomUUID().slice(0, 8)}`,
    mediaUrl,
    mediaType: b.mediaType === 'video' ? 'video' : 'image',
    text: str(b.text, 600),
    textColor: hex(b.textColor),
    textSize: Number.isFinite(size) ? Math.min(72, Math.max(10, size)) : 20,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + STORY_TTL_MS).toISOString(),
    textBold: b.textBold === true,
    textAlign: oneOf(b.textAlign, ['right', 'center', 'left'] as const, 'center'),
    textPos: oneOf(b.textPos, ['top', 'center', 'bottom'] as const, 'bottom'),
  }
}

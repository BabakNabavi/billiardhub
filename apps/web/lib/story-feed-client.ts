/* نوعِ فیدِ استوری و خواندنش در مرورگر — بدونِ وابستگیِ سرور، تا هم
   lib/story-feed (سرور) و هم components/Stories (کلاینت) از آن بخوانند. */

export const STORY_FEED_ID = 'bh-story-feed'

export interface FeedStory {
  id: string
  text?: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  expiresAt: string
}

export interface FeedGroup {
  kind: 'club' | 'shop'
  /** شناسه‌ی باشگاه، یا نامکِ فروشگاه */
  id: string
  /** گیرنده‌ی دایرکتِ پاسخ — مالکِ فروشگاه */
  ownerKey?: string
  name: string
  logo?: string
  stories: FeedStory[]
}

/* صفحه‌ی اصلی ISR است (تا ۶۰ ثانیه کهنه)، پس استوریِ تازه‌منقضی‌شده
   این‌جا کنار می‌رود — وگرنه بیننده به فایلی پاک‌شده می‌رسید. */
const fresh = (groups: FeedGroup[]): FeedGroup[] => {
  const now = Date.now()
  return groups
    .map(g => ({ ...g, stories: g.stories.filter(s => new Date(s.expiresAt).getTime() > now) }))
    .filter(g => g.stories.length > 0)
}

/** فیدِ جاسازی‌شده در HTMLِ صفحه‌ی اصلی؛ نبودنش یعنی null (نه آرایه‌ی خالی) */
export function readEmbeddedFeed(): FeedGroup[] | null {
  if (typeof document === 'undefined') return null
  const el = document.getElementById(STORY_FEED_ID)
  if (!el?.textContent) return null
  try {
    const parsed: unknown = JSON.parse(el.textContent)
    return Array.isArray(parsed) ? fresh(parsed as FeedGroup[]) : null
  } catch {
    return null
  }
}

/** یک درخواست به‌جای آبشارِ قبلی */
export async function fetchStoryFeed(): Promise<FeedGroup[]> {
  const r = await fetch('/api/stories/feed')
  if (!r.ok) return []
  const parsed: unknown = await r.json()
  return Array.isArray(parsed) ? fresh(parsed as FeedGroup[]) : []
}

/* ── استوری‌های اجتماعی (کاربران و حسابِ رسمی) ──
   همان پاسخِ /api/social/stories، جاسازی‌شده در HTMLِ صفحه‌ی اصلی؛ نوار
   برای نمایشِ اول دیگر منتظرِ آن درخواست نمی‌ماند (تازه‌سازیِ ۲۵ ثانیه‌ای
   همچنان از همان مسیر است). */
export const SOCIAL_FEED_ID = 'bh-social-stories'

export function readEmbeddedSocial<T>(): T[] | null {
  if (typeof document === 'undefined') return null
  const el = document.getElementById(SOCIAL_FEED_ID)
  if (!el?.textContent) return null
  try {
    const parsed: unknown = JSON.parse(el.textContent)
    if (!Array.isArray(parsed)) return null
    /* HTMLِ ISR می‌تواند کهنه باشد؛ استوریِ بیش از ۲۴ ساعت (فایلش شاید پاک شده) کنار می‌رود */
    const now = Date.now()
    return (parsed as T[]).filter(x => {
      const at = Number((x as { createdAt?: unknown }).createdAt)
      return !Number.isFinite(at) || now - at < 24 * 60 * 60 * 1000
    })
  } catch {
    return null
  }
}

/* ─────────────────────────────────────────────────────────────
   Shared stories store (client-side prototype — localStorage).
   ANY logged-in entity (coach, referee, club, shop, manufacturer,
   technician, player) can post a story; it auto-appears in the
   home-page stories bar. Stories live for 24h.
   ───────────────────────────────────────────────────────────── */

export interface StoredStory {
  id: string
  ownerKey: string        // stable owner identifier (phone/id)
  userName: string
  roleKey: string         // coach | referee | club_owner | seller | manufacturer | technician | player
  roleLabel: string
  roleColor: string
  avatar: string          // single-letter fallback
  logoUrl?: string        // data URL (optional avatar/logo)
  mediaUrl: string        // data URL of the story image
  caption: string
  createdAt: number       // epoch ms
}

const KEY = 'bh_stories'
const DAY = 24 * 60 * 60 * 1000

/* role → Persian label + color for the story badge/ring */
export const STORY_ROLES: Record<string, { label: string; color: string }> = {
  /* ── حسابِ رسمیِ پلتفرم ──
     تا امروز `admin` این‌جا نبود و در `ROLE_PRIORITY` هم نمی‌آمد، پس
     استوریِ ادمین به نقشِ بعدی‌اش می‌افتاد و با برچسبِ اشتباه (مثلاً
     «مربی») نشان داده می‌شد.

     رنگِ سبز عمدی است: در نوارِ استوری، حلقه‌ی دورِ عکس از همین رنگ
     می‌آید. حسابِ رسمی باید در یک نگاه از بقیه جدا باشد — همان
     کاری که «دوستانِ نزدیک»ِ اینستاگرام با سبز می‌کند. */
  admin:        { label: 'بیلیارد هاب', color: '#0E7A38' },
  coach:        { label: 'مربی',        color: '#a78bfa' },
  referee:      { label: 'داور',        color: '#0891b2' },
  club_owner:   { label: 'باشگاه',      color: '#C7A66A' },
  seller:       { label: 'فروشگاه',     color: '#f59e0b' },
  manufacturer: { label: 'تولیدکننده',  color: '#10b981' },
  technician:   { label: 'خدمات فنی',   color: '#6366f1' },
  player:       { label: 'بازیکن',      color: '#06b6d4' },
}

/* نامی که حسابِ رسمی روی استوری نشان می‌دهد.
   نامِ واقعیِ شخص در پنل و مدارک دست‌نخورده می‌ماند؛ این فقط
   چهره‌ی عمومیِ پلتفرم است. سرور و کلاینت هر دو از همین یک جا
   می‌خوانند تا دو طرف با هم اختلاف پیدا نکنند. */
export const OFFICIAL_DISPLAY_NAME = 'Billiard Hub'

/* Order of preference when a user holds several roles. */
/* `admin` اولِ فهرست است: حسابِ رسمی معمولاً نقش‌های دیگری هم دارد
   (باشگاه‌دار، مربی…) و بدونِ این، استوریِ رسمی با برچسبِ آن نقش‌ها
   بیرون می‌آمد. */
const ROLE_PRIORITY = ['admin', 'coach', 'referee', 'club_owner', 'seller', 'manufacturer', 'technician', 'player']

export function pickStoryRole(roles: string[]): { key: string; label: string; color: string } {
  const key = ROLE_PRIORITY.find(r => roles.includes(r)) ?? 'player'
  const meta = STORY_ROLES[key] ?? STORY_ROLES.player!
  return { key, label: meta.label, color: meta.color }
}

/* ── سقف روزانه‌ی استوری بر اساس نقش ──
   کاربر عادی (نقش user یا بدون نقش واجد شرایط) اصلاً نمی‌تواند استوری بگذارد. */
export const STORY_DAILY_LIMIT: Record<string, number> = {
  /* حسابِ رسمی سقف ندارد؛ اعلان‌های پلتفرم نباید به سهمیه بخورند */
  admin: 99,
  player: 2,        // بازیکن رنکینگی
  coach: 2,
  referee: 1,
  technician: 2,
  seller: 4,
  manufacturer: 2,
  club_owner: 3,
}

/* بالاترین نقش واجد استوری که کاربر دارد؛ null یعنی کاربر عادی. */
export function storyRoleOf(roles: string[]): string | null {
  return ROLE_PRIORITY.find(r => roles.includes(r) && r in STORY_DAILY_LIMIT) ?? null
}

/* سقف روزانه‌ی استوری برای این کاربر (۰ = مجاز نیست). */
export function storyLimitFor(roles: string[]): number {
  const r = storyRoleOf(roles)
  return r ? (STORY_DAILY_LIMIT[r] ?? 0) : 0
}

/* تعداد استوری‌های امروز این مالک (روز تقویمی محلی). */
export function countTodayStories(ownerKey: string): number {
  const today = new Date().toDateString()
  return getStoredStories().filter(s => s.ownerKey === ownerKey && new Date(s.createdAt).toDateString() === today).length
}

/* Live (non-expired) stories; prunes expired ones as a side effect. */
export function getStoredStories(): StoredStory[] {
  if (typeof window === 'undefined') return []
  try {
    const all: StoredStory[] = JSON.parse(localStorage.getItem(KEY) || '[]')
    const now = Date.now()
    const live = all.filter(s => now - s.createdAt < DAY)
    if (live.length !== all.length) localStorage.setItem(KEY, JSON.stringify(live))
    return live
  } catch {
    return []
  }
}

export function addStoredStory(s: StoredStory) {
  const all = getStoredStories()
  all.unshift(s)
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // storage quota — drop oldest entries until it fits, else keep only this one
    const trimmed = [...all]
    while (trimmed.length > 1) {
      trimmed.pop()
      try { localStorage.setItem(KEY, JSON.stringify(trimmed)); return } catch { /* keep trimming */ }
    }
    try { localStorage.setItem(KEY, JSON.stringify([s])) } catch { /* give up */ }
  }
}

/* Live stories owned by a given entity (newest first). */
export function getOwnerStories(ownerKey: string): StoredStory[] {
  return getStoredStories().filter(s => s.ownerKey === ownerKey)
}

/* Remove a single story by id. */
export function removeStoredStory(id: string) {
  const kept = getStoredStories().filter(s => s.id !== id)
  try { localStorage.setItem(KEY, JSON.stringify(kept)) } catch { /* ignore */ }
}

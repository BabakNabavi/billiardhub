/* ─────────────────────────────────────────────────────────────
   Media admin store — کنترل‌های ادمین روی بیلیارد مدیا:
   مخفی‌کردنِ ویدیوها و انتخابِ ویدیوی ویژه (NOW SHOWING).
   صفحه‌ی /media و باندِ مدیای خانه از همین می‌خوانند.
   ───────────────────────────────────────────────────────────── */

const HIDDEN_KEY   = 'bh_media_hidden'
const FEATURED_KEY = 'bh_media_featured'

export function getHiddenVideoIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? '[]')
    return Array.isArray(raw) ? raw : []
  } catch { return [] }
}

export function toggleHiddenVideo(id: string) {
  if (typeof window === 'undefined') return
  const cur = new Set(getHiddenVideoIds())
  if (cur.has(id)) cur.delete(id); else cur.add(id)
  localStorage.setItem(HIDDEN_KEY, JSON.stringify([...cur]))
}

export function getFeaturedOverride(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(FEATURED_KEY) || null
}

export function setFeaturedOverride(id: string | null) {
  if (typeof window === 'undefined') return
  if (id) localStorage.setItem(FEATURED_KEY, id)
  else localStorage.removeItem(FEATURED_KEY)
}

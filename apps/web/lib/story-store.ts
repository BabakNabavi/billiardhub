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
  coach:        { label: 'مربی',        color: '#a78bfa' },
  referee:      { label: 'داور',        color: '#0891b2' },
  club_owner:   { label: 'باشگاه',      color: '#C7A66A' },
  seller:       { label: 'فروشگاه',     color: '#f59e0b' },
  manufacturer: { label: 'تولیدکننده',  color: '#10b981' },
  technician:   { label: 'خدمات فنی',   color: '#6366f1' },
  player:       { label: 'بازیکن',      color: '#06b6d4' },
}

/* Order of preference when a user holds several roles. */
const ROLE_PRIORITY = ['coach', 'referee', 'club_owner', 'seller', 'manufacturer', 'technician', 'player']

export function pickStoryRole(roles: string[]): { key: string; label: string; color: string } {
  const key = ROLE_PRIORITY.find(r => roles.includes(r)) ?? 'player'
  const meta = STORY_ROLES[key] ?? STORY_ROLES.player!
  return { key, label: meta.label, color: meta.color }
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

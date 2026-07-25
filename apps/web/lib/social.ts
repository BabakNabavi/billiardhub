/* ─────────────────────────────────────────────────────────────
   رپرهای کلاینتِ شبکه‌ی اجتماعی — همه از مسیرهای /api/social روی
   همان اوریجین می‌خوانند (سمت‌سرور، بین همه‌ی دستگاه‌ها و کاربران).
   ───────────────────────────────────────────────────────────── */

export interface SStory {
  id: string; ownerKey: string; userName: string
  roleKey: string; roleLabel: string; roleColor: string
  avatar: string; logoUrl?: string; mediaUrl: string; caption: string; createdAt: number
}
export interface Party { key: string; name: string; role?: string }
export interface DMsg { id: string; fromKey: string; text: string; kind: string; storyRef?: string; at: number }
export interface ThreadResult { messages: DMsg[]; otherKey: string; otherPoll: number; otherRead: number }
export interface ConvIndexItem {
  convId: string; otherKey: string; otherName: string; otherRole?: string
  lastText: string; lastKind: string; lastAt: number; unread: number
}
export interface Notif {
  id: string; type: 'reply' | 'reaction' | 'like'; fromKey: string; fromName: string
  fromRole?: string; text: string; storyId?: string; at: number; read: boolean
}

const j = async <T>(p: Promise<Response>, fallback: T): Promise<T> => {
  try { const r = await p; if (!r.ok) return fallback; return (await r.json()) as T } catch { return fallback }
}

/* ── استوری ── */
export const fetchStories = () => j<SStory[]>(fetch('/api/social/stories', { cache: 'no-store' }), [])
export async function postStory(s: Partial<SStory>): Promise<{ ok: boolean; status: number; id?: string; message?: string }> {
  try {
    const r = await fetch('/api/social/stories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) })
    const data = await r.json().catch(() => ({}))
    return { ok: r.ok, status: r.status, ...(data || {}) }
  } catch { return { ok: false, status: 0, message: 'offline' } }
}

/* ── دیده‌شدنِ استوری (per-viewer، ماندگار روی سرور) ── */
export const fetchSeen = (user: string) =>
  j<string[]>(fetch(`/api/social/seen?user=${encodeURIComponent(user)}`, { cache: 'no-store' }), [])
export const markSeen = (user: string, ids: string[]) =>
  j(fetch('/api/social/seen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user, ids }) }), { ok: false })

/* ── دایرکت ── */
export const fetchConversations = (user: string) =>
  j<ConvIndexItem[]>(fetch(`/api/social/dm?user=${encodeURIComponent(user)}`, { cache: 'no-store' }), [])
export const fetchThread = (convId: string, user: string, since = 0) =>
  j<ThreadResult>(fetch(`/api/social/dm?conv=${encodeURIComponent(convId)}&user=${encodeURIComponent(user)}&since=${since}`, { cache: 'no-store' }), { messages: [], otherKey: '', otherPoll: 0, otherRead: 0 })
export const sendDM = (body: { from: Party; to: Party; text: string; kind: string; storyRef?: string }) =>
  j<{ ok?: boolean; convId?: string; message?: DMsg }>(fetch('/api/social/dm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), {})

/* ── نوتیفیکیشن ── */
export const fetchNotifs = (user: string) =>
  j<Notif[]>(fetch(`/api/social/notifications?user=${encodeURIComponent(user)}`, { cache: 'no-store' }), [])
export const markNotifsRead = (user: string) =>
  j(fetch('/api/social/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user, action: 'read' }) }), {})

/* ─────────────────────────────────────────────────────────────
   دایرکتِ استوری (نمونه‌ی سمت‌کلاینت — localStorage).
   وقتی کسی به استوریِ یک صاحب‌استوری ریپلای یا استیکر می‌فرستد،
   اینجا زیرِ ownerKey همان استوری ذخیره می‌شود تا صاحبِ استوری
   بعداً در «دایرکت» ببیند. مثل دایرکتِ اینستاگرام برای پاسخِ استوری.
   ───────────────────────────────────────────────────────────── */

export interface StoryReply {
  id: string
  ownerKey: string        // گیرنده = صاحبِ استوری
  storyId: string
  fromName: string
  fromRole?: string       // برچسبِ نقشِ فرستنده (اختیاری)
  kind: 'text' | 'reaction'
  text: string            // متنِ پیام یا ایموجیِ استیکر
  caption?: string        // کپشنِ همان استوری (برای نمایشِ زمینه)
  at: number              // epoch ms
  read: boolean
}

const KEY = 'bh_story_inbox'
const MAX = 300            // سقفِ ذخیره تا از quota نگذرد

function readAll(): StoryReply[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function writeAll(list: StoryReply[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))) } catch { /* quota */ }
}

/* ثبتِ یک ریپلای/استیکر برای صاحبِ استوری. */
export function addStoryReply(r: Omit<StoryReply, 'id' | 'at' | 'read'>) {
  if (!r.ownerKey || !r.text.trim()) return
  const all = readAll()
  all.unshift({ ...r, id: `sr-${Date.now()}-${Math.floor(Math.random() * 1e4)}`, at: Date.now(), read: false })
  writeAll(all)
}

/* پیام‌های رسیده به این صاحب‌استوری (تازه‌ترین اول). */
export function getInbox(ownerKey: string): StoryReply[] {
  if (!ownerKey) return []
  return readAll().filter(r => r.ownerKey === ownerKey).sort((a, b) => b.at - a.at)
}

/* تعداد نخوانده‌ها. */
export function unreadReplies(ownerKey: string): number {
  if (!ownerKey) return 0
  return readAll().filter(r => r.ownerKey === ownerKey && !r.read).length
}

/* همه‌ی پیام‌های این صاحب‌استوری را خوانده‌شده کن. */
export function markInboxRead(ownerKey: string) {
  const all = readAll()
  let changed = false
  for (const r of all) if (r.ownerKey === ownerKey && !r.read) { r.read = true; changed = true }
  if (changed) writeAll(all)
}

/* حذفِ یک پیام. */
export function removeReply(id: string) {
  writeAll(readAll().filter(r => r.id !== id))
}

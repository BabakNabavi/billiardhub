/* ─────────────────────────────────────────────────────────────
   تاریخچه‌ی تماشا — ورودیِ الگوریتمِ پیشنهاد (lib/media/recommend).

   هر بار که ویدیویی پخش می‌شود، کانال، دسته و برچسب‌هایش این‌جا ثبت
   می‌شود. «ادامه تماشا» (watch-progress) فقط نیمه‌کاره‌ها را نگه می‌دارد
   و تمام‌شده‌ها را پاک می‌کند، پس برای فهمیدنِ سلیقه کافی نیست.

   ⚠️ روی همین دستگاه (localStorage)، مثلِ «ادامه تماشا»: جدولِ
   تاریخچه مهاجرتِ اسکیما و تأییدِ مالک می‌خواهد. همه‌ی دسترسی‌ها در
   try/catch‌اند (حالتِ خصوصیِ سافاری خودِ خواندن را پرتاب می‌کند).
   ───────────────────────────────────────────────────────────── */

import type { MediaVideo } from '../media-data'

const KEY = 'bh:media:history'
const MAX = 200

export interface HistoryEntry {
  slug: string
  handle: string
  category: string
  tags: string[]
  /** آخرین بار که پخش شد (ms) */
  at: number
  /** چند بار پخش شده */
  plays: number
}

export function readHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    const v: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(v)) return []
    return v.filter((e): e is HistoryEntry =>
      !!e && typeof (e as HistoryEntry).slug === 'string' && Number.isFinite((e as HistoryEntry).at))
  } catch { return [] }
}

/** هنگامِ پخش صدا زده می‌شود؛ تکرار فقط شمارنده و زمان را به‌روز می‌کند */
export function recordPlay(v: MediaVideo): void {
  if (typeof window === 'undefined' || !v.id) return
  try {
    const list = readHistory()
    const prev = list.find(e => e.slug === v.id)
    const entry: HistoryEntry = {
      slug: v.id,
      handle: v.creator.handle || '',
      category: v.category,
      tags: v.tags.slice(0, 12),
      at: Date.now(),
      plays: (prev?.plays ?? 0) + 1,
    }
    const next = [entry, ...list.filter(e => e.slug !== v.id)].slice(0, MAX)
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch { /* سهمیه پر یا حالتِ خصوصی — پیشنهاد بی‌شخصی‌سازی ادامه می‌دهد */ }
}

export function clearHistory(): void {
  try { window.localStorage.removeItem(KEY) } catch { /* بی‌اهمیت */ }
}

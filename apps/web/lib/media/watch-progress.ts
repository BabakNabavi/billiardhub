/* ─────────────────────────────────────────────────────────────
   «ادامه تماشا» — پیشرفتِ واقعیِ تماشا روی همین دستگاه.

   ── چرا localStorage و نه دیتابیس ──
   ⚠️ جدولی برای تاریخچه‌ی تماشا وجود ندارد و ساختنش مهاجرتِ اسکیماست
   که تأییدِ صریحِ مالک می‌خواهد. ولی «ادامه تماشا» بدونِ داده یعنی
   یا بخشِ خالی یا — بدتر — درصدِ ساختگی.

   این راهِ میانی هیچ چیزی جعل نمی‌کند: عدد از خودِ پلیر می‌آید و
   واقعاً همان‌جایی است که *این* کاربر روی *این* دستگاه رها کرده.
   محدودیتش صادقانه است: بینِ دستگاه‌ها همگام نمی‌شود.

   ⚠️ همه‌ی دسترسی‌ها در try/catch‌اند: در حالتِ ناشناسِ سافاری خودِ
   خواندن استثنا پرتاب می‌کند، نه اینکه null بدهد.
   ───────────────────────────────────────────────────────────── */

const KEY = 'bh:media:progress'
const MAX = 40

/** کمتر از این، یعنی کاربر فقط سرک کشیده */
const MIN_SEC = 15
/** بیشتر از این، یعنی تمامش کرده و «ادامه» معنا ندارد */
const DONE_RATIO = 0.93

export interface WatchMark {
  slug: string
  /** ثانیه‌ی توقف */
  at: number
  /** طولِ کلِ ویدیو */
  total: number
  /** آخرین تماشا (میلی‌ثانیه) */
  seen: number
}

const readAll = (): WatchMark[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const v = JSON.parse(raw) as unknown
    if (!Array.isArray(v)) return []
    return v.filter((m): m is WatchMark =>
      !!m && typeof (m as WatchMark).slug === 'string'
      && Number.isFinite((m as WatchMark).at)
      && Number.isFinite((m as WatchMark).total))
  } catch { return [] }
}

const writeAll = (list: WatchMark[]) => {
  try { window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))) } catch { /* سهمیه پر یا حالتِ خصوصی */ }
}

/** ثبتِ جای توقف. تماشای کامل، رکورد را پاک می‌کند. */
export function mark(slug: string, at: number, total: number): void {
  if (!slug || !Number.isFinite(at) || !Number.isFinite(total) || total <= 0) return
  const list = readAll().filter(m => m.slug !== slug)
  const finished = at / total >= DONE_RATIO
  if (!finished && at >= MIN_SEC) {
    list.unshift({ slug, at: Math.round(at), total: Math.round(total), seen: Date.now() })
  }
  writeAll(list)
}

/** جای توقفِ یک ویدیو — برای ازسرگیری. */
export function resumeAt(slug: string): number {
  return readAll().find(m => m.slug === slug)?.at ?? 0
}

/** نیمه‌کاره‌ها، تازه‌ترین اول. */
export function inProgress(): WatchMark[] {
  return readAll()
    .filter(m => m.total > 0 && m.at / m.total < DONE_RATIO)
    .sort((a, b) => b.seen - a.seen)
}

/** ۰ تا ۱ — برای نوارِ روی بندانگشتی. */
export const ratioOf = (m: WatchMark) => Math.min(1, Math.max(0, m.at / m.total))

export function forget(slug: string): void {
  writeAll(readAll().filter(m => m.slug !== slug))
}

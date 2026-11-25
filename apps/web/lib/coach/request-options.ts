/* ─────────────────────────────────────────────────────────────
   گزینه‌های درخواستِ کلاس یا مشاوره از مربی — یک منبع برای فرمِ شاگرد،
   API و صندوقِ مربی (آذرِ ۱۴۰۵).

   ⚠️ کلیدها همان مقدارهای CHECKِ مهاجرتِ ۱۱۸ (coach_requests) هستند؛
   افزودنِ گزینه یعنی مهاجرتِ تازه هم.
   ⚠️ رشته‌ها این‌جا نیستند: منبعشان DISCIPLINES در lib/coach-store است و
   آن فایل لودرِ استان/شهر را هم می‌آورد — فرمِ کلاینت نباید آن را در باندل
   بکشد. برچسبِ رشته از سرور به فرم و به `requestTitle` داده می‌شود.
   ───────────────────────────────────────────────────────────── */

export const REQUEST_KINDS = [
  { key: 'class', label: 'کلاس خصوصی' },
  { key: 'consult', label: 'مشاوره' },
] as const

export const REQUEST_LEVELS = [
  { key: 'beginner', label: 'مبتدی' },
  { key: 'intermediate', label: 'متوسط' },
  { key: 'advanced', label: 'حرفه‌ای' },
] as const

export const REQUEST_TIMES = [
  { key: 'morning', label: 'صبح' },
  { key: 'afternoon', label: 'بعدازظهر' },
  { key: 'evening', label: 'شب' },
  { key: 'weekend', label: 'آخر هفته' },
] as const

export type RequestKind = typeof REQUEST_KINDS[number]['key']
export type RequestLevel = typeof REQUEST_LEVELS[number]['key']
export type RequestTime = typeof REQUEST_TIMES[number]['key']

/** همان کلیدهای مهاجرت — مرزِ API با این‌ها اعتبارسنجی می‌کند */
export const REQUEST_KIND_KEYS = REQUEST_KINDS.map(k => k.key) as [RequestKind, ...RequestKind[]]
export const REQUEST_LEVEL_KEYS = REQUEST_LEVELS.map(k => k.key) as [RequestLevel, ...RequestLevel[]]
export const REQUEST_TIME_KEYS = REQUEST_TIMES.map(k => k.key) as [RequestTime, ...RequestTime[]]

/** سقفِ پیامِ شاگرد — همان CHECKِ مهاجرت */
export const REQUEST_MESSAGE_MAX = 300

const labelOf = (list: readonly { key: string; label: string }[], key: string) =>
  list.find(x => x.key === key)?.label ?? ''

export const kindLabel = (k: string) => labelOf(REQUEST_KINDS, k)
export const levelLabel = (k: string) => labelOf(REQUEST_LEVELS, k)
export const timeLabel = (k: string) => labelOf(REQUEST_TIMES, k)

/** «کلاس خصوصی اسنوکر» — عنوانِ درخواست در پیامک و صندوقِ مربی.
 *  ⚠️ متغیرِ `{1}`ِ پیامکِ coach_request همین است؛ مقدارهای ممکنش (۲ نوع × ۳ رشته
 *  یا بی‌رشته) در docs/sms-patterns.md برای ملی‌پیامک فهرست شده‌اند. */
export function requestTitle(kind: string, disciplineLabel: string): string {
  return [kindLabel(kind) || 'درخواست', disciplineLabel].filter(Boolean).join(' ')
}

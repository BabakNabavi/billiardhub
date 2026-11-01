import { faDateTime, toFaDigits } from '@/lib/jalali'
import { ACTIONS, FEATURES, REASONS, STATUS_LABEL, type AccountStatus, type ActionKey, type FeatureKey, type ReasonCode } from '@/lib/enforcement/policy'

/* تاریخچه‌ی اقدام‌ها — فقط افزودنی (دیتابیس ویرایش و حذفش را رد می‌کند). */

export interface HistoryRow {
  id: string; action: string; from_status: string | null; to_status: string | null
  reason_code: string; internal_note: string | null; evidence_ref: string | null
  restrictions: string[]; expires_at: string | null; actor_id: string
  details: Record<string, unknown>; created_at: string
}
export interface ActorRow { id: string; firstName?: string | null; lastName?: string | null; phone?: string }

const label = <T extends string>(map: Record<T, string | { label: string }>, k: string) => {
  const v = (map as Record<string, string | { label: string }>)[k]
  return v ? (typeof v === 'string' ? v : v.label) : k
}

export function HistoryList({ rows, actors }: { rows: HistoryRow[]; actors: ActorRow[] }) {
  if (!rows.length) return <p className="m-0 text-sm text-ink-2">هنوز اقدامی برای این کاربر ثبت نشده است</p>
  const nameOf = (id: string) => {
    const a = actors.find(x => x.id === id)
    return a ? [a.firstName, a.lastName].filter(Boolean).join(' ') || toFaDigits(a.phone ?? '') : id.slice(0, 8)
  }
  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0">
      {rows.map(h => (
        <li key={h.id} className="rounded-card border border-line/10 bg-surface p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="m-0 text-sm font-bold text-ink">{label(ACTIONS as Record<ActionKey, { label: string }>, h.action)}</p>
            <time dateTime={h.created_at} className="text-xs text-ink-2">{faDateTime(h.created_at)}</time>
          </div>
          <dl className="m-0 mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            {h.from_status !== h.to_status && (
              <><dt className="text-ink-2">وضعیت</dt><dd className="m-0 text-ink">
                {STATUS_LABEL[h.from_status as AccountStatus] ?? '—'} ← {STATUS_LABEL[h.to_status as AccountStatus] ?? '—'}
              </dd></>
            )}
            <dt className="text-ink-2">دلیل</dt><dd className="m-0 text-ink">{label(REASONS as Record<ReasonCode, string>, h.reason_code)}</dd>
            {h.expires_at && <><dt className="text-ink-2">انقضا</dt><dd className="m-0 text-ink">{faDateTime(h.expires_at)}</dd></>}
            {!!h.restrictions?.length && (
              <><dt className="text-ink-2">قابلیت‌ها</dt><dd className="m-0 text-ink">
                {h.restrictions.map(k => FEATURES[k as FeatureKey]?.label ?? k).join('، ')}
              </dd></>
            )}
            <dt className="text-ink-2">اقدام‌کننده</dt><dd className="m-0 text-ink">{nameOf(h.actor_id)}</dd>
            {h.internal_note && <><dt className="text-ink-2">یادداشت</dt><dd className="m-0 whitespace-pre-wrap text-ink">{h.internal_note}</dd></>}
            {h.evidence_ref && <><dt className="text-ink-2">مدرک</dt><dd dir="auto" className="m-0 break-all text-ink">{h.evidence_ref}</dd></>}
            {summary(h.details) && <><dt className="text-ink-2">اثر</dt><dd className="m-0 text-ink">{summary(h.details)}</dd></>}
          </dl>
        </li>
      ))}
    </ol>
  )
}

/* خلاصه‌ی اثرِ جانبی برای خواندنِ سریع */
function summary(d: Record<string, unknown>): string {
  const parts: string[] = []
  const n = (v: unknown) => (Array.isArray(v) ? v.length : 0)
  const l = d.listings as { products?: unknown[] } | undefined
  const b = d.business as { clubs?: unknown[]; profiles?: unknown[] } | undefined
  if (l?.products) parts.push(`${toFaDigits(n(l.products))} آگهی حذف شد`)
  if (b) parts.push(`${toFaDigits(n(b.clubs))} باشگاه و ${toFaDigits(n(b.profiles))} پروفایل بسته شد`)
  for (const k of ['listingsRestored', 'businessRestored'] as const) {
    const r = d[k] as { restored?: number } | undefined
    if (r) parts.push(`${toFaDigits(r.restored ?? 0)} مورد بازگشت`)
  }
  if (d.content) parts.push('یک محتوا حذف شد')
  if (d.sessionsRevoked) parts.push('همه‌ی نشست‌ها باطل شد')
  return parts.join('؛ ')
}

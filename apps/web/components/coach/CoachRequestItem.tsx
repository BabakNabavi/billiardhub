/* ─────────────────────────────────────────────────────────────
   یک درخواستِ شاگرد در صندوقِ مربی — نام، عنوان، سطح، زمان‌های مناسب،
   پیام و شماره (فقط تا وقتی درخواست باز است؛ سرور بعدش نمی‌فرستد).
   ───────────────────────────────────────────────────────────── */

import { Phone } from 'lucide-react'
import { Button } from '../ui/Button'
import { faDateTime, toFaDigits } from '../../lib/jalali'
import { levelLabel, timeLabel } from '../../lib/coach/request-options'

export interface CoachRequest {
  id: string; name: string; phone: string; title: string; level: string
  availability: string[]; message: string; status: string; createdAt: string
}

const STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: 'تازه', cls: 'bg-gold/[.12] text-gold-text' },
  contacted: { label: 'تماس گرفته شد', cls: 'bg-success/10 text-success' },
  closed: { label: 'بسته شد', cls: 'bg-line/[.06] text-ink-3' },
  cancelled: { label: 'شاگرد لغو کرد', cls: 'bg-line/[.06] text-ink-3' },
}

export function CoachRequestItem({ r, busy, onAction }: {
  r: CoachRequest
  busy: boolean
  onAction: (id: string, action: 'contacted' | 'closed') => void
}) {
  const st = STATUS[r.status] ?? STATUS.closed!
  const done = r.status === 'closed' || r.status === 'cancelled'
  const times = r.availability.map(timeLabel).filter(Boolean)
  return (
    <li className={`rounded-card border border-line/10 bg-surface p-4 ${done ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{r.name}</p>
          <p className="text-sm text-ink-2">{r.title}{levelLabel(r.level) ? ` · سطح ${levelLabel(r.level)}` : ''}</p>
        </div>
        <span className={`shrink-0 rounded-chip px-2 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>
      </div>

      {times.length > 0 && <p className="mt-2 text-xs text-ink-3">زمان‌های مناسب: {times.join('، ')}</p>}
      {r.message && <p className="mt-2 whitespace-pre-line break-words text-sm text-ink">{r.message}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {r.phone && (
          <a href={`tel:${r.phone}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-field px-2 text-sm font-semibold text-gold-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
            <Phone size={15} aria-hidden /><span dir="ltr">{toFaDigits(r.phone)}</span>
          </a>
        )}
        <span className="ms-auto flex flex-wrap gap-2">
          {r.status === 'new' && (
            <Button size="sm" loading={busy} onClick={() => onAction(r.id, 'contacted')}>تماس گرفتم</Button>
          )}
          {(r.status === 'new' || r.status === 'contacted') && (
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => onAction(r.id, 'closed')}>بستن</Button>
          )}
        </span>
      </div>
      <p className="mt-2 text-xs text-ink-3">{faDateTime(r.createdAt)}</p>
    </li>
  )
}

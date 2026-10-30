import { STATUS_LABEL, type AccountStatus } from '@/lib/enforcement/policy'

/* رنگ معنا دارد: سبز فعال، کهربایی محدود، قرمز مسدود، خاکستری حذف/غیرفعال */
const TONE: Record<AccountStatus, string> = {
  active: 'bg-success/10 text-success border-success/30',
  restricted: 'bg-gold/10 text-gold-text border-gold/30',
  limited: 'bg-gold/10 text-gold-text border-gold/30',
  suspended: 'bg-danger/10 text-danger-ink border-danger/30',
  banned: 'bg-danger/15 text-danger-ink border-danger/40',
  deactivated: 'bg-line/[.08] text-ink-2 border-line/20',
  deleted: 'bg-line/[.08] text-ink-2 border-line/20',
}

export function StatusBadge({ status }: { status: string }) {
  const s = (status in TONE ? status : 'active') as AccountStatus
  return (
    <span className={`inline-flex items-center rounded-chip border px-2 py-1 text-xs font-bold ${TONE[s]}`}>
      {STATUS_LABEL[s]}
    </span>
  )
}

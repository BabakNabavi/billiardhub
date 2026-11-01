'use client'

/* جست‌وجوی کاربر برای پنلِ مالک — شماره، نام یا شناسه؛ و فیلترِ وضعیت. */

import { useCallback, useEffect, useState } from 'react'
import { Search, Loader2, Crown } from 'lucide-react'
import { apiFetch } from '@/lib/http'
import { toFaDigits } from '@/lib/jalali'
import { ACCOUNT_STATUSES, STATUS_LABEL } from '@/lib/enforcement/policy'
import { StatusBadge } from './StatusBadge'

export interface UserRow {
  id: string; phone: string; firstName?: string | null; lastName?: string | null
  primaryRole?: string; account_status?: string; is_platform_owner?: boolean
}

export function UserSearch({ selected, onSelect, refreshKey }: {
  selected: string | null; onSelect: (u: UserRow) => void; refreshKey: number
}) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [rows, setRows] = useState<UserRow[] | null>(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const run = useCallback(async (query: string, st: string) => {
    setLoading(true); setErr('')
    try {
      const r = await apiFetch(`/api/owner/enforcement?q=${encodeURIComponent(query)}&status=${st}`, { cache: 'no-store' })
      const j = await r.json().catch(() => ({})) as { users?: UserRow[]; message?: string }
      if (!r.ok) { setErr(j.message ?? 'جست‌وجو انجام نشد'); setRows([]); return }
      setRows(j.users ?? [])
    } catch { setErr('خطا در ارتباط با سرور'); setRows([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void run(q, status) }, [run, status, refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps -- q فقط با ارسالِ فرم

  return (
    <section aria-label="جست‌وجوی کاربر" className="flex flex-col gap-3">
      <form role="search" className="flex gap-2" onSubmit={e => { e.preventDefault(); void run(q, status) }}>
        <label htmlFor="enf-q" className="sr-only">شماره، نام یا شناسه‌ی کاربر</label>
        <input id="enf-q" value={q} onChange={e => setQ(e.target.value)} placeholder="شماره، نام یا شناسه…"
          className="h-11 min-w-0 flex-1 rounded-field border border-line/15 bg-surface px-3 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-gold-deep" />
        <button type="submit" aria-label="جست‌وجو" disabled={loading}
          className="flex size-11 shrink-0 items-center justify-center rounded-field border border-line/15 bg-surface text-ink-2 hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep disabled:opacity-50">
          {loading ? <Loader2 size={18} className="motion-safe:animate-spin" aria-hidden /> : <Search size={18} aria-hidden />}
        </button>
      </form>
      <label className="flex items-center gap-2 text-xs text-ink-2">
        وضعیت
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="h-9 rounded-field border border-line/15 bg-surface px-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
          <option value="all">همه</option>
          {ACCOUNT_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </label>

      {err && <p role="alert" className="m-0 text-sm text-danger-ink">{err}</p>}
      {rows === null ? (
        <ul aria-hidden className="m-0 flex list-none flex-col gap-2 p-0">
          {[0, 1, 2, 3].map(i => <li key={i} className="h-14 rounded-card bg-line/[.06] motion-safe:animate-pulse" />)}
        </ul>
      ) : rows.length === 0 && !err ? (
        <p className="m-0 text-sm text-ink-2">کاربری پیدا نشد</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {rows.map(u => (
            <li key={u.id}>
              <button type="button" onClick={() => onSelect(u)} aria-pressed={selected === u.id}
                className={`flex w-full items-center gap-3 rounded-card border p-3 text-start hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep ${selected === u.id ? 'border-gold-deep bg-gold/[.06]' : 'border-line/10 bg-surface'}`}>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex items-center gap-1 truncate text-sm font-bold text-ink">
                    {u.is_platform_owner && <Crown size={14} className="text-gold-text" aria-label="مالک پلتفرم" />}
                    {[u.firstName, u.lastName].filter(Boolean).join(' ') || 'بی‌نام'}
                  </span>
                  <span dir="ltr" className="text-start text-xs text-ink-2">{toFaDigits(u.phone ?? '')}</span>
                </span>
                <StatusBadge status={u.account_status ?? 'active'} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

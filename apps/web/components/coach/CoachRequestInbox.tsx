'use client'

/* ─────────────────────────────────────────────────────────────
   صندوقِ درخواست‌های شاگردها — پنلِ مربی (آذرِ ۱۴۰۵).

   هر درخواست یک پیامک هم برای مربی می‌فرستد؛ این‌جا جزئیاتی است که در
   پیامک جا نمی‌شود (سطح، زمان‌های مناسب، پیام). «تماس گرفتم» برنمی‌گردد:
   شرطِ نظر دادنِ شاگرد رویش سوار است (api/coach/requests).
   بی پروفایلِ مربی چیزی نشان نمی‌دهد — این پنل فرمِ ساختِ پروفایل هم هست.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { apiFetch } from '../../lib/http'
import { toFaDigits } from '../../lib/jalali'
import { ask, notify } from '../../lib/ui/dialogs'
import { CoachRequestItem, type CoachRequest } from './CoachRequestItem'

type State = { s: 'loading' } | { s: 'error' } | { s: 'hidden' } | { s: 'ready'; list: CoachRequest[] }

export function CoachRequestInbox() {
  const [state, setState] = useState<State>({ s: 'loading' })
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await apiFetch('/api/coach/requests?role=coach', { cache: 'no-store' })
      if (!r.ok) { setState({ s: 'error' }); return }
      const j = await r.json() as { hasProfile?: boolean; requests?: CoachRequest[] }
      setState(j.hasProfile ? { s: 'ready', list: j.requests ?? [] } : { s: 'hidden' })
    } catch (e) {
      console.error('[coach-requests] inbox', e)
      setState({ s: 'error' })
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const act = async (id: string, action: 'contacted' | 'closed') => {
    if (action === 'closed' && !(await ask('این درخواست بسته شود؟', {
      body: 'درخواست بسته از کارهای باز بیرون می‌رود و شماره شاگرد دیگر این‌جا دیده نمی‌شود', confirmLabel: 'بستن',
    }))) return
    setBusy(id)
    try {
      const r = await apiFetch('/api/coach/requests', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }),
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({})) as { message?: string }
        notify(j.message ?? 'ثبت تغییر انجام نشد')
      }
      await load()
    } catch {
      notify('ارتباط با سرور برقرار نشد')
    } finally { setBusy('') }
  }

  if (state.s === 'hidden') return null
  const fresh = state.s === 'ready' ? state.list.filter(r => r.status === 'new').length : 0

  return (
    <section aria-labelledby="cri-h" className="rounded-panel border border-line/10 bg-surface p-6 shadow-e0">
      <div className="flex items-center gap-2">
        <h2 id="cri-h" className="text-xl font-semibold text-ink">درخواست‌های شاگردها</h2>
        {fresh > 0 && (
          <span className="rounded-chip bg-gold/[.12] px-2 py-1 text-xs font-semibold text-gold-text">{toFaDigits(fresh)} تازه</span>
        )}
      </div>

      {state.s === 'loading' && (
        <div className="mt-4 space-y-3 animate-pulse motion-reduce:animate-none" aria-busy="true" aria-label="در حال بارگذاری">
          <div className="h-24 rounded-card bg-line/[.06]" />
          <div className="h-24 rounded-card bg-line/[.06]" />
        </div>
      )}

      {state.s === 'error' && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-ink-2">درخواست‌ها بارگذاری نشد</p>
          <Button size="sm" variant="secondary" onClick={() => { setState({ s: 'loading' }); void load() }}>تلاش دوباره</Button>
        </div>
      )}

      {state.s === 'ready' && state.list.length === 0 && (
        <p className="mt-3 text-sm text-ink-2">
          هنوز درخواستی نرسیده، شاگردها از صفحه پروفایل شما درخواست کلاس یا مشاوره می‌فرستند و پیامکش برای شما می‌آید
        </p>
      )}

      {state.s === 'ready' && state.list.length > 0 && (
        <ul className="mt-4 space-y-3">
          {state.list.map(r => (
            <CoachRequestItem key={r.id} r={r} busy={busy === r.id} onAction={(id, a) => void act(id, a)} />
          ))}
        </ul>
      )}
    </section>
  )
}

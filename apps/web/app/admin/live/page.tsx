'use client'

/* ─────────────────────────────────────────────────────────────
   پنلِ مدیریتِ پخش زنده (کلیدِ دسترسیِ «live»).
   - وضعیتِ سرویسِ پخش و آمارِ ۳۰ روزِ کلِ سایت
   - تعیینِ سطحِ باشگاه (عادی ۱ کانال / حرفه‌ای چند کانال)
   - مسدودسازیِ یک کانال یا کلِ پخشِ یک باشگاه (با دلیل)
   - توقفِ اجباری و پنهان‌کردنِ ضبط از آرشیوِ عمومی
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RadioTower } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { apiFetch } from '@/lib/http'
import { faDec, faNum } from '@/lib/jalali'
import type { AdminAction, AdminState } from '@/lib/streaming/admin-types'
import { ClubLiveCard } from '@/components/admin/live/ClubLiveCard'
import { ReasonDialog } from '@/components/admin/live/ReasonDialog'
import { ManualAttachForm } from '@/components/admin/live/ManualAttachForm'

const keyOf = (a: AdminAction) =>
  a.action === 'attach-manual' ? 'attach-manual' : `${a.action}:${'channelId' in a ? a.channelId : 'clubId' in a ? a.clubId : a.broadcastId}`

export default function AdminLivePage() {
  const [state, setState] = useState<AdminState | null>(null)
  const [loadErr, setLoadErr] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [ask, setAsk] = useState<{ title: string; act: (r: string) => AdminAction } | null>(null)
  const [pick, setPick] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await apiFetch('/api/admin/streams', { cache: 'no-store' })
      const j = await r.json().catch(() => ({})) as AdminState & { message?: string }
      if (!r.ok) { setLoadErr(j.message ?? 'خوانده نشد'); return }
      setState(j); setLoadErr('')
    } catch { setLoadErr('ارتباط با سرور برقرار نشد') }
  }, [])
  useEffect(() => { void load() }, [load])

  const run = useCallback(async (a: AdminAction) => {
    setBusy(keyOf(a)); setErr('')
    try {
      const r = await apiFetch('/api/admin/streams', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(a),
      })
      const j = await r.json().catch(() => ({})) as { message?: string }
      if (!r.ok) { setErr(j.message ?? 'انجام نشد'); return false }
      await load()
      return true
    } catch { setErr('ارتباط با سرور برقرار نشد'); return false } finally { setBusy(null) }
  }, [load])

  const listed = useMemo(() => new Set((state?.clubs ?? []).map(c => c.clubId)), [state])
  const others = (state?.allClubs ?? []).filter(c => !listed.has(c.id))

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-24 pt-6">
      <header className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-title text-ink"><RadioTower className="h-6 w-6 text-gold-text" aria-hidden /> پخش زنده</h1>
        {state && (
          <p className="text-meta text-ink-3">
            سرویس پخش: {state.connected ? `وصل (${state.provider})` : 'API وصل نیست — کانال‌ها فعلا با «وصل کانال آروان» دستی اضافه می‌شوند'}
            {state.month ? ` · ۳۰ روز: ${faNum(state.month.count)} پخش، ${faDec(state.month.hours)} ساعت، ${faDec(state.month.viewerHours)} ساعت‌-بیننده` : ''}
          </p>
        )}
      </header>

      {!state && !loadErr && <div className="h-40 animate-pulse rounded-panel bg-ink/[.05]" aria-label="در حال بارگذاری" />}
      {loadErr && (
        <div className="flex flex-col items-start gap-3 rounded-panel bg-danger/[.05] p-4 text-sub text-danger">
          {loadErr}<Button variant="secondary" size="sm" onClick={() => void load()}>تلاش دوباره</Button>
        </div>
      )}
      {state && !state.ready && (
        <p className="rounded-panel bg-ink/[.03] p-4 text-sub text-ink-2">جدول‌های پخش زنده هنوز ساخته نشده‌اند (مهاجرت ۱۱۴ روی سرور اجرا نشده)</p>
      )}
      {err && <p role="alert" className="rounded-card bg-danger/[.06] p-3 text-sub text-danger">{err}</p>}

      {state?.ready && (
        <>
          <ManualAttachForm clubs={state.allClubs ?? []} busy={busy === 'attach-manual'} run={run} />

          {others.length > 0 && (
            <div className="flex flex-wrap items-end gap-2 rounded-panel bg-ink/[.03] p-4">
              <label className="flex min-w-0 flex-1 flex-col gap-1 text-meta text-ink-3">
                باشگاه حرفه‌ای (چند کانال) کنید
                <select value={pick} onChange={e => setPick(e.target.value)}
                  className="min-h-11 rounded-field border border-line/10 bg-paper px-3 text-sub focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
                  <option value="">انتخاب باشگاه…</option>
                  {others.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <Button size="sm" disabled={!pick} loading={busy === `set-tier:${pick}`}
                onClick={async () => { if (await run({ action: 'set-tier', clubId: pick, tier: 'pro' })) setPick('') }}>
                حرفه‌ای شود</Button>
            </div>
          )}

          {state.clubs.length === 0
            ? <p className="rounded-panel bg-ink/[.03] px-4 py-8 text-center text-sub text-ink-3">هنوز هیچ باشگاهی کانال پخش ندارد</p>
            : state.clubs.map(c => (
                <ClubLiveCard key={c.clubId} club={c} busy={busy} run={run} askReason={(title, act) => setAsk({ title, act })} />
              ))}
        </>
      )}

      <ReasonDialog open={ask !== null} title={ask?.title ?? ''} busy={busy !== null}
        onCancel={() => setAsk(null)}
        onConfirm={async reason => { if (ask && await run(ask.act(reason))) setAsk(null) }} />
    </main>
  )
}

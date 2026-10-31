'use client'

/* ساختِ کانالِ تازه. نوع‌هایی که برای این باشگاه مجاز نیست، خاموش و با دلیل
   دیده می‌شوند — نه پنهان، تا باشگاه‌دار بداند «کانالِ میز» هم وجود دارد. */

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { ChannelAccess, ChannelKind } from '@/lib/streaming/policy'
import type { ManageAction, ManageState } from '@/lib/streaming/manage-types'

const field = 'min-h-11 w-full rounded-field border border-line/10 bg-paper px-3 text-sub text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep'

export function NewChannelForm({ state, slotsLeft, busy, run, onDone }: {
  state: ManageState; slotsLeft: number; busy: boolean
  run: (a: ManageAction) => Promise<boolean>; onDone: () => void
}) {
  const pro = state.settings?.tier === 'pro'
  const usedTournaments = new Set((state.channels ?? []).map(c => c.tournamentId).filter(Boolean))
  const freeTournaments = (state.tournaments ?? []).filter(t => !usedTournaments.has(t.id))
  const firstKind: ChannelKind = slotsLeft > 0 ? 'club' : 'tournament'

  const [kind, setKind] = useState<ChannelKind>(firstKind)
  const [title, setTitle] = useState('')
  const [tableLabel, setTableLabel] = useState('')
  const [tournamentId, setTournamentId] = useState(freeTournaments[0]?.id ?? '')
  const [access, setAccess] = useState<ChannelAccess>('public')
  const [record, setRecord] = useState(true)

  const kinds: { k: ChannelKind; label: string; off: string | null }[] = [
    { k: 'club', label: 'کانالِ باشگاه', off: slotsLeft > 0 ? null : 'سقفِ کانال پر است' },
    { k: 'table', label: 'کانالِ یک میز', off: !pro ? 'مخصوصِ باشگاهِ حرفه‌ای' : slotsLeft > 0 ? null : 'سقفِ کانال پر است' },
    { k: 'tournament', label: 'کانالِ مسابقه', off: freeTournaments.length ? null : 'مسابقه‌ی فعالِ بی‌کانال نیست' },
  ]

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await run({
      action: 'create', kind, title: title.trim(), access, record,
      ...(kind === 'table' ? { tableLabel: tableLabel.trim() } : {}),
      ...(kind === 'tournament' ? { tournamentId } : {}),
    })
    if (ok) onDone()
  }

  return (
    <form onSubmit={e => void submit(e)} className="flex flex-col gap-4 rounded-panel border border-gold/30 bg-gold/[.04] p-4">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-2 text-sub font-bold text-ink">نوعِ کانال</legend>
        {kinds.map(o => (
          <label key={o.k} className={`inline-flex min-h-11 items-center gap-2 rounded-field border px-3 text-sub ${o.off ? 'cursor-not-allowed border-line/10 text-ink-3' : 'cursor-pointer border-line/20 text-ink'} ${kind === o.k ? 'border-gold/60 bg-gold/10' : ''}`}>
            <input type="radio" name="kind" className="accent-gold" disabled={!!o.off} checked={kind === o.k} onChange={() => setKind(o.k)} />
            {o.label}{o.off && <span className="text-meta">({o.off})</span>}
          </label>
        ))}
      </fieldset>

      <label className="flex flex-col gap-1 text-sub text-ink">
        نامِ کانال
        <input className={field} value={title} onChange={e => setTitle(e.target.value)} required minLength={2} maxLength={90}
          placeholder={kind === 'tournament' ? 'مثلاً فینالِ جامِ پاییزه' : 'مثلاً پخشِ زنده‌ی آرتا کلاب'} />
      </label>

      {kind === 'table' && (
        <label className="flex flex-col gap-1 text-sub text-ink">
          نامِ میز
          <input className={field} value={tableLabel} onChange={e => setTableLabel(e.target.value)} maxLength={40} placeholder="مثلاً میزِ اسنوکرِ ۳" />
        </label>
      )}
      {kind === 'tournament' && (
        <label className="flex flex-col gap-1 text-sub text-ink">
          مسابقه
          <select className={field} value={tournamentId} onChange={e => setTournamentId(e.target.value)} required>
            {freeTournaments.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </label>
      )}

      <div className="flex flex-wrap gap-6">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sub text-ink">
          <input type="checkbox" className="h-4 w-4 accent-gold" checked={access === 'members'} onChange={e => setAccess(e.target.checked ? 'members' : 'public')} />
          فقط کاربرانِ عضو ببینند
        </label>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sub text-ink">
          <input type="checkbox" className="h-4 w-4 accent-gold" checked={record} onChange={e => setRecord(e.target.checked)} />
          ضبط برای آرشیو
        </label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" loading={busy} disabled={!!kinds.find(o => o.k === kind)?.off} icon={<Plus className="h-4 w-4" aria-hidden />}>ساختِ کانال</Button>
        <Button variant="ghost" onClick={onDone}>انصراف</Button>
      </div>
    </form>
  )
}

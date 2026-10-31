'use client'

/* ─────────────────────────────────────────────────────────────
   تبِ «پخش زنده»ی داشبوردِ باشگاه — کانال‌ها، کلیدِ استریم، شروع/پایان.

   سه حالتِ پیش از کار، هرکدام پیامِ صادقِ خودش:
   - مهاجرت اجرا نشده      ⟵ «به‌زودی»
   - سرویسِ پخش وصل نیست   ⟵ «به‌زودی» (کلیدِ ساختگی به باشگاه‌دار داده نمی‌شود)
   - پخشِ باشگاه مسدود     ⟵ دلیلِ مدیریت
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import { Plus, RadioTower, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { apiFetch } from '@/lib/http'
import { faDec, faNum } from '@/lib/jalali'
import type { ManageAction, ManageState } from '@/lib/streaming/manage-types'
import { ChannelCard } from './ChannelCard'
import { NewChannelForm } from './NewChannelForm'

export function LiveChannelsPanel({ clubId }: { clubId: string }) {
  const [state, setState] = useState<ManageState | null>(null)
  const [loadErr, setLoadErr] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await apiFetch(`/api/streams/manage?clubId=${clubId}`, { cache: 'no-store' })
      const j = await r.json().catch(() => ({})) as ManageState & { message?: string }
      if (!r.ok) { setLoadErr(j.message ?? 'اطلاعاتِ پخش خوانده نشد'); return }
      setState(j); setLoadErr('')
    } catch { setLoadErr('ارتباط با سرور برقرار نشد') }
  }, [clubId])

  useEffect(() => { void load() }, [load])

  const run = useCallback(async (a: ManageAction): Promise<boolean> => {
    setBusy(`${a.action}:${'channelId' in a ? a.channelId : 'new'}`); setErr('')
    try {
      const r = await apiFetch('/api/streams/manage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...a, clubId }),
      })
      const j = await r.json().catch(() => ({})) as { message?: string }
      if (!r.ok) { setErr(j.message ?? 'انجام نشد'); return false }
      await load()
      return true
    } catch { setErr('ارتباط با سرور برقرار نشد'); return false } finally { setBusy(null) }
  }, [clubId, load])

  if (!state && !loadErr) return (
    <div className="flex flex-col gap-3" aria-label="در حالِ بارگذاری">
      {[0, 1].map(i => <div key={i} className="h-32 animate-pulse rounded-panel bg-ink/[.05]" />)}
    </div>
  )
  if (loadErr) return (
    <div className="flex flex-col items-start gap-3 rounded-panel bg-danger/[.05] p-4 text-sub text-danger">
      {loadErr}
      <Button variant="secondary" size="sm" onClick={() => { setLoadErr(''); void load() }}>تلاشِ دوباره</Button>
    </div>
  )
  /* سرویس قطع ولی کانال هست ⟵ کارت‌ها می‌مانند (دکمه‌ی «پایانِ پخش» سرویس نمی‌خواهد)؛
     فقط ساخت/شروع/کلید خاموش است */
  if (!state!.ready || (!state!.connected && (state!.channels ?? []).length === 0)) return (
    <Intro>
      پخش زنده‌ی حرفه‌ای (دوربینِ IP، OBS یا اپِ Larix، تماشاگرِ نامحدود، ضبط و آرشیو) به‌زودی فعال می‌شود.
      تا آن روز، پخشِ مستقیم از گوشی از تبِ «پخش زنده»ی صفحه‌ی باشگاه در دسترس است.
    </Intro>
  )

  const s = state!
  const channels = s.channels ?? []
  const used = channels.filter(c => c.kind !== 'tournament').length
  const slotsLeft = Math.max(0, (s.limit ?? 1) - used)

  return (
    <div className="flex flex-col gap-4">
      <Intro>
        هر کانال یک «نشانیِ سرور» و یک «کلیدِ استریم» دارد. آن‌ها را در OBS یا اپِ Larix وارد کنید،
        پخش را از همان‌جا شروع کنید و این‌جا «شروعِ پخش» را بزنید تا در سایت نمایش داده شود.
      </Intro>

      {!s.connected && (
        <p className="rounded-card bg-ink/[.04] p-3 text-sub text-ink-2">سرویسِ پخش فعلاً در دسترس نیست؛ شروعِ پخش و ساختِ کلید موقتاً خاموش است.</p>
      )}

      {s.settings?.blocked && (
        <p className="flex items-start gap-2 rounded-card bg-danger/[.06] p-3 text-sub text-danger">
          <ShieldAlert className="mt-1 h-4 w-4 shrink-0" aria-hidden />
          پخش زنده‌ی این باشگاه توسط مدیریت بیلیارد هاب مسدود شده است{s.settings.blockReason ? `: ${s.settings.blockReason}` : ''}.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-meta text-ink-3">
          {s.settings?.tier === 'pro' ? 'باشگاهِ حرفه‌ای' : 'باشگاهِ عادی'} · {faNum(used)} از {faNum(s.limit ?? 1)} کانال
          {s.month ? ` · ۳۰ روزِ اخیر: ${faDec(s.month.hours)} ساعت پخش، اوجِ ${faNum(s.month.peakViewers)} بیننده` : ''}
        </p>
        {!adding && !s.settings?.blocked && s.connected && (
          <Button size="sm" onClick={() => setAdding(true)} icon={<Plus className="h-4 w-4" aria-hidden />}>کانالِ تازه</Button>
        )}
      </div>

      {err && <p role="alert" className="rounded-card bg-danger/[.06] p-3 text-sub text-danger">{err}</p>}

      {adding && <NewChannelForm state={s} slotsLeft={slotsLeft} busy={busy === 'create:new'} run={run} onDone={() => setAdding(false)} />}

      {channels.length === 0 && !adding
        ? <p className="rounded-panel bg-ink/[.03] px-4 py-8 text-center text-sub text-ink-3">هنوز کانالی نساخته‌اید. با «کانالِ تازه» شروع کنید.</p>
        : channels.map(ch => <ChannelCard key={ch.id} ch={ch} busy={busy} run={run} connected={s.connected} />)}
    </div>
  )
}

function Intro({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-panel bg-ink/[.03] p-4 text-sub text-ink-2">
      <RadioTower className="mt-1 h-5 w-5 shrink-0 text-gold-text" aria-hidden />
      <p>{children}</p>
    </div>
  )
}

'use client'

/* یک باشگاه در پنلِ مدیر: سطح (عادی/حرفه‌ای) و سقفِ کانال، مسدودیِ کلِ
   پخشِ باشگاه، و کانال‌هایش. */

import { useState } from 'react'
import Link from 'next/link'
import { Ban, CircleCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { faDec, faNum } from '@/lib/jalali'
import { MAX_CHANNEL_LIMIT, PRO_DEFAULT_LIMIT } from '@/lib/streaming/policy'
import type { AdminAction, AdminClub } from '@/lib/streaming/admin-types'
import { ChannelAdminRow } from './ChannelAdminRow'

export function ClubLiveCard({ club, busy, run, askReason }: {
  club: AdminClub; busy: string | null
  run: (a: AdminAction) => Promise<boolean>
  askReason: (title: string, act: (reason: string) => AdminAction) => void
}) {
  const s = club.settings
  const [limit, setLimit] = useState(s.tier === 'pro' ? s.channelLimit : PRO_DEFAULT_LIMIT)
  const field = 'min-h-11 rounded-field border border-line/10 bg-paper px-3 text-sub focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep'

  return (
    <article className="flex flex-col gap-4 rounded-panel border border-line/10 bg-surface p-4 shadow-e0">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href={`/clubs/${club.slug || club.clubId}`} target="_blank" className="inline-flex min-h-11 items-center rounded text-section text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">{club.name}</Link>
          <p className="text-meta text-ink-3">
            {s.tier === 'pro' ? 'حرفه‌ای' : 'عادی'} · {faNum(club.channels.length)} کانال از سقف {faNum(club.limit)} ·
            ۳۰ روز: {faDec(club.month.hours)} ساعت، اوج {faNum(club.month.peakViewers)} بیننده
          </p>
        </div>
        {s.blocked
          ? <Button variant="secondary" size="sm" loading={busy === `unblock-club:${club.clubId}`} icon={<CircleCheck className="h-4 w-4" aria-hidden />}
              onClick={() => void run({ action: 'unblock-club', clubId: club.clubId })}>رفع مسدودی باشگاه</Button>
          : <Button variant="danger-ghost" size="sm" icon={<Ban className="h-4 w-4" aria-hidden />}
              onClick={() => askReason(`مسدودکردن پخش «${club.name}»`, reason => ({ action: 'block-club', clubId: club.clubId, reason }))}>
              مسدود کل پخش باشگاه</Button>}
      </header>

      {s.blocked && <p className="rounded-card bg-danger/[.06] p-3 text-sub text-danger">پخش این باشگاه مسدود است{s.blockReason ? `: ${s.blockReason}` : ''}.</p>}

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-meta text-ink-3">
          سطح
          <select className={field} value={s.tier} disabled={busy === `set-tier:${club.clubId}`}
            onChange={e => void run({ action: 'set-tier', clubId: club.clubId, tier: e.target.value === 'pro' ? 'pro' : 'standard', channelLimit: limit })}>
            <option value="standard">عادی — ۱ کانال</option>
            <option value="pro">حرفه‌ای — چند کانال</option>
          </select>
        </label>
        {s.tier === 'pro' && (
          <>
            <label className="flex flex-col gap-1 text-meta text-ink-3">
              سقف کانال
              <input type="number" dir="ltr" min={2} max={MAX_CHANNEL_LIMIT} className={`${field} w-24`} value={limit}
                onChange={e => setLimit(Math.max(2, Math.min(MAX_CHANNEL_LIMIT, Number(e.target.value) || 2)))} />
            </label>
            <Button variant="secondary" size="sm" loading={busy === `set-tier:${club.clubId}`} disabled={limit === s.channelLimit}
              onClick={() => void run({ action: 'set-tier', clubId: club.clubId, tier: 'pro', channelLimit: limit })}>ذخیره‌ی سقف</Button>
          </>
        )}
      </div>

      {club.channels.length > 0
        ? <ul className="flex flex-col gap-2">
            {club.channels.map(ch => (
              <ChannelAdminRow key={ch.id} ch={ch} busy={busy} run={run}
                onBlock={() => askReason(`مسدودکردن کانال «${ch.title}»`, reason => ({ action: 'block-channel', channelId: ch.id, reason }))} />
            ))}
          </ul>
        : <p className="text-meta text-ink-3">این باشگاه هنوز کانالی نساخته است</p>}
    </article>
  )
}

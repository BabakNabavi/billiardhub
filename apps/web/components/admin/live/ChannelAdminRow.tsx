'use client'

/* یک کانال در پنلِ مدیر: وضعیت، آمار، توقفِ اجباری، مسدودسازی، و پخش‌های اخیر
   (پنهان/نمایشِ ضبط در آرشیوِ عمومی). */

import { useState } from 'react'
import Link from 'next/link'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Ban, CircleCheck, EyeOff, Eye, Square, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { faDateTime, faDec, faNum } from '@/lib/jalali'
import { KIND_LABEL } from '@/lib/streaming/policy'
import type { AdminAction, AdminChannel } from '@/lib/streaming/admin-types'
import { WhipForm } from './WhipForm'

export function ChannelAdminRow({ ch, busy, run, onBlock }: {
  ch: AdminChannel; busy: string | null
  run: (a: AdminAction) => Promise<boolean>; onBlock: () => void
}) {
  const b = (k: string) => busy === k
  const [ask, setAsk] = useState(false)
  return (
    <li className="flex flex-col gap-3 rounded-card border border-line/10 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/live/c/${ch.id}`} target="_blank" className="inline-flex min-h-11 items-center rounded text-sub font-bold text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">{ch.title}</Link>
        <span className="text-meta text-ink-3">{KIND_LABEL[ch.kind]}{ch.tableLabel ? ` — ${ch.tableLabel}` : ''} · {ch.access === 'public' ? 'عمومی' : 'اعضا'}</span>
        {ch.isLive && <span className="rounded-chip bg-danger/10 px-2 py-1 text-meta font-bold text-danger">● زنده · {faNum(ch.viewers)}</span>}
        {ch.adminBlocked && <span className="rounded-chip bg-danger/10 px-2 py-1 text-meta font-bold text-danger">مسدود</span>}
        {ch.manual && <span className="rounded-chip bg-ink/[.05] px-2 py-1 text-meta text-ink-3">وصل دستی</span>}
      </div>
      {ch.adminBlocked && ch.blockReason && <p className="text-meta text-danger">دلیل: {ch.blockReason}</p>}
      <p className="text-meta text-ink-3">
        ۳۰ روز: {faNum(ch.month.count)} پخش · {faDec(ch.month.hours)} ساعت · اوج {faNum(ch.month.peakViewers)} بیننده · {faDec(ch.month.viewerHours)} ساعت‌-بیننده
      </p>
      <div className="flex flex-wrap gap-2">
        {ch.isLive && (
          <Button variant="secondary" size="sm" loading={b(`force-stop:${ch.id}`)} icon={<Square className="h-4 w-4" aria-hidden />}
            onClick={() => void run({ action: 'force-stop', channelId: ch.id })}>توقف پخش</Button>
        )}
        {ch.adminBlocked ? (
          <Button variant="secondary" size="sm" loading={b(`unblock-channel:${ch.id}`)} icon={<CircleCheck className="h-4 w-4" aria-hidden />}
            onClick={() => void run({ action: 'unblock-channel', channelId: ch.id })}>رفع مسدودی</Button>
        ) : (
          <Button variant="danger-ghost" size="sm" icon={<Ban className="h-4 w-4" aria-hidden />} onClick={onBlock}>مسدود کانال</Button>
        )}
        <Button variant="danger-ghost" size="sm" loading={b(`archive-channel:${ch.id}`)} icon={<Trash2 className="h-4 w-4" aria-hidden />}
          onClick={() => setAsk(true)}>حذف</Button>
      </div>
      {/* پنجره‌ی خودِ سایت، نه confirm()ِ مرورگر (انگلیسی، چپ‌به‌راست، با نشانیِ سایت بالایش) */}
      <ConfirmDialog open={ask} tone="danger" title={`حذف کانال «${ch.title}»؟`}
        body={ch.manual ? 'کانال از سایت حذف می‌شود؛ خود کانال در پنل آروان می‌ماند' : 'کانال از سایت و از سرویس پخش حذف می‌شود، این کار برگشت ندارد'}
        confirmLabel="حذف" busy={b(`archive-channel:${ch.id}`)}
        onCancel={() => setAsk(false)}
        onConfirm={async () => { if (await run({ action: 'archive-channel', channelId: ch.id })) setAsk(false) }} />
      <WhipForm channelId={ch.id} current={ch.whipUrl} busy={b(`set-whip:${ch.id}`)} run={run} />
      {ch.recent.length > 0 && (
        <ul className="flex flex-col gap-1 border-t border-line/10 pt-2">
          {ch.recent.map(r => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 text-meta text-ink-3">
              <span>{faDateTime(r.startedAt)}</span>
              <span>· {r.endedAt ? `اوج ${faNum(r.peakViewers)}` : 'در جریان'}</span>
              {r.recordingUrl && (
                <button type="button" disabled={b(`${r.recordingHidden ? 'show' : 'hide'}-recording:${r.id}`)}
                  onClick={() => void run({ action: r.recordingHidden ? 'show-recording' : 'hide-recording', broadcastId: r.id })}
                  className="ms-auto inline-flex min-h-11 items-center gap-1 rounded-field px-2 hover:bg-line/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep disabled:opacity-50">
                  {r.recordingHidden ? <><Eye className="h-4 w-4" aria-hidden /> نمایش ضبط</> : <><EyeOff className="h-4 w-4" aria-hidden /> پنهان‌کردن ضبط</>}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

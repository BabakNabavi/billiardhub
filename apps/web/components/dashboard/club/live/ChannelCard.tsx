'use client'

/* یک کانالِ پخش در پنلِ باشگاه: وضعیت، شروع/پایان، اطلاعاتِ اتصال،
   دسترسی و ضبط، و حذف. هر کارِ برگشت‌ناپذیر (کلیدِ تازه، حذف) تأیید می‌خواهد. */

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ExternalLink, Play, ShieldAlert, Square, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { faDec, faNum } from '@/lib/jalali'
import { KIND_LABEL } from '@/lib/streaming/policy'
import type { ManageAction, OwnerChannel } from '@/lib/streaming/manage-types'
import { IngestInfo } from './IngestInfo'

type Run = (a: ManageAction) => Promise<boolean>

export function ChannelCard({ ch, busy, run, connected = true }: { ch: OwnerChannel; busy: string | null; run: Run; connected?: boolean }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState<'rotate' | 'archive' | null>(null)
  const isBusy = (a: string) => busy === `${a}:${ch.id}`

  return (
    <article className="flex flex-col gap-4 rounded-panel border border-line/10 bg-surface p-4 shadow-e0">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-section text-ink">{ch.title}</h3>
          <p className="text-meta text-ink-3">
            {KIND_LABEL[ch.kind]}{ch.tableLabel ? ` — ${ch.tableLabel}` : ''} · {ch.access === 'public' ? 'تماشا برای همه' : 'فقط کاربرانِ عضو'}{ch.record ? ' · ضبط روشن' : ''}
          </p>
        </div>
        {ch.isLive
          ? <span className="rounded-chip bg-danger/10 px-2 py-1 text-meta font-bold text-danger">● زنده · {faNum(ch.viewers)} بیننده</span>
          : <span className="rounded-chip bg-ink/[.05] px-2 py-1 text-meta text-ink-3">خاموش</span>}
      </header>

      {ch.adminBlocked && (
        <p className="flex items-start gap-2 rounded-card bg-danger/[.06] p-3 text-sub text-danger">
          <ShieldAlert className="mt-1 h-4 w-4 shrink-0" aria-hidden />
          این کانال توسط مدیریت بیلیارد هاب مسدود شده است{ch.blockReason ? `: ${ch.blockReason}` : ''}. برای پیگیری با پشتیبانی تماس بگیرید.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {ch.isLive ? (
          <Button variant="danger" loading={isBusy('stop')} onClick={() => void run({ action: 'stop', channelId: ch.id })}
            icon={<Square className="h-4 w-4" aria-hidden />}>پایانِ پخش</Button>
        ) : (
          <Button loading={isBusy('start')} disabled={ch.adminBlocked || (!connected && !ch.manual)} onClick={() => void run({ action: 'start', channelId: ch.id })}
            icon={<Play className="h-4 w-4" aria-hidden />}>شروعِ پخش</Button>
        )}
        <Link href={`/live/c/${ch.id}`} target="_blank"
          className="inline-flex min-h-11 items-center gap-1 rounded-field px-4 text-sub text-ink-2 hover:bg-line/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
          <ExternalLink className="h-4 w-4" aria-hidden /> صفحه‌ی تماشا
        </Link>
        <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open}
          className="ms-auto inline-flex min-h-11 items-center gap-1 rounded-field px-4 text-sub text-ink-2 hover:bg-line/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
          اتصال و تنظیمات <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        </button>
      </div>

      <p className="text-meta text-ink-3">
        ۳۰ روزِ اخیر: {faNum(ch.month.count)} پخش · {faDec(ch.month.hours)} ساعت · اوجِ {faNum(ch.month.peakViewers)} بیننده
      </p>

      {open && (
        <div className="flex flex-col gap-4">
          <IngestInfo ingestUrl={ch.ingestUrl} streamKey={ch.streamKey} busy={isBusy('rotate-key')} canRotate={connected && !ch.manual} onRotate={() => setConfirm('rotate')} />
          <div className="flex flex-wrap items-center gap-6">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sub text-ink">
              <input type="checkbox" className="h-4 w-4 accent-gold" checked={ch.access === 'members'} disabled={isBusy('update')}
                onChange={e => void run({ action: 'update', channelId: ch.id, access: e.target.checked ? 'members' : 'public' })} />
              فقط کاربرانِ عضو ببینند
            </label>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sub text-ink">
              <input type="checkbox" className="h-4 w-4 accent-gold" checked={ch.record} disabled={isBusy('update')}
                onChange={e => void run({ action: 'update', channelId: ch.id, record: e.target.checked })} />
              ضبط برای آرشیو
            </label>
            <Button variant="danger-ghost" size="sm" className="ms-auto" disabled={ch.adminBlocked} onClick={() => setConfirm('archive')}
              icon={<Trash2 className="h-4 w-4" aria-hidden />}>حذفِ کانال</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        tone={confirm === 'archive' ? 'danger' : 'gold'}
        title={confirm === 'archive' ? 'حذفِ این کانال؟' : 'ساختِ کلیدِ تازه؟'}
        body={confirm === 'archive'
          ? 'کانال و نشانیِ تماشایش حذف می‌شود و کلیدِ استریمش دیگر کار نمی‌کند. ضبط‌های قبلی در آرشیوِ سایت دیده نمی‌شوند.'
          : 'کلیدِ فعلی بلافاصله از کار می‌افتد و باید کلیدِ تازه را در OBS یا Larix وارد کنید. اگر کلید لو رفته، همین کار را بکنید.'}
        confirmLabel={confirm === 'archive' ? 'حذف' : 'کلیدِ تازه'}
        busy={isBusy('archive') || isBusy('rotate-key')}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          const ok = await run(confirm === 'archive' ? { action: 'archive', channelId: ch.id } : { action: 'rotate-key', channelId: ch.id })
          if (ok) setConfirm(null)
        }}
      />
    </article>
  )
}

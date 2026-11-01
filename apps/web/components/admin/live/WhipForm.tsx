'use client'

/* ورودیِ WebRTCِ سرویسِ پخش (WHIP) برای یک کانال — اگر آروان این را بدهد،
   «پخش با دوربینِ همین دستگاه» بی‌واسطه به آروان وصل می‌شود و رله‌ی سایت
   درگیر نمی‌شود. خالی = از راهِ رله. */

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { AdminAction } from '@/lib/streaming/admin-types'

const field = 'min-h-11 w-full rounded-field border border-line/10 bg-paper px-3 text-sub text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep'

export function WhipForm({ channelId, current, busy, run }: {
  channelId: string; current: string | null; busy: boolean; run: (a: AdminAction) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState(current ?? '')
  const [token, setToken] = useState('')

  if (!open) return (
    <button type="button" onClick={() => { setUrl(current ?? ''); setToken(''); setOpen(true) }}
      className="self-start rounded text-meta text-ink-3 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
      ورودی مرورگر (WHIP): {current ? 'تنظیم شده' : 'از راه رله'} — ویرایش
    </button>
  )

  return (
    <form className="flex flex-col gap-2" onSubmit={async e => {
      e.preventDefault()
      if (await run({ action: 'set-whip', channelId, whipUrl: url.trim(), ...(token.trim() ? { whipToken: token.trim() } : {}) })) setOpen(false)
    }}>
      <label className="flex flex-col gap-1 text-meta text-ink-3">
        نشانی WHIP (خالی = رله)
        <input className={field} dir="ltr" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://….arvanlive.ir/…/whip" />
      </label>
      <label className="flex flex-col gap-1 text-meta text-ink-3">
        توکن WHIP (اگر آروان داده؛ خالی = توکن قبلی می‌ماند)
        <input className={field} dir="ltr" value={token} onChange={e => setToken(e.target.value)} autoComplete="off" />
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={busy}>ذخیره</Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>انصراف</Button>
      </div>
    </form>
  )
}

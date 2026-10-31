'use client'

/* پنجره‌ی «دلیلِ مسدودسازی» — دلیل اجباری است: باشگاه‌دار همان را در
   پنلش می‌بیند، و در لاگِ ممیزی هم می‌نشیند. */

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'

export function ReasonDialog({ open, title, busy, onCancel, onConfirm }: {
  open: boolean; title: string; busy: boolean
  onCancel: () => void; onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const box = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { if (open) { setReason(''); window.setTimeout(() => box.current?.focus(), 0) } }, [open])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])
  if (!open) return null
  const ok = reason.trim().length >= 3

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="reason-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center"
      onClick={() => { if (!busy) onCancel() }}>
      <form className="flex w-full max-w-md flex-col gap-4 rounded-modal bg-surface p-6 shadow-e0"
        onClick={e => e.stopPropagation()}
        onSubmit={e => { e.preventDefault(); if (ok) onConfirm(reason.trim()) }}>
        <h2 id="reason-title" className="text-section text-ink">{title}</h2>
        <label className="flex flex-col gap-1 text-sub text-ink">
          دلیل (به باشگاه‌دار نشان داده می‌شود)
          <textarea ref={box} rows={3} maxLength={300} value={reason} onChange={e => setReason(e.target.value)}
            className="rounded-field border border-line/10 bg-paper p-3 text-sub focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep" />
        </label>
        <div className="flex gap-2">
          <Button type="submit" variant="danger" loading={busy} disabled={!ok}>مسدود کن</Button>
          <Button variant="ghost" disabled={busy} onClick={onCancel}>انصراف</Button>
        </div>
      </form>
    </div>
  )
}

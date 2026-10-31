'use client'

/* نشانیِ ارسال و کلیدِ استریم — همان دو چیزی که در OBS یا Larix وارد می‌شود.
   کلید پیش‌فرض پنهان است (اسکرین‌شات یا نمایشِ صفحه آن را لو ندهد). */

import { useState } from 'react'
import { Check, Copy, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

function CopyField({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) {
  const [shown, setShown] = useState(!secret)
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch { /* مرورگرِ بی‌کلیپ‌بورد: کاربر خودش انتخاب و کپی می‌کند */ setShown(true) }
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="text-meta text-ink-3">{label}</span>
      <div className="flex items-center gap-2">
        <code dir="ltr" className="min-w-0 flex-1 truncate rounded-field border border-line/10 bg-paper px-3 py-2 text-start text-meta text-ink">
          {shown ? value : '•'.repeat(Math.min(24, value.length))}
        </code>
        {secret && (
          <button type="button" onClick={() => setShown(v => !v)} aria-label={shown ? 'پنهان کردنِ کلید' : 'نمایشِ کلید'}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-field text-ink-2 hover:bg-line/[.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
            {shown ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          </button>
        )}
        <button type="button" onClick={() => void copy()} aria-label={`کپیِ ${label}`}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-field text-ink-2 hover:bg-line/[.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
          {copied ? <Check className="h-4 w-4 text-success" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        </button>
      </div>
    </div>
  )
}

export function IngestInfo({ ingestUrl, streamKey, busy, canRotate = true, onRotate }: {
  ingestUrl: string; streamKey: string | null; busy: boolean; canRotate?: boolean; onRotate: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-card bg-ink/[.03] p-4">
      <CopyField label="نشانیِ سرور (Server URL)" value={ingestUrl} />
      {streamKey
        ? <CopyField label="کلیدِ استریم (Stream Key) — به کسی ندهید" value={streamKey} secret />
        : <p className="text-sub text-ink-3">کلیدِ استریم فقط به مالکِ باشگاه نشان داده می‌شود. اگر مالک هستید و این را می‌بینید، «ساختِ کلیدِ تازه» را بزنید.</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-meta text-ink-3">
          در OBS: تنظیمات ← Stream ← Custom. در Larix: نشانیِ سرور و کلید را در یک اتصالِ RTMP وارد کنید.
        </p>
        <Button variant="secondary" size="sm" loading={busy} disabled={!canRotate} onClick={onRotate} icon={<RefreshCw className="h-4 w-4" aria-hidden />}>
          ساختِ کلیدِ تازه
        </Button>
      </div>
    </div>
  )
}

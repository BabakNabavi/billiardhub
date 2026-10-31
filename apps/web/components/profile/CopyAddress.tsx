'use client'

/* ─────────────────────────────────────────────────────────────
   نشانیِ اختصاصیِ پروفایل، کپی‌شدنی — برای هیروهایی که ProfileHero
   نیستند (صفحه‌ی بازیکن). همان رفتارِ دکمه‌ی نشانیِ ProfileHero:
   کلیک ⟵ کپی؛ اگر مرورگر اجازه نداد، متن انتخاب می‌شود.
   ───────────────────────────────────────────────────────────── */

import { Check, Link as LinkIcon } from 'lucide-react'
import { useCopyUrl } from '@/hooks/use-copy-url'

export function CopyAddress({ path, codeId, className = '' }: { path: string; codeId: string; className?: string }) {
  const display = `billiardhub.net${path}`
  const { state, copy } = useCopyUrl(codeId, `https://${display}`)
  const copied = state === 'ok'
  return (
    <>
      <button type="button" onClick={copy}
        aria-label={copied ? `آدرس اختصاصی کپی شد: ${display}` : `کپی آدرس اختصاصی: ${display}`}
        className={`inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80
          transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${className}`}>
        {copied ? <Check size={13} aria-hidden /> : <LinkIcon size={13} aria-hidden />}
        <code id={codeId} dir="ltr" className="truncate font-mono">{display}</code>
      </button>
      <span aria-live="polite" className="sr-only">
        {state === 'ok' ? 'نشانی در کلیپ‌بورد کپی شد' : state === 'manual' ? 'مرورگر اجازه‌ی کپی نداد؛ نشانی انتخاب شد' : ''}
      </span>
    </>
  )
}

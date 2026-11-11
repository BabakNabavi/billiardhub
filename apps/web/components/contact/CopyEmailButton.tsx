'use client'
import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

/* کپیِ ایمیل با بازخوردِ واقعی: «کپی شد» فقط وقتی کپی انجام شد.
   مرورگرِ بی clipboard (یا اپِ درون‌برنامه‌ای مثلِ تلگرام) به textareaِ
   پنهان و execCommand برمی‌گردد؛ textarea بیرون از جریانِ صفحه است تا
   روی iOS پرشِ اسکرول یا بازشدنِ کیبورد نسازد. */
export function CopyEmailButton({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle')

  const copy = async () => {
    let ok = false
    try {
      await navigator.clipboard.writeText(email)
      ok = true
    } catch {
      const ta = document.createElement('textarea')
      ta.value = email
      ta.readOnly = true
      ta.className = 'fixed top-0 opacity-0'
      document.body.appendChild(ta)
      ta.select()
      try { ok = document.execCommand('copy') } catch { ok = false }
      ta.remove()
    }
    setState(ok ? 'ok' : 'fail')
    window.setTimeout(() => setState('idle'), 2200)
  }

  return (
    <button type="button" onClick={copy}
      className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-body font-bold text-gold-text transition-colors duration-base hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
      {state === 'ok' ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
      <span aria-live="polite">{state === 'ok' ? 'کپی شد' : state === 'fail' ? 'کپی نشد، ایمیل را دستی بردارید' : 'کپی ایمیل'}</span>
    </button>
  )
}

'use client'

/* ─────────────────────────────────────────────────────────────
   پنجره‌ی تأیید کارهای برگشت‌ناپذیر.

   ── چرا جای `window.confirm` ──
   پنجره‌ی بومی مرورگر سه ایراد دارد که هیچ‌کدام با CSS حل نمی‌شوند:
   انگلیسی چپ‌به‌راست است، نشانی سایت را بالای خودش می‌نویسد
   («billiardhub.net می‌گوید…»)، و ظاهرش مال سیستم‌عامل است نه
   پنل. برای لحظه‌ای که کاربر باید یک کار برگشت‌ناپذیر را تأیید کند،
   این یعنی کمترین خوانایی در بدترین جا.

   ── چرا کامپوننت مشترک ──
   همین پنجره را یک‌بار برای حذف ثبت‌نام حضوری نوشتم. نسخه‌ی دوم
   یعنی دو طرح متفاوت برای یک کار، و سومی هم دیر یا زود می‌آید. حالا
   هرجای پروژه که `confirm` لازم شود از این می‌آید.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useId, useRef } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'

/* ── دسترس‌پذیری (آذرِ ۱۴۰۵، وقتی فرمِ «دلیلِ برداشتنِ نقش» داخلش نشست) ──
   عنوان و متن به پنجره وصل‌اند، فوکوس به نخستین فیلدِ متن (اگر هست) یا «انصراف»
   می‌رود، Tab داخلِ پنجره می‌چرخد، Escape انصراف است (نه وسطِ کار) و فوکوس پس
   از بسته‌شدن به همان‌جایی برمی‌گردد که بود. */
const FOCUSABLE = 'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]'

export default function ConfirmDialog({
  open, title, body, confirmLabel = 'تأیید', cancelLabel = 'انصراف',
  tone = 'danger', busy = false, onConfirm, onCancel, icon,
}: {
  open: boolean
  title: string
  /** می‌تواند JSX باشد تا بشود بخشی از متن را پررنگ کرد */
  body: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'gold'
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
  icon?: React.ReactNode
}) {
  const uid = useId()
  const boxRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  /* آخرین مقدارها برای شنونده‌ی کیبورد — بی بستنِ دوباره‌ی شنونده با هر رندر */
  const live = useRef({ busy, onCancel })
  useEffect(() => { live.current = { busy, onCancel } })

  useEffect(() => {
    if (!open) return
    const back = document.activeElement as HTMLElement | null
    const field = boxRef.current?.querySelector<HTMLElement>('textarea, input')
    ;(field ?? cancelRef.current)?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (!live.current.busy) live.current.onCancel()
        return
      }
      if (e.key !== 'Tab' || !boxRef.current) return
      const nodes = Array.from(boxRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      const first = nodes.at(0)
      const last = nodes.at(-1)
      if (!first || !last) return
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); back?.focus?.() }
  }, [open])

  if (!open) return null

  const c = tone === 'danger'
    ? { fg: '#dc2626', bg: 'rgba(239,68,68,0.09)', br: 'rgba(239,68,68,0.26)', solid: '#dc2626' }
    : { fg: '#A07840', bg: 'rgba(199,166,106,0.12)', br: 'rgba(199,166,106,0.34)', solid: '#A07840' }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby={`${uid}-t`} aria-describedby={`${uid}-d`}
      /* کلیک روی پس‌زمینه = انصراف، ولی نه وقتی کار در جریان است —
         بستن پنجره وسط درخواست یعنی کاربر نمی‌فهمد چه شد. */
      onClick={e => { if (e.target === e.currentTarget && !busy) onCancel() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(12,10,8,0.55)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 18, direction: 'rtl', fontFamily: 'var(--font-base), Vazirmatn, Tahoma, sans-serif',
        animation: 'cfd-fade .16s ease both',
      }}>
      <div ref={boxRef} style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 390,
        padding: '26px 24px 20px', textAlign: 'center',
        boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
        border: '1px solid rgba(0,0,0,0.06)',
        animation: 'cfd-pop .2s cubic-bezier(.22,1,.36,1) both',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
          background: c.bg, border: `1.5px solid ${c.br}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon ?? <AlertTriangle size={24} color={c.fg} />}
        </div>

        <div id={`${uid}-t`} style={{ fontSize: 16, fontWeight: 800, color: '#1A1A18', marginBottom: 8 }}>
          {title}
        </div>
        <div id={`${uid}-d`} style={{ fontSize: 13.5, color: '#6B7280', lineHeight: 2.05, marginBottom: 20 }}>
          {body}
        </div>

        {/* دکمه‌ی خطرناک عمدا دومی است تا با یک کلیک عادتی زده نشود */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          <button ref={cancelRef} type="button" disabled={busy} onClick={onCancel} style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '11px 14px', borderRadius: 12, fontSize: 13.5, fontWeight: 700,
            border: '1px solid rgba(0,0,0,0.12)', background: 'rgba(0,0,0,0.03)',
            color: '#6B7280', cursor: busy ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}><X size={14} /> {cancelLabel}</button>

          <button type="button" disabled={busy} onClick={onConfirm} style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '11px 14px', borderRadius: 12, fontSize: 13.5, fontWeight: 800,
            border: `1px solid ${c.solid}`, background: c.solid, color: '#fff',
            cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            opacity: busy ? 0.65 : 1,
          }}>
            {busy && <Loader2 size={14} style={{ animation: 'cfd-spin .9s linear infinite' }} />}
            {busy ? 'در حال انجام…' : confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes cfd-fade{ from{opacity:0} to{opacity:1} }
        @keyframes cfd-pop{ from{opacity:0;transform:translateY(10px) scale(.98)} to{opacity:1;transform:none} }
        @keyframes cfd-spin{ to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}

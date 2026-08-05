'use client'

/* ─────────────────────────────────────────────────────────────
   پنجره‌ی پیام — برای خطا و هشدارهایی که کاربر **باید** ببیند.

   ── چرا ──
   پیام‌های خطا تا امروز نواری بالای صفحه بودند. اگر کاربر پایینِ
   صفحه بود — که موقعِ زدنِ دکمه‌ی پرداخت همیشه هست — پیام بیرون از
   دید ظاهر می‌شد: دکمه را می‌زد، هیچ اتفاقی نمی‌افتاد، و دلیلش جایی
   بود که نمی‌دید.

   این پنجره وسطِ صفحه می‌نشیند و تا بسته نشود می‌ماند.
   ───────────────────────────────────────────────────────────── */

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

const INK = '#1C1B17', SEC = '#5B564B', LINE = '#EAE5DA'
const RED = '#B23B2E', FELT = '#0E7A38', GOLD_D = '#9A6E38'

export default function AlertDialog({
  open, onClose, title, message, tone = 'error', actionLabel, onAction,
}: {
  open: boolean
  onClose: () => void
  title?: string
  message: string
  tone?: 'error' | 'success'
  /** دکمه‌ی دوم — وقتی کاری هست که کاربر می‌تواند بکند */
  actionLabel?: string
  onAction?: () => void
}) {
  /* Escape ببندد، و بدنه پشتِ پنجره اسکرول نکند */
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', esc) }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  const c = tone === 'success' ? FELT : RED

  return createPortal(
    <div
      onClick={onClose}
      role="alertdialog" aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 1400,
        background: 'rgba(28,27,23,0.46)', backdropFilter: 'blur(3px)',
        display: 'grid', placeItems: 'center', padding: 18,
        animation: 'bhAlertIn .18s ease both',
      }}>
      <div onClick={e => e.stopPropagation()} dir="rtl" style={{
        width: '100%', maxWidth: 380, background: '#fff', borderRadius: 18,
        padding: '20px 20px 17px', fontFamily: 'var(--font-base)',
        boxShadow: '0 12px 48px rgba(28,27,23,0.22)',
        animation: 'bhAlertUp .22s cubic-bezier(.22,.9,.3,1) both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
          <span style={{
            width: 30, height: 30, borderRadius: 10, flexShrink: 0,
            display: 'grid', placeItems: 'center',
            background: tone === 'success' ? 'rgba(14,122,56,0.10)' : 'rgba(178,59,46,0.09)', color: c,
          }}>
            {tone === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          </span>
          <span style={{ flex: 1, fontSize: 14.5, fontWeight: 900, color: INK }}>
            {title ?? (tone === 'success' ? 'انجام شد' : 'انجام نشد')}
          </span>
          <button type="button" onClick={onClose} aria-label="بستن" style={{
            border: 'none', background: '#F5F3EE', color: SEC, borderRadius: 9,
            width: 28, height: 28, display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}><X size={15} /></button>
        </div>

        <p style={{ fontSize: 13, color: SEC, lineHeight: 2.05, margin: '0 0 16px' }}>{message}</p>

        <div style={{ display: 'flex', gap: 9 }}>
          {actionLabel && onAction ? (
            <button type="button" onClick={onAction} style={{
              flex: 1, border: '1px solid rgba(199,166,106,0.34)', background: 'rgba(199,166,106,0.12)',
              color: GOLD_D, borderRadius: 11, padding: '10px 16px',
              fontSize: 13, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
            }}>{actionLabel}</button>
          ) : null}
          <button type="button" onClick={onClose} style={{
            flex: actionLabel ? '0 0 auto' : 1,
            border: `1px solid ${LINE}`, background: '#fff', color: SEC, borderRadius: 11,
            padding: '10px 18px', fontSize: 13, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
          }}>باشه</button>
        </div>
      </div>

      <style>{`
        @keyframes bhAlertIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes bhAlertUp { from { transform: translateY(10px); opacity: .5 } to { transform: none; opacity: 1 } }
        @media (prefers-reduced-motion: reduce) {
          [role="alertdialog"], [role="alertdialog"] > div { animation: none !important }
        }
      `}</style>
    </div>,
    document.body,
  )
}

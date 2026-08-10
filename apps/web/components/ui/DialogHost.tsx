'use client'

/* پنجره‌ی تأیید و پیامِ کوتاه — یک‌بار در `layout` سوار می‌شود و
   هر جای سایت با `ask()` / `notify()` صدا زده می‌شود.

   ── چرا پرتالِ روی body ──
   بعضی از این پنجره‌ها از داخلِ کارتی صدا زده می‌شوند که `transform`
   یا `overflow: hidden` دارد. آن‌جا `position: fixed` به قابِ همان
   کارت محدود می‌شود و دکمه‌ها بریده می‌شوند — همان چیزی که پنجره‌ی
   گزارش تخلف را غیرقابلِ بستن کرده بود. */

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import {
  subscribe, resolveAsk, resolveText, clearToast, type DialogState, type Tone,
} from '../../lib/ui/dialogs'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

const toneOf = (t: Tone) => t === 'ok'
  ? { fg: FELT, bg: 'rgba(14,122,56,0.09)', solid: FELT }
  : t === 'gold'
    ? { fg: GOLD_D, bg: 'rgba(199,166,106,0.12)', solid: GOLD_D }
    : { fg: RED, bg: 'rgba(178,59,46,0.07)', solid: '#dc2626' }

export default function DialogHost() {
  const [s, setS] = useState<DialogState>({ ask: null, text: null, toast: null })
  const [draft, setDraft] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => subscribe(setS), [])

  /* پیام خودش می‌رود؛ ماندنش روی صفحه بعد از رفعِ مشکل گیج‌کننده است */
  useEffect(() => {
    if (!s.toast) return
    const t = setTimeout(clearToast, 6000)
    return () => clearTimeout(t)
  }, [s.toast])

  /* Escape پرسش را «نه» می‌بندد — همان رفتارِ پنجره‌ی بومی */
  useEffect(() => {
    if (!s.ask) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') resolveAsk(false) }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [s.ask])

  if (!mounted) return null

  return (
    <>
      {s.ask && createPortal(
        <div role="dialog" aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget) resolveAsk(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(20,18,14,0.5)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 18, direction: 'rtl',
          }}>
          <div style={{
            width: '100%', maxWidth: 430, background: '#fff', borderRadius: 20,
            border: `1px solid ${LINE}`, padding: 'clamp(20px,4vw,26px)',
            fontFamily: 'var(--font-base)', boxShadow: '0 24px 60px rgba(20,18,14,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 16 }}>
              <span style={{
                display: 'inline-flex', width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                alignItems: 'center', justifyContent: 'center',
                background: toneOf(s.ask.tone ?? 'danger').bg,
                color: toneOf(s.ask.tone ?? 'danger').fg,
              }}><AlertTriangle size={18} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 15.5, fontWeight: 900, color: INK, margin: 0, lineHeight: 1.75 }}>
                  {s.ask.title}
                </h3>
                {s.ask.body && (
                  <p style={{ fontSize: 12.5, color: MUT, margin: '7px 0 0', lineHeight: 2 }}>
                    {s.ask.body}
                  </p>
                )}
              </div>
            </div>
            {/* دکمه‌ی خطرناک دوم است: کلیکِ بی‌فکر روی اولی نباید کارِ
                برگشت‌ناپذیر انجام دهد. */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => resolveAsk(false)} style={{
                flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${LINE}`,
                background: '#F4F3F1', color: SEC, fontSize: 13.5, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>انصراف</button>
              <button type="button" onClick={() => resolveAsk(true)} style={{
                flex: 1, padding: 12, borderRadius: 12, border: 'none',
                background: toneOf(s.ask.tone ?? 'danger').solid, color: '#fff',
                fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              }}>{s.ask.confirmLabel ?? 'تأیید'}</button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* پرسشِ متنی — جایی که فقط «بله/خیر» کافی نیست و متن لازم است */}
      {s.text && createPortal(
        <div role="dialog" aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget) { setDraft(''); resolveText(null) } }}
          style={{
            position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(20,18,14,0.5)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 18, direction: 'rtl',
          }}>
          <div style={{
            width: '100%', maxWidth: 460, background: '#fff', borderRadius: 20,
            border: `1px solid ${LINE}`, padding: 'clamp(20px,4vw,26px)',
            fontFamily: 'var(--font-base)', boxShadow: '0 24px 60px rgba(20,18,14,0.3)',
          }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 900, color: INK, margin: '0 0 6px', lineHeight: 1.75 }}>
              {s.text.title}
            </h3>
            {s.text.body && (
              <p style={{ fontSize: 12.5, color: MUT, margin: '0 0 14px', lineHeight: 2 }}>{s.text.body}</p>
            )}
            <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={3}
              placeholder={s.text.placeholder}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12,
                border: `1px solid ${LINE}`, fontSize: 13, fontFamily: 'inherit',
                outline: 'none', resize: 'vertical', lineHeight: 2, color: INK,
              }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button type="button" onClick={() => { setDraft(''); resolveText(null) }} style={{
                flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${LINE}`,
                background: '#F4F3F1', color: SEC, fontSize: 13.5, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>انصراف</button>
              <button type="button" disabled={!draft.trim()}
                onClick={() => { const v = draft.trim(); setDraft(''); resolveText(v) }} style={{
                  flex: 1, padding: 12, borderRadius: 12, border: 'none',
                  background: draft.trim() ? '#dc2626' : 'rgba(0,0,0,0.12)',
                  color: draft.trim() ? '#fff' : 'rgba(0,0,0,0.35)',
                  fontSize: 13.5, fontWeight: 800, fontFamily: 'inherit',
                  cursor: draft.trim() ? 'pointer' : 'not-allowed',
                }}>{s.text.confirmLabel}</button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {s.toast && createPortal(
        <div key={s.toast.id} style={{
          position: 'fixed', insetInline: 0, bottom: 'calc(22px + env(safe-area-inset-bottom))', margin: '0 auto', zIndex: 5000,
          width: 'fit-content', maxWidth: 'calc(100% - 32px)', direction: 'rtl',
          display: 'flex', alignItems: 'center', gap: 9,
          background: '#1A1A18', color: '#fff', borderRadius: 12,
          padding: '11px 16px', fontSize: 13, fontWeight: 700,
          fontFamily: 'var(--font-base)', boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        }}>
          {s.toast.tone === 'ok' ? <CheckCircle2 size={15} color="#7ED9A0" />
            : s.toast.tone === 'gold' ? <Info size={15} color="#E8CE96" />
            : <AlertTriangle size={15} color="#FCA5A5" />}
          <span style={{ lineHeight: 1.85 }}>{s.toast.msg}</span>
          <button type="button" onClick={clearToast} aria-label="بستن" style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)',
            cursor: 'pointer', padding: 2, display: 'flex',
          }}><X size={14} /></button>
        </div>,
        document.body,
      )}
    </>
  )
}

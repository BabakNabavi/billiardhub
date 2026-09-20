'use client'

/* پنجره‌ی تأیید و پیام کوتاه — یک‌بار در `layout` سوار می‌شود و
   هر جای سایت با `ask()` / `notify()` صدا زده می‌شود.

   ── چرا پرتال روی body ──
   بعضی از این پنجره‌ها از داخل کارتی صدا زده می‌شوند که `transform`
   یا `overflow: hidden` دارد. آن‌جا `position: fixed` به قاب همان
   کارت محدود می‌شود و دکمه‌ها بریده می‌شوند — همان چیزی که پنجره‌ی
   گزارش تخلف را غیرقابل بستن کرده بود. */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import {
  subscribe, resolveAsk, resolveText, resolveAlert, clearToast,
  type DialogState, type Tone,
} from '../../lib/ui/dialogs'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#6F6A5C', LINE = '#EAE5DA'
const GOLD_D = '#8F6531', FELT = '#0E7A38', RED = '#B23B2E'

/* ⚠️ `solid`ِ حالتِ خطا از `#dc2626` به قرمزِ خودِ پالت (`RED`)
   آمد: آن قرمزِ خام روی کارتِ سفید یک بلوکِ فریادزن می‌ساخت، و
   رنگِ پروژه نبود. `line` و `ring` برای حلقه‌ی آیکون و فوکوس. */
const toneOf = (t: Tone) => t === 'ok'
  ? { fg: FELT, bg: 'rgba(14,122,56,0.09)', line: 'rgba(14,122,56,0.20)', solid: FELT, ring: 'rgba(14,122,56,0.30)' }
  : t === 'gold'
    ? { fg: GOLD_D, bg: 'rgba(199,166,106,0.12)', line: 'rgba(199,166,106,0.30)', solid: GOLD_D, ring: 'rgba(199,166,106,0.40)' }
    : { fg: RED, bg: 'rgba(178,59,46,0.08)', line: 'rgba(178,59,46,0.20)', solid: RED, ring: 'rgba(178,59,46,0.34)' }

export default function DialogHost() {
  const [s, setS] = useState<DialogState>({ ask: null, text: null, alert: null, toast: null })
  /* ⚠️ فوکوس باید داخلِ پنجره برود وگرنه صفحه‌خوان همان‌جای قبلی
     می‌ماند و کاربرِ کیبورد اول باید کلِ صفحه را Tab بزند — دقیقا
     همان «بالا و پایین کردنِ صفحه» که این پنجره برای حذفش آمده. */
  const alertOk = useRef<HTMLButtonElement>(null)
  const [draft, setDraft] = useState('')
  /* ⚠️ ویرایش یعنی اصلاحِ متنِ فعلی، نه تایپِ دوباره‌ی آن. کلیدِ
     وابستگی خودِ شیءِ پرسش است تا هر بار که پنجره باز می‌شود
     کادر با مقدارِ همان بار پر شود. */
  useEffect(() => { if (s.text) setDraft(s.text.initial ?? '') }, [s.text])
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => subscribe(setS), [])

  /* پیام خودش می‌رود؛ ماندنش روی صفحه بعد از رفع مشکل گیج‌کننده است */
  useEffect(() => {
    if (!s.toast) return
    const t = setTimeout(clearToast, 6000)
    return () => clearTimeout(t)
  }, [s.toast])

  useEffect(() => {
    if (!s.alert) return
    /* ⚠️ جایی که بودیم را نگه می‌داریم: بدونِ برگرداندنِ فوکوس،
       کاربرِ کیبورد بعد از بستنِ پنجره روی `body` رها می‌شود و باید
       از اولِ صفحه Tab بزند — همان «بالا و پایین کردنِ صفحه» که این
       پنجره برای حذفش آمده. */
    const prev = document.activeElement as HTMLElement | null
    alertOk.current?.focus()

    /* قفلِ اسکرول — پشتِ پرده‌ی مات، صفحه نباید بلغزد (در PWAِ iOS
       خیلی محسوس است). */
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { resolveAlert(); return }
      /* تله‌ی فوکوس: تنها عنصرِ فوکوس‌پذیرِ این پنجره همان دکمه است،
         پس جلوگیری از Tab کافی است. `aria-modal` فقط به صفحه‌خوان
         می‌گوید؛ خودِ Tab را نمی‌گیرد. */
      if (e.key === 'Tab') { e.preventDefault(); alertOk.current?.focus() }
    }
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('keydown', key)
      document.body.style.overflow = prevOverflow
      prev?.focus()
    }
  }, [s.alert])

  /* Escape پرسش را «نه» می‌بندد — همان رفتار پنجره‌ی بومی */
  useEffect(() => {
    /* ⚠️ وقتی پیامِ مسدودکننده رویش باز است، Escape مالِ اوست: بدونِ
       این قید یک بار زدنِ Escape هم پیام را می‌بست هم پرسشِ زیرش را
       بی‌صدا «نه» می‌کرد. */
    if (!s.ask || s.alert) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') resolveAsk(false) }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [s.ask, s.alert])

  if (!mounted) return null

  return (
    <>
      <style>{`
        .bh-alert-ok { transition: filter .16s ease, box-shadow .16s ease }
        .bh-alert-ok:hover { filter: brightness(1.08) }
        .bh-alert-ok:focus-visible { box-shadow: 0 0 0 4px var(--bh-ring) }
        @keyframes bhAlertIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes bhAlertPop {
          from { opacity: 0; transform: translateY(14px) scale(.96) }
          to   { opacity: 1; transform: none }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-bh-alert], [data-bh-alert] > div { animation: none !important }
        }
      `}</style>

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
            {/* دکمه‌ی خطرناک دوم است: کلیک بی‌فکر روی اولی نباید کار
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

      {/* پرسش متنی — جایی که فقط «بله/خیر» کافی نیست و متن لازم است */}
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
              {/* ⚠️ ‏با `allowEmpty` مقدارِ خالی هم نتیجه است. بدونِ آن،
                  «پاک‌کردنِ کپشن» و «بیرون‌آوردن از آلبوم» ممکن نبود:
                  تنها راهِ خروج با کادرِ خالی، انصراف بود که `null`
                  می‌دهد و تغییری ثبت نمی‌کند. */}
              {(() => {
                const okEmpty = s.text!.allowEmpty === true
                const ready = okEmpty || !!draft.trim()
                const danger = s.text!.tone !== 'gold'
                return (
                  <button type="button" disabled={!ready}
                    onClick={() => { const v = draft.trim(); setDraft(''); resolveText(v) }} style={{
                      flex: 1, padding: 12, borderRadius: 12, border: 'none',
                      background: ready ? (danger ? '#dc2626' : '#C7A66A') : 'rgba(0,0,0,0.12)',
                      color: ready ? (danger ? '#fff' : '#1A1408') : 'rgba(0,0,0,0.35)',
                      fontSize: 13.5, fontWeight: 800, fontFamily: 'inherit',
                      cursor: ready ? 'pointer' : 'not-allowed',
                    }}>{s.text!.confirmLabel}</button>
                )
              })()}
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ── پیامِ مسدودکننده ──
          یک دکمه، چون چیزی برای تصمیم‌گرفتن نیست. نوار رنگیِ بالا و
          حلقه‌ی دورِ آیکون از همان `tone` می‌آیند، پس خطا و تأیید
          از یک نگاه فرق دارند. */}
      {s.alert && createPortal(
        <div role="alertdialog" aria-modal="true" aria-labelledby="bh-alert-title"
          aria-describedby={s.alert.body ? 'bh-alert-body' : undefined}
          onClick={e => { if (e.target === e.currentTarget) resolveAlert() }}
          data-bh-alert
          style={{
            position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(20,18,14,0.5)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 18, direction: 'rtl', animation: 'bhAlertIn .18s ease-out both',
          }}>
          <div style={{
            width: '100%', maxWidth: 430, background: '#fff', borderRadius: 20,
            border: `1px solid ${LINE}`, overflow: 'hidden',
            fontFamily: 'var(--font-base)',
            boxShadow: '0 1px 2px rgba(20,18,14,0.06), 0 24px 64px rgba(20,18,14,0.26)',
            animation: 'bhAlertPop .22s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            <div style={{ padding: 'clamp(20px,4vw,26px)', textAlign: 'center' }}>
              <span style={{
                display: 'inline-flex', width: 54, height: 54, borderRadius: '50%',
                alignItems: 'center', justifyContent: 'center', marginBottom: 18,
                background: toneOf(s.alert.tone).bg,
                color: toneOf(s.alert.tone).fg,
                border: `1px solid ${toneOf(s.alert.tone).line}`,
              }}>
                {s.alert.tone === 'ok' ? <CheckCircle2 size={24} />
                  : s.alert.tone === 'gold' ? <Info size={24} />
                  : <AlertTriangle size={24} />}
              </span>
              <h3 id="bh-alert-title" style={{
                fontSize: 16, fontWeight: 900, color: INK, margin: 0, lineHeight: 1.85,
              }}>{s.alert.title}</h3>
              {s.alert.body && (
                <p id="bh-alert-body" style={{
                  fontSize: 13, color: MUT, margin: '9px 0 0', lineHeight: 2,
                }}>{s.alert.body}</p>
              )}
              {/* ⚠️ حلقه‌ی فوکوس با `boxShadow` کشیده می‌شود نه
                  `outline`: دکمه از لحظه‌ی باز شدنِ پنجره فوکوس
                  می‌گیرد (قاعده‌ی alertdialog) و حلقه‌ی پیش‌فرضِ
                  مرورگر روی دکمه‌ی رنگی مثل یک قابِ تیره دیده
                  می‌شد. */}
              <button ref={alertOk} type="button" onClick={resolveAlert} className="bh-alert-ok" style={{
                width: '100%', marginTop: 22, padding: '13px 16px', borderRadius: 13,
                border: 'none', outline: 'none',
                background: toneOf(s.alert.tone).solid, color: '#fff',
                fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                '--bh-ring': toneOf(s.alert.tone).ring,
              } as React.CSSProperties & Record<'--bh-ring', string>}>{s.alert.okLabel}</button>
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

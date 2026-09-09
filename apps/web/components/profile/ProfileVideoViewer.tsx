'use client'

/* ─────────────────────────────────────────────────────────────
   نمای تمام‌صفحه‌ی ویدیوی پروفایل.

   ── چرا لازم شد ──
   ⚠️ ویدیو تا امروز داخل خانه‌ی ۱۱۶ پیکسلی شبکه پخش می‌شد. یعنی
   فیلم در قاب بندانگشتی اجرا می‌شد و نوار کنترل مرورگر — که
   ارتفاع ثابت دارد — نصف همان مربع را می‌گرفت؛ کاربر درست گفت
   «نصفش نوشته است». کلیک باید مثل عکس، نمای تمام‌صفحه باز کند.

   ── چرا از `ImageLightbox` استفاده نمی‌کند ──
   آن کامپوننت بر پایه‌ی `<img>` و پیمایش بین چند تصویر ساخته شده
   (کشیدن انگشت، پیش/بعد). ویدیو نه پیمایش می‌خواهد نه کشیدن — و
   کشیدن روی ویدیو با نوار زمان خودش تداخل دارد. ولی رفتارهای
   «پنجره‌ی تمام‌صفحه» عینا از همان‌جا آمده‌اند: Escape، قفل اسکرول،
   دکمه‌ی بازگشت گوشی، و برگرداندن فوکوس.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react'
import { X, Trash2, Pencil } from 'lucide-react'

export interface ViewerVideo { url?: string; thumbnail?: string; title?: string }

export function useProfileVideoViewer() {
  const [state, setState] = useState<{
    v: ViewerVideo
    onDelete?: () => void | Promise<void>
    onEdit?: () => void
  } | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  /* عنصری که پیش از باز شدن پنجره فوکوس داشت — باید به آن برگردد */
  const prevFocus = useRef<HTMLElement | null>(null)

  const open = useCallback((v: ViewerVideo, opts?: {
    onDelete?: () => void | Promise<void>
    /** ویرایش عنوان/دسته — فقط برای صاحب ویدیو */
    onEdit?: () => void
  }) => {
    /* ردیف قدیمی فقط بندانگشتی دارد و چیزی برای پخش نیست. خانه‌ی
       شبکه هم برای همین‌ها دکمه نمی‌سازد؛ این گارد تور دوم است. */
    if (!v.url) return
    prevFocus.current = document.activeElement as HTMLElement | null
    setState({ v, onDelete: opts?.onDelete, onEdit: opts?.onEdit })
  }, [])

  const close = useCallback(() => setState(null), [])

  useEffect(() => {
    if (!state) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); return }
      /* `aria-modal` بدون تله‌ی فوکوس یعنی Tab پشت روکش می‌رود */
      if (e.key !== 'Tab') return
      const items = boxRef.current?.querySelectorAll<HTMLElement>('button, video')
      if (!items?.length) return
      const first = items[0]!, last = items[items.length - 1]!
      const cur = document.activeElement
      if (e.shiftKey && (cur === first || !boxRef.current?.contains(cur))) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && cur === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    /* قفل اسکرول پس‌زمینه — وگرنه صفحه زیر روکش تکان می‌خورد */
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      prevFocus.current?.focus?.()
    }
  }, [state, close])

  /* دکمه‌ی بازگشت گوشی باید پنجره را ببندد، نه صفحه را عوض کند —
     همان کاری که `ImageLightbox` می‌کند. در PWA نصب‌شده این تنها
     راه بستن با ژست کاربر است. */
  useEffect(() => {
    if (!state) return
    let pushed = false
    try { history.pushState({ bhVideo: true }, ''); pushed = true } catch { /* اجازه نداد */ }
    const pop = () => close()
    window.addEventListener('popstate', pop)
    return () => {
      window.removeEventListener('popstate', pop)
      if (pushed && (history.state as { bhVideo?: boolean } | null)?.bhVideo) history.back()
    }
  }, [state, close])

  const viewer = state ? (
    <div className="pvv-back" role="dialog" aria-modal="true" ref={boxRef}
      aria-label={state.v.title ? `ویدیو: ${state.v.title}` : 'ویدیو'}
      onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div className="pvv-bar">
        {state.onEdit && (
          /* ⚠️ پنجره بسته می‌شود: فرم ویرایش خودش یک پنجره‌ی مودال است
             و دو مودال روی هم، تله‌ی فوکوس را می‌شکند. */
          <button type="button" className="pvv-btn"
            onClick={() => { const go = state.onEdit; close(); go?.() }}
            aria-label="ویرایش عنوان و دسته‌بندی">
            <Pencil size={17} aria-hidden />
          </button>
        )}
        {state.onDelete && (
          /* ⚠️ بعد از حذف باید بسته شود: نسخه‌ی اول باز می‌ماند و روی
             نشانی حذف‌شده پخش می‌کرد؛ کلیک دوم هم یک ذخیره‌ی دیگر
             می‌فرستاد. */
          <button type="button" className="pvv-btn pvv-del"
            onClick={async () => { await state.onDelete?.(); close() }}
            aria-label="حذف این ویدیو">
            <Trash2 size={18} aria-hidden />
          </button>
        )}
        <button ref={closeRef} type="button" className="pvv-btn" onClick={close} aria-label="بستن">
          <X size={20} aria-hidden />
        </button>
      </div>
      {/* ویدیوی آپلودی کاربر است و زیرنویسی همراهش نیست */}
      <video className="pvv-video" src={state.v.url} poster={state.v.thumbnail || undefined}
        controls autoPlay playsInline />
      {state.v.title && <p className="pvv-title">{state.v.title}</p>}
    </div>
  ) : null

  return { open, viewer, isOpen: state !== null }
}

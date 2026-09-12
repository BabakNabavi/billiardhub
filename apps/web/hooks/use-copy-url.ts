'use client'

/* ─────────────────────────────────────────────────────────────
   کپیِ نشانیِ عمومیِ پروفایل.

   ⚠️ این منطق پیش از این چهار بار کپی شده بود (مربی، داور،
   ProfileHero، و صفحه‌ی متخصص). قاعده‌ی ۲ پروژه دوباره‌نویسی را
   باگ می‌داند، پس نسخه‌ی معتبر همین‌جاست.

   ⚠️ `navigator.clipboard` روی http — همان مسیرِ تستِ گوشی روی
   شبکه‌ی محلی — و در سافاریِ قدیمی وجود ندارد. نسخه‌های قبلی در آن
   حالت بی‌صدا `return` می‌کردند: دکمه فشرده می‌شد و هیچ اتفاقی
   نمی‌افتاد. این‌جا نشانی *انتخاب* می‌شود تا کاربر با Ctrl/⌘+C
   خودش بردارد، و وضعیت `manual` برمی‌گردد تا رابط بگوید چه شد.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react'

export type CopyState = 'idle' | 'ok' | 'manual'

export function useCopyUrl(codeId: string, url: string) {
  const [state, setState] = useState<CopyState>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* تایمرِ قبلی هر بار پاک می‌شود: با دو کلیکِ پشت‌هم، تایمرِ اول
     پیامِ کلیکِ دوم را زودتر خاموش می‌کرد. */
  const flash = useCallback((v: Exclude<CopyState, 'idle'>) => {
    setState(v)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 2200)
  }, [])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const selectUrl = useCallback(() => {
    const el = document.getElementById(codeId)
    if (!el || typeof window.getSelection !== 'function') return
    const r = document.createRange()
    r.selectNodeContents(el)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(r)
  }, [codeId])

  const copy = useCallback(async () => {
    if (!navigator.clipboard?.writeText) { selectUrl(); flash('manual'); return }
    try { await navigator.clipboard.writeText(url); flash('ok') }
    catch { selectUrl(); flash('manual') }
  }, [url, selectUrl, flash])

  return { state, copy }
}

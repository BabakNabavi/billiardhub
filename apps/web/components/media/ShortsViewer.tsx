'use client'

/* ─────────────────────────────────────────────────────────────
   نمایشگرِ عمودیِ Shorts.

   ⚠️ فقط کنش‌هایی هست که پشتوانه دارند: رفتن به بعدی/قبلی، صدا،
   و هم‌رسانی. لایک، کامنت و دنبال‌کردن جدول ندارند و دکمه‌ی
   بی‌کارکرد گذاشته نشد — دکمه‌ای که چیزی ذخیره نمی‌کند بدتر از
   نبودنش است.

   ⚠️ فقط ویدیوی *فعال* در DOM است. سه پلیرِ هم‌زمان روی گوشیِ ضعیف
   یعنی سه رمزگشای ویدیو؛ همان چیزی که مرورگرِ موبایل را می‌خواباند.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react'
import { X, ChevronUp, ChevronDown, Volume2, VolumeX, Link2, Check } from 'lucide-react'
import type { MediaVideo } from '../../lib/media-data'
import { compactViews } from '../../lib/media-data'
import { absoluteUrl } from '../../lib/site-url'

export default function ShortsViewer({
  items, start = 0, onClose,
}: { items: MediaVideo[]; start?: number; onClose: () => void }) {
  const [i, setI] = useState(start)
  const [muted, setMuted] = useState(true)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLVideoElement>(null)
  const v = items[i]

  const go = useCallback((d: number) => {
    setI(x => Math.min(items.length - 1, Math.max(0, x + d)))
  }, [items.length])

  /* ⚠️ قفلِ اسکرولِ بدنه: بدونِ آن، اسکرولِ روی نمایشگر صفحه‌ی زیرش
     را می‌برد و بعد از بستن، کاربر جای دیگری از فهرست است. */
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  /* ⚠️ `aria-modal` بدونِ دامِ فوکوس فقط یک ادعاست: کاربرِ صفحه‌کلید
     با Tab از پشتِ پوشش سر درمی‌آورد و بعد از بستن هم نمی‌داند
     کجاست. همان الگوی `ChannelGate` در همین پوشه. */
  const boxRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    boxRef.current?.querySelector<HTMLElement>('button')?.focus()
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !boxRef.current) return
      const f = boxRef.current.querySelectorAll<HTMLElement>('button:not(:disabled)')
      if (f.length === 0) return
      const first = f[0]!, last = f[f.length - 1]!
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onTab)
    return () => { document.removeEventListener('keydown', onTab); prev?.focus() }
  }, [])

  useEffect(() => {
    /* ⚠️ فقط بالا/پایین. نگاشتِ افقی در RTL برعکس می‌شود و «بعدی»
       سمتِ چپ است — ابهامش بیشتر از فایده‌اش. */
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowDown') { e.preventDefault(); go(1) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); go(-1) }
      else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault()
        const el = ref.current
        if (el) { el.paused ? void el.play() : el.pause() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose])

  /* چرخِ ماوس و کشیدنِ انگشت = ویدیوی بعدی */
  const wheelLock = useRef(0)
  const onWheel = (e: React.WheelEvent) => {
    const now = Date.now()
    if (now - wheelLock.current < 420) return
    if (Math.abs(e.deltaY) < 24) return
    wheelLock.current = now
    go(e.deltaY > 0 ? 1 : -1)
  }
  const touchY = useRef(0)
  const onTouchStart = (e: React.TouchEvent) => { touchY.current = e.touches[0]?.clientY ?? 0 }
  const onTouchEnd = (e: React.TouchEvent) => {
    const dy = (e.changedTouches[0]?.clientY ?? 0) - touchY.current
    if (Math.abs(dy) > 55) go(dy < 0 ? 1 : -1)
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.currentTime = 0
    void el.play().catch(() => { /* پخشِ خودکار رد شد — کاربر می‌زند */ })
    /* ⚠️ با هر سوایپ، `key` عنصرِ ویدیو را عوض می‌کند و عنصرِ قبلی
       جدا می‌شود ولی رمزگشا و اتصالِ شبکه‌اش را نگه می‌دارد. روی
       اندرویدِ ضعیف چند سوایپ کافی است تا پخش بلرزد. */
    return () => { el.pause(); el.removeAttribute('src'); el.load() }
  }, [i])

  const copy = async () => {
    if (!v) return
    try {
      await navigator.clipboard.writeText(absoluteUrl(`/media/${encodeURIComponent(v.id)}`))
      setCopied(true); window.setTimeout(() => setCopied(false), 1600)
    } catch { /* اجازه نبود */ }
  }

  if (!v) return null

  return (
    <div
      ref={boxRef}
      className="mx-sv" role="dialog" aria-modal="true" aria-label="ویدیوهای کوتاه"
      onWheel={onWheel} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
    >
      <div className="mx-sv-stage">
        <video
          ref={ref} key={v.id} src={v.src} poster={v.thumb || undefined}
          muted={muted} loop playsInline controls={false} preload="metadata"
          onClick={() => { const el = ref.current; if (el) { el.paused ? void el.play() : el.pause() } }}
        />

        <button className="mx-sv-close" type="button" onClick={onClose} aria-label="بستن">
          <X size={20} />
        </button>

        <div className="mx-sv-nav">
          <button type="button" onClick={() => go(-1)} disabled={i === 0} aria-label="قبلی">
            <ChevronUp size={20} />
          </button>
          <button type="button" onClick={() => go(1)} disabled={i >= items.length - 1} aria-label="بعدی">
            <ChevronDown size={20} />
          </button>
          <button type="button" onClick={() => setMuted(m => !m)} aria-label={muted ? 'باصدا' : 'بی‌صدا'}>
            {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>
          <button type="button" onClick={copy} aria-label="کپی نشانی">
            {copied ? <Check size={19} /> : <Link2 size={19} />}
          </button>
        </div>

        <div className="mx-sv-meta">
          <h2>{v.title}</h2>
          <p>
            {v.creator.name}
            {v.views > 0 && ` · ${compactViews(v.views)} بازدید`}
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

/* ─────────────────────────────────────────────────────────────
   ابزارهای صفحه‌ی خبر: نوارِ پیشرفتِ مطالعه، اشتراک‌گذاری، و ثبتِ
   بازدیدِ واقعی.

   ⚠️ تنها تکه‌ی کلاینتیِ صفحه‌ی خبر است. متنِ خبر روی سرور رندر
   می‌شود و این کامپوننت هیچ محتوایی نمی‌سازد — فقط ابزار.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import { Link2, Check, Send } from 'lucide-react'

/* ── ثبتِ بازدید ──
   ⚠️ یک‌بار در هر نشست برای هر خبر. بدونِ این گارد، رفرشِ صفحه و
   برگشتِ کاربر عدد را باد می‌کند و «پربازدیدترین‌ها» به یک فهرستِ
   بی‌معنا تبدیل می‌شود. */
function useViewPing(id: string) {
  useEffect(() => {
    if (!id) return
    const key = `nr:v:${id}`
    try { if (sessionStorage.getItem(key)) return } catch { /* حالتِ خصوصی */ }

    /* ⚠️ بعد از یک مکث، نه در لحظه‌ی باز شدن: بازکردن و بستنِ فوری
       «خواندن» نیست. ۸ ثانیه مرزِ محافظه‌کارانه‌ای است. */
    const t = window.setTimeout(() => {
      try { sessionStorage.setItem(key, '1') } catch { /* بی‌اهمیت */ }
      void fetch('/api/news/view', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
        keepalive: true,
      }).catch(() => { /* شمارنده مهم‌تر از صفحه نیست */ })
    }, 8000)
    return () => window.clearTimeout(t)
  }, [id])
}

/* ── نوارِ پیشرفتِ مطالعه ── */
function useProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    const el = document.getElementById('nr-body')
    if (!el) return
    let raf = 0
    const calc = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const total = r.height - window.innerHeight
      if (total <= 0) { setP(0); return }
      setP(Math.min(1, Math.max(0, -r.top / total)))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(calc) }
    calc()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return p
}

export default function ArticleTools({ id, title, url }: { id: string; title: string; url: string }) {
  useViewPing(id)
  const p = useProgress()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch { /* اجازه‌ی کلیپ‌بورد نبود */ }
  }

  return (
    <>
      {/* ⚠️ `aria-hidden`: عددِ درصدِ اسکرول برای صفحه‌خوان نویز است،
          نه اطلاعات. */}
      <div className="nr-progress" aria-hidden>
        <span style={{ transform: `scaleX(${p})` }} />
      </div>

      <div className="nr-share">
        <span className="nr-share-l">هم‌رسانی</span>
        <a
          className="nr-share-b"
          href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
          target="_blank" rel="noopener noreferrer"
        >
          <Send size={14} aria-hidden /> تلگرام
        </a>
        <a
          className="nr-share-b"
          href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
          target="_blank" rel="noopener noreferrer"
        >
          واتساپ
        </a>
        <button className="nr-share-b" type="button" onClick={copy}>
          {copied ? <><Check size={14} aria-hidden /> کپی شد</> : <><Link2 size={14} aria-hidden /> کپی نشانی</>}
        </button>
        {/* ⚠️ تغییرِ متنِ دکمه برای صفحه‌خوان اعلام نمی‌شود */}
        <span className="nr-sr" role="status" aria-live="polite">{copied ? 'نشانی کپی شد' : ''}</span>
      </div>
    </>
  )
}

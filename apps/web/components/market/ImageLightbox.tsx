'use client'

/* ─────────────────────────────────────────────────────────────
   نمایِ تمام‌صفحه‌ی تصویرهای محصول.

   ── چرا لازم بود ──
   عکسِ آگهی در کادرِ کوچکِ صفحه‌ی محصول با `object-fit: cover` بریده
   می‌شود. خریداری که می‌خواهد خط‌وخشِ یک چوبِ دستِ‌دوم را ببیند،
   دقیقاً همان جزئیاتی را نمی‌بیند که تصمیمش به آن بند است — و هیچ
   راهی هم برای بزرگ‌کردنش نداشت.

   ── تصمیم‌های ریز که تجربه را می‌سازند ──
   · تصویر `contain` است نه `cover`: در نمای تمام‌صفحه بریدنِ عکس
     یعنی همان مشکلِ اول، یک پله بزرگ‌تر.
   · کشیدنِ افقی بینِ عکس‌ها جابه‌جا می‌کند؛ روی گوشی این طبیعی‌ترین
     حرکت است و دکمه‌ها فقط برای دسکتاپ‌اند.
   · قفلِ اسکرولِ پس‌زمینه، وگرنه کشیدنِ عمودی صفحه‌ی زیرین را
     می‌لغزاند و بستنِ نما کاربر را جای دیگری رها می‌کند.
   · دکمه‌ی بازگشتِ گوشی هم نما را می‌بندد، نه اینکه از صفحه‌ی محصول
     بیرون بیندازد. یک `pushState` روی همان نشانی، بدونِ ناوبری.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

const GOLD = '#C7A66A'
const GOLD_D = '#9A6E38'
const INK = '#1C1C1A'
const HAIR = 'rgba(28,28,26,0.10)'
const MUT = 'rgba(28,28,26,0.45)'

const toFa = (v: string | number) => String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)

export default function ImageLightbox({
  images, index, alt = '', onIndex, onClose,
}: {
  images: string[]
  index: number
  alt?: string
  onIndex: (i: number) => void
  onClose: () => void
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const total = images.length
  const at = Math.min(Math.max(index, 0), Math.max(0, total - 1))

  /* آخرین مقدارها در ref می‌مانند تا شنونده‌ها یک‌بار بسته شوند و
     بازهم مقدارِ تازه را ببینند — وگرنه هر تغییرِ تصویر، شنونده‌ی
     کیبورد و popstate را از نو می‌بندد. */
  const st = useRef({ at, total, onIndex, onClose })
  st.current = { at, total, onIndex, onClose }

  const go = (d: number) => {
    const { at: cur, total: n, onIndex: set } = st.current
    if (n < 2) return
    set((cur + d + n) % n)
  }

  /* قفلِ اسکرول + کلیدها */
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') st.current.onClose()
      /* در چیدمانِ راست‌به‌چپ هم جهتِ کلیدها همان چیزی است که روی
         صفحه‌کلید نوشته شده: چپ یعنی عکسِ بعدی. */
      else if (e.key === 'ArrowLeft') go(1)
      else if (e.key === 'ArrowRight') go(-1)
    }
    window.addEventListener('keydown', key)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', key)
    }
  }, [])

  /* دکمه‌ی بازگشتِ گوشی نما را می‌بندد */
  useEffect(() => {
    let pushed = false
    try {
      history.pushState({ bhLightbox: true }, '')
      pushed = true
    } catch { /* بعضی مرورگرها در حالتِ خاص اجازه نمی‌دهند */ }

    const pop = () => { st.current.onClose() }
    window.addEventListener('popstate', pop)
    return () => {
      window.removeEventListener('popstate', pop)
      /* اگر نما با X یا Escape بسته شد، آن ورودیِ تاریخچه باید برداشته
         شود؛ وگرنه یک‌بار «بازگشت» هیچ‌کاری نمی‌کند. */
      if (pushed && (history.state as { bhLightbox?: boolean } | null)?.bhLightbox) history.back()
    }
  }, [])

  /* کشیدنِ افقی */
  const touch = useRef<{ x: number; y: number } | null>(null)
  const onStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    if (t) touch.current = { x: t.clientX, y: t.clientY }
  }
  const onEnd = (e: React.TouchEvent) => {
    const s = touch.current
    const t = e.changedTouches[0]
    touch.current = null
    if (!s || !t) return
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    /* حرکتِ عمودی نباید سهواً عکس را عوض کند */
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return
    go(dx < 0 ? 1 : -1)
  }

  if (!mounted || total === 0) return null

  return createPortal(
    <div
      role="dialog" aria-modal="true" aria-label="تصاویر محصول"
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: '#fff',
        direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif',
        display: 'flex', flexDirection: 'column',
        animation: 'bhLbIn .18s ease both',
      }}>

      {/* سربرگ — ضربدر یک گوشه، عنوان گوشه‌ی دیگر */}
      <div style={{
        flexShrink: 0, height: 56, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 14px',
        borderBottom: `1px solid ${HAIR}`,
      }}>
        <button type="button" onClick={onClose} aria-label="بستن"
          style={{
            width: 40, height: 40, borderRadius: 12, border: 'none',
            background: 'transparent', color: INK, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <X size={24} strokeWidth={2.2} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 800, color: INK }}>تصاویر</span>
      </div>

      {/* تصویر */}
      <div
        onTouchStart={onStart} onTouchEnd={onEnd}
        style={{
          flex: 1, minHeight: 0, position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'clamp(10px,3vw,28px)', touchAction: 'pan-y',
        }}>
        <img
          key={images[at]} src={images[at]} alt={alt}
          style={{
            maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
            animation: 'bhLbFade .2s ease both',
          }} />

        {/* دکمه‌های دسکتاپ — روی گوشی کشیدن طبیعی‌تر است */}
        {total > 1 && (
          <>
            <button type="button" onClick={() => go(1)} aria-label="تصویر بعدی"
              className="bh-lb-arrow" style={{ insetInlineStart: 10 }}>
              <ChevronLeft size={22} strokeWidth={2.4} />
            </button>
            <button type="button" onClick={() => go(-1)} aria-label="تصویر قبلی"
              className="bh-lb-arrow" style={{ insetInlineEnd: 10 }}>
              <ChevronRight size={22} strokeWidth={2.4} />
            </button>
          </>
        )}
      </div>

      {/* شمارنده و بندانگشتی‌ها */}
      {total > 1 && (
        <div style={{ flexShrink: 0, padding: '0 14px 18px' }}>
          <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: GOLD_D, marginBottom: 10 }}>
            تصویر {toFa(at + 1)} از {toFa(total)}
          </div>
          <div style={{
            display: 'flex', gap: 8, justifyContent: 'center',
            overflowX: 'auto', paddingBottom: 2,
          }}>
            {images.map((src, i) => (
              <button key={`${src}-${i}`} type="button" onClick={() => onIndex(i)}
                aria-label={`تصویر ${toFa(i + 1)}`} aria-current={i === at}
                style={{
                  flex: '0 0 auto', width: 62, height: 62, borderRadius: 12,
                  overflow: 'hidden', padding: 0, cursor: 'pointer', background: '#F4F3F1',
                  border: i === at ? `2px solid ${GOLD}` : `1px solid ${HAIR}`,
                  opacity: i === at ? 1 : 0.62,
                  transition: 'opacity .2s, border-color .2s',
                }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bhLbIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes bhLbFade { from { opacity: 0; transform: scale(.985) } to { opacity: 1; transform: none } }
        .bh-lb-arrow {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 42px; height: 42px; border-radius: 999px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.92); border: 1px solid ${HAIR};
          color: ${MUT}; box-shadow: 0 4px 14px rgba(0,0,0,0.10);
        }
        .bh-lb-arrow:hover { color: ${INK}; }
        /* روی گوشی جای دکمه‌ها را کشیدن می‌گیرد و دکمه روی عکس می‌نشیند */
        @media (max-width: 720px) { .bh-lb-arrow { display: none } }
      `}</style>
    </div>,
    document.body,
  )
}

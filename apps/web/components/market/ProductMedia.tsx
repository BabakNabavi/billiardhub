'use client'

/* ─────────────────────────────────────────────────────────────
   قاب تصویرِ محصول — فرمولِ واحدِ کلِ سایت.

   ── چرا یک کامپوننت ──
   تا امروز هر سطح قابِ خودش را داشت: بازار `1 / 0.86` (افقی)،
   صفحه‌ی اصلی «۶۰٪ ارتفاعِ کارت» که روی گوشی عمودی درمی‌آمد
   (۱۴۸×۱۷۲)، و فروشگاهِ فروشنده باز یک نسبتِ سوم. یعنی یک محصول در
   سه صفحه سه شکل داشت — همان چیزی که «عکس‌ها یک اندازه نیستند»
   دیده می‌شد. اندازه‌گیری شده، نه تخمینی.

   حالا نسبت این‌جا تعریف می‌شود و همه از همین‌جا می‌خوانند.

   ── چیدمانِ نشان‌ها ──
   چپ‌بالا: هم‌رسانی. راست‌بالا: نشان‌کردن. راست‌پایین: شمارِ عکس‌ها.
   ⚠️ گزارشِ تخلف عمدا این‌جا نیست — صفحه‌ی خودِ آگهی دارَدش.
   ⚠️ چپ/راستِ *دیداری* عمدی است و با `inset-inline` جابه‌جا نمی‌شود:
   این‌ها روی خودِ عکس‌اند و جای‌شان به جهتِ متن ربطی ندارد.
   ───────────────────────────────────────────────────────────── */

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Bookmark, Share2, Images, Check } from 'lucide-react'
import { toFaDigits } from '../../lib/jalali'

export interface ProductMediaProps {
  src: string
  alt: string
  /** نشانیِ صفحه‌ی محصول — برای هم‌رسانی */
  href: string
  /** تعداد کلِ عکس‌های آگهی — کمتر از ۲ یعنی نشان نیاید. */
  imgCount?: number
  saved?: boolean
  onToggleSave?: () => void
  /** واژه‌ی دکمه‌ی نشان — صفحه‌ای که «علاقه‌مندی» می‌گوید همان را بدهد */
  saveLabel?: { on: string; off: string }
  /** نشان‌های گوشه‌ی پایین‌چپ (فوری / جدید / فروخته‌شده) */
  children?: ReactNode
  className?: string
  /** کلاسِ اضافی روی خودِ `<img>` (مثلا انیمیشنِ hover صفحه) */
  imgClassName?: string
}

export default function ProductMedia({
  src, alt, href, imgCount = 0,
  saved, onToggleSave, saveLabel, children, className, imgClassName,
}: ProductMediaProps) {
  const savedTxt = saveLabel ?? { on: 'برداشتن نشان', off: 'نشان کردن' }
  return (
    <div className={'bh-pm' + (className ? ' ' + className : '')}>
      <img src={src} alt={alt} loading="lazy" decoding="async"
        className={'bh-pm-img' + (imgClassName ? ' ' + imgClassName : '')}
        onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden' }} />

      {/* ستونِ چپ‌بالا — فعلا یک نشان دارد، ولی ستون می‌ماند:
          پرچمِ گزارش این‌جا بود و اگر روزی نشانِ دیگری اضافه شود
          همین‌جا زیرِ هم می‌نشیند. */}
      <div className="bh-pm-col">
        <ShareChip href={href} title={alt} />
      </div>

      {onToggleSave && (
        <button type="button" className={'bh-pm-chip bh-pm-bk' + (saved ? ' on' : '')}
          aria-label={saved ? savedTxt.on : savedTxt.off} aria-pressed={!!saved}
          onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleSave() }}>
          <Bookmark size={14} />
        </button>
      )}

      {imgCount > 1 && (
        <span className="bh-pm-cnt" role="img" aria-label={`${imgCount} عکس`}>
          <Images size={12} aria-hidden />
          <span>{toFaDigits(imgCount)}</span>
        </span>
      )}

      {children}
    </div>
  )
}

/* هم‌رسانی — `navigator.share` روی گوشی پنجره‌ی بومی می‌آورد؛ روی
   دسکتاپ و هر جای بی‌پشتیبانی، نشانی در کلیپ‌بورد می‌نشیند.
   ⚠️ کارت خودش یک `<Link>` است، پس جلوی حباب و ناوبری باید صریح
   گرفته شود وگرنه کلیک روی این دکمه صفحه را عوض می‌کند. */
/* ── کپیِ همگام، بدونِ مجوزِ Clipboard API ──
   `true` یعنی گرفت. منسوخ است ولی تنها راهی است که وقتی
   `navigator.clipboard` اجازه نمی‌دهد باقی می‌ماند. */
function copyFallback(text: string): boolean {
  const ta = document.createElement('textarea')
  /* ⚠️ فوکوس را برمی‌گردانیم: `select()` آن را می‌دزدد و چون کلِ
     کارت یک `<Link>` است، کاربرِ کیبورد جایش را از دست می‌داد. */
  const prev = document.activeElement as HTMLElement | null
  try {
    ta.value = text
    /* خارج از دید ولی نه `display:none` — انتخاب روی عنصرِ پنهان کار نمی‌کند. */
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    /* تنها چیزی که این را در سافاریِ iOS کار می‌اندازد — و وب‌ویوِ
       داخلِ اینستاگرام/تلگرام `navigator.share` ندارد ولی لمسی است،
       پس واقعا به این‌جا می‌رسد. */
    ta.setSelectionRange(0, text.length)
    return document.execCommand('copy')
  } catch { return false }
  /* ⚠️ `finally`: اگر `execCommand` throw کند (بعضی تنظیماتِ
     سازمانی)، بدونِ این هر کلیک یک textareaی یتیم در `body` جا
     می‌گذاشت. */
  finally { ta.remove(); prev?.focus?.() }
}

type ShareState = 'idle' | 'done' | 'fail'

function ShareChip({ href, title }: { href: string; title: string }) {
  const [state, setState] = useState<ShareState>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const flash = (v: Exclude<ShareState, 'idle'>) => {
    setState(v)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 1800)
  }

  const share = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    const url = new URL(href, window.location.origin).toString()
    const data = { title, url }

    /* ── چرا پنجره‌ی بومی فقط روی دستگاهِ تماما لمسی ──
       ⚠️ `navigator.share` روی کرومِ دسکتاپ *وجود دارد* ولی وقتی
       پنجره‌ی سیستم باز نمی‌شود با `AbortError` رد می‌کند — یعنی
       همان خطایی که «کاربر لغو کرد» هم می‌دهد. کدِ قبلی هر دو را
       یکی می‌گرفت و `return` می‌کرد: کلیک می‌شد و هیچ اتفاقی
       نمی‌افتاد.
       ⚠️ `any-pointer` نه `pointer`: لپ‌تاپِ لمسی هم ماوس دارد و
       باید مسیرِ کپی را برود. `canShare` هم خودِ داده را اعتبار
       می‌سنجد، برخلافِ `share` که فقط وجودِ تابع را ثابت می‌کند. */
    const mq = (q: string) => typeof matchMedia === 'function' && matchMedia(q).matches
    const touchOnly = mq('(any-pointer: coarse)') && !mq('(any-pointer: fine)')

    if (touchOnly && navigator.canShare?.(data)) {
      const t0 = performance.now()
      try { await navigator.share(data); return }
      catch (err) {
        /* ⚠️ لغوِ واقعی دستِ‌کم چند صد میلی‌ثانیه طول می‌کشد؛ ردِ
           فوری یعنی پنجره اصلا باز نشد و باید به کپی بیفتیم. */
        const cancelled = (err as Error)?.name === 'AbortError' && performance.now() - t0 > 250
        if (cancelled) return
      }
    }

    try { await navigator.clipboard.writeText(url); flash('done'); return }
    catch { /* اجازه نداد یا وجود نداشت — مسیرِ کهنه */ }

    if (copyFallback(url)) { flash('done'); return }

    /* آخرین راه: اگر پنجره‌ی بومی هست، همان. */
    if (navigator.canShare?.(data)) {
      try { await navigator.share(data); return }
      catch (err) { if ((err as Error)?.name === 'AbortError') return }
    }

    /* ⚠️ هیچ راهی نماند — ولی کاربر باید بداند. سکوت همان باگی
       است که این بلوک برای نبودنش نوشته شده. */
    flash('fail')
  }

  const done = state === 'done'
  return (
    <button type="button" className={'bh-pm-chip bh-pm-sh' + (state === 'idle' ? '' : ' ' + state)}
      onClick={share} aria-label="هم‌رسانی">
      {done ? <Check size={14} strokeWidth={3} /> : <Share2 size={14} />}
      {/* ⚠️ گره همیشه در درخت می‌ماند و فقط دیداری پنهان می‌شود:
          ناحیه‌ی زنده‌ای که همراهِ متنش ظاهر شود، در NVDA/JAWS
          اعلام نمی‌شود. */}
      <span className="bh-pm-toast" role="status">
        {done ? 'کپی شد' : state === 'fail' ? 'کپی نشد' : ''}
      </span>
    </button>
  )
}

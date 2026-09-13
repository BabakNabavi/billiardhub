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
   ستونِ چپ‌بالا: هم‌رسانی، و درست زیرش گزارش تخلف — هم‌اندازه و با
   یک پس‌زمینه. راست‌بالا: نشان‌کردن. راست‌پایین: شمارِ عکس‌ها.
   ⚠️ چپ/راستِ *دیداری* عمدی است و با `inset-inline` جابه‌جا نمی‌شود:
   این‌ها روی خودِ عکس‌اند و جای‌شان به جهتِ متن ربطی ندارد.
   ───────────────────────────────────────────────────────────── */

import type { ReactNode } from 'react'
import { Bookmark, Share2, Images } from 'lucide-react'
import { toFaDigits } from '../../lib/jalali'
import ReportButton from '../ReportButton'

export interface ProductMediaProps {
  src: string
  alt: string
  /** نشانیِ صفحه‌ی محصول — برای هم‌رسانی */
  href: string
  /** شناسه‌ی آگهی برای گزارش تخلف. نبودنش یعنی دکمه‌ی پرچم نیاید. */
  reportId?: string | number
  reportTitle?: string
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
  src, alt, href, reportId, reportTitle, imgCount = 0,
  saved, onToggleSave, saveLabel, children, className, imgClassName,
}: ProductMediaProps) {
  const savedTxt = saveLabel ?? { on: 'برداشتن نشان', off: 'نشان کردن' }
  return (
    <div className={'bh-pm' + (className ? ' ' + className : '')}>
      <img src={src} alt={alt} loading="lazy" decoding="async"
        className={'bh-pm-img' + (imgClassName ? ' ' + imgClassName : '')}
        onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden' }} />

      {/* ستونِ چپ‌بالا */}
      <div className="bh-pm-col">
        <ShareChip href={href} title={alt} />
        {reportId !== undefined && (
          <ReportButton targetId={reportId} targetTitle={reportTitle ?? alt} className="bh-pm-chip bh-pm-rp" />
        )}
      </div>

      {onToggleSave && (
        <button type="button" className={'bh-pm-chip bh-pm-bk' + (saved ? ' on' : '')}
          aria-label={saved ? savedTxt.on : savedTxt.off} aria-pressed={!!saved}
          onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleSave() }}>
          <Bookmark size={15} />
        </button>
      )}

      {imgCount > 1 && (
        <span className="bh-pm-cnt" role="img" aria-label={`${imgCount} عکس`}>
          <Images size={13} aria-hidden />
          <b>{toFaDigits(imgCount)}</b>
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
function ShareChip({ href, title }: { href: string; title: string }) {
  const share = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    const url = typeof window !== 'undefined' ? new URL(href, window.location.origin).toString() : href
    if (navigator.share) {
      /* لغوِ کاربر یک `AbortError` است، نه خطا — نباید به کلیپ‌بورد بیفتد. */
      try { await navigator.share({ title, url }); return }
      catch (err) { if ((err as Error)?.name === 'AbortError') return }
    }
    try { await navigator.clipboard?.writeText(url) } catch { /* بی‌کلیپ‌بورد کاری از دست ما برنمی‌آید */ }
  }
  return (
    <button type="button" className="bh-pm-chip bh-pm-sh" onClick={share} aria-label="هم‌رسانی">
      <Share2 size={15} />
    </button>
  )
}

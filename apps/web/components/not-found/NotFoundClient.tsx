'use client'

/* دو تکه‌ی کوچکِ کلاینتیِ صفحه‌ی ۴۰۴. بقیه‌ی صفحه Server Component است.

   · نشانیِ واردشده — کاربر می‌بیند دقیقاً کجا را خواسته بود؛ اگر غلطِ
     تایپی باشد، همین‌جا معلوم می‌شود.
   · «صفحه‌ی قبل» — فقط وقتی واقعاً صفحه‌ی قبلی‌ای از همین سایت هست.
     کسی که از لینکِ خراب در جای دیگری آمده، با این دکمه از سایت بیرون
     می‌افتاد؛ برای او پنهان است. */

import { useEffect, useState, useSyncExternalStore } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { buttonClasses } from '@/components/ui/button-classes'

const noop = () => () => {}
/* نویسه‌های کنترلِ جهت (RLE/LRO/… و ایزوله‌ها): متنِ نشانی را هر کسی می‌تواند
   در یک لینک بسازد، و این‌ها می‌توانند ترتیبِ دیدنیِ جمله را برگردانند. */
const BIDI = /[‪-‮⁦-⁩]/g
const MAX = 120

export function RequestedPath() {
  /* ⚠️ نشانی فقط از مرورگر خوانده می‌شود. صفحه‌ی ۴۰۴ در بیلد ایستا ساخته
     می‌شود و آن‌جا `usePathname()` همیشه «/_not-found» است؛ همان متن در HTML
     می‌نشست، روی شبکه‌ی کند تا هیدراته‌شدن دیده می‌شد، و ناهماهنگیِ
     هیدراته‌شدن می‌ساخت. در سرور `null` ⟵ چیزی رندر نمی‌شود.
     `usePathname` فقط برای رندرِ دوباره بعد از ناوبریِ نرم است. */
  usePathname()
  const raw = useSyncExternalStore(noop, () => window.location.pathname, () => null)

  let shown = raw ?? ''
  try { shown = decodeURI(shown) } catch (e) {
    /* نشانیِ خراب‌کدشده — همان خام نمایش داده می‌شود */
    if (!(e instanceof URIError)) throw e
  }
  shown = shown.replace(BIDI, '')
  if (shown.length > MAX) shown = shown.slice(0, MAX) + '…'

  return (
    /* ارتفاعِ ثابت: خط بعد از هیدراته‌شدن پر می‌شود و نباید دکمه‌ها را پایین بزند */
    <p className="m-0 mt-4 flex min-h-8 flex-wrap items-center gap-2 text-body text-ink-2">
      {raw && raw !== '/' && (
        <>
          نشانیِ واردشده:
          <code dir="ltr" className="bh-latin max-w-full truncate rounded-chip bg-line/[.05] px-2 py-1 text-sub text-ink">{shown}</code>
        </>
      )}
    </p>
  )
}

export function BackLink() {
  const router = useRouter()
  const [canGoBack, setCanGoBack] = useState(false)
  useEffect(() => {
    /* ⚠️ اول Navigation API: ورود به ۴۰۴ بیشتر از کلیکِ یک لینکِ خرابِ داخلی
       است — ناوبریِ نرم — و آن‌جا `document.referrer` هنوز ارجاع‌دهنده‌ی اولین
       بارگذاری (مثلاً گوگل) است. فهرستِ Navigation API فقط هم‌مبدأ است.
       TypeScript هنوز تایپش را ندارد. */
    const nav = (window as Window & { navigation?: { canGoBack?: boolean } }).navigation
    if (typeof nav?.canGoBack === 'boolean') { setCanGoBack(nav.canGoBack); return }
    try {
      const ref = document.referrer ? new URL(document.referrer) : null
      setCanGoBack(!!ref && ref.origin === window.location.origin && window.history.length > 1)
    } catch (e) {
      console.warn('[404] referrer parse failed', e)
    }
  }, [])
  if (!canGoBack) return null
  return (
    <button type="button" onClick={() => router.back()} className={buttonClasses({ variant: 'ghost', size: 'lg' })}>
      {/* در RTL «برگشت» به سمتِ راست است */}
      <ArrowRight size={18} aria-hidden />صفحه‌ی قبل
    </button>
  )
}

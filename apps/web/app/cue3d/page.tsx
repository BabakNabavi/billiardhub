import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Stage from './Stage'

/* ─────────────────────────────────────────────────────────────
   صفحه‌ی کمکیِ رندر — ورودیِ `scripts/prerender-cue.mjs`.

   ⚠️ این مسیر در پروداکشن **وجود ندارد**. پیش از این فقط یک کامنت
   ادعا می‌کرد `noindex` است، در حالی که صفحه‌ی کلاینت اصلاً
   نمی‌تواند `metadata` صادر کند: مسیر عمومی بود، در robots اجازه
   داشت، و ۲۵۶ کیلوبایتِ فشرده‌ی three.js را روی یک صفحه‌ی خالی
   بارگذاری می‌کرد. حالا یک کامپوننتِ سرور جلویش را می‌گیرد.

   برای رندر: `npm run dev` بعد `node scripts/prerender-cue.mjs`
   ───────────────────────────────────────────────────────────── */

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <Stage />
}

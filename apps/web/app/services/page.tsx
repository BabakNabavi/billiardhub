import { preload } from 'react-dom'
import { ServicesClient } from './ServicesClient'

/* ─────────────────────────────────────────────────────────────
   پوسته‌ی سرورِ خدمات فنی — فقط برای یک سرنخ.

   عکسِ هیرو پس‌زمینه‌ی CSS است (ios.css) و مرورگر تا خواندنِ استایل
   پیدایش نمی‌کرد؛ Lighthouse برای بزرگ‌ترین عنصرِ صفحه ۲٫۵ تا ۳ ثانیه
   «تأخیرِ نقاشی» نشان می‌داد. با این سرنخ عکس پیش از اولین نقاشی
   می‌رسد. دو عکس با همان مرزِ ۷۶۰ پیکسلیِ ios.css — هر دستگاه فقط
   یکی را می‌گیرد. مرزِ موبایل «نه min-width: 760» است، نه max-width:
   759.98، تا عرضِ کسری (زومِ عجیب) هم بی‌سرنخ نماند؛ شکلِ (width < 760px)
   را سافاریِ پیش از ۱۶٫۴ نمی‌فهمد.

   ⚠️ اگر مرز یا نامِ عکس در ios.css عوض شد، این‌جا هم عوض شود؛
   وگرنه عکسی بی‌مصرف دانلود می‌شود.
   ───────────────────────────────────────────────────────────── */

export default function ServicesPage() {
  preload('/images/services/hero-mobile.jpg', {
    as: 'image', fetchPriority: 'high', media: 'not all and (min-width: 760px)',
  })
  preload('/images/services/hero-desktop.jpg', {
    as: 'image', fetchPriority: 'high', media: '(min-width: 760px)',
  })
  return <ServicesClient />
}

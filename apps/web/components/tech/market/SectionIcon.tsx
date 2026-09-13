/* ─────────────────────────────────────────────────────────────
   آیکونِ کنارِ عنوانِ بخش‌های صفحه‌ی متخصص.

   پیش‌تر کنار هر عنوان یک میله‌ی سبزِ بی‌معنی بود — همان شکل برای
   «درباره»، «خدمات»، «گالری» و «تماس». میله جای خودش را به یک
   آیکونِ مرتبط داد تا چشم بخش را از روی شکل هم بشناسد.

   ⚠️ همان قواعدِ ستِ ServiceIcons: شبکه‌ی ۲۴، ضخامت ۱٫۶، سرِ گرد،
   `currentColor`. بدونِ این یکدستی، کنارِ آیکون‌های خدمت بیگانه
   دیده می‌شوند.
   ───────────────────────────────────────────────────────────── */

export type SectionIconName = 'about' | 'services' | 'work' | 'gallery' | 'contact' | 'coverage'

const D: Record<SectionIconName, React.ReactNode> = {
  /* درباره — نشانِ اطلاعات */
  about: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" /><path d="M12 7.8v.01" /></>,
  /* خدمات — آچار و پیچ‌گوشتی */
  services: <><path d="M14.8 3.4a4.4 4.4 0 0 0 5.8 5.8" /><path d="M17.4 10.6 5.6 22.4a2.1 2.1 0 0 1-3-3L14.4 7.6" /><path d="M4 4l4 4" /></>,
  /* نمونه‌کارها — قابِ عکسِ کار */
  work: <><path d="M3 5.5h18v13H3z" /><path d="m3 15 5-4.5 4 3.5 3.5-3 5.5 4.6" /><circle cx="8.2" cy="9.2" r="1.3" /></>,
  /* گالری — چند قابِ روی هم */
  gallery: <><path d="M7.5 3.5h13v13h-13z" /><path d="M16.5 20.5h-13v-13" /><path d="m9.5 12.5 3-2.6 2.4 2.1 2.6-2.3" /></>,
  /* تماس — گوشی */
  contact: <><path d="M7.6 3.5 9.9 8 8 10a12 12 0 0 0 6 6l2-1.9 4.5 2.3v3A2.1 2.1 0 0 1 18.3 21 16.8 16.8 0 0 1 3 5.7 2.1 2.1 0 0 1 4.6 3.5z" /></>,
  /* محدوده خدمات — نشانِ مکان روی نقشه */
  coverage: <><path d="M20 10c0 6.2-8 12-8 12S4 16.2 4 10a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="2.8" /></>,
}

/** آیکونِ عنوانِ بخش. `aria-hidden` است — عنوان کنارش نوشته شده. */
export default function SectionIcon({ name, className }: { name: SectionIconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden focusable="false">
      {D[name]}
    </svg>
  )
}

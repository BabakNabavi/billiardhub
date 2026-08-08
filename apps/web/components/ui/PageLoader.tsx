'use client'

/* ─────────────────────────────────────────────────────────────
   نشانه‌ی «در حال بررسیِ نشست».

   ── چرا کامپوننتِ جدا ──
   چند صفحه‌ی محافظت‌شده تا رسیدنِ جوابِ سرور `null` برمی‌گرداندند —
   یعنی صفحه‌ی کاملاً سفید. برای کاربر «سفید» یعنی «خراب است»، نه
   «صبر کن»؛ و چون این حالت فقط گاهی و چند صد میلی‌ثانیه بود، به
   شکلِ «سایت گاهی سفید می‌شود» گزارش می‌شد.

   یک کامپوننتِ مشترک، چون نسخه‌ی دوم یعنی دو ظاهرِ متفاوت برای یک
   حالت و سومی هم دیر یا زود می‌آید.
   ───────────────────────────────────────────────────────────── */

export default function PageLoader({ minHeight = '60vh' }: { minHeight?: string }) {
  return (
    <div style={{
      minHeight, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        border: '2px solid rgba(199,166,106,0.18)',
        borderTop: '2px solid #C7A66A',
        animation: 'bh-page-spin .8s linear infinite',
      }} />
      <style>{`@keyframes bh-page-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

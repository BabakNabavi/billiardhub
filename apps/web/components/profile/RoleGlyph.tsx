/* ─────────────────────────────────────────────────────────────
   نشانِ نقش — جای آواتار وقتی کاربر عکسی نگذاشته.

   پیش‌تر حرفِ اولِ نام در یک دایره نشان داده می‌شد. روی کاورِ تیره
   یک حرفِ تنها بیشتر شبیهِ «خطا» بود تا «هنوز عکس نگذاشته». این‌ها
   خطیِ ساده‌اند تا کنارِ بقیه‌ی آیکون‌های صفحه (lucide) غریبه
   نباشند و در هر اندازه‌ای تیز بمانند.
   ───────────────────────────────────────────────────────────── */

export type RoleGlyphKind = 'coach' | 'referee'

/** مربی: چوبِ کیو روی شانه + توپِ نشانه — نه «آدمکِ» عمومی */
function CoachGlyph() {
  return (
    <>
      <circle cx="9.5" cy="5.4" r="2.6" />
      <path d="M5 20.5v-2.2a4.6 4.6 0 0 1 4.6-4.6h1.2" />
      <path d="M20 3.6 11.4 12.2" />
      <path d="m11.9 11.7-1.6 1.6" />
      <circle cx="17.4" cy="18.6" r="2.9" />
    </>
  )
}

/** داور: سوت */
function RefereeGlyph() {
  return (
    <>
      <path d="M3.2 11.2h8.1l2.2-2.2h4.2a3.3 3.3 0 0 1 0 6.6h-4.2l-2.2-2.2H3.2z" />
      <circle cx="17.2" cy="12.3" r="1.15" />
      <path d="M6.6 8.4 5.2 6.1" />
      <path d="M10.2 7.4 9.6 4.9" />
    </>
  )
}

export default function RoleGlyph({ kind, size = 44 }: { kind: RoleGlyphKind; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden focusable="false">
      {kind === 'coach' ? <CoachGlyph /> : <RefereeGlyph />}
    </svg>
  )
}

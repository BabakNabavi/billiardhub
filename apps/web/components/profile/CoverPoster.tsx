/* ─────────────────────────────────────────────────────────────
   پوستر پیش‌فرض کاور پروفایل.

   ── چرا ساخته شد ──
   تا امروز نبود کاور یعنی یک عکس اتفاقی میز اسنوکر از پوشه‌ی
   فروشگاه. همان عکس روی پروفایل ده نفر می‌نشست و هیچ‌کدام مال
   خودشان نبود. حالا پروفایل بی‌کاور، یک پوستر ساخته‌شده می‌گیرد:
   نه عکس قرضی، نه مستطیل خالی.

   ── چرا SVG و CSS، نه تصویر ──
   مخاطب موبایل ایرانی است با شبکه‌ی کند: این پوستر صفر بایت شبکه
   می‌برد و با عرض صفحه مقیاس می‌گیرد. انیمیشن هم فقط `transform`
   و `opacity` است — روی CPU ضعیف کامپوزیت می‌شود و لی‌اوت را
   دوباره حساب نمی‌کند. با `prefers-reduced-motion` کاملا می‌ایستد.
   ───────────────────────────────────────────────────────────── */

import type { RoleGlyphKind } from './RoleGlyph'
import './cover-poster.css'

/** رنگ توپ‌ها بر اساس نقش — تنها تفاوت پوستر مربی و داور */
/* یک اتحادیه، نه دو نسخه: با دو تعریف جدا، افزودن نقش سوم به
   یکی و نه دیگری، `TONES[undefined]` می‌ساخت و کست پنهانش می‌کرد. */
export type PosterTone = RoleGlyphKind

const TONES: Record<PosterTone, { a: string; b: string }> = {
  coach:   { a: '#C7A66A', b: '#7A4F10' },
  referee: { a: '#8FA6C7', b: '#2E4468' },
}

export default function CoverPoster({ tone = 'coach' }: { tone?: PosterTone }) {
  const c = TONES[tone]
  return (
    <div className="cp" aria-hidden data-tone={tone}>
      {/* نمد میز: گرادیان عمقی + بافت ریز */}
      <div className="cp-felt" />
      <div className="cp-weave" />

      {/* کمان نور سقفی که آرام نفس می‌کشد */}
      <div className="cp-spot" />

      {/* سه توپ روی خط برک — تنها بخش متحرک */}
      <svg className="cp-balls" viewBox="120 100 160 70" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id={`cpg-${tone}`} cx="34%" cy="30%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.92" />
            <stop offset="38%" stopColor={c.a} />
            <stop offset="100%" stopColor={c.b} />
          </radialGradient>
          <linearGradient id={`cpc-${tone}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={c.a} stopOpacity="0" />
            <stop offset="50%" stopColor={c.a} stopOpacity="0.55" />
            <stop offset="100%" stopColor={c.a} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* سایه‌ی ثابت زیر توپ‌ها — بیرون از گروه‌های متحرک، تا
            انیمیشن هیچ فیلتری را باطل نکند. */}
        <ellipse cx="152" cy="152" rx="20" ry="5" fill="rgba(0,0,0,0.42)" />
        <ellipse cx="206" cy="152" rx="14" ry="4" fill="rgba(0,0,0,0.34)" />
        <ellipse cx="252" cy="152" rx="10" ry="3" fill="rgba(0,0,0,0.28)" />

        {/* خط برک */}
        <line className="cp-line" x1="40" y1="150" x2="360" y2="150" stroke={`url(#cpc-${tone})`} strokeWidth="1.4" />

        <g className="cp-ball cp-b1"><circle cx="150" cy="132" r="19" fill={`url(#cpg-${tone})`} /></g>
        <g className="cp-ball cp-b2"><circle cx="205" cy="118" r="13" fill={`url(#cpg-${tone})`} opacity="0.86" /></g>
        <g className="cp-ball cp-b3"><circle cx="252" cy="140" r="9"  fill={`url(#cpg-${tone})`} opacity="0.7" /></g>
      </svg>

    </div>
  )
}

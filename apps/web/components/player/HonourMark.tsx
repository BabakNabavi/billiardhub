/* ─────────────────────────────────────────────────────────────
   نشان افتخار — جام قهرمانی و مدال.

   ── چرا SVG اختصاصی و نه آیکون کتابخانه ──
   کارت افتخارات با یک آیکون خطی ۱۷ پیکسلی «ساده» دیده می‌شد.
   آنچه این بخش را ورزشی می‌کند، خود شیء جایزه است: جام طلا برای
   قهرمانی، مدال برای نایب‌قهرمانی و مقام سوم. اینها با گرادیان
   فلزی و برق لبه کشیده می‌شوند، نه با خط.

   ⚠️ شناسه‌ی گرادیان باید در هر نمونه یکتا باشد. با شناسه‌ی ثابت،
   چند نشان در یک صفحه همه به گرادیان *اولین* نمونه وصل می‌شوند و
   مدال نقره طلایی درمی‌آید. `useId` این را می‌بندد.
   ───────────────────────────────────────────────────────────── */

'use client'
import { useId } from 'react'

export type HonourRank = 1 | 2 | 3

/** پالت فلزی هر رتبه — روشن، پایه، سایه */
const METAL: Record<HonourRank, [string, string, string, string]> = {
  1: ['#F6E7BC', '#D8B76E', '#9A6E38', '#6E4A1E'],
  2: ['#F4F5F7', '#C9CDD4', '#8A8F98', '#5E626A'],
  3: ['#F0D5BA', '#C99B6E', '#94663D', '#6B4525'],
}

export default function HonourMark({ rank, size = 54 }: { rank: HonourRank; size?: number }) {
  const uid = useId().replace(/:/g, '')
  const [lite, base, deep, edge] = METAL[rank]
  const g = `hm-${uid}`

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
      aria-hidden focusable="false" style={{ display: 'block', flexShrink: 0 }}>
      <defs>
        <linearGradient id={`${g}-m`} x1="14" y1="6" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor={lite} /><stop offset=".42" stopColor={base} /><stop offset="1" stopColor={deep} />
        </linearGradient>
        <linearGradient id={`${g}-s`} x1="20" y1="10" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity=".8" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${g}-glow`} cx="32" cy="30" r="26" gradientUnits="userSpaceOnUse">
          <stop stopColor={base} stopOpacity=".28" /><stop offset="1" stopColor={base} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="32" cy="31" r="27" fill={`url(#${g}-glow)`} />

      {rank === 1 ? (
        <>
          {/* پایه و ساقه‌ی جام */}
          <path d="M24 52h16v4H24z" fill={`url(#${g}-m)`} />
          <path d="M27 46h10v6H27z" fill={deep} />
          <path d="M30 38h4v9h-4z" fill={`url(#${g}-m)`} />
          {/* دسته‌ها */}
          <path d="M20 15h-4a7 7 0 0 0 7 7" stroke={base} strokeWidth="3" strokeLinecap="round" />
          <path d="M44 15h4a7 7 0 0 1-7 7" stroke={base} strokeWidth="3" strokeLinecap="round" />
          {/* کاسه */}
          <path d="M19 10h26v12a13 13 0 0 1-26 0V10z" fill={`url(#${g}-m)`} />
          <path d="M19 10h26v12a13 13 0 0 1-26 0V10z" stroke={edge} strokeWidth="1.2" strokeOpacity=".5" />
          {/* برق لبه */}
          <path d="M23 12h5v10a9 9 0 0 0 2 5c-4-1-7-5-7-9V12z" fill={`url(#${g}-s)`} />
          {/* ستاره */}
          <path d="m32 16 1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z" fill="#fff" fillOpacity=".55" />
        </>
      ) : (
        <>
          {/* روبان */}
          <path d="M20 6h9l-6 20-8-6z" fill={deep} fillOpacity=".85" />
          <path d="M44 6h-9l6 20 8-6z" fill={edge} fillOpacity=".85" />
          {/* قرص */}
          <circle cx="32" cy="39" r="17" fill={`url(#${g}-m)`} stroke={edge} strokeWidth="1.2" strokeOpacity=".55" />
          <circle cx="32" cy="39" r="12" fill="none" stroke={edge} strokeWidth="1" strokeOpacity=".38" />
          <path d="M24 30a17 17 0 0 0-3 11c0-6 4-11 9-13z" fill={`url(#${g}-s)`} />
          {/* شماره‌ی رتبه */}
          <text x="32" y="45" textAnchor="middle" fontSize="15" fontWeight="800"
            fill={edge} fillOpacity=".8" fontFamily="inherit">{rank === 2 ? '۲' : '۳'}</text>
        </>
      )}
    </svg>
  )
}

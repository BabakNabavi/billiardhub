/* ─────────────────────────────────────────────────────────────
   میزِ اسنوکر از بالا — لایه‌ی ثابتِ تصویرِ ۴۰۴.

   با جزئیاتی که بازیکن می‌شناسد: خطِ بالک و D، شش پاکت، و توپ‌ها سرِ
   خالِ خودشان — سبز، قهوه‌ای و زرد روی خطِ بالک، آبی وسط، صورتی، دسته‌ی
   قرمزها پشتش، و سیاه سرِ خالِ خودش. الماس روی لبه نیست: آن جزئیِ میزِ
   پاکت و کارامبول است، نه اسنوکر.

   دستگاهِ مختصات: viewBox برابرِ 440×260؛ ماهوت از (۳۴، ۳۴) تا (۴۰۶، ۲۲۶).
   ───────────────────────────────────────────────────────────── */

export const BALL_R = 6.5

export const BALL_COLORS = {
  red: ['#FF6B5E', '#B3170E'],
  yellow: ['#FFE680', '#D9A400'],
  green: ['#5FD08A', '#0E7A3E'],
  brown: ['#C08A5B', '#6B3E1E'],
  blue: ['#6FB0FF', '#1452B8'],
  pink: ['#FFB3CB', '#E0507F'],
  black: ['#5A5A5A', '#0A0A0A'],
  white: ['#FFFFFF', '#CFC9BC'],
} as const

export type BallColor = keyof typeof BALL_COLORS

/** توپ با سایه‌روشن — گرادیانِ هر رنگ یک‌بار در defs */
export function Ball({ cx, cy, color }: { cx: number; cy: number; color: BallColor }) {
  return <circle cx={cx} cy={cy} r={BALL_R} fill={`url(#nf-${color})`} />
}

/* دسته‌ی قرمزها پشتِ صورتی، رو به سیاه */
const REDS: [number, number][] = [
  [327, 130],
  [338.3, 123.5], [338.3, 136.5],
  [349.6, 117], [349.6, 130], [349.6, 143],
]

const POCKETS: [number, number][] = [[34, 34], [406, 34], [34, 226], [406, 226], [220, 29], [220, 231]]

/** defs مشترکِ هر دو لایه (میز و ضربه) — یک‌بار در صفحه */
export function TableDefs() {
  return (
    <defs>
      <linearGradient id="nf-rail" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4A3423" />
        <stop offset="1" stopColor="#24180F" />
      </linearGradient>
      <linearGradient id="nf-felt" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#168A52" />
        <stop offset="1" stopColor="#0C6239" />
      </linearGradient>
      {/* نورِ چراغِ بالای میز */}
      <radialGradient id="nf-lamp" cx=".5" cy=".5" r=".6">
        <stop offset="0" stopColor="#fff" stopOpacity=".16" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      {/* چوب: ته محو می‌شود تا جایی که از کادر بیرون می‌رود بریده‌ی صاف دیده نشود */}
      <linearGradient id="nf-shaft" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#2A1A10" stopOpacity="0" />
        <stop offset=".22" stopColor="#3A2516" stopOpacity="1" />
        <stop offset=".38" stopColor="#5B3A22" />
        <stop offset=".40" stopColor="#E9D3A4" />
        <stop offset="1" stopColor="#F3E4C2" />
      </linearGradient>
      {(Object.entries(BALL_COLORS) as [BallColor, readonly [string, string]][]).map(([k, [hi, lo]]) => (
        <radialGradient key={k} id={`nf-${k}`} cx=".35" cy=".32" r=".75">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset=".18" stopColor={hi} />
          <stop offset="1" stopColor={lo} />
        </radialGradient>
      ))}
      <filter id="nf-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="1.2" dy="1.6" stdDeviation="1.1" floodColor="#000" floodOpacity=".35" />
      </filter>
    </defs>
  )
}

/** میز و توپ‌های ساکن */
export function SnookerTable() {
  return (
    <>
      {/* لبه‌ی چوبی با خطِ طلایی */}
      <rect x="10" y="10" width="420" height="240" rx="26" fill="url(#nf-rail)" />
      <rect x="16.5" y="16.5" width="407" height="227" rx="21" fill="none" stroke="#C7A66A" strokeOpacity=".45" />

      {/* ماهوت */}
      <rect x="34" y="34" width="372" height="192" rx="6" fill="url(#nf-felt)" />
      <rect x="34" y="34" width="372" height="192" rx="6" fill="url(#nf-lamp)" />

      {/* خطِ بالک و D — D رو به سمتِ لبه‌ی بالک باز می‌شود */}
      <g stroke="#fff" strokeOpacity=".28" fill="none" strokeWidth="1">
        <line x1="108" y1="34" x2="108" y2="226" />
        <path d="M108 98 A32 32 0 0 0 108 162" />
      </g>
      {/* خال‌های آبی و صورتی؛ خالِ سیاه زیرِ خودِ توپ است */}
      <g fill="#fff" opacity=".35">
        <circle cx="220" cy="130" r="1.2" />
        <circle cx="313" cy="130" r="1.2" />
      </g>

      {/* پاکت‌ها */}
      <g fill="#080807">
        {POCKETS.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={12} />)}
      </g>

      {/* توپ‌ها سرِ جایشان */}
      <g filter="url(#nf-shadow)">
        <Ball cx={108} cy={98} color="green" />
        <Ball cx={108} cy={130} color="brown" />
        <Ball cx={108} cy={162} color="yellow" />
        <Ball cx={220} cy={130} color="blue" />
        <Ball cx={313} cy={130} color="pink" />
        {REDS.map(([x, y]) => <Ball key={`${x}-${y}`} cx={x} cy={y} color="red" />)}
        <Ball cx={374} cy={130} color="black" />
      </g>
    </>
  )
}

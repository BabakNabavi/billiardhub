/* ─────────────────────────────────────────────────────────────
   میزِ اسنوکرِ دیدِ بالا — امضای صفحه‌ی درباره‌ی ما.

   یک بار، هنگامِ ورود، «بریک» اجرا می‌شود: توپِ سفید از D راه می‌افتد،
   به راسِ مثلث می‌خورد و قرمزها پخش می‌شوند؛ یکی در جیب می‌رود. بعد
   همه سرِ جای تازه‌شان می‌مانند. تمامِ حرکت CSS است (about.css) و
   جاوااسکریپتی همراهش نمی‌رود. با کاهشِ حرکت، مثلثِ چیده‌شده می‌ماند.

   مختصات در فضای viewBox است؛ جابه‌جاییِ هر قرمز (--dx/--dy) هم در همان
   واحد، چون translateِ CSS روی عنصرِ SVG در فضای کاربرِ خودش اعمال می‌شود.
   ───────────────────────────────────────────────────────────── */

const R = 5.2
/* راسِ مثلث رو به D (سمتِ راست)؛ ردیف‌ها به چپ باز می‌شوند */
const APEX = { x: 128, y: 110 }

type Red = { x: number; y: number; dx: number; dy: number; pot?: boolean }

/* جای نهاییِ هر قرمز بعد از بریک — دستی و روی پارچه (۲۴..۳۷۶ × ۲۴..۱۹۶)،
   تا پخش‌شدن طبیعی باشد و هیچ توپی روی توپِ رنگی یا بیرون از میز ننشیند.
   یازدهمی در جیبِ بالا-چپ می‌رود. */
const FINAL: Array<[number, number]> = [
  [150, 96], [104, 64], [126, 150], [70, 72], [92, 118], [84, 170], [44, 48], [58, 98],
  [34, 128], [54, 186], [18, 18], [30, 84], [74, 140], [40, 160], [112, 192],
]

const REDS: Red[] = (() => {
  const out: Red[] = []
  const step = R * 2 * 0.88
  let i = 0
  for (let row = 0; row < 5; row++) {
    for (let k = 0; k <= row; k++) {
      const x = APEX.x - row * step
      const y = APEX.y + (k - row / 2) * R * 2.04
      const [fx, fy] = FINAL[i] ?? [x, y]
      out.push({ x, y, dx: fx - x, dy: fy - y, pot: i === 10 })
      i++
    }
  }
  return out
})()

const COLOURS = [
  { x: 302, y: 80, c: '#E8B93A' },  /* زرد */
  { x: 302, y: 110, c: '#A9613F' }, /* قهوه‌ای */
  { x: 302, y: 140, c: '#2FA866' }, /* سبز — روشن‌تر از پارچه تا دیده شود */
  { x: 200, y: 110, c: '#3D63E6' }, /* آبی */
  { x: 140, y: 110, c: '#F06EAE', id: 'pink' },
  { x: 52, y: 110, c: '#17150F' },  /* سیاه */
]

const POCKETS: Array<[number, number]> = [[18, 18], [200, 14], [382, 18], [18, 202], [200, 206], [382, 202]]

export function BreakTable() {
  return (
    <svg viewBox="0 0 400 220" role="img" aria-label="میز اسنوکر در لحظه بریک" className="ab-table h-auto w-full">
      <defs>
        <radialGradient id="abCloth" cx="0.5" cy="0.45" r="0.7">
          <stop offset="0" stopColor="#23845A" />
          <stop offset="1" stopColor="#14583A" />
        </radialGradient>
        <radialGradient id="abBall" cx="0.32" cy="0.28" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity=".75" />
          <stop offset=".35" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* بدنه و نوارِ لاستیکی */}
      <rect x="2" y="2" width="396" height="216" rx="18" fill="#2A211A" />
      <rect x="14" y="14" width="372" height="192" rx="8" fill="url(#abCloth)" />
      {/* خال‌های طلاییِ لبه (diamonds) */}
      {[70, 130, 270, 330].map(x => (
        <g key={x} fill="rgb(199 166 106)" opacity=".7">
          <circle cx={x} cy="8" r="1.4" /><circle cx={x} cy="212" r="1.4" />
        </g>
      ))}
      {POCKETS.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="9" fill="#0E0B08" />)}

      {/* خطِ بالک و D (سمتِ راست) */}
      <line x1="302" y1="14" x2="302" y2="206" stroke="#fff" strokeOpacity=".28" strokeWidth=".8" />
      <path d="M302 80 A30 30 0 0 1 302 140" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth=".8" />

      {/* مسیرِ ضربه — پیش از برخورد کشیده می‌شود و محو می‌شود */}
      <line className="ab-aim" x1="318" y1="126" x2="116" y2="132"
        stroke="#fff" strokeOpacity=".5" strokeWidth=".8" strokeDasharray="3 4" />

      {COLOURS.map(b => (
        <g key={`${b.x}-${b.y}`}>
          <circle cx={b.x} cy={b.y} r={R} fill={b.c} />
          <circle cx={b.x} cy={b.y} r={R} fill="url(#abBall)" />
        </g>
      ))}

      {REDS.map((b, i) => (
        <g key={i} className={b.pot ? 'ab-red ab-pot' : 'ab-red'}
          style={{ ['--dx' as string]: `${b.dx}px`, ['--dy' as string]: `${b.dy}px`, ['--d' as string]: `${(i % 5) * 18}ms` }}>
          <circle cx={b.x} cy={b.y} r={R} fill="#C43D2E" />
          <circle cx={b.x} cy={b.y} r={R} fill="url(#abBall)" />
        </g>
      ))}

      {/* توپِ سفید */}
      <g className="ab-cue">
        <circle cx="318" cy="126" r={R} fill="#F4F1EA" />
        <circle cx="318" cy="126" r={R} fill="url(#abBall)" />
      </g>
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────
   صحنه‌ی هیروی درباره ما — میزِ اسنوکر زیرِ چراغِ سقفی، از زاویه‌ی پایین.

   به‌جای عکسِ استوک (هیچ عکسِ زمردیِ قابلِ قبولی در مخزن نبود) صحنه
   دست‌ساز و برداری است: یک نور از بالا، پارچه‌ی زمردی با بافت، سایه‌ی
   تماسِ توپ‌ها زیرِ خودشان، و تاریکیِ اتاق که نور را قاب می‌کند.
   تنها حرکت: «روشن شدنِ چراغ» هنگامِ ورود (about.css)، بی جاوااسکریپت.
   مختصات در فضای viewBoxِ ۸۰۰×۶۰۰
   ───────────────────────────────────────────────────────────── */

type Ball = { x: number; y: number; r: number; c: string }

/* پکِ قرمزها در دوردست — شعاع با عمق کوچک می‌شود */
const PACK: Ball[] = (() => {
  const out: Ball[] = []
  for (let row = 0; row < 5; row++) {
    for (let k = 0; k <= row; k++) {
      const r = 7.2 - row * 0.14
      out.push({ x: 400 + (k - row / 2) * r * 2.05, y: 360 - row * r * 1.25, r, c: '#B3322A' })
    }
  }
  return out
})()

const SPOTS: Ball[] = [
  { x: 400, y: 380, r: 6.6, c: '#E275A8' }, /* صورتی، جلوی پک */
  { x: 400, y: 336, r: 5.4, c: '#15130F' }, /* سیاه، پشتِ پک */
  { x: 400, y: 448, r: 8.4, c: '#2F5FD9' }, /* آبی، وسطِ میز */
]
const CUE: Ball = { x: 486, y: 520, r: 13, c: '#F2EEE4' }

function BallShape({ b }: { b: Ball }) {
  return (
    <g>
      {/* سایه‌ی تماس — نور از بالا، پس سایه کمی جلوتر و پهن */}
      <ellipse cx={b.x + b.r * 0.15} cy={b.y + b.r * 0.92} rx={b.r * 1.15} ry={b.r * 0.34} fill="#03130C" opacity=".55" />
      <circle cx={b.x} cy={b.y} r={b.r} fill={b.c} />
      <circle cx={b.x} cy={b.y} r={b.r} fill="url(#hpShade)" />
      <circle cx={b.x} cy={b.y} r={b.r} fill="url(#hpGloss)" />
    </g>
  )
}

export function HeroPlate() {
  return (
    <svg viewBox="0 0 800 600" role="img" aria-label="میز اسنوکر زیر نور چراغ سقفی" className="block h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="hpRoom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1B2521" /><stop offset=".55" stopColor="#111815" /><stop offset="1" stopColor="#0A0F0D" />
        </linearGradient>
        <radialGradient id="hpFelt" cx=".5" cy=".42" r=".72">
          <stop offset="0" stopColor="#23935F" /><stop offset=".5" stopColor="#167246" /><stop offset="1" stopColor="#0B4630" />
        </radialGradient>
        <linearGradient id="hpWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A281B" /><stop offset="1" stopColor="#1A120C" />
        </linearGradient>
        {/* نورِ چراغ: گرادیانِ شعاعیِ کشیده از زیرِ کلاهک — لبه‌ی نرم بی فیلترِ blur */}
        <radialGradient id="hpCone" gradientUnits="userSpaceOnUse" cx="400" cy="96" r="420" gradientTransform="translate(400 96) scale(.62 1) translate(-400 -96)">
          <stop offset="0" stopColor="#FFF4DC" stopOpacity=".2" /><stop offset=".55" stopColor="#FFF4DC" stopOpacity=".06" /><stop offset="1" stopColor="#FFF4DC" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hpPool" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#FFF6E0" stopOpacity=".26" /><stop offset="1" stopColor="#FFF6E0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hpGloss" cx=".36" cy=".26" r=".5">
          <stop offset="0" stopColor="#fff" stopOpacity=".85" /><stop offset=".45" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hpShade" cx=".45" cy=".35" r=".7">
          <stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".55" />
        </radialGradient>
        <radialGradient id="hpVignette" cx=".5" cy=".45" r=".75">
          <stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".6" />
        </radialGradient>
        <filter id="hpGlow" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="6" /></filter>
        <clipPath id="hpFeltClip"><path d="M168 338 H632 L842 566 H-42 Z" /></clipPath>
      </defs>

      <rect width="800" height="600" fill="url(#hpRoom)" />
      {/* پنل‌های دیوارِ پشتی، به‌سختی دیده می‌شوند */}
      <g stroke="#fff" strokeOpacity=".035">{[120, 240, 360, 440, 560, 680].map(x => <line key={x} x1={x} y1="0" x2={x} y2="300" />)}</g>

      {/* چراغ: میله‌ها، کلاهک، نوارِ نورِ زیرِ آن */}
      <g stroke="#2B3430" strokeWidth="2"><line x1="300" y1="0" x2="300" y2="64" /><line x1="500" y1="0" x2="500" y2="64" /></g>
      <path d="M232 64 H568 L548 96 H252 Z" fill="#0E1412" />
      <path d="M232 64 H568" stroke="#3A4642" strokeWidth="1.5" />
      <rect className="ab-lamp-glow" x="256" y="92" width="288" height="6" rx="3" fill="#FFE9B8" filter="url(#hpGlow)" />
      <rect className="ab-lamp-strip" x="258" y="94" width="284" height="3" rx="1.5" fill="#FFF3D6" />

      {/* مخروطِ نور */}
      <rect className="ab-cone" x="0" y="96" width="800" height="420" fill="url(#hpCone)" />

      {/* بدنه‌ی چوبی، لاستیک، پارچه */}
      <path d="M140 318 H660 L900 600 H-100 Z" fill="url(#hpWood)" />
      <path d="M140 318 H660" stroke="#C7A66A" strokeOpacity=".35" strokeWidth="1" />
      <path d="M156 328 H644 L870 590 H-70 Z" fill="#0C4A31" />
      <path d="M168 338 H632 L842 566 H-42 Z" fill="url(#hpFelt)" />
      <g clipPath="url(#hpFeltClip)">
        <ellipse className="ab-pool" cx="400" cy="440" rx="330" ry="120" fill="url(#hpPool)" />
        {/* خطِ بالک و D در پرسپکتیو */}
        <path d="M70 510 H730" stroke="#fff" strokeOpacity=".16" strokeWidth="1" />
        <path d="M330 510 Q400 462 470 510" fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="1" />
      </g>
      {/* نشانه‌های لبه (diamonds) روی چوبِ دور */}
      <g fill="#D9C08C" opacity=".75">{[244, 322, 478, 556].map(x => <path key={x} d={`M${x} 323 l3 -2.4 3 2.4 -3 2.4 Z`} />)}</g>
      {/* جیب‌های دور */}
      <ellipse cx="170" cy="338" rx="11" ry="5" fill="#050807" />
      <ellipse cx="630" cy="338" rx="11" ry="5" fill="#050807" />

      {PACK.map((b, i) => <BallShape key={i} b={b} />)}
      {SPOTS.map(b => <BallShape key={b.c} b={b} />)}
      <g className="ab-cueball"><BallShape b={CUE} /></g>

      <rect width="800" height="600" fill="url(#hpVignette)" pointerEvents="none" />
    </svg>
  )
}

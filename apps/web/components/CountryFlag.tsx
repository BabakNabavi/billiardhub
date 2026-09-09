/* ═══════════════════════════════════════════════════════════════
   پرچم کشور — SVG، نه ایموجی.
   ───────────────────────────────────────────────────────────────
   ایموجی پرچم روی ویندوز اصلا رندر نمی‌شود: مایکروسافت گلیف
   regional-indicator را در `Segoe UI Emoji` نگذاشته، پس مرورگر
   همان دو حرف کد را می‌نویسد («GB»). هیچ CSSی این را درست نمی‌کند
   — فونت شکلی ندارد که بکشد. سایت‌هایی که پرچم درست نشان می‌دهند
   تصویر سرو می‌کنند، نه متن.

   پس این‌جا SVG درون‌خطی است: بدون dependency، بدون درخواست
   شبکه، و بدون وابستگی به فونت سیستم.

   شکل‌ها در اندازه‌ی ۲۱ پیکسل **ساده‌سازی‌شده‌اند** — ستاره‌های
   پرچم آمریکا شمارش دقیق ندارند و نشان ایران و برگ کانادا
   تقریبی‌اند. در این ابعاد تفاوتش دیده نمی‌شود؛ اگر روزی جایی
   بزرگ نمایش داده شد، باید فایل واقعی جایگزین شود.
   ═══════════════════════════════════════════════════════════════ */

/** نقاط یک ستاره‌ی پنج‌پر — یک‌بار موقع لود ماژول حساب می‌شود */
function star(cx: number, cy: number, r: number): string {
  const p: string[] = []
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r * 0.382 : r
    const a = (Math.PI / 5) * i - Math.PI / 2
    p.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`)
  }
  return p.join(' ')
}

/* برگ افرا: نیمه‌ی راست از نوک تا ساقه، و قرینه‌اش. ۱۱ رأس واقعی
   برگ را دارد ولی منحنی‌هایش صاف شده‌اند. */
const MAPLE = (() => {
  const half: [number, number][] = [
    [12, 2.5], [12.55, 5.05], [13.8, 4.7], [13.35, 6.6], [15.8, 6.2],
    [15.2, 8.05], [15.5, 9.5], [13.1, 9.85], [12.6, 10.4], [12.45, 13.4],
  ]
  const mirror = [...half].reverse().map(([x, y]) => [24 - x, y] as [number, number])
  return [...half, ...mirror].map(p => p.join(',')).join(' ')
})()

type Shape = React.ReactElement

/* هر پرچم در قاب ۲۴×۱۶ — نسبت ۳:۲ که استاندارد بیشتر پرچم‌هاست */
const FLAGS: Record<string, Shape> = {
  /* سه‌رنگ عمودی */
  IT: <>{['#009246', '#fff', '#CE2B37'].map((c, i) => <rect key={i} x={i * 8} width="8" height="16" fill={c} />)}</>,
  FR: <>{['#002395', '#fff', '#ED2939'].map((c, i) => <rect key={i} x={i * 8} width="8" height="16" fill={c} />)}</>,
  BE: <>{['#000', '#FAE042', '#ED2939'].map((c, i) => <rect key={i} x={i * 8} width="8" height="16" fill={c} />)}</>,

  /* سه‌رنگ افقی */
  DE: <>{['#000', '#D00', '#FFCE00'].map((c, i) => <rect key={i} y={i * 5.334} width="24" height="5.334" fill={c} />)}</>,
  NL: <>{['#AE1C28', '#fff', '#21468B'].map((c, i) => <rect key={i} y={i * 5.334} width="24" height="5.334" fill={c} />)}</>,

  JP: <><rect width="24" height="16" fill="#fff" /><circle cx="12" cy="8" r="4.8" fill="#BC002D" /></>,

  TH: <>
    <rect width="24" height="16" fill="#A51931" />
    <rect y="2.67" width="24" height="10.66" fill="#fff" />
    <rect y="5.34" width="24" height="5.32" fill="#2D2A4A" />
  </>,

  CN: <>
    <rect width="24" height="16" fill="#EE1C25" />
    <polygon points={star(4.6, 4.4, 2.9)} fill="#FFDE00" />
    {([[9.4, 1.7], [11.3, 3.5], [11.3, 6.1], [9.4, 7.8]] as [number, number][]).map(([x, y]) => (
      <polygon key={`${x}-${y}`} points={star(x, y, 1.05)} fill="#FFDE00" />
    ))}
  </>,

  CA: <>
    <rect width="24" height="16" fill="#fff" />
    <rect width="6" height="16" fill="#FF0000" /><rect x="18" width="6" height="16" fill="#FF0000" />
    <polygon points={MAPLE} fill="#FF0000" />
  </>,

  US: <>
    {Array.from({ length: 13 }, (_, i) => (
      <rect key={i} y={i * 1.231} width="24" height="1.231" fill={i % 2 ? '#fff' : '#B22234'} />
    ))}
    <rect width="9.6" height="8.6" fill="#3C3B6E" />
    {Array.from({ length: 20 }, (_, i) => (
      <circle key={i} cx={1.2 + (i % 5) * 1.92} cy={1.1 + Math.floor(i / 5) * 2.15} r="0.42" fill="#fff" />
    ))}
  </>,

  GB: <>
    <rect width="24" height="16" fill="#012169" />
    <path d="M0,0 24,16 M24,0 0,16" fill="none" stroke="#fff" strokeWidth="3.2" />
    <path d="M0,0 24,16 M24,0 0,16" fill="none" stroke="#C8102E" strokeWidth="1.6" />
    <path d="M12,0 V16 M0,8 H24" fill="none" stroke="#fff" strokeWidth="5.3" />
    <path d="M12,0 V16 M0,8 H24" fill="none" stroke="#C8102E" strokeWidth="3.2" />
  </>,

  KR: <>
    <rect width="24" height="16" fill="#fff" />
    <path d="M8.4,8 a3.6,3.6 0 0,1 7.2,0 a1.8,1.8 0 0,1 -3.6,0 a1.8,1.8 0 0,0 -3.6,0 z" fill="#CD2E3A" />
    <path d="M8.4,8 a1.8,1.8 0 0,0 3.6,0 a1.8,1.8 0 0,1 3.6,0 a3.6,3.6 0 0,1 -7.2,0 z" fill="#0047A0" />
    {[[4.2, 3.4, -56], [19.8, 3.4, 56], [4.2, 12.6, 56], [19.8, 12.6, -56]].map(([x, y, r]) => (
      <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${r})`} fill="#000">
        {[-1.1, 0, 1.1].map(o => <rect key={o} x="-2.1" y={o - 0.32} width="4.2" height="0.64" />)}
      </g>
    ))}
  </>,

  /* آرژانتین — با کاتالوگ لوازم آمد. خورشید میانی در این ابعاد
     یک لکه می‌شود، پس فقط دایره‌ی طلایی. */
  AR: <>
    <rect width="24" height="16" fill="#74ACDF" />
    <rect y="5.33" width="24" height="5.33" fill="#fff" />
    <circle cx="12" cy="8" r="1.8" fill="#F6B40E" />
  </>,

  /* فنلاند — صلیب نوردیک. با کاتالوگ گچ آمد (Taom فنلاندی است). */
  FI: <>
    <rect width="24" height="16" fill="#fff" />
    <rect y="6" width="24" height="4" fill="#003580" />
    <rect x="7" width="4" height="16" fill="#003580" />
  </>,

  /* اسپانیا — سه نوار، میانی دو برابر. نشان روی نوار میانی در این
     ابعاد یک لکه می‌شود، پس نیامده. */
  ES: <>
    <rect width="24" height="16" fill="#AA151B" />
    <rect y="4" width="24" height="8" fill="#F1BF00" />
  </>,

  /* تایوان */
  TW: <>
    <rect width="24" height="16" fill="#FE0000" />
    <rect width="12" height="8" fill="#000095" />
    <circle cx="6" cy="4" r="2.35" fill="#fff" />
    {Array.from({ length: 12 }, (_, i) => (
      <rect key={i} x="5.75" y="1.2" width="0.5" height="1.5" fill="#fff"
        transform={`rotate(${i * 30} 6 4)`} />
    ))}
    <circle cx="6" cy="4" r="1.7" fill="#000095" />
    <circle cx="6" cy="4" r="1.45" fill="#fff" />
  </>,

  /* مالزی — چهارده نوار و هلال ماه با ستاره‌ی چهارده‌پر (ساده‌شده) */
  MY: <>
    {Array.from({ length: 14 }, (_, i) => (
      <rect key={i} y={i * 1.143} width="24" height="1.143" fill={i % 2 ? '#fff' : '#CC0001'} />
    ))}
    <rect width="13.5" height="9.14" fill="#010066" />
    <path d="M6.9,2.2 a2.6,2.6 0 1,0 0,4.8 a3.1,3.1 0 1,1 0,-4.8 z" fill="#FFCC00" />
    <polygon points={star(9.6, 4.6, 1.9)} fill="#FFCC00" />
  </>,

  /* سنگاپور — با کاتالوگ تازه‌ی میز آمد (Wiraka از مالزی به
     سنگاپور منتقل شد). هلال ماه و پنج ستاره. */
  SG: <>
    <rect width="24" height="16" fill="#fff" />
    <rect width="24" height="8" fill="#ED2939" />
    <path d="M7.6,4 a2.9,2.9 0 1,0 0,4.4 a3.4,3.4 0 1,1 0,-4.4 z" fill="#fff" />
    {([[8.9, 2.5], [10.4, 3.6], [9.9, 5.4], [7.9, 5.4], [7.4, 3.6]] as [number, number][]).map(([x, y]) => (
      <polygon key={`${x}-${y}`} points={star(x, y, 0.85)} fill="#fff" />
    ))}
  </>,

  IR: <>
    {['#239F40', '#fff', '#DA0000'].map((c, i) => <rect key={i} y={i * 5.334} width="24" height="5.334" fill={c} />)}
    {/* نشان — سایه‌نمای لاله‌ای‌شکل: شمشیر میانی و دو جفت هلال.
        نسخه‌ی اول این شکل یک میله‌ی افقی داشت که در این ابعاد شبیه
        صلیب می‌شد؛ عمدا حذف شد. */}
    <g fill="#DA0000">
      <path d="M12,5.1 l0.72,1.6 v3.6 h-1.44 V6.7 z" />
      {[1, -1].map(s => (
        <g key={s} transform={s === 1 ? undefined : 'translate(24,0) scale(-1,1)'}>
          <path d="M11.05,10.35 c-0.82,-0.98 -0.96,-2.5 -0.34,-3.78 c0.05,1.38 0.37,2.45 0.94,3.2 z" />
          <path d="M9.6,10.7 c-0.98,-1.18 -1.12,-3 -0.42,-4.44 c0.04,1.58 0.42,2.85 1.06,3.76 z" />
        </g>
      ))}
    </g>
  </>,
}

export interface CountryFlagProps {
  /** کد دوحرفی کشور؛ `null` یعنی نامشخص */
  code: string | null
  /** نام فارسی — روی tooltip و برای صفحه‌خوان */
  label: string
  /** عرض به پیکسل؛ ارتفاع خودش حساب می‌شود */
  width?: number
}

export default function CountryFlag({ code, label, width = 21 }: CountryFlagProps) {
  const shape = code ? FLAGS[code.toUpperCase()] : undefined
  const height = Math.round((width * 2) / 3)

  /* کشوری که شکل ندارد نباید چیدمان را به‌هم بزند — همان جعبه با
     کد کشور یا خط‌تیره پر می‌شود. */
  if (!shape) {
    return (
      <span
        title={label} aria-label={label} role="img"
        style={{
          width, height, flexShrink: 0, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', borderRadius: 2,
          background: 'rgba(0,0,0,.05)', color: '#8A8A8A', fontSize: 8, letterSpacing: '.02em',
        }}
      >{code ?? '—'}</span>
    )
  }

  return (
    <svg
      viewBox="0 0 24 16" width={width} height={height} role="img"
      aria-label={label} style={{ flexShrink: 0, borderRadius: 2, display: 'block' }}
    >
      <title>{label}</title>
      {shape}
      {/* لبه‌ی محو، وگرنه پرچم سفید (ژاپن) روی زمینه‌ی روشن گم می‌شود */}
      <rect x=".25" y=".25" width="23.5" height="15.5" rx="1.5" fill="none" stroke="rgba(0,0,0,.18)" strokeWidth=".5" />
    </svg>
  )
}

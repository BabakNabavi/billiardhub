'use client'

/* ─────────────────────────────────────────────────────────────
   چوبِ بیلیارد — شیءِ مرکزیِ صفحه‌ی خدمات فنی.

   ── چرا رسم می‌شود و عکس نیست ──
   دو دلیل، هر دو اندازه‌گیری‌شده نه سلیقه‌ای:
   ۱) تنها عکسِ موجودِ این بخش ۵۱۶×۳۸۷ است. در هیروی ۱۴۴۰ پیکسلی
      یعنی ~۲٫۸ برابر بزرگ‌نمایی — لهیده و نرم. عکسِ استوکِ خارجی
      هم روی صفحه‌ی خدماتِ *این* متخصص‌ها ادعای دروغ است.
   ۲) شیء باید با اسکرول *پیمایش* شود (دوربین از تیپ تا بات). عکس
      قابلِ پیمایش نیست؛ هندسه هست.

   ── چرا شبیهِ یک استوانه‌ی تخت نمی‌شود ──
   سه لایه روی هم، همان چیزی که یک رندرِ واقعی می‌کند:
   • شیبِ *طولی* برای رنگِ چوب (افرا روشن ⟵ رزوود تیره)
   • شیبِ *عرضی* برای گردیِ استوانه — روشناییِ بالا، فرودِ تیره‌ی
     پایین. این تنها چیزی است که «چوب» را از «نوار» جدا می‌کند.
   • رگه‌ی چوب با `feTurbulence`ِ کشیده در محورِ طول

   ⚠️ `baseFrequency` نامتقارن است: X کوچک، Y بزرگ. تلاطمِ متقارن
   لکه‌ی ابری می‌دهد؛ رگه‌ی چوب باید *در امتدادِ* طول کشیده باشد.
   ───────────────────────────────────────────────────────────── */

import { useId } from 'react'

/* ── هندسه ──
   ⚠️ همه‌ی مختصات از این چند عدد مشتق می‌شوند، نه دستی. تیپرِ چوب
   خطی است و اگر هر مرز دستی نوشته شود، اولین تغییرِ طول همه را
   ناهم‌تراز می‌کند. */
const X0 = 60      // نوکِ تیپ
const X1 = 1940    // تهِ بات
const R0 = 9       // شعاع در نوک
const R1 = 17.5    // شعاع در ته
const CY = 130     // خطِ مرکزی

/** شعاعِ چوب در فاصله‌ی x — تیپرِ خطی */
const rAt = (x: number) => R0 + ((x - X0) / (X1 - X0)) * (R1 - R0)

/** چهارضلعیِ یک قطعه‌ی چوب بینِ دو x */
function seg(xa: number, xb: number): string {
  const ra = rAt(xa), rb = rAt(xb)
  return `M${xa},${CY - ra} L${xb},${CY - rb} L${xb},${CY + rb} L${xa},${CY + ra} Z`
}

/* ── ایستگاه‌های آناتومی ──
   ⚠️ هر ایستگاه به خدماتِ *واقعیِ* کاتالوگ گره خورده. هیچ ایستگاهی
   که خدمتی پشتش نباشد ساخته نمی‌شود، و هیچ خدمتِ چوبی هم بی‌ایستگاه
   نمی‌ماند — هر ده خدمتِ دسته‌ی «تعمیرات چوب» این‌جا جا دارند. */
export interface CueStation {
  id: string
  /** نامِ فارسیِ قطعه */
  label: string
  /** برچسبِ فنیِ لاتین — ریزنویسِ نقشه، نه تیتر */
  latin: string
  /** مرکزِ قابِ دوربین در واحدِ viewBox */
  cx: number
  /** پهنای قابِ دوربین در واحدِ viewBox — کوچک‌تر یعنی نزدیک‌تر */
  cw: number
  /** شناسه‌ی خدماتِ کاتالوگ که روی این قطعه انجام می‌شوند */
  serviceIds: readonly string[]
}

/* ⚠️ نسبتِ قابِ دوربین **ثابت** است و در CSS قفل شده
   (`aspect-ratio: 1000/300`). اگر نسبتِ viewBox با نسبتِ عنصر یکی
   نباشد، `preserveAspectRatio` پیش‌فرض حاشیه‌ی خالی می‌گذارد و
   بزرگ‌نمایی می‌پرد. با ثابت‌بودنِ هر دو، تنها کاری که مانده
   عوض‌کردنِ `cw` است — یعنی زومِ واقعیِ برداری، نه `scale`ِ CSS که
   لایه را رَستر می‌کند و در ۲۰ برابر تار می‌شود. */
export const CAM_RATIO = 0.3

/* ⚠️ ترتیب از بات به تیپ است، یعنی از راستِ شیء به چپ — همان
   جهتی که چشمِ فارسی‌زبان صفحه را می‌خواند. `cw`ِ هر ایستگاه از
   ضخامتِ همان قطعه می‌آید نه از سلیقه: قابی که قطر را ~نیمی از
   ارتفاعِ خودش نگه دارد. تیپ استثناست — قطعه‌ای ۲۶ واحدی که در
   قابِ ۱۲۰ واحدی از فرولِ کنارش قابلِ تفکیک نیست، پس قابِ ۶۲ که
   چوب تقریباً تمامِ ارتفاع را پر می‌کند: همان نمای ماکروی واقعی. */
/* ⚠️ `as const satisfies` نه حاشیه‌نویسیِ صریحِ نوع: با
   حاشیه‌نویسی، تاپل به آرایه تنزل می‌کند و زیرِ
   `noUncheckedIndexedAccess` هر `CUE_STATIONS[0]` هم «شاید undefined»
   می‌شود — یعنی یا `!` لازم است یا گاردِ بی‌معنی. این شکل هم طولِ
   تاپل را نگه می‌دارد، هم ساختار را همان‌قدر سفت اعتبارسنجی می‌کند. */
export const CUE_STATIONS = [
  { id: 'butt',    label: 'بات',    latin: 'BUTT',    cx: 1500, cw: 210, serviceIds: ['butt-resize', 'weight', 'balance', 'extension'] },
  { id: 'joint',   label: 'جوینت',  latin: 'JOINT',   cx: 1042, cw: 175, serviceIds: ['joint'] },
  { id: 'shaft',   label: 'شفت',    latin: 'SHAFT',   cx: 560,  cw: 150, serviceIds: ['straighten', 'full-service'] },
  { id: 'ferrule', label: 'فرول',   latin: 'FERRULE', cx: 122,  cw: 118, serviceIds: ['ferrule-replace', 'ferrule-resize'] },
  { id: 'tip',     label: 'تیپ',    latin: 'TIP',     cx: 74,   cw: 62,  serviceIds: ['tip-replace'] },
] as const satisfies readonly CueStation[]

/** رشته‌ی `viewBox` برای یک قابِ دوربین */
export const camBox = (cx: number, cw: number) =>
  `${cx - cw / 2} ${CY - (cw * CAM_RATIO) / 2} ${cw} ${cw * CAM_RATIO}`

/** پهنای کلِ viewBox — بیرون هم لازم است تا دوربین درصد را حساب کند */
export const CUE_VIEW_W = 2000
export const CUE_VIEW_H = 260

export function CueObject(
  { className, viewBox, camera, grain = true, alt }:
  {
    className?: string
    viewBox?: string
    camera?: boolean
    /** ⚠️ روی موبایل پنج نسخه‌ی دیگر از این شیء رندر می‌شود و هر
     *  کدام دو `feTurbulence` دارد — نوفه‌ی پرلین کارِ CPU به‌ازای
     *  هر پیکسل است. کارت‌های ایستگاهِ موبایل رگه نمی‌گیرند. */
    grain?: boolean
    /** `null` یعنی تزئینی: کنارش تیترِ خودش هست */
    alt?: string | null
  },
) {
  const uid = useId().replace(/:/g, '')
  const g = (n: string) => `cue-${n}-${uid}`

  return (
    <svg
      className={className}
      viewBox={viewBox ?? `0 0 ${CUE_VIEW_W} ${CUE_VIEW_H}`}
      {...(alt === null
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': alt ?? 'نمای فنیِ چوبِ بیلیارد از تیپ تا بات' })}
      focusable="false"
      {...(camera ? { 'data-cam': '' } : {})}
    >
      <defs>
        {/* ── رنگِ طولی: افرای روشنِ نوک تا رزوودِ تیره‌ی ته ── */}
        <linearGradient id={g('len')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0"    stopColor="#EFE2C8" />
          <stop offset="0.06" stopColor="#E8D7B6" />
          <stop offset="0.50" stopColor="#D8BE90" />
          <stop offset="0.52" stopColor="#7E5533" />
          <stop offset="0.72" stopColor="#5E3A22" />
          <stop offset="1"    stopColor="#42271680" />
        </linearGradient>

        {/* ── گردیِ استوانه ──
            ⚠️ این تنها چیزی است که شیء را از یک نوارِ تخت جدا می‌کند:
            باندِ روشن در یک‌سومِ بالا، فرودِ تیره در لبه‌ی پایین. */}
        <linearGradient id={g('cyl')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0"    stopColor="#000" stopOpacity="0.60" />
          <stop offset="0.08" stopColor="#000" stopOpacity="0.22" />
          <stop offset="0.20" stopColor="#fff" stopOpacity="0.30" />
          <stop offset="0.29" stopColor="#fff" stopOpacity="0.62" />
          <stop offset="0.38" stopColor="#fff" stopOpacity="0.20" />
          <stop offset="0.52" stopColor="#000" stopOpacity="0.10" />
          <stop offset="0.74" stopColor="#000" stopOpacity="0.34" />
          <stop offset="0.90" stopColor="#000" stopOpacity="0.62" />
          <stop offset="1"    stopColor="#000" stopOpacity="0.78" />
        </linearGradient>

        {/* ── برنجِ ماشین‌کاری‌شده‌ی جوینت ── */}
        <linearGradient id={g('brass')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0"    stopColor="#6B5527" />
          <stop offset="0.20" stopColor="#E8CE93" />
          <stop offset="0.34" stopColor="#FFF6DF" />
          <stop offset="0.52" stopColor="#C09A50" />
          <stop offset="0.78" stopColor="#7A5F2C" />
          <stop offset="1"    stopColor="#4A3819" />
        </linearGradient>

        {/* ── فرولِ عاجی ── */}
        <linearGradient id={g('fer')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0"    stopColor="#9C9384" />
          <stop offset="0.26" stopColor="#FFFDF7" />
          <stop offset="0.50" stopColor="#F2ECDF" />
          <stop offset="1"    stopColor="#8C8375" />
        </linearGradient>

        {/* ── چرمِ تیپ ── */}
        <linearGradient id={g('tip')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0"    stopColor="#2C3D52" />
          <stop offset="0.30" stopColor="#5E7B99" />
          <stop offset="0.60" stopColor="#3A5069" />
          <stop offset="1"    stopColor="#1B2836" />
        </linearGradient>

        {/* ── رگه‌ی چوب ──
            ⚠️ فرکانسِ نامتقارن: در محورِ طول تقریباً صاف، در محورِ
            عرض پرتکرار ⟵ رگه‌ی کشیده، نه لکه‌ی ابری. */}
        {/* ⚠️ `mix-blend-mode: overlay` روی یک `<g>`ِ بریده به clipPath
            هیچ‌وقت کامپوزیت نشد — در بزرگ‌نمایی چوب کاملاً تخت بود.
            حالا خودِ فیلتر رگه را می‌سازد: نوفه تولید می‌شود، بعد
            ماتریس RGB را صفر (سیاه) و آلفا را از کانالِ قرمزِ نوفه
            می‌گیرد. خروجی «خطوطِ سیاهِ نیمه‌شفاف» است که با opacityِ
            عادی روی چوب می‌نشیند و به هیچ blend modeی نیاز ندارد. */}
        <filter id={g('grain')} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0025 0.55" numOctaves="4" seed="7" result="n" />
          <feColorMatrix in="n" type="matrix" result="d"
            values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   1.6 0 0 0 -0.35" />
        </filter>
        {/* رگه‌ی دومِ درشت‌تر — چوب یک بسامد ندارد */}
        <filter id={g('grain2')} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0016 0.13" numOctaves="2" seed="19" result="n" />
          <feColorMatrix in="n" type="matrix"
            values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   1.1 0 0 0 -0.42" />
        </filter>

        {/* درخششِ باریکِ بالای استوانه */}
        <filter id={g('soft')} x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>

        {/* ماسکِ بدنه: رگه و درخشش نباید از خطِ چوب بیرون بزنند */}
        <clipPath id={g('body')}>
          <path d={seg(X0, X1)} />
        </clipPath>
      </defs>

      {/* سایه‌ی افتاده روی زمینِ صحنه */}
      <ellipse cx={(X0 + X1) / 2} cy={CY + R1 + 26} rx={(X1 - X0) / 2.05} ry="9"
        fill="#000" opacity="0.30" filter={`url(#${g('soft')})`} />

      <g data-cue-body>
        {/* ۱) رنگِ طولی */}
        <path d={seg(X0, X1)} fill={`url(#${g('len')})`} />

        {/* ۲) قطعاتی که جنسِ خودشان را دارند */}
        <path d={seg(X0, 86)}     fill={`url(#${g('tip')})`} />
        <path d={seg(86, 140)}    fill={`url(#${g('fer')})`} />
        <path d={seg(1020, 1064)} fill={`url(#${g('brass')})`} />

        {/* ۳) رگه‌ی چوب — فقط روی بخشِ چوبی، بریده به بدنه */}
        {grain && (
        <g clipPath={`url(#${g('body')})`}>
          <rect x="140" y="0" width="880"  height={CUE_VIEW_H} filter={`url(#${g('grain')})`}  opacity="0.30" />
          <rect x="140" y="0" width="880"  height={CUE_VIEW_H} filter={`url(#${g('grain2')})`} opacity="0.20" />
          <rect x="1064" y="0" width="876" height={CUE_VIEW_H} filter={`url(#${g('grain')})`}  opacity="0.42" />
          <rect x="1064" y="0" width="876" height={CUE_VIEW_H} filter={`url(#${g('grain2')})`} opacity="0.26" />
        </g>
        )}

        {/* ۴) گردیِ استوانه روی همه‌چیز */}
        <path d={seg(X0, X1)} fill={`url(#${g('cyl')})`} />

        {/* ۵) درخششِ ماشین‌کاری — باندِ باریکِ نور در یک‌سومِ بالا */}
        <g clipPath={`url(#${g('body')})`}>
          <path d={`M${X0},${CY - R0 * 0.52} L${X1},${CY - R1 * 0.52}`}
            stroke="#FFF8E8" strokeOpacity="0.5" strokeWidth="2.2"
            fill="none" filter={`url(#${g('soft')})`} />
        </g>

        {/* ۶) رزوه‌ی ماشین‌کاریِ جوینت
            ⚠️ بدونِ این، برنج یک مستطیلِ زردِ تخت بود. خطوطِ ریزِ
            متناوب همان چیزی است که فلزِ تراش‌خورده را از رنگِ زرد
            جدا می‌کند — و فقط در بزرگ‌نمایی دیده می‌شود، که دقیقاً
            همان‌جایی است که بخشِ آناتومی می‌ایستد. */}
        <g clipPath={`url(#${g('body')})`} opacity="0.5">
          {Array.from({ length: 15 }, (_, i) => 1022 + i * 2.8).map(x => (
            <path key={x} d={seg(x, x + 1.1)} fill="#2A1F09" />
          ))}
        </g>

        {/* ۷) حلقه‌های منبت‌کاریِ بات — جزئیاتی که «ساخته‌شده» بودن را می‌رساند */}
        {[1140, 1151, 1700, 1711].map(x => (
          <g key={x}>
            <path d={seg(x, x + 2.2)} fill="#F6E9C6" opacity="0.85" />
            <path d={seg(x + 2.2, x + 3)} fill="#2A1C0C" opacity="0.5" />
          </g>
        ))}
        {/* حلقه‌ی برنجیِ کنارِ جوینت */}
        <path d={seg(1012, 1020)} fill="#EBD49B" opacity="0.8" />
        <path d={seg(1064, 1071)} fill="#EBD49B" opacity="0.8" />
      </g>
    </svg>
  )
}

'use client'

import { useId } from 'react'

/* ─────────────────────────────────────────────────────────────
   «پوسترِ» رشته‌های فنی — نقشه‌ی فنیِ کشیده‌شده، نه عکس.

   ── چرا کشیده می‌شود و دانلود نمی‌شود ──
   عکسِ واقعیِ کارِ *این* متخصص وجود ندارد، و عکسِ کارِ دیگران روی
   صفحه‌ی او یعنی ادعای دروغ. عکسِ استوکِ بی‌ربط هم صفحه را ارزان
   می‌کند. پس آنچه او روی آن کار می‌کند — چوب و میز — با دقتِ یک
   نقشه‌ی فنی کشیده می‌شود: همان زبانِ صنعتگری، بدونِ هیچ ادعای
   جعلی.

   ── چرا SVG و نه تصویر ──
   مخاطب موبایلِ ایرانی روی شبکه‌ی کند است. کلِ این دو نقشه چند
   کیلوبایت است، در هر اندازه‌ای تیز می‌ماند، و رنگش از توکن‌های
   خودِ صفحه می‌آید. یک عکسِ معادل صدها کیلوبایت بود.

   ⚠️ هر دو نقشه `aria-hidden` هستند: تزئینِ موضوعی‌اند و اطلاعاتی
   می‌گویند که متنِ کنارشان هم می‌گوید. برچسب‌های داخلشان فارسی و
   کوتاه‌اند و صفحه‌خوان نباید دوبار بخواندشان.
   ───────────────────────────────────────────────────────────── */

/**
 * نقشه‌ی چوب — از بات تا تیپ، با همان بخش‌هایی که واقعاً تعمیر
 * می‌شوند: بات، جوینت، شفت، فرول، تیپ.
 *
 * ⚠️ راست‌به‌چپ: بات (کلفت) سمتِ راست، تیپ (نازک) سمتِ چپ — همان
 * جهتی که یک فارسی‌زبان چوب را روی کاغذ می‌بیند.
 */
function CuePlate() {
  /* ⚠️ شناسه‌ی گرادیان باید یکتا باشد: اگر روزی دو نقشه‌ی هم‌نوع
     در یک سند باشند (فهرست، مقایسه، یا دو درخت در گذارِ روتر)
     هر `url(#…)` به *اولین* تعریف می‌چسبد و رنگ‌ها بی‌صدا جابه‌جا
     می‌شوند. */
  const uid = useId()
  return (
    <svg className="cp cp-cue" viewBox="0 0 880 300" role="presentation" aria-hidden focusable="false">
      <defs>
        <linearGradient id={`cp-wood-${uid}`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#6B4A2B" />
          <stop offset=".42" stopColor="#8A6134" />
          <stop offset=".76" stopColor="#C9A46A" />
          <stop offset="1" stopColor="#E4CFA4" />
        </linearGradient>
        <linearGradient id={`cp-sheen-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".34" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".22" />
        </linearGradient>
      </defs>

      {/* خطِ محور — مرجعِ همه‌ی اندازه‌ها */}
      <line className="cp-axis" pathLength={1} x1="40" y1="150" x2="840" y2="150" />

      {/* بدنه‌ی چوب: از راست کلفت به چپ نازک */}
      <path className="cp-body" fill={`url(#cp-wood-${uid})`}
        d="M842 132 L842 168 L250 161 L250 139 Z" />
      <path className="cp-body" fill={`url(#cp-wood-${uid})`}
        d="M250 139 L250 161 L96 156 L96 144 Z" />
      {/* جوینت — حلقه‌ی برنجیِ وسط */}
      <rect className="cp-joint" x="238" y="134" width="16" height="32" rx="2" />
      {/* فرول و تیپ */}
      <rect className="cp-ferrule" x="74" y="143" width="22" height="14" rx="1.5" />
      <path className="cp-tip" d="M74 143 L60 145.5 L60 154.5 L74 157 Z" />
      {/* بازتابِ طولی */}
      <path className="cp-gloss" fill={`url(#cp-sheen-${uid})`}
        d="M842 132 L842 168 L60 154.5 L60 145.5 Z" />

      {/* خط‌چین‌های اندازه‌گذاری */}
      {[[67, 'تیپ'], [85, 'فرول'], [170, 'شفت'], [246, 'جوینت'], [540, 'بات']].map(([x, label], i) => (
        <g key={label as string} className="cp-call" style={{ ['--i' as string]: i }}>
          <line className="cp-tick" x1={x as number} y1="150" x2={x as number} y2="228" />
          <circle className="cp-node" cx={x as number} cy="150" r="3" />
          <text className="cp-label" x={x as number} y="248" textAnchor="middle">{label as string}</text>
        </g>
      ))}

      {/* خطِ اندازه‌ی کلی */}
      <g className="cp-dim">
        <line className="cp-span" pathLength={1} x1="60" y1="90" x2="842" y2="90" />
        <line x1="60" y1="82" x2="60" y2="98" />
        <line x1="842" y1="82" x2="842" y2="98" />
        <text className="cp-label" x="451" y="74" textAnchor="middle">تعمیرات چوب</text>
      </g>
    </svg>
  )
}

/**
 * نقشه‌ی میز — نمای از بالا با پاکت‌ها، لوزها، خطِ بالک و کمانِ D.
 * همان چیزهایی که در «تراز مجدد» و «تعویض پارچه» و «تعویض لوز»
 * دستکاری می‌شوند.
 */
function TablePlate() {
  const uid = useId()
  /* لوزهای کنارِ ریل — سه تا در هر نیمه‌ی طولی، یکی در هر نیمه‌ی عرضی */
  /* ⚠️ هندسه باید *واقعاً* متقارن باشد؛ نقشه‌ای که ادعای دقت
     می‌کند و لوزهایش ۱۶ واحد از مرکز پرت است، خودش را نقض می‌کند.
     مرکزِ ماهوت x=440 و y=210 است. */
  const topDiamonds = [212, 288, 364, 516, 592, 668]
  const sideDiamonds = [146, 274]
  return (
    <svg className="cp cp-table" viewBox="0 0 880 420" role="presentation" aria-hidden focusable="false">
      <defs>
        <linearGradient id={`cp-cloth-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1E5540" />
          <stop offset="1" stopColor="#123425" />
        </linearGradient>
        <radialGradient id={`cp-lamp-${uid}`} cx=".5" cy="0" r=".9">
          <stop offset="0" stopColor="#F3E4BE" stopOpacity=".2" />
          <stop offset="1" stopColor="#F3E4BE" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* قابِ چوبی */}
      <rect className="cp-frame" pathLength={1} x="46" y="52" width="788" height="316" rx="16" />
      {/* سطحِ بازی */}
      <rect className="cp-cloth" x="76" y="82" width="728" height="256" rx="4" fill={`url(#cp-cloth-${uid})`} />
      <rect className="cp-cloth" x="76" y="82" width="728" height="256" rx="4" fill={`url(#cp-lamp-${uid})`} />

      {/* پاکت‌ها */}
      {[[76, 82], [440, 82], [804, 82], [76, 338], [440, 338], [804, 338]].map(([cx, cy], i) => (
        <circle key={i} className="cp-pocket" cx={cx} cy={cy} r="15" style={{ ['--i' as string]: i }} />
      ))}

      {/* خطِ بالک و کمانِ D */}
      <line className="cp-baulk" pathLength={1} x1="258" y1="82" x2="258" y2="338" />
      <path className="cp-d" pathLength={1} d="M258 168 A 42 42 0 0 0 258 252" />

      {/* لوزها */}
      {topDiamonds.map((x, i) => (
        <g key={`t${x}`} className="cp-dia" style={{ ['--i' as string]: i }}>
          <rect x={x - 4} y="62" width="8" height="8" transform={`rotate(45 ${x} 66)`} />
          <rect x={x - 4} y="350" width="8" height="8" transform={`rotate(45 ${x} 354)`} />
        </g>
      ))}
      {sideDiamonds.map((y, i) => (
        <g key={`s${y}`} className="cp-dia" style={{ ['--i' as string]: i + 6 }}>
          <rect x="52" y={y - 4} width="8" height="8" transform={`rotate(45 56 ${y})`} />
          <rect x="820" y={y - 4} width="8" height="8" transform={`rotate(45 824 ${y})`} />
        </g>
      ))}

      <g className="cp-dim">
        <line className="cp-span" pathLength={1} x1="76" y1="392" x2="804" y2="392" />
        <line x1="76" y1="384" x2="76" y2="400" />
        <line x1="804" y1="384" x2="804" y2="400" />
        <text className="cp-label" x="440" y="378" textAnchor="middle">تعمیرات میز</text>
      </g>
    </svg>
  )
}

/**
 * نقشه‌ی سرلوحه — «میزِ کار»: میز در نمای بالا و چوب کنارش، با
 * خطوطِ اندازه‌گذاری. یک ترکیب، نه تکرارِ نقشه‌ی دسته.
 *
 * ⚠️ چرا جدا: سرلوحه و کاتالوگ هر دو نقشه دارند و اگر متخصص فقط
 * یک رشته داشته باشد، *یک تصویر* دو بار روی صفحه می‌آمد. این
 * ترکیب همیشه با نقشه‌های دسته فرق دارد.
 */
export function BenchPlate() {
  const uid = useId()
  /* مرکزِ ماهوت x=440 */
  const dia = [212, 288, 364, 516, 592, 668]
  return (
    <svg className="cp cp-bench" viewBox="0 0 880 460" role="presentation" aria-hidden focusable="false">
      <defs>
        <linearGradient id={`cpb-cloth-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1E5540" />
          <stop offset="1" stopColor="#112F22" />
        </linearGradient>
        <linearGradient id={`cpb-wood-${uid}`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#6B4A2B" />
          <stop offset=".55" stopColor="#A87C42" />
          <stop offset="1" stopColor="#E4CFA4" />
        </linearGradient>
      </defs>

      {/* ⚠️ مخروطِ نورِ مثلثی برداشته شد: لبه‌های تیزش در موبایل
          مثلِ یک گوه‌ی خاکستری دیده می‌شد. نورِ صحنه از خودِ زمینِ
          صفحه می‌آید که واقعاً نرم است. */}

      {/* میز */}
      <rect className="cp-frame" pathLength={1} x="72" y="60" width="736" height="248" rx="14" />
      <rect className="cp-cloth" x="100" y="88" width="680" height="192" rx="3" fill={`url(#cpb-cloth-${uid})`} />
      {[[100, 88], [440, 88], [780, 88], [100, 280], [440, 280], [780, 280]].map(([cx, cy], i) => (
        <circle key={i} className="cp-pocket" cx={cx} cy={cy} r="13" style={{ ['--i' as string]: i }} />
      ))}
      <line className="cp-baulk" pathLength={1} x1="270" y1="88" x2="270" y2="280" />
      <path className="cp-d" pathLength={1} d="M270 152 A 32 32 0 0 0 270 216" />
      {dia.map((x, i) => (
        <g key={x} className="cp-dia" style={{ ['--i' as string]: i }}>
          <rect x={x - 3.5} y="68" width="7" height="7" transform={`rotate(45 ${x} 71.5)`} />
          <rect x={x - 3.5} y="293" width="7" height="7" transform={`rotate(45 ${x} 296.5)`} />
        </g>
      ))}

      {/* چوب، زیرِ میز — بات راست، تیپ چپ */}
      <path className="cp-body" fill={`url(#cpb-wood-${uid})`} d="M810 372 L810 392 L120 385 L120 379 Z" />
      <rect className="cp-joint" x="452" y="374" width="12" height="16" rx="1.5" />
      <rect className="cp-ferrule" x="104" y="378.5" width="16" height="7" rx="1" />
      <path className="cp-tip" d="M104 378.5 L94 380 L94 384 L104 385.5 Z" />

      {[[99, 'تیپ'], [112, 'فرول'], [458, 'جوینت'], [660, 'بات']].map(([x, label], i) => (
        <g key={label as string} className="cp-call" style={{ ['--i' as string]: i }}>
          <line className="cp-tick" x1={x as number} y1="382" x2={x as number} y2="410" />
          <text className="cp-label" x={x as number} y="430" textAnchor="middle">{label as string}</text>
        </g>
      ))}

      <g className="cp-dim">
        <line className="cp-span" pathLength={1} x1="100" y1="336" x2="780" y2="336" />
        <line x1="100" y1="329" x2="100" y2="343" />
        <line x1="780" y1="329" x2="780" y2="343" />
      </g>
    </svg>
  )
}

/** نقشه‌ی دسته را از شناسه‌اش برمی‌دارد؛ دسته‌ی ناشناس نقشه ندارد. */
export function PlateFor({ id }: { id: string }) {
  if (id === 'cue') return <CuePlate />
  if (id === 'table') return <TablePlate />
  return null
}

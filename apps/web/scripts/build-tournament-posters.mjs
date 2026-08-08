/* پوسترِ پیش‌فرضِ مسابقه — یکی برای هر نوعِ بازی.
       node scripts/build-tournament-posters.mjs

   ── چرا اسکریپت و نه پنج فایلِ دستی ──
   پنج پوستر باید **یک خانواده** به‌نظر برسند، نه پنج طرحِ جدا. با
   فایلِ دستی، اولین باری که یکی‌شان عوض شود بقیه عقب می‌مانند و
   خانواده از هم می‌پاشد. این‌جا چیدمان یکی است و فقط رنگ و توپ فرق
   می‌کنند.

   ── چرا SVG ──
   پوستر پس‌زمینه‌ی کارت و صفحه‌ی مسابقه است و باید هم در بندانگشتیِ
   ۵۴ پیکسلی خوانا بماند هم در عرضِ کامل. SVG هر دو را بدونِ نسخه‌ی
   دوم می‌دهد و مجموعِ هر پنج‌تا زیر ۲۰ کیلوبایت است.

   ── چرا متنِ فارسی داخلِ پوستر نیست ──
   SVGی که با <img> بارگذاری می‌شود سندِ جداست و به فونت‌های صفحه
   دسترسی ندارد. متنِ فارسی آن‌جا به فونتِ جایگزین می‌افتد و در بعضی
   موتورها اصلاً شکل نمی‌گیرد (حروف جدا از هم). پس فقط لاتین، با
   فونت‌های عمومی. نامِ فارسی را خودِ رابط کنارش می‌گذارد.
*/

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images', 'tournaments')
mkdirSync(OUT, { recursive: true })

const W = 1200, H = 675

/* ── طرح‌ها ──
   `accent` رنگی است که در سراسر سایت به همان بازی نسبت داده شده
   (`lib/tournaments/formats.ts`) — پوستر و برچسبِ کنارش باید یک
   رنگ داشته باشند. */
const SETS = [
  {
    key: 'snooker', name: 'SNOOKER', accent: '#C7A66A',
    /* توپِ قرمزِ اسنوکر — بدونِ شماره */
    ball: { base: '#C0231F', dark: '#5E0D0B', label: null, stripe: null },
  },
  {
    key: '8ball', name: '8-BALL', accent: '#3b82f6',
    ball: { base: '#23262B', dark: '#0A0B0D', label: '8', stripe: null },
  },
  {
    key: '9ball', name: '9-BALL', accent: '#30C55A',
    /* راه‌راهِ زرد روی سفید — همان توپِ واقعیِ شماره ۹ */
    ball: { base: '#F2EFE6', dark: '#9A968A', label: '9', stripe: '#F2C230' },
  },
  {
    key: '10ball', name: '10-BALL', accent: '#0ea5e9',
    ball: { base: '#F2EFE6', dark: '#9A968A', label: '10', stripe: '#2F6BD8' },
  },
  {
    key: 'highball', name: 'HEYBALL', accent: '#8b5cf6',
    ball: { base: '#6D3FBF', dark: '#2A1350', label: null, stripe: null },
  },
]

/* پارچه‌ی میز، نه سیاهِ خالی: پس‌زمینه‌ی تیره‌ی مایل به سبز همان
   حسِ سالنِ بیلیارد را می‌دهد و پوستر را از یک کارتِ تیره‌ی معمولی
   جدا می‌کند. */
const BG_TOP = '#0D1512'
const BG_BOT = '#050807'

const CX = 858, CY = 338, R = 196     // مرکز و شعاعِ توپ

function poster({ key, name, accent, ball }) {
  const numFont = 'Arial, Helvetica, sans-serif'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${name} tournament">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="${BG_TOP}"/>
      <stop offset="1" stop-color="${BG_BOT}"/>
    </linearGradient>

    <!-- هاله‌ی رنگیِ پشتِ توپ — تنها جایی که رنگِ بازی پررنگ دیده می‌شود -->
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.34"/>
      <stop offset="0.55" stop-color="${accent}" stop-opacity="0.10"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>

    <!-- سایه‌زنیِ کره: منبعِ نور بالا-چپ -->
    <radialGradient id="ball" cx="0.34" cy="0.28" r="0.82">
      <stop offset="0" stop-color="${ball.base}"/>
      <stop offset="0.52" stop-color="${ball.base}"/>
      <stop offset="1" stop-color="${ball.dark}"/>
    </radialGradient>

    <radialGradient id="spec" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.80"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${accent}"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>

    <clipPath id="ballClip"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- خطوطِ کمکی: زاویه‌ی ضربه. خیلی کم‌رنگ، فقط برای اینکه کادر
       خالی نماند -->
  <g stroke="#ffffff" stroke-opacity="0.045" stroke-width="1.5">
    <path d="M-40 596 L 1240 196"/>
    <path d="M-40 676 L 1240 276"/>
    <circle cx="${CX}" cy="${CY}" r="${R + 78}" fill="none" stroke-opacity="0.05"/>
  </g>

  <ellipse cx="${CX}" cy="${CY}" rx="${R * 2.1}" ry="${R * 1.9}" fill="url(#glow)"/>

  <!-- سایه‌ی تماسِ توپ با میز -->
  <ellipse cx="${CX}" cy="${CY + R + 24}" rx="${R * 0.92}" ry="26" fill="#000000" opacity="0.42"/>

  <g>
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#ball)"/>
    ${ball.stripe ? `
    <!-- نوارِ راه‌راه: بریده به خودِ کره تا لبه‌ها منحنی بمانند -->
    <g clip-path="url(#ballClip)">
      <rect x="${CX - R}" y="${CY - R * 0.56}" width="${R * 2}" height="${R * 1.12}" fill="${ball.stripe}"/>
      <rect x="${CX - R}" y="${CY - R * 0.56}" width="${R * 2}" height="${R * 1.12}" fill="url(#ball)" opacity="0.34"/>
    </g>` : ''}
    ${ball.label ? `
    <circle cx="${CX}" cy="${CY}" r="${R * 0.42}" fill="#FBFAF6"/>
    <text x="${CX}" y="${CY}" fill="#141414" font-family="${numFont}" font-size="${R * 0.62}"
          font-weight="700" text-anchor="middle" dominant-baseline="central">${ball.label}</text>` : ''}
    <!-- بازتابِ نور -->
    <ellipse cx="${CX - R * 0.36}" cy="${CY - R * 0.44}" rx="${R * 0.30}" ry="${R * 0.22}"
             fill="url(#spec)" transform="rotate(-24 ${CX - R * 0.36} ${CY - R * 0.44})"/>
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#000000" stroke-opacity="0.35" stroke-width="2"/>
  </g>

  <!-- ── متن ── -->
  <g font-family="Arial, Helvetica, sans-serif">
    <text x="96" y="226" fill="${accent}" font-size="21" font-weight="700" letter-spacing="7.5">BILLIARD HUB</text>
    <text x="96" y="330" fill="#FFFFFF" font-size="82" font-weight="700" letter-spacing="-1.5">${name}</text>
    <text x="96" y="392" fill="#FFFFFF" fill-opacity="0.52" font-size="26" font-weight="400" letter-spacing="5.5">TOURNAMENT</text>
    <rect x="96" y="428" width="286" height="3" fill="url(#rule)"/>
    <text x="96" y="502" fill="#FFFFFF" fill-opacity="0.34" font-size="17" font-weight="400" letter-spacing="2.4">billiardhub.net</text>
  </g>
</svg>
`
}

/* ── هدرِ صفحه‌ی مسابقات ─────────────────────────────────────────
   جدا از پنج پوستر، چون کارِ متفاوتی می‌کند: آن‌ها یک مسابقه‌ی
   مشخص را معرفی می‌کنند، این پس‌زمینه‌ی کلِ صفحه است و خودِ صفحه
   رویش تیتر و نوارِ جستجو می‌گذارد.

   ── چرا عکسِ قبلی برداشته شد ──
   `/images/shop/Pro_table.webp` بود — عکسِ محصولِ صفحه‌ی فروشگاه.
   ربطی به مسابقات نداشت، در دو صفحه‌ی متفاوت تکرار می‌شد، و چون
   عکسِ واقعی بود متنِ روی آن هر بار روی جزئیاتِ متفاوتی می‌افتاد و
   خوانایی‌اش قابلِ پیش‌بینی نبود.

   ── چرا رَک به‌جای یک توپ ──
   رَکِ چیده‌شده لحظه‌ی «هنوز شروع نشده» است؛ همان حسی که فهرستِ
   مسابقاتِ پیشِ‌رو باید بدهد. ترکیب هم عمداً سمتِ چپ است تا سمتِ
   راست (که در صفحه‌ی راست‌به‌چپ تیتر می‌نشیند) آرام بماند. */
function hero() {
  const W2 = 2000, H2 = 700
  /* ── چیدمانِ رَک ──
     رأس سمتِ راست و ردیف‌ها به چپ باز می‌شوند. دلیلش جهتِ صفحه است:
     در چیدمانِ راست‌به‌چپ تیتر و نوارِ جستجو سمتِ راست می‌نشینند، پس
     شلوغیِ تصویر باید سمتِ چپ باشد و رأسِ مثلث مثلِ یک فلش به سمتِ
     تیتر اشاره کند.

     نسخه‌ی اول برعکس بود و توپ‌ها دقیقاً زیرِ تیتر می‌افتادند. */
  const r = 62, gap = 4
  const apexX = 640, apexY = 352
  const balls = []
  const palette = ['#F2C230', '#2F6BD8', '#C0231F', '#6D3FBF', '#E07A2B',
                   '#1F8A4C', '#8B1A2B', '#23262B', '#F2EFE6', '#2AA5C7']
  let n = 0
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i <= row; i++) {
      const x = apexX - row * (r * 1.74 + gap)
      const y = apexY + (i - row / 2) * (r * 2 + gap)
      balls.push({ x, y, c: palette[n % palette.length], i: n })
      n++
    }
  }

  const ballSvg = (b) => `
    <g>
      <ellipse cx="${b.x}" cy="${b.y + r + 8}" rx="${r * 0.86}" ry="9" fill="#000" opacity="0.34"/>
      <circle cx="${b.x}" cy="${b.y}" r="${r}" fill="${b.c}"/>
      <circle cx="${b.x}" cy="${b.y}" r="${r}" fill="url(#shade)"/>
      <ellipse cx="${b.x - r * 0.34}" cy="${b.y - r * 0.4}" rx="${r * 0.26}" ry="${r * 0.18}"
               fill="url(#spec)" transform="rotate(-24 ${b.x - r * 0.34} ${b.y - r * 0.4})"/>
      <circle cx="${b.x}" cy="${b.y}" r="${r}" fill="none" stroke="#000" stroke-opacity="0.32" stroke-width="1.6"/>
    </g>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W2} ${H2}" width="${W2}" height="${H2}" role="img" aria-label="Billiard Hub tournaments">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="#101B16"/>
      <stop offset="1" stop-color="#050908"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#C7A66A" stop-opacity="0.26"/>
      <stop offset="1" stop-color="#C7A66A" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="shade" cx="0.34" cy="0.28" r="0.85">
      <stop offset="0" stop-color="#fff" stop-opacity="0.18"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
    </radialGradient>
    <radialGradient id="spec" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#fff" stop-opacity="0.78"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#050908" stop-opacity="0"/>
      <stop offset="0.34" stop-color="#050908" stop-opacity="0.18"/>
      <stop offset="0.68" stop-color="#050908" stop-opacity="0.72"/>
      <stop offset="1" stop-color="#050908" stop-opacity="0.94"/>
    </linearGradient>
  </defs>

  <rect width="${W2}" height="${H2}" fill="url(#bg)"/>
  <g stroke="#fff" stroke-opacity="0.04" stroke-width="1.5">
    <path d="M-60 640 L 2060 150"/>
    <path d="M-60 730 L 2060 240"/>
  </g>
  <ellipse cx="420" cy="352" rx="760" ry="480" fill="url(#glow)"/>
  ${balls.map(ballSvg).join('')}
  <!-- محوشدگی به سمتِ راست تا تیتر و جستجوی صفحه رویش خوانا بماند -->
  <rect width="${W2}" height="${H2}" fill="url(#fade)"/>
</svg>
`
}

let total = 0
for (const s of SETS) {
  const svg = poster(s)
  writeFileSync(join(OUT, `${s.key}.svg`), svg, 'utf8')
  total += Buffer.byteLength(svg)
  console.log(`  ✓ ${s.key}.svg  ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB`)
}
const h = hero()
writeFileSync(join(OUT, 'hero.svg'), h, 'utf8')
total += Buffer.byteLength(h)
console.log(`  ✓ hero.svg  ${(Buffer.byteLength(h) / 1024).toFixed(1)} KB`)

console.log(`\n✅ ${SETS.length + 1} تصویر — مجموع ${(total / 1024).toFixed(1)} KB\n`)

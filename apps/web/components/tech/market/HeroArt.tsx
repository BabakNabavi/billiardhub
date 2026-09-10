/* ─────────────────────────────────────────────────────────────
   پوسترِ سرلوحه — دو ترکیبِ متفاوت برای دو صفحه.

   ── چرا ساخته شد ──
   سرلوحه‌ی هر دو صفحه یک عکسِ تیره بود؛ مالک گفت جذاب نیست و
   می‌خواهد هر صفحه پوسترِ خودش را داشته باشد.

   ── چرا SVG و CSS، نه کتابخانه‌ی سه‌بعدی ──
   ⚠️ افزودن dependency بدون اجازه ممنوع است (CLAUDE.md)، و مخاطبِ
   اصلی موبایلِ ایرانی است: شبکه‌ی کند و CPU ضعیف. یک بوم WebGL
   برای زمینه‌ی یک سرلوحه، صدها کیلوبایت و یک حلقه‌ی رندرِ دائمی
   می‌آورد که باتری می‌خورد.

   پس عمق از چیزی می‌آید که واقعا رایگان است: چند لایه‌ی مستقل با
   `translateZ` روی یک والدِ `perspective`، نورِ رادیال، و حرکتِ خیلی
   کند فقط روی `transform`/`opacity` (هر دو روی GPU، بدون layout).

   ⚠️ هیچ‌کدام از این‌ها بایت شبکه ندارد: SVG درون‌خطی است و بخشی از
   همان HTML که به‌هرحال می‌آید.

   ⚠️ `prefers-reduced-motion` همه‌ی حرکت را خاموش می‌کند و ترکیب
   ساکن هم کامل است — حرکت تزئین است، نه محتوا.
   ───────────────────────────────────────────────────────────── */

export type HeroArtVariant = 'services' | 'profile'

/**
 * زمینه‌ی تزئینی سرلوحه. `aria-hidden` است و هیچ معنایی حمل
 * نمی‌کند؛ پیامِ صفحه در متن آمده.
 */
export function HeroArt({ variant }: { variant: HeroArtVariant }) {
  return (
    <div className={`tmha tmha--${variant}`} aria-hidden>
      {/* نورهای محیطی — لایه‌ی دور */}
      <span className="tmha-glow tmha-glow--1" />
      <span className="tmha-glow tmha-glow--2" />

      {/* لایه‌ی میانی: بافتِ ماهوت */}
      <span className="tmha-weave" />

      {variant === 'services' ? <ServicesArt /> : <ProfileArt />}

      {/* براقیِ آرامِ روی همه — لایه‌ی نزدیک */}
      <span className="tmha-sheen" />
    </div>
  )
}

/* ── خدمات فنی: دقت و ابزار ──
   کمانِ هم‌مرکز (میدانِ اندازه‌گیری) + خطِ چوب + دایره‌ی نوک. */
function ServicesArt() {
  return (
    <svg className="tmha-svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="haCue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#D9C79A" stopOpacity=".85" />
          <stop offset="1" stopColor="#8A6224" stopOpacity=".25" />
        </linearGradient>
        <radialGradient id="haTip">
          <stop offset="0" stopColor="#9CF0BE" stopOpacity="1" />
          <stop offset="1" stopColor="#128A4B" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* کمان‌های هم‌مرکز — «تراز و اندازه» */}
      <g className="tmha-rings" fill="none" stroke="#7FE0A6" strokeOpacity=".34">
        <circle cx="640" cy="150" r="90" />
        <circle cx="640" cy="150" r="140" strokeOpacity=".24" />
        <circle cx="640" cy="150" r="196" strokeOpacity=".15" />
      </g>

      {/* شبکه‌ی ظریفِ نقشه‌کشی */}
      <g stroke="#FFFFFF" strokeOpacity=".085">
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={i * 100} y1="0" x2={i * 100} y2="500" />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={i} x1="0" y1={i * 100} x2="800" y2={i * 100} />
        ))}
      </g>

      {/* خطِ چوب */}
      <g>
        <line x1="90" y1="430" x2="660" y2="118" stroke="url(#haCue)" strokeWidth="9" strokeLinecap="round" />
        <line x1="90" y1="430" x2="660" y2="118" stroke="#FFFFFF" strokeOpacity=".24" strokeWidth="1.8" strokeLinecap="round" />
      </g>

      {/* نوکِ چوب — تنها نقطه‌ی رنگیِ صحنه */}
      <circle className="tmha-tip" cx="668" cy="114" r="58" fill="url(#haTip)" />
    </svg>
  )
}

/* ── پروفایل متخصص: میدانِ ماهوت ──
   ترکیبِ عمدا متفاوت: نه کمان و نه چوب، بلکه یک میدانِ سبزِ کم‌عمق
   با نوارِ نورِ مورب — تا دو صفحه از هم تشخیص داده شوند. */
function ProfileArt() {
  return (
    <svg className="tmha-svg" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="haBar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#128A4B" stopOpacity="0" />
          <stop offset=".45" stopColor="#3FBE7C" stopOpacity=".50" />
          <stop offset="1" stopColor="#128A4B" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="haPocket">
          <stop offset=".55" stopColor="#000000" stopOpacity=".55" />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* نوارهای نورِ مورب */}
      <g className="tmha-bars">
        <rect x="-120" y="40" width="1040" height="54" fill="url(#haBar)" transform="rotate(-14 400 200)" />
        <rect x="-120" y="210" width="1040" height="30" fill="url(#haBar)" opacity=".6" transform="rotate(-14 400 200)" />
      </g>

      {/* گوشه‌ی میز — عمقِ ملایم */}
      <circle cx="86" cy="330" r="120" fill="url(#haPocket)" />
      <circle cx="724" cy="74" r="150" fill="url(#haPocket)" opacity=".7" />

      {/* خطِ باند */}
      <line x1="0" y1="318" x2="800" y2="264" stroke="#FFFFFF" strokeOpacity=".14" strokeWidth="2" />
    </svg>
  )
}

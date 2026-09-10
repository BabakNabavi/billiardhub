/* ─────────────────────────────────────────────────────────────
   پوسترِ سرلوحه — دو صحنه‌ی متفاوت برای دو صفحه.

   ── چرا نسخه‌ی اول رد شد ──
   مالک گفت «بچه‌گانه». درست بود: چند لکه‌ی نورِ تخت، یک خطِ مورب و
   یک شبکه — همان چیزی که هر قالبِ آماده‌ای دارد. هیچ *جسمی* در
   صحنه نبود، پس چیزی هم برای نگاه‌کردن نبود.

   ── چه چیزی عوض شد ──
   حالا صحنه جسم دارد و اجسام حجم دارند. حجم از چهار چیز می‌آید که
   هیچ‌کدام موتورِ سه‌بعدی لازم ندارند:
     · نورِ اصلی از یک سو و پایانه‌ی سایه در سوی دیگر
     · نورِ بازتابیِ ضعیف روی لبه‌ی تاریک (وگرنه کره تخت می‌شود)
     · هایلایتِ آینه‌ای، کوچک و جابه‌جا از مرکز
     · سایه‌ی تماس روی سطح — بدونش جسم شناور است، نه نشسته

   ── چرا باز هم SVG ──
   ⚠️ افزودن dependency بدون اجازه ممنوع است، و مخاطبِ اصلی موبایلِ
   ایرانی است: شبکه‌ی کند و CPU ضعیف. گرادیانِ SVG رایگان است و
   بایتِ شبکه هم ندارد (درون‌خطی است)؛ WebGL هیچ‌کدام نیست.

   ⚠️ حرکت فقط روی `transform` و `opacity` است. هیچ فیلتری متحرک
   نیست: انیمیشنِ فیلتر هر فریم دوباره رستر می‌کند و همان چیزی است
   که گوشیِ ضعیف را می‌خواباند.

   ⚠️ `prefers-reduced-motion` همه را می‌ایستاند و صحنه‌ی ساکن خودش
   کامل است.
   ───────────────────────────────────────────────────────────── */

export type HeroArtVariant = 'services' | 'profile'

export function HeroArt({ variant }: { variant: HeroArtVariant }) {
  return (
    <div className={`tmha tmha--${variant}`} aria-hidden>
      {variant === 'services' ? <ServicesScene /> : <ProfileScene />}
      {/* دانه‌ی ریز: همان چیزی که سطحِ دیجیتال را از «گرادیانِ تخت»
          به «ماده» می‌برد. گرادیانِ بی‌دانه همیشه ارزان دیده می‌شود. */}
      <span className="tmha-grain" />
      <span className="tmha-sheen" />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   خدمات فنی — دقتِ ابزار
   کره در کانون، نوکِ چوب که به آن نزدیک می‌شود، و یک لایه‌ی نازکِ
   مدرج که «اندازه‌گیری» را می‌رساند.
   ═══════════════════════════════════════════════════════════ */
function ServicesScene() {
  /* ⚠️ `xMin` نه `xMid`: قابِ موبایل باریک و بلند است و `slice`
     وسطِ صحنه را نگه می‌دارد — یعنی دقیقا کره را از کادر بیرون
     می‌انداخت و فقط زمینه‌ی خالی می‌ماند. با چسباندن به لبه‌ی
     شروع، جسمِ اصلی همیشه در کادر است. روی دسکتاپ بی‌اثر است
     چون آن‌جا برش عمودی است نه افقی. */
  return (
    <svg className="tmha-svg" viewBox="0 0 1200 600" preserveAspectRatio="xMinYMid slice">
      <defs>
        <radialGradient id="svcGround" cx="76%" cy="8%" r="86%">
          <stop offset="0" stopColor="#1B4A36" />
          <stop offset=".42" stopColor="#11291F" />
          <stop offset="1" stopColor="#0B0D0F" />
        </radialGradient>

        {/* کره: هایلایت بالا-چپ، پایانه، و تاریکیِ لبه */}
        <radialGradient id="svcBall" cx="34%" cy="27%" r="78%">
          <stop offset="0" stopColor="#7BF0B4" />
          <stop offset=".22" stopColor="#2FBF77" />
          <stop offset=".58" stopColor="#0E7A46" />
          <stop offset=".86" stopColor="#04301C" />
          <stop offset="1" stopColor="#02150E" />
        </radialGradient>
        {/* نورِ بازتابی روی لبه‌ی تاریک — بدونِ این، کره تخت است */}
        <radialGradient id="svcRim" cx="72%" cy="82%" r="46%">
          <stop offset="0" stopColor="#3FBE7C" stopOpacity=".55" />
          <stop offset="1" stopColor="#3FBE7C" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="svcSpec" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".92" />
          <stop offset=".55" stopColor="#FFFFFF" stopOpacity=".22" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>

        {/* فلز: نوارِ روشن در میانه، تیره در دو لبه — همان چیزی که
            استوانه را استوانه نشان می‌دهد */}
        <linearGradient id="svcFerrule" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6B5B3A" />
          <stop offset=".34" stopColor="#F2E4C4" />
          <stop offset=".62" stopColor="#C9AE79" />
          <stop offset="1" stopColor="#4A3D26" />
        </linearGradient>
        <linearGradient id="svcShaft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A3025" />
          <stop offset=".36" stopColor="#B99A66" />
          <stop offset=".70" stopColor="#7A6440" />
          <stop offset="1" stopColor="#2A241B" />
        </linearGradient>

        {/* ⚠️ فیلترِ محوِ هاله برداشته شد: همان نتیجه با گرادیانِ
            رادیال به‌دست می‌آید و رستر نمی‌خواهد. روی گوشیِ ضعیف،
            محوِ تمام‌قاب گران‌ترین کارِ این صحنه بود. */}
        <radialGradient id="svcHalo">
          <stop offset="0" stopColor="#128A4B" stopOpacity=".46" />
          <stop offset=".55" stopColor="#128A4B" stopOpacity=".20" />
          <stop offset="1" stopColor="#128A4B" stopOpacity="0" />
        </radialGradient>
        <filter id="svcContact" x="-60%" y="-160%" width="220%" height="420%">
          <feGaussianBlur stdDeviation="17" />
        </filter>
      </defs>

      <rect width="1200" height="600" fill="url(#svcGround)" />

      {/* ⚠️ کلِ صحنه آینه می‌شود. علتش ترکیب است نه سلیقه: پرده‌ی
          دسکتاپ سمتِ راست (سمتِ متن) مات است و سمتِ چپ باز. صحنه‌ی
          اولیه کره را سمتِ راست گذاشته بود، یعنی بهترین جسمِ صحنه
          زیرِ مات‌ترین بخش پنهان می‌شد و سمتِ باز فقط شفتِ خالی
          داشت. با آینه، برخوردِ نوکِ چوب و کره در نور می‌افتد. */}
      <g transform="translate(1200,0) scale(-1,1)">

      <ellipse className="tmha-halo" cx="880" cy="250" rx="300" ry="255" fill="url(#svcHalo)" />

      {/* لایه‌ی مدرج */}
      <g className="tmha-rings" fill="none" stroke="#8FE3B4">
        <circle cx="880" cy="278" r="196" strokeOpacity=".20" />
        <circle cx="880" cy="278" r="258" strokeOpacity=".11" />
        <g strokeOpacity=".26" strokeWidth="1.5">
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2
            const r2 = i % 6 === 0 ? 176 : 187
            return (
              <line key={i}
                x1={(880 + Math.cos(a) * 196).toFixed(1)}
                y1={(278 + Math.sin(a) * 196).toFixed(1)}
                x2={(880 + Math.cos(a) * r2).toFixed(1)}
                y2={(278 + Math.sin(a) * r2).toFixed(1)} />
            )
          })}
        </g>
      </g>

      <ellipse cx="872" cy="436" rx="132" ry="26" fill="#000" opacity=".55" filter="url(#svcContact)" />

      {/* چوب: شفت، فرول، تیپ */}
      {/* ⚠️ یک چرخش روی *والد*، نه سه چرخش جدا. نسخه‌ی قبلی هر تکه
          را حول مرکزِ خودش می‌چرخاند، پس سه قطعه از هم جدا می‌شدند:
          انتهای شفت روی (۶۷۲،۲۹۲) می‌افتاد و فرول روی (۶۶۵،۳۶۶) —
          ۷۴ واحد فاصله. در تصویر یک میله‌ی معلق دیده می‌شد و یک
          قرصِ روشنِ بی‌ربط کنارش. */}
      <g className="tmha-cue" transform="rotate(-13 690 360)">
        <rect x="60" y="351" width="606" height="19" rx="9.5" fill="url(#svcShaft)" />
        <rect x="664" y="347" width="52" height="27" rx="8" fill="url(#svcFerrule)" />
        <path d="M716 347h11a13.5 13.5 0 0 1 0 27h-11z" fill="#D9CBB0" opacity=".92" />
      </g>

      <g className="tmha-ball">
        <circle cx="880" cy="278" r="128" fill="url(#svcBall)" />
        <circle cx="880" cy="278" r="128" fill="url(#svcRim)" />
        <ellipse cx="836" cy="228" rx="42" ry="30" fill="url(#svcSpec)"
          transform="rotate(-24 836 228)" />
        <ellipse cx="932" cy="342" rx="20" ry="9" fill="#8FE3B4" opacity=".22" />
      </g>
      </g>
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════
   پروفایل متخصص — سطحِ کار
   ⚠️ عمدا صحنه‌ی دیگری: نور از چپ می‌آید نه راست، افق پایین‌تر
   است، و به‌جای یک کره دو توپ با عمقِ میدان می‌آید. دو صفحه باید
   با یک نگاه از هم تشخیص داده شوند.
   ═══════════════════════════════════════════════════════════ */
function ProfileScene() {
  /* ⚠️ سربرگِ پروفایل یک **نوارِ پهن و کوتاه** است (روی ۱۴۴۰ حدود
     ۱۷۰ پیکسل). صحنه‌ی اولِ این‌جا برای قابِ بلند ساخته شده بود، پس
     `slice` فقط بالای توپ را نگه می‌داشت و بقیه لکه‌ی محو می‌شد.
     نسبتِ viewBox به همان نوار نزدیک شد و اجسام کوچک‌تر و روی یک
     خط نشستند.

     ⚠️ و عمدا صحنه‌ی دیگری است: نور از چپ، پالتِ گرم (برنجی) به‌جای
     سبزِ اشباع، و دو جسم به‌جای یک کره — دو صفحه باید با یک نگاه
     از هم تشخیص داده شوند. */
  return (
    <svg className="tmha-svg" viewBox="0 0 1200 300" preserveAspectRatio="xMinYMid slice">
      <defs>
        <linearGradient id="prfGround" x1="0" y1="0" x2=".4" y2="1">
          <stop offset="0" stopColor="#17392B" />
          <stop offset=".55" stopColor="#0D1F17" />
          <stop offset="1" stopColor="#090B0C" />
        </linearGradient>
        <linearGradient id="prfRake" x1="0" y1="0" x2="1" y2=".5">
          <stop offset="0" stopColor="#4FD394" stopOpacity="0" />
          <stop offset=".28" stopColor="#4FD394" stopOpacity=".24" />
          <stop offset=".58" stopColor="#4FD394" stopOpacity=".07" />
          <stop offset="1" stopColor="#4FD394" stopOpacity="0" />
        </linearGradient>

        {/* برنجی — گرمِ عمدی، در برابر سبزِ صفحه‌ی خدمات */}
        <radialGradient id="prfBallA" cx="32%" cy="26%" r="78%">
          <stop offset="0" stopColor="#FFF3D2" />
          <stop offset=".24" stopColor="#E8CD8E" />
          <stop offset=".62" stopColor="#9C7838" />
          <stop offset=".88" stopColor="#3E2F18" />
          <stop offset="1" stopColor="#1C150B" />
        </radialGradient>
        <radialGradient id="prfRim" cx="74%" cy="80%" r="46%">
          <stop offset="0" stopColor="#E8CD8E" stopOpacity=".42" />
          <stop offset="1" stopColor="#E8CD8E" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="prfBallB" cx="32%" cy="26%" r="78%">
          <stop offset="0" stopColor="#D6EDE0" />
          <stop offset=".28" stopColor="#63AE8E" />
          <stop offset=".66" stopColor="#1F5A41" />
          <stop offset="1" stopColor="#0A1D16" />
        </radialGradient>
        <radialGradient id="prfSpec" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".9" />
          <stop offset=".5" stopColor="#FFFFFF" stopOpacity=".16" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="prfHalo">
          <stop offset="0" stopColor="#12A167" stopOpacity=".34" />
          <stop offset=".55" stopColor="#12A167" stopOpacity=".15" />
          <stop offset="1" stopColor="#12A167" stopOpacity="0" />
        </radialGradient>
        {/* عمقِ میدان: جسمِ دورتر نرم‌تر است */}
        <filter id="prfFar" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
        <filter id="prfContact" x="-70%" y="-260%" width="240%" height="620%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      <rect width="1200" height="300" fill="url(#prfGround)" />
      <rect className="tmha-rake" width="1200" height="300" fill="url(#prfRake)" />

      <ellipse className="tmha-halo" cx="180" cy="96" rx="270" ry="180" fill="url(#prfHalo)" />

      {/* خطِ باند — افقِ صحنه */}
      <path d="M0 228h1200" stroke="#FFFFFF" strokeOpacity=".06" strokeWidth="2" />

      {/* جسمِ دور */}
      <g filter="url(#prfFar)" opacity=".8">
        <ellipse cx="352" cy="230" rx="38" ry="8" fill="#000" opacity=".5" />
        <circle cx="356" cy="198" r="34" fill="url(#prfBallB)" />
        <ellipse cx="345" cy="185" rx="10" ry="7" fill="url(#prfSpec)" transform="rotate(-22 345 185)" />
      </g>

      {/* جسمِ نزدیک */}
      <g className="tmha-ball">
        <ellipse cx="170" cy="231" rx="66" ry="12" fill="#000" opacity=".55" filter="url(#prfContact)" />
        <circle cx="176" cy="166" r="64" fill="url(#prfBallA)" />
        <circle cx="176" cy="166" r="64" fill="url(#prfRim)" />
        <ellipse cx="154" cy="141" rx="20" ry="14" fill="url(#prfSpec)" transform="rotate(-24 154 141)" />
        <ellipse cx="204" cy="200" rx="11" ry="5" fill="#FFE9B8" opacity=".22" />
      </g>
    </svg>
  )
}

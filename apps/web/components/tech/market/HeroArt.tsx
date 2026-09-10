/* ─────────────────────────────────────────────────────────────
   پوسترِ سرلوحه — دو صحنه، هر کدام برای موضوعِ صفحه‌ی خودش.

   ── چرا دو نسخه‌ی قبلی رد شدند ──
   اولی لکه‌های نورِ تخت بود؛ دومی یک کره و یک چوب. مالک هر دو را رد
   کرد و بارِ دوم گفت «مناسبِ موضوعِ صفحه نیست». مشکل *تکنیک* نبود،
   **موضوع** بود: کره و چوب یعنی «بیلیارد»، نه «خدماتِ فنی».

   ── موضوعِ تازه: ابزار و اندازه‌گیری ──
     · صفحه‌ی خدمات — کولیس روی فرولِ چوب
     · صفحه‌ی متخصص — خودِ چوب، سرتاسرِ نوار

   ── چرا SVG و نه تصویرِ تولیدشده ──
   ⚠️ زنجیره‌ی تولیدِ تصویرِ هوش مصنوعی روی این دستگاه نصب نیست:
   `ai-multimodal`، `ai-artist` و محیطِ پایتونِ مشترک وجود ندارند و
   خودِ پایتون هم نصب نیست.

   ── قاعده‌ی کادر ──
   ⚠️ `slice` با max مقیاس می‌دهد، پس روی قابِ باریک فقط نوارِ
   باریکی از عرضِ viewBox دیده می‌شود. سرلوحه‌ی خدمات روی ۳۹۰ حدود
   ۵۲۰ واحد نشان می‌دهد، پس همه‌ی اجسام زیر x=۵۶۰ چیده شده‌اند.
   نوارِ پروفایل اما روی موبایل *بلند* می‌شود و فقط ~۲۰۰ واحد
   می‌ماند؛ آن‌جا یک ترکیبِ دومِ عمودی رندر می‌شود، نه همان صحنه.

   ⚠️ سایه‌ی تماس گرادیان است نه `feGaussianBlur`: فیلتر داخل گروهِ
   متحرک، هر فریم دوباره رستر می‌شود.
   ───────────────────────────────────────────────────────────── */

export type HeroArtVariant = 'services' | 'profile'

export function HeroArt({ variant }: { variant: HeroArtVariant }) {
  return (
    <div className={`tmha tmha--${variant}`} aria-hidden>
      {variant === 'services' ? <ServicesScene /> : <ProfileScene />}
      <span className="tmha-grain" />
      <span className="tmha-sheen" />
    </div>
  )
}

/* مواد مشترک. `id` پیشونداست تا دو صحنه در یک سند تصادم نکنند. */
function Materials({ id }: { id: string }) {
  return (
    <>
      {/* استوانه: لبه‌ی تیره ← نوارِ روشن ← میانه ← لبه‌ی تیره */}
      <linearGradient id={`${id}Steel`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2A2E33" />
        <stop offset=".18" stopColor="#8E97A1" />
        <stop offset=".38" stopColor="#E7ECF1" />
        <stop offset=".58" stopColor="#9BA3AD" />
        <stop offset=".82" stopColor="#4C535B" />
        <stop offset="1" stopColor="#31383F" />
      </linearGradient>
      <linearGradient id={`${id}SteelDim`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#202428" />
        <stop offset=".3" stopColor="#5E666F" />
        <stop offset=".55" stopColor="#8A939D" />
        <stop offset="1" stopColor="#2A3036" />
      </linearGradient>
      <linearGradient id={`${id}Brass`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4A3B1E" />
        <stop offset=".22" stopColor="#C9A85F" />
        <stop offset=".42" stopColor="#F6E7BF" />
        <stop offset=".66" stopColor="#B08F4D" />
        <stop offset="1" stopColor="#332714" />
      </linearGradient>
      <linearGradient id={`${id}Wood`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2C2117" />
        <stop offset=".26" stopColor="#9A7345" />
        <stop offset=".46" stopColor="#C99A64" />
        <stop offset=".72" stopColor="#7A5A34" />
        <stop offset="1" stopColor="#241A11" />
      </linearGradient>
      {/* سایه‌ی تماس — گرادیان، نه فیلتر */}
      <radialGradient id={`${id}Shadow`}>
        <stop offset="0" stopColor="#000000" stopOpacity=".62" />
        <stop offset=".6" stopColor="#000000" stopOpacity=".26" />
        <stop offset="1" stopColor="#000000" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}Glint`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
        <stop offset=".5" stopColor="#FFFFFF" stopOpacity=".8" />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════
   صفحه‌ی خدمات — کولیس روی فرول

   ⚠️ فک‌ها واقعا فرول را در بر می‌گیرند: لبه‌ی راستِ فکِ ثابت ۲۸۲،
   شانه‌ی فرول ۲۸۲، و گنبدِ نوک تا ۳۸۱ می‌رسد که فکِ متحرک از ۳۸۰
   شروع می‌شود — یعنی تماس، نه فاصله.
   ⚠️ فرول عمدا از ۲۷۰ کشیده شده، ۱۲ واحد زیرِ چوب: چوب و فرول با
   `.tmha-cue` ۱۰ واحد drift می‌کنند ولی کولیس نمی‌کند، پس درزِ
   لب‌به‌لب از پشتِ فک بیرون می‌آمد. با هم‌پوشانی، drift نمی‌تواند
   بازش کند.
   ═══════════════════════════════════════════════════════════ */
function ServicesScene() {
  return (
    <svg className="tmha-svg" viewBox="0 0 1200 600" preserveAspectRatio="xMinYMid slice">
      <defs>
        <Materials id="svc" />
        <radialGradient id="svcGround" cx="24%" cy="26%" r="84%">
          <stop offset="0" stopColor="#1A3A2C" />
          <stop offset=".44" stopColor="#101A16" />
          <stop offset="1" stopColor="#08090A" />
        </radialGradient>
        <radialGradient id="svcKey">
          <stop offset="0" stopColor="#3FBE7C" stopOpacity=".36" />
          <stop offset=".55" stopColor="#128A4B" stopOpacity=".15" />
          <stop offset="1" stopColor="#128A4B" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="600" fill="url(#svcGround)" />
      <ellipse className="tmha-halo" cx="250" cy="200" rx="400" ry="320" fill="url(#svcKey)" />

      {/* لایه‌ی مدرجِ پس‌زمینه */}
      <g stroke="#8FE3B4" strokeOpacity=".13" strokeWidth="1.4">
        {Array.from({ length: 22 }, (_, i) => (
          <line key={i} x1={20 + i * 24} y1="418" x2={20 + i * 24} y2={i % 5 === 0 ? 382 : 402} />
        ))}
        <line x1="20" y1="418" x2="530" y2="418" strokeOpacity=".22" />
      </g>

      {/* ── چوب ── */}
      <g className="tmha-cue">
        <ellipse cx="160" cy="284" rx="250" ry="20" fill="url(#svcShadow)" />
        <rect x="-40" y="234" width="322" height="34" rx="0" fill="url(#svcWood)" />
        <g stroke="#3A2A18" strokeOpacity=".38" strokeWidth="1.2">
          <path d="M-20 246h270M-20 254h270M-20 261h270" />
        </g>
        <rect x="270" y="236" width="96" height="30" rx="0" fill="url(#svcBrass)" />
        <path d="M366 236a15 15 0 0 1 0 30z" fill="#CBBFA6" />
      </g>

      {/* ── کولیس ── */}
      <g>
        {/* بدنه و فکِ ثابت — بی‌حرکت */}
        <rect x="250" y="172" width="310" height="32" rx="8" fill="url(#svcSteel)" />
        <g stroke="#1B2024" strokeOpacity=".55" strokeWidth="1.4">
          {Array.from({ length: 16 }, (_, i) => (
            <line key={i} x1={268 + i * 18} y1="176" x2={268 + i * 18} y2={i % 4 === 0 ? 192 : 185} />
          ))}
        </g>
        <rect x="260" y="194" width="22" height="76" rx="5" fill="url(#svcSteel)" />

        {/* ⚠️ فقط کشویی و فکِ متحرک انیمیشن می‌گیرند. نسخه‌ی قبلی کلِ
            ابزار را جابه‌جا می‌کرد، یعنی کولیس «باز» نمی‌شد بلکه
            سُر می‌خورد و رابطه‌اش با فرول به هم می‌ریخت. */}
        <g className="tmha-caliper">
          <rect x="380" y="206" width="20" height="64" rx="5" fill="url(#svcSteelDim)" />
          <rect x="366" y="164" width="56" height="48" rx="8" fill="url(#svcSteelDim)" />
          <rect x="374" y="172" width="40" height="6" rx="3" fill="#E7ECF1" opacity=".55" />
        </g>

        {/* برقِ رونده — مسیرش با متغیر تنظیم می‌شود */}
        <rect className="tmha-glint tmha-glint--beam" x="250" y="172" width="110" height="32" rx="8"
          fill="url(#svcGlint)" opacity=".5" />
      </g>
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════
   صفحه‌ی متخصص — چوب

   ⚠️ دو ترکیب، نه یکی. نوارِ دسکتاپ پهن و کوتاه است (~۱۷۳ پیکسل)
   ولی روی موبایل محتوا روی هم می‌چیند و نوار بلند می‌شود؛ آن‌وقت
   `slice` فقط ~۲۰۰ واحد از عرض را نگه می‌دارد و صحنه‌ی افقی کاملا
   بیرون از کادر می‌افتد. پس یک ترکیبِ عمودیِ جدا برای موبایل.
   ═══════════════════════════════════════════════════════════ */
function ProfileScene() {
  return (
    <>
      <svg className="tmha-svg tmha-wide" viewBox="0 0 1200 160" preserveAspectRatio="xMinYMid slice">
        <defs>
          <Materials id="prf" />
          <linearGradient id="prfGround" x1="0" y1="0" x2=".4" y2="1">
            <stop offset="0" stopColor="#15332A" />
            <stop offset=".55" stopColor="#0D1A16" />
            <stop offset="1" stopColor="#08090A" />
          </linearGradient>
          <radialGradient id="prfKey">
            <stop offset="0" stopColor="#E8CD8E" stopOpacity=".24" />
            <stop offset=".55" stopColor="#B98F3E" stopOpacity=".09" />
            <stop offset="1" stopColor="#B98F3E" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="1200" height="160" fill="url(#prfGround)" />
        <ellipse className="tmha-halo" cx="330" cy="36" rx="380" ry="160" fill="url(#prfKey)" />
        <path d="M0 132h1200" stroke="#FFFFFF" strokeOpacity=".07" strokeWidth="2" />

        {/* ⚠️ سه ابزارِ پراکنده بود و هر سه روی محتوا می‌افتاد: دسته‌ی
            آچار زیرِ دکمه‌ها و سوهان پشتِ ردیفِ چیپ‌ها. علتش ساختاری
            است — نوار تمام‌عرض است ولی محتوا در ظرفِ وسط‌چین، پس
            «ناحیه‌ی خالی» با عرضِ پنجره جابه‌جا می‌شود و هیچ نقطه‌ی
            امنی برای جسمِ کوچک نمی‌ماند. یک جسمِ پیوسته‌ی سرتاسری این
            مشکل را ندارد: از هرجا رد شود، عمدی خوانده می‌شود. */}
        <g className="tmha-tool-a">
          <ellipse cx="300" cy="150" rx="330" ry="9" fill="url(#prfShadow)" />
          <rect x="-60" y="118" width="400" height="27" rx="0" fill="url(#prfWood)" />
          <g stroke="#3A2A18" strokeOpacity=".34" strokeWidth="1.1">
            <path d="M-40 127h380M-40 134h380M-40 140h380" />
          </g>
          <rect x="334" y="116" width="19" height="31" rx="0" fill="url(#prfBrass)" />
          <rect x="347" y="120" width="72" height="23" rx="0" fill="url(#prfBrass)" />
          <path d="M417 120a11.5 11.5 0 0 1 0 23z" fill="#CBBFA6" />
          <rect className="tmha-glint tmha-glint--beam" x="-60" y="118" width="150" height="27" rx="0"
            fill="url(#prfGlint)" opacity=".4" />
        </g>
      </svg>

      {/* ── ترکیبِ موبایل: همان چوب، روی قطر ── */}
      <svg className="tmha-svg tmha-tall" viewBox="0 0 420 420" preserveAspectRatio="xMidYMid slice">
        <defs>
          <Materials id="prm" />
          <linearGradient id="prmGround" x1="0" y1="0" x2=".5" y2="1">
            <stop offset="0" stopColor="#15332A" />
            <stop offset=".55" stopColor="#0D1A16" />
            <stop offset="1" stopColor="#08090A" />
          </linearGradient>
          <radialGradient id="prmKey">
            <stop offset="0" stopColor="#E8CD8E" stopOpacity=".24" />
            <stop offset=".55" stopColor="#B98F3E" stopOpacity=".09" />
            <stop offset="1" stopColor="#B98F3E" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="420" height="420" fill="url(#prmGround)" />
        <ellipse className="tmha-halo" cx="120" cy="90" rx="240" ry="220" fill="url(#prmKey)" />

        <g transform="rotate(31 210 210)">
          <g className="tmha-tool-a">
            <ellipse cx="250" cy="232" rx="250" ry="12" fill="url(#prmShadow)" />
            <rect x="100" y="192" width="420" height="30" rx="0" fill="url(#prmWood)" />
            <g stroke="#3A2A18" strokeOpacity=".34" strokeWidth="1.1">
              <path d="M120 202h380M120 209h380M120 216h380" />
            </g>
            <rect x="86" y="190" width="20" height="34" rx="0" fill="url(#prmBrass)" />
            <rect x="16" y="194" width="76" height="26" rx="0" fill="url(#prmBrass)" />
            <path d="M18 194a13 13 0 0 0 0 26z" fill="#CBBFA6" />
            <rect className="tmha-glint" x="100" y="192" width="160" height="30" rx="0"
              fill="url(#prmGlint)" opacity=".4" />
          </g>
        </g>
      </svg>
    </>
  )
}

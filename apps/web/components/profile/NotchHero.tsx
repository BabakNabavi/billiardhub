'use client'

/* ─────────────────────────────────────────────────────────────
   سرصفحه‌ی پروفایل: کاور با گودیِ موجی + آواتارِ وسط.

   ── چرا کامپوننتِ مشترک ──
   این هندسه هفت بار بازنویسی شد تا درست دربیاید، و بعد قرار بود
   برای صفحه‌ی داور دوباره کپی شود. کپیِ دوم یعنی دفعه‌ی بعد یکی از
   دو نسخه اصلاح می‌شود و آن یکی جا می‌ماند — همان الگویی که امروز
   در تیکِ آبی و در `verified` سه بار دیدیم.

   ── هندسه ──
   موج تابعِ y(x) = D·(1 − (1 − u²)³) است با u = x/S، که در x = 0
   مماسِ افقی دارد (پس به لبه‌ی صاف نرم می‌چسبد) و در قله هم.
   D = 1.10·R (ده درصد فاصله‌ی سفید — با سه درصد قله بیش از حد به
   لوگو می‌چسبید) و S = √(6·D·R) = 2.569·R، پس جعبه همیشه
   5.138R × 1.10R است. نسبتش ثابت است، پس شکل با هر اندازه‌ای یکی
   می‌ماند و در viewBox کش نمی‌آید.

   نقاطِ کنترل با تبدیلِ Hermite→Bézier از مشتقِ *واقعیِ* تابع
   ساخته شده‌اند. مولد: `scripts/gen-notch-wave.mjs` — عددها دستی
   نیستند و با اجرای دوباره‌ی همان اسکریپت بازتولید می‌شوند.
   بیشترین خطای منحنی نسبت به تابع ۰٫۲۲۹ واحد است (۰٫۲۱٪ عمق).
   ───────────────────────────────────────────────────────────── */

export const NOTCH_WAVE =
  'M0,110 C21.409,110 42.817,108.684 64.226,100.789'
  + ' C85.635,92.893 107.044,79.063 128.452,63.594'
  + ' C149.861,48.125 171.27,31.448 192.678,19.363'
  + ' C214.087,7.278 235.496,0 256.905,0'
  + ' C278.313,0 299.722,7.278 321.131,19.363'
  + ' C342.54,31.448 363.948,48.125 385.357,63.594'
  + ' C406.766,79.063 428.174,92.893 449.583,100.789'
  + ' C470.992,108.684 492.401,110 513.809,110 Z'

/* ماسک: مستطیلِ کامل منهای همان موج (evenodd) */
const NOTCH_PATH = 'M0,0 H513.809 V110 H0 Z' + NOTCH_WAVE
const NOTCH_SVG =
  `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 513.809 110' preserveAspectRatio='none'><path fill='%23000' fill-rule='evenodd' d='${NOTCH_PATH}'/></svg>")`

/* چهار لایه‌ی ماسک با ترکیبِ *پیش‌فرض* (اجتماع): جعبه‌ی گودی، نوارِ
   بالا، و دو نوارِ کناری. عمداً `mask-composite` استفاده نشد چون
   کلیدواژه‌اش در وبکیتِ قدیمی فرق دارد و مخاطبِ اصلی سافاریِ آیفون است.

   ⚠️ لایه‌ها ۱ پیکسل *روی هم* می‌افتند، نه پهلوبه‌پهلو.
   با ترکیبِ add (کروم و سافاریِ ۱۵٫۴ به بعد) لبه‌های نرم‌شده جمع
   می‌شوند و آلفا به ۱ می‌رسد. ولی وبکیتِ قدیمی پیش‌فرضش source-over
   است: همان دو لبه به ۰٫۷۸ می‌رسند، یعنی یک خطِ نازکِ نیمه‌شفاف روی
   مرزِ لایه‌ها که فقط روی آیفون دیده می‌شود، نه در کروم.
   همپوشانی این حالت را از اساس حذف می‌کند. */
const OVERLAP = '1px'
export const NOTCH_MASK = {
  image: `${NOTCH_SVG}, linear-gradient(#000,#000), linear-gradient(#000,#000), linear-gradient(#000,#000)`,
  size: [
    'var(--boxW) var(--boxH)',
    `100% calc(100% - var(--boxH) + ${OVERLAP})`,
    `calc(50% - var(--boxW) / 2 + ${OVERLAP}) var(--boxH)`,
    `calc(50% - var(--boxW) / 2 + ${OVERLAP}) var(--boxH)`,
  ].join(', '),
  position: 'bottom center, top left, bottom left, bottom right',
} as const

/* متغیرهایی که کارتِ دربرگیرنده باید داشته باشد. قطرِ آواتار روی
   کارت تعریف می‌شود چون هم کاور برای بریدنِ گودی لازمش دارد هم
   خودِ آواتار. */
export const NOTCH_CARD_VARS = {
  '--av': 'clamp(112px,15vw,152px)',
} as React.CSSProperties

/* ── کاور ───────────────────────────────────────────────────── */

export function NotchCover({ coverImage, label, onCoverClick }: {
  coverImage?: string
  /** نوشته‌ی لاتینِ گوشه — «PROFESSIONAL COACH»، «PROFESSIONAL REFEREE»، … */
  label: string
  onCoverClick?: () => void
}) {
  return (
    <div className="lq-enter-sheen" style={{
      position: 'relative', height: 'var(--coverH)', '--coverH': 'clamp(190px,30vw,260px)',
      overflow: 'hidden', background: 'linear-gradient(115deg,#0c1424 0%,#17253f 55%,#1e2f4d 100%)',
      /* ⚠️ لبه‌ی پایینِ کاور صاف است و کناره‌ها بالا نمی‌آیند. یک زمانی
         این‌جا کمانِ بیضی بود که دو گوشه را بالا می‌برد — درست وارونه‌ی
         چیزی که باید. تنها انحنا همان گودیِ دایره‌ایِ زیر است.

         ⚠️ بی‌سقف، عمداً. یک بار سقفِ عرض گذاشتم تا زیرِ ۳۰۴ پیکسل دو
         سرِ موج بیرون نزند؛ ولی سقف روی *شعاع* بود، پس عمقِ موج را هم
         کوچک می‌کرد و در ۲۸۰ پیکسل قله ۱٫۶ پیکسل زیرِ تارکِ لوگو
         می‌افتاد. کم‌ترین عرضی که موج در آن جا می‌شود ۳۱۲ پیکسل است و
         کوچک‌ترین دستگاهِ واقعی ۳۲۰.

         نامِ متغیر --notch-r است نه --r: متغیرِ ارث‌بر با نامِ عام روی
         یک کارت، دیر یا زود با چیزِ دیگری برخورد می‌کند. */
      '--notch-r': 'calc(var(--av) / 2)',
      '--boxW': 'calc(var(--notch-r) * 5.138)',
      '--boxH': 'calc(var(--notch-r) * 1.1)',
      WebkitMaskImage: NOTCH_MASK.image, maskImage: NOTCH_MASK.image,
      WebkitMaskSize: NOTCH_MASK.size, maskSize: NOTCH_MASK.size,
      WebkitMaskPosition: NOTCH_MASK.position, maskPosition: NOTCH_MASK.position,
      WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
    } as React.CSSProperties}>

      {coverImage && (
        <>
          <img loading="eager" fetchPriority="high" decoding="async" src={coverImage} alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg,rgba(12,20,36,0.58),rgba(30,47,77,0.40))' }} />
          {/* دکمه‌ی نامرئیِ روی کاور. لوگوی گوشه بعد از این می‌آید، پس
              رویش می‌ماند و کلیکش را این نمی‌دزدد. */}
          {onCoverClick && (
            <button type="button" onClick={onCoverClick} aria-label="بزرگ‌نمایی تصویر کاور"
              style={{ position: 'absolute', inset: 0, background: 'none', border: 'none', padding: 0, cursor: 'zoom-in' }} />
          )}
        </>
      )}

      {/* ⚠️ سپرِ کلیک. ماسک برخلافِ clip-path جلوی کلیک را نمی‌گیرد، پس
          ناحیه‌ی گودی — که دیگر دیده نمی‌شود — هنوز دکمه‌ی کاور را زیرِ
          خودش داشت. این SVG *دقیقاً* همان مسیرِ موج را می‌گیرد (نه یک
          مستطیلِ گرد) تا فقط همان‌جا را بپوشاند.

          `pointerEvents:'none'` روی خودِ svg لازم است: جعبه‌اش مستطیل
          است و بالای موج — همان‌جا که کاور دیده می‌شود — روی دکمه
          می‌افتاد و کلیکش را می‌بلعید (اندازه‌گیری: ~۵۴٪ سطحِ جعبه).

          وسط‌چینی با insetInline:0 + marginInline:auto — نه
          insetInlineStart:'50%' با translateX که در RTL جای اشتباه
          می‌نشیند (translate فیزیکی است، inset منطقی). */}
      <svg aria-hidden viewBox="0 0 513.809 110" preserveAspectRatio="none"
        style={{
          position: 'absolute', insetInline: 0, marginInline: 'auto', bottom: 0,
          width: 'var(--boxW)', height: 'var(--boxH)', cursor: 'default', display: 'block',
          pointerEvents: 'none',
        }}>
        <path d={NOTCH_WAVE} fill="transparent" style={{ pointerEvents: 'all', cursor: 'default' }} />
      </svg>

      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)', backgroundSize: '16px 16px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: '-6%', top: '-40%', width: '46%', height: '180%', background: 'radial-gradient(ellipse, rgba(199,166,106,0.18) 0%, transparent 66%)', filter: 'blur(18px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: '54%', width: '1.5px', background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.45),transparent)', transform: 'rotate(-10deg)', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', top: '50%', insetInlineEnd: 'clamp(20px,4vw,40px)', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <img loading="lazy" decoding="async" src="/images/Logo/bh-header-v5.png" alt="بیلیارد هاب" style={{ height: 'clamp(26px,4vw,40px)', width: 'auto' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '22px', height: '1.5px', background: 'linear-gradient(90deg,#C7A66A,transparent)', display: 'inline-block' }} />
          <span style={{ fontSize: 'clamp(9px,1.4vw,12px)', fontWeight: 800, letterSpacing: '0.3em', color: 'rgba(199,166,106,0.9)' }}>{label}</span>
        </div>
      </div>
    </div>
  )
}

/* ── آواتار ─────────────────────────────────────────────────── */

export function NotchAvatar({ photo, name, onClick }: {
  photo?: string
  name: string
  onClick?: () => void
}) {
  return (
    <button onClick={onClick} aria-label="بزرگ‌نمایی عکس پروفایل" disabled={!photo}
      style={{
        position: 'relative', background: 'none', border: 'none', padding: 0,
        cursor: photo ? 'pointer' : 'default', borderRadius: '50%', aspectRatio: '1 / 1', flexShrink: 0,
        /* بالاکشیدن *نصفِ قطر* است (قطر روی کارت تعریف شده)، تا مرکزِ
           آواتار روی لبه‌ی صافِ کاور بنشیند: نیمی داخلِ تصویر، نیمی
           داخلِ سفید. قله‌ی موج ۱۰٪ شعاع بالاتر از تارکِ آواتار است —
           ۵٫۶ پیکسل روی موبایل.

           ⚠️ `clamp(-56px,-7.5vw,-76px)` این‌جا کار نمی‌کند: کمینه از
           بیشینه بزرگ‌تر است، پس clamp همیشه −۵۶ می‌دهد و روی دسکتاپ
           آواتار ۲۰ پیکسل زیرِ کمان می‌افتد. مشتق‌کردن از --av تنها
           راهی است که در همه‌ی اندازه‌ها درست می‌ماند. */
        width: 'var(--av)', marginTop: 'calc(var(--av) / -2)',
      } as React.CSSProperties}>
      {/* هاله‌ی طلاییِ نبض‌دار */}
      <span aria-hidden className="lq-halo" style={{ position: 'absolute', inset: -7, borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,166,106,0.42) 0%, rgba(199,166,106,0) 70%)', pointerEvents: 'none' }} />
      <div style={{
        position: 'relative', width: '100%', height: '100%', borderRadius: '50%', boxSizing: 'border-box',
        background: 'linear-gradient(150deg,#FFFDF8,#EBDFC6)', padding: 2.5,
        boxShadow: '0 10px 26px -8px rgba(154,110,56,0.45), 0 2px 8px rgba(0,0,0,0.12)',
      }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '5px solid #fff', overflow: 'hidden', background: '#E7ECF1', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          {photo ? (
            <img loading="lazy" decoding="async" src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: 'block' }} aria-hidden="true">
              <circle cx="50" cy="37" r="19" fill="#93A3B8" />
              <path d="M15 100 C15 74 31 65 50 65 C69 65 85 74 85 100 Z" fill="#A9B8CC" />
            </svg>
          )}
        </div>
      </div>
    </button>
  )
}

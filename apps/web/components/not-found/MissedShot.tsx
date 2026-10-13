/* ─────────────────────────────────────────────────────────────
   «ضربه‌ای که به پاکت نرسید» — تصویرِ صفحه‌ی ۴۰۴.

   روی میزِ اسنوکر (`SnookerTable`) چوب به توپِ سفید می‌زند، توپ به سمتِ
   پاکتِ گوشه می‌رود و دقیقاً لبه‌ی پاکت می‌ایستد — همان حسِ «نشانی‌ای که
   به مقصد نرسید».

   ── چرا SVG و CSS ──
   هیچ تصویر و هیچ جاوااسکریپتی: کلِ میز چند کیلوبایت متن است و روی
   شبکه‌ی کند همان لحظه دیده می‌شود.

   ── «کاهشِ حرکت» ──
   قاعده‌ی سراسریِ `globals.css` مدتِ هر انیمیشن را کوتاه می‌کند؛ تأخیرها
   این‌جا صفر می‌شوند تا توپ همان لحظه در وضعیتِ پایانی (لبه‌ی پاکت) باشد.

   مسیر حساب شده، نه چشمی: توپِ سفید از (۱۶۰، ۱۹۰) به سوی پاکتِ (۴۰۶، ۳۴)
   می‌رود. فاصله‌ی خطِ حرکت از نزدیک‌ترین توپ (آبی) ۱۸٫۵ است — بیشتر از
   قطرِ توپ (۱۳)، پس به هیچ توپی نمی‌خورد. نقطه‌ی پایان (۳۹۰، ۴۴٫۲) ۱۹ واحد
   از مرکزِ پاکت است: لبه‌ی توپ نیم واحد بیرون از دهانه — روی لب.
   ───────────────────────────────────────────────────────────── */

import { Ball, SnookerTable, TableDefs } from './SnookerTable'

const MOTION_CSS = `
  .nf-cue  { animation: nfCue 1.3s cubic-bezier(.4,0,.2,1) .35s both; }
  .nf-ball { animation: nfRoll 2s cubic-bezier(.15,.75,.25,1) 1.05s both; }
  .nf-aim  { animation: nfAim .6s ease-out .2s both; }
  .nf-lip  { animation: nfLip 1.1s ease-out 2.75s both; transform-origin: 406px 34px; transform-box: view-box; }
  @keyframes nfCue {
    0%   { transform: translateX(-20px); }
    40%  { transform: translateX(-34px); }
    55%  { transform: translateX(0); }
    68%  { transform: translateX(3px); }
    100% { transform: translateX(-10px); }
  }
  /* به سمتِ پاکت، کمی جلوتر از لبه، و برگشتنِ کوتاه — لرزشِ لبه */
  @keyframes nfRoll {
    0%   { transform: translate(0, 0); }
    78%  { transform: translate(232.5px, -147.4px); }
    88%  { transform: translate(229px, -145.2px); }
    95%  { transform: translate(230.6px, -146.2px); }
    100% { transform: translate(230px, -145.8px); }
  }
  @keyframes nfAim { from { opacity: 0; } to { opacity: 1; } }
  @keyframes nfLip {
    0%   { opacity: 0; transform: scale(.6); }
    30%  { opacity: .9; }
    100% { opacity: 0; transform: scale(1.6); }
  }
  @media (prefers-reduced-motion: reduce) {
    .nf-cue, .nf-ball, .nf-aim { animation-delay: 0s !important; }
    .nf-lip { display: none; }
  }
`

export function MissedShot() {
  return (
    <div>
      <style>{MOTION_CSS}</style>
      <svg viewBox="0 0 440 260" className="block h-auto w-full drop-shadow-[0_18px_28px_rgba(28,20,12,0.22)]" role="img"
        aria-label="میزِ اسنوکر از بالا؛ توپِ سفید تا لبه‌ی پاکت رفته و داخلش نیفتاده است">
        <TableDefs />
        <SnookerTable />

        {/* مسیرِ نشانه‌گیری — تا خودِ پاکت؛ توپ پیش از آن می‌ایستد */}
        <line className="nf-aim" x1="160" y1="190" x2="406" y2="34"
          stroke="#fff" strokeOpacity=".45" strokeWidth="1.2" strokeDasharray="3 6" strokeLinecap="round" />

        {/* حلقه‌ی کوتاه روی لبه‌ی پاکت، وقتی توپ می‌ایستد */}
        <circle className="nf-lip" cx="406" cy="34" r="15" fill="none" stroke="#E2C98C" strokeWidth="1.5" opacity="0" />

        {/* توپِ سفید */}
        <g className="nf-ball" filter="url(#nf-shadow)">
          <Ball cx={160} cy={190} color="white" />
        </g>

        {/* چوب — در راستای ضربه چرخیده (atan2(156,246) = ۳۲٫۴°)؛ فقط در محورِ
            خودش جلو و عقب می‌رود. سرِ چوب در لحظه‌ی ضربه ۱٫۷ واحد با لبه‌ی توپ
            فاصله دارد؛ تهِ محوش بیرون از کادر می‌رود، مثلِ دستِ بازیکن. */}
        <g transform="rotate(-32.4 160 190)">
          <g className="nf-cue">
            <polygon points="-30,186.6 147,188.3 147,191.7 -30,193.4" fill="url(#nf-shaft)" />
            <rect x="147" y="188.3" width="3" height="3.4" fill="#FAF7F0" />
            <rect x="150" y="188.5" width="1.8" height="3" rx=".6" fill="#3E86C9" />
          </g>
        </g>
      </svg>
    </div>
  )
}

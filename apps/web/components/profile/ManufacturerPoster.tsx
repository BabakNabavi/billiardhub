/* ─────────────────────────────────────────────────────────────
   پوستر پیش‌فرضِ کاورِ تولیدکننده — صحنه‌ی کارگاه.

   ── چرا جدا از `CoverPoster` ──
   آن پوستر سه توپ روی نمد است: زبانِ «بازیکن». تولیدکننده چیزِ
   دیگری می‌فروشد — دقت، ساخت، کارگاه. این پوستر همان را می‌گوید:
   نقشه‌ی مهندسی پشتِ صحنه، میزی که زیرِ چراغِ کارگاه ایستاده،
   قابِ چوب کنارِ دیوار، و نوارِ اندازه‌گیری در پایین.

   ── چرا SVG و CSS، نه عکس ──
   مخاطب موبایلِ ایرانی است با شبکه‌ی کند (CLAUDE.md): این پوستر صفر
   بایتِ شبکه می‌برد و با عرضِ صفحه مقیاس می‌گیرد. حرکت هم فقط
   `transform` و `opacity` است تا روی CPU ضعیف کامپوزیت شود، و با
   `prefers-reduced-motion` کاملا می‌ایستد.

   ⚠️ این پوستر تا لحظه‌ای دیده می‌شود که صاحبِ پروفایل بنرِ خودش را
   آپلود کند؛ از آن به بعد جایش را به عکسِ خودش می‌دهد.
   ───────────────────────────────────────────────────────────── */

import './manufacturer-poster.css'

export default function ManufacturerPoster() {
  return (
    <div className="mp" aria-hidden>
      {/* زمینه‌ی کارگاه: فلزِ تیره با گرمای کوره از یک سمت */}
      <div className="mp-ground" />
      {/* نقشه‌ی مهندسی — شبکه‌ی ریزِ طلایی، نشانه‌ی «ساخته می‌شود» */}
      <div className="mp-blueprint" />
      {/* مخروطِ نورِ چراغِ سقفی */}
      <div className="mp-cone" />

      {/* ⚠️ viewBox عمدا باریک‌تر از خودِ نقاشی است. هیرو نسبتِ حدودِ
          ۳٫۴:۱ دارد و با قابِ ۹۰۰×۳۸۰ (۲٫۴:۱) کلِ پایینِ صحنه —
          یعنی خودِ میز — زیرِ لبه می‌افتاد و فقط چراغ‌ها دیده
          می‌شدند. این نوار همان جایی است که سوژه ایستاده. */}
      <svg className="mp-art" viewBox="0 52 900 292" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="mp-felt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1C6B4C" />
            <stop offset="100%" stopColor="#0C3626" />
          </linearGradient>
          <linearGradient id="mp-rail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#6B4A22" />
            <stop offset="55%"  stopColor="#3A2611" />
            <stop offset="100%" stopColor="#241708" />
          </linearGradient>
          <linearGradient id="mp-gold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#C7A66A" stopOpacity="0" />
            <stop offset="50%"  stopColor="#C7A66A" stopOpacity=".65" />
            <stop offset="100%" stopColor="#C7A66A" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="mp-lamp" cx="50%" cy="0%" r="72%">
            <stop offset="0%"   stopColor="#FFE6B0" stopOpacity=".55" />
            <stop offset="100%" stopColor="#FFE6B0" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── قابِ چوب کنارِ دیوار ── */}
        <g className="mp-rack" opacity=".5">
          <rect x="52" y="96" width="120" height="7" rx="3" fill="#2A2118" />
          <rect x="52" y="268" width="120" height="7" rx="3" fill="#2A2118" />
          {[0, 1, 2, 3, 4].map(i => (
            <rect key={i} x={64 + i * 24} y="96" width="5" height="176" rx="2.5"
              fill="#4A3720" opacity={0.55 + i * 0.07} />
          ))}
        </g>

        {/* ── میز، در پرسپکتیو ── */}
        <g className="mp-table">
          {/* سایه‌ی زیرِ میز — بیرون از گروهِ متحرک */}
          <ellipse cx="520" cy="316" rx="240" ry="24" fill="rgba(0,0,0,.45)" />
          {/* بدنه */}
          <path d="M300 300 L330 214 L742 214 L772 300 Z" fill="url(#mp-rail)" />
          {/* نمد */}
          <path d="M330 214 L366 168 L706 168 L742 214 Z" fill="url(#mp-felt)" />
          {/* خطِ برک */}
          <line x1="404" y1="196" x2="668" y2="196" stroke="#8FD4B4" strokeOpacity=".28" strokeWidth="1.4" />
          {/* جیب‌ها */}
          {[[366, 168], [536, 168], [706, 168], [330, 214], [536, 214], [742, 214]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="9" ry="5" fill="#07130E" opacity=".85" />
          ))}
          {/* پایه‌ها */}
          <rect x="352" y="300" width="20" height="30" rx="4" fill="#241708" />
          <rect x="700" y="300" width="20" height="30" rx="4" fill="#241708" />
          {/* لبه‌ی نورگرفته‌ی ریل */}
          <path d="M330 214 L742 214" stroke="#C7A66A" strokeOpacity=".30" strokeWidth="1.2" />
        </g>

        {/* ── دو چراغِ کارگاه ── */}
        <g className="mp-lamps">
          {[440, 636].map((x, i) => (
            <g key={x} className={i === 0 ? 'mp-lamp mp-lamp-a' : 'mp-lamp mp-lamp-b'}>
              <line x1={x} y1="0" x2={x} y2="44" stroke="#3A3228" strokeWidth="2" />
              <path d={`M${x - 26} 66 L${x + 26} 66 L${x + 14} 44 L${x - 14} 44 Z`} fill="#2C2419" />
              <ellipse cx={x} cy="66" rx="26" ry="5" fill="#FFD98A" opacity=".55" />
              <path d={`M${x - 26} 66 L${x - 92} 210 L${x + 92} 210 L${x + 26} 66 Z`} fill="url(#mp-lamp)" />
            </g>
          ))}
        </g>

        {/* ── نوارِ اندازه‌گیریِ پایین — زبانِ دقتِ کارگاهی ── */}
        <g className="mp-ruler" opacity=".55">
          <line x1="0" y1="338" x2="900" y2="338" stroke="url(#mp-gold)" strokeWidth="1.2" />
          {Array.from({ length: 45 }, (_, i) => (
            <line key={i} x1={i * 20 + 10} y1="338" x2={i * 20 + 10}
              y2={i % 5 === 0 ? 326 : 332}
              stroke="#C7A66A" strokeOpacity={i % 5 === 0 ? '.55' : '.28'} strokeWidth="1" />
          ))}
        </g>

        {/* ── ذراتِ معلقِ کارگاه ── */}
        <g className="mp-dust">
          {[[210, 120, 1.6], [286, 208, 1.1], [352, 92, 1.3], [612, 132, 1.5],
            [702, 96, 1.1], [784, 186, 1.4], [462, 62, 1.2], [560, 250, 1.3]].map(([x, y, r], i) => (
            <circle key={i} className={`mp-mote mp-mote-${i % 4}`} cx={x} cy={y} r={r}
              fill="#E7D7B4" opacity=".4" />
          ))}
        </g>
      </svg>

      {/* برقِ آرامی که یک‌بار از روی صحنه رد می‌شود */}
      <div className="mp-sheen" />
    </div>
  )
}

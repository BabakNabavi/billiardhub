/* مولدِ مسیرِ موجِ سرِ صفحه‌ی مربی.
   خروجی مستقیم در app/coaches/[id]/page.tsx (NOTCH_WAVE) می‌نشیند.
   اجرا:  node scripts/gen-notch-wave.mjs

   ساختِ مسیرِ موجِ مقعر با بِزیهِ درجه‌سه — از یک تابعِ صریح، نه با حدس.
 *
 * نمایه‌ی مرز (مبدأ در گوشه‌ی بالا-چپِ جعبه، y رو به پایین):
 *     u = (x − S)/S ∈ [−1, 1]
 *     y(x) = D · ( 1 − (1 − u²)³ )
 *
 * چرا همین تابع:
 *   u=±۱ → y=D  و  y′=0   ⇒ دقیقاً روی خطِ صافِ دو طرف می‌نشیند و
 *                            مماسش هم افقی است (بدونِ شکستِ زاویه)
 *   u=±۱ → y″=0            ⇒ حتی *انحنا* هم پیوسته است، نه فقط شیب،
 *                            پس اتصال به دو طرف اصلاً دیده نمی‌شود
 *   u=0  → y=0  و  y′=0   ⇒ قله‌ی موج، هم‌مرکز با آواتار
 *   انحنای قله = 6D/S²     ⇒ با S² = 6·D·R برابرِ ۱/R می‌شود، یعنی
 *                            گودی همان‌جا با گردیِ آواتار هم‌خوان است
 *                            بدونِ اینکه *خودش* یک دایره باشد.
 *
 * قطعه‌ها Hermite→Bézier تبدیل می‌شوند: نقاطِ کنترل روی مماسِ واقعیِ
 * تابع می‌نشینند، پس منحنی تقریبِ چشمی نیست.
 */
const R = 100                       // شعاعِ آواتار در واحدِ viewBox
const GAP = 0.03                    // فاصله‌ی سفید، نسبتِ شعاع
const D = R * (1 + GAP)             // عمقِ موج
const S = Math.sqrt(6 * D * R)      // نیم‌دهانه
const W = 2 * S
const N = 8                         // تعدادِ قطعه‌ها

const y = x => { const u = (x - S) / S; return D * (1 - Math.pow(1 - u * u, 3)) }
const dy = x => { const u = (x - S) / S; return (6 * D * u * Math.pow(1 - u * u, 2)) / S }

const f = n => Number(n.toFixed(3))
let d = `M0,${f(D)}`
for (let i = 0; i < N; i++) {
  const x0 = (W * i) / N, x1 = (W * (i + 1)) / N
  const h = (x1 - x0) / 3
  const c1x = x0 + h, c1y = y(x0) + dy(x0) * h
  const c2x = x1 - h, c2y = y(x1) - dy(x1) * h
  d += ` C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(x1)},${f(y(x1))}`
}
d += ` L${f(W)},${f(D)} Z`

/* ── سنجشِ خطا: نمونه‌ی چگال روی بِزیه در برابر خودِ تابع ── */
const segs = d.match(/C[^C]+/g).map(s => s.slice(1).trim().split(/[ ,]+/).map(Number))
let start = [0, D], maxErr = 0
for (let i = 0; i < segs.length; i++) {
  const [c1x, c1y, c2x, c2y, ex, ey] = segs[i]
  const [sx, sy] = start
  for (let t = 0; t <= 1; t += 0.02) {
    const mt = 1 - t
    const bx = mt ** 3 * sx + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t ** 3 * ex
    const by = mt ** 3 * sy + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t ** 3 * ey
    maxErr = Math.max(maxErr, Math.abs(by - y(bx)))
  }
  start = [ex, ey]
}

console.log('R=' + R + '  D=' + f(D) + '  S=' + f(S) + '  W=' + f(W))
console.log('viewBox: 0 0 ' + f(W) + ' ' + f(D))
console.log('نسبتِ جعبه به شعاعِ آواتار:  عرض ' + f(W / R) + '×R   بلندی ' + f(D / R) + '×R')
console.log('بیشترین خطای بِزیه در برابرِ تابع: ' + maxErr.toFixed(4) + ' واحد  (' + (maxErr / D * 100).toFixed(3) + '٪ عمق)')
console.log('انحنای قله = 1/' + f(S * S / (6 * D)) + '  (شعاعِ آواتار ' + R + ')')
console.log('\nمسیر:\n' + d)

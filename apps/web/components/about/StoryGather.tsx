/* ─────────────────────────────────────────────────────────────
   «پراکنده ⟵ یکپارچه» — نمودارِ کنارِ روایتِ درباره ما.

   هشت نقشِ جامعه‌ی بیلیارد اول پراکنده و کج روی صفحه‌اند؛ با اسکرولِ
   همین بخش سرِ جایشان دورِ نشانِ بیلیارد هاب می‌نشینند و حلقه بسته
   می‌شود. حرکت با animation-timeline (about.css) است، بی جاوااسکریپت.
   جایی که پشتیبانی نشود یا کاهشِ حرکت روشن باشد، حالتِ یکپارچه از اول
   دیده می‌شود. تزئینی است (aria-hidden): خودِ متن روایت را می‌گوید.

   --dx/--dy فاصله‌ی حالتِ پراکنده از جای نهایی است، به cqw (ظرف مربع است)
   ───────────────────────────────────────────────────────────── */

const ROLES = ['باشگاه‌ها', 'بازیکنان', 'مربیان', 'داوران', 'مسابقات', 'خدمات فنی', 'تولیدکنندگان', 'فروشگاه‌ها']
const SCATTER: Array<[number, number, number]> = [
  [-14, -18, -9], [10, -24, 7], [22, -6, -6], [16, 20, 11], [-6, 22, -12], [-22, 14, 8], [-26, -4, -7], [-10, -26, 10],
]

export function StoryGather() {
  return (
    <div aria-hidden className="ab-gather relative aspect-square w-full">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <circle className="ab-gather-ring" cx="50" cy="50" r="34" fill="none" stroke="currentColor" strokeWidth=".35" pathLength="100" />
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element -- نشانِ ثابت و کوچک */}
      <img src="/images/Logo/bh-tile-256-v13.webp" alt="" width={64} height={64} loading="lazy" decoding="async"
        className="ab-gather-hub absolute start-1/2 top-1/2 h-12 w-12 -translate-y-1/2 translate-x-1/2 rounded-card sm:h-16 sm:w-16" />
      {ROLES.map((role, i) => {
        const a = (i / ROLES.length) * Math.PI * 2 - Math.PI / 2
        const [dx, dy, r] = SCATTER[i]!
        return (
          <span key={role} className="ab-gather-word absolute whitespace-nowrap text-body font-bold"
            style={{
              left: `${50 + 34 * Math.cos(a)}%`, top: `${50 + 34 * Math.sin(a)}%`,
              ['--dx' as string]: dx, ['--dy' as string]: dy, ['--r' as string]: `${r}deg`,
            }}>
            {role}
          </span>
        )
      })}
    </div>
  )
}

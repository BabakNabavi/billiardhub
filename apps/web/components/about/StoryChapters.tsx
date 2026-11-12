import { IMG, type Img } from './imagery'
import { Photo } from './Photo'
import { StoryMotion } from './StoryMotion'

/* ─────────────────────────────────────────────────────────────
   روایت — «جدا ⟵ یکپارچه»، سه فصل در یک صحنه‌ی ثابت.

   فصلِ ۱: همه‌ی اجزا هستند (جمله‌ی مالک) — قاب‌ها پراکنده و کج.
   فصلِ ۲: ولی هرکدام جدا کار می‌کرد — قاب‌ها از هم دورتر و کم‌رنگ می‌شوند.
   فصلِ ۳: بیلیارد هاب برای همین ساخته شد — قاب‌ها در یک ترکیبِ واحد جفت می‌شوند.
   حرکت با GSAP ScrollTrigger (StoryMotion، فقط روی همین صفحه بار می‌شود).
   بدونِ جاوااسکریپت یا با کاهشِ حرکت: ترکیبِ نهایی و هر سه فصل، پشتِ سرِ هم.
   --dx/--dy جابه‌جاییِ حالتِ پراکنده است، به نسبتِ اندازه‌ی صحنه
   ───────────────────────────────────────────────────────────── */

type Tile = { img: Img; k: string; dx: number; dy: number; r: number }

const TILES: Tile[] = [
  /* پراکندگی فقط به سمتِ پایان (چپ در RTL) و بالا/پایین — هیچ قابی روی ستونِ متن نمی‌رود */
  { img: IMG.rack, k: 'rack', dx: -0.04, dy: -0.1, r: -4 },
  { img: IMG.kiss, k: 'kiss', dx: -0.12, dy: -0.04, r: 3 },
  { img: IMG.pocket, k: 'pocket', dx: -0.02, dy: 0.1, r: 5 },
  { img: IMG.chalk, k: 'chalk', dx: -0.08, dy: 0.12, r: -3 },
  { img: IMG.break, k: 'break', dx: -0.16, dy: 0.08, r: 2 },
]

export function StoryChapters() {
  return (
    <section id="ab-chapters" className="ab-chap" aria-labelledby="ab-story-h">
      <div className="ab-chap-stage">
        <div className="ab-chap-texts">
          <h2 id="ab-story-h" className="ab-display ab-chap-text">
            بیلیارد در ایران بازیکن دارد، باشگاه دارد، مربی و داور دارد، فروشگاه و متخصص فنی هم دارد
          </h2>
          <p className="ab-chap-text ab-chap-lead">
            اما هرکدام جدا از دیگری کار می‌کرد؛ چیزی که نداشت یک جای مشترک بود، جایی که همه همدیگر را پیدا کنند و به هم اعتماد کنند
          </p>
          <p className="ab-chap-text ab-chap-lead">
            <strong className="ab-chap-payoff">بیلیارد هاب برای همین ساخته شد</strong>{' '}
            تا این بخش‌های جدا در یک پلتفرم حرفه‌ای به هم وصل شوند و صنعت بیلیارد ایران با ابزار امروزی رشد کند
          </p>
        </div>
        <div className="ab-chap-mosaic" aria-hidden>
          {TILES.map(t => (
            <figure key={t.k} className={`ab-tile ab-tile-${t.k}`} data-dx={t.dx} data-dy={t.dy} data-r={t.r}>
              <Photo img={t.img} sizes="(min-width: 1024px) 28vw, 50vw" alt="" />
            </figure>
          ))}
        </div>
      </div>
      <StoryMotion />
    </section>
  )
}

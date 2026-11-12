import { IMG, type Img } from './imagery'
import { Photo } from './Photo'

/* ─────────────────────────────────────────────────────────────
   روایت — «ردیفِ قاب‌ها، یکی بالاتر» (showcase: frame run, one lifted).

   ایده: یک فریمِ اسنوکر از اجزای زیادی ساخته می‌شود — چیدن، تماس، جیب، گچ —
   همان‌طور که بیلیارد ایران از نقش‌های زیادی. چهار جزء با یک ارتفاع در تمامِ
   عرض؛ «تماس» (دو توپی که به هم رسیده‌اند) بالاتر از بقیه می‌ایستد، چون حرفِ
   این صفحه وصل شدن است. در موبایل شبکه‌ی دوتایی، «تماس» تمام‌عرض و اول
   ───────────────────────────────────────────────────────────── */

type Frame = { img: Img; name: string; fact: string; lifted?: boolean }

const FRAMES: Frame[] = [
  { img: IMG.rack, name: 'چیدن', fact: 'آغاز هر فریم' },
  { img: IMG.kiss, name: 'تماس', fact: 'دو توپ، یک نقطه', lifted: true },
  { img: IMG.pocket, name: 'جیب', fact: 'نتیجه ضربه' },
  { img: IMG.chalk, name: 'گچ', fact: 'دقت در جزئیات' },
]

export function StoryFrames() {
  return (
    <section className="ab-story" aria-labelledby="ab-story-h">
      <div className="ab-grid ab-story-head">
        {/* جمله‌ی مالک خودش تیترِ بخش است — یک اندازه‌ی تیتر در کلِ صفحه، نه دو متنِ بزرگِ رقیب */}
        <h2 id="ab-story-h" className="ab-display ab-story-h ab-rise">
          بیلیارد در ایران بازیکن دارد، باشگاه دارد، مربی و داور دارد، فروشگاه و متخصص فنی هم دارد
        </h2>
      </div>
      <ul className="ab-run" aria-label="یک میز، اجزای بسیار">
        {FRAMES.map(f => (
          <li key={f.name} className={f.lifted ? 'ab-frame ab-frame-lifted' : 'ab-frame'}
            /* سهمِ عرض در دسکتاپ = نسبتِ عکس، برای قابِ بالاتر ۱٫۸ برابر، تا ارتفاعِ بقیه برابر بماند */
            style={{ ['--ab-ratio' as string]: (f.img.w[1] / f.img.h[1]) * (f.lifted ? 1.8 : 1) }}>
            <figure>
              <div className="ab-frame-pic ab-curtain" style={{ aspectRatio: `${f.img.w[1]} / ${f.img.h[1]}` }}>
                <Photo img={f.img} sizes={f.lifted ? '(min-width: 1024px) 30vw, 100vw' : '(min-width: 1024px) 26vw, 50vw'} />
              </div>
              <figcaption className="ab-cap"><span>{f.name}</span><span>{f.fact}</span></figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <div className="ab-grid ab-story-notes">
        <p className="ab-rise">
          اما هرکدام جدا از دیگری کار می‌کرد؛ چیزی که نداشت یک جای مشترک بود، جایی که همه همدیگر را پیدا کنند
          و به هم اعتماد کنند
        </p>
        <p className="ab-rise">
          <strong>بیلیارد هاب برای همین ساخته شد</strong>؛ تا این بخش‌های جدا در یک پلتفرم حرفه‌ای به هم وصل
          شوند و صنعت بیلیارد ایران با ابزار امروزی رشد کند
        </p>
      </div>
    </section>
  )
}

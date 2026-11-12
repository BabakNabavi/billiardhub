import Link from 'next/link'
import { buttonClasses } from '@/components/ui/button-classes'
import { IMG } from './imagery'
import { Photo } from './Photo'

/* ─────────────────────────────────────────────────────────────
   هیرو — یک نوارِ متنِ جمع‌وجور، بعد عکسِ سینماییِ میز تا پایینِ صفحه‌ی اول.

   تیتر یک بلوکِ دوسطری از لبه‌ی شروع؛ جمله و دکمه در سمتِ پایان، هم‌کفِ سطرِ
   دومِ تیتر. نوار کوتاه است تا عکس از حدودِ ۲۸۰px شروع شود و صفحه‌ی اول را
   پر کند. حرکتِ امضا: هر سطرِ تیتر از پشتِ خطِ کرسیِ خودش بالا می‌آید
   ───────────────────────────────────────────────────────────── */

export function AboutHero() {
  return (
    <section className="ab-hero" aria-labelledby="ab-title">
      <div className="ab-grid ab-hero-band">
        <h1 id="ab-title" className="ab-h1">
          <span className="ab-mask"><span>بیلیارد هاب</span></span>{' '}
          <span className="ab-mask ab-mask-2"><span>روی یک میز</span></span>
        </h1>
        <div className="ab-hero-copy">
          <p className="ab-lead">
            همه دنیای بیلیارد ایران در یک پلتفرم؛ باشگاه‌ها، بازیکنان، مربیان و داوران، فروشگاه‌ها و سازندگان،
            با پروفایل‌هایی که تأیید می‌شوند
          </p>
          <Link href="/clubs" prefetch={false} className={buttonClasses({ size: 'lg' })}>باشگاه‌ها را ببینید</Link>
        </div>
      </div>
      <figure className="ab-hero-big">
        <Photo img={IMG.hero} sizes="100vw" priority className="ab-parallax" />
      </figure>
    </section>
  )
}

import Link from 'next/link'
import { buttonClasses } from '@/components/ui/button-classes'
import { IMG } from './imagery'
import { Photo } from './Photo'
import { HeroScene } from './HeroScene'

/* ─────────────────────────────────────────────────────────────
   هیرو — صحنه‌ی سینماییِ تمام‌صفحه: میزِ زیرِ چراغ، و تایپوگرافی روی همان صحنه.

   لایه‌ها: (۱) عکسِ میز از سرور — نامزدِ LCP و جایگزینِ همیشگی (۲) صحنه‌ی WebGL که
   پس از اولین فریم رویش محو می‌شود و دوربینش با نشانگر و اسکرول حرکت می‌کند
   (۳) پرده‌ی تیره‌ی ملایم برای خوانایی (۴) متن. متن روی بخشِ تاریکِ اتاق می‌نشیند،
   در سمتِ شروع؛ چراغ و میز در مرکزِ کادر می‌مانند
   ───────────────────────────────────────────────────────────── */

export function AboutHero() {
  return (
    <section className="ab-hero" aria-labelledby="ab-title">
      <div className="ab-hero-media">
        <Photo img={IMG.hero} sizes="100vw" priority className="ab-hero-photo" />
        <HeroScene />
        <div className="ab-hero-scrim" aria-hidden />
      </div>
      <div className="ab-hero-copy">
        <h1 id="ab-title" className="ab-h1">
          <span className="ab-mask"><span>بیلیارد هاب</span></span>{' '}
          <span className="ab-mask ab-mask-2"><span className="ab-h1-sub">همه دنیای بیلیارد ایران، روی یک میز</span></span>
        </h1>
        <p className="ab-hero-lead">
          باشگاه‌ها، بازیکنان، مربیان و داوران، فروشگاه‌ها و سازندگان، در یک پلتفرم تخصصی که پروفایل‌هایش تأیید می‌شوند
        </p>
        <div className="ab-hero-actions">
          <Link href="/clubs" prefetch={false} className={buttonClasses({ size: 'lg', className: 'ab-on-dark-metal' })}>باشگاه‌ها را ببینید</Link>
        </div>
      </div>
    </section>
  )
}

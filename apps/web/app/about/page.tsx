import Link from 'next/link'
import { buttonClasses } from '@/components/ui/button-classes'
import { HeroPlate } from '@/components/about/HeroPlate'
import { StoryGather } from '@/components/about/StoryGather'
import { Ecosystem } from '@/components/about/Ecosystem'
import { Principles } from '@/components/about/Principles'
import { Ownership } from '@/components/about/Ownership'
import './about.css'

/* ─────────────────────────────────────────────────────────────
   درباره ما — بازطراحیِ آبانِ ۱۴۰۵ (دورِ دوم)

   THESIS: بیلیارد هاب زیرساختِ یک جامعه است، نه فهرستِ باشگاه؛ صفحه این را با
   «وصل شدن» نشان می‌دهد — نقش‌های پراکنده که دورِ یک هاب جمع می‌شوند — نه با
   سرتیتر و کارت.
   OWN-WORLD: زمینه‌ی عاجِ گرم، جوهرِ زغالی، زمردِ پارچه به‌عنوانِ امضا (پارچه‌ی
   میز، پیوندهای فعال، نامِ اصل‌ها)، شامپاینی فقط در خالِ لوزیِ لبه‌ی میز، خطِ
   ریل و دکمه‌ی LQ. خطوطِ مو، بی کارت، بی شیشه.
   STORY: میزِ روشن زیرِ چراغ ⟵ چرا ساخته شد (پراکنده ⟵ یکپارچه) ⟵ شبکه‌ی هشت
   نقش ⟵ سه اصل روی ریل ⟵ پلاکِ مالکیت ⟵ دعوت
   FIRST VIEWPORT: دسکتاپ دوستونه؛ راست تیترِ ≤۵۶px و یک دکمه، چپ قابِ سینماییِ
   میز که چراغش هنگامِ ورود روشن می‌شود. موبایل: متن، بعد قاب ۴:۳
   FORM: صحنه‌ی میز + نمودارِ شبکه، جهتِ تعیین‌شده در بریفِ مالک (بی قرعه)
   FINISH: unreviewed and undocumented is unfinished; this build ends with the
   finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

   Server Component است؛ همه‌ی حرکت CSS است (about.css)
   ───────────────────────────────────────────────────────────── */

const WRAP = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'

export default function AboutPage() {
  return (
    <div className="ab-page overflow-x-clip text-ink">
      {/* ═══ هیرو ═══ */}
      <section className={`${WRAP} grid items-center gap-8 pb-16 pt-8 lg:grid-cols-12 lg:gap-12 lg:pb-24 lg:pt-16`}>
        <div className="ab-hero-copy flex flex-col items-start gap-6 lg:col-span-5">
          <h1 className="ab-h1">
            <span className="ab-line block">بیلیارد هاب</span>{' '}
            <span className="ab-line block text-ink-2">همه دنیای بیلیارد ایران، روی یک میز</span>
          </h1>
          <p className="ab-line max-w-prose text-body text-ink-2">
            زیرساخت دیجیتال جامعه بیلیارد ایران؛ باشگاه‌ها، بازیکنان، مربیان و داوران، فروشگاه‌ها و تولیدکنندگان
            در یک پلتفرم تخصصی که پروفایل‌هایش تأیید می‌شوند
          </p>
          <div className="ab-line flex flex-wrap items-center gap-3">
            <Link href="/clubs" prefetch={false} className={buttonClasses({ size: 'lg' })}>باشگاه‌ها را ببینید</Link>
            <Link href="/contact" prefetch={false} className={buttonClasses({ variant: 'ghost', size: 'lg' })}>تماس با ما</Link>
          </div>
        </div>
        <div className="ab-plate relative aspect-[4/3] w-full overflow-hidden lg:col-span-7">
          <HeroPlate />
        </div>
      </section>

      {/* ═══ روایت: پراکنده ⟵ یکپارچه ═══ */}
      <section className="ab-story bg-surface py-16 lg:py-24" aria-labelledby="ab-story">
        <div className={`${WRAP} grid gap-12 lg:grid-cols-12`}>
          <div className="lg:col-span-5">
            <div className="mx-auto max-w-sm lg:sticky lg:top-24">
              <StoryGather />
            </div>
          </div>
          <div className="flex flex-col gap-12 lg:col-span-7 lg:gap-16 lg:py-12">
            <h2 id="ab-story" className="text-display">
              بیلیارد در ایران بازیکن دارد، باشگاه دارد، مربی و داور دارد، فروشگاه و متخصص فنی هم دارد
            </h2>
            <p className="ab-story-line text-display text-ink-2">
              اما هرکدام جدا از دیگری کار می‌کرد؛ چیزی که نداشت یک جای مشترک بود، جایی که همه همدیگر را پیدا کنند و به هم اعتماد کنند
            </p>
            <p className="ab-story-line text-display">
              <span className="ab-em">بیلیارد هاب برای همین ساخته شد</span>{' '}
              <span className="mt-4 block text-body text-ink-2">
                تا این بخش‌های جدا در یک اکوسیستم حرفه‌ای به هم وصل شوند، و صنعت بیلیارد ایران با ابزار امروزی رشد کند
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ═══ اکوسیستم ═══ */}
      <section className={`${WRAP} py-16 lg:py-24`} aria-labelledby="ab-eco">
        <div className="mb-12 flex max-w-2xl flex-col gap-4">
          <h2 id="ab-eco" className="text-display">یک شبکه، هشت نقش</h2>
          <p className="text-body text-ink-2">هر نقش به هاب و به نقش‌های دیگر وصل است</p>
        </div>
        <Ecosystem />
      </section>

      {/* ═══ اصول ═══ */}
      <section className="bg-mist py-16 lg:py-24" aria-labelledby="ab-principles">
        <div className={WRAP}>
          <h2 id="ab-principles" className="mb-8 text-display lg:mb-12">سه اصل که کنار نمی‌گذاریم</h2>
          <Principles />
        </div>
      </section>

      {/* ═══ مالکیت ═══ */}
      <section className={`${WRAP} py-16 lg:py-24`} aria-labelledby="ab-company">
        <Ownership />
      </section>

      {/* ═══ پایان ═══ */}
      <section className={`${WRAP} pb-16 lg:pb-24`}>
        <div className="flex flex-col items-start gap-6 border-t border-line/10 pt-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-display">نوبت شماست</h2>
            <p className="text-body text-ink-2">حساب بسازید، باشگاه یا مربی پیدا کنید، یا پروفایل حرفه‌ای خودتان را بسازید</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" prefetch={false} className={buttonClasses({ size: 'lg' })}>ساخت حساب</Link>
            <Link href="/contact" prefetch={false} className={buttonClasses({ variant: 'secondary', size: 'lg' })}>تماس با ما</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

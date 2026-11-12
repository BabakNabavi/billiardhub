import Link from 'next/link'
import { ShieldCheck, BadgeCheck, Smartphone, Globe } from 'lucide-react'
import { buttonClasses } from '@/components/ui/button-classes'
import { BreakTable } from '@/components/about/BreakTable'
import { WorldGrid } from '@/components/about/WorldGrid'
import { faNum } from '@/lib/jalali'
import '@/styles/reveal.css'
import './about.css'

/* ─────────────────────────────────────────────────────────────
   درباره‌ی ما — بازطراحیِ آبانِ ۱۴۰۵.

   ایده: «همه‌ی دنیای بیلیارد ایران، روی یک میز». به‌جای هیروی تیره،
   مدار و برچسب‌های انگلیسیِ نسخه‌ی قبل، صفحه مثلِ یک بریک پیش می‌رود:
   میز چیده می‌شود و پخش می‌شود (هیرو)، چرا ساخته شد (مانیفست)، چه
   چیزهایی روی میز است (دنیاها)، با چه قاعده‌ای (اصول)، مالِ کیست
   (شرکت)، و دعوت به بازی (پایان).

   Server Component است؛ همه‌ی حرکت CSS است (about.css). هیچ آمار،
   تیم یا تاریخچه‌ی ساختگی — قاعده‌ی مالک.
   ───────────────────────────────────────────────────────────── */

const PRINCIPLES = [
  {
    Icon: BadgeCheck, title: 'هویت تأییدشده',
    text: 'نشان تأیید باشگاه، مربی و داور فقط بعد از بررسی مدرک داده می‌شود، نه با ادعای خود پروفایل',
  },
  {
    Icon: ShieldCheck, title: 'بدون داده ساختگی',
    text: 'هیچ آمار، نظر یا کاربر ساختگی نمی‌سازیم؛ جای خالی را خالی نشان می‌دهیم، نه پر از عدد تزئینی',
  },
  {
    Icon: Smartphone, title: 'ساخته شده برای موبایل',
    text: 'برای گوشی و اینترنت واقعی کاربران ایرانی بهینه شده و مثل یک اپ روی صفحه اصلی گوشی نصب می‌شود',
  },
]

const WRAP = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'

export default function AboutPage() {
  return (
    <div className="overflow-x-clip bg-paper text-ink">
      {/* ═══ هیرو: روشن و جمع‌وجور، میز در حالِ بریک ═══ */}
      <section className={`${WRAP} grid items-center gap-8 pb-16 pt-8 lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-16`}>
        <div className="ab-in flex flex-col items-start gap-6">
          <p className="text-body font-bold text-gold-text">درباره بیلیارد هاب</p>
          <h1 className="text-display">
            بیلیارد هاب
            <span className="block text-ink-2">همه دنیای بیلیارد ایران، روی یک میز</span>
          </h1>
          <p className="max-w-prose text-body text-ink-2">
            باشگاه‌ها، مربیان و داوران، فروشگاه‌ها، مسابقات و رسانه؛ هرچه یک علاقه‌مند بیلیارد لازم دارد،
            در یک پلتفرم تخصصی که پروفایل‌هایش تأیید می‌شوند
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/clubs" prefetch={false} className={buttonClasses({ size: 'lg' })}>باشگاه‌ها را ببینید</Link>
            <Link href="/contact" prefetch={false} className={buttonClasses({ variant: 'secondary', size: 'lg' })}>تماس با ما</Link>
          </div>
        </div>
        <div className="ab-table-wrap mx-auto w-full max-w-xl">
          <BreakTable />
        </div>
      </section>

      {/* ═══ مانیفست ═══ */}
      <section className="bg-surface py-16 lg:py-24">
        <div className={`${WRAP} max-w-4xl text-center`}>
          <p className="ab-reveal text-display text-ink">بیلیارد در ایران بازیکن دارد، باشگاه دارد، مربی و داور دارد، فروشگاه و متخصص فنی هم دارد</p>
          <p className="ab-reveal mt-4 text-display text-ink-2">
            چیزی که نداشت یک جای مشترک بود؛ جایی که همه همدیگر را پیدا کنند و به هم اعتماد کنند
          </p>
          <p className="ab-reveal mt-6 text-display text-gold-text">بیلیارد هاب برای همین ساخته شد</p>
        </div>
      </section>

      {/* ═══ دنیاها ═══ */}
      <section className={`${WRAP} py-16 lg:py-24`} aria-labelledby="ab-worlds">
        <div className="ab-reveal mb-8 flex flex-col gap-2 lg:mb-12">
          <h2 id="ab-worlds" className="text-display">روی این میز چه پیدا می‌کنید</h2>
          <p className="text-body text-ink-2">هر بخش رنگ یکی از توپ‌های اسنوکر را دارد؛ از هرکدام وارد شوید</p>
        </div>
        <WorldGrid />
      </section>

      {/* ═══ اصول ═══ */}
      <section className="bg-mist py-16 lg:py-24" aria-labelledby="ab-principles">
        <div className={WRAP}>
          <h2 id="ab-principles" className="ab-reveal mb-8 text-display lg:mb-12">سه قاعده که هیچ‌وقت کنار نمی‌گذاریم</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {PRINCIPLES.map(({ Icon, title, text }, i) => (
              <li key={title} className="ab-reveal flex flex-col gap-4 rounded-panel bg-surface p-6 shadow-e0 sm:p-8">
                <span className="flex items-center justify-between">
                  <Icon size={24} aria-hidden className="text-gold-text" />
                  <span aria-hidden className="text-display text-ink/10">{faNum(i + 1)}</span>
                </span>
                <h3 className="text-section">{title}</h3>
                <span className="text-body text-ink-2">{text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ═══ شرکت و برند ═══ */}
      <section className={`${WRAP} py-16 lg:py-24`} aria-labelledby="ab-company">
        <div className="ab-reveal mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-hero bg-surface p-8 text-center shadow-e1 sm:p-12">
          <div className="flex items-center gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- لوگوی برداری و ثابت */}
            <img src="/images/Logo/bh-tile-256-v13.webp" alt="بیلیارد هاب" width={56} height={56} loading="lazy" decoding="async" className="h-12 w-12 rounded-card sm:h-16 sm:w-16" />
            <span aria-hidden className="h-8 w-px bg-line/10" />
            {/* eslint-disable-next-line @next/next/no-img-element -- لوگوی برداری و ثابت */}
            <img src="/images/Logo/Arta.svg" alt="شرکت بازرگانی آرتا تجارت بین‌الملل آپادانا" width={56} height={56} loading="lazy" decoding="async" className="h-12 w-12 object-cover object-left sm:h-16 sm:w-16" />
          </div>
          <h2 id="ab-company" className="text-section text-ink-2">مالکیت و برند</h2>
          <p className="text-display">
            بیلیارد هاب متعلق به
            <span className="block text-gold-text">شرکت بازرگانی آرتا تجارت بین‌الملل آپادانا میباشد</span>
          </p>
          <p className="text-body text-ink-2">
            <span dir="ltr">Billiard Hub</span> برند ثبت‌شده این شرکت است و همه خدمات پلتفرم با همین برند ارائه می‌شود
          </p>
          {/* وب‌سایتِ شرکتِ مالک — زیرِ نامِ شرکت، جایی که بازدیدکننده دنبالِ شناختنش است */}
          <a href="https://www.artaintl.com" target="_blank" rel="noopener noreferrer"
            className={buttonClasses({ variant: 'secondary' })}>
            <Globe size={16} aria-hidden />
            وب‌سایت آرتا تجارت
            <span dir="ltr" className="text-ink-2">www.artaintl.com</span>
            <span className="sr-only">(در پنجره جدید)</span>
          </a>
        </div>
      </section>

      {/* ═══ پایان: کارتِ تیره‌ی جمع‌وجور روی پارچه ═══ */}
      <section className={`${WRAP} pb-16 lg:pb-24`}>
        <div className="ab-reveal ab-felt flex flex-col items-start gap-6 rounded-hero p-8 text-surface sm:p-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-display">نوبت شماست</h2>
            <p className="text-body text-surface/70">حساب بسازید، باشگاه یا مربی پیدا کنید، یا پروفایل حرفه‌ای خودتان را بسازید</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" prefetch={false}
              className={buttonClasses({ size: 'lg', className: '!bg-gold/20 !text-gold-light !border-gold/50 hover:!bg-gold/30 focus-visible:ring-offset-ink' })}>
              ساخت حساب
            </Link>
            <Link href="/contact" prefetch={false}
              className={buttonClasses({ variant: 'ghost', size: 'lg', className: '!text-surface/80 hover:!text-surface hover:!bg-surface/10 focus-visible:ring-offset-ink' })}>
              تماس با ما
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

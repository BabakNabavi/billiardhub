import Link from 'next/link'
import {
  Calendar, Radio, Search,
} from 'lucide-react'
import type { HeroData } from '@/lib/home-hero'
import type { RealClub, RealProduct, RealStore } from '@/lib/home-types'
import { HeroCards } from './HeroCards'
import './home-hero.css'

/* ─────────────────────────────────────────────────────────────
   هیروی صفحه‌ی اصلی — Server Component.

   جای ویدیوی ۷۰۰ کیلوبایتی، چهار اسلاید و کاروسلِ هفت‌کارتی‌ای آمد
   که هر فریم getBoundingClientRect می‌خواند. حالا: یک عکسِ ۵۰
   کیلوبایتی، متن و جست‌وجو (فرمِ ساده، بی‌جاوااسکریپت)، و سه کارتِ
   داده‌ی واقعی. تنها جاوااسکریپتِ این بخش HeroTilt است.

   ⚠️ نوارِ استوری این‌جا نیست — در Navbar ثابت روی هیرو می‌نشیند و
   فاصله‌ی بالای `.hh` جای آن است.
   ───────────────────────────────────────────────────────────── */

const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-black'

export function HomeHero({ data, newestClubs, newestProducts, stores }: {
  data: HeroData; newestClubs: RealClub[]; newestProducts: RealProduct[]; stores: RealStore[]
}) {
  /* بی‌کارت ⟵ یک ستون؛ وگرنه نیمه‌ی چپِ دسکتاپ خالی می‌ماند */
  const hasCards = !!(data.live || newestClubs.length || data.tournament || newestProducts.length || data.ranking.length)
  return (
    <section aria-labelledby="hh-title" className="hh relative overflow-hidden text-white">
      {/* پس‌زمینه: همان عکسی که page.tsx پیش‌بارگذاری می‌کند */}
      {/* eslint-disable-next-line @next/next/no-img-element -- LCP؛ next/image این‌جا بهینه‌ساز ندارد و فقط لایه اضافه می‌کند */}
      <img src="/images/hero/1.webp" alt="" aria-hidden fetchPriority="high" decoding="async"
        className="absolute inset-0 h-full w-full object-cover" />
      <div aria-hidden className="hh-veil absolute inset-0" />
      <div aria-hidden className="hh-streak pointer-events-none absolute -inset-x-24 inset-y-0" />

      <div className={`relative mx-auto grid max-w-screen-xl grid-cols-1 items-center gap-8 px-4 pb-8 md:px-8 ${hasCards ? 'min-[901px]:grid-cols-2' : ''} min-[901px]:gap-12`}>
        {/* ── متن ── */}
        <div className="min-w-0">
          {/* همان تیتر و زیرنویسِ هیروی قبلی (خواستِ مالک) — کلیدواژه‌ی اصلیِ سئو هم همین است */}
          <h1 id="hh-title" className="hh-rise text-display font-extrabold max-[900px]:text-center">
            پلتفرم جامع و تخصصی <span className="text-gold-light">بیلیارد</span>
          </h1>
          <p className="hh-in mt-3 max-w-prose text-sub text-white/70 hh-d1 max-[900px]:mx-auto max-[900px]:text-center">
            اتصال بی‌واسطه؛ خانه‌ی دیجیتال جامعه‌ی بیلیارد{' '}
            {/* «ایران» با گرادیانِ عمودیِ پرچم: سبز، سفید، قرمز */}
            <span className="hh-iran font-bold">ایران</span>
          </p>

          {/* فرمِ معمولی: بی‌جاوااسکریپت هم کار می‌کند و همان نشانیِ /search?q= */}
          <form action="/search" method="get" role="search" className="hh-in mt-6 flex max-w-lg items-center gap-2 rounded-panel border border-white/20 bg-white/10 p-1 ps-4 hh-d2 focus-within:border-gold/60">
            <label htmlFor="hh-q" className="sr-only">جست‌وجو در بیلیارد هاب</label>
            {/* زیرِ ۴۰۰px ذره‌بین روی دکمه می‌رود تا کادر جا داشته باشد (۳۲۰ ⟵ ۱۴۶px بود) */}
            <Search size={18} aria-hidden className="shrink-0 text-white/60 max-[399px]:hidden" />
            <input id="hh-q" name="q" type="search" required maxLength={80} enterKeyHint="search"
              placeholder="باشگاه، تجهیزات، مربی، مسابقه…"
              className="min-w-0 flex-1 bg-transparent py-3 text-sub text-white placeholder:text-meta placeholder:text-white/50 outline-none" />
            <button type="submit" className={`shrink-0 rounded-field bg-gold/20 px-4 py-2 max-[399px]:p-3 text-sub font-bold text-gold-light transition-colors duration-base hover:bg-gold/30 ${FOCUS}`}>
              <Search size={18} aria-hidden className="min-[400px]:hidden" />
              <span className="max-[399px]:sr-only">جست‌وجو</span>
            </button>
          </form>

          {/* موبایل: هم‌راستا با تیترِ وسط‌چین */}
          <div className="hh-in mt-4 flex flex-wrap gap-3 hh-d3 max-[900px]:justify-center">
            {/* طرحِ LQ روی زمینه‌ی تیره: تینتِ طلایی، متنِ طلاییِ روشن */}
            <Link prefetch={false} href="/clubs"
              className={`inline-flex items-center gap-2 rounded-field border border-gold/40 bg-gold/15 px-6 py-3 text-sub font-bold text-gold-light transition-[transform,background-color] duration-base ease-smooth hover:-translate-y-0.5 hover:bg-gold/25 ${FOCUS}`}>
              <Calendar size={16} aria-hidden />
              رزرو میز
            </Link>
            {/* پخشی زنده است ⟵ دکمه قرمزِ چشمک‌زن (hh-live-on)؛ وگرنه شیشه‌ایِ آرام */}
            <Link prefetch={false} href="/live"
              className={`inline-flex items-center gap-2 rounded-field border px-6 py-3 text-sub font-bold transition-transform duration-base ease-smooth hover:-translate-y-0.5 ${data.live ? 'hh-live-on text-white' : 'border-white/20 bg-white/5 text-white/90 hover:bg-white/10'} ${FOCUS}`}>
              {data.live
                ? <span aria-hidden className="hh-live-dot h-2 w-2 rounded-full bg-white" />
                : <Radio size={16} aria-hidden />}
              تماشای زنده
            </Link>
          </div>
        </div>

        {/* ── کارت‌ها ── */}
        <HeroCards data={data} newestClubs={newestClubs} newestProducts={newestProducts} stores={stores} />
      </div>

      {/* ردیفِ هفت میان‌بر برداشته شد (خواستِ مالک، ۱۰ آبانِ ۱۴۰۵): همان بخش‌ها در «بیلیارد هاب در یک نگاه» هست و هیرو خلوت‌تر شد */}
    </section>
  )
}

import { AboutHero } from '@/components/about/AboutHero'
import { StoryChapters } from '@/components/about/StoryChapters'
import { RolesIndex } from '@/components/about/RolesIndex'
import { PrinciplesPosters } from '@/components/about/PrinciplesPosters'
import { OwnershipTable } from '@/components/about/OwnershipTable'
import { ClosingBand } from '@/components/about/ClosingBand'
import './about.css'

/* ─────────────────────────────────────────────────────────────
   درباره ما — بازطراحیِ چهارم (آبانِ ۱۴۰۵): سینمایی و تعاملی.

   جهت: «ورزشیِ ادیتوریال × صحنه‌ی سه‌بعدیِ سینمایی × روایتِ تعاملی».
   ۱) هیرو: صحنه‌ی زنده‌ی WebGL از میزِ زیرِ چراغ (شیدرِ raymarching، بی کتابخانه)
      روی عکسِ SSR؛ دوربین با نشانگر و اسکرول حرکت می‌کند
   ۲) روایت: سه فصل در صحنه‌ی ثابت — قاب‌های پراکنده که با اسکرول یکپارچه می‌شوند (GSAP)
   ۳) اکوسیستم: فهرستِ هشت دنیا با یک صحنه‌ی تصویرِ ثابت که با هر نام عوض می‌شود
   ۴) اصول: سه پوستر، واژه‌ی بزرگِ پرشده با عکس، روی صحنه‌ی زغالی
   ۵) مالکیت: پلاکِ سبزِ دو نشان + جدولِ حقیقت‌ها   ۶) دعوت
   رنگ: زمینه‌ی روشنِ عاج غالب است؛ دو صحنه‌ی تیره (هیرو، اصول) عمدی‌اند.
   تصویرها همه تولیدشده‌اند؛ منشأ در components/about/imagery.ts
   ───────────────────────────────────────────────────────────── */

export default function AboutPage() {
  return (
    <div className="ab-page">
      <AboutHero />
      <StoryChapters />
      <RolesIndex />
      <PrinciplesPosters />
      <OwnershipTable />
      <ClosingBand />
    </div>
  )
}

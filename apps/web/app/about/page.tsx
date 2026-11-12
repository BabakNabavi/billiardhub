import { AboutHero } from '@/components/about/AboutHero'
import { StoryFrames } from '@/components/about/StoryFrames'
import { RolesPass } from '@/components/about/RolesPass'
import { PrinciplesField } from '@/components/about/PrinciplesField'
import { OwnershipTable } from '@/components/about/OwnershipTable'
import { ClosingBand } from '@/components/about/ClosingBand'
import './about.css'

/* ─────────────────────────────────────────────────────────────
   درباره ما — بازطراحیِ سوم (آبانِ ۱۴۰۵)، تصویرمحور.

   جهت: «عکس‌ها در اندازه‌های ناهمسان» (tasteskill، seed 1078978074) — مثلِ
   چاپ‌هایی روی دیوارِ گالری، هرکدام با اندازه و جای خودش، روی یک گریدِ
   ۱۲ستونه که حس می‌شود. رنگ و فونت از برند: زمینه‌ی عاج، جوهرِ زغالی،
   سبزِ پارچه به‌عنوانِ تنها میدانِ رنگی (بخشِ اصول)، دکمه‌ی طلاییِ LQ.

   ایده: «در این صفحه، اجزای یک فریمِ اسنوکر — بریک، تماس، جیب، گچ — و هشت
   نقشِ بیلیارد ایران، دیوارِ گالریِ یک جامعه می‌شوند»
   ترتیبِ استدلال: چه هست (هیرو) ⟵ چرا ساخته شد (روایت) ⟵ چه کسانی (هشت نقش)
   ⟵ با چه قاعده‌ای (اصول) ⟵ مالِ کیست (مالکیت) ⟵ از کجا شروع کنید (پایان)

   همه‌ی تصویرها تولیدشده‌اند؛ منشأ و دستورِ هرکدام در components/about/imagery.ts.
   Server Component است؛ حرکت فقط CSS (about.css)
   ───────────────────────────────────────────────────────────── */

export default function AboutPage() {
  return (
    <div className="ab-page">
      <AboutHero />
      <StoryFrames />
      <RolesPass />
      <PrinciplesField />
      <OwnershipTable />
      <ClosingBand />
    </div>
  )
}

import type { Metadata } from 'next'
import { getProfileBySlug } from '@/lib/profiles/server'

/* ─────────────────────────────────────────────────────────────
   متادیتای پروفایلِ متخصص.

   ── چرا این فایل لازم بود ──
   ⚠️ `app/services/layout.tsx` مقدارِ `alternates.canonical = '/services'`
   دارد و متادیتای Next ارثی است: بدونِ این لایه، **هر پروفایلِ
   متخصص خودش را به دایرکتوری canonical می‌کرد** — یعنی به گوگل
   می‌گفت «من صفحه‌ی اصلی نیستم، آن یکی را ایندکس کن». هر صفحه‌ی
   متخصص از فهرستِ ایندکس بیرون می‌افتاد.

   ⚠️ خودِ صفحه `'use client'` است و کامپوننتِ کلاینت نمی‌تواند
   `metadata` صادر کند؛ پس این لایه‌ی سرور فقط برای همین است.

   ⚠️ نام مستقیم از دیتابیس خوانده می‌شود (`getProfileBySlug`)، نه با
   یک درخواستِ HTTP به API خودمان — یک رفت‌وبرگشتِ اضافه در مسیرِ
   رندرِ سرور.
   ───────────────────────────────────────────────────────────── */

const BASE = 'خدمات فنی بیلیارد | بیلیارد هاب'

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params

  /* ⚠️ متادیتا هرگز نباید رندر را بشکند — و «نشکستن» فقط یعنی
     نگرفتنِ استثنا نیست. `generateMetadata` رندرِ صفحه را *بلاک*
     می‌کند: اگر خواندنِ دیتابیس معلق بماند (نه خطا بدهد)، کاربر هیچ
     چیز نمی‌بیند، حتی حالتِ خطا. اندازه‌گیری‌شده: بدونِ این مهلت،
     صفحه در محیطِ بی‌دیتابیس بعد از ۹۰ ثانیه هم رندر نشد.
     پس علاوه بر `catch`، یک مسابقه‌ی زمانی هم لازم است. */
  const withTimeout = async <T,>(p: Promise<T>, ms: number): Promise<T | null> =>
    Promise.race([p, new Promise<null>(r => setTimeout(() => r(null), ms))])

  let name = ''
  let intro = ''
  let approved = false
  try {
    const p = await withTimeout(getProfileBySlug('technician', id), 2500)
    if (p) {
      approved = p.status === 'approved'
      const d = p.data as { name?: unknown; title?: unknown; intro?: unknown }
      name = typeof d.name === 'string' ? d.name.trim() : ''
      const t = typeof d.title === 'string' ? d.title.trim() : ''
      const i = typeof d.intro === 'string' ? d.intro.trim() : ''
      intro = i || t
    }
  } catch { /* دیتابیس در دسترس نبود — عنوانِ عمومی */ }

  const title = name ? `${name} | متخصص خدمات فنی بیلیارد | بیلیارد هاب` : BASE
  const description = intro
    || 'پروفایل متخصص خدمات فنی بیلیارد: تخصص‌ها، نمونه‌کارها و راه ارتباطی.'
  const url = `/services/${id}`

  return {
    title,
    description,
    alternates: { canonical: url },
    /* ⚠️ پروفایلِ تأییدنشده نباید ایندکس شود: هنوز عمومی نیست. */
    ...(approved ? {} : { robots: { index: false, follow: false } }),
    openGraph: {
      title, description, url,
      siteName: 'بیلیارد هاب', locale: 'fa_IR', type: 'profile',
    },
    twitter: { card: 'summary', title, description },
  }
}

export default function TechnicianProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import type { Metadata } from 'next'
import Image from 'next/image'
import { CircleCheck } from 'lucide-react'
import { AndroidCard } from '@/components/app-download/AndroidCard'
import { DeviceHint } from '@/components/app-download/DeviceHint'
import { IosCard } from '@/components/app-download/IosCard'
import { getApkMeta } from '@/lib/app-download-meta'
import { OG_IMAGE } from '@/lib/seo/config'
import '@/styles/reveal.css'

/* ─────────────────────────────────────────────────────────────
   دانلودِ اپلیکیشن — یک نشانیِ ثابت برای همه‌ی راه‌های نصب
   (فوتر، اینستاگرام، پیامک، تبلیغ همه به همین‌جا لینک می‌دهند).

   Server Component و استاتیک: حجمِ APK و اثر انگشتِ امضا موقعِ بیلد
   خوانده می‌شوند (lib/app-download-meta). تنها تکه‌ی کلاینتی DeviceHint
   است که کارتِ مناسبِ دستگاه را برچسب و حلقه می‌زند (جابه‌جا نمی‌کند:
   جابه‌جایی بعد از هیدریت پرشِ صفحه بود و ترتیبِ صفحه‌خوان را هم می‌شکست).
   هم‌خانواده‌ی ظاهریِ «تماس با ما»: سربرگِ روشن و جمع‌وجور، کارتِ سفید.
   ───────────────────────────────────────────────────────────── */

const TITLE = 'دانلود اپلیکیشن'
const DESC = 'اپ بیلیارد هاب برای اندروید از کافه‌بازار یا دانلود مستقیم، و برای آیفون به‌صورت وب‌اپ'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: '/app' },
  openGraph: {
    title: `${TITLE} | بیلیارد هاب`,
    description: DESC,
    url: '/app',
    siteName: 'بیلیارد هاب',
    locale: 'fa_IR',
    type: 'website',
    images: [OG_IMAGE],
  },
  twitter: { card: 'summary_large_image', title: `${TITLE} | بیلیارد هاب`, description: DESC, images: [OG_IMAGE.url] },
}

const WRAP = 'mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8'
const POINTS = ['رایگان', 'نسخه رسمی بیلیارد هاب', 'همیشه به‌روز بدون نصب دوباره'] as const

export default function AppDownloadPage() {
  const meta = getApkMeta()
  return (
    <div className="overflow-x-clip bg-paper text-ink">
      <section className={`${WRAP} pb-12 pt-8 lg:pb-16 lg:pt-16`}>
        <div className="ab-in flex max-w-3xl flex-col gap-4">
          <Image src="/images/Logo/bh-apple-180-v13.png" alt="" width={64} height={64}
            className="h-16 w-16 rounded-card shadow-e1" />
          <p className="text-body font-bold text-gold-text">اپلیکیشن بیلیارد هاب</p>
          <h1 className="text-balance text-display">
            بیلیارد هاب روی گوشی شما
            <span className="block text-ink-2">رزرو باشگاه، مسابقات و بازار همیشه در دسترس</span>
          </h1>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {POINTS.map(p => (
              <li key={p} className="flex items-center gap-2 text-body text-ink-2">
                <CircleCheck size={18} aria-hidden className="shrink-0 text-gold-text" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* داخلِ خودِ اپ (TWA یا وب‌اپِ نصب‌شده) — بی جاوااسکریپت، با media query */}
        <p className="mt-8 hidden items-center gap-2 rounded-card bg-gold/[.12] p-4 text-body font-bold text-gold-text [@media(display-mode:standalone)]:flex">
          <CircleCheck size={20} aria-hidden className="shrink-0" />
          اپ بیلیارد هاب روی همین گوشی نصب است
        </p>

        <DeviceHint className="mt-8 grid items-start gap-6 md:grid-cols-2 lg:mt-12">
          {/* اندروید اول: بیشترِ کاربرانِ ایرانی؛ آیفونی‌ها کارتِ خودشان را با برچسب می‌بینند */}
          <AndroidCard meta={meta} />
          <IosCard />
        </DeviceHint>
      </section>
    </div>
  )
}

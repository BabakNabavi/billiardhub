import type { Metadata } from 'next'
import { sb } from '@/lib/finance/db'

/* متادیتای صفحه‌ی یک باشگاه.

   صفحه Client Component است و نمی‌تواند metadata صادر کند، پس این لایه
   فقط برای SEO اضافه شده و چیزی جز children رندر نمی‌کند.

   تا امروز صفحه‌ی هر باشگاه عنوانِ پیش‌فرضِ سایت را داشت — یعنی گوگل و
   هر لینکِ اشتراکی، همه‌ی باشگاه‌ها را «بیلیارد هاب | پلتفرم جامع…»
   می‌دید. این‌ها مهم‌ترین صفحه‌های سایت از نظر جست‌وجو هستند. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params
  if (!UUID.test(id)) return {}

  try {
    const { data } = await sb().from('clubs')
      .select('name,city,province,address,"verificationStatus","isActive"')
      .eq('id', id).maybeSingle()
    const c = data as {
      name?: string; city?: string; province?: string; address?: string
      verificationStatus?: string; isActive?: boolean
    } | null
    if (!c?.name) return {}

    /* باشگاهِ منتشرنشده نباید ایندکس شود */
    const published = c.isActive !== false &&
      (c.verificationStatus === 'verified' || c.verificationStatus === 'approved')

    const where = [c.city, c.province].filter(Boolean).join('، ')
    const title = where ? `${c.name} — باشگاه بیلیارد در ${c.city}` : `${c.name} — باشگاه بیلیارد`
    const description = [
      `${c.name}${where ? ` در ${where}` : ''}.`,
      'مشاهده‌ی میزها، ساعات کاری، تصاویر و رزرو آنلاین در بیلیارد هاب.',
    ].join(' ')

    return {
      title,
      description,
      alternates: { canonical: `/clubs/${id}` },
      robots: published ? undefined : { index: false, follow: false },
      openGraph: {
        title, description, url: `/clubs/${id}`,
        siteName: 'بیلیارد هاب', locale: 'fa_IR', type: 'website',
      },
      twitter: { card: 'summary_large_image', title, description },
    }
  } catch {
    /* دیتابیس در دسترس نبود ⇒ متادیتای پیش‌فرضِ ریشه می‌ماند، نه خطا */
    return {}
  }
}

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

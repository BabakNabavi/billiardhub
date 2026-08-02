import type { Metadata } from 'next'
import { sb } from '@/lib/finance/db'

/* متادیتای یک خبر. صفحه Client Component است، پس متادیتا این‌جاست.

   خبر بدونِ عنوان و چکیده‌ی اختصاصی، در نتایجِ جست‌وجو و در پیش‌نمایشِ
   اشتراک‌گذاری با عنوانِ کلیِ سایت دیده می‌شد — یعنی همه‌ی خبرها شبیهِ
   هم. */
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params
  if (!id) return {}

  try {
    const { data } = await sb().from('news')
      .select('slug,title,excerpt,cover_url,status,published_at')
      .eq('slug', id).maybeSingle()
    const a = data as {
      title?: string; excerpt?: string; cover_url?: string
      status?: string; published_at?: string
    } | null
    if (!a?.title) return {}

    const description = a.excerpt || `${a.title} — اخبار بیلیارد در بیلیارد هاب.`
    return {
      title: a.title,
      description,
      alternates: { canonical: `/news/${id}` },
      /* پیش‌نویس نباید ایندکس شود */
      robots: a.status === 'published' ? undefined : { index: false, follow: false },
      openGraph: {
        title: a.title, description, url: `/news/${id}`,
        siteName: 'بیلیارد هاب', locale: 'fa_IR', type: 'article',
        ...(a.published_at ? { publishedTime: a.published_at } : {}),
        ...(a.cover_url ? { images: [{ url: a.cover_url }] } : {}),
      },
      twitter: { card: 'summary_large_image', title: a.title, description },
    }
  } catch { return {} }
}

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

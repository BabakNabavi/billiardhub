import type { Metadata } from 'next'
import { getArticle } from '@/lib/news/server'
import { sectionOf } from '@/lib/news/sections'
import { iso } from '@/lib/news/format'

/* ─────────────────────────────────────────────────────────────
   متادیتای یک خبر.

   ⚠️ عنوان `absolute` است نه رشته‌ی ساده. `app/news/layout.tsx`
   قالب `'%s | بیلیارد هاب'` لایه‌ی ریشه را *مصرف* می‌کند (چون
   `title` را به‌صورت رشته می‌دهد و قالب تازه‌ای نمی‌سازد)، پس این
   نوه هیچ قالبی به ارث نمی‌برد و بدون `absolute` هر خبر بی‌نام
   برند منتشر می‌شد. همان تله‌ای که در پروفایل خدمات فنی روی سایت
   زنده دیده شد.

   ⚠️ خواندن از همان لایه‌ی `lib/news/server` است که خود صفحه هم از
   آن می‌خواند، نه یک پرس‌وجوی دوم با شکل متفاوت — وگرنه عنوان تب
   مرورگر و عنوان داخل صفحه می‌توانستند از هم جدا بیفتند.
   ───────────────────────────────────────────────────────────── */

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params
  if (!id) return {}

  /* ⚠️ متادیتا رندر صفحه را بلاک می‌کند؛ اگر خواندن دیتابیس معلق
     بماند کاربر هیچ چیز نمی‌بیند، حتی حالت خطا. پس علاوه بر
     `catch`، یک مهلت زمانی هم لازم است. */
  const withTimeout = async <T,>(p: Promise<T>, ms: number): Promise<T | null> =>
    Promise.race([p, new Promise<null>(r => setTimeout(() => r(null), ms))])

  /* ⚠️ رمزگشایی دوم این‌جا بدتر بود: *پیش* از ساخت promise اجرا
     می‌شد، پس catch پایین خط اصلا نمی‌دیدش و generateMetadata
     رد می‌شد. Next پارامتر را از قبل رمزگشایی کرده. */
  const a = await withTimeout(getArticle(id), 2500).catch(() => null)
  if (!a) return {}

  const sec = sectionOf(a.section)
  const description = a.excerpt
    || `${a.title} — اخبار بیلیارد در بیلیارد هاب.`
  const url = `/news/${encodeURIComponent(a.id)}`

  return {
    title: { absolute: `${a.title} | بیلیارد هاب` },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: a.title, description, url,
      siteName: 'بیلیارد هاب', locale: 'fa_IR', type: 'article',
      ...(a.ts ? { publishedTime: iso(a.ts) } : {}),
      ...(a.updatedTs ? { modifiedTime: iso(a.updatedTs) } : {}),
      ...(sec ? { section: sec.label } : {}),
      ...(a.tags.length > 0 ? { tags: a.tags } : {}),
      ...(a.cover ? { images: [{ url: a.cover }] } : {}),
    },
    twitter: {
      card: a.cover ? 'summary_large_image' : 'summary',
      title: a.title, description,
      ...(a.cover ? { images: [a.cover] } : {}),
    },
  }
}

export default function NewsArticleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

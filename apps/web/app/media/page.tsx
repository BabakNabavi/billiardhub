import type { Metadata } from 'next'
import { MEDIA_CATEGORIES } from '@/lib/media-data'
import MediaHome from './MediaHome'

/* ─────────────────────────────────────────────────────────────
   پوسته‌ی سروریِ بیلیارد مدیا — فقط برای متادیتای هر دسته.

   ⚠️ تا آبانِ ۱۴۰۵ canonicalِ همه‌ی `?category=…`ها `/media` بود (از
   layout) در حالی که خودِ نقشه‌ی سایت آن‌ها را جدا معرفی می‌کرد — سیگنالِ
   متناقض. دسته‌ها پلِ خزنده به ویدیوها هستند (sitemap.ts)، پس هر دسته
   عنوان و canonicalِ خودش را دارد. بی‌دسته ⟵ همان متادیتای layout.
   ───────────────────────────────────────────────────────────── */

type Search = Promise<Record<string, string | string[] | undefined>>

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const raw = (await searchParams).category
  const cat = MEDIA_CATEGORIES.find(c => c.key === raw)
  if (!cat) return {}
  const title = `${cat.label} | بیلیارد مدیا | بیلیارد هاب`
  const description = `ویدیوهای ${cat.label} در بیلیارد مدیا؛ آموزش، مسابقه و کلیپ‌های بیلیارد و اسنوکر`
  const url = `/media?category=${cat.key}`
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'بیلیارد هاب', locale: 'fa_IR', type: 'website' },
    /* ادغامِ متادیتا سطحی است — بی این، twitterِ عمومیِ layout روی همه‌ی دسته‌ها می‌ماند */
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default function MediaPage() {
  return <MediaHome />
}

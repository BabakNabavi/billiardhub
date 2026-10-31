import { AsyncJsonLd } from '@/components/seo/AsyncJsonLd'
import { profileJsonLd, profileMetadata } from '@/lib/seo/profile-seo'

/* SEOِ صفحه‌ی پروفایل — صفحه 'use client' است و متادیتا نمی‌دهد؛ بی‌این لایه
   عنوان و canonicalِ فهرستِ والد (/manufacturers) را ارث می‌برد و ایندکس نمی‌شد.
   JSON-LD در Suspense است: رندرِ صفحه منتظرِ دیتابیس نمی‌ماند. */
export const generateMetadata = profileMetadata('manufacturer')

export default async function ManufacturerProfileLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ id: string }> },
) {
  const { id } = await params
  return <><AsyncJsonLd data={profileJsonLd('manufacturer', id)} />{children}</>
}

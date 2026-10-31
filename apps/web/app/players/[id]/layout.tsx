import { AsyncJsonLd } from '@/components/seo/AsyncJsonLd'
import { profileJsonLd, profileMetadata } from '@/lib/seo/profile-seo'

/* SEOِ صفحه‌ی پروفایل — صفحه 'use client' است و متادیتا نمی‌دهد؛ بی‌این لایه
   عنوان و canonicalِ فهرستِ والد (/players) را ارث می‌برد و ایندکس نمی‌شد.
   JSON-LD در Suspense است: رندرِ صفحه منتظرِ دیتابیس نمی‌ماند. */
export const generateMetadata = profileMetadata('player')

export default async function PlayerProfileLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ id: string }> },
) {
  const { id } = await params
  return <><AsyncJsonLd data={profileJsonLd('player', id)} />{children}</>
}

import { AsyncJsonLd } from '@/components/seo/AsyncJsonLd'
import { profileJsonLd, profileMetadata } from '@/lib/seo/profile-seo'

/* SEOِ صفحه‌ی پروفایل — صفحه 'use client' است و متادیتا نمی‌دهد؛ بی‌این لایه
   عنوان و canonicalِ فهرستِ والد (/services) را ارث می‌برد و ایندکس نمی‌شد.
   JSON-LD در Suspense است: رندرِ صفحه منتظرِ دیتابیس نمی‌ماند. */
export const generateMetadata = profileMetadata('technician')

export default async function TechnicianProfileLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ id: string }> },
) {
  const { id } = await params
  return <><AsyncJsonLd data={profileJsonLd('technician', id)} />{children}</>
}

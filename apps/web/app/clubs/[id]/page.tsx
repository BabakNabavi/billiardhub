import { notFound } from 'next/navigation'
import { ClubProfileClient, type Club } from './ClubProfileClient'
import { loadPublicClub } from '@/lib/clubs/public-club'

/* ─────────────────────────────────────────────────────────────
   پوسته‌ی سرورِ صفحه‌ی باشگاه.

   خودِ صفحه کلاینتی می‌ماند (۱۸۰۰ خط، بازنویسی‌اش نه لازم است نه امن).
   این لایه فقط یک کار می‌کند: باشگاه را روی سرور می‌خواند و به‌عنوانِ
   مقدارِ اولیه پایین می‌فرستد — همان الگوی صفحه‌ی اصلی (app/page.tsx).
   پیش از این HTMLِ اولِ هر باشگاه فقط چرخنده‌ی «در حال بارگذاری» بود.

   باشگاهِ ناموجود ⟵ ۴۰۴ِ واقعی (پیش‌تر ۲۰۰ با چرخنده: «۴۰۴ِ نرم» برای گوگل).
   خطای دیتابیس بی‌خطر است ⟵ رفتارِ قبلی (مرورگر خودش می‌خواند).
   ───────────────────────────────────────────────────────────── */

export default async function ClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let club: Record<string, unknown> | null | undefined
  try {
    club = await loadPublicClub(id)
  } catch (e) {
    console.error('[clubs/[id]] initial load', e)
    club = undefined
  }
  if (club === null) notFound()
  /* شکلِ پاسخ همان /api/clubs/[id] است که صفحه از قبل می‌خواند */
  return <ClubProfileClient initialClub={(club ?? null) as Club | null} />
}

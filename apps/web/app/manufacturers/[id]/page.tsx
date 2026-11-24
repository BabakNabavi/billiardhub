import { ManufacturerProfileClient } from './ManufacturerProfileClient'
import { loadPublicProfileFull } from '@/lib/profiles/public-detail'
import type { ManufacturerProfile } from '@/lib/manufacturer-store'

/* ─────────────────────────────────────────────────────────────
   پوسته‌ی سرورِ پروفایلِ تولیدکننده — همان الگوی مربی/داور/خدمات فنی:
   پروفایلِ تأییدشده و «نامِ مدیر» همراهِ HTML می‌آیند تا صفحه بی‌اسکلت و
   بی‌پرش باز شود (آذرِ ۱۴۰۵). نبود/تأییدنشده/خطا ⟵ رفتارِ قبلی.
   ⚠️ `key`: جابه‌جایی بینِ دو پروفایل state را از قبلی نگه می‌داشت.
   ───────────────────────────────────────────────────────────── */

export default async function ManufacturerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await loadPublicProfileFull<ManufacturerProfile>('manufacturer', id)
  return <ManufacturerProfileClient key={id} initial={r?.profile ?? null} initialManager={r?.managerName ?? ''} />
}

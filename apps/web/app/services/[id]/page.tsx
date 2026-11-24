import { TechnicianProfileClient } from './TechnicianProfileClient'
import { loadPublicProfile } from '@/lib/profiles/public-detail'
import type { TechnicianProfile } from '@/lib/technician-store'

/* ─────────────────────────────────────────────────────────────
   پوسته‌ی سرورِ پروفایل — پروفایلِ تأییدشده همراهِ HTML می‌آید تا صفحه
   بی‌اسکلت و بی‌پرش باز شود و عکسِ هیرو از همان HTML کشف شود
   (لایت‌هاوس، آذرِ ۱۴۰۵: CLS ۰٫۶۶ و ۲ تا ۳٫۵ ثانیه تأخیرِ شروعِ عکس).
   نبود/تأییدنشده/خطا ⟵ null: رفتارِ قبلی (مرورگر خودش می‌خواند).

   ⚠️ `key`: جابه‌جایی بینِ دو پروفایل بی‌بارگذاریِ کامل همان نمونه‌ی
   کلاینت را نگه می‌داشت و state از پروفایلِ قبلی می‌ماند.
   ───────────────────────────────────────────────────────────── */

export default async function TechnicianProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const initial = await loadPublicProfile<TechnicianProfile>('technician', id)
  return <TechnicianProfileClient key={id} initial={initial} />
}

import { redirect } from 'next/navigation';

/* صفحه‌ی جزئیاتِ رویدادِ ساختگی حذف شد — شناسه‌های قدیمی («۱»، «۲»…)
   هیچ مسابقه‌ی واقعی‌ای نیستند، پس به فهرستِ مسابقات هدایت می‌شوند. */
export default async function EventDetailPage() {
  redirect('/tournaments');
}

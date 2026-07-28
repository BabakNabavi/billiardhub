import { redirect } from 'next/navigation';

/* نسخه‌ی قبلیِ این صفحه تبلیغات را فقط در حافظه‌ی همان صفحه نگه
   می‌داشت (state، با دو رکوردِ نمونه): با هر رفرش پاک می‌شد و هیچ
   بازدیدکننده‌ای آن بنرها را نمی‌دید.

   جایش را /admin/ad-slots گرفت که روی دیتابیس کار می‌کند و بنرهایش
   واقعاً روی سایت نمایش داده می‌شوند. */
export default function AdminAdsRedirect() {
  redirect('/admin/ad-slots');
}

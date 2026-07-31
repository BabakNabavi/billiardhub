import { redirect } from 'next/navigation';

/* نسخه‌ی قدیمی (جدول‌های ad_slots/ad_placements + کلید سراسری) در
   فاز ۲ با سیستم Placement/Campaign جایگزین شد — بدون کلید سراسری
   و با شش جایگاه مستقل. */
export default function AdminAdSlotsRedirect() {
  redirect('/admin/advertising');
}

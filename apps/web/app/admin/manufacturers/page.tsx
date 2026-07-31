'use client';

/* پنل ادمین — تولیدکنندگان.
   منبع: جدول `profiles` از راه `/api/admin/profiles` (پیش‌تر localStorage بود). */

import ProfileAdmin from '../ProfileAdmin';
import { profileAdminSource } from '../../../lib/admin/profile-rows';

const src = profileAdminSource('manufacturer');

export default function AdminManufacturersPage() {
  return (
    <ProfileAdmin
      title="تولیدکنندگان"
      en="MANUFACTURERS · SUPER ADMIN"
      desc="مدیریت پروفایل تولیدکنندگان — انتشار یا تعلیق."
      panelHint="تولیدکنندگان از «داشبورد ← پنل تولیدکننده» پروفایل می‌سازند و این‌جا برای شما فهرست می‌شوند."
      load={src.load}
      toggle={src.toggle}
      remove={src.remove}
    />
  );
}

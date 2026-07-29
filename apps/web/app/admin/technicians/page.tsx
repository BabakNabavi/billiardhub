'use client';

/* پنل ادمین — متخصصان فنی.
   منبع: جدولِ `profiles` از راهِ `/api/admin/profiles`.
   (پیش‌تر localStorage بود و هر ادمین فهرستِ متفاوتی می‌دید.) */

import ProfileAdmin from '../ProfileAdmin';
import { profileAdminSource } from '../../../lib/admin/profile-rows';

const src = profileAdminSource('technician');

export default function AdminTechniciansPage() {
  return (
    <ProfileAdmin
      title="متخصصان فنی"
      en="TECHNICIANS · SUPER ADMIN"
      desc="مدیریت پروفایل متخصصان بخش «خدمات فنی» — انتشار یا تعلیق."
      panelHint="متخصصان از «داشبورد ← پنل خدمات فنی» پروفایل می‌سازند و این‌جا برای شما فهرست می‌شوند."
      load={src.load}
      toggle={src.toggle}
      remove={src.remove}
    />
  );
}

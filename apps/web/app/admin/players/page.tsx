'use client';

/* پنل ادمین — بازیکنان شاخص.
   منبع: جدول `profiles` از راه `/api/admin/profiles`.
   (پیش‌تر localStorage بود و هر ادمین فهرست متفاوتی می‌دید.) */

import ProfileAdmin from '../ProfileAdmin';
import { profileAdminSource } from '../../../lib/admin/profile-rows';

const src = profileAdminSource('player');

export default function AdminPlayersPage() {
  return (
    <ProfileAdmin
      title="بازیکنان شاخص"
      en="PLAYERS · SUPER ADMIN"
      desc="مدیریت پروفایل بازیکنان بخش «ستارگان بیلیارد» — انتشار یا تعلیق."
      panelHint="بازیکنان از «داشبورد ← پروفایل بازیکن» پروفایل می‌سازند و این‌جا برای شما فهرست می‌شوند."
      load={src.load}
      toggle={src.toggle}
      remove={src.remove}
    />
  );
}

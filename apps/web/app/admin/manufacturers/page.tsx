'use client';

/* پنل ادمین — تولیدکنندگان (پروفایل‌های ساخته‌شده در /dashboard/manufacturer) */

import ProfileAdmin from '../ProfileAdmin';
import { getManufacturerProfiles, saveManufacturerProfile, deleteManufacturerProfile } from '../../../lib/manufacturer-store';

export default function AdminManufacturersPage() {
  return (
    <ProfileAdmin
      title="تولیدکنندگان"
      en="MANUFACTURERS · SUPER ADMIN"
      desc="مدیریت پروفایل تولیدکنندگان — انتشار، تعلیق یا حذف."
      panelHint="تولیدکنندگان از «داشبورد ← پنل تولیدکننده» پروفایل می‌سازند و این‌جا برای شما فهرست می‌شوند."
      load={() =>
        Object.values(getManufacturerProfiles()).map(p => ({
          slug: p.slug,
          title: p.name || 'بدون نام',
          subtitle: `${p.city || '—'} · ${p.products.length} محصول${p.sinceYear ? ` · از ${p.sinceYear}` : ''}`,
          status: p.status,
          href: `/manufacturers/${p.slug}`,
        }))
      }
      toggle={slug => {
        const p = getManufacturerProfiles()[slug];
        if (p) saveManufacturerProfile({ ...p, status: p.status === 'approved' ? 'rejected' : 'approved' });
      }}
      remove={slug => deleteManufacturerProfile(slug)}
    />
  );
}

'use client';

/* پنل ادمین — متخصصان فنی (پروفایل‌های ساخته‌شده در /dashboard/technician) */

import ProfileAdmin from '../ProfileAdmin';
import { getTechnicianProfiles, saveTechnicianProfile, deleteTechnicianProfile } from '../../../lib/technician-store';

export default function AdminTechniciansPage() {
  return (
    <ProfileAdmin
      title="متخصصان فنی"
      en="TECHNICIANS · SUPER ADMIN"
      desc="مدیریت پروفایل متخصصان بخش «خدمات فنی» — انتشار، تعلیق یا حذف."
      panelHint="متخصصان از «داشبورد ← پنل خدمات فنی» پروفایل می‌سازند و این‌جا برای شما فهرست می‌شوند."
      load={() =>
        Object.values(getTechnicianProfiles()).map(p => ({
          slug: p.slug,
          title: p.name || 'بدون نام',
          subtitle: `${p.title || 'متخصص'} · ${p.city || '—'} · ${p.services.length} خدمت`,
          status: p.status,
          href: `/services/${p.slug}`,
        }))
      }
      toggle={slug => {
        const p = getTechnicianProfiles()[slug];
        if (p) saveTechnicianProfile({ ...p, status: p.status === 'approved' ? 'rejected' : 'approved' });
      }}
      remove={slug => deleteTechnicianProfile(slug)}
    />
  );
}

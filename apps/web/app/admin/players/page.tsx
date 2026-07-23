'use client';

/* پنل ادمین — بازیکنان شاخص (پروفایل‌های ساخته‌شده در /dashboard/player) */

import ProfileAdmin from '../ProfileAdmin';
import { getPlayerProfiles, savePlayerProfile, deletePlayerProfile } from '../../../lib/player-store';
import { DISCIPLINE_LABEL } from '../../../lib/players-data';

export default function AdminPlayersPage() {
  return (
    <ProfileAdmin
      title="بازیکنان شاخص"
      en="PLAYERS · SUPER ADMIN"
      desc="مدیریت پروفایل بازیکنان بخش «ستارگان بیلیارد» — انتشار، تعلیق یا حذف."
      panelHint="بازیکنان از «داشبورد ← پروفایل بازیکن» پروفایل می‌سازند و این‌جا برای شما فهرست می‌شوند."
      load={() =>
        Object.values(getPlayerProfiles()).map(p => ({
          slug: p.slug,
          title: p.name || 'بدون نام',
          subtitle: `${DISCIPLINE_LABEL[p.discipline].fa} · ${p.city || '—'}${p.ranking ? ` · رنکینگ ${p.ranking}` : ''}`,
          status: p.status,
          href: `/players/${p.slug}`,
        }))
      }
      toggle={slug => {
        const p = getPlayerProfiles()[slug];
        if (p) savePlayerProfile({ ...p, status: p.status === 'approved' ? 'rejected' : 'approved' });
      }}
      remove={slug => deletePlayerProfile(slug)}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   لایه‌ی مشترکِ پنلِ ادمین.

   استانداردِ چیدمان (توکن‌های فاصله، حاشیه‌ی کناری، ناحیه‌ی لمس، فونتِ ورودی،
   جدول و پنجره، و کلاس‌های آماده‌ی adm-*) در admin.css است — قاعده‌ها زیرِ
   `.admin-scope`، پس فقط پنل را عوض می‌کند. راهنما: ui-audit.md در ریشه.
   ───────────────────────────────────────────────────────────── */

import type { Metadata } from 'next';
import AdminBack from '../../components/admin/AdminBack';
import './admin.css';

/* پنل مدیریت هرگز نباید ایندکس شود */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-scope">
      {/* یک‌بار این‌جا، پس هر صفحه‌ی ادمین — از جمله صفحه‌های آینده — دارد */}
      <AdminBack />
      {children}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/auth.store';
import ScrollList from '../../../components/ui/ScrollList';
import { apiFetch } from '../../../lib/http';
import { Users, Search, CheckCircle, XCircle, Eye, Shield } from 'lucide-react';
import UserDetailDialog from '../../../components/admin/UserDetailDialog';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { RowAction, ROW_ACTIONS_CLASS, ROW_ACTIONS_HEAD_CLASS } from '../../../components/admin/RowAction';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  primaryRole: string;
  secondaryRoles: string[];
  isProfileComplete: boolean;
  verificationStatus: string;
  createdAt: string;
  city?: string;
}

const roleLabels: Record<string, string> = {
  user: 'کاربر',
  player: 'بازیکن',
  coach: 'مربی',
  referee: 'داور',
  club_owner: 'مالک باشگاه',
  seller: 'فروشگاه',
  manufacturer: 'تولیدکننده',
  installer: 'متخصص نصب',
  admin: 'ادمین',
};

const verificationColors: Record<string, string> = {
  unverified: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  verified: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
};

const verificationLabels: Record<string, string> = {
  unverified: 'تأیید نشده',
  pending: 'در انتظار',
  verified: 'تأیید شده',
  rejected: 'رد شده',
};

export default function AdminUsersPage() {
  const router = useRouter();
  /* بدون `_hydrated`، نخستین رندر `user` را تهی می‌بیند (استور از
     localStorage خوانده می‌شود) و ادمین را پیش از باز شدن صفحه به
     صفحه‌ی اصلی پرت می‌کند — یعنی رفرش یا ورود از بوکمارک کار نمی‌کرد. */
  const { user, _hydrated, authChecked } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterVerification, setFilterVerification] = useState('all');

  const [err, setErr] = useState('');

  /* منبع: `/api/admin/users`.
     پیش‌تر `api.get('/user/all')` بود — مسیر بک‌اند NestJS که حذف
     شده و در Next وجود ندارد. نتیجه‌اش ۴۰۴ بود که در `.catch` بلعیده
     می‌شد و صفحه فهرست خالی نشان می‌داد، در حالی که کارت داشبورد
     همان لحظه ۲۱ کاربر می‌شمرد. */
  useEffect(() => {
    if (!_hydrated || !authChecked) return;
    if (!user || user.primaryRole !== 'admin') { router.push('/'); return; }
    void (async () => {
      try {
        const r = await apiFetch('/api/admin/users', { cache: 'no-store' });
        const j = await r.json().catch(() => ({})) as { users?: User[]; message?: string };
        if (!r.ok) { setErr(j.message ?? 'خواندن کاربران انجام نشد'); return; }
        setUsers(j.users ?? []); setErr('');
      } catch { setErr('خطا در ارتباط با سرور'); }
      finally { setLoading(false); }
    })();
  }, [_hydrated, authChecked, user, router]);

  const handleVerify = async (userId: string, status: string) => {
    setErr('');
    try {
      const r = await apiFetch('/api/admin/users', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, verificationStatus: status }),
      });
      const j = await r.json().catch(() => ({})) as { message?: string };
      if (!r.ok) { setErr(j.message ?? 'تغییر وضعیت انجام نشد'); return; }
      setUsers(us => us.map(u => u.id === userId ? { ...u, verificationStatus: status } : u));
    } catch { setErr('خطا در ارتباط با سرور'); }
  };

  const filtered = users.filter(u => {
    if (search && !`${u.firstName} ${u.lastName}`.includes(search) && !u.phone?.includes(search)) return false;
    if (filterRole !== 'all' && u.primaryRole !== filterRole) return false;
    if (filterVerification !== 'all' && u.verificationStatus !== filterVerification) return false;
    return true;
  });

  if (!_hydrated) return null;
  if (!user || user.primaryRole !== 'admin') return null;

  return (
    <main className="adm-page">
      <AdminHeader
        icon={<Users size={26} className="text-gold-text" aria-hidden />}
        title="مدیریت کاربران"
        description={`${filtered.length.toLocaleString("fa-IR")} کاربر`} />

      {/* خطا هرگز نباید بی‌صدا بماند — همین بی‌صدایی بود که ۴۰۴ را
          ماه‌ها پنهان کرد و صفحه فقط «کاربری پیدا نشد» نشان می‌داد. */}
      {err && (
        <div role="alert" className="rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger-ink">
          {err}
        </div>
      )}

      {/* فیلترها: روی موبایل جست‌وجو یک ردیف، و دو فیلتر کنارِ هم در ردیفِ بعد */}
      <div className="adm-card">
        <div className="adm-toolbar">
          <div className="adm-grow relative">
            <label htmlFor="users-q" className="sr-only">جست‌وجوی نام یا شماره</label>
            <Search size={16} aria-hidden className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input id="users-q" type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="جست‌وجوی نام یا شماره…"
              className="h-11 w-full rounded-field border border-line/20 bg-surface pe-3 ps-9 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep" />
          </div>
          <label className="flex-1 basis-36">
            <span className="sr-only">فیلتر نقش</span>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="h-11 w-full">
              <option value="all">همه نقش‌ها</option>
              {Object.entries(roleLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <label className="flex-1 basis-36">
            <span className="sr-only">فیلتر وضعیت تأیید</span>
            <select value={filterVerification} onChange={e => setFilterVerification(e.target.value)} className="h-11 w-full">
              <option value="all">همه وضعیت‌ها</option>
              <option value="unverified">تأیید نشده</option>
              <option value="pending">در انتظار</option>
              <option value="verified">تأیید شده</option>
              <option value="rejected">رد شده</option>
            </select>
          </label>
        </div>
      </div>

      {/* فهرست: از lg جدولِ ۱۲ستونی، زیرِ آن کارتِ موبایل */}
      <div className="overflow-hidden rounded-card border border-line/10 bg-surface">
        <div className="hidden bg-paper px-4 py-3 text-xs text-ink-2 lg:grid lg:grid-cols-12" aria-hidden>
          <div className="col-span-3">کاربر</div>
          <div className="col-span-2">نقش</div>
          <div className="col-span-2">شهر</div>
          <div className="col-span-2">وضعیت تأیید</div>
          <div className="col-span-1">پروفایل</div>
          <div className={ROW_ACTIONS_HEAD_CLASS}>عملیات</div>
        </div>

        {loading ? (
          <ul aria-busy="true" aria-label="در حال بارگذاری" className="m-0 flex list-none flex-col gap-3 p-4">
            {[0, 1, 2, 3, 4].map(i => <li key={i} className="h-16 rounded-card bg-line/[.06] motion-safe:animate-pulse" />)}
          </ul>
        ) : filtered.length === 0 ? (
          <p className="m-0 py-12 text-center text-sm text-ink-2">کاربری پیدا نشد</p>
        ) : (
          /* ── چرا قاب ──
             فهرست بدون سقف رها بود: با پانصد کاربر صفحه چند ده هزار
             پیکسل بلند می‌شد و هرچه پایین فهرست بود ناپیدا. */
          <ScrollList count={filtered.length} min={8} gap={0}
            className="divide-y divide-line/10">
            {filtered.map(u => (
              <div key={u.id} className="flex flex-col px-4 py-3 hover:bg-paper lg:grid lg:grid-cols-12 lg:items-center">
                <div className="flex items-center gap-3 lg:col-span-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-sm font-semibold text-gold-text" aria-hidden>
                    {u.firstName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="adm-break text-sm font-semibold text-ink">{u.firstName} {u.lastName}</div>
                    <div className="text-xs text-ink-2">{u.phone}</div>
                  </div>
                </div>
                {/* مشخصات: روی موبایل یک ردیفِ شکستنی از نشان‌های برچسب‌دار */}
                <div className="mt-3 flex flex-wrap items-center gap-2 lg:contents lg:mt-0">
                  <div className="lg:col-span-2">
                    <span className="rounded-field bg-line/[.08] px-2 py-1 text-xs text-ink">
                      {roleLabels[u.primaryRole] || u.primaryRole}
                    </span>
                  </div>
                  <div className={`text-sm text-ink-2 lg:col-span-2 ${u.city ? '' : 'hidden lg:block'}`}>{u.city || '—'}</div>
                  <div className="lg:col-span-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${verificationColors[u.verificationStatus] || 'bg-gray-100 text-gray-600'}`}>
                      {verificationLabels[u.verificationStatus] || '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-ink-2 lg:col-span-1">
                    {u.isProfileComplete
                      ? <CheckCircle size={16} className="text-success" aria-hidden />
                      : <XCircle size={16} className="text-danger" aria-hidden />}
                    <span className="lg:sr-only">{u.isProfileComplete ? 'پروفایل کامل' : 'پروفایل ناقص'}</span>
                  </div>
                </div>
                {/* موبایل: دکمه‌ها با نام، در ردیفِ زیرِ مشخصات (RowAction) */}
                <div className={ROW_ACTIONS_CLASS}>
                  {/* پیش‌تر این دکمه به پروفایل عمومی می‌رفت و آن‌جا
                      جز نام چیزی نبود — ادمین هیچ راهی برای دیدن
                      مشخصات یک نفر نداشت. */}
                  <RowAction label="مشاهده مشخصات" short="مشاهده" tone="blue"
                    icon={<Eye size={15} aria-hidden />} onClick={() => setDetail(u.id)} />
                  {u.verificationStatus !== 'verified' && (
                    <RowAction label="تأیید کاربر" short="تأیید" tone="green"
                      icon={<CheckCircle size={15} aria-hidden />} onClick={() => handleVerify(u.id, 'verified')} />
                  )}
                  {u.verificationStatus !== 'rejected' && (
                    <RowAction label="رد کاربر" short="رد" tone="red"
                      icon={<XCircle size={15} aria-hidden />} onClick={() => handleVerify(u.id, 'rejected')} />
                  )}
                  {/* این دکمه `onClick` نداشت — یک آیکن تزئینی بود که
                      کلیک‌کردنش هیچ کاری نمی‌کرد. مدیریت دسترسی ادمین
                      صفحه‌ی خودش را دارد (با محافظ‌های «آخرین ادمین» و
                      «نقش خود»)، پس این‌جا فقط به همان‌جا می‌بریم و
                      شماره را برای جست‌وجو پیش‌پر می‌کنیم. */}
                  <RowAction label="مدیریت دسترسی ادمین" short="دسترسی ادمین" tone="purple"
                    icon={<Shield size={15} aria-hidden />}
                    onClick={() => router.push('/admin/access?q=' + encodeURIComponent(u.phone ?? ''))} />
                </div>
              </div>
            ))}
          </ScrollList>
        )}
      </div>

      {detail && <UserDetailDialog userId={detail} onClose={() => setDetail(null)}
        onRolesChanged={r => setUsers(us => us.map(x => x.id === detail ? { ...x, ...r } : x))} />}
    </main>
  );
}

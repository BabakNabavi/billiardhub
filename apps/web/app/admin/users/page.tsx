'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/auth.store';
import { apiFetch } from '../../../lib/http';
import { Users, Search, CheckCircle, XCircle, Eye, Shield } from 'lucide-react';

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
  /* بدونِ `_hydrated`، نخستین رندر `user` را تهی می‌بیند (استور از
     localStorage خوانده می‌شود) و ادمین را پیش از باز شدنِ صفحه به
     صفحه‌ی اصلی پرت می‌کند — یعنی رفرش یا ورود از بوکمارک کار نمی‌کرد. */
  const { user, _hydrated } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterVerification, setFilterVerification] = useState('all');

  const [err, setErr] = useState('');

  /* منبع: `/api/admin/users`.
     پیش‌تر `api.get('/user/all')` بود — مسیرِ بک‌اندِ NestJS که حذف
     شده و در Next وجود ندارد. نتیجه‌اش ۴۰۴ بود که در `.catch` بلعیده
     می‌شد و صفحه فهرستِ خالی نشان می‌داد، در حالی که کارتِ داشبورد
     همان لحظه ۲۱ کاربر می‌شمرد. */
  useEffect(() => {
    if (!_hydrated) return;
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
  }, [_hydrated, user, router]);

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
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users size={24} className="text-blue-600" />
          مدیریت کاربران
        </h1>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
          {filtered.length.toLocaleString('fa-IR')} کاربر
        </span>
      </div>

      {/* خطا هرگز نباید بی‌صدا بماند — همین بی‌صدایی بود که ۴۰۴ را
          ماه‌ها پنهان کرد و صفحه فقط «کاربری پیدا نشد» نشان می‌داد. */}
      {err && (
        <div className="mb-5 rounded-xl border px-4 py-3 text-sm font-bold"
          style={{ background: 'rgba(178,59,46,0.06)', borderColor: 'rgba(178,59,46,0.28)', color: '#B23B2E' }}>
          {err}
        </div>
      )}

      {/* فیلترها */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-3 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="جستجو نام یا شماره..."
              className="w-full border border-gray-200 rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="all">همه نقش‌ها</option>
            {Object.entries(roleLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select value={filterVerification} onChange={e => setFilterVerification(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="all">همه وضعیت‌ها</option>
            <option value="unverified">تأیید نشده</option>
            <option value="pending">در انتظار</option>
            <option value="verified">تأیید شده</option>
            <option value="rejected">رد شده</option>
          </select>
        </div>
      </div>

      {/* جدول */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 text-xs text-gray-500 font-medium border-b">
          <div className="col-span-3">کاربر</div>
          <div className="col-span-2">نقش</div>
          <div className="col-span-2">شهر</div>
          <div className="col-span-2">وضعیت تأیید</div>
          <div className="col-span-1">پروفایل</div>
          <div className="col-span-2 text-center">عملیات</div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">کاربری پیدا نشد</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(u => (
              <div key={u.id} className="grid grid-cols-12 items-center px-5 py-3 hover:bg-gray-50">
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                    {u.firstName?.[0]}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-800">{u.firstName} {u.lastName}</div>
                    <div className="text-xs text-gray-400">{u.phone}</div>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">
                    {roleLabels[u.primaryRole] || u.primaryRole}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-gray-500">{u.city || '—'}</div>
                <div className="col-span-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${verificationColors[u.verificationStatus] || 'bg-gray-100 text-gray-600'}`}>
                    {verificationLabels[u.verificationStatus] || '—'}
                  </span>
                </div>
                <div className="col-span-1">
                  {u.isProfileComplete ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <XCircle size={16} className="text-red-400" />
                  )}
                </div>
                <div className="col-span-2 flex items-center justify-center gap-1">
                  <button onClick={() => router.push(`/users/${u.id}`)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="مشاهده">
                    <Eye size={15} />
                  </button>
                  {u.verificationStatus !== 'verified' && (
                    <button onClick={() => handleVerify(u.id, 'verified')}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="تأیید">
                      <CheckCircle size={15} />
                    </button>
                  )}
                  {u.verificationStatus !== 'rejected' && (
                    <button onClick={() => handleVerify(u.id, 'rejected')}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="رد">
                      <XCircle size={15} />
                    </button>
                  )}
                  {/* این دکمه `onClick` نداشت — یک آیکنِ تزئینی بود که
                      کلیک‌کردنش هیچ کاری نمی‌کرد. مدیریتِ دسترسیِ ادمین
                      صفحه‌ی خودش را دارد (با محافظ‌های «آخرین ادمین» و
                      «نقشِ خود»)، پس این‌جا فقط به همان‌جا می‌بریم و
                      شماره را برای جست‌وجو پیش‌پر می‌کنیم. */}
                  <button onClick={() => router.push('/admin/access?q=' + encodeURIComponent(u.phone ?? ''))}
                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="مدیریت دسترسی ادمین">
                    <Shield size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
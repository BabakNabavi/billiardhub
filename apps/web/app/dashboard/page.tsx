'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';

interface Booking {
  id: string;
  tableType: string;
  tableNumber: number;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  club: {
    name: string;
    city: string;
  };
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'در انتظار تأیید', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'تأیید شده', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'در حال استفاده', color: 'bg-green-100 text-green-700' },
  completed: { label: 'تکمیل شده', color: 'bg-gray-100 text-gray-700' },
  cancelled: { label: 'لغو شده', color: 'bg-red-100 text-red-700' },
};

const tableTypeLabels: Record<string, string> = {
  snooker: 'اسنوکر',
  pocket: 'پاکت بیلیارد',
  highball: 'هی‌بال',
  vip_snooker: 'VIP اسنوکر',
  vip_pocket: 'VIP پاکت',
};

function toPersianDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr));
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');

  useEffect(() => {
    if (!user) return
    api.get('/bookings/my-bookings').then((res) => {
      setBookings(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const upcomingBookings = bookings.filter(b => 
    ['pending', 'confirmed'].includes(b.status)
  );
  const pastBookings = bookings.filter(b => 
    ['completed', 'cancelled'].includes(b.status)
  );

  return (
    <div className="max-w-4xl mx-auto pb-10">
      
      {/* هدر پروفایل */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.firstName?.[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <div className="flex gap-2 mt-1">
                {user.roles.map((role) => (
                  <span key={role} className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            خروج
          </button>
        </div>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow text-center">
          <div className="text-3xl font-bold text-green-700">{bookings.length}</div>
          <div className="text-sm text-gray-500 mt-1">کل رزروها</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow text-center">
          <div className="text-3xl font-bold text-blue-600">{upcomingBookings.length}</div>
          <div className="text-sm text-gray-500 mt-1">رزروهای آینده</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow text-center">
          <div className="text-3xl font-bold text-gray-600">{pastBookings.length}</div>
          <div className="text-sm text-gray-500 mt-1">رزروهای گذشته</div>
        </div>
      </div>

      {/* تب‌ها */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'bookings' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}
          >
            رزروهای من
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'profile' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}
          >
            پروفایل
          </button>
          {user.roles.includes('club_owner') && (
            <button
              onClick={() => router.push('/dashboard/club')}
              className="flex-1 py-3 text-sm font-medium text-gray-500 hover:text-green-700"
            >
              مدیریت باشگاه
            </button>
          )}
        </div>

        <div className="p-6">
          {activeTab === 'bookings' && (
            <div>
              {loading ? (
                <div className="text-center py-10 text-gray-500">در حال بارگذاری...</div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">📅</div>
                  <p className="text-gray-500 mb-4">هنوز رزروی نداری</p>
                  <Link href="/clubs" className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800">
                    یافتن باشگاه
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="border rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-gray-800">{booking.club?.name}</h3>
                          <p className="text-sm text-gray-500">{booking.club?.city}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${statusLabels[booking.status]?.color}`}>
                          {statusLabels[booking.status]?.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>🎱 {tableTypeLabels[booking.tableType]} — میز {booking.tableNumber}</div>
                        <div>📅 {toPersianDate(booking.startTime)}</div>
                        {booking.totalPrice > 0 && (
                          <div>💰 {booking.totalPrice.toLocaleString('fa-IR')} تومان</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">نام</label>
                  <div className="border rounded-lg px-3 py-2 bg-gray-50">{user.firstName}</div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">نام خانوادگی</label>
                  <div className="border rounded-lg px-3 py-2 bg-gray-50">{user.lastName}</div>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">ایمیل</label>
                <div className="border rounded-lg px-3 py-2 bg-gray-50">{user.email}</div>
              </div>
              <div className="pt-4">
                <Link
                  href="/clubs/new"
                  className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 text-sm"
                >
                  + ثبت باشگاه جدید
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
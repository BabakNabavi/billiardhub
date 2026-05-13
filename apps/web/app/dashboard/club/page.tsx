'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';

interface Club {
  id: string;
  name: string;
  city: string;
  isActive: boolean;
}

interface Booking {
  id: string;
  tableType: string;
  tableNumber: number;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  user: {
    firstName: string;
    lastName: string;
    phone: string;
  };
}

interface Table {
  id: string;
  number: number;
  name: string;
  type: string;
  brand: string;
  model: string;
  pricePerHour: number;
  isActive: boolean;
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

export default function ClubDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(true);

  // فرم میز جدید
  const [showTableForm, setShowTableForm] = useState(false);
  const [tableForm, setTableForm] = useState({
    number: '',
    name: '',
    type: 'snooker',
    brand: '',
    model: '',
    pricePerHour: '',
  });
  const [tableLoading, setTableLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get('/clubs/my-clubs').then((res) => {
      setClubs(res.data);
      if (res.data.length > 0) {
        setSelectedClub(res.data[0]);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!selectedClub) return;
    Promise.all([
      api.get(`/bookings/club/${selectedClub.id}`),
      api.get(`/clubs/${selectedClub.id}/tables`),
    ]).then(([bookingsRes, tablesRes]) => {
      setBookings(bookingsRes.data);
      setTables(tablesRes.data);
    });
  }, [selectedClub]);

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      await api.put(`/bookings/${id}/status`, { status });
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
    } catch (err) {
      console.error(err);
    }
  };

  const addTable = async () => {
    if (!selectedClub) return;
    setTableLoading(true);
    try {
      const res = await api.post(`/clubs/${selectedClub.id}/tables`, {
        ...tableForm,
        number: parseInt(tableForm.number),
        pricePerHour: parseFloat(tableForm.pricePerHour) || 0,
      });
      setTables([...tables, res.data]);
      setShowTableForm(false);
      setTableForm({ number: '', name: '', type: 'snooker', brand: '', model: '', pricePerHour: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setTableLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20">در حال بارگذاری...</div>;

  if (clubs.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <div className="bg-white p-8 rounded-xl shadow">
          <div className="text-5xl mb-4">🏢</div>
          <h2 className="text-xl font-bold mb-4">هنوز باشگاهی ثبت نکردی</h2>
          <Link href="/clubs/new" className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800">
            ثبت باشگاه جدید
          </Link>
        </div>
      </div>
    );
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending');

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-800">داشبورد مدیریت باشگاه</h1>
        <Link href="/clubs/new" className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800">
          + باشگاه جدید
        </Link>
      </div>

      {/* انتخاب باشگاه */}
      {clubs.length > 1 && (
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <div className="flex gap-3 flex-wrap">
            {clubs.map((club) => (
              <button
                key={club.id}
                onClick={() => setSelectedClub(club)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedClub?.id === club.id
                    ? 'bg-green-700 text-white'
                    : 'border border-green-300 text-green-700'
                }`}
              >
                {club.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedClub && (
        <>
          {/* آمار */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow text-center">
              <div className="text-3xl font-bold text-yellow-600">{pendingBookings.length}</div>
              <div className="text-sm text-gray-500 mt-1">در انتظار تأیید</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow text-center">
              <div className="text-3xl font-bold text-green-700">{bookings.length}</div>
              <div className="text-sm text-gray-500 mt-1">کل رزروها</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow text-center">
              <div className="text-3xl font-bold text-blue-600">{tables.length}</div>
              <div className="text-sm text-gray-500 mt-1">میزها</div>
            </div>
          </div>

          {/* تب‌ها */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'bookings' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}
              >
                رزروها {pendingBookings.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full mr-1">
                    {pendingBookings.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('tables')}
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'tables' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}
              >
                مدیریت میزها
              </button>
              <button
                onClick={() => router.push(`/clubs/${selectedClub.id}`)}
                className="flex-1 py-3 text-sm font-medium text-gray-500 hover:text-green-700"
              >
                مشاهده پروفایل
              </button>
            </div>

            <div className="p-6">
              {/* رزروها */}
              {activeTab === 'bookings' && (
                <div className="space-y-4">
                  {bookings.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">رزروی وجود ندارد</div>
                  ) : (
                    bookings.map((booking) => (
                      <div key={booking.id} className="border rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold">
                              {booking.user?.firstName} {booking.user?.lastName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {tableTypeLabels[booking.tableType]} — میز {booking.tableNumber}
                            </p>
                            <p className="text-sm text-gray-500">
                              {toPersianDate(booking.startTime)} تا {toPersianDate(booking.endTime)}
                            </p>
                            {booking.totalPrice > 0 && (
                              <p className="text-sm text-green-700 font-medium">
                                {booking.totalPrice.toLocaleString('fa-IR')} تومان
                              </p>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusLabels[booking.status]?.color}`}>
                            {statusLabels[booking.status]?.label}
                          </span>
                        </div>

                        {booking.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              className="flex-1 bg-green-700 text-white py-2 rounded-lg text-sm hover:bg-green-800"
                            >
                              ✅ تأیید
                            </button>
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600"
                            >
                              ❌ رد
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* مدیریت میزها */}
              {activeTab === 'tables' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-700">میزهای باشگاه</h3>
                    <button
                      onClick={() => setShowTableForm(!showTableForm)}
                      className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800"
                    >
                      + میز جدید
                    </button>
                  </div>

                  {showTableForm && (
                    <div className="border rounded-xl p-4 mb-4 bg-green-50">
                      <h4 className="font-bold mb-3 text-green-700">افزودن میز جدید</h4>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">شماره میز</label>
                          <input type="number" value={tableForm.number}
                            onChange={(e) => setTableForm({...tableForm, number: e.target.value})}
                            className="w-full border rounded px-3 py-2 text-sm" placeholder="1" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">نام میز</label>
                          <input type="text" value={tableForm.name}
                            onChange={(e) => setTableForm({...tableForm, name: e.target.value})}
                            className="w-full border rounded px-3 py-2 text-sm" placeholder="میز M1 Gold" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">نوع</label>
                          <select value={tableForm.type}
                            onChange={(e) => setTableForm({...tableForm, type: e.target.value})}
                            className="w-full border rounded px-3 py-2 text-sm">
                            <option value="snooker">اسنوکر</option>
                            <option value="pocket">پاکت بیلیارد</option>
                            <option value="highball">هی‌بال</option>
                            <option value="vip_snooker">VIP اسنوکر</option>
                            <option value="vip_pocket">VIP پاکت</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">قیمت هر ساعت (تومان)</label>
                          <input type="number" value={tableForm.pricePerHour}
                            onChange={(e) => setTableForm({...tableForm, pricePerHour: e.target.value})}
                            className="w-full border rounded px-3 py-2 text-sm" placeholder="50000" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">برند</label>
                          <input type="text" value={tableForm.brand}
                            onChange={(e) => setTableForm({...tableForm, brand: e.target.value})}
                            className="w-full border rounded px-3 py-2 text-sm" placeholder="Viraka" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">مدل</label>
                          <input type="text" value={tableForm.model}
                            onChange={(e) => setTableForm({...tableForm, model: e.target.value})}
                            className="w-full border rounded px-3 py-2 text-sm" placeholder="M1 Gold" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={addTable} disabled={tableLoading}
                          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800 disabled:opacity-50">
                          {tableLoading ? 'در حال ذخیره...' : 'ذخیره'}
                        </button>
                        <button onClick={() => setShowTableForm(false)}
                          className="border px-4 py-2 rounded-lg text-sm">
                          انصراف
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {tables.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">میزی ثبت نشده</div>
                    ) : (
                      tables.map((table) => (
                        <div key={table.id} className="border rounded-xl p-4 flex items-center justify-between">
                          <div>
                            <div className="font-bold">{table.name}</div>
                            <div className="text-sm text-gray-500">
                              {tableTypeLabels[table.type]} — شماره {table.number}
                            </div>
                            {(table.brand || table.model) && (
                              <div className="text-xs text-gray-400">{table.brand} {table.model}</div>
                            )}
                          </div>
                          <div className="text-left">
                            <div className="text-green-700 font-bold text-sm">
                              {table.pricePerHour > 0 ? `${table.pricePerHour.toLocaleString('fa-IR')} تومان/ساعت` : 'رایگان'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
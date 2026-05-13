'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';

interface Table {
  id: string;
  number: number;
  name: string;
  type: string;
  brand: string;
  model: string;
  pricePerHour: number;
}

interface Slot {
  hour: number;
  isBooked: boolean;
}

interface Club {
  id: string;
  name: string;
}

const tableTypeLabels: Record<string, string> = {
  snooker: 'اسنوکر',
  pocket: 'پاکت بیلیارد',
  highball: 'هی‌بال',
  vip_snooker: 'VIP اسنوکر',
  vip_pocket: 'VIP پاکت',
};

const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const persianDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

function toPersianDate(date: Date): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric', month: 'long', day: 'numeric'
  }).format(date);
}

function toGregorian(dateStr: string): string {
  return dateStr;
}

export default function BookingPage() {
  const params = useParams();
  const clubId = params.clubId as string;
  const router = useRouter();
  const { user } = useAuthStore();

  const [club, setClub] = useState<Club | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    Promise.all([
      api.get(`/clubs/${clubId}`),
      api.get(`/clubs/${clubId}/tables`),
    ]).then(([clubRes, tablesRes]) => {
      setClub(clubRes.data);
      setTables(tablesRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [clubId]);

  useEffect(() => {
    if (!selectedTable || !selectedDate) return;
    setSlotsLoading(true);
    api.get(`/bookings/slots?clubId=${clubId}&tableNumber=${selectedTable.number}&date=${selectedDate}`)
      .then((res) => {
        setSlots(res.data);
        setSelectedSlots([]);
        setSlotsLoading(false);
      }).catch(() => setSlotsLoading(false));
  }, [selectedTable, selectedDate]);

  const toggleSlot = (hour: number, isBooked: boolean) => {
    if (isBooked) return;
    setSelectedSlots((prev) =>
      prev.includes(hour) ? prev.filter((h) => h !== hour) : [...prev, hour].sort((a, b) => a - b)
    );
  };

  const totalPrice = selectedTable
    ? selectedSlots.length * selectedTable.pricePerHour
    : 0;

  const handleBooking = async () => {
    if (!selectedTable || selectedSlots.length === 0) {
      setError('لطفاً میز و ساعت را انتخاب کنید');
      return;
    }

    const sortedSlots = [...selectedSlots].sort((a, b) => a - b);
    const startHour = sortedSlots[0];
    const endHour = sortedSlots[sortedSlots.length - 1] + 1;

    const startTime = new Date(`${selectedDate}T${startHour.toString().padStart(2, '0')}:00:00Z`);
    const endTime = new Date(`${selectedDate}T${endHour.toString().padStart(2, '0')}:00:00Z`);

    setBooking(true);
    setError('');

    try {
      await api.post('/bookings', {
        clubId,
        tableType: selectedTable.type,
        tableNumber: selectedTable.number,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        totalPrice,
        currency: 'IRR',
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در رزرو');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="text-center py-20">در حال بارگذاری...</div>;

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <div className="bg-white p-8 rounded-xl shadow">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-700 mb-2">رزرو با موفقیت انجام شد</h2>
          <p className="text-gray-600 mb-6">میز شما رزرو شد. منتظر تأیید باشگاه باشید.</p>
          <button onClick={() => router.push('/clubs')}
            className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800">
            بازگشت به باشگاه‌ها
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <h1 className="text-2xl font-bold text-green-800 mb-2">
        رزرو میز
      </h1>
      {club && <p className="text-gray-500 mb-6">{club.name}</p>}

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>
      )}

      {/* انتخاب میز */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h2 className="text-lg font-bold text-green-700 mb-4">🎱 انتخاب میز</h2>

        {tables.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">این باشگاه هنوز میز ثبت نکرده</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tables.map((table) => (
              <div
                key={table.id}
                onClick={() => setSelectedTable(table)}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  selectedTable?.id === table.id
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-green-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-lg">{table.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {tableTypeLabels[table.type] || table.type}
                    </div>
                    {(table.brand || table.model) && (
                      <div className="text-sm text-gray-400 mt-1">
                        {table.brand} {table.model}
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-green-700 font-bold">
                      {table.pricePerHour > 0
                        ? `${table.pricePerHour.toLocaleString('fa-IR')} تومان`
                        : 'رایگان'}
                    </div>
                    <div className="text-xs text-gray-400">هر ساعت</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* انتخاب تاریخ */}
      {selectedTable && (
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="text-lg font-bold text-green-700 mb-4">📅 انتخاب تاریخ</h2>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="text-green-700 font-medium">
              {toPersianDate(new Date(selectedDate))}
            </div>
          </div>
        </div>
      )}

      {/* انتخاب ساعت */}
      {selectedTable && selectedDate && (
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="text-lg font-bold text-green-700 mb-4">🕐 انتخاب ساعت</h2>
          <div className="flex gap-3 mb-4 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 bg-green-100 border border-green-400 rounded inline-block"></span>
              آزاد
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 bg-red-100 border border-red-400 rounded inline-block"></span>
              رزرو شده
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 bg-green-600 rounded inline-block"></span>
              انتخاب شده
            </span>
          </div>

          {slotsLoading ? (
            <div className="text-center py-8 text-gray-500">در حال بارگذاری...</div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.hour}
                  onClick={() => toggleSlot(slot.hour, slot.isBooked)}
                  disabled={slot.isBooked}
                  className={`py-3 rounded-lg text-sm font-medium transition-all ${
                    slot.isBooked
                      ? 'bg-red-100 text-red-500 cursor-not-allowed border border-red-300'
                      : selectedSlots.includes(slot.hour)
                      ? 'bg-green-600 text-white border border-green-700'
                      : 'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100'
                  }`}
                >
                  {slot.hour}:00
                  {slot.isBooked && <div className="text-xs">مشغول</div>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* خلاصه رزرو */}
      {selectedSlots.length > 0 && selectedTable && (
        <div className="bg-green-50 p-6 rounded-xl border border-green-200 mb-6">
          <h2 className="text-lg font-bold text-green-700 mb-3">📋 خلاصه رزرو</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">میز:</span>
              <span className="font-medium">{selectedTable.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">تاریخ:</span>
              <span className="font-medium">{toPersianDate(new Date(selectedDate))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ساعت:</span>
              <span className="font-medium">
                {selectedSlots[0]}:00 تا {selectedSlots[selectedSlots.length - 1] + 1}:00
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">مدت:</span>
              <span className="font-medium">{selectedSlots.length} ساعت</span>
            </div>
            {totalPrice > 0 && (
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-bold text-gray-700">مبلغ کل:</span>
                <span className="font-bold text-green-700">
                  {totalPrice.toLocaleString('fa-IR')} تومان
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTable && (
        <button
          onClick={handleBooking}
          disabled={booking || selectedSlots.length === 0}
          className="w-full bg-green-700 text-white py-4 rounded-xl text-lg font-bold hover:bg-green-800 disabled:opacity-50"
        >
          {booking ? 'در حال رزرو...' : '✅ تأیید رزرو'}
        </button>
      )}
    </div>
  );
}
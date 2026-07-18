'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/auth.store';
import { Trophy, Plus, X, Save, Edit, Trash2 } from 'lucide-react';
import ProvinceCitySelect from '../../../components/ProvinceCitySelect';

interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  sport: string;
  location: string;
  province?: string;
  city: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  prize: string;
  organizer: string;
  registrationOpen: boolean;
  status: string;
}

const categories = [
  { value: 'club', label: 'باشگاهی' },
  { value: 'provincial', label: 'استانی' },
  { value: 'national', label: 'کشوری' },
  { value: 'open', label: 'آزاد' },
  { value: 'international', label: 'بین‌المللی' },
];

const sports = [
  { value: 'snooker', label: 'اسنوکر' },
  { value: 'pocket', label: 'پاکت بیلیارد' },
  { value: 'highball', label: 'هی‌بال' },
];

// شهر/استان از ProvinceCitySelect می‌آید — لیست هاردکد حذف شد (single source of truth)

const emptyForm = {
  title: '', description: '', category: 'national', sport: 'snooker',
  location: '', province: 'تهران', city: 'تهران', startDate: '', endDate: '',
  maxParticipants: 32, prize: '', organizer: '', registrationOpen: true, status: 'upcoming',
};

const sampleEvents: EventItem[] = [
  { id: '1', title: 'مسابقات قهرمانی اسنوکر ایران ۱۴۰۳', description: '...', category: 'national', sport: 'snooker', location: 'سالن المپیک', city: 'تهران', startDate: '1403-06-15', endDate: '1403-06-22', maxParticipants: 128, prize: '۵۰۰ میلیون تومان', organizer: 'فدراسیون بیلیارد', registrationOpen: true, status: 'upcoming' },
  { id: '2', title: 'لیگ پاکت بیلیارد دسته برتر', description: '...', category: 'national', sport: 'pocket', location: 'باشگاه مرکزی', city: 'تهران', startDate: '1403-05-01', endDate: '1403-05-30', maxParticipants: 32, prize: '۲۰۰ میلیون تومان', organizer: 'فدراسیون بیلیارد', registrationOpen: false, status: 'ongoing' },
];

export default function AdminEventsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [events, setEvents] = useState<EventItem[]>(sampleEvents);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);

  if (!user || user.primaryRole !== 'admin') {
    router.push('/');
    return null;
  }

  const set = (name: string, value: any) => setForm(f => ({ ...f, [name]: value }));

  const handleEdit = (item: EventItem) => {
    setEditingId(item.id);
    setForm({ ...item, province: item.province ?? '' });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('حذف شود؟')) return;
    setEvents(events.filter(e => e.id !== id));
  };

  const handleSave = () => {
    if (!form.title || !form.startDate) return;
    if (editingId) {
      setEvents(events.map(e => e.id === editingId ? { ...e, ...form } : e));
    } else {
      setEvents([{ id: Date.now().toString(), ...form }, ...events]);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const statusColors: Record<string, string> = {
    upcoming: 'bg-blue-100 text-blue-700',
    ongoing: 'bg-green-100 text-green-700',
    finished: 'bg-gray-100 text-gray-600',
  };

  const statusLabels: Record<string, string> = {
    upcoming: 'آینده',
    ongoing: 'در حال برگزاری',
    finished: 'پایان یافته',
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Trophy size={24} className="text-amber-500" />
          مدیریت مسابقات
        </h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-800 flex items-center gap-2">
          <Plus size={16} />
          مسابقه جدید
        </button>
      </div>

      {/* فرم */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-2 border-green-200">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-800">{editingId ? 'ویرایش مسابقه' : 'مسابقه جدید'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">عنوان مسابقه *</label>
              <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="مثال: مسابقات قهرمانی اسنوکر ایران" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3} placeholder="توضیحات مسابقه..." />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رشته</label>
                <select value={form.sport} onChange={e => set('sport', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500">
                  {sports.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">دسته</label>
                <select value={form.category} onChange={e => set('category', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500">
                  {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">وضعیت</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="upcoming">آینده</option>
                  <option value="ongoing">در حال برگزاری</option>
                  <option value="finished">پایان یافته</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">محل برگزاری</label>
                <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="مثال: سالن المپیک" />
              </div>
              <div className="sm:col-span-2">
                <ProvinceCitySelect
                  value={{ province: form.province || '', city: form.city }}
                  onChange={v => setForm(f => ({ ...f, province: v.province, city: v.city }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ شروع</label>
                <input type="text" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="۱۴۰۳/۰۶/۱۵" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ پایان</label>
                <input type="text" value={form.endDate} onChange={e => set('endDate', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="۱۴۰۳/۰۶/۲۲" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">حداکثر شرکت‌کننده</label>
                <input type="number" value={form.maxParticipants} onChange={e => set('maxParticipants', parseInt(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">جایزه</label>
                <input type="text" value={form.prize} onChange={e => set('prize', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="مثال: ۵۰۰ میلیون تومان" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">برگزارکننده</label>
                <input type="text" value={form.organizer} onChange={e => set('organizer', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="مثال: فدراسیون بیلیارد ایران" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.registrationOpen}
                  onChange={e => set('registrationOpen', e.target.checked)}
                  className="accent-green-600 w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">ثبت‌نام باز است</span>
              </label>
              <button onClick={handleSave}
                className="bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-800 flex items-center gap-2">
                <Save size={16} />
                {editingId ? 'ذخیره تغییرات' : 'ثبت مسابقه'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* لیست مسابقات */}
      <div className="space-y-3">
        {events.map(event => (
          <div key={event.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-green-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[event.status]}`}>
                    {statusLabels[event.status]}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {categories.find(c => c.value === event.category)?.label}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {sports.find(s => s.value === event.sport)?.label}
                  </span>
                  {event.registrationOpen && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">ثبت‌نام باز</span>
                  )}
                </div>
                <h3 className="font-bold text-gray-800 mb-1">{event.title}</h3>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>📍 {event.location}، {event.city}</span>
                  <span>📅 {event.startDate} تا {event.endDate}</span>
                  <span>👥 حداکثر {event.maxParticipants.toLocaleString('fa-IR')} نفر</span>
                  <span className="text-amber-600">🏆 {event.prize}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => handleEdit(event)}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDelete(event.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
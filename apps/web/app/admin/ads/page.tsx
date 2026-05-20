
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/auth.store';
import { Megaphone, Plus, X, Save, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  placement: string;
  advertiser: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  clicks: number;
  views: number;
}

const placements = [
  { value: 'hero', label: 'اسلایدر صفحه اصلی' },
  { value: 'shop_banner', label: 'بنر فروشگاه' },
  { value: 'shop_special', label: 'پیشنهاد ویژه فروشگاه' },
  { value: 'news_sidebar', label: 'کنار اخبار' },
  { value: 'events_banner', label: 'بنر مسابقات' },
  { value: 'club_banner', label: 'بنر باشگاه‌ها' },
];

const sampleAds: Ad[] = [
  { id: '1', title: 'میز اسنوکر ویراکا', description: 'بهترین میزهای اسنوکر ایران', imageUrl: '', linkUrl: '/shop/1', placement: 'hero', advertiser: 'شرکت ویراکا', startDate: '۱۴۰۳/۰۳/۰۱', endDate: '۱۴۰۳/۰۶/۰۱', isActive: true, clicks: 245, views: 3200 },
  { id: '2', title: 'چوب Predator', description: 'نمایندگی رسمی Predator در ایران', imageUrl: '', linkUrl: '/shop/2', placement: 'shop_banner', advertiser: 'فروشگاه بیلیارد مرکزی', startDate: '۱۴۰۳/۰۲/۰۱', endDate: '۱۴۰۳/۰۵/۰۱', isActive: false, clicks: 120, views: 1800 },
];

const emptyForm = {
  title: '', description: '', imageUrl: '', linkUrl: '',
  placement: 'hero', advertiser: '', startDate: '', endDate: '', isActive: true,
};

export default function AdminAdsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [checked, setChecked] = useState(false);
  const [ads, setAds] = useState<Ad[]>(sampleAds);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterPlacement, setFilterPlacement] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => setChecked(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (!user) { router.push('/login'); return; }
    if (user.primaryRole !== 'admin') { router.push('/'); return; }
  }, [checked, user]);

  if (!checked) return <div className="text-center py-20 text-gray-400">در حال بارگذاری...</div>;
  if (!user || user.primaryRole !== 'admin') return null;

  const set = (name: string, value: any) => setForm(f => ({ ...f, [name]: value }));

  const handleEdit = (ad: Ad) => {
    setEditingId(ad.id);
    setForm({ title: ad.title, description: ad.description, imageUrl: ad.imageUrl, linkUrl: ad.linkUrl, placement: ad.placement, advertiser: ad.advertiser, startDate: ad.startDate, endDate: ad.endDate, isActive: ad.isActive });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('حذف شود؟')) return;
    setAds(ads.filter(a => a.id !== id));
  };

  const handleToggle = (id: string) => {
    setAds(ads.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  const handleSave = () => {
    if (!form.title || !form.advertiser) return;
    if (editingId) {
      setAds(ads.map(a => a.id === editingId ? { ...a, ...form } : a));
    } else {
      setAds([{ id: Date.now().toString(), ...form, clicks: 0, views: 0 }, ...ads]);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const filtered = filterPlacement === 'all' ? ads : ads.filter(a => a.placement === filterPlacement);

  const stats = {
    total: ads.length,
    active: ads.filter(a => a.isActive).length,
    totalViews: ads.reduce((sum, a) => sum + a.views, 0),
    totalClicks: ads.reduce((sum, a) => sum + a.clicks, 0),
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Megaphone size={24} className="text-orange-500" />
          مدیریت تبلیغات
        </h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-800 flex items-center gap-2">
          <Plus size={16} />
          تبلیغ جدید
        </button>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'کل تبلیغات', value: stats.total.toLocaleString('fa-IR'), color: 'text-gray-800', bg: 'bg-white' },
          { label: 'فعال', value: stats.active.toLocaleString('fa-IR'), color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'کل بازدید', value: stats.totalViews.toLocaleString('fa-IR'), color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'کل کلیک', value: stats.totalClicks.toLocaleString('fa-IR'), color: 'text-orange-700', bg: 'bg-orange-50' },
        ].map((item, i) => (
          <div key={i} className={`${item.bg} rounded-2xl p-4 text-center border border-gray-100 shadow-sm`}>
            <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
            <div className="text-xs text-gray-500 mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      {/* فرم */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-2 border-orange-200">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-800">{editingId ? 'ویرایش تبلیغ' : 'تبلیغ جدید'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان تبلیغ *</label>
                <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="مثال: میز اسنوکر ویراکا" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تبلیغ‌دهنده *</label>
                <input type="text" value={form.advertiser} onChange={e => set('advertiser', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="نام شرکت یا فروشگاه" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
              <input type="text" value={form.description} onChange={e => set('description', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="توضیح کوتاه تبلیغ" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">آدرس عکس بنر</label>
                <input type="text" value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">لینک مقصد</label>
                <input type="text" value={form.linkUrl} onChange={e => set('linkUrl', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="/shop/1 یا https://..." />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">محل نمایش</label>
              <select value={form.placement} onChange={e => set('placement', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500">
                {placements.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ شروع</label>
                <input type="text" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="۱۴۰۳/۰۳/۰۱" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ پایان</label>
                <input type="text" value={form.endDate} onChange={e => set('endDate', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="۱۴۰۳/۰۶/۰۱" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive}
                  onChange={e => set('isActive', e.target.checked)}
                  className="accent-green-600 w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">فعال باشد</span>
              </label>
              <button onClick={handleSave}
                className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-600 flex items-center gap-2">
                <Save size={16} />
                {editingId ? 'ذخیره تغییرات' : 'ثبت تبلیغ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* فیلتر */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button onClick={() => setFilterPlacement('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0 border transition-colors ${filterPlacement === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
          همه
        </button>
        {placements.map(p => (
          <button key={p.value} onClick={() => setFilterPlacement(p.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0 border transition-colors ${filterPlacement === p.value ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* لیست */}
      <div className="space-y-3">
        {filtered.map(ad => (
          <div key={ad.id} className={`bg-white rounded-2xl border p-5 transition-all ${ad.isActive ? 'border-gray-100 hover:border-orange-200' : 'border-gray-100 opacity-60'}`}>
            <div className="flex items-start gap-4">
              <div className="w-20 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                {ad.imageUrl ? (
                  <img src={ad.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Megaphone size={24} className="text-orange-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-800">{ad.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ad.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {ad.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
                  <span>🏢 {ad.advertiser}</span>
                  <span>📍 {placements.find(p => p.value === ad.placement)?.label}</span>
                  <span>📅 {ad.startDate} تا {ad.endDate}</span>
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="text-blue-600 font-medium">👁 {ad.views.toLocaleString('fa-IR')} بازدید</span>
                  <span className="text-orange-600 font-medium">🖱 {ad.clicks.toLocaleString('fa-IR')} کلیک</span>
                  {ad.views > 0 && (
                    <span className="text-gray-500">نرخ کلیک: {((ad.clicks / ad.views) * 100).toFixed(1)}٪</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => handleToggle(ad.id)}
                  className={`p-2 rounded-xl transition-colors ${ad.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                  {ad.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button onClick={() => handleEdit(ad)}
                  className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-colors">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDelete(ad.id)}
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
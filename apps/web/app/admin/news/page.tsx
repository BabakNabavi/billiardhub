'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/auth.store';
import { Newspaper, Plus, X, Save, Edit, Trash2 } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string;
  published: boolean;
  date: string;
}

const categories = [
  { value: 'tournament', label: 'مسابقات' },
  { value: 'ranking', label: 'رنکینگ' },
  { value: 'club', label: 'باشگاه‌ها' },
  { value: 'product', label: 'محصولات' },
  { value: 'general', label: 'عمومی' },
];

const sampleNews: NewsItem[] = [
  { id: '1', title: 'برگزاری مسابقات قهرمانی اسنوکر ایران ۱۴۰۳', summary: 'مسابقات قهرمانی...', content: '', category: 'tournament', tags: 'مسابقات,اسنوکر', published: true, date: '۱۴۰۳/۰۳/۱۵' },
  { id: '2', title: 'رنکینگ جدید بازیکنان دسته برتر', summary: 'فدراسیون...', content: '', category: 'ranking', tags: 'رنکینگ', published: true, date: '۱۴۰۳/۰۳/۱۰' },
];

const emptyForm = { title: '', summary: '', content: '', category: 'general', tags: '', published: false };

export default function AdminNewsPage() {
  const router = useRouter();
  const { user, _hydrated } = useAuthStore();
  const [news, setNews] = useState<NewsItem[]>(sampleNews);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saved, setSaved] = useState(false);

  /* گارد بعد از hydrate — وگرنه ادمین موقع رفرش بی‌دلیل bounce می‌شد */
  useEffect(() => {
    if (_hydrated && (!user || user.primaryRole !== 'admin')) router.push('/');
  }, [_hydrated, user, router]);

  if (!_hydrated) return null;
  if (!user || user.primaryRole !== 'admin') return null;

  const handleEdit = (item: NewsItem) => {
    setEditingId(item.id);
    setForm({ title: item.title, summary: item.summary, content: item.content, category: item.category, tags: item.tags, published: item.published });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('حذف شود؟')) return;
    setNews(news.filter(n => n.id !== id));
  };

  const handleSave = () => {
    if (!form.title) return;
    if (editingId) {
      setNews(news.map(n => n.id === editingId ? { ...n, ...form } : n));
    } else {
      setNews([{ id: Date.now().toString(), ...form, date: new Date().toLocaleDateString('fa-IR') }, ...news]);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Newspaper size={24} className="text-red-600" />
          مدیریت اخبار
        </h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-800 flex items-center gap-2">
          <Plus size={16} />
          خبر جدید
        </button>
      </div>

      {/* فرم */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-2 border-green-200">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-800">{editingId ? 'ویرایش خبر' : 'خبر جدید'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">عنوان خبر *</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="عنوان خبر را وارد کنید" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500">
                  {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تگ‌ها</label>
                <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="با کاما جدا کنید" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">خلاصه خبر</label>
              <textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3} placeholder="یک پاراگراف خلاصه..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">متن کامل خبر</label>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={8} placeholder="متن کامل خبر..." />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.published}
                  onChange={e => setForm({ ...form, published: e.target.checked })}
                  className="accent-green-600 w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">انتشار فوری</span>
              </label>
              <button onClick={handleSave}
                className="bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-800 flex items-center gap-2">
                <Save size={16} />
                {editingId ? 'ذخیره تغییرات' : 'انتشار خبر'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* لیست اخبار */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 text-xs text-gray-500 font-medium border-b">
          <div className="col-span-5">عنوان</div>
          <div className="col-span-2">دسته</div>
          <div className="col-span-2">تاریخ</div>
          <div className="col-span-1">وضعیت</div>
          <div className="col-span-2 text-center">عملیات</div>
        </div>
        <div className="divide-y divide-gray-50">
          {news.map(item => (
            <div key={item.id} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-gray-50">
              <div className="col-span-5">
                <div className="font-medium text-sm text-gray-800 line-clamp-1">{item.title}</div>
                <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.summary}</div>
              </div>
              <div className="col-span-2">
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">
                  {categories.find(c => c.value === item.category)?.label}
                </span>
              </div>
              <div className="col-span-2 text-xs text-gray-500">{item.date}</div>
              <div className="col-span-1">
                <span className={`text-xs px-2 py-1 rounded-full ${item.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {item.published ? 'منتشر' : 'پیش‌نویس'}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-center gap-2">
                <button onClick={() => handleEdit(item)}
                  className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                  <Edit size={15} />
                </button>
                <button onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
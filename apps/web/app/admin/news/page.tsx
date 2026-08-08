'use client';

import { useState, useEffect } from 'react';
import { ask } from '../../../lib/ui/dialogs'
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/auth.store';
import { Newspaper, Plus, X, Save, Edit, Trash2 } from 'lucide-react';
import { listContent, createContent, updateContent, deleteContent } from '../../../lib/admin/content-client';

/* شکل ردیف دیتابیس (snake_case) — جدول `news` در مهاجرت ۰۲۵ */
interface DbNews {
  id: string;
  title?: string; excerpt?: string; body?: string; category?: string;
  tags?: string[]; status?: string; published_at?: string | null; created_at?: string;
  [k: string]: unknown;
}

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


const emptyForm = { title: '', summary: '', content: '', category: 'general', tags: '', published: false };

export default function AdminNewsPage() {
  const router = useRouter();
  const { user, _hydrated, authChecked } = useAuthStore();
  /* خالی شروع می‌شود و از دیتابیس پر می‌شود. پیش‌تر دو خبر ساختگی
     («قهرمانی اسنوکر ۱۴۰۳» و «رنکینگ جدید») نشان داده می‌شد که
     هیچ‌وقت واقعی نبودند. */
  const [news, setNews] = useState<NewsItem[]>([]);
  const [err, setErr] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saved, setSaved] = useState(false);

  /* گارد بعد از hydrate — وگرنه ادمین موقع رفرش بی‌دلیل bounce می‌شد */
  useEffect(() => {
    if (_hydrated && authChecked && (!user || user.primaryRole !== 'admin')) router.push('/');
  }, [_hydrated, authChecked, user, router]);

  const refresh = async () => {
    const rows = await listContent<DbNews>('news');
    setNews(rows.map(r => ({
      id: r.id,
      title: r.title ?? '',
      summary: r.excerpt ?? '',
      content: r.body ?? '',
      category: r.category ?? 'general',
      tags: (r.tags ?? []).join('، '),
      published: r.status === 'published',
      date: r.published_at
        ? new Date(r.published_at).toLocaleDateString('fa-IR')
        : new Date(String(r.created_at ?? Date.now())).toLocaleDateString('fa-IR'),
    })));
  };

  useEffect(() => {
    if (_hydrated && user?.primaryRole === 'admin') void refresh();
  }, [_hydrated, user?.primaryRole]);

  if (!_hydrated) return null;
  if (!user || user.primaryRole !== 'admin') return null;

  const handleEdit = (item: NewsItem) => {
    setEditingId(item.id);
    setForm({ title: item.title, summary: item.summary, content: item.content, category: item.category, tags: item.tags, published: item.published });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!(await ask('این خبر حذف شود؟'))) return;
    if (await deleteContent('news', id)) setNews(rows => rows.filter(n => n.id !== id));
    else setErr('حذف انجام نشد');
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setErr('عنوان خبر الزامی است'); return; }
    setErr('');

    /* ستون‌های جدول snake_case‌اند و tags آرایه است، نه رشته‌ی جداشده با ویرگول */
    const payload = {
      title: form.title,
      excerpt: form.summary,
      body: form.content,
      category: form.category,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      status: form.published ? 'published' : 'draft',
      published_at: form.published ? new Date().toISOString() : null,
    };

    const res = editingId
      ? await updateContent<DbNews>('news', editingId, payload)
      : await createContent<DbNews>('news', payload);

    if (!res.ok) { setErr(res.message ?? 'ذخیره انجام نشد'); return; }

    await refresh();
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

      {err && (
        <div className="mb-5 rounded-xl border px-4 py-3 text-sm font-bold"
          style={{ background: 'rgba(178,59,46,0.06)', borderColor: 'rgba(178,59,46,0.28)', color: '#B23B2E' }}>
          {err}
        </div>
      )}

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
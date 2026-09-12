'use client';

import { useState, useEffect } from 'react';
import { ask } from '../../../lib/ui/dialogs'
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/auth.store';
import { Newspaper, Plus, X, Save, Edit, Trash2 } from 'lucide-react';
import { listContent, createContent, updateContent, deleteContent } from '../../../lib/admin/content-client';
import { NEWS_SECTIONS, normalizeSection, sectionLabel, EDITORIAL_TAGS } from '../../../lib/news/sections';

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
  cover: string;
  slug: string;
  /* لحظه‌ی انتشار ثبت‌شده — تا ویرایش آن را جابه‌جا نکند */
  publishedAt: string | null;
}

/* ⚠️ فهرست دسته دیگر این‌جا ساخته نمی‌شود. تا امروز این پنل
   tournament | ranking | club | product | general می‌نوشت و سایت
   عمومی دنبال snooker | pool | players | … می‌گشت — هیچ‌کدام با
   دیگری هم‌پوشانی نداشت، پس **هر خبری که این‌جا منتشر می‌شد روی
   سایت برچسب «اخبار اسنوکر» می‌خورد**. حالا هر دو یک منبع دارند. */
const categories = NEWS_SECTIONS.map(s => ({ value: s.key, label: s.label }));


const emptyForm = {
  title: '', summary: '', content: '', category: NEWS_SECTIONS[0].key as string,
  tags: '', published: false, cover: '', slug: '', publishedAt: null as string | null,
};

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
  /* ⚠️ این پایین‌تر بود، بعدِ `if (!_hydrated) return null`. یعنی
     رندرِ اول یک هوک کمتر داشت و رندرِ بعد از hydrate یکی بیشتر —
     React با #310 کلِ صفحه را می‌انداخت و «انتشار خبر» اصلا باز
     نمی‌شد. هر هوکِ تازه باید همین بالا بماند. */
  const [busyId, setBusyId] = useState<string | null>(null);

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
      /* مقدار قدیمی دیتابیس هم به بخش درست ترجمه می‌شود */
      category: normalizeSection(r.category) ?? '',
      tags: (r.tags ?? []).join('، '),
      published: r.status === 'published',
      cover: String(r.cover_url ?? ''),
      slug: String(r.slug ?? ''),
      publishedAt: (r.published_at as string | null) ?? null,
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
    setForm({
      title: item.title, summary: item.summary, content: item.content,
      /* ⚠️ مقدار نانگاشتنی (`general` یا هر مقدار ناشناخته) نباید
         با بازکردن فرم بی‌صدا «اسنوکر» شود — ویراستاری که فقط
         یک غلط املایی را درست می‌کند بخش خبر را هم عوض می‌کرد. */
      category: item.category, tags: item.tags,
      published: item.published, cover: item.cover, slug: item.slug,
      publishedAt: item.publishedAt,
    });
    setShowForm(true);
  };

  /* ── انتشار / لغو انتشار، مستقیم از فهرست ──

     ⚠️ لغو انتشار **`published_at` را پاک نمی‌کند**. نسخه‌ی اول
     `null` می‌نوشت و آن تاریخ جای دیگری نگه داشته نمی‌شود، پس برای
     همیشه از دست می‌رفت — و بدتر، انتشار دوباره‌ی همان خبر تاریخ
     امروز می‌گرفت و یک خبر سه‌ماهه دوباره صدر صفحه می‌نشست؛ دقیقا
     همان چیزی که این کد برای جلوگیری از آن نوشته شده بود.
     پرس‌وجوهای عمومی فقط روی `status` فیلتر می‌کنند، پس پاک‌کردن
     تاریخ هیچ لازم نبود. */
  const togglePublish = async (item: NewsItem) => {
    if (busyId) return;
    setBusyId(item.id);
    try {
      const next = !item.published;
      const patch: Record<string, unknown> = { status: next ? 'published' : 'draft' };
      /* تاریخ فقط بار اول نوشته می‌شود */
      if (next && !item.publishedAt) patch.published_at = new Date().toISOString();
      const res = await updateContent<DbNews>('news', item.id, patch);
      if (!res.ok) { setErr(res.message ?? 'تغییر وضعیت انجام نشد'); return; }
      setErr('');
      await refresh();
    } finally { setBusyId(null); }
  };

  const handleDelete = async (id: string) => {
    if (!(await ask('این خبر حذف شود؟'))) return;
    if (await deleteContent('news', id)) setNews(rows => rows.filter(n => n.id !== id));
    else setErr('حذف انجام نشد');
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setErr('عنوان خبر الزامی است'); return; }
    setErr('');

    /* ⚠️ جداکننده‌ی برچسب هم «,» و هم «،» است: این فیلد به فارسی پر
       می‌شود و ویرگول فارسی تا امروز جداکننده حساب نمی‌شد، پس
       «فوری، اسنوکر» یک برچسب به‌هم‌چسبیده می‌ساخت. */
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      excerpt: form.summary.trim(),
      body: form.content,
      category: form.category,
      cover_url: form.cover.trim(),
      tags: form.tags.split(/[,،]/).map(t => t.trim()).filter(Boolean),
      status: form.published ? 'published' : 'draft',
    };
    /* ⚠️ لحظه‌ی انتشار فقط یک‌بار ثبت می‌شود و هرگز پاک نمی‌شود:
       ویرایش یک خبر منتشرشده نباید آن را روی «الان» ببرد (خبر
       سه‌ماهه دوباره صدر صفحه می‌نشست)، و ذخیره‌ی پیش‌نویس نباید
       تاریخ اصلی انتشار را نابود کند. */
    if (form.published && !form.publishedAt) {
      payload.published_at = new Date().toISOString();
    }
    /* نامک خالی نباید روی ستون یکتا بنشیند: دومین خبر بی‌نامک با
       خطای «تکراری» رد می‌شد. */
    if (form.slug.trim()) payload.slug = form.slug.trim();

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
                  <option value="">بدون بخش</option>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="news-cover" className="block text-sm font-medium text-gray-700 mb-1">نشانی تصویر کاور</label>
                <input id="news-cover" type="url" dir="ltr" value={form.cover} onChange={e => setForm({ ...form, cover: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-start focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://…" />
                <p className="mt-1 text-xs text-gray-400">بدون تصویر، خبر به‌شکل متنی نمایش داده می‌شود.</p>
              </div>
              <div>
                <label htmlFor="news-slug" className="block text-sm font-medium text-gray-700 mb-1">نامک (slug)</label>
                <input id="news-slug" type="text" dir="ltr" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-start focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="asia-championship-final" />
                <p className="mt-1 text-xs text-gray-400">خالی بگذارید تا نشانی از شناسه ساخته شود.</p>
              </div>
            </div>

            {/* ⚠️ نوار «فوری» و بلوک «گزارش ویژه» در سایت با همین
                برچسب‌ها روشن می‌شوند. جدول ستونی برایشان ندارد و
                ستون خیالی هم ساخته نشد. */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نشان‌های تحریریه</label>
              <div className="flex flex-wrap gap-3">
                {EDITORIAL_TAGS.map(t => {
                  const list = form.tags.split(/[,،]/).map(x => x.trim()).filter(Boolean);
                  const on = list.includes(t);
                  return (
                    <label key={t} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={on} className="accent-green-600 w-4 h-4"
                        onChange={e => {
                          const next = e.target.checked ? [...list, t] : list.filter(x => x !== t);
                          setForm({ ...form, tags: next.join('، ') });
                        }} />
                      <span className="font-medium text-gray-700">{t}</span>
                    </label>
                  );
                })}
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
                <span className="text-sm font-medium text-gray-700">
                  انتشار روی سایت
                  <span className="block text-xs font-normal text-gray-400">
                    تا وقتی این تیک نخورده باشد، خبر پیش‌نویس می‌ماند و در /news دیده نمی‌شود.
                  </span>
                </span>
              </label>
              <button onClick={handleSave}
                className="bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-800 flex items-center gap-2">
                <Save size={16} />
                {/* ⚠️ برچسب باید همان کاری را بگوید که می‌کند: این
                    دکمه فقط وقتی منتشر می‌کند که تیک «انتشار» خورده
                    باشد. برچسب «انتشار خبر» روی حالت پیش‌نویس،
                    ادمین را مطمئن می‌کرد خبر منتشر شده — و بعد آن را
                    در سایت نمی‌دید. */}
                {form.published ? (editingId ? 'ذخیره و انتشار' : 'انتشار خبر') : 'ذخیره پیش‌نویس'}
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
          {/* ⚠️ بدون این، فهرست خالی و شکست خواندن یک شکل داشتند:
              فقط سطر عنوان‌ها دیده می‌شد. */}
          {news.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-gray-400">
              هنوز خبری ثبت نشده است.
            </div>
          )}
          {news.map(item => (
            <div key={item.id} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-gray-50">
              <div className="col-span-5">
                <div className="font-medium text-sm text-gray-800 line-clamp-1">{item.title}</div>
                <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.summary}</div>
              </div>
              <div className="col-span-2">
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">
                  {sectionLabel(item.category)}
                </span>
              </div>
              <div className="col-span-2 text-xs text-gray-500">{item.date}</div>
              <div className="col-span-1">
                <span className={`text-xs px-2 py-1 rounded-full ${item.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {item.published ? 'منتشر' : 'پیش‌نویس'}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-center gap-2">
                <button onClick={() => void togglePublish(item)}
                  disabled={busyId === item.id}
                  title={item.published ? 'بازگرداندن به پیش‌نویس' : 'انتشار روی سایت'}
                  className={`rounded-lg px-2 py-1 text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${item.published
                    ? 'text-gray-500 hover:bg-gray-100'
                    : 'bg-green-700 text-white hover:bg-green-800'}`}>
                  {busyId === item.id ? '…' : item.published ? 'لغو انتشار' : 'انتشار'}
                </button>
                <button onClick={() => handleEdit(item)} aria-label={`ویرایش ${item.title}`}
                  className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                  <Edit size={15} />
                </button>
                <button onClick={() => handleDelete(item.id)} aria-label={`حذف ${item.title}`}
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
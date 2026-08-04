'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/auth.store';
import api from '../../../lib/api';
import { apiFetch } from '../../../lib/http';
import { ShoppingBag, Search, CheckCircle, XCircle, Eye, Trash2, Ban, PauseCircle, PlayCircle } from 'lucide-react';
import { categoryLabel, MARKET_CATEGORIES, STATUS_LABEL, type ListingStatus } from '../../../lib/market/categories';

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  city: string;
  isVerified: boolean;
  requestedVerification: boolean;
  /* وضعیتِ چرخه‌ی عمر — جدا از «تیکِ تأیید». تیک یعنی «فروشنده معتبر
     است»؛ وضعیت یعنی «آگهی منتشر شده یا نه». این دو تا امروز در پنل
     قاطی بودند و ادمین راهی برای رد کردنِ آگهی نداشت. */
  status: string;
  adminNote: string | null;
  images: string[];
  seller: {
    firstName: string;
    lastName: string;
    primaryRole: string;
  };
  createdAt: string;
}

/* برچسبِ دسته از منبعِ واحد می‌آید (lib/market/categories).
   فهرستِ دستیِ قبلی هفت دسته داشت در حالی که بازار پانزده‌تا دارد —
   یعنی هشت دسته در پنل با کلیدِ خامِ انگلیسی دیده می‌شدند. */

/* رنگِ نشانِ هر وضعیت. «رد شده» و «منقضی» عمداً هم‌رنگ نیستند: یکی
   تصمیمِ ادمین است و دیگری گذشتِ زمان. */
const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  paused:   'bg-orange-100 text-orange-700',
  sold:     'bg-blue-100 text-blue-700',
  expired:  'bg-gray-200 text-gray-600',
};

export default function AdminProductsPage() {
  const router = useRouter();
  /* بدونِ `_hydrated`، نخستین رندر `user` را تهی می‌بیند (استور از
     localStorage خوانده می‌شود) و ادمین را پیش از باز شدنِ صفحه به
     صفحه‌ی اصلی پرت می‌کند — یعنی رفرش یا ورود از بوکمارک کار نمی‌کرد. */
  const { user, _hydrated } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterVerification, setFilterVerification] = useState('all');

  useEffect(() => {
    if (!_hydrated) return;
    if (!user || user.primaryRole !== 'admin') { router.push('/'); return; }
    /* پاسخِ /api/products یک شیء است: { products, total, page, ... }
       نه آرایه. پیش‌تر همان شیء در state می‌نشست و اولین `.filter`
       صفحه را می‌شکست — یعنی «تأیید محصولات» هرگز چیزی نشان نمی‌داد. */
    /* `all=1` ⇒ همه‌ی وضعیت‌ها، نه فقط فعال‌ها. بدونِ آن، آگهیِ
       متوقف، فروخته‌شده یا ردشده در پنل اصلاً دیده نمی‌شد و ادمین
       نمی‌توانست مدیریتش کند. سرور خودش ادمین‌بودن را بررسی می‌کند. */
    api.get('/products?limit=200&all=1').then(res => {
      const list = Array.isArray(res.data) ? res.data : (res.data?.products ?? []);
      setProducts(list);
      setErr('');
    }).catch(() => setErr('خواندن محصولات انجام نشد'))
      .finally(() => setLoading(false));
  }, [_hydrated, user]);

  const handleVerify = async (productId: string, verified: boolean) => {
    setErr('');
    try {
      await api.put(`/products/${productId}`, { isVerified: verified });
      setProducts(ps => ps.map(p => p.id === productId ? { ...p, isVerified: verified, requestedVerification: verified ? false : p.requestedVerification } : p));
    } catch (e: any) {
      /* پیش‌تر خطا فقط در کنسول می‌نشست و ردیف در رابط سبز می‌شد؛
         ادمین باور می‌کرد تأیید انجام شده. */
      setErr(e?.response?.data?.error ?? 'تغییر وضعیت محصول انجام نشد');
    }
  };

  /* کلیدِ بازبینی — از تنظیماتِ سرور، نه از حافظه‌ی مرورگر */
  const [approvalOn, setApprovalOn] = useState(false);
  const [savingSetting, setSavingSetting] = useState(false);

  useEffect(() => {
    if (!_hydrated || !user || user.primaryRole !== 'admin') return;
    void apiFetch('/api/admin/settings', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => setApprovalOn(!!j?.settings?.market_approval_required))
      .catch(() => { });
  }, [_hydrated, user]);

  const toggleApproval = async () => {
    setSavingSetting(true); setErr('');
    try {
      const next = !approvalOn;
      const r = await apiFetch('/api/admin/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market_approval_required: next }),
      });
      if (!r.ok) { setErr('تغییر تنظیمات انجام نشد'); return; }
      setApprovalOn(next);
    } catch { setErr('خطا در ارتباط با سرور'); } finally { setSavingSetting(false); }
  };

  /* ── بازبینیِ آگهی ──
     جدا از «تیکِ تأیید»: تیک یعنی فروشنده معتبر است، وضعیت یعنی آگهی
     منتشر شده یا نه. تا امروز فقط تیک بود، پس ادمین راهی برای رد
     کردنِ آگهی نداشت جز حذفِ کامل — که برگشت‌ناپذیر است و فروشنده هم
     هرگز نمی‌فهمید چرا. */
  const setStatus = async (productId: string, next: ListingStatus) => {
    setErr('');
    let note: string | null = null;
    if (next === 'rejected') {
      /* دلیل اجباری است: رد کردنِ بی‌دلیل یعنی فروشنده همان آگهی را
         دوباره می‌فرستد و هر دو طرف وقت تلف می‌کنند. */
      const answer = window.prompt('دلیل رد کردن (به فروشنده نشان داده می‌شود):');
      if (answer === null) return;
      if (!answer.trim()) { setErr('برای رد کردن، دلیل بنویسید'); return; }
      note = answer.trim();
    }
    try {
      await api.put(`/products/${productId}`, { status: next, ...(note ? { adminNote: note } : {}) });
      setProducts(ps => ps.map(p => p.id === productId
        ? { ...p, status: next, adminNote: note ?? p.adminNote }
        : p));
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? 'تغییر وضعیت آگهی انجام نشد');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('آیا مطمئنی؟')) return;
    setErr('');
    try {
      await api.delete(`/products/${productId}`);
      setProducts(ps => ps.filter(p => p.id !== productId));
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? 'حذف محصول انجام نشد');
    }
  };

  const filtered = products.filter(p => {
    if (search && !p.title.includes(search)) return false;
    if (filterCategory !== 'all' && p.category !== filterCategory) return false;
    /* فیلترهای وضعیتِ چرخه‌ی عمر — جدا از تیکِ تأیید */
    if (['active', 'pending', 'rejected', 'paused', 'sold', 'expired'].includes(filterVerification)) {
      return p.status === filterVerification;
    }
    if (filterVerification === 'verified' && !p.isVerified) return false;
    if (filterVerification === 'awaiting_badge' && (!p.requestedVerification || p.isVerified)) return false;
    if (filterVerification === 'unverified' && (p.isVerified || p.requestedVerification)) return false;
    return true;
  });

  /* دو صفِ جدا که تا امروز یکی شمرده می‌شدند:
       · آگهیِ در انتظارِ *انتشار* — تصمیمِ اصلیِ ادمین
       · درخواستِ تیکِ تأیید — که ربطی به انتشار ندارد */
  const awaitingReview = products.filter(p => p.status === 'pending').length;
  const pendingCount = products.filter(p => p.requestedVerification && !p.isVerified).length;

  if (!_hydrated) return null;
  if (!user || user.primaryRole !== 'admin') return null;

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {err && (
        <div className="mb-5 rounded-xl border px-4 py-3 text-sm font-bold"
          style={{ background: 'rgba(178,59,46,0.06)', borderColor: 'rgba(178,59,46,0.28)', color: '#B23B2E' }}>
          {err}
        </div>
      )}
      {/* ── کلیدِ بازبینی ──
          این‌جاست نه در صفحه‌ی تنظیمات، چون همان کسی که آگهی‌ها را
          بررسی می‌کند باید بتواند روشن/خاموشش کند و اثرش را همان‌جا
          ببیند. */}
      <div className="mb-5 rounded-xl border px-4 py-3 flex items-center gap-3 flex-wrap"
        style={{ background: approvalOn ? 'rgba(183,121,31,0.06)' : 'rgba(14,122,56,0.05)',
                 borderColor: approvalOn ? 'rgba(183,121,31,0.25)' : 'rgba(14,122,56,0.22)' }}>
        <button onClick={() => void toggleApproval()} disabled={savingSetting}
          className="px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors"
          style={{
            background: approvalOn ? 'rgba(183,121,31,0.12)' : 'rgba(14,122,56,0.10)',
            borderColor: approvalOn ? 'rgba(183,121,31,0.34)' : 'rgba(14,122,56,0.32)',
            color: approvalOn ? '#B7791F' : '#0E7A38',
          }}>
          {savingSetting ? '…' : approvalOn ? 'بازبینی روشن است' : 'بازبینی خاموش است'}
        </button>
        <span className="text-xs leading-7" style={{ color: '#5B564B' }}>
          {approvalOn
            ? 'هر آگهی تازه تا تأیید شما منتشر نمی‌شود.'
            : 'آگهی‌ها بی‌درنگ منتشر می‌شوند و شما بعداً می‌توانید ردشان کنید.'}
        </span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingBag size={24} className="text-purple-600" />
          آگهی‌های بیلیارد بازار
        </h1>
        <div className="flex items-center gap-3">
          {/* صفِ انتشار — مهم‌ترین عدد این صفحه وقتی بازبینی روشن است */}
          {awaitingReview > 0 && (
            <button onClick={() => setFilterVerification('pending')}
              className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold hover:bg-yellow-200 transition-colors">
              {awaitingReview.toLocaleString('fa-IR')} در انتظار بررسی
            </button>
          )}
          {pendingCount > 0 && (
            <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm font-bold">
              {pendingCount.toLocaleString('fa-IR')} درخواست تیک
            </span>
          )}
          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
            {filtered.length.toLocaleString('fa-IR')} محصول
          </span>
        </div>
      </div>

      {/* فیلترها */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-3 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="جستجو در محصولات..."
              className="w-full border border-gray-200 rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="all">همه دسته‌ها</option>
            {MARKET_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <select value={filterVerification} onChange={e => setFilterVerification(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="all">همه وضعیت‌ها</option>
            <optgroup label="وضعیت آگهی">
              <option value="pending">در انتظار بررسی</option>
              <option value="active">فعال</option>
              <option value="rejected">رد شده</option>
              <option value="paused">متوقف</option>
              <option value="sold">فروخته شده</option>
              <option value="expired">منقضی</option>
            </optgroup>
            <optgroup label="تیک تأیید فروشنده">
              <option value="awaiting_badge">درخواست تیک</option>
              <option value="verified">تیک دارد</option>
              <option value="unverified">تیک ندارد</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* جدول */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 text-xs text-gray-500 font-medium border-b">
          <div className="col-span-4">محصول</div>
          <div className="col-span-2">دسته</div>
          <div className="col-span-2">فروشنده</div>
          <div className="col-span-2">قیمت</div>
          <div className="col-span-2 text-center">عملیات</div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">محصولی پیدا نشد</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(product => (
              <div key={product.id} className={`grid grid-cols-12 items-center px-5 py-3 hover:bg-gray-50 ${product.requestedVerification && !product.isVerified ? 'bg-yellow-50' : ''}`}>
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {product.images?.length > 0 ? (
                      <img loading="lazy" decoding="async" src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag size={20} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-800 line-clamp-1">{product.title}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {/* وضعیتِ آگهی — همیشه دیده می‌شود جز وقتی فعال است،
                          چون «فعال» حالتِ عادی است و نشان لازم ندارد. */}
                      {product.status && product.status !== 'active' && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_STYLE[product.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABEL[product.status as ListingStatus] ?? product.status}
                        </span>
                      )}
                      {product.isVerified && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <CheckCircle size={9} /> تیک تأیید
                        </span>
                      )}
                      {product.requestedVerification && !product.isVerified && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                          درخواست تیک
                        </span>
                      )}
                    </div>
                    {/* دلیلِ رد — فروشنده هم همین را می‌بیند */}
                    {product.status === 'rejected' && product.adminNote && (
                      <div className="text-xs text-red-600 mt-1 line-clamp-1" title={product.adminNote}>
                        دلیل: {product.adminNote}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">
                    {categoryLabel(product.category)}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-gray-600">
                  {product.seller?.firstName} {product.seller?.lastName}
                </div>
                <div className="col-span-2 text-sm font-medium text-green-700">
                  {product.price?.toLocaleString('fa-IR')} تومان
                </div>
                <div className="col-span-2 flex items-center justify-center gap-1">
                  <button onClick={() => router.push(`/shop/${product.id}`)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="مشاهده">
                    <Eye size={15} />
                  </button>

                  {/* ── بازبینی ──
                      «انتشار» فقط وقتی معنا دارد که آگهی منتشر نباشد؛
                      «رد کردن» فقط وقتی هنوز رد نشده. نشان‌دادنِ دکمه‌ای
                      که کاری نمی‌کند، ادمین را به شک می‌اندازد. */}
                  {product.status !== 'active' && product.status !== 'sold' && (
                    <button onClick={() => setStatus(product.id, 'active')}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="انتشار آگهی">
                      <PlayCircle size={15} />
                    </button>
                  )}
                  {product.status !== 'rejected' && (
                    <button onClick={() => setStatus(product.id, 'rejected')}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="رد کردن با دلیل">
                      <Ban size={15} />
                    </button>
                  )}
                  {product.status === 'active' && (
                    <button onClick={() => setStatus(product.id, 'paused')}
                      className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="توقف موقت">
                      <PauseCircle size={15} />
                    </button>
                  )}

                  {!product.isVerified && (
                    <button onClick={() => handleVerify(product.id, true)}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="تأیید">
                      <CheckCircle size={15} />
                    </button>
                  )}
                  {product.isVerified && (
                    <button onClick={() => handleVerify(product.id, false)}
                      className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="لغو تأیید">
                      <XCircle size={15} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(product.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                    <Trash2 size={15} />
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
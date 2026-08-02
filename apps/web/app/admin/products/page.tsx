'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/auth.store';
import api from '../../../lib/api';
import { ShoppingBag, Search, CheckCircle, XCircle, Eye, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  city: string;
  isVerified: boolean;
  requestedVerification: boolean;
  images: string[];
  seller: {
    firstName: string;
    lastName: string;
    primaryRole: string;
  };
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  table: 'میز بیلیارد',
  cue: 'چوب بیلیارد',
  ball: 'توپ',
  accessory: 'لوازم جانبی',
  clothing: 'پوشاک',
  educational: 'آموزشی',
  other: 'سایر',
};

export default function AdminProductsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterVerification, setFilterVerification] = useState('all');

  useEffect(() => {
    if (!user || user.primaryRole !== 'admin') { router.push('/'); return; }
    /* پاسخِ /api/products یک شیء است: { products, total, page, ... }
       نه آرایه. پیش‌تر همان شیء در state می‌نشست و اولین `.filter`
       صفحه را می‌شکست — یعنی «تأیید محصولات» هرگز چیزی نشان نمی‌داد. */
    api.get('/products?limit=200').then(res => {
      const list = Array.isArray(res.data) ? res.data : (res.data?.products ?? []);
      setProducts(list);
      setErr('');
    }).catch(() => setErr('خواندن محصولات انجام نشد'))
      .finally(() => setLoading(false));
  }, [user]);

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
    if (filterVerification === 'verified' && !p.isVerified) return false;
    if (filterVerification === 'pending' && (!p.requestedVerification || p.isVerified)) return false;
    if (filterVerification === 'unverified' && (p.isVerified || p.requestedVerification)) return false;
    return true;
  });

  const pendingCount = products.filter(p => p.requestedVerification && !p.isVerified).length;

  if (!user || user.primaryRole !== 'admin') return null;

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {err && (
        <div className="mb-5 rounded-xl border px-4 py-3 text-sm font-bold"
          style={{ background: 'rgba(178,59,46,0.06)', borderColor: 'rgba(178,59,46,0.28)', color: '#B23B2E' }}>
          {err}
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingBag size={24} className="text-purple-600" />
          مدیریت محصولات
        </h1>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">
              {pendingCount.toLocaleString('fa-IR')} در انتظار تأیید
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
            {Object.entries(categoryLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select value={filterVerification} onChange={e => setFilterVerification(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="all">همه وضعیت‌ها</option>
            <option value="pending">در انتظار تأیید</option>
            <option value="verified">تأیید شده</option>
            <option value="unverified">تأیید نشده</option>
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
                    <div className="flex items-center gap-2 mt-0.5">
                      {product.isVerified && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <CheckCircle size={9} /> تأیید شده
                        </span>
                      )}
                      {product.requestedVerification && !product.isVerified && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                          در انتظار تأیید
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">
                    {categoryLabels[product.category] || product.category}
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
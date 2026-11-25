'use client';

import { AdminHeader } from '../../../components/admin/AdminHeader';
import { useState, useEffect } from 'react';
import { ask } from '../../../lib/ui/dialogs'
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/auth.store';
import ScrollList from '../../../components/ui/ScrollList';
import api from '../../../lib/api';
import { apiFetch } from '../../../lib/http';
import { ShoppingBag, Search, CheckCircle, XCircle, Eye, Trash2, Ban, PauseCircle, PlayCircle } from 'lucide-react';
import { RowAction, ROW_ACTIONS_CLASS, ROW_ACTIONS_HEAD_CLASS } from '../../../components/admin/RowAction';
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
  /* وضعیت چرخه‌ی عمر — جدا از «تیک تأیید». تیک یعنی «فروشنده معتبر
     است»؛ وضعیت یعنی «آگهی منتشر شده یا نه». این دو تا امروز در پنل
     قاطی بودند و ادمین راهی برای رد کردن آگهی نداشت. */
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

/* برچسب دسته از منبع واحد می‌آید (lib/market/categories).
   فهرست دستی قبلی هفت دسته داشت در حالی که بازار پانزده‌تا دارد —
   یعنی هشت دسته در پنل با کلید خام انگلیسی دیده می‌شدند. */

/* رنگ نشان هر وضعیت. «رد شده» و «منقضی» عمدا هم‌رنگ نیستند: یکی
   تصمیم ادمین است و دیگری گذشت زمان. */
const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  paused:   'bg-orange-100 text-orange-700',
  sold:     'bg-blue-100 text-blue-700',
  expired:  'bg-gray-200 text-gray-600',
};

export default function AdminProductsPage() {
  const router = useRouter();
  /* بدون `_hydrated`، نخستین رندر `user` را تهی می‌بیند (استور از
     localStorage خوانده می‌شود) و ادمین را پیش از باز شدن صفحه به
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
    /* پاسخ /api/products یک شیء است: { products, total, page, ... }
       نه آرایه. پیش‌تر همان شیء در state می‌نشست و اولین `.filter`
       صفحه را می‌شکست — یعنی «تأیید محصولات» هرگز چیزی نشان نمی‌داد. */
    /* `all=1` ⇒ همه‌ی وضعیت‌ها، نه فقط فعال‌ها. بدون آن، آگهی
       متوقف، فروخته‌شده یا ردشده در پنل اصلا دیده نمی‌شد و ادمین
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

  /* کلید بازبینی — از تنظیمات سرور، نه از حافظه‌ی مرورگر */
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

  /* ── بازبینی آگهی ──
     جدا از «تیک تأیید»: تیک یعنی فروشنده معتبر است، وضعیت یعنی آگهی
     منتشر شده یا نه. تا امروز فقط تیک بود، پس ادمین راهی برای رد
     کردن آگهی نداشت جز حذف کامل — که برگشت‌ناپذیر است و فروشنده هم
     هرگز نمی‌فهمید چرا. */
  /* آگهی‌ای که در حال رد کردنش هستیم — تا نوشتن دلیل در پنجره */
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectBusy, setRejectBusy] = useState(false);

  const setStatus = async (productId: string, next: ListingStatus, note: string | null = null) => {
    setErr('');
    /* ── چرا پنجره و نه  ──
       پنجره‌ی بومی مرورگر چپ‌به‌راست است، نشانی سایت را بالای خودش
       می‌نویسد، و متن چندخطی نمی‌گیرد — در حالی که این متن مستقیم
       به فروشنده نشان داده می‌شود و باید جا برای توضیح داشته باشد. */
    if (next === 'rejected' && !note) { setRejectFor(productId); setRejectNote(''); return; }
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
    if (!(await ask('این آگهی برای همیشه حذف شود؟', { body: 'برگشت‌پذیر نیست، اگر فقط می‌خواهید از سایت برداشته شود، «رد کردن» یا «توقف موقت» را بزنید' }))) return;
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
    /* فیلترهای وضعیت چرخه‌ی عمر — جدا از تیک تأیید */
    if (['active', 'pending', 'rejected', 'paused', 'sold', 'expired'].includes(filterVerification)) {
      return p.status === filterVerification;
    }
    if (filterVerification === 'verified' && !p.isVerified) return false;
    if (filterVerification === 'awaiting_badge' && (!p.requestedVerification || p.isVerified)) return false;
    if (filterVerification === 'unverified' && (p.isVerified || p.requestedVerification)) return false;
    return true;
  });

  /* دو صف جدا که تا امروز یکی شمرده می‌شدند:
       · آگهی در انتظار *انتشار* — تصمیم اصلی ادمین
       · درخواست تیک تأیید — که ربطی به انتشار ندارد */
  const awaitingReview = products.filter(p => p.status === 'pending').length;
  const pendingCount = products.filter(p => p.requestedVerification && !p.isVerified).length;

  if (!_hydrated) return null;
  if (!user || user.primaryRole !== 'admin') return null;

  return (
    <main className="adm-page">
      {err && (
        <div role="alert" className="rounded-card border px-4 py-3 text-sm font-bold"
          style={{ background: 'rgba(178,59,46,0.06)', borderColor: 'rgba(178,59,46,0.28)', color: '#B23B2E' }}>
          {err}
        </div>
      )}
      {/* ── کلید بازبینی ──
          این‌جاست نه در صفحه‌ی تنظیمات، چون همان کسی که آگهی‌ها را
          بررسی می‌کند باید بتواند روشن/خاموشش کند و اثرش را همان‌جا
          ببیند. */}
      <div className="rounded-card border px-4 py-3 flex items-center gap-3 flex-wrap"
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
            ? 'هر آگهی تازه تا تأیید شما منتشر نمی‌شود'
            : 'آگهی‌ها بی‌درنگ منتشر می‌شوند و شما بعدا می‌توانید ردشان کنید'}
        </span>
      </div>

      <AdminHeader
        icon={<ShoppingBag size={26} className="text-gold-text" aria-hidden />}
        title="آگهی‌های بیلیارد بازار"
        description={
          <span className="flex flex-wrap items-center gap-2">
            {/* صف انتشار — مهم‌ترین عدد این صفحه وقتی بازبینی روشن است */}
            {awaitingReview > 0 && (
              <button type="button" onClick={() => setFilterVerification('pending')}
                className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 transition-colors hover:bg-yellow-200">
                {awaitingReview.toLocaleString('fa-IR')} در انتظار بررسی
              </button>
            )}
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                {pendingCount.toLocaleString('fa-IR')} درخواست تیک
              </span>
            )}
            <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold-text">
              {filtered.length.toLocaleString('fa-IR')} محصول
            </span>
          </span>
        } />

      {/* فیلترها */}
      <div className="adm-card">
        <div className="adm-toolbar">
          <div className="adm-grow relative">
            <Search size={16} aria-hidden className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input type="search" aria-label="جستجو در محصولات" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="جستجو در محصولات..."
              className="h-11 w-full rounded-field border border-line/20 bg-surface pe-3 ps-9 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep" />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            aria-label="فیلتر دسته" className="h-11 flex-1 basis-36">
            <option value="all">همه دسته‌ها</option>
            {MARKET_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <select value={filterVerification} onChange={e => setFilterVerification(e.target.value)}
            aria-label="فیلتر وضعیت" className="h-11 flex-1 basis-36">
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
      <div className="overflow-hidden rounded-card border border-line/10 bg-surface">
        <div className="hidden bg-paper px-4 py-3 text-xs text-ink-2 lg:grid lg:grid-cols-12" aria-hidden>
          <div className="col-span-4">محصول</div>
          <div className="col-span-2">دسته</div>
          <div className="col-span-2">فروشنده</div>
          <div className="col-span-2">قیمت</div>
          <div className={ROW_ACTIONS_HEAD_CLASS}>عملیات</div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">محصولی پیدا نشد</div>
        ) : (
          <ScrollList count={filtered.length} min={8} gap={0} className="divide-y divide-gray-50">
            {filtered.map(product => (
              <div key={product.id} className={`flex flex-col px-4 py-3 hover:bg-paper lg:grid lg:grid-cols-12 lg:items-center ${product.requestedVerification && !product.isVerified ? 'bg-yellow-50' : ''}`}>
                <div className="flex items-center gap-3 lg:col-span-4">
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
                      {/* وضعیت آگهی — همیشه دیده می‌شود جز وقتی فعال است،
                          چون «فعال» حالت عادی است و نشان لازم ندارد. */}
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
                    {/* دلیل رد — فروشنده هم همین را می‌بیند */}
                    {product.status === 'rejected' && product.adminNote && (
                      <div className="text-xs text-red-600 mt-1 line-clamp-1" title={product.adminNote}>
                        دلیل: {product.adminNote}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 lg:contents">
                <div className="lg:col-span-2">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">
                    {categoryLabel(product.category)}
                  </span>
                </div>
                <div className="text-sm text-ink-2 lg:col-span-2">
                  {product.seller?.firstName} {product.seller?.lastName}
                </div>
                <div className="text-sm font-semibold text-success lg:col-span-2">
                  {product.price?.toLocaleString('fa-IR')} تومان
                </div>
                </div>
                {/* موبایل: دکمه‌ها با نام، در ردیفِ زیرِ مشخصات (RowAction) */}
                <div className={ROW_ACTIONS_CLASS}>
                  <RowAction label="مشاهده آگهی" short="مشاهده" tone="blue"
                    icon={<Eye size={15} aria-hidden />} onClick={() => router.push(`/shop/${product.id}`)} />

                  {/* ── بازبینی ──
                      «انتشار» فقط وقتی معنا دارد که آگهی منتشر نباشد؛
                      «رد کردن» فقط وقتی هنوز رد نشده. نشان‌دادن دکمه‌ای
                      که کاری نمی‌کند، ادمین را به شک می‌اندازد. */}
                  {product.status !== 'active' && product.status !== 'sold' && (
                    <RowAction label="انتشار آگهی" short="انتشار" tone="green"
                      icon={<PlayCircle size={15} aria-hidden />} onClick={() => setStatus(product.id, 'active')} />
                  )}
                  {product.status !== 'rejected' && (
                    <RowAction label="رد کردن با دلیل" short="رد" tone="red"
                      icon={<Ban size={15} aria-hidden />} onClick={() => setStatus(product.id, 'rejected')} />
                  )}
                  {product.status === 'active' && (
                    <RowAction label="توقف موقت" short="توقف" tone="orange"
                      icon={<PauseCircle size={15} aria-hidden />} onClick={() => setStatus(product.id, 'paused')} />
                  )}

                  {!product.isVerified && (
                    <RowAction label="دادن تیک تأیید" short="تیک تأیید" tone="green"
                      icon={<CheckCircle size={15} aria-hidden />} onClick={() => handleVerify(product.id, true)} />
                  )}
                  {product.isVerified && (
                    <RowAction label="لغو تیک تأیید" short="لغو تیک" tone="yellow"
                      icon={<XCircle size={15} aria-hidden />} onClick={() => handleVerify(product.id, false)} />
                  )}
                  <RowAction label="حذف آگهی" short="حذف" tone="red"
                    icon={<Trash2 size={15} aria-hidden />} onClick={() => handleDelete(product.id)} />
                </div>
              </div>
            ))}
          </ScrollList>
        )}
      </div>

      {/* ── دلیل رد ──
          متن مستقیم به فروشنده نشان داده می‌شود، پس باید جا برای
          توضیح چندخطی داشته باشد — چیزی که  نمی‌دهد. */}
      {rejectFor && (
        <div role="dialog" aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget && !rejectBusy) setRejectFor(null); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(20,18,14,0.5)',
            backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: 18, direction: 'rtl',
          }}>
          <div style={{
            width: '100%', maxWidth: 460, background: '#fff', borderRadius: 20,
            border: '1px solid #EAE5DA', padding: 'clamp(18px,4vw,26px)',
            fontFamily: 'var(--font-base)', boxShadow: '0 24px 60px rgba(20,18,14,0.3)',
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 900, color: '#1C1B17', margin: '0 0 6px' }}>
              رد کردن آگهی
            </h3>
            <p style={{ fontSize: 12.5, color: '#6F6A5C', margin: '0 0 16px', lineHeight: 1.95 }}>
              دلیل را بنویسید — همین متن به فروشنده نشان داده می‌شود، رد کردن بی‌دلیل
              یعنی همان آگهی دوباره فرستاده می‌شود و وقت هر دو طرف تلف می‌شود
            </p>
            <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} rows={4}
              placeholder="مثال: تصویر محصول با عنوان آگهی نمی‌خواند"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12,
                border: '1px solid #EAE5DA', fontSize: 13, fontFamily: 'inherit',
                outline: 'none', resize: 'vertical', lineHeight: 2, color: '#1C1B17',
              }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="button" onClick={() => setRejectFor(null)} disabled={rejectBusy}
                style={{
                  flex: 1, padding: 12, borderRadius: 12, border: '1px solid #EAE5DA',
                  background: '#F4F3F1', color: '#5B564B', fontSize: 13.5, fontWeight: 800,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>انصراف</button>
              <button type="button" disabled={rejectBusy || !rejectNote.trim()}
                onClick={async () => {
                  const id = rejectFor; const note = rejectNote.trim();
                  setRejectBusy(true);
                  await setStatus(id, 'rejected', note);
                  setRejectBusy(false); setRejectFor(null);
                }}
                style={{
                  flex: 1, padding: 12, borderRadius: 12, border: 'none',
                  background: rejectNote.trim() ? '#dc2626' : 'rgba(0,0,0,0.12)',
                  color: rejectNote.trim() ? '#fff' : 'rgba(0,0,0,0.35)',
                  fontSize: 13.5, fontWeight: 800, fontFamily: 'inherit',
                  cursor: rejectNote.trim() ? 'pointer' : 'not-allowed',
                }}>{rejectBusy ? 'در حال ثبت…' : 'رد کردن آگهی'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
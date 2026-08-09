'use client';

import { useEffect, useState } from 'react';
import { ask, notify } from '../../../lib/ui/dialogs'
import PageLoader from '@/components/ui/PageLoader';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../../lib/http';
import { useAuthStore } from '../../../store/auth.store';
import { uploadFile } from '../../../lib/supabase';
import { findSellerByOwner } from '../../../lib/seller-store';
import { Package, Edit, Trash2, Eye, CheckCircle, Clock, XCircle, Plus, ShoppingBag, ArrowUp, Zap } from 'lucide-react';
import BoostDialog from '../../../components/market/BoostDialog';
import { productTitleParts } from '../../../lib/market/title';

/* طرح LQ (تینت طلایی) — همه‌ی دکمه‌های این صفحه از این استفاده می‌کنند */
const LQ = 'bg-[rgba(199,166,106,0.12)] border border-[rgba(199,166,106,0.34)] text-[#9A6E38] rounded-[10px] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[rgba(199,166,106,0.18)]';
const LQ_NEUTRAL = 'bg-[rgba(28,28,26,0.04)] border border-[rgba(28,28,26,0.1)] text-[#5B564B] rounded-[10px] transition-all duration-200 hover:-translate-y-0.5';

/* محصول ثبت‌شده در localStorage → شکل Product این صفحه */
function mapLocalProduct(up: Record<string, unknown>): Product {
  const num = (v: unknown, d = 0) => (typeof v === 'number' ? v : d);
  const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);
  const disc = num(up.disc);
  const price = num(up.price);
  const old = num(up.old, price);
  const cond = str(up.condition, 'new');
  return {
    id: String(up.id),
    ...(() => { const t = productTitleParts(up); return { title: t.head, sub: t.tail }; })(),
    price: disc > 0 ? old : price,
    discountPrice: disc > 0 ? price : undefined,
    discountPercent: disc > 0 ? disc : undefined,
    category: str(up.category, 'other'),
    condition: cond === 'like-new' ? 'like_new' : cond,
    city: str(up.sellerCity),
    images: (up.images as string[] | undefined) ?? [str(up.img)].filter(Boolean),
    isVerified: false,
    isOfficialStore: false,
    status: 'active',
    stock: 1,
    views: 0,
    requestedVerification: false,
    createdAt: new Date(num(up.id, 0) || Date.now()).toISOString(),
  };
}

/* رکورد جدول products روی سرور → شکل Product این صفحه */
function mapServerAd(a: Record<string, unknown>): Product {
  const n = (v: unknown, d = 0) => { const x = Number(v); return Number.isFinite(x) ? x : d; };
  const s = (v: unknown, d = '') => (typeof v === 'string' ? v : d);
  /* `price` قیمتِ خط‌خورده و `discountPrice` پرداختی — پیش‌تر عددِ
     خط‌خورده از روی درصدِ گردشده بازسازی می‌شد و غلط درمی‌آمد. */
  const listed = n(a.price);
  const paid = n(a.discountPrice);
  const hasDisc = paid > 0 && paid < listed;
  const disc = hasDisc ? (n(a.discountPercent) || Math.round(((listed - paid) / listed) * 100)) : 0;
  return {
    id: String(a.id),
    ...(() => { const t = productTitleParts(a); return { title: t.head, sub: t.tail }; })(),
    price: listed,
    discountPrice: hasDisc ? paid : undefined,
    discountPercent: hasDisc ? disc : undefined,
    category: s(a.category, 'other'),
    condition: s(a.condition, 'new'),
    city: s(a.city),
    images: Array.isArray(a.images) ? (a.images as string[]) : [],
    isVerified: !!a.isVerified,
    isOfficialStore: !!a.isOfficialStore,
    status: s(a.status, 'active'),
    stock: n(a.stock, 1),
    views: n(a.views),
    requestedVerification: !!a.requestedVerification,
    createdAt: s(a.createdAt) || new Date().toISOString(),
  };
}

function loadLocalProducts(owner: { id?: string; phone?: string }): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = JSON.parse(localStorage.getItem('userProducts') ?? '[]') as Record<string, unknown>[];
    const mySlug = findSellerByOwner(owner)?.slug ?? '';
    return list
      .filter(up => { const sid = typeof up.sellerId === 'string' ? up.sellerId : ''; return !mySlug || !sid || sid === mySlug; })
      .map(mapLocalProduct);
  } catch { return []; }
}

interface Product {
  id: string;
  title: string;
  /* برند و مدل — خطِ دومِ عنوان. صاحبِ آگهی هم باید پنج چوبش را از
     هم تشخیص بدهد، مخصوصاً وقتی می‌خواهد یکی را حذف یا ارتقا کند. */
  sub: string;
  price: number;
  discountPrice?: number;
  discountPercent?: number;
  category: string;
  condition: string;
  city: string;
  images: string[];
  isVerified: boolean;
  isOfficialStore: boolean;
  status: string;
  stock: number;
  views: number;
  requestedVerification: boolean;
  createdAt: string;
}

/* `categoryLabels` و `conditionLabels` حذف شدند: کارتِ فهرست دیگر
   دسته و وضعیتِ کالا را جدا نمی‌نویسد (عنوانِ آگهی خودش «دسته + نوع»
   است). آن فهرستِ دسته هم یک کپیِ کهنه‌ی دیگر بود — «آموزشی» داشت که
   اصلاً دسته نیست و نیمی از دسته‌های واقعی را نداشت. */
const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: 'فعال', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} /> },
  sold: { label: 'فروخته شده', color: 'bg-gray-100 text-gray-600', icon: <CheckCircle size={12} /> },
  inactive: { label: 'غیرفعال', color: 'bg-red-100 text-red-600', icon: <XCircle size={12} /> },
};

export default function MyShopPage() {
  const router = useRouter();
  const { user, _hydrated, authChecked } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  /* آگهی‌ای که پنجره‌ی ارتقایش باز است */
  const [boostFor, setBoostFor] = useState<{ id: string; title: string } | null>(null);
  /* پیامِ بازگشت از درگاهِ ارتقا — از کوئریِ نشانی */
  const [boostMsg, setBoostMsg] = useState("");

  /* ── بازگشت از درگاهِ ارتقا ──
     کالبک به همین صفحه برمی‌گردد با `?boost=...`. بدونِ این پیام،
     فروشنده پول داده و فقط یک صفحه‌ی معمولی می‌بیند و نمی‌داند
     کارش انجام شد یا نه. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const st = q.get("boost");
    if (!st) return;
    const kind = q.get("kind");
    setBoostMsg(
      st === "ok"
        ? (kind === "urgent" ? "آگهی شما فوری شد و در نوارِ فوریِ بازار نشسته است."
                             : "آگهی شما تازه‌سازی شد و به بالای فهرست رفت.")
      : st === "cancelled" ? "پرداخت لغو شد — مبلغی کم نشده است."
      /* بازکردنِ نشانیِ کالبک بدونِ داده‌ی درگاه: نه موفق است نه
         ناموفق. گفتنِ «انجام نشد» به کسی که شاید پول داده، دروغِ
         نگران‌کننده‌ای است. */
      : st === "pending" ? "نتیجه‌ی این پرداخت هنوز قطعی نشده — اگر مبلغی کم شده، تا دقایقی دیگر اعمال می‌شود."
      : (q.get("reason") || "ارتقای آگهی انجام نشد."),
    );
    /* نشانی تمیز می‌شود تا رفرش دوباره همین پیام را نیاورد */
    window.history.replaceState({}, "", window.location.pathname);
    window.setTimeout(() => setBoostMsg(""), 8000);
  }, []);

  useEffect(() => {
    if (!user) return;
    /* آگهی‌های واقعی از سرور می‌آیند؛ آگهی‌های قدیمی باقی‌مانده در همین
       مرورگر هم نشان داده می‌شوند تا تا پیش از مهاجرت چیزی گم‌شده به‌نظر نرسد. */
    const local = loadLocalProducts({ id: user.id, phone: user.phone });
    fetch('/api/market/ads?mine=1', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        const remote: Product[] = Array.isArray(j?.ads) ? j.ads.map(mapServerAd) : [];
        const remoteTitles = new Set(remote.map(p => p.title));
        setProducts([...remote, ...local.filter(p => !remoteTitles.has(p.title))]);
        setLoading(false);
      })
      .catch(() => { setProducts(local); setLoading(false); });
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!(await ask('این آگهی حذف شود؟', { body: 'آگهی از بیلیارد بازار برداشته می‌شود و برنمی‌گردد.' }))) return;
    setDeleting(id);
    /* آگهی قدیمی باقی‌مانده در همین مرورگر را هم پاک کن */
    try {
      const list = JSON.parse(localStorage.getItem('userProducts') ?? '[]') as Record<string, unknown>[];
      const next = list.filter(p => String(p.id) !== String(id));
      if (next.length !== list.length) localStorage.setItem('userProducts', JSON.stringify(next));
    } catch { /* ignore */ }
    try { await apiFetch(`/api/market/ads/${id}`, { method: 'DELETE' }); } catch { /* آگهی فقط‌محلی روی سرور نیست */ }
    setProducts(products.filter(p => p.id !== id));
    setDeleting(null);
  };

  const filtered = activeTab === 'all' ? products :
    activeTab === 'pending' ? products.filter(p => p.requestedVerification && !p.isVerified) :
    products.filter(p => p.status === activeTab);

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    sold: products.filter(p => p.status === 'sold').length,
    pending: products.filter(p => p.requestedVerification && !p.isVerified).length,
    totalViews: products.reduce((sum, p) => sum + (p.views || 0), 0),
  };

  /* تا تأییدِ سرور «هیچ» نشان نمی‌دهیم — صفحه‌ی خالی برای کاربر یعنی
     «خراب است»، نه «صبر کن». */
  if (!_hydrated || !authChecked) return <PageLoader />;
  if (!user) return null;

  /* ── فروشنده یا آگهی‌دهنده‌ی معمولی ──
     همین صفحه هر دو را سرویس می‌دهد، چون ثبتِ آگهی برای همه باز است.
     ولی عنوانِ «فروشگاه من» فقط برای فروشنده معنا دارد؛ کسی که یک
     چوب دستِ‌دوم گذاشته، فهرستِ «آگهی‌های من» می‌بیند. */
  const isSeller = [user.primaryRole, ...(user.secondaryRoles ?? [])].includes('seller');

  return (
    /* px/pt: روی موبایل عنوان و دکمه چسبیده به لبه‌ی صفحه بودند */
    <div className="max-w-5xl mx-auto px-4 sm:px-5 pt-4 sm:pt-5 pb-10">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{isSeller ? 'فروشگاه من' : 'آگهی‌های من'}</h1>
        <Link href="/shop/new"
          className={`${LQ} px-4 py-2 text-[13px] flex items-center gap-1.5 font-bold flex-shrink-0`}>
          <Plus size={15} />
          ثبت محصول
        </Link>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'کل محصولات', value: stats.total, color: 'text-gray-800', bg: 'bg-white' },
          { label: 'محصولات فعال', value: stats.active, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'فروخته شده', value: stats.sold, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'کل بازدید', value: stats.totalViews, color: 'text-purple-700', bg: 'bg-purple-50' },
        ].map((item, i) => (
          <div key={i} className={`${item.bg} rounded-xl p-3 shadow-sm text-center border border-gray-100`}>
            <div className={`text-2xl font-black ${item.color}`}>
              {item.value.toLocaleString('fa-IR')}
            </div>
            <div className="text-[12px] text-gray-500 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      {/* تب‌ها */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b overflow-x-auto">
          {[
            { id: 'all', label: 'همه', count: stats.total },
            { id: 'active', label: 'فعال', count: stats.active },
            { id: 'sold', label: 'فروخته شده', count: stats.sold },
            { id: 'pending', label: 'در انتظار تأیید', count: stats.pending },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold flex-shrink-0 border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-[#C7A66A] text-[#9A6E38]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-[rgba(199,166,106,0.16)] text-[#9A6E38]' : 'bg-gray-100 text-gray-500'}`}>
                  {tab.count.toLocaleString('fa-IR')}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {loading ? (
            <div className="text-center py-16 text-gray-400">در حال بارگذاری...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">
                {activeTab === 'all' ? 'هنوز محصولی ثبت نکردی' : 'محصولی در این دسته نیست'}
              </p>
              {activeTab === 'all' && (
                <Link href="/shop/new" className={`${LQ} inline-block px-6 py-2.5 text-sm font-bold`}>
                  ثبت محصول جدید
                </Link>
              )}
            </div>
          ) : (
            /* ── چرا کادرِ اسکرول‌دار ──
               فهرست بی‌انتها زیرِ هم می‌رفت؛ با ده آگهی، رسیدن به تهِ
               صفحه یعنی چند صفحه اسکرول. حالا خودِ فهرست کادرِ خودش را
               دارد و بقیه‌ی صفحه سرِ جایش می‌ماند. */
            <div className="max-h-[62vh] overflow-y-auto overscroll-contain pl-1 space-y-2.5">
              {filtered.map(product => (
                <div key={product.id} className="border border-gray-100 rounded-2xl p-3 hover:border-[rgba(199,166,106,0.45)] transition-colors">
                  <div className="flex items-start gap-3">
                    {/* عکس */}
                    <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {product.images?.length > 0 ? (
                        <img loading="lazy" decoding="async" src={product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package size={24} className="text-gray-300" />
                      )}
                    </div>

                    {/* ── فقط چهار چیز ──
                        دسته‌بندی و نوع (عنوان)، برند و مدل (زیرنویس)، و
                        قیمت. وضعیت و شهر و بازدید از این‌جا رفتند: در
                        فهرست، هرچه بیشتر نوشته شود کمتر خوانده می‌شود، و
                        روی موبایل همه‌شان روی هم می‌افتادند. */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-800 text-[13.5px] leading-6 truncate">{product.title}</h3>
                        <span className={`text-[10.5px] px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 ${statusLabels[product.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                          {statusLabels[product.status]?.icon}
                          {statusLabels[product.status]?.label || product.status}
                        </span>
                      </div>
                      {product.sub && (
                        <div className="text-[12px] text-gray-500 truncate mt-0.5" dir="auto">{product.sub}</div>
                      )}
                      <div className="mt-1.5">
                        {product.discountPrice ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] text-gray-400 line-through">{product.price.toLocaleString('fa-IR')}</span>
                            <span className="font-bold text-green-700 text-[13px]">{product.discountPrice.toLocaleString('fa-IR')} تومان</span>
                            <span className="bg-red-100 text-red-600 text-[10.5px] px-1.5 py-0.5 rounded">{product.discountPercent}٪</span>
                          </div>
                        ) : (
                          <span className="font-bold text-green-700 text-[13px]">{product.price.toLocaleString('fa-IR')} تومان</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── دکمه‌ها با نام ──
                      تا امروز فقط آیکون بودند و `title` روی موبایل هیچ‌وقت
                      نشان داده نمی‌شود؛ کاربر جز سطلِ آشغال هیچ‌کدام را
                      نمی‌شناخت. جا هم هست. */}
                  <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                    <Link href={`/shop/${product.id}`}
                      className={`${LQ_NEUTRAL} flex flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-bold`}>
                      <Eye size={15} />
                      نمایش
                    </Link>
                    <Link href={`/shop/edit/${product.id}`}
                      className={`${LQ} flex flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-bold`}>
                      <Edit size={15} />
                      ویرایش
                    </Link>
                    {/* ── ارتقا ──
                        کنارِ خودِ آگهی، چون کاری است که روی همان یک
                        آگهی انجام می‌شود. صفحه‌ی جدا یعنی فروشنده
                        باید آگهی را آن‌جا دوباره پیدا کند. */}
                    <button onClick={() => setBoostFor({
                      id: product.id,
                      /* پنجره‌ی ارتقا باید بگوید کدام آگهی — «چوب اسنوکر»
                         تنها، بینِ پنج چوب، هیچ‌چیز نمی‌گوید. */
                      title: [product.title, product.sub].filter(Boolean).join(' '),
                    })}
                      className={`${LQ} flex flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-bold`}>
                      <ArrowUp size={15} />
                      ارتقا
                    </button>
                    <button onClick={() => handleDelete(product.id)} disabled={deleting === product.id}
                      className="flex flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-bold rounded-[10px] border border-red-100 bg-red-50 text-red-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-100 disabled:opacity-50">
                      <Trash2 size={15} />
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {boostFor && (
        <BoostDialog productId={boostFor.id} title={boostFor.title}
          onClose={() => setBoostFor(null)} />
      )}

      {boostMsg && (
        <div style={{
          position: "fixed", insetInline: 0, bottom: 22, margin: "0 auto", zIndex: 95,
          width: "fit-content", maxWidth: "calc(100% - 32px)",
          background: "#1A1A18", color: "#fff", borderRadius: 12,
          padding: "11px 18px", fontSize: 13, fontWeight: 700,
          fontFamily: "var(--font-base)", boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <Zap size={15} /> {boostMsg}
        </div>
      )}
    </div>
  );
}
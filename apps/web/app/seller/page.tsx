'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../store/auth.store';
import AuthGuard from '../../components/AuthGuard';
import {
  Package, ShoppingBag, Eye, Edit, Plus, AlertCircle,
  BarChart2, Loader2, RefreshCw, Store, ExternalLink,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   داشبوردِ فروشنده.

   نسخه‌ی قبلی تماماً روی داده‌ی ساختگی بنا شده بود: پنج سفارشِ جعلی با
   نامِ خریدارانِ ساختگی، چهار محصولِ ثابت، نمودارِ درآمدِ دوازده‌ماهه با
   اعدادِ دلخواه، و «امتیازِ فروشنده» که از همان اعداد درمی‌آمد. هیچ‌کدام
   به دیتابیس وصل نبودند — فروشنده عددهایی می‌دید که هیچ ربطی به
   فروشگاهش نداشت.

   حالا فقط چیزی نشان داده می‌شود که واقعاً وجود دارد:

     • محصولات ⇒ جدولِ `products` با `sellerId` برابرِ خودِ کاربر
     • آمار    ⇒ از همان محصولات محاسبه می‌شود (تعداد، بازدید، موجودی)

   آنچه حذف شد و برنگشت:
     • سفارش‌ها — جدولِ `orders` در این پروژه اصلاً وجود ندارد
     • درآمد و نمودارِ ماهانه — بدونِ سفارش، عددی برای نمایش نیست
     • پیام‌ها — پیش‌تر با پرچمِ تعاملاتِ اجتماعی برداشته شد

   هر کدام از این‌ها وقتی زیرساختش ساخته شد برمی‌گردد؛ تا آن روز
   نبودنشان صادقانه‌تر از نشان‌دادنِ عددِ ساختگی است.
   ───────────────────────────────────────────────────────────── */

const GOLD_D = '#9A6E38';
const LINE = 'rgba(0,0,0,0.07)';
const SEC = 'rgba(0,0,0,0.45)';

interface Product {
  id: string;
  title: string;
  category?: string;
  price: number;
  stock: number;
  views: number;
  status: string;
  images?: string[];
  createdAt?: string;
}

type Filter = 'all' | 'active' | 'inactive' | 'low';

const toFa = (v: string | number) => String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
const money = (n: number) => toFa(n.toLocaleString('en-US'));

const STATUS_FA: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: 'فعال',          color: '#0E7A38', bg: 'rgba(14,122,56,0.10)' },
  inactive: { label: 'غیرفعال',       color: SEC,       bg: 'rgba(0,0,0,0.05)' },
  pending:  { label: 'در انتظار تأیید', color: '#B8860B', bg: 'rgba(199,166,106,0.12)' },
  expired:  { label: 'منقضی',         color: '#B23B2E', bg: 'rgba(178,59,46,0.08)' },
  rejected: { label: 'رد شده',        color: '#B23B2E', bg: 'rgba(178,59,46,0.08)' },
};

function SellerContent() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/products?mine=true&limit=200', { cache: 'no-store', credentials: 'include' });
      if (!r.ok) throw new Error(String(r.status));
      const j = await r.json();
      /* پاسخ ممکن است {products:[…]} یا خودِ آرایه باشد */
      const list: Product[] = Array.isArray(j) ? j : (j.products ?? j.data ?? []);
      setProducts(list);
    } catch {
      setError('خواندنِ محصولات انجام نشد. اتصال را بررسی کنید و دوباره تلاش کنید.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const all = products ?? [];
  const activeCount = all.filter(p => p.status === 'active').length;
  const totalViews = all.reduce((a, p) => a + (p.views || 0), 0);
  const lowStock = all.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 3);
  const outOfStock = all.filter(p => (p.stock ?? 0) === 0);

  const shown = all.filter(p => {
    if (filter === 'active')   return p.status === 'active';
    if (filter === 'inactive') return p.status !== 'active';
    if (filter === 'low')      return (p.stock ?? 0) <= 3;
    return true;
  });

  const STATS = [
    { label: 'آگهی‌های شما', value: toFa(all.length),      icon: <Package size={16} />,   sub: `${toFa(activeCount)} فعال` },
    { label: 'مجموع بازدید', value: toFa(totalViews),      icon: <Eye size={16} />,       sub: all.length ? `میانگین ${toFa(Math.round(totalViews / all.length))} برای هر آگهی` : '—' },
    { label: 'رو به اتمام',  value: toFa(lowStock.length), icon: <AlertCircle size={16} />, sub: 'موجودی ۳ یا کمتر' },
    { label: 'ناموجود',      value: toFa(outOfStock.length), icon: <ShoppingBag size={16} />, sub: 'نیاز به شارژ موجودی' },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;} }
        @keyframes spin { to{transform:rotate(360deg);} }
        .spin { animation:spin 1s linear infinite; }
        .s-card { background:#fff; border:1px solid ${LINE}; border-radius:18px; padding:20px; }
        .prod-row { display:flex; align-items:center; gap:14px; padding:14px 16px; background:#fff;
          border:1px solid ${LINE}; border-radius:14px; transition:border-color .2s, box-shadow .2s; }
        .prod-row:hover { border-color:rgba(199,166,106,0.35); box-shadow:0 4px 14px rgba(0,0,0,0.05); }
        .filter-pill { min-height:36px; padding:6px 15px; border-radius:20px; font-size:12.5px; font-weight:700;
          border:1px solid; cursor:pointer; font-family:inherit; transition:all .2s; white-space:nowrap; }
        .filter-pill.on { background:rgba(199,166,106,0.12); border-color:rgba(199,166,106,0.34); color:${GOLD_D}; }
        .filter-pill:not(.on) { background:rgba(0,0,0,0.03); border-color:${LINE}; color:${SEC}; }
        .action-btn { width:36px; height:36px; border-radius:10px; border:1px solid ${LINE};
          background:rgba(0,0,0,0.03); cursor:pointer; display:flex; align-items:center; justify-content:center;
          transition:all .2s; color:${SEC}; flex-shrink:0; text-decoration:none; }
        .action-btn:hover { background:rgba(0,0,0,0.06); color:#111; }
        .stats-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
        @media(max-width:900px){ .stats-4{ grid-template-columns:repeat(2,1fr); } }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5', paddingBottom: 70 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '22px clamp(14px,4vw,32px) 0' }}>

          {/* ── سربرگ ── */}
          <header style={{ display: 'flex', alignItems: 'center', gap: 13, flexWrap: 'wrap', marginBottom: 22 }}>
            <span style={{
              width: 44, height: 44, borderRadius: 13, flexShrink: 0,
              background: 'linear-gradient(135deg,#C7A66A,#A07840)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 900,
            }}>{user?.firstName?.[0] ?? 'ف'}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#111' }}>پنل فروشنده</h1>
              <p style={{ margin: '3px 0 0', fontSize: 12.5, color: SEC }}>
                مدیریت آگهی‌های شما در بیلیارد بازار
              </p>
            </div>
            <button onClick={() => void load()} className="action-btn" aria-label="تازه‌سازی" title="تازه‌سازی">
              <RefreshCw size={16} className={loading ? 'spin' : undefined} />
            </button>
            <Link href="/shop/new" style={{
              display: 'flex', alignItems: 'center', gap: 7, minHeight: 44, padding: '0 18px',
              borderRadius: 12, background: '#141413', color: '#fff', textDecoration: 'none',
              fontSize: 14, fontWeight: 700,
            }}>
              <Plus size={16} /> آگهی جدید
            </Link>
          </header>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18, padding: '12px 15px',
              background: 'rgba(178,59,46,0.06)', border: '1px solid rgba(178,59,46,0.24)',
              borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#B23B2E',
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* ── آمار — همه از روی محصولاتِ واقعی ── */}
          <div className="stats-4" style={{ marginBottom: 22 }}>
            {STATS.map(s => (
              <div key={s.label} className="s-card" style={{ padding: '16px 17px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: GOLD_D, marginBottom: 9 }}>
                  {s.icon}
                  <span style={{ fontSize: 12, fontWeight: 700, color: SEC }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#111', lineHeight: 1.1 }}>
                  {loading ? '—' : s.value}
                </div>
                <div style={{ fontSize: 11.5, color: 'rgba(0,0,0,0.35)', marginTop: 5 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── فیلترها ── */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {([
              ['all', `همه (${toFa(all.length)})`],
              ['active', `فعال (${toFa(activeCount)})`],
              ['inactive', `غیرفعال (${toFa(all.length - activeCount)})`],
              ['low', `رو به اتمام (${toFa(lowStock.length + outOfStock.length)})`],
            ] as [Filter, string][]).map(([k, label]) => (
              <button key={k} type="button" onClick={() => setFilter(k)}
                className={`filter-pill${filter === k ? ' on' : ''}`}>{label}</button>
            ))}
          </div>

          {/* ── فهرستِ محصولات ── */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 50, color: SEC, fontSize: 13 }}>
              <Loader2 size={17} className="spin" /> در حالِ خواندنِ آگهی‌ها…
            </div>
          ) : shown.length === 0 ? (
            <div className="s-card" style={{ textAlign: 'center', padding: '46px 24px' }}>
              <span style={{
                width: 56, height: 56, borderRadius: 17, margin: '0 auto 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.28)', color: GOLD_D,
              }}><Store size={24} /></span>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 7 }}>
                {all.length === 0 ? 'هنوز آگهی‌ای ثبت نکرده‌اید' : 'آگهی‌ای با این فیلتر نیست'}
              </div>
              <p style={{ margin: '0 0 18px', fontSize: 13, lineHeight: 1.9, color: SEC }}>
                {all.length === 0
                  ? 'اولین محصولتان را در بیلیارد بازار ثبت کنید تا اینجا نمایش داده شود.'
                  : 'فیلتر را عوض کنید تا بقیه‌ی آگهی‌ها را ببینید.'}
              </p>
              {all.length === 0 && (
                <Link href="/shop/new" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7, minHeight: 44, padding: '0 20px',
                  borderRadius: 12, background: '#141413', color: '#fff', textDecoration: 'none',
                  fontSize: 14, fontWeight: 700,
                }}><Plus size={16} /> ثبت آگهی</Link>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeUp .35s ease both' }}>
              {shown.map(p => {
                const st = STATUS_FA[p.status] ?? { label: p.status, color: SEC, bg: 'rgba(0,0,0,0.05)' };
                const img = p.images?.[0];
                return (
                  <div key={p.id} className="prod-row">
                    <div style={{
                      width: 52, height: 52, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
                      background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {img
                        /* eslint-disable-next-line @next/next/no-img-element */
                        ? <img src={img} alt="" width={52} height={52} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                        : <Package size={20} style={{ color: 'rgba(0,0,0,0.22)' }} />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontSize: 14.5, fontWeight: 700, color: '#111' }}>{p.title}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 9px',
                          color: st.color, background: st.bg,
                        }}>{st.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: SEC }}>
                        <span style={{ fontWeight: 700, color: GOLD_D }}>{money(p.price)} تومان</span>
                        <span>موجودی: {toFa(p.stock ?? 0)}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Eye size={12} /> {toFa(p.views ?? 0)}
                        </span>
                      </div>
                    </div>

                    <Link href={`/shop/edit/${p.id}`} className="action-btn" aria-label="ویرایش" title="ویرایش">
                      <Edit size={15} />
                    </Link>
                    <Link href={`/shop/${p.id}`} className="action-btn" aria-label="مشاهده در سایت" title="مشاهده در سایت">
                      <ExternalLink size={15} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── آنچه هنوز نیست ── */}
          <div className="s-card" style={{ marginTop: 26, background: 'rgba(199,166,106,0.05)', borderColor: 'rgba(199,166,106,0.22)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <BarChart2 size={17} style={{ color: GOLD_D, flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#6B5225', marginBottom: 5 }}>
                  سفارش‌ها و گزارش درآمد هنوز فعال نیست
                </div>
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 2, color: '#6B5225' }}>
                  سیستم سفارش و پرداخت هنوز راه‌اندازی نشده، پس عددی برای نمایش وجود ندارد.
                  به‌جای نشان‌دادن آمار ساختگی، این بخش تا آماده‌شدنِ زیرساخت خالی می‌ماند.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default function SellerPage() {
  return <AuthGuard><SellerContent /></AuthGuard>;
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

interface Product {
  id: string; title: string; description: string;
  price: number; discountPrice?: number; discountPercent?: number;
  category: string; condition: string; city: string; stock: number;
  images: string[]; isOfficialStore: boolean; isDailyDeal: boolean;
  isSpecialSale: boolean; views: number; createdAt: string;
}

const CATEGORIES = [
  { value: 'all',       label: 'همه محصولات',  icon: 'ti-ball-billiard' },
  { value: 'cue',       label: 'چوب بیلیارد',  icon: 'ti-tournament' },
  { value: 'ball',      label: 'گوی',           icon: 'ti-circle' },
  { value: 'table',     label: 'میز',           icon: 'ti-layout-board' },
  { value: 'accessory', label: 'لوازم جانبی',  icon: 'ti-tool' },
  { value: 'clothing',  label: 'پوشاک',         icon: 'ti-shirt' },
];

const SORT_OPTIONS = [
  { value: 'newest',     label: 'جدیدترین',      icon: 'ti-clock' },
  { value: 'price_asc',  label: 'ارزان‌ترین',    icon: 'ti-arrow-up' },
  { value: 'price_desc', label: 'گران‌ترین',     icon: 'ti-arrow-down' },
  { value: 'popular',    label: 'پربازدیدترین',  icon: 'ti-trending-up' },
];

const FALLBACK_IMAGES: Record<string, string[]> = {
  cue:       ['/images/cue_billiard.jpg', '/images/cue_billiard_2.jpg', '/images/rest-pool-2.jpg'],
  ball:      ['/images/Ball-1.jpg', '/images/Ball.jpg'],
  table:     ['/images/Pro_table.jpg', '/images/Home_table.jpg', '/images/snooker-table.jpg', '/images/snooker-table-2.jpg'],
  accessory: ['/images/pool_chalk_1.jpg', '/images/pool_chalk_2.jpg', '/images/rest-pool.webp'],
  clothing:  ['/images/photo_2026-05-25_08-57-23.jpg'],
  default:   ['/images/billiadr-club-3.jpg', '/images/billiadr-club-5.jpg'],
};

const BRANDS = [
  { name: 'Predator',  img: '/images/cue_billiard_2.jpg' },
  { name: 'Aramith',   img: '/images/Ball-1.jpg' },
  { name: 'Riley',     img: '/images/rest-pool-2.jpg' },
  { name: 'Kamui',     img: '/images/pool_chalk_1.jpg' },
  { name: 'Olhausen',  img: '/images/Pro_table.jpg' },
  { name: 'Brunswick', img: '/images/snooker-table-2.jpg' },
  { name: 'McDermott', img: '/images/cue_billiard.jpg' },
  { name: 'Mezz',      img: '/images/rest-pool.webp' },
];

function getImage(p: Product): string {
  if (p.images?.length > 0) return p.images[0]!;
  const arr = FALLBACK_IMAGES[p.category] ?? FALLBACK_IMAGES['default']!;
  return arr[p.id.charCodeAt(0) % arr.length]!;
}

function toFa(v: string | number) {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}
function fmt(n: number) { return n.toLocaleString('fa-IR'); }

/* ── Persian Countdown ── */
function CountdownTimer({ totalSeconds = 8 * 3600 + 32 * 60 + 51 }) {
  const [rem, setRem] = useState(totalSeconds);
  useEffect(() => {
    const t = setInterval(() => setRem(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(rem / 3600);
  const m = Math.floor((rem % 3600) / 60);
  const s = rem % 60;
  const pad = (n: number) => toFa(String(n).padStart(2, '0'));
  const Block = ({ val, label }: { val: string; label: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{
        background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 10, padding: '6px 10px', fontFamily: 'monospace',
        fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1,
        boxShadow: '0 4px 14px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        minWidth: 42, textAlign: 'center',
      }}>{val}</div>
      <span style={{ fontSize: 9, color: 'rgba(255,200,200,0.5)', fontWeight: 600 }}>{label}</span>
    </div>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <Block val={pad(h)} label="ساعت" />
      <span style={{ color: '#ef4444', fontSize: 18, fontWeight: 900, marginBottom: 12, opacity: 0.8 }}>:</span>
      <Block val={pad(m)} label="دقیقه" />
      <span style={{ color: '#ef4444', fontSize: 18, fontWeight: 900, marginBottom: 12, opacity: 0.8 }}>:</span>
      <Block val={pad(s)} label="ثانیه" />
    </div>
  );
}

/* ── Product Card ── */
function ProductCard({ product, rank }: { product: Product; rank?: number }) {
  const [hov, setHov] = useState(false);
  const img = getImage(product);
  const hasDisc = product.discountPrice && product.discountPrice < product.price;
  const finalPrice = product.discountPrice ?? product.price;
  const oos = product.stock === 0;

  return (
    <Link href={`/shop/${product.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          background: hov ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)',
          border: `1px solid ${hov ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 18, overflow: 'hidden', transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
          transform: hov ? 'translateY(-5px)' : 'none',
          boxShadow: hov ? '0 20px 50px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.25)',
          height: '100%', display: 'flex', flexDirection: 'column', opacity: oos ? 0.6 : 1,
          position: 'relative',
        }}
      >
        {/* shimmer top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(16,185,129,0.4),transparent)', opacity: hov ? 1 : 0, transition: 'opacity 0.3s' }} />

        {/* rank */}
        {rank && (
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#f59e0b' }}>
            {toFa(rank)}
          </div>
        )}

        {/* discount circle */}
        {hasDisc && product.discountPercent && !rank && (
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#dc2626,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff', boxShadow: '0 4px 12px rgba(220,38,38,0.5)' }}>
            {toFa(product.discountPercent)}٪
          </div>
        )}

        {/* badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {product.isDailyDeal && (
            <span style={{ background: 'rgba(220,38,38,0.85)', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#fff', backdropFilter: 'blur(8px)' }}>🔥 پیشنهاد روز</span>
          )}
          {product.isOfficialStore && (
            <span style={{ background: 'rgba(16,185,129,0.85)', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#fff', backdropFilter: 'blur(8px)' }}>
              <i className="ti ti-verified" style={{ marginLeft: 2 }} />رسمی
            </span>
          )}
        </div>

        {/* image */}
        <div style={{ aspectRatio: '1', overflow: 'hidden', flexShrink: 0, position: 'relative', background: 'rgba(255,255,255,0.03)' }}>
          <img src={img} alt={product.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: hov ? 'scale(1.07)' : 'scale(1)' }}
            onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-3.jpg'; }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(6,13,10,0.7) 100%)', opacity: hov ? 1 : 0.4, transition: 'opacity 0.3s' }} />
          {oos && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, border: '1px solid rgba(255,255,255,0.5)', padding: '4px 14px', borderRadius: 8 }}>ناموجود</span>
            </div>
          )}
        </div>

        {/* body */}
        <div style={{ padding: '12px 14px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ fontSize: 10, color: 'rgba(240,250,245,0.3)', margin: 0 }}>
            {CATEGORIES.find(c => c.value === product.category)?.label} · {product.condition === 'new' ? 'نو' : 'دست دوم'}
          </p>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#f0faf5', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
            {product.title}
          </h3>
          {/* stars */}
          <div style={{ display: 'flex', gap: 2 }}>
            {[1,2,3,4,5].map(i => (
              <i key={i} className={`ti ti-star${i <= 4 ? '-filled' : ''}`} style={{ fontSize: 11, color: i <= 4 ? '#f59e0b' : 'rgba(255,255,255,0.1)' }} />
            ))}
          </div>
        </div>

        {/* footer */}
        <div style={{ padding: '10px 14px 14px', marginTop: 'auto' }}>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 10 }} />
          {hasDisc && (
            <p style={{ fontSize: 11, color: 'rgba(240,250,245,0.3)', textDecoration: 'line-through', margin: '0 0 2px', lineHeight: 1 }}>{fmt(product.price)} تومان</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 15, fontWeight: 900, color: '#10b981', margin: 0, letterSpacing: '-0.02em' }}>
              {fmt(finalPrice)} <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(240,250,245,0.4)' }}>تومان</span>
            </p>
            <span style={{ fontSize: 10, color: 'rgba(240,250,245,0.3)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <i className="ti ti-map-pin" style={{ fontSize: 11, color: '#10b981' }} />{product.city}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Skeleton ── */
function SkeletonCard() {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 18, overflow: 'hidden', position: 'relative' }}>
      <div style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.04)' }} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '40%' }} />
        <div style={{ height: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} />
        <div style={{ height: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '70%' }} />
        <div style={{ height: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '50%', marginTop: 4 }} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.03),transparent)', animation: 'shimmer 1.5s infinite' }} />
    </div>
  );
}

/* ── پیشنهاد شگفت‌انگیز ── */
function DealSection({ products }: { products: Product[] }) {
  const deals = products.filter(p => p.isDailyDeal || p.isSpecialSale || (p.discountPercent && p.discountPercent >= 10));
  if (deals.length === 0) return null;
  return (
    <div style={{ marginBottom: 32, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(239,68,68,0.25)', position: 'relative', background: 'linear-gradient(135deg,#1a0808 0%,#100505 100%)' }}>
      {/* orbs */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(239,68,68,0.15) 0%,transparent 65%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(249,115,22,0.1) 0%,transparent 65%)', filter: 'blur(30px)', pointerEvents: 'none' }} />

      {/* shimmer top */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(239,68,68,0.6),transparent)' }} />

      {/* header */}
      <div style={{ position: 'relative', padding: '20px 22px', borderBottom: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg,#dc2626,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(220,38,38,0.5)', flexShrink: 0 }}>
            <i className="ti ti-flame" style={{ fontSize: 22, color: '#fff' }} />
          </div>
          <div>
            <p style={{ fontSize: 17, fontWeight: 900, color: '#fff', margin: '0 0 3px', letterSpacing: '-0.02em' }}>پیشنهاد شگفت‌انگیز</p>
            <p style={{ fontSize: 11, color: 'rgba(255,150,150,0.6)', margin: 0 }}>تخفیف‌های استثنایی — فقط تا:</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <CountdownTimer />
          <Link href="/shop?sort=price_desc" style={{ fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', textDecoration: 'none', background: 'rgba(239,68,68,0.08)', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
            مشاهده همه
          </Link>
        </div>
      </div>

      {/* products */}
      <div style={{ position: 'relative', padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
        {deals.slice(0, 6).map(p => {
          const img = getImage(p);
          const finalPrice = p.discountPrice ?? p.price;
          return (
            <Link key={p.id} href={`/shop/${p.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', transition: 'all 0.3s' }}>
                <div style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative' }}>
                  <img src={img} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-3.jpg'; }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.6) 100%)' }} />
                  {p.discountPercent ? (
                    <div style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#dc2626,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff', boxShadow: '0 0 10px rgba(220,38,38,0.6)' }}>
                      {toFa(p.discountPercent)}٪
                    </div>
                  ) : null}
                </div>
                <div style={{ padding: '10px 10px 12px' }}>
                  <p style={{ fontSize: 11, color: 'rgba(240,250,245,0.7)', margin: '0 0 6px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title}</p>
                  {p.discountPrice && <p style={{ fontSize: 10, color: 'rgba(240,250,245,0.3)', textDecoration: 'line-through', margin: '0 0 2px', lineHeight: 1 }}>{fmt(p.price)} ت</p>}
                  <p style={{ fontSize: 13, fontWeight: 900, color: '#10b981', margin: 0, letterSpacing: '-0.01em' }}>{fmt(finalPrice)} <span style={{ fontSize: 9, color: 'rgba(240,250,245,0.35)', fontWeight: 400 }}>تومان</span></p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ── آگهی ── */
function AdBanner() {
  return (
    <div style={{ marginBottom: 32, borderRadius: 20, overflow: 'hidden', height: 112, position: 'relative', border: '1px solid rgba(245,158,11,0.2)', cursor: 'pointer' }}>
      <img src="/images/snooker-table.jpg" alt="تبلیغ" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.35)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.3) 50%,rgba(245,158,11,0.12) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(16px,3vw,28px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-speakerphone" style={{ fontSize: 22, color: '#f59e0b' }} />
          </div>
          <div>
            <p style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, letterSpacing: '0.15em', margin: '0 0 3px' }}>فضای تبلیغاتی</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 2px', letterSpacing: '-0.01em' }}>آگهی کسب‌وکار خود را اینجا ثبت کنید</p>
            <p style={{ fontSize: 11, color: 'rgba(240,250,245,0.4)', margin: 0 }}>به هزاران بازیکن بیلیارد دسترسی پیدا کنید</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: 'rgba(240,250,245,0.4)', margin: '0 0 2px' }}>از</p>
            <p style={{ fontSize: 15, fontWeight: 900, color: '#f59e0b', margin: 0 }}>{toFa('500,000')} <span style={{ fontSize: 10, color: 'rgba(240,250,245,0.4)', fontWeight: 400 }}>تومان</span></p>
          </div>
          <button style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', fontWeight: 800, fontSize: 12, padding: '10px 20px', borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 18px rgba(245,158,11,0.35)', whiteSpace: 'nowrap' }}>
            تماس بگیرید
          </button>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 10, right: 14, background: '#f59e0b', color: '#000', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>آگهی</div>
    </div>
  );
}

/* ── پرفروش‌ترین‌ها ── */
function BestSellers({ products }: { products: Product[] }) {
  const best = [...products].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);
  if (best.length === 0) return null;
  return (
    <div style={{ marginBottom: 32, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(245,158,11,0.15)', position: 'relative', background: 'linear-gradient(135deg,#0c0e00,#0d1117)' }}>
      <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 400, height: 120, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(245,158,11,0.08) 0%,transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '50%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.5),transparent)' }} />

      <div style={{ position: 'relative', padding: '20px 22px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 22px rgba(245,158,11,0.4)', flexShrink: 0 }}>
              <i className="ti ti-trophy" style={{ fontSize: 20, color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '0 0 2px', letterSpacing: '-0.02em' }}>پرفروش‌ترین‌ها</h2>
              <p style={{ fontSize: 11, color: 'rgba(240,250,245,0.35)', margin: 0 }}>محبوب‌ترین محصولات بازیکنان</p>
            </div>
          </div>
          <Link href="/shop?sort=popular" style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            مشاهده همه <i className="ti ti-chevron-left" style={{ fontSize: 14 }} />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
          {best.map((p, i) => <ProductCard key={p.id} product={p} rank={i + 1} />)}
        </div>
      </div>
    </div>
  );
}

/* ── برندها ── */
function BrandsSection() {
  return (
    <div style={{ marginBottom: 32, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(99,102,241,0.15)', position: 'relative', background: 'linear-gradient(135deg,#080e1a,#0d1117)' }}>
      <div style={{ position: 'absolute', top: -40, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,0.08) 0%,transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -40, left: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '40%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(99,102,241,0.5),transparent)' }} />

      <div style={{ position: 'relative', padding: '20px 22px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(135deg,#10b981,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 22px rgba(16,185,129,0.35)', flexShrink: 0 }}>
              <i className="ti ti-stars" style={{ fontSize: 20, color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '0 0 2px', letterSpacing: '-0.02em' }}>محبوب‌ترین برندها</h2>
              <p style={{ fontSize: 11, color: 'rgba(240,250,245,0.35)', margin: 0 }}>برندهای برتر بیلیارد جهان</p>
            </div>
          </div>
          <Link href="/shop" style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            مشاهده همه <i className="ti ti-chevron-left" style={{ fontSize: 14 }} />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {BRANDS.map(brand => (
            <Link key={brand.name} href={`/shop?search=${brand.name}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
              <div style={{ width: '100%', aspectRatio: '1', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', transition: 'all 0.3s', position: 'relative' }}>
                <img src={brand.img} alt={brand.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75, transition: 'all 0.3s' }}
                  onError={e => { (e.target as HTMLImageElement).src = '/images/pool_chalk_1.jpg'; }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(99,102,241,0.1))', opacity: 0, transition: 'opacity 0.3s' }} />
              </div>
              <p style={{ fontSize: 10, color: 'rgba(240,250,245,0.5)', fontWeight: 600, textAlign: 'center', margin: 0 }}>{brand.name}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [total, setTotal]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState('all');
  const [sort, setSort]         = useState('newest');
  const [search, setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]         = useState(1);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ category, sort, page: String(page), limit: '16' });
      if (search) params.set('search', search);
      const res  = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا');
      setProducts(data.products); setTotal(data.total); setTotalPages(data.totalPages);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [category, sort, search, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { setPage(1); }, [category, sort, search]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const isFiltered = !!search || category !== 'all';
  const currentSort = SORT_OPTIONS.find(o => o.value === sort) ?? SORT_OPTIONS[0]!;

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;900&display=swap');
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        .srch{ background:transparent;border:none;outline:none;color:#f0faf5;font-size:14px;font-family:inherit;width:100% }
        .srch::placeholder{ color:rgba(240,250,245,0.22) }
        .cat-btn{ transition:all 0.2s;cursor:pointer;font-family:inherit }
        .cat-btn:hover{ background:rgba(16,185,129,0.1)!important;border-color:rgba(16,185,129,0.3)!important;color:#10b981!important }
        .dd-item:hover{ background:rgba(16,185,129,0.08)!important;color:#10b981!important }
        .prod-grid{ display:grid;grid-template-columns:repeat(4,1fr);gap:14px }
        @media(max-width:1024px){ .prod-grid{grid-template-columns:repeat(3,1fr)} }
        @media(max-width:700px) { .prod-grid{grid-template-columns:repeat(2,1fr);gap:10px} }
        .brands-grid{ display:grid;grid-template-columns:repeat(4,1fr);gap:10px }
        @media(max-width:600px){ .brands-grid{grid-template-columns:repeat(4,1fr)} }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#020806 0%,#060d0a 100%)', direction: 'rtl', fontFamily: 'Vazirmatn, sans-serif', paddingBottom: 60 }}>

        {/* ══ HERO ══ */}
        <div style={{ position: 'relative', background: 'rgba(2,8,6,0.98)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: 'clamp(24px,4vw,44px) clamp(16px,4vw,40px) 0', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-30%', right: '-5%', width: '45vw', height: '45vw', maxWidth: 440, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(16,185,129,0.08) 0%,transparent 65%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-20%', left: '10%', width: '35vw', height: '35vw', maxWidth: 340, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(99,102,241,0.06) 0%,transparent 65%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(16,185,129,0.6)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: 8 }}>BILLIARD MARKET</div>
                <h1 style={{ fontSize: 'clamp(22px,4vw,38px)', fontWeight: 900, color: '#f0faf5', margin: '0 0 6px', letterSpacing: '-0.03em' }}>بیلیارد بازار</h1>
                <p style={{ fontSize: 13, color: 'rgba(240,250,245,0.35)', margin: 0 }}>بزرگ‌ترین مارکت‌پلیس تجهیزات بیلیارد ایران</p>
              </div>
              <Link href="/shop/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 14, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 22px rgba(16,185,129,0.3)', flexShrink: 0 }}>
                <i className="ti ti-plus" style={{ fontSize: 16 }} /> ثبت آگهی رایگان
              </Link>
            </div>

            {/* category pills */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 20, WebkitOverflowScrolling: 'touch' }}>
              {CATEGORIES.map(cat => (
                <button key={cat.value} className="cat-btn" onClick={() => setCategory(cat.value)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, border: `1px solid ${category === cat.value ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.07)'}`, background: category === cat.value ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)', color: category === cat.value ? '#10b981' : 'rgba(240,250,245,0.45)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <i className={`ti ${cat.icon}`} style={{ fontSize: 14 }} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ══ TOOLBAR ══ */}
        <div style={{ background: 'rgba(2,8,6,0.97)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '10px clamp(16px,4vw,40px)', position: 'sticky', top: 62, zIndex: 90, backdropFilter: 'blur(24px)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>

            {/* Search */}
            <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0 14px', height: 44, flex: 1, minWidth: 180, maxWidth: 360, transition: 'all 0.3s' }}>
              <i className="ti ti-search" style={{ fontSize: 16, color: 'rgba(240,250,245,0.25)', flexShrink: 0 }} />
              <input className="srch" type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="جستجو در بیلیارد بازار..." />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(''); setSearch(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,250,245,0.3)', padding: 0, display: 'flex', flexShrink: 0 }}>
                  <i className="ti ti-x" style={{ fontSize: 14 }} />
                </button>
              )}
            </form>

            {/* Sort dropdown */}
            <div ref={sortRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button onClick={() => setSortOpen(p => !p)} style={{ height: 44, display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', borderRadius: 12, border: `1px solid ${sortOpen ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`, background: sortOpen ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)', color: 'rgba(240,250,245,0.7)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                <i className={`ti ${currentSort.icon}`} style={{ fontSize: 14 }} />
                {currentSort.label}
                <i className="ti ti-chevron-down" style={{ fontSize: 12, transition: 'transform 0.3s', transform: sortOpen ? 'rotate(180deg)' : 'none', opacity: 0.5 }} />
              </button>
              {sortOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 170, background: 'rgba(5,12,8,0.99)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 14, padding: 6, zIndex: 999, boxShadow: '0 24px 60px rgba(0,0,0,0.85)', backdropFilter: 'blur(40px)' }}>
                  {SORT_OPTIONS.map(opt => (
                    <button key={opt.value} className="dd-item" onClick={() => { setSort(opt.value); setSortOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, border: 'none', background: sort === opt.value ? 'rgba(16,185,129,0.1)' : 'transparent', color: sort === opt.value ? '#10b981' : 'rgba(240,250,245,0.6)', fontSize: 13, fontWeight: sort === opt.value ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'right' }}>
                      <i className={`ti ${opt.icon}`} style={{ fontSize: 14 }} />
                      {opt.label}
                      {sort === opt.value && <span style={{ marginRight: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* count */}
            <span style={{ fontSize: 12, color: 'rgba(240,250,245,0.3)', whiteSpace: 'nowrap' }}>
              {!loading && <>{toFa(total)} محصول</>}
            </span>
          </div>
        </div>

        {/* ══ CONTENT ══ */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(20px,3vw,36px) clamp(16px,3vw,32px)' }}>

          {/* layout */}
          <div style={{ display: 'flex', gap: 24 }}>

            {/* sidebar */}
            <aside style={{ width: 200, flexShrink: 0, display: 'none' }} className="shop-sidebar">
              <div style={{ position: 'sticky', top: 120, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,250,245,0.35)', letterSpacing: '0.15em', margin: 0 }}>دسته‌بندی</p>
                  </div>
                  {CATEGORIES.map(cat => (
                    <button key={cat.value} onClick={() => setCategory(cat.value)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', background: category === cat.value ? 'rgba(16,185,129,0.08)' : 'transparent', borderRight: category === cat.value ? '2px solid #10b981' : '2px solid transparent', border: 'none', color: category === cat.value ? '#10b981' : 'rgba(240,250,245,0.45)', fontSize: 13, fontWeight: category === cat.value ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right', transition: 'all 0.2s' }}>
                      <i className={`ti ${cat.icon}`} style={{ fontSize: 15 }} />{cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* main */}
            <main style={{ flex: 1, minWidth: 0 }}>
              {/* search tag */}
              {search && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: 'rgba(240,250,245,0.4)' }}>نتایج جستجو:</span>
                  <span style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontSize: 12, padding: '4px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {search}
                    <button onClick={() => { setSearch(''); setSearchInput(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(16,185,129,0.6)', padding: 0, display: 'flex', fontSize: 14 }}>×</button>
                  </span>
                </div>
              )}

              {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>{error}</div>
              )}

              {/* section header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f0faf5', margin: 0 }}>
                  {category !== 'all' ? CATEGORIES.find(c => c.value === category)?.label : 'همه محصولات'}
                  {search && ` — "${search}"`}
                </h2>
                {!loading && <span style={{ fontSize: 12, color: 'rgba(240,250,245,0.3)' }}>{toFa(total)} محصول</span>}
              </div>

              {/* grid */}
              {loading ? (
                <div className="prod-grid">
                  {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                  <div style={{ fontSize: 48, opacity: 0.12, marginBottom: 14 }}>🎱</div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#f0faf5', margin: '0 0 8px' }}>محصولی یافت نشد</h3>
                  <p style={{ fontSize: 13, color: 'rgba(240,250,245,0.3)', margin: 0 }}>دسته‌بندی دیگری را امتحان کنید</p>
                </div>
              ) : (
                <div className="prod-grid">
                  {products.map((p, i) => (
                    <div key={p.id} style={{ animation: `fadeUp 0.4s ease ${i * 0.04}s both` }}>
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
              )}

              {/* pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 32 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(240,250,245,0.5)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', opacity: page === 1 ? 0.3 : 1 }}>
                    ‹ قبلی
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                    .reduce<(number | '...')[]>((acc, p, i, arr) => {
                      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                      acc.push(p); return acc;
                    }, [])
                    .map((p, i) => p === '...'
                      ? <span key={`d${i}`} style={{ color: 'rgba(240,250,245,0.3)', padding: '0 4px' }}>...</span>
                      : <button key={p} onClick={() => setPage(p as number)} style={{ width: 36, height: 36, borderRadius: 9, border: 'none', background: p === page ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.04)', color: p === page ? '#fff' : 'rgba(240,250,245,0.5)', fontSize: 13, fontWeight: p === page ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', boxShadow: p === page ? '0 4px 12px rgba(16,185,129,0.3)' : 'none' }}>
                        {toFa(p as number)}
                      </button>
                    )}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(240,250,245,0.5)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', opacity: page === totalPages ? 0.3 : 1 }}>
                    بعدی ›
                  </button>
                </div>
              )}
            </main>
          </div>

          {/* special sections */}
          {!isFiltered && !loading && (
            <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 0 }}>
              <DealSection products={products} />
              <AdBanner />
              <div style={{ marginTop: 32 }}>
                <BestSellers products={products} />
              </div>
              <BrandsSection />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

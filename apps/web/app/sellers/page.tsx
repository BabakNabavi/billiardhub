'use client';

import { useState } from 'react';
import Link from 'next/link';

const SELLERS = [
  { id: '1', name: 'فروشگاه تجهیزات بیلیارد آریا', city: 'تهران', verified: true, elite: true, rating: 4.8, reviewCount: 247, productCount: 312, since: '۱۳۸۵', brands: ['Predator', 'Mezz', 'McDermott'], specialties: ['چوب حرفه‌ای', 'میز', 'لوازم جانبی'], responseTime: '۲ ساعت', emoji: '🎱' },
  { id: '2', name: 'بیلیارد سنتر تهران', city: 'تهران', verified: true, elite: false, rating: 4.5, reviewCount: 124, productCount: 189, since: '۱۳۹۲', brands: ['Riley', 'Fury', 'BCE'], specialties: ['چوب', 'توپ'], responseTime: '۴ ساعت', emoji: '🎯' },
  { id: '3', name: 'فروشگاه اکبری بیلیارد', city: 'اصفهان', verified: false, elite: false, rating: 4.2, reviewCount: 56, productCount: 78, since: '۱۳۹۸', brands: ['Fury', 'Viper'], specialties: ['چوب', 'لوازم جانبی'], responseTime: '۸ ساعت', emoji: '🏆' },
  { id: '4', name: 'آنلاین بیلیارد شاپ', city: 'مشهد', verified: true, elite: false, rating: 4.6, reviewCount: 89, productCount: 145, since: '۱۴۰۰', brands: ['McDermott', 'Lucasi'], specialties: ['چوب', 'کیف چوب'], responseTime: '۱ ساعت', emoji: '💎' },
];

const CITIES = ['همه', 'تهران', 'اصفهان', 'مشهد', 'شیراز'];

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={11} height={11} viewBox="0 0 24 24" fill={i <= Math.round(rating) ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function SellersPage() {
  const [activeCity, setActiveCity] = useState('همه');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sort, setSort] = useState<'rating' | 'products' | 'newest'>('rating');

  const filtered = SELLERS
    .filter(s => activeCity === 'همه' || s.city === activeCity)
    .filter(s => !onlyVerified || s.verified)
    .sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'products') return b.productCount - a.productCount;
      return parseInt(b.since.replace('۱', '1').replace('۳', '3')) - parseInt(a.since.replace('۱', '1').replace('۳', '3'));
    });

  return (
    <div style={{ background: '#F7F7F5', minHeight: '100vh', color: '#111111', fontFamily: 'Vazirmatn, system-ui', direction: 'rtl' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #051a10 0%, #030d08 100%)', padding: 'clamp(40px, 8vw, 80px) clamp(16px, 4vw, 32px) clamp(28px, 5vw, 48px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(199,166,106,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.25)', color: '#C7A66A', fontSize: 12, padding: '5px 16px', borderRadius: 20, marginBottom: 16, fontWeight: 600 }}>
            🏪 فروشندگان تجهیزات
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 5vw, 36px)', fontWeight: 900, margin: '0 0 12px', background: 'linear-gradient(135deg, #f0faf5, #C7A66A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            فروشگاه‌های تجهیزات بیلیارد
          </h1>
          <p style={{ color: '#6b7280', fontSize: 'clamp(13px, 2vw, 15px)', margin: 0, lineHeight: 1.7 }}>
            بهترین فروشگاه‌های چوب، میز، توپ و لوازم جانبی بیلیارد در ایران
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 32px)' }}>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28, alignItems: 'center' }}>
          {/* City filter */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0 }}>
            {CITIES.map(city => (
              <button key={city} onClick={() => setActiveCity(city)} style={{
                background: activeCity === city ? '#C7A66A' : 'rgba(0,0,0,0.04)',
                border: `1px solid ${activeCity === city ? '#C7A66A' : 'rgba(0,0,0,0.06)'}`,
                color: activeCity === city ? '#010604' : '#94a3b8',
                padding: '7px 14px', borderRadius: 20, fontSize: 12,
                fontWeight: activeCity === city ? 700 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
              }}>{city}</button>
            ))}
          </div>
          {/* Verified toggle */}
          <button onClick={() => setOnlyVerified(!onlyVerified)} style={{
            background: onlyVerified ? 'rgba(199,166,106,0.15)' : 'rgba(0,0,0,0.04)',
            border: `1px solid ${onlyVerified ? 'rgba(199,166,106,0.4)' : 'rgba(0,0,0,0.06)'}`,
            color: onlyVerified ? '#C7A66A' : '#94a3b8',
            padding: '7px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
          }}>✓ تأیید شده</button>
          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value as any)} style={{
            background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)',
            color: 'rgba(0,0,0,0.50)', padding: '7px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
            marginRight: 'auto',
          }}>
            <option value="rating">مرتب: بهترین امتیاز</option>
            <option value="products">مرتب: بیشترین محصول</option>
            <option value="newest">مرتب: جدیدترین</option>
          </select>
        </div>

        {/* Results count */}
        <div style={{ color: '#4b5563', fontSize: 13, marginBottom: 20 }}>
          {filtered.length} فروشگاه یافت شد
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 16, marginBottom: 48 }}>
          {filtered.map(seller => (
            <Link key={seller.id} href={`/sellers/${seller.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                background: 'linear-gradient(135deg, #0d1f18, #0a1912)',
                border: '1px solid rgba(199,166,106,0.1)', borderRadius: 18,
                overflow: 'hidden', transition: 'all 0.3s', cursor: 'pointer', height: '100%',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(199,166,106,0.35)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(199,166,106,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(199,166,106,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
              >
                {/* Card Header */}
                <div style={{ height: 90, background: 'linear-gradient(135deg, rgba(199,166,106,0.06), rgba(6,182,212,0.04))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, position: 'relative', opacity: 0.7 }}>
                  {seller.emoji}
                  {seller.elite && (
                    <div style={{ position: 'absolute', top: 10, right: 12, background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b', fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                      ⭐ نماینده رسمی
                    </div>
                  )}
                </div>
                {/* Card Body */}
                <div style={{ padding: '16px 18px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <h3 style={{ color: '#111111', fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.4, flex: 1 }}>{seller.name}</h3>
                    {seller.verified && (
                      <span style={{ background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.25)', color: '#C7A66A', fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 600, flexShrink: 0, marginRight: 8 }}>✓</span>
                    )}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 12 }}>📍 {seller.city} | از {seller.since}</div>
                  {/* Rating row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <StarRating rating={seller.rating} />
                    <span style={{ color: '#111111', fontSize: 13, fontWeight: 700 }}>{seller.rating}</span>
                    <span style={{ color: '#6b7280', fontSize: 12 }}>({seller.reviewCount} نظر)</span>
                    <span style={{ color: '#6b7280', fontSize: 12, marginRight: 'auto' }}>📦 {seller.productCount} محصول</span>
                  </div>
                  {/* Brands */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {seller.brands.slice(0, 3).map(b => (
                      <span key={b} style={{ background: 'rgba(199,166,106,0.08)', border: '1px solid rgba(199,166,106,0.15)', color: '#C7A66A', fontSize: 10, padding: '2px 8px', borderRadius: 10 }}>{b}</span>
                    ))}
                  </div>
                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                    <span style={{ color: '#4b5563', fontSize: 11 }}>⚡ پاسخ در {seller.responseTime}</span>
                    <span style={{ color: '#C7A66A', fontSize: 12, fontWeight: 600 }}>مشاهده فروشگاه ←</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

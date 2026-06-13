'use client';

import { useState } from 'react';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  image: string;
  badge?: string;
  rating: number;
  sold: number;
}

interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  product: string;
}

// ─── Seller Type ──────────────────────────────────────────────────────────────
interface SellerData {
  id: string; name: string; slug: string; verified: boolean; elite: boolean;
  cover: string; logo: string; tagline: string; since: string; city: string;
  rating: number; reviewCount: number; productCount: number; totalSales: number;
  responseTime: string; about: string; brands: string[]; categories: string[];
  phone: string; email: string; address: string; workHours: string;
  products: Product[]; reviews: Review[];
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_SELLERS: Record<string, SellerData> = {
  '1': {
    id: '1',
    name: 'فروشگاه تجهیزات بیلیارد آریا',
    slug: 'arya-billiard',
    verified: true,
    elite: true,
    cover: '',
    logo: '',
    tagline: 'تأمین‌کننده رسمی تجهیزات حرفه‌ای بیلیارد در ایران',
    since: '۱۳۸۵',
    city: 'تهران',
    rating: 4.8,
    reviewCount: 247,
    productCount: 312,
    totalSales: 1850,
    responseTime: '۲ ساعت',
    about: 'فروشگاه آریا با بیش از ۱۸ سال سابقه، نماینده رسمی برندهای معتبر جهانی در ایران است. ما با تیمی متخصص، بهترین تجهیزات بیلیارد شامل چوب، میز، توپ و لوازم جانبی را مستقیم از تولیدکنندگان اصلی وارد و عرضه می‌کنیم.',
    brands: ['Predator', 'Mezz', 'McDermott', 'Riley', 'Fury', 'Lucasi'],
    categories: ['چوب بیلیارد', 'میز بیلیارد', 'توپ', 'کِیس چوب', 'آموزشی', 'لوازم جانبی'],
    phone: '۰۲۱-۸۸۴۵۶۷۸۹',
    email: 'info@arya-billiard.ir',
    address: 'تهران، خیابان ولیعصر، پلاک ۱۲۴',
    workHours: 'شنبه تا چهارشنبه ۹-۲۰ | پنجشنبه ۹-۱۵',
    products: [
      { id: 'p1', name: 'چوب Predator REVO 12.4', category: 'چوب بیلیارد', price: '۱۸,۵۰۰,۰۰۰', image: '', badge: 'پرفروش', rating: 4.9, sold: 89 },
      { id: 'p2', name: 'چوب Mezz EC7-WH', category: 'چوب بیلیارد', price: '۸,۲۰۰,۰۰۰', image: '', badge: 'جدید', rating: 4.7, sold: 43 },
      { id: 'p3', name: 'میز Riley Tournament Pro', category: 'میز بیلیارد', price: '۱۲۴,۰۰۰,۰۰۰', image: '', badge: '', rating: 4.8, sold: 12 },
      { id: 'p4', name: 'ست توپ Aramith Premier', category: 'توپ', price: '۴,۸۰۰,۰۰۰', image: '', badge: 'پیشنهاد ویژه', rating: 4.6, sold: 156 },
      { id: 'p5', name: 'کیف چوب McDermott G-Series', category: 'کِیس چوب', price: '۲,۱۰۰,۰۰۰', image: '', badge: '', rating: 4.5, sold: 67 },
      { id: 'p6', name: 'گچ Master Diamond', category: 'لوازم جانبی', price: '۱۸۰,۰۰۰', image: '', badge: '', rating: 4.4, sold: 412 },
    ],
    reviews: [
      { id: 'r1', author: 'علی محمدی', avatar: '', rating: 5, date: '۱۴ خرداد ۱۴۰۴', text: 'چوب Predator واقعاً فوق‌العاده‌ست. ارسال سریع و بسته‌بندی عالی. قطعاً دوباره خرید می‌کنم.', product: 'چوب Predator REVO 12.4' },
      { id: 'r2', author: 'سارا حسینی', avatar: '', rating: 5, date: '۲ خرداد ۱۴۰۴', text: 'خدمات پس از فروش عالی. وقتی یه مشکل کوچیک داشتم سریع راهنمایی کردن.', product: 'میز Riley Tournament Pro' },
      { id: 'r3', author: 'رضا کریمی', avatar: '', rating: 4, date: '۲۸ اردیبهشت ۱۴۰۴', text: 'محصول اصل و قیمت مناسب نسبت به بازار. تنها ایراد تأخیر ۲ روزه در ارسال بود.', product: 'ست توپ Aramith Premier' },
    ],
  },
  '2': {
    id: '2', name: 'بیلیارد سنتر تهران', slug: 'billiard-center', verified: true, elite: false,
    cover: '', logo: '', tagline: 'بزرگترین مرکز تخصصی بیلیارد در پایتخت',
    since: '۱۳۹۲', city: 'تهران', rating: 4.5, reviewCount: 124, productCount: 189,
    totalSales: 940, responseTime: '۴ ساعت',
    about: 'بیلیارد سنتر با هدف ارائه تجهیزات باکیفیت به قیمت مناسب تأسیس شده است.',
    brands: ['Riley', 'Fury', 'BCE'], categories: ['چوب بیلیارد', 'توپ', 'لوازم جانبی'],
    phone: '۰۲۱-۷۷۸۹۰۱۲۳', email: 'info@billiardcenter.ir',
    address: 'تهران، خیابان انقلاب', workHours: 'شنبه تا پنجشنبه ۱۰-۲۰',
    products: [
      { id: 'p1', name: 'چوب Riley Club Pro', category: 'چوب بیلیارد', price: '۳,۲۰۰,۰۰۰', image: '', badge: '', rating: 4.3, sold: 67 },
      { id: 'p2', name: 'ست توپ BCE Premier', category: 'توپ', price: '۲,۸۰۰,۰۰۰', image: '', badge: 'تخفیف', rating: 4.2, sold: 89 },
      { id: 'p3', name: 'گچ Master', category: 'لوازم جانبی', price: '۱۵۰,۰۰۰', image: '', badge: '', rating: 4.0, sold: 234 },
      { id: 'p4', name: 'نگهدارنده چوب دیواری', category: 'لوازم جانبی', price: '۴۵۰,۰۰۰', image: '', badge: '', rating: 4.1, sold: 45 },
    ],
    reviews: [
      { id: 'r1', author: 'کامران نوری', avatar: '', rating: 4, date: '۱۰ خرداد ۱۴۰۴', text: 'قیمت‌ها مناسبه و سرویس خوبیه.', product: 'چوب Riley Club Pro' },
    ],
  },
  '3': {
    id: '3', name: 'فروشگاه اکبری بیلیارد', slug: 'akbari-billiard', verified: false, elite: false,
    cover: '', logo: '', tagline: 'تجهیزات بیلیارد برای همه سطوح',
    since: '۱۳۹۸', city: 'اصفهان', rating: 4.2, reviewCount: 56, productCount: 78,
    totalSales: 320, responseTime: '۸ ساعت',
    about: 'فروشگاه اکبری در اصفهان، خدمات بیلیارد را به استان‌های مرکزی کشور ارائه می‌دهد.',
    brands: ['Fury', 'Viper'], categories: ['چوب بیلیارد', 'توپ', 'لوازم جانبی'],
    phone: '۰۳۱-۳۶۵۴۳۲۱۰', email: 'akbari@gmail.com',
    address: 'اصفهان، خیابان چهارباغ', workHours: 'شنبه تا چهارشنبه ۱۰-۱۹',
    products: [
      { id: 'p1', name: 'چوب Viper Desperado', category: 'چوب بیلیارد', price: '۱,۸۰۰,۰۰۰', image: '', badge: '', rating: 4.0, sold: 34 },
      { id: 'p2', name: 'توپ Fury Set', category: 'توپ', price: '۱,۲۰۰,۰۰۰', image: '', badge: '', rating: 3.9, sold: 56 },
    ],
    reviews: [],
  },
  '4': {
    id: '4', name: 'آنلاین بیلیارد شاپ', slug: 'online-billiard', verified: true, elite: false,
    cover: '', logo: '', tagline: 'خرید آنلاین تجهیزات بیلیارد با ضمانت اصالت',
    since: '۱۴۰۰', city: 'مشهد', rating: 4.6, reviewCount: 89, productCount: 145,
    totalSales: 680, responseTime: '۱ ساعت',
    about: 'اولین فروشگاه اختصاصی آنلاین بیلیارد با ارسال سراسری و ضمانت برگشت ۷ روزه.',
    brands: ['McDermott', 'Lucasi', 'Predator'], categories: ['چوب بیلیارد', 'کِیس چوب', 'لوازم جانبی'],
    phone: '۰۵۱-۳۵۶۷۸۹۰۱', email: 'shop@onlinebilliard.ir',
    address: 'مشهد، خیابان امام رضا', workHours: '۲۴/۷ آنلاین',
    products: [
      { id: 'p1', name: 'چوب Lucasi Custom LHC97MB', category: 'چوب بیلیارد', price: '۶,۴۰۰,۰۰۰', image: '', badge: 'انحصاری', rating: 4.7, sold: 28 },
      { id: 'p2', name: 'کیف چوب Predator Sport', category: 'کِیس چوب', price: '۱,۶۰۰,۰۰۰', image: '', badge: '', rating: 4.5, sold: 71 },
      { id: 'p3', name: 'گلاوه Predator Wrapless', category: 'لوازم جانبی', price: '۸۵۰,۰۰۰', image: '', badge: '', rating: 4.6, sold: 94 },
    ],
    reviews: [
      { id: 'r1', author: 'ناهید صادقی', avatar: '', rating: 5, date: '۸ خرداد ۱۴۰۴', text: 'ارسال خیلی سریع بود. محصول اصل.', product: 'چوب Lucasi Custom' },
    ],
  },
};

// ─── Category Color Map ───────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  'چوب بیلیارد': '#10b981',
  'میز بیلیارد': '#a78bfa',
  'توپ': '#f59e0b',
  'کِیس چوب': '#06b6d4',
  'آموزشی': '#f97316',
  'لوازم جانبی': '#94a3b8',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icons = {
  star: (filled = true) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  verified: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#10b981" stroke="none">
      <path d="M12 2L13.9 7.5H20L14.9 11L16.8 16.5L12 13L7.2 16.5L9.1 11L4 7.5H10.1L12 2Z" />
    </svg>
  ),
  phone: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.61 4.5 2 2 0 0 1 3.6 2.33h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  email: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  location: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  clock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  cart: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  chat: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  share: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  ),
  arrow: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
};

// ─── Sub-components ────────────────────────────────────────────────────────────
function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? '#f59e0b' : 'none'}
          stroke="#f59e0b" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const catColor = CAT_COLORS[product.category] || '#10b981';
  return (
    <div style={{
      background: 'linear-gradient(145deg, #0d1f18, #0a1912)',
      border: '1px solid rgba(16,185,129,0.12)',
      borderRadius: 16,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(16,185,129,0.4)';
      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(16,185,129,0.12)';
      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
    }}
    >
      {/* Image placeholder */}
      <div style={{
        height: 180,
        background: `linear-gradient(135deg, ${catColor}18, ${catColor}08)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{ fontSize: 48, opacity: 0.3 }}>🎱</div>
        {product.badge && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: product.badge === 'پرفروش' ? '#10b981' : product.badge === 'جدید' ? '#06b6d4' : '#f59e0b',
            color: '#010604', fontSize: 11, fontWeight: 700,
            padding: '3px 10px', borderRadius: 20,
          }}>{product.badge}</div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ fontSize: 11, color: catColor, marginBottom: 6, fontWeight: 600 }}>
          {product.category}
        </div>
        <div style={{ color: '#f0faf5', fontSize: 14, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>
          {product.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <StarRating rating={product.rating} size={12} />
          <span style={{ color: '#6b7280', fontSize: 11 }}>{product.sold} فروش</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#10b981', fontSize: 15, fontWeight: 700 }}>
            {product.price} <span style={{ fontSize: 11, fontWeight: 400 }}>تومان</span>
          </div>
          <button style={{
            background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
            color: '#10b981', padding: '6px 12px', borderRadius: 8,
            fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {Icons.cart()} افزودن
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function SellerDetailPage({ params }: { params: { id: string } }) {
  const id: string = params?.id ?? '1';
  const seller = (MOCK_SELLERS[id] ?? MOCK_SELLERS['1']) as SellerData;

  const [activeCategory, setActiveCategory] = useState('همه');
  const [activeTab, setActiveTab] = useState<'products' | 'about' | 'reviews'>('products');

  const allCategories = ['همه', ...seller.categories.filter(c =>
    seller.products.some(p => p.category === c)
  )];
  const filteredProducts = activeCategory === 'همه'
    ? seller.products
    : seller.products.filter(p => p.category === activeCategory);

  return (
    <div style={{ background: '#010604', minHeight: '100vh', color: '#f0faf5', fontFamily: 'Vazirmatn, system-ui', direction: 'rtl' }}>

      {/* ── Hero Cover ─────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 'clamp(180px, 28vw, 340px)', overflow: 'hidden' }}>
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(135deg, #051a10 0%, #0a1f14 40%, #061a18 100%)',
          position: 'relative',
        }}>
          {/* Animated dots pattern */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.08) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />
          {/* Glow orbs */}
          <div style={{ position: 'absolute', top: '20%', left: '10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.12), transparent 70%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)', filter: 'blur(30px)' }} />
          {/* Large billiard ball decorative */}
          <div style={{ position: 'absolute', left: '5%', top: '50%', transform: 'translateY(-50%)', fontSize: 'clamp(60px, 12vw, 120px)', opacity: 0.06 }}>🎱</div>
        </div>
        {/* Gradient overlay bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to top, #010604, transparent)' }} />
      </div>

      {/* ── Profile Header ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px, 4vw, 32px)' }}>
        <div style={{ marginTop: -60, position: 'relative', zIndex: 10, marginBottom: 32 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-end' }}>
            {/* Logo */}
            <div style={{
              width: 'clamp(80px, 14vw, 110px)', height: 'clamp(80px, 14vw, 110px)',
              borderRadius: 20,
              background: 'linear-gradient(135deg, #0d2b1e, #0a1f16)',
              border: '3px solid rgba(16,185,129,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'clamp(32px, 6vw, 48px)',
              flexShrink: 0,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>🎱</div>

            {/* Name + badges */}
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <h1 style={{ fontSize: 'clamp(18px, 3.5vw, 26px)', fontWeight: 800, margin: 0, color: '#f0faf5' }}>
                  {seller.name}
                </h1>
                {seller.verified && (
                  <span style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981', fontSize: 11, padding: '3px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                    ✓ تأیید شده
                  </span>
                )}
                {seller.elite && (
                  <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
                    ⭐ نماینده رسمی
                  </span>
                )}
              </div>
              <div style={{ color: '#6ee7b7', fontSize: 'clamp(12px, 2vw, 14px)', marginBottom: 10, opacity: 0.9 }}>
                {seller.tagline}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8', fontSize: 13 }}>
                  {Icons.location()} {seller.city}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8', fontSize: 13 }}>
                  📅 از {seller.since}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontSize: 13, fontWeight: 600 }}>
                  <StarRating rating={seller.rating} size={13} />
                  {seller.rating} ({seller.reviewCount} نظر)
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button style={{ background: '#10b981', color: '#010604', border: 'none', padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {Icons.chat()} پیام دادن
              </button>
              <button style={{ background: 'rgba(255,255,255,0.06)', color: '#f0faf5', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: 12, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {Icons.share()} اشتراک‌گذاری
              </button>
            </div>
          </div>
        </div>

        {/* ── Stats Bar ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 12, marginBottom: 32,
        }}>
          {[
            { label: 'محصولات', value: seller.productCount, icon: '📦', color: '#10b981' },
            { label: 'فروش موفق', value: seller.totalSales, icon: '✅', color: '#06b6d4' },
            { label: 'امتیاز', value: seller.rating + '/۵', icon: '⭐', color: '#f59e0b' },
            { label: 'زمان پاسخ', value: seller.responseTime, icon: '⚡', color: '#a78bfa' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'linear-gradient(135deg, #0d1f18, #0a1912)',
              border: '1px solid rgba(16,185,129,0.1)',
              borderRadius: 14, padding: '14px 16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{stat.icon}</div>
              <div style={{ fontSize: 'clamp(16px, 3vw, 22px)', fontWeight: 800, color: stat.color, marginBottom: 4 }}>
                {stat.value}
              </div>
              <div style={{ color: '#6b7280', fontSize: 12 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Brands Strip ───────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(90deg, #0d1f18, #0a1912, #0d1f18)',
          border: '1px solid rgba(16,185,129,0.1)',
          borderRadius: 14, padding: '14px 20px', marginBottom: 32,
          display: 'flex', alignItems: 'center', gap: 16, overflowX: 'auto',
        }}>
          <span style={{ color: '#6b7280', fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>برندهای نمایندگی:</span>
          {seller.brands.map(brand => (
            <span key={brand} style={{
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              color: '#10b981', padding: '5px 14px', borderRadius: 20,
              fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            }}>{brand}</span>
          ))}
        </div>

        {/* ── Tab Navigation ─────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 28,
          background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 4,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {(['products', 'about', 'reviews'] as const).map(tab => {
            const labels: Record<string, string> = { products: `محصولات (${seller.products.length})`, about: 'درباره فروشگاه', reviews: `نظرات (${seller.reviewCount})` };
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: 1, padding: '10px 4px', borderRadius: 10, border: 'none',
                background: activeTab === tab ? '#10b981' : 'transparent',
                color: activeTab === tab ? '#010604' : '#94a3b8',
                fontWeight: activeTab === tab ? 700 : 400,
                fontSize: 'clamp(12px, 2vw, 14px)', cursor: 'pointer', transition: 'all 0.2s',
              }}>{labels[tab]}</button>
            );
          })}
        </div>

        {/* ── Products Tab ───────────────────────────────────────────────── */}
        {activeTab === 'products' && (
          <div>
            {/* Category filter */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 24 }}>
              {allCategories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                  background: activeCategory === cat ? '#10b981' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${activeCategory === cat ? '#10b981' : 'rgba(255,255,255,0.08)'}`,
                  color: activeCategory === cat ? '#010604' : '#94a3b8',
                  padding: '7px 16px', borderRadius: 20, fontSize: 13,
                  fontWeight: activeCategory === cat ? 700 : 400,
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s',
                }}>{cat}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: 16, marginBottom: 48 }}>
              {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

        {/* ── About Tab ──────────────────────────────────────────────────── */}
        {activeTab === 'about' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 20, marginBottom: 48 }}>
            {/* About text */}
            <div style={{ background: 'linear-gradient(135deg, #0d1f18, #0a1912)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ color: '#10b981', fontSize: 16, fontWeight: 700, marginBottom: 14, marginTop: 0 }}>درباره فروشگاه</h3>
              <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.9, margin: 0 }}>{seller.about}</p>
            </div>
            {/* Contact info */}
            <div style={{ background: 'linear-gradient(135deg, #0d1f18, #0a1912)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ color: '#10b981', fontSize: 16, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>اطلاعات تماس</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: Icons.phone(), label: seller.phone },
                  { icon: Icons.email(), label: seller.email },
                  { icon: Icons.location(), label: seller.address },
                  { icon: Icons.clock(), label: seller.workHours },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, color: '#94a3b8', fontSize: 13 }}>
                    <span style={{ color: '#10b981', flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                    <span style={{ lineHeight: 1.5 }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Categories served */}
            <div style={{ background: 'linear-gradient(135deg, #0d1f18, #0a1912)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ color: '#10b981', fontSize: 16, fontWeight: 700, marginBottom: 14, marginTop: 0 }}>دسته‌بندی محصولات</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {seller.categories.map(cat => (
                  <span key={cat} style={{
                    background: `${CAT_COLORS[cat] || '#10b981'}15`,
                    border: `1px solid ${CAT_COLORS[cat] || '#10b981'}30`,
                    color: CAT_COLORS[cat] || '#10b981',
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  }}>{cat}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Reviews Tab ────────────────────────────────────────────────── */}
        {activeTab === 'reviews' && (
          <div style={{ marginBottom: 48 }}>
            {/* Rating summary */}
            <div style={{
              background: 'linear-gradient(135deg, #0d1f18, #0a1912)',
              border: '1px solid rgba(16,185,129,0.1)', borderRadius: 16,
              padding: 24, marginBottom: 20,
              display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 56, fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>{seller.rating}</div>
                <StarRating rating={seller.rating} size={18} />
                <div style={{ color: '#6b7280', fontSize: 13, marginTop: 6 }}>{seller.reviewCount} نظر</div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                {[5,4,3,2,1].map(star => (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ color: '#f59e0b', fontSize: 12, width: 8 }}>{star}</span>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                      <div style={{
                        height: '100%', borderRadius: 3, background: '#f59e0b',
                        width: star === 5 ? '70%' : star === 4 ? '20%' : star === 3 ? '7%' : '2%',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Review cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {seller.reviews.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0', fontSize: 14 }}>هنوز نظری ثبت نشده</div>
              ) : seller.reviews.map(review => (
                <div key={review.id} style={{
                  background: 'linear-gradient(135deg, #0d1f18, #0a1912)',
                  border: '1px solid rgba(16,185,129,0.1)', borderRadius: 14, padding: 20,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#10b981' }}>
                        {review.author.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f0faf5', fontSize: 14 }}>{review.author}</div>
                        <div style={{ color: '#4b5563', fontSize: 11 }}>{review.date}</div>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size={13} />
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7, marginBottom: 8 }}>{review.text}</div>
                  <div style={{ color: '#10b981', fontSize: 11, opacity: 0.7 }}>محصول: {review.product}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

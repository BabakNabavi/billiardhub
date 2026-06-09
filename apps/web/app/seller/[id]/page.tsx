// ==============================
// FILE: apps/web/app/sellers/[id]/page.tsx
// ==============================
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const SELLERS: Record<string, {
  id: string; name: string; shopName: string; city: string; category: string;
  phone: string; email: string; address: string; workingHours: string;
  description: string; products: { name: string; price: string; category: string }[];
  stats: { sales: number; rating: number; reviews: number; years: number };
  brands: string[]; avatar: string; verified: boolean;
}> = {
  '1': {
    id: '1', name: 'حسن محمدی', shopName: 'بیلیارد شاپ تهران', city: 'تهران',
    category: 'تجهیزات حرفه‌ای', phone: '02112345678', email: 'info@billiardshop.ir',
    address: 'تهران، خیابان ولیعصر، پلاک ۱۲۳',
    workingHours: 'شنبه تا پنجشنبه ۹ صبح تا ۹ شب',
    description: 'بزرگترین فروشگاه تخصصی بیلیارد در تهران با بیش از ۱۵ سال سابقه. عرضه‌کننده انحصاری برندهای معتبر اروپایی در ایران.',
    products: [
      { name: 'چوب اسنوکر Riley Conquest', price: '۴,۵۰۰,۰۰۰ تومان', category: 'چوب' },
      { name: 'توپ سنت پل حرفه‌ای', price: '۸۵۰,۰۰۰ تومان', category: 'توپ' },
      { name: 'کیف حمل دو چوب', price: '۳۵۰,۰۰۰ تومان', category: 'لوازم جانبی' },
      { name: 'گچ Master', price: '۱۸۰,۰۰۰ تومان', category: 'لوازم جانبی' },
    ],
    stats: { sales: 1240, rating: 4.8, reviews: 312, years: 15 },
    brands: ['Riley', 'Strachan', 'Simonis', 'Master', 'Aramith'],
    avatar: 'بش', verified: true,
  },
  '2': {
    id: '2', name: 'رضا علوی', shopName: 'آرادبیلیارد', city: 'اصفهان',
    category: 'میز و تجهیزات', phone: '03112345678', email: 'arad@billiard.ir',
    address: 'اصفهان، خیابان چهارباغ، پلاک ۵۵',
    workingHours: 'شنبه تا جمعه ۱۰ صبح تا ۸ شب',
    description: 'فروشگاه آرادبیلیارد با تخصص در فروش و نصب میزهای بیلیارد حرفه‌ای. خدمات پس از فروش کامل.',
    products: [
      { name: 'میز اسنوکر ۱۲ فوت حرفه‌ای', price: '۱۸۵,۰۰۰,۰۰۰ تومان', category: 'میز' },
      { name: 'میز پول آمریکایی ۹ فوت', price: '۹۵,۰۰۰,۰۰۰ تومان', category: 'میز' },
      { name: 'چراغ بیلیارد LED', price: '۳,۲۰۰,۰۰۰ تومان', category: 'نورپردازی' },
    ],
    stats: { sales: 486, rating: 4.6, reviews: 98, years: 8 },
    brands: ['Toulet', 'BCE', 'Dynamic'],
    avatar: 'آر', verified: true,
  },
  '3': {
    id: '3', name: 'فاطمه نوروزی', shopName: 'گرین بیلیارد', city: 'مشهد',
    category: 'لوازم جانبی', phone: '05112345678', email: 'green@billiard.ir',
    address: 'مشهد، بلوار پیروزی، پلاک ۲۰۰',
    workingHours: 'شنبه تا چهارشنبه ۱۰ صبح تا ۷ شب',
    description: 'فروشگاه تخصصی لوازم جانبی بیلیارد. گسترده‌ترین مجموعه گچ، نگهدارنده، و کیف بیلیارد در شرق کشور.',
    products: [
      { name: 'ست کامل لوازم بیلیارد', price: '۱,۲۰۰,۰۰۰ تومان', category: 'ست' },
      { name: 'چوب تمرینی', price: '۵۵۰,۰۰۰ تومان', category: 'چوب' },
      { name: 'نگهدارنده دیواری ۶ چوب', price: '۴۸۰,۰۰۰ تومان', category: 'نگهدارنده' },
    ],
    stats: { sales: 789, rating: 4.7, reviews: 201, years: 6 },
    brands: ['Master', 'Longoni', 'Kamui'],
    avatar: 'گب', verified: false,
  },
};

export default function SellerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const seller = SELLERS[id];

  if (!seller) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#010604', color: '#f0faf5' }}>
        <div className="text-6xl mb-4">🏪</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#10b981' }}>فروشگاه مورد نظر یافت نشد</h2>
        <p className="mb-6" style={{ color: '#6b7280' }}>شناسه فروشنده معتبر نیست</p>
        <button onClick={() => router.push('/sellers')}
          className="px-6 py-3 rounded-xl font-bold"
          style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)', color: '#010604' }}>
          بازگشت به فروشندگان
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#010604', color: '#f0faf5', fontFamily: 'Vazirmatn, sans-serif' }} dir="rtl">
      <div className="relative" style={{ background: 'linear-gradient(135deg,#050c08,#0a1a0f 50%,#050c08)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #10b981 0%, transparent 50%), radial-gradient(circle at 70% 30%, #06b6d4 0%, transparent 50%)' }} />
        <div className="relative max-w-4xl mx-auto px-4 py-12">
          <Link href="/sellers" className="inline-flex items-center gap-2 mb-8 text-sm hover:opacity-80" style={{ color: '#10b981' }}>
            ← بازگشت به فروشندگان
          </Link>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)', color: '#010604' }}>
              {seller.avatar}
            </div>
            <div className="flex-1 text-center sm:text-right">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                {seller.verified && (
                  <span className="text-xs px-3 py-1 rounded-full font-bold" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                    ✓ فروشنده تایید شده
                  </span>
                )}
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                  {seller.category}
                </span>
              </div>
              <h1 className="text-3xl font-black mb-1">{seller.shopName}</h1>
              <p style={{ color: '#6b7280' }}>{seller.name} · {seller.city}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'فروش موفق', value: seller.stats.sales.toLocaleString('fa'), color: '#10b981' },
            { label: 'سال سابقه', value: seller.stats.years, color: '#06b6d4' },
            { label: 'نظرات', value: seller.stats.reviews, color: '#a78bfa' },
            { label: 'امتیاز', value: `${seller.stats.rating} ⭐`, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: '#050c08', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div className="text-2xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color: '#6b7280' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl p-6" style={{ background: '#050c08', border: '1px solid rgba(16,185,129,0.15)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#10b981' }}>محصولات نمونه</h2>
            <div className="space-y-3">
              {seller.products.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
                  <div>
                    <div className="font-semibold text-sm">{p.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{p.category}</div>
                  </div>
                  <div className="text-sm font-bold" style={{ color: '#f59e0b' }}>{p.price}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-6" style={{ background: '#050c08', border: '1px solid rgba(16,185,129,0.15)' }}>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#10b981' }}>درباره فروشگاه</h2>
            <p className="leading-relaxed" style={{ color: '#9ca3af' }}>{seller.description}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl p-6" style={{ background: '#050c08', border: '1px solid rgba(16,185,129,0.15)' }}>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#10b981' }}>برندهای موجود</h2>
            <div className="flex flex-wrap gap-2">
              {seller.brands.map(b => (
                <span key={b} className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
                  {b}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-6" style={{ background: '#050c08', border: '1px solid rgba(16,185,129,0.15)' }}>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#10b981' }}>اطلاعات تماس</h2>
            <div className="space-y-2 text-sm" style={{ color: '#9ca3af' }}>
              <div>📞 {seller.phone}</div>
              <div>✉️ {seller.email}</div>
              <div>📍 {seller.address}</div>
              <div>🕐 {seller.workingHours}</div>
            </div>
            <button className="w-full mt-4 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)', color: '#010604' }}>
              تماس با فروشگاه
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, ShoppingBag, Star, CheckCircle, MapPin,
  Package, BookOpen, Shirt, Wrench, Circle, LayoutGrid,
  Zap, ChevronLeft, ChevronRight, Timer, TrendingDown,
  SlidersHorizontal
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  discountPrice?: number;
  discountPercent?: number;
  category: string;
  condition: string;
  city: string;
  images: string[];
  isVerified: boolean;
  isOfficialStore: boolean;
  isDailyDeal: boolean;
  isSpecialSale: boolean;
  seller: {
    firstName: string;
    lastName: string;
    primaryRole: string;
  };
}

const categories = [
  { value: 'all', label: 'همه', icon: <LayoutGrid size={28} />, bg: '#374151' },
  { value: 'table', label: 'میز بیلیارد', icon: <Package size={28} />, bg: '#15803d' },
  { value: 'cue', label: 'چوب', icon: <SlidersHorizontal size={28} />, bg: '#b45309' },
  { value: 'ball', label: 'توپ', icon: <Circle size={28} />, bg: '#b91c1c' },
  { value: 'accessory', label: 'لوازم جانبی', icon: <Wrench size={28} />, bg: '#1d4ed8' },
  { value: 'clothing', label: 'پوشاک', icon: <Shirt size={28} />, bg: '#7e22ce' },
  { value: 'educational', label: 'آموزشی', icon: <BookOpen size={28} />, bg: '#0f766e' },
  { value: 'other', label: 'سایر', icon: <ShoppingBag size={28} />, bg: '#be185d' },
];

const conditionLabels: Record<string, string> = {
  new: 'نو',
  like_new: 'در حد نو',
  used: 'کارکرده',
};

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: 'فروشگاه رسمی بیلیارد پلاس', color: 'text-purple-600' },
  seller: { label: 'فروشگاه', color: 'text-blue-600' },
  manufacturer: { label: 'تولیدکننده', color: 'text-green-600' },
  player: { label: 'بازیکن', color: 'text-orange-600' },
  coach: { label: 'مربی', color: 'text-yellow-600' },
  installer: { label: 'متخصص نصب', color: 'text-red-600' },
  referee: { label: 'داور', color: 'text-indigo-600' },
  user: { label: 'کاربر', color: 'text-gray-600' },
};

const slides = [
  { bg: 'from-green-900 to-green-700', title: 'میزهای حرفه‌ای', subtitle: 'بهترین برندهای ایران و جهان', badge: 'تا ۲۰٪ تخفیف', badgeColor: 'bg-yellow-400 text-yellow-900' },
  { bg: 'from-blue-900 to-blue-700', title: 'چوب‌های حرفه‌ای', subtitle: 'Predator، Mezz، Riley و بیشتر', badge: 'ارسال رایگان', badgeColor: 'bg-blue-300 text-blue-900' },
  { bg: 'from-purple-900 to-purple-700', title: 'فروش ویژه فصل', subtitle: 'محصولات منتخب با تخفیف استثنایی', badge: 'محدود', badgeColor: 'bg-red-400 text-white' },
];

const sampleProducts: Product[] = [
  { id: '1', title: 'میز اسنوکر ویراکا مدل M1 Gold حرفه‌ای', price: 85000000, discountPrice: 72000000, discountPercent: 15, category: 'table', condition: 'new', city: 'تهران', images: [], isVerified: true, isOfficialStore: false, isDailyDeal: false, isSpecialSale: true, seller: { firstName: 'علی', lastName: 'محمدی', primaryRole: 'seller' } },
  { id: '2', title: 'چوب بیلیارد حرفه‌ای Predator 314-3', price: 12000000, discountPrice: 9600000, discountPercent: 20, category: 'cue', condition: 'like_new', city: 'مشهد', images: [], isVerified: true, isOfficialStore: false, isDailyDeal: true, isSpecialSale: true, seller: { firstName: 'رضا', lastName: 'احمدی', primaryRole: 'player' } },
  { id: '3', title: 'ست توپ اسنوکر Aramith Tournament', price: 4500000, discountPrice: 3800000, discountPercent: 16, category: 'ball', condition: 'new', city: 'اصفهان', images: [], isVerified: false, isOfficialStore: true, isDailyDeal: true, isSpecialSale: true, seller: { firstName: 'بیلیارد', lastName: 'پلاس', primaryRole: 'admin' } },
  { id: '4', title: 'گچ بیلیارد Master Blue Diamond - ۱۴۴ عدد', price: 850000, discountPrice: 680000, discountPercent: 20, category: 'accessory', condition: 'new', city: 'تهران', images: [], isVerified: false, isOfficialStore: false, isDailyDeal: false, isSpecialSale: true, seller: { firstName: 'محمد', lastName: 'حسینی', primaryRole: 'seller' } },
  { id: '5', title: 'پایه چوب بیلیارد چرمی دستی', price: 2200000, discountPrice: 1900000, discountPercent: 14, category: 'accessory', condition: 'new', city: 'تهران', images: [], isVerified: false, isOfficialStore: false, isDailyDeal: false, isSpecialSale: true, seller: { firstName: 'امیر', lastName: 'کریمی', primaryRole: 'manufacturer' } },
  { id: '6', title: 'میز پاکت بیلیارد ۷ فوت ایرانی', price: 35000000, discountPrice: 28000000, discountPercent: 20, category: 'table', condition: 'used', city: 'شیراز', images: [], isVerified: false, isOfficialStore: false, isDailyDeal: false, isSpecialSale: true, seller: { firstName: 'حسین', lastName: 'علوی', primaryRole: 'user' } },
  { id: '7', title: 'کتاب آموزش اسنوکر حرفه‌ای استیو دیویس', price: 350000, discountPrice: 280000, discountPercent: 20, category: 'educational', condition: 'new', city: 'تهران', images: [], isVerified: false, isOfficialStore: true, isDailyDeal: true, isSpecialSale: true, seller: { firstName: 'بیلیارد', lastName: 'پلاس', primaryRole: 'admin' } },
  { id: '8', title: 'تی‌شرت اسپرت بیلیارد سایز XL', price: 450000, discountPrice: 360000, discountPercent: 20, category: 'clothing', condition: 'new', city: 'تهران', images: [], isVerified: false, isOfficialStore: false, isDailyDeal: false, isSpecialSale: true, seller: { firstName: 'مجید', lastName: 'صادقی', primaryRole: 'seller' } },
];

function SpecialSaleTimer({ targetDate }: { targetDate: Date }) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff > 0) {
        setT({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        });
      }
    };
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const fa = (n: number) => n.toLocaleString('fa-IR').padStart(2, '۰');

  return (
    <div className="flex items-center gap-1 my-3">
      <div className="rounded text-center px-1.5 py-0.5" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
        <span className="text-white font-bold text-base">{fa(t.d)}</span>
      </div>
      <span className="text-white font-bold">:</span>
      <div className="rounded text-center px-1.5 py-0.5" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
        <span className="text-white font-bold text-base">{fa(t.h)}</span>
      </div>
      <span className="text-white font-bold">:</span>
      <div className="rounded text-center px-1.5 py-0.5" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
        <span className="text-white font-bold text-base">{fa(t.m)}</span>
      </div>
    </div>
  );
}

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calc = () => {
      const distance = targetDate.getTime() - new Date().getTime();
      if (distance > 0) {
        setTimeLeft({
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const pad = (n: number) => n.toLocaleString('fa-IR').padStart(2, '۰');

  return (
    <div className="flex gap-1 items-center">
      {[
        { value: timeLeft.seconds, label: 'ثانیه' },
        { value: timeLeft.minutes, label: 'دقیقه' },
        { value: timeLeft.hours, label: 'ساعت' },

        

      ].map((item, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="bg-white text-gray-900 border border-gray-200 shadow-sm rounded-xl px-2 py-1 text-center min-w-[2.5rem]">
            <div className="text-base font-bold">{pad(item.value)}</div>
            <div className="text-xs text-gray-500">{item.label}</div>
          </div>
          {i < 2 && <span className="font-bold text-gray-400">:</span>}
        </div>
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/shop/${product.id}`}>
      <div className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group border border-gray-100 flex flex-col" style={{ height: '320px' }}>
        <div className="relative bg-gray-50 flex-shrink-0 overflow-hidden" style={{ height: '160px' }}>
          {product.images?.length > 0 ? (
            <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Package size={52} className="text-gray-200" />
            </div>
          )}
          {product.discountPercent > 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
              <TrendingDown size={10} />
              {product.discountPercent.toLocaleString('fa-IR')}٪
            </div>
          )}
          {product.isVerified && (
            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
              <CheckCircle size={10} />
              تأیید شده
            </div>
          )}
          {product.isOfficialStore && (
            <div className="absolute bottom-0 inset-x-0 bg-purple-600 text-white text-xs px-2 py-2 flex items-center gap-1 justify-center">
              <Star size={10} />
              فروشگاه رسمی بیلیارد پلاس
            </div>
          )}
        </div>
        <div className="p-3 flex flex-col flex-1">
          <h3 className="font-bold text-gray-800 text-sm leading-5 mb-2 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', height: '2.5rem' }}>
            {product.title}
          </h3>
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className={`text-xs ${roleLabels[product.seller?.primaryRole]?.color || 'text-gray-500'}`}>
              {roleLabels[product.seller?.primaryRole]?.label || 'کاربر'}
            </span>
            <span className="text-gray-200 text-xs">|</span>
            <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{conditionLabels[product.condition]}</span>
            {product.city && (
              <span className="text-xs text-gray-400 flex items-center gap-0.5">
                <MapPin size={9} />
                {product.city}
              </span>
            )}
          </div>
          <div className="mt-auto pt-2 border-t border-gray-50">
            {product.discountPrice ? (
              <>
                <div className="text-xs text-gray-400 line-through">{product.price.toLocaleString('fa-IR')} تومان</div>
                <div className="text-green-700 font-bold text-sm">{product.discountPrice.toLocaleString('fa-IR')} تومان</div>
              </>
            ) : (
              <div className="text-green-700 font-bold text-sm">{product.price.toLocaleString('fa-IR')} تومان</div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function DealCard({ product }: { product: Product }) {
  return (
    <Link href={`/shop/${product.id}`}>
      <div className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group border border-red-100 flex flex-col" style={{ height: '280px' }}>
        <div className="relative bg-gray-50 flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ height: '140px' }}>
          {product.images?.length > 0 ? (
            <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <Package size={48} className="text-gray-200" />
          )}
          {product.discountPercent > 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
              {product.discountPercent.toLocaleString('fa-IR')}٪
            </div>
          )}
        </div>
        <div className="p-3 flex flex-col flex-1">
          <h3 className="font-bold text-gray-800 text-xs leading-5 mb-auto overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', height: '2.5rem' }}>
            {product.title}
          </h3>
          <div className="mt-2 pt-2 border-t border-red-50">
            {product.discountPrice ? (
              <>
                <div className="text-xs text-gray-400 line-through">{product.price.toLocaleString('fa-IR')}</div>
                <div className="text-red-600 font-bold text-sm">{product.discountPrice.toLocaleString('fa-IR')} تومان</div>
              </>
            ) : (
              <div className="text-green-700 font-bold text-sm">{product.price.toLocaleString('fa-IR')} تومان</div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [condition, setCondition] = useState('');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(prev => (prev + 1) % slides.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const specialSaleDate = new Date();
  specialSaleDate.setDate(specialSaleDate.getDate() + 7);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const dailyDeals = sampleProducts.filter(p => p.isDailyDeal);
  const specialSaleProducts = sampleProducts.filter(p => p.isSpecialSale);

  const filtered = sampleProducts.filter(p => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (condition && p.condition !== condition) return false;
    if (onlyVerified && !p.isVerified) return false;
    if (search && !p.title.includes(search)) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto pb-10">

      {/* سرچ sticky */}
      <div className="sticky top-16 z-40 bg-gray-50 py-3 mb-5 -mx-6 px-6">
        <div className="relative flex items-center bg-white rounded-full shadow-lg border-2 border-gray-100 hover:border-green-400 transition-colors overflow-hidden">
          <div className="pr-6 text-gray-400 flex-shrink-0">
            <Search size={20} />
          </div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="جستجو در فروشگاه بیلیارد پلاس..."
            className="flex-1 py-3.5 px-3 text-base focus:outline-none bg-transparent" />
          <button className="m-2 bg-green-700 text-white px-8 py-2.5 rounded-full hover:bg-green-800 flex items-center gap-2 font-medium transition-colors flex-shrink-0">
            <Search size={16} />
            جستجو
          </button>
        </div>
      </div>

      {/* دسته‌بندی‌ها */}
      <div className="mb-8">
        <h2 className="text-center text-lg font-bold text-gray-800 mb-6">خرید بر اساس دسته‌بندی</h2>
        <div className="flex gap-8 overflow-x-auto pb-4 justify-center flex-wrap">
          {categories.map(cat => {
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className="flex flex-col items-center gap-2 group flex-shrink-0 pt-2">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-md group-hover:scale-105"
                  style={{
                    backgroundColor: isActive ? cat.bg : '#f3f4f6',
                    boxShadow: isActive ? `0 0 0 4px white, 0 0 0 6px ${cat.bg}` : undefined,
                  }}>
                  <div className={isActive ? 'text-white' : 'text-gray-500'}>
                    {cat.icon}
                  </div>
                </div>
                <span className={`text-xs font-medium text-center ${isActive ? 'text-green-700 font-bold' : 'text-gray-600'}`}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* اسلایدر */}
      <div className="relative rounded-3xl overflow-hidden mb-8 shadow-xl" style={{ height: '260px' }}>
        {slides.map((slide, i) => (
          <div key={i}
            className={`absolute inset-0 bg-gradient-to-l ${slide.bg} transition-all duration-700 ${i === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="h-full flex items-center justify-between px-12">
              <div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${slide.badgeColor} mb-4 inline-block`}>
                  {slide.badge}
                </span>
                <h2 className="text-white text-4xl font-bold mb-3">{slide.title}</h2>
                <p className="text-white opacity-70 text-lg mb-6">{slide.subtitle}</p>
                <button className="bg-white text-green-800 px-8 py-3 rounded-xl font-bold hover:bg-green-50 transition-colors">
                  مشاهده همه
                </button>
              </div>
              <Package size={120} className="text-white opacity-10" />
            </div>
          </div>
        ))}
        <button onClick={() => setCurrentSlide(p => (p - 1 + slides.length) % slides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all">
          <ChevronRight size={20} />
        </button>
        <button onClick={() => setCurrentSlide(p => (p + 1) % slides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all">
          <ChevronLeft size={20} />
        </button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrentSlide(i)}
              className={`rounded-full transition-all ${i === currentSlide ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white opacity-40'}`} />
          ))}
        </div>
      </div>

      {/* بنرهای تبلیغاتی */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-l from-amber-600 to-amber-400 rounded-2xl p-5 text-white flex items-center justify-between">
          <div>
            <div className="font-bold text-lg">چوب‌های حرفه‌ای</div>
            <div className="text-amber-100 text-sm">تا ۳۰٪ تخفیف</div>
          </div>
          <SlidersHorizontal size={40} className="text-amber-200" />
        </div>
        <div className="bg-gradient-to-l from-blue-700 to-blue-500 rounded-2xl p-5 text-white flex items-center justify-between">
          <div>
            <div className="font-bold text-lg">لوازم جانبی</div>
            <div className="text-blue-100 text-sm">قیمت مناسب</div>
          </div>
          <Wrench size={40} className="text-blue-200" />
        </div>
        <div className="bg-gradient-to-l from-purple-700 to-purple-500 rounded-2xl p-5 text-white flex items-center justify-between">
          <div>
            <div className="font-bold text-lg">محصولات آموزشی</div>
            <div className="text-purple-100 text-sm">ارسال رایگان</div>
          </div>
          <BookOpen size={40} className="text-purple-200" />
        </div>
      </div>

      {/* فروش ویژه */}
      <div className="rounded-2xl mb-8 overflow-hidden shadow-md" style={{ border: '1px solid #f0f0f0' }}>
        <div className="flex" style={{ minHeight: '200px' }}>
          <div className="flex-shrink-0 flex flex-col items-center justify-between p-4 text-white" style={{ width: '140px', background: '#e8192c' }}>
            <div className="text-xl font-black leading-tight text-center mt-2">
              پیشنهاد<br />شگفت‌<br />انگیز
            </div>
            <SpecialSaleTimer targetDate={specialSaleDate} />
            <div className="text-white font-black opacity-40" style={{ fontSize: '48px', lineHeight: 1 }}>%</div>
            <Link href="/shop" className="text-white text-xs flex items-center gap-1 mt-2 mb-1 opacity-80 hover:opacity-100">
              مشاهده همه
              <ChevronLeft size={12} />
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto bg-white">
            <div className="flex" style={{ minHeight: '200px' }}>
              {specialSaleProducts.map((product, index) => (
                <Link key={index} href={`/shop/${product.id}`}>
                  <div className="flex-shrink-0 hover:bg-gray-50 transition-colors flex flex-col justify-between p-3 border-r border-gray-100" style={{ width: '170px', height: '200px' }}>
                    <div className="flex items-center justify-center" style={{ height: '100px' }}>
                      {product.images?.length > 0 ? (
                        <img src={product.images[0]} alt={product.title} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <Package size={48} className="text-gray-200" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-700 mb-1 leading-4 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {product.title}
                      </div>
                      <div className="flex items-end justify-between mt-1">
                        <div>
                          {product.discountPrice && (
                            <div className="text-xs text-gray-400 line-through leading-none">
                              {product.price.toLocaleString('fa-IR')}
                            </div>
                          )}
                          <div className="text-xs font-bold text-gray-900">
                            {(product.discountPrice || product.price).toLocaleString('fa-IR')}
                          </div>
                          <div className="text-xs text-gray-400">تومان</div>
                        </div>
                        {product.discountPercent > 0 && (
                          <div className="rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold" style={{ width: '36px', height: '36px', fontSize: '11px', backgroundColor: '#e8192c' }}>
                            {product.discountPercent}٪
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* تخفیف امروز */}
      <div className="bg-white rounded-3xl border-2 border-red-100 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-500 p-2 rounded-xl">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <div className="text-gray-900 font-bold text-xl">تخفیف امروز</div>
              <div className="text-gray-400 text-sm flex items-center gap-1">
                <Timer size={12} />
                فقط تا پایان امروز
              </div>
            </div>
          </div>
          <CountdownTimer targetDate={endOfDay} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dailyDeals.map(product => (
            <DealCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* فیلتر + محصولات */}
      <div className="flex gap-6">
        <div className="w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-32 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <SlidersHorizontal size={16} />
              فیلترها
            </h3>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-600 mb-3">وضعیت کالا</label>
              {[
                { value: '', label: 'همه' },
                { value: 'new', label: 'نو' },
                { value: 'like_new', label: 'در حد نو' },
                { value: 'used', label: 'کارکرده' },
              ].map(c => (
                <label key={c.value} className="flex items-center gap-2 mb-2.5 cursor-pointer group">
                  <input type="radio" name="condition" value={c.value}
                    checked={condition === c.value}
                    onChange={() => setCondition(c.value)}
                    className="accent-green-600" />
                  <span className="text-sm text-gray-600 group-hover:text-green-700">{c.label}</span>
                </label>
              ))}
            </div>
            <div className="mb-5 pb-5 border-b border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={onlyVerified}
                  onChange={e => setOnlyVerified(e.target.checked)}
                  className="accent-green-600 w-4 h-4" />
                <span className="text-sm text-gray-600 group-hover:text-green-700 flex items-center gap-1">
                  <CheckCircle size={14} className="text-green-500" />
                  فقط تأیید شده
                </span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">مرتب‌سازی</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50">
                <option value="newest">جدیدترین</option>
                <option value="cheapest">ارزان‌ترین</option>
                <option value="expensive">گران‌ترین</option>
                <option value="discount">بیشترین تخفیف</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-800 text-lg">
                {selectedCategory === 'all' ? 'همه محصولات' : categories.find(c => c.value === selectedCategory)?.label}
              </h2>
              <span className="text-gray-400 text-sm bg-gray-100 px-2 py-0.5 rounded-lg">
                {filtered.length.toLocaleString('fa-IR')} محصول
              </span>
            </div>
            <Link href="/shop/new"
              className="bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm hover:bg-green-800 flex items-center gap-2 font-medium shadow-sm">
              <ShoppingBag size={16} />
              فروش محصول
            </Link>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <p>محصولی پیدا نشد</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
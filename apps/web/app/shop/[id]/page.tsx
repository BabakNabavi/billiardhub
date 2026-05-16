'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, CheckCircle, Star, ChevronLeft,
  Phone, MessageCircle, Share2, Heart, ShoppingCart,
  Package, Shield, Truck, RotateCcw, ThumbsUp, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';

const product = {
  id: '1',
  title: 'میز اسنوکر ویراکا مدل M1 Gold حرفه‌ای',
  description: 'میز اسنوکر حرفه‌ای ویراکا مدل M1 Gold با کیفیت بین‌المللی. این میز با بهترین مواد اولیه ساخته شده و برای استفاده حرفه‌ای و باشگاهی مناسب است. ماهوت ایمپورت بلژیک، باند اصل، کوشن‌های آرامیت استاندارد.',
  price: 85000000,
  discountPrice: 72000000,
  discountPercent: 15,
  condition: 'new',
  city: 'تهران',
  isVerified: true,
  isOfficialStore: false,
  stock: 2,
  rating: 4.5,
  reviewCount: 28,
  viewCount: 508,
  seller: { id: 's1', firstName: 'علی', lastName: 'محمدی', primaryRole: 'seller', city: 'تهران', rating: 'عالی', ratingPercent: 95 },
  otherSellers: [
    { name: 'فروشگاه بیلیارد مرکزی', city: 'اصفهان', price: 75000000, rating: 'خوب', ratingPercent: 88 },
  ],
  specs: [
    { label: 'ابعاد', value: '۳۶۵ × ۱۸۵ سانتی‌متر' },
    { label: 'وزن', value: '۵۵۰ کیلوگرم' },
    { label: 'جنس بدنه', value: 'MDF با روکش چوب طبیعی' },
    { label: 'ماهوت', value: 'ایمپورت بلژیک' },
    { label: 'کوشن', value: 'آرامیت استاندارد' },
    { label: 'رنگ', value: 'مشکی/طلایی' },
    { label: 'تعداد پاکت', value: '۶ عدد' },
    { label: 'جنس پایه', value: 'فولاد ضدزنگ' },
  ],
  reviews: [
    { name: 'رضا احمدی', rating: 5, date: '۱۴۰۳/۰۲/۱۰', text: 'کیفیت عالی، دقیقاً همون چیزی که انتظار داشتم.', likes: 12 },
    { name: 'سارا محمدی', rating: 4, date: '۱۴۰۳/۰۱/۲۵', text: 'میز بسیار باکیفیت. فقط نصبش کمی سخت بود.', likes: 7 },
    { name: 'کاوه موسوی', rating: 5, date: '۱۴۰۲/۱۲/۰۸', text: 'برای باشگاهم خریدم. همه مشتریام راضین.', likes: 15 },
  ],
  similar: [
    { id: '6', title: 'میز پاکت بیلیارد ۷ فوت', price: 35000000, discountPrice: 28000000 },
    { id: '4', title: 'گچ Master Blue Diamond', price: 850000, discountPrice: 680000 },
    { id: '2', title: 'چوب Predator 314-3', price: 12000000, discountPrice: undefined },
    { id: '3', title: 'توپ Aramith Tournament', price: 4500000, discountPrice: 3800000 },
  ],
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={13} className={i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-100'} />
      ))}
    </div>
  );
}

export default function ProductPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeImage, setActiveImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState('specs');

  return (
    <div className="max-w-7xl mx-auto pb-10">

      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/shop" className="hover:text-green-700">فروشگاه</Link>
        <ChevronLeft size={14} />
        <span className="text-gray-700 line-clamp-1">{product.title}</span>
      </div>

      {/* محتوای اصلی */}
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 4fr 3fr', gap: '24px', alignItems: 'start' }}>

        {/* ستون ۱ — عکس */}
        <div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="relative bg-gray-50 rounded-xl flex items-center justify-center mb-4" style={{ height: '380px' }}>
              <Package size={120} className="text-gray-200" />
              {product.discountPercent > 0 && (
                <div className="absolute top-3 right-3 bg-red-500 text-white font-bold px-3 py-1 rounded-lg text-sm">
                  {product.discountPercent.toLocaleString('fa-IR')}٪
                </div>
              )}
              {product.isVerified && (
                <div className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                  <CheckCircle size={11} />
                  تأیید شده
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {[0,1,2,3].map(i => (
                <button key={i} onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center bg-gray-50 ${activeImage === i ? 'border-green-500' : 'border-gray-200'}`}>
                  <Package size={20} className="text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ستون ۲ — اطلاعات */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900 mb-3 leading-8">{product.title}</h1>
            <div className="flex items-center gap-3 mb-4">
              <Stars rating={product.rating} />
              <span className="text-green-700 font-bold text-sm">{product.rating}</span>
              <span className="text-gray-400 text-sm">({product.reviewCount.toLocaleString('fa-IR')} دیدگاه)</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-400 text-sm">{product.viewCount.toLocaleString('fa-IR')} بازدید</span>
            </div>
            <div className="flex gap-2 mb-5">
              <span className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full">نو</span>
              <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                <MapPin size={10} />
                {product.city}
              </span>
            </div>
            <p className="text-gray-600 leading-8 text-sm mb-5">{product.description}</p>
            <div className="border rounded-2xl p-4 grid grid-cols-3 gap-3">
              {[
                { icon: <Shield size={22} className="text-green-600" />, label: 'ضمانت اصالت' },
                { icon: <Truck size={22} className="text-blue-600" />, label: 'ارسال سراسری' },
                { icon: <RotateCcw size={22} className="text-orange-600" />, label: 'مرجوع کردن' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1 text-center">
                  {item.icon}
                  <span className="text-xs text-gray-500">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* فروشندگان دیگر */}
          {product.otherSellers.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                <span className="w-1 h-4 bg-red-500 rounded-full inline-block"></span>
                فروشندگان این کالا
              </h3>
              {product.otherSellers.map((seller, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-t">
                  <div>
                    <div className="font-medium text-sm text-gray-800">{seller.name}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={9} />
                      {seller.city}
                    </div>
                    <div className="text-xs text-green-600 font-medium mt-0.5">
                      عملکرد {seller.rating} — {seller.ratingPercent}٪ رضایت
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm text-gray-900">{seller.price.toLocaleString('fa-IR')}</div>
                    <div className="text-xs text-gray-400 mb-1">تومان</div>
                    <button className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-yellow-600">
                      افزودن به سبد
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* تب‌ها */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex border-b">
              {[
                { value: 'specs', label: 'مشخصات' },
                { value: 'reviews', label: `دیدگاه‌ها (${product.reviewCount})` },
                { value: 'questions', label: 'پرسش‌ها' },
              ].map(tab => (
                <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.value ? 'border-red-500 text-red-500' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="p-5">
              {activeTab === 'specs' && (
                <div>
                  {product.specs.map((spec, i) => (
                    <div key={i} className={`flex py-3 text-sm ${i < product.specs.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <span className="text-gray-400 w-36 flex-shrink-0">{spec.label}</span>
                      <span className="text-gray-800 font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  {product.reviews.map((review, i) => (
                    <div key={i} className="border-b pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                            {review.name[0]}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{review.name}</div>
                            <div className="text-xs text-gray-400">{review.date}</div>
                          </div>
                        </div>
                        <Stars rating={review.rating} />
                      </div>
                      <p className="text-sm text-gray-600 leading-6 mb-2">{review.text}</p>
                      <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-600">
                        <ThumbsUp size={12} />
                        مفید بود ({review.likes.toLocaleString('fa-IR')})
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'questions' && (
                <div className="text-center py-8 text-gray-400">
                  <AlertCircle size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">هنوز سوالی پرسیده نشده</p>
                  <button className="mt-4 border border-green-600 text-green-700 px-5 py-2 rounded-xl text-sm hover:bg-green-50">
                    پرسیدن سوال
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ستون ۳ — خرید */}
        <div style={{ position: 'sticky', top: '90px' }}>
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b">
              <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                {product.seller.firstName[0]}
              </div>
              <div>
                <div className="font-medium text-sm">{product.seller.firstName} {product.seller.lastName}</div>
                <div className="text-xs text-green-600">عملکرد {product.seller.rating}</div>
                <div className="text-xs text-gray-400 flex items-center gap-0.5">
                  <MapPin size={9} />
                  {product.seller.city}
                </div>
              </div>
            </div>

            <div className="mb-5">
              {product.discountPrice && (
                <div className="text-gray-400 line-through text-sm mb-1">
                  {product.price.toLocaleString('fa-IR')} تومان
                </div>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-gray-900">
                  {(product.discountPrice || product.price).toLocaleString('fa-IR')}
                </span>
                <span className="text-gray-500 text-sm">تومان</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-gray-600">{product.stock.toLocaleString('fa-IR')} عدد موجود</span>
            </div>

            <button
              onClick={() => user ? alert('افزودن به سبد') : router.push('/login')}
              className="w-full bg-blue-500 hover:bg-yellow-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 mb-3 transition-colors">
              <ShoppingCart size={18} />
              افزودن به سبد خرید
            </button>

            <div className="flex gap-2 mb-5">
              <button onClick={() => setLiked(!liked)}
                className={`flex-1 py-2.5 rounded-xl border text-sm flex items-center justify-center gap-1 transition-colors ${liked ? 'border-red-300 text-red-500 bg-red-50' : 'border-gray-200 text-gray-500'}`}>
                <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
                علاقه‌مندی
              </button>
              <button className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm flex items-center justify-center gap-1">
                <Share2 size={15} />
                اشتراک
              </button>
            </div>

            <div className="space-y-2 border-t pt-4">
              <button className="w-full border border-green-600 text-green-700 py-2.5 rounded-xl text-sm font-medium hover:bg-green-50 flex items-center justify-center gap-2">
                <Phone size={15} />
                تماس با فروشنده
              </button>
              <button className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-gray-50">
                <MessageCircle size={15} />
                ارسال پیام
              </button>
              <Link href={`/users/${product.seller.id}`}
                className="block text-center text-green-700 text-xs py-1 hover:underline">
                مشاهده پروفایل فروشنده
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* کالاهای مشابه */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-bold text-gray-800 text-lg mb-5 flex items-center gap-2">
          <span className="w-1 h-5 bg-red-500 rounded-full inline-block"></span>
          کالاهای مشابه
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {product.similar.map(p => (
            <Link key={p.id} href={`/shop/${p.id}`}>
              <div className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all">
                <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center mb-3">
                  <Package size={40} className="text-gray-200" />
                </div>
                <div className="text-xs text-gray-700 font-medium line-clamp-2 mb-2 leading-5">{p.title}</div>
                {p.discountPrice && (
                  <div className="text-xs text-gray-400 line-through">{p.price.toLocaleString('fa-IR')}</div>
                )}
                <div className="font-bold text-sm text-gray-900">
                  {(p.discountPrice || p.price).toLocaleString('fa-IR')}
                </div>
                <div className="text-xs text-gray-400">تومان</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
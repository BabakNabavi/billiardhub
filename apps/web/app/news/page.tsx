'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, Eye, ArrowLeft, TrendingUp, Flame } from 'lucide-react';

interface News {
  id: string;
  title: string;
  summary: string;
  category: string;
  categoryLabel: string;
  categoryColor: string;
  image: string;
  imageBg: string;
  author: string;
  date: string;
  views: number;
  tags: string[];
  isBreaking?: boolean;
  isFeatured?: boolean;
}

const sampleNews: News[] = [
  {
    id: '1',
    title: 'برگزاری مسابقات قهرمانی اسنوکر ایران ۱۴۰۳ با حضور ۱۲۸ بازیکن',
    summary: 'مسابقات قهرمانی اسنوکر ایران با حضور بیش از ۱۲۸ بازیکن از سراسر کشور در تهران برگزار می‌شود. این رویداد بزرگ‌ترین مسابقه اسنوکر ایران در ۵ سال گذشته است.',
    category: 'tournament',
    categoryLabel: 'مسابقات',
    categoryColor: '#e8192c',
    image: '',
    imageBg: 'from-red-900 to-red-700',
    author: 'تیم بیلیارد پلاس',
    date: '۱۴۰۳/۰۳/۱۵',
    views: 1250,
    tags: ['مسابقات', 'اسنوکر', 'تهران'],
    isBreaking: true,
    isFeatured: true,
  },
  {
    id: '2',
    title: 'رنکینگ جدید بازیکنان اسنوکر دسته برتر اعلام شد',
    summary: 'فدراسیون بیلیارد و اسنوکر ایران رنکینگ جدید دسته برتر آقایان را برای فصل جاری اعلام کرد.',
    category: 'ranking',
    categoryLabel: 'رنکینگ',
    categoryColor: '#2563eb',
    image: '',
    imageBg: 'from-blue-900 to-blue-700',
    author: 'تیم بیلیارد پلاس',
    date: '۱۴۰۳/۰۳/۱۰',
    views: 890,
    tags: ['رنکینگ', 'دسته برتر'],
    isFeatured: true,
  },
  {
    id: '3',
    title: 'افتتاح باشگاه بیلیارد مجهز در شیراز',
    summary: 'یک باشگاه بیلیارد مجهز با ۱۵ میز اسنوکر و پاکت بیلیارد در شیراز افتتاح شد.',
    category: 'club',
    categoryLabel: 'باشگاه‌ها',
    categoryColor: '#16a34a',
    image: '',
    imageBg: 'from-green-900 to-green-700',
    author: 'تیم بیلیارد پلاس',
    date: '۱۴۰۳/۰۳/۰۵',
    views: 654,
    tags: ['باشگاه', 'شیراز'],
    isFeatured: true,
  },
  {
    id: '4',
    title: 'معرفی میز اسنوکر جدید ویراکا مدل M2 Pro',
    summary: 'شرکت ویراکا از جدیدترین محصول خود، میز اسنوکر M2 Pro با فناوری جدید رونمایی کرد.',
    category: 'product',
    categoryLabel: 'محصولات',
    categoryColor: '#7c3aed',
    image: '',
    imageBg: 'from-purple-900 to-purple-700',
    author: 'تیم بیلیارد پلاس',
    date: '۱۴۰۳/۰۲/۲۸',
    views: 432,
    tags: ['ویراکا', 'میز اسنوکر'],
  },
  {
    id: '5',
    title: 'تیم ملی ایران در مسابقات جهانی پاکت بیلیارد ۲۰۲۴',
    summary: 'تیم ملی پاکت بیلیارد ایران برای حضور در مسابقات جهانی ۲۰۲۴ آماده می‌شود.',
    category: 'tournament',
    categoryLabel: 'مسابقات',
    categoryColor: '#e8192c',
    image: '',
    imageBg: 'from-orange-900 to-orange-700',
    author: 'تیم بیلیارد پلاس',
    date: '۱۴۰۳/۰۲/۲۰',
    views: 1100,
    tags: ['تیم ملی', 'پاکت بیلیارد'],
  },
  {
    id: '6',
    title: 'برگزاری دوره آموزشی مربیگری اسنوکر در تهران',
    summary: 'فدراسیون بیلیارد دوره جدید آموزش مربیگری را برای علاقه‌مندان برگزار می‌کند.',
    category: 'general',
    categoryLabel: 'عمومی',
    categoryColor: '#64748b',
    image: '',
    imageBg: 'from-slate-800 to-slate-600',
    author: 'تیم بیلیارد پلاس',
    date: '۱۴۰۳/۰۲/۱۵',
    views: 320,
    tags: ['آموزش', 'مربیگری'],
  },
  {
    id: '7',
    title: 'قهرمان مسابقات پاکت بیلیارد استانی مشخص شد',
    summary: 'علی احمدی از تهران با غلبه بر رقبا توانست عنوان قهرمانی مسابقات استانی پاکت بیلیارد را کسب کند.',
    category: 'tournament',
    categoryLabel: 'مسابقات',
    categoryColor: '#e8192c',
    image: '',
    imageBg: 'from-yellow-900 to-yellow-700',
    author: 'تیم بیلیارد پلاس',
    date: '۱۴۰۳/۰۲/۱۰',
    views: 567,
    tags: ['قهرمانی', 'پاکت بیلیارد'],
  },
  {
    id: '8',
    title: 'ورود تجهیزات حرفه‌ای Predator به بازار ایران',
    summary: 'برند معروف Predator برای اولین بار نمایندگی رسمی در ایران تأسیس کرد.',
    category: 'product',
    categoryLabel: 'محصولات',
    categoryColor: '#7c3aed',
    image: '',
    imageBg: 'from-indigo-900 to-indigo-700',
    author: 'تیم بیلیارد پلاس',
    date: '۱۴۰۳/۰۲/۰۵',
    views: 789,
    tags: ['Predator', 'تجهیزات'],
  },
];

const categories = [
  { value: 'all', label: 'همه اخبار' },
  { value: 'tournament', label: 'مسابقات' },
  { value: 'ranking', label: 'رنکینگ' },
  { value: 'club', label: 'باشگاه‌ها' },
  { value: 'product', label: 'محصولات' },
  { value: 'general', label: 'عمومی' },
];

function NewsCard({ news, size = 'normal' }: { news: News; size?: 'large' | 'normal' | 'small' }) {
  return (
    <Link href={`/news/${news.id}`}>
      <div className={`group cursor-pointer ${size === 'large' ? '' : 'flex gap-4'}`}>
        {/* عکس */}
        <div className={`bg-gradient-to-br ${news.imageBg} flex-shrink-0 overflow-hidden relative ${
          size === 'large' ? 'w-full h-72 rounded-2xl mb-4' :
          size === 'small' ? 'w-20 h-20 rounded-xl' :
          'w-32 h-24 rounded-xl'
        }`}>
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <span className="text-white text-6xl font-black">🎱</span>
          </div>
          {news.isBreaking && size === 'large' && (
            <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
              <Flame size={12} />
              فوری
            </div>
          )}
        </div>

        {/* محتوا */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: news.categoryColor + '20', color: news.categoryColor }}>
              {news.categoryLabel}
            </span>
            {news.isBreaking && size !== 'large' && (
              <span className="text-xs font-bold text-red-500 flex items-center gap-0.5">
                <Flame size={10} />
                فوری
              </span>
            )}
          </div>

          <h3 className={`font-bold text-gray-900 leading-7 group-hover:text-green-700 transition-colors line-clamp-2 ${
            size === 'large' ? 'text-xl mb-3' : size === 'small' ? 'text-sm mb-1' : 'text-base mb-2'
          }`}>
            {news.title}
          </h3>

          {size !== 'small' && (
            <p className="text-gray-500 text-sm leading-6 line-clamp-2 mb-3">{news.summary}</p>
          )}

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {news.date}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={11} />
              {news.views.toLocaleString('fa-IR')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = sampleNews.filter(n => {
    if (activeCategory !== 'all' && n.category !== activeCategory) return false;
    if (search && !n.title.includes(search) && !n.summary.includes(search)) return false;
    return true;
  });

  const featured = sampleNews[0]!;
  const topNews = sampleNews.slice(1, 4);
  const restNews = sampleNews.slice(4);
  const trending = [...sampleNews].sort((a, b) => b.views - a.views).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto pb-10">

      {/* نوار خبر فوری */}
      <div className="bg-gray-900 text-white rounded-2xl px-5 py-3 mb-8 flex items-center gap-4 overflow-hidden">
        <span className="bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
          <Flame size={12} />
          فوری
        </span>
        <div className="overflow-hidden flex-1">
          <p className="text-sm animate-pulse">
            {featured.title}
          </p>
        </div>
        <Link href={`/news/${featured.id}`} className="text-green-400 text-xs flex items-center gap-1 flex-shrink-0 hover:text-green-300">
          بیشتر <ArrowLeft size={12} />
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-10">
        {/* خبر اصلی */}
        <div className="col-span-12 lg:col-span-7">
          <Link href={`/news/${featured.id}`}>
            <div className="group cursor-pointer">
              <div className={`bg-gradient-to-br ${featured.imageBg} w-full rounded-2xl mb-4 relative overflow-hidden`} style={{ height: '420px' }}>
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <span className="text-white font-black" style={{ fontSize: '200px' }}>🎱</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                <div className="absolute bottom-0 right-0 left-0 p-6">
                  <span className="bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full inline-flex items-center gap-1 mb-3">
                    <Flame size={12} />
                    فوری
                  </span>
                  <h2 className="text-white text-2xl font-black leading-8 mb-2 group-hover:text-green-300 transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-gray-300 text-sm leading-6 line-clamp-2 mb-3">{featured.summary}</p>
                  <div className="flex items-center gap-4 text-gray-400 text-xs">
                    <span className="flex items-center gap-1"><Clock size={11} />{featured.date}</span>
                    <span className="flex items-center gap-1"><Eye size={11} />{featured.views.toLocaleString('fa-IR')} بازدید</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* اخبار کنار */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          {topNews.map(news => (
            <Link key={news.id} href={`/news/${news.id}`}>
              <div className="group flex gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition-all cursor-pointer">
                <div className={`bg-gradient-to-br ${news.imageBg} w-28 h-24 rounded-xl flex-shrink-0 relative overflow-hidden`}>
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <span className="text-white text-3xl">🎱</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block"
                    style={{ backgroundColor: news.categoryColor + '20', color: news.categoryColor }}>
                    {news.categoryLabel}
                  </span>
                  <h3 className="font-bold text-gray-900 text-sm leading-6 line-clamp-2 mb-2 group-hover:text-green-700 transition-colors">
                    {news.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={10} />{news.date}</span>
                    <span className="flex items-center gap-1"><Eye size={10} />{news.views.toLocaleString('fa-IR')}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* خط جدا */}
      <div className="border-t-2 border-gray-900 mb-8 flex items-center gap-4">
        <h2 className="bg-gray-900 text-white px-4 py-2 text-sm font-black -mt-px">همه اخبار</h2>
      </div>

      {/* فیلتر و سرچ */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
          {categories.map(cat => (
            <button key={cat.value} onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 text-sm font-medium flex-shrink-0 transition-all border-b-2 ${
                activeCategory === cat.value
                  ? 'border-gray-900 text-gray-900 font-black'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}>
              {cat.label}
            </button>
          ))}
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="جستجو در اخبار..."
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-full md:w-64" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* اخبار اصلی */}
        <div className="col-span-12 lg:col-span-8">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">خبری پیدا نشد</div>
          ) : (
            <div className="space-y-6">
              {/* ردیف اول — ۲ تا بزرگ */}
              <div className="grid grid-cols-2 gap-6">
                {filtered.slice(0, 2).map(news => (
                  <Link key={news.id} href={`/news/${news.id}`}>
                    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all cursor-pointer overflow-hidden">
                      <div className={`bg-gradient-to-br ${news.imageBg} relative overflow-hidden`} style={{ height: '180px' }}>
                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                          <span className="text-white text-5xl">🎱</span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white"
                            style={{ color: news.categoryColor }}>
                            {news.categoryLabel}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 leading-6 line-clamp-2 mb-2 group-hover:text-green-700 transition-colors">
                          {news.title}
                        </h3>
                        <p className="text-gray-500 text-sm line-clamp-2 mb-3">{news.summary}</p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Clock size={10} />{news.date}</span>
                          <span className="flex items-center gap-1"><Eye size={10} />{news.views.toLocaleString('fa-IR')}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* بقیه — لیست */}
              <div className="space-y-4">
                {filtered.slice(2).map(news => (
                  <Link key={news.id} href={`/news/${news.id}`}>
                    <div className="group flex gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition-all cursor-pointer">
                      <div className={`bg-gradient-to-br ${news.imageBg} w-32 h-24 rounded-xl flex-shrink-0 relative overflow-hidden`}>
                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                          <span className="text-white text-3xl">🎱</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: news.categoryColor + '20', color: news.categoryColor }}>
                            {news.categoryLabel}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={10} />{news.date}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 leading-6 line-clamp-2 mb-1 group-hover:text-green-700 transition-colors">
                          {news.title}
                        </h3>
                        <p className="text-gray-500 text-sm line-clamp-1">{news.summary}</p>
                      </div>
                      <div className="flex-shrink-0 text-xs text-gray-400 flex items-center gap-1">
                        <Eye size={10} />{news.views.toLocaleString('fa-IR')}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ستون کنار — پربازدیدترین‌ها */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
            <div className="bg-gray-900 px-5 py-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-green-400" />
              <span className="text-white font-black text-sm">پربازدیدترین‌ها</span>
            </div>
            <div className="divide-y divide-gray-50">
              {trending.map((news, i) => (
                <Link key={news.id} href={`/news/${news.id}`}>
                  <div className="flex gap-3 p-4 hover:bg-gray-50 transition-colors group">
                    <span className="text-3xl font-black text-gray-100 w-8 flex-shrink-0 leading-none">
                      {(i + 1).toLocaleString('fa-IR')}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-gray-800 leading-5 line-clamp-2 group-hover:text-green-700 transition-colors mb-1">
                        {news.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span style={{ color: news.categoryColor }} className="font-medium">{news.categoryLabel}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5"><Eye size={10} />{news.views.toLocaleString('fa-IR')}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
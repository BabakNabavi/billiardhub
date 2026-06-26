'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, Eye, Tag, ChevronLeft, Share2, Bookmark, ThumbsUp } from 'lucide-react';

const sampleNews = [
  {
    id: '1',
    title: 'برگزاری مسابقات قهرمانی اسنوکر ایران ۱۴۰۳ با حضور ۱۲۸ بازیکن',
    content: `مسابقات قهرمانی اسنوکر ایران ۱۴۰۳ با حضور بیش از ۱۲۸ بازیکن از سراسر کشور در سالن المپیک تهران برگزار می‌شود.

این رویداد بزرگ‌ترین مسابقه اسنوکر ایران در ۵ سال گذشته است و با حمایت فدراسیون بیلیارد و اسنوکر جمهوری اسلامی ایران برگزار خواهد شد.

بازیکنان از ۳۱ استان کشور در این مسابقات شرکت می‌کنند و رقابت‌ها در قالب دو بخش آقایان و بانوان برگزار می‌شود.

جوایز این دوره از مسابقات به مبلغ ۵۰۰ میلیون تومان تعیین شده که بین نفرات برتر توزیع خواهد شد.

مسابقات از تاریخ ۱۵ خرداد آغاز و تا ۲۲ خرداد ادامه خواهد داشت. علاقه‌مندان می‌توانند از طریق سایت بیلیارد پلاس ثبت‌نام کنند.`,
    summary: 'مسابقات قهرمانی اسنوکر ایران با حضور بیش از ۱۲۸ بازیکن از سراسر کشور در تهران برگزار می‌شود.',
    category: 'tournament',
    categoryLabel: 'مسابقات',
    categoryColor: '#e8192c',
    author: 'تیم بیلیارد پلاس',
    date: '۱۴۰۳/۰۳/۱۵',
    views: 1250,
    likes: 89,
    tags: ['مسابقات', 'اسنوکر', 'تهران', 'قهرمانی'],
    imageBg: 'from-red-900 to-red-700',
  },
  {
    id: '2',
    title: 'رنکینگ جدید بازیکنان اسنوکر دسته برتر اعلام شد',
    content: `فدراسیون بیلیارد و اسنوکر ایران رنکینگ جدید دسته برتر آقایان را برای فصل جاری اعلام کرد.

بر اساس این رنکینگ، علی محمدی با کسب ۱۲۰۰ امتیاز در صدر جدول قرار گرفته است. رضا احمدی و کاوه موسوی به ترتیب در رتبه‌های دوم و سوم قرار دارند.

این رنکینگ بر اساس نتایج مسابقات یک سال گذشته محاسبه شده و هر سه ماه یک بار به‌روزرسانی می‌شود.`,
    summary: 'فدراسیون بیلیارد و اسنوکر ایران رنکینگ جدید دسته برتر آقایان را برای فصل جاری اعلام کرد.',
    category: 'ranking',
    categoryLabel: 'رنکینگ',
    categoryColor: '#2563eb',
    author: 'تیم بیلیارد پلاس',
    date: '۱۴۰۳/۰۳/۱۰',
    views: 890,
    likes: 45,
    tags: ['رنکینگ', 'دسته برتر', 'اسنوکر'],
    imageBg: 'from-blue-900 to-blue-700',
  },
];

const relatedNews = sampleNews.slice(0, 3);

export default function NewsDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const news = sampleNews.find(n => n.id === id) || sampleNews[0];
  if (!news) return null;

  return (
    <div className="max-w-6xl mx-auto pb-10">

      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/news" className="hover:text-green-700">اخبار</Link>
        <ChevronLeft size={14} />
        <span className="text-gray-600 line-clamp-1">{news.title}</span>
      </div>

      <div className="grid grid-cols-12 gap-8">

        {/* محتوای اصلی */}
        <div className="col-span-12 lg:col-span-8">

          {/* هدر خبر */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
            {/* تصویر */}
            <div className={`bg-gradient-to-br ${news.imageBg} relative overflow-hidden`} style={{ height: '360px' }}>
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <span className="text-white font-black" style={{ fontSize: '220px' }}>🎱</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
              <div className="absolute bottom-0 right-0 left-0 p-6">
                <span className="text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block"
                  style={{ backgroundColor: news.categoryColor + '30', color: 'white', border: `1px solid ${news.categoryColor}` }}>
                  {news.categoryLabel}
                </span>
                <h1 className="text-white text-2xl font-black leading-8">{news.title}</h1>
              </div>
            </div>

            {/* اطلاعات */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs">
                      {news.author[0]}
                    </div>
                    {news.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} />
                    {news.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={13} />
                    {news.views.toLocaleString('fa-IR')} بازدید
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors">
                    <Share2 size={18} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                    <Bookmark size={18} />
                  </button>
                </div>
              </div>

              {/* خلاصه */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-6 border-r-4 border-green-500">
                <p className="text-gray-700 leading-8 font-medium">{news.summary}</p>
              </div>

              {/* محتوا */}
              <div className="prose prose-lg max-w-none">
                {news.content.split('\n\n').map((paragraph, i) => (
                  paragraph.trim() && (
                    <p key={i} className="text-gray-700 leading-9 mb-4 text-base">
                      {paragraph}
                    </p>
                  )
                ))}
              </div>

              {/* تگ‌ها */}
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-100">
                {news.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-600 text-sm px-3 py-1.5 rounded-xl flex items-center gap-1 hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors">
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </div>

              {/* لایک */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
                <button className="flex items-center gap-2 bg-green-50 text-green-700 px-5 py-2.5 rounded-xl hover:bg-green-100 transition-colors font-medium">
                  <ThumbsUp size={18} />
                  مفید بود ({news.likes.toLocaleString('fa-IR')})
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">اشتراک‌گذاری:</span>
                  <button className="w-9 h-9 rounded-xl bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors text-xs font-bold">W</button>
                  <button className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors text-xs font-bold">T</button>
                  <button className="w-9 h-9 rounded-xl bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 transition-colors text-xs font-bold">C</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ستون کنار */}
        <div className="col-span-12 lg:col-span-4">
          <div className="sticky top-24 space-y-5">

            {/* اخبار مرتبط */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-900 px-5 py-3">
                <span className="text-white font-black text-sm">اخبار مرتبط</span>
              </div>
              <div className="divide-y divide-gray-50">
                {sampleNews.map(item => (
                  <Link key={item.id} href={`/news/${item.id}`}>
                    <div className="flex gap-3 p-4 hover:bg-gray-50 transition-colors group">
                      <div className={`bg-gradient-to-br ${item.imageBg} w-16 h-16 rounded-xl flex-shrink-0 relative overflow-hidden`}>
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                          <span className="text-white text-xl">🎱</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-800 leading-5 line-clamp-2 group-hover:text-green-700 transition-colors mb-1">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span style={{ color: item.categoryColor }} className="font-medium">{item.categoryLabel}</span>
                          <span>•</span>
                          <span>{item.date}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="p-3">
                <Link href="/news" className="block text-center text-green-700 text-sm py-2 hover:underline">
                  مشاهده همه اخبار
                </Link>
              </div>
            </div>

            {/* تگ‌های محبوب */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-black text-gray-900 text-sm mb-4">تگ‌های محبوب</h3>
              <div className="flex flex-wrap gap-2">
                {['اسنوکر', 'پاکت بیلیارد', 'مسابقات', 'رنکینگ', 'باشگاه', 'میز', 'چوب', 'تیم ملی'].map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-xl hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// ==============================
// FILE: apps/web/app/news/page.tsx
// ==============================
'use client';

import { useState } from 'react';
import Link from 'next/link';

const NEWS = [
  {
    id: '1', category: 'مسابقات', tag: 'داغ', tagColor: '#ef4444',
    title: 'قهرمانی ایران در مسابقات اسنوکر آسیا ۲۰۲۴',
    excerpt: 'تیم ملی بیلیارد ایران موفق شد برای سومین سال متوالی قهرمانی آسیا را به خود اختصاص دهد. علیرضا حیدری با نتایج درخشان خود بهترین بازیکن مسابقات شناخته شد.',
    author: 'علی احمدی', date: '۱۵ خرداد ۱۴۰۴', readTime: '۵ دقیقه',
    image: '🏆', featured: true,
  },
  {
    id: '2', category: 'بازیکنان', tag: 'ویژه', tagColor: '#f59e0b',
    title: 'مصاحبه اختصاصی با محمد رضایی؛ راز موفقیتم را می‌گویم',
    excerpt: 'بازیکن شماره یک رنکینگ ملی درباره مسیر پیشرفتش، تمرینات روزانه و اهدافش برای مسابقات جهانی با بیلیارد پلاس صحبت کرد.',
    author: 'سارا مرادی', date: '۱۲ خرداد ۱۴۰۴', readTime: '۸ دقیقه',
    image: '🎱', featured: true,
  },
  {
    id: '3', category: 'تجهیزات', tag: 'جدید', tagColor: '#10b981',
    title: 'بررسی Riley Conquest ۲۰۲۴؛ بهترین چوب اسنوکر بازار',
    excerpt: 'جدیدترین محصول شرکت Riley وارد بازار ایران شد. در این مقاله تخصصی با مشخصات فنی، مزایا و نقاط ضعف این چوب آشنا می‌شوید.',
    author: 'حامد کریمی', date: '۱۰ خرداد ۱۴۰۴', readTime: '۱۰ دقیقه',
    image: '🎯', featured: false,
  },
  {
    id: '4', category: 'باشگاه‌ها', tag: '', tagColor: '',
    title: 'افتتاح بزرگترین باشگاه بیلیارد خاورمیانه در تهران',
    excerpt: 'مجموعه پلاتینیوم بیلیارد با ۲۴ میز حرفه‌ای، سیستم نورپردازی لیزری و امکانات VIP در شمال تهران افتتاح شد.',
    author: 'نگین صادقی', date: '۸ خرداد ۱۴۰۴', readTime: '۴ دقیقه',
    image: '🏛️', featured: false,
  },
  {
    id: '5', category: 'آموزش', tag: '', tagColor: '',
    title: '۱۰ تکنیک که هر بازیکن پول باید بداند',
    excerpt: 'از تکنیک spin تا کنترل cue ball — این راهنمای جامع برای بازیکنان متوسط تا پیشرفته طراحی شده تا مهارت شما را به سطح بعدی ببرد.',
    author: 'مرتضی علوی', date: '۶ خرداد ۱۴۰۴', readTime: '۱۲ دقیقه',
    image: '📚', featured: false,
  },
  {
    id: '6', category: 'رویدادها', tag: 'زنده', tagColor: '#06b6d4',
    title: 'لیگ برتر بیلیارد ایران؛ هفته دهم — گزارش کامل',
    excerpt: 'در هفته دهم لیگ برتر، تیم پرشین سوشان با شکست میهمانانش صدر جدول را محکم‌تر در دست گرفت.',
    author: 'رضا نوری', date: '۵ خرداد ۱۴۰۴', readTime: '۶ دقیقه',
    image: '⚡', featured: false,
  },
  {
    id: '7', category: 'قوانین', tag: '', tagColor: '',
    title: 'تغییرات قوانین بین‌المللی اسنوکر ۲۰۲۴ — چه چیزی عوض شد؟',
    excerpt: 'WCBS در آخرین جلسه خود تغییراتی در قوانین مسابقات اسنوکر اعمال کرد. این تغییرات از ژانویه ۲۰۲۵ اجرایی می‌شود.',
    author: 'علی رضایی', date: '۳ خرداد ۱۴۰۴', readTime: '۷ دقیقه',
    image: '📋', featured: false,
  },
  {
    id: '8', category: 'مسابقات', tag: '', tagColor: '',
    title: 'ثبت‌نام مسابقات دانشجویی بیلیارد کشور آغاز شد',
    excerpt: 'فدراسیون بیلیارد ایران ثبت‌نام ششمین دوره مسابقات دانشجویی را با ۳ رشته آغاز کرد.',
    author: 'فاطمه محمدی', date: '۱ خرداد ۱۴۰۴', readTime: '۳ دقیقه',
    image: '🎓', featured: false,
  },
];

const CATEGORIES = ['همه', 'مسابقات', 'بازیکنان', 'تجهیزات', 'باشگاه‌ها', 'آموزش', 'رویدادها', 'قوانین'];

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState('همه');
  const [search, setSearch] = useState('');

  const filtered = NEWS.filter(n => {
    const matchCat = activeCategory === 'همه' || n.category === activeCategory;
    const matchSearch = !search || n.title.includes(search) || n.excerpt.includes(search);
    return matchCat && matchSearch;
  });

  const featured = filtered.filter(n => n.featured);
  const regular = filtered.filter(n => !n.featured);

  return (
    <div className="min-h-screen" style={{ background: '#010604', color: '#f0faf5', fontFamily: 'Vazirmatn, sans-serif' }} dir="rtl">
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg,#050c08 0%,#010604 100%)', borderBottom: '1px solid rgba(16,185,129,0.2)' }}>
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(16,185,129,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.15) 0%, transparent 70%)' }} />
        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.4))' }} />
            <span className="text-xs tracking-[0.3em] uppercase" style={{ color: '#10b981' }}>BILLIARD PLUS NEWS</span>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(270deg, transparent, rgba(16,185,129,0.4))' }} />
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-center mb-3 leading-none" style={{
            background: 'linear-gradient(135deg, #f0faf5 30%, #10b981)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            اخبار بیلیارد
          </h1>
          <p className="text-center text-sm mb-8" style={{ color: '#4b5563', letterSpacing: '0.1em' }}>
            {new Date().toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="max-w-lg mx-auto relative">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="جستجو در اخبار..."
              className="w-full px-5 py-3 rounded-2xl text-sm outline-none"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#f0faf5' }}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔍</span>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-40" style={{ background: 'rgba(1,6,4,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(16,185,129,0.1)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto py-3" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={activeCategory === cat
                  ? { background: '#10b981', color: '#010604' }
                  : { background: 'rgba(16,185,129,0.08)', color: '#9ca3af', border: '1px solid rgba(16,185,129,0.15)' }
                }>{cat}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {featured.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 rounded-full" style={{ background: '#10b981' }} />
              <h2 className="text-sm font-bold tracking-widest uppercase" style={{ color: '#10b981' }}>اخبار ویژه</h2>
              <div className="h-px flex-1" style={{ background: 'rgba(16,185,129,0.15)' }} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {featured[0] && (
                <Link href={`/news/${featured[0].id}`}
                  className="lg:col-span-3 group relative overflow-hidden rounded-3xl p-8 flex flex-col justify-end min-h-[340px] cursor-pointer"
                  style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.05) 0%, rgba(16,185,129,0.15) 100%)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div className="absolute top-6 right-6 text-6xl opacity-20 group-hover:opacity-30 transition-opacity select-none">{featured[0].image}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981' }}>{featured[0].category}</span>
                      {featured[0].tag && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${featured[0].tagColor}22`, color: featured[0].tagColor, border: `1px solid ${featured[0].tagColor}44` }}>{featured[0].tag}</span>}
                    </div>
                    <h3 className="text-2xl font-black mb-2 leading-snug group-hover:text-emerald-400 transition-colors">{featured[0].title}</h3>
                    <p className="text-sm line-clamp-2 mb-4" style={{ color: '#9ca3af' }}>{featured[0].excerpt}</p>
                    <div className="flex items-center gap-3 text-xs" style={{ color: '#6b7280' }}>
                      <span>{featured[0].author}</span><span>·</span><span>{featured[0].date}</span><span>·</span><span>{featured[0].readTime} مطالعه</span>
                    </div>
                  </div>
                </Link>
              )}
              <div className="lg:col-span-2 flex flex-col gap-4">
                {featured.slice(1).map(n => (
                  <Link href={`/news/${n.id}`} key={n.id}
                    className="group relative overflow-hidden rounded-2xl p-6 flex-1 cursor-pointer"
                    style={{ background: 'rgba(5,12,8,0.8)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <div className="absolute top-4 left-4 text-4xl opacity-15 group-hover:opacity-25 transition-opacity select-none">{n.image}</div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>{n.category}</span>
                      {n.tag && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${n.tagColor}22`, color: n.tagColor }}>{n.tag}</span>}
                    </div>
                    <h3 className="font-bold mb-1 group-hover:text-emerald-400 transition-colors leading-snug">{n.title}</h3>
                    <p className="text-xs line-clamp-2 mb-3" style={{ color: '#6b7280' }}>{n.excerpt}</p>
                    <div className="text-xs" style={{ color: '#4b5563' }}>{n.author} · {n.date}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {featured.length > 0 && regular.length > 0 && (
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1" style={{ background: 'rgba(16,185,129,0.15)' }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: '#4b5563' }}>آخرین اخبار</span>
            <div className="h-px flex-1" style={{ background: 'rgba(16,185,129,0.15)' }} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {regular.map(n => (
            <Link href={`/news/${n.id}`} key={n.id}
              className="group rounded-2xl overflow-hidden cursor-pointer flex flex-col"
              style={{ background: '#050c08', border: '1px solid rgba(16,185,129,0.1)' }}>
              <div className="flex items-center justify-center h-28 text-5xl"
                style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.05),rgba(6,182,212,0.05))', borderBottom: '1px solid rgba(16,185,129,0.08)' }}>
                {n.image}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>{n.category}</span>
                  {n.tag && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${n.tagColor}22`, color: n.tagColor }}>{n.tag}</span>}
                </div>
                <h3 className="font-bold mb-2 leading-snug group-hover:text-emerald-400 transition-colors flex-1">{n.title}</h3>
                <p className="text-xs line-clamp-2 mb-4" style={{ color: '#6b7280' }}>{n.excerpt}</p>
                <div className="flex items-center justify-between text-xs" style={{ color: '#4b5563' }}>
                  <span>{n.author}</span>
                  <div className="flex items-center gap-2"><span>{n.readTime}</span><span style={{ color: '#10b981' }}>←</span></div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20" style={{ color: '#4b5563' }}>
            <div className="text-5xl mb-4">📰</div>
            <p>خبری یافت نشد</p>
          </div>
        )}
      </div>
    </div>
  );
}

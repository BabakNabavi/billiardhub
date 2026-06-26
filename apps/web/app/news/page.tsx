// ==============================
// FILE: apps/web/app/news/page.tsx
// ==============================
'use client';

import { useState } from 'react';
import Link from 'next/link';

const GOLD = '#C7A66A';
const GOLD_DARK = '#A07840';

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
    id: '3', category: 'تجهیزات', tag: 'جدید', tagColor: GOLD,
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
    id: '6', category: 'رویدادها', tag: 'زنده', tagColor: '#3b82f6',
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
    <div style={{ minHeight: '100vh', background: '#F7F7F5', color: '#111111', fontFamily: 'Estedad, Vazirmatn, sans-serif' }} dir="rtl">

      {/* ── Dark Hero ── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg,#111111 0%,#1C1C1A 100%)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(199,166,106,0.14) 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', padding: '64px 24px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, transparent, rgba(199,166,106,0.40))` }} />
            <span style={{ fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: GOLD }}>BILLIARDHUB NEWS</span>
            <div style={{ height: 1, flex: 1, background: `linear-gradient(270deg, transparent, rgba(199,166,106,0.40))` }} />
          </div>
          <h1 style={{
            fontSize: 'clamp(44px, 8.8vw, 79px)', fontWeight: 900, textAlign: 'center',
            margin: '0 0 12px', lineHeight: 1, letterSpacing: '-0.04em',
            background: `linear-gradient(135deg, #FFFFFF 30%, ${GOLD})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            اخبار بیلیارد
          </h1>
          <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.40)', marginBottom: 32 }}>
            {new Date().toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          {/* Search */}
          <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="جستجو در اخبار..."
              style={{
                width: '100%', padding: '13px 20px', borderRadius: 14,
                background: 'rgba(0,0,0,0.05)', border: `1px solid ${search ? 'rgba(199,166,106,0.4)' : 'rgba(0,0,0,0.08)'}`,
                color: '#FFFFFF', fontSize: 15, fontFamily: 'inherit', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, opacity: 0.5 }}>🔍</span>
          </div>
        </div>
      </div>

      {/* ── Sticky Category Bar ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(247,247,245,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', padding: '12px 0', scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  flexShrink: 0, padding: '6px 16px', borderRadius: 99,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.18s',
                  border: activeCategory === cat ? `1px solid rgba(199,166,106,0.40)` : '1px solid rgba(0,0,0,0.09)',
                  background: activeCategory === cat ? 'rgba(199,166,106,0.12)' : '#FFFFFF',
                  color: activeCategory === cat ? GOLD_DARK : 'rgba(0,0,0,0.55)',
                }}
              >{cat}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Featured */}
        {featured.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 3, height: 20, borderRadius: 99, background: GOLD }} />
              <h2 style={{ fontSize: 13, fontWeight: 700, color: GOLD_DARK, margin: 0 }}>اخبار ویژه</h2>
              <div style={{ height: 1, flex: 1, background: 'rgba(0,0,0,0.07)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
              {featured[0] && (
                <Link href={`/news/${featured[0].id}`}
                  style={{
                    gridColumn: featured.length > 1 ? 'span 2' : 'span 1',
                    textDecoration: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                    minHeight: 320, borderRadius: 20, padding: 32, overflow: 'hidden', position: 'relative',
                    background: '#111111',
                    border: `1px solid rgba(199,166,106,0.20)`,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                    transition: 'all 0.28s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(0,0,0,0.18)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.12)'; }}
                >
                  <div style={{ position: 'absolute', top: 24, right: 24, fontSize: 62, opacity: 0.15 }}>{featured[0].image}</div>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(ellipse at 30% 0%, rgba(199,166,106,0.10) 0%, transparent 60%)`, pointerEvents: 'none' }} />
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: 'rgba(199,166,106,0.18)', color: GOLD, fontWeight: 700 }}>{featured[0].category}</span>
                      {featured[0].tag && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: `${featured[0].tagColor}22`, color: featured[0].tagColor, border: `1px solid ${featured[0].tagColor}44`, fontWeight: 700 }}>{featured[0].tag}</span>}
                    </div>
                    <h3 style={{ fontSize: 'clamp(20px, 2.8vw, 29px)', fontWeight: 900, color: '#FFFFFF', margin: '0 0 10px', lineHeight: 1.3, letterSpacing: '-0.02em' }}>{featured[0].title}</h3>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.50)', margin: '0 0 16px', lineHeight: 1.65 }}>{featured[0].excerpt}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                      <span>{featured[0].author}</span><span>·</span><span>{featured[0].date}</span><span>·</span><span>{featured[0].readTime} مطالعه</span>
                    </div>
                  </div>
                </Link>
              )}
              {featured.slice(1).map(n => (
                <Link href={`/news/${n.id}`} key={n.id}
                  style={{
                    textDecoration: 'none', display: 'flex', flexDirection: 'column',
                    borderRadius: 16, padding: 24, overflow: 'hidden', position: 'relative',
                    background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    transition: 'all 0.28s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 36px rgba(0,0,0,0.10)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(199,166,106,0.28)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.07)'; }}
                >
                  <div style={{ position: 'absolute', top: 16, left: 16, fontSize: 40, opacity: 0.10 }}>{n.image}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: 'rgba(199,166,106,0.10)', color: GOLD_DARK, fontWeight: 700 }}>{n.category}</span>
                    {n.tag && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: `${n.tagColor}18`, color: n.tagColor, fontWeight: 700 }}>{n.tag}</span>}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111111', margin: '0 0 8px', lineHeight: 1.4, letterSpacing: '-0.01em' }}>{n.title}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.48)', margin: '0 0 12px', lineHeight: 1.65 }}>{n.excerpt}</p>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)', marginTop: 'auto' }}>{n.author} · {n.date}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        {featured.length > 0 && regular.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
            <div style={{ height: 1, flex: 1, background: 'rgba(0,0,0,0.07)' }} />
            <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', fontWeight: 700 }}>آخرین اخبار</span>
            <div style={{ height: 1, flex: 1, background: 'rgba(0,0,0,0.07)' }} />
          </div>
        )}

        {/* Regular Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
          {regular.map(n => (
            <Link href={`/news/${n.id}`} key={n.id}
              style={{
                textDecoration: 'none', display: 'flex', flexDirection: 'column',
                borderRadius: 16, overflow: 'hidden',
                background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'all 0.28s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.10)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(199,166,106,0.24)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.07)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 110, fontSize: 53, background: 'linear-gradient(135deg,rgba(199,166,106,0.06),rgba(199,166,106,0.03))', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                {n.image}
              </div>
              <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: 'rgba(199,166,106,0.10)', color: GOLD_DARK, fontWeight: 700 }}>{n.category}</span>
                  {n.tag && <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: `${n.tagColor}18`, color: n.tagColor, fontWeight: 700 }}>{n.tag}</span>}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111111', margin: '0 0 8px', lineHeight: 1.4, flex: 1, letterSpacing: '-0.01em' }}>{n.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.48)', margin: '0 0 16px', lineHeight: 1.65 }}>{n.excerpt}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'rgba(0,0,0,0.35)' }}>
                  <span>{n.author}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{n.readTime}</span>
                    <span style={{ color: GOLD }}>←</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'rgba(0,0,0,0.40)' }}>
            <div style={{ fontSize: 53, marginBottom: 16, opacity: 0.3 }}>📰</div>
            <p style={{ fontSize: 18 }}>خبری یافت نشد</p>
          </div>
        )}
      </div>
    </div>
  );
}

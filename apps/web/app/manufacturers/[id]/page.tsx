// ==============================
// FILE: apps/web/app/education/page.tsx
// ==============================
'use client';

import { useState } from 'react';
import Link from 'next/link';

const COURSES = [
  {
    id: '1', title: 'مبانی اسنوکر از صفر تا حرفه‌ای',
    instructor: 'استاد محمد رضایی', level: 'مبتدی', discipline: 'اسنوکر',
    duration: '۲۴ ساعت', lessons: 32, students: 1240,
    rating: 4.9, price: '۳۵۰,۰۰۰ تومان', isFree: false,
    tags: ['پایه', 'اسنوکر', 'فریم‌بندی'],
    description: 'یادگیری کامل اسنوکر از ایستادن صحیح تا کنترل توپ سفید. مناسب برای افراد بدون تجربه.',
    icon: '🎱', color: '#10b981',
  },
  {
    id: '2', title: 'تکنیک‌های پیشرفته پول آمریکایی',
    instructor: 'استاد علیرضا حیدری', level: 'پیشرفته', discipline: 'پول آمریکایی',
    duration: '۱۸ ساعت', lessons: 24, students: 876,
    rating: 4.8, price: '۴۸۰,۰۰۰ تومان', isFree: false,
    tags: ['اسپین', 'پوزیشن', 'سیستم'],
    description: 'کنترل cue ball، system play، و تکنیک‌های حرفه‌ای برای بازیکنان متوسط به بالا.',
    icon: '🎯', color: '#06b6d4',
  },
  {
    id: '3', title: 'آشنایی با قوانین بین‌المللی بیلیارد',
    instructor: 'داور علی رضایی', level: 'همه سطوح', discipline: 'عمومی',
    duration: '۶ ساعت', lessons: 10, students: 2100,
    rating: 4.7, price: 'رایگان', isFree: true,
    tags: ['قوانین', 'WCBS', 'داوری'],
    description: 'قوانین رسمی WCBS برای اسنوکر، پول و کارامبول. ضروری برای شرکت در مسابقات رسمی.',
    icon: '📋', color: '#f59e0b',
  },
  {
    id: '4', title: 'کارامبول — ورودی به دنیای سه‌گانه',
    instructor: 'استاد داریوش فرهانی', level: 'مبتدی تا متوسط', discipline: 'کارامبول',
    duration: '۱۵ ساعت', lessons: 20, students: 412,
    rating: 4.9, price: '۳۸۰,۰۰۰ تومان', isFree: false,
    tags: ['کارامبول', 'سیستم‌ها', 'انگل‌بازی'],
    description: 'معرفی کامل بازی کارامبول و تفاوت آن با سایر رشته‌ها، همراه با تمرین‌های عملی.',
    icon: '⭕', color: '#a78bfa',
  },
  {
    id: '5', title: 'روانشناسی مسابقه — ذهنیت قهرمانی',
    instructor: 'دکتر سارا مرادی', level: 'همه سطوح', discipline: 'عمومی',
    duration: '۸ ساعت', lessons: 12, students: 654,
    rating: 4.6, price: '۲۸۰,۰۰۰ تومان', isFree: false,
    tags: ['ذهنیت', 'روانشناسی', 'فشار مسابقه'],
    description: 'مدیریت اضطراب، تمرکز در لحظه، و ساختن روتین ذهنی برای موفقیت در مسابقات.',
    icon: '🧠', color: '#10b981',
  },
  {
    id: '6', title: 'نگهداری و سرویس میز بیلیارد',
    instructor: 'کاوه رستمی — متخصص نصب', level: 'عمومی', discipline: 'تجهیزات',
    duration: '۴ ساعت', lessons: 8, students: 320,
    rating: 4.5, price: 'رایگان', isFree: true,
    tags: ['کوئیش', 'سرویس', 'نگهداری'],
    description: 'چگونه میز بیلیارد را به درستی نگهداری کنید، گچ مناسب انتخاب کنید و کوئیش را تمیز کنید.',
    icon: '🔧', color: '#06b6d4',
  },
];

const DISCIPLINES = ['همه', 'اسنوکر', 'پول آمریکایی', 'کارامبول', 'عمومی', 'تجهیزات'];

const levelColors: Record<string, string> = {
  'مبتدی': '#10b981', 'متوسط': '#f59e0b', 'پیشرفته': '#ef4444',
  'همه سطوح': '#a78bfa', 'مبتدی تا متوسط': '#06b6d4', 'عمومی': '#6b7280',
};

export default function EducationPage() {
  const [disc, setDisc] = useState('همه');
  const [freeOnly, setFreeOnly] = useState(false);

  const filtered = COURSES.filter(c => {
    const matchD = disc === 'همه' || c.discipline === disc;
    const matchF = !freeOnly || c.isFree;
    return matchD && matchF;
  });

  return (
    <div className="min-h-screen" style={{ background: '#010604', color: '#f0faf5', fontFamily: 'Vazirmatn, sans-serif' }} dir="rtl">
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg,#050c08 0%,#010604 100%)' }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at 30% 0%, rgba(6,182,212,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(167,139,250,0.08) 0%, transparent 50%)',
        }} />
        <div className="relative max-w-6xl mx-auto px-4 pt-14 pb-10 text-center">
          <div className="flex items-center gap-3 mb-4 justify-center">
            <div className="h-px w-16" style={{ background: 'rgba(6,182,212,0.4)' }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: '#06b6d4' }}>BILLIARD PLUS ACADEMY</span>
            <div className="h-px w-16" style={{ background: 'rgba(6,182,212,0.4)' }} />
          </div>
          <h1 className="text-5xl sm:text-6xl font-black mb-3 leading-none" style={{
            background: 'linear-gradient(135deg,#f0faf5 30%,#06b6d4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            آکادمی آموزش
          </h1>
          <p className="mb-8" style={{ color: '#4b5563' }}>از مبتدی تا حرفه‌ای — با بهترین مربیان ایران</p>
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            {[
              { label: 'دوره', value: COURSES.length, color: '#06b6d4' },
              { label: 'دانشجو', value: '۶.۲k', color: '#a78bfa' },
              { label: 'دوره رایگان', value: COURSES.filter(c => c.isFree).length, color: '#10b981' },
            ].map(s => (
              <div key={s.label} className="text-center rounded-2xl p-4" style={{ background: 'rgba(5,12,8,0.8)', border: `1px solid ${s.color}22` }}>
                <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs" style={{ color: '#6b7280' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-40" style={{ background: 'rgba(1,6,4,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(6,182,212,0.1)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-2 items-center">
          {DISCIPLINES.map(d => (
            <button key={d} onClick={() => setDisc(d)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium"
              style={disc === d ? { background: '#06b6d4', color: '#010604' } : { background: 'rgba(6,182,212,0.08)', color: '#9ca3af', border: '1px solid rgba(6,182,212,0.15)' }}>
              {d}
            </button>
          ))}
          <button onClick={() => setFreeOnly(!freeOnly)}
            className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium mr-auto"
            style={freeOnly ? { background: '#10b981', color: '#010604' } : { background: 'rgba(16,185,129,0.08)', color: '#9ca3af', border: '1px solid rgba(16,185,129,0.15)' }}>
            فقط رایگان
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(course => (
            <Link href={`/education/${course.id}`} key={course.id}
              className="group rounded-3xl overflow-hidden flex flex-col cursor-pointer"
              style={{ background: '#050c08', border: '1px solid rgba(16,185,129,0.1)' }}>
              <div className="h-1" style={{ background: `linear-gradient(90deg,${course.color},transparent)` }} />
              <div className="flex items-center justify-center h-28 text-5xl"
                style={{ background: `linear-gradient(135deg,${course.color}08,${course.color}15)`, borderBottom: '1px solid rgba(16,185,129,0.08)' }}>
                {course.icon}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${levelColors[course.level] ?? '#6b7280'}22`, color: levelColors[course.level] ?? '#6b7280' }}>
                    {course.level}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>{course.discipline}</span>
                  {course.isFree && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>رایگان</span>}
                </div>
                <h3 className="font-black mb-1 leading-snug group-hover:text-cyan-400 transition-colors">{course.title}</h3>
                <p className="text-xs mb-3 line-clamp-2" style={{ color: '#6b7280' }}>{course.description}</p>
                <div className="flex items-center gap-1 mb-3 text-xs" style={{ color: '#9ca3af' }}>
                  <span>👤</span><span>{course.instructor}</span>
                </div>
                <div className="flex items-center justify-between text-xs mb-4" style={{ color: '#6b7280' }}>
                  <span>⏱️ {course.duration} · {course.lessons} جلسه</span>
                  <span>👥 {course.students.toLocaleString('fa')} دانشجو</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {course.tags.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(6,182,212,0.08)', color: '#06b6d4' }}>#{t}</span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs">
                    <span style={{ color: '#f59e0b' }}>⭐</span>
                    <span className="font-bold">{course.rating}</span>
                  </div>
                  <div className="text-sm font-black" style={{ color: course.isFree ? '#10b981' : '#f59e0b' }}>{course.price}</div>
                </div>
                <button className="w-full mt-3 py-2.5 rounded-xl font-bold text-sm"
                  style={course.isFree
                    ? { background: 'linear-gradient(135deg,#10b981,#06b6d4)', color: '#010604' }
                    : { background: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.2)' }
                  }>
                  {course.isFree ? 'شروع رایگان' : 'مشاهده دوره'}
                </button>
              </div>
            </Link>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-20" style={{ color: '#4b5563' }}>
            <div className="text-5xl mb-4">📚</div><p>دوره‌ای یافت نشد</p>
          </div>
        )}
      </div>
    </div>
  );
}

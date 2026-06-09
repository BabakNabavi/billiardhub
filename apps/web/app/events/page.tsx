// ==============================
// FILE: apps/web/app/events/page.tsx
// ==============================
'use client';

import { useState } from 'react';
import Link from 'next/link';

const EVENTS = [
  {
    id: '1', title: 'لیگ برتر بیلیارد ایران — فصل ۱۴۰۴',
    category: 'لیگ', discipline: 'اسنوکر', status: 'در جریان',
    statusColor: '#10b981', startDate: '۱ فروردین ۱۴۰۴', endDate: '۳۰ خرداد ۱۴۰۴',
    location: 'باشگاه‌های سراسر کشور', prize: '۵۰۰,۰۰۰,۰۰۰ تومان',
    participants: 24, maxParticipants: 24,
    level: 'حرفه‌ای', organizer: 'فدراسیون بیلیارد ایران',
    description: 'معتبرترین رقابت بیلیارد داخلی کشور با حضور ۲۴ تیم برتر.',
    highlights: ['پخش زنده تمام بازی‌ها', 'داور بین‌المللی', 'جوایز نقدی'],
    icon: '🏆',
  },
  {
    id: '2', title: 'قهرمانی ملی اسنوکر ۱۴۰۴',
    category: 'ملی', discipline: 'اسنوکر', status: 'ثبت‌نام باز',
    statusColor: '#f59e0b', startDate: '۱۵ تیر ۱۴۰۴', endDate: '۲۵ تیر ۱۴۰۴',
    location: 'تهران — سالن وزارت ورزش', prize: '۲۵۰,۰۰۰,۰۰۰ تومان',
    participants: 18, maxParticipants: 32,
    level: 'نیمه‌حرفه‌ای و حرفه‌ای', organizer: 'فدراسیون بیلیارد ایران',
    description: 'مسابقه تعیین قهرمان ملی اسنوکر با شرکت بهترین بازیکنان کشور.',
    highlights: ['معیار انتخاب تیم ملی', 'مستقیم به رنکینگ ملی', 'پخش آنلاین'],
    icon: '🥇',
  },
  {
    id: '3', title: 'جام رمضان — پول آمریکایی',
    category: 'آزاد', discipline: 'پول آمریکایی', status: 'پایان یافته',
    statusColor: '#6b7280', startDate: '۱ اردیبهشت ۱۴۰۴', endDate: '۵ اردیبهشت ۱۴۰۴',
    location: 'باشگاه پرشین — تهران', prize: '۸۰,۰۰۰,۰۰۰ تومان',
    participants: 64, maxParticipants: 64,
    level: 'همه سطوح', organizer: 'باشگاه پرشین بیلیارد',
    description: 'تورنمنت سالانه جام رمضان با استقبال گسترده بازیکنان.',
    highlights: ['۶۴ شرکت‌کننده', 'فرمت حذفی دوگانه', 'بازی مستمر ۵ روزه'],
    icon: '🌙',
  },
  {
    id: '4', title: 'مسابقات دانشجویی سراسری',
    category: 'دانشجویی', discipline: 'اسنوکر / پول', status: 'ثبت‌نام باز',
    statusColor: '#f59e0b', startDate: '۲۰ شهریور ۱۴۰۴', endDate: '۲۵ شهریور ۱۴۰۴',
    location: 'مشهد — پردیس دانشگاه فردوسی', prize: '۴۵,۰۰۰,۰۰۰ تومان',
    participants: 12, maxParticipants: 48,
    level: 'دانشجویی', organizer: 'اتحادیه ورزش دانشگاه‌ها',
    description: 'رویداد سالانه ویژه دانشجویان دانشگاه‌های سراسر کشور.',
    highlights: ['ویژه دانشجویان', '۳ رشته مختلف', 'اسکان رایگان'],
    icon: '🎓',
  },
  {
    id: '5', title: 'قهرمانی بانوان ایران',
    category: 'بانوان', discipline: 'اسنوکر', status: 'ثبت‌نام باز',
    statusColor: '#f59e0b', startDate: '۱ مرداد ۱۴۰۴', endDate: '۷ مرداد ۱۴۰۴',
    location: 'اصفهان — سالن ورزشی پارس', prize: '۶۰,۰۰۰,۰۰۰ تومان',
    participants: 8, maxParticipants: 16,
    level: 'حرفه‌ای', organizer: 'کمیته بانوان فدراسیون',
    description: 'مهم‌ترین مسابقه اسنوکر بانوان در ایران با داوری بین‌المللی.',
    highlights: ['داور بین‌المللی', 'انتخاب تیم ملی بانوان', 'تله‌کست زنده'],
    icon: '🌸',
  },
  {
    id: '6', title: 'اوپن تهران — کارامبول',
    category: 'بین‌المللی', discipline: 'کارامبول', status: 'زود هنگام',
    statusColor: '#a78bfa', startDate: '۱۵ آبان ۱۴۰۴', endDate: '۲۰ آبان ۱۴۰۴',
    location: 'تهران — هتل اسپیناس پالاس', prize: '€ ۱۵,۰۰۰',
    participants: 0, maxParticipants: 16,
    level: 'بین‌المللی', organizer: 'فدراسیون جهانی کارامبول UMB',
    description: 'نخستین رویداد بین‌المللی کارامبول در ایران با حضور بازیکنان اروپایی.',
    highlights: ['بازیکنان اروپایی و آسیایی', 'رنکینگ جهانی UMB', 'فرمت Round Robin'],
    icon: '🌍',
  },
];

const DISCIPLINES = ['همه', 'اسنوکر', 'پول آمریکایی', 'کارامبول', 'اسنوکر / پول'];
const STATUSES = ['همه', 'در جریان', 'ثبت‌نام باز', 'پایان یافته', 'زود هنگام'];

const statusStyle: Record<string, { bg: string; text: string }> = {
  'در جریان': { bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
  'ثبت‌نام باز': { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  'پایان یافته': { bg: 'rgba(107,114,128,0.15)', text: '#6b7280' },
  'زود هنگام': { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa' },
};

export default function EventsPage() {
  const [discipline, setDiscipline] = useState('همه');
  const [statusFilter, setStatusFilter] = useState('همه');

  const filtered = EVENTS.filter(e => {
    const matchD = discipline === 'همه' || e.discipline === discipline;
    const matchS = statusFilter === 'همه' || e.status === statusFilter;
    return matchD && matchS;
  });

  const live = EVENTS.filter(e => e.status === 'در جریان');

  return (
    <div className="min-h-screen" style={{ background: '#010604', color: '#f0faf5', fontFamily: 'Vazirmatn, sans-serif' }} dir="rtl">
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg,#050c08 0%,#010604 100%)' }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at 20% 0%, rgba(245,158,11,0.1) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(16,185,129,0.08) 0%, transparent 50%)',
        }} />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 80px, rgba(16,185,129,0.4) 80px, rgba(16,185,129,0.4) 81px)',
        }} />
        <div className="relative max-w-6xl mx-auto px-4 pt-14 pb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.4))' }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: '#f59e0b' }}>BILLIARD PLUS TOURNAMENTS</span>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(270deg, transparent, rgba(245,158,11,0.4))' }} />
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-center mb-2 leading-none" style={{
            background: 'linear-gradient(135deg,#f0faf5 30%,#f59e0b)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            مسابقات بیلیارد
          </h1>
          <p className="text-center mb-10" style={{ color: '#4b5563' }}>تورنمنت‌ها، لیگ‌ها و رویدادهای رسمی کشور</p>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            {[
              { label: 'در جریان', value: live.length, color: '#10b981' },
              { label: 'ثبت‌نام باز', value: EVENTS.filter(e => e.status === 'ثبت‌نام باز').length, color: '#f59e0b' },
              { label: 'رویداد کل', value: EVENTS.length, color: '#a78bfa' },
            ].map(s => (
              <div key={s.label} className="text-center rounded-2xl p-4" style={{ background: 'rgba(5,12,8,0.8)', border: `1px solid ${s.color}22` }}>
                <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs" style={{ color: '#6b7280' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-40" style={{ background: 'rgba(1,6,4,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(16,185,129,0.1)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <span className="text-xs flex-shrink-0" style={{ color: '#4b5563' }}>رشته:</span>
            {DISCIPLINES.map(d => (
              <button key={d} onClick={() => setDiscipline(d)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={discipline === d ? { background: '#f59e0b', color: '#010604' } : { background: 'rgba(245,158,11,0.08)', color: '#9ca3af', border: '1px solid rgba(245,158,11,0.15)' }}>
                {d}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <span className="text-xs flex-shrink-0" style={{ color: '#4b5563' }}>وضعیت:</span>
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={statusFilter === s ? { background: '#10b981', color: '#010604' } : { background: 'rgba(16,185,129,0.08)', color: '#9ca3af', border: '1px solid rgba(16,185,129,0.15)' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {live.length > 0 && statusFilter === 'همه' && discipline === 'همه' && (
        <div className="max-w-6xl mx-auto px-4 mt-8">
          <div className="rounded-2xl p-1 mb-2" style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>
            <div className="rounded-xl px-5 py-4 flex items-center gap-4" style={{ background: '#050c08' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10b981' }} />
                <span className="text-sm font-bold" style={{ color: '#10b981' }}>LIVE</span>
              </div>
              <span className="text-sm" style={{ color: '#9ca3af' }}>{live[0]?.title} — هم‌اکنون در حال برگزاری</span>
              <Link href={`/events/${live[0]?.id}`} className="mr-auto text-xs px-3 py-1 rounded-full font-bold"
                style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981' }}>
                مشاهده زنده ←
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: '#4b5563' }}>
            <div className="text-5xl mb-4">🏆</div><p>رویدادی یافت نشد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(event => {
              const fillPct = Math.round((event.participants / event.maxParticipants) * 100);
              const st = statusStyle[event.status] ?? { bg: 'rgba(107,114,128,0.15)', text: '#6b7280' };
              return (
                <Link href={`/events/${event.id}`} key={event.id}
                  className="group rounded-3xl overflow-hidden flex flex-col cursor-pointer"
                  style={{ background: '#050c08', border: '1px solid rgba(16,185,129,0.12)' }}>
                  <div className="h-1 w-full" style={{ background: event.status === 'در جریان' ? 'linear-gradient(90deg,#10b981,#06b6d4)' : event.status === 'ثبت‌نام باز' ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'rgba(107,114,128,0.3)' }} />
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-4xl">{event.icon}</div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: st.bg, color: st.text }}>{event.status}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>{event.discipline}</span>
                      </div>
                    </div>
                    <h3 className="font-black text-lg mb-1 leading-snug group-hover:text-emerald-400 transition-colors">{event.title}</h3>
                    <p className="text-xs mb-4 line-clamp-2" style={{ color: '#6b7280' }}>{event.description}</p>
                    <div className="space-y-1.5 text-xs mb-4" style={{ color: '#9ca3af' }}>
                      <div className="flex items-center gap-2"><span>📅</span><span>{event.startDate} تا {event.endDate}</span></div>
                      <div className="flex items-center gap-2"><span>📍</span><span>{event.location}</span></div>
                      <div className="flex items-center gap-2"><span>💰</span><span className="font-bold" style={{ color: '#f59e0b' }}>{event.prize}</span></div>
                    </div>
                    {event.status !== 'پایان یافته' && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-1" style={{ color: '#6b7280' }}>
                          <span>شرکت‌کنندگان</span><span>{event.participants} / {event.maxParticipants}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(16,185,129,0.1)' }}>
                          <div className="h-full rounded-full" style={{ width: `${fillPct}%`, background: fillPct >= 90 ? '#ef4444' : fillPct >= 60 ? '#f59e0b' : '#10b981' }} />
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {event.highlights.map((h, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(6,182,212,0.08)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.15)' }}>{h}</span>
                      ))}
                    </div>
                    <div className="mt-auto">
                      {event.status === 'ثبت‌نام باز' && <button className="w-full py-2.5 rounded-xl font-bold text-sm" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: '#010604' }}>ثبت‌نام در مسابقه</button>}
                      {event.status === 'در جریان' && <button className="w-full py-2.5 rounded-xl font-bold text-sm" style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)', color: '#010604' }}>مشاهده نتایج زنده</button>}
                      {event.status === 'پایان یافته' && <button className="w-full py-2.5 rounded-xl font-bold text-sm" style={{ background: 'rgba(107,114,128,0.15)', color: '#6b7280', border: '1px solid rgba(107,114,128,0.2)' }}>مشاهده نتایج نهایی</button>}
                      {event.status === 'زود هنگام' && <button className="w-full py-2.5 rounded-xl font-bold text-sm" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>یادآوری برایم بگذار</button>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

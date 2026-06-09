// ==============================
// FILE: apps/web/app/installers/[id]/page.tsx
// ==============================
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const INSTALLERS: Record<string, {
  id: string; name: string; city: string; experience: number; phone: string;
  email: string; description: string; services: { name: string; price: string; duration: string }[];
  projects: { title: string; location: string; year: number; type: string }[];
  stats: { projects: number; rating: number; reviews: number; cities: number };
  specialties: string[]; avatar: string; available: boolean;
}> = {
  '1': {
    id: '1', name: 'کاوه رستمی', city: 'تهران', experience: 10,
    phone: '09121111111', email: 'kaveh@billiardinstall.ir',
    description: 'متخصص نصب و راه‌اندازی میزهای بیلیارد حرفه‌ای با ۱۰ سال تجربه در تهران و البرز. نصب بیش از ۲۰۰ میز اسنوکر و پول در باشگاه‌های معتبر.',
    services: [
      { name: 'نصب میز اسنوکر ۱۲ فوت', price: '۳,۵۰۰,۰۰۰ تومان', duration: '۱ روز' },
      { name: 'نصب میز پول آمریکایی', price: '۲,۰۰۰,۰۰۰ تومان', duration: '۵-۶ ساعت' },
      { name: 'تنظیم و لول کردن میز', price: '۸۰۰,۰۰۰ تومان', duration: '۲ ساعت' },
      { name: 'تعویض کوئیش', price: '۱,۲۰۰,۰۰۰ تومان', duration: '۳ ساعت' },
    ],
    projects: [
      { title: 'باشگاه پرشین بیلیارد', location: 'تهران، سعادت‌آباد', year: 2023, type: '۸ میز اسنوکر' },
      { title: 'هتل اسپیناس پالاس', location: 'تهران، شریعتی', year: 2022, type: '۳ میز VIP' },
      { title: 'باشگاه کارمندان دولت', location: 'تهران، جماران', year: 2022, type: '۵ میز پول' },
    ],
    stats: { projects: 214, rating: 4.9, reviews: 89, cities: 5 },
    specialties: ['اسنوکر', 'پول آمریکایی', 'کارامبول', 'نصب نورپردازی'],
    avatar: 'کر', available: true,
  },
  '2': {
    id: '2', name: 'سیاوش حسینی', city: 'اصفهان', experience: 7,
    phone: '09131111111', email: 'siavash@install.ir',
    description: 'نصب حرفه‌ای میز بیلیارد در اصفهان و استان‌های مرکزی. متخصص تعمیر و بازسازی میزهای قدیمی.',
    services: [
      { name: 'نصب میز اسنوکر', price: '۲,۸۰۰,۰۰۰ تومان', duration: '۱ روز' },
      { name: 'بازسازی و تعمیر میز', price: 'از ۱,۵۰۰,۰۰۰ تومان', duration: 'متغیر' },
      { name: 'تعویض لنز (کوئیش)', price: '۹۵۰,۰۰۰ تومان', duration: '۳ ساعت' },
    ],
    projects: [
      { title: 'باشگاه نقش جهان', location: 'اصفهان، خیابان آمادگاه', year: 2023, type: '۶ میز' },
      { title: 'مجموعه ورزشی آریا', location: 'کاشان', year: 2022, type: '۴ میز پول' },
    ],
    stats: { projects: 97, rating: 4.7, reviews: 43, cities: 4 },
    specialties: ['اسنوکر', 'پول', 'تعمیر و بازسازی'],
    avatar: 'سح', available: true,
  },
  '3': {
    id: '3', name: 'امیر تاجیک', city: 'مشهد', experience: 5,
    phone: '09151111111', email: 'amir.tajik@install.ir',
    description: 'نصب و راه‌اندازی میز بیلیارد در خراسان رضوی. جوان‌ترین متخصص نصب مجاز فدراسیون در منطقه.',
    services: [
      { name: 'نصب میز اسنوکر ۱۲ فوت', price: '۳,۰۰۰,۰۰۰ تومان', duration: '۱ روز' },
      { name: 'نصب میز پول', price: '۱,۸۰۰,۰۰۰ تومان', duration: '۵ ساعت' },
    ],
    projects: [
      { title: 'باشگاه مشهد بیلیارد', location: 'مشهد، احمدآباد', year: 2023, type: '۴ میز اسنوکر' },
    ],
    stats: { projects: 52, rating: 4.8, reviews: 28, cities: 2 },
    specialties: ['اسنوکر', 'پول آمریکایی'],
    avatar: 'ات', available: false,
  },
};

export default function InstallerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const installer = INSTALLERS[id];

  if (!installer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#010604', color: '#f0faf5' }}>
        <div className="text-6xl mb-4">🔧</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#10b981' }}>متخصص مورد نظر یافت نشد</h2>
        <p className="mb-6" style={{ color: '#6b7280' }}>شناسه متخصص معتبر نیست</p>
        <button onClick={() => router.push('/installers')}
          className="px-6 py-3 rounded-xl font-bold"
          style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)', color: '#010604' }}>
          بازگشت به متخصصین نصب
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#010604', color: '#f0faf5', fontFamily: 'Vazirmatn, sans-serif' }} dir="rtl">
      <div className="relative" style={{ background: 'linear-gradient(135deg,#050c08,#0a1a0f 50%,#050c08)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #10b981 0%, transparent 50%), radial-gradient(circle at 80% 30%, #a78bfa 0%, transparent 50%)' }} />
        <div className="relative max-w-4xl mx-auto px-4 py-12">
          <Link href="/installers" className="inline-flex items-center gap-2 mb-8 text-sm hover:opacity-80" style={{ color: '#10b981' }}>
            ← بازگشت به متخصصین نصب
          </Link>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#a78bfa,#06b6d4)', color: '#010604' }}>
              {installer.avatar}
            </div>
            <div className="flex-1 text-center sm:text-right">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
                  متخصص نصب تایید شده
                </span>
                {installer.available
                  ? <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>در دسترس</span>
                  : <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>مشغول</span>
                }
              </div>
              <h1 className="text-3xl font-black mb-1">{installer.name}</h1>
              <p style={{ color: '#6b7280' }}>{installer.city} · {installer.experience} سال تجربه</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'پروژه انجام شده', value: installer.stats.projects, color: '#10b981' },
            { label: 'شهرهای فعالیت', value: installer.stats.cities, color: '#06b6d4' },
            { label: 'نظرات', value: installer.stats.reviews, color: '#a78bfa' },
            { label: 'امتیاز', value: `${installer.stats.rating} ⭐`, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: '#050c08', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div className="text-2xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color: '#6b7280' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl p-6" style={{ background: '#050c08', border: '1px solid rgba(16,185,129,0.15)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#10b981' }}>خدمات و تعرفه</h2>
            <div className="space-y-3">
              {installer.services.map((s, i) => (
                <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm">{s.name}</div>
                    <div className="text-sm font-bold" style={{ color: '#f59e0b' }}>{s.price}</div>
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#6b7280' }}>مدت زمان: {s.duration}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-6" style={{ background: '#050c08', border: '1px solid rgba(16,185,129,0.15)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#10b981' }}>پروژه‌های اخیر</h2>
            <div className="space-y-3">
              {installer.projects.map((p, i) => (
                <div key={i} className="flex items-start justify-between p-3 rounded-xl" style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.1)' }}>
                  <div>
                    <div className="font-semibold text-sm">{p.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{p.location}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#a78bfa' }}>{p.type}</div>
                  </div>
                  <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>{p.year}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl p-6" style={{ background: '#050c08', border: '1px solid rgba(16,185,129,0.15)' }}>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#10b981' }}>تخصص‌ها</h2>
            <div className="flex flex-wrap gap-2">
              {installer.specialties.map(s => (
                <span key={s} className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)' }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-6" style={{ background: '#050c08', border: '1px solid rgba(16,185,129,0.15)' }}>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#10b981' }}>درباره</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#9ca3af' }}>{installer.description}</p>
          </div>
          <div className="rounded-2xl p-6" style={{ background: '#050c08', border: '1px solid rgba(16,185,129,0.15)' }}>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#10b981' }}>تماس</h2>
            <div className="space-y-2 text-sm" style={{ color: '#9ca3af' }}>
              <div>📞 {installer.phone}</div>
              <div>✉️ {installer.email}</div>
              <div>📍 {installer.city}</div>
            </div>
            {installer.available && (
              <button className="w-full mt-4 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: 'linear-gradient(135deg,#a78bfa,#06b6d4)', color: '#010604' }}>
                درخواست نصب
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
